import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Task } from '../../data-access/task.model';
import { TaskCard } from './task-card';

function buildTask(overrides: Partial<Task> = {}): Task {
  return {
    id: '1',
    title: 'Buy milk',
    description: null,
    status: 'Pending',
    priority: 'Medium',
    dueDate: null,
    createdAt: '2026-11-19T12:00:00Z',
    completedAt: null,
    ...overrides,
  };
}

describe('TaskCard', () => {
  let fixture: ComponentFixture<TaskCard>;

  async function render(task: Task): Promise<HTMLElement> {
    fixture.componentRef.setInput('task', task);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  function buttonLabels(element: HTMLElement): string[] {
    return Array.from(element.querySelectorAll('.actions button')).map((b) => b.textContent!.trim());
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskCard);
  });

  it('offers Start only while the task is pending', async () => {
    expect(buttonLabels(await render(buildTask({ status: 'Pending' })))).toContain('Start');
    expect(buttonLabels(await render(buildTask({ status: 'InProgress' })))).not.toContain('Start');
  });

  it('emits complete when ticking an open task', async () => {
    const element = await render(buildTask({ status: 'InProgress' }));
    let emitted: string | undefined;
    fixture.componentInstance.transition.subscribe((value) => (emitted = value));

    element.querySelector<HTMLButtonElement>('.check')!.click();

    expect(emitted).toBe('complete');
  });

  it('emits reopen when ticking a completed task', async () => {
    const element = await render(buildTask({ status: 'Completed', completedAt: '2026-11-19T13:00:00Z' }));
    let emitted: string | undefined;
    fixture.componentInstance.transition.subscribe((value) => (emitted = value));

    element.querySelector<HTMLButtonElement>('.check')!.click();

    expect(emitted).toBe('reopen');
  });

  it('flags overdue tasks', async () => {
    await render(buildTask({ dueDate: '2000-01-01' }));

    expect(fixture.nativeElement.classList).toContain('is-overdue');
  });
});
