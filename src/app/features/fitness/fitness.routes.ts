import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./fitness.page'),
  },
] satisfies Routes;
