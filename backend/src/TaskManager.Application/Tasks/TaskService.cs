using TaskManager.Domain.Tasks;

namespace TaskManager.Application.Tasks;

public class TaskService(ITaskRepository repository, TimeProvider timeProvider)
{
    public async Task<IReadOnlyList<TaskResponse>> GetAllAsync(CancellationToken cancellationToken)
    {
        var tasks = await repository.GetAllAsync(cancellationToken);
        return tasks.Select(TaskResponse.FromEntity).ToList();
    }

    public async Task<TaskResponse> CreateAsync(CreateTaskRequest request, CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow().UtcDateTime;

        var task = TaskItem.Create(request.Title, request.Description, request.Priority, request.DueDate, now);

        await repository.AddAsync(task, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);

        return TaskResponse.FromEntity(task);
    }
}
