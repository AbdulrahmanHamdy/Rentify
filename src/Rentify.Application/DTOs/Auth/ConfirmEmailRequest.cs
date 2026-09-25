namespace Rentify.Application.DTOs.Auth;

public record ConfirmEmailRequest(string UserId, string Token);
