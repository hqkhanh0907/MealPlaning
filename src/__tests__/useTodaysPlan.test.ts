import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFitnessStore } from '../store/fitnessStore';
import { useDayPlanStore } from '../store/dayPlanStore';
import {
  determineTodayPlanState,
  useTodaysPlan,
} from '../features/dashboard/hooks/useTodaysPlan';
import type {
  TrainingPlan,
  TrainingPlanDay,
  Workout,
  WorkoutSet,
} from '../features/fitness/types';
import type { DayPlan } from '../types';

const makeExercisesJson = (): string =>
  JSON.stringify([
    {
      exercise: {
        id: 'bench-press',
        nameVi: 'Đẩy ngang ngực',
        muscleGroup: 'chest',
        secondaryMuscles: ['shoulders'],
        category: 'compound',
        equipment: ['barbell'],
        contraindicated: [],
        exerciseType: 'strength',
        defaultRepsMin: 6,
        defaultRepsMax: 8,
        isCustom: false,
        updatedAt: '2025-01-01',
      },
      sets: 4,
      repsMin: 6,
      repsMax: 8,
      restSeconds: 180,
    },
    {
      exercise: {
        id: 'ohp',
        nameVi: 'Đẩy vai',
        muscleGroup: 'shoulders',
        secondaryMuscles: ['triceps'],
        category: 'compound',
        equipment: ['barbell'],
        contraindicated: [],
        exerciseType: 'strength',
        defaultRepsMin: 8,
        defaultRepsMax: 10,
        isCustom: false,
        updatedAt: '2025-01-01',
      },
      sets: 3,
      repsMin: 8,
      repsMax: 10,
      restSeconds: 120,
    },
  ]);

const makePlan = (overrides: Partial<TrainingPlan> = {}): TrainingPlan => ({
  id: 'plan-1',
  name: 'Test Plan',
  status: 'active',
  splitType: 'push-pull-legs',
  durationWeeks: 8,
  currentWeek: 1,
  startDate: '2025-01-01',
  createdAt: '2025-01-01T00:00:00',
  updatedAt: '2025-01-01T00:00:00',
  ...overrides,
});

const makePlanDay = (
  overrides: Partial<TrainingPlanDay> = {},
): TrainingPlanDay => ({
  id: 'day-wed',
  planId: 'plan-1',
  dayOfWeek: 3,
  sessionOrder: 1,
  workoutType: 'Upper Body A',
  muscleGroups: 'chest, shoulders, triceps',
  exercises: makeExercisesJson(),
  ...overrides,
});

const makeWorkout = (overrides: Partial<Workout> = {}): Workout => ({
  id: 'workout-1',
  date: '2025-01-15',
  name: 'Upper Body',
  durationMin: 65,
  createdAt: '2025-01-15T08:00:00',
  updatedAt: '2025-01-15T09:05:00',
  ...overrides,
});

const makeWorkoutSet = (overrides: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id: 'set-1',
  workoutId: 'workout-1',
  exerciseId: 'bench-press',
  setNumber: 1,
  reps: 8,
  weightKg: 80,
  updatedAt: '2025-01-15T08:05:00',
  ...overrides,
});

const makeDayPlan = (overrides: Partial<DayPlan> = {}): DayPlan => ({
  date: '2025-01-15',
  breakfastDishIds: ['dish-1'],
  lunchDishIds: ['dish-2'],
  dinnerDishIds: ['dish-3'],
  ...overrides,
});

function resetStores(): void {
  useFitnessStore.setState({
    trainingProfile: null,
    trainingPlans: [],
    trainingPlanDays: [],
    workouts: [],
    workoutSets: [],
    weightEntries: [],
    isOnboarded: false,
  });
  useDayPlanStore.setState({ dayPlans: [] });
}

describe('determineTodayPlanState', () => {
  it('returns no-plan when no active plan', () => {
    expect(determineTodayPlanState(undefined, [], [])).toBe('no-plan');
  });

  it('returns training-pending when plan day exists but no workout logged', () => {
    expect(
      determineTodayPlanState(makePlan(), [makePlanDay()], []),
    ).toBe('training-pending');
  });

  it('returns training-completed when workout logged today', () => {
    expect(
      determineTodayPlanState(
        makePlan(),
        [makePlanDay()],
        [makeWorkout({ planDayId: 'day-wed' })],
      ),
    ).toBe('training-completed');
  });

  it('returns rest-day when active plan but no plan day for today', () => {
    expect(determineTodayPlanState(makePlan(), [], [])).toBe('rest-day');
  });
});

describe('determineTodayPlanState — multi-session', () => {
  it('returns training-partial when 1 of 2 sessions completed', () => {
    const result = determineTodayPlanState(
      makePlan(),
      [
        makePlanDay({ id: 'pd-1', dayOfWeek: 1, sessionOrder: 1, workoutType: 'Upper' }),
        makePlanDay({ id: 'pd-2', dayOfWeek: 1, sessionOrder: 2, workoutType: 'Cardio' }),
      ],
      [makeWorkout({ id: 'w-1', date: '2026-03-29', name: 'Upper', planDayId: 'pd-1' })],
    );
    expect(result).toBe('training-partial');
  });

  it('returns training-completed when all sessions have matching workouts', () => {
    const result = determineTodayPlanState(
      makePlan(),
      [
        makePlanDay({ id: 'pd-1', dayOfWeek: 1, sessionOrder: 1, workoutType: 'Upper' }),
        makePlanDay({ id: 'pd-2', dayOfWeek: 1, sessionOrder: 2, workoutType: 'Cardio' }),
      ],
      [
        makeWorkout({ id: 'w-1', date: '2026-03-29', name: 'Upper', planDayId: 'pd-1' }),
        makeWorkout({ id: 'w-2', date: '2026-03-29', name: 'Cardio', planDayId: 'pd-2' }),
      ],
    );
    expect(result).toBe('training-completed');
  });

  it('returns training-pending when no sessions completed', () => {
    const result = determineTodayPlanState(
      makePlan(),
      [
        makePlanDay({ id: 'pd-1', dayOfWeek: 1, sessionOrder: 1, workoutType: 'Upper' }),
        makePlanDay({ id: 'pd-2', dayOfWeek: 1, sessionOrder: 2, workoutType: 'Cardio' }),
      ],
      [],
    );
    expect(result).toBe('training-pending');
  });
});

describe('useTodaysPlan', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 2025-01-15 is Wednesday → getDay() === 3
    vi.setSystemTime(new Date('2025-01-15T10:00:00'));
    localStorage.clear();
    resetStores();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns correct workoutType from plan day', () => {
    useFitnessStore.setState({
      trainingPlans: [makePlan()],
      trainingPlanDays: [makePlanDay()],
    });

    const { result } = renderHook(() => useTodaysPlan());

    expect(result.current.workoutType).toBe('Upper Body A');
    expect(result.current.muscleGroups).toBe('chest, shoulders, triceps');
    expect(result.current.state).toBe('training-pending');
  });

  it('returns exercise count from plan day', () => {
    useFitnessStore.setState({
      trainingPlans: [makePlan()],
      trainingPlanDays: [makePlanDay()],
    });

    const { result } = renderHook(() => useTodaysPlan());

    expect(result.current.exerciseCount).toBe(2);
    expect(result.current.estimatedDuration).toBeGreaterThan(0);
  });

  it('returns completed workout duration and sets', () => {
    useFitnessStore.setState({
      trainingPlans: [makePlan()],
      trainingPlanDays: [makePlanDay()],
      workouts: [makeWorkout({ planDayId: 'day-wed' })],
      workoutSets: [
        makeWorkoutSet({ id: 'set-1' }),
        makeWorkoutSet({ id: 'set-2', setNumber: 2 }),
        makeWorkoutSet({ id: 'set-3', setNumber: 3 }),
      ],
    });

    const { result } = renderHook(() => useTodaysPlan());

    expect(result.current.state).toBe('training-completed');
    expect(result.current.completedWorkout).toEqual({
      durationMin: 65,
      totalSets: 3,
      hasPR: false,
    });
  });

  it('returns tomorrow preview', () => {
    const tomorrowDay = makePlanDay({
      id: 'day-thu',
      dayOfWeek: 4,
      workoutType: 'Lower Body A',
      muscleGroups: 'quads, hamstrings, glutes',
    });

    useFitnessStore.setState({
      trainingPlans: [makePlan()],
      trainingPlanDays: [makePlanDay(), tomorrowDay],
    });

    const { result } = renderHook(() => useTodaysPlan());

    expect(result.current.tomorrowWorkoutType).toBe('Lower Body A');
    expect(result.current.tomorrowMuscleGroups).toBe(
      'quads, hamstrings, glutes',
    );
  });

  it('returns meals logged count', () => {
    useDayPlanStore.setState({
      dayPlans: [
        makeDayPlan({
          breakfastDishIds: [],
          lunchDishIds: ['dish-2'],
          dinnerDishIds: [],
        }),
      ],
    });

    const { result } = renderHook(() => useTodaysPlan());

    expect(result.current.mealsLogged).toBe(1);
    expect(result.current.totalMealsPlanned).toBe(3);
    expect(result.current.hasReachedTarget).toBe(false);
  });

  it('handles no dayPlan for today', () => {
    const { result } = renderHook(() => useTodaysPlan());

    expect(result.current.mealsLogged).toBe(0);
    expect(result.current.hasReachedTarget).toBe(false);
  });

  it('Sunday wraps to Monday for tomorrow', () => {
    // 2025-01-19 is Sunday → getDay() === 0 → todayDow = 7
    vi.setSystemTime(new Date('2025-01-19T10:00:00'));

    const mondayDay = makePlanDay({
      id: 'day-mon',
      dayOfWeek: 1,
      workoutType: 'Push Day',
      muscleGroups: 'chest, shoulders',
    });

    useFitnessStore.setState({
      trainingPlans: [makePlan()],
      trainingPlanDays: [mondayDay],
    });

    const { result } = renderHook(() => useTodaysPlan());

    expect(result.current.tomorrowWorkoutType).toBe('Push Day');
    expect(result.current.tomorrowMuscleGroups).toBe('chest, shoulders');
    expect(result.current.state).toBe('rest-day');
  });

  it('Sunday matches plan day with dayOfWeek 7', () => {
    // 2025-01-19 is Sunday → getDay() === 0 → todayDow = 7
    vi.setSystemTime(new Date('2025-01-19T10:00:00'));

    const sundayDay = makePlanDay({
      id: 'day-sun',
      dayOfWeek: 7,
      workoutType: 'Active Recovery',
      muscleGroups: 'full body',
    });

    useFitnessStore.setState({
      trainingPlans: [makePlan()],
      trainingPlanDays: [sundayDay],
    });

    const { result } = renderHook(() => useTodaysPlan());

    expect(result.current.state).toBe('training-pending');
    expect(result.current.workoutType).toBe('Active Recovery');
    expect(result.current.totalSessions).toBe(1);
  });

  it('returns no-plan state when no active training plan', () => {
    const { result } = renderHook(() => useTodaysPlan());

    expect(result.current.state).toBe('no-plan');
    expect(result.current.workoutType).toBeUndefined();
    expect(result.current.exerciseCount).toBeUndefined();
    expect(result.current.estimatedDuration).toBeUndefined();
    expect(result.current.completedWorkout).toBeUndefined();
    expect(result.current.tomorrowWorkoutType).toBeUndefined();
    expect(result.current.tomorrowMuscleGroups).toBeUndefined();
  });

  it('returns rest-day when active plan has no day matching today', () => {
    useFitnessStore.setState({
      trainingPlans: [makePlan()],
      trainingPlanDays: [makePlanDay({ dayOfWeek: 1 })],
    });

    const { result } = renderHook(() => useTodaysPlan());

    expect(result.current.state).toBe('rest-day');
    expect(result.current.workoutType).toBeUndefined();
  });

  it('handles plan day without exercises field', () => {
    useFitnessStore.setState({
      trainingPlans: [makePlan()],
      trainingPlanDays: [makePlanDay({ exercises: undefined })],
    });

    const { result } = renderHook(() => useTodaysPlan());

    expect(result.current.exerciseCount).toBeUndefined();
    expect(result.current.estimatedDuration).toBeUndefined();
  });

  it('handles plan day with invalid exercises JSON', () => {
    useFitnessStore.setState({
      trainingPlans: [makePlan()],
      trainingPlanDays: [makePlanDay({ exercises: '{not-valid-json' })],
    });

    const { result } = renderHook(() => useTodaysPlan());

    expect(result.current.exerciseCount).toBeUndefined();
    expect(result.current.estimatedDuration).toBeUndefined();
  });

  it('handles workout with undefined durationMin', () => {
    useFitnessStore.setState({
      trainingPlans: [makePlan()],
      trainingPlanDays: [makePlanDay()],
      workouts: [makeWorkout({ durationMin: undefined, planDayId: 'day-wed' })],
      workoutSets: [makeWorkoutSet()],
    });

    const { result } = renderHook(() => useTodaysPlan());

    expect(result.current.completedWorkout?.durationMin).toBe(0);
    expect(result.current.completedWorkout?.totalSets).toBe(1);
  });

  it('returns hasReachedTarget true when all meals logged', () => {
    useDayPlanStore.setState({
      dayPlans: [makeDayPlan()],
    });

    const { result } = renderHook(() => useTodaysPlan());

    expect(result.current.mealsLogged).toBe(3);
    expect(result.current.hasReachedTarget).toBe(true);
  });

  it('returns zero meals when dayPlan has all empty slots', () => {
    useDayPlanStore.setState({
      dayPlans: [
        makeDayPlan({
          breakfastDishIds: [],
          lunchDishIds: [],
          dinnerDishIds: [],
        }),
      ],
    });

    const { result } = renderHook(() => useTodaysPlan());

    expect(result.current.mealsLogged).toBe(0);
    expect(result.current.hasReachedTarget).toBe(false);
  });

  it('returns multi-session info for two sessions on the same day', () => {
    vi.setSystemTime(new Date('2025-01-15T10:00:00'));

    useFitnessStore.setState({
      trainingPlans: [makePlan()],
      trainingPlanDays: [
        makePlanDay({ id: 'pd-am', dayOfWeek: 3, sessionOrder: 1, workoutType: 'Upper' }),
        makePlanDay({ id: 'pd-pm', dayOfWeek: 3, sessionOrder: 2, workoutType: 'Cardio', muscleGroups: undefined, exercises: undefined }),
      ],
      workouts: [makeWorkout({ planDayId: 'pd-am' })],
    });

    const { result } = renderHook(() => useTodaysPlan());

    expect(result.current.state).toBe('training-partial');
    expect(result.current.totalSessions).toBe(2);
    expect(result.current.completedSessions).toBe(1);
    expect(result.current.todayPlanDays).toHaveLength(2);
    expect(result.current.nextUncompletedSession?.id).toBe('pd-pm');
    expect(result.current.workoutType).toBe('Upper');
  });

  it('returns nextUncompletedSession as undefined when all done', () => {
    vi.setSystemTime(new Date('2025-01-15T10:00:00'));

    useFitnessStore.setState({
      trainingPlans: [makePlan()],
      trainingPlanDays: [
        makePlanDay({ id: 'pd-am', dayOfWeek: 3, sessionOrder: 1, workoutType: 'Upper' }),
      ],
      workouts: [makeWorkout({ planDayId: 'pd-am' })],
    });

    const { result } = renderHook(() => useTodaysPlan());

    expect(result.current.state).toBe('training-completed');
    expect(result.current.totalSessions).toBe(1);
    expect(result.current.completedSessions).toBe(1);
    expect(result.current.nextUncompletedSession).toBeUndefined();
  });
});
