namespace Rentify.Application.DTOs.Auth;

/// <summary>Returned by both login and refresh — a refresh always issues a brand-new pair of tokens (rotation).</summary>
public record AuthResponse(
    string UserId,
    string Email,
    IReadOnlyList<string> Roles,
    string AccessToken,
    DateTime AccessTokenExpiresAtUtc,
    string RefreshToken,
    DateTime RefreshTokenExpiresAtUtc);
