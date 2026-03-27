import { describe, it, expect } from 'vitest';
import {
  estimateCardioBurn,
  getMETValue,
  MET_TABLE,
} from '../features/fitness/utils/cardioEstimator';
import type { CardioType, CardioIntensity } from '../features/fitness/utils/cardioEstimator';

const ALL_TYPES: CardioType[] = ['running', 'cycling', 'swimming', 'hiit', 'walking', 'elliptical', 'rowing'];
const ALL_INTENSITIES: CardioIntensity[] = ['low', 'moderate', 'high'];

describe('estimateCardioBurn', () => {
  it('calculates running moderate 30min 70kg correctly', () => {
    // formula: 30 × 9.8 × 70 / 60 = 343
    const result = estimateCardioBurn('running', 30, 'moderate', 70);
    expect(result).toBe(343);
  });

  it('returns 0 calories for zero duration', () => {
    const result = estimateCardioBurn('running', 0, 'high', 80);
    expect(result).toBe(0);
  });

  it('produces proportionally more calories for heavier person', () => {
    const light = estimateCardioBurn('cycling', 30, 'moderate', 60);
    const heavy = estimateCardioBurn('cycling', 30, 'moderate', 100);
    expect(heavy).toBeGreaterThan(light);
    expect(heavy / light).toBeCloseTo(100 / 60, 1);
  });

  it('produces valid estimates for all 7 cardio types', () => {
    for (const type of ALL_TYPES) {
      const result = estimateCardioBurn(type, 30, 'moderate', 70);
      expect(result).toBeGreaterThan(0);
    }
  });

  it('produces valid estimates for all 3 intensities of each type', () => {
    for (const type of ALL_TYPES) {
      const results = ALL_INTENSITIES.map((intensity) =>
        estimateCardioBurn(type, 30, intensity, 70),
      );
      // low < moderate < high for every type
      expect(results[0]).toBeLessThan(results[1]);
      expect(results[1]).toBeLessThan(results[2]);
    }
  });

  it('shows walking low burns significantly less than running high', () => {
    const walkingLow = estimateCardioBurn('walking', 30, 'low', 70);
    const runningHigh = estimateCardioBurn('running', 30, 'high', 70);
    expect(runningHigh).toBeGreaterThan(walkingLow * 3);
  });

  it('shows HIIT high has one of the highest calorie burn rates', () => {
    const hiitHigh = estimateCardioBurn('hiit', 30, 'high', 70);
    const walkingHigh = estimateCardioBurn('walking', 30, 'high', 70);
    const cyclingHigh = estimateCardioBurn('cycling', 30, 'high', 70);
    expect(hiitHigh).toBeGreaterThan(walkingHigh);
    expect(hiitHigh).toBeGreaterThan(cyclingHigh);
  });
});

describe('getMETValue', () => {
  it('returns correct MET values for known type/intensity pairs', () => {
    expect(getMETValue('running', 'low')).toBe(7.0);
    expect(getMETValue('running', 'moderate')).toBe(9.8);
    expect(getMETValue('running', 'high')).toBe(12.8);
    expect(getMETValue('walking', 'low')).toBe(2.5);
    expect(getMETValue('elliptical', 'high')).toBe(7.5);
    expect(getMETValue('rowing', 'moderate')).toBe(7.0);
  });
});

describe('MET_TABLE', () => {
  it('contains entries for all 7 cardio types', () => {
    expect(Object.keys(MET_TABLE)).toHaveLength(7);
    for (const type of ALL_TYPES) {
      expect(MET_TABLE[type]).toBeDefined();
    }
  });

  it('contains all 3 intensities for each type', () => {
    for (const type of ALL_TYPES) {
      for (const intensity of ALL_INTENSITIES) {
        expect(typeof MET_TABLE[type][intensity]).toBe('number');
        expect(MET_TABLE[type][intensity]).toBeGreaterThan(0);
      }
    }
  });
});
