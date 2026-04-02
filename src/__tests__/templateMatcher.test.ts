import { describe, expect, it } from 'vitest';

import type { PlanTemplate, TrainingProfile } from '../features/fitness/types';
import { computeMatchScore } from '../features/fitness/utils/templateMatcher';

function sampleTemplate(overrides: Partial<PlanTemplate> = {}): PlanTemplate {
  return {
    id: 'tpl-1',
    name: 'Test Template',
    splitType: 'upper_lower',
    daysPerWeek: 4,
    experienceLevel: 'intermediate',
    trainingGoal: 'hypertrophy',
    equipmentRequired: ['barbell', 'dumbbell'],
    description: 'Test',
    dayConfigs: [],
    popularityScore: 50,
    isBuiltin: true,
    ...overrides,
  };
}

function sampleProfile(overrides: Partial<TrainingProfile> = {}): TrainingProfile {
  return {
    id: 'profile-1',
    trainingExperience: 'intermediate',
    daysPerWeek: 4,
    sessionDurationMin: 60,
    trainingGoal: 'hypertrophy',
    availableEquipment: ['barbell', 'dumbbell'],
    injuryRestrictions: [],
    periodizationModel: 'undulating',
    planCycleWeeks: 8,
    priorityMuscles: ['chest', 'back'],
    cardioSessionsWeek: 2,
    cardioTypePref: 'mixed',
    cardioDurationMin: 30,
    updatedAt: '2025-06-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeMatchScore', () => {
  it('returns 100 for a perfect match', () => {
    const template = sampleTemplate({ popularityScore: 100 });
    const profile = sampleProfile();
    expect(computeMatchScore(template, profile)).toBe(100);
  });

  it('returns 0 for a completely mismatched template', () => {
    const template = sampleTemplate({
      daysPerWeek: 7,
      trainingGoal: 'endurance',
      experienceLevel: 'beginner',
      equipmentRequired: ['machine'],
      popularityScore: 0,
    });
    const profile = sampleProfile({
      daysPerWeek: 3,
      trainingGoal: 'strength',
      trainingExperience: 'advanced',
      availableEquipment: ['bodyweight'],
    });
    expect(computeMatchScore(template, profile)).toBe(0);
  });

  it('gives partial score for off-by-one days', () => {
    const template = sampleTemplate({ daysPerWeek: 5, popularityScore: 0 });
    const profile = sampleProfile({ daysPerWeek: 4 });
    const score = computeMatchScore(template, profile);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });

  it('gives 0 days score for off-by-more-than-one', () => {
    const exact = computeMatchScore(
      sampleTemplate({ daysPerWeek: 6, popularityScore: 0 }),
      sampleProfile({ daysPerWeek: 3 }),
    );
    const offByOne = computeMatchScore(
      sampleTemplate({ daysPerWeek: 4, popularityScore: 0 }),
      sampleProfile({ daysPerWeek: 3 }),
    );
    expect(offByOne).toBeGreaterThan(exact);
  });

  it('gives partial goal score for "general" template goal', () => {
    const template = sampleTemplate({ trainingGoal: 'general', popularityScore: 0 });
    const profile = sampleProfile({ trainingGoal: 'strength' });
    const score = computeMatchScore(template, profile);
    expect(score).toBeGreaterThan(0);
  });

  it('gives 0 goal score for mismatched non-general goals', () => {
    const strength = computeMatchScore(
      sampleTemplate({ trainingGoal: 'strength', popularityScore: 0, daysPerWeek: 3 }),
      sampleProfile({ trainingGoal: 'hypertrophy', daysPerWeek: 3 }),
    );
    const general = computeMatchScore(
      sampleTemplate({ trainingGoal: 'general', popularityScore: 0, daysPerWeek: 3 }),
      sampleProfile({ trainingGoal: 'hypertrophy', daysPerWeek: 3 }),
    );
    expect(general).toBeGreaterThan(strength);
  });

  it('gives full level score for "all" experience level', () => {
    const allLevel = computeMatchScore(
      sampleTemplate({ experienceLevel: 'all', popularityScore: 0 }),
      sampleProfile({ trainingExperience: 'advanced' }),
    );
    const exactLevel = computeMatchScore(
      sampleTemplate({ experienceLevel: 'advanced', popularityScore: 0 }),
      sampleProfile({ trainingExperience: 'advanced' }),
    );
    expect(allLevel).toBe(exactLevel);
  });

  it('gives partial level score for adjacent experience levels', () => {
    const adjacent = computeMatchScore(
      sampleTemplate({ experienceLevel: 'beginner', popularityScore: 0 }),
      sampleProfile({ trainingExperience: 'intermediate' }),
    );
    const distant = computeMatchScore(
      sampleTemplate({ experienceLevel: 'beginner', popularityScore: 0 }),
      sampleProfile({ trainingExperience: 'advanced' }),
    );
    expect(adjacent).toBeGreaterThan(distant);
  });

  it('handles empty equipment on both sides (Jaccard = 1.0)', () => {
    const template = sampleTemplate({ equipmentRequired: [], popularityScore: 0 });
    const profile = sampleProfile({ availableEquipment: [] });
    const score = computeMatchScore(template, profile);
    expect(score).toBeGreaterThan(0);
  });

  it('handles no equipment overlap', () => {
    const template = sampleTemplate({
      equipmentRequired: ['machine'],
      popularityScore: 0,
    });
    const profile = sampleProfile({
      availableEquipment: ['bodyweight'],
    });
    const score = computeMatchScore(template, profile);
    const fullEquipMatch = computeMatchScore(
      sampleTemplate({ equipmentRequired: ['bodyweight'], popularityScore: 0 }),
      sampleProfile({ availableEquipment: ['bodyweight'] }),
    );
    expect(score).toBeLessThan(fullEquipMatch);
  });

  it('higher popularity gives higher score', () => {
    const lowPop = computeMatchScore(sampleTemplate({ popularityScore: 10 }), sampleProfile());
    const highPop = computeMatchScore(sampleTemplate({ popularityScore: 90 }), sampleProfile());
    expect(highPop).toBeGreaterThan(lowPop);
  });

  it('clamps popularity to 0-100 range', () => {
    const overMax = computeMatchScore(sampleTemplate({ popularityScore: 200 }), sampleProfile());
    const atMax = computeMatchScore(sampleTemplate({ popularityScore: 100 }), sampleProfile());
    expect(overMax).toBe(atMax);
  });

  it('returns integer between 0 and 100', () => {
    const score = computeMatchScore(sampleTemplate(), sampleProfile());
    expect(Number.isInteger(score)).toBe(true);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
