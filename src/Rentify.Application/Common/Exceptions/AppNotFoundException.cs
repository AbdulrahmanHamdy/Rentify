namespace Rentify.Application.Common.Exceptions;

/// <summary>
/// Thrown when a requested resource (by id) does not exist, or — for soft-deleted
/// AuditableEntity rows — is no longer visible because RentifyDbContext's global query
/// filter already hides it. Maps to HTTP 404 in the global exception handling middleware.
/// </summary>
public class AppNotFoundException : Exception
{
    public AppNotFoundException(string message) : base(message)
    {
    }

    /// <summary>Convenience overload for the common "TEntity with id X was not found" case.</summary>
    public AppNotFoundException(string entityName, object id)
        : base($"{entityName} with id '{id}' was not found.")
    {
    }
}
