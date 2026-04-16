import { Routes } from '@angular/router';
import { onboardingGuard } from './core/guards/onboarding.guard';

export const routes: Routes = [
  {
    path: 'onboarding',
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
