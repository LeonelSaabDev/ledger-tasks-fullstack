using TaskManager.Application.Common;
using TaskManager.Domain.Tasks;

namespace TaskManager.Application.Tasks;

public class TaskService(ITaskRepository repository, TimeProvider timeProvider)
{
    public async Task<PagedResult<TaskResponse>> SearchAsync(TaskQuery query, CancellationToken cancellationToken)
    {
        var page = await repository.SearchAsync(query, cancellationToken);
        return new PagedResult<TaskResponse>(
            page.Items.Select(TaskResponse.FromEntity).ToList(), page.Page, page.PageSize, page.TotalCount);
    }

    public Task<TaskSummary> GetSummaryAsync(CancellationToken cancellationToken) =>
        repository.GetSummaryAsync(DateOnly.FromDateTime(UtcNow()), cancellationToken);

    public async Task<TaskResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var task = await GetExistingAsync(id, cancellationToken);
        return TaskResponse.FromEntity(task);
    }

    public async Task<TaskResponse> CreateAsync(CreateTaskRequest request, CancellationToken cancellationToken)
    {
        var task = TaskItem.Create(request.Title, request.Description, request.Priority, request.DueDate, UtcNow());

        await repository.AddAsync(task, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);

        return TaskResponse.FromEntity(task);
    }

    public Task<TaskResponse> UpdateDetailsAsync(Guid id, UpdateTaskRequest request, CancellationToken cancellationToken) =>
        ModifyAsync(id, task => task.UpdateDetails(request.Title, request.Description, request.Priority, request.DueDate), cancellationToken);

    public Task<TaskResponse> StartAsync(Guid id, CancellationToken cancellationToken) =>
        ModifyAsync(id, task => task.Start(), cancellationToken);

    public Task<TaskResponse> CompleteAsync(Guid id, CancellationToken cancellationToken) =>
        ModifyAsync(id, task => task.Complete(UtcNow()), cancellationToken);

    public Task<TaskResponse> ReopenAsync(Guid id, CancellationToken cancellationToken) =>
        ModifyAsync(id, task => task.Reopen(), cancellationToken);

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var task = await GetExistingAsync(id, cancellationToken);

        repository.Remove(task);
        await repository.SaveChangesAsync(cancellationToken);
    }

    // Every state-changing use case follows the same shape: load, let the domain act, save, map.
    private async Task<TaskResponse> ModifyAsync(Guid id, Action<TaskItem> change, CancellationToken cancellationToken)
    {
        var task = await GetExistingAsync(id, cancellationToken);

        change(task);
        await repository.SaveChangesAsync(cancellationToken);

        return TaskResponse.FromEntity(task);
    }

    private async Task<TaskItem> GetExistingAsync(Guid id, CancellationToken cancellationToken) =>
        await repository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException($"Task '{id}' was not found.");

    private DateTime UtcNow() => timeProvider.GetUtcNow().UtcDateTime;
}
