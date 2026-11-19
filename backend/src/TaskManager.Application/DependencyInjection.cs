using Microsoft.Extensions.DependencyInjection;
using TaskManager.Application.Tasks;

namespace TaskManager.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<TaskService>();
        return services;
    }
}
