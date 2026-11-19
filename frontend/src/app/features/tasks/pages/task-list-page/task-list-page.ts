import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { TaskCard } from '../../components/task-card/task-card';
import { isOverdue, Task } from '../../data-access/task.model';
import { errorMessage, TasksApi, TaskTransition } from '../../data-access/tasks-api';

type Filter = 'open' | 'done' | 'all';

/** Container: owns the data and talks to the API; the cards only render and emit. */
@Component({
  imports: [TaskCard, RouterLink],
  selector: 'app-task-list-page',
  styleUrl: './task-list-page.css',
  templateUrl: './task-list-page.html',
})
export class TaskListPage {
  private readonly api = inject(TasksApi);
  private readonly router = inject(Router);

  protected readonly filter = signal<Filter>('open');
  /** Id of the task with a request in flight, to disable its buttons. */
  protected readonly busyId = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);

  protected readonly tasks = rxResource({ stream: () => this.api.getAll() });

  private readonly all = computed(() => this.tasks.value() ?? []);

  protected readonly counts = computed(() => {
    const all = this.all();
    const done = all.filter((t) => t.status === 'Completed').length;
    return {
      open: all.length - done,
      done,
      all: all.length,
      overdue: all.filter((t) => isOverdue(t)).length,
    };
  });

  protected readonly visible = computed(() => {
    const all = this.all();
    switch (this.filter()) {
      case 'open':
        return all.filter((t) => t.status !== 'Completed');
      case 'done':
        return all.filter((t) => t.status === 'Completed');
      default:
        return all;
    }
  });

  protected readonly filters: { value: Filter; label: string }[] = [
    { value: 'open', label: 'Open' },
    { value: 'done', label: 'Done' },
    { value: 'all', label: 'All' },
  ];

  protected loadError = computed(() => (this.tasks.error() ? errorMessage(this.tasks.error()) : null));

  protected changeStatus(task: Task, transition: TaskTransition): void {
    this.run(task, this.api.transition(task.id, transition), (updated) =>
      this.tasks.update((list) => list?.map((t) => (t.id === updated.id ? updated : t))),
    );
  }

  protected edit(task: Task): void {
    this.router.navigate(['/tasks', task.id, 'edit']);
  }

  protected remove(task: Task): void {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;

    this.run(task, this.api.delete(task.id), () =>
      this.tasks.update((list) => list?.filter((t) => t.id !== task.id)),
    );
  }

  /** Runs a request for one task: marks it busy, applies the result locally, surfaces errors. */
  private run<T>(task: Task, request: Observable<T>, onSuccess: (result: T) => void): void {
    this.busyId.set(task.id);
    this.actionError.set(null);

    request.subscribe({
      next: (result) => onSuccess(result),
      error: (error) => {
        this.actionError.set(errorMessage(error));
        this.busyId.set(null);
      },
      complete: () => this.busyId.set(null),
    });
  }
}
