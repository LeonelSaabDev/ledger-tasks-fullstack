import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskRequest } from '../../data-access/task.model';
import { TaskForm } from './task-form';

describe('TaskForm', () => {
  let fixture: ComponentFixture<TaskForm>;
  let element: HTMLElement;
  let saved: TaskRequest | undefined;

  beforeEach(async () => {
    fixture = TestBed.createComponent(TaskForm);
    saved = undefined;
    fixture.componentInstance.save.subscribe((request) => (saved = request));
    await fixture.whenStable();
    element = fixture.nativeElement;
  });

  async function typeTitle(value: string): Promise<void> {
    const input = element.querySelector<HTMLInputElement>('input[formControlName="title"]')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function submit(): Promise<void> {
    element.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('does not emit when the title is only spaces', async () => {
    await typeTitle('   ');

    await submit();

    expect(saved).toBeUndefined();
    expect(element.textContent).toContain('The title is required.');
  });

  it('emits a trimmed request with empty optionals as null', async () => {
    await typeTitle('  Buy milk  ');

    await submit();

    expect(saved).toEqual({ title: 'Buy milk', description: null, priority: 'Medium', dueDate: null });
  });

  it('prefills the fields when editing', async () => {
    fixture.componentRef.setInput('task', {
      id: '1',
      title: 'Existing',
      description: 'Notes',
      status: 'Completed',
      priority: 'High',
      dueDate: '2026-12-01',
      createdAt: '2026-11-19T12:00:00Z',
      completedAt: '2026-11-19T13:00:00Z',
    });
    await fixture.whenStable();

    await submit();

    expect(saved).toEqual({ title: 'Existing', description: 'Notes', priority: 'High', dueDate: '2026-12-01' });
  });
});
