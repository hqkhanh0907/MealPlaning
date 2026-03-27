import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActivityMultiplier } from '../features/fitness/hooks/useActivityMultiplier';
import { useFitnessStore } from '../store/fitnessStore';
import { useHealthProfileStore } from '../features/health-profile/store/healthProfileStore';
import { DEFAULT_HEALTH_PROFILE } from '../features/health-profile/types';
import type { Workout, WorkoutSet } from '../features/fitness/types';

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

let idCounter = 0;

function recentDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function createWorkout(overrides?: Partial<Workout>): Workout {
  idCounter++;
  return {
    id: `w-${idCounter}`,
    date: recentDate(0),
    name: 'Test Workout',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createSet(overrides?: Partial<WorkoutSet>): WorkoutSet {
  idCounter++;
  return {
    id: `s-${idCounter}`,
    workoutId: 'w-1',
    exerciseId: 'barbell-bench-press',
    setNumber: 1,
    weightKg: 60,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  useActivityMultiplier hook                                          */
/* ------------------------------------------------------------------ */

describe('useActivityMultiplier', () => {
  beforeEach(() => {
    idCounter = 0;
    useFitnessStore.setState({ workouts: [], workoutSets: [] });
    useHealthProfileStore.setState({
      profile: { ...DEFAULT_HEALTH_PROFILE, activityLevel: 'sedentary' },
    });
  });

  it('returns null analysis when no workouts', () => {
    const { result } = renderHook(() => useActivityMultiplier());
    expect(result.current.analysis).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('returns analysis when workouts exist', () => {
    const workouts: Workout[] = [];
    const sets: WorkoutSet[] = [];
    for (let i = 0; i < 12; i++) {
      const w = createWorkout({ date: recentDate(i * 2) });
      workouts.push(w);
      sets.push(createSet({ workoutId: w.id, reps: 10, weightKg: 60 }));
    }
    useFitnessStore.setState({ workouts, workoutSets: sets });

    const { result } = renderHook(() => useActivityMultiplier());
    expect(result.current.analysis).not.toBeNull();
    expect(result.current.analysis?.suggestedLevel).toBeDefined();
    expect(result.current.analysis?.confidence).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('applySuggestion updates health profile activity level', () => {
    const workouts: Workout[] = [];
    const sets: WorkoutSet[] = [];
    for (let i = 0; i < 24; i++) {
      const w = createWorkout({ date: recentDate(i) });
      workouts.push(w);
      sets.push(createSet({ workoutId: w.id, reps: 10, weightKg: 60 }));
    }
    useFitnessStore.setState({ workouts, workoutSets: sets });
    useHealthProfileStore.setState({
      profile: { ...DEFAULT_HEALTH_PROFILE, activityLevel: 'sedentary' },
    });

    const { result } = renderHook(() => useActivityMultiplier());

    expect(result.current.analysis?.needsAdjustment).toBe(true);
    expect(result.current.analysis?.suggestedLevel).toBe('extra_active');

    act(() => {
      result.current.applySuggestion();
    });

    const updatedProfile = useHealthProfileStore.getState().profile;
    expect(updatedProfile.activityLevel).toBe('extra_active');
  });

  it('applySuggestion is a no-op when no adjustment needed', () => {
    const workouts: Workout[] = [];
    const sets: WorkoutSet[] = [];
    for (let i = 0; i < 12; i++) {
      const w = createWorkout({ date: recentDate(i * 2) });
      workouts.push(w);
      sets.push(createSet({ workoutId: w.id, reps: 10, weightKg: 60 }));
    }
    useFitnessStore.setState({ workouts, workoutSets: sets });
    useHealthProfileStore.setState({
      profile: { ...DEFAULT_HEALTH_PROFILE, activityLevel: 'moderate' },
    });

    const { result } = renderHook(() => useActivityMultiplier());
    expect(result.current.analysis?.needsAdjustment).toBe(false);

    act(() => {
      result.current.applySuggestion();
    });

    const profile = useHealthProfileStore.getState().profile;
    expect(profile.activityLevel).toBe('moderate');
  });

  it('dismissSuggestion hides suggestion', () => {
    const w = createWorkout({ date: recentDate(0) });
    useFitnessStore.setState({
      workouts: [w],
      workoutSets: [createSet({ workoutId: w.id, reps: 10 })],
    });

    const { result } = renderHook(() => useActivityMultiplier());
    expect(result.current.analysis).not.toBeNull();

    act(() => {
      result.current.dismissSuggestion();
    });

    expect(result.current.analysis).toBeNull();
  });
});
