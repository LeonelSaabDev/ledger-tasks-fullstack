import { DEFAULT_TASK_QUERY, SortDirection, TaskListQuery, TaskSortBy, TaskView } from './task.model';

const VIEWS: readonly TaskView[] = ['Open', 'Done', 'All'];
const SORTS: readonly TaskSortBy[] = ['CreatedAt', 'DueDate', 'Priority'];
const DIRECTIONS: readonly SortDirection[] = ['Asc', 'Desc'];

function pick<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/**
 * Turns raw URL query params (anything a user can type) into a valid query.
 * Unknown values fall back to defaults, so a hand-edited URL never breaks the page.
 */
export function parseTaskListQuery(params: Record<string, string | undefined>): TaskListQuery {
  const page = Number.parseInt(params['page'] ?? '', 10);

  return {
    view: pick(params['view'], VIEWS, DEFAULT_TASK_QUERY.view),
    search: params['search'] ?? '',
    sortBy: pick(params['sortBy'], SORTS, DEFAULT_TASK_QUERY.sortBy),
    direction: pick(params['direction'], DIRECTIONS, DEFAULT_TASK_QUERY.direction),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Query params to put in the URL: defaults are omitted to keep links short. */
export function toUrlParams(query: TaskListQuery): Record<string, string | number | null> {
  const value = <K extends keyof TaskListQuery>(key: K) =>
    query[key] === DEFAULT_TASK_QUERY[key] || query[key] === '' ? null : query[key];

  return {
    view: value('view'),
    search: value('search'),
    sortBy: value('sortBy'),
    direction: value('direction'),
    page: value('page'),
  };
}
