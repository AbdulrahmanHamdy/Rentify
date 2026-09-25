namespace Rentify.Application.DTOs.Auth;

public record RegisterResponse(
    string UserId,
    string Email,
    string Role,
    string Message);
