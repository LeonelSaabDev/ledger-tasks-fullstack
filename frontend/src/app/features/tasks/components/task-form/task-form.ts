import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Task,
  TASK_PRIORITIES,
  TASK_TITLE_MAX_LENGTH,
  TaskPriority,
  TaskRequest,
  todayIso,
} from '../../data-access/task.model';

/**
 * Presentational form for creating and editing a task.
 * Client-side validation mirrors the domain rules for fast feedback;
 * the API still has the final word.
 */
@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-task-form',
  styleUrl: './task-form.css',
  templateUrl: './task-form.html',
})
export class TaskForm {
  private readonly fb = inject(NonNullableFormBuilder);

  /** Task being edited; null when creating a new one. */
  readonly task = input<Task | null>(null);
  readonly saving = input(false);

  readonly save = output<TaskRequest>();
  readonly cancel = output<void>();

  protected readonly priorities = TASK_PRIORITIES;
  protected readonly titleMaxLength = TASK_TITLE_MAX_LENGTH;
  protected readonly today = todayIso();

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(TASK_TITLE_MAX_LENGTH), notBlank]],
    description: [''],
    priority: ['Medium' as TaskPriority],
    dueDate: [''],
  });

  constructor() {
    // Fill the form whenever the page hands us a task to edit.
    effect(() => {
      const task = this.task();
      if (task) {
        this.form.setValue({
          title: task.title,
          description: task.description ?? '',
          priority: task.priority,
          dueDate: task.dueDate ?? '',
        });
      }
    });
  }

  protected get isEditing(): boolean {
    return this.task() !== null;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, description, priority, dueDate } = this.form.getRawValue();
    this.save.emit({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      dueDate: dueDate || null,
    });
  }
}

function notBlank(control: { value: string }) {
  return control.value && !control.value.trim() ? { blank: true } : null;
}
