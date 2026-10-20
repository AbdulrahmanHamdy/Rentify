using FluentValidation;
using Rentify.Application.DTOs.Profile;

namespace Rentify.Application.Validators.Profile;

public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.FirstName).MaximumLength(100);
        RuleFor(x => x.LastName).MaximumLength(100);
        RuleFor(x => x.PhoneNumber).MaximumLength(30);
        RuleFor(x => x.CompanyName).MaximumLength(150);
        RuleFor(x => x.NationalId).MaximumLength(50);
    }
}
