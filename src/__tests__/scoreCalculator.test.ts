import { describe, expect, it } from 'vitest';

import {
  calculateCalorieScore,
  calculateDailyScore,
  calculateProteinScore,
  calculateStreakBonus,
  calculateWeightLogScore,
  calculateWorkoutScore,
  getScoreColor,
} from '../features/dashboard/utils/scoreCalculator';

describe('scoreCalculator', () => {
  // ── 1. calculateCalorieScore — ≤50 deviation → 100 ──
  describe('calculateCalorieScore', () => {
    it('returns 100 when deviation is exactly 0', () => {
      expect(calculateCalorieScore(2000, 2000)).toBe(100);
    });

    it('returns 100 when deviation ≤ 50 kcal', () => {
      expect(calculateCalorieScore(2000, 2030)).toBe(100);
      expect(calculateCalorieScore(2050, 2000)).toBe(100);
      expect(calculateCalorieScore(2000, 2050)).toBe(100);
    });

    // ── 2. calculateCalorieScore — ≤100 deviation → 90 ──
    it('returns 90 when deviation ≤ 100 kcal', () => {
      expect(calculateCalorieScore(2000, 2080)).toBe(90);
      expect(calculateCalorieScore(1900, 2000)).toBe(90);
      expect(calculateCalorieScore(2000, 2100)).toBe(90);
    });

    // ── 3. calculateCalorieScore — ≤200 → 70, ≤500 → 40, >500 → 10 ──
    it('returns 70 when deviation ≤ 200 kcal', () => {
      expect(calculateCalorieScore(2000, 2150)).toBe(70);
      expect(calculateCalorieScore(2000, 2200)).toBe(70);
    });

    it('returns 40 when deviation ≤ 500 kcal', () => {
      expect(calculateCalorieScore(2000, 2400)).toBe(40);
      expect(calculateCalorieScore(2000, 2500)).toBe(40);
    });

    it('returns 10 when deviation > 500 kcal', () => {
      expect(calculateCalorieScore(2000, 2600)).toBe(10);
      expect(calculateCalorieScore(2000, 3000)).toBe(10);
    });
  });

  // ── 4. calculateProteinScore — ratio ≥1.0 → 100 ──
  describe('calculateProteinScore', () => {
    it('returns 100 when ratio ≥ 1.0', () => {
      expect(calculateProteinScore(150, 150)).toBe(100);
      expect(calculateProteinScore(200, 150)).toBe(100);
    });

    // ── 5. calculateProteinScore — ratio thresholds ──
    it('returns 80 when ratio ≥ 0.9', () => {
      expect(calculateProteinScore(95, 100)).toBe(80);
      expect(calculateProteinScore(90, 100)).toBe(80);
    });

    it('returns 60 when ratio ≥ 0.7', () => {
      expect(calculateProteinScore(75, 100)).toBe(60);
      expect(calculateProteinScore(70, 100)).toBe(60);
    });

    it('returns 40 when ratio ≥ 0.5', () => {
      expect(calculateProteinScore(55, 100)).toBe(40);
      expect(calculateProteinScore(50, 100)).toBe(40);
    });

    it('returns 20 when ratio < 0.5', () => {
      expect(calculateProteinScore(30, 100)).toBe(20);
      expect(calculateProteinScore(0, 100)).toBe(20);
    });

    it('returns 100 when target is 0 or negative', () => {
      expect(calculateProteinScore(50, 0)).toBe(100);
      expect(calculateProteinScore(0, -10)).toBe(100);
    });
  });

  // ── 6. calculateWorkoutScore — completed → 100 ──
  describe('calculateWorkoutScore', () => {
    it('returns 100 when workout is completed', () => {
      expect(calculateWorkoutScore(true, false, false)).toBe(100);
      expect(calculateWorkoutScore(true, true, true)).toBe(100);
    });

    // ── 7. calculateWorkoutScore — rest day → 100 ──
    it('returns 100 on rest day', () => {
      expect(calculateWorkoutScore(false, true, false)).toBe(100);
      expect(calculateWorkoutScore(false, true, true)).toBe(100);
    });

    // ── 8. calculateWorkoutScore — not yet (before 20:00) → 50 ──
    it('returns 50 before 20:00 when not completed and not rest day', () => {
      expect(calculateWorkoutScore(false, false, true)).toBe(50);
    });

    // ── 9. calculateWorkoutScore — missed (after 20:00) → 0 ──
    it('returns 0 when missed after 20:00', () => {
      expect(calculateWorkoutScore(false, false, false)).toBe(0);
    });
  });

  // ── 10. calculateWeightLogScore — today/yesterday/none ──
  describe('calculateWeightLogScore', () => {
    it('returns 100 when logged today', () => {
      expect(calculateWeightLogScore(true, false)).toBe(100);
      expect(calculateWeightLogScore(true, true)).toBe(100);
    });

    it('returns 50 when logged yesterday only', () => {
      expect(calculateWeightLogScore(false, true)).toBe(50);
    });

    it('returns 0 when not logged', () => {
      expect(calculateWeightLogScore(false, false)).toBe(0);
    });
  });

  // ── 11. calculateStreakBonus — min(days×5, 100) ──
  describe('calculateStreakBonus', () => {
    it('returns days × 5', () => {
      expect(calculateStreakBonus(0)).toBe(0);
      expect(calculateStreakBonus(1)).toBe(5);
      expect(calculateStreakBonus(5)).toBe(25);
      expect(calculateStreakBonus(10)).toBe(50);
    });

    it('caps at 100', () => {
      expect(calculateStreakBonus(20)).toBe(100);
      expect(calculateStreakBonus(30)).toBe(100);
    });

    it('returns 0 for negative days', () => {
      expect(calculateStreakBonus(-5)).toBe(0);
      expect(calculateStreakBonus(-1)).toBe(0);
    });
  });

  // ── 12–15. calculateDailyScore ──
  describe('calculateDailyScore', () => {
    // ── 12. full data → weighted sum ──
    it('calculates weighted sum with full data', () => {
      const result = calculateDailyScore({
        actualCalories: 2000,
        targetCalories: 2000,
        actualProteinG: 150,
        targetProteinG: 150,
        workoutCompleted: true,
        isRestDay: false,
        isBeforeEvening: true,
        weightLoggedToday: true,
        weightLoggedYesterday: false,
        streakDays: 20,
      });

      // All factors = 100, streak = min(100,100) = 100
      // 100×0.30 + 100×0.25 + 100×0.25 + 100×0.10 + 100×0.10 = 100
      expect(result.totalScore).toBe(100);
      expect(result.factors.calories).toBe(100);
      expect(result.factors.protein).toBe(100);
      expect(result.factors.workout).toBe(100);
      expect(result.factors.weightLog).toBe(100);
      expect(result.factors.streak).toBe(100);
      expect(result.availableFactors).toBe(5);
      expect(result.color).toBe('emerald');
    });

    it('calculates weighted sum with mixed scores', () => {
      const result = calculateDailyScore({
        actualCalories: 2000,
        targetCalories: 2000,
        actualProteinG: 150,
        targetProteinG: 150,
        workoutCompleted: true,
        isRestDay: false,
        isBeforeEvening: true,
        weightLoggedToday: false,
        weightLoggedYesterday: false,
        streakDays: 20,
      });

      // cal=100, protein=100, workout=100, weightLog=0, streak=100
      // 100×0.30 + 100×0.25 + 100×0.25 + 0×0.10 + 100×0.10 = 90
      expect(result.totalScore).toBe(90);
      expect(result.factors.weightLog).toBe(0);
      expect(result.availableFactors).toBe(5);
      expect(result.color).toBe('emerald');
    });

    // ── 13. null handling → redistributes weights ──
    it('redistributes weights when factors are null', () => {
      const result = calculateDailyScore({
        actualCalories: 2000,
        targetCalories: 2000,
        workoutCompleted: true,
        streakDays: 20,
      });

      // cal=100, workout=100, streak=100
      // All available = 100, redistributed total = 100
      expect(result.totalScore).toBe(100);
      expect(result.availableFactors).toBe(3);
      expect(result.factors.calories).toBe(100);
      expect(result.factors.protein).toBeNull();
      expect(result.factors.workout).toBe(100);
      expect(result.factors.weightLog).toBeNull();
      expect(result.factors.streak).toBe(100);
      expect(result.color).toBe('emerald');
    });

    it('redistribution changes total compared to zero-valued factor', () => {
      // With weightLog = 0 present in full data
      const fullResult = calculateDailyScore({
        actualCalories: 2000,
        targetCalories: 2000,
        actualProteinG: 150,
        targetProteinG: 150,
        workoutCompleted: true,
        weightLoggedToday: false,
        weightLoggedYesterday: false,
        streakDays: 20,
      });

      // Without weightLog data (excluded)
      const partialResult = calculateDailyScore({
        actualCalories: 2000,
        targetCalories: 2000,
        actualProteinG: 150,
        targetProteinG: 150,
        workoutCompleted: true,
        streakDays: 20,
      });

      // Full: 100×0.30 + 100×0.25 + 100×0.25 + 0×0.10 + 100×0.10 = 90
      expect(fullResult.totalScore).toBe(90);
      // Partial: all available=100, redistributed=100
      expect(partialResult.totalScore).toBe(100);
      expect(partialResult.totalScore).toBeGreaterThan(fullResult.totalScore);
    });

    // ── 14. morning (only streak) → uses only available factors ──
    it('uses only available factors in the morning', () => {
      const result = calculateDailyScore({
        streakDays: 7,
      });

      // streak = min(35, 100) = 35
      // Only streak available, weight = 0.10, redistributed to 100%
      // total = 35
      expect(result.totalScore).toBe(35);
      expect(result.factors.calories).toBeNull();
      expect(result.factors.protein).toBeNull();
      expect(result.factors.workout).toBeNull();
      expect(result.factors.weightLog).toBeNull();
      expect(result.factors.streak).toBe(35);
      expect(result.availableFactors).toBe(1);
      expect(result.color).toBe('slate');
    });

    // ── 15. all null → returns minimum score (not 0) ──
    it('returns minimum score when all inputs are null', () => {
      const result = calculateDailyScore({});

      expect(result.totalScore).toBe(50);
      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.factors.calories).toBeNull();
      expect(result.factors.protein).toBeNull();
      expect(result.factors.workout).toBeNull();
      expect(result.factors.weightLog).toBeNull();
      expect(result.factors.streak).toBeNull();
      expect(result.availableFactors).toBe(0);
      expect(result.color).toBe('amber');
    });

    it('never produces a total score of 0 even when all factors score 0', () => {
      const result = calculateDailyScore({
        workoutCompleted: false,
        isRestDay: false,
        isBeforeEvening: false,
        weightLoggedToday: false,
        weightLoggedYesterday: false,
        streakDays: 0,
      });

      // workout=0, weightLog=0, streak=0 → raw=0 → clamped to 1
      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.totalScore).toBe(1);
    });

    it('handles weightLog from only yesterday', () => {
      const result = calculateDailyScore({
        weightLoggedYesterday: true,
      });

      expect(result.factors.weightLog).toBe(50);
      expect(result.availableFactors).toBe(1);
    });

    it('defaults isRestDay to false and isBeforeEvening to true', () => {
      const result = calculateDailyScore({
        workoutCompleted: false,
      });

      // defaults: isRestDay=false, isBeforeEvening=true → notYet = 50
      expect(result.factors.workout).toBe(50);
    });

    it('handles weightLog with only today provided', () => {
      const result = calculateDailyScore({
        weightLoggedToday: true,
      });

      expect(result.factors.weightLog).toBe(100);
      expect(result.availableFactors).toBe(1);
    });

    it('excludes workout factor when skipWorkoutFactor is true (FIX-09)', () => {
      const result = calculateDailyScore({
        actualCalories: 2000,
        targetCalories: 2000,
        actualProteinG: 150,
        targetProteinG: 150,
        workoutCompleted: false,
        isRestDay: false,
        isBeforeEvening: false,
        weightLoggedToday: true,
        streakDays: 10,
        skipWorkoutFactor: true,
      });

      // workout should be excluded
      expect(result.factors.workout).toBeNull();
      // Other factors: cal=100, protein=100, weightLog=100, streak=50
      // Available: 4 (not 5), weights redistributed
      expect(result.availableFactors).toBe(4);
      // Without workout, score should be higher than if workout=0 was included
      expect(result.totalScore).toBeGreaterThan(50);
    });

    it('skipWorkoutFactor redistributes weights to remaining factors (FIX-09)', () => {
      // With workout included (and missed)
      const withWorkout = calculateDailyScore({
        actualCalories: 2000,
        targetCalories: 2000,
        workoutCompleted: false,
        isRestDay: false,
        isBeforeEvening: false,
        skipWorkoutFactor: false,
      });

      // With workout excluded
      const withoutWorkout = calculateDailyScore({
        actualCalories: 2000,
        targetCalories: 2000,
        workoutCompleted: false,
        isRestDay: false,
        isBeforeEvening: false,
        skipWorkoutFactor: true,
      });

      // Without missed workout penalty, score should be higher
      expect(withoutWorkout.totalScore).toBeGreaterThan(withWorkout.totalScore);
      expect(withoutWorkout.factors.workout).toBeNull();
      expect(withWorkout.factors.workout).toBe(0); // missed
    });
  });

  // ── 16. getScoreColor ──
  describe('getScoreColor', () => {
    it('returns emerald for score ≥ 80', () => {
      expect(getScoreColor(80)).toBe('emerald');
      expect(getScoreColor(100)).toBe('emerald');
      expect(getScoreColor(95)).toBe('emerald');
    });

    it('returns amber for score 50-79', () => {
      expect(getScoreColor(50)).toBe('amber');
      expect(getScoreColor(65)).toBe('amber');
      expect(getScoreColor(79)).toBe('amber');
    });

    it('returns slate for score < 50', () => {
      expect(getScoreColor(0)).toBe('slate');
      expect(getScoreColor(1)).toBe('slate');
      expect(getScoreColor(49)).toBe('slate');
    });

    // ── 17. Never returns red ──
    it('never returns red for any score value', () => {
      const testScores = [0, 1, 10, 25, 49, 50, 65, 79, 80, 95, 100];
      for (const score of testScores) {
        const color = getScoreColor(score);
        expect(color).not.toBe('red');
        expect(['emerald', 'amber', 'slate']).toContain(color);
      }
    });
  });
});
