import { bandColor } from './band-color';

describe('bandColor', () => {
  describe('5-band table (arch §10.1)', () => {
    it('returns "low" for 0%', () => {
      expect(bandColor(0, 'calories')).toBe('low');
    });

    it('returns "low" for 49% (upper boundary of low band)', () => {
      expect(bandColor(49, 'calories')).toBe('low');
    });

    it('returns "medium" for 50% (lower boundary of medium band)', () => {
      expect(bandColor(50, 'calories')).toBe('medium');
    });

    it('returns "medium" for 79%', () => {
      expect(bandColor(79, 'calories')).toBe('medium');
    });

    it('returns "good" for 80% (lower boundary of good band)', () => {
      expect(bandColor(80, 'protein')).toBe('good');
    });

    it('returns "good" for 110% (upper boundary of good band)', () => {
      expect(bandColor(110, 'protein')).toBe('good');
    });

    it('returns "medium" for 111% (over-target warning band)', () => {
      expect(bandColor(111, 'carbs')).toBe('medium');
    });

    it('returns "medium" for 120% (upper boundary of warning over-band)', () => {
      expect(bandColor(120, 'carbs')).toBe('medium');
    });

    it('returns "high" for 121% (start of danger over-band)', () => {
      expect(bandColor(121, 'fat')).toBe('high');
    });

    it('returns "high" for 200% (clamp ceiling)', () => {
      expect(bandColor(200, 'fat')).toBe('high');
    });
  });

  describe('safe-degradation guards', () => {
    it('returns "low" for NaN input', () => {
      expect(bandColor(Number.NaN, 'calories')).toBe('low');
    });

    it('returns "low" for negative input', () => {
      expect(bandColor(-5, 'calories')).toBe('low');
    });

    it('returns "low" for Infinity', () => {
      expect(bandColor(Number.POSITIVE_INFINITY, 'calories')).toBe('low');
    });

    it('returns "low" for non-number coerced via cast', () => {
      // Defensive: caller passes wrong type at runtime.
      expect(bandColor(undefined as unknown as number, 'calories')).toBe('low');
    });
  });

  describe('variant agnostic', () => {
    it('returns same band for same pct regardless of variant', () => {
      expect(bandColor(95, 'calories')).toBe(bandColor(95, 'protein'));
      expect(bandColor(95, 'carbs')).toBe(bandColor(95, 'fat'));
    });
  });
});
