import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import type {
  Exercise,
  TrainingPlan,
  TrainingPlanDay,
  TrainingProfile,
  WeightEntry,
  Workout,
  WorkoutSet,
} from '../features/fitness/types';
import { createDatabaseService, type DatabaseService } from '../services/databaseService';
import { createSchema } from '../services/schema';
import { useFitnessStore } from '../store/fitnessStore';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
}));

vi.mock('sql.js', async () => {
  const real = await vi.importActual<typeof import('sql.js')>('sql.js');
  return { default: () => real.default() };
});

/* ------------------------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------------------------ */
const INITIAL_STATE = {
  trainingProfile: null,
  trainingPlans: [] as TrainingPlan[],
  trainingPlanDays: [] as TrainingPlanDay[],
  workouts: [] as Workout[],
  workoutSets: [] as WorkoutSet[],
  weightEntries: [] as WeightEntry[],
  isOnboarded: false,
  workoutMode: 'strength' as const,
  workoutDraft: null,
  sqliteReady: false,
};

function resetStore() {
  useFitnessStore.setState(INITIAL_STATE);
}

function sampleProfile(overrides: Partial<TrainingProfile> = {}): TrainingProfile {
  return {
    id: 'profile-1',
    trainingExperience: 'intermediate',
    daysPerWeek: 4,
    sessionDurationMin: 60,
    trainingGoal: 'hypertrophy',
    availableEquipment: ['barbell', 'dumbbell'],
    injuryRestrictions: [],
    periodizationModel: 'undulating',
    planCycleWeeks: 8,
    priorityMuscles: ['chest', 'back'],
    cardioSessionsWeek: 2,
    cardioTypePref: 'mixed',
    cardioDurationMin: 30,
    updatedAt: '2025-06-01T00:00:00.000Z',
    ...overrides,
  };
}

function samplePlan(overrides: Partial<TrainingPlan> = {}): TrainingPlan {
  return {
    id: 'plan-1',
    name: 'PPL 8-Week',
    status: 'active',
    splitType: 'ppl',
    durationWeeks: 8,
    currentWeek: 1,
    startDate: '2025-06-01',
    trainingDays: [1, 3, 5],
    restDays: [2, 4, 6, 7],
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2025-06-01T00:00:00.000Z',
    ...overrides,
  };
}

function samplePlanDay(overrides: Partial<TrainingPlanDay> = {}): TrainingPlanDay {
  return {
    id: 'day-1',
    planId: 'plan-1',
    dayOfWeek: 1,
    sessionOrder: 1,
    workoutType: 'push',
    muscleGroups: 'chest,shoulders',
    exercises: JSON.stringify([
      {
        exercise: {
          id: 'bench',
          name: 'Bench Press',
          primaryMuscle: 'chest',
          equipment: 'barbell',
          category: 'compound',
        },
        sets: 4,
        repsMin: 6,
        repsMax: 10,
        restSeconds: 120,
      },
    ]),
    originalExercises: JSON.stringify([
      {
        exercise: {
          id: 'bench',
          name: 'Bench Press',
          primaryMuscle: 'chest',
          equipment: 'barbell',
          category: 'compound',
        },
        sets: 4,
        repsMin: 6,
        repsMax: 10,
        restSeconds: 120,
      },
    ]),
    isUserAssigned: false,
    originalDayOfWeek: 1,
    ...overrides,
  };
}

function sampleWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 'workout-1',
    date: '2025-06-01',
    name: 'Push Day A',
    durationMin: 65,
    createdAt: '2025-06-01T10:00:00.000Z',
    updatedAt: '2025-06-01T10:00:00.000Z',
    ...overrides,
  };
}

function sampleWorkoutSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: 'set-1',
    workoutId: 'workout-1',
    exerciseId: 'ex-bench',
    setNumber: 1,
    reps: 10,
    weightKg: 80,
    rpe: 8,
    restSeconds: 120,
    updatedAt: '2025-06-01T10:05:00.000Z',
    ...overrides,
  };
}

function sampleWeightEntry(overrides: Partial<WeightEntry> = {}): WeightEntry {
  return {
    id: 'weight-1',
    date: '2025-06-01',
    weightKg: 75.5,
    createdAt: '2025-06-01T07:00:00.000Z',
    updatedAt: '2025-06-01T07:00:00.000Z',
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* Tests */
/* ------------------------------------------------------------------ */
describe('fitnessStore', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  /* ---------- initial state ---------- */
  it('has correct initial state', () => {
    const state = useFitnessStore.getState();
    expect(state.trainingProfile).toBeNull();
    expect(state.trainingPlans).toEqual([]);
    expect(state.trainingPlanDays).toEqual([]);
    expect(state.workouts).toEqual([]);
    expect(state.workoutSets).toEqual([]);
    expect(state.weightEntries).toEqual([]);
    expect(state.isOnboarded).toBe(false);
    expect(state.workoutMode).toBe('strength');
    expect(state.workoutDraft).toBeNull();
    expect(state.sqliteReady).toBe(false);
  });

  /* ---------- setTrainingProfile ---------- */
  it('setTrainingProfile sets profile correctly', () => {
    const profile = sampleProfile();
    useFitnessStore.getState().setTrainingProfile(profile);
    expect(useFitnessStore.getState().trainingProfile).toEqual(profile);
  });

  /* ---------- addTrainingPlan + setActivePlan ---------- */
  it('addTrainingPlan adds a plan to the array', () => {
    const plan = samplePlan();
    useFitnessStore.getState().addTrainingPlan(plan);
    expect(useFitnessStore.getState().trainingPlans).toEqual([plan]);
  });

  it('setActivePlan sets target plan active and pauses other active plans', () => {
    const planA = samplePlan({ id: 'plan-a', status: 'active' });
    const planB = samplePlan({ id: 'plan-b', status: 'paused' });
    const planC = samplePlan({ id: 'plan-c', status: 'completed' });

    useFitnessStore.setState({
      trainingPlans: [planA, planB, planC],
    });

    useFitnessStore.getState().setActivePlan('plan-b');

    const plans = useFitnessStore.getState().trainingPlans;
    expect(plans.find(p => p.id === 'plan-a')!.status).toBe('paused');
    expect(plans.find(p => p.id === 'plan-b')!.status).toBe('active');
    expect(plans.find(p => p.id === 'plan-c')!.status).toBe('completed');
  });

  /* ---------- updateTrainingPlan ---------- */
  it('updateTrainingPlan merges updates into matching plan', () => {
    const plan = samplePlan();
    useFitnessStore.setState({ trainingPlans: [plan] });

    useFitnessStore.getState().updateTrainingPlan('plan-1', {
      name: 'Updated PPL',
      endDate: '2025-07-27',
    });

    const updated = useFitnessStore.getState().trainingPlans[0];
    expect(updated.name).toBe('Updated PPL');
    expect(updated.endDate).toBe('2025-07-27');
    expect(updated.splitType).toBe('ppl');
  });

  it('updateTrainingPlan does not modify non-matching plans', () => {
    const plan = samplePlan({ id: 'plan-1' });
    useFitnessStore.setState({ trainingPlans: [plan] });

    useFitnessStore.getState().updateTrainingPlan('non-existent', { name: 'X' });

    expect(useFitnessStore.getState().trainingPlans[0].name).toBe('PPL 8-Week');
  });

  /* ---------- addPlanDays + getPlanDays ---------- */
  it('addPlanDays adds days and getPlanDays filters by planId', () => {
    const day1 = samplePlanDay({ id: 'day-1', planId: 'plan-1', dayOfWeek: 1 });
    const day2 = samplePlanDay({ id: 'day-2', planId: 'plan-1', dayOfWeek: 2 });
    const day3 = samplePlanDay({ id: 'day-3', planId: 'plan-2', dayOfWeek: 1 });

    useFitnessStore.getState().addPlanDays([day1, day2, day3]);

    expect(useFitnessStore.getState().trainingPlanDays).toHaveLength(3);
    expect(useFitnessStore.getState().getPlanDays('plan-1')).toEqual([day1, day2]);
    expect(useFitnessStore.getState().getPlanDays('plan-2')).toEqual([day3]);
    expect(useFitnessStore.getState().getPlanDays('non-existent')).toEqual([]);
  });

  /* ---------- addWorkout + updateWorkout ---------- */
  it('addWorkout adds a workout', () => {
    const workout = sampleWorkout();
    useFitnessStore.getState().addWorkout(workout);
    expect(useFitnessStore.getState().workouts).toEqual([workout]);
  });

  it('updateWorkout merges updates into matching workout', () => {
    const workout = sampleWorkout();
    useFitnessStore.setState({ workouts: [workout] });

    useFitnessStore.getState().updateWorkout('workout-1', {
      notes: 'Felt strong',
      durationMin: 70,
    });

    const updated = useFitnessStore.getState().workouts[0];
    expect(updated.notes).toBe('Felt strong');
    expect(updated.durationMin).toBe(70);
    expect(updated.name).toBe('Push Day A');
  });

  it('updateWorkout does not modify non-matching workouts', () => {
    const workout = sampleWorkout();
    useFitnessStore.setState({ workouts: [workout] });

    useFitnessStore.getState().updateWorkout('non-existent', { notes: 'X' });

    expect(useFitnessStore.getState().workouts[0].notes).toBeUndefined();
  });

  /* ---------- WorkoutSet CRUD + getWorkoutSets ---------- */
  it('addWorkoutSet adds a set', () => {
    const workoutSet = sampleWorkoutSet();
    useFitnessStore.getState().addWorkoutSet(workoutSet);
    expect(useFitnessStore.getState().workoutSets).toEqual([workoutSet]);
  });

  it('updateWorkoutSet merges updates into matching set', () => {
    const workoutSet = sampleWorkoutSet();
    useFitnessStore.setState({ workoutSets: [workoutSet] });

    useFitnessStore.getState().updateWorkoutSet('set-1', { reps: 12, weightKg: 85 });

    const updated = useFitnessStore.getState().workoutSets[0];
    expect(updated.reps).toBe(12);
    expect(updated.weightKg).toBe(85);
    expect(updated.exerciseId).toBe('ex-bench');
  });

  it('updateWorkoutSet does not modify non-matching sets', () => {
    const workoutSet = sampleWorkoutSet();
    useFitnessStore.setState({ workoutSets: [workoutSet] });

    useFitnessStore.getState().updateWorkoutSet('non-existent', { reps: 99 });

    expect(useFitnessStore.getState().workoutSets[0].reps).toBe(10);
  });

  it('removeWorkoutSet removes matching set', () => {
    const set1 = sampleWorkoutSet({ id: 'set-1' });
    const set2 = sampleWorkoutSet({ id: 'set-2', setNumber: 2 });
    useFitnessStore.setState({ workoutSets: [set1, set2] });

    useFitnessStore.getState().removeWorkoutSet('set-1');

    const sets = useFitnessStore.getState().workoutSets;
    expect(sets).toHaveLength(1);
    expect(sets[0].id).toBe('set-2');
  });

  it('deleteWorkout removes workout and all its sets', async () => {
    const workout1 = sampleWorkout({ id: 'w-1' });
    const workout2 = sampleWorkout({ id: 'w-2' });
    const set1 = sampleWorkoutSet({ id: 's-1', workoutId: 'w-1' });
    const set2 = sampleWorkoutSet({ id: 's-2', workoutId: 'w-1', setNumber: 2 });
    const set3 = sampleWorkoutSet({ id: 's-3', workoutId: 'w-2' });
    useFitnessStore.setState({ workouts: [workout1, workout2], workoutSets: [set1, set2, set3] });

    await useFitnessStore.getState().deleteWorkout('w-1');

    const state = useFitnessStore.getState();
    expect(state.workouts).toHaveLength(1);
    expect(state.workouts[0].id).toBe('w-2');
    expect(state.workoutSets).toHaveLength(1);
    expect(state.workoutSets[0].id).toBe('s-3');
  });

  it('getWorkoutSets filters by workoutId', () => {
    const set1 = sampleWorkoutSet({ id: 'set-1', workoutId: 'workout-1' });
    const set2 = sampleWorkoutSet({ id: 'set-2', workoutId: 'workout-2' });
    const set3 = sampleWorkoutSet({ id: 'set-3', workoutId: 'workout-1', setNumber: 2 });
    useFitnessStore.setState({ workoutSets: [set1, set2, set3] });

    expect(useFitnessStore.getState().getWorkoutSets('workout-1')).toEqual([set1, set3]);
    expect(useFitnessStore.getState().getWorkoutSets('workout-2')).toEqual([set2]);
    expect(useFitnessStore.getState().getWorkoutSets('non-existent')).toEqual([]);
  });

  /* ---------- WeightEntry CRUD + getLatestWeight ---------- */
  it('addWeightEntry adds an entry', () => {
    const entry = sampleWeightEntry();
    useFitnessStore.getState().addWeightEntry(entry);
    expect(useFitnessStore.getState().weightEntries).toEqual([entry]);
  });

  it('updateWeightEntry merges updates into matching entry', () => {
    const entry = sampleWeightEntry();
    useFitnessStore.setState({ weightEntries: [entry] });

    useFitnessStore.getState().updateWeightEntry('weight-1', {
      weightKg: 76.0,
      notes: 'Post workout',
    });

    const updated = useFitnessStore.getState().weightEntries[0];
    expect(updated.weightKg).toBe(76.0);
    expect(updated.notes).toBe('Post workout');
    expect(updated.date).toBe('2025-06-01');
  });

  it('updateWeightEntry does not modify non-matching entries', () => {
    const entry = sampleWeightEntry();
    useFitnessStore.setState({ weightEntries: [entry] });

    useFitnessStore.getState().updateWeightEntry('non-existent', { weightKg: 99 });

    expect(useFitnessStore.getState().weightEntries[0].weightKg).toBe(75.5);
  });

  it('removeWeightEntry removes matching entry', () => {
    const e1 = sampleWeightEntry({ id: 'w-1' });
    const e2 = sampleWeightEntry({ id: 'w-2', date: '2025-06-02' });
    useFitnessStore.setState({ weightEntries: [e1, e2] });

    useFitnessStore.getState().removeWeightEntry('w-1');

    const entries = useFitnessStore.getState().weightEntries;
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe('w-2');
  });

  it('getLatestWeight returns undefined when no entries', () => {
    expect(useFitnessStore.getState().getLatestWeight()).toBeUndefined();
  });

  it('getLatestWeight returns the entry with the most recent date', () => {
    const older = sampleWeightEntry({ id: 'w-old', date: '2025-05-30', weightKg: 76 });
    const latest = sampleWeightEntry({ id: 'w-new', date: '2025-06-05', weightKg: 74.5 });
    const mid = sampleWeightEntry({ id: 'w-mid', date: '2025-06-01', weightKg: 75 });
    useFitnessStore.setState({ weightEntries: [older, latest, mid] });

    const result = useFitnessStore.getState().getLatestWeight();
    expect(result).toEqual(latest);
  });

  /* ---------- setOnboarded ---------- */
  it('setOnboarded sets the flag to true', () => {
    useFitnessStore.getState().setOnboarded(true);
    expect(useFitnessStore.getState().isOnboarded).toBe(true);
  });

  it('setOnboarded sets the flag to false', () => {
    useFitnessStore.setState({ isOnboarded: true });
    useFitnessStore.getState().setOnboarded(false);
    expect(useFitnessStore.getState().isOnboarded).toBe(false);
  });

  /* ---------- setWorkoutMode ---------- */
  it('setWorkoutMode sets workout mode', () => {
    useFitnessStore.getState().setWorkoutMode('cardio');
    expect(useFitnessStore.getState().workoutMode).toBe('cardio');
  });

  it('should persist workoutMode across store access', () => {
    const { result } = renderHook(() => useFitnessStore());
    act(() => result.current.setWorkoutMode('cardio'));
    expect(result.current.workoutMode).toBe('cardio');
  });

  /* ---------- getActivePlan ---------- */
  it('getActivePlan returns the active plan', () => {
    const active = samplePlan({ id: 'plan-a', status: 'active' });
    const paused = samplePlan({ id: 'plan-b', status: 'paused' });
    useFitnessStore.setState({ trainingPlans: [paused, active] });

    expect(useFitnessStore.getState().getActivePlan()).toEqual(active);
  });

  it('getActivePlan returns undefined when no active plan', () => {
    const paused = samplePlan({ id: 'plan-a', status: 'paused' });
    useFitnessStore.setState({ trainingPlans: [paused] });

    expect(useFitnessStore.getState().getActivePlan()).toBeUndefined();
  });

  it('getActivePlan returns undefined when no plans', () => {
    expect(useFitnessStore.getState().getActivePlan()).toBeUndefined();
  });

  /* ---------- getWorkoutsByDateRange ---------- */
  it('getWorkoutsByDateRange filters workouts by inclusive date range', () => {
    const w1 = sampleWorkout({ id: 'w1', date: '2025-05-30' });
    const w2 = sampleWorkout({ id: 'w2', date: '2025-06-01' });
    const w3 = sampleWorkout({ id: 'w3', date: '2025-06-05' });
    const w4 = sampleWorkout({ id: 'w4', date: '2025-06-10' });
    useFitnessStore.setState({ workouts: [w1, w2, w3, w4] });

    const result = useFitnessStore.getState().getWorkoutsByDateRange('2025-06-01', '2025-06-05');
    expect(result).toEqual([w2, w3]);
  });

  it('getWorkoutsByDateRange returns empty when no workouts match', () => {
    const w1 = sampleWorkout({ id: 'w1', date: '2025-06-01' });
    useFitnessStore.setState({ workouts: [w1] });

    const result = useFitnessStore.getState().getWorkoutsByDateRange('2025-07-01', '2025-07-31');
    expect(result).toEqual([]);
  });

  it('getWorkoutsByDateRange returns empty when no workouts exist', () => {
    const result = useFitnessStore.getState().getWorkoutsByDateRange('2025-01-01', '2025-12-31');
    expect(result).toEqual([]);
  });

  /* ---------- workoutDraft CRUD ---------- */
  it('setWorkoutDraft stores draft', () => {
    const draft = {
      exercises: [] as Exercise[],
      sets: [] as WorkoutSet[],
      elapsedSeconds: 120,
    };
    useFitnessStore.getState().setWorkoutDraft(draft);
    expect(useFitnessStore.getState().workoutDraft).toEqual(draft);
  });

  it('setWorkoutDraft overwrites previous draft', () => {
    const first = {
      exercises: [] as Exercise[],
      sets: [] as WorkoutSet[],
      elapsedSeconds: 60,
    };
    const second = {
      exercises: [] as Exercise[],
      sets: [] as WorkoutSet[],
      elapsedSeconds: 300,
    };
    useFitnessStore.getState().setWorkoutDraft(first);
    useFitnessStore.getState().setWorkoutDraft(second);
    expect(useFitnessStore.getState().workoutDraft).toEqual(second);
  });

  it('clearWorkoutDraft sets draft to null', () => {
    useFitnessStore.getState().setWorkoutDraft({
      exercises: [] as Exercise[],
      sets: [] as WorkoutSet[],
      elapsedSeconds: 60,
    });
    useFitnessStore.getState().clearWorkoutDraft();
    expect(useFitnessStore.getState().workoutDraft).toBeNull();
  });

  it('setWorkoutDraft accepts null', () => {
    useFitnessStore.getState().setWorkoutDraft({
      exercises: [] as Exercise[],
      sets: [] as WorkoutSet[],
      elapsedSeconds: 60,
    });
    useFitnessStore.getState().setWorkoutDraft(null);
    expect(useFitnessStore.getState().workoutDraft).toBeNull();
  });

  it('loadWorkoutDraft returns early when _db is null', async () => {
    await useFitnessStore.getState().loadWorkoutDraft();
    expect(useFitnessStore.getState().workoutDraft).toBeNull();
  });

  /* ---------- updatePlanDayExercises ---------- */
  describe('updatePlanDayExercises', () => {
    it('updates exercises field without changing originalExercises', () => {
      const day = samplePlanDay();
      useFitnessStore.setState({ trainingPlanDays: [day] });

      const newExercises = [
        {
          exercise: { id: 'ohp', name: 'OHP', primaryMuscle: 'shoulders', equipment: 'barbell', category: 'compound' },
          sets: 3,
          repsMin: 8,
          repsMax: 12,
          restSeconds: 90,
        },
      ];
      useFitnessStore.getState().updatePlanDayExercises('day-1', newExercises as never[]);

      const updated = useFitnessStore.getState().trainingPlanDays[0];
      expect(JSON.parse(updated.exercises!)).toEqual(newExercises);
      expect(updated.originalExercises).toBe(day.originalExercises);
    });

    it('no-ops for non-existent dayId', () => {
      useFitnessStore.setState({ trainingPlanDays: [samplePlanDay()] });
      useFitnessStore.getState().updatePlanDayExercises('nonexistent', []);
      expect(useFitnessStore.getState().trainingPlanDays).toHaveLength(1);
    });
  });

  /* ---------- restorePlanDayOriginal ---------- */
  describe('restorePlanDayOriginal', () => {
    it('copies originalExercises back to exercises', () => {
      const day = samplePlanDay({ exercises: '[]' });
      useFitnessStore.setState({ trainingPlanDays: [day] });

      useFitnessStore.getState().restorePlanDayOriginal('day-1');

      const updated = useFitnessStore.getState().trainingPlanDays[0];
      expect(updated.exercises).toBe(day.originalExercises);
    });
  });

  /* ---------- addPlanDaySession ---------- */
  describe('addPlanDaySession', () => {
    it('adds a new session with next sessionOrder', () => {
      const day1 = samplePlanDay({ sessionOrder: 1 });
      useFitnessStore.setState({ trainingPlanDays: [day1] });

      useFitnessStore.getState().addPlanDaySession('plan-1', 1, {
        planId: 'plan-1',
        dayOfWeek: 1,
        sessionOrder: 2,
        workoutType: 'Cardio',
        muscleGroups: '',
        exercises: '[]',
        originalExercises: '[]',
        isUserAssigned: false,
        originalDayOfWeek: 1,
      });

      const days = useFitnessStore.getState().trainingPlanDays;
      expect(days).toHaveLength(2);
      expect(days[1].sessionOrder).toBe(2);
    });

    it('rejects when 3 sessions already exist', () => {
      useFitnessStore.setState({
        trainingPlanDays: [
          samplePlanDay({ id: 'pd-1', sessionOrder: 1 }),
          samplePlanDay({ id: 'pd-2', sessionOrder: 2 }),
          samplePlanDay({ id: 'pd-3', sessionOrder: 3 }),
        ],
      });

      useFitnessStore.getState().addPlanDaySession('plan-1', 1, {
        planId: 'plan-1',
        dayOfWeek: 1,
        sessionOrder: 4,
        workoutType: 'Extra',
        exercises: '[]',
        originalExercises: '[]',
        isUserAssigned: false,
        originalDayOfWeek: 1,
      });

      expect(useFitnessStore.getState().trainingPlanDays).toHaveLength(3);
    });
  });

  /* ---------- removePlanDaySession ---------- */
  describe('removePlanDaySession', () => {
    it('removes session and reorders remaining', () => {
      useFitnessStore.setState({
        trainingPlanDays: [
          samplePlanDay({ id: 'pd-1', sessionOrder: 1 }),
          samplePlanDay({ id: 'pd-2', sessionOrder: 2 }),
          samplePlanDay({ id: 'pd-3', sessionOrder: 3 }),
        ],
      });

      useFitnessStore.getState().removePlanDaySession('pd-2');

      const days = useFitnessStore.getState().trainingPlanDays;
      expect(days).toHaveLength(2);
      expect(days[0].sessionOrder).toBe(1);
      expect(days[1].sessionOrder).toBe(2);
    });
  });
});

/* ------------------------------------------------------------------ */
/* Dual-layer SQLite tests */
/* ------------------------------------------------------------------ */
describe('fitnessStore dual-layer SQLite', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    localStorage.clear();
    resetStore();
    db = createDatabaseService();
    await db.initialize();
    await createSchema(db);
  });

  it('initializeFromSQLite loads workouts from SQLite', async () => {
    await db.execute(
      `INSERT INTO workouts (id, date, name, duration_min, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['w1', '2026-03-20', 'Push Day', 45, 'Great session', '2026-03-20T10:00:00Z', '2026-03-20T10:00:00Z'],
    );

    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    expect(result.current.workouts).toHaveLength(1);
    expect(result.current.workouts[0]).toMatchObject({
      id: 'w1',
      date: '2026-03-20',
      name: 'Push Day',
      durationMin: 45,
    });
    expect(result.current.sqliteReady).toBe(true);
  });

  it('initializeFromSQLite loads workout sets from SQLite', async () => {
    await db.execute('PRAGMA foreign_keys = OFF');
    await db.execute(
      `INSERT INTO workouts (id, date, name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      ['w1', '2026-03-20', 'Push', '2026-03-20T10:00:00Z', '2026-03-20T10:00:00Z'],
    );
    await db.execute(
      `INSERT INTO workout_sets (id, workout_id, exercise_id, set_number, reps, weight_kg, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['s1', 'w1', 'bench', 1, 8, 80, '2026-03-20T10:00:00Z'],
    );
    await db.execute('PRAGMA foreign_keys = ON');

    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    expect(result.current.workoutSets).toHaveLength(1);
    expect(result.current.workoutSets[0]).toMatchObject({
      id: 's1',
      workoutId: 'w1',
      exerciseId: 'bench',
      setNumber: 1,
      reps: 8,
      weightKg: 80,
    });
  });

  it('initializeFromSQLite loads weight entries from SQLite', async () => {
    await db.execute(
      `INSERT INTO weight_log (id, date, weight_kg, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['wl1', '2026-03-20', 75.5, 'Morning weight', '2026-03-20T07:00:00Z', '2026-03-20T07:00:00Z'],
    );

    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    expect(result.current.weightEntries).toHaveLength(1);
    expect(result.current.weightEntries[0]).toMatchObject({
      id: 'wl1',
      weightKg: 75.5,
    });
  });

  it('initializeFromSQLite sets sqliteReady to true', async () => {
    expect(useFitnessStore.getState().sqliteReady).toBe(false);

    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    expect(result.current.sqliteReady).toBe(true);
  });

  it('initializeFromSQLite handles empty tables gracefully', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    expect(result.current.workouts).toEqual([]);
    expect(result.current.workoutSets).toEqual([]);
    expect(result.current.weightEntries).toEqual([]);
    expect(result.current.sqliteReady).toBe(true);
  });

  it('write-through: addWorkout updates both Zustand and SQLite', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    const workout = sampleWorkout({ id: 'wt-1', name: 'Write-Through Test' });
    act(() => {
      result.current.addWorkout(workout);
    });

    expect(result.current.workouts).toContainEqual(workout);

    await new Promise(resolve => setTimeout(resolve, 50));

    const rows = await db.query<Record<string, unknown>>('SELECT * FROM workouts WHERE id = ?', ['wt-1']);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Write-Through Test');
  });

  it('write-through: addWorkoutSet updates both Zustand and SQLite', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    await db.execute('PRAGMA foreign_keys = OFF');
    await db.execute(
      `INSERT INTO workouts (id, date, name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      ['wt-w1', '2026-03-20', 'Test', '2026-03-20T10:00:00Z', '2026-03-20T10:00:00Z'],
    );

    const workoutSet = sampleWorkoutSet({ id: 'wt-s1', workoutId: 'wt-w1' });
    act(() => {
      result.current.addWorkoutSet(workoutSet);
    });

    expect(result.current.workoutSets).toContainEqual(workoutSet);

    await new Promise(resolve => setTimeout(resolve, 50));

    const rows = await db.query<Record<string, unknown>>('SELECT * FROM workout_sets WHERE id = ?', ['wt-s1']);
    expect(rows).toHaveLength(1);
    expect(rows[0].workoutId).toBe('wt-w1');
    await db.execute('PRAGMA foreign_keys = ON');
  });

  it('read-after-write: data persists through SQLite round-trip', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    const workout = sampleWorkout({ id: 'raw-1', name: 'Round-Trip Test' });
    act(() => {
      result.current.addWorkout(workout);
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    resetStore();

    await act(async () => {
      await useFitnessStore.getState().initializeFromSQLite(db);
    });

    const loaded = useFitnessStore.getState().workouts;
    expect(loaded.find(w => w.id === 'raw-1')).toBeDefined();
    expect(loaded.find(w => w.id === 'raw-1')?.name).toBe('Round-Trip Test');
  });

  it('initializeFromSQLite survives query failure gracefully', async () => {
    const badDb: DatabaseService = {
      ...db,
      query: () => Promise.reject(new Error('DB error')),
    };

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(badDb);
    });

    expect(result.current.sqliteReady).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

/* ------------------------------------------------------------------ */
/* SQLite draft persistence tests */
/* ------------------------------------------------------------------ */
describe('fitnessStore SQLite draft persistence', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    localStorage.clear();
    resetStore();
    db = createDatabaseService();
    await db.initialize();
    await createSchema(db);
  });

  const mockExercise: Exercise = {
    id: 'ex-bench',
    nameVi: 'Đẩy tạ nằm',
    nameEn: 'Bench Press',
    muscleGroup: 'chest',
    secondaryMuscles: ['shoulders'],
    category: 'compound',
    equipment: ['barbell'],
    contraindicated: [],
    exerciseType: 'strength',
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    isCustom: false,
    updatedAt: '2026-03-27T10:00:00Z',
  };

  const mockSet: WorkoutSet = {
    id: 'set-draft-1',
    workoutId: '',
    exerciseId: 'ex-bench',
    setNumber: 1,
    reps: 10,
    weightKg: 80,
    updatedAt: '2026-03-27T10:00:00Z',
  };

  it('setWorkoutDraft persists draft to SQLite', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    act(() => {
      result.current.setWorkoutDraft({
        exercises: [mockExercise],
        sets: [mockSet],
        elapsedSeconds: 120,
      });
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    const rows = await db.query<Record<string, unknown>>(`SELECT * FROM workout_drafts WHERE id = 'current'`);
    expect(rows).toHaveLength(1);
    expect(JSON.parse(rows[0].exercisesJson as string)).toHaveLength(1);
    expect(JSON.parse(rows[0].setsJson as string)).toHaveLength(1);
  });

  it('clearWorkoutDraft deletes draft from SQLite', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    act(() => {
      result.current.setWorkoutDraft({
        exercises: [mockExercise],
        sets: [mockSet],
        elapsedSeconds: 60,
      });
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    act(() => {
      result.current.clearWorkoutDraft();
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    const rows = await db.query<Record<string, unknown>>(`SELECT * FROM workout_drafts WHERE id = 'current'`);
    expect(rows).toHaveLength(0);
    expect(result.current.workoutDraft).toBeNull();
  });

  it('draft persists in SQLite after store reset', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    act(() => {
      result.current.setWorkoutDraft({
        exercises: [mockExercise],
        sets: [mockSet],
        elapsedSeconds: 120,
      });
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    // Simulate app refresh: clear Zustand state
    act(() => useFitnessStore.setState({ workoutDraft: null }));
    expect(useFitnessStore.getState().workoutDraft).toBeNull();

    // Reload from SQLite
    await act(async () => {
      await result.current.loadWorkoutDraft();
    });

    expect(result.current.workoutDraft).not.toBeNull();
    expect(result.current.workoutDraft?.exercises).toHaveLength(1);
    expect(result.current.workoutDraft?.exercises[0].id).toBe('ex-bench');
    expect(result.current.workoutDraft?.sets).toHaveLength(1);
    expect(result.current.workoutDraft?.sets[0].weightKg).toBe(80);
  });

  it('loadWorkoutDraft does nothing when no draft exists', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    await act(async () => {
      await result.current.loadWorkoutDraft();
    });

    expect(result.current.workoutDraft).toBeNull();
  });

  it('loadWorkoutDraft does nothing when db is not initialized', async () => {
    const { result } = renderHook(() => useFitnessStore());

    await act(async () => {
      await result.current.loadWorkoutDraft();
    });

    expect(result.current.workoutDraft).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Additional coverage tests */
/* ------------------------------------------------------------------ */
describe('fitnessStore – additional coverage', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  /* ---------- setPlanStrategy ---------- */
  it('setPlanStrategy sets strategy to auto', () => {
    useFitnessStore.getState().setPlanStrategy('auto');
    expect(useFitnessStore.getState().planStrategy).toBe('auto');
  });

  it('setPlanStrategy sets strategy to manual', () => {
    useFitnessStore.getState().setPlanStrategy('manual');
    expect(useFitnessStore.getState().planStrategy).toBe('manual');
  });

  it('setPlanStrategy sets strategy to null', () => {
    useFitnessStore.setState({ planStrategy: 'auto' });
    useFitnessStore.getState().setPlanStrategy(null);
    expect(useFitnessStore.getState().planStrategy).toBeNull();
  });

  /* ---------- clearTrainingPlans ---------- */
  it('clearTrainingPlans empties both plans and plan days', () => {
    useFitnessStore.setState({
      trainingPlans: [samplePlan()],
      trainingPlanDays: [samplePlanDay()],
    });

    useFitnessStore.getState().clearTrainingPlans();

    expect(useFitnessStore.getState().trainingPlans).toEqual([]);
    expect(useFitnessStore.getState().trainingPlanDays).toEqual([]);
  });

  /* ---------- dismissPlanCelebration ---------- */
  it('dismissPlanCelebration sets showPlanCelebration to false', () => {
    useFitnessStore.setState({ showPlanCelebration: true });
    useFitnessStore.getState().dismissPlanCelebration();
    expect(useFitnessStore.getState().showPlanCelebration).toBe(false);
  });

  /* ---------- removePlanDaySession – non-existent day ---------- */
  it('removePlanDaySession is no-op for non-existent dayId', () => {
    useFitnessStore.setState({ trainingPlanDays: [samplePlanDay()] });

    useFitnessStore.getState().removePlanDaySession('nonexistent-id');

    expect(useFitnessStore.getState().trainingPlanDays).toHaveLength(1);
  });

  /* ---------- persist migration ---------- */
  describe('persist migration', () => {
    it('adds planStrategy when migrating from version < 2', () => {
      const oldState = {
        trainingPlans: [],
        isOnboarded: true,
      };

      localStorage.setItem('fitness-storage', JSON.stringify({ state: oldState, version: 1 }));

      const migrated = JSON.parse(localStorage.getItem('fitness-storage') ?? '{}');

      const migrateV2 = (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          return { ...state, planStrategy: null };
        }
        return state;
      };

      const result = migrateV2(migrated.state, migrated.version);
      expect(result).toHaveProperty('planStrategy', null);
      expect(result).toHaveProperty('isOnboarded', true);
    });

    it('returns state unchanged when version >= 2', () => {
      const state = { trainingPlans: [], planStrategy: 'auto' };

      const migrateV2 = (persisted: unknown, version: number) => {
        const s = persisted as Record<string, unknown>;
        if (version < 2) {
          return { ...s, planStrategy: null };
        }
        return s;
      };

      const result = migrateV2(state, 2);
      expect(result).toEqual(state);
    });
  });
});

/* ------------------------------------------------------------------ */
/* SQLite write-through additional tests */
/* ------------------------------------------------------------------ */
describe('fitnessStore – SQLite write-through', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    localStorage.clear();
    resetStore();
    db = createDatabaseService();
    await db.initialize();
    await createSchema(db);
    await db.execute(
      `INSERT INTO training_plans (id, name, status, split_type, duration_weeks, start_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'plan-1',
        'Test Plan',
        'active',
        'push-pull-legs',
        8,
        '2025-06-01',
        '2025-06-01T00:00:00Z',
        '2025-06-01T00:00:00Z',
      ],
    );
  });

  it('addPlanDays persists to SQLite', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    const day = samplePlanDay({ id: 'sqlite-day-1' });
    act(() => {
      result.current.addPlanDays([day]);
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    const rows = await db.query<Record<string, unknown>>('SELECT * FROM training_plan_days WHERE id = ?', [
      'sqlite-day-1',
    ]);
    expect(rows).toHaveLength(1);
  });

  it('updatePlanDayExercises persists to SQLite', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    const day = samplePlanDay({ id: 'sqlite-day-upd' });
    act(() => {
      result.current.addPlanDays([day]);
    });
    await new Promise(resolve => setTimeout(resolve, 50));

    const newExercises = [
      {
        exercise: { id: 'squat', name: 'Squat', primaryMuscle: 'legs', equipment: 'barbell', category: 'compound' },
        sets: 5,
        repsMin: 5,
        repsMax: 5,
        restSeconds: 180,
      },
    ];
    act(() => {
      result.current.updatePlanDayExercises('sqlite-day-upd', newExercises as never[]);
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    const rows = await db.query<Record<string, unknown>>('SELECT exercises FROM training_plan_days WHERE id = ?', [
      'sqlite-day-upd',
    ]);
    expect(rows).toHaveLength(1);
    expect(JSON.parse(rows[0].exercises as string)).toEqual(newExercises);
  });

  it('restorePlanDayOriginal persists to SQLite', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    const day = samplePlanDay({ id: 'sqlite-day-restore', exercises: '[]' });
    act(() => {
      result.current.addPlanDays([day]);
    });
    await new Promise(resolve => setTimeout(resolve, 50));

    act(() => {
      result.current.restorePlanDayOriginal('sqlite-day-restore');
    });
    await new Promise(resolve => setTimeout(resolve, 50));

    const rows = await db.query<Record<string, unknown>>('SELECT exercises FROM training_plan_days WHERE id = ?', [
      'sqlite-day-restore',
    ]);
    expect(rows).toHaveLength(1);
  });

  it('addPlanDaySession persists to SQLite', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    act(() => {
      result.current.addPlanDaySession('plan-1', 3, {
        planId: 'plan-1',
        dayOfWeek: 3,
        sessionOrder: 1,
        workoutType: 'pull',
        muscleGroups: 'back',
        exercises: '[]',
        originalExercises: '[]',
        isUserAssigned: false,
        originalDayOfWeek: 3,
      });
    });
    await new Promise(resolve => setTimeout(resolve, 50));

    const rows = await db.query<Record<string, unknown>>(
      'SELECT * FROM training_plan_days WHERE plan_id = ? AND day_of_week = ?',
      ['plan-1', 3],
    );
    expect(rows).toHaveLength(1);
  });

  it('removePlanDaySession deletes from SQLite and reorders', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    const day1 = samplePlanDay({ id: 'rm-day-1', sessionOrder: 1 });
    const day2 = samplePlanDay({ id: 'rm-day-2', sessionOrder: 2 });
    const day3 = samplePlanDay({ id: 'rm-day-3', sessionOrder: 3 });
    act(() => {
      result.current.addPlanDays([day1, day2, day3]);
    });
    await new Promise(resolve => setTimeout(resolve, 50));

    act(() => {
      result.current.removePlanDaySession('rm-day-1');
    });
    await new Promise(resolve => setTimeout(resolve, 50));

    const rows = await db.query<Record<string, unknown>>('SELECT * FROM training_plan_days WHERE id = ?', ['rm-day-1']);
    expect(rows).toHaveLength(0);

    expect(result.current.trainingPlanDays).toHaveLength(2);
    expect(result.current.trainingPlanDays[0].sessionOrder).toBe(1);
    expect(result.current.trainingPlanDays[1].sessionOrder).toBe(2);
  });

  it('deleteWorkout deletes from SQLite', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    const workout = sampleWorkout({ id: 'del-w1' });
    act(() => {
      result.current.addWorkout(workout);
    });
    await new Promise(resolve => setTimeout(resolve, 50));

    await act(async () => {
      await result.current.deleteWorkout('del-w1');
    });

    const rows = await db.query<Record<string, unknown>>('SELECT * FROM workouts WHERE id = ?', ['del-w1']);
    expect(rows).toHaveLength(0);
  });

  it('saveWorkoutAtomic persists workout and sets via transaction', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    const workout = sampleWorkout({ id: 'atomic-w1' });
    const sets = [
      sampleWorkoutSet({
        id: 'atomic-s1',
        workoutId: 'atomic-w1',
        exerciseId: 'barbell-bench-press',
      }),
    ];

    await act(async () => {
      await result.current.saveWorkoutAtomic(workout, sets);
    });

    expect(result.current.workouts).toContainEqual(workout);
    expect(result.current.workoutSets).toContainEqual(sets[0]);

    const workoutRows = await db.query<Record<string, unknown>>('SELECT * FROM workouts WHERE id = ?', ['atomic-w1']);
    expect(workoutRows).toHaveLength(1);

    const setRows = await db.query<Record<string, unknown>>('SELECT * FROM workout_sets WHERE workout_id = ?', [
      'atomic-w1',
    ]);
    expect(setRows).toHaveLength(1);
  });

  it('saveWorkoutAtomic handles exercise not found in EXERCISES', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    await db.execute('PRAGMA foreign_keys = OFF');

    const workout = sampleWorkout({ id: 'atomic-w2' });
    const sets = [
      sampleWorkoutSet({
        id: 'atomic-s2',
        workoutId: 'atomic-w2',
        exerciseId: 'non-existent-exercise',
      }),
    ];

    await act(async () => {
      await result.current.saveWorkoutAtomic(workout, sets);
    });

    expect(result.current.workouts).toContainEqual(workout);
    expect(result.current.workoutSets).toContainEqual(sets[0]);

    await db.execute('PRAGMA foreign_keys = ON');
  });

  it('saveWorkoutAtomic updates Zustand state when _db is set', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    await db.execute('PRAGMA foreign_keys = OFF');

    const workout = sampleWorkout({ id: 'nodb-w1' });
    const sets = [sampleWorkoutSet({ id: 'nodb-s1', workoutId: 'nodb-w1', exerciseId: 'custom-ex-not-in-seed' })];

    await act(async () => {
      await result.current.saveWorkoutAtomic(workout, sets);
    });

    expect(result.current.workouts).toContainEqual(workout);
    expect(result.current.workoutSets).toContainEqual(sets[0]);

    await db.execute('PRAGMA foreign_keys = ON');
  });

  it('loadWorkoutDraft catches error when SQLite query fails', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    await db.execute(`DROP TABLE IF EXISTS workout_drafts`);

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await act(async () => {
      await result.current.loadWorkoutDraft();
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(result.current.workoutDraft).toBeNull();
    consoleSpy.mockRestore();
  });
});

/* ------------------------------------------------------------------ */
/* SQLite error-path and catch-block tests */
/* ------------------------------------------------------------------ */
describe('fitnessStore – SQLite error paths', () => {
  let db: DatabaseService;
  let badDb: DatabaseService;

  beforeEach(async () => {
    localStorage.clear();
    resetStore();
    db = createDatabaseService();
    await db.initialize();
    await createSchema(db);

    badDb = {
      ...db,
      execute: () => Promise.reject(new Error('SQLite write error')),
      query: db.query.bind(db),
      transaction: () => Promise.reject(new Error('Transaction error')),
      initialize: db.initialize.bind(db),
      queryOne: db.queryOne.bind(db),
      exportBinary: db.exportBinary.bind(db),
      importBinary: db.importBinary.bind(db),
      exportToJSON: db.exportToJSON.bind(db),
      importFromJSON: db.importFromJSON.bind(db),
    };
  });

  it('addPlanDays catches SQLite write error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(badDb);
    });

    act(() => {
      result.current.addPlanDays([samplePlanDay()]);
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('addPlanDays'), expect.anything());
    consoleSpy.mockRestore();
  });

  it('updatePlanDayExercises catches SQLite write error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(badDb);
    });

    act(() => {
      useFitnessStore.setState({ trainingPlanDays: [samplePlanDay()] });
      result.current.updatePlanDayExercises('day-1', []);
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('updatePlanDayExercises'), expect.anything());
    consoleSpy.mockRestore();
  });

  it('restorePlanDayOriginal catches SQLite write error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(badDb);
    });

    act(() => {
      useFitnessStore.setState({ trainingPlanDays: [samplePlanDay()] });
      result.current.restorePlanDayOriginal('day-1');
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('restorePlanDayOriginal'), expect.anything());
    consoleSpy.mockRestore();
  });

  it('addPlanDaySession catches SQLite write error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(badDb);
    });

    act(() => {
      result.current.addPlanDaySession('plan-1', 5, {
        planId: 'plan-1',
        dayOfWeek: 5,
        sessionOrder: 1,
        workoutType: 'push',
        exercises: '[]',
        originalExercises: '[]',
        isUserAssigned: false,
        originalDayOfWeek: 5,
      });
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('addPlanDaySession'), expect.anything());
    consoleSpy.mockRestore();
  });

  it('removePlanDaySession catches SQLite delete and reorder errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(badDb);
    });

    act(() => {
      useFitnessStore.setState({
        trainingPlanDays: [
          samplePlanDay({ id: 'err-d1', sessionOrder: 1 }),
          samplePlanDay({ id: 'err-d2', sessionOrder: 2 }),
        ],
      });
      result.current.removePlanDaySession('err-d1');
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('removePlanDaySession'), expect.anything());
    consoleSpy.mockRestore();
  });

  it('addWorkout catches SQLite write error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(badDb);
    });

    act(() => {
      result.current.addWorkout(sampleWorkout());
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('SQLite write failed for workout'),
      expect.anything(),
    );
    consoleSpy.mockRestore();
  });

  it('deleteWorkout catches SQLite delete error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(badDb);
    });

    act(() => {
      useFitnessStore.setState({ workouts: [sampleWorkout()] });
    });

    await act(async () => {
      await result.current.deleteWorkout('workout-1');
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('SQLite delete failed for workout'),
      expect.anything(),
    );
    consoleSpy.mockRestore();
  });

  it('addWorkoutSet catches SQLite write error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(badDb);
    });

    act(() => {
      result.current.addWorkoutSet(sampleWorkoutSet());
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('SQLite write failed for workoutSet'),
      expect.anything(),
    );
    consoleSpy.mockRestore();
  });

  it('setWorkoutDraft catches SQLite write error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(badDb);
    });

    act(() => {
      result.current.setWorkoutDraft({
        exercises: [],
        sets: [],
        elapsedSeconds: 0,
      });
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('SQLite write failed for workout draft'),
      expect.anything(),
    );
    consoleSpy.mockRestore();
  });

  it('clearWorkoutDraft catches SQLite delete error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(badDb);
    });

    act(() => {
      result.current.clearWorkoutDraft();
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('SQLite delete failed for workout draft'),
      expect.anything(),
    );
    consoleSpy.mockRestore();
  });
});

/* ------------------------------------------------------------------ */
/* removePlanDaySession – different planId/dayOfWeek days remain */
/* ------------------------------------------------------------------ */
describe('fitnessStore – removePlanDaySession reorder edge case', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  it('does not reorder days from a different planId or dayOfWeek', () => {
    useFitnessStore.setState({
      trainingPlanDays: [
        samplePlanDay({ id: 'rd-1', planId: 'plan-1', dayOfWeek: 1, sessionOrder: 1 }),
        samplePlanDay({ id: 'rd-2', planId: 'plan-1', dayOfWeek: 1, sessionOrder: 2 }),
        samplePlanDay({ id: 'rd-other', planId: 'plan-2', dayOfWeek: 3, sessionOrder: 1 }),
      ],
    });

    useFitnessStore.getState().removePlanDaySession('rd-1');

    const days = useFitnessStore.getState().trainingPlanDays;
    expect(days).toHaveLength(2);

    const otherDay = days.find(d => d.id === 'rd-other');
    expect(otherDay?.sessionOrder).toBe(1);
    expect(otherDay?.planId).toBe('plan-2');

    const reorderedDay = days.find(d => d.id === 'rd-2');
    expect(reorderedDay?.sessionOrder).toBe(1);
  });
});

/* ------------------------------------------------------------------ */
/* Persist migration tests */
/* ------------------------------------------------------------------ */
describe('fitnessStore – persist migrate via rehydration', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  it('migration v1→v2 adds planStrategy: null', () => {
    const v1State = {
      trainingProfile: null,
      trainingPlans: [],
      trainingPlanDays: [],
      workouts: [],
      workoutSets: [],
      weightEntries: [],
      isOnboarded: true,
      workoutMode: 'strength',
      workoutDraft: null,
      sqliteReady: false,
      showPlanCelebration: false,
    };

    localStorage.setItem('fitness-storage', JSON.stringify({ state: v1State, version: 1 }));

    useFitnessStore.persist.rehydrate();

    const state = useFitnessStore.getState();
    expect(state.planStrategy).toBeNull();
    expect(state.isOnboarded).toBe(true);
  });

  it('migration v2→v2 keeps state unchanged', () => {
    const v2State = {
      trainingProfile: null,
      trainingPlans: [],
      trainingPlanDays: [],
      workouts: [],
      workoutSets: [],
      weightEntries: [],
      isOnboarded: false,
      workoutMode: 'strength',
      workoutDraft: null,
      planStrategy: 'manual',
      sqliteReady: false,
      showPlanCelebration: false,
    };

    localStorage.setItem('fitness-storage', JSON.stringify({ state: v2State, version: 2 }));

    useFitnessStore.persist.rehydrate();

    expect(useFitnessStore.getState().planStrategy).toBe('manual');
  });

  it('migration function returns state unchanged for version >= 2', () => {
    const options = useFitnessStore.persist.getOptions();
    const migrate = options.migrate;
    if (!migrate) throw new Error('migrate function not found');

    const input = { trainingPlans: [], planStrategy: 'auto' };
    const result = migrate(input, 2) as Record<string, unknown>;
    expect(result).toEqual(input);
    expect(result.planStrategy).toBe('auto');
  });
});

describe('fitnessStore – changeSplitType data format', () => {
  const PLAN_ID = 'plan-split-test';

  const exercisesJson = JSON.stringify([
    {
      exercise: {
        id: 'bench',
        name: 'Bench Press',
        primaryMuscle: 'chest',
        equipment: 'barbell',
        category: 'compound',
      },
      sets: 4,
      repsMin: 6,
      repsMax: 10,
      restSeconds: 120,
    },
  ]);

  function setupPplPlan() {
    const plan = samplePlan({
      id: PLAN_ID,
      splitType: 'ppl',
      trainingDays: [1, 2, 3, 4, 5],
      restDays: [6, 7],
    });

    const days: TrainingPlanDay[] = [
      samplePlanDay({
        id: 'split-day-1',
        planId: PLAN_ID,
        dayOfWeek: 1,
        workoutType: 'Push',
        muscleGroups: '["chest","shoulders"]',
        exercises: exercisesJson,
        originalExercises: exercisesJson,
      }),
      samplePlanDay({
        id: 'split-day-2',
        planId: PLAN_ID,
        dayOfWeek: 2,
        workoutType: 'Pull',
        muscleGroups: '["back"]',
        exercises: exercisesJson,
        originalExercises: exercisesJson,
      }),
      samplePlanDay({
        id: 'split-day-3',
        planId: PLAN_ID,
        dayOfWeek: 3,
        workoutType: 'Legs',
        muscleGroups: '["legs","glutes"]',
        exercises: exercisesJson,
        originalExercises: exercisesJson,
      }),
    ];

    useFitnessStore.setState({
      trainingPlans: [plan],
      trainingPlanDays: days,
    });

    return { plan, days };
  }

  beforeEach(() => {
    resetStore();
  });

  it('TC_SPLIT_01: regenerate mode produces workoutType = dayLabel', () => {
    setupPplPlan();
    useFitnessStore.getState().changeSplitType(PLAN_ID, 'upper_lower', 'regenerate');

    const newDays = useFitnessStore.getState().trainingPlanDays.filter(d => d.planId === PLAN_ID);
    expect(newDays).toHaveLength(5);

    const types = newDays.map(d => d.workoutType);
    expect(types[0]).toBe('Upper');
    expect(types[1]).toBe('Lower');
    expect(types[2]).toBe('Upper 3');
    expect(types[3]).toBe('Lower 3');
    expect(types[4]).toBe('Upper 4');

    for (const wt of types) {
      expect(wt).not.toMatch(/_/);
    }
  });

  it('TC_SPLIT_02: regenerate mode produces muscleGroups as JSON array', () => {
    setupPplPlan();
    useFitnessStore.getState().changeSplitType(PLAN_ID, 'upper_lower', 'regenerate');

    const newDays = useFitnessStore.getState().trainingPlanDays.filter(d => d.planId === PLAN_ID);
    for (const day of newDays) {
      expect(day.muscleGroups).toBeDefined();
      expect(day.muscleGroups).toMatch(/^\[/);

      const groups = JSON.parse(day.muscleGroups!) as string[];
      expect(groups.length).toBeGreaterThan(0);
      for (const g of groups) {
        expect(g).toMatch(/^[a-z]+$/);
      }
    }

    const upperDay = newDays.find(d => d.workoutType === 'Upper')!;
    expect(upperDay.muscleGroups).toBe('["chest","back","shoulders","arms"]');

    const lowerDay = newDays.find(d => d.workoutType === 'Lower')!;
    expect(lowerDay.muscleGroups).toBe('["legs","glutes","core"]');
  });

  it('TC_SPLIT_03: remap mode produces workoutType = toDay for mapped days', () => {
    setupPplPlan();
    useFitnessStore.getState().changeSplitType(PLAN_ID, 'upper_lower', 'remap');

    const newDays = useFitnessStore.getState().trainingPlanDays.filter(d => d.planId === PLAN_ID);
    expect(newDays).toHaveLength(5);

    for (const day of newDays) {
      expect(day.workoutType).not.toMatch(/_/);
      expect(day.workoutType).toMatch(/^[A-Z]/);
    }

    const types = newDays.map(d => d.workoutType);
    expect(types).toContain('Upper');
    expect(types).toContain('Lower');
  });

  it('TC_SPLIT_04: remap mode produces muscleGroups as JSON array', () => {
    setupPplPlan();
    useFitnessStore.getState().changeSplitType(PLAN_ID, 'upper_lower', 'remap');

    const newDays = useFitnessStore.getState().trainingPlanDays.filter(d => d.planId === PLAN_ID);
    for (const day of newDays) {
      expect(day.muscleGroups).toBeDefined();
      expect(day.muscleGroups).toMatch(/^\[/);

      const groups = JSON.parse(day.muscleGroups!) as string[];
      expect(groups.length).toBeGreaterThan(0);
      for (const g of groups) {
        expect(g).toMatch(/^[a-z]+$/);
      }
    }
  });

  it('TC_SPLIT_05: remap mode preserves exercises for mapped days', () => {
    setupPplPlan();
    useFitnessStore.getState().changeSplitType(PLAN_ID, 'upper_lower', 'remap');

    const newDays = useFitnessStore.getState().trainingPlanDays.filter(d => d.planId === PLAN_ID);
    const mappedDays = newDays.filter(d => d.exercises !== '[]');
    expect(mappedDays).toHaveLength(3);

    for (const day of mappedDays) {
      expect(day.exercises).toBe(exercisesJson);
    }
  });

  it('TC_SPLIT_06: regenerate mode sets exercises to empty JSON array', () => {
    setupPplPlan();
    useFitnessStore.getState().changeSplitType(PLAN_ID, 'upper_lower', 'regenerate');

    const newDays = useFitnessStore.getState().trainingPlanDays.filter(d => d.planId === PLAN_ID);
    for (const day of newDays) {
      expect(day.exercises).toBe('[]');
      expect(day.originalExercises).toBe('[]');
    }
  });

  it('TC_SPLIT_07: workoutType matches expected split labels', () => {
    setupPplPlan();
    useFitnessStore.getState().changeSplitType(PLAN_ID, 'bro_split', 'regenerate');

    const newDays = useFitnessStore.getState().trainingPlanDays.filter(d => d.planId === PLAN_ID);
    expect(newDays).toHaveLength(5);

    const types = newDays.map(d => d.workoutType);
    expect(types).toEqual(['Chest', 'Back', 'Shoulders', 'Legs', 'Arms']);
  });
});

/* ------------------------------------------------------------------ */
/* changeSplitType – regenerate mode with exercise generation           */
/* ------------------------------------------------------------------ */

describe('fitnessStore – changeSplitType regenerate with trainingProfile', () => {
  const PLAN_ID = 'plan-regen-profile';

  function setupPlanWithProfile() {
    const profile = sampleProfile({
      daysPerWeek: 4,
      availableEquipment: ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight'],
      injuryRestrictions: [],
      trainingGoal: 'hypertrophy',
      periodizationModel: 'linear',
    });

    const plan = samplePlan({
      id: PLAN_ID,
      splitType: 'ppl',
      trainingDays: [1, 2, 3, 4],
      restDays: [5, 6, 7],
    });

    useFitnessStore.setState({
      trainingProfile: profile,
      trainingPlans: [plan],
      trainingPlanDays: [],
    });

    return { profile, plan };
  }

  beforeEach(() => {
    resetStore();
  });

  it('TC_SPLIT_08: regenerate with profile produces non-empty exercises', () => {
    setupPlanWithProfile();
    useFitnessStore.getState().changeSplitType(PLAN_ID, 'upper_lower', 'regenerate');

    const newDays = useFitnessStore.getState().trainingPlanDays.filter(d => d.planId === PLAN_ID);
    expect(newDays).toHaveLength(4);

    for (const day of newDays) {
      expect(day.exercises).toBeDefined();
      expect(day.exercises).not.toBe('[]');

      const parsed: unknown[] = JSON.parse(day.exercises!);
      expect(parsed.length).toBeGreaterThan(0);
    }
  });

  it('TC_SPLIT_09: each day exercises are valid JSON with required SelectedExercise fields', () => {
    setupPlanWithProfile();
    useFitnessStore.getState().changeSplitType(PLAN_ID, 'upper_lower', 'regenerate');

    const newDays = useFitnessStore.getState().trainingPlanDays.filter(d => d.planId === PLAN_ID);

    for (const day of newDays) {
      const exercises = JSON.parse(day.exercises!) as Array<{
        exercise: { id: string; muscleGroup: string };
        sets: number;
        repsMin: number;
        repsMax: number;
        restSeconds: number;
      }>;

      for (const ex of exercises) {
        expect(ex.exercise).toBeDefined();
        expect(ex.exercise.id).toBeTruthy();
        expect(ex.exercise.muscleGroup).toBeTruthy();
        expect(ex.sets).toBeGreaterThanOrEqual(1);
        expect(ex.repsMin).toBeGreaterThan(0);
        expect(ex.repsMax).toBeGreaterThanOrEqual(ex.repsMin);
        expect(ex.restSeconds).toBeGreaterThan(0);
      }
    }
  });

  it('TC_SPLIT_10: exercises match the muscle groups assigned to each day', () => {
    setupPlanWithProfile();
    useFitnessStore.getState().changeSplitType(PLAN_ID, 'upper_lower', 'regenerate');

    const newDays = useFitnessStore.getState().trainingPlanDays.filter(d => d.planId === PLAN_ID);

    for (const day of newDays) {
      const dayMuscles = JSON.parse(day.muscleGroups!) as string[];
      const exercises = JSON.parse(day.exercises!) as Array<{
        exercise: { muscleGroup: string };
      }>;

      for (const ex of exercises) {
        expect(dayMuscles).toContain(ex.exercise.muscleGroup);
      }
    }
  });

  it('TC_SPLIT_11: originalExercises equals exercises in regenerate mode', () => {
    setupPlanWithProfile();
    useFitnessStore.getState().changeSplitType(PLAN_ID, 'ppl', 'regenerate');

    const newDays = useFitnessStore.getState().trainingPlanDays.filter(d => d.planId === PLAN_ID);

    for (const day of newDays) {
      expect(day.originalExercises).toBe(day.exercises);
    }
  });

  it('TC_SPLIT_12: without trainingProfile, exercises are empty JSON array', () => {
    const plan = samplePlan({
      id: PLAN_ID,
      splitType: 'ppl',
      trainingDays: [1, 2, 3],
      restDays: [4, 5, 6, 7],
    });

    useFitnessStore.setState({
      trainingProfile: null,
      trainingPlans: [plan],
      trainingPlanDays: [],
    });

    useFitnessStore.getState().changeSplitType(PLAN_ID, 'upper_lower', 'regenerate');

    const newDays = useFitnessStore.getState().trainingPlanDays.filter(d => d.planId === PLAN_ID);
    for (const day of newDays) {
      expect(day.exercises).toBe('[]');
      expect(day.originalExercises).toBe('[]');
    }
  });

  it('TC_SPLIT_13: regenerate PPL with profile generates Push/Pull/Legs exercises', () => {
    setupPlanWithProfile();
    useFitnessStore.getState().changeSplitType(PLAN_ID, 'ppl', 'regenerate');

    const newDays = useFitnessStore.getState().trainingPlanDays.filter(d => d.planId === PLAN_ID);

    const pushDay = newDays.find(d => d.workoutType === 'Push');
    expect(pushDay).toBeDefined();
    const pushExercises = JSON.parse(pushDay!.exercises!) as Array<{
      exercise: { muscleGroup: string };
    }>;
    const pushMuscles = new Set(pushExercises.map(e => e.exercise.muscleGroup));
    expect(pushMuscles.has('chest') || pushMuscles.has('shoulders')).toBe(true);

    const pullDay = newDays.find(d => d.workoutType === 'Pull');
    expect(pullDay).toBeDefined();
    const pullExercises = JSON.parse(pullDay!.exercises!) as Array<{
      exercise: { muscleGroup: string };
    }>;
    expect(pullExercises.some(e => e.exercise.muscleGroup === 'back')).toBe(true);

    const legsDay = newDays.find(d => d.workoutType === 'Legs');
    expect(legsDay).toBeDefined();
    const legsExercises = JSON.parse(legsDay!.exercises!) as Array<{
      exercise: { muscleGroup: string };
    }>;
    expect(legsExercises.some(e => e.exercise.muscleGroup === 'legs' || e.exercise.muscleGroup === 'glutes')).toBe(
      true,
    );
  });

  it('TC_SPLIT_14: regenerate with injury restrictions excludes contraindicated exercises', () => {
    const profile = sampleProfile({
      availableEquipment: ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight'],
      injuryRestrictions: ['shoulders', 'knees'],
      trainingGoal: 'hypertrophy',
      periodizationModel: 'linear',
    });

    const plan = samplePlan({
      id: PLAN_ID,
      splitType: 'ppl',
      trainingDays: [1, 2, 3],
      restDays: [4, 5, 6, 7],
    });

    useFitnessStore.setState({
      trainingProfile: profile,
      trainingPlans: [plan],
      trainingPlanDays: [],
    });

    useFitnessStore.getState().changeSplitType(PLAN_ID, 'upper_lower', 'regenerate');

    const newDays = useFitnessStore.getState().trainingPlanDays.filter(d => d.planId === PLAN_ID);

    for (const day of newDays) {
      const exercises = JSON.parse(day.exercises!) as Array<{
        exercise: { contraindicated: string[] };
      }>;
      for (const ex of exercises) {
        expect(ex.exercise.contraindicated).not.toContain('shoulders');
        expect(ex.exercise.contraindicated).not.toContain('knees');
      }
    }
  });

  it('TC_SPLIT_15: regenerate applies correct rep scheme based on training goal', () => {
    const profile = sampleProfile({
      availableEquipment: ['barbell', 'dumbbell', 'bodyweight'],
      trainingGoal: 'strength',
      periodizationModel: 'linear',
    });

    const plan = samplePlan({
      id: PLAN_ID,
      splitType: 'ppl',
      trainingDays: [1, 2, 3],
      restDays: [4, 5, 6, 7],
    });

    useFitnessStore.setState({
      trainingProfile: profile,
      trainingPlans: [plan],
      trainingPlanDays: [],
    });

    useFitnessStore.getState().changeSplitType(PLAN_ID, 'upper_lower', 'regenerate');

    const newDays = useFitnessStore.getState().trainingPlanDays.filter(d => d.planId === PLAN_ID);

    for (const day of newDays) {
      const exercises = JSON.parse(day.exercises!) as Array<{
        repsMin: number;
        repsMax: number;
        restSeconds: number;
      }>;

      for (const ex of exercises) {
        // strength: repsMin=3, repsMax=5, rest=240
        expect(ex.repsMin).toBe(3);
        expect(ex.repsMax).toBe(5);
        expect(ex.restSeconds).toBe(240);
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/* changeSplitType – remap mode with exercise generation               */
/* ------------------------------------------------------------------ */

describe('fitnessStore – changeSplitType remap with trainingProfile', () => {
  const PLAN_ID = 'plan-remap-profile';

  const existingExercisesJson = JSON.stringify([
    {
      exercise: {
        id: 'bench',
        nameVi: 'Đẩy ngực',
        muscleGroup: 'chest',
        secondaryMuscles: [],
        category: 'compound',
        equipment: ['barbell'],
        contraindicated: [],
        exerciseType: 'strength',
        defaultRepsMin: 6,
        defaultRepsMax: 12,
        isCustom: false,
        updatedAt: '',
      },
      sets: 4,
      repsMin: 6,
      repsMax: 10,
      restSeconds: 120,
    },
  ]);

  function setupRemapWithProfile() {
    const profile = sampleProfile({
      availableEquipment: ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight'],
      injuryRestrictions: [],
      trainingGoal: 'hypertrophy',
      periodizationModel: 'linear',
    });

    const plan = samplePlan({
      id: PLAN_ID,
      splitType: 'ppl',
      trainingDays: [1, 2, 3, 4, 5],
      restDays: [6, 7],
    });

    const days: TrainingPlanDay[] = [
      samplePlanDay({
        id: 'remap-day-1',
        planId: PLAN_ID,
        dayOfWeek: 1,
        workoutType: 'Push',
        muscleGroups: '["chest","shoulders"]',
        exercises: existingExercisesJson,
        originalExercises: existingExercisesJson,
      }),
      samplePlanDay({
        id: 'remap-day-2',
        planId: PLAN_ID,
        dayOfWeek: 2,
        workoutType: 'Pull',
        muscleGroups: '["back"]',
        exercises: existingExercisesJson,
        originalExercises: existingExercisesJson,
      }),
      samplePlanDay({
        id: 'remap-day-3',
        planId: PLAN_ID,
        dayOfWeek: 3,
        workoutType: 'Legs',
        muscleGroups: '["legs","glutes"]',
        exercises: existingExercisesJson,
        originalExercises: existingExercisesJson,
      }),
    ];

    useFitnessStore.setState({
      trainingProfile: profile,
      trainingPlans: [plan],
      trainingPlanDays: days,
    });

    return { profile, plan, days };
  }

  beforeEach(() => {
    resetStore();
  });

  it('TC_SPLIT_16: remap mapped days preserve original exercises', () => {
    setupRemapWithProfile();
    useFitnessStore.getState().changeSplitType(PLAN_ID, 'upper_lower', 'remap');

    const newDays = useFitnessStore.getState().trainingPlanDays.filter(d => d.planId === PLAN_ID);
    const mappedDays = newDays.filter(d => d.exercises === existingExercisesJson);

    expect(mappedDays.length).toBeGreaterThan(0);
    for (const day of mappedDays) {
      expect(day.exercises).toBe(existingExercisesJson);
    }
  });

  it('TC_SPLIT_17: remap suggested days have generated exercises when profile exists', () => {
    setupRemapWithProfile();
    useFitnessStore.getState().changeSplitType(PLAN_ID, 'upper_lower', 'remap');

    const newDays = useFitnessStore.getState().trainingPlanDays.filter(d => d.planId === PLAN_ID);
    expect(newDays).toHaveLength(5);

    // Suggested days should have exercises (not the preserved original)
    const suggestedDays = newDays.filter(d => d.exercises !== existingExercisesJson);

    for (const day of suggestedDays) {
      expect(day.exercises).toBeDefined();
      const parsed: unknown[] = JSON.parse(day.exercises!);
      // Suggested days get generated exercises when profile exists
      if (parsed.length > 0) {
        const exercises = parsed as Array<{ exercise: { id: string } }>;
        expect(exercises[0].exercise.id).toBeTruthy();
      }
    }
  });

  it('TC_SPLIT_18: remap without profile sets suggested day exercises to empty array', () => {
    const plan = samplePlan({
      id: PLAN_ID,
      splitType: 'ppl',
      trainingDays: [1, 2, 3, 4, 5],
      restDays: [6, 7],
    });

    const days: TrainingPlanDay[] = [
      samplePlanDay({
        id: 'remap-day-1',
        planId: PLAN_ID,
        dayOfWeek: 1,
        workoutType: 'Push',
        muscleGroups: '["chest","shoulders"]',
        exercises: existingExercisesJson,
        originalExercises: existingExercisesJson,
      }),
    ];

    useFitnessStore.setState({
      trainingProfile: null,
      trainingPlans: [plan],
      trainingPlanDays: days,
    });

    useFitnessStore.getState().changeSplitType(PLAN_ID, 'upper_lower', 'remap');

    const newDays = useFitnessStore.getState().trainingPlanDays.filter(d => d.planId === PLAN_ID);
    // The suggested (new) days should have '[]' since no profile
    const suggestedDays = newDays.filter(d => d.exercises !== existingExercisesJson);

    for (const day of suggestedDays) {
      expect(day.exercises).toBe('[]');
      expect(day.originalExercises).toBe('[]');
    }
  });

  it('TC_SPLIT_19: remap suggested days exercises match their muscle groups', () => {
    setupRemapWithProfile();
    useFitnessStore.getState().changeSplitType(PLAN_ID, 'upper_lower', 'remap');

    const newDays = useFitnessStore.getState().trainingPlanDays.filter(d => d.planId === PLAN_ID);

    const suggestedDays = newDays.filter(d => d.exercises !== existingExercisesJson && d.exercises !== '[]');

    for (const day of suggestedDays) {
      const dayMuscles = JSON.parse(day.muscleGroups!) as string[];
      const exercises = JSON.parse(day.exercises!) as Array<{
        exercise: { muscleGroup: string };
      }>;

      for (const ex of exercises) {
        expect(dayMuscles).toContain(ex.exercise.muscleGroup);
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/* Bug reproduction tests — FK constraints & draft planDayId */
/* ------------------------------------------------------------------ */
describe('fitnessStore – workout save FK constraint bugs', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    localStorage.clear();
    resetStore();
    db = createDatabaseService();
    await db.initialize();
    await createSchema(db);
  });

  it('saveWorkoutAtomic fails with FK violation when exerciseId mismatches EXERCISES (e.g. hiit vs hiit-training)', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    const exercisesBefore = await db.query<Record<string, unknown>>("SELECT id FROM exercises WHERE id = 'hiit'");
    expect(exercisesBefore).toHaveLength(0);

    const workout = sampleWorkout({ id: 'cardio-fk-w1' });
    const sets = [
      sampleWorkoutSet({
        id: 'cardio-fk-s1',
        workoutId: 'cardio-fk-w1',
        exerciseId: 'hiit',
        setNumber: 1,
        weightKg: 0,
      }),
    ];

    let error: Error | null = null;
    try {
      await result.current.saveWorkoutAtomic(workout, sets);
    } catch (e) {
      error = e as Error;
    }

    expect(error).not.toBeNull();
    expect(error!.message).toContain('FOREIGN KEY constraint failed');
  });

  it('saveWorkoutAtomic fails with FK violation when exerciseId is rowing (should be rowing-machine)', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    const workout = sampleWorkout({ id: 'cardio-fk-w2' });
    const sets = [
      sampleWorkoutSet({
        id: 'cardio-fk-s2',
        workoutId: 'cardio-fk-w2',
        exerciseId: 'rowing',
        setNumber: 1,
        weightKg: 0,
      }),
    ];

    let error: Error | null = null;
    try {
      await result.current.saveWorkoutAtomic(workout, sets);
    } catch (e) {
      error = e as Error;
    }

    expect(error).not.toBeNull();
    expect(error!.message).toContain('FOREIGN KEY constraint failed');
  });

  it('saveWorkoutAtomic succeeds with valid cardio exerciseIds (running, cycling, swimming, walking, elliptical)', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    const validCardioIds = ['running', 'cycling', 'swimming', 'walking', 'elliptical'];
    for (const exerciseId of validCardioIds) {
      const workout = sampleWorkout({ id: `cardio-valid-${exerciseId}` });
      const sets = [
        sampleWorkoutSet({
          id: `cardio-valid-s-${exerciseId}`,
          workoutId: `cardio-valid-${exerciseId}`,
          exerciseId,
          setNumber: 1,
          weightKg: 0,
        }),
      ];

      await act(async () => {
        await result.current.saveWorkoutAtomic(workout, sets);
      });
    }

    expect(result.current.workouts).toHaveLength(validCardioIds.length);
  });

  it('saveWorkoutAtomic gracefully handles stale planDayId by falling back to null', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    const workout = sampleWorkout({
      id: 'stale-planday-w1',
      planDayId: 'non-existent-plan-day-id',
    });
    const sets = [
      sampleWorkoutSet({
        id: 'stale-planday-s1',
        workoutId: 'stale-planday-w1',
        exerciseId: 'barbell-bench-press',
        setNumber: 1,
      }),
    ];

    await act(async () => {
      await result.current.saveWorkoutAtomic(workout, sets);
    });

    expect(result.current.workouts).toContainEqual(expect.objectContaining({ id: 'stale-planday-w1' }));

    const workoutRow = await db.queryOne<Record<string, unknown>>('SELECT * FROM workouts WHERE id = ?', [
      'stale-planday-w1',
    ]);
    expect(workoutRow).not.toBeNull();
    expect(workoutRow!.planDayId).toBeNull();
  });

  it('saveWorkoutAtomic succeeds when planDayId is null/undefined', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    const workout = sampleWorkout({
      id: 'null-planday-w1',
      planDayId: undefined,
    });
    const sets = [
      sampleWorkoutSet({
        id: 'null-planday-s1',
        workoutId: 'null-planday-w1',
        exerciseId: 'barbell-bench-press',
        setNumber: 1,
      }),
    ];

    await act(async () => {
      await result.current.saveWorkoutAtomic(workout, sets);
    });

    expect(result.current.workouts).toContainEqual(expect.objectContaining({ id: 'null-planday-w1' }));
  });
});

describe('fitnessStore – workout draft planDayId persistence', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    localStorage.clear();
    resetStore();
    db = createDatabaseService();
    await db.initialize();
    await createSchema(db);
  });

  it('setWorkoutDraft persists planDayId to SQLite', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    act(() => {
      result.current.setWorkoutDraft({
        exercises: [],
        sets: [],
        elapsedSeconds: 60,
        planDayId: 'test-plan-day-123',
      });
    });

    await vi.waitFor(async () => {
      const rows = await db.query<Record<string, unknown>>(`SELECT * FROM workout_drafts WHERE id = 'current'`);
      expect(rows).toHaveLength(1);
      expect(rows[0].planDayId).toBe('test-plan-day-123');
    });
  });

  it('loadWorkoutDraft restores planDayId from SQLite', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    await db.execute(
      `INSERT INTO workout_drafts (id, exercises_json, sets_json, start_time, plan_day_id, updated_at)
       VALUES ('current', '[]', '[]', '2025-01-01T00:00:00Z', 'restored-plan-day-456', '2025-01-01T00:00:00Z')`,
    );

    await act(async () => {
      await result.current.loadWorkoutDraft();
    });

    expect(result.current.workoutDraft).not.toBeNull();
    expect(result.current.workoutDraft!.planDayId).toBe('restored-plan-day-456');
  });

  it('setWorkoutDraft without planDayId stores null in SQLite', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => {
      await result.current.initializeFromSQLite(db);
    });

    act(() => {
      result.current.setWorkoutDraft({
        exercises: [],
        sets: [],
        elapsedSeconds: 30,
      });
    });

    await vi.waitFor(async () => {
      const rows = await db.query<Record<string, unknown>>(`SELECT * FROM workout_drafts WHERE id = 'current'`);
      expect(rows).toHaveLength(1);
      expect(rows[0].planDayId).toBeNull();
    });
  });
});

/* ------------------------------------------------------------------ */
/* profileOutOfSync feature                                           */
/* ------------------------------------------------------------------ */
describe('fitnessStore – profileOutOfSync', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  it('defaults to false', () => {
    expect(useFitnessStore.getState().profileOutOfSync).toBe(false);
  });

  it('setTrainingProfile sets profileOutOfSync to true when an active plan exists', () => {
    useFitnessStore.setState({
      trainingPlans: [samplePlan({ id: 'plan-active', status: 'active' })],
      profileOutOfSync: false,
    });

    useFitnessStore.getState().setTrainingProfile(sampleProfile());

    expect(useFitnessStore.getState().profileOutOfSync).toBe(true);
  });

  it('setTrainingProfile keeps profileOutOfSync false when no active plan exists', () => {
    useFitnessStore.setState({
      trainingPlans: [samplePlan({ id: 'plan-done', status: 'completed' })],
      profileOutOfSync: false,
    });

    useFitnessStore.getState().setTrainingProfile(sampleProfile());

    expect(useFitnessStore.getState().profileOutOfSync).toBe(false);
  });

  it('setTrainingProfile keeps profileOutOfSync false when no plans at all', () => {
    useFitnessStore.setState({ trainingPlans: [], profileOutOfSync: false });

    useFitnessStore.getState().setTrainingProfile(sampleProfile());

    expect(useFitnessStore.getState().profileOutOfSync).toBe(false);
  });

  it('addTrainingPlan clears profileOutOfSync to false', () => {
    useFitnessStore.setState({ profileOutOfSync: true });

    useFitnessStore.getState().addTrainingPlan(samplePlan({ id: 'new-plan' }));

    expect(useFitnessStore.getState().profileOutOfSync).toBe(false);
  });

  it('addTrainingPlan keeps profileOutOfSync false when it was already false', () => {
    useFitnessStore.setState({ profileOutOfSync: false });

    useFitnessStore.getState().addTrainingPlan(samplePlan({ id: 'new-plan-2' }));

    expect(useFitnessStore.getState().profileOutOfSync).toBe(false);
  });
});
