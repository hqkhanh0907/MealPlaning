import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./onboarding.page'),
  },
] satisfies Routes;
