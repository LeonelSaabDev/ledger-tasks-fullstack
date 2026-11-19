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

    public Task<IReadOnlyList<TaskItem>> GetAllAsync(CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<TaskItem>>(Tasks.ToList());

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
