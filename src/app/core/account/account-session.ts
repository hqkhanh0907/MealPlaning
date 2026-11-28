import { computed, inject, Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { environment } from '../../../environments/environment';
import { accountNameError } from './account-name';
import { nativeAccount, type DeviceSessionSummary } from './native-account';
import { ACCOUNT_AUTH_PORT, accountAuthSupported, type AccountReply } from './account-auth-port';

const LEGACY_KEY = 'mealplan.session.v1';
const STORAGE_KEY = 'mealplan.account.v2';
export const API_ORIGIN = 'https://cachyos-x8664.tailb306f9.ts.net';

export interface AccountIdentity {
  id: string;
  username: string;
  name: string;
}

export class AccountRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code = '',
    readonly field = '',
  ) {
    super(message);
  }
}

@Injectable({ providedIn: 'root' })
export class AccountSession {
  readonly required = Capacitor.isNativePlatform();
  private readonly active = signal<{
    identity: AccountIdentity;
    generation: string;
    native: boolean;
  } | null>(null);
  readonly current = computed(() => this.active()?.identity ?? null);
  readonly dataBinding = computed(() => {
    const bound = this.active();
    return bound ? JSON.stringify([bound.identity.id, bound.generation]) : null;
  });
  private fallbackGeneration = 0;
  private renameQueue: Promise<void> = Promise.resolve();
  private readSeq = 0;
  private readonly nativeAuth =
    Capacitor.getPlatform() === 'android' ? inject(ACCOUNT_AUTH_PORT) : null;
  private authEpoch = 0;

  private authenticated(
    reply: AccountReply,
  ): { identity: AccountIdentity; generation: string } | null {
    if ('error' in reply) {
      const e = reply.error;
      if (e.status) throw new AccountRequestError(e.status, e.message, e.code, e.field);
      throw new Error(e.message);
    }
    if (reply.identity === null) return null;
    if (
      !reply.generation ||
      !/^[a-z0-9]{15}$/.test(reply.identity.id) ||
      typeof reply.identity.username !== 'string' ||
      typeof reply.identity.name !== 'string'
    )
      throw Error('Tài khoản không hợp lệ.');
    const { id, username, name } = reply.identity;
    return { generation: reply.generation, identity: { id, username, name } };
  }

  private async confirmed(
    reply: AccountReply,
    epoch: number,
  ): Promise<{ identity: AccountIdentity; generation: string } | null> {
    const saved = this.authenticated(reply);
    if (!saved || !this.nativeAuth) return null;
    const current = this.authenticated(await this.nativeAuth.identity());
    if (
      epoch !== this.authEpoch ||
      current?.generation !== saved.generation ||
      current.identity.id !== saved.identity.id
    )
      throw Error('Tài khoản đã thay đổi.');
    return current;
  }

  private async reconcileNative(epoch: number): Promise<void> {
    if (!this.nativeAuth || this.authEpoch !== epoch) return;
    const sequence = ++this.readSeq;
    try {
      const bound = this.authenticated(await this.nativeAuth.identity());
      if (epoch !== this.authEpoch || sequence !== this.readSeq) return;
      if (bound) this.remember(bound.identity, bound.generation);
      else this.forget();
    } catch {
      // A failed reconciliation must preserve the original operation error.
    }
  }

  async restore(): Promise<void> {
    if (!this.required) return;
    const epoch = this.authEpoch;
    const sequence = ++this.readSeq;
    let generation: string | undefined;
    let identity: AccountIdentity | null = null;
    if (this.nativeAuth && (await accountAuthSupported(this.nativeAuth))) {
      const bound = this.authenticated(await this.nativeAuth.identity());
      identity = bound?.identity ?? null;
      generation = bound?.generation;
    } else {
      const saved = await nativeAccount.session();
      if (saved.ownerId && saved.username)
        identity = { id: saved.ownerId, username: saved.username, name: saved.fullName ?? '' };
    }
    if (epoch !== this.authEpoch || sequence !== this.readSeq) return;
    if (identity) {
      this.remember(identity, generation, true);
      localStorage.removeItem(LEGACY_KEY);
      return;
    }
    const legacy = this.readLegacy();
    if (legacy) {
      await this.rememberDevice(legacy, legacy.token, '', '', epoch);
      localStorage.removeItem(LEGACY_KEY);
    } else {
      this.forget();
    }
  }

  private readLegacy(): (AccountIdentity & { token: string }) | null {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? 'null');
      if (!stored || typeof stored !== 'object') return null;
      const value = stored as Partial<AccountIdentity & { token: string }>;
      return typeof value.id === 'string' &&
        /^[a-z0-9]{15}$/.test(value.id) &&
        typeof value.username === 'string' &&
        typeof value.token === 'string'
        ? { id: value.id, username: value.username, name: value.name ?? '', token: value.token }
        : null;
    } catch {
      return null;
    }
  }

  async authenticate(username: string, password: string, name?: string): Promise<void> {
    const epoch = ++this.authEpoch;
    if (this.nativeAuth && (await accountAuthSupported(this.nativeAuth))) {
      if (epoch !== this.authEpoch) throw Error('Tài khoản đã thay đổi.');
      let receivedGrant = false;
      try {
        const reply = await this.nativeAuth.authenticate({
          username,
          password,
          ...(name === undefined ? {} : { name }),
          databasePrefix: environment.dbName.replace(/\.db$/, ''),
        });
        receivedGrant = 'identity' in reply && reply.identity !== null;
        const account = await this.confirmed(reply, epoch);
        if (!account || epoch !== this.authEpoch) throw Error('Tài khoản đã thay đổi.');
        this.remember(account.identity, account.generation);
        localStorage.removeItem(LEGACY_KEY);
        return;
      } catch (error) {
        if (epoch === this.authEpoch || receivedGrant) await this.reconcileNative(this.authEpoch);
        throw error;
      }
    }
    if (epoch !== this.authEpoch) throw Error('Tài khoản đã thay đổi.');
    const identity = username.trim().toLowerCase();
    if (name !== undefined) {
      const error = accountNameError(name);
      if (error) throw new AccountRequestError(400, error, 'invalid_name', 'name');
      await this.call('/api/collections/users/records', {
        username: identity,
        password,
        passwordConfirm: password,
        name: name.trim(),
      });
    }
    if (epoch !== this.authEpoch) throw Error('Tài khoản đã thay đổi.');
    const { label: deviceLabel } = this.required
      ? await nativeAccount.deviceLabel().catch(() => ({ label: 'Android' }))
      : { label: 'Trình duyệt' };
    const grant = await this.call<{
      ownerId: string;
      username: string;
      name: string;
      accessToken: string;
      sessionToken: string;
      accessExpiresAt: string;
    }>('/api/mealplan/session', { username: identity, password, deviceLabel });
    if (epoch !== this.authEpoch) throw Error('Tài khoản đã thay đổi.');
    if (grant.username !== identity || !/^[a-z0-9]{15}$/.test(grant.ownerId)) {
      throw new Error('Tài khoản không hợp lệ.');
    }
    const account = { id: grant.ownerId, username: grant.username, name: grant.name };
    await this.rememberDevice(
      account,
      grant.accessToken,
      grant.sessionToken,
      grant.accessExpiresAt,
      epoch,
    );
    localStorage.removeItem(LEGACY_KEY);
  }

  updateName(name: string): Promise<void> {
    const error = accountNameError(name);
    if (error) return Promise.reject(new AccountRequestError(400, error, 'invalid_name', 'name'));
    const binding = this.dataBinding(),
      epoch = this.authEpoch;
    const work = this.renameQueue.then(() => this.renameCurrent(name, binding, epoch));
    this.renameQueue = work.catch(() => undefined);
    return work;
  }

  private async renameCurrent(name: string, binding: string | null, epoch: number): Promise<void> {
    const bound = this.active(),
      account = bound?.identity;
    if (!account || this.dataBinding() !== binding || epoch !== this.authEpoch)
      throw new AccountRequestError(401, 'Đăng nhập lại để đổi họ và tên.');
    if (this.nativeAuth && (await accountAuthSupported(this.nativeAuth))) {
      if (!bound?.native || this.dataBinding() !== binding || epoch !== this.authEpoch)
        throw new AccountRequestError(401, 'Đăng nhập lại để đổi họ và tên.');
      const changed = await this.confirmed(
        await this.nativeAuth.rename({ ownerId: account.id, generation: bound.generation, name }),
        epoch,
      );
      if (
        changed &&
        changed.identity.id === account.id &&
        this.dataBinding() === binding &&
        epoch === this.authEpoch
      )
        this.remember(changed.identity, changed.generation);
      else if (epoch === this.authEpoch) await this.reconcileNative(epoch);
      return;
    }
    const saved = await nativeAccount.session({ renew: true });
    if (!account || saved.ownerId !== account.id || !saved.accessToken) {
      throw new AccountRequestError(401, 'Đăng nhập lại để đổi họ và tên.', saved.reason);
    }
    const updated = await this.call<{ ownerId: string; username: string; name: string }>(
      '/api/mealplan/profile',
      { name: name.trim() },
      saved.accessToken,
    );
    if (
      this.dataBinding() !== binding ||
      epoch !== this.authEpoch ||
      updated.ownerId !== account.id
    )
      return;
    await nativeAccount.updateProfile({ fullName: updated.name });
    if (this.dataBinding() === binding && epoch === this.authEpoch)
      this.remember({ ...account, name: updated.name }, undefined, true);
  }

  async listDeviceSessions(): Promise<DeviceSessionSummary[] | null> {
    const account = this.current();
    if (!this.required || !account) return null;
    const reply = await nativeAccount.listDeviceSessions({ ownerId: account.id });
    if (this.current() !== account || reply.reason === 'account_changed') return null;
    if (reply.reason) throw new AccountRequestError(0, 'Chưa thể tải thiết bị.', reply.reason);
    return reply.devices ?? [];
  }

  async revokeDeviceSession(id: string): Promise<boolean> {
    const account = this.current();
    if (!this.required || !account) return false;
    const reply = await nativeAccount.revokeDeviceSession({ ownerId: account.id, id });
    if (this.current() !== account || reply.reason === 'account_changed') return false;
    if (reply.reason) throw new AccountRequestError(0, 'Chưa thể thu hồi phiên.', reply.reason);
    return true;
  }

  private async rememberDevice(
    account: AccountIdentity,
    accessToken: string,
    sessionToken: string,
    accessExpiresAt: string,
    epoch: number,
  ): Promise<void> {
    if (this.required) {
      await nativeAccount.configure({
        origin: API_ORIGIN,
        ownerId: account.id,
        dbName: accountDatabaseName(account.id),
        username: account.username,
        fullName: account.name,
        accessToken,
        sessionToken,
        accessExpiresAt,
      });
    }
    if (epoch !== this.authEpoch) throw Error('Tài khoản đã thay đổi.');
    this.remember(account);
  }

  private remember(account: AccountIdentity, nativeGeneration?: string, keepLocal = false): void {
    ++this.readSeq;
    const { id, username, name } = account,
      identity = { id, username, name },
      previous = this.active();
    const generation =
      nativeGeneration ??
      (keepLocal && previous && !previous.native && previous.identity.id === id
        ? previous.generation
        : 'local:' + ++this.fallbackGeneration);
    if (
      previous?.generation === generation &&
      previous.identity.id === id &&
      previous.identity.username === username &&
      previous.identity.name === name
    )
      return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    this.active.set({ identity, generation, native: nativeGeneration !== undefined });
  }

  private forget(): void {
    ++this.readSeq;
    localStorage.removeItem(STORAGE_KEY);
    this.active.set(null);
  }

  async clear(): Promise<void> {
    const epoch = ++this.authEpoch,
      bound = this.active();
    if (this.required) {
      const request = bound
        ? { ownerId: bound.identity.id, ...(bound.native ? { generation: bound.generation } : {}) }
        : {};
      try {
        if (this.nativeAuth) await this.nativeAuth.clear(request);
        else await nativeAccount.clear(request);
      } catch (error) {
        if (epoch === this.authEpoch) await this.reconcileNative(epoch);
        throw error;
      }
    }
    if (epoch !== this.authEpoch) throw Error('Tài khoản đã thay đổi.');
    this.forget();
    localStorage.removeItem(LEGACY_KEY);
  }

  async call<T>(path: string, payload?: object, token?: string): Promise<T> {
    const headers = new Headers({ Accept: 'application/json' });
    if (token) headers.set('Authorization', token);
    if (payload !== undefined) headers.set('Content-Type', 'application/json');
    const response = await fetch(API_ORIGIN + path, {
      method: payload === undefined ? 'GET' : 'POST',
      headers,
      body: payload === undefined ? undefined : JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
      credentials: 'omit',
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        message?: string;
        data?: { code?: string; name?: unknown; username?: unknown };
      } | null;
      const field = body?.data?.name ? 'name' : body?.data?.username ? 'username' : '';
      throw new AccountRequestError(
        response.status,
        body?.message ?? response.statusText,
        body?.data?.code,
        field,
      );
    }
    return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
  }
}

export function accountDatabaseName(ownerId: string): string {
  return `${environment.dbName.replace(/\.db$/, '')}_${ownerId}`;
}
