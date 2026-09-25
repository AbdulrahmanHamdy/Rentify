using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentify.Domain.Entities;

namespace Rentify.Infrastructure.Persistence.Configurations;

public class MaintenanceUpdateConfiguration : IEntityTypeConfiguration<MaintenanceUpdate>
{
    public void Configure(EntityTypeBuilder<MaintenanceUpdate> builder)
    {
        builder.Property(x => x.UpdatedByUserId).IsRequired().HasMaxLength(450);
        builder.Property(x => x.Note).HasMaxLength(1000);
        builder.Property(x => x.OldStatus).HasConversion<int?>();
        builder.Property(x => x.NewStatus).HasConversion<int>();
    }
}
