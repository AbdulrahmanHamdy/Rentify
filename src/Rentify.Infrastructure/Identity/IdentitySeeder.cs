using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Rentify.Domain.Constants;

namespace Rentify.Infrastructure.Identity;

/// <summary>
/// Ensures the three fixed roles (Admin/Owner/Tenant) exist in AspNetRoles. Called once
/// from Program.cs on startup, in a scoped service provider. Deliberately does NOT seed a
/// default Admin user — creating one would mean hardcoding or environment-guessing a
/// password, which the spec explicitly forbids. Promoting the first real user to Admin is
/// a manual/ops step (e.g. directly in the database, or a future admin-only endpoint) —
/// see Known Issues in the phase summary.
/// </summary>
public static class IdentitySeeder
{
    public static async Task SeedRolesAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        foreach (var roleName in Roles.All)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole(roleName));
            }
        }
    }
}
