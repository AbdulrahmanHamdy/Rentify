using FluentValidation;
using Rentify.Application.DTOs.Units;

namespace Rentify.Application.Validators.Units;

public class CreateUnitRequestValidator : AbstractValidator<CreateUnitRequest>
{
    public CreateUnitRequestValidator()
    {
        RuleFor(x => x.UnitNumber).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Floor).GreaterThanOrEqualTo(-5).LessThanOrEqualTo(500);
        RuleFor(x => x.AreaSqm).GreaterThan(0);
        RuleFor(x => x.Bedrooms).GreaterThanOrEqualTo(0).LessThanOrEqualTo(50);
        RuleFor(x => x.Bathrooms).GreaterThanOrEqualTo(0).LessThanOrEqualTo(50);
        RuleFor(x => x.MonthlyRent).GreaterThan(0);
        RuleFor(x => x.DepositAmount).GreaterThanOrEqualTo(0);
    }
}
