import { inject } from '@angular/core';
import type { Routes } from '@angular/router';
import { WorkoutNavigation } from './workout-navigation';

export default [
  { path: 'session', loadComponent: () => import('./fitness.page') },
  {
    path: '',
    canActivate: [() => inject(WorkoutNavigation).rememberOrigin()],
    loadComponent: () => import('./workout-tabs'),
    children: [
      { path: 'today', loadComponent: () => import('./today/workout-today') },
      { path: 'plans', loadComponent: () => import('./plans/workout-plans') },
      { path: 'exercises', loadComponent: () => import('./library/workout-library') },
      { path: 'history', loadComponent: () => import('./history/history.page') },
      { path: '', pathMatch: 'full', redirectTo: 'today' },
    ],
  },
] satisfies Routes;
