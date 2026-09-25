using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentify.Domain.Entities;

namespace Rentify.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        builder.Property(x => x.Title).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Message).IsRequired().HasMaxLength(1000);
        builder.Property(x => x.Type).HasConversion<int>();
        builder.Property(x => x.RelatedEntityType).HasMaxLength(100);

        // No FK to ApplicationUser yet — see the note on RentifyDbContext. Indexed on
        // UserId regardless, since "get my notifications" / "get my unread notifications"
        // are the two queries this table exists to serve.
        builder.HasIndex(x => new { x.UserId, x.IsRead });
    }
}
