using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentify.Domain.Entities;

namespace Rentify.Infrastructure.Persistence.Configurations;

public class AmenityConfiguration : IEntityTypeConfiguration<Amenity>
{
    public void Configure(EntityTypeBuilder<Amenity> builder)
    {
        builder.Property(x => x.Name).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Icon).HasMaxLength(100);

        builder.HasIndex(x => x.Name).IsUnique();

        builder.HasMany(x => x.PropertyAmenities)
            .WithOne(x => x.Amenity)
            .HasForeignKey(x => x.AmenityId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
