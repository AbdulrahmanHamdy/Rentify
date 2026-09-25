using Rentify.Domain.Common;

namespace Rentify.Domain.Entities;

/// <summary>
/// Tenant-specific profile data for a user in the "Tenant" role. See the note on
/// <see cref="OwnerProfile"/> for why this references the Identity user by string Id
/// rather than a navigation property to ApplicationUser.
/// </summary>
public class TenantProfile : AuditableEntity
{
    /// <summary>Foreign key to AspNetUsers.Id (ASP.NET Core Identity).</summary>
    public required string UserId { get; set; }

    public string? PhoneNumber { get; set; }

    public string? NationalId { get; set; }

    public ICollection<RentalContract> RentalContracts { get; set; } = new List<RentalContract>();

    public ICollection<MaintenanceRequest> MaintenanceRequests { get; set; } = new List<MaintenanceRequest>();
}
