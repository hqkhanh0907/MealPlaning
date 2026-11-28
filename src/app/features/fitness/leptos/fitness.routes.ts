import { inject, type Type } from '@angular/core';
import type { Routes } from '@angular/router';
import { WorkoutNavigation } from '../workout-navigation';
import { loadFitness } from './renderer';

async function page(
  load: () => Promise<{ default: Type<unknown> }>,
  original: () => Promise<{ default: Type<unknown> }>,
): Promise<Type<unknown>> {
  try {
    await loadFitness();
  } catch {
    return (await original()).default;
  }
  return (await load()).default;
}
export default [
  {
    path: 'session',
    loadComponent: () =>
      page(
        () => import('./session.page'),
        () => import('../fitness.page'),
      ),
  },
  {
    path: '',
    canActivate: [() => inject(WorkoutNavigation).rememberOrigin()],
    loadComponent: () => import('../workout-tabs'),
    children: [
      {
        path: 'today',
        loadComponent: () =>
          page(
            () => import('./today.page'),
            () => import('../today/workout-today'),
          ),
      },
      {
        path: 'plans',
        loadComponent: () =>
          page(
            () => import('./plans.page'),
            () => import('../plans/workout-plans'),
          ),
      },
      {
        path: 'exercises',
        loadComponent: () =>
          page(
            () => import('./library.page'),
            () => import('../library/workout-library'),
          ),
      },
      {
        path: 'history',
        loadComponent: () =>
          page(
            () => import('./history.page'),
            () => import('../history/history.page'),
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'today' },
    ],
  },
] satisfies Routes;
