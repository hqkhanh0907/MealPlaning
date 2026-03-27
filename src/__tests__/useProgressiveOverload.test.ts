import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  suggestNextSet,
  detectPlateau,
  detectAcuteFatigue,
  detectChronicOvertraining,
  isLowerBodyExercise,
  isWeightSimilar,
  useProgressiveOverload,
} from '../features/fitness/hooks/useProgressiveOverload';
import type { WorkoutSet, TrainingProfile } from '../features/fitness/types';
import { useFitnessStore } from '../store/fitnessStore';

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
    updatedAt: '2024-01-01',
    ...overrides,
  };
}

function createProfile(
  overrides?: Partial<TrainingProfile>,
): TrainingProfile {
  return {
    id: 'test-profile',
    trainingExperience: 'intermediate',
    daysPerWeek: 3,
    sessionDurationMin: 60,
    trainingGoal: 'hypertrophy',
    availableEquipment: ['barbell', 'dumbbell'],
    injuryRestrictions: [],
    periodizationModel: 'linear',
    planCycleWeeks: 4,
    priorityMuscles: [],
    cardioSessionsWeek: 0,
    cardioTypePref: 'liss',
    cardioDurationMin: 30,
    updatedAt: '',
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  isLowerBodyExercise                                                 */
/* ------------------------------------------------------------------ */

describe('isLowerBodyExercise', () => {
  it('returns true for a legs exercise', () => {
    expect(isLowerBodyExercise('barbell-back-squat')).toBe(true);
  });

  it('returns true for a glutes exercise', () => {
    expect(isLowerBodyExercise('barbell-hip-thrust')).toBe(true);
  });

  it('returns false for an upper body exercise', () => {
    expect(isLowerBodyExercise('barbell-bench-press')).toBe(false);
  });

  it('returns false for an unknown exercise', () => {
    expect(isLowerBodyExercise('unknown-exercise-xyz')).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  suggestNextSet (pure function)                                      */
/* ------------------------------------------------------------------ */

describe('suggestNextSet', () => {
  it('returns manual suggestion when no history (first time)', () => {
    const result = suggestNextSet([], 'beginner', 8, 12, false);
    expect(result).toEqual({ weight: 0, reps: 8, source: 'manual' });
  });

  it('suggests rep_progression when reps not at target', () => {
    const sets = [createSet({ reps: 9, weightKg: 60 })];
    const result = suggestNextSet(sets, 'intermediate', 8, 12, false);
    expect(result).toEqual({
      weight: 60,
      reps: 10,
      source: 'rep_progression',
    });
  });

  it('suggests progressive_overload when reps at target max', () => {
    const sets = [createSet({ reps: 12, weightKg: 60 })];
    const result = suggestNextSet(sets, 'intermediate', 8, 12, false);
    // intermediate upper body increment: 1.25
    expect(result).toEqual({
      weight: 61.25,
      reps: 8,
      source: 'progressive_overload',
    });
  });

  it('suggests progressive_overload when reps exceed target max', () => {
    const sets = [createSet({ reps: 15, weightKg: 60 })];
    const result = suggestNextSet(sets, 'beginner', 8, 12, false);
    // beginner upper body increment: 2.5
    expect(result).toEqual({
      weight: 62.5,
      reps: 8,
      source: 'progressive_overload',
    });
  });

  it('uses correct overload increment for experience level', () => {
    const sets = [createSet({ reps: 12, weightKg: 60 })];
    const beginnerResult = suggestNextSet(sets, 'beginner', 8, 12, false);
    const intermediateResult = suggestNextSet(
      sets,
      'intermediate',
      8,
      12,
      false,
    );
    // beginner upper: 2.5, intermediate upper: 1.25
    expect(beginnerResult.weight).toBe(62.5);
    expect(intermediateResult.weight).toBe(61.25);
  });

  it('lower body gets larger increment than upper body', () => {
    const sets = [createSet({ reps: 12, weightKg: 60 })];
    const upperResult = suggestNextSet(sets, 'beginner', 8, 12, false);
    const lowerResult = suggestNextSet(sets, 'beginner', 8, 12, true);
    // beginner upper: 2.5, beginner lower: 5.0
    expect(lowerResult.weight).toBeGreaterThan(upperResult.weight);
    expect(upperResult.weight).toBe(62.5);
    expect(lowerResult.weight).toBe(65);
  });

  it('uses last set from array for suggestion', () => {
    const sets = [
      createSet({ reps: 10, weightKg: 55, setNumber: 1 }),
      createSet({ reps: 8, weightKg: 60, setNumber: 2 }),
    ];
    const result = suggestNextSet(sets, 'intermediate', 8, 12, false);
    // Uses last set: reps=8, weight=60. 8 < 12 → rep_progression
    expect(result).toEqual({
      weight: 60,
      reps: 9,
      source: 'rep_progression',
    });
  });

  it('handles undefined reps (treats as 0)', () => {
    const sets = [createSet({ weightKg: 60 })]; // reps undefined
    const result = suggestNextSet(sets, 'beginner', 8, 12, false);
    expect(result).toEqual({
      weight: 60,
      reps: 1,
      source: 'rep_progression',
    });
  });
});

/* ------------------------------------------------------------------ */
/*  isWeightSimilar                                                     */
/* ------------------------------------------------------------------ */

describe('isWeightSimilar', () => {
  it('returns true for identical weights', () => {
    expect(isWeightSimilar(80, 80)).toBe(true);
  });

  it('returns true when difference is within 2% tolerance', () => {
    expect(isWeightSimilar(80, 81)).toBe(true);
    expect(isWeightSimilar(80, 78.5)).toBe(true);
    expect(isWeightSimilar(80, 81.6)).toBe(true);
  });

  it('returns false when difference exceeds 2% tolerance', () => {
    expect(isWeightSimilar(80, 83)).toBe(false);
    expect(isWeightSimilar(80, 77)).toBe(false);
  });

  it('returns true for both zero values', () => {
    expect(isWeightSimilar(0, 0)).toBe(true);
  });

  it('returns true when one value is zero and other is zero', () => {
    expect(isWeightSimilar(0, 0)).toBe(true);
  });

  it('returns false when one value is zero and other is nonzero', () => {
    expect(isWeightSimilar(0, 5)).toBe(false);
  });

  it('supports custom tolerance', () => {
    expect(isWeightSimilar(100, 105, 0.05)).toBe(true);
    expect(isWeightSimilar(100, 106, 0.05)).toBe(false);
  });

  it('is symmetric (a,b same as b,a)', () => {
    expect(isWeightSimilar(80, 81.5)).toBe(true);
    expect(isWeightSimilar(81.5, 80)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  detectPlateau                                                       */
/* ------------------------------------------------------------------ */

describe('detectPlateau', () => {
  it('detects plateau when 3 sessions have same max weight', () => {
    const sessions = [
      [createSet({ weightKg: 60 })],
      [createSet({ weightKg: 60 })],
      [createSet({ weightKg: 60 })],
    ];
    const result = detectPlateau(sessions);
    expect(result).toEqual({ isPlateaued: true, weeks: 3 });
  });

  it('returns no plateau when weight increased recently', () => {
    const sessions = [
      [createSet({ weightKg: 60 })],
      [createSet({ weightKg: 60 })],
      [createSet({ weightKg: 65 })],
    ];
    const result = detectPlateau(sessions);
    expect(result).toEqual({ isPlateaued: false, weeks: 1 });
  });

  it('returns no plateau when fewer sessions than threshold', () => {
    const sessions = [
      [createSet({ weightKg: 60 })],
      [createSet({ weightKg: 60 })],
    ];
    const result = detectPlateau(sessions);
    expect(result).toEqual({ isPlateaued: false, weeks: 0 });
  });

  it('handles empty history', () => {
    expect(detectPlateau([])).toEqual({ isPlateaued: false, weeks: 0 });
  });

  it('handles empty sessions within history', () => {
    const sessions: WorkoutSet[][] = [[], [], []];
    // All empty → maxWeight 0 for all → streak of 3
    const result = detectPlateau(sessions);
    expect(result).toEqual({ isPlateaued: true, weeks: 3 });
  });

  it('supports custom threshold', () => {
    const sessions = [
      [createSet({ weightKg: 60 })],
      [createSet({ weightKg: 60 })],
    ];
    expect(detectPlateau(sessions, 3).isPlateaued).toBe(false);
    expect(detectPlateau(sessions, 2).isPlateaued).toBe(true);
  });

  it('counts streak correctly with mixed weights', () => {
    const sessions = [
      [createSet({ weightKg: 55 })],
      [createSet({ weightKg: 60 })],
      [createSet({ weightKg: 60 })],
      [createSet({ weightKg: 60 })],
    ];
    const result = detectPlateau(sessions);
    // Last 3 sessions are 60 → streak = 3
    expect(result).toEqual({ isPlateaued: true, weeks: 3 });
  });

  it('uses max weight from each session with multiple sets', () => {
    const sessions = [
      [createSet({ weightKg: 55 }), createSet({ weightKg: 60 })],
      [createSet({ weightKg: 50 }), createSet({ weightKg: 60 })],
      [createSet({ weightKg: 58 }), createSet({ weightKg: 60 })],
    ];
    const result = detectPlateau(sessions);
    // Max weights: [60, 60, 60] → plateau
    expect(result).toEqual({ isPlateaued: true, weeks: 3 });
  });

  it('detects plateau with ±2% weight tolerance (e.g. 80 vs 80.5)', () => {
    const sessions = [
      [createSet({ weightKg: 80 })],
      [createSet({ weightKg: 80.5 })],
      [createSet({ weightKg: 79.5 })],
    ];
    const result = detectPlateau(sessions);
    expect(result).toEqual({ isPlateaued: true, weeks: 3 });
  });

  it('does not detect plateau when weight difference exceeds 2%', () => {
    const sessions = [
      [createSet({ weightKg: 80 })],
      [createSet({ weightKg: 80 })],
      [createSet({ weightKg: 85 })],
    ];
    const result = detectPlateau(sessions);
    expect(result).toEqual({ isPlateaued: false, weeks: 1 });
  });
});

/* ------------------------------------------------------------------ */
/*  detectAcuteFatigue                                                   */
/* ------------------------------------------------------------------ */

describe('detectAcuteFatigue', () => {
  it('returns none when fewer than 3 sets', () => {
    const sets = [createSet({ rpe: 9.5 }), createSet({ rpe: 9.5 })];
    expect(detectAcuteFatigue(sets)).toEqual({ level: 'none', message: '' });
  });

  it('detects high fatigue when avg RPE >= 9.0', () => {
    const sets = [
      createSet({ rpe: 9.5 }),
      createSet({ rpe: 9.5 }),
      createSet({ rpe: 9.5 }),
    ];
    const result = detectAcuteFatigue(sets);
    expect(result.level).toBe('high');
    expect(result.message).toContain('Acute fatigue');
    expect(result.message).toContain('9.5');
  });

  it('detects moderate fatigue when avg RPE >= 8.0 and < 9.0', () => {
    const sets = [
      createSet({ rpe: 8.0 }),
      createSet({ rpe: 8.5 }),
      createSet({ rpe: 8.0 }),
    ];
    const result = detectAcuteFatigue(sets);
    expect(result.level).toBe('moderate');
    expect(result.message).toContain('Moderate fatigue');
  });

  it('returns none when avg RPE < 8.0', () => {
    const sets = [
      createSet({ rpe: 6.0 }),
      createSet({ rpe: 7.0 }),
      createSet({ rpe: 7.0 }),
    ];
    expect(detectAcuteFatigue(sets)).toEqual({ level: 'none', message: '' });
  });

  it('handles empty sets', () => {
    expect(detectAcuteFatigue([])).toEqual({ level: 'none', message: '' });
  });

  it('handles sets without RPE values', () => {
    const sets = [
      createSet({ rpe: undefined }),
      createSet({ rpe: undefined }),
      createSet({ rpe: undefined }),
    ];
    expect(detectAcuteFatigue(sets)).toEqual({ level: 'none', message: '' });
  });

  it('detects high fatigue on volume spike > 1.3', () => {
    const sets = [
      createSet({ rpe: 7.0, reps: 5, weightKg: 50 }),
      createSet({ rpe: 7.0, reps: 5, weightKg: 50 }),
      createSet({ rpe: 7.0, reps: 5, weightKg: 50 }),
      createSet({ rpe: 7.0, reps: 5, weightKg: 50 }),
      createSet({ rpe: 7.0, reps: 5, weightKg: 50 }),
      createSet({ rpe: 7.0, reps: 5, weightKg: 50 }),
      createSet({ rpe: 7.0, reps: 12, weightKg: 100 }),
      createSet({ rpe: 7.0, reps: 12, weightKg: 100 }),
      createSet({ rpe: 7.0, reps: 12, weightKg: 100 }),
    ];
    const result = detectAcuteFatigue(sets);
    expect(result.level).toBe('high');
    expect(result.message).toContain('volume spike');
  });

  it('ignores sets with zero or undefined RPE in average', () => {
    const sets = [
      createSet({ rpe: 9.5 }),
      createSet({ rpe: undefined }),
      createSet({ rpe: 9.5 }),
      createSet({ rpe: 0 }),
    ];
    const result = detectAcuteFatigue(sets);
    expect(result.level).toBe('high');
    expect(result.message).toContain('9.5');
  });
});

/* ------------------------------------------------------------------ */
/*  detectChronicOvertraining                                            */
/* ------------------------------------------------------------------ */

describe('detectChronicOvertraining', () => {
  it('returns none when fewer than 12 sets', () => {
    const sets = Array.from({ length: 11 }, () => createSet({}));
    expect(detectChronicOvertraining(sets)).toEqual({
      level: 'none',
      message: '',
    });
  });

  it('returns none with empty array', () => {
    expect(detectChronicOvertraining([])).toEqual({
      level: 'none',
      message: '',
    });
  });

  it('returns none when no declining weeks', () => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const sets: WorkoutSet[] = [];
    for (let w = 0; w < 6; w++) {
      const midWeek = now - (6 - w - 0.5) * weekMs;
      for (let i = 0; i < 2; i++) {
        sets.push(
          createSet({
            updatedAt: new Date(midWeek + i * 1000).toISOString(),
            reps: 10,
            weightKg: 30,
          }),
        );
      }
    }
    expect(detectChronicOvertraining(sets).level).toBe('none');
  });

  it('detects high chronic overtraining with 4+ declining weeks', () => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const sets: WorkoutSet[] = [];
    const repsPerWeek = [10, 8, 6, 4, 3, 2];
    for (let w = 0; w < 6; w++) {
      const midWeek = now - (6 - w - 0.5) * weekMs;
      for (let i = 0; i < 2; i++) {
        sets.push(
          createSet({
            updatedAt: new Date(midWeek + i * 1000).toISOString(),
            reps: repsPerWeek[w],
            weightKg: 30,
          }),
        );
      }
    }
    const result = detectChronicOvertraining(sets);
    expect(result.level).toBe('high');
    expect(result.message).toContain('weeks declining');
  });

  it('detects moderate chronic overtraining with 2-3 declining weeks', () => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const sets: WorkoutSet[] = [];
    const repsPerWeek = [10, 10, 10, 10, 8, 6];
    for (let w = 0; w < 6; w++) {
      const midWeek = now - (6 - w - 0.5) * weekMs;
      for (let i = 0; i < 2; i++) {
        sets.push(
          createSet({
            updatedAt: new Date(midWeek + i * 1000).toISOString(),
            reps: repsPerWeek[w],
            weightKg: 30,
          }),
        );
      }
    }
    const result = detectChronicOvertraining(sets);
    expect(result.level).toBe('moderate');
    expect(result.message).toContain('weeks declining');
  });
});

/* ------------------------------------------------------------------ */
/*  useProgressiveOverload hook                                         */
/* ------------------------------------------------------------------ */

describe('useProgressiveOverload hook', () => {
  beforeEach(() => {
    setIdCounter = 0;
    useFitnessStore.setState({
      workoutSets: [],
      workouts: [],
      trainingProfile: null,
    });
  });

  describe('getLastSets', () => {
    it('returns empty when no sets for exercise', () => {
      const { result } = renderHook(() => useProgressiveOverload());
      expect(result.current.getLastSets('unknown-exercise')).toEqual([]);
    });

    it('returns empty when sets exist but no matching workouts', () => {
      useFitnessStore.setState({
        workoutSets: [
          createSet({ exerciseId: 'bench', workoutId: 'w-orphan' }),
        ],
        workouts: [],
      });
      const { result } = renderHook(() => useProgressiveOverload());
      expect(result.current.getLastSets('bench')).toEqual([]);
    });

    it('returns sets from the most recent workout sorted by setNumber', () => {
      const s1 = createSet({
        exerciseId: 'bench',
        workoutId: 'w1',
        setNumber: 1,
        weightKg: 55,
      });
      const s2 = createSet({
        exerciseId: 'bench',
        workoutId: 'w2',
        setNumber: 3,
        weightKg: 67.5,
      });
      const s3 = createSet({
        exerciseId: 'bench',
        workoutId: 'w2',
        setNumber: 1,
        weightKg: 60,
      });
      const s4 = createSet({
        exerciseId: 'bench',
        workoutId: 'w2',
        setNumber: 2,
        weightKg: 65,
      });

      useFitnessStore.setState({
        workoutSets: [s1, s2, s3, s4],
        workouts: [
          {
            id: 'w1',
            date: '2024-01-01',
            name: 'Day 1',
            createdAt: '',
            updatedAt: '',
          },
          {
            id: 'w2',
            date: '2024-01-08',
            name: 'Day 2',
            createdAt: '',
            updatedAt: '',
          },
        ],
      });

      const { result } = renderHook(() => useProgressiveOverload());
      const sets = result.current.getLastSets('bench');
      expect(sets).toHaveLength(3);
      expect(sets[0].setNumber).toBe(1);
      expect(sets[1].setNumber).toBe(2);
      expect(sets[2].setNumber).toBe(3);
      expect(sets.every((s) => s.workoutId === 'w2')).toBe(true);
    });
  });

  describe('checkPlateau', () => {
    it('returns no plateau when no sets for exercise', () => {
      const { result } = renderHook(() => useProgressiveOverload());
      expect(result.current.checkPlateau('unknown')).toEqual({
        isPlateaued: false,
        weeks: 0,
      });
    });

    it('detects plateau from store data', () => {
      useFitnessStore.setState({
        workoutSets: [
          createSet({
            exerciseId: 'bench',
            workoutId: 'w1',
            weightKg: 60,
          }),
          createSet({
            exerciseId: 'bench',
            workoutId: 'w2',
            weightKg: 60,
          }),
          createSet({
            exerciseId: 'bench',
            workoutId: 'w3',
            weightKg: 60,
          }),
        ],
        workouts: [
          {
            id: 'w1',
            date: '2024-01-01',
            name: 'D1',
            createdAt: '',
            updatedAt: '',
          },
          {
            id: 'w2',
            date: '2024-01-08',
            name: 'D2',
            createdAt: '',
            updatedAt: '',
          },
          {
            id: 'w3',
            date: '2024-01-15',
            name: 'D3',
            createdAt: '',
            updatedAt: '',
          },
        ],
      });
      const { result } = renderHook(() => useProgressiveOverload());
      expect(result.current.checkPlateau('bench')).toEqual({
        isPlateaued: true,
        weeks: 3,
      });
    });
  });

  describe('checkAcuteFatigue', () => {
    it('filters sets by exerciseId and detects acute fatigue', () => {
      const sets = [
        createSet({ exerciseId: 'bench', rpe: 9.5 }),
        createSet({ exerciseId: 'squat', rpe: 5 }),
        createSet({ exerciseId: 'bench', rpe: 9.5 }),
        createSet({ exerciseId: 'bench', rpe: 9.5 }),
      ];
      const { result } = renderHook(() => useProgressiveOverload());
      const res = result.current.checkAcuteFatigue('bench', sets);
      expect(res.level).toBe('high');
      expect(res.message).toContain('Acute fatigue');
    });

    it('returns none when no matching sets', () => {
      const sets = [createSet({ exerciseId: 'squat', rpe: 9.5 })];
      const { result } = renderHook(() => useProgressiveOverload());
      const res = result.current.checkAcuteFatigue('bench', sets);
      expect(res.level).toBe('none');
    });
  });

  describe('checkChronicOvertraining', () => {
    it('returns none when insufficient data in store', () => {
      const { result } = renderHook(() => useProgressiveOverload());
      const res = result.current.checkChronicOvertraining('bench');
      expect(res.level).toBe('none');
    });

    it('filters by exerciseId from store data', () => {
      useFitnessStore.setState({
        workoutSets: [
          createSet({ exerciseId: 'bench' }),
          createSet({ exerciseId: 'squat' }),
        ],
      });
      const { result } = renderHook(() => useProgressiveOverload());
      const res = result.current.checkChronicOvertraining('bench');
      expect(res.level).toBe('none');
    });
  });

  describe('cached fatigue values', () => {
    it('exposes acuteFatigue and chronicOvertraining from store data', () => {
      const { result } = renderHook(() => useProgressiveOverload());
      expect(result.current.acuteFatigue).toEqual({
        level: 'none',
        message: '',
      });
      expect(result.current.chronicOvertraining).toEqual({
        level: 'none',
        message: '',
      });
    });
  });

  describe('suggestNextSet (hook integration)', () => {
    it('returns manual suggestion when no history and defaults to beginner', () => {
      const { result } = renderHook(() => useProgressiveOverload());
      const suggestion = result.current.suggestNextSet(
        'barbell-bench-press',
        8,
        12,
      );
      expect(suggestion.source).toBe('manual');
      expect(suggestion.weight).toBe(0);
      expect(suggestion.reps).toBe(8);
    });

    it('returns clean suggestion without plateau/overtraining flags', () => {
      useFitnessStore.setState({
        workoutSets: [
          createSet({
            exerciseId: 'barbell-bench-press',
            workoutId: 'w1',
            weightKg: 60,
            reps: 10,
            setNumber: 1,
          }),
        ],
        workouts: [
          {
            id: 'w1',
            date: '2024-01-01',
            name: 'D1',
            createdAt: '',
            updatedAt: '',
          },
        ],
        trainingProfile: createProfile({
          trainingExperience: 'beginner',
        }),
      });
      const { result } = renderHook(() => useProgressiveOverload());
      const suggestion = result.current.suggestNextSet(
        'barbell-bench-press',
        8,
        12,
      );
      expect(suggestion.source).toBe('rep_progression');
      expect(suggestion.weight).toBe(60);
      expect(suggestion.reps).toBe(11);
      expect(suggestion.isPlateaued).toBeUndefined();
      expect(suggestion.isOvertraining).toBeUndefined();
    });

    it('includes plateau and overtraining flags when applicable', () => {
      useFitnessStore.setState({
        workoutSets: [
          createSet({
            exerciseId: 'barbell-bench-press',
            workoutId: 'w1',
            weightKg: 60,
            reps: 12,
            rpe: 9.5,
            setNumber: 1,
          }),
          createSet({
            exerciseId: 'barbell-bench-press',
            workoutId: 'w2',
            weightKg: 60,
            reps: 12,
            rpe: 9.5,
            setNumber: 1,
          }),
          createSet({
            exerciseId: 'barbell-bench-press',
            workoutId: 'w3',
            weightKg: 60,
            reps: 12,
            rpe: 9.5,
            setNumber: 1,
          }),
        ],
        workouts: [
          {
            id: 'w1',
            date: '2024-01-01',
            name: 'D1',
            createdAt: '',
            updatedAt: '',
          },
          {
            id: 'w2',
            date: '2024-01-08',
            name: 'D2',
            createdAt: '',
            updatedAt: '',
          },
          {
            id: 'w3',
            date: '2024-01-15',
            name: 'D3',
            createdAt: '',
            updatedAt: '',
          },
        ],
        trainingProfile: createProfile({
          trainingExperience: 'intermediate',
        }),
      });
      const { result } = renderHook(() => useProgressiveOverload());
      const suggestion = result.current.suggestNextSet(
        'barbell-bench-press',
        8,
        12,
      );
      // intermediate upper body increment: 1.25
      expect(suggestion.source).toBe('progressive_overload');
      expect(suggestion.weight).toBe(61.25);
      expect(suggestion.reps).toBe(8);
      expect(suggestion.isPlateaued).toBe(true);
      expect(suggestion.plateauWeeks).toBe(3);
      expect(suggestion.isOvertraining).toBe(true);
      expect(suggestion.avgRpe).toBe(9.5);
    });

    it('uses profile experience when available', () => {
      useFitnessStore.setState({
        workoutSets: [
          createSet({
            exerciseId: 'barbell-bench-press',
            workoutId: 'w1',
            weightKg: 60,
            reps: 12,
            setNumber: 1,
          }),
        ],
        workouts: [
          {
            id: 'w1',
            date: '2024-01-01',
            name: 'D1',
            createdAt: '',
            updatedAt: '',
          },
        ],
        trainingProfile: createProfile({
          trainingExperience: 'advanced',
        }),
      });
      const { result } = renderHook(() => useProgressiveOverload());
      const suggestion = result.current.suggestNextSet(
        'barbell-bench-press',
        8,
        12,
      );
      // advanced upper body increment: 1.25
      expect(suggestion.weight).toBe(61.25);
    });
  });

  describe('index-based lookup optimization', () => {
    it('returns identical results with large dataset (Map/Set lookups)', () => {
      const sets: WorkoutSet[] = [];
      const workoutList = [];
      for (let i = 0; i < 50; i++) {
        const wId = `w-${i}`;
        workoutList.push({
          id: wId,
          date: `2024-${String(Math.floor(i / 28) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
          name: `Day ${i}`,
          createdAt: '',
          updatedAt: '',
        });
        for (let j = 0; j < 5; j++) {
          sets.push(
            createSet({
              exerciseId: j % 2 === 0 ? 'barbell-bench-press' : 'barbell-back-squat',
              workoutId: wId,
              setNumber: j + 1,
              weightKg: 60,
              reps: 10,
            }),
          );
        }
      }

      useFitnessStore.setState({
        workoutSets: sets,
        workouts: workoutList,
        trainingProfile: createProfile(),
      });

      const { result } = renderHook(() => useProgressiveOverload());

      const lastSets = result.current.getLastSets('barbell-bench-press');
      expect(lastSets.length).toBeGreaterThan(0);
      expect(lastSets.every((s) => s.exerciseId === 'barbell-bench-press')).toBe(true);
      expect(lastSets.every((s) => s.workoutId === lastSets[0].workoutId)).toBe(true);

      const plateau = result.current.checkPlateau('barbell-bench-press');
      expect(plateau.isPlateaued).toBe(true);

      const suggestion = result.current.suggestNextSet('barbell-bench-press', 8, 12);
      expect(suggestion.isPlateaued).toBe(true);
    });

    it('getLastSets returns empty for exercise not in large dataset', () => {
      const sets: WorkoutSet[] = [];
      const workoutList = [];
      for (let i = 0; i < 20; i++) {
        const wId = `w-${i}`;
        workoutList.push({
          id: wId,
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          name: `Day ${i}`,
          createdAt: '',
          updatedAt: '',
        });
        sets.push(
          createSet({
            exerciseId: 'barbell-bench-press',
            workoutId: wId,
            setNumber: 1,
            weightKg: 60,
          }),
        );
      }

      useFitnessStore.setState({
        workoutSets: sets,
        workouts: workoutList,
      });

      const { result } = renderHook(() => useProgressiveOverload());
      expect(result.current.getLastSets('nonexistent-exercise')).toEqual([]);
      expect(result.current.checkPlateau('nonexistent-exercise')).toEqual({
        isPlateaued: false,
        weeks: 0,
      });
    });
  });
});
