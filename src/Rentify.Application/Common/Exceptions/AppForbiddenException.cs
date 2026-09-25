namespace Rentify.Application.Common.Exceptions;

/// <summary>
/// Thrown when an authenticated user is not allowed to act on a specific resource — most
/// commonly an Owner trying to modify a Property/Unit they don't own. This is deliberately
/// distinct from ASP.NET Core's role-based [Authorize] failures (which short-circuit before
/// a controller action even runs): [Authorize(Roles = "Owner")] confirms *what kind* of user
/// is calling, while AppForbiddenException enforces *ownership of this specific record*,
/// which can only be checked once the record has been loaded in the Application layer. Maps
/// to HTTP 403 in the global exception handling middleware.
/// </summary>
public class AppForbiddenException : Exception
{
    public AppForbiddenException(string message) : base(message)
    {
    }
}
