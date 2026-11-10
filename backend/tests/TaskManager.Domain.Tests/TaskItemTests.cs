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

    [Fact]
    public void Start_WhenPending_ChangesStatusToInProgress()
    {
        // Arrange
        var task = TaskItem.Create("Buy Milk", description: null, TaskPriority.Medium, dueDate: null);

        // Act
        task.Start();

        //Assert
        Assert.Equal(TaskItemStatus.InProgress, task.Status);
    }

    [Fact]
    public void Complete_WhenPending_SetsStatusAndCompletedAt()
    {
        // Arrange
        var task = TaskItem.Create("Buy Milk", description: null, TaskPriority.Medium, dueDate: null);
        var now = new DateTime(2026, 11, 9, 15, 30, 0, DateTimeKind.Utc);

        // Act
        task.Complete(now);

        // Assert
        Assert.Equal(TaskItemStatus.Completed, task.Status);
        Assert.Equal(now, task.CompletedAt);
    }

    [Fact]
    public void Complete_WhenAlreadyCompleted_ThrowsDomainException()
    {
        // Arrange
        var task = TaskItem.Create("Buy milk", description: null, TaskPriority.Medium, dueDate: null);
        var now = new DateTime(2026, 11, 9, 15, 30, 0, DateTimeKind.Utc);
        task.Complete(now);

        // Act & Assert
        Assert.Throws<DomainException>(() => task.Complete(now));
    }

    [Fact]
    public void Reopen_WhenCompleted_ReturnsToPendingAndClearsCompletedAt()
    {
        // Arrange
        var task = TaskItem.Create("Buy milk", description: null, TaskPriority.Medium, dueDate: null);
        var now = new DateTime(2026, 11, 9, 15, 30, 0, DateTimeKind.Utc);
        task.Complete(now);

        // Act
        task.Reopen();

        // Assert
        Assert.Equal(TaskItemStatus.Pending, task.Status);
        Assert.Null(task.CompletedAt);
    }

    [Fact]
    public void Reopen_WhenNotCompleted_ThrowsDomainException()
    {
        // Arrange
        var task = TaskItem.Create("Buy milk", description: null, TaskPriority.Medium, dueDate: null);

        // Act & Assert
        Assert.Throws<DomainException>(() => task.Reopen());
    }
}
