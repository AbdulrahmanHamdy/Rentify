using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentify.Domain.Entities;

namespace Rentify.Infrastructure.Persistence.Configurations;

public class UnitConfiguration : IEntityTypeConfiguration<Unit>
{
    public void Configure(EntityTypeBuilder<Unit> builder)
    {
        builder.Property(x => x.UnitNumber).IsRequired().HasMaxLength(50);
        builder.Property(x => x.MonthlyRent).HasColumnType("decimal(18,2)");
        builder.Property(x => x.DepositAmount).HasColumnType("decimal(18,2)");
        builder.Property(x => x.Status).HasConversion<int>();

        // Two units in the same property can't share a unit number.
        builder.HasIndex(x => new { x.PropertyId, x.UnitNumber }).IsUnique();
        builder.HasIndex(x => x.Status);

        builder.HasMany(x => x.RentalContracts)
            .WithOne(x => x.Unit)
            .HasForeignKey(x => x.UnitId)
            // Restrict: a unit's contract history must not disappear because someone
            // deleted the unit; removing a unit from listing should be done via a status
            // change / soft delete, not by destroying its contract history.
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.MaintenanceRequests)
            .WithOne(x => x.Unit)
            .HasForeignKey(x => x.UnitId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
