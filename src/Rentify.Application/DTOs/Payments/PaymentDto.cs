namespace Rentify.Application.DTOs.Payments;

public record PaymentDto
{
    public int Id { get; init; }
    public int RentalContractId { get; init; }
    public int TenantProfileId { get; init; }
    public decimal Amount { get; init; }
    public DateOnly DueDate { get; init; }
    public DateTime? PaidAt { get; init; }
    public required string Status { get; init; }
    public string? Method { get; init; }
    public string? ReferenceNumber { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}
