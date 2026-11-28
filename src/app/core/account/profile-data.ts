import { inject, Injectable, InjectionToken } from '@angular/core';
import { registerPlugin } from '@capacitor/core';
import { AccountSession, type AccountIdentity } from './account-session';
import type { UserProfile } from '../models/user-profile.model';

export type ProfileCommand =
  | { op: 'get' | 'latestWeight' }
  | { op: 'previousWeight'; beforeDate: string }
  | { op: 'insert' | 'update'; today: string; data: Partial<UserProfile> };
interface Binding {
  ownerId: string;
  generation: string;
  reason: string;
}
export interface ProfilePort {
  binding(params: { ownerId: string }): Promise<Binding>;
  apply(options: Binding & { command: ProfileCommand }): Promise<Binding & { value: unknown }>;
}
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
export type ProfileResult<T> = { native: false } | { native: true; value: T };
function unavailable(error: unknown): boolean {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
  return code === 'UNIMPLEMENTED' || code === 'profile_native_unavailable';
}
export async function accountProfile<T>(
  current: () => AccountIdentity | null,
  command: ProfileCommand,
  port: ProfilePort,
): Promise<ProfileResult<T>> {
  const owner = current();
  if (!owner) throw Error('Profile account required.');
  const assertCurrent = () => {
    if (current() !== owner) throw Error('Profile account changed.');
  };
  const request = { ownerId: owner.id };
  let bound: Binding;
  try {
    bound = await port.binding(request);
  } catch (error) {
    assertCurrent();
    if (unavailable(error)) return { native: false };
    throw error;
  }
  assertCurrent();
  if (
    bound.ownerId !== owner.id ||
    !bound.generation ||
    typeof bound.reason !== 'string' ||
    bound.reason === 'session_revoked'
  )
    throw Error('Profile account changed.');
  const same = (v: Binding) =>
    v.ownerId === bound.ownerId && v.generation === bound.generation && v.reason === bound.reason;
  let reply: Binding & { value: unknown };
  try {
    reply = await port.apply({ ...bound, command });
  } catch (error) {
    assertCurrent();
    if (!unavailable(error)) throw error;
    if (!same(await port.binding(request))) throw Error('Profile account changed.');
    assertCurrent();
    return { native: false };
  }
  assertCurrent();
  if (!same(reply) || !Object.hasOwn(reply, 'value')) throw Error('Profile account changed.');
  const confirmed = await port.binding(request);
  if (
    confirmed.ownerId !== bound.ownerId ||
    confirmed.generation !== bound.generation ||
    typeof confirmed.reason !== 'string' ||
    confirmed.reason === 'session_revoked'
  )
    throw Error('Profile account changed.');
  assertCurrent();
  return { native: true, value: reply.value as T };
}
