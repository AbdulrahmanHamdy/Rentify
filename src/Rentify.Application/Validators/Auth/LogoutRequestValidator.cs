using FluentValidation;
using Rentify.Application.DTOs.Auth;

namespace Rentify.Application.Validators.Auth;

public class LogoutRequestValidator : AbstractValidator<LogoutRequest>
{
    public LogoutRequestValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}
