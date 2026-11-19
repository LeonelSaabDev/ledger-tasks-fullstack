using TaskManager.Application.Tasks;
using TaskManager.Domain.Tasks;

namespace TaskManager.Application.Tests.Tasks;

/// <summary>
/// Hand-written fake: keeps tasks in a list so service tests run without a database.
/// </summary>
internal sealed class InMemoryTaskRepository : ITaskRepository
{
    public List<TaskItem> Tasks { get; } = [];
    public int SaveChangesCalls { get; private set; }

    // Reuses the real query logic over a list, so tests exercise the same filtering and sorting.
    public Task<PagedResult<TaskItem>> SearchAsync(TaskQuery query, CancellationToken cancellationToken)
    {
        var filtered = query.Filter(Tasks.AsQueryable());
        var items = query.Paginate(query.Sort(filtered)).ToList();
        return Task.FromResult(new PagedResult<TaskItem>(items, query.Page, query.PageSize, filtered.Count()));
    }

    public Task<TaskSummary> GetSummaryAsync(DateOnly today, CancellationToken cancellationToken)
    {
        var open = Tasks.Where(t => t.Status != TaskItemStatus.Completed).ToList();
        var overdue = open.Count(t => t.DueDate is { } due && due < today);
        return Task.FromResult(new TaskSummary(open.Count, Tasks.Count - open.Count, overdue));
    }

    public Task<TaskItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        Task.FromResult(Tasks.FirstOrDefault(t => t.Id == id));

    public Task AddAsync(TaskItem task, CancellationToken cancellationToken)
    {
        Tasks.Add(task);
        return Task.CompletedTask;
    }

    public void Remove(TaskItem task) => Tasks.Remove(task);

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        SaveChangesCalls++;
        return Task.CompletedTask;
    }
}
