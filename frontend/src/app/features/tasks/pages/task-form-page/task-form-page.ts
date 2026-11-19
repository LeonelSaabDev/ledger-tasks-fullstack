import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { TaskForm } from '../../components/task-form/task-form';
import { TaskRequest } from '../../data-access/task.model';
import { errorMessage, TasksApi } from '../../data-access/tasks-api';

/** Container for both /tasks/new and /tasks/:id/edit. */
@Component({
  imports: [TaskForm],
  selector: 'app-task-form-page',
  styleUrl: './task-form-page.css',
  templateUrl: './task-form-page.html',
})
export class TaskFormPage {
  private readonly api = inject(TasksApi);
  private readonly router = inject(Router);

  /** Bound from the `:id` route param thanks to withComponentInputBinding(). */
  readonly id = input<string>();

  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly isEditing = computed(() => !!this.id());

  protected readonly task = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) => (id ? this.api.getById(id) : of(null)),
  });

  protected readonly loadError = computed(() => (this.task.error() ? errorMessage(this.task.error()) : null));

  protected save(request: TaskRequest): void {
    const id = this.id();
    const call = id ? this.api.update(id, request) : this.api.create(request);

    this.saving.set(true);
    this.saveError.set(null);

    call.subscribe({
      next: () => this.router.navigate(['/tasks']),
      error: (error) => {
        // The API is the source of truth: show its message (e.g. "Due date cannot be in the past.").
        this.saveError.set(errorMessage(error));
        this.saving.set(false);
      },
    });
  }

  protected cancel(): void {
    this.router.navigate(['/tasks']);
  }
}
