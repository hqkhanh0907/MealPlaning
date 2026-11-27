import { TestBed } from '@angular/core/testing';
import {
  createTestDatabase,
  teardownTestDatabase,
} from '../services/database/__test__/create-test-database';
import { Database } from '../services/database/database';
import { ExercisePlaceRepository, defaultExercisePlaces } from './exercise-place.repository';
import { WorkoutRepository } from './workout.repository';
import { progressionLoad, venueMovements } from '../models/workout-coaching';

describe('Workout coaching persistence', () => {
  let repo: WorkoutRepository;
  beforeEach(async () => {
    const db = await createTestDatabase();
    TestBed.configureTestingModule({
      providers: [WorkoutRepository, { provide: Database, useValue: db }],
    });
    repo = TestBed.inject(WorkoutRepository);
    await db.execute(`INSERT INTO exercise (id,name,muscle_group,category,equipment,source)
      VALUES ('press','Press','chest','compound','Machine','db'), ('row','Row','back','compound','Dumbbell','db'), ('fly','Fly','chest','isolation','Machine','db')`);
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    teardownTestDatabase();
  });
  const press = {
    exerciseId: 'press',
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    restSeconds: 90,
    notes: 'Pause',
  };
  const input = { weightKg: 20, reps: 12, effort: 'easy' as const, restSeconds: 90, notes: null };
  const monday = new Date(2026, 10, 23, 8);
  const tuesday = new Date(2026, 10, 24, 8);

  it('retries a persisted set, stores an accepted load and replays only the movement snapshot', async () => {
    const s = await repo.startComposedSession([press], 'home', monday);
    const id = s.exercises[0].id;
    await Promise.all([repo.addSet(id, input, 'attempt-a'), repo.addSet(id, input, 'attempt-a')]);
    let saved = await repo.getSession(s.id);
    expect(saved?.exercises[0].sets.length).toBe(1);
    expect(saved?.total_volume).toBe(240);
    await repo.addSet(id, input, 'attempt-b');
    await repo.addSet(id, input, 'attempt-c');
    await repo.completeSession(s.id, monday);
    saved = await repo.completionSummary(s.id);
    expect(progressionLoad(saved!.exercises[0])).toBe(20);
    expect(saved!.exercises[0].known_heavier_kg).toBeNull();
    await repo.confirmNextLoad(id, 24);
    expect((await repo.lastSets('home'))[0].next_weight_kg).toBe(24);
    expect(await repo.lastSets('gym')).toEqual([]);
    const replay = await repo.replaySession(s.id, 'home', tuesday);
    expect(replay.source_session_id).toBe(s.id);
    expect(replay.origin).toBe('composed');
    expect(replay.exercises[0].planned_notes).toBe('Pause');
    expect(replay.exercises[0].sets).toEqual([]);
    expect(replay.total_volume).toBe(0);
    await repo.addSet(replay.exercises[0].id, { ...input, weightKg: 22, reps: 9 }, 'next');
    await repo.completeSession(replay.id, tuesday);
    expect((await repo.lastSets('home'))[0]).toEqual(
      jasmine.objectContaining({ weight_kg: 22, next_weight_kg: null, reps: 9 }),
    );
    expect(await repo.weeklyVolumes('2026-11-23', '2026-11-29')).toEqual([
      { week_start: '2026-11-23', volume: 918 },
    ]);
  });

  it('shares one active workout when two start actions overlap', async () => {
    const [first, second] = await Promise.all([
      repo.startComposedSession([press], 'gym'),
      repo.startFreeSession(new Date(), 'home'),
    ]);
    expect(first.id).toBe(second.id);
    const [a, b] = await Promise.all([
      repo.addExerciseToSession(first.id, 'row'),
      repo.addExerciseToSession(first.id, 'row'),
    ]);
    expect(a.id).toBe(b.id);
  });

  it('retains previous sets during replacement and applies a standing rule only at the saved place', async () => {
    const s = await repo.startComposedSession([press], 'gym', monday);
    await repo.addSet(s.exercises[0].id, input);
    const changed = await repo.replaceMovement(s.exercises[0].id, 'fly', true);
    expect(changed.exercises.map((ex) => ex.exercise_id)).toEqual(['press', 'fly']);
    expect(changed.exercises[0].sets[0].weight_kg).toBe(20);
    expect(changed.exercises[1].planned_sets).toBe(2);
    await repo.completeSession(s.id, monday);
    const away = await repo.startComposedSession([press], 'home', tuesday);
    expect(away.exercises[0].exercise_id).toBe('press');
    await repo.cancelSession(away.id);
    const next = await repo.startComposedSession([press], 'gym', tuesday);
    expect(next.exercises[0].exercise_id).toBe('fly');
    expect(next.exercises[0].original_exercise_id).toBe('press');
  });

  it('resolves a recorded substitution from its original slot once when replaying at the same place', async () => {
    const first = await repo.startComposedSession([press], 'gym', monday);
    let changed = await repo.replaceMovement(first.exercises[0].id, 'fly', true);
    await repo.addSet(changed.exercises[0].id, input);
    await repo.completeSession(first.id, monday);
    const second = await repo.startComposedSession(['fly'], 'gym', tuesday);
    changed = await repo.replaceMovement(second.exercises[0].id, 'row', true);
    await repo.addSet(changed.exercises[0].id, input);
    await repo.completeSession(second.id, tuesday);

    const source = await repo.getSession(first.id);
    const preview = await repo.previewMovements(
      source!.exercises.map((ex) => ({
        exerciseId: ex.exercise_id,
        originalExerciseId: ex.original_exercise_id,
      })),
      'gym',
    );
    expect(preview.movements.map((item) => item.exerciseId)).toEqual(['fly']);
    const replay = await repo.replaySession(first.id, 'gym', new Date(), preview);
    expect(replay.exercises.map((ex) => [ex.exercise_id, ex.original_exercise_id])).toEqual([
      ['fly', 'press'],
    ]);
  });

  it('refuses stale previews and rolls back all session writes', async () => {
    const preview = await repo.previewMovements([press], 'gym');
    const first = await repo.startComposedSession([press], 'gym', monday);
    const changed = await repo.replaceMovement(first.exercises[0].id, 'fly', true);
    await repo.addSet(changed.exercises[0].id, input);
    await repo.completeSession(first.id, monday);
    await expectAsync(
      repo.startComposedSession([press], 'gym', tuesday, preview),
    ).toBeRejectedWithError(/xem lại/);
    expect(await repo.getActiveSession()).toBeNull();
    const latest = await repo.previewMovements([press], 'gym');
    const next = await repo.startComposedSession([press], 'gym', tuesday, latest);
    expect(latest.movements.map((row) => row.exerciseId)).toEqual(['fly']);
    expect(next.exercises.map((row) => row.exercise_id)).toEqual(['fly']);
    expect(next.exercises[0].planned_sets).toBe(3);
  });

  it('refreshes the preview if the venue inventory changes while the movement list is unchanged', async () => {
    const places = TestBed.inject(ExercisePlaceRepository);
    const home = defaultExercisePlaces[0];
    const preview = await repo.previewMovements([press], home.id);
    expect(preview.equipment).toBeNull();
    await places.save({ ...home, equipment: [] });
    await expectAsync(
      repo.startComposedSession([press], home.id, tuesday, preview),
    ).toBeRejectedWithError(/xem lại/);
    expect(await repo.getActiveSession()).toBeNull();
  });

  it('rejects changed targets when the preview still has the same exercises', async () => {
    const preview = await repo.previewMovements([press], null);
    await expectAsync(
      repo.startComposedSession([{ ...press, sets: 1 }], null, tuesday, preview),
    ).toBeRejectedWithError(/xem lại/);
    expect(await repo.getActiveSession()).toBeNull();
  });

  it('resolves swaps simultaneously and keeps originals when two different slots claim one movement', () => {
    const result = (list: string[], rules: [string, string][]): string[] =>
      venueMovements(
        list.map((exerciseId) => ({ exerciseId })),
        new Map(rules),
      ).map((row) => row.exerciseId);
    expect(
      result(
        ['press', 'fly'],
        [
          ['press', 'fly'],
          ['fly', 'press'],
        ],
      ),
    ).toEqual(['fly', 'press']);
    expect(
      result(
        ['press', 'fly'],
        [
          ['press', 'row'],
          ['fly', 'row'],
        ],
      ),
    ).toEqual(['press', 'fly']);
    expect(
      result(
        ['press', 'fly', 'row'],
        [
          ['press', 'fly'],
          ['fly', 'row'],
        ],
      ),
    ).toEqual(['press', 'fly', 'row']);
    expect(
      result(
        ['press', 'fly'],
        [
          ['press', 'fly'],
          ['fly', 'row'],
        ],
      ),
    ).toEqual(['fly', 'row']);
  });

  it('never derives progression from skipped sets, mixed loads or a hard final set', async () => {
    const s = await repo.startComposedSession([press], 'gym');
    const id = s.exercises[0].id;
    await repo.addSet(id, input);
    await repo.addSet(id, input);
    await repo.addSet(id, { ...input, weightKg: 24, effort: 'hard' });
    expect(progressionLoad((await repo.getSession(s.id))!.exercises[0])).toBeNull();
    await repo.skipSet(id);
    await repo.completeSession(s.id);
    await expectAsync(repo.confirmNextLoad(id, 28)).toBeRejected();
    await repo.recordCompletionNote(id, 'Đau khi tập');
    expect((await repo.getSession(s.id))?.exercises[0].completion_note).toBe('Đau khi tập');
  });
});
