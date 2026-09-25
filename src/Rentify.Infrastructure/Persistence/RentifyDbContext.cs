using System.Linq.Expressions;
using System.Reflection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Rentify.Application.Interfaces;
using Rentify.Domain.Common;
using Rentify.Domain.Entities;
using Rentify.Infrastructure.Identity;

namespace Rentify.Infrastructure.Persistence;

/// <summary>
/// The single EF Core DbContext for Rentify. Now an IdentityDbContext (Phase 4) — this adds
/// the AspNetUsers/AspNetRoles/AspNetUserRoles/etc. tables alongside the ones from Phase 3.
/// IdentityDbContext&lt;ApplicationUser, IdentityRole, string&gt; is used rather than the
/// default IdentityUser/IdentityRole&lt;Guid&gt; because RefreshToken/OwnerProfile/TenantProfile
/// already store UserId as a plain `string` (see their Phase 2/3 doc comments) — string keys
/// keep that consistent instead of introducing a Guid-vs-string mismatch.
/// </summary>
public class RentifyDbContext : IdentityDbContext<ApplicationUser, IdentityRole, string>
{
    private readonly ICurrentUserService _currentUserService;

    public RentifyDbContext(DbContextOptions<RentifyDbContext> options, ICurrentUserService currentUserService)
        : base(options)
    {
        _currentUserService = currentUserService;
    }

    public DbSet<OwnerProfile> OwnerProfiles => Set<OwnerProfile>();
    public DbSet<TenantProfile> TenantProfiles => Set<TenantProfile>();
    public DbSet<Property> Properties => Set<Property>();
    public DbSet<PropertyImage> PropertyImages => Set<PropertyImage>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<Amenity> Amenities => Set<Amenity>();
    public DbSet<PropertyAmenity> PropertyAmenities => Set<PropertyAmenity>();
    public DbSet<RentalContract> RentalContracts => Set<RentalContract>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<MaintenanceRequest> MaintenanceRequests => Set<MaintenanceRequest>();
    public DbSet<MaintenanceUpdate> MaintenanceUpdates => Set<MaintenanceUpdate>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Applies every IEntityTypeConfiguration<T> in this assembly (Persistence/Configurations/*).
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(RentifyDbContext).Assembly);

        ApplySoftDeleteQueryFilters(modelBuilder);
    }

    /// <summary>
    /// Adds `WHERE IsDeleted = 0` as a global query filter to every entity type deriving from
    /// AuditableEntity, so soft-deleted rows are invisible by default without every query
    /// needing to remember to filter them out. Use IgnoreQueryFilters() explicitly on the
    /// rare query that genuinely needs to see deleted rows (e.g. an admin "trash" view).
    /// </summary>
    private static void ApplySoftDeleteQueryFilters(ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (!typeof(AuditableEntity).IsAssignableFrom(entityType.ClrType))
            {
                continue;
            }

            var method = typeof(RentifyDbContext)
                .GetMethod(nameof(BuildSoftDeleteFilter), BindingFlags.NonPublic | BindingFlags.Static)!
                .MakeGenericMethod(entityType.ClrType);

            var filter = method.Invoke(null, null);
            entityType.SetQueryFilter((LambdaExpression)filter!);
        }
    }

    private static LambdaExpression BuildSoftDeleteFilter<TEntity>() where TEntity : AuditableEntity
    {
        Expression<Func<TEntity, bool>> filter = e => !e.IsDeleted;
        return filter;
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditInformation();
        return await base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        ApplyAuditInformation();
        return base.SaveChanges();
    }

    /// <summary>
    /// Populates Created*/Updated* on every tracked AuditableEntity, and converts a hard
    /// Delete into a soft delete (IsDeleted = true, entity kept as Modified) so history is
    /// never actually destroyed for entities that opted into AuditableEntity in the first
    /// place. Entities that are plain BaseEntity (RefreshToken, PropertyAmenity) are
    /// unaffected and continue to hard-delete as intended.
    /// </summary>
    private void ApplyAuditInformation()
    {
        var utcNow = DateTime.UtcNow;
        var userId = _currentUserService.UserId;

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = utcNow;
                    entry.Entity.CreatedBy = userId;
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdatedAt = utcNow;
                    entry.Entity.UpdatedBy = userId;
                    break;

                case EntityState.Deleted:
                    entry.State = EntityState.Modified;
                    entry.Entity.IsDeleted = true;
                    entry.Entity.DeletedAt = utcNow;
                    entry.Entity.DeletedBy = userId;
                    break;
            }
        }
    }
}
