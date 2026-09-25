using FluentValidation;
using Rentify.Application.DTOs.Properties;

namespace Rentify.Application.Validators.Properties;

public class CreatePropertyRequestValidator : AbstractValidator<CreatePropertyRequest>
{
    public CreatePropertyRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Address).NotEmpty().MaximumLength(300);
        RuleFor(x => x.City).MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(2000);
    }
}
