using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentify.Domain.Entities;
using Rentify.Domain.Enums;

namespace Rentify.Infrastructure.Persistence.Configurations;

public class RentalContractConfiguration : IEntityTypeConfiguration<RentalContract>
{
    public void Configure(EntityTypeBuilder<RentalContract> builder)
    {
        builder.Property(x => x.MonthlyRent).HasColumnType("decimal(18,2)");
        builder.Property(x => x.SecurityDeposit).HasColumnType("decimal(18,2)");
        builder.Property(x => x.Status).HasConversion<int>();

        // EF Core reads/writes the Status backing field even though the property setter is
        // private — the domain entity's Activate()/Cancel()/Terminate()/Expire() methods
        // remain the only way application code can change it.

        builder.HasIndex(x => x.TenantProfileId);
        builder.HasIndex(x => x.Status);

        // Defensive DB-level constraint backing "a unit cannot be rented again while it has
        // an active contract": at most one live (Pending or Active) contract per UnitId.
        // Phase 6 widened this from Active-only to Pending+Active, because creating a
        // contract now reserves the unit — two simultaneous "create" requests must not both
        // succeed. Soft-deleted rows are excluded so they never block a unit. This is a safety
        // net, not the primary enforcement — ContractService checks first and gives a friendly
        // error; ContractRepository translates a violation of this index into a 409.
        builder.HasIndex(x => x.UnitId)
            .IsUnique()
            .HasFilter($"[Status] IN ({(int)ContractStatus.Pending}, {(int)ContractStatus.Active}) AND [IsDeleted] = 0");

        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.RentalContracts)
            .HasForeignKey(x => x.TenantProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Payments)
            .WithOne(x => x.RentalContract)
            .HasForeignKey(x => x.RentalContractId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
