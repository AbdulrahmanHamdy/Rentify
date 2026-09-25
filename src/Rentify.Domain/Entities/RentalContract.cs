using Rentify.Domain.Common;
using Rentify.Domain.Enums;

namespace Rentify.Domain.Entities;

/// <summary>
/// A tenant's contract to rent a Unit. Owns its own status transitions so that "Pending →
/// Active → Terminated/Expired, Pending → Cancelled" is enforced in one place instead of
/// being re-implemented (and potentially re-broken) in every controller/service that
/// changes a contract's status.
///
/// Allowed transitions:
///   Pending  → Active
///   Pending  → Cancelled
///   Active   → Terminated
///   Active   → Expired
/// Any other transition throws <see cref="DomainException"/>.
/// </summary>
public class RentalContract : AuditableEntity
{
    public int UnitId { get; set; }

    public Unit? Unit { get; set; }

    public int TenantProfileId { get; set; }

    public TenantProfile? Tenant { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public decimal MonthlyRent { get; set; }

    public decimal SecurityDeposit { get; set; }

    public ContractStatus Status { get; private set; } = ContractStatus.Pending;

    public ICollection<Payment> Payments { get; set; } = new List<Payment>();

    /// <summary>Pending → Active. Fails if the contract isn't currently Pending.</summary>
    public void Activate()
    {
        EnsureCurrentStatusIs(ContractStatus.Pending, ContractStatus.Active);
        Status = ContractStatus.Active;
    }

    /// <summary>Pending → Cancelled. Fails if the contract isn't currently Pending.</summary>
    public void Cancel()
    {
        EnsureCurrentStatusIs(ContractStatus.Pending, ContractStatus.Cancelled);
        Status = ContractStatus.Cancelled;
    }

    /// <summary>Active → Terminated. Fails if the contract isn't currently Active.</summary>
    public void Terminate()
    {
        EnsureCurrentStatusIs(ContractStatus.Active, ContractStatus.Terminated);
        Status = ContractStatus.Terminated;
    }

    /// <summary>Active → Expired. Fails if the contract isn't currently Active. Intended to be called by the "detect expiring contracts" background job.</summary>
    public void Expire()
    {
        EnsureCurrentStatusIs(ContractStatus.Active, ContractStatus.Expired);
        Status = ContractStatus.Expired;
    }

    private void EnsureCurrentStatusIs(ContractStatus required, ContractStatus target)
    {
        if (Status != required)
        {
            throw new DomainException(
                $"Cannot transition contract {Id} from '{Status}' to '{target}'. " +
                $"Contract must currently be '{required}'.");
        }
    }
}
