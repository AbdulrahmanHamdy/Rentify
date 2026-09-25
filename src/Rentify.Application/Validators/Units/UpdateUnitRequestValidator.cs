using FluentValidation;
using Rentify.Application.DTOs.Units;
using Rentify.Domain.Enums;

namespace Rentify.Application.Validators.Units;

public class UpdateUnitRequestValidator : AbstractValidator<UpdateUnitRequest>
{
    public UpdateUnitRequestValidator()
    {
        RuleFor(x => x.UnitNumber).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Floor).GreaterThanOrEqualTo(-5).LessThanOrEqualTo(500);
        RuleFor(x => x.AreaSqm).GreaterThan(0);
        RuleFor(x => x.Bedrooms).GreaterThanOrEqualTo(0).LessThanOrEqualTo(50);
        RuleFor(x => x.Bathrooms).GreaterThanOrEqualTo(0).LessThanOrEqualTo(50);
        RuleFor(x => x.MonthlyRent).GreaterThan(0);
        RuleFor(x => x.DepositAmount).GreaterThanOrEqualTo(0);

        // Only a shape check (is this a real UnitStatus name at all) — the business rule
        // that Reserved/Rented can't be set manually through this endpoint is enforced in
        // UnitService, since it's a business rule about *who* may set *which* transition,
        // not just "is this string well-formed".
        RuleFor(x => x.Status)
            .NotEmpty()
            .Must(status => Enum.TryParse<UnitStatus>(status, ignoreCase: true, out _))
            .WithMessage("Status must be one of: Available, Reserved, Rented, Maintenance.");
    }
}
