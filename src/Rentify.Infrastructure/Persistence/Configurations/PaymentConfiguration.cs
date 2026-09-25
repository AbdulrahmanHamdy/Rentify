using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentify.Domain.Entities;

namespace Rentify.Infrastructure.Persistence.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.Property(x => x.Amount).HasColumnType("decimal(18,2)");
        builder.Property(x => x.Status).HasConversion<int>();
        builder.Property(x => x.Method).HasConversion<int?>();
        builder.Property(x => x.ReferenceNumber).HasMaxLength(100);

        // Supports the overdue-payments background job: "find Pending payments whose
        // DueDate has passed" scans by (Status, DueDate).
        builder.HasIndex(x => new { x.Status, x.DueDate });
        builder.HasIndex(x => x.TenantProfileId);

        builder.HasOne(x => x.Tenant)
            .WithMany()
            .HasForeignKey(x => x.TenantProfileId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
