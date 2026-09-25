namespace Rentify.Application.Interfaces;

/// <summary>
/// Abstraction over signing JWT access tokens. Takes plain primitives (not ApplicationUser)
/// so this interface — and anything in Application that depends on it — never needs a
/// reference to Rentify.Infrastructure or ASP.NET Core Identity.
/// </summary>
public interface IJwtTokenGenerator
{
    (string AccessToken, DateTime ExpiresAtUtc) GenerateAccessToken(
        string userId, string email, IReadOnlyCollection<string> roles);
}
