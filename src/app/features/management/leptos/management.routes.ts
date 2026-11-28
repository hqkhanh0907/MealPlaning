import type { Type } from '@angular/core';
import type { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../../core/guards/unsaved-changes-guard';
import { loadManagement } from './renderer';

async function list(): Promise<Type<unknown>> {
  try {
    await loadManagement();
  } catch {
    return (await import('../management.page')).default;
  }
  return (await import('./catalog.page')).default;
}
async function ingredient(): Promise<Type<unknown>> {
  try {
    await loadManagement();
  } catch {
    return (await import('../ingredient-edit/ingredient-edit.page')).default;
  }
  return (await import('./ingredient.page')).default;
}
async function dish(): Promise<Type<unknown>> {
  try {
    await loadManagement();
  } catch {
    return (await import('../dish-edit/dish-edit.page')).default;
  }
  return (await import('./dish.page')).default;
}
export default [
  { path: '', pathMatch: 'full', loadComponent: list },
  { path: 'ingredient/new', loadComponent: ingredient, canDeactivate: [unsavedChangesGuard] },
  { path: 'ingredient/edit/:id', loadComponent: ingredient, canDeactivate: [unsavedChangesGuard] },
  { path: 'dish/new', loadComponent: dish, canDeactivate: [unsavedChangesGuard] },
  { path: 'dish/edit/:id', loadComponent: dish, canDeactivate: [unsavedChangesGuard] },
] satisfies Routes;
