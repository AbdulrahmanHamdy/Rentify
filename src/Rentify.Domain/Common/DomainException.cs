namespace Rentify.Domain.Common;

/// <summary>
/// Thrown when a domain invariant is violated — e.g. an invalid RentalContract status
/// transition. Kept deliberately framework-agnostic (no dependency on ASP.NET Core) so it
/// can be thrown from Domain entities and translated into a 409/422 response by the global
/// exception handling middleware in Rentify.API.
/// </summary>
public class DomainException : Exception
{
    public DomainException(string message) : base(message)
    {
    }
}
