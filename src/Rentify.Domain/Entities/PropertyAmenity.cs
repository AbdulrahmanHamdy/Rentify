using Rentify.Domain.Common;

namespace Rentify.Domain.Entities;

/// <summary>
/// Join entity for the Property ↔ Amenity many-to-many relationship. Uses a plain
/// <see cref="BaseEntity"/> (no audit/soft-delete fields) since it's a lightweight
/// association with no history requirement of its own — deleting the association just
/// removes the row. A unique constraint on (PropertyId, AmenityId) is added in the
/// Infrastructure entity configuration.
/// </summary>
public class PropertyAmenity : BaseEntity
{
    public int PropertyId { get; set; }

    public Property? Property { get; set; }

    public int AmenityId { get; set; }

    public Amenity? Amenity { get; set; }
}
