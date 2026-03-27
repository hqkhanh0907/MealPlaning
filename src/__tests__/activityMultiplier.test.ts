import { describe, it, expect } from 'vitest';
import {
  analyzeActivityLevel,
  calculateExerciseAdjustment,
  mapToActivityLevel,
  getConfidence,
} from '../features/fitness/utils/activityMultiplier';
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

function createWorkoutsWithSets(
  count: number,
): { workouts: Workout[]; sets: WorkoutSet[] } {
  const workouts: Workout[] = [];
  const sets: WorkoutSet[] = [];
  for (let i = 0; i < count; i++) {
    const w = createWorkout({ date: recentDate(i) });
    workouts.push(w);
    sets.push(createSet({ workoutId: w.id, reps: 10, weightKg: 60 }));
  }
  return { workouts, sets };
}

/* ------------------------------------------------------------------ */
/*  analyzeActivityLevel                                                */
/* ------------------------------------------------------------------ */

describe('analyzeActivityLevel', () => {
  beforeEach(() => {
    idCounter = 0;
  });

  it('returns sedentary with low confidence when no workouts', () => {
    const result = analyzeActivityLevel([], [], 'moderate');
    expect(result.suggestedLevel).toBe('sedentary');
    expect(result.confidence).toBe('low');
    expect(result.weeklyStrengthSessions).toBe(0);
    expect(result.weeklyCardioMinutes).toBe(0);
    expect(result.weeklyTotalVolume).toBe(0);
  });

  it('suggests moderate for 3 strength sessions per week', () => {
    const { workouts, sets } = createWorkoutsWithSets(12);
    const result = analyzeActivityLevel(workouts, sets, 'sedentary');
    expect(result.weeklyStrengthSessions).toBe(3);
    expect(result.suggestedLevel).toBe('moderate');
  });

  it('suggests active for 5 sessions plus cardio', () => {
    const workouts: Workout[] = [];
    const sets: WorkoutSet[] = [];
    for (let i = 0; i < 20; i++) {
      const w = createWorkout({ date: recentDate(i) });
      workouts.push(w);
      sets.push(createSet({ workoutId: w.id, reps: 10, weightKg: 60 }));
      sets.push(
        createSet({
          workoutId: w.id,
          weightKg: 0,
          durationMin: 30,
          intensity: 'moderate',
        }),
      );
    }
    const result = analyzeActivityLevel(workouts, sets, 'sedentary');
    expect(result.weeklyStrengthSessions).toBe(5);
    expect(result.weeklyCardioMinutes).toBe(150);
    expect(result.suggestedLevel).toBe('active');
  });

  it('suggests extra_active for 6+ sessions with high volume', () => {
    const { workouts, sets } = createWorkoutsWithSets(24);
    const result = analyzeActivityLevel(workouts, sets, 'sedentary');
    expect(result.weeklyStrengthSessions).toBe(6);
    expect(result.suggestedLevel).toBe('extra_active');
  });

  it('reports needsAdjustment true when suggested differs from current', () => {
    const { workouts, sets } = createWorkoutsWithSets(12);
    const result = analyzeActivityLevel(workouts, sets, 'sedentary');
    expect(result.suggestedLevel).toBe('moderate');
    expect(result.currentLevel).toBe('sedentary');
    expect(result.needsAdjustment).toBe(true);
  });

  it('reports needsAdjustment false when suggested matches current', () => {
    const { workouts, sets } = createWorkoutsWithSets(12);
    const result = analyzeActivityLevel(workouts, sets, 'moderate');
    expect(result.suggestedLevel).toBe('moderate');
    expect(result.currentLevel).toBe('moderate');
    expect(result.needsAdjustment).toBe(false);
  });

  it('handles workouts with no sets', () => {
    const workouts = [createWorkout()];
    const result = analyzeActivityLevel(workouts, [], 'moderate');
    expect(result.weeklyStrengthSessions).toBe(0);
    expect(result.weeklyCardioMinutes).toBe(0);
    expect(result.weeklyTotalVolume).toBe(0);
    expect(result.suggestedLevel).toBe('sedentary');
    expect(result.needsAdjustment).toBe(true);
  });

  it('treats sets with undefined reps as zero volume', () => {
    const w = createWorkout({ date: recentDate(0) });
    const sets = [createSet({ workoutId: w.id, reps: undefined, weightKg: 60 })];
    const result = analyzeActivityLevel([w], sets, 'moderate');
    expect(result.weeklyStrengthSessions).toBe(0);
    expect(result.weeklyTotalVolume).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/*  mapToActivityLevel                                                  */
/* ------------------------------------------------------------------ */

describe('mapToActivityLevel', () => {
  it('returns sedentary for 0 sessions and <30 cardio', () => {
    expect(mapToActivityLevel(0, 0, 0)).toBe('sedentary');
    expect(mapToActivityLevel(0, 29, 0)).toBe('sedentary');
    expect(mapToActivityLevel(0.5, 0, 0)).toBe('sedentary');
  });

  it('returns light for 1-2 sessions or 30-89 cardio', () => {
    expect(mapToActivityLevel(1, 0, 0)).toBe('light');
    expect(mapToActivityLevel(2, 0, 0)).toBe('light');
    expect(mapToActivityLevel(0, 30, 0)).toBe('light');
    expect(mapToActivityLevel(0, 89, 0)).toBe('light');
  });

  it('returns moderate for 3-4 sessions or 90-150 cardio', () => {
    expect(mapToActivityLevel(3, 0, 0)).toBe('moderate');
    expect(mapToActivityLevel(4, 0, 0)).toBe('moderate');
    expect(mapToActivityLevel(0, 90, 0)).toBe('moderate');
    expect(mapToActivityLevel(0, 150, 0)).toBe('moderate');
  });

  it('returns active for 4-5 sessions with >90 cardio or 5+ sessions', () => {
    expect(mapToActivityLevel(5, 0, 0)).toBe('active');
    expect(mapToActivityLevel(4, 91, 0)).toBe('active');
    expect(mapToActivityLevel(5, 100, 100)).toBe('active');
  });

  it('returns extra_active for 6+ sessions or >150 cardio with volume', () => {
    expect(mapToActivityLevel(6, 0, 0)).toBe('extra_active');
    expect(mapToActivityLevel(7, 0, 0)).toBe('extra_active');
    expect(mapToActivityLevel(0, 151, 100)).toBe('extra_active');
  });
});

/* ------------------------------------------------------------------ */
/*  calculateExerciseAdjustment                                         */
/* ------------------------------------------------------------------ */

describe('calculateExerciseAdjustment', () => {
  beforeEach(() => {
    idCounter = 0;
  });

  it('returns daily calorie burn from workouts', () => {
    const workouts = [createWorkout({ durationMin: 60 })];
    const sets = [
      createSet({ workoutId: workouts[0].id, weightKg: 60, reps: 10 }),
    ];
    // STRENGTH_MET(5) * weightKg(70) * durationMin(60) / 60 = 350
    // Daily = 350 / 7 = 50
    const result = calculateExerciseAdjustment(workouts, sets, 70, 7);
    expect(result).toBe(50);
  });

  it('returns 0 when no workouts', () => {
    expect(calculateExerciseAdjustment([], [], 70, 7)).toBe(0);
  });

  it('uses estimatedCalories from cardio sets and skips strength without duration', () => {
    const w = createWorkout();
    const cardioSet = createSet({
      workoutId: w.id,
      weightKg: 0,
      estimatedCalories: 350,
    });
    const strengthSet = createSet({
      workoutId: w.id,
      weightKg: 60,
      reps: 10,
    });
    const result = calculateExerciseAdjustment(
      [w],
      [cardioSet, strengthSet],
      70,
      7,
    );
    // No durationMin on workout → strength portion skipped, only 350 cardio
    expect(result).toBe(50); // 350 / 7 = 50
  });
});

/* ------------------------------------------------------------------ */
/*  getConfidence                                                       */
/* ------------------------------------------------------------------ */

describe('getConfidence', () => {
  beforeEach(() => {
    idCounter = 0;
  });

  it('returns low for less than 2 weeks of data', () => {
    const workouts = [createWorkout()];
    expect(getConfidence(workouts, 1)).toBe('low');
  });

  it('returns low when no workouts regardless of weeks', () => {
    expect(getConfidence([], 4)).toBe('low');
  });

  it('returns medium for 2-3 weeks of data', () => {
    const workouts = [createWorkout(), createWorkout()];
    expect(getConfidence(workouts, 2)).toBe('medium');
    expect(getConfidence(workouts, 3)).toBe('medium');
  });

  it('returns high for 4+ weeks of data', () => {
    const workouts = [createWorkout(), createWorkout()];
    expect(getConfidence(workouts, 4)).toBe('high');
    expect(getConfidence(workouts, 8)).toBe('high');
  });
});
