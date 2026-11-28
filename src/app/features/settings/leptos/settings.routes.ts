import { Routes } from '@angular/router';
import { loadSettingsPage } from './settings-renderer';

export default [
  { path: '', loadComponent: () => loadSettingsPage('home') },
  { path: 'body', loadComponent: () => loadSettingsPage('body') },
  { path: 'name', loadComponent: () => loadSettingsPage('name') },
  { path: 'goals', loadComponent: () => loadSettingsPage('goals') },
  { path: 'activity', loadComponent: () => loadSettingsPage('activity') },
] satisfies Routes;
