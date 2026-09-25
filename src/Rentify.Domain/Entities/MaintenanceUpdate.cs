using Rentify.Domain.Common;
using Rentify.Domain.Enums;

namespace Rentify.Domain.Entities;

/// <summary>
/// A history record of a status change on a MaintenanceRequest. Created via
/// <see cref="MaintenanceRequest.ChangeStatus"/> rather than directly, so the request's
/// current Status and its history can never drift apart.
/// </summary>
public class MaintenanceUpdate : AuditableEntity
{
    public int MaintenanceRequestId { get; set; }

    public MaintenanceRequest? MaintenanceRequest { get; set; }

    public MaintenanceStatus? OldStatus { get; set; }

    public MaintenanceStatus NewStatus { get; set; }

    /// <summary>Id of the user (owner, or admin) who made the change.</summary>
    public required string UpdatedByUserId { get; set; }

    public string? Note { get; set; }
}
