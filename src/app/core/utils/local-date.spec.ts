import {
  addCalendarDays,
  localIsoDate,
  mondayOfWeek,
  parseLocalDate,
  shiftIsoDate,
  weekDates,
} from './local-date';

describe('local calendar dates', () => {
  it('keeps a Sunday workout and meal in the week starting the previous year', () => {
    const sunday = new Date(2027, 0, 3, 23, 59);
    const monday = mondayOfWeek(sunday);
    expect(localIsoDate(monday)).toBe('2026-12-28');
    expect(monday.getHours()).toBe(0);
    expect(weekDates(localIsoDate(monday))).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
    expect(sunday.getHours()).toBe(23);
  });

  it('counts local days through leap day and clock changes', () => {
    expect(shiftIsoDate('2024-02-28', 2)).toBe('2024-03-01');
    expect(shiftIsoDate('2026-11-01', 1)).toBe('2026-11-02');
    const before = new Date(2026, 2, 7, 23, 30);
    const after = addCalendarDays(before, 1);
    expect([after.getDate(), after.getHours()]).toEqual([8, 23]);
    expect(before.getDate()).toBe(7);
  });

  it('rejects invalid calendar dates and timestamp inputs', () => {
    for (const invalid of ['2026-02-29', '2026-06-31', 'today', '2026-06-12T23:00:00Z']) {
      expect(parseLocalDate(invalid).getTime()).toBeNaN();
      expect(weekDates(invalid)).toEqual([]);
    }
  });
});
