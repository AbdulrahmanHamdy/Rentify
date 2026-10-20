namespace Rentify.Application.DTOs.Profile;

public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword
);
