using Microsoft.AspNetCore.Diagnostics;
using Rentify.API.Common;
using Rentify.Application.Common.Exceptions;
using Rentify.Domain.Common;

namespace Rentify.API.Middleware;

/// <summary>
/// Central place every unhandled exception passes through, registered via
/// services.AddExceptionHandler&lt;GlobalExceptionHandler&gt;() + app.UseExceptionHandler()
/// in Program.cs. This is what the spec's Error Handling section asks for ("Implement
/// global exception handling middleware") — using ASP.NET Core 8's built-in IExceptionHandler
/// pipeline rather than a hand-rolled `app.Use(...)` middleware, since it's the idiomatic
/// .NET 8 way to do the same job.
///
/// Replaces the local try/catch blocks that AuthController used as a temporary stand-in
/// during Phase 4 (see that controller's own doc comment) — the Application-layer
/// exceptions (AppConflictException etc.) are thrown from exactly the same places as
/// before; only the exception-to-status-code mapping has moved here, to run for every
/// controller instead of being copy-pasted into each one.
/// </summary>
public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IHostEnvironment environment)
    {
        _logger = logger;
        _environment = environment;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (statusCode, message, errors) = Map(exception);

        if (statusCode == StatusCodes.Status500InternalServerError)
        {
            // Full exception (including stack trace) always goes to the log — only the
            // *response body* is ever sanitized for the client, never what we log.
            _logger.LogError(exception, "Unhandled exception on {Method} {Path}", httpContext.Request.Method, httpContext.Request.Path);
        }
        else
        {
            _logger.LogWarning("Handled {ExceptionType} ({StatusCode}) on {Method} {Path}: {Message}",
                exception.GetType().Name, statusCode, httpContext.Request.Method, httpContext.Request.Path, exception.Message);
        }

        // Never leak internal exception details (stack traces, raw .NET exception messages)
        // for an actual 500 in production — 4xx messages are always our own deliberately
        // user-safe text (thrown from Application services), so those are safe to return
        // as-is in every environment.
        var safeMessage = statusCode == StatusCodes.Status500InternalServerError && !_environment.IsDevelopment()
            ? "An unexpected error occurred. Please try again later."
            : message;

        var response = new ApiErrorResponse
        {
            StatusCode = statusCode,
            Message = safeMessage,
            Errors = errors,
            TraceId = httpContext.TraceIdentifier,
        };

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/json";
        await httpContext.Response.WriteAsJsonAsync(response, cancellationToken);

        return true;
    }

    private static (int StatusCode, string Message, IReadOnlyCollection<string>? Errors) Map(Exception exception) => exception switch
    {
        AppValidationException ex => (StatusCodes.Status422UnprocessableEntity, ex.Message, ex.Errors),
        AppConflictException ex => (StatusCodes.Status409Conflict, ex.Message, null),
        AppUnauthorizedException ex => (StatusCodes.Status401Unauthorized, ex.Message, null),
        AppForbiddenException ex => (StatusCodes.Status403Forbidden, ex.Message, null),
        AppNotFoundException ex => (StatusCodes.Status404NotFound, ex.Message, null),

        // A DomainException is an invalid state transition (e.g. RentalContract.Activate()
        // called on an already-Active contract) — the request was well-formed, but conflicts
        // with the resource's current state, which is exactly what 409 means.
        DomainException ex => (StatusCodes.Status409Conflict, ex.Message, null),

        _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred.", null),
    };
}
