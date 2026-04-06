import { describe, expect, it } from 'vitest';

import { ingredientEditDefaults, ingredientEditSchema } from '../ingredientEditSchema';

describe('ingredientEditSchema', () => {
  it('rejects default data (empty name/unit)', () => {
    const result = ingredientEditSchema.safeParse(ingredientEditDefaults);
    expect(result.success).toBe(false);
  });

  it('validates data with name and unit filled', () => {
    const data = { ...ingredientEditDefaults, name: { vi: 'Gà' }, unit: { vi: 'g' } };
    const result = ingredientEditSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const data = { ...ingredientEditDefaults, name: { vi: '' } };
    const result = ingredientEditSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects empty unit', () => {
    const data = { ...ingredientEditDefaults, unit: { vi: '' } };
    const result = ingredientEditSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects negative nutrition values', () => {
    const data = { ...ingredientEditDefaults, name: { vi: 'Gà' }, unit: { vi: 'g' }, caloriesPer100: -1 };
    const result = ingredientEditSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('accepts zero nutrition values', () => {
    const data = { ...ingredientEditDefaults, name: { vi: 'Nước' }, unit: { vi: 'ml' } };
    const result = ingredientEditSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('handles empty string nutrition inputs (treated as invalid)', () => {
    const data = { ...ingredientEditDefaults, name: { vi: 'Gà' }, unit: { vi: 'g' }, caloriesPer100: '' };
    const result = ingredientEditSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('coerces string numbers to numbers', () => {
    const data = {
      name: { vi: 'Gà' },
      unit: { vi: 'g' },
      caloriesPer100: '165',
      proteinPer100: '31',
      carbsPer100: '0',
      fatPer100: '3.6',
      fiberPer100: '0',
    };
    const result = ingredientEditSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.caloriesPer100).toBe(165);
      expect(result.data.proteinPer100).toBe(31);
    }
  });

  it('rejects NaN values', () => {
    const data = { ...ingredientEditDefaults, name: { vi: 'Gà' }, unit: { vi: 'g' }, caloriesPer100: 'abc' };
    const result = ingredientEditSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects calories exceeding max (999)', () => {
    const data = { ...ingredientEditDefaults, name: { vi: 'Gà' }, unit: { vi: 'g' }, caloriesPer100: 1000 };
    const result = ingredientEditSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('accepts calories at max boundary (999)', () => {
    const data = { ...ingredientEditDefaults, name: { vi: 'Dầu' }, unit: { vi: 'ml' }, caloriesPer100: 999 };
    const result = ingredientEditSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects protein exceeding max (100)', () => {
    const data = { ...ingredientEditDefaults, name: { vi: 'Gà' }, unit: { vi: 'g' }, proteinPer100: 101 };
    const result = ingredientEditSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects carbs exceeding max (100)', () => {
    const data = { ...ingredientEditDefaults, name: { vi: 'Gà' }, unit: { vi: 'g' }, carbsPer100: 101 };
    const result = ingredientEditSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects fat exceeding max (100)', () => {
    const data = { ...ingredientEditDefaults, name: { vi: 'Gà' }, unit: { vi: 'g' }, fatPer100: 101 };
    const result = ingredientEditSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects fiber exceeding max (100)', () => {
    const data = { ...ingredientEditDefaults, name: { vi: 'Gà' }, unit: { vi: 'g' }, fiberPer100: 101 };
    const result = ingredientEditSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('accepts macros at max boundary (100)', () => {
    const data = {
      ...ingredientEditDefaults,
      name: { vi: 'Test' },
      unit: { vi: 'g' },
      proteinPer100: 100,
      carbsPer100: 100,
      fatPer100: 100,
      fiberPer100: 100,
    };
    const result = ingredientEditSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});
