import { ageOnDate } from './profile-birth-date';

describe('ageOnDate', () => {
  it('changes at local midnight on the birthday and stays unchanged on New Year', () => {
    expect(ageOnDate('1996-11-24', new Date(2026, 0, 1))).toBe(29);
    expect(ageOnDate('1996-11-24', new Date(2026, 10, 23, 23, 59, 59))).toBe(29);
    expect(ageOnDate('1996-11-24', new Date(2026, 10, 24, 0, 0))).toBe(30);
  });

  it('uses February 28 in common years and February 29 in leap years', () => {
    expect(ageOnDate('2000-02-29', new Date(2025, 1, 27))).toBe(24);
    expect(ageOnDate('2000-02-29', new Date(2025, 1, 28))).toBe(25);
    expect(ageOnDate('2000-02-29', new Date(2024, 1, 28))).toBe(23);
    expect(ageOnDate('2000-02-29', new Date(2024, 1, 29))).toBe(24);
  });

  it('rejects malformed, impossible and future dates', () => {
    for (const date of ['2026-02-29', '2026-03-01T00:00:00Z', '2026-3-01', '2026-11-25', '']) {
      expect(ageOnDate(date, new Date(2026, 10, 24)))
        .withContext(date)
        .toBeNull();
    }
    expect(ageOnDate('2000-01-01', new Date(NaN))).toBeNull();
  });
});
