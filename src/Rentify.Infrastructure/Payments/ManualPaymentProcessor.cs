using Rentify.Application.Interfaces;
using Rentify.Domain.Entities;
using Rentify.Domain.Enums;

namespace Rentify.Infrastructure.Payments;

public class ManualPaymentProcessor : IPaymentProcessor
{
    public Task<(bool Success, DateTime ProcessedAtUtc)> ProcessManualPaymentAsync(Payment payment, PaymentMethod method, string? referenceNumber, CancellationToken cancellationToken)
    {
        // For manual payments (like Cash or a manual Bank Transfer), we assume it's instantly successful
        // as the user is just recording something that already happened out-of-band.
        return Task.FromResult((true, DateTime.UtcNow));
    }
}
