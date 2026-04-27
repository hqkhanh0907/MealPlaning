import { validateOptionalNonNegative, validateRequiredPositive, validateVnName } from './common';

describe('shared/forms/schemas/common', () => {
  describe('validateVnName', () => {
    it('rejects empty string', () => {
      expect(validateVnName('')?.kind).toBe('required');
    });

    it('rejects whitespace-only string', () => {
      expect(validateVnName('   ')?.kind).toBe('required');
    });

    it('accepts valid Vietnamese name', () => {
      expect(validateVnName('Bún chả Hà Nội')).toBeNull();
    });

    it('rejects names over 100 chars', () => {
      expect(validateVnName('x'.repeat(101))?.kind).toBe('maxLength');
    });

    it('accepts exactly 100 chars', () => {
      expect(validateVnName('x'.repeat(100))).toBeNull();
    });
  });

  describe('validateOptionalNonNegative', () => {
    it('accepts null', () => {
      expect(validateOptionalNonNegative(null)).toBeNull();
    });

    it('accepts zero', () => {
      expect(validateOptionalNonNegative(0)).toBeNull();
    });

    it('accepts positive number', () => {
      expect(validateOptionalNonNegative(42.5)).toBeNull();
    });

    it('rejects negative', () => {
      expect(validateOptionalNonNegative(-1)?.kind).toBe('positive');
    });

    it('rejects NaN', () => {
      expect(validateOptionalNonNegative(Number.NaN)?.kind).toBe('invalid');
    });
  });

  describe('validateRequiredPositive', () => {
    it('rejects null', () => {
      expect(validateRequiredPositive(null)?.kind).toBe('required');
    });

    it('rejects zero (must be > 0)', () => {
      expect(validateRequiredPositive(0)?.kind).toBe('positive');
    });

    it('rejects negative', () => {
      expect(validateRequiredPositive(-2)?.kind).toBe('positive');
    });

    it('accepts positive', () => {
      expect(validateRequiredPositive(1.5)).toBeNull();
    });

    it('rejects NaN', () => {
      expect(validateRequiredPositive(Number.NaN)?.kind).toBe('required');
    });
  });
});
