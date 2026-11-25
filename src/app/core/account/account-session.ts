import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';

const STORAGE_KEY = 'mealplan.session.v1';
export const API_ORIGIN = 'https://cachyos-x8664.tailb306f9.ts.net';

export interface AccountIdentity {
  id: string;
  username: string;
  token: string;
}

export class AccountRequestError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

@Injectable({ providedIn: 'root' })
export class AccountSession {
  readonly required = Capacitor.isNativePlatform();
  private readonly identity = signal(this.load());
  readonly current = this.identity.asReadonly();

  private load(): AccountIdentity | null {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (!stored || typeof stored !== 'object') return null;
      const value = stored as Partial<AccountIdentity>;
      return typeof value.id === 'string' && /^[a-z0-9]{15}$/.test(value.id) &&
        typeof value.username === 'string' && typeof value.token === 'string'
        ? { id: value.id, username: value.username, token: value.token }
        : null;
    } catch {
      return null;
    }
  }

  async authenticate(username: string, password: string, register: boolean): Promise<void> {
    const identity = username.trim().toLowerCase();
    if (register) {
      await this.call('/api/collections/users/records', {
        username: identity, password, passwordConfirm: password,
      });
    }
    const response = await this.call<{ token: string; record: { id: string; username: string } }>(
      '/api/collections/users/auth-with-password',
      { identity, password },
    );
    const account = {
      id: response.record.id, username: response.record.username, token: response.token,
    };
    if (!/^[a-z0-9]{15}$/.test(account.id)) throw new Error('Tài khoản không hợp lệ.');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    this.identity.set(account);
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
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
      const body = await response.json().catch(() => null) as { message?: string } | null;
      throw new AccountRequestError(response.status, body?.message ?? response.statusText);
    }
    return response.status === 204 ? undefined as T : await response.json() as T;
  }
}
