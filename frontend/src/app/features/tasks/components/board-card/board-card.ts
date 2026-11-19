import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { isOverdue, Task } from '../../data-access/task.model';

/** Presentational, compact card for the board. Dragging is handled by the page. */
@Component({
  imports: [DatePipe],
  selector: 'app-board-card',
  template: `
    @let t = task();
    <article class="card" [class.card--late]="overdue()" [class.card--done]="t.status === 'Completed'">
      <div class="meta mono">
        <span class="priority priority--{{ t.priority }}">{{ t.priority }}</span>
        @if (t.dueDate) {
          <span [class.late]="overdue()">{{ overdue() ? 'Overdue ·' : 'Due' }} {{ t.dueDate | date: 'd MMM' }}</span>
        }
      </div>
      <h3 class="title">{{ t.title }}</h3>
      <button type="button" class="edit mono" (click)="edit.emit()" [attr.aria-label]="'Edit ' + t.title">
        Edit
      </button>
    </article>
  `,
  styles: `
    .card {
      position: relative;
      padding: 0.75rem 0.85rem;
      background: var(--paper-raised);
      border: 1px solid var(--rule);
      border-left: 3px solid var(--ink);
      border-radius: var(--radius);
      cursor: grab;
    }
    .card--late { border-left-color: var(--accent); }
    .card--done { border-left-color: var(--done); }
    .card--done .title {
      color: var(--ink-faint);
      text-decoration: line-through;
      text-decoration-color: var(--done);
    }
    .meta {
      display: flex;
      gap: 0.6rem;
      color: var(--ink-soft);
      text-transform: uppercase;
    }
    .priority--High, .late { color: var(--accent); font-weight: 500; }
    .title {
      margin: 0.25rem 2.5rem 0 0;
      font-size: 1rem;
      line-height: 1.3;
      overflow-wrap: anywhere;
    }
    .edit {
      position: absolute;
      top: 0.55rem;
      right: 0.6rem;
      border: 0;
      background: none;
      color: var(--ink-faint);
      cursor: pointer;
      text-transform: uppercase;
    }
    .edit:hover { color: var(--accent); }
  `,
})
export class BoardCard {
  readonly task = input.required<Task>();
  readonly edit = output<void>();

  protected readonly overdue = computed(() => isOverdue(this.task()));
}
