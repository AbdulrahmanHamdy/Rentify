using Rentify.Domain.Entities;

namespace Rentify.Application.Interfaces;

/// <summary>Minimal on purpose, mirroring <see cref="IOwnerProfileRepository"/>: ContractService only needs to resolve the caller's TenantProfile.</summary>
public interface ITenantProfileRepository
{
    Task<TenantProfile?> GetByUserIdAsync(string userId, CancellationToken cancellationToken);
}
