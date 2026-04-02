import type { Workout, WorkoutSet } from '../features/fitness/types';
import {
  calculateExerciseVolume,
  calculateWeeklyVolume,
  estimate1RM,
  getSessionsInPeriod,
  getVolumeByMuscleGroup,
  isPersonalRecord,
} from '../features/fitness/utils/trainingMetrics';

function makeSet(overrides: Partial<WorkoutSet> & { weightKg: number }): WorkoutSet {
  return {
    id: 'set-1',
    workoutId: 'w-1',
    exerciseId: 'ex-1',
    setNumber: 1,
    updatedAt: '2025-01-06T00:00:00Z',
    ...overrides,
  };
}

describe('calculateExerciseVolume', () => {
  it('sums weight × reps for all sets', () => {
    const sets: WorkoutSet[] = [
      makeSet({ id: 's1', reps: 10, weightKg: 60 }),
      makeSet({ id: 's2', reps: 8, weightKg: 60 }),
    ];
    expect(calculateExerciseVolume(sets)).toBe(10 * 60 + 8 * 60);
  });

  it('handles undefined reps by treating them as 0', () => {
    const sets: WorkoutSet[] = [
      makeSet({ id: 's1', reps: undefined, weightKg: 100 }),
      makeSet({ id: 's2', reps: 5, weightKg: 80 }),
    ];
    expect(calculateExerciseVolume(sets)).toBe(0 * 100 + 5 * 80);
  });
});

describe('calculateWeeklyVolume', () => {
  it('aggregates volume across multiple workouts', () => {
    const workouts: Workout[] = [
      {
        id: 'w-1',
        date: '2025-01-06',
        name: 'Push Day',
        createdAt: '2025-01-06T00:00:00Z',
        updatedAt: '2025-01-06T00:00:00Z',
      },
      {
        id: 'w-2',
        date: '2025-01-08',
        name: 'Pull Day',
        createdAt: '2025-01-08T00:00:00Z',
        updatedAt: '2025-01-08T00:00:00Z',
      },
    ];
    const allSets: WorkoutSet[] = [
      makeSet({ id: 's1', workoutId: 'w-1', reps: 10, weightKg: 60 }),
      makeSet({ id: 's2', workoutId: 'w-1', reps: 8, weightKg: 60 }),
      makeSet({ id: 's3', workoutId: 'w-2', reps: 12, weightKg: 50 }),
    ];
    const expected = 10 * 60 + 8 * 60 + 12 * 50;
    expect(calculateWeeklyVolume(workouts, allSets)).toBe(expected);
  });
});

describe('getSessionsInPeriod', () => {
  it('counts workouts within the time window', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const workouts: Workout[] = [
      {
        id: 'w-1',
        date: today.toISOString(),
        name: 'Day A',
        createdAt: today.toISOString(),
        updatedAt: today.toISOString(),
      },
      {
        id: 'w-2',
        date: yesterday.toISOString(),
        name: 'Day B',
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
    ];
    expect(getSessionsInPeriod(workouts, 7)).toBe(2);
  });

  it('excludes workouts older than the period', () => {
    const old = new Date();
    old.setDate(old.getDate() - 30);

    const workouts: Workout[] = [
      {
        id: 'w-1',
        date: old.toISOString(),
        name: 'Old Session',
        createdAt: old.toISOString(),
        updatedAt: old.toISOString(),
      },
    ];
    expect(getSessionsInPeriod(workouts, 7)).toBe(0);
  });
});

describe('estimate1RM', () => {
  it('applies Brzycki formula correctly for 5 reps', () => {
    // Brzycki: weight / (1.0278 - 0.0278 * reps)
    const weight = 100;
    const reps = 5;
    const expected = Math.round(100 / (1.0278 - 0.0278 * 5));
    expect(estimate1RM(weight, reps)).toBe(expected);
  });

  it('returns the weight itself for 1 rep', () => {
    expect(estimate1RM(120, 1)).toBe(120);
  });

  it('returns 0 for invalid inputs', () => {
    expect(estimate1RM(0, 5)).toBe(0);
    expect(estimate1RM(100, 0)).toBe(0);
    expect(estimate1RM(-10, 5)).toBe(0);
    expect(estimate1RM(100, -3)).toBe(0);
  });
});

describe('getVolumeByMuscleGroup', () => {
  it('groups reps correctly by muscle', () => {
    const sets: WorkoutSet[] = [
      makeSet({ id: 's1', exerciseId: 'bench', reps: 10, weightKg: 60 }),
      makeSet({ id: 's2', exerciseId: 'bench', reps: 8, weightKg: 60 }),
      makeSet({ id: 's3', exerciseId: 'squat', reps: 5, weightKg: 100 }),
      makeSet({ id: 's4', exerciseId: 'curl', reps: 12, weightKg: 20 }),
    ];
    const muscleMap: Record<string, string> = {
      bench: 'chest',
      squat: 'legs',
      // curl intentionally missing → should be skipped
    };
    const result = getVolumeByMuscleGroup(sets, muscleMap);
    expect(result).toEqual({ chest: 18, legs: 5 });
  });
});

describe('isPersonalRecord', () => {
  it('returns true when current estimated 1RM exceeds history', () => {
    const historicalSets: WorkoutSet[] = [
      makeSet({ id: 's1', exerciseId: 'bench', reps: 5, weightKg: 80 }),
      makeSet({ id: 's2', exerciseId: 'bench', reps: 3, weightKg: 90 }),
    ];
    // New attempt: 100 kg × 5 reps → higher estimated 1RM than 90×3 or 80×5
    expect(isPersonalRecord('bench', 100, 5, historicalSets)).toBe(true);
  });

  it('returns false when current estimated 1RM is below history', () => {
    const historicalSets: WorkoutSet[] = [makeSet({ id: 's1', exerciseId: 'bench', reps: 5, weightKg: 100 })];
    // New attempt: 80 kg × 5 reps → lower estimated 1RM
    expect(isPersonalRecord('bench', 80, 5, historicalSets)).toBe(false);
  });

  it('returns true on first ever set (no history)', () => {
    expect(isPersonalRecord('bench', 60, 10, [])).toBe(true);
  });
});
