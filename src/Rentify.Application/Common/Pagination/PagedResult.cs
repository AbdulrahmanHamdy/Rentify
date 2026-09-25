namespace Rentify.Application.Common.Pagination;

/// <summary>
/// Generic paged response envelope. Repositories build `PagedResult&lt;TEntity&gt;`;
/// services map it to `PagedResult&lt;TDto&gt;` via <see cref="Map{TDestination}"/> before
/// it reaches a controller, so an EF Core entity is never returned across the Application
/// boundary.
/// </summary>
public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; }

    public int Page { get; }

    public int PageSize { get; }

    public int TotalCount { get; }

    public int TotalPages => TotalCount == 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);

    public bool HasPreviousPage => Page > 1;

    public bool HasNextPage => Page < TotalPages;

    public PagedResult(IReadOnlyList<T> items, int totalCount, int page, int pageSize)
    {
        Items = items;
        TotalCount = totalCount;
        Page = page;
        PageSize = pageSize;
    }

    /// <summary>Projects Items to a different shape (e.g. entity -> DTO) while carrying paging metadata over unchanged.</summary>
    public PagedResult<TDestination> Map<TDestination>(Func<T, TDestination> selector) =>
        new(Items.Select(selector).ToList(), TotalCount, Page, PageSize);
}
