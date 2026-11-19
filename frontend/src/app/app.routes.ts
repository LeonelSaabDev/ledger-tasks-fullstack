import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tasks' },
  {
    path: 'tasks',
    loadComponent: () =>
      import('./features/tasks/pages/task-list-page/task-list-page').then((m) => m.TaskListPage),
  },
  {
    path: 'board',
    loadComponent: () =>
      import('./features/tasks/pages/task-board-page/task-board-page').then((m) => m.TaskBoardPage),
  },
  {
    path: 'tasks/new',
    loadComponent: () =>
      import('./features/tasks/pages/task-form-page/task-form-page').then((m) => m.TaskFormPage),
  },
  {
    path: 'tasks/:id/edit',
    loadComponent: () =>
      import('./features/tasks/pages/task-form-page/task-form-page').then((m) => m.TaskFormPage),
  },
  { path: '**', redirectTo: 'tasks' },
];
