using TaskManager.Application.Tasks;

namespace TaskManager.Api.Endpoints;

public static class TaskEndpoints
{
    public static IEndpointRouteBuilder MapTaskEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tasks").WithTags("Tasks");

        group.MapGet("/", async (TaskService service, CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.GetAllAsync(cancellationToken)));

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
