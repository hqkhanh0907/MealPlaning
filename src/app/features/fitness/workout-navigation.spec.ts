import type { Routes } from '@angular/router';
import { routes } from '../../app.routes';
import fitnessRoutes from './fitness.routes';

describe('Workout navigation', () => {
  it('takes existing links to the dedicated workout tabs', () => {
    expect(routes.find((route) => route.path === 'tabs/fitness')?.redirectTo).toBe(
      '/training/today',
    );
    expect(routes.find((route) => route.path === 'tabs/fitness/history')?.redirectTo).toBe(
      '/training/history',
    );
  });

  it('keeps the active session outside the four browsing tabs', () => {
    const entries: Routes = fitnessRoutes;
    const shell = entries.find((route) => route.path === '');
    expect(shell?.children?.filter((route) => route.path).map((route) => route.path)).toEqual([
      'today',
      'plans',
      'exercises',
      'history',
    ]);
    expect(fitnessRoutes.some((route) => route.path === 'session')).toBeTrue();
  });
});
