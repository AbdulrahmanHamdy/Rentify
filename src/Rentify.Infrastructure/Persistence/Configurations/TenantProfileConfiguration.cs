using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentify.Domain.Entities;
using Rentify.Infrastructure.Identity;

namespace Rentify.Infrastructure.Persistence.Configurations;

public class TenantProfileConfiguration : IEntityTypeConfiguration<TenantProfile>
{
    public void Configure(EntityTypeBuilder<TenantProfile> builder)
    {
        builder.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        builder.Property(x => x.PhoneNumber).HasMaxLength(30);
        builder.Property(x => x.NationalId).HasMaxLength(50);

        builder.HasIndex(x => x.UserId).IsUnique();

        // FK to AspNetUsers now that ApplicationUser exists (Phase 4) — see the matching
        // note in OwnerProfileConfiguration.
        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // RentalContracts/MaintenanceRequests are configured from the "many" side
        // (RentalContractConfiguration / MaintenanceRequestConfiguration) to keep each
        // relationship's delete behavior defined in exactly one place.
    }
}
