using Rentify.Application.Common.Pagination;
using Rentify.Domain.Entities;

namespace Rentify.Application.Interfaces;

/// <summary>
/// Persistence abstraction for Property. Defined in Application (per the layered
/// architecture: Infrastructure -> Application), implemented in Infrastructure using
/// RentifyDbContext, so PropertyService never takes a direct dependency on EF Core.
/// </summary>
public interface IPropertyRepository
{
    /// <summary>
    /// Searches Name/Address/City (case-insensitive) when Search is set, sorts by Name/City/CreatedAt
    /// (falls back to CreatedAt desc for an unrecognized SortBy), and — when <paramref name="ownerProfileId"/>
    /// is supplied — restricts results to that owner's properties only (used by the "mine=true" list filter).
    /// </summary>
    Task<PagedResult<Property>> GetPagedAsync(PaginationRequest request, int? ownerProfileId, CancellationToken cancellationToken);

    /// <summary>Loads a Property by id, with its Owner navigation included (needed for ownership checks) and, optionally, its Units.</summary>
    Task<Property?> GetByIdAsync(int id, CancellationToken cancellationToken, bool includeUnits = false);

    /// <summary>True if any unit of this property has a RentalContract in a non-terminal state (Pending or Active) — used to block deleting a property that is actually in use.</summary>
    Task<bool> HasNonTerminalContractsAsync(int propertyId, CancellationToken cancellationToken);

    Task<Property> AddAsync(Property property, CancellationToken cancellationToken);

    /// <summary>Persists changes to an already-tracked, already-modified Property.</summary>
    Task UpdateAsync(Property property, CancellationToken cancellationToken);

    /// <summary>Removes the Property. RentifyDbContext converts this to a soft delete (IsDeleted = true) for AuditableEntity types, so the row and its history are preserved.</summary>
    Task DeleteAsync(Property property, CancellationToken cancellationToken);
}
