import { Injectable, inject, signal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../services/database/database';
import { AccountRequestError, AccountSession } from './account-session';
import {
  type WorkspaceSnapshot, exportWorkspace, importWorkspace, outbox, prepareWorkspace,
} from './workspace-snapshot';

interface RemoteWorkspace {
  revision: number;
  snapshot: WorkspaceSnapshot | null;
}
interface PendingWrite {
  operationId: string;
  baseRevision: number;
  snapshot: WorkspaceSnapshot;
}
type SyncStatus = 'idle' | 'working' | 'saved' | 'offline' | 'expired' | 'conflict';

const WORKSPACE = '/api/mealplan/workspace';

@Injectable({ providedIn: 'root' })
export class AccountSync {
  private readonly db = inject(Database);
  private readonly session = inject(AccountSession);
  readonly status = signal<SyncStatus>('idle');
  readonly lastSync = signal<string | null>(null);
  private ready = false;
  private running: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (!this.session.required || !this.session.current()) return;
    await prepareWorkspace(this.db);
    this.ready = true;
    await this.sync(true);
  }

  sync(restore = false): Promise<void> {
    if (!this.ready || !this.session.current()) return Promise.resolve();
    if (this.running) return this.running;
    this.running = this.synchronize(restore).finally(() => { this.running = null; });
    return this.running;
  }

  private async synchronize(restore: boolean): Promise<void> {
    const account = this.session.current();
    if (!account) return;
    this.status.set('working');
    try {
      let state = await outbox(this.db);
      if (state.pending) {
        await this.send(JSON.parse(state.pending) as PendingWrite, state.pending_version!, account.token);
        state = await outbox(this.db);
      }
      const remote = await this.session.call<RemoteWorkspace>(WORKSPACE, undefined, account.token);
      if (this.session.current() !== account) return;
      if (remote.revision > state.revision && remote.snapshot) {
        if (state.change_version !== state.clean_version) {
          this.status.set('conflict');
          return;
        }
        await importWorkspace(this.db, remote.snapshot, remote.revision, state.change_version);
        if (!restore) {
          window.location.reload();
          return;
        }
      } else if (state.change_version !== state.clean_version) {
        const snapshot = await exportWorkspace(this.db);
        const current = await outbox(this.db);
        if (state.change_version !== current.change_version || this.session.current() !== account) {
          this.status.set('idle');
          return;
        }
        const pending: PendingWrite = { operationId: uuidv4(), baseRevision: state.revision, snapshot };
        await this.db.execute(
          'UPDATE sync_workspace SET pending = ?, pending_version = ? WHERE id = 1',
          [JSON.stringify(pending), state.change_version],
        );
        await this.send(pending, state.change_version, account.token);
      }
      this.lastSync.set(new Date().toISOString());
      this.status.set('saved');
    } catch (error) {
      const status = error instanceof AccountRequestError ? error.status : 0;
      this.status.set(status === 401 || status === 403 ? 'expired' : status === 409 ? 'conflict' : 'offline');
    }
  }

  private async send(pending: PendingWrite, changeVersion: number, token: string): Promise<void> {
    const receipt = await this.session.call<{ revision: number; operationId: string }>(
      WORKSPACE, pending, token,
    );
    if (receipt.operationId !== pending.operationId) throw new Error('Biên nhận không hợp lệ.');
    if (this.session.current()?.token !== token) return;
    await this.db.execute(
      `UPDATE sync_workspace SET revision = ?, clean_version = ?,
         pending = NULL, pending_version = NULL WHERE id = 1`,
      [receipt.revision, changeVersion],
    );
  }

  async resolveConflict(useServer: boolean): Promise<void> {
    const account = this.session.current();
    if (!account || this.running || this.status() !== 'conflict') return;
    const work = async (): Promise<void> => {
      this.status.set('working');
      try {
        const state = await outbox(this.db);
        const remote = await this.session.call<RemoteWorkspace>(WORKSPACE, undefined, account.token);
        if (this.session.current() !== account || !remote.snapshot) return;
        if (useServer) {
          await importWorkspace(this.db, remote.snapshot, remote.revision, state.change_version);
          window.location.reload();
        } else {
          await this.db.execute(
            'UPDATE sync_workspace SET revision = ?, pending = NULL, pending_version = NULL WHERE id = 1',
            [remote.revision],
          );
          await this.synchronize(false);
        }
      } catch {
        this.status.set('offline');
      }
    };
    this.running = work().finally(() => { this.running = null; });
    await this.running;
  }
}
