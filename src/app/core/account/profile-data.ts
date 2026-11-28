import { inject, Injectable, InjectionToken } from '@angular/core';
import { registerPlugin } from '@capacitor/core';
import { AccountSession, type AccountIdentity } from './account-session';
import { accountData, type DataPort, type DataResult } from './bound-data';
import type { UserProfile } from '../models/user-profile.model';

export type ProfileCommand =
  | { op: 'get' | 'latestWeight' }
  | { op: 'previousWeight'; beforeDate: string }
  | { op: 'insert' | 'update'; today: string; data: Partial<UserProfile> };
export type ProfilePort = DataPort<ProfileCommand>;
const native = registerPlugin<ProfilePort>('MealPlanProfile');
export const PROFILE_PORT = new InjectionToken<ProfilePort>('MealPlanProfile', {
  providedIn: 'root',
  factory: () => ({
    binding: (options) => native.binding(options),
    apply: (options) => native.apply(options),
  }),
});
@Injectable({ providedIn: 'root' })
export class ProfileData {
  private readonly port = inject(PROFILE_PORT);
  private readonly session = inject(AccountSession);
  run<T>(command: ProfileCommand): Promise<ProfileResult<T>> {
    return accountProfile<T>(this.session.current, command, this.port);
  }
}
export type ProfileResult<T> = DataResult<T>;
export function accountProfile<T>(
  current: () => AccountIdentity | null,
  command: ProfileCommand,
  port: ProfilePort,
): Promise<ProfileResult<T>> {
  return accountData<T, ProfileCommand>(current, command, port, 'profile');
}
