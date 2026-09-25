using Rentify.Application.DTOs.Auth;

namespace Rentify.Application.Interfaces;

/// <summary>
/// Orchestrates the authentication use cases. Implemented in Rentify.Infrastructure.Identity
/// (AuthService) because it needs UserManager/SignInManager, which are Identity/framework
/// concerns — the interface itself stays framework-free so Rentify.API only ever depends on
/// this abstraction, never on ASP.NET Core Identity types directly.
/// </summary>
public interface IAuthService
{
    Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);

    Task ConfirmEmailAsync(ConfirmEmailRequest request, CancellationToken cancellationToken = default);

    Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken = default);

    Task<AuthResponse> RefreshTokenAsync(string refreshToken, string? ipAddress, CancellationToken cancellationToken = default);

    Task LogoutAsync(string refreshToken, string? ipAddress, CancellationToken cancellationToken = default);

    Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default);

    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);
}
