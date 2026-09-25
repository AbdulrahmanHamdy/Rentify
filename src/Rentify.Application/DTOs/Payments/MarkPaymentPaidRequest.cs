namespace Rentify.Application.DTOs.Payments;

public record MarkPaymentPaidRequest
{
    public required string Method { get; init; }
    public string? ReferenceNumber { get; init; }
}
