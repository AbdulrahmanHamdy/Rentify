using Rentify.Application.Common.Pagination;
using Rentify.Domain.Entities;
using Rentify.Domain.Enums;

namespace Rentify.Application.Interfaces;

public interface IPaymentRepository
{
    Task<PagedResult<Payment>> GetPagedAsync(PaginationRequest request, int? tenantId, int? ownerId, PaymentStatus? status, CancellationToken cancellationToken);
    Task<Payment?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<Payment>> GetPendingPaymentsForContractAsync(int contractId, CancellationToken cancellationToken);
    Task AddRangeAsync(IEnumerable<Payment> payments, CancellationToken cancellationToken);
    Task UpdateAsync(Payment payment, CancellationToken cancellationToken);
    Task UpdateRangeAsync(IEnumerable<Payment> payments, CancellationToken cancellationToken);
}
