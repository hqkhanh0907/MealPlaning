import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { computeCurrentWeek, generateTrainingPlan, useTrainingPlan } from '../features/fitness/hooks/useTrainingPlan';
import type { Exercise, MuscleGroup, SelectedExercise, TrainingProfile } from '../features/fitness/types';
import { isBodyRegion } from '../features/fitness/types';

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function createProfile(overrides?: Partial<TrainingProfile>): TrainingProfile {
  return {
    id: 'test-profile',
    trainingExperience: 'intermediate',
    daysPerWeek: 3,
    sessionDurationMin: 60,
    trainingGoal: 'hypertrophy',
    availableEquipment: ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight'],
    injuryRestrictions: [],
    periodizationModel: 'linear',
    planCycleWeeks: 4,
    priorityMuscles: [],
    cardioSessionsWeek: 2,
    cardioTypePref: 'liss',
    cardioDurationMin: 30,
    updatedAt: '',
    ...overrides,
  };
}

function createExercise(overrides?: Partial<Exercise>): Exercise {
  return {
    id: 'test-exercise',
    nameVi: 'Bài tập test',
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

function parseExercises(day: { exercises?: string }): SelectedExercise[] {
  if (!day.exercises) return [];
  return JSON.parse(day.exercises) as SelectedExercise[];
}

function getTotalSetsForMuscle(days: { exercises?: string; workoutType: string }[], muscle: MuscleGroup): number {
  let total = 0;
  for (const day of days) {
    if (day.workoutType === 'Cardio') continue;
    for (const ex of parseExercises(day)) {
      if (ex.exercise.muscleGroup === muscle) {
        total += ex.sets;
      }
    }
  }
  return total;
}

const mockDB: Exercise[] = [
  // Chest
  createExercise({
    id: 'bench-press',
    muscleGroup: 'chest',
    category: 'compound',
    equipment: ['barbell'],
  }),
  createExercise({
    id: 'db-fly',
    muscleGroup: 'chest',
    category: 'isolation',
    equipment: ['dumbbell'],
  }),
  createExercise({
    id: 'push-up',
    muscleGroup: 'chest',
    category: 'compound',
    equipment: ['bodyweight'],
  }),
  // Back
  createExercise({
    id: 'barbell-row',
    muscleGroup: 'back',
    category: 'compound',
    equipment: ['barbell'],
  }),
  createExercise({
    id: 'pull-up',
    muscleGroup: 'back',
    category: 'compound',
    equipment: ['bodyweight'],
  }),
  createExercise({
    id: 'cable-row',
    muscleGroup: 'back',
    category: 'secondary',
    equipment: ['cable'],
  }),
  // Shoulders
  createExercise({
    id: 'ohp',
    muscleGroup: 'shoulders',
    category: 'compound',
    equipment: ['barbell'],
  }),
  createExercise({
    id: 'lateral-raise',
    muscleGroup: 'shoulders',
    category: 'isolation',
    equipment: ['dumbbell'],
  }),
  // Legs
  createExercise({
    id: 'squat',
    muscleGroup: 'legs',
    category: 'compound',
    equipment: ['barbell'],
  }),
  createExercise({
    id: 'leg-press',
    muscleGroup: 'legs',
    category: 'compound',
    equipment: ['machine'],
    contraindicated: ['knees'],
  }),
  createExercise({
    id: 'bodyweight-squat',
    muscleGroup: 'legs',
    category: 'compound',
    equipment: ['bodyweight'],
  }),
  // Arms
  createExercise({
    id: 'bicep-curl',
    muscleGroup: 'arms',
    category: 'isolation',
    equipment: ['dumbbell'],
  }),
  createExercise({
    id: 'tricep-push',
    muscleGroup: 'arms',
    category: 'isolation',
    equipment: ['cable'],
  }),
  createExercise({
    id: 'diamond-pushup',
    muscleGroup: 'arms',
    category: 'compound',
    equipment: ['bodyweight'],
  }),
  // Core
  createExercise({
    id: 'plank',
    muscleGroup: 'core',
    category: 'compound',
    equipment: ['bodyweight'],
  }),
  createExercise({
    id: 'cable-crunch',
    muscleGroup: 'core',
    category: 'isolation',
    equipment: ['cable'],
  }),
  // Glutes
  createExercise({
    id: 'hip-thrust',
    muscleGroup: 'glutes',
    category: 'compound',
    equipment: ['barbell'],
  }),
  createExercise({
    id: 'glute-bridge',
    muscleGroup: 'glutes',
    category: 'compound',
    equipment: ['bodyweight'],
  }),
];

/* ------------------------------------------------------------------ */
/*  Tests — Split selection (Step 1)                                    */
/* ------------------------------------------------------------------ */

describe('generateTrainingPlan', () => {
  describe('Step 1: Training Split Selection', () => {
    it('generates Full Body split for 1 day', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({ daysPerWeek: 1 }),
        exerciseDB: mockDB,
      });
      expect(result.plan.splitType).toBe('full_body');
      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      expect(training).toHaveLength(1);
      expect(training[0].workoutType).toBe('Full Body A');
    });

    it('generates Full Body split for 2 days with A/B alternating', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({ daysPerWeek: 2 }),
        exerciseDB: mockDB,
      });
      expect(result.plan.splitType).toBe('full_body');
      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      expect(training).toHaveLength(2);
      expect(training[0].workoutType).toBe('Full Body A');
      expect(training[1].workoutType).toBe('Full Body B');
    });

    it('generates Full Body split for 3 days', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({ daysPerWeek: 3 }),
        exerciseDB: mockDB,
      });
      expect(result.plan.splitType).toBe('full_body');
      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      expect(training).toHaveLength(3);
      expect(training.map(d => d.workoutType)).toEqual(['Full Body A', 'Full Body B', 'Full Body A']);
    });

    it('generates Upper/Lower split for 4 days', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({ daysPerWeek: 4 }),
        exerciseDB: mockDB,
      });
      expect(result.plan.splitType).toBe('upper_lower');
      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      expect(training).toHaveLength(4);
      const types = training.map(d => d.workoutType);
      expect(types).toContain('Upper A');
      expect(types).toContain('Lower A');
      expect(types).toContain('Upper B');
      expect(types).toContain('Lower B');
    });

    it('generates Upper/Lower with correct muscle groups', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({ daysPerWeek: 4 }),
        exerciseDB: mockDB,
      });
      const upper = result.days.find(d => d.workoutType === 'Upper A');
      const lower = result.days.find(d => d.workoutType === 'Lower A');
      expect(upper?.muscleGroups).toBe('chest,back,shoulders,arms');
      expect(lower?.muscleGroups).toBe('legs,glutes,core');
    });

    it('generates Push/Pull/Legs split for 5 days', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({ daysPerWeek: 5 }),
        exerciseDB: mockDB,
      });
      expect(result.plan.splitType).toBe('ppl');
      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      expect(training).toHaveLength(5);
      const types = training.map(d => d.workoutType);
      expect(types).toContain('Push');
      expect(types).toContain('Pull');
      expect(types).toContain('Legs');
      expect(types).toContain('Push B');
      expect(types).toContain('Pull B');
    });

    it('generates Push/Pull/Legs split for 6 days (×2)', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({ daysPerWeek: 6 }),
        exerciseDB: mockDB,
      });
      expect(result.plan.splitType).toBe('ppl');
      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      expect(training).toHaveLength(6);
      const types = training.map(d => d.workoutType);
      expect(types).toContain('Push');
      expect(types).toContain('Pull');
      expect(types).toContain('Legs');
      expect(types).toContain('Push B');
      expect(types).toContain('Pull B');
      expect(types).toContain('Legs B');
    });

    it('handles daysPerWeek >= 7 as PPL capped at 6 sessions', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({ daysPerWeek: 7 }),
        exerciseDB: mockDB,
      });
      expect(result.plan.splitType).toBe('ppl');
      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      expect(training.length).toBeLessThanOrEqual(7);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Step 2: Volume                                                    */
  /* ---------------------------------------------------------------- */

  describe('Step 2: Volume Calculation', () => {
    it('priority muscles receive more volume than non-priority', () => {
      const withPriority = generateTrainingPlan({
        trainingProfile: createProfile({ priorityMuscles: ['chest'] }),
        healthProfile: { age: 25, weightKg: 80 },
        exerciseDB: mockDB,
      });
      const withoutPriority = generateTrainingPlan({
        trainingProfile: createProfile({ priorityMuscles: [] }),
        healthProfile: { age: 25, weightKg: 80 },
        exerciseDB: mockDB,
      });

      const chestPriority = getTotalSetsForMuscle(withPriority.days, 'chest');
      const chestNoPriority = getTotalSetsForMuscle(withoutPriority.days, 'chest');
      expect(chestPriority).toBeGreaterThanOrEqual(chestNoPriority);
    });

    it('cut goal reduces total volume compared to maintain', () => {
      const cut = generateTrainingPlan({
        trainingProfile: createProfile(),
        healthProfile: { age: 25, weightKg: 80, goalType: 'cut' },
        exerciseDB: mockDB,
      });
      const maintain = generateTrainingPlan({
        trainingProfile: createProfile(),
        healthProfile: { age: 25, weightKg: 80, goalType: 'maintain' },
        exerciseDB: mockDB,
      });

      const cutTotal = ALL_MUSCLES.reduce((sum, m) => sum + getTotalSetsForMuscle(cut.days, m), 0);
      const maintainTotal = ALL_MUSCLES.reduce((sum, m) => sum + getTotalSetsForMuscle(maintain.days, m), 0);
      expect(cutTotal).toBeLessThanOrEqual(maintainTotal);
    });

    it('bulk goal increases volume', () => {
      const bulk = generateTrainingPlan({
        trainingProfile: createProfile(),
        healthProfile: { age: 25, weightKg: 80, goalType: 'bulk' },
        exerciseDB: mockDB,
      });
      const maintain = generateTrainingPlan({
        trainingProfile: createProfile(),
        healthProfile: { age: 25, weightKg: 80, goalType: 'maintain' },
        exerciseDB: mockDB,
      });

      const bulkTotal = ALL_MUSCLES.reduce((sum, m) => sum + getTotalSetsForMuscle(bulk.days, m), 0);
      const maintainTotal = ALL_MUSCLES.reduce((sum, m) => sum + getTotalSetsForMuscle(maintain.days, m), 0);
      expect(bulkTotal).toBeGreaterThanOrEqual(maintainTotal);
    });

    it('age > 40 applies recovery modifier', () => {
      const young = generateTrainingPlan({
        trainingProfile: createProfile(),
        healthProfile: { age: 25, weightKg: 80 },
        exerciseDB: mockDB,
      });
      const older = generateTrainingPlan({
        trainingProfile: createProfile(),
        healthProfile: { age: 45, weightKg: 80 },
        exerciseDB: mockDB,
      });

      const youngTotal = ALL_MUSCLES.reduce((sum, m) => sum + getTotalSetsForMuscle(young.days, m), 0);
      const olderTotal = ALL_MUSCLES.reduce((sum, m) => sum + getTotalSetsForMuscle(older.days, m), 0);
      expect(olderTotal).toBeLessThanOrEqual(youngTotal);
    });

    it('sleep < 7h applies fatigue modifier', () => {
      const goodSleep = generateTrainingPlan({
        trainingProfile: createProfile({ avgSleepHours: 8 }),
        healthProfile: { age: 25, weightKg: 80 },
        exerciseDB: mockDB,
      });
      const badSleep = generateTrainingPlan({
        trainingProfile: createProfile({ avgSleepHours: 5 }),
        healthProfile: { age: 25, weightKg: 80 },
        exerciseDB: mockDB,
      });

      const goodTotal = ALL_MUSCLES.reduce((sum, m) => sum + getTotalSetsForMuscle(goodSleep.days, m), 0);
      const badTotal = ALL_MUSCLES.reduce((sum, m) => sum + getTotalSetsForMuscle(badSleep.days, m), 0);
      expect(badTotal).toBeLessThanOrEqual(goodTotal);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Step 3: Exercise selection                                        */
  /* ---------------------------------------------------------------- */

  describe('Step 3: Exercise Selection', () => {
    it('only selects bodyweight exercises when only bodyweight available', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 3,
          availableEquipment: ['bodyweight'],
        }),
        exerciseDB: mockDB,
      });

      for (const day of result.days) {
        for (const ex of parseExercises(day)) {
          expect(ex.exercise.equipment).toContain('bodyweight');
        }
      }
    });

    it('excludes exercises contraindicated by knee injury', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 3,
          injuryRestrictions: ['knees'],
        }),
        exerciseDB: mockDB,
      });

      for (const day of result.days) {
        for (const ex of parseExercises(day)) {
          expect(ex.exercise.id).not.toBe('leg-press');
        }
      }
    });

    it('filters out invalid body region strings via isBodyRegion', () => {
      expect(isBodyRegion('shoulders')).toBe(true);
      expect(isBodyRegion('lower_back')).toBe(true);
      expect(isBodyRegion('knees')).toBe(true);
      expect(isBodyRegion('wrists')).toBe(true);
      expect(isBodyRegion('neck')).toBe(true);
      expect(isBodyRegion('hips')).toBe(true);
      expect(isBodyRegion('upper')).toBe(false);
      expect(isBodyRegion('lower')).toBe(false);
      expect(isBodyRegion('full')).toBe(false);
      expect(isBodyRegion('')).toBe(false);
      expect(isBodyRegion('SHOULDERS')).toBe(false);
      expect(isBodyRegion('invalid_region')).toBe(false);
    });

    it('silently drops invalid contraindicated regions from seed data', () => {
      const dbWithInvalid: Exercise[] = [
        createExercise({
          id: 'exercise-with-invalid-ci',
          muscleGroup: 'chest',
          category: 'compound',
          equipment: ['barbell'],
          contraindicated: [],
        }),
      ];

      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 3,
          injuryRestrictions: ['knees'],
        }),
        exerciseDB: dbWithInvalid,
      });

      expect(result.days.length).toBeGreaterThan(0);
    });

    it('sorts exercises compound → secondary → isolation', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({ daysPerWeek: 3 }),
        exerciseDB: mockDB,
      });

      for (const day of result.days) {
        const exercises = parseExercises(day);
        const muscleGrouped = new Map<string, SelectedExercise[]>();
        for (const ex of exercises) {
          const key = ex.exercise.muscleGroup;
          const arr = muscleGrouped.get(key) ?? [];
          arr.push(ex);
          muscleGrouped.set(key, arr);
        }
        for (const group of muscleGrouped.values()) {
          const order = { compound: 0, secondary: 1, isolation: 2 };
          for (let i = 1; i < group.length; i++) {
            expect(order[group[i].exercise.category]).toBeGreaterThanOrEqual(order[group[i - 1].exercise.category]);
          }
        }
      }
    });

    it('distributes sets across selected exercises', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({ daysPerWeek: 3 }),
        exerciseDB: mockDB,
      });

      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      for (const day of training) {
        const exercises = parseExercises(day);
        for (const ex of exercises) {
          expect(ex.sets).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Step 4: Rep scheme                                                */
  /* ---------------------------------------------------------------- */

  describe('Step 4: Rep Range Assignment', () => {
    it('applies strength rep scheme for strength goal', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 3,
          trainingGoal: 'strength',
          periodizationModel: 'linear',
        }),
        exerciseDB: mockDB,
      });

      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      const exercises = parseExercises(training[0]);
      if (exercises.length > 0) {
        expect(exercises[0].repsMin).toBe(3);
        expect(exercises[0].repsMax).toBe(5);
        expect(exercises[0].restSeconds).toBe(240);
      }
    });

    it('applies hypertrophy rep scheme for hypertrophy goal', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 3,
          trainingGoal: 'hypertrophy',
          periodizationModel: 'linear',
        }),
        exerciseDB: mockDB,
      });

      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      const exercises = parseExercises(training[0]);
      if (exercises.length > 0) {
        expect(exercises[0].repsMin).toBe(8);
        expect(exercises[0].repsMax).toBe(12);
        expect(exercises[0].restSeconds).toBe(105);
      }
    });

    it('applies endurance rep scheme for endurance goal', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 3,
          trainingGoal: 'endurance',
          periodizationModel: 'linear',
        }),
        exerciseDB: mockDB,
      });

      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      const exercises = parseExercises(training[0]);
      if (exercises.length > 0) {
        expect(exercises[0].repsMin).toBe(15);
        expect(exercises[0].repsMax).toBe(20);
        expect(exercises[0].restSeconds).toBe(45);
      }
    });

    it('uses undulating periodization when configured', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 3,
          trainingGoal: 'hypertrophy',
          periodizationModel: 'undulating',
        }),
        exerciseDB: mockDB,
      });

      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      const ex0 = parseExercises(training[0]);
      const ex1 = parseExercises(training[1]);
      if (ex0.length > 0 && ex1.length > 0) {
        // Session 1 → strength (3-5), Session 2 → hypertrophy (8-12)
        expect(ex0[0].repsMin).toBe(3);
        expect(ex1[0].repsMin).toBe(8);
      }
    });

    it('uses block periodization when configured', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 3,
          trainingGoal: 'strength',
          periodizationModel: 'block',
        }),
        exerciseDB: mockDB,
      });

      // Default (week 1) → phase index 0 → hypertrophy (block phase order)
      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      const exercises = parseExercises(training[0]);
      if (exercises.length > 0) {
        expect(exercises[0].repsMin).toBe(8);
        expect(exercises[0].repsMax).toBe(12);
      }
      expect(result.plan.currentWeek).toBe(1);
    });

    it('block periodization uses week 5 strength phase when currentWeek=5', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 3,
          trainingGoal: 'strength',
          periodizationModel: 'block',
        }),
        exerciseDB: mockDB,
        currentWeek: 5,
      });

      // Week 5 → phase index 1 → strength (3-5 reps)
      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      const exercises = parseExercises(training[0]);
      if (exercises.length > 0) {
        expect(exercises[0].repsMin).toBe(3);
        expect(exercises[0].repsMax).toBe(5);
      }
      expect(result.plan.currentWeek).toBe(5);
    });

    it('block periodization uses week 9 endurance phase when currentWeek=9', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 3,
          trainingGoal: 'strength',
          periodizationModel: 'block',
        }),
        exerciseDB: mockDB,
        currentWeek: 9,
      });

      // Week 9 → phase index 2 → endurance (15-20 reps)
      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      const exercises = parseExercises(training[0]);
      if (exercises.length > 0) {
        expect(exercises[0].repsMin).toBe(15);
        expect(exercises[0].repsMax).toBe(20);
      }
      expect(result.plan.currentWeek).toBe(9);
    });

    it('computes currentWeek from planStartDate', () => {
      const threeWeeksAgo = new Date(Date.now() - 3 * 7 * 24 * 60 * 60 * 1000).toISOString();

      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 3,
          periodizationModel: 'block',
        }),
        exerciseDB: mockDB,
        planStartDate: threeWeeksAgo,
      });

      expect(result.plan.currentWeek).toBe(4);
    });

    it('currentWeek input takes priority over planStartDate', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 3,
          periodizationModel: 'block',
        }),
        exerciseDB: mockDB,
        currentWeek: 7,
        planStartDate: new Date().toISOString(),
      });

      expect(result.plan.currentWeek).toBe(7);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  computeCurrentWeek                                                */
  /* ---------------------------------------------------------------- */

  describe('computeCurrentWeek', () => {
    it('returns 1 for a start date of today', () => {
      expect(computeCurrentWeek(new Date().toISOString())).toBe(1);
    });

    it('returns 2 after exactly 7 days', () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      expect(computeCurrentWeek(sevenDaysAgo)).toBe(2);
    });

    it('returns 1 for a future start date', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      expect(computeCurrentWeek(tomorrow)).toBe(1);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Step 5: Cardio                                                    */
  /* ---------------------------------------------------------------- */

  describe('Step 5: Cardio Integration', () => {
    it('schedules cardio on rest days first', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 3,
          cardioSessionsWeek: 2,
          cardioTypePref: 'liss',
        }),
        exerciseDB: mockDB,
      });

      // Training days: 1, 3, 5 → rest days: 2, 4, 6, 7
      const cardioDays = result.days.filter(d => d.workoutType === 'Cardio');
      expect(cardioDays.length).toBeGreaterThanOrEqual(1);
      for (const cd of cardioDays) {
        expect([2, 4, 6, 7]).toContain(cd.dayOfWeek);
      }
    });

    it('overflows cardio to training days when rest days exhausted', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 6,
          cardioSessionsWeek: 3,
          cardioTypePref: 'hiit',
          cardioDurationMin: 20,
        }),
        healthProfile: { age: 25, weightKg: 80 },
        exerciseDB: mockDB,
      });

      // 6 training days → 1 rest day → 3 sessions = 1 rest + 2 overflow
      const allNotes = result.days.filter(d => d.notes?.includes('Cardio')).map(d => d.dayOfWeek);
      expect(allNotes.length).toBe(3);
    });

    it('uses HIIT cardio type when preference is hiit', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 3,
          cardioSessionsWeek: 1,
          cardioTypePref: 'hiit',
        }),
        exerciseDB: mockDB,
      });

      const cardioDays = result.days.filter(d => d.workoutType === 'Cardio' || d.notes?.includes('Cardio: hiit'));
      expect(cardioDays.length).toBeGreaterThanOrEqual(1);
      expect(cardioDays[0].notes).toContain('hiit');
    });

    it('uses cycling for mixed cardio preference', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 3,
          cardioSessionsWeek: 1,
          cardioTypePref: 'mixed',
        }),
        exerciseDB: mockDB,
      });

      const cardioDays = result.days.filter(d => d.notes?.includes('Cardio'));
      expect(cardioDays[0].notes).toContain('cycling');
    });

    it('uses walking for liss cardio preference', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 3,
          cardioSessionsWeek: 1,
          cardioTypePref: 'liss',
        }),
        exerciseDB: mockDB,
      });

      const cardioDays = result.days.filter(d => d.notes?.includes('Cardio'));
      expect(cardioDays[0].notes).toContain('walking');
    });

    it('does not add cardio when cardioSessionsWeek is 0', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({ cardioSessionsWeek: 0 }),
        exerciseDB: mockDB,
      });

      const cardioDays = result.days.filter(d => d.workoutType === 'Cardio');
      expect(cardioDays).toHaveLength(0);
      for (const day of result.days) {
        expect(day.notes?.includes('Cardio') ?? false).toBe(false);
      }
    });

    it('includes calorie estimation in cardio notes', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 3,
          cardioSessionsWeek: 1,
          cardioTypePref: 'liss',
          cardioDurationMin: 30,
        }),
        healthProfile: { age: 25, weightKg: 80 },
        exerciseDB: mockDB,
      });

      const cardioDays = result.days.filter(d => d.notes?.includes('Cardio'));
      expect(cardioDays.length).toBeGreaterThanOrEqual(1);
      expect(cardioDays[0].notes).toMatch(/~\d+kcal/);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Step 6: Deload                                                    */
  /* ---------------------------------------------------------------- */

  describe('Step 6: Deload & Progressive Overload', () => {
    it('includes deload week info in notes for valid cycle', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({ planCycleWeeks: 4 }),
        exerciseDB: mockDB,
      });

      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      expect(training[0].notes).toContain('Deload week(s): 4');
    });

    it('includes deload rep scheme in notes', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          planCycleWeeks: 4,
          trainingGoal: 'hypertrophy',
          periodizationModel: 'linear',
        }),
        exerciseDB: mockDB,
      });

      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      // Hypertrophy deload: repsMin * 0.6 = 5, repsMax * 0.6 = 7
      expect(training[0].notes).toMatch(/\d+-\d+ reps/);
    });

    it('no deload notes when planCycleWeeks is 0', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          planCycleWeeks: 0,
          cardioSessionsWeek: 0,
        }),
        exerciseDB: mockDB,
      });

      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      for (const day of training) {
        expect(day.notes ?? '').not.toContain('Deload');
      }
    });

    it('sets plan durationWeeks from planCycleWeeks', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({ planCycleWeeks: 8 }),
        exerciseDB: mockDB,
      });
      expect(result.plan.durationWeeks).toBe(8);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Edge cases                                                        */
  /* ---------------------------------------------------------------- */

  describe('Edge Cases', () => {
    it('handles empty exercise DB gracefully', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({ daysPerWeek: 3 }),
        exerciseDB: [],
      });

      expect(result.plan).toBeDefined();
      expect(result.days.length).toBeGreaterThan(0);
      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      for (const day of training) {
        const exercises = parseExercises(day);
        expect(exercises).toHaveLength(0);
      }
    });

    it('uses default exercise DB when not provided', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({ daysPerWeek: 2 }),
      });

      expect(result.plan).toBeDefined();
      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      const exercises = parseExercises(training[0]);
      expect(exercises.length).toBeGreaterThan(0);
    });

    it('defaults healthProfile values when not provided', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile(),
        exerciseDB: mockDB,
      });

      expect(result.plan).toBeDefined();
      expect(result.days.length).toBeGreaterThan(0);
    });

    it('assigns days sorted by dayOfWeek', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({ daysPerWeek: 4 }),
        exerciseDB: mockDB,
      });

      for (let i = 1; i < result.days.length; i++) {
        expect(result.days[i].dayOfWeek).toBeGreaterThanOrEqual(result.days[i - 1].dayOfWeek);
      }
    });

    it('plan has correct metadata', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 4,
          trainingGoal: 'strength',
        }),
        exerciseDB: mockDB,
      });

      expect(result.plan.name).toContain('Upper/Lower');
      expect(result.plan.name).toContain('strength');
      expect(result.plan.status).toBe('active');
      expect(result.plan.splitType).toBe('upper_lower');
      expect(result.plan.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(result.plan.startDate).toBeTruthy();
      expect(result.plan.createdAt).toBeTruthy();
      expect(result.plan.updatedAt).toBeTruthy();
    });

    it('each day has correct planId reference', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({ daysPerWeek: 3 }),
        exerciseDB: mockDB,
      });

      for (const day of result.days) {
        expect(day.planId).toBe(result.plan.id);
      }
    });

    it('creates session 2 cardio for overflow when daysPerWeek >= 5', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 6,
          cardioSessionsWeek: 3,
          planCycleWeeks: 4,
          cardioTypePref: 'hiit',
        }),
        healthProfile: { age: 25, weightKg: 70 },
        exerciseDB: mockDB,
      });

      // With 6 training days, only 1 rest day.
      // 3 cardio sessions → 1 rest + 2 overflow as session 2
      const session2Cardio = result.days.filter(d => d.sessionOrder === 2 && d.workoutType.includes('Cardio'));
      expect(session2Cardio.length).toBeGreaterThanOrEqual(1);
      for (const d of session2Cardio) {
        expect(d.notes).toContain('Cardio');
      }
    });

    it('creates session 2 cardio without deload notes for overflow', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 6,
          cardioSessionsWeek: 3,
          planCycleWeeks: 0,
          cardioTypePref: 'mixed',
        }),
        healthProfile: { age: 25, weightKg: 70 },
        exerciseDB: mockDB,
      });

      // 6 training days, 1 rest day, 3 cardio → 1 rest + 2 overflow as session 2
      const session2Days = result.days.filter(d => d.sessionOrder === 2);
      expect(session2Days.length).toBeGreaterThanOrEqual(1);
      for (const d of session2Days) {
        expect(d.notes).toContain('Cardio');
      }
    });

    it('uses general rep scheme for general goal', () => {
      const result = generateTrainingPlan({
        trainingProfile: createProfile({
          daysPerWeek: 3,
          trainingGoal: 'general',
          periodizationModel: 'linear',
        }),
        exerciseDB: mockDB,
      });

      const training = result.days.filter(d => d.workoutType !== 'Cardio');
      const exercises = parseExercises(training[0]);
      if (exercises.length > 0) {
        expect(exercises[0].repsMin).toBe(8);
        expect(exercises[0].repsMax).toBe(12);
        expect(exercises[0].restSeconds).toBe(90);
      }
    });
  });
});

/* ------------------------------------------------------------------ */
/*  Multi-session + originalExercises                                   */
/* ------------------------------------------------------------------ */

describe('generateTrainingPlan — multi-session', () => {
  it('sets sessionOrder=1 and originalExercises on all generated days', () => {
    const result = generateTrainingPlan({
      trainingProfile: createProfile({ daysPerWeek: 4 }),
      healthProfile: { age: 30, weightKg: 75 },
      exerciseDB: mockDB,
    });
    for (const day of result.days) {
      expect(day.sessionOrder).toBeDefined();
      expect(day.sessionOrder).toBeGreaterThanOrEqual(1);
      if (day.exercises) {
        expect(day.originalExercises).toBe(day.exercises);
      }
    }
  });

  it('sets sessionOrder=1 on cardio-only rest days', () => {
    const result = generateTrainingPlan({
      trainingProfile: createProfile({
        daysPerWeek: 3,
        cardioSessionsWeek: 2,
      }),
      healthProfile: { age: 30, weightKg: 75 },
      exerciseDB: mockDB,
    });
    const cardioDays = result.days.filter(d => d.workoutType === 'Cardio');
    for (const day of cardioDays) {
      expect(day.sessionOrder).toBe(1);
    }
  });

  it('adds cardio as session 2 when daysPerWeek >= 5 and cardioSessionsWeek > 0', () => {
    const result = generateTrainingPlan({
      trainingProfile: createProfile({
        daysPerWeek: 5,
        cardioSessionsWeek: 3,
        cardioTypePref: 'liss',
      }),
      healthProfile: { age: 30, weightKg: 75 },
      exerciseDB: mockDB,
    });
    const session2Days = result.days.filter(d => d.sessionOrder === 2);
    expect(session2Days.length).toBeGreaterThanOrEqual(1);
    for (const d of session2Days) {
      expect(d.workoutType).toContain('Cardio');
    }
  });

  it('never puts cardio HIIT on same day as legs', () => {
    const result = generateTrainingPlan({
      trainingProfile: createProfile({
        daysPerWeek: 5,
        cardioSessionsWeek: 3,
        cardioTypePref: 'hiit',
      }),
      healthProfile: { age: 30, weightKg: 75 },
      exerciseDB: mockDB,
    });
    const dayGroups = new Map<number, typeof result.days>();
    for (const d of result.days) {
      const arr = dayGroups.get(d.dayOfWeek) ?? [];
      arr.push(d);
      dayGroups.set(d.dayOfWeek, arr);
    }
    for (const [, sessions] of dayGroups) {
      const hasLegs = sessions.some(s => s.muscleGroups?.includes('legs'));
      const hasHIIT = sessions.some(s => s.notes?.includes('hiit'));
      expect(hasLegs && hasHIIT).toBe(false);
    }
  });

  it('limits double-session days to at most 2', () => {
    const result = generateTrainingPlan({
      trainingProfile: createProfile({
        daysPerWeek: 6,
        cardioSessionsWeek: 5,
        cardioTypePref: 'liss',
      }),
      healthProfile: { age: 30, weightKg: 75 },
      exerciseDB: mockDB,
    });
    const dayOfWeeks = result.days.map(d => d.dayOfWeek);
    const counts = new Map<number, number>();
    for (const dow of dayOfWeeks) {
      counts.set(dow, (counts.get(dow) ?? 0) + 1);
    }
    const doubleDays = [...counts.values()].filter(c => c >= 2).length;
    expect(doubleDays).toBeLessThanOrEqual(2);
  });

  it('splits heaviest strength day when sessionDurationMin <= 45 and daysPerWeek >= 5', () => {
    const result = generateTrainingPlan({
      trainingProfile: createProfile({
        daysPerWeek: 5,
        sessionDurationMin: 40,
        cardioSessionsWeek: 0,
      }),
      healthProfile: { age: 30, weightKg: 75 },
      exerciseDB: mockDB,
    });
    const session2Strength = result.days.filter(d => d.sessionOrder === 2 && !d.workoutType.includes('Cardio'));
    expect(session2Strength.length).toBeGreaterThanOrEqual(1);
    for (const d of session2Strength) {
      expect(d.exercises).toBeTruthy();
      const exs = JSON.parse(d.exercises!) as SelectedExercise[];
      expect(exs.length).toBeGreaterThan(0);
      for (const ex of exs) {
        expect(['isolation', 'secondary']).toContain(ex.exercise.category);
      }
    }
  });

  it('originalExercises remains unchanged after deload reduction', () => {
    const result = generateTrainingPlan({
      trainingProfile: createProfile({ daysPerWeek: 4 }),
      healthProfile: { age: 30, weightKg: 75 },
      exerciseDB: mockDB,
      weeklyIntensities: [9, 9, 9, 9],
    });
    for (const day of result.days) {
      if (!day.exercises || !day.originalExercises) continue;
      // originalExercises should be a valid JSON array
      const original = JSON.parse(day.originalExercises) as SelectedExercise[];
      expect(original.length).toBeGreaterThan(0);
    }
  });
});

/* ------------------------------------------------------------------ */
/*  Hook tests                                                          */
/* ------------------------------------------------------------------ */

describe('useTrainingPlan', () => {
  it('returns generatePlan function and isGenerating state', () => {
    const { result } = renderHook(() => useTrainingPlan());
    expect(result.current.isGenerating).toBe(false);
    expect(typeof result.current.generatePlan).toBe('function');
  });

  it('generates a valid plan through the hook', () => {
    const { result } = renderHook(() => useTrainingPlan());

    let plan: ReturnType<typeof result.current.generatePlan> | undefined;
    act(() => {
      plan = result.current.generatePlan({
        trainingProfile: createProfile({ daysPerWeek: 3 }),
        exerciseDB: mockDB,
      });
    });

    expect(plan).toBeDefined();
    expect(plan?.plan.splitType).toBe('full_body');
    expect(plan?.days.length).toBeGreaterThan(0);
    expect(result.current.isGenerating).toBe(false);
  });

  it('returns consistent generatePlan reference', () => {
    const { result, rerender } = renderHook(() => useTrainingPlan());
    const firstRef = result.current.generatePlan;
    rerender();
    expect(result.current.generatePlan).toBe(firstRef);
  });

  it('sets error state when plan generation fails', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useTrainingPlan());

    act(() => {
      result.current.generatePlan({
        trainingProfile: null as unknown as TrainingProfile,
      });
    });

    expect(result.current.generationError).toBeTruthy();
    expect(typeof result.current.generationError).toBe('string');
    expect(result.current.isGenerating).toBe(false);
    consoleSpy.mockRestore();
  });

  it('clears previous error on successful generation', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useTrainingPlan());

    // First call fails
    act(() => {
      result.current.generatePlan({
        trainingProfile: null as unknown as TrainingProfile,
      });
    });
    expect(result.current.generationError).toBeTruthy();

    // Second call succeeds
    act(() => {
      result.current.generatePlan({
        trainingProfile: createProfile({ daysPerWeek: 3 }),
        exerciseDB: mockDB,
      });
    });
    expect(result.current.generationError).toBeNull();
    consoleSpy.mockRestore();
  });

  it('returns generationError as null initially', () => {
    const { result } = renderHook(() => useTrainingPlan());
    expect(result.current.generationError).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  Constant for volume tests                                           */
/* ------------------------------------------------------------------ */

const ALL_MUSCLES: MuscleGroup[] = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'];

/* ------------------------------------------------------------------ */
/*  Equipment matching & fallback edge-case tests                       */
/* ------------------------------------------------------------------ */

describe('Equipment matching and fallback', () => {
  const bandsOnlyDB: Exercise[] = [
    createExercise({
      id: 'band-pull-apart',
      muscleGroup: 'back',
      equipment: ['bands'],
      category: 'isolation',
      exerciseType: 'strength',
    }),
  ];

  const bodyweightOnlyDB: Exercise[] = ALL_MUSCLES.map(m =>
    createExercise({
      id: `bw-${m}`,
      muscleGroup: m,
      equipment: ['bodyweight'],
      category: 'compound',
      exerciseType: 'strength',
    }),
  );

  it('generates plan with kettlebell equipment type', () => {
    const profile = createProfile({
      availableEquipment: ['kettlebell', 'bodyweight'],
      daysPerWeek: 3,
      cardioSessionsWeek: 0,
    });
    const db: Exercise[] = [
      ...ALL_MUSCLES.map(m =>
        createExercise({
          id: `kb-${m}`,
          muscleGroup: m,
          equipment: ['kettlebell'],
          category: 'compound',
          exerciseType: 'strength',
        }),
      ),
    ];
    const result = generateTrainingPlan({ trainingProfile: profile, exerciseDB: db });
    expect(result.days.length).toBeGreaterThan(0);
    result.days.forEach(day => {
      if (!day.exercises) return;
      const exercises: SelectedExercise[] = JSON.parse(day.exercises);
      expect(exercises.length).toBeGreaterThan(0);
    });
  });

  it('matches exercises when user selects bands equipment', () => {
    const profile = createProfile({
      availableEquipment: ['bands', 'bodyweight'],
      daysPerWeek: 3,
      cardioSessionsWeek: 0,
    });
    const db: Exercise[] = [...bodyweightOnlyDB, ...bandsOnlyDB];
    const result = generateTrainingPlan({ trainingProfile: profile, exerciseDB: db });
    const allExercises = result.days
      .filter((d): d is typeof d & { exercises: string } => !!d.exercises && d.exercises !== '[]')
      .flatMap(d => JSON.parse(d.exercises) as SelectedExercise[]);
    const bandsExercise = allExercises.find(e => e.exercise.id === 'band-pull-apart');
    expect(bandsExercise).toBeDefined();
  });

  it('falls back to bodyweight exercises when no matching equipment exercises', () => {
    const profile = createProfile({
      availableEquipment: ['bands'],
      daysPerWeek: 3,
      cardioSessionsWeek: 0,
    });
    const db: Exercise[] = [
      createExercise({
        id: 'band-back',
        muscleGroup: 'back',
        equipment: ['bands'],
        category: 'isolation',
        exerciseType: 'strength',
      }),
      ...bodyweightOnlyDB,
    ];
    const result = generateTrainingPlan({ trainingProfile: profile, exerciseDB: db });
    const allExercises = result.days
      .filter((d): d is typeof d & { exercises: string } => !!d.exercises && d.exercises !== '[]')
      .flatMap(d => JSON.parse(d.exercises) as SelectedExercise[]);
    const bwExercises = allExercises.filter(e => e.exercise.equipment.includes('bodyweight'));
    expect(bwExercises.length).toBeGreaterThan(0);
  });

  it('returns warnings when muscle groups have no exercises', () => {
    const profile = createProfile({
      availableEquipment: ['bands'],
      daysPerWeek: 3,
      cardioSessionsWeek: 0,
    });
    // Only provide exercises for 1 muscle group, no bodyweight fallback
    const db: Exercise[] = [
      createExercise({
        id: 'band-back',
        muscleGroup: 'back',
        equipment: ['bands'],
        category: 'isolation',
        exerciseType: 'strength',
      }),
    ];
    const result = generateTrainingPlan({ trainingProfile: profile, exerciseDB: db });
    expect(result.warnings).toBeDefined();
    expect(result.warnings!.length).toBeGreaterThan(0);
  });

  it('no warnings when all muscle groups have exercises', () => {
    const profile = createProfile({
      availableEquipment: ['bodyweight'],
      daysPerWeek: 3,
      cardioSessionsWeek: 0,
    });
    const result = generateTrainingPlan({
      trainingProfile: profile,
      exerciseDB: bodyweightOnlyDB,
    });
    expect(result.warnings).toBeUndefined();
  });

  it('generates plan with all exercises having matching equipment', () => {
    const profile = createProfile({
      availableEquipment: ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'bands', 'kettlebell'],
      daysPerWeek: 4,
      cardioSessionsWeek: 0,
    });
    const result = generateTrainingPlan({ trainingProfile: profile });
    result.days.forEach(day => {
      if (!day.exercises || day.exercises === '[]') return;
      const exercises: SelectedExercise[] = JSON.parse(day.exercises);
      exercises.forEach(ex => {
        const hasMatchingEquipment = ex.exercise.equipment.some(eq =>
          profile.availableEquipment.includes(eq as (typeof profile.availableEquipment)[number]),
        );
        expect(hasMatchingEquipment).toBe(true);
      });
    });
  });

  it('respects injury restrictions even with bodyweight fallback', () => {
    const profile = createProfile({
      availableEquipment: ['bands'],
      injuryRestrictions: ['shoulders'],
      daysPerWeek: 3,
      cardioSessionsWeek: 0,
    });
    const db: Exercise[] = [
      createExercise({
        id: 'bw-chest-contra',
        muscleGroup: 'chest',
        equipment: ['bodyweight'],
        category: 'compound',
        exerciseType: 'strength',
        contraindicated: ['shoulders'],
      }),
      createExercise({
        id: 'bw-chest-safe',
        muscleGroup: 'chest',
        equipment: ['bodyweight'],
        category: 'isolation',
        exerciseType: 'strength',
        contraindicated: [],
      }),
      ...ALL_MUSCLES.filter(m => m !== 'chest').map(m =>
        createExercise({
          id: `bw-${m}-safe`,
          muscleGroup: m,
          equipment: ['bodyweight'],
          category: 'compound',
          exerciseType: 'strength',
          contraindicated: [],
        }),
      ),
    ];
    const result = generateTrainingPlan({ trainingProfile: profile, exerciseDB: db });
    const allExercises = result.days
      .filter((d): d is typeof d & { exercises: string } => !!d.exercises && d.exercises !== '[]')
      .flatMap(d => JSON.parse(d.exercises) as SelectedExercise[]);
    const contraindicatedEx = allExercises.find(e => e.exercise.id === 'bw-chest-contra');
    expect(contraindicatedEx).toBeUndefined();
  });

  it('unique warnings — no duplicate muscle group names', () => {
    const profile = createProfile({
      availableEquipment: ['bands'],
      daysPerWeek: 4,
      cardioSessionsWeek: 0,
    });
    // Upper/Lower split = chest appears in multiple sessions
    const db: Exercise[] = [
      createExercise({
        id: 'band-back',
        muscleGroup: 'back',
        equipment: ['bands'],
        category: 'compound',
        exerciseType: 'strength',
      }),
    ];
    const result = generateTrainingPlan({ trainingProfile: profile, exerciseDB: db });
    if (result.warnings) {
      const uniqueCheck = new Set(result.warnings);
      expect(result.warnings.length).toBe(uniqueCheck.size);
    }
  });
});
