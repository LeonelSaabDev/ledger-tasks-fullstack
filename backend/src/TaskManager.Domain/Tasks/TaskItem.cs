using TaskManager.Domain.Common;

namespace TaskManager.Domain.Tasks;

public class TaskItem
{
    public const int MaxTitleLength = 200;

    public Guid Id { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public TaskItemStatus Status { get; private set; }
    public TaskPriority Priority { get; private set; }
    public DateOnly? DueDate { get; private set; }
    public DateTime? CompletedAt { get; private set; }

    private TaskItem() { }

    public static TaskItem Create(string title, string? description, TaskPriority priority, DateOnly? dueDate)
    {
        return new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = NormalizeTitle(title),
            Description = description,
            Priority = priority,
            DueDate = dueDate,
            Status = TaskItemStatus.Pending
        };
    }

    public void Start()
    {
        if (Status != TaskItemStatus.Pending)
            throw new DomainException("Only pending tasks can be started.");

        Status = TaskItemStatus.InProgress;
    }

    public void Complete(DateTime now)
    {
        if (Status == TaskItemStatus.Completed)
            throw new DomainException("Task is already completed.");

        Status = TaskItemStatus.Completed;
        CompletedAt = now;
    }

    public void Reopen()
    {
        if (Status != TaskItemStatus.Completed)
            throw new DomainException("Only completed tasks can be reopened.");

        Status = TaskItemStatus.Pending;
        CompletedAt = null;
    }

    public void UpdateDetails(string title, string? description, TaskPriority priority, DateOnly? dueDate)
    {
        Title = NormalizeTitle(title);
        Description = description;
        Priority = priority;
        DueDate = dueDate;
    }

    private static string NormalizeTitle(string title)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("Title is required.");

        var trimmedTitle = title.Trim();

        if (trimmedTitle.Length > MaxTitleLength)
            throw new DomainException($"Title cannot exceed {MaxTitleLength} characters.");

        return trimmedTitle;
    }
}
