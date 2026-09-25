namespace Rentify.Application.Interfaces;

/// <summary>
/// Abstraction over "who is making this request", so Application logic and the
/// Infrastructure persistence layer (audit field population) don't need to depend on
/// HttpContext directly. Implemented for real in Rentify.Infrastructure once JWT
/// authentication exists; until then, a placeholder implementation returns an
/// unauthenticated user so the rest of the stack can build and run.
/// </summary>
public interface ICurrentUserService
{
    /// <summary>The current user's Identity Id, or null if there is no authenticated user (e.g. a background job, or before auth is wired up).</summary>
    string? UserId { get; }

    bool IsAuthenticated { get; }

    /// <summary>
    /// True if the current user carries the given role claim (e.g. Roles.Admin). Used by
    /// Application-layer services to grant Admin an ownership-check bypass — role-based
    /// [Authorize] on the controller already confirms *what kind* of user is calling, but
    /// "does this specific record belong to this caller" can only be checked once the
    /// record is loaded, which is why this lives here rather than only in [Authorize].
    /// </summary>
    bool IsInRole(string role);
}
