namespace Rentify.Domain.Constants;


public static class Roles
{
    public const string Admin = "Admin";
    public const string Owner = "Owner";
    public const string Tenant = "Tenant";

    public static readonly IReadOnlyList<string> All = new[] { Admin, Owner, Tenant };
}
