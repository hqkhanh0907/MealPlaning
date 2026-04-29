import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes-guard';

export default [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./management.page'),
  },
  {
    path: 'ingredient/new',
    loadComponent: () => import('./ingredient-edit/ingredient-edit.page'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'ingredient/edit/:id',
    loadComponent: () => import('./ingredient-edit/ingredient-edit.page'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'dish/new',
    loadComponent: () => import('./dish-edit/dish-edit.page'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'dish/edit/:id',
    loadComponent: () => import('./dish-edit/dish-edit.page'),
    canDeactivate: [unsavedChangesGuard],
  },
] satisfies Routes;
