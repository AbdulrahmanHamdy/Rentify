using Microsoft.EntityFrameworkCore;
using Rentify.Application.Common.Pagination;
using Rentify.Application.Interfaces;
using Rentify.Domain.Entities;
using Rentify.Domain.Enums;
using Rentify.Infrastructure.Persistence;

namespace Rentify.Infrastructure.Persistence.Repositories;

public class UnitRepository : IUnitRepository
{
    private readonly RentifyDbContext _dbContext;

    public UnitRepository(RentifyDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResult<Unit>> GetPagedByPropertyAsync(int propertyId, PaginationRequest request, CancellationToken cancellationToken)
    {
        var query = _dbContext.Units
            .AsNoTracking()
            .Where(u => u.PropertyId == propertyId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(u => EF.Functions.Like(u.UnitNumber, $"%{term}%"));
        }

        query = ApplySort(query, request);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Unit>(items, totalCount, request.Page, request.PageSize);
    }

    public async Task<Unit?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _dbContext.Units
            .Include(u => u.Property)
                .ThenInclude(p => p!.Owner)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task<bool> UnitNumberExistsAsync(int propertyId, string unitNumber, int? excludeUnitId, CancellationToken cancellationToken)
    {
        return await _dbContext.Units.AnyAsync(
            u => u.PropertyId == propertyId
                && u.UnitNumber == unitNumber
                && (excludeUnitId == null || u.Id != excludeUnitId),
            cancellationToken);
    }

    public async Task<bool> HasNonTerminalContractAsync(int unitId, CancellationToken cancellationToken)
    {
        return await _dbContext.RentalContracts.AnyAsync(
            c => c.UnitId == unitId && (c.Status == ContractStatus.Pending || c.Status == ContractStatus.Active),
            cancellationToken);
    }

    public async Task<Unit> AddAsync(Unit unit, CancellationToken cancellationToken)
    {
        _dbContext.Units.Add(unit);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return unit;
    }

    public async Task UpdateAsync(Unit unit, CancellationToken cancellationToken)
    {
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Unit unit, CancellationToken cancellationToken)
    {
        _dbContext.Units.Remove(unit);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private static IQueryable<Unit> ApplySort(IQueryable<Unit> query, PaginationRequest request)
    {
        return (request.SortBy?.ToLowerInvariant()) switch
        {
            "monthlyrent" => request.IsDescending ? query.OrderByDescending(u => u.MonthlyRent) : query.OrderBy(u => u.MonthlyRent),
            "createdat" => request.IsDescending ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt),
            _ => request.IsDescending ? query.OrderByDescending(u => u.UnitNumber) : query.OrderBy(u => u.UnitNumber),
        };
    }
}
