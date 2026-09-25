using FluentValidation;
using Rentify.Application.DTOs.Auth;

namespace Rentify.Application.Validators.Auth;

public class ConfirmEmailRequestValidator : AbstractValidator<ConfirmEmailRequest>
{
    public ConfirmEmailRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Token).NotEmpty();
    }
}
