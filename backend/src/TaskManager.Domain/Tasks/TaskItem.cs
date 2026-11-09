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
        if(string.IsNullOrWhiteSpace(title))
            throw new DomainException("Title is required.");

        if (title.Length > MaxTitleLength)
            throw new DomainException($"Title cannot exceed {MaxTitleLength} characters.");

        return new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = title,
            Description = description,
            Priority = priority,
            DueDate = dueDate,
            Status = TaskItemStatus.Pending
        };
    }
}
