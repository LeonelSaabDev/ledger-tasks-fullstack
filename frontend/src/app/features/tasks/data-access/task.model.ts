/** Mirrors TaskItem.MaxTitleLength in the backend domain. Keep both in sync. */
export const TASK_TITLE_MAX_LENGTH = 200;

export type TaskStatus = 'Pending' | 'InProgress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export const TASK_PRIORITIES: readonly TaskPriority[] = ['Low', 'Medium', 'High'];

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  /** Calendar date in ISO format (yyyy-MM-dd), no time component. */
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface TaskRequest {
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string | null;
}

export type TaskView = 'Open' | 'Done' | 'All';
export type TaskSortBy = 'CreatedAt' | 'DueDate' | 'Priority';
export type SortDirection = 'Asc' | 'Desc';

/** What the list shows. Mirrors the API query string and the browser URL. */
export interface TaskListQuery {
  view: TaskView;
  search: string;
  sortBy: TaskSortBy;
  direction: SortDirection;
  page: number;
}

export const DEFAULT_TASK_QUERY: TaskListQuery = {
  view: 'Open',
  search: '',
  sortBy: 'CreatedAt',
  direction: 'Desc',
  page: 1,
};

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface TaskSummary {
  open: number;
  done: number;
  overdue: number;
  total: number;
}

/** Shape of an RFC 9457 problem response returned by the API. */
export interface ProblemDetails {
  title?: string;
  status?: number;
  detail?: string;
}

/** Today's local calendar date as yyyy-MM-dd, comparable with `dueDate`. */
export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** A task is overdue when it is not done and its due date is before today. */
export function isOverdue(task: Pick<Task, 'status' | 'dueDate'>, today: string = todayIso()): boolean {
  return task.status !== 'Completed' && task.dueDate !== null && task.dueDate < today;
}
