using FluentValidation;
using Rentify.Application.DTOs.Auth;
using Rentify.Domain.Constants;

namespace Rentify.Application.Validators.Auth;

/// <summary>
/// Validates request *shape* (a well-formed email, a role that's at least one of the known
/// roles, etc.) before the request ever reaches AuthService. This is intentionally not a
/// duplicate of AuthService's own checks: Identity's password policy (length, character
/// classes) is enforced by UserManager.CreateAsync itself, and "Admin can't self-register"
/// is a business rule enforced in AuthService — both stay exactly where they are. This
/// validator only catches malformed requests early, with a consistent 422 shape.
/// </summary>
public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).MaximumLength(100);
        RuleFor(x => x.Role)
            .NotEmpty()
            .Must(role => Roles.All.Contains(role, StringComparer.OrdinalIgnoreCase))
            .WithMessage($"Role must be one of: {string.Join(", ", Roles.All)}.");
        RuleFor(x => x.FirstName).MaximumLength(100);
        RuleFor(x => x.LastName).MaximumLength(100);
        RuleFor(x => x.PhoneNumber).MaximumLength(30);
    }
}
