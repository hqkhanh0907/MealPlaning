import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { AccountSession, type AccountIdentity } from './account-session';
import { accountProfile, PROFILE_PORT, type ProfilePort } from './profile-data';
import { UserProfileRepository } from '../repositories/user-profile.repository';
import { Database } from '../services/database/database';

describe('Native account profile data', () => {
  const owner = { id: 'abcdefghijklmno', username: 'an', name: 'An' };
  const bound = { ownerId: owner.id, generation: 'g1', reason: '' };
  it('dispatches repository reads, local dates and validated patches to the native owner', async () => {
    spyOn(Capacitor, 'getPlatform').and.returnValue('android');
    const current = signal<AccountIdentity | null>(owner);
    const binding = jasmine.createSpy('binding').and.resolveTo(bound);
    const apply = jasmine.createSpy('apply').and.resolveTo({ ...bound, value: null });
    const db = jasmine.createSpyObj('Database', ['getOne', 'execute']);
    TestBed.configureTestingModule({
      providers: [
        { provide: Database, useValue: db },
        { provide: AccountSession, useValue: { current } },
        { provide: PROFILE_PORT, useValue: { binding, apply } },
      ],
    });
    const repo = TestBed.inject(UserProfileRepository);
    expect(await repo.getProfile()).toBeNull();
    expect(await repo.getLatestWeightLog()).toBeNull();
    await repo.getPreviousWeightLog('legacy-lexical-cutoff');
    await repo.update(
      { target_carbs: 0, target_fat: null, weight_kg: undefined },
      new Date(2027, 1, 28, 23, 15),
    );
    expect(apply.calls.allArgs().map((args) => args[0])).toEqual([
      { ...bound, command: { op: 'get' } },
      { ...bound, command: { op: 'latestWeight' } },
      { ...bound, command: { op: 'previousWeight', beforeDate: 'legacy-lexical-cutoff' } },
      {
        ...bound,
        command: { op: 'update', today: '2027-02-28', data: { target_carbs: 0, target_fat: null } },
      },
    ]);
    await expectAsync(repo.update({ id: 'replacement' })).toBeRejectedWithError(/not allowed/);
    await repo.update({ target_carbs: undefined });
    expect(apply).toHaveBeenCalledTimes(4);
    expect(db.getOne).not.toHaveBeenCalled();
    expect(db.execute).not.toHaveBeenCalled();
  });
  it('uses the TypeScript route only for an absent component before the write', async () => {
    const fallback = { code: 'profile_native_unavailable' },
      unsupported = { code: 'UNIMPLEMENTED' };
    const port: ProfilePort = {
      binding: async () => bound,
      apply: async () => {
        throw fallback;
      },
    };
    expect(await accountProfile(() => owner, { op: 'get' }, port)).toEqual({ native: false });
    expect(
      await accountProfile(
        () => owner,
        { op: 'get' },
        {
          ...port,
          binding: async () => {
            throw unsupported;
          },
        },
      ),
    ).toEqual({ native: false });
    let reads = 0,
      writes = 0;
    const afterCommit: ProfilePort = {
      binding: async () => {
        if (++reads === 2) throw unsupported;
        return bound;
      },
      apply: async () => {
        writes++;
        return { ...bound, value: null };
      },
    };
    await expectAsync(
      accountProfile(
        () => owner,
        { op: 'update', today: '2027-02-28', data: { height_cm: 160 } },
        afterCommit,
      ),
    ).toBeRejectedWith(unsupported);
    expect(writes).toBe(1);
  });
  it('rejects stale identities, altered generations, revoked sessions and unauthorized responses', async () => {
    let current: AccountIdentity | null = owner;
    const invoke = (port: ProfilePort) => accountProfile(() => current, { op: 'get' }, port);
    const good = { binding: async () => bound, apply: async () => ({ ...bound, value: null }) };
    for (const reason of ['', 'offline', 'account_forbidden']) {
      const binding = { ...bound, reason };
      expect(
        await invoke({
          binding: async () => binding,
          apply: async () => ({ ...binding, value: null }),
        }),
      ).toEqual({ native: true, value: null });
    }
    await expectAsync(
      invoke({ ...good, binding: async () => ({ ...bound, reason: 'session_revoked' }) }),
    ).toBeRejected();
    await expectAsync(
      invoke({ ...good, apply: async () => ({ ...bound, generation: 'other', value: null }) }),
    ).toBeRejected();
    let count = 0;
    await expectAsync(
      invoke({
        ...good,
        binding: async () => ({ ...bound, generation: ++count === 1 ? 'g1' : 'g2' }),
      }),
    ).toBeRejected();
    await expectAsync(
      invoke({
        ...good,
        apply: async () => {
          current = { ...owner };
          return { ...bound, value: null };
        },
      }),
    ).toBeRejected();
    current = null;
    await expectAsync(invoke(good)).toBeRejected();
  });
  it('returns a committed local change if only sync authorization expires afterwards', async () => {
    for (const reason of ['session_expired', 'account_forbidden', 'session_revoked']) {
      let committed = false;
      const port: ProfilePort = {
        binding: async () => ({ ...bound, reason: committed ? reason : bound.reason }),
        apply: async () => {
          committed = true;
          return { ...bound, value: null };
        },
      };
      const edited = accountProfile(
        () => owner,
        { op: 'update', today: '2026-11-28', data: { notif_lunch: 1 } },
        port,
      );
      if (reason === 'session_revoked') await expectAsync(edited).toBeRejected();
      else expect(await edited).toEqual({ native: true, value: null });
      expect(committed).toBeTrue();
    }
  });
});
