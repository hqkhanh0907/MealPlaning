import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./fitness.page'),
  },
  {
    path: 'active',
    loadComponent: () => import('./active-workout/active-workout.page'),
  },
  {
    path: 'history',
    loadComponent: () => import('./history/history.page'),
  },
] satisfies Routes;
