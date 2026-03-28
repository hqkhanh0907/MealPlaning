import { describe, it, expect } from 'vitest';
import { ingredientEditSchema, ingredientEditDefaults } from '../ingredientEditSchema';

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
      name: { vi: 'Gà' }, unit: { vi: 'g' },
      caloriesPer100: '165', proteinPer100: '31', carbsPer100: '0', fatPer100: '3.6', fiberPer100: '0',
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
});
