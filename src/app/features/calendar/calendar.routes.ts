import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./calendar.page'),
  },
] satisfies Routes;
