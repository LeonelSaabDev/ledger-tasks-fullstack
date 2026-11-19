using Microsoft.Extensions.Time.Testing;
using TaskManager.Application.Common;
using TaskManager.Application.Tasks;
using TaskManager.Domain.Tasks;

namespace TaskManager.Application.Tests.Tasks;

public class TaskServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 19, 12, 0, 0, TimeSpan.Zero);

    private readonly InMemoryTaskRepository _repository = new();
    private readonly FakeTimeProvider _timeProvider = new(Now);
    private readonly TaskService _service;

    public TaskServiceTests()
    {
        _service = new TaskService(_repository, _timeProvider);
    }

    private async Task<TaskResponse> CreateTaskAsync(string title = "Buy milk") =>
        await _service.CreateAsync(
            new CreateTaskRequest(title, Description: null, TaskPriority.Medium, DueDate: null),
            CancellationToken.None);

    [Fact]
    public async Task CreateAsync_UsesCurrentTimeAndPersists()
    {
        var created = await CreateTaskAsync();

        Assert.Equal(Now.UtcDateTime, created.CreatedAt);
        Assert.Single(_repository.Tasks);
        Assert.Equal(1, _repository.SaveChangesCalls);
    }

    [Fact]
    public async Task GetByIdAsync_WhenTaskDoesNotExist_ThrowsNotFoundException()
    {
        await Assert.ThrowsAsync<NotFoundException>(
            () => _service.GetByIdAsync(Guid.NewGuid(), CancellationToken.None));
    }

    [Fact]
    public async Task GetByIdAsync_WhenTaskExists_ReturnsIt()
    {
        var created = await CreateTaskAsync();

        var found = await _service.GetByIdAsync(created.Id, CancellationToken.None);

        Assert.Equal(created.Id, found.Id);
    }

    [Fact]
    public async Task UpdateDetailsAsync_ChangesDetailsAndPersists()
    {
        var created = await CreateTaskAsync();
        var request = new UpdateTaskRequest("Buy oat milk", "Organic", TaskPriority.High, DueDate: null);

        var updated = await _service.UpdateDetailsAsync(created.Id, request, CancellationToken.None);

        Assert.Equal("Buy oat milk", updated.Title);
        Assert.Equal(TaskPriority.High, updated.Priority);
        Assert.Equal(2, _repository.SaveChangesCalls);
    }

    [Fact]
    public async Task CompleteAsync_RecordsCurrentTimeAsCompletion()
    {
        var created = await CreateTaskAsync();
        _timeProvider.Advance(TimeSpan.FromHours(3));

        var completed = await _service.CompleteAsync(created.Id, CancellationToken.None);

        Assert.Equal(TaskItemStatus.Completed, completed.Status);
        Assert.Equal(Now.AddHours(3).UtcDateTime, completed.CompletedAt);
    }

    [Fact]
    public async Task StartAsync_ThenReopenAfterComplete_FollowsLifecycle()
    {
        var created = await CreateTaskAsync();

        var started = await _service.StartAsync(created.Id, CancellationToken.None);
        await _service.CompleteAsync(created.Id, CancellationToken.None);
        var reopened = await _service.ReopenAsync(created.Id, CancellationToken.None);

        Assert.Equal(TaskItemStatus.InProgress, started.Status);
        Assert.Equal(TaskItemStatus.Pending, reopened.Status);
        Assert.Null(reopened.CompletedAt);
    }

    [Fact]
    public async Task SearchAsync_MapsThePageToResponses()
    {
        await CreateTaskAsync("first");
        await CreateTaskAsync("second");

        var page = await _service.SearchAsync(new TaskQuery(TaskView.All, pageSize: 1), CancellationToken.None);

        Assert.Single(page.Items);
        Assert.Equal(2, page.TotalCount);
        Assert.Equal(2, page.TotalPages);
    }

    [Fact]
    public async Task GetSummaryAsync_CountsOverdueAgainstToday()
    {
        var tomorrow = DateOnly.FromDateTime(Now.UtcDateTime).AddDays(1);
        await _service.CreateAsync(
            new CreateTaskRequest("due tomorrow", null, TaskPriority.Medium, tomorrow), CancellationToken.None);
        _timeProvider.Advance(TimeSpan.FromDays(3));

        var summary = await _service.GetSummaryAsync(CancellationToken.None);

        Assert.Equal(1, summary.Open);
        Assert.Equal(1, summary.Overdue);
    }

    [Fact]
    public async Task DeleteAsync_RemovesTheTask()
    {
        var created = await CreateTaskAsync();

        await _service.DeleteAsync(created.Id, CancellationToken.None);

        Assert.Empty(_repository.Tasks);
    }

    [Fact]
    public async Task DeleteAsync_WhenTaskDoesNotExist_ThrowsNotFoundException()
    {
        await Assert.ThrowsAsync<NotFoundException>(
            () => _service.DeleteAsync(Guid.NewGuid(), CancellationToken.None));
    }
}
