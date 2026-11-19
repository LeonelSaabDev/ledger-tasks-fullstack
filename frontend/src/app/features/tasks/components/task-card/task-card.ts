import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { isOverdue, Task } from '../../data-access/task.model';
import { TaskTransition } from '../../data-access/tasks-api';

/**
 * Presentational: renders one task and emits user intents.
 * It never talks to the API; the page decides what to do.
 */
@Component({
  imports: [DatePipe],
  selector: 'app-task-card',
  styleUrl: './task-card.css',
  templateUrl: './task-card.html',
  host: {
    '[class.is-completed]': 'task().status === "Completed"',
    '[class.is-overdue]': 'overdue()',
  },
})
export class TaskCard {
  readonly task = input.required<Task>();
  readonly busy = input(false);

  readonly transition = output<TaskTransition>();
  readonly edit = output<void>();
  readonly remove = output<void>();

  protected readonly overdue = computed(() => isOverdue(this.task()));

  protected readonly statusLabel = computed(
    () => ({ Pending: 'Pending', InProgress: 'In progress', Completed: 'Done' })[this.task().status],
  );
}
