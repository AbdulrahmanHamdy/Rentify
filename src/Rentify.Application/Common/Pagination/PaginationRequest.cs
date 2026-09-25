namespace Rentify.Application.Common.Pagination;

/// <summary>
/// Reusable query parameters for every paged list endpoint (Properties, Units, and later
/// Contracts/Payments/MaintenanceRequests/Notifications). Bound directly from the query
/// string in controllers (e.g. `[FromQuery] PaginationRequest request`).
///
/// Deliberately plain and framework-agnostic (no EF Core / MVC types) so it lives safely in
/// the Application layer. Each repository decides for itself which columns "SortBy" and
/// "Search" are actually allowed to target — this type only carries the raw request.
/// </summary>
public class PaginationRequest
{
    private const int MaxPageSize = 50;
    private const int DefaultPageSize = 10;

    private int _page = 1;
    private int _pageSize = DefaultPageSize;

    /// <summary>1-based page number. Values below 1 are clamped to 1.</summary>
    public int Page
    {
        get => _page;
        set => _page = value < 1 ? 1 : value;
    }

    /// <summary>Items per page. Clamped to [1, 50] so a client can never request a huge collection in one call.</summary>
    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value switch
        {
            < 1 => DefaultPageSize,
            > MaxPageSize => MaxPageSize,
            _ => value,
        };
    }

    /// <summary>Free-text search term. Each repository defines which column(s) it matches against.</summary>
    public string? Search { get; set; }

    /// <summary>Column name to sort by. Each repository maps this against its own whitelist of sortable columns and falls back to a default sort for an unrecognized value.</summary>
    public string? SortBy { get; set; }

    /// <summary>"asc" (default) or "desc" — anything else is treated as ascending.</summary>
    public string? SortDirection { get; set; }

    public bool IsDescending => string.Equals(SortDirection, "desc", StringComparison.OrdinalIgnoreCase);
}
