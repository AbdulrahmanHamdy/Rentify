using FluentValidation;
using Rentify.Application.DTOs.Contracts;

namespace Rentify.Application.Validators.Contracts;

public class CreateContractRequestValidator : AbstractValidator<CreateContractRequest>
{
    private const int MinimumTermDays = 28;

    public CreateContractRequestValidator()
    {
        RuleFor(x => x.UnitId).GreaterThan(0);

        RuleFor(x => x.StartDate)
            .Must(start => start >= DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("StartDate cannot be in the past.");

        // DayNumber arithmetic (rather than StartDate.AddMonths(1)) so an extreme date such
        // as 9999-12-31 can't overflow and turn a validation error into a 500.
        RuleFor(x => x.EndDate)
            .Must((request, end) => end.DayNumber - request.StartDate.DayNumber >= MinimumTermDays)
            .WithMessage($"The contract term must be at least {MinimumTermDays} days (EndDate must be after StartDate).");
    }
}
