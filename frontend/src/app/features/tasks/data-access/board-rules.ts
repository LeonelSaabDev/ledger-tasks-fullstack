import { Task, TaskStatus } from './task.model';
import { TaskTransition } from './tasks-api';

/**
 * Which API action moves a task from one column to another.
 * Mirrors the domain state machine in TaskItem:
 *
 *   Pending ──start──▶ InProgress ──complete──▶ Completed
 *      └──────────────complete─────────────────▶   │
 *      ◀─────────────────reopen────────────────────┘
 *
 * Anything else (e.g. InProgress → Pending) has no domain method, so it is not allowed.
 */
const TRANSITIONS: Partial<Record<TaskStatus, Partial<Record<TaskStatus, TaskTransition>>>> = {
  Pending: { InProgress: 'start', Completed: 'complete' },
  InProgress: { Completed: 'complete' },
  Completed: { Pending: 'reopen' },
};

export function transitionFor(from: TaskStatus, to: TaskStatus): TaskTransition | null {
  return TRANSITIONS[from]?.[to] ?? null;
}

export function canMove(from: TaskStatus, to: TaskStatus): boolean {
  return transitionFor(from, to) !== null;
}

/** Returns a copy of the task as it will look after the move, for optimistic updates. */
export function moved(task: Task, to: TaskStatus, now: Date = new Date()): Task {
  return {
    ...task,
    status: to,
    completedAt: to === 'Completed' ? now.toISOString() : null,
  };
}
