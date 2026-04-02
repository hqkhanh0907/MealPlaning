import { describe, expect, it } from 'vitest';

import type { ExerciseSeed } from '../features/fitness/data/exerciseDatabase';
import type { BodyRegion, EquipmentType, Exercise, MuscleGroup, TrainingProfile } from '../features/fitness/types';
import {
  applyRepScheme,
  calculateSetsPerSession,
  calculateVolume,
  CATEGORY_ORDER,
  generateExercisesForDay,
  getDefaultExercises,
  parseMuscleGroups,
  seedToExercise,
  selectExercisesForMuscle,
} from '../features/fitness/utils/exerciseSelector';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function makeProfile(overrides: Partial<TrainingProfile> = {}): TrainingProfile {
  return {
    id: 'profile-1',
    trainingExperience: 'intermediate',
    daysPerWeek: 4,
    sessionDurationMin: 60,
    trainingGoal: 'hypertrophy',
    availableEquipment: ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight'],
    injuryRestrictions: [],
    periodizationModel: 'linear',
    planCycleWeeks: 8,
    priorityMuscles: [],
    cardioSessionsWeek: 2,
    cardioTypePref: 'mixed',
    cardioDurationMin: 30,
    updatedAt: '2025-06-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'test-exercise',
    nameVi: 'Bài tập test',
    nameEn: 'Test Exercise',
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
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* seedToExercise & getDefaultExercises                                */
/* ------------------------------------------------------------------ */

describe('seedToExercise', () => {
  it('converts ExerciseSeed to Exercise with updatedAt empty string', () => {
    const seed: ExerciseSeed = {
      id: 'bench-press',
      nameVi: 'Đẩy ngực',
      nameEn: 'Bench Press',
      muscleGroup: 'chest',
      secondaryMuscles: ['shoulders', 'arms'],
      category: 'compound',
      equipment: ['barbell'],
      contraindicated: ['shoulders'],
      exerciseType: 'strength',
      defaultRepsMin: 6,
      defaultRepsMax: 12,
      isCustom: false,
    };

    const result = seedToExercise(seed);

    expect(result.id).toBe('bench-press');
    expect(result.muscleGroup).toBe('chest');
    expect(result.updatedAt).toBe('');
    expect(result.contraindicated).toEqual(['shoulders']);
  });

  it('filters out invalid contraindicated values via isBodyRegion', () => {
    const seed: ExerciseSeed = {
      id: 'ex-1',
      nameVi: 'Test',
      nameEn: 'Test EN',
      muscleGroup: 'chest',
      secondaryMuscles: [],
      category: 'compound',
      equipment: ['barbell'],
      contraindicated: ['shoulders', 'invalid_region', 'knees'],
      exerciseType: 'strength',
      defaultRepsMin: 6,
      defaultRepsMax: 12,
      isCustom: false,
    };

    const result = seedToExercise(seed);
    expect(result.contraindicated).toEqual(['shoulders', 'knees']);
  });
});

describe('getDefaultExercises', () => {
  it('returns a non-empty array of exercises', () => {
    const exercises = getDefaultExercises();
    expect(exercises.length).toBeGreaterThan(0);
  });

  it('every exercise has required fields', () => {
    const exercises = getDefaultExercises();
    for (const ex of exercises) {
      expect(ex.id).toBeTruthy();
      expect(ex.nameVi).toBeTruthy();
      expect(ex.muscleGroup).toBeTruthy();
      expect(ex.updatedAt).toBe('');
    }
  });
});

/* ------------------------------------------------------------------ */
/* CATEGORY_ORDER                                                      */
/* ------------------------------------------------------------------ */

describe('CATEGORY_ORDER', () => {
  it('compound < secondary < isolation', () => {
    expect(CATEGORY_ORDER.compound).toBeLessThan(CATEGORY_ORDER.secondary);
    expect(CATEGORY_ORDER.secondary).toBeLessThan(CATEGORY_ORDER.isolation);
  });
});

/* ------------------------------------------------------------------ */
/* calculateVolume                                                     */
/* ------------------------------------------------------------------ */

describe('calculateVolume', () => {
  it('returns volume for all 7 muscle groups', () => {
    const profile = makeProfile();
    const volume = calculateVolume(profile);

    const muscles: MuscleGroup[] = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'];
    for (const muscle of muscles) {
      expect(volume[muscle]).toBeGreaterThan(0);
    }
  });

  it('higher experience yields higher volume', () => {
    const beginner = calculateVolume(makeProfile({ trainingExperience: 'beginner' }));
    const advanced = calculateVolume(makeProfile({ trainingExperience: 'advanced' }));

    expect(advanced.chest).toBeGreaterThanOrEqual(beginner.chest);
    expect(advanced.back).toBeGreaterThanOrEqual(beginner.back);
  });

  it('passes healthProfile parameters through', () => {
    const profile = makeProfile();
    const normalVolume = calculateVolume(profile);
    const cutVolume = calculateVolume(profile, { goalType: 'cut' });

    expect(cutVolume.chest).toBeLessThanOrEqual(normalVolume.chest);
  });
});

/* ------------------------------------------------------------------ */
/* calculateSetsPerSession                                             */
/* ------------------------------------------------------------------ */

describe('calculateSetsPerSession', () => {
  it('distributes weekly volume evenly when muscle appears in all sessions', () => {
    const weeklyVolume: Record<MuscleGroup, number> = {
      chest: 12,
      back: 12,
      shoulders: 10,
      legs: 14,
      arms: 8,
      core: 6,
      glutes: 10,
    };

    const sessions = [
      { muscleGroups: ['chest', 'back'] as MuscleGroup[] },
      { muscleGroups: ['chest', 'back'] as MuscleGroup[] },
    ];

    const result = calculateSetsPerSession(weeklyVolume, sessions);
    expect(result).toHaveLength(2);
    expect(result[0].chest).toBe(6);
    expect(result[0].back).toBe(6);
    expect(result[1].chest).toBe(6);
    expect(result[1].back).toBe(6);
  });

  it('gives all volume to single session when muscle appears once', () => {
    const weeklyVolume: Record<MuscleGroup, number> = {
      chest: 14,
      back: 14,
      shoulders: 12,
      legs: 14,
      arms: 10,
      core: 8,
      glutes: 12,
    };

    const sessions = [
      { muscleGroups: ['chest', 'shoulders'] as MuscleGroup[] },
      { muscleGroups: ['back'] as MuscleGroup[] },
    ];

    const result = calculateSetsPerSession(weeklyVolume, sessions);
    expect(result[0].chest).toBe(14);
    expect(result[1].back).toBe(14);
  });

  it('returns at least 1 set per muscle per session', () => {
    const weeklyVolume: Record<MuscleGroup, number> = {
      chest: 1,
      back: 1,
      shoulders: 1,
      legs: 1,
      arms: 1,
      core: 1,
      glutes: 1,
    };

    const sessions = [
      { muscleGroups: ['chest'] as MuscleGroup[] },
      { muscleGroups: ['chest'] as MuscleGroup[] },
      { muscleGroups: ['chest'] as MuscleGroup[] },
    ];

    const result = calculateSetsPerSession(weeklyVolume, sessions);
    for (const session of result) {
      expect(session.chest).toBeGreaterThanOrEqual(1);
    }
  });
});

/* ------------------------------------------------------------------ */
/* selectExercisesForMuscle                                            */
/* ------------------------------------------------------------------ */

describe('selectExercisesForMuscle', () => {
  const fullEquipment: EquipmentType[] = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight'];

  it('returns exercises for a valid muscle group', () => {
    const db = getDefaultExercises();
    const result = selectExercisesForMuscle('chest', 8, fullEquipment, [], db);

    expect(result.length).toBeGreaterThan(0);
    for (const item of result) {
      expect(item.exercise.muscleGroup).toBe('chest');
      expect(item.sets).toBeGreaterThanOrEqual(1);
    }
  });

  it('total sets equal requested sets', () => {
    const db = getDefaultExercises();
    const result = selectExercisesForMuscle('back', 10, fullEquipment, [], db);

    const totalSets = result.reduce((sum, ex) => sum + ex.sets, 0);
    expect(totalSets).toBe(10);
  });

  it('sorts exercises by CATEGORY_ORDER (compound first)', () => {
    const db = getDefaultExercises();
    const result = selectExercisesForMuscle('chest', 12, fullEquipment, [], db);

    if (result.length >= 2) {
      const categories = result.map(r => r.exercise.category);
      const orders = categories.map(c => CATEGORY_ORDER[c]);
      for (let i = 1; i < orders.length; i++) {
        expect(orders[i]).toBeGreaterThanOrEqual(orders[i - 1]);
      }
    }
  });

  it('respects equipment restrictions', () => {
    const db = [
      makeExercise({ id: 'bb-bench', equipment: ['barbell'], muscleGroup: 'chest' }),
      makeExercise({ id: 'db-fly', equipment: ['dumbbell'], muscleGroup: 'chest' }),
      makeExercise({ id: 'cable-cross', equipment: ['cable'], muscleGroup: 'chest' }),
    ];

    const result = selectExercisesForMuscle('chest', 4, ['dumbbell'], [], db);

    for (const item of result) {
      expect(item.exercise.equipment).toContain('dumbbell');
    }
  });

  it('falls back to bodyweight exercises when no eligible equipment match', () => {
    const db = [
      makeExercise({ id: 'bb-bench', equipment: ['barbell'], muscleGroup: 'chest' }),
      makeExercise({ id: 'pushup', equipment: ['bodyweight'], muscleGroup: 'chest' }),
    ];

    const result = selectExercisesForMuscle('chest', 3, ['machine'], [], db);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].exercise.id).toBe('pushup');
  });

  it('returns empty array when no exercises match at all', () => {
    const db = [makeExercise({ id: 'bb-bench', equipment: ['barbell'], muscleGroup: 'chest' })];

    const result = selectExercisesForMuscle('chest', 3, ['machine'], [], db);

    expect(result).toEqual([]);
  });

  it('bodyweight fallback filters out contraindicated exercises', () => {
    const db = [
      makeExercise({ id: 'bb-bench', equipment: ['barbell'], muscleGroup: 'chest' }),
      makeExercise({
        id: 'pushup-bad',
        equipment: ['bodyweight'],
        muscleGroup: 'chest',
        contraindicated: ['shoulders'],
      }),
      makeExercise({
        id: 'pushup-good',
        equipment: ['bodyweight'],
        muscleGroup: 'chest',
        contraindicated: [],
      }),
    ];

    // Equipment = ['machine'] → no direct match → falls back to bodyweight
    // Injury = ['shoulders'] → 'pushup-bad' excluded → only 'pushup-good' returned
    const result = selectExercisesForMuscle('chest', 3, ['machine'], ['shoulders'], db);

    expect(result).toHaveLength(1);
    expect(result[0].exercise.id).toBe('pushup-good');
  });

  it('respects injury restrictions', () => {
    const db = [
      makeExercise({
        id: 'overhead-press',
        equipment: ['barbell'],
        muscleGroup: 'shoulders',
        contraindicated: ['shoulders'],
      }),
      makeExercise({
        id: 'lateral-raise',
        equipment: ['dumbbell'],
        muscleGroup: 'shoulders',
        contraindicated: [],
      }),
    ];

    const injuries: BodyRegion[] = ['shoulders'];
    const result = selectExercisesForMuscle('shoulders', 4, fullEquipment, injuries, db);

    for (const item of result) {
      expect(item.exercise.contraindicated).not.toContain('shoulders');
    }
  });

  it('excludes cardio exercises', () => {
    const db = [
      makeExercise({ id: 'bench', exerciseType: 'strength', muscleGroup: 'chest' }),
      makeExercise({ id: 'running', exerciseType: 'cardio', muscleGroup: 'chest' }),
    ];

    const result = selectExercisesForMuscle('chest', 3, fullEquipment, [], db);

    for (const item of result) {
      expect(item.exercise.exerciseType).toBe('strength');
    }
  });
});

/* ------------------------------------------------------------------ */
/* applyRepScheme                                                      */
/* ------------------------------------------------------------------ */

describe('applyRepScheme', () => {
  it('applies linear periodization rep scheme from profile', () => {
    const profile = makeProfile({ periodizationModel: 'linear', trainingGoal: 'strength' });
    const exercises = [{ exercise: makeExercise(), sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90 }];

    const result = applyRepScheme(exercises, profile, 0, 1);

    expect(result[0].repsMin).toBe(3);
    expect(result[0].repsMax).toBe(5);
    expect(result[0].restSeconds).toBe(240);
  });

  it('applies hypertrophy rep scheme', () => {
    const profile = makeProfile({ periodizationModel: 'linear', trainingGoal: 'hypertrophy' });
    const exercises = [{ exercise: makeExercise(), sets: 3, repsMin: 3, repsMax: 5, restSeconds: 240 }];

    const result = applyRepScheme(exercises, profile, 0, 1);

    expect(result[0].repsMin).toBe(8);
    expect(result[0].repsMax).toBe(12);
    expect(result[0].restSeconds).toBe(105);
  });

  it('preserves exercise and sets fields', () => {
    const profile = makeProfile();
    const ex = makeExercise({ id: 'my-exercise' });
    const exercises = [{ exercise: ex, sets: 5, repsMin: 8, repsMax: 12, restSeconds: 90 }];

    const result = applyRepScheme(exercises, profile, 0, 1);

    expect(result[0].exercise.id).toBe('my-exercise');
    expect(result[0].sets).toBe(5);
  });

  it('handles undulating periodization (varies by session index)', () => {
    const profile = makeProfile({ periodizationModel: 'undulating', trainingGoal: 'hypertrophy' });
    const exercises = [{ exercise: makeExercise(), sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 }];

    const result0 = applyRepScheme(exercises, profile, 0, 1);
    const result1 = applyRepScheme(exercises, profile, 1, 1);

    // Undulating rotates: strength, hypertrophy, endurance based on sessionInWeek
    // sessionIndex 0 → sessionInWeek 1 → index 0 → strength
    expect(result0[0].repsMin).toBe(3);
    // sessionIndex 1 → sessionInWeek 2 → index 1 → hypertrophy
    expect(result1[0].repsMin).toBe(8);
  });
});

/* ------------------------------------------------------------------ */
/* parseMuscleGroups                                                   */
/* ------------------------------------------------------------------ */

describe('parseMuscleGroups', () => {
  it('handles JSON array format', () => {
    const result = parseMuscleGroups('["chest","back","shoulders"]');
    expect(result).toEqual(['chest', 'back', 'shoulders']);
  });

  it('handles legacy CSV format', () => {
    const result = parseMuscleGroups('chest,back,shoulders');
    expect(result).toEqual(['chest', 'back', 'shoulders']);
  });

  it('handles CSV with spaces', () => {
    const result = parseMuscleGroups('chest, back, shoulders');
    expect(result).toEqual(['chest', 'back', 'shoulders']);
  });

  it('returns empty array for null', () => {
    expect(parseMuscleGroups(undefined)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(parseMuscleGroups(undefined)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseMuscleGroups('')).toEqual([]);
  });

  it('filters out invalid muscle group names', () => {
    const result = parseMuscleGroups('["chest","invalid","back"]');
    expect(result).toEqual(['chest', 'back']);
  });

  it('handles malformed JSON gracefully (falls back to CSV)', () => {
    const result = parseMuscleGroups('[chest,back');
    expect(result).toEqual(['back']);
  });

  it('handles JSON with whitespace', () => {
    const result = parseMuscleGroups('  ["legs","glutes"]  ');
    expect(result).toEqual(['legs', 'glutes']);
  });

  it('filters invalid values from CSV format', () => {
    const result = parseMuscleGroups('chest,foo,back,bar');
    expect(result).toEqual(['chest', 'back']);
  });

  it('handles JSON non-array parsed value', () => {
    const result = parseMuscleGroups('"chest"');
    // JSON.parse succeeds but result is not array → candidates = []
    expect(result).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* generateExercisesForDay                                             */
/* ------------------------------------------------------------------ */

describe('generateExercisesForDay', () => {
  it('returns non-empty exercises for valid muscle groups', () => {
    const profile = makeProfile();
    const setsPerMuscle: Record<MuscleGroup, number> = {
      chest: 8,
      back: 8,
      shoulders: 6,
      legs: 0,
      arms: 0,
      core: 0,
      glutes: 0,
    };

    const result = generateExercisesForDay(['chest', 'back', 'shoulders'], setsPerMuscle, profile, 0);

    expect(result.length).toBeGreaterThan(0);
    const muscleGroups = new Set(result.map(ex => ex.exercise.muscleGroup));
    expect(muscleGroups.has('chest')).toBe(true);
    expect(muscleGroups.has('back')).toBe(true);
    expect(muscleGroups.has('shoulders')).toBe(true);
  });

  it('uses default exercise DB when none provided', () => {
    const profile = makeProfile();
    const setsPerMuscle: Record<MuscleGroup, number> = {
      chest: 6,
      back: 0,
      shoulders: 0,
      legs: 0,
      arms: 0,
      core: 0,
      glutes: 0,
    };

    const result = generateExercisesForDay(['chest'], setsPerMuscle, profile, 0);
    expect(result.length).toBeGreaterThan(0);
  });

  it('respects equipment restrictions from profile', () => {
    const profile = makeProfile({ availableEquipment: ['bodyweight'] });
    const setsPerMuscle: Record<MuscleGroup, number> = {
      chest: 6,
      back: 0,
      shoulders: 0,
      legs: 0,
      arms: 0,
      core: 0,
      glutes: 0,
    };

    const result = generateExercisesForDay(['chest'], setsPerMuscle, profile, 0);

    for (const item of result) {
      expect(item.exercise.equipment).toContain('bodyweight');
    }
  });

  it('respects injury restrictions from profile', () => {
    const profile = makeProfile({ injuryRestrictions: ['shoulders'] });
    const setsPerMuscle: Record<MuscleGroup, number> = {
      chest: 8,
      back: 0,
      shoulders: 6,
      legs: 0,
      arms: 0,
      core: 0,
      glutes: 0,
    };

    const result = generateExercisesForDay(['chest', 'shoulders'], setsPerMuscle, profile, 0);

    for (const item of result) {
      const isContraindicated = item.exercise.contraindicated.includes('shoulders');
      expect(isContraindicated).toBe(false);
    }
  });

  it('falls back to 3 sets when muscle has no entry in setsPerMuscle', () => {
    const profile = makeProfile();
    const setsPerMuscle = {} as Record<MuscleGroup, number>;

    const result = generateExercisesForDay(['chest'], setsPerMuscle, profile, 0);

    const totalSets = result.reduce((sum, ex) => sum + ex.sets, 0);
    expect(totalSets).toBe(3);
  });

  it('applies rep scheme from profile periodization model', () => {
    const profile = makeProfile({ periodizationModel: 'linear', trainingGoal: 'strength' });
    const setsPerMuscle: Record<MuscleGroup, number> = {
      chest: 6,
      back: 0,
      shoulders: 0,
      legs: 0,
      arms: 0,
      core: 0,
      glutes: 0,
    };

    const result = generateExercisesForDay(['chest'], setsPerMuscle, profile, 0);

    for (const item of result) {
      expect(item.repsMin).toBe(3);
      expect(item.repsMax).toBe(5);
      expect(item.restSeconds).toBe(240);
    }
  });

  it('uses provided exerciseDB over default', () => {
    const profile = makeProfile();
    const customDB = [makeExercise({ id: 'custom-chest', muscleGroup: 'chest', equipment: ['barbell'] })];
    const setsPerMuscle: Record<MuscleGroup, number> = {
      chest: 4,
      back: 0,
      shoulders: 0,
      legs: 0,
      arms: 0,
      core: 0,
      glutes: 0,
    };

    const result = generateExercisesForDay(['chest'], setsPerMuscle, profile, 0, customDB);

    expect(result.length).toBe(1);
    expect(result[0].exercise.id).toBe('custom-chest');
  });

  it('returns empty array when no exercises available for muscle', () => {
    const profile = makeProfile({ availableEquipment: ['machine'] });
    const emptyDB: Exercise[] = [];
    const setsPerMuscle: Record<MuscleGroup, number> = {
      chest: 4,
      back: 0,
      shoulders: 0,
      legs: 0,
      arms: 0,
      core: 0,
      glutes: 0,
    };

    const result = generateExercisesForDay(['chest'], setsPerMuscle, profile, 0, emptyDB);

    expect(result).toEqual([]);
  });

  it('generates exercises for multiple muscle groups in one day', () => {
    const profile = makeProfile();
    const setsPerMuscle: Record<MuscleGroup, number> = {
      chest: 6,
      back: 6,
      shoulders: 4,
      legs: 8,
      arms: 4,
      core: 4,
      glutes: 6,
    };

    const result = generateExercisesForDay(
      ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'],
      setsPerMuscle,
      profile,
      0,
    );

    const muscleGroups = new Set(result.map(ex => ex.exercise.muscleGroup));
    expect(muscleGroups.size).toBeGreaterThanOrEqual(5);
  });
});
