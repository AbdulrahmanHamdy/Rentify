using FluentValidation;
using Rentify.Application.DTOs.Payments;
using Rentify.Domain.Enums;

namespace Rentify.Application.Validators.Payments;

public class MarkPaymentPaidRequestValidator : AbstractValidator<MarkPaymentPaidRequest>
{
    public MarkPaymentPaidRequestValidator()
    {
        RuleFor(x => x.Method)
            .NotEmpty()
            .IsEnumName(typeof(PaymentMethod), caseSensitive: false)
            .WithMessage($"Method must be one of: {string.Join(", ", Enum.GetNames<PaymentMethod>())}");

        RuleFor(x => x.ReferenceNumber)
            .MaximumLength(100);
    }
}
