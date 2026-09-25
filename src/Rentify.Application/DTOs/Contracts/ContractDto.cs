namespace Rentify.Application.DTOs.Contracts;

/// <summary>
/// Contract as returned to API clients. Unit/property context is flattened in so a client can
/// render a contract list without a follow-up request per row. Status is the enum name
/// (e.g. "Pending"), consistent with UnitDto.
/// </summary>
public record ContractDto(
    int Id,
    int UnitId,
    string UnitNumber,
    int PropertyId,
    string PropertyName,
    int TenantProfileId,
    DateOnly StartDate,
    DateOnly EndDate,
    decimal MonthlyRent,
    decimal SecurityDeposit,
    string Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
