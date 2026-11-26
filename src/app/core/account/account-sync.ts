import { Injectable, inject, signal } from '@angular/core';
import { Database } from '../services/database/database';
import { AccountSession } from './account-session';
import { nativeAccount, type NativeSyncState, type SyncStatus } from './native-account';
import { prepareWorkspace } from './workspace-snapshot';

@Injectable({ providedIn: 'root' })
export class AccountSync {
  private readonly db = inject(Database);
  private readonly session = inject(AccountSession);
  readonly status = signal<SyncStatus>('idle');
  readonly lastSync = signal<string | null>(null);
  readonly reason = signal('');
  private ready = false;
  private remoteRevision = 0;
  private running: Promise<void> | null = null;

  async initialize(restoreWorkspace: boolean): Promise<void> {
    if (!this.session.required || !this.session.current()) return;
    await prepareWorkspace(this.db);
    this.ready = true;
    await this.refreshStatus(false);
    if (restoreWorkspace && navigator.onLine) await this.sync(true);
  }

  async refreshStatus(reload = true): Promise<void> {
    const owner = this.session.current()?.id;
    if (!this.ready || !owner || this.running) return;
    try {
      this.applyState(await nativeAccount.status(), owner, reload);
    } catch {
      this.status.set('offline');
    }
  }

  sync(restore = false): Promise<void> {
    return this.run((ownerId) => nativeAccount.syncNow({ ownerId }), !restore);
  }

  resolveConflict(useServer: boolean): Promise<void> {
    return this.run((ownerId) => nativeAccount.resolveConflict({ ownerId, useServer }), true);
  }

  private run(
    action: (ownerId: string) => Promise<NativeSyncState>,
    reload: boolean,
  ): Promise<void> {
    const owner = this.session.current()?.id;
    if (!this.ready || !owner) return Promise.resolve();
    if (this.running) return this.running;
    this.status.set('working');
    this.running = action(owner)
      .then((state) => this.applyState(state, owner, reload))
      .catch(() => {
        if (this.session.current()?.id === owner) this.status.set('offline');
      })
      .finally(() => {
        this.running = null;
      });
    return this.running;
  }

  private applyState(state: NativeSyncState, owner: string, reload: boolean): void {
    if (this.session.current()?.id !== owner) return;
    const revision = Math.max(this.remoteRevision, state.remoteRevision ?? 0);
    const changed = revision > this.remoteRevision;
    this.remoteRevision = revision;
    this.status.set(state.status);
    this.lastSync.set(state.lastSync ?? null);
    this.reason.set(state.reason ?? '');
    if (reload && changed) window.location.reload();
  }
}
