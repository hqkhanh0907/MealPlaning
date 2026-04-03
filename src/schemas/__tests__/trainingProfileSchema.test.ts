import { describe, expect, it } from 'vitest';

import { trainingProfileDefaults, type TrainingProfileFormData, trainingProfileSchema } from '../trainingProfileSchema';

describe('trainingProfileSchema', () => {
  it('accepts valid complete data', () => {
    const valid: TrainingProfileFormData = {
      trainingGoal: 'hypertrophy',
      trainingExperience: 'intermediate',
      daysPerWeek: 4,
      sessionDurationMin: 60,
      availableEquipment: ['barbell', 'dumbbell'],
      injuryRestrictions: [],
      cardioSessionsWeek: 2,
      periodizationModel: 'undulating',
      planCycleWeeks: 8,
      priorityMuscles: ['chest', 'back'],
      avgSleepHours: 7,
    };
    const result = trainingProfileSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid daysPerWeek (must be 2-6)', () => {
    const data = { ...trainingProfileDefaults, daysPerWeek: 1 };
    const result = trainingProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects daysPerWeek = 7', () => {
    const data = { ...trainingProfileDefaults, daysPerWeek: 7 };
    const result = trainingProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects invalid sessionDurationMin', () => {
    const data = { ...trainingProfileDefaults, sessionDurationMin: 20 };
    const result = trainingProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects more than 3 priority muscles', () => {
    const data = {
      ...trainingProfileDefaults,
      priorityMuscles: ['chest', 'back', 'shoulders', 'legs'] as TrainingProfileFormData['priorityMuscles'],
    };
    const result = trainingProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('allows empty priorityMuscles', () => {
    const data = { ...trainingProfileDefaults, priorityMuscles: [] };
    const result = trainingProfileSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('allows avgSleepHours to be undefined', () => {
    const { avgSleepHours: _unused, ...data } = trainingProfileDefaults;
    const result = trainingProfileSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('allows avgSleepHours as undefined', () => {
    const data = { ...trainingProfileDefaults, avgSleepHours: undefined };
    const result = trainingProfileSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects avgSleepHours below 3', () => {
    const data = { ...trainingProfileDefaults, avgSleepHours: 2 };
    const result = trainingProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects cardioSessionsWeek above 5', () => {
    const data = { ...trainingProfileDefaults, cardioSessionsWeek: 6 };
    const result = trainingProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects planCycleWeeks not in allowed set', () => {
    const data = { ...trainingProfileDefaults, planCycleWeeks: 5 };
    const result = trainingProfileSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('defaults are valid', () => {
    const result = trainingProfileSchema.safeParse(trainingProfileDefaults);
    expect(result.success).toBe(true);
  });

  it('accepts all valid training goals', () => {
    for (const goal of ['strength', 'hypertrophy', 'endurance', 'general'] as const) {
      const data = { ...trainingProfileDefaults, trainingGoal: goal };
      expect(trainingProfileSchema.safeParse(data).success).toBe(true);
    }
  });

  it('accepts all valid session durations', () => {
    for (const dur of [30, 45, 60, 90] as const) {
      const data = { ...trainingProfileDefaults, sessionDurationMin: dur };
      expect(trainingProfileSchema.safeParse(data).success).toBe(true);
    }
  });

  it('accepts all valid cycle weeks', () => {
    for (const weeks of [4, 6, 8, 12] as const) {
      const data = { ...trainingProfileDefaults, planCycleWeeks: weeks };
      expect(trainingProfileSchema.safeParse(data).success).toBe(true);
    }
  });
});
