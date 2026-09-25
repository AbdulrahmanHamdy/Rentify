using Rentify.Domain.Entities;

namespace Rentify.Application.Interfaces;

/// <summary>
/// Deliberately minimal (one method) — PropertyService only ever needs to resolve the
/// currently authenticated Owner's OwnerProfileId. A full CRUD repository for OwnerProfile
/// isn't needed yet; add methods here if/when a later phase needs them.
/// </summary>
public interface IOwnerProfileRepository
{
    Task<OwnerProfile?> GetByUserIdAsync(string userId, CancellationToken cancellationToken);
}
