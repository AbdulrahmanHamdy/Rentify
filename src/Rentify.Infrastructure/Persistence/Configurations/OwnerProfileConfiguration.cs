using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentify.Domain.Entities;
using Rentify.Infrastructure.Identity;

namespace Rentify.Infrastructure.Persistence.Configurations;

public class OwnerProfileConfiguration : IEntityTypeConfiguration<OwnerProfile>
{
    public void Configure(EntityTypeBuilder<OwnerProfile> builder)
    {
        builder.Property(x => x.UserId).IsRequired().HasMaxLength(450); // matches Identity's default key length
        builder.Property(x => x.CompanyName).HasMaxLength(200);
        builder.Property(x => x.PhoneNumber).HasMaxLength(30);

        // One Identity user maps to at most one OwnerProfile.
        builder.HasIndex(x => x.UserId).IsUnique();

        // No navigation property to ApplicationUser (kept out of the Domain entity on
        // purpose — see OwnerProfile's doc comment), but now that ApplicationUser exists
        // (Phase 4) the FK constraint itself can be enforced at the database level.
        // Restrict: deleting a user who still owns properties should fail loudly.
        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Properties)
            .WithOne(x => x.Owner)
            .HasForeignKey(x => x.OwnerProfileId)
            // Restrict, not Cascade: deleting an owner who still has properties on record
            // should fail loudly rather than silently wipe out property/financial history.
            .OnDelete(DeleteBehavior.Restrict);
    }
}
