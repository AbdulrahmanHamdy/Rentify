using Rentify.Application.Common.Pagination;
using Rentify.Domain.Entities;

namespace Rentify.Application.Interfaces;

public interface IUnitRepository
{
    /// <summary>Searches UnitNumber (case-insensitive) when Search is set, sorts by UnitNumber/MonthlyRent/CreatedAt (falls back to UnitNumber asc).</summary>
    Task<PagedResult<Unit>> GetPagedByPropertyAsync(int propertyId, PaginationRequest request, CancellationToken cancellationToken);

    /// <summary>Loads a Unit by id, with its Property (and the Property's Owner) included so ownership can be checked without a second round trip.</summary>
    Task<Unit?> GetByIdAsync(int id, CancellationToken cancellationToken);

    Task<bool> UnitNumberExistsAsync(int propertyId, string unitNumber, int? excludeUnitId, CancellationToken cancellationToken);

    /// <summary>True if the unit has any RentalContract in a non-terminal state (Pending or Active) — used to block deletion of a unit that's actually in use.</summary>
    Task<bool> HasNonTerminalContractAsync(int unitId, CancellationToken cancellationToken);

    Task<Unit> AddAsync(Unit unit, CancellationToken cancellationToken);

    Task UpdateAsync(Unit unit, CancellationToken cancellationToken);

    Task DeleteAsync(Unit unit, CancellationToken cancellationToken);
}
