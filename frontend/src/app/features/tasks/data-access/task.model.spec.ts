import { isOverdue, todayIso } from './task.model';

describe('todayIso', () => {
  it('formats the local date with zero padding', () => {
    expect(todayIso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('isOverdue', () => {
  const today = '2026-11-19';

  it('is overdue when a pending task is past its due date', () => {
    expect(isOverdue({ status: 'Pending', dueDate: '2026-11-18' }, today)).toBe(true);
  });

  it('is not overdue on the due date itself', () => {
    expect(isOverdue({ status: 'InProgress', dueDate: today }, today)).toBe(false);
  });

  it('is never overdue once completed', () => {
    expect(isOverdue({ status: 'Completed', dueDate: '2026-01-01' }, today)).toBe(false);
  });

  it('is not overdue without a due date', () => {
    expect(isOverdue({ status: 'Pending', dueDate: null }, today)).toBe(false);
  });
});
