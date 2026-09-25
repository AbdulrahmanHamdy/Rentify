namespace Rentify.Application.DTOs.Units;

/// <summary>
/// No Status field: every newly created unit starts as Available (UnitService sets this),
/// since Reserved/Rented/Maintenance only make sense once a contract exists or an owner
/// deliberately takes it offline — neither of which applies to a brand-new unit.
/// </summary>
public record CreateUnitRequest(
    string UnitNumber,
    int? Floor,
    double AreaSqm,
    int Bedrooms,
    int Bathrooms,
    decimal MonthlyRent,
    decimal DepositAmount);
