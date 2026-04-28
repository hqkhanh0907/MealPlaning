import { Routes } from '@angular/router';
import { onboardingGuard, onboardingCompletedRedirectGuard } from './core/guards/onboarding-guard';

export const routes: Routes = [
  {
    path: 'onboarding',
    canActivate: [onboardingCompletedRedirectGuard],
    loadComponent: () => import('./features/onboarding/onboarding.page'),
  },
  {
    path: 'settings',
    loadChildren: () => import('./features/settings/settings.routes'),
  },
  {
    path: '',
    canActivate: [onboardingGuard],
    loadChildren: () => import('./tabs/tabs.routes'),
  },
];
