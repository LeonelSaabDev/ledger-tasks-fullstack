import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BoardCard } from '../../components/board-card/board-card';
import { canMove, moved, transitionFor } from '../../data-access/board-rules';
import { DEFAULT_TASK_QUERY, Task, TaskStatus } from '../../data-access/task.model';
import { errorMessage, TasksApi } from '../../data-access/tasks-api';

/** Open tasks are few by nature; done ones pile up, so the board shows only the latest. */
const OPEN_LIMIT = 100;
const DONE_LIMIT = 20;

type Columns = Record<TaskStatus, Task[]>;

/**
 * Container for the kanban board. Moving a card calls the matching domain action
 * (start / complete / reopen). The UI updates instantly (optimistic update) and
 * rolls back if the API rejects the move.
 */
@Component({
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, CdkDragPlaceholder, BoardCard, RouterLink],
  selector: 'app-task-board-page',
  styleUrl: './task-board-page.css',
  templateUrl: './task-board-page.html',
})
export class TaskBoardPage {
  private readonly api = inject(TasksApi);
  private readonly router = inject(Router);

  protected readonly columnDefs: { status: TaskStatus; label: string }[] = [
    { status: 'Pending', label: 'To do' },
    { status: 'InProgress', label: 'In progress' },
    { status: 'Completed', label: 'Done' },
  ];

  private readonly data = rxResource({
    stream: () =>
      forkJoin({
        open: this.api.search({ ...DEFAULT_TASK_QUERY, view: 'Open' }, OPEN_LIMIT),
        done: this.api.search({ ...DEFAULT_TASK_QUERY, view: 'Done' }, DONE_LIMIT),
      }),
  });

  /** Local, editable copy of the server data: resets whenever the data is reloaded. */
  protected readonly columns = linkedSignal<Columns>(() => {
    const data = this.data.value();
    const open = data?.open.items ?? [];
    return {
      Pending: open.filter((t) => t.status === 'Pending'),
      InProgress: open.filter((t) => t.status === 'InProgress'),
      Completed: data?.done.items ?? [],
    };
  });

  protected readonly doneTotal = computed(() => this.data.value()?.done.totalCount ?? 0);
  protected readonly isLoading = this.data.isLoading;
  protected readonly loadError = computed(() => (this.data.error() ? errorMessage(this.data.error()) : null));

  protected readonly moveError = signal<string | null>(null);
  /** Status of the card being dragged, to highlight where it can and cannot go. */
  protected readonly dragging = signal<TaskStatus | null>(null);

  /** CDK asks this before letting a card enter a column. Arrow fn keeps `this`-free. */
  protected readonly allowDrop = (drag: CdkDrag<Task>, drop: CdkDropList<TaskStatus>): boolean =>
    drag.data.status === drop.data || canMove(drag.data.status, drop.data);

  protected isTarget(status: TaskStatus): 'allowed' | 'blocked' | null {
    const from = this.dragging();
    if (!from || from === status) return null;
    return canMove(from, status) ? 'allowed' : 'blocked';
  }

  protected drop(event: CdkDragDrop<TaskStatus, TaskStatus, Task>): void {
    this.dragging.set(null);

    const task = event.item.data;
    const from = event.previousContainer.data;
    const to = event.container.data;
    const transition = transitionFor(from, to);
    if (!transition) return;

    const snapshot = this.columns();
    this.moveError.set(null);

    // 1. Optimistic: move the card right away so the board feels instant.
    this.columns.update((columns) => ({
      ...columns,
      [from]: columns[from].filter((t) => t.id !== task.id),
      [to]: [moved(task, to), ...columns[to]],
    }));

    // 2. Confirm with the server; it is the source of truth.
    this.api.transition(task.id, transition).subscribe({
      next: (saved) =>
        this.columns.update((columns) => ({
          ...columns,
          [to]: columns[to].map((t) => (t.id === saved.id ? saved : t)),
        })),
      error: (error) => {
        // 3. Rejected: put everything back exactly as it was.
        this.columns.set(snapshot);
        this.moveError.set(errorMessage(error));
      },
    });
  }

  protected edit(task: Task): void {
    this.router.navigate(['/tasks', task.id, 'edit']);
  }

  protected reload(): void {
    this.data.reload();
  }
}
