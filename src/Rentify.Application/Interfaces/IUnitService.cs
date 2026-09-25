using Rentify.Application.Common.Pagination;
using Rentify.Application.DTOs.Units;

namespace Rentify.Application.Interfaces;

public interface IUnitService
{
    /// <summary>Publicly listable — anyone can browse a property's units (e.g. a prospective tenant).</summary>
    Task<PagedResult<UnitDto>> GetPagedByPropertyAsync(int propertyId, PaginationRequest request, CancellationToken cancellationToken);

    Task<UnitDto> GetByIdAsync(int id, CancellationToken cancellationToken);

    /// <summary>Only the owning Owner (or an Admin) may add units to a property.</summary>
    Task<UnitDto> CreateAsync(int propertyId, CreateUnitRequest request, CancellationToken cancellationToken);

    /// <summary>Only the owning Owner (or an Admin) may update a unit. Rejects setting Status to Reserved/Rented directly — those are set by the contract workflow.</summary>
    Task<UnitDto> UpdateAsync(int id, UpdateUnitRequest request, CancellationToken cancellationToken);

    /// <summary>Only the owning Owner (or an Admin) may delete a unit. Blocked if the unit has a Pending or Active RentalContract.</summary>
    Task DeleteAsync(int id, CancellationToken cancellationToken);
}
