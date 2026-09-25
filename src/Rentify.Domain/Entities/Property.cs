using Rentify.Domain.Common;

namespace Rentify.Domain.Entities;

/// <summary>
/// A property (e.g. "Sunrise Residence") owned by an OwnerProfile. Contains one or more
/// rentable Units. Ownership is enforced at the Application layer (an owner may only
/// manage their own properties) — this entity itself has no authorization logic.
/// </summary>
public class Property : AuditableEntity
{
    public int OwnerProfileId { get; set; }

    public OwnerProfile? Owner { get; set; }

    public required string Name { get; set; }

    public required string Address { get; set; }

    public string? City { get; set; }

    public string? Description { get; set; }

    public ICollection<Unit> Units { get; set; } = new List<Unit>();

    public ICollection<PropertyImage> Images { get; set; } = new List<PropertyImage>();

    public ICollection<PropertyAmenity> PropertyAmenities { get; set; } = new List<PropertyAmenity>();
}
