using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Rentify.Application.DTOs.Auth;
using Rentify.Application.Interfaces;

namespace Rentify.API.Controllers;

/// <summary>
/// Thin controller — all logic lives in IAuthService. Phase 4 had local try/catch blocks
/// here mapping AppConflictException/AppValidationException/AppUnauthorizedException to
/// HTTP status codes, explicitly flagged at the time as a temporary stand-in for global
/// exception handling middleware. That middleware (GlobalExceptionHandler, Phase 5) now
/// exists, so those catches are gone: every Application exception thrown by IAuthService
/// simply propagates, and GlobalExceptionHandler maps it to the same status codes as
/// before, with the same consistent response shape used by every other controller.
/// Request-shape validation (email format, password length, etc.) is likewise no longer
/// this controller's concern — ValidationFilter (registered globally) runs each DTO's
/// FluentValidation validator before the action method is even invoked.
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        var response = await _authService.RegisterAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("confirm-email")]
    [AllowAnonymous]
    public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailRequest request, CancellationToken cancellationToken)
    {
        await _authService.ConfirmEmailAsync(request, cancellationToken);
        return Ok(new { message = "Email confirmed. You can now log in." });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var response = await _authService.LoginAsync(request, GetClientIp(), cancellationToken);
        return Ok(response);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var response = await _authService.RefreshTokenAsync(request.RefreshToken, GetClientIp(), cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Revokes the given refresh token server-side. Note the access token itself remains
    /// valid until it naturally expires (up to Jwt:AccessTokenExpirationMinutes) — that is
    /// the standard, expected trade-off of stateless JWTs, and is exactly why access tokens
    /// are kept short-lived.
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request, CancellationToken cancellationToken)
    {
        await _authService.LogoutAsync(request.RefreshToken, GetClientIp(), cancellationToken);
        return NoContent();
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        // Always returns 200 with the same generic message, whether or not the email is
        // registered — AuthService is silent on an unknown email to avoid user enumeration.
        await _authService.ForgotPasswordAsync(request, cancellationToken);
        return Ok(new { message = "If that email is registered, a password reset link has been sent." });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        await _authService.ResetPasswordAsync(request, cancellationToken);
        return Ok(new { message = "Password has been reset. Please log in again." });
    }

    private string? GetClientIp() => HttpContext.Connection.RemoteIpAddress?.ToString();
}
