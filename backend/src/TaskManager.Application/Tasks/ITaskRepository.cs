using TaskManager.Domain.Tasks;

namespace TaskManager.Application.Tasks;

public interface ITaskRepository
{
    Task<PagedResult<TaskItem>> SearchAsync(TaskQuery query, CancellationToken cancellationToken);
    Task<TaskSummary> GetSummaryAsync(DateOnly today, CancellationToken cancellationToken);
    Task<TaskItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task AddAsync(TaskItem task, CancellationToken cancellationToken);
    void Remove(TaskItem task);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
