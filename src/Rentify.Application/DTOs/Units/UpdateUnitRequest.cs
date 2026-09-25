namespace Rentify.Application.DTOs.Units;

/// <summary>
/// Status is a plain string here ("Available" / "Maintenance") because UnitService only
/// allows an owner to manually toggle between those two values — "Reserved" and "Rented"
/// are set by the contract workflow (a later phase), never by a direct PUT, so a unit can't
/// be marked Rented without an actual RentalContract behind it.
/// </summary>
public record UpdateUnitRequest(
    string UnitNumber,
    int? Floor,
    double AreaSqm,
    int Bedrooms,
    int Bathrooms,
    decimal MonthlyRent,
    decimal DepositAmount,
    string Status);
