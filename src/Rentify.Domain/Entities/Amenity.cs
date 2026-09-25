using Rentify.Domain.Common;

namespace Rentify.Domain.Entities;

/// <summary>A reusable amenity (e.g. "Pool", "Parking", "Gym") that can be attached to many Properties.</summary>
public class Amenity : AuditableEntity
{
    public required string Name { get; set; }

    public string? Icon { get; set; }

    public ICollection<PropertyAmenity> PropertyAmenities { get; set; } = new List<PropertyAmenity>();
}
