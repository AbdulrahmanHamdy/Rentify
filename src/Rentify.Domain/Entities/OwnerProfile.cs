using Rentify.Domain.Common;

namespace Rentify.Domain.Entities;

/// <summary>
/// Owner-specific profile data for a user in the "Owner" role. Deliberately does not
/// reference ApplicationUser directly — ApplicationUser : IdentityUser lives in
/// Rentify.Infrastructure.Identity (an infrastructure/framework concern), and the Domain
/// layer must not depend on Infrastructure. Instead this holds the Identity user's string
/// Id as a plain foreign key; the actual FK relationship/constraint is configured in the
/// EF Core entity configuration classes in Infrastructure.
/// </summary>
public class OwnerProfile : AuditableEntity
{
    /// <summary>Foreign key to AspNetUsers.Id (ASP.NET Core Identity).</summary>
    public required string UserId { get; set; }

    public string? CompanyName { get; set; }

    public string? PhoneNumber { get; set; }

    public ICollection<Property> Properties { get; set; } = new List<Property>();
}
