namespace Rentify.Application.DTOs.Auth;

/// <summary>
/// Role must be "Owner" or "Tenant" — self-registration as "Admin" is rejected by
/// AuthService. Full FluentValidation rules (email format, password strength, etc.) land
/// in the dedicated Validation phase; AuthService still performs its own minimal guard
/// clauses in the meantime so this phase is safe to exercise on its own.
/// </summary>
public record RegisterRequest(
    string Email,
    string Password,
    string Role,
    string? FirstName,
    string? LastName,
    string? PhoneNumber);
