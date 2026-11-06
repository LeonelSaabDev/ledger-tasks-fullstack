using TaskManager.Domain.Tasks;
using TaskManager.Domain.Common;

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

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithEmptyTitle_ThrowsDomainException(string invalidTitle)
    {
        // Act & Assert
        Assert.Throws<DomainException>(
            () => TaskItem.Create(invalidTitle, description: null, TaskPriority.Medium, dueDate: null));
    }
}
