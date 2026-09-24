namespace Rentify.Domain.Common;

/// <summary>
/// Adds audit tracking (who/when created and last modified) plus soft-delete support
/// on top of <see cref="BaseEntity"/>. Most Rentify entities (Property, Unit,
/// RentalContract, Payment, MaintenanceRequest, ...) should derive from this rather than
/// from <see cref="BaseEntity"/> directly, since knowing when a record changed and by whom
/// matters for a rental/finance domain.
///
/// Population of these fields is an infrastructure concern (e.g. a SaveChanges interceptor
/// in Rentify.Infrastructure) — domain entities only declare the shape.
/// </summary>
public abstract class AuditableEntity : BaseEntity
{
    public DateTime CreatedAt { get; set; }

    public string? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    /// <summary>
    /// Soft-delete flag. Rentify prefers soft deletes for domain records that participate
    /// in financial or contractual history (Properties, Units, Contracts, Payments) so
    /// that history is never destroyed. A global EF Core query filter will be applied in
    /// the Infrastructure layer once persistence is introduced.
    /// </summary>
    public bool IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public string? DeletedBy { get; set; }
}
