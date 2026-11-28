import type { AccountIdentity } from './account-session';

interface Binding {
  ownerId: string;
  generation: string;
  reason: string;
}
export interface DataPort<C> {
  binding(params: { ownerId: string }): Promise<Binding>;
  apply(options: Binding & { command: C }): Promise<Binding & { value: unknown }>;
}
export type DataResult<T> = { native: false } | { native: true; value: T };
function unavailable(error: unknown, scope: string): boolean {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
  return code === 'UNIMPLEMENTED' || code === scope + '_native_unavailable';
}
export async function accountData<T, C>(
  current: () => AccountIdentity | null,
  command: C,
  port: DataPort<C>,
  scope: 'profile' | 'workout',
): Promise<DataResult<T>> {
  const label = scope.charAt(0).toUpperCase() + scope.slice(1);
  const owner = current();
  if (!owner) throw Error(label + ' account required.');
  const assertCurrent = () => {
    if (current() !== owner) throw Error(label + ' account changed.');
  };
  const request = { ownerId: owner.id };
  let bound: Binding;
  try {
    bound = await port.binding(request);
  } catch (error) {
    assertCurrent();
    if (unavailable(error, scope)) return { native: false };
    throw error;
  }
  assertCurrent();
  if (
    bound.ownerId !== owner.id ||
    !bound.generation ||
    typeof bound.reason !== 'string' ||
    bound.reason === 'session_revoked'
  )
    throw Error(label + ' account changed.');
  const same = (v: Binding) =>
    v.ownerId === bound.ownerId && v.generation === bound.generation && v.reason === bound.reason;
  let reply: Binding & { value: unknown };
  try {
    reply = await port.apply({ ...bound, command });
  } catch (error) {
    assertCurrent();
    if (!unavailable(error, scope)) throw error;
    if (!same(await port.binding(request))) throw Error(label + ' account changed.');
    assertCurrent();
    return { native: false };
  }
  assertCurrent();
  if (!same(reply) || !Object.hasOwn(reply, 'value')) throw Error(label + ' account changed.');
  const confirmed = await port.binding(request);
  if (
    confirmed.ownerId !== bound.ownerId ||
    confirmed.generation !== bound.generation ||
    typeof confirmed.reason !== 'string' ||
    confirmed.reason === 'session_revoked'
  )
    throw Error(label + ' account changed.');
  assertCurrent();
  return { native: true, value: reply.value as T };
}
