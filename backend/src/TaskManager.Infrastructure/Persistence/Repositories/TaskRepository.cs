using Microsoft.EntityFrameworkCore;
using TaskManager.Application.Tasks;
using TaskManager.Domain.Tasks;

namespace TaskManager.Infrastructure.Persistence.Repositories;

public class TaskRepository(AppDbContext context) : ITaskRepository
{
    public async Task<PagedResult<TaskItem>> SearchAsync(TaskQuery query, CancellationToken cancellationToken)
    {
        var filtered = query.Filter(context.Tasks.AsNoTracking());

        // Two round trips: one COUNT for the pager, one page of rows.
        var totalCount = await filtered.CountAsync(cancellationToken);
        var items = await query.Paginate(query.Sort(filtered)).ToListAsync(cancellationToken);

        return new PagedResult<TaskItem>(items, query.Page, query.PageSize, totalCount);
    }

    public async Task<TaskSummary> GetSummaryAsync(DateOnly today, CancellationToken cancellationToken)
    {
        // A single grouped query instead of three separate COUNTs.
        var counts = await context.Tasks
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Done = g.Count(t => t.Status == TaskItemStatus.Completed),
                Open = g.Count(t => t.Status != TaskItemStatus.Completed),
                Overdue = g.Count(t => t.Status != TaskItemStatus.Completed && t.DueDate != null && t.DueDate < today)
            })
            .FirstOrDefaultAsync(cancellationToken);

        return counts is null
            ? new TaskSummary(0, 0, 0)
            : new TaskSummary(counts.Open, counts.Done, counts.Overdue);
    }

    public Task<TaskItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        context.Tasks.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

    public async Task AddAsync(TaskItem task, CancellationToken cancellationToken) =>
        await context.Tasks.AddAsync(task, cancellationToken);

    public void Remove(TaskItem task) =>
        context.Tasks.Remove(task);

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        context.SaveChangesAsync(cancellationToken);
}
