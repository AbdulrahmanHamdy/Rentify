using Rentify.Domain.Entities;
using Rentify.Domain.Enums;

namespace Rentify.Application.Interfaces;

public interface IPaymentProcessor
{
    Task<(bool Success, DateTime ProcessedAtUtc)> ProcessManualPaymentAsync(Payment payment, PaymentMethod method, string? referenceNumber, CancellationToken cancellationToken);
}
