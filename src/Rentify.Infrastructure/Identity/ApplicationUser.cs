using Microsoft.AspNetCore.Identity;

namespace Rentify.Infrastructure.Identity;

/// <summary>
/// Rentify's concrete Identity user. Lives in Infrastructure (not Domain) because
/// IdentityUser is a framework type and Domain must stay free of infrastructure
/// dependencies — see the note on OwnerProfile/TenantProfile. UserName and Email are
/// always kept equal to the registered email; there is no separate "username" concept.
/// </summary>
public class ApplicationUser : IdentityUser
{
    public string? FirstName { get; set; }

    public string? LastName { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
