namespace Rentify.Application.DTOs.Properties;

/// <summary>
/// Property as returned to API clients. Used for both the paged list (GET /api/properties)
/// and a single property (GET /api/properties/{id}) — a separate "detail" DTO isn't needed
/// since a Property's Units are fetched through their own paged endpoint
/// (GET /api/properties/{propertyId}/units), not embedded here.
/// </summary>
public record PropertyDto(
    int Id,
    int OwnerProfileId,
    string Name,
    string Address,
    string? City,
    string? Description,
    int UnitCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
