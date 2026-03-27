import {
  formatDate,
  parseDate,
  getDayOfWeek,
  addDays,
  getMondayOfWeek,
  daysBetween,
  isToday,
  getWeekBounds,
} from '../features/fitness/utils/dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('returns YYYY-MM-DD format', () => {
      expect(formatDate(new Date(2026, 2, 27))).toBe('2026-03-27');
    });

    it('pads single-digit month and day', () => {
      expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    });
  });

  describe('parseDate', () => {
    it('creates correct Date from YYYY-MM-DD', () => {
      const d = parseDate('2026-03-27');
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(2);
      expect(d.getDate()).toBe(27);
    });

    it('handles ISO strings with time component', () => {
      const d = parseDate('2026-03-27T10:30:00');
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(2);
      expect(d.getDate()).toBe(27);
    });
  });

  describe('getDayOfWeek', () => {
    it('returns 1 for Monday', () => {
      expect(getDayOfWeek('2026-03-23')).toBe(1);
    });

    it('returns 7 for Sunday', () => {
      expect(getDayOfWeek('2026-03-29')).toBe(7);
    });

    it('returns 5 for Friday', () => {
      expect(getDayOfWeek('2026-03-27')).toBe(5);
    });
  });

  describe('addDays', () => {
    it('adds days correctly', () => {
      expect(addDays('2026-03-27', 3)).toBe('2026-03-30');
    });

    it('crosses month boundary', () => {
      expect(addDays('2026-03-30', 2)).toBe('2026-04-01');
    });

    it('subtracts days with negative value', () => {
      expect(addDays('2026-03-27', -3)).toBe('2026-03-24');
    });
  });

  describe('getMondayOfWeek', () => {
    it('returns Monday for a Friday', () => {
      expect(getMondayOfWeek('2026-03-27')).toBe('2026-03-23');
    });

    it('returns same date for Monday', () => {
      expect(getMondayOfWeek('2026-03-23')).toBe('2026-03-23');
    });

    it('returns previous Monday for Sunday', () => {
      expect(getMondayOfWeek('2026-03-29')).toBe('2026-03-23');
    });
  });

  describe('daysBetween', () => {
    it('calculates positive difference', () => {
      expect(daysBetween('2026-03-01', '2026-03-27')).toBe(26);
    });

    it('returns 0 for same date', () => {
      expect(daysBetween('2026-03-27', '2026-03-27')).toBe(0);
    });

    it('returns negative for reversed dates', () => {
      expect(daysBetween('2026-03-27', '2026-03-01')).toBe(-26);
    });
  });

  describe('isToday', () => {
    it('returns true for today', () => {
      const today = formatDate(new Date());
      expect(isToday(today)).toBe(true);
    });

    it('returns false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(formatDate(yesterday))).toBe(false);
    });
  });

  describe('getWeekBounds', () => {
    it('returns Monday-Sunday range spanning 6 days', () => {
      const bounds = getWeekBounds(0);
      expect(bounds.start).toBeDefined();
      expect(bounds.end).toBeDefined();
      expect(daysBetween(bounds.start, bounds.end)).toBe(6);
    });

    it('start is a Monday (day 1)', () => {
      const bounds = getWeekBounds(0);
      expect(getDayOfWeek(bounds.start)).toBe(1);
    });

    it('end is a Sunday (day 7)', () => {
      const bounds = getWeekBounds(0);
      expect(getDayOfWeek(bounds.end)).toBe(7);
    });

    it('previous week offset shifts by 7 days', () => {
      const thisWeek = getWeekBounds(0);
      const lastWeek = getWeekBounds(-1);
      expect(daysBetween(lastWeek.start, thisWeek.start)).toBe(7);
    });

    it('defaults to current week with no argument', () => {
      const defaultBounds = getWeekBounds();
      const zeroBounds = getWeekBounds(0);
      expect(defaultBounds.start).toBe(zeroBounds.start);
      expect(defaultBounds.end).toBe(zeroBounds.end);
    });
  });
});
