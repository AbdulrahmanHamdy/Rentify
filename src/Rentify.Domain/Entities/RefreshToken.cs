using Rentify.Domain.Common;

namespace Rentify.Domain.Entities;

/// <summary>
/// A refresh token issued to a user, supporting rotation and revocation. Deliberately a
/// plain <see cref="BaseEntity"/> (not AuditableEntity) — soft-delete doesn't make sense
/// here; expired/revoked tokens are hard-deleted by the "clean expired refresh tokens"
/// background job instead of accumulating as soft-deleted rows.
/// </summary>
public class RefreshToken : BaseEntity
{
    /// <summary>Owning Identity user Id.</summary>
    public required string UserId { get; set; }

    public required string Token { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    public string? CreatedByIp { get; set; }

    public DateTime? RevokedAt { get; set; }

    public string? RevokedByIp { get; set; }

    /// <summary>If this token was rotated, the token that replaced it.</summary>
    public string? ReplacedByToken { get; set; }

    public string? ReasonRevoked { get; set; }

    public bool IsExpired(DateTime utcNow) => utcNow >= ExpiresAt;

    public bool IsRevoked => RevokedAt is not null;

    public bool IsActive(DateTime utcNow) => !IsRevoked && !IsExpired(utcNow);

    public void Revoke(DateTime utcNow, string? revokedByIp, string? replacedByToken, string? reason)
    {
        RevokedAt = utcNow;
        RevokedByIp = revokedByIp;
        ReplacedByToken = replacedByToken;
        ReasonRevoked = reason;
    }
}
