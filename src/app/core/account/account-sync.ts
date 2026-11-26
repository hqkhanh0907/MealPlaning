import { Injectable, effect, inject, signal } from '@angular/core';
import { Database } from '../services/database/database';
import { AccountSession } from './account-session';
import { nativeAccount, type NativeSyncState, type SyncStatus } from './native-account';
import { prepareWorkspace } from './workspace-snapshot';
import { type WorkoutConflictChoices, type WorkoutSyncConflict } from './workout-sync-conflict';

@Injectable({ providedIn: 'root' })
export class AccountSync {
  private readonly db = inject(Database);
  private readonly session = inject(AccountSession);
  readonly status = signal<SyncStatus>('idle');
  readonly lastSync = signal<string | null>(null);
  readonly reason = signal('');
  readonly workoutConflict = signal<WorkoutSyncConflict | null>(null);
  private ready = false;
  private stateOwner: string | null = null;
  private remoteRevision = 0;
  private running: Promise<void> | null = null;

  constructor() {
    effect(() => this.resetForOwner(this.session.current()?.id ?? null));
  }

  async initialize(restoreWorkspace: boolean): Promise<void> {
    const owner = this.session.current()?.id;
    if (!this.session.required || !owner) return;
    this.resetForOwner(owner);
    await prepareWorkspace(this.db);
    if (this.session.current()?.id !== owner) return;
    this.ready = true;
    await this.refreshStatus(false);
    if (restoreWorkspace && navigator.onLine) await this.sync(true);
  }

  async refreshStatus(reload = true): Promise<void> {
    const owner = this.session.current()?.id;
    this.resetForOwner(owner ?? null);
    if (!this.ready || !owner || this.running) return;
    try {
      this.applyState(await nativeAccount.status(), owner, reload);
    } catch {
      if (this.session.current()?.id === owner) this.status.set('offline');
    }
  }

  sync(restore = false): Promise<void> {
    return this.run((ownerId) => nativeAccount.syncNow({ ownerId }), !restore);
  }

  resolveConflict(useServer: boolean): Promise<void> {
    return this.run((ownerId) => nativeAccount.resolveConflict({ ownerId, useServer }), true);
  }

  resolveWorkoutConflict(choices: WorkoutConflictChoices): Promise<void> {
    const conflict = this.workoutConflict();
    if (!conflict) return Promise.resolve();
    const { operationId, revision } = conflict;
    return this.run(
      (ownerId) =>
        nativeAccount.resolveWorkoutConflict({
          ownerId,
          resolution: { operationId, revision, choices },
        }),
      true,
    );
  }

  private run(
    action: (ownerId: string) => Promise<NativeSyncState>,
    reload: boolean,
  ): Promise<void> {
    const owner = this.session.current()?.id;
    this.resetForOwner(owner ?? null);
    if (!this.ready || !owner) return Promise.resolve();
    if (this.running) return this.running;
    this.status.set('working');
    const current = action(owner)
      .then((state) => this.applyState(state, owner, reload))
      .catch(() => {
        if (this.session.current()?.id === owner) this.status.set('offline');
      })
      .finally(() => {
        if (this.running === current) this.running = null;
      });
    this.running = current;
    return current;
  }

  private applyState(state: NativeSyncState, owner: string, reload: boolean): void {
    if (this.session.current()?.id !== owner) return;
    const revision = Math.max(this.remoteRevision, state.remoteRevision ?? 0);
    const changed = revision > this.remoteRevision;
    this.remoteRevision = revision;
    this.status.set(state.status);
    this.lastSync.set(state.lastSync ?? null);
    this.reason.set(state.reason ?? '');
    this.workoutConflict.set(state.workoutConflict ?? null);
    if (reload && changed) window.location.reload();
  }

  private resetForOwner(owner: string | null): void {
    if (this.stateOwner === owner) return;
    this.stateOwner = owner;
    this.ready = false;
    this.remoteRevision = 0;
    this.running = null;
    this.status.set('idle');
    this.lastSync.set(null);
    this.reason.set('');
    this.workoutConflict.set(null);
  }
}
