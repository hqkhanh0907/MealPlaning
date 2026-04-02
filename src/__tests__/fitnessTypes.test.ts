import type { BodyRegion, Exercise } from '../features/fitness/types';
import { isBodyRegion, safeParseJsonArray } from '../features/fitness/types';

describe('isBodyRegion', () => {
  const VALID_REGIONS: BodyRegion[] = ['shoulders', 'lower_back', 'knees', 'wrists', 'neck', 'hips'];

  it.each(VALID_REGIONS)('returns true for valid region "%s"', region => {
    expect(isBodyRegion(region)).toBe(true);
  });

  it('returns false for invalid region', () => {
    expect(isBodyRegion('elbows')).toBe(false);
    expect(isBodyRegion('')).toBe(false);
    expect(isBodyRegion('SHOULDERS')).toBe(false);
  });
});

describe('safeParseJsonArray', () => {
  it('parses valid JSON array', () => {
    expect(safeParseJsonArray('["chest","back"]')).toEqual(['chest', 'back']);
  });

  it('parses single-element JSON array', () => {
    expect(safeParseJsonArray('["legs"]')).toEqual(['legs']);
  });

  it('falls back to CSV split for legacy comma-separated data', () => {
    expect(safeParseJsonArray('chest,back')).toEqual(['chest', 'back']);
  });

  it('trims whitespace in CSV fallback', () => {
    expect(safeParseJsonArray(' chest , back , shoulders ')).toEqual(['chest', 'back', 'shoulders']);
  });

  it('returns empty array for null', () => {
    expect(safeParseJsonArray(null)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(safeParseJsonArray(undefined)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(safeParseJsonArray('')).toEqual([]);
  });

  it('returns empty array for JSON empty array string', () => {
    expect(safeParseJsonArray('[]')).toEqual([]);
  });

  it('returns custom fallback when provided and input is null', () => {
    expect(safeParseJsonArray(null, ['default'])).toEqual(['default']);
  });

  it('returns fallback when JSON parses to non-array', () => {
    expect(safeParseJsonArray('"just a string"')).toEqual([]);
  });

  it('returns fallback when JSON parses to object', () => {
    expect(safeParseJsonArray('{"key":"value"}')).toEqual([]);
  });

  it('handles CSV with trailing comma by filtering empty segments', () => {
    expect(safeParseJsonArray('chest,back,')).toEqual(['chest', 'back']);
  });

  it('round-trip: JSON.stringify then safeParseJsonArray returns original', () => {
    const original = ['chest', 'shoulders', 'arms'];
    const stored = JSON.stringify(original);
    expect(safeParseJsonArray(stored)).toEqual(original);
  });
});

describe('Exercise type', () => {
  it('accepts valid Exercise object with updatedAt', () => {
    const exercise: Exercise = {
      id: 'ex-1',
      nameVi: 'Bench Press',
      nameEn: 'Bench Press',
      muscleGroup: 'chest',
      secondaryMuscles: ['shoulders', 'arms'],
      category: 'compound',
      equipment: ['barbell'],
      contraindicated: ['shoulders'],
      exerciseType: 'strength',
      defaultRepsMin: 8,
      defaultRepsMax: 12,
      isCustom: false,
      updatedAt: '2024-01-01T00:00:00Z',
    };
    expect(exercise.updatedAt).toBe('2024-01-01T00:00:00Z');
  });
});
