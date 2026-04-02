import { describe, expect, it } from 'vitest';

import {
  createGoalFieldsSchema,
  GOAL_TYPE_VALUES,
  RATE_OF_CHANGE_VALUES,
  validateTargetWeight,
} from '@/schemas/goalValidation';

describe('goalValidation', () => {
  describe('validateTargetWeight', () => {
    describe('maintain', () => {
      it('returns null regardless of target/current weight', () => {
        expect(validateTargetWeight('maintain', 80, 90)).toBeNull();
        expect(validateTargetWeight('maintain', 80, 70)).toBeNull();
        expect(validateTargetWeight('maintain', undefined, undefined)).toBeNull();
        expect(validateTargetWeight('maintain', 80, undefined)).toBeNull();
      });
    });

    describe('cut', () => {
      it('returns null when target < current', () => {
        expect(validateTargetWeight('cut', 80, 75)).toBeNull();
      });

      it('returns error when target === current', () => {
        expect(validateTargetWeight('cut', 80, 80)).toBe('onboarding.validation.cutTargetTooHigh');
      });

      it('returns error when target > current', () => {
        expect(validateTargetWeight('cut', 80, 85)).toBe('onboarding.validation.cutTargetTooHigh');
      });

      it('returns null when target is undefined', () => {
        expect(validateTargetWeight('cut', 80, undefined)).toBeNull();
      });

      it('returns null when current weight is undefined', () => {
        expect(validateTargetWeight('cut', undefined, 75)).toBeNull();
      });

      it('handles decimal weights correctly', () => {
        expect(validateTargetWeight('cut', 80.5, 80.4)).toBeNull();
        expect(validateTargetWeight('cut', 80.5, 80.5)).toBe('onboarding.validation.cutTargetTooHigh');
        expect(validateTargetWeight('cut', 80.5, 80.6)).toBe('onboarding.validation.cutTargetTooHigh');
      });
    });

    describe('bulk', () => {
      it('returns null when target > current', () => {
        expect(validateTargetWeight('bulk', 70, 75)).toBeNull();
      });

      it('returns error when target === current', () => {
        expect(validateTargetWeight('bulk', 70, 70)).toBe('onboarding.validation.bulkTargetTooLow');
      });

      it('returns error when target < current', () => {
        expect(validateTargetWeight('bulk', 70, 65)).toBe('onboarding.validation.bulkTargetTooLow');
      });

      it('returns null when target is undefined', () => {
        expect(validateTargetWeight('bulk', 70, undefined)).toBeNull();
      });

      it('returns null when current weight is undefined', () => {
        expect(validateTargetWeight('bulk', undefined, 75)).toBeNull();
      });

      it('handles decimal weights correctly', () => {
        expect(validateTargetWeight('bulk', 70.5, 70.6)).toBeNull();
        expect(validateTargetWeight('bulk', 70.5, 70.5)).toBe('onboarding.validation.bulkTargetTooLow');
        expect(validateTargetWeight('bulk', 70.5, 70.4)).toBe('onboarding.validation.bulkTargetTooLow');
      });
    });
  });

  describe('createGoalFieldsSchema', () => {
    const schema = createGoalFieldsSchema(() => 80);

    it('passes for maintain with no target weight', () => {
      const result = schema.safeParse({ goalType: 'maintain' });
      expect(result.success).toBe(true);
    });

    it('passes for maintain even with target weight set', () => {
      const result = schema.safeParse({ goalType: 'maintain', targetWeightKg: 90 });
      expect(result.success).toBe(true);
    });

    it('passes for cut with target < current', () => {
      const result = schema.safeParse({ goalType: 'cut', targetWeightKg: 75 });
      expect(result.success).toBe(true);
    });

    it('fails for cut with target >= current', () => {
      const result = schema.safeParse({ goalType: 'cut', targetWeightKg: 85 });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('targetWeightKg'));
        expect(issue).toBeDefined();
        expect(issue?.message).toBe('onboarding.validation.cutTargetTooHigh');
      }
    });

    it('fails for cut with target === current', () => {
      const result = schema.safeParse({ goalType: 'cut', targetWeightKg: 80 });
      expect(result.success).toBe(false);
    });

    it('passes for bulk with target > current', () => {
      const result = schema.safeParse({ goalType: 'bulk', targetWeightKg: 85 });
      expect(result.success).toBe(true);
    });

    it('fails for bulk with target <= current', () => {
      const result = schema.safeParse({ goalType: 'bulk', targetWeightKg: 75 });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('targetWeightKg'));
        expect(issue).toBeDefined();
        expect(issue?.message).toBe('onboarding.validation.bulkTargetTooLow');
      }
    });

    it('fails for bulk with target === current', () => {
      const result = schema.safeParse({ goalType: 'bulk', targetWeightKg: 80 });
      expect(result.success).toBe(false);
    });

    it('validates target weight range (min 30)', () => {
      const result = schema.safeParse({ goalType: 'cut', targetWeightKg: 10 });
      expect(result.success).toBe(false);
    });

    it('validates target weight range (max 300)', () => {
      const result = schema.safeParse({ goalType: 'bulk', targetWeightKg: 400 });
      expect(result.success).toBe(false);
    });

    it('accepts optional target weight for cut/bulk', () => {
      const result = schema.safeParse({ goalType: 'cut' });
      expect(result.success).toBe(true);
    });

    it('validates goalType enum', () => {
      const result = schema.safeParse({ goalType: 'invalid' as never });
      expect(result.success).toBe(false);
    });

    it('accepts rateOfChange values', () => {
      for (const rate of RATE_OF_CHANGE_VALUES) {
        const result = schema.safeParse({ goalType: 'maintain', rateOfChange: rate });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid rateOfChange', () => {
      const result = schema.safeParse({ goalType: 'maintain', rateOfChange: 'fast' as never });
      expect(result.success).toBe(false);
    });

    it('uses dynamic current weight from getter', () => {
      let dynamicWeight = 80;
      const dynamicSchema = createGoalFieldsSchema(() => dynamicWeight);

      // Initially 80, cut to 75 should pass
      expect(dynamicSchema.safeParse({ goalType: 'cut', targetWeightKg: 75 }).success).toBe(true);

      // Change current weight to 70, cut to 75 should now fail
      dynamicWeight = 70;
      expect(dynamicSchema.safeParse({ goalType: 'cut', targetWeightKg: 75 }).success).toBe(false);
    });

    it('handles undefined currentWeight from getter gracefully', () => {
      const noWeightSchema = createGoalFieldsSchema(() => undefined);
      // Should pass because we can't validate without current weight
      expect(noWeightSchema.safeParse({ goalType: 'cut', targetWeightKg: 75 }).success).toBe(true);
      expect(noWeightSchema.safeParse({ goalType: 'bulk', targetWeightKg: 75 }).success).toBe(true);
    });
  });

  describe('constants', () => {
    it('exports correct goal type values', () => {
      expect(GOAL_TYPE_VALUES).toEqual(['cut', 'maintain', 'bulk']);
    });

    it('exports correct rate of change values', () => {
      expect(RATE_OF_CHANGE_VALUES).toEqual(['conservative', 'moderate', 'aggressive']);
    });
  });
});
