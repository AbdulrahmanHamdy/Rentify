using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Rentify.Application.Common.Exceptions;
using Rentify.Application.DTOs.Auth;
using Rentify.Application.Interfaces;
using Rentify.Domain.Constants;
using Rentify.Domain.Entities;
using Rentify.Infrastructure.Persistence;

namespace Rentify.Infrastructure.Identity;

/// <summary>
/// Implements every authentication use case on top of ASP.NET Core Identity's
/// UserManager/SignInManager. Never hashes or compares passwords itself — that's entirely
/// delegated to Identity. Refresh tokens are opaque random strings (not JWTs) persisted via
/// RentifyDbContext, so they can be looked up, rotated and revoked server-side.
/// </summary>
public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly RentifyDbContext _dbContext;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IEmailSender _emailSender;
    private readonly JwtOptions _jwtOptions;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        RentifyDbContext dbContext,
        IJwtTokenGenerator jwtTokenGenerator,
        IEmailSender emailSender,
        JwtOptions jwtOptions,
        ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _dbContext = dbContext;
        _jwtTokenGenerator = jwtTokenGenerator;
        _emailSender = emailSender;
        _jwtOptions = jwtOptions;
        _logger = logger;
    }

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedRole = NormalizeSelfRegistrationRole(request.Role);

        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing is not null)
        {
            throw new AppConflictException("An account with this email already exists.");
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.PhoneNumber,
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            throw new AppValidationException(createResult.Errors.Select(e => e.Description));
        }

        await _userManager.AddToRoleAsync(user, normalizedRole);

        if (normalizedRole == Roles.Owner)
        {
            _dbContext.OwnerProfiles.Add(new OwnerProfile { UserId = user.Id });
        }
        else
        {
            _dbContext.TenantProfiles.Add(new TenantProfile { UserId = user.Id });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var confirmationToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        await _emailSender.SendEmailAsync(
            user.Email!,
            "Confirm your Rentify account",
            $"Welcome to Rentify. UserId: {user.Id}, confirmation token: {confirmationToken}",
            cancellationToken);

        _logger.LogInformation("New {Role} account registered: {UserId}", normalizedRole, user.Id);

        return new RegisterResponse(
            user.Id,
            user.Email!,
            normalizedRole,
            "Registration successful. Check your email to confirm your account before logging in.");
    }

    public async Task ConfirmEmailAsync(ConfirmEmailRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(request.UserId)
            ?? throw new AppValidationException(new[] { "Invalid confirmation request." });

        var result = await _userManager.ConfirmEmailAsync(user, request.Token);
        if (!result.Succeeded)
        {
            throw new AppValidationException(result.Errors.Select(e => e.Description));
        }
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email)
            ?? throw new AppUnauthorizedException("Invalid email or password.");

        var signInResult = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);

        if (signInResult.IsLockedOut)
        {
            throw new AppUnauthorizedException("This account is locked due to multiple failed login attempts. Try again later.");
        }

        if (signInResult.IsNotAllowed)
        {
            throw new AppUnauthorizedException("Email not confirmed. Please check your inbox for the confirmation link.");
        }

        if (!signInResult.Succeeded)
        {
            throw new AppUnauthorizedException("Invalid email or password.");
        }

        return await IssueTokensAsync(user, ipAddress, cancellationToken);
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken, string? ipAddress, CancellationToken cancellationToken = default)
    {
        var stored = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken, cancellationToken)
            ?? throw new AppUnauthorizedException("Invalid refresh token.");

        var utcNow = DateTime.UtcNow;

        if (stored.IsRevoked)
        {
            // Reuse of an already-rotated token is a strong signal the token was stolen.
            // Revoke every other active token for this user so a copied token stops working.
            await RevokeAllActiveTokensAsync(stored.UserId, ipAddress, "Attempted reuse of a revoked refresh token", utcNow, cancellationToken);
            _logger.LogWarning("Refresh token reuse detected for user {UserId}; all sessions revoked.", stored.UserId);
            throw new AppUnauthorizedException("Invalid refresh token.");
        }

        if (stored.IsExpired(utcNow))
        {
            throw new AppUnauthorizedException("Refresh token has expired. Please log in again.");
        }

        var user = await _userManager.FindByIdAsync(stored.UserId)
            ?? throw new AppUnauthorizedException("Invalid refresh token.");

        var newRefreshTokenValue = GenerateSecureToken();
        stored.Revoke(utcNow, ipAddress, newRefreshTokenValue, "Rotated on refresh");

        var response = await IssueTokensAsync(user, ipAddress, cancellationToken, precomputedRefreshToken: newRefreshTokenValue);
        return response;
    }

    public async Task LogoutAsync(string refreshToken, string? ipAddress, CancellationToken cancellationToken = default)
    {
        var stored = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken, cancellationToken);

        // Idempotent and silent on a missing/already-revoked token — logging out twice, or
        // with a stale token, should never error or reveal whether the token ever existed.
        if (stored is null || stored.IsRevoked)
        {
            return;
        }

        stored.Revoke(DateTime.UtcNow, ipAddress, replacedByToken: null, "Logged out");
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            // Deliberately silent: never reveal whether an email is registered.
            return;
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        await _emailSender.SendEmailAsync(
            user.Email!,
            "Reset your Rentify password",
            $"Reset your password for {user.Email} using this token: {token}",
            cancellationToken);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email)
            ?? throw new AppValidationException(new[] { "Invalid reset request." });

        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            throw new AppValidationException(result.Errors.Select(e => e.Description));
        }

        // Force re-login on every device after a password reset.
        await RevokeAllActiveTokensAsync(user.Id, ipAddress: null, "Password was reset", DateTime.UtcNow, cancellationToken);
    }

    private async Task<AuthResponse> IssueTokensAsync(
        ApplicationUser user, string? ipAddress, CancellationToken cancellationToken, string? precomputedRefreshToken = null)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var (accessToken, accessExpiresAtUtc) = _jwtTokenGenerator.GenerateAccessToken(user.Id, user.Email!, (IReadOnlyCollection<string>)roles);

        var refreshTokenValue = precomputedRefreshToken ?? GenerateSecureToken();
        var refreshExpiresAtUtc = DateTime.UtcNow.AddDays(_jwtOptions.RefreshTokenExpirationDays);

        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            Token = refreshTokenValue,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = refreshExpiresAtUtc,
            CreatedByIp = ipAddress,
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new AuthResponse(
            user.Id,
            user.Email!,
            roles.ToList(),
            accessToken,
            accessExpiresAtUtc,
            refreshTokenValue,
            refreshExpiresAtUtc);
    }

    private async Task RevokeAllActiveTokensAsync(string userId, string? ipAddress, string reason, DateTime utcNow, CancellationToken cancellationToken)
    {
        var activeTokens = await _dbContext.RefreshTokens
            .Where(rt => rt.UserId == userId && rt.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.Revoke(utcNow, ipAddress, replacedByToken: null, reason);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private static string NormalizeSelfRegistrationRole(string requestedRole)
    {
        if (string.Equals(requestedRole, Roles.Owner, StringComparison.OrdinalIgnoreCase))
        {
            return Roles.Owner;
        }

        if (string.Equals(requestedRole, Roles.Tenant, StringComparison.OrdinalIgnoreCase))
        {
            return Roles.Tenant;
        }

        // Admin is never self-assignable through registration.
        throw new AppValidationException(new[] { $"Role must be '{Roles.Owner}' or '{Roles.Tenant}'." });
    }

    private static string GenerateSecureToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }
}
