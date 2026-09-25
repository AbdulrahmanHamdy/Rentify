using Rentify.Application.Common.Pagination;
using Rentify.Application.DTOs.Properties;

namespace Rentify.Application.Interfaces;

public interface IPropertyService
{
    /// <summary>
    /// Lists properties. When <paramref name="mineOnly"/> is true, the caller must be an
    /// authenticated Owner and results are restricted to their own properties — otherwise
    /// this is the public catalog (any property, any caller, including anonymous).
    /// </summary>
    Task<PagedResult<PropertyDto>> GetPagedAsync(PaginationRequest request, bool mineOnly, CancellationToken cancellationToken);

    Task<PropertyDto> GetByIdAsync(int id, CancellationToken cancellationToken);

    /// <summary>Creates a property under the caller's own OwnerProfile (resolved from ICurrentUserService — never from the request body).</summary>
    Task<PropertyDto> CreateAsync(CreatePropertyRequest request, CancellationToken cancellationToken);

    /// <summary>Owner may only update their own property; Admin may update any. Throws AppForbiddenException otherwise.</summary>
    Task<PropertyDto> UpdateAsync(int id, UpdatePropertyRequest request, CancellationToken cancellationToken);

    /// <summary>Owner may only delete their own property; Admin may delete any. Soft-deletes (see RentifyDbContext).</summary>
    Task DeleteAsync(int id, CancellationToken cancellationToken);
}
