import { deriveInsight } from '../features/fitness/hooks/useFitnessNutritionBridge';
import type { FitnessNutritionInsight } from '../features/fitness/hooks/useFitnessNutritionBridge';

describe('deriveInsight', () => {
  it('returns deficit-on-training when calories < 75% budget on training day', () => {
    const result = deriveInsight(
      true,
      3,
      2500,
      1000,
      120,
      112,
    );
    expect(result).not.toBeNull();
    expect((result as FitnessNutritionInsight).type).toBe('deficit-on-training');
    expect((result as FitnessNutritionInsight).severity).toBe('warning');
    expect((result as FitnessNutritionInsight).title).toContain('Thiếu hụt');
  });

  it('returns null on training day when calories are adequate', () => {
    const result = deriveInsight(
      true,
      3,
      2500,
      2200,
      120,
      112,
    );
    expect(result).toBeNull();
  });

  it('returns protein-low when protein < 60% target', () => {
    const result = deriveInsight(
      false,
      2,
      2500,
      2200,
      30,
      112,
    );
    expect(result).not.toBeNull();
    expect((result as FitnessNutritionInsight).type).toBe('protein-low');
    expect((result as FitnessNutritionInsight).severity).toBe('warning');
    expect((result as FitnessNutritionInsight).message).toContain('30g');
  });

  it('returns recovery-day on rest day with high weekly load', () => {
    const result = deriveInsight(
      false,
      5,
      2500,
      2200,
      120,
      112,
    );
    expect(result).not.toBeNull();
    expect((result as FitnessNutritionInsight).type).toBe('recovery-day');
    expect((result as FitnessNutritionInsight).severity).toBe('info');
    expect((result as FitnessNutritionInsight).message).toContain('5 buổi tập');
  });

  it('returns null when everything is balanced', () => {
    const result = deriveInsight(
      false,
      2,
      2500,
      2200,
      120,
      112,
    );
    expect(result).toBeNull();
  });

  it('returns null when protein target is zero', () => {
    const result = deriveInsight(
      false,
      2,
      2500,
      2200,
      0,
      0,
    );
    expect(result).toBeNull();
  });

  it('prioritizes deficit-on-training over protein-low', () => {
    const result = deriveInsight(
      true,
      5,
      2500,
      500,
      10,
      112,
    );
    expect(result).not.toBeNull();
    expect((result as FitnessNutritionInsight).type).toBe('deficit-on-training');
  });

  it('prioritizes protein-low over recovery-day', () => {
    const result = deriveInsight(
      false,
      5,
      2500,
      2200,
      10,
      112,
    );
    expect(result).not.toBeNull();
    expect((result as FitnessNutritionInsight).type).toBe('protein-low');
  });

  it('returns recovery-day with exactly 4 weekly workouts', () => {
    const result = deriveInsight(
      false,
      4,
      2500,
      2200,
      120,
      112,
    );
    expect(result).not.toBeNull();
    expect((result as FitnessNutritionInsight).type).toBe('recovery-day');
  });

  it('returns null on rest day with 3 weekly workouts (below threshold)', () => {
    const result = deriveInsight(
      false,
      3,
      2500,
      2200,
      120,
      112,
    );
    expect(result).toBeNull();
  });
});
