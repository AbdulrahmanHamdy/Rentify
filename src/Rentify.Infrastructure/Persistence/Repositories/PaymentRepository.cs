using Microsoft.EntityFrameworkCore;
using Rentify.Application.Common.Pagination;
using Rentify.Application.Interfaces;
using Rentify.Domain.Entities;
using Rentify.Domain.Enums;
using System.Linq.Expressions;

namespace Rentify.Infrastructure.Persistence.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly RentifyDbContext _dbContext;

    public PaymentRepository(RentifyDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResult<Payment>> GetPagedAsync(PaginationRequest request, int? tenantId, int? ownerId, PaymentStatus? status, CancellationToken cancellationToken)
    {
        var query = _dbContext.Payments
            .Include(p => p.RentalContract)
                .ThenInclude(c => c!.Unit)
                    .ThenInclude(u => u!.Property)
            .AsNoTracking()
            .AsQueryable();

        if (tenantId.HasValue)
        {
            query = query.Where(p => p.TenantProfileId == tenantId.Value);
        }

        if (ownerId.HasValue)
        {
            query = query.Where(p => p.RentalContract!.Unit!.Property!.OwnerProfileId == ownerId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(p => p.Status == status.Value);
        }

        Expression<Func<Payment, object>> keySelector = request.SortBy?.ToLower() switch
        {
            "duedate" => p => p.DueDate,
            "amount" => p => p.Amount,
            "status" => p => p.Status,
            "createdat" => p => p.CreatedAt,
            _ => p => p.Id
        };

        query = request.IsDescending 
            ? query.OrderByDescending(keySelector).ThenByDescending(p => p.Id)
            : query.OrderBy(keySelector).ThenBy(p => p.Id);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Payment>(items, totalCount, request.Page, request.PageSize);
    }

    public async Task<Payment?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _dbContext.Payments
            .Include(p => p.RentalContract)
                .ThenInclude(c => c!.Unit)
                    .ThenInclude(u => u!.Property)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<Payment>> GetPendingPaymentsForContractAsync(int contractId, CancellationToken cancellationToken)
    {
        return await _dbContext.Payments
            .Where(p => p.RentalContractId == contractId && p.Status == PaymentStatus.Pending)
            .ToListAsync(cancellationToken);
    }

    public async Task AddRangeAsync(IEnumerable<Payment> payments, CancellationToken cancellationToken)
    {
        await _dbContext.Payments.AddRangeAsync(payments, cancellationToken);
    }

    public Task UpdateAsync(Payment payment, CancellationToken cancellationToken)
    {
        _dbContext.Payments.Update(payment);
        return Task.CompletedTask;
    }

    public Task UpdateRangeAsync(IEnumerable<Payment> payments, CancellationToken cancellationToken)
    {
        _dbContext.Payments.UpdateRange(payments);
        return Task.CompletedTask;
    }
}
