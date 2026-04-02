import { describe, expect, it } from 'vitest';

import { generateUUID, getWeekRange, isDateInRange, parseLocalDate } from '../utils/helpers';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('generateUUID', () => {
  it('should return a valid UUID v4 string', () => {
    const id = generateUUID();
    expect(id).toMatch(UUID_V4_REGEX);
  });

  it('should return unique values on consecutive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateUUID()));
    expect(ids.size).toBe(100);
  });

  it('should return a string', () => {
    const id = generateUUID();
    expect(typeof id).toBe('string');
  });
});

describe('parseLocalDate', () => {
  it('should parse YYYY-MM-DD correctly', () => {
    const d = parseLocalDate('2026-03-01');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2); // 0-indexed
    expect(d.getDate()).toBe(1);
  });

  it('should avoid UTC timezone shift', () => {
    // new Date('2026-03-01') parses as UTC midnight → may shift to Feb 28 in +7 timezone
    // parseLocalDate should always give March 1 in local timezone
    const d = parseLocalDate('2026-03-01');
    expect(d.getDate()).toBe(1);
    expect(d.getMonth()).toBe(2);
  });

  it('should handle single-digit month and day', () => {
    const d = parseLocalDate('2026-01-05');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(5);
  });

  it('should handle December 31', () => {
    const d = parseLocalDate('2025-12-31');
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(31);
  });
});

describe('getWeekRange', () => {
  it('should return Monday-Sunday range for a Wednesday', () => {
    // 2026-03-04 is Wednesday
    const { start, end } = getWeekRange('2026-03-04');
    expect(start.getDay()).toBe(1); // Monday
    expect(start.getDate()).toBe(2); // March 2
    expect(end.getDay()).toBe(0); // Sunday
    expect(end.getDate()).toBe(8); // March 8
  });

  it('should return correct range for Monday', () => {
    // 2026-03-02 is Monday
    const { start, end } = getWeekRange('2026-03-02');
    expect(start.getDate()).toBe(2);
    expect(end.getDate()).toBe(8);
  });

  it('should return correct range for Sunday', () => {
    // 2026-03-01 is Sunday
    const { start, end } = getWeekRange('2026-03-01');
    // Sunday belongs to previous week (Mon Feb 23 - Sun Mar 1)
    expect(start.getMonth()).toBe(1); // February
    expect(start.getDate()).toBe(23);
    expect(end.getDate()).toBe(1);
    expect(end.getMonth()).toBe(2); // March
  });

  it('should handle month boundaries', () => {
    // 2026-02-28 is Saturday
    const { start, end } = getWeekRange('2026-02-28');
    expect(start.getMonth()).toBe(1); // Feb
    expect(start.getDate()).toBe(23);
    expect(end.getMonth()).toBe(2); // March
    expect(end.getDate()).toBe(1);
  });

  it('should set start time to 00:00:00.000', () => {
    const { start } = getWeekRange('2026-03-04');
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);
  });

  it('should set end time to 23:59:59.999', () => {
    const { end } = getWeekRange('2026-03-04');
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
  });
});

describe('isDateInRange', () => {
  const start = new Date(2026, 2, 2, 0, 0, 0, 0); // March 2
  const end = new Date(2026, 2, 8, 23, 59, 59, 999); // March 8

  it('should return true for date within range', () => {
    expect(isDateInRange('2026-03-04', start, end)).toBe(true);
  });

  it('should return true for start date', () => {
    expect(isDateInRange('2026-03-02', start, end)).toBe(true);
  });

  it('should return true for end date', () => {
    expect(isDateInRange('2026-03-08', start, end)).toBe(true);
  });

  it('should return false for date before range', () => {
    expect(isDateInRange('2026-03-01', start, end)).toBe(false);
  });

  it('should return false for date after range', () => {
    expect(isDateInRange('2026-03-09', start, end)).toBe(false);
  });
});

// --- Localize utility tests ---
import { getLocalizedField, toLocalized } from '../utils/localize';

describe('getLocalizedField', () => {
  it('returns the string as-is when field is a plain string', () => {
    expect(getLocalizedField('plain text', 'vi')).toBe('plain text');
    expect(getLocalizedField('plain text', 'en')).toBe('plain text');
  });

  it('returns vi value when lang is vi', () => {
    expect(getLocalizedField({ vi: 'Ức gà', en: 'Chicken breast' }, 'vi')).toBe('Ức gà');
  });

  it('returns vi value when lang is en (always vi-only)', () => {
    expect(getLocalizedField({ vi: 'Ức gà', en: 'Chicken breast' }, 'en')).toBe('Ức gà');
  });

  it('returns vi even when en is empty', () => {
    expect(getLocalizedField({ vi: 'Ức gà', en: '' }, 'en')).toBe('Ức gà');
  });

  it('returns empty string when vi is empty', () => {
    expect(getLocalizedField({ vi: '', en: 'Chicken breast' }, 'vi')).toBe('');
  });

  it('returns empty string when both languages are empty', () => {
    expect(getLocalizedField({ vi: '', en: '' }, 'vi')).toBe('');
  });
});

describe('toLocalized', () => {
  it('wraps a plain string as a LocalizedString', () => {
    expect(toLocalized('test')).toEqual({ vi: 'test' });
  });

  it('returns a LocalizedString as-is', () => {
    const input = { vi: 'Ức gà', en: 'Chicken breast' };
    expect(toLocalized(input)).toBe(input);
  });
});
