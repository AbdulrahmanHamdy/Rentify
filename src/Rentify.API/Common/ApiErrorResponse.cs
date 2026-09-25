namespace Rentify.API.Common;

/// <summary>
/// The single, consistent shape every error response uses across the whole API — written
/// once here by GlobalExceptionHandler rather than being assembled ad hoc per controller
/// (which is exactly what AuthController's temporary Phase 4 try/catch blocks did; this
/// type and GlobalExceptionHandler replace that).
/// </summary>
public class ApiErrorResponse
{
    public required int StatusCode { get; init; }

    public required string Message { get; init; }

    /// <summary>Populated for 422 validation failures (one entry per rule violation); null otherwise.</summary>
    public IReadOnlyCollection<string>? Errors { get; init; }

    /// <summary>HttpContext.TraceIdentifier — included so a user-reported error can be correlated with the corresponding Serilog entry once the Logging phase adds request-scoped log correlation.</summary>
    public required string TraceId { get; init; }
}
