using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentify.Domain.Entities;
using Rentify.Infrastructure.Identity;

namespace Rentify.Infrastructure.Persistence.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        builder.Property(x => x.Token).IsRequired().HasMaxLength(512);
        builder.Property(x => x.CreatedByIp).HasMaxLength(45); // fits IPv6
        builder.Property(x => x.RevokedByIp).HasMaxLength(45);
        builder.Property(x => x.ReplacedByToken).HasMaxLength(512);
        builder.Property(x => x.ReasonRevoked).HasMaxLength(200);

        builder.HasIndex(x => x.Token).IsUnique();

        // Supports the "clean expired refresh tokens" background job scanning by user/expiry.
        builder.HasIndex(x => new { x.UserId, x.ExpiresAt });

        // Cascade here (unlike Owner/Tenant Restrict): a refresh token has no business/
        // financial history worth protecting, so deleting a user should just take their
        // sessions with it.
        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
