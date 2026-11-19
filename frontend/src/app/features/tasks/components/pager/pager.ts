import { Component, input, output } from '@angular/core';

/** Presentational pager: previous / "page X of Y" / next. */
@Component({
  selector: 'app-pager',
  template: `
    @if (totalPages() > 1) {
      <nav class="pager" aria-label="Pagination">
        <button type="button" class="btn btn--small" [disabled]="page() <= 1" (click)="pageChange.emit(page() - 1)">
          ← Previous
        </button>
        <span class="mono">Page {{ page() }} of {{ totalPages() }}</span>
        <button
          type="button"
          class="btn btn--small"
          [disabled]="page() >= totalPages()"
          (click)="pageChange.emit(page() + 1)">
          Next →
        </button>
      </nav>
    }
  `,
  styles: `
    .pager {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-top: 1.5rem;
      color: var(--ink-soft);
    }
  `,
})
export class Pager {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();
}
