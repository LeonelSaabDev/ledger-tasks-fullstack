using TaskManager.Application.Tasks;
using TaskManager.Domain.Tasks;

namespace TaskManager.Api.Endpoints;

public static class TaskEndpoints
{
    public static IEndpointRouteBuilder MapTaskEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tasks").WithTags("Tasks");

        group.MapGet("/", async ([AsParameters] TaskListParameters parameters, TaskService service, CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.SearchAsync(parameters.ToQuery(), cancellationToken)));

        group.MapGet("/summary", async (TaskService service, CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.GetSummaryAsync(cancellationToken)));

        group.MapGet("/{id:guid}", async (Guid id, TaskService service, CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.GetByIdAsync(id, cancellationToken)));

        group.MapPost("/", async (CreateTaskRequest request, TaskService service, CancellationToken cancellationToken) =>
        {
            var task = await service.CreateAsync(request, cancellationToken);
            return TypedResults.Created($"/api/tasks/{task.Id}", task);
        });

        group.MapPut("/{id:guid}", async (Guid id, UpdateTaskRequest request, TaskService service, CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.UpdateDetailsAsync(id, request, cancellationToken)));

        // State transitions are actions, not field edits, so each one gets its own endpoint.
        group.MapPost("/{id:guid}/start", async (Guid id, TaskService service, CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.StartAsync(id, cancellationToken)));

        group.MapPost("/{id:guid}/complete", async (Guid id, TaskService service, CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.CompleteAsync(id, cancellationToken)));

        group.MapPost("/{id:guid}/reopen", async (Guid id, TaskService service, CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.ReopenAsync(id, cancellationToken)));

        group.MapDelete("/{id:guid}", async (Guid id, TaskService service, CancellationToken cancellationToken) =>
        {
            await service.DeleteAsync(id, cancellationToken);
            return TypedResults.NoContent();
        });

        return app;
    }
}

/// <summary>
/// Query string for GET /api/tasks, e.g. ?view=Open&amp;search=milk&amp;sortBy=DueDate&amp;direction=Asc&amp;page=2.
/// Every value is optional; the defaults live in <see cref="TaskQuery"/>.
/// </summary>
public record TaskListParameters(
    TaskView? View,
    string? Search,
    TaskPriority? Priority,
    TaskSortBy? SortBy,
    SortDirection? Direction,
    int? Page,
    int? PageSize)
{
    public TaskQuery ToQuery() => new(
        View ?? TaskView.Open,
        Search,
        Priority,
        SortBy ?? TaskSortBy.CreatedAt,
        Direction ?? SortDirection.Desc,
        Page ?? 1,
        PageSize ?? TaskQuery.DefaultPageSize);
}
