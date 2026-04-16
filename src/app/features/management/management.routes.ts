import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./management.page'),
  },
] satisfies Routes;
