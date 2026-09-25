using Rentify.Domain.Common;
using Rentify.Domain.Enums;

namespace Rentify.Domain.Entities;

/// <summary>
/// A single rent payment (installment) tied to a RentalContract. Kept a plain data
/// holder with a couple of guarded status-changing methods; the actual "detect overdue
/// payments" sweep is a scheduled background job (Infrastructure/Hangfire), not something
/// this entity does to itself, since it needs to compare against "now" across many rows.
/// </summary>
public class Payment : AuditableEntity
{
    public int RentalContractId { get; set; }

    public RentalContract? RentalContract { get; set; }

    public int TenantProfileId { get; set; }

    public TenantProfile? Tenant { get; set; }

    public decimal Amount { get; set; }

    public DateOnly DueDate { get; set; }

    public DateTime? PaidAt { get; set; }

    public PaymentStatus Status { get; private set; } = PaymentStatus.Pending;

    public PaymentMethod? Method { get; set; }

    public string? ReferenceNumber { get; set; }

    /// <summary>Marks the payment as Paid. Fails if it's already Paid or Cancelled.</summary>
    public void MarkAsPaid(PaymentMethod method, string? referenceNumber, DateTime paidAtUtc)
    {
        if (Status is PaymentStatus.Paid or PaymentStatus.Cancelled)
        {
            throw new DomainException($"Cannot mark payment {Id} as paid from status '{Status}'.");
        }

        Status = PaymentStatus.Paid;
        Method = method;
        ReferenceNumber = referenceNumber;
        PaidAt = paidAtUtc;
    }

    /// <summary>Marks the payment as Late. Intended to be called by the overdue-payments background job. No-op guard: only applies to still-Pending payments.</summary>
    public void MarkAsLate()
    {
        if (Status != PaymentStatus.Pending)
        {
            throw new DomainException($"Cannot mark payment {Id} as late from status '{Status}'.");
        }

        Status = PaymentStatus.Late;
    }

    /// <summary>Cancels the payment (e.g. contract terminated before the payment was due).</summary>
    public void Cancel()
    {
        if (Status == PaymentStatus.Paid)
        {
            throw new DomainException($"Cannot cancel payment {Id}: it has already been paid.");
        }

        Status = PaymentStatus.Cancelled;
    }
}
