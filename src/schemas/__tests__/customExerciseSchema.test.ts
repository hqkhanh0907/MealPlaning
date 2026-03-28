import { describe, it, expect } from 'vitest';
import { customExerciseSchema, customExerciseDefaults } from '../customExerciseSchema';

describe('customExerciseSchema', () => {
  it('validates correct data', () => {
    const data = { ...customExerciseDefaults, name: 'Bench Press' };
    const result = customExerciseSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = customExerciseSchema.safeParse(customExerciseDefaults);
    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only name', () => {
    const data = { ...customExerciseDefaults, name: '   ' };
    const result = customExerciseSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('allows empty muscleGroup', () => {
    const data = { name: 'Custom Move', muscleGroup: '', category: 'compound' as const, equipment: '' };
    const result = customExerciseSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('accepts all valid categories', () => {
    for (const cat of ['compound', 'isolation', 'cardio'] as const) {
      const data = { ...customExerciseDefaults, name: 'Test', category: cat };
      const result = customExerciseSchema.safeParse(data);
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid category', () => {
    const data = { ...customExerciseDefaults, name: 'Test', category: 'invalid' };
    const result = customExerciseSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('trims name on parse', () => {
    const data = { ...customExerciseDefaults, name: '  Bench Press  ' };
    const result = customExerciseSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Bench Press');
    }
  });
});
