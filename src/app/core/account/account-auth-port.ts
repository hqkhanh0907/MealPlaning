import { InjectionToken } from '@angular/core';
import { registerPlugin } from '@capacitor/core';
import type { AccountIdentity } from './account-session';
import { nativeAccount } from './native-account';

interface AuthFailure {
  status: number;
  message: string;
  code: string;
  field: string;
}
export type AccountReply =
  | { error: AuthFailure }
  | { identity: null }
  | { identity: AccountIdentity; generation: string };
export interface AccountAuthPort {
  capability(): Promise<{ supported: boolean }>;
  identity(): Promise<AccountReply>;
  authenticate(input: {
    username: string;
    password: string;
    name?: string;
    databasePrefix: string;
  }): Promise<AccountReply>;
  rename(input: { ownerId: string; generation: string; name: string }): Promise<AccountReply>;
  clear(input: { ownerId?: string; generation?: string }): Promise<void>;
}
const plugin = registerPlugin<Omit<AccountAuthPort, 'clear'>>('MealPlanAccount');
export const ACCOUNT_AUTH_PORT = new InjectionToken<AccountAuthPort>('MealPlanAccount', {
  providedIn: 'root',
  factory: () => ({
    capability: () => plugin.capability(),
    identity: () => plugin.identity(),
    authenticate: (o) => plugin.authenticate(o),
    rename: (o) => plugin.rename(o),
    clear: (o) => nativeAccount.clear(o),
  }),
});
export async function accountAuthSupported(port: AccountAuthPort): Promise<boolean> {
  try {
    const result = await port.capability();
    if (typeof result.supported !== 'boolean') throw Error('Invalid account capability.');
    return result.supported;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'UNIMPLEMENTED')
      return false;
    throw error;
  }
}
