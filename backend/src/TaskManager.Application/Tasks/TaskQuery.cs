using TaskManager.Domain.Tasks;

namespace TaskManager.Application.Tasks;

public enum TaskView
{
    Open,
    Done,
    All
}

public enum TaskSortBy
{
    CreatedAt,
    DueDate,
    Priority
}

public enum SortDirection
{
    Asc,
    Desc
}

/// <summary>
/// Normalized list query. Out-of-range paging values are clamped instead of rejected,
/// so a hand-edited URL never breaks the page.
/// </summary>
public sealed record TaskQuery
{
    public const int DefaultPageSize = 10;
    public const int MaxPageSize = 100;

    public TaskView View { get; }
    public string? Search { get; }
    public TaskPriority? Priority { get; }
    public TaskSortBy SortBy { get; }
    public SortDirection Direction { get; }
    public int Page { get; }
    public int PageSize { get; }

    public TaskQuery(
        TaskView view = TaskView.Open,
        string? search = null,
        TaskPriority? priority = null,
        TaskSortBy sortBy = TaskSortBy.CreatedAt,
        SortDirection direction = SortDirection.Desc,
        int page = 1,
        int pageSize = DefaultPageSize)
    {
        View = view;
        Search = string.IsNullOrWhiteSpace(search) ? null : search.Trim();
        Priority = priority;
        SortBy = sortBy;
        Direction = direction;
        Page = Math.Max(1, page);
        PageSize = Math.Clamp(pageSize, 1, MaxPageSize);
    }

    /// <summary>Applies view, priority and search. Pure LINQ, so EF Core translates it to SQL.</summary>
    public IQueryable<TaskItem> Filter(IQueryable<TaskItem> tasks)
    {
        tasks = View switch
        {
            TaskView.Open => tasks.Where(t => t.Status != TaskItemStatus.Completed),
            TaskView.Done => tasks.Where(t => t.Status == TaskItemStatus.Completed),
            _ => tasks
        };

        if (Priority is { } priority)
            tasks = tasks.Where(t => t.Priority == priority);

        if (Search is { } search)
        {
            // ToLower on both sides keeps the match case-insensitive in memory and in SQL alike.
            var term = search.ToLower();
            tasks = tasks.Where(t => t.Title.ToLower().Contains(term));
        }

        return tasks;
    }

    /// <summary>
    /// Orders deterministically: the chosen key first, then newest first and Id,
    /// so the same row never shows up on two pages.
    /// </summary>
    public IOrderedQueryable<TaskItem> Sort(IQueryable<TaskItem> tasks)
    {
        var ascending = Direction == SortDirection.Asc;

        var ordered = SortBy switch
        {
            // Priority is stored as text, so sorting the column would give High < Low < Medium.
            // Rank it explicitly instead.
            TaskSortBy.Priority => ascending
                ? tasks.OrderBy(t => t.Priority == TaskPriority.Low ? 0 : t.Priority == TaskPriority.Medium ? 1 : 2)
                : tasks.OrderByDescending(t => t.Priority == TaskPriority.Low ? 0 : t.Priority == TaskPriority.Medium ? 1 : 2),

            // Tasks without a due date always go last, whatever the direction.
            TaskSortBy.DueDate => ascending
                ? tasks.OrderBy(t => t.DueDate == null).ThenBy(t => t.DueDate)
                : tasks.OrderBy(t => t.DueDate == null).ThenByDescending(t => t.DueDate),

            _ => ascending
                ? tasks.OrderBy(t => t.CreatedAt)
                : tasks.OrderByDescending(t => t.CreatedAt)
        };

        return ordered.ThenByDescending(t => t.CreatedAt).ThenBy(t => t.Id);
    }

    public IQueryable<TaskItem> Paginate(IQueryable<TaskItem> tasks) =>
        tasks.Skip((Page - 1) * PageSize).Take(PageSize);
}

public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount)
{
    public int TotalPages => TotalCount == 0 ? 1 : (int)Math.Ceiling(TotalCount / (double)PageSize);
}

public record TaskSummary(int Open, int Done, int Overdue)
{
    public int Total => Open + Done;
}
