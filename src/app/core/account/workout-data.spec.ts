import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { AccountSession, type AccountIdentity } from './account-session';
import { WORKOUT_PORT, type WorkoutCommand, workoutWireInput } from './workout-data';
import type { DataPort } from './bound-data';
import { WorkoutRepository } from '../repositories/workout.repository';
import { ExercisePlaceRepository } from '../repositories/exercise-place.repository';
import { Database } from '../services/database/database';
import {
  createTestDatabase,
  teardownTestDatabase,
} from '../services/database/__test__/create-test-database';

const owner: AccountIdentity = { id: 'aaaaaaaaaaaaaaa', name: 'An', username: 'workout_qa' };
const bound = { ownerId: owner.id, generation: 'qa_generation', reason: '' };
const input = { weightKg: 25, reps: 6, restSeconds: 0, effort: null, notes: null };

describe('authenticated workout repository writes', () => {
  const actor = signal<AccountIdentity | null>(owner);
  const binding = jasmine.createSpy<DataPort<WorkoutCommand>['binding']>('binding');
  const apply = jasmine.createSpy<DataPort<WorkoutCommand>['apply']>('apply');
  function repository(db: unknown): WorkoutRepository {
    TestBed.configureTestingModule({
      providers: [
        { provide: Database, useValue: db },
        { provide: ExercisePlaceRepository, useValue: {} },
        { provide: AccountSession, useValue: { current: actor } },
        { provide: WORKOUT_PORT, useValue: { binding, apply } },
      ],
    });
    return TestBed.inject(WorkoutRepository);
  }
  beforeEach(() => {
    spyOn(Capacitor, 'getPlatform').and.returnValue('android');
    actor.set(owner);
    binding.calls.reset();
    apply.calls.reset();
    binding.and.resolveTo(bound);
  });

  it('retains explicit IDs, uses the native committed receipt, and does not retry ambiguous failures in SQL', async () => {
    const db = { getOne: jasmine.createSpy('SQL read'), execute: jasmine.createSpy('SQL write') };
    const repo = repository(db);
    const receipt = { session: { id: 's' }, set: { id: 'fixed' } };
    apply.and.resolveTo({ ...bound, value: receipt });
    expect((await repo.addSet('exercise', input, 'fixed')).set.id).toBe('fixed');
    expect(apply.calls.first().args[0].command).toEqual(
      jasmine.objectContaining({ op: 'addSet', exerciseId: 'exercise', setId: 'fixed' }),
    );
    apply.and.callFake(async () => {
      throw { code: 'workout_write_failed', message: 'uncertain write' };
    });
    await expectAsync(repo.skipSet('exercise', 25, 6, 'fixed')).toBeRejected();
    expect(db.getOne).not.toHaveBeenCalled();
    expect(db.execute).not.toHaveBeenCalled();
    expect(workoutWireInput({ ...input, durationSeconds: NaN }).durationSeconds).toBe('invalid');
  });

  it('drops queued writes and old read replies after the owner changes', async () => {
    const repo = repository({ hasActiveTransaction: false });
    let resolve!: () => void;
    let entered!: () => void;
    const started = new Promise<void>((r) => (entered = r));
    apply.and.callFake(async () => {
      entered();
      await new Promise<void>((r) => (resolve = r));
      return { ...bound, value: null };
    });
    const first = repo.completeSession('s');
    await started;
    const second = repo.completeSession('s');
    actor.set({ ...owner, id: 'bbbbbbbbbbbbbbb' });
    resolve();
    await expectAsync(first).toBeRejectedWithError(/account changed/);
    await expectAsync(second).toBeRejectedWithError(/account changed/);
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('appends on the existing writer and leaves no set after the outer transaction rolls back', async () => {
    const db = await createTestDatabase();
    try {
      const repo = repository(db);
      await db.withTransaction(async () => {
        await db.execute(
          "INSERT INTO exercise(id,name,muscle_group,category,source) VALUES('curl','Curl','biceps','isolation','db')",
        );
        await db.execute(
          "INSERT INTO workout_session(id,date,mode,started_at) VALUES('s','2026-11-28','free','2026-11-28T08:00:00Z')",
        );
        await db.execute(
          "INSERT INTO workout_exercise(id,workout_session_id,exercise_id,sort_order) VALUES('ex','s','curl',0)",
        );
      });
      await expectAsync(
        db.withTransaction(async () => {
          const receipt = await repo.addSet('ex', input, 'set-id');
          expect(receipt.session.total_volume).toBe(150);
          expect((await repo.getActiveSession())?.exercises[0].sets[0].id).toBe('set-id');
          throw Error('fixture rollback');
        }),
      ).toBeRejectedWithError('fixture rollback');
      expect(await db.getOne("SELECT id FROM workout_set WHERE id='set-id'")).toBeNull();
      expect(binding).not.toHaveBeenCalled();
      expect(apply).not.toHaveBeenCalled();
    } finally {
      teardownTestDatabase();
    }
  });
});
