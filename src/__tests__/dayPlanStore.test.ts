import { beforeEach, describe, expect, it } from 'vitest';

import { useDayPlanStore } from '../store/dayPlanStore';
import type { DayPlan } from '../types';

/* ------------------------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------------------------ */
const makePlan = (overrides: Partial<DayPlan> = {}): DayPlan => ({
  date: '2025-01-15',
  breakfastDishIds: ['d1', 'd2'],
  lunchDishIds: ['d3'],
  dinnerDishIds: [],
  servings: { d1: 2, d3: 3 },
  ...overrides,
});

function resetStore(): void {
  useDayPlanStore.setState({ dayPlans: [] });
}

/* ================================================================== */
/* Tests */
/* ================================================================== */
describe('dayPlanStore', () => {
  beforeEach(() => {
    resetStore();
  });

  /* ---------------------------------------------------------------- */
  /* setDayPlans */
  /* ---------------------------------------------------------------- */
  describe('setDayPlans', () => {
    it('sets day plans from an array', () => {
      const plan = makePlan();

      useDayPlanStore.getState().setDayPlans([plan]);

      const plans = useDayPlanStore.getState().dayPlans;
      expect(plans).toHaveLength(1);
      expect(plans[0]).toEqual({
        date: '2025-01-15',
        breakfastDishIds: ['d1', 'd2'],
        lunchDishIds: ['d3'],
        dinnerDishIds: [],
        servings: { d1: 2, d3: 3 },
      });
    });

    it('sets multiple day plans', () => {
      const plan1 = makePlan({ date: '2025-01-15' });
      const plan2 = makePlan({ date: '2025-01-16', breakfastDishIds: [] });

      useDayPlanStore.getState().setDayPlans([plan1, plan2]);

      const plans = useDayPlanStore.getState().dayPlans;
      expect(plans).toHaveLength(2);
    });

    it('replaces existing dayPlans with empty array', () => {
      useDayPlanStore.setState({ dayPlans: [makePlan()] });

      useDayPlanStore.getState().setDayPlans([]);

      expect(useDayPlanStore.getState().dayPlans).toEqual([]);
    });

    it('accepts an updater function', () => {
      useDayPlanStore.setState({ dayPlans: [makePlan()] });

      useDayPlanStore.getState().setDayPlans(prev => [...prev, makePlan({ date: '2025-01-16' })]);

      expect(useDayPlanStore.getState().dayPlans).toHaveLength(2);
    });
  });

  /* ---------------------------------------------------------------- */
  /* updatePlan */
  /* ---------------------------------------------------------------- */
  describe('updatePlan', () => {
    it('updates breakfast dish ids for a given date', () => {
      useDayPlanStore.setState({ dayPlans: [makePlan()] });

      useDayPlanStore.getState().updatePlan('2025-01-15', 'breakfast', ['d9']);

      const plan = useDayPlanStore.getState().dayPlans.find(p => p.date === '2025-01-15');
      expect(plan?.breakfastDishIds).toEqual(['d9']);
    });

    it('creates a new plan entry when date does not exist', () => {
      useDayPlanStore.getState().updatePlan('2025-01-20', 'lunch', ['d5']);

      const plans = useDayPlanStore.getState().dayPlans;
      expect(plans).toHaveLength(1);
      expect(plans[0].date).toBe('2025-01-20');
      expect(plans[0].lunchDishIds).toEqual(['d5']);
    });
  });

  /* ---------------------------------------------------------------- */
  /* updateServings */
  /* ---------------------------------------------------------------- */
  describe('updateServings', () => {
    it('sets serving count for a dish', () => {
      useDayPlanStore.setState({ dayPlans: [makePlan()] });

      useDayPlanStore.getState().updateServings('2025-01-15', 'd1', 5);

      const plan = useDayPlanStore.getState().dayPlans[0];
      expect(plan.servings?.d1).toBe(5);
    });

    it('removes serving entry when count is 1 or less', () => {
      useDayPlanStore.setState({ dayPlans: [makePlan()] });

      useDayPlanStore.getState().updateServings('2025-01-15', 'd1', 1);

      const plan = useDayPlanStore.getState().dayPlans[0];
      expect(plan.servings?.d1).toBeUndefined();
    });
  });

  /* ---------------------------------------------------------------- */
  /* isDishUsed */
  /* ---------------------------------------------------------------- */
  describe('isDishUsed', () => {
    it('returns true when dish is in breakfast', () => {
      useDayPlanStore.setState({ dayPlans: [makePlan()] });

      expect(useDayPlanStore.getState().isDishUsed('d1')).toBe(true);
    });

    it('returns true when dish is in lunch', () => {
      useDayPlanStore.setState({ dayPlans: [makePlan()] });

      expect(useDayPlanStore.getState().isDishUsed('d3')).toBe(true);
    });

    it('returns false when dish is not used anywhere', () => {
      useDayPlanStore.setState({ dayPlans: [makePlan()] });

      expect(useDayPlanStore.getState().isDishUsed('not-used')).toBe(false);
    });
  });

  /* ---------------------------------------------------------------- */
  /* restoreDayPlans */
  /* ---------------------------------------------------------------- */
  describe('restoreDayPlans', () => {
    it('restores snapshot and merges with existing plans', () => {
      useDayPlanStore.setState({
        dayPlans: [
          makePlan({ date: '2025-01-15' }),
          makePlan({ date: '2025-01-16' }),
          makePlan({ date: '2025-01-17' }),
        ],
      });

      const snapshot = [
        makePlan({ date: '2025-01-15', breakfastDishIds: ['restored'] }),
        makePlan({ date: '2025-01-17', breakfastDishIds: ['restored'] }),
      ];

      useDayPlanStore.getState().restoreDayPlans(snapshot);

      const plans = useDayPlanStore.getState().dayPlans;
      expect(plans).toHaveLength(3);

      const plan15 = plans.find(p => p.date === '2025-01-15');
      expect(plan15?.breakfastDishIds).toEqual(['restored']);

      const plan16 = plans.find(p => p.date === '2025-01-16');
      expect(plan16?.breakfastDishIds).toEqual(['d1', 'd2']);
    });
  });

  /* ---------------------------------------------------------------- */
  /* Data integrity */
  /* ---------------------------------------------------------------- */
  describe('data integrity', () => {
    it('preserves arrays and servings object through set/get', () => {
      const plan: DayPlan = {
        date: '2025-06-01',
        breakfastDishIds: ['a', 'b', 'c'],
        lunchDishIds: ['d'],
        dinnerDishIds: ['e', 'f'],
        servings: { a: 2, d: 5, e: 1 },
      };

      useDayPlanStore.getState().setDayPlans([plan]);

      expect(useDayPlanStore.getState().dayPlans[0]).toEqual(plan);
    });

    it('handles plans with empty arrays correctly', () => {
      const plan: DayPlan = {
        date: '2025-06-02',
        breakfastDishIds: [],
        lunchDishIds: [],
        dinnerDishIds: [],
      };

      useDayPlanStore.getState().setDayPlans([plan]);

      const loaded = useDayPlanStore.getState().dayPlans[0];
      expect(loaded.breakfastDishIds).toEqual([]);
      expect(loaded.lunchDishIds).toEqual([]);
      expect(loaded.dinnerDishIds).toEqual([]);
      expect(loaded.servings).toBeUndefined();
    });
  });

  /* ---------------------------------------------------------------- */
  /* updateServings – date mismatch */
  /* ---------------------------------------------------------------- */
  describe('updateServings – edge cases', () => {
    it('does not modify plans when date does not match', () => {
      useDayPlanStore.setState({ dayPlans: [makePlan({ date: '2025-01-15' })] });

      useDayPlanStore.getState().updateServings('2025-01-99', 'd1', 5);

      const plan = useDayPlanStore.getState().dayPlans[0];
      expect(plan.servings?.d1).toBe(2);
    });
  });

  /* ---------------------------------------------------------------- */
  /* loadAll */
  /* ---------------------------------------------------------------- */
  describe('loadAll', () => {
    it('loads day plans from database with servings', async () => {
      const mockDb = {
        query: vi.fn().mockResolvedValue([
          {
            date: '2025-07-01',
            breakfast_dish_ids: '["d1","d2"]',
            lunch_dish_ids: '["d3"]',
            dinner_dish_ids: '[]',
            servings: '{"d1":2}',
          },
        ]),
      };

      await useDayPlanStore.getState().loadAll(mockDb as never);

      const plans = useDayPlanStore.getState().dayPlans;
      expect(plans).toHaveLength(1);
      expect(plans[0].date).toBe('2025-07-01');
      expect(plans[0].breakfastDishIds).toEqual(['d1', 'd2']);
      expect(plans[0].lunchDishIds).toEqual(['d3']);
      expect(plans[0].dinnerDishIds).toEqual([]);
      expect(plans[0].servings).toEqual({ d1: 2 });
    });

    it('loads day plans without servings field', async () => {
      const mockDb = {
        query: vi.fn().mockResolvedValue([
          {
            date: '2025-07-02',
            breakfast_dish_ids: '[]',
            lunch_dish_ids: '["d5"]',
            dinner_dish_ids: '["d6"]',
            servings: null,
          },
        ]),
      };

      await useDayPlanStore.getState().loadAll(mockDb as never);

      const plans = useDayPlanStore.getState().dayPlans;
      expect(plans).toHaveLength(1);
      expect(plans[0].servings).toBeUndefined();
    });

    it('does nothing when database returns empty rows', async () => {
      useDayPlanStore.setState({ dayPlans: [makePlan()] });

      const mockDb = {
        query: vi.fn().mockResolvedValue([]),
      };

      await useDayPlanStore.getState().loadAll(mockDb as never);

      expect(useDayPlanStore.getState().dayPlans).toHaveLength(1);
    });
  });
});
