import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { environment } from '../../../environments/environment';
import { accountNameError } from './account-name';
import { nativeAccount, type DeviceSessionSummary } from './native-account';

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
  private readonly identity = signal<AccountIdentity | null>(null);
  readonly current = this.identity.asReadonly();

  async restore(): Promise<void> {
    if (!this.required) return;
    const saved = await nativeAccount.session();
    if (saved.ownerId && saved.username) {
      this.remember({ id: saved.ownerId, username: saved.username, name: saved.fullName ?? '' });
      localStorage.removeItem(LEGACY_KEY);
      return;
    }
    const legacy = this.readLegacy();
    if (legacy) {
      await this.rememberDevice(legacy, legacy.token, '', '');
      localStorage.removeItem(LEGACY_KEY);
    } else {
      localStorage.removeItem(STORAGE_KEY);
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
    if (grant.username !== identity || !/^[a-z0-9]{15}$/.test(grant.ownerId)) {
      throw new Error('Tài khoản không hợp lệ.');
    }
    const account = { id: grant.ownerId, username: grant.username, name: grant.name };
    await this.rememberDevice(
      account,
      grant.accessToken,
      grant.sessionToken,
      grant.accessExpiresAt,
    );
    localStorage.removeItem(LEGACY_KEY);
  }

  async updateName(name: string): Promise<void> {
    const error = accountNameError(name);
    if (error) throw new AccountRequestError(400, error, 'invalid_name', 'name');
    const account = this.current();
    const saved = await nativeAccount.session({ renew: true });
    if (!account || saved.ownerId !== account.id || !saved.accessToken) {
      throw new AccountRequestError(401, 'Đăng nhập lại để đổi họ và tên.', saved.reason);
    }
    const updated = await this.call<{ ownerId: string; username: string; name: string }>(
      '/api/mealplan/profile',
      { name: name.trim() },
      saved.accessToken,
    );
    if (this.current()?.id !== account.id || updated.ownerId !== account.id) return;
    await nativeAccount.updateProfile({ fullName: updated.name });
    this.remember({ ...account, name: updated.name });
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
    this.remember(account);
  }

  private remember(account: AccountIdentity): void {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        id: account.id,
        username: account.username,
        name: account.name,
      }),
    );
    this.identity.set(account);
  }

  async clear(): Promise<void> {
    if (this.required) await nativeAccount.clear();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_KEY);
    this.identity.set(null);
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
