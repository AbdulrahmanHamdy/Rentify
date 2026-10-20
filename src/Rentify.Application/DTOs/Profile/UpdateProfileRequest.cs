namespace Rentify.Application.DTOs.Profile;

public record UpdateProfileRequest(
    string? FirstName,
    string? LastName,
    string? PhoneNumber,
    string? CompanyName,
    string? NationalId
);
