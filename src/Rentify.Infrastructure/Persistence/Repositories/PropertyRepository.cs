using Microsoft.EntityFrameworkCore;
using Rentify.Application.Common.Pagination;
using Rentify.Application.Interfaces;
using Rentify.Domain.Entities;
using Rentify.Domain.Enums;
using Rentify.Infrastructure.Persistence;

namespace Rentify.Infrastructure.Persistence.Repositories;

public class PropertyRepository : IPropertyRepository
{
    private readonly RentifyDbContext _dbContext;

    public PropertyRepository(RentifyDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResult<Property>> GetPagedAsync(PaginationRequest request, int? ownerProfileId, CancellationToken cancellationToken)
    {
        var query = _dbContext.Properties
            .AsNoTracking()
            .Include(p => p.Owner)
            .Include(p => p.Units)
            .AsQueryable();

        if (ownerProfileId is not null)
        {
            query = query.Where(p => p.OwnerProfileId == ownerProfileId);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(p =>
                EF.Functions.Like(p.Name, $"%{term}%") ||
                EF.Functions.Like(p.Address, $"%{term}%") ||
                (p.City != null && EF.Functions.Like(p.City, $"%{term}%")));
        }

        query = ApplySort(query, request);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Property>(items, totalCount, request.Page, request.PageSize);
    }

    public async Task<Property?> GetByIdAsync(int id, CancellationToken cancellationToken, bool includeUnits = false)
    {
        var query = _dbContext.Properties
            .Include(p => p.Owner)
            .AsQueryable();

        if (includeUnits)
        {
            query = query.Include(p => p.Units);
        }

        return await query.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<bool> HasNonTerminalContractsAsync(int propertyId, CancellationToken cancellationToken)
    {
        return await _dbContext.RentalContracts.AnyAsync(
            c => c.Unit!.PropertyId == propertyId
                && (c.Status == ContractStatus.Pending || c.Status == ContractStatus.Active),
            cancellationToken);
    }

    public async Task<Property> AddAsync(Property property, CancellationToken cancellationToken)
    {
        _dbContext.Properties.Add(property);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Re-load with Owner included so the caller (PropertyService) can map OwnerProfileId
        // consistently the same way every other read path does, without a special case.
        return await _dbContext.Properties
            .Include(p => p.Owner)
            .FirstAsync(p => p.Id == property.Id, cancellationToken);
    }

    public async Task UpdateAsync(Property property, CancellationToken cancellationToken)
    {
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Property property, CancellationToken cancellationToken)
    {
        _dbContext.Properties.Remove(property);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private static IQueryable<Property> ApplySort(IQueryable<Property> query, PaginationRequest request)
    {
        return (request.SortBy?.ToLowerInvariant()) switch
        {
            "name" => request.IsDescending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
            "city" => request.IsDescending ? query.OrderByDescending(p => p.City) : query.OrderBy(p => p.City),
            "createdat" => request.IsDescending ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
            _ => query.OrderByDescending(p => p.CreatedAt),
        };
    }
}
