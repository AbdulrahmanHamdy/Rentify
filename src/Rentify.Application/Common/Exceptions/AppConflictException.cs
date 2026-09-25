namespace Rentify.Application.Common.Exceptions;

/// <summary>
/// Thrown when a request conflicts with existing state (e.g. an email already registered).
/// Maps to HTTP 409 in controllers. This local exception-to-status mapping is temporary —
/// the dedicated Error Handling phase will replace per-controller catches with global
/// exception middleware, without changing where or why these are thrown.
/// </summary>
public class AppConflictException : Exception
{
    public AppConflictException(string message) : base(message)
    {
    }
}
