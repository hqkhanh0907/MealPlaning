import type { Type } from '@angular/core';
import type { UserProfile } from '../../../core/models/user-profile.model';
import type { WorkoutConflictChoices } from '../../../core/account/workout-sync-conflict';
import type { SlotKey } from '../../../core/services/notifications/notification-preferences';

export type SettingsKind = 'home' | 'name' | 'body' | 'goals' | 'activity';
export type SettingsAction = { ownerId: string | null } & (
  | { type: 'sync' | 'signOut' | 'resume' | 'keyConfigure' | 'keyRemove' | 'login' | 'load' }
  | { type: 'navigate'; path: string }
  | { type: 'toggle'; key: SlotKey | 'workout'; enabled: boolean }
  | { type: 'resolve'; server: boolean }
  | { type: 'resolveWorkout'; version: number; choices: WorkoutConflictChoices }
  | { type: 'choose'; id: string }
);
export type EditWrite = { name: string } | { patch: Partial<UserProfile> };
export interface Handle {
  update(raw: string): void;
  free(): void;
}
interface Renderer {
  default(): Promise<unknown>;
  mountSettings(
    root: HTMLElement,
    kind: string,
    raw: string,
    dispatch: (action: SettingsAction) => void,
  ): Handle;
  mountSettingsEditor(
    body: HTMLElement,
    footer: HTMLElement,
    kind: SettingsKind,
    raw: string,
    save: (p: EditWrite) => Promise<void>,
  ): Handle;
}
let pending: Promise<Renderer> | undefined;
export function loadRenderer(): Promise<Renderer> {
  if (!pending) {
    const url = new URL('assets/leptos/healthmate_dashboard.js', document.baseURI);
    pending = import(/* webpackIgnore: true */ /* @vite-ignore */ url.href)
      .then(async (module: Renderer) => {
        await module.default();
        if (
          typeof module.mountSettings !== 'function' ||
          typeof module.mountSettingsEditor !== 'function'
        )
          throw Error('Settings renderer missing');
        return module;
      })
      .catch((failure: unknown) => {
        pending = undefined;
        throw failure;
      });
  }
  return pending;
}
export async function loadSettingsPage(kind: SettingsKind): Promise<Type<unknown>> {
  try {
    await loadRenderer();
    return kind === 'home'
      ? (await import('./settings.page')).default
      : (await import('./editor/editor.page')).default;
  } catch {
    switch (kind) {
      case 'home':
        return (await import('../settings.page')).default;
      case 'name':
        return (await import('../name-edit/name-edit.page')).default;
      case 'body':
        return (await import('../body-edit/body-edit.page')).default;
      case 'goals':
        return (await import('../goals-edit/goals-edit.page')).default;
      case 'activity':
        return (await import('../activity-edit/activity-edit.page')).default;
    }
  }
}
