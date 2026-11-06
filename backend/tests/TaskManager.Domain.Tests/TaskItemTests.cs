using TaskManager.Domain.Tasks;

namespace TaskManager.Domain.Tests;

public class TaskItemTests
{
    [Fact]
    public void Create_WithValidData_StartsAsPendingWithoutCompletedAt()
    {
        // Arrange
        var title = "Buy groceries";

        // Act
        var task = TaskItem.Create(title, description: null, TaskPriority.Medium, dueDate: null);

        // Assert
        Assert.Equal(TaskItemStatus.Pending, task.Status);
        Assert.Null(task.CompletedAt);
    }
}
