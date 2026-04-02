import { describe, expect, it } from 'vitest';

import { parseNumericInput } from '../features/fitness/utils/parseNumericInput';

describe('parseNumericInput', () => {
  it('parses valid number', () => {
    expect(parseNumericInput('42.5')).toBe(42.5);
  });

  it('returns fallback for empty string', () => {
    expect(parseNumericInput('')).toBe(0);
  });

  it('returns fallback for text', () => {
    expect(parseNumericInput('abc')).toBe(0);
  });

  it('returns fallback for NaN', () => {
    expect(parseNumericInput('NaN')).toBe(0);
  });

  it('clamps negative to 0', () => {
    expect(parseNumericInput('-5')).toBe(0);
  });

  it('uses custom fallback', () => {
    expect(parseNumericInput('', 10)).toBe(10);
  });

  it('handles zero', () => {
    expect(parseNumericInput('0')).toBe(0);
  });

  it('returns fallback for Infinity', () => {
    expect(parseNumericInput('Infinity')).toBe(0);
  });

  it('returns fallback for whitespace-only string', () => {
    expect(parseNumericInput(' ')).toBe(0);
  });

  it('parses integer correctly', () => {
    expect(parseNumericInput('100')).toBe(100);
  });

  it('returns custom fallback for invalid input', () => {
    expect(parseNumericInput('abc', 5)).toBe(5);
  });
});
