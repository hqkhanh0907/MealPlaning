import { describe, it, expect } from 'vitest';
import {
  getWeekRepScheme,
  getOverloadIncrement,
  isDeloadWeek,
  getDeloadScheme,
  shouldAutoDeload,
  applyDeloadReduction,
  GOAL_REP_SCHEMES,
  OVERLOAD_RATES,
} from '../features/fitness/utils/periodization';

describe('periodization', () => {
  describe('GOAL_REP_SCHEMES', () => {
    it('defines strength scheme', () => {
      expect(GOAL_REP_SCHEMES.strength).toEqual({
        repsMin: 3,
        repsMax: 5,
        intensityPct: 0.85,
        restSeconds: 240,
      });
    });

    it('defines hypertrophy scheme', () => {
      expect(GOAL_REP_SCHEMES.hypertrophy).toEqual({
        repsMin: 8,
        repsMax: 12,
        intensityPct: 0.72,
        restSeconds: 105,
      });
    });

    it('defines endurance scheme', () => {
      expect(GOAL_REP_SCHEMES.endurance).toEqual({
        repsMin: 15,
        repsMax: 20,
        intensityPct: 0.57,
        restSeconds: 45,
      });
    });

    it('general goal defaults to hypertrophy rep range and intensity', () => {
      const general = GOAL_REP_SCHEMES.general;
      const hypertrophy = GOAL_REP_SCHEMES.hypertrophy;
      expect(general.repsMin).toBe(hypertrophy.repsMin);
      expect(general.repsMax).toBe(hypertrophy.repsMax);
      expect(general.intensityPct).toBe(hypertrophy.intensityPct);
      expect(general.restSeconds).toBe(90);
    });
  });

  describe('OVERLOAD_RATES', () => {
    it('defines beginner overload rate', () => {
      expect(OVERLOAD_RATES.beginner).toEqual({
        upperBodyKg: 2.5,
        lowerBodyKg: 5.0,
        perWeeks: 1,
      });
    });

    it('defines intermediate overload rate', () => {
      expect(OVERLOAD_RATES.intermediate).toEqual({
        upperBodyKg: 1.25,
        lowerBodyKg: 2.5,
        perWeeks: 2,
      });
    });

    it('defines advanced overload rate', () => {
      expect(OVERLOAD_RATES.advanced).toEqual({
        upperBodyKg: 1.25,
        lowerBodyKg: 2.5,
        perWeeks: 4,
      });
    });
  });

  describe('getWeekRepScheme', () => {
    describe('linear model', () => {
      it('returns the same rep scheme every week for strength', () => {
        const week1 = getWeekRepScheme('linear', 'strength', 1, 1);
        const week5 = getWeekRepScheme('linear', 'strength', 5, 3);
        const week10 = getWeekRepScheme('linear', 'strength', 10, 2);
        expect(week1).toEqual(GOAL_REP_SCHEMES.strength);
        expect(week5).toEqual(GOAL_REP_SCHEMES.strength);
        expect(week10).toEqual(GOAL_REP_SCHEMES.strength);
      });

      it('returns the goal-specific scheme for each goal', () => {
        expect(getWeekRepScheme('linear', 'hypertrophy', 1, 1)).toEqual(
          GOAL_REP_SCHEMES.hypertrophy,
        );
        expect(getWeekRepScheme('linear', 'endurance', 3, 2)).toEqual(
          GOAL_REP_SCHEMES.endurance,
        );
        expect(getWeekRepScheme('linear', 'general', 2, 1)).toEqual(
          GOAL_REP_SCHEMES.general,
        );
      });

      it('returns a copy, not the original reference', () => {
        const scheme = getWeekRepScheme('linear', 'strength', 1, 1);
        expect(scheme).toEqual(GOAL_REP_SCHEMES.strength);
        expect(scheme).not.toBe(GOAL_REP_SCHEMES.strength);
      });
    });

    describe('undulating model', () => {
      it('rotates Heavy/Medium/Light by session within week', () => {
        const session1 = getWeekRepScheme('undulating', 'general', 1, 1);
        const session2 = getWeekRepScheme('undulating', 'general', 1, 2);
        const session3 = getWeekRepScheme('undulating', 'general', 1, 3);

        expect(session1).toEqual(GOAL_REP_SCHEMES.strength);
        expect(session2).toEqual(GOAL_REP_SCHEMES.hypertrophy);
        expect(session3).toEqual(GOAL_REP_SCHEMES.endurance);
      });

      it('wraps around after 3 sessions', () => {
        const session4 = getWeekRepScheme('undulating', 'general', 1, 4);
        const session5 = getWeekRepScheme('undulating', 'general', 1, 5);
        const session6 = getWeekRepScheme('undulating', 'general', 1, 6);

        expect(session4).toEqual(GOAL_REP_SCHEMES.strength);
        expect(session5).toEqual(GOAL_REP_SCHEMES.hypertrophy);
        expect(session6).toEqual(GOAL_REP_SCHEMES.endurance);
      });

      it('uses the same rotation regardless of week number', () => {
        const w1s1 = getWeekRepScheme('undulating', 'hypertrophy', 1, 1);
        const w5s1 = getWeekRepScheme('undulating', 'hypertrophy', 5, 1);
        expect(w1s1).toEqual(w5s1);
      });
    });

    describe('block model', () => {
      it('returns hypertrophy scheme for weeks 1-4', () => {
        expect(getWeekRepScheme('block', 'general', 1, 1)).toEqual(
          GOAL_REP_SCHEMES.hypertrophy,
        );
        expect(getWeekRepScheme('block', 'general', 4, 1)).toEqual(
          GOAL_REP_SCHEMES.hypertrophy,
        );
      });

      it('returns strength scheme for weeks 5-8', () => {
        expect(getWeekRepScheme('block', 'general', 5, 1)).toEqual(
          GOAL_REP_SCHEMES.strength,
        );
        expect(getWeekRepScheme('block', 'general', 8, 1)).toEqual(
          GOAL_REP_SCHEMES.strength,
        );
      });

      it('returns endurance scheme for weeks 9-12', () => {
        expect(getWeekRepScheme('block', 'general', 9, 1)).toEqual(
          GOAL_REP_SCHEMES.endurance,
        );
        expect(getWeekRepScheme('block', 'general', 12, 1)).toEqual(
          GOAL_REP_SCHEMES.endurance,
        );
      });

      it('cycles back to first phase after completing all phases', () => {
        expect(getWeekRepScheme('block', 'general', 13, 1)).toEqual(
          GOAL_REP_SCHEMES.hypertrophy,
        );
        expect(getWeekRepScheme('block', 'general', 16, 1)).toEqual(
          GOAL_REP_SCHEMES.hypertrophy,
        );
      });
    });
  });

  describe('getOverloadIncrement', () => {
    it('returns upper body increment for beginner', () => {
      expect(getOverloadIncrement('beginner', true)).toBe(2.5);
    });

    it('returns lower body increment for beginner', () => {
      expect(getOverloadIncrement('beginner', false)).toBe(5.0);
    });

    it('returns upper body increment for intermediate', () => {
      expect(getOverloadIncrement('intermediate', true)).toBe(1.25);
    });

    it('returns lower body increment for intermediate', () => {
      expect(getOverloadIncrement('intermediate', false)).toBe(2.5);
    });

    it('returns upper body increment for advanced', () => {
      expect(getOverloadIncrement('advanced', true)).toBe(1.25);
    });

    it('returns lower body increment for advanced', () => {
      expect(getOverloadIncrement('advanced', false)).toBe(2.5);
    });
  });

  describe('isDeloadWeek', () => {
    it('returns true for last week of a 4-week cycle', () => {
      expect(isDeloadWeek(4, 4)).toBe(true);
    });

    it('returns true for multiples of cycle length', () => {
      expect(isDeloadWeek(8, 4)).toBe(true);
      expect(isDeloadWeek(12, 4)).toBe(true);
    });

    it('returns false for non-deload weeks', () => {
      expect(isDeloadWeek(1, 4)).toBe(false);
      expect(isDeloadWeek(2, 4)).toBe(false);
      expect(isDeloadWeek(3, 4)).toBe(false);
      expect(isDeloadWeek(5, 4)).toBe(false);
    });

    it('works with different cycle lengths', () => {
      expect(isDeloadWeek(6, 6)).toBe(true);
      expect(isDeloadWeek(5, 6)).toBe(false);
      expect(isDeloadWeek(12, 6)).toBe(true);
    });

    it('returns false when planCycleWeeks is zero or negative', () => {
      expect(isDeloadWeek(4, 0)).toBe(false);
      expect(isDeloadWeek(4, -1)).toBe(false);
    });
  });

  describe('getDeloadScheme', () => {
    it('reduces volume by 40% and intensity by 10% for strength', () => {
      const deload = getDeloadScheme(GOAL_REP_SCHEMES.strength);
      expect(deload.repsMin).toBe(Math.round(3 * 0.6));
      expect(deload.repsMax).toBe(Math.round(5 * 0.6));
      expect(deload.intensityPct).toBeCloseTo(0.765, 3);
      expect(deload.restSeconds).toBe(240);
    });

    it('reduces volume by 40% and intensity by 10% for hypertrophy', () => {
      const deload = getDeloadScheme(GOAL_REP_SCHEMES.hypertrophy);
      expect(deload.repsMin).toBe(Math.round(8 * 0.6));
      expect(deload.repsMax).toBe(Math.round(12 * 0.6));
      expect(deload.intensityPct).toBeCloseTo(0.648, 3);
      expect(deload.restSeconds).toBe(105);
    });

    it('reduces volume by 40% and intensity by 10% for endurance', () => {
      const deload = getDeloadScheme(GOAL_REP_SCHEMES.endurance);
      expect(deload.repsMin).toBe(Math.round(15 * 0.6));
      expect(deload.repsMax).toBe(Math.round(20 * 0.6));
      expect(deload.intensityPct).toBeCloseTo(0.513, 3);
      expect(deload.restSeconds).toBe(45);
    });

    it('preserves rest seconds from original scheme', () => {
      const custom: import('../features/fitness/utils/periodization').RepScheme =
        {
          repsMin: 10,
          repsMax: 15,
          intensityPct: 0.8,
          restSeconds: 120,
        };
      const deload = getDeloadScheme(custom);
      expect(deload.restSeconds).toBe(120);
      expect(deload.repsMin).toBe(6);
      expect(deload.repsMax).toBe(9);
      expect(deload.intensityPct).toBeCloseTo(0.72, 3);
    });
  });

  describe('shouldAutoDeload', () => {
    it('triggers deload after 4 consecutive high-RPE weeks', () => {
      const result = shouldAutoDeload([8.5, 8.2, 8.8, 9.0]);
      expect(result.shouldDeload).toBe(true);
      expect(result.reason).toContain('4 consecutive weeks');
    });

    it('does NOT trigger deload with mixed intensity', () => {
      const result = shouldAutoDeload([8.5, 7.0, 8.8, 9.0]);
      expect(result.shouldDeload).toBe(false);
      expect(result.reason).toBe('');
    });

    it('triggers deload when exactly at threshold', () => {
      const result = shouldAutoDeload([8.0, 8.0, 8.0, 8.0]);
      expect(result.shouldDeload).toBe(true);
    });

    it('does NOT trigger with fewer than required consecutive weeks', () => {
      const result = shouldAutoDeload([8.5, 9.0, 8.2]);
      expect(result.shouldDeload).toBe(false);
    });

    it('only checks the last N weeks when more data is provided', () => {
      const result = shouldAutoDeload([6.0, 5.0, 8.5, 8.2, 8.8, 9.0]);
      expect(result.shouldDeload).toBe(true);
    });

    it('does NOT trigger when last N weeks include a low-RPE week', () => {
      const result = shouldAutoDeload([8.5, 8.2, 8.8, 9.0, 6.0]);
      expect(result.shouldDeload).toBe(false);
    });

    it('supports custom consecutiveHighWeeks parameter', () => {
      const result = shouldAutoDeload([9.0, 9.0], 2);
      expect(result.shouldDeload).toBe(true);
    });

    it('supports custom highRpeThreshold parameter', () => {
      const result = shouldAutoDeload([7.5, 7.5, 7.5, 7.5], 4, 7.5);
      expect(result.shouldDeload).toBe(true);
    });

    it('returns false for empty array', () => {
      const result = shouldAutoDeload([]);
      expect(result.shouldDeload).toBe(false);
    });

    it('includes threshold in reason string', () => {
      const result = shouldAutoDeload([9.0, 9.0, 9.0, 9.0]);
      expect(result.reason).toContain('8');
    });
  });

  describe('applyDeloadReduction', () => {
    it('reduces volume by 40% (default)', () => {
      expect(applyDeloadReduction(10)).toBe(6);
    });

    it('rounds to nearest integer', () => {
      expect(applyDeloadReduction(7)).toBe(4);
    });

    it('supports custom reduction percentage', () => {
      expect(applyDeloadReduction(10, 0.5)).toBe(5);
    });

    it('returns 0 for 0 volume', () => {
      expect(applyDeloadReduction(0)).toBe(0);
    });

    it('handles 100% reduction', () => {
      expect(applyDeloadReduction(10, 1.0)).toBe(0);
    });

    it('handles 0% reduction', () => {
      expect(applyDeloadReduction(10, 0)).toBe(10);
    });
  });
});
