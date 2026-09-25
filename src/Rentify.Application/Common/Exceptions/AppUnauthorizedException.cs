namespace Rentify.Application.Common.Exceptions;

/// <summary>
/// Thrown for authentication failures (invalid credentials, invalid/expired/reused refresh
/// token, locked-out account, unconfirmed email). Maps to HTTP 401 in controllers. Named
/// distinctly from System.UnauthorizedAccessException to avoid clashing with framework
/// exceptions of the same intent but different meaning.
/// </summary>
public class AppUnauthorizedException : Exception
{
    public AppUnauthorizedException(string message) : base(message)
    {
    }
}
