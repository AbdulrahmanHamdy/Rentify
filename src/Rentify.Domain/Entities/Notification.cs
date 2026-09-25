using Rentify.Domain.Common;
using Rentify.Domain.Enums;

namespace Rentify.Domain.Entities;

/// <summary>
/// A persisted notification for a user (Owner, Tenant, or Admin). Rows are created by
/// Application-layer event handlers and delivered in real time over SignalR by
/// Infrastructure; this entity is just the durable record so a user can see their
/// notification history even if they weren't connected when it was raised.
/// </summary>
public class Notification : AuditableEntity
{
    /// <summary>Recipient's Identity user Id.</summary>
    public required string UserId { get; set; }

    public NotificationType Type { get; set; }

    public required string Title { get; set; }

    public required string Message { get; set; }

    public bool IsRead { get; set; }

    public DateTime? ReadAt { get; set; }

    /// <summary>Optional loose link back to the entity that triggered this notification (e.g. "RentalContract"), avoiding a hard FK to every possible source entity.</summary>
    public string? RelatedEntityType { get; set; }

    public int? RelatedEntityId { get; set; }

    public void MarkAsRead(DateTime readAtUtc)
    {
        if (IsRead)
        {
            return;
        }

        IsRead = true;
        ReadAt = readAtUtc;
    }
}
