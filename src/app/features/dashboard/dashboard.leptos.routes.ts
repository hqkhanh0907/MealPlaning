import { Routes } from '@angular/router';
import { loadDashboardRenderer } from './leptos-renderer';

export default [
  {
    path: '',
    loadComponent: () =>
      loadDashboardRenderer().then(
        () => import('./leptos-dashboard.page'),
        () => import('./dashboard.page'),
      ),
  },
] satisfies Routes;
