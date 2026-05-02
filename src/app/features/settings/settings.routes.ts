import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./settings.page'),
  },
  {
    path: 'body',
    loadComponent: () => import('./body-edit/body-edit.page'),
  },
  {
    path: 'goals',
    loadComponent: () => import('./goals-edit/goals-edit.page'),
  },
  {
    path: 'activity',
    loadComponent: () => import('./activity-edit/activity-edit.page'),
  },
] satisfies Routes;
