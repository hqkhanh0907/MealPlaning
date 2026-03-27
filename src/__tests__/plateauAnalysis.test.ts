import { describe, it, expect } from 'vitest';
import type { Workout, WorkoutSet } from '../features/fitness/types';
import { analyzePlateau } from '../features/fitness/utils/plateauAnalysis';

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

let setIdCounter = 0;

function createSet(overrides?: Partial<WorkoutSet>): WorkoutSet {
  setIdCounter++;
  return {
    id: `set-${setIdCounter}`,
    workoutId: 'workout-1',
    exerciseId: 'barbell-bench-press',
    setNumber: 1,
    weightKg: 60,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createWorkout(overrides?: Partial<Workout>): Workout {
  return {
    id: 'workout-1',
    date: '2024-06-01',
    name: 'Test Workout',
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
    ...overrides,
  };
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/* ------------------------------------------------------------------ */
/*  analyzePlateau                                                      */
/* ------------------------------------------------------------------ */

describe('analyzePlateau', () => {
  const workouts = [createWorkout()];
  const exerciseId = 'barbell-bench-press';

  describe('insufficient data', () => {
    it('returns no plateau with empty sets', () => {
      const result = analyzePlateau(workouts, [], exerciseId);
      expect(result).toEqual({
        strengthPlateau: false,
        volumePlateau: false,
        message: 'Insufficient data',
      });
    });

    it('returns no plateau with fewer than 6 sets', () => {
      const sets = Array.from({ length: 5 }, (_, i) =>
        createSet({ reps: 8, weightKg: 60 + i, updatedAt: daysAgo(i) }),
      );
      const result = analyzePlateau(workouts, sets, exerciseId);
      expect(result).toEqual({
        strengthPlateau: false,
        volumePlateau: false,
        message: 'Insufficient data',
      });
    });

    it('returns no plateau when sets belong to a different exercise', () => {
      const sets = Array.from({ length: 10 }, (_, i) =>
        createSet({
          exerciseId: 'other-exercise',
          reps: 8,
          weightKg: 60,
          updatedAt: daysAgo(i),
        }),
      );
      const result = analyzePlateau(workouts, sets, exerciseId);
      expect(result).toEqual({
        strengthPlateau: false,
        volumePlateau: false,
        message: 'Insufficient data',
      });
    });

    it('returns no plateau with exactly 5 matching sets among many other exercises', () => {
      const matchingSets = Array.from({ length: 5 }, (_, i) =>
        createSet({ reps: 8, weightKg: 60, updatedAt: daysAgo(i) }),
      );
      const otherSets = Array.from({ length: 10 }, (_, i) =>
        createSet({
          exerciseId: 'deadlift',
          reps: 5,
          weightKg: 100,
          updatedAt: daysAgo(i),
        }),
      );
      const result = analyzePlateau(workouts, [...matchingSets, ...otherSets], exerciseId);
      expect(result).toEqual({
        strengthPlateau: false,
        volumePlateau: false,
        message: 'Insufficient data',
      });
    });
  });

  describe('strength plateau detection', () => {
    it('detects strength plateau when recent top sets do not exceed previous', () => {
      const sets = Array.from({ length: 9 }, (_, i) =>
        createSet({
          reps: 8,
          weightKg: 60,
          updatedAt: daysAgo(i),
        }),
      );
      const result = analyzePlateau(workouts, sets, exerciseId);
      expect(result.strengthPlateau).toBe(true);
    });

    it('detects no strength plateau when recent weight exceeds previous', () => {
      const olderSets = Array.from({ length: 6 }, (_, i) =>
        createSet({
          reps: 8,
          weightKg: 60,
          updatedAt: daysAgo(i + 3),
        }),
      );
      const recentSets = Array.from({ length: 3 }, (_, i) =>
        createSet({
          reps: 8,
          weightKg: 65,
          updatedAt: daysAgo(i),
        }),
      );
      const result = analyzePlateau(workouts, [...olderSets, ...recentSets], exerciseId);
      expect(result.strengthPlateau).toBe(false);
    });

    it('detects strength plateau when recent max equals previous max', () => {
      const olderSets = Array.from({ length: 6 }, (_, i) =>
        createSet({
          reps: 8,
          weightKg: i < 3 ? 55 : 60,
          updatedAt: daysAgo(i + 3),
        }),
      );
      const recentSets = Array.from({ length: 3 }, (_, i) =>
        createSet({
          reps: 8,
          weightKg: 60,
          updatedAt: daysAgo(i),
        }),
      );
      const result = analyzePlateau(workouts, [...olderSets, ...recentSets], exerciseId);
      expect(result.strengthPlateau).toBe(true);
    });

    it('detects strength plateau when recent max is lower than previous', () => {
      const olderSets = Array.from({ length: 6 }, (_, i) =>
        createSet({
          reps: 8,
          weightKg: 65,
          updatedAt: daysAgo(i + 3),
        }),
      );
      const recentSets = Array.from({ length: 3 }, (_, i) =>
        createSet({
          reps: 8,
          weightKg: 60,
          updatedAt: daysAgo(i),
        }),
      );
      const result = analyzePlateau(workouts, [...olderSets, ...recentSets], exerciseId);
      expect(result.strengthPlateau).toBe(true);
    });
  });

  describe('volume plateau detection', () => {
    it('detects volume plateau when this week volume <= last week volume', () => {
      const lastWeekSets = Array.from({ length: 4 }, (_, i) =>
        createSet({
          reps: 10,
          weightKg: 60,
          updatedAt: daysAgo(7 + i),
        }),
      );
      const thisWeekSets = Array.from({ length: 4 }, (_, i) =>
        createSet({
          reps: 10,
          weightKg: 55,
          updatedAt: daysAgo(i),
        }),
      );
      const olderSets = Array.from({ length: 3 }, (_, i) =>
        createSet({
          reps: 8,
          weightKg: 60,
          updatedAt: daysAgo(20 + i),
        }),
      );
      const allSets = [...lastWeekSets, ...thisWeekSets, ...olderSets];
      const result = analyzePlateau(workouts, allSets, exerciseId);
      expect(result.volumePlateau).toBe(true);
    });

    it('detects no volume plateau when this week volume exceeds last week', () => {
      const lastWeekSets = Array.from({ length: 3 }, (_, i) =>
        createSet({
          reps: 8,
          weightKg: 50,
          updatedAt: daysAgo(7 + i),
        }),
      );
      const thisWeekSets = Array.from({ length: 4 }, (_, i) =>
        createSet({
          reps: 10,
          weightKg: 60,
          updatedAt: daysAgo(i),
        }),
      );
      const olderSets = Array.from({ length: 3 }, (_, i) =>
        createSet({
          reps: 8,
          weightKg: 60,
          updatedAt: daysAgo(20 + i),
        }),
      );
      const allSets = [...lastWeekSets, ...thisWeekSets, ...olderSets];
      const result = analyzePlateau(workouts, allSets, exerciseId);
      expect(result.volumePlateau).toBe(false);
    });

    it('detects no volume plateau when last week has zero volume', () => {
      const thisWeekSets = Array.from({ length: 4 }, (_, i) =>
        createSet({
          reps: 10,
          weightKg: 60,
          updatedAt: daysAgo(i),
        }),
      );
      const olderSets = Array.from({ length: 4 }, (_, i) =>
        createSet({
          reps: 8,
          weightKg: 60,
          updatedAt: daysAgo(20 + i),
        }),
      );
      const allSets = [...thisWeekSets, ...olderSets];
      const result = analyzePlateau(workouts, allSets, exerciseId);
      expect(result.volumePlateau).toBe(false);
    });

    it('handles sets with undefined reps as 0 in volume calculation', () => {
      const lastWeekSets = Array.from({ length: 4 }, (_, i) =>
        createSet({
          reps: 10,
          weightKg: 60,
          updatedAt: daysAgo(7 + i),
        }),
      );
      const thisWeekSets = Array.from({ length: 4 }, (_, i) =>
        createSet({
          reps: undefined,
          weightKg: 60,
          updatedAt: daysAgo(i),
        }),
      );
      const olderSets = Array.from({ length: 3 }, (_, i) =>
        createSet({
          reps: 8,
          weightKg: 60,
          updatedAt: daysAgo(20 + i),
        }),
      );
      const allSets = [...lastWeekSets, ...thisWeekSets, ...olderSets];
      const result = analyzePlateau(workouts, allSets, exerciseId);
      // thisWeekVol = 0 (reps undefined → 0), lastWeekVol > 0 → volume plateau
      expect(result.volumePlateau).toBe(true);
    });

    it('handles undefined reps in last week volume calculation', () => {
      const lastWeekSets = Array.from({ length: 4 }, (_, i) =>
        createSet({
          reps: undefined,
          weightKg: 60,
          updatedAt: daysAgo(7 + i),
        }),
      );
      const thisWeekSets = Array.from({ length: 4 }, (_, i) =>
        createSet({
          reps: 10,
          weightKg: 60,
          updatedAt: daysAgo(i),
        }),
      );
      const olderSets = Array.from({ length: 3 }, (_, i) =>
        createSet({
          reps: 8,
          weightKg: 60,
          updatedAt: daysAgo(20 + i),
        }),
      );
      const allSets = [...lastWeekSets, ...thisWeekSets, ...olderSets];
      const result = analyzePlateau(workouts, allSets, exerciseId);
      // lastWeekVol = 0 (reps undefined → 0) → volumePlateau false (guard: lastWeekVol > 0)
      expect(result.volumePlateau).toBe(false);
    });
  });

  describe('combined plateau messages', () => {
    it('returns "Strength stagnation; Volume plateau" when both detected', () => {
      const lastWeekSets = Array.from({ length: 6 }, (_, i) =>
        createSet({
          reps: 10,
          weightKg: 60,
          updatedAt: daysAgo(7 + i),
        }),
      );
      const thisWeekSets = Array.from({ length: 3 }, (_, i) =>
        createSet({
          reps: 8,
          weightKg: 55,
          updatedAt: daysAgo(i),
        }),
      );
      const allSets = [...lastWeekSets, ...thisWeekSets];
      const result = analyzePlateau(workouts, allSets, exerciseId);
      expect(result.strengthPlateau).toBe(true);
      expect(result.volumePlateau).toBe(true);
      expect(result.message).toBe('Strength stagnation; Volume plateau');
    });

    it('returns "Strength stagnation" for strength-only plateau', () => {
      const lastWeekSets = Array.from({ length: 3 }, (_, i) =>
        createSet({
          reps: 8,
          weightKg: 60,
          updatedAt: daysAgo(7 + i),
        }),
      );
      const thisWeekSets = Array.from({ length: 3 }, (_, i) =>
        createSet({
          reps: 10,
          weightKg: 60,
          updatedAt: daysAgo(i),
        }),
      );
      const olderSets = Array.from({ length: 3 }, (_, i) =>
        createSet({
          reps: 8,
          weightKg: 60,
          updatedAt: daysAgo(20 + i),
        }),
      );
      const allSets = [...lastWeekSets, ...thisWeekSets, ...olderSets];
      const result = analyzePlateau(workouts, allSets, exerciseId);
      expect(result.strengthPlateau).toBe(true);
      // This week volume higher due to more reps → no volume plateau
      expect(result.message).toContain('Strength stagnation');
    });

    it('returns "No plateau detected" when neither detected', () => {
      const olderSets = Array.from({ length: 3 }, (_, i) =>
        createSet({
          reps: 8,
          weightKg: 50,
          updatedAt: daysAgo(7 + i),
        }),
      );
      const recentSets = Array.from({ length: 3 }, (_, i) =>
        createSet({
          reps: 10,
          weightKg: 65,
          updatedAt: daysAgo(i),
        }),
      );
      const moreOlderSets = Array.from({ length: 3 }, (_, i) =>
        createSet({
          reps: 8,
          weightKg: 45,
          updatedAt: daysAgo(20 + i),
        }),
      );
      const allSets = [...olderSets, ...recentSets, ...moreOlderSets];
      const result = analyzePlateau(workouts, allSets, exerciseId);
      expect(result.strengthPlateau).toBe(false);
      expect(result.volumePlateau).toBe(false);
      expect(result.message).toBe('No plateau detected');
    });
  });

  describe('edge cases', () => {
    it('sorts sets by updatedAt descending to identify recent vs previous', () => {
      // Recent 3 at 70kg, previous 6 at 60kg → no strength plateau
      const sets = [
        ...Array.from({ length: 3 }, (_, i) =>
          createSet({ weightKg: 70, reps: 8, updatedAt: daysAgo(i) }),
        ),
        ...Array.from({ length: 6 }, (_, i) =>
          createSet({ weightKg: 60, reps: 8, updatedAt: daysAgo(3 + i) }),
        ),
      ];
      const result = analyzePlateau(workouts, sets, exerciseId);
      expect(result.strengthPlateau).toBe(false);
    });

    it('works with exactly 6 sets (minimum threshold)', () => {
      const sets = Array.from({ length: 6 }, (_, i) =>
        createSet({ weightKg: 60, reps: 8, updatedAt: daysAgo(i) }),
      );
      const result = analyzePlateau(workouts, sets, exerciseId);
      // All same weight → strength plateau
      expect(result.strengthPlateau).toBe(true);
    });

    it('ignores first param (workouts) for the analysis', () => {
      const sets = Array.from({ length: 9 }, (_, i) =>
        createSet({ weightKg: 60, reps: 8, updatedAt: daysAgo(i) }),
      );
      const resultA = analyzePlateau([], sets, exerciseId);
      const resultB = analyzePlateau(workouts, sets, exerciseId);
      expect(resultA).toEqual(resultB);
    });

    it('handles sets with same updatedAt gracefully', () => {
      const ts = new Date().toISOString();
      const sets = Array.from({ length: 9 }, () =>
        createSet({ weightKg: 60, reps: 8, updatedAt: ts }),
      );
      const result = analyzePlateau(workouts, sets, exerciseId);
      expect(result.strengthPlateau).toBe(true);
    });

    it('filters by exerciseId correctly with mixed exercises', () => {
      const targetSets = Array.from({ length: 9 }, (_, i) =>
        createSet({ weightKg: 60, reps: 8, updatedAt: daysAgo(i) }),
      );
      const otherSets = Array.from({ length: 9 }, (_, i) =>
        createSet({
          exerciseId: 'deadlift',
          weightKg: 100 + i * 5,
          reps: 5,
          updatedAt: daysAgo(i),
        }),
      );
      const result = analyzePlateau(workouts, [...targetSets, ...otherSets], exerciseId);
      expect(result.strengthPlateau).toBe(true);
    });

    it('handles large number of sets', () => {
      const sets = Array.from({ length: 100 }, (_, i) =>
        createSet({ weightKg: 60 + (i % 2), reps: 8, updatedAt: daysAgo(i) }),
      );
      const result = analyzePlateau(workouts, sets, exerciseId);
      // Should not throw, just compute
      expect(result.strengthPlateau).toBeDefined();
      expect(result.volumePlateau).toBeDefined();
      expect(typeof result.message).toBe('string');
    });
  });
});
