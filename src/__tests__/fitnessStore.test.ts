import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFitnessStore } from '../store/fitnessStore';
import type {
  TrainingProfile,
  TrainingPlan,
  TrainingPlanDay,
  Workout,
  WorkoutSet,
  WeightEntry,
  Exercise,
} from '../features/fitness/types';

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
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
    splitType: 'push-pull-legs',
    durationWeeks: 8,
    startDate: '2025-06-01',
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
    workoutType: 'push',
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
/*  Tests                                                               */
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
    expect(plans.find((p) => p.id === 'plan-a')!.status).toBe('paused');
    expect(plans.find((p) => p.id === 'plan-b')!.status).toBe('active');
    expect(plans.find((p) => p.id === 'plan-c')!.status).toBe('completed');
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
    expect(updated.splitType).toBe('push-pull-legs');
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
});
