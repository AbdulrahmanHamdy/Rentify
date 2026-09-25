namespace Rentify.Infrastructure.Identity;

/// <summary>
/// Strongly-typed binding of the "Jwt" configuration section. SigningKey is deliberately
/// never given a default value here — DependencyInjection.AddInfrastructureServices fails
/// fast at startup if it is missing or too short, rather than silently signing tokens with
/// an empty/weak key.
/// </summary>
public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = default!;

    public string Audience { get; set; } = default!;

    public string SigningKey { get; set; } = default!;

    public int AccessTokenExpirationMinutes { get; set; } = 15;

    public int RefreshTokenExpirationDays { get; set; } = 7;
}
