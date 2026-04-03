import { describe, expect, it } from 'vitest';

import type { Exercise, SelectedExercise } from '../features/fitness/types';
import { estimateDuration, trimToFitDuration } from '../features/fitness/utils/durationEstimator';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function makeExercise(overrides?: Partial<Exercise>): Exercise {
  return {
    id: 'test-ex',
    nameVi: 'Test',
    muscleGroup: 'chest',
    secondaryMuscles: [],
    category: 'compound',
    equipment: ['barbell'],
    contraindicated: [],
    exerciseType: 'strength',
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    isCustom: false,
    updatedAt: '',
    ...overrides,
  };
}

function makeSelected(overrides?: Partial<SelectedExercise>): SelectedExercise {
  return {
    exercise: makeExercise(),
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    restSeconds: 90,
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* estimateDuration                                                    */
/* ------------------------------------------------------------------ */

describe('estimateDuration', () => {
  it('returns 0 for empty exercise list', () => {
    expect(estimateDuration([])).toBe(0);
  });

  it('calculates duration for a single exercise', () => {
    const exercises = [makeSelected({ sets: 3, restSeconds: 90 })];
    // totalSeconds = 3 * (40 + 90) + 30 = 420
    // Math.round(420 / 60) + 5 = 7 + 5 = 12
    expect(estimateDuration(exercises)).toBe(12);
  });

  it('calculates duration for multiple exercises', () => {
    const exercises = [
      makeSelected({ sets: 3, restSeconds: 90 }),
      makeSelected({ sets: 3, restSeconds: 90 }),
      makeSelected({ sets: 2, restSeconds: 60 }),
    ];
    // ex1: 3*(40+90)+30 = 420
    // ex2: 3*(40+90)+30 = 420
    // ex3: 2*(40+60)+30 = 230
    // total = 1070s → Math.round(1070/60) + 5 = 18 + 5 = 23
    expect(estimateDuration(exercises)).toBe(23);
  });

  it('handles exercises with 1 set', () => {
    const exercises = [makeSelected({ sets: 1, restSeconds: 60 })];
    // totalSeconds = 1 * (40 + 60) + 30 = 130
    // Math.round(130 / 60) + 5 = 2 + 5 = 7
    expect(estimateDuration(exercises)).toBe(7);
  });

  it('handles short rest periods', () => {
    const exercises = [makeSelected({ sets: 4, restSeconds: 30 })];
    // totalSeconds = 4 * (40 + 30) + 30 = 310
    // Math.round(310 / 60) + 5 = 5 + 5 = 10
    expect(estimateDuration(exercises)).toBe(10);
  });

  it('handles many exercises for long sessions', () => {
    const exercises = Array.from({ length: 8 }, () => makeSelected({ sets: 4, restSeconds: 120 }));
    // per exercise: 4*(40+120)+30 = 670
    // total = 670*8 = 5360s → Math.round(5360/60) + 5 = 89 + 5 = 94
    expect(estimateDuration(exercises)).toBe(94);
  });
});

/* ------------------------------------------------------------------ */
/* trimToFitDuration                                                   */
/* ------------------------------------------------------------------ */

describe('trimToFitDuration', () => {
  it('returns empty array for empty input', () => {
    expect(trimToFitDuration([], 45)).toEqual([]);
  });

  it('returns exercises unchanged when already under target', () => {
    const exercises = [makeSelected({ sets: 2, restSeconds: 60 })];
    // duration = Math.round((2*(40+60)+30)/60) + 5 = Math.round(230/60) + 5 = 4 + 5 = 9
    const result = trimToFitDuration(exercises, 45);
    expect(result).toHaveLength(1);
    expect(result[0].sets).toBe(2);
  });

  it('removes exercises from end to fit target duration', () => {
    const exercises = Array.from({ length: 8 }, (_, i) =>
      makeSelected({
        exercise: makeExercise({ id: `ex-${i}` }),
        sets: 4,
        restSeconds: 120,
      }),
    );
    // 8 exercises: 94 min (see test above)
    const result = trimToFitDuration(exercises, 45);
    expect(estimateDuration(result)).toBeLessThanOrEqual(45);
    expect(result.length).toBeLessThan(8);
    expect(result.length).toBeGreaterThanOrEqual(1);
    // Should keep first exercises (most important)
    expect(result[0].exercise.id).toBe('ex-0');
  });

  it('reduces sets on last exercise when only one remains and still over', () => {
    // 1 exercise with many sets and long rest
    // 15*(40+180)+30 = 3330s → Math.round(3330/60)+5 = 56+5 = 61
    const bigExercises = [makeSelected({ sets: 15, restSeconds: 180 })];
    // 15*(40+180)+30 = 3330s → Math.round(3330/60)+5 = 56+5 = 61
    const result = trimToFitDuration(bigExercises, 45);
    expect(result).toHaveLength(1);
    expect(result[0].sets).toBeLessThan(15);
    expect(estimateDuration(result)).toBeLessThanOrEqual(45);
  });

  it('does not mutate the original exercises', () => {
    const exercises = Array.from({ length: 6 }, (_, i) =>
      makeSelected({
        exercise: makeExercise({ id: `ex-${i}` }),
        sets: 4,
        restSeconds: 120,
      }),
    );
    const originalLength = exercises.length;
    const originalSets = exercises.map(e => e.sets);
    trimToFitDuration(exercises, 30);
    expect(exercises).toHaveLength(originalLength);
    expect(exercises.map(e => e.sets)).toEqual(originalSets);
  });

  it('keeps at least 1 exercise even if over target', () => {
    // 1 exercise with minimal sets (1 set) — even if duration still exceeds target
    const exercises = [makeSelected({ sets: 1, restSeconds: 180 })];
    // 1*(40+180)+30 = 250s → Math.round(250/60)+5 = 4+5 = 9
    // Target: 5 minutes — can't go below 1 set, so keep it
    const result = trimToFitDuration(exercises, 5);
    expect(result).toHaveLength(1);
    expect(result[0].sets).toBe(1);
  });

  it('returns exact duration match when possible', () => {
    const exercises = [makeSelected({ sets: 3, restSeconds: 90 }), makeSelected({ sets: 3, restSeconds: 90 })];
    // 2 exercises: 2*(3*(40+90)+30) = 840 → Math.round(840/60)+5 = 14+5 = 19
    const result = trimToFitDuration(exercises, 19);
    expect(result).toHaveLength(2);
    expect(estimateDuration(result)).toBe(19);
  });
});
