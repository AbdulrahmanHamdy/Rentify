using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentify.Infrastructure.Identity;

namespace Rentify.Infrastructure.Persistence.Configurations;

/// <summary>Configures only the custom properties added on top of IdentityUser — the built-in Identity columns are configured by IdentityDbContext itself.</summary>
public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.Property(x => x.FirstName).HasMaxLength(100);
        builder.Property(x => x.LastName).HasMaxLength(100);
    }
}
