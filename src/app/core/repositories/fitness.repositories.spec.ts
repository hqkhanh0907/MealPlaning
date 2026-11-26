import { TestBed } from '@angular/core/testing';
import { prepareWorkspace } from '../account/workspace-snapshot';
import { Database } from '../services/database/database';
import {
  createTestDatabase,
  teardownTestDatabase,
} from '../services/database/__test__/create-test-database';
import { WebDatabase } from '../services/database/web-database';
import { ExerciseRepository } from './exercise.repository';
import { TrainingPlanRepository } from './training-plan.repository';
import { WorkoutRepository } from './workout.repository';
import type { AiTrainingPlanDraft } from '../models/fitness.types';

describe('Fitness repositories', () => {
  let db: WebDatabase;
  let exerciseRepo: ExerciseRepository;
  let planRepo: TrainingPlanRepository;
  let workoutRepo: WorkoutRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    TestBed.configureTestingModule({
      providers: [
        ExerciseRepository,
        TrainingPlanRepository,
        WorkoutRepository,
        { provide: Database, useValue: db },
      ],
    });
    exerciseRepo = TestBed.inject(ExerciseRepository);
    planRepo = TestBed.inject(TrainingPlanRepository);
    workoutRepo = TestBed.inject(WorkoutRepository);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    teardownTestDatabase();
  });

  it('seeds at least 50 exercises with push, pull and legs coverage', async () => {
    const count = await exerciseRepo.ensureSeedExercises();
    const push = await exerciseRepo.list({ muscleGroup: 'chest', limit: 100 });
    const pull = await exerciseRepo.list({ muscleGroup: 'back', limit: 100 });
    const legs = await exerciseRepo.list({ muscleGroup: 'quads', limit: 100 });

    expect(count).toBeGreaterThanOrEqual(50);
    expect(push.length).toBeGreaterThanOrEqual(5);
    expect(pull.length).toBeGreaterThanOrEqual(5);
    expect(legs.length).toBeGreaterThanOrEqual(5);
  });

  it('offers the dumbbell template while keeping the three-day default', async () => {
    const plans = await planRepo.ensurePresetPlans();
    const active = await planRepo.getActivePlan();

    expect(plans.map((plan) => plan.frequency)).toEqual([2, 3, 4, 6]);
    expect(active?.id).toBe('plan_full_body_3x');
    expect(plans.find((plan) => plan.type === 'ppl')?.frequency).toBe(6);
    expect(active?.type).toBe('full_body');
    expect(active?.training_days).toBe(3);
    expect(active?.days.length).toBe(7);
  });

  it('leaves the preset snapshot and sync version unchanged when reopened', async () => {
    await prepareWorkspace(db);
    await planRepo.ensurePresetPlans();
    await planRepo.activatePlan('upper_lower');

    const readSnapshot = (): Promise<unknown[]> =>
      Promise.all([
        db.query('SELECT * FROM training_plan ORDER BY id'),
        db.query('SELECT * FROM training_plan_day ORDER BY id'),
        db.query('SELECT * FROM planned_exercise ORDER BY id'),
        db.getOne('SELECT * FROM sync_workspace WHERE id = 1'),
      ]);
    const before = await readSnapshot();

    await planRepo.ensurePresetPlans();

    expect(await readSnapshot()).toEqual(before);
    expect((await planRepo.getActivePlan())?.type).toBe('upper_lower');
  });

  it('updates only preset rows that differ from their seed', async () => {
    await prepareWorkspace(db);
    await planRepo.ensurePresetPlans();
    const preset = (await planRepo.getActivePlan())!;
    const day = preset.days.find((item) => item.exercises.length > 0)!;
    const exercise = day.exercises[0];
    await db.execute(
      "UPDATE training_plan SET name = 'Old preset', description = NULL, updated_at = '2000-01-01' WHERE id = ?",
      [preset.id],
    );
    await db.execute("UPDATE training_plan_day SET name = 'Old day' WHERE id = ?", [day.id]);
    await db.execute(
      "UPDATE planned_exercise SET sets = sets + 1, notes = 'Old note' WHERE id = ?",
      [exercise.id],
    );
    const version = async (): Promise<number> =>
      (await db.getOne<{ change_version: number }>(
        'SELECT change_version FROM sync_workspace WHERE id = 1',
      ))!.change_version;
    const before = await version();

    await planRepo.ensurePresetPlans();

    const restored = await planRepo.getActivePlan();
    expect(restored?.name).toBe(preset.name);
    expect(restored?.description).toBe(preset.description);
    expect(restored?.days).toEqual(preset.days);
    expect(restored?.updated_at).not.toBe('2000-01-01');
    expect(restored?.is_active).toBe(1);
    expect(await version()).toBe(before + 3);
  });

  it('rejects switching plans while a workout session is active', async () => {
    await planRepo.ensurePresetPlans();
    const today = await planRepo.getTodayTrainingDay('2026-05-11');
    expect(today?.is_rest_day).toBe(0);
    await workoutRepo.startGuidedSession(today!.id, new Date('2026-05-11T07:00:00'));

    await expectAsync(planRepo.activatePlan('upper_lower')).toBeRejectedWithError(
      'TrainingPlanRepository: cannot switch plan while a workout is active.',
    );
  });

  it('allows switching plans after cancelling a workout', async () => {
    await planRepo.ensurePresetPlans();
    const session = await workoutRepo.startFreeSession();
    await workoutRepo.cancelSession(session.id);

    await planRepo.activatePlan('upper_lower');

    expect((await planRepo.getActivePlan())?.type).toBe('upper_lower');
    expect((await planRepo.createAiPlan(aiPlanDraft())).is_active).toBe(1);
  });

  it('does not complete a workout with only skipped sets', async () => {
    await planRepo.ensurePresetPlans();
    const today = await planRepo.getTodayTrainingDay('2026-05-11');
    const session = await workoutRepo.startGuidedSession(today!.id);
    await workoutRepo.skipSet(session.exercises[0].id, 40, 8);

    await expectAsync(workoutRepo.completeSession(session.id)).toBeRejectedWithError(
      'WorkoutRepository: at least one logged set is required.',
    );
    expect((await workoutRepo.getActiveSession())?.id).toBe(session.id);
  });

  it('persists and activates an AI custom training plan atomically', async () => {
    await planRepo.ensurePresetPlans();

    const created = await planRepo.createAiPlan(aiPlanDraft());
    const plans = await planRepo.listPlans();
    const active = await planRepo.getActivePlan();

    expect(created.type).toBe('ai_custom');
    expect(created.source).toBe('ai');
    expect(created.is_active).toBe(1);
    expect(plans.some((plan) => plan.type === 'ai_custom')).toBeTrue();
    expect(active?.type).toBe('ai_custom');
    expect(active?.training_days).toBe(3);
    expect(active?.days.find((day) => day.day_of_week === 1)?.exercises.length).toBe(1);
  });

  it('saves a moved workout in a personal plan and keeps previous workout records', async () => {
    await planRepo.ensurePresetPlans();
    const preset = (await planRepo.getActivePlan())!;
    const monday = preset.days.find((day) => day.day_of_week === 1)!;
    const session = await workoutRepo.startGuidedSession(monday.id);
    await workoutRepo.addSet(session.exercises[0].id, {
      weightKg: 45,
      reps: 7,
      restSeconds: 90,
      effort: null,
      notes: null,
    });
    await workoutRepo.completeSession(session.id);
    const before = await workoutRepo.getSession(session.id);
    const replacement = (await exerciseRepo.list({ limit: 100 })).find(
      (exercise) =>
        exercise.category !== 'cardio' &&
        !monday.exercises.some((planned) => planned.exercise_id === exercise.id),
    )!;
    const days = preset.days.map((day) => ({
      dayOfWeek: day.day_of_week === 1 ? 2 : day.day_of_week === 2 ? 1 : day.day_of_week,
      name: day.name,
      isRestDay: day.is_rest_day === 1,
      exercises: day.exercises.map((exercise, index) => ({
        exerciseId: day.id === monday.id && index === 0 ? replacement.id : exercise.exercise_id,
        sets: exercise.sets,
        repsMin: exercise.reps_min,
        repsMax: exercise.reps_max,
        restSeconds: exercise.rest_seconds,
        notes: exercise.notes,
      })),
    }));

    const personalId = await planRepo.savePersonalPlan(preset.id, { name: 'My week', days });
    const custom = (await planRepo.getActivePlan())!;
    expect(custom.source).toBe('custom');
    expect(custom.id).not.toBe(preset.id);
    expect((await planRepo.getTodayTrainingDay('2026-05-11'))?.is_rest_day).toBe(1);
    const tuesday = (await planRepo.getTodayTrainingDay('2026-05-12'))!;
    expect(tuesday.exercises[0]?.exercise_id).toBe(replacement.id);
    expect(await workoutRepo.getSession(session.id)).toEqual(before);

    expect(await planRepo.savePersonalPlan(personalId, { name: 'Updated week', days })).toBe(
      personalId,
    );
    expect((await planRepo.getTodayTrainingDay('2026-05-12'))?.id).toBe(tuesday.id);
    await planRepo.ensurePresetPlans();
    await planRepo.activatePlanById(preset.id);
    expect((await planRepo.getTodayTrainingDay('2026-05-11'))?.id).toBe(monday.id);
    await planRepo.activatePlanById(personalId);
    expect((await planRepo.getActivePlan())?.name).toBe('Updated week');
  });

  it('logs guided sets, snapshots total volume and reports progress metrics', async () => {
    await planRepo.ensurePresetPlans();
    await seedProfile();
    const today = await planRepo.getTodayTrainingDay('2026-05-11');
    const session = await workoutRepo.startGuidedSession(
      today!.id,
      new Date('2026-05-11T07:00:00'),
    );
    const firstExercise = session.exercises[0];

    await workoutRepo.addSet(firstExercise.id, {
      weightKg: 100,
      reps: 5,
      restSeconds: 120,
      effort: 'just_right',
      notes: 'solid',
    });
    await workoutRepo.completeSession(session.id, new Date('2026-05-11T07:30:00'));

    const completed = await workoutRepo.getSession(session.id);
    const progress = await workoutRepo.progressSummary(new Date('2026-05-11T08:00:00'));

    expect(completed?.total_volume).toBe(500);
    expect(completed?.exercises[0].total_volume).toBe(500);
    expect(progress.currentWeekVolume).toBe(500);
    expect(progress.workoutStreakWeeks).toBe(1);
    expect(progress.strength).toEqual([]);
    expect(progress.weeklyAvgWeightKg).toBe(65);
    expect(progress.weightSource).toBe('profile');
  });

  it('validates set input bounds', async () => {
    await planRepo.ensurePresetPlans();
    const today = await planRepo.getTodayTrainingDay('2026-05-11');
    const session = await workoutRepo.startGuidedSession(
      today!.id,
      new Date('2026-05-11T07:00:00'),
    );

    await expectAsync(
      workoutRepo.addSet(session.exercises[0].id, {
        weightKg: Number.POSITIVE_INFINITY,
        reps: 5,
        restSeconds: 90,
        effort: null,
        notes: null,
      }),
    ).toBeRejectedWithError('WorkoutRepository: weight must be between 0 and 500kg.');
  });

  it('keeps seconds, repetitions, skipped sets and fractional volume distinct after reopening', async () => {
    await planRepo.ensurePresetPlans();
    const start = new Date('2026-11-24T08:00:00');
    const session = await workoutRepo.startFreeSession(start);
    const squat = await workoutRepo.addExerciseToSession(session.id, 'squat');
    const carry = await workoutRepo.addExerciseToSession(session.id, 'farmers-walk');
    const set = { weightKg: 32.5, reps: 7, restSeconds: 90, effort: 'easy' as const, notes: null };
    await workoutRepo.addSet(squat.id, set);
    await workoutRepo.skipSet(squat.id, 99, 8);
    await workoutRepo.addSet(squat.id, set);
    await workoutRepo.addSet(squat.id, { ...set, weightKg: 37.5, reps: 5 });
    await expectAsync(
      workoutRepo.addSet(carry.id, { ...set, weightKg: 20, reps: 30 }),
    ).toBeRejected();
    await workoutRepo.addSet(carry.id, { ...set, weightKg: 20, reps: 0, durationSeconds: 30 });
    await workoutRepo.cancelSession(session.id);
    expect(await workoutRepo.recentSessions()).toEqual([]);
    await workoutRepo.undoCancel(session.id);
    expect((await workoutRepo.getActiveSession())?.total_volume).toBe(642.5);
    await workoutRepo.completeSession(session.id, new Date('2026-11-24T08:05:00'));

    const reopened = new WebDatabase();
    await reopened.initialize();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [WorkoutRepository, { provide: Database, useValue: reopened }],
    });
    const reader = TestBed.inject(WorkoutRepository);
    const [history] = await reader.recentSessions();
    expect(history.training_day_name).toBe('Tập tự do');
    expect(history.total_volume).toBe(642.5);
    expect(history.exercises[0].sets.map((s) => s.status)).toEqual([
      'logged',
      'skipped',
      'logged',
      'logged',
    ]);
    expect(history.exercises[1].sets[0]).toEqual(
      jasmine.objectContaining({ weight_kg: 20, reps: 0, duration_seconds: 30 }),
    );
    const progress = await reader.progressSummary(start);
    expect(progress.currentWeekVolume).toBe(642.5);
    expect(progress.volumeByMuscle.map((x) => x.volume)).toEqual([642.5]);
    expect(progress.strength).toEqual([]);
  });

  it('keeps legacy sets visible and excludes unknown units from all load statistics', async () => {
    await planRepo.ensurePresetPlans();
    const date = new Date('2026-11-24T08:00:00');
    const session = await workoutRepo.startFreeSession(date);
    const carry = await workoutRepo.addExerciseToSession(session.id, 'farmers-walk');
    await db.execute(
      `INSERT INTO workout_set
         (id, workout_exercise_id, set_number, weight_kg, reps, status, legacy_unit_unknown)
       VALUES ('old-carry', ?, 1, 20, 45, 'logged', 1)`,
      [carry.id],
    );
    await workoutRepo.completeSession(session.id, date);

    const [saved] = await workoutRepo.recentSessions();
    expect(saved.exercises[0].sets[0]).toEqual(
      jasmine.objectContaining({ reps: 45, legacy_unit_unknown: 1 }),
    );
    expect(saved.exercises[0].total_volume).toBe(0);
    expect(saved.total_volume).toBe(0);
    const progress = await workoutRepo.progressSummary(date);
    expect(progress.currentWeekVolume).toBe(0);
    expect(progress.volumeByMuscle).toEqual([]);
    expect(progress.workoutStreakWeeks).toBe(1);
  });

  it('captures guided targets and limits strength estimates to supported maximal-effort lifts', async () => {
    await planRepo.ensurePresetPlans();
    const day = (await planRepo.getTodayTrainingDay('2026-11-23'))!;
    const start = new Date('2026-11-23T08:00:00');
    const session = await workoutRepo.startGuidedSession(day.id, start);
    const squat = session.exercises.find((ex) => ex.exercise_id === 'squat')!;
    const plank = session.exercises.find((ex) => ex.exercise_id === 'plank')!;
    expect(squat).toEqual(
      jasmine.objectContaining({
        planned_sets: 3,
        planned_min: 8,
        planned_max: 10,
        planned_rest: 120,
      }),
    );
    expect(plank).toEqual(
      jasmine.objectContaining({ planned_min: 30, planned_max: 45, planned_rest: 60 }),
    );
    const set = { weightKg: 60, reps: 5, restSeconds: 90, effort: 'maxed' as const, notes: null };
    await workoutRepo.addSet(squat.id, set);
    await workoutRepo.addSet(squat.id, { ...set, weightKg: 90, effort: 'easy' });
    await workoutRepo.addSet(squat.id, { ...set, weightKg: 150, reps: 11 });
    const assisted = await workoutRepo.addExerciseToSession(session.id, 'assisted-pull-up');
    await workoutRepo.addSet(assisted.id, { ...set, weightKg: 100 });
    await workoutRepo.completeSession(session.id, start);
    const progress = await workoutRepo.progressSummary(start);
    expect(progress.strength.map((row) => [row.exercise_id, row.estimated_1rm])).toEqual([
      ['squat', 70],
    ]);
  });

  it('updateSet round-trips weight, reps, rest, effort, notes, and writes updated_at ISO', async () => {
    await planRepo.ensurePresetPlans();
    const today = await planRepo.getTodayTrainingDay('2026-05-11');
    const session = await workoutRepo.startGuidedSession(
      today!.id,
      new Date('2026-05-11T07:00:00'),
    );
    const firstExercise = session.exercises[0];

    await workoutRepo.addSet(firstExercise.id, {
      weightKg: 80,
      reps: 8,
      restSeconds: 90,
      effort: 'just_right',
      notes: null,
    });

    const before = await workoutRepo.getSession(session.id);
    const setId = before!.exercises[0].sets[0].id;

    const tBefore = Date.now();
    await workoutRepo.updateSet(setId, {
      weightKg: 90,
      reps: 6,
      restSeconds: 120,
      effort: 'hard',
      notes: 'felt heavy',
    });
    const tAfter = Date.now();

    const after = await workoutRepo.getSession(session.id);
    const updatedSet = after!.exercises[0].sets[0];
    expect(updatedSet.weight_kg).toBe(90);
    expect(updatedSet.reps).toBe(6);
    expect(updatedSet.rest_seconds).toBe(120);
    expect(updatedSet.effort).toBe('hard');
    expect(updatedSet.notes).toBe('felt heavy');

    const row = await db.getOne<{ updated_at: string | null }>(
      `SELECT updated_at FROM workout_set WHERE id = ?`,
      [setId],
    );
    expect(row?.updated_at).toBeTruthy();
    const ts = Date.parse(row!.updated_at as string);
    expect(Number.isFinite(ts)).toBeTrue();
    expect(ts).toBeGreaterThanOrEqual(tBefore);
    expect(ts).toBeLessThanOrEqual(tAfter);

    expect(after!.total_volume).toBe(540);
    expect(after!.exercises[0].total_volume).toBe(540);
  });

  it('deleteSet removes a single set, re-numbers remaining sets contiguously, and re-syncs totals', async () => {
    await planRepo.ensurePresetPlans();
    const today = await planRepo.getTodayTrainingDay('2026-05-11');
    const session = await workoutRepo.startGuidedSession(
      today!.id,
      new Date('2026-05-11T07:00:00'),
    );
    const exerciseId = session.exercises[0].id;

    const r1 = await workoutRepo.addSet(exerciseId, {
      weightKg: 100,
      reps: 5,
      restSeconds: 90,
      effort: null,
      notes: null,
    });
    const r2 = await workoutRepo.addSet(exerciseId, {
      weightKg: 100,
      reps: 5,
      restSeconds: 90,
      effort: null,
      notes: null,
    });
    const s1 = r1.set;
    const s2 = r2.set;
    await workoutRepo.addSet(exerciseId, {
      weightKg: 100,
      reps: 5,
      restSeconds: 90,
      effort: null,
      notes: null,
    });

    await workoutRepo.deleteSet(s2.id);

    const refreshed = await workoutRepo.getSession(session.id);
    const sets = refreshed!.exercises[0].sets;
    expect(sets.length).toBe(2);
    expect(sets.map((s) => s.set_number)).toEqual([1, 2]);
    expect(sets[0].id).toBe(s1.id);
    expect(refreshed!.total_volume).toBe(1000);

    // Idempotent on missing id.
    await expectAsync(workoutRepo.deleteSet('does-not-exist')).toBeResolved();
  });

  it('skipSet persists a skipped placeholder row that does not count toward volume', async () => {
    await planRepo.ensurePresetPlans();
    await seedProfile();
    const today = await planRepo.getTodayTrainingDay('2026-05-11');
    const session = await workoutRepo.startGuidedSession(
      today!.id,
      new Date('2026-05-11T08:30:00'),
    );
    const we = session.exercises[0];

    await workoutRepo.addSet(we.id, {
      weightKg: 40,
      reps: 5,
      restSeconds: 90,
      effort: 'just_right',
      notes: null,
    });

    const skipResult = await workoutRepo.skipSet(we.id, 50, 8);
    expect(skipResult.set.status).toBe('skipped');
    expect(skipResult.set.completed_at).toBeNull();
    expect(skipResult.set.set_number).toBe(2);

    await workoutRepo.addSet(we.id, {
      weightKg: 40,
      reps: 5,
      restSeconds: 90,
      effort: 'just_right',
      notes: null,
    });

    const detail = await workoutRepo.getSession(session.id);
    const sets = detail!.exercises[0].sets;
    expect(sets.map((s) => s.set_number)).toEqual([1, 2, 3]);
    expect(sets[1].status).toBe('skipped');
    // 2 logged sets at 40x5 = 400; skipped row contributes 0.
    expect(detail!.total_volume).toBe(400);
    expect(detail!.exercises[0].total_volume).toBe(400);

    await workoutRepo.completeSession(session.id, new Date('2026-05-11T09:00:00'));
    const progress = await workoutRepo.progressSummary(new Date('2026-05-11T10:00:00'));
    expect(progress.currentWeekVolume).toBe(400);
    expect(progress.volumeByMuscle.reduce((total, point) => total + point.volume, 0)).toBe(400);
    expect(progress.strength).toEqual([]);
  });

  it('removeExerciseFromSession cascades sets and updates session totals', async () => {
    await planRepo.ensurePresetPlans();
    const today = await planRepo.getTodayTrainingDay('2026-05-11');
    const session = await workoutRepo.startGuidedSession(
      today!.id,
      new Date('2026-05-11T07:00:00'),
    );
    const target = session.exercises[0];

    await workoutRepo.addSet(target.id, {
      weightKg: 50,
      reps: 10,
      restSeconds: 60,
      effort: null,
      notes: null,
    });

    await workoutRepo.removeExerciseFromSession(target.id);

    const refreshed = await workoutRepo.getSession(session.id);
    expect(refreshed!.exercises.find((e) => e.id === target.id)).toBeUndefined();
    expect(refreshed!.total_volume).toBe(0);
  });

  it('cancelSession soft-cancels in-progress session (preserves row + child sets), refuses completed, supports undo', async () => {
    await planRepo.ensurePresetPlans();
    const today = await planRepo.getTodayTrainingDay('2026-05-11');
    const live = await workoutRepo.startGuidedSession(today!.id, new Date('2026-05-11T07:00:00'));
    await workoutRepo.addSet(live.exercises[0].id, {
      weightKg: 80,
      reps: 5,
      restSeconds: 90,
      effort: null,
      notes: null,
    });

    await workoutRepo.cancelSession(live.id, new Date('2026-05-11T07:15:00Z'));

    // Soft delete: row preserved, just status flipped + cancelled_at set.
    const cancelled = await workoutRepo.getSession(live.id);
    expect(cancelled).not.toBeNull();
    expect(cancelled!.exercises[0].sets.length).toBe(1); // child rows preserved
    const cancelledRow = await db.getOne<{ status: string; cancelled_at: string | null }>(
      `SELECT status, cancelled_at FROM workout_session WHERE id = ?`,
      [live.id],
    );
    expect(cancelledRow!.status).toBe('cancelled');
    expect(cancelledRow!.cancelled_at).toBe('2026-05-11T07:15:00.000Z');
    // Cancelled session is NOT an active session.
    expect(await workoutRepo.getActiveSession()).toBeNull();

    // Idempotent re-cancel.
    await workoutRepo.cancelSession(live.id, new Date('2026-05-11T07:20:00Z'));
    const afterReCancel = await db.getOne<{ cancelled_at: string }>(
      `SELECT cancelled_at FROM workout_session WHERE id = ?`,
      [live.id],
    );
    expect(afterReCancel!.cancelled_at).toBe('2026-05-11T07:15:00.000Z'); // unchanged

    // Undo restores 'active' status and clears cancelled_at.
    await workoutRepo.undoCancel(live.id);
    const restored = await workoutRepo.getActiveSession();
    expect(restored).not.toBeNull();
    expect(restored!.id).toBe(live.id);
    expect(restored!.exercises[0].sets.length).toBe(1); // sets still intact

    // Completed session is NOT cancellable via this API.
    await workoutRepo.completeSession(live.id, new Date('2026-05-11T08:30:00'));
    await expectAsync(workoutRepo.cancelSession(live.id)).toBeRejectedWithError(
      /already completed/,
    );
  });

  it('undoCancel refuses when another active session exists', async () => {
    await planRepo.ensurePresetPlans();
    const today = await planRepo.getTodayTrainingDay('2026-05-11');
    const first = await workoutRepo.startGuidedSession(today!.id, new Date('2026-05-11T07:00:00'));
    await workoutRepo.cancelSession(first.id);

    // Spawn another active session — first session can no longer be undone.
    const second = await workoutRepo.startGuidedSession(today!.id, new Date('2026-05-11T08:00:00'));
    expect(second.id).not.toBe(first.id);

    await expectAsync(workoutRepo.undoCancel(first.id)).toBeRejectedWithError(
      /another active session/,
    );
  });

  async function seedProfile(): Promise<void> {
    await db.execute(
      `INSERT INTO user_profile (
         id, height_cm, weight_kg, birth_date, gender, goal, fitness_level,
         activity_factor, bmr, tdee, target_calories, target_protein,
         target_carbs, target_fat, theme, onboarding_completed
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'profile-1',
        170,
        65,
        '1996-01-01',
        'male',
        'maintain',
        'beginner',
        1.55,
        1600,
        2480,
        2480,
        120,
        null,
        null,
        'light',
        1,
      ],
    );
  }

  function aiPlanDraft(): AiTrainingPlanDraft {
    return {
      name: 'AI Full Body',
      description: 'AI-generated full body plan.',
      frequency: 3,
      rationale: 'Beginner volume with progressive overload.',
      days: [
        {
          dayOfWeek: 1,
          name: 'Full Body A',
          isRestDay: false,
          exercises: [
            {
              exerciseId: 'squat',
              sets: 3,
              repsMin: 8,
              repsMax: 10,
              restSeconds: 120,
              notes: 'Tăng tạ khi đủ reps.',
            },
          ],
        },
        { dayOfWeek: 2, name: 'Rest Day', isRestDay: true, exercises: [] },
        {
          dayOfWeek: 3,
          name: 'Full Body B',
          isRestDay: false,
          exercises: [
            {
              exerciseId: 'bench-press',
              sets: 3,
              repsMin: 8,
              repsMax: 10,
              restSeconds: 120,
              notes: null,
            },
          ],
        },
        { dayOfWeek: 4, name: 'Rest Day', isRestDay: true, exercises: [] },
        {
          dayOfWeek: 5,
          name: 'Full Body C',
          isRestDay: false,
          exercises: [
            {
              exerciseId: 'seated-cable-row',
              sets: 3,
              repsMin: 10,
              repsMax: 12,
              restSeconds: 90,
              notes: null,
            },
          ],
        },
        { dayOfWeek: 6, name: 'Rest Day', isRestDay: true, exercises: [] },
        { dayOfWeek: 0, name: 'Rest Day', isRestDay: true, exercises: [] },
      ],
    };
  }
});
