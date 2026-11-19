using TaskManager.Application.Tasks;
using TaskManager.Domain.Tasks;

namespace TaskManager.Application.Tests.Tasks;

public class TaskQueryTests
{
    private static readonly DateTime Now = new(2026, 11, 19, 12, 0, 0, DateTimeKind.Utc);

    private static TaskItem Task(string title, TaskPriority priority = TaskPriority.Medium,
        DateOnly? dueDate = null, int minutesAfterNow = 0, bool completed = false)
    {
        var task = TaskItem.Create(title, null, priority, dueDate, Now.AddMinutes(minutesAfterNow));
        if (completed) task.Complete(Now.AddHours(1));
        return task;
    }

    private static List<string> Run(TaskQuery query, params TaskItem[] tasks) =>
        query.Paginate(query.Sort(query.Filter(tasks.AsQueryable()))).Select(t => t.Title).ToList();

    [Fact]
    public void Constructor_ClampsPagingIntoValidRange()
    {
        var query = new TaskQuery(page: -3, pageSize: 5000);

        Assert.Equal(1, query.Page);
        Assert.Equal(TaskQuery.MaxPageSize, query.PageSize);
    }

    [Theory]
    [InlineData(TaskView.Open, "open")]
    [InlineData(TaskView.Done, "done")]
    public void Filter_ByView_KeepsOnlyMatchingTasks(TaskView view, string expected)
    {
        var result = Run(new TaskQuery(view), Task("open"), Task("done", completed: true));

        Assert.Equal([expected], result);
    }

    [Fact]
    public void Filter_BySearch_IsCaseInsensitiveAndTrimmed()
    {
        var result = Run(new TaskQuery(TaskView.All, search: "  MILK "), Task("Buy milk"), Task("Walk dog"));

        Assert.Equal(["Buy milk"], result);
    }

    [Fact]
    public void Sort_ByPriorityDescending_UsesBusinessOrderNotAlphabetical()
    {
        var result = Run(
            new TaskQuery(TaskView.All, sortBy: TaskSortBy.Priority, direction: SortDirection.Desc),
            Task("low", TaskPriority.Low), Task("high", TaskPriority.High), Task("medium", TaskPriority.Medium));

        Assert.Equal(["high", "medium", "low"], result);
    }

    [Fact]
    public void Sort_ByDueDate_PutsTasksWithoutDateLast()
    {
        var result = Run(
            new TaskQuery(TaskView.All, sortBy: TaskSortBy.DueDate, direction: SortDirection.Asc),
            Task("no date"), Task("later", dueDate: new DateOnly(2026, 12, 10)), Task("sooner", dueDate: new DateOnly(2026, 11, 25)));

        Assert.Equal(["sooner", "later", "no date"], result);
    }

    [Fact]
    public void Paginate_ReturnsTheRequestedSlice()
    {
        var tasks = Enumerable.Range(1, 5).Select(i => Task($"task {i}", minutesAfterNow: i)).ToArray();

        // Newest first by default: task 5, 4 | 3, 2 | 1
        var result = Run(new TaskQuery(TaskView.All, page: 2, pageSize: 2), tasks);

        Assert.Equal(["task 3", "task 2"], result);
    }

    [Fact]
    public void PagedResult_TotalPages_RoundsUpAndIsAtLeastOne()
    {
        Assert.Equal(3, new PagedResult<int>([], 1, 2, TotalCount: 5).TotalPages);
        Assert.Equal(1, new PagedResult<int>([], 1, 10, TotalCount: 0).TotalPages);
    }
}
