using Rentify.Application.Common.Pagination;
using Rentify.Application.DTOs.Maintenance;
using Rentify.Domain.Enums;

namespace Rentify.Application.Interfaces;

public interface IMaintenanceService
{
    Task<PagedResult<MaintenanceRequestDto>> GetPagedAsync(
        PaginationRequest request,
        MaintenanceStatus? status = null,
        CancellationToken cancellationToken = default);

    Task<MaintenanceRequestDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<MaintenanceRequestDto> CreateAsync(CreateMaintenanceRequest request, CancellationToken cancellationToken = default);

    Task<MaintenanceRequestDto> UpdateStatusAsync(int id, UpdateMaintenanceStatusRequest request, CancellationToken cancellationToken = default);
}
