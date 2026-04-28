import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./management.page'),
  },
  {
    path: 'ingredient/new',
    loadComponent: () => import('./ingredient-edit/ingredient-edit.page'),
  },
  {
    path: 'ingredient/edit/:id',
    loadComponent: () => import('./ingredient-edit/ingredient-edit.page'),
  },
  {
    path: 'dish/new',
    loadComponent: () => import('./dish-edit/dish-edit.page'),
  },
  {
    path: 'dish/edit/:id',
    loadComponent: () => import('./dish-edit/dish-edit.page'),
  },
] satisfies Routes;
