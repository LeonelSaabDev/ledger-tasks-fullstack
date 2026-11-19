import { DEFAULT_TASK_QUERY } from './task.model';
import { parseTaskListQuery, toUrlParams } from './task-list-query';

describe('parseTaskListQuery', () => {
  it('uses defaults when the URL has no params', () => {
    expect(parseTaskListQuery({})).toEqual(DEFAULT_TASK_QUERY);
  });

  it('reads valid values', () => {
    const query = parseTaskListQuery({ view: 'Done', search: 'milk', sortBy: 'DueDate', direction: 'Asc', page: '3' });

    expect(query).toEqual({ view: 'Done', search: 'milk', sortBy: 'DueDate', direction: 'Asc', page: 3 });
  });

  it('falls back on garbage instead of breaking', () => {
    const query = parseTaskListQuery({ view: 'Banana', sortBy: 'x', page: '-4' });

    expect(query.view).toBe('Open');
    expect(query.sortBy).toBe('CreatedAt');
    expect(query.page).toBe(1);
  });
});

describe('toUrlParams', () => {
  it('omits default values so URLs stay short', () => {
    expect(toUrlParams({ ...DEFAULT_TASK_QUERY, view: 'Done', page: 2 })).toEqual({
      view: 'Done',
      search: null,
      sortBy: null,
      direction: null,
      page: 2,
    });
  });
});
