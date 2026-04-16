import { Routes } from '@angular/router';

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
    loadChildren: () => import('./tabs/tabs.routes'),
  },
];
