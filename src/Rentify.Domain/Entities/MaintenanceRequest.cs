using Rentify.Domain.Common;
using Rentify.Domain.Enums;

namespace Rentify.Domain.Entities;

public class MaintenanceRequest : AuditableEntity
{
    public int UnitId { get; set; }

    public Unit? Unit { get; set; }

    public int TenantProfileId { get; set; }

    public TenantProfile? Tenant { get; set; }

    public required string Title { get; set; }

    public required string Description { get; set; }

    public MaintenancePriority Priority { get; set; } = MaintenancePriority.Medium;

    public MaintenanceStatus Status { get; private set; } = MaintenanceStatus.Open;

    public ICollection<MaintenanceUpdate> Updates { get; set; } = new List<MaintenanceUpdate>();

    /// <summary>
    /// Changes status and records the transition as a MaintenanceUpdate history entry.
    /// Owners move requests Open → InProgress → Resolved, or Cancelled at any point before
    /// Resolved. No formal state machine is enforced here (unlike RentalContract) because
    /// the spec doesn't define one for maintenance — owners may legitimately move a request
    /// back to InProgress after marking it Resolved if the issue recurs.
    /// </summary>
    public MaintenanceUpdate ChangeStatus(MaintenanceStatus newStatus, string updatedByUserId, string? note)
    {
        var update = new MaintenanceUpdate
        {
            MaintenanceRequestId = Id,
            MaintenanceRequest = this,
            OldStatus = Status,
            NewStatus = newStatus,
            UpdatedByUserId = updatedByUserId,
            Note = note
        };

        Status = newStatus;
        Updates.Add(update);
        return update;
    }
}
