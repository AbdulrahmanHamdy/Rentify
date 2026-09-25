namespace Rentify.Application.Common.Exceptions;

/// <summary>
/// Thrown when a request is well-formed but fails business/domain validation (e.g.
/// Identity's password policy, an invalid role, a bad confirmation/reset token). Maps to
/// HTTP 422 in controllers. This is distinct from the FluentValidation phase, which will
/// validate request *shape* before it ever reaches a service — this exception is for
/// validation that can only happen once real logic runs (e.g. asking Identity to create
/// the user).
/// </summary>
public class AppValidationException : Exception
{
    public IReadOnlyCollection<string> Errors { get; }

    public AppValidationException(IEnumerable<string> errors)
        : base("One or more validation errors occurred.")
    {
        Errors = errors.ToList();
    }
}
