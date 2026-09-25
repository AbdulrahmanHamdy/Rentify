namespace Rentify.Application.DTOs.Units;

/// <summary>Status is exposed as its string name (e.g. "Available"), not the raw int, so API clients never need to know the enum's underlying numbering.</summary>
public record UnitDto(
    int Id,
    int PropertyId,
    string UnitNumber,
    int? Floor,
    double AreaSqm,
    int Bedrooms,
    int Bathrooms,
    decimal MonthlyRent,
    decimal DepositAmount,
    string Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
