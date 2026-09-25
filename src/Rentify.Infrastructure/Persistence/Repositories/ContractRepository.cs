using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Rentify.Application.Common.Exceptions;
using Rentify.Application.Common.Pagination;
using Rentify.Application.Interfaces;
using Rentify.Domain.Entities;
using Rentify.Domain.Enums;

namespace Rentify.Infrastructure.Persistence.Repositories;

public class ContractRepository : IContractRepository
{
    // SQL Server error numbers for unique index / unique constraint violations.
    private const int UniqueIndexViolation = 2601;
    private const int UniqueConstraintViolation = 2627;

    private readonly RentifyDbContext _dbContext;

    public ContractRepository(RentifyDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResult<RentalContract>> GetPagedAsync(
        PaginationRequest request, ContractStatus? status, string? partyUserId, CancellationToken cancellationToken)
    {
        var query = _dbContext.RentalContracts
            .AsNoTracking()
            .Include(c => c.Unit)
                .ThenInclude(u => u!.Property)
            .AsQueryable();

        if (partyUserId is not null)
        {
            query = query.Where(c =>
                c.Tenant!.UserId == partyUserId ||
                c.Unit!.Property!.Owner!.UserId == partyUserId);
        }

        if (status is not null)
        {
            query = query.Where(c => c.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(c =>
                EF.Functions.Like(c.Unit!.UnitNumber, $"%{term}%") ||
                EF.Functions.Like(c.Unit!.Property!.Name, $"%{term}%"));
        }

        var ordered = ApplySort(query, request).ThenBy(c => c.Id); // Id tiebreaker keeps paging stable

        var totalCount = await ordered.CountAsync(cancellationToken);

        var items = await ordered
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<RentalContract>(items, totalCount, request.Page, request.PageSize);
    }

    public async Task<RentalContract?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _dbContext.RentalContracts
            .Include(c => c.Tenant)
            .Include(c => c.Unit)
                .ThenInclude(u => u!.Property)
                    .ThenInclude(p => p!.Owner)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<RentalContract> AddAsync(RentalContract contract, CancellationToken cancellationToken)
    {
        _dbContext.RentalContracts.Add(contract);
        await SaveChangesAsync(cancellationToken);
        return contract;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: UniqueIndexViolation or UniqueConstraintViolation })
        {
            // Two requests raced past the service's availability check; the filtered unique
            // index on RentalContracts(UnitId) rejected the loser.
            throw new AppConflictException("This unit already has a pending or active rental contract.");
        }
    }

    private static IOrderedQueryable<RentalContract> ApplySort(IQueryable<RentalContract> query, PaginationRequest request)
    {
        return (request.SortBy?.ToLowerInvariant()) switch
        {
            "startdate" => request.IsDescending ? query.OrderByDescending(c => c.StartDate) : query.OrderBy(c => c.StartDate),
            "enddate" => request.IsDescending ? query.OrderByDescending(c => c.EndDate) : query.OrderBy(c => c.EndDate),
            "monthlyrent" => request.IsDescending ? query.OrderByDescending(c => c.MonthlyRent) : query.OrderBy(c => c.MonthlyRent),
            "createdat" => request.IsDescending ? query.OrderByDescending(c => c.CreatedAt) : query.OrderBy(c => c.CreatedAt),
            _ => query.OrderByDescending(c => c.CreatedAt),
        };
    }
}
