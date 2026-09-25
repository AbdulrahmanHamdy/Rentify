using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentify.Domain.Entities;

namespace Rentify.Infrastructure.Persistence.Configurations;

public class PropertyConfiguration : IEntityTypeConfiguration<Property>
{
    public void Configure(EntityTypeBuilder<Property> builder)
    {
        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Address).IsRequired().HasMaxLength(300);
        builder.Property(x => x.City).HasMaxLength(100);
        builder.Property(x => x.Description).HasMaxLength(2000);

        builder.HasIndex(x => x.City);

        builder.HasMany(x => x.Units)
            .WithOne(x => x.Property)
            .HasForeignKey(x => x.PropertyId)
            .OnDelete(DeleteBehavior.Cascade); // a Unit has no meaning without its Property

        builder.HasMany(x => x.Images)
            .WithOne(x => x.Property)
            .HasForeignKey(x => x.PropertyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.PropertyAmenities)
            .WithOne(x => x.Property)
            .HasForeignKey(x => x.PropertyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
