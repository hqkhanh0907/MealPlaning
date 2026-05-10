import {
  pickKeyMetric,
  routeKeyMetric,
  visibleMetrics,
  type KeyMetricVariant,
} from './key-metric-router';
import type { UserProfile } from '../models/user-profile.model';

type Level = UserProfile['fitness_level'];
type Goal = UserProfile['goal'];

describe('key-metric-router', () => {
  describe('routeKeyMetric — variant matrix', () => {
    const cases: [Level, Goal, KeyMetricVariant][] = [
      // Beginner overrides any goal.
      ['beginner', 'lose_weight', 'beginner'],
      ['beginner', 'gain_muscle', 'beginner'],
      ['beginner', 'maintain', 'beginner'],
      ['beginner', 'performance', 'beginner'],
      // Intermediate × goal.
      ['intermediate', 'lose_weight', 'lose'],
      ['intermediate', 'gain_muscle', 'gain'],
      ['intermediate', 'maintain', 'maintain'],
      ['intermediate', 'performance', 'gain'], // Phase 4 fallback
      // Advanced overrides any goal.
      ['advanced', 'lose_weight', 'advanced'],
      ['advanced', 'gain_muscle', 'advanced'],
      ['advanced', 'maintain', 'advanced'],
      ['advanced', 'performance', 'advanced'],
    ];

    for (const [level, goal, expected] of cases) {
      it(`${level} + ${goal} → ${expected}`, () => {
        expect(routeKeyMetric(level, goal)).toBe(expected);
      });
    }

    it('null/undefined level + goal → beginner (safe default)', () => {
      expect(routeKeyMetric(null, null)).toBe('beginner');
      expect(routeKeyMetric(undefined, undefined)).toBe('beginner');
    });

    it('intermediate level + null goal → beginner (safest fallback)', () => {
      expect(routeKeyMetric('intermediate', null)).toBe('beginner');
    });
  });

  describe('visibleMetrics — order matters (primary first)', () => {
    it('beginner → [calories]', () => {
      expect(visibleMetrics('beginner')).toEqual(['calories']);
    });
    it('lose → [calories, protein]', () => {
      expect(visibleMetrics('lose')).toEqual(['calories', 'protein']);
    });
    it('gain → [protein, calories]', () => {
      expect(visibleMetrics('gain')).toEqual(['protein', 'calories']);
    });
    it('maintain → [calories, protein]', () => {
      expect(visibleMetrics('maintain')).toEqual(['calories', 'protein']);
    });
    it('advanced → [calories, protein, carbs, fat]', () => {
      expect(visibleMetrics('advanced')).toEqual(['calories', 'protein', 'carbs', 'fat']);
    });
  });

  describe('pickKeyMetric — convenience extractor', () => {
    function makeProfile(level: Level, goal: Goal): UserProfile {
      return {
        id: 'p1',
        height_cm: 170,
        weight_kg: 70,
        age: 30,
        gender: 'male',
        goal,
        fitness_level: level,
        activity_factor: 1.55,
        bmr: 1700,
        tdee: 2635,
        target_calories: 2000,
        target_protein: 120,
        target_carbs: 250,
        target_fat: 65,
        theme: 'light',
        notif_morning: 1,
        notif_lunch: 1,
        notif_evening: 1,
        notif_weekly: 1,
        onboarding_completed: 1,
        created_at: '2026-01-01',
        updated_at: null,
      };
    }

    it('null profile → [calories, calories] (beginner duplicate)', () => {
      expect(pickKeyMetric(null)).toEqual(['calories', 'calories']);
    });

    it('intermediate gain_muscle → [protein, calories]', () => {
      expect(pickKeyMetric(makeProfile('intermediate', 'gain_muscle'))).toEqual([
        'protein',
        'calories',
      ]);
    });

    it('beginner profile → primary=calories, secondary=calories (only one metric)', () => {
      expect(pickKeyMetric(makeProfile('beginner', 'lose_weight'))).toEqual([
        'calories',
        'calories',
      ]);
    });

    it('advanced profile → [calories, protein] (first two of four)', () => {
      expect(pickKeyMetric(makeProfile('advanced', 'maintain'))).toEqual(['calories', 'protein']);
    });
  });
});
