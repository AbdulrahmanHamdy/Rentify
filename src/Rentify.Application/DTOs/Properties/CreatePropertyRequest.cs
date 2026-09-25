namespace Rentify.Application.DTOs.Properties;

/// <summary>
/// The caller's OwnerProfile is resolved server-side from the authenticated user
/// (ICurrentUserService) in PropertyService — never accepted as a field here, or a caller
/// could create a property under someone else's OwnerProfile simply by supplying a
/// different id.
/// </summary>
public record CreatePropertyRequest(
    string Name,
    string Address,
    string? City,
    string? Description);
