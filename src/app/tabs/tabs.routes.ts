import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export default [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('../features/dashboard/dashboard.routes'),
      },
      {
        path: 'calendar',
        loadChildren: () => import('../features/calendar/calendar.routes'),
      },
      {
        path: 'management',
        loadChildren: () => import('../features/management/management.routes'),
      },
      {
        path: 'fitness',
        loadChildren: () => import('../features/fitness/fitness.routes'),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
] satisfies Routes;
