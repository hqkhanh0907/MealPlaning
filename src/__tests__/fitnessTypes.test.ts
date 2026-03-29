import { isBodyRegion } from '../features/fitness/types';
import type { Exercise, BodyRegion } from '../features/fitness/types';

describe('isBodyRegion', () => {
  const VALID_REGIONS: BodyRegion[] = [
    'shoulders',
    'lower_back',
    'knees',
    'wrists',
    'neck',
    'hips',
  ];

  it.each(VALID_REGIONS)('returns true for valid region "%s"', (region) => {
    expect(isBodyRegion(region)).toBe(true);
  });

  it('returns false for invalid region', () => {
    expect(isBodyRegion('elbows')).toBe(false);
    expect(isBodyRegion('')).toBe(false);
    expect(isBodyRegion('SHOULDERS')).toBe(false);
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
