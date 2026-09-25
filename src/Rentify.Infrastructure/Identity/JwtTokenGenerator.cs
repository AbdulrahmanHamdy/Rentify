using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Rentify.Application.Interfaces;

namespace Rentify.Infrastructure.Identity;

/// <summary>
/// Signs short-lived JWT access tokens with HMAC-SHA256 using Jwt:SigningKey. Refresh
/// tokens are NOT JWTs — they are opaque random strings persisted as RefreshToken rows
/// (see AuthService), so revocation and rotation can be enforced server-side, which isn't
/// possible with a stateless JWT.
/// </summary>
public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly JwtOptions _options;

    public JwtTokenGenerator(JwtOptions options)
    {
        _options = options;
    }

    public (string AccessToken, DateTime ExpiresAtUtc) GenerateAccessToken(
        string userId, string email, IReadOnlyCollection<string> roles)
    {
        var expiresAtUtc = DateTime.UtcNow.AddMinutes(_options.AccessTokenExpirationMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId),
            new(ClaimTypes.NameIdentifier, userId),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: expiresAtUtc,
            signingCredentials: credentials);

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);
        return (accessToken, expiresAtUtc);
    }
}
