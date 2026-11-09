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

    [Fact]
    public void Create_WithTitleLongerThan200Characters_ThrowsDomainException()
    {
        // Arrange
        var longTitle = new string('a', 201);

        // Act & Assert
        Assert.Throws<DomainException>(
            () => TaskItem.Create(longTitle, description: null, TaskPriority.Medium, dueDate: null));
    }

    [Fact]
    public void Create_WithTitleOf200Characters_IsValid()
    {
        // Arrange
        var title = new string('a', 200);

        // Act
        var task = TaskItem.Create(title, description: null, TaskPriority.Medium, dueDate: null);

        // Assert
        Assert.Equal(title, task.Title);
    }

    [Fact]
    public void Create_WithSurroundingSpaces_TrimsTitle()
    {
        // Arrange
        var title = "   Buy milk   ";

        // Act
        var task = TaskItem.Create(title, description: null, TaskPriority.Medium, dueDate: null);

        // Assert
        Assert.Equal("Buy milk", task.Title);
    }
}
