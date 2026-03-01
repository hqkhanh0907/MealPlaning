import { describe, it, expect } from 'vitest';
import {
  createEmptyDayPlan,
  getDayPlanSlotKey,
  clearPlansByScope,
  applySuggestionToDayPlans,
  updateDayPlanSlot,
} from '../services/planService';
import { DayPlan } from '../types';

// --- Test fixtures ---

const plan1: DayPlan = {
  date: '2026-03-02', // Monday
  breakfastDishIds: ['d1'],
  lunchDishIds: ['d2'],
  dinnerDishIds: ['d3'],
};

const plan2: DayPlan = {
  date: '2026-03-04', // Wednesday
  breakfastDishIds: ['d4'],
  lunchDishIds: [],
  dinnerDishIds: ['d5'],
};

const plan3: DayPlan = {
  date: '2026-04-01', // Next month
  breakfastDishIds: ['d6'],
  lunchDishIds: ['d7'],
  dinnerDishIds: [],
};

const allPlans = [plan1, plan2, plan3];

// --- Tests ---

describe('createEmptyDayPlan', () => {
  it('should create plan with given date and empty arrays', () => {
    const plan = createEmptyDayPlan('2026-03-01');
    expect(plan.date).toBe('2026-03-01');
    expect(plan.breakfastDishIds).toEqual([]);
    expect(plan.lunchDishIds).toEqual([]);
    expect(plan.dinnerDishIds).toEqual([]);
  });
});

describe('getDayPlanSlotKey', () => {
  it('should return correct key for breakfast', () => {
    expect(getDayPlanSlotKey('breakfast')).toBe('breakfastDishIds');
  });

  it('should return correct key for lunch', () => {
    expect(getDayPlanSlotKey('lunch')).toBe('lunchDishIds');
  });

  it('should return correct key for dinner', () => {
    expect(getDayPlanSlotKey('dinner')).toBe('dinnerDishIds');
  });
});

describe('clearPlansByScope', () => {
  describe('day scope', () => {
    it('should remove only the selected day', () => {
      const result = clearPlansByScope(allPlans, '2026-03-02', 'day');
      expect(result).toHaveLength(2);
      expect(result.find(p => p.date === '2026-03-02')).toBeUndefined();
    });

    it('should return all if no match', () => {
      const result = clearPlansByScope(allPlans, '2099-01-01', 'day');
      expect(result).toHaveLength(3);
    });
  });

  describe('week scope', () => {
    it('should remove all plans in the same week', () => {
      // 2026-03-02 (Mon) and 2026-03-04 (Wed) are in the same week
      const result = clearPlansByScope(allPlans, '2026-03-03', 'week');
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2026-04-01'); // Only April plan remains
    });

    it('should keep plans in different weeks', () => {
      const result = clearPlansByScope(allPlans, '2026-04-01', 'week');
      expect(result).toHaveLength(2); // March plans remain
    });
  });

  describe('month scope', () => {
    it('should remove all plans in the same month', () => {
      const result = clearPlansByScope(allPlans, '2026-03-15', 'month');
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2026-04-01');
    });

    it('should keep plans from other months', () => {
      const result = clearPlansByScope(allPlans, '2026-04-15', 'month');
      expect(result).toHaveLength(2);
    });
  });

  it('should not mutate the original array', () => {
    const original = [...allPlans];
    clearPlansByScope(allPlans, '2026-03-02', 'day');
    expect(allPlans).toEqual(original);
  });
});

describe('applySuggestionToDayPlans', () => {
  it('should add new plan if no existing plan for date', () => {
    const suggestion = {
      breakfastDishIds: ['s1'],
      lunchDishIds: ['s2'],
      dinnerDishIds: ['s3'],
    };
    const result = applySuggestionToDayPlans([], '2026-03-10', suggestion);
    expect(result).toHaveLength(1);
    expect(result[0].breakfastDishIds).toEqual(['s1']);
    expect(result[0].lunchDishIds).toEqual(['s2']);
    expect(result[0].dinnerDishIds).toEqual(['s3']);
  });

  it('should merge with existing plan, replacing non-empty slots', () => {
    const plans: DayPlan[] = [{
      date: '2026-03-02',
      breakfastDishIds: ['old-b'],
      lunchDishIds: ['old-l'],
      dinnerDishIds: ['old-d'],
    }];
    const suggestion = {
      breakfastDishIds: ['new-b'],
      lunchDishIds: [],  // Empty → keep existing
      dinnerDishIds: ['new-d'],
    };
    const result = applySuggestionToDayPlans(plans, '2026-03-02', suggestion);
    expect(result).toHaveLength(1);
    expect(result[0].breakfastDishIds).toEqual(['new-b']);
    expect(result[0].lunchDishIds).toEqual(['old-l']); // Preserved
    expect(result[0].dinnerDishIds).toEqual(['new-d']);
  });

  it('should not mutate original plans', () => {
    const plans = [{ ...plan1 }];
    applySuggestionToDayPlans(plans, '2026-03-02', {
      breakfastDishIds: ['new'],
      lunchDishIds: [],
      dinnerDishIds: [],
    });
    expect(plans[0].breakfastDishIds).toEqual(['d1']); // Unchanged
  });
});

describe('updateDayPlanSlot', () => {
  it('should update existing plan slot', () => {
    const result = updateDayPlanSlot([plan1], '2026-03-02', 'breakfast', ['new1', 'new2']);
    expect(result[0].breakfastDishIds).toEqual(['new1', 'new2']);
    expect(result[0].lunchDishIds).toEqual(['d2']); // Unchanged
  });

  it('should create new plan if none exists for date', () => {
    const result = updateDayPlanSlot([], '2026-03-10', 'lunch', ['new1']);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-03-10');
    expect(result[0].lunchDishIds).toEqual(['new1']);
    expect(result[0].breakfastDishIds).toEqual([]); // Other slots empty
    expect(result[0].dinnerDishIds).toEqual([]);
  });

  it('should handle clearing a slot (empty array)', () => {
    const result = updateDayPlanSlot([plan1], '2026-03-02', 'dinner', []);
    expect(result[0].dinnerDishIds).toEqual([]);
    expect(result[0].breakfastDishIds).toEqual(['d1']); // Unchanged
  });

  it('should not mutate original array', () => {
    const plans = [{ ...plan1 }];
    updateDayPlanSlot(plans, '2026-03-02', 'breakfast', ['new']);
    expect(plans[0].breakfastDishIds).toEqual(['d1']);
  });
});

