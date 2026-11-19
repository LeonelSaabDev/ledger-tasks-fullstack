import { Component, computed, DestroyRef, effect, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Pager } from '../../components/pager/pager';
import { TaskCard } from '../../components/task-card/task-card';
import { SortDirection, Task, TaskListQuery, TaskSortBy, TaskView } from '../../data-access/task.model';
import { parseTaskListQuery, toUrlParams } from '../../data-access/task-list-query';
import { errorMessage, TasksApi, TaskTransition } from '../../data-access/tasks-api';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Container: owns the data and talks to the API; the cards only render and emit.
 * The URL is the single source of truth for the list state, so filters survive
 * a reload, can be bookmarked, and the back button works.
 */
@Component({
  imports: [TaskCard, Pager, RouterLink],
  selector: 'app-task-list-page',
  styleUrl: './task-list-page.css',
  templateUrl: './task-list-page.html',
})
export class TaskListPage {
  private readonly api = inject(TasksApi);
  private readonly router = inject(Router);

  // Query params arrive as inputs thanks to withComponentInputBinding().
  readonly view = input<string>();
  readonly search = input<string>();
  readonly sortBy = input<string>();
  readonly direction = input<string>();
  readonly page = input<string>();

  protected readonly query = computed(() =>
    parseTaskListQuery({
      view: this.view(),
      search: this.search(),
      sortBy: this.sortBy(),
      direction: this.direction(),
      page: this.page(),
    }),
  );

  /** What is typed in the box; follows the URL (e.g. on back) but can run ahead of it while typing. */
  protected readonly searchText = linkedSignal(() => this.query().search);

  protected readonly busyId = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);

  protected readonly tasks = rxResource({
    params: () => this.query(),
    stream: ({ params }) => this.api.search(params),
  });

  protected readonly summary = rxResource({ stream: () => this.api.summary() });

  protected readonly loadError = computed(() => (this.tasks.error() ? errorMessage(this.tasks.error()) : null));

  protected readonly views: { value: TaskView; label: string; count: 'open' | 'done' | 'total' }[] = [
    { value: 'Open', label: 'Open', count: 'open' },
    { value: 'Done', label: 'Done', count: 'done' },
    { value: 'All', label: 'All', count: 'total' },
  ];

  protected readonly sorts: { value: `${TaskSortBy}:${SortDirection}`; label: string }[] = [
    { value: 'CreatedAt:Desc', label: 'Newest first' },
    { value: 'CreatedAt:Asc', label: 'Oldest first' },
    { value: 'DueDate:Asc', label: 'Due soonest' },
    { value: 'Priority:Desc', label: 'Highest priority' },
  ];

  protected readonly sortValue = computed(() => `${this.query().sortBy}:${this.query().direction}`);

  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));

    // If a delete or transition empties the current page, step back one page.
    effect(() => {
      const result = this.tasks.value();
      if (result && result.items.length === 0 && result.page > 1) {
        this.navigate({ page: result.page - 1 });
      }
    });
  }

  protected setView(view: TaskView): void {
    this.navigate({ view, page: 1 });
  }

  protected setSort(value: string): void {
    const [sortBy, direction] = value.split(':') as [TaskSortBy, SortDirection];
    this.navigate({ sortBy, direction, page: 1 });
  }

  protected setPage(page: number): void {
    this.navigate({ page });
  }

  protected onSearchInput(text: string): void {
    this.searchText.set(text);
    clearTimeout(this.searchTimer);
    // Wait until the user pauses typing, so we don't fire one request per keystroke.
    this.searchTimer = setTimeout(() => this.navigate({ search: text, page: 1 }), SEARCH_DEBOUNCE_MS);
  }

  protected clearSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchText.set('');
    this.navigate({ search: '', page: 1 });
  }

  protected changeStatus(task: Task, transition: TaskTransition): void {
    // The task may leave the current view (e.g. completed while on "Open"), so refetch.
    this.run(task, this.api.transition(task.id, transition));
  }

  protected edit(task: Task): void {
    this.router.navigate(['/tasks', task.id, 'edit']);
  }

  protected remove(task: Task): void {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    this.run(task, this.api.delete(task.id));
  }

  private navigate(changes: Partial<TaskListQuery>): void {
    this.router.navigate([], { queryParams: toUrlParams({ ...this.query(), ...changes }) });
  }

  /** Runs a request for one task, then refreshes the page and the counters. */
  private run<T>(task: Task, request: Observable<T>): void {
    this.busyId.set(task.id);
    this.actionError.set(null);

    request.subscribe({
      next: () => {
        this.tasks.reload();
        this.summary.reload();
      },
      error: (error) => {
        this.actionError.set(errorMessage(error));
        this.busyId.set(null);
      },
      complete: () => this.busyId.set(null),
    });
  }
}
