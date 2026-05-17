import FitnessHistoryPage from './history.page';

describe('FitnessHistoryPage._isoWeekStart (F-016)', () => {
  // Reproducer turn 12: Sunday 2026-05-17 was grouped under week 10-16 May.
  // Expected: Monday week-start for May 17 (Sun) is May 11 (Mon).
  it('Sunday → previous Monday (same ISO week)', () => {
    expect(FitnessHistoryPage._isoWeekStart('2026-05-17')).toBe('2026-05-11');
  });

  it('Monday → itself', () => {
    expect(FitnessHistoryPage._isoWeekStart('2026-05-11')).toBe('2026-05-11');
  });

  it('Wednesday → preceding Monday', () => {
    expect(FitnessHistoryPage._isoWeekStart('2026-05-13')).toBe('2026-05-11');
  });

  it('Saturday → preceding Monday', () => {
    expect(FitnessHistoryPage._isoWeekStart('2026-05-16')).toBe('2026-05-11');
  });

  it('handles month boundary (Sat May 2 → Mon Apr 27)', () => {
    expect(FitnessHistoryPage._isoWeekStart('2026-05-02')).toBe('2026-04-27');
  });

  it('handles year boundary (Sun 2026-01-04 → Mon 2025-12-29)', () => {
    expect(FitnessHistoryPage._isoWeekStart('2026-01-04')).toBe('2025-12-29');
  });

  it('formats local date components (timezone-safe, no UTC drift)', () => {
    // Regression guard for the original bug: toISOString() shifted GMT+7 dates by -1 day.
    // The output should always look like a local YYYY-MM-DD without crossing midnight UTC.
    const result = FitnessHistoryPage._isoWeekStart('2026-05-17');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).not.toBe('2026-05-10'); // the buggy GMT+7 output
  });
});

describe('FitnessHistoryPage._formatLocalIsoDate (F-016)', () => {
  it('formats local components, not UTC', () => {
    // Construct a date that would differ in UTC for GMT+7.
    const d = new Date(2026, 4, 11); // May 11 2026 local midnight
    expect(FitnessHistoryPage._formatLocalIsoDate(d)).toBe('2026-05-11');
  });

  it('zero-pads month and day', () => {
    const d = new Date(2026, 0, 5);
    expect(FitnessHistoryPage._formatLocalIsoDate(d)).toBe('2026-01-05');
  });
});
