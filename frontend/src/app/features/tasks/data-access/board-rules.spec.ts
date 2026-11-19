import { canMove, moved, transitionFor } from './board-rules';
import { Task } from './task.model';

describe('transitionFor', () => {
  it.each([
    ['Pending', 'InProgress', 'start'],
    ['Pending', 'Completed', 'complete'],
    ['InProgress', 'Completed', 'complete'],
    ['Completed', 'Pending', 'reopen'],
  ] as const)('%s → %s uses %s', (from, to, expected) => {
    expect(transitionFor(from, to)).toBe(expected);
  });

  it.each([
    ['InProgress', 'Pending'],
    ['Completed', 'InProgress'],
    ['Pending', 'Pending'],
  ] as const)('%s → %s is not allowed by the domain', (from, to) => {
    expect(canMove(from, to)).toBe(false);
  });
});

describe('moved', () => {
  const task: Task = {
    id: '1',
    title: 'Buy milk',
    description: null,
    status: 'Completed',
    priority: 'Medium',
    dueDate: null,
    createdAt: '2026-11-19T12:00:00Z',
    completedAt: '2026-11-19T13:00:00Z',
  };

  it('clears completedAt when leaving Completed', () => {
    expect(moved(task, 'Pending').completedAt).toBeNull();
  });

  it('sets completedAt when entering Completed', () => {
    const now = new Date('2026-11-20T10:00:00Z');

    expect(moved({ ...task, status: 'InProgress', completedAt: null }, 'Completed', now).completedAt).toBe(
      now.toISOString(),
    );
  });
});
