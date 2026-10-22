using Rentify.Domain.Enums;

namespace Rentify.Application.DTOs.Maintenance;

public record MaintenanceRequestDto(
    int Id,
    int UnitId,
    string UnitNumber,
    int PropertyId,
    string PropertyName,
    int TenantProfileId,
    string TenantName,
    string Title,
    string Description,
    MaintenancePriority Priority,
    MaintenanceStatus Status,
    DateTime CreatedAt,
    IReadOnlyList<MaintenanceUpdateDto> Updates
);

public record MaintenanceUpdateDto(
    int Id,
    MaintenanceStatus? OldStatus,
    MaintenanceStatus NewStatus,
    string UpdatedByUserId,
    string? Note,
    DateTime CreatedAt
);

public record CreateMaintenanceRequest(
    int UnitId,
    string Title,
    string Description,
    MaintenancePriority Priority
);

public record UpdateMaintenanceStatusRequest(
    MaintenanceStatus Status,
    string? Note
);
