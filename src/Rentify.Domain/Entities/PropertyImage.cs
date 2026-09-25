using Rentify.Domain.Common;

namespace Rentify.Domain.Entities;

public class PropertyImage : AuditableEntity
{
    public int PropertyId { get; set; }

    public Property? Property { get; set; }

    public required string Url { get; set; }

    public bool IsPrimary { get; set; }
}
