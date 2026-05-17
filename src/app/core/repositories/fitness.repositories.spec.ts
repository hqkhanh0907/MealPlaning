import { TestBed } from '@angular/core/testing';
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

  it('creates three preset plans and activates Full Body by default', async () => {
    const plans = await planRepo.ensurePresetPlans();
    const active = await planRepo.getActivePlan();

    expect(plans.map((plan) => plan.type)).toEqual(['full_body', 'upper_lower', 'ppl']);
    expect(plans.find((plan) => plan.type === 'ppl')?.frequency).toBe(6);
    expect(active?.type).toBe('full_body');
    expect(active?.training_days).toBe(3);
    expect(active?.days.length).toBe(7);
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
    expect(progress.strength[0].estimated_1rm).toBe(117);
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

    const s1 = await workoutRepo.addSet(exerciseId, {
      weightKg: 100,
      reps: 5,
      restSeconds: 90,
      effort: null,
      notes: null,
    });
    const s2 = await workoutRepo.addSet(exerciseId, {
      weightKg: 100,
      reps: 5,
      restSeconds: 90,
      effort: null,
      notes: null,
    });
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

  it('cancelSession deletes an in-progress session entirely and refuses completed sessions', async () => {
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

    await workoutRepo.cancelSession(live.id);

    expect(await workoutRepo.getSession(live.id)).toBeNull();
    expect(await workoutRepo.getActiveSession()).toBeNull();

    // Completed session is NOT cancellable via this API.
    const second = await workoutRepo.startGuidedSession(today!.id, new Date('2026-05-11T08:00:00'));
    await workoutRepo.addSet(second.exercises[0].id, {
      weightKg: 80,
      reps: 5,
      restSeconds: 90,
      effort: null,
      notes: null,
    });
    await workoutRepo.completeSession(second.id, new Date('2026-05-11T08:30:00'));

    await expectAsync(workoutRepo.cancelSession(second.id)).toBeRejectedWithError(
      /already completed/,
    );
  });

  async function seedProfile(): Promise<void> {
    await db.execute(
      `INSERT INTO user_profile (
         id, height_cm, weight_kg, age, gender, goal, fitness_level,
         activity_factor, bmr, tdee, target_calories, target_protein,
         target_carbs, target_fat, theme, onboarding_completed
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'profile-1',
        170,
        65,
        30,
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
              exerciseId: 'ex_back_squat',
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
              exerciseId: 'ex_barbell_bench_press',
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
              exerciseId: 'ex_seated_cable_row',
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
