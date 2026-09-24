namespace Rentify.Domain.Common;

/// <summary>
/// Base class for every domain entity that uses an integer surrogate key.
/// Kept intentionally minimal: identity only. Auditing lives in <see cref="AuditableEntity"/>
/// so entities that don't need audit tracking aren't forced to carry it.
/// </summary>
public abstract class BaseEntity
{
    public int Id { get; set; }
}

/// <summary>
/// Base class for domain entities that use a non-integer key (e.g. Guid, or a string key
/// such as ApplicationUser's IdentityUser key). Prefer <see cref="BaseEntity"/> unless the
/// entity genuinely needs a different key type.
/// </summary>
/// <typeparam name="TKey">The type of the primary key.</typeparam>
public abstract class BaseEntity<TKey> where TKey : notnull
{
    public required TKey Id { get; set; }
}
