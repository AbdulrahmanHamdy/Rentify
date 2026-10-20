namespace Rentify.Application.DTOs.Profile;

public record UserProfileDto(
    string UserId,
    string Email,
    string? FirstName,
    string? LastName,
    string? PhoneNumber,
    IReadOnlyList<string> Roles,
    DateTime CreatedAt,
    int? OwnerProfileId = null,
    string? CompanyName = null,
    int PropertiesCount = 0,
    int UnitsCount = 0,
    int? TenantProfileId = null,
    string? NationalId = null,
    int ActiveContractsCount = 0
);
