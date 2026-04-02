import { describe, expect, it } from 'vitest';

import type { TrainingPlanDay } from '../features/fitness/types';
import { remapExercisesToNewSplit } from '../features/fitness/utils/splitRemapper';

function makePlanDay(overrides: Partial<TrainingPlanDay> = {}): TrainingPlanDay {
  return {
    id: 'day-1',
    planId: 'plan-1',
    dayOfWeek: 1,
    sessionOrder: 1,
    workoutType: 'strength',
    muscleGroups: '["chest","back"]',
    exercises: '[]',
    originalExercises: '[]',
    isUserAssigned: false,
    originalDayOfWeek: 1,
    ...overrides,
  };
}

describe('remapExercisesToNewSplit', () => {
  it('returns empty arrays for empty input', () => {
    const result = remapExercisesToNewSplit([], 'ppl', 3);
    expect(result.mapped).toEqual([]);
    expect(result.unmapped).toEqual([]);
    expect(result.suggested).toHaveLength(3);
  });

  it('maps chest/back day to Upper in upper_lower split', () => {
    const days = [makePlanDay({ id: 'day-1', muscleGroups: '["chest","back","shoulders"]' })];
    const result = remapExercisesToNewSplit(days, 'upper_lower', 2);
    expect(result.mapped).toHaveLength(1);
    expect(result.mapped[0].toDay).toBe('Upper');
    expect(result.mapped[0].toMuscleGroups).toContain('chest');
    expect(result.suggested).toHaveLength(1);
    expect(result.suggested[0].day).toBe('Lower');
  });

  it('maps legs day to Lower in upper_lower split', () => {
    const days = [makePlanDay({ id: 'day-1', muscleGroups: '["legs","glutes"]' })];
    const result = remapExercisesToNewSplit(days, 'upper_lower', 2);
    expect(result.mapped).toHaveLength(1);
    expect(result.mapped[0].toDay).toBe('Lower');
  });

  it('maps push muscles to Push in PPL split', () => {
    const days = [makePlanDay({ id: 'day-1', muscleGroups: '["chest","shoulders"]' })];
    const result = remapExercisesToNewSplit(days, 'ppl', 3);
    expect(result.mapped).toHaveLength(1);
    expect(result.mapped[0].toDay).toBe('Push');
  });

  it('maps back muscles to Pull in PPL split', () => {
    const days = [makePlanDay({ id: 'day-1', muscleGroups: '["back"]' })];
    const result = remapExercisesToNewSplit(days, 'ppl', 3);
    expect(result.mapped).toHaveLength(1);
    expect(result.mapped[0].toDay).toBe('Pull');
  });

  it('handles full_body split — maps everything', () => {
    const days = [
      makePlanDay({ id: 'day-1', muscleGroups: '["chest","back"]' }),
      makePlanDay({ id: 'day-2', muscleGroups: '["legs","glutes"]', dayOfWeek: 2 }),
    ];
    const result = remapExercisesToNewSplit(days, 'full_body', 3);
    expect(result.mapped).toHaveLength(2);
    expect(result.suggested.length).toBeGreaterThanOrEqual(1);
  });

  it('puts days with no muscle groups into unmapped', () => {
    const days = [
      makePlanDay({ id: 'day-1', muscleGroups: undefined }),
      makePlanDay({ id: 'day-2', muscleGroups: '' }),
    ];
    const result = remapExercisesToNewSplit(days, 'ppl', 3);
    expect(result.unmapped).toHaveLength(2);
    expect(result.mapped).toHaveLength(0);
  });

  it('handles bro_split mapping', () => {
    const days = [
      makePlanDay({ id: 'day-1', muscleGroups: '["chest"]' }),
      makePlanDay({ id: 'day-2', muscleGroups: '["back"]', dayOfWeek: 2 }),
      makePlanDay({ id: 'day-3', muscleGroups: '["shoulders"]', dayOfWeek: 3 }),
      makePlanDay({ id: 'day-4', muscleGroups: '["legs","glutes"]', dayOfWeek: 4 }),
      makePlanDay({ id: 'day-5', muscleGroups: '["arms"]', dayOfWeek: 5 }),
    ];
    const result = remapExercisesToNewSplit(days, 'bro_split', 5);
    expect(result.mapped).toHaveLength(5);
    expect(result.suggested).toHaveLength(0);
    expect(result.unmapped).toHaveLength(0);
  });

  it('creates custom split days based on daysPerWeek', () => {
    const result = remapExercisesToNewSplit([], 'custom', 4);
    expect(result.suggested).toHaveLength(4);
    expect(result.suggested[0].day).toBe('Day 1');
    expect(result.suggested[3].day).toBe('Day 4');
  });

  it('cycles split definitions when daysPerWeek exceeds base split days', () => {
    const result = remapExercisesToNewSplit([], 'upper_lower', 4);
    expect(result.suggested).toHaveLength(4);
    expect(result.suggested[0].day).toBe('Upper');
    expect(result.suggested[1].day).toBe('Lower');
  });

  it('does not reuse the same target day for multiple source days', () => {
    const days = [
      makePlanDay({ id: 'day-1', muscleGroups: '["chest","shoulders"]' }),
      makePlanDay({ id: 'day-2', muscleGroups: '["chest"]', dayOfWeek: 2 }),
    ];
    const result = remapExercisesToNewSplit(days, 'ppl', 3);
    const mappedToDays = result.mapped.map(m => m.toDay);
    const uniqueDays = new Set(mappedToDays);
    expect(uniqueDays.size).toBe(mappedToDays.length);
  });

  it('handles more source days than target slots', () => {
    const days = [
      makePlanDay({ id: 'day-1', muscleGroups: '["chest"]' }),
      makePlanDay({ id: 'day-2', muscleGroups: '["back"]', dayOfWeek: 2 }),
      makePlanDay({ id: 'day-3', muscleGroups: '["legs"]', dayOfWeek: 3 }),
      makePlanDay({ id: 'day-4', muscleGroups: '["shoulders"]', dayOfWeek: 4 }),
    ];
    const result = remapExercisesToNewSplit(days, 'upper_lower', 2);
    const totalAccountedFor = result.mapped.length + result.unmapped.length;
    expect(totalAccountedFor).toBe(4);
  });

  it('preserves original day reference in mapped results', () => {
    const originalDay = makePlanDay({ id: 'day-original', muscleGroups: '["chest","back"]' });
    const result = remapExercisesToNewSplit([originalDay], 'upper_lower', 2);
    expect(result.mapped).toHaveLength(1);
    expect(result.mapped[0].from.id).toBe('day-original');
  });

  describe('muscleGroups format handling', () => {
    it('correctly parses JSON-format muscleGroups', () => {
      const days = [makePlanDay({ muscleGroups: JSON.stringify(['chest', 'shoulders']) })];
      const result = remapExercisesToNewSplit(days, 'ppl', 3);
      expect(result.mapped).toHaveLength(1);
      expect(result.mapped[0].toDay).toBe('Push');
    });

    it('correctly parses legacy comma-separated muscleGroups via fallback', () => {
      const days = [makePlanDay({ muscleGroups: 'chest,shoulders' })];
      const result = remapExercisesToNewSplit(days, 'ppl', 3);
      expect(result.mapped).toHaveLength(1);
      expect(result.mapped[0].toDay).toBe('Push');
    });

    it('handles null muscleGroups — day goes to unmapped', () => {
      const days = [makePlanDay({ muscleGroups: undefined })];
      const result = remapExercisesToNewSplit(days, 'ppl', 3);
      expect(result.unmapped).toHaveLength(1);
      expect(result.mapped).toHaveLength(0);
    });

    it('round-trip: JSON.stringify then remap correctly parses', () => {
      const groups = ['chest', 'shoulders'];
      const day = makePlanDay({ muscleGroups: JSON.stringify(groups) });
      const result = remapExercisesToNewSplit([day], 'ppl', 3);
      expect(result.mapped).not.toHaveLength(0);
      expect(result.mapped[0].toDay).toBe('Push');
    });

    it('mapped result is NOT empty for days with valid JSON muscleGroups', () => {
      const days = [
        makePlanDay({ id: 'd1', muscleGroups: JSON.stringify(['chest', 'shoulders']) }),
        makePlanDay({ id: 'd2', muscleGroups: JSON.stringify(['back']), dayOfWeek: 2 }),
        makePlanDay({ id: 'd3', muscleGroups: JSON.stringify(['legs', 'glutes']), dayOfWeek: 3 }),
      ];
      const result = remapExercisesToNewSplit(days, 'ppl', 3);
      expect(result.mapped.length).toBe(3);
      expect(result.mapped.map(m => m.toDay).sort()).toEqual(['Legs', 'Pull', 'Push']);
    });

    it('preserves exercises from source days in mapped results', () => {
      const exercises = JSON.stringify([{ exercise: { id: 'ex-1' }, sets: 3, repsMin: 8, repsMax: 12 }]);
      const days = [makePlanDay({ muscleGroups: JSON.stringify(['chest']), exercises })];
      const result = remapExercisesToNewSplit(days, 'ppl', 3);
      expect(result.mapped).toHaveLength(1);
      expect(result.mapped[0].from.exercises).toBe(exercises);
    });

    it('handles mixed JSON and legacy formats across multiple days', () => {
      const days = [
        makePlanDay({ id: 'd1', muscleGroups: '["chest","shoulders"]' }),
        makePlanDay({ id: 'd2', muscleGroups: 'back', dayOfWeek: 2 }),
        makePlanDay({ id: 'd3', muscleGroups: '["legs","glutes"]', dayOfWeek: 3 }),
      ];
      const result = remapExercisesToNewSplit(days, 'ppl', 3);
      expect(result.mapped).toHaveLength(3);
      expect(result.unmapped).toHaveLength(0);
    });
  });
});
