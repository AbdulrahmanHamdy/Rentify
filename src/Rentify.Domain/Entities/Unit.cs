using Rentify.Domain.Common;
using Rentify.Domain.Enums;

namespace Rentify.Domain.Entities;

/// <summary>
/// A single rentable unit within a Property (e.g. "Apartment 101"). Availability is
/// tracked via <see cref="Status"/>; the rule that a unit cannot be rented while it
/// already has an active contract is enforced where the contract is created/activated
/// (Application layer), since that's where both the Unit and the competing
/// RentalContract are visible together — not here in isolation.
/// </summary>
public class Unit : AuditableEntity
{
    public int PropertyId { get; set; }

    public Property? Property { get; set; }

    public required string UnitNumber { get; set; }

    public int? Floor { get; set; }

    public double AreaSqm { get; set; }

    public int Bedrooms { get; set; }

    public int Bathrooms { get; set; }

    public decimal MonthlyRent { get; set; }

    public decimal DepositAmount { get; set; }

    public UnitStatus Status { get; set; } = UnitStatus.Available;

    public ICollection<RentalContract> RentalContracts { get; set; } = new List<RentalContract>();

    public ICollection<MaintenanceRequest> MaintenanceRequests { get; set; } = new List<MaintenanceRequest>();
}
