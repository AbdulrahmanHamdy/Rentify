using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentify.Domain.Entities;

namespace Rentify.Infrastructure.Persistence.Configurations;

public class PropertyAmenityConfiguration : IEntityTypeConfiguration<PropertyAmenity>
{
    public void Configure(EntityTypeBuilder<PropertyAmenity> builder)
    {
        // A property can't have the same amenity listed twice.
        builder.HasIndex(x => new { x.PropertyId, x.AmenityId }).IsUnique();
    }
}
