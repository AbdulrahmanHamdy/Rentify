using Rentify.Application.Common.Pagination;
using Rentify.Domain.Entities;
using Rentify.Domain.Enums;

namespace Rentify.Application.Interfaces;

public interface IContractRepository
{
    /// <summary>
    /// Paged contract list. When <paramref name="partyUserId"/> is supplied, only contracts where that
    /// Identity user is the tenant OR the owner of the unit's property are returned; null means
    /// "no restriction" (Admin). Searches UnitNumber / Property name; sorts by StartDate / EndDate /
    /// MonthlyRent / CreatedAt (default CreatedAt desc).
    /// </summary>
    Task<PagedResult<RentalContract>> GetPagedAsync(
        PaginationRequest request, ContractStatus? status, string? partyUserId, CancellationToken cancellationToken);

    /// <summary>
    /// Tracked load with Tenant and Unit → Property → Owner included, so the service can check
    /// who is a party to the contract and mutate contract + unit together without extra round trips.
    /// </summary>
    Task<RentalContract?> GetByIdAsync(int id, CancellationToken cancellationToken);

    /// <summary>Inserts the contract. A concurrent duplicate (unique index on pending/active contracts per unit) surfaces as AppConflictException.</summary>
    Task<RentalContract> AddAsync(RentalContract contract, CancellationToken cancellationToken);

    /// <summary>Saves pending changes to the tracked contract and, in the same transaction, any tracked Unit the service changed alongside it.</summary>
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
