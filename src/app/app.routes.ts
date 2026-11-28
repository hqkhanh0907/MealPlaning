import { inject } from '@angular/core';
import { type CanActivateFn, Router, Routes } from '@angular/router';
import { onboardingGuard, onboardingCompletedRedirectGuard } from './core/guards/onboarding-guard';
import { AccountSession } from './core/account/account-session';

const accountGuard: CanActivateFn = () => {
  const session = inject(AccountSession);
  return (
    !session.required || session.current() !== null || inject(Router).createUrlTree(['/account'])
  );
};

export const routes: Routes = [
  {
    path: 'account',
    loadComponent: () => import('./features/account/account.page'),
  },
  {
    path: 'onboarding',
    canActivate: [accountGuard, onboardingCompletedRedirectGuard],
    loadComponent: () => import('./onboarding-entry'),
  },
  {
    path: 'settings',
    canActivate: [accountGuard, onboardingGuard],
    loadChildren: () => import('./features/settings/settings.routes'),
  },
  {
    path: 'training',
    canActivate: [accountGuard, onboardingGuard],
    loadChildren: () => import('./features/fitness/fitness.routes'),
  },
  { path: 'tabs/fitness/history', pathMatch: 'full', redirectTo: '/training/history' },
  { path: 'tabs/fitness', pathMatch: 'full', redirectTo: '/training/today' },
  {
    path: 'tabs',
    canActivate: [accountGuard, onboardingGuard],
    loadChildren: () => import('./tabs/tabs.routes'),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'tabs',
  },
];
