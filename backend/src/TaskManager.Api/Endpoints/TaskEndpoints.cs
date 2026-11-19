using TaskManager.Application.Tasks;

namespace TaskManager.Api.Endpoints;

public static class TaskEndpoints
{
    public static IEndpointRouteBuilder MapTaskEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tasks").WithTags("Tasks");

        group.MapGet("/", async (TaskService service, CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.GetAllAsync(cancellationToken)));

        group.MapPost("/", async (CreateTaskRequest request, TaskService service, CancellationToken cancellationToken) =>
        {
            var task = await service.CreateAsync(request, cancellationToken);
            return TypedResults.Created($"/api/tasks/{task.Id}", task);
        });

        return app;
    }
}
