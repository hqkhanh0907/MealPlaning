import { describe, expect, it } from 'vitest';

import { BUILTIN_TEMPLATES } from '../features/fitness/data/builtinTemplates';
import type { EquipmentType, MuscleGroup, PlanTemplate, SplitType } from '../features/fitness/types';
import { isSplitType } from '../features/fitness/types';

const VALID_SPLIT_TYPES: SplitType[] = ['full_body', 'upper_lower', 'ppl', 'bro_split', 'custom'];
const VALID_MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'];
const VALID_EQUIPMENT: EquipmentType[] = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'bands'];
const VALID_EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced', 'all'];
const VALID_GOALS = ['strength', 'hypertrophy', 'endurance', 'general'];

describe('BUILTIN_TEMPLATES', () => {
  it('has exactly 8 templates', () => {
    expect(BUILTIN_TEMPLATES).toHaveLength(8);
  });

  it('all templates have unique IDs', () => {
    const ids = BUILTIN_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(BUILTIN_TEMPLATES.map(t => [t.id, t]))('template "%s" has all required fields', (_id, template) => {
    const t = template as PlanTemplate;
    expect(t.id).toBeTruthy();
    expect(t.name).toBeTruthy();
    expect(t.description).toBeTruthy();
    expect(typeof t.daysPerWeek).toBe('number');
    expect(t.daysPerWeek).toBeGreaterThanOrEqual(1);
    expect(t.daysPerWeek).toBeLessThanOrEqual(7);
    expect(typeof t.popularityScore).toBe('number');
    expect(t.isBuiltin).toBe(true);
  });

  it.each(BUILTIN_TEMPLATES.map(t => [t.id, t]))('template "%s" has valid splitType', (_id, template) => {
    const t = template as PlanTemplate;
    expect(isSplitType(t.splitType)).toBe(true);
    expect(VALID_SPLIT_TYPES).toContain(t.splitType);
  });

  it.each(BUILTIN_TEMPLATES.map(t => [t.id, t]))('template "%s" has valid experienceLevel', (_id, template) => {
    const t = template as PlanTemplate;
    expect(VALID_EXPERIENCE_LEVELS).toContain(t.experienceLevel);
  });

  it.each(BUILTIN_TEMPLATES.map(t => [t.id, t]))('template "%s" has valid trainingGoal', (_id, template) => {
    const t = template as PlanTemplate;
    expect(VALID_GOALS).toContain(t.trainingGoal);
  });

  it.each(BUILTIN_TEMPLATES.map(t => [t.id, t]))('template "%s" has valid equipment', (_id, template) => {
    const t = template as PlanTemplate;
    expect(Array.isArray(t.equipmentRequired)).toBe(true);
    for (const eq of t.equipmentRequired) {
      expect(VALID_EQUIPMENT).toContain(eq);
    }
  });

  it.each(BUILTIN_TEMPLATES.map(t => [t.id, t]))(
    'template "%s" dayConfigs length matches daysPerWeek',
    (_id, template) => {
      const t = template as PlanTemplate;
      expect(t.dayConfigs).toHaveLength(t.daysPerWeek);
    },
  );

  it.each(BUILTIN_TEMPLATES.map(t => [t.id, t]))('template "%s" dayConfigs have valid fields', (_id, template) => {
    const t = template as PlanTemplate;
    for (const config of t.dayConfigs) {
      expect(config.dayLabel).toBeTruthy();
      expect(config.workoutType).toBeTruthy();
      expect(Array.isArray(config.muscleGroups)).toBe(true);
      expect(config.muscleGroups.length).toBeGreaterThan(0);
      for (const mg of config.muscleGroups) {
        expect(VALID_MUSCLE_GROUPS).toContain(mg);
      }
      expect(Array.isArray(config.exercises)).toBe(true);
    }
  });

  it('includes starting_strength template', () => {
    const t = BUILTIN_TEMPLATES.find(tpl => tpl.id === 'starting_strength');
    expect(t).toBeDefined();
    expect(t?.splitType).toBe('full_body');
    expect(t?.daysPerWeek).toBe(3);
    expect(t?.experienceLevel).toBe('beginner');
  });

  it('includes ppl_classic template', () => {
    const t = BUILTIN_TEMPLATES.find(tpl => tpl.id === 'ppl_classic');
    expect(t).toBeDefined();
    expect(t?.splitType).toBe('ppl');
    expect(t?.daysPerWeek).toBe(6);
    expect(t?.experienceLevel).toBe('intermediate');
  });

  it('includes upper_lower_4 template', () => {
    const t = BUILTIN_TEMPLATES.find(tpl => tpl.id === 'upper_lower_4');
    expect(t).toBeDefined();
    expect(t?.splitType).toBe('upper_lower');
    expect(t?.daysPerWeek).toBe(4);
  });

  it('includes bro_split_5 template', () => {
    const t = BUILTIN_TEMPLATES.find(tpl => tpl.id === 'bro_split_5');
    expect(t).toBeDefined();
    expect(t?.splitType).toBe('bro_split');
    expect(t?.daysPerWeek).toBe(5);
    expect(t?.experienceLevel).toBe('all');
  });

  it('includes stronglifts_5x5 template', () => {
    const t = BUILTIN_TEMPLATES.find(tpl => tpl.id === 'stronglifts_5x5');
    expect(t).toBeDefined();
    expect(t?.splitType).toBe('full_body');
    expect(t?.daysPerWeek).toBe(3);
  });

  it('includes nsuns_531 template', () => {
    const t = BUILTIN_TEMPLATES.find(tpl => tpl.id === 'nsuns_531');
    expect(t).toBeDefined();
    expect(t?.splitType).toBe('upper_lower');
    expect(t?.daysPerWeek).toBe(5);
    expect(t?.experienceLevel).toBe('advanced');
  });

  it('includes phul_4 template', () => {
    const t = BUILTIN_TEMPLATES.find(tpl => tpl.id === 'phul_4');
    expect(t).toBeDefined();
    expect(t?.splitType).toBe('upper_lower');
    expect(t?.daysPerWeek).toBe(4);
    expect(t?.trainingGoal).toBe('general');
  });

  it('includes phat_5 template', () => {
    const t = BUILTIN_TEMPLATES.find(tpl => tpl.id === 'phat_5');
    expect(t).toBeDefined();
    expect(t?.splitType).toBe('ppl');
    expect(t?.daysPerWeek).toBe(5);
    expect(t?.experienceLevel).toBe('advanced');
  });

  it('all popularity scores are between 0 and 100', () => {
    for (const t of BUILTIN_TEMPLATES) {
      expect(t.popularityScore).toBeGreaterThanOrEqual(0);
      expect(t.popularityScore).toBeLessThanOrEqual(100);
    }
  });
});
