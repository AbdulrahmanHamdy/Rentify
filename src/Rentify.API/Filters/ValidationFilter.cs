using FluentValidation;
using Microsoft.AspNetCore.Mvc.Filters;
using Rentify.Application.Common.Exceptions;

namespace Rentify.API.Filters;

/// <summary>
/// Registered once, globally, in Program.cs (`options.Filters.Add&lt;ValidationFilter&gt;()`)
/// rather than being wired per-controller. For every model-bound action argument, this
/// looks up whether an `IValidator&lt;TArgument&gt;` is registered (Rentify.Application's
/// DependencyInjection scans and registers every AbstractValidator&lt;T&gt; in that assembly
/// — see Validators/Auth, Validators/Properties, Validators/Units) and, if so, runs it
/// before the action executes. A failure throws AppValidationException, which
/// GlobalExceptionHandler turns into the same 422 response shape as every other validation
/// failure in the app — so "the request never reached a controller action" and "a service
/// rejected it" look identical to the client, which is the "consistent validation errors"
/// requirement from the spec.
///
/// An argument type with no registered validator (e.g. a plain route `int id`) is silently
/// skipped, not an error — most action parameters simply don't need FluentValidation rules.
/// </summary>
public class ValidationFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        foreach (var argument in context.ActionArguments.Values)
        {
            if (argument is null)
            {
                continue;
            }

            var validatorType = typeof(IValidator<>).MakeGenericType(argument.GetType());
            if (context.HttpContext.RequestServices.GetService(validatorType) is not IValidator validator)
            {
                continue;
            }

            var validationContext = new ValidationContext<object>(argument);
            var result = await validator.ValidateAsync(validationContext);

            if (!result.IsValid)
            {
                throw new AppValidationException(result.Errors.Select(e => e.ErrorMessage));
            }
        }

        await next();
    }
}
