namespace Rentify.Application.DTOs.Contracts;

/// <summary>
/// Deliberately tiny: the tenant is always the authenticated caller, and MonthlyRent /
/// SecurityDeposit are always copied from the Unit by ContractService at creation time.
/// A tenant must never be able to pick their own rent or deposit, or rent "as" someone else,
/// by editing the request body.
/// </summary>
public record CreateContractRequest(
    int UnitId,
    DateOnly StartDate,
    DateOnly EndDate);
