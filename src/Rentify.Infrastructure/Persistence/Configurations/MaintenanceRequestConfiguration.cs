using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentify.Domain.Entities;

namespace Rentify.Infrastructure.Persistence.Configurations;

public class MaintenanceRequestConfiguration : IEntityTypeConfiguration<MaintenanceRequest>
{
    public void Configure(EntityTypeBuilder<MaintenanceRequest> builder)
    {
        builder.Property(x => x.Title).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Description).IsRequired().HasMaxLength(2000);
        builder.Property(x => x.Priority).HasConversion<int>();
        builder.Property(x => x.Status).HasConversion<int>();

        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.TenantProfileId);

        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.MaintenanceRequests)
            .HasForeignKey(x => x.TenantProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Updates)
            .WithOne(x => x.MaintenanceRequest)
            .HasForeignKey(x => x.MaintenanceRequestId)
            .OnDelete(DeleteBehavior.Cascade); // history rows have no meaning without the request
    }
}
