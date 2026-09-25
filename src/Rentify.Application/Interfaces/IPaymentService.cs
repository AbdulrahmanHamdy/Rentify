using Rentify.Application.Common.Pagination;
using Rentify.Application.DTOs.Payments;
using Rentify.Domain.Enums;

namespace Rentify.Application.Interfaces;

public interface IPaymentService
{
    Task<PagedResult<PaymentDto>> GetPagedAsync(PaginationRequest request, PaymentStatus? status, CancellationToken cancellationToken);
    Task<PaymentDto> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<PaymentDto> MarkAsPaidAsync(int id, MarkPaymentPaidRequest request, CancellationToken cancellationToken);
}
