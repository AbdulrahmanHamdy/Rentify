namespace Rentify.Domain.Constants;

/// <summary>
/// Canonical role names used with ASP.NET Core Identity role-based authorization.
/// Defined in the Domain layer (rather than Infrastructure, where Identity itself lives)
/// so that Application-layer authorization checks and policies can reference role names
/// without taking a dependency on Identity.
/// </summary>
public static class Roles
{
    public const string Admin = "Admin";
    public const string Owner = "Owner";
    public const string Tenant = "Tenant";

    public static readonly IReadOnlyList<string> All = new[] { Admin, Owner, Tenant };
}
