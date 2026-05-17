import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./fitness.page'),
  },
  {
    path: 'history',
    loadComponent: () => import('./history/history.page'),
  },
] satisfies Routes;
