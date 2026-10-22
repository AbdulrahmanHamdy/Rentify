using FluentValidation;
using Rentify.Application.DTOs.Maintenance;

namespace Rentify.Application.Validators.Maintenance;

public class CreateMaintenanceRequestValidator : AbstractValidator<CreateMaintenanceRequest>
{
    public CreateMaintenanceRequestValidator()
    {
        RuleFor(x => x.UnitId)
            .GreaterThan(0)
            .WithMessage("A valid unit must be specified.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(150).WithMessage("Title cannot exceed 150 characters.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required.")
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters.");

        RuleFor(x => x.Priority)
            .IsInEnum().WithMessage("Priority must be a valid value.");
    }
}

public class UpdateMaintenanceStatusRequestValidator : AbstractValidator<UpdateMaintenanceStatusRequest>
{
    public UpdateMaintenanceStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Status must be a valid maintenance status.");

        RuleFor(x => x.Note)
            .MaximumLength(500).WithMessage("Note cannot exceed 500 characters.");
    }
}
