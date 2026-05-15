import type { WeekDayTotal } from '../models/meal-plan.types';
import { weekDayStatus, weekDayStatusIcon } from './week-day-status';

function makeWeekDay(overrides: Partial<WeekDayTotal> = {}): WeekDayTotal {
  return {
    date: '2026-05-04',
    label: 'T2',
    dotCount: 0,
    loggedCal: 0,
    plannedCal: 0,
    targetCal: 2000,
    isToday: false,
    isPast: false,
    hasPlan: false,
    ...overrides,
  };
}

describe('weekDayStatus', () => {
  it('returns "no-plan" when hasPlan=false', () => {
    expect(weekDayStatus(makeWeekDay({ hasPlan: false }))).toBe('no-plan');
  });

  it('returns "today-recording" when today + has plan (regardless of past flag)', () => {
    expect(
      weekDayStatus(makeWeekDay({ isToday: true, hasPlan: true, plannedCal: 500, loggedCal: 400 })),
    ).toBe('today-recording');
  });

  it('returns "future-planned" for non-today non-past with plan', () => {
    expect(
      weekDayStatus(
        makeWeekDay({ hasPlan: true, plannedCal: 1800, isToday: false, isPast: false }),
      ),
    ).toBe('future-planned');
  });

  describe('past day pct buckets', () => {
    it('80% → on-target', () => {
      expect(
        weekDayStatus(
          makeWeekDay({ hasPlan: true, isPast: true, loggedCal: 1600, targetCal: 2000 }),
        ),
      ).toBe('past-on-target');
    });
    it('109% → on-target', () => {
      expect(
        weekDayStatus(
          makeWeekDay({ hasPlan: true, isPast: true, loggedCal: 2180, targetCal: 2000 }),
        ),
      ).toBe('past-on-target');
    });
    it('110% boundary → slight-over warning', () => {
      expect(
        weekDayStatus(
          makeWeekDay({ hasPlan: true, isPast: true, loggedCal: 2200, targetCal: 2000 }),
        ),
      ).toBe('past-over');
    });
    it('111% → over', () => {
      expect(
        weekDayStatus(
          makeWeekDay({ hasPlan: true, isPast: true, loggedCal: 2220, targetCal: 2000 }),
        ),
      ).toBe('past-over');
    });
    it('120% boundary → over', () => {
      expect(
        weekDayStatus(
          makeWeekDay({ hasPlan: true, isPast: true, loggedCal: 2400, targetCal: 2000 }),
        ),
      ).toBe('past-over');
    });
    it('121% → extreme (over target)', () => {
      expect(
        weekDayStatus(
          makeWeekDay({ hasPlan: true, isPast: true, loggedCal: 2420, targetCal: 2000 }),
        ),
      ).toBe('past-extreme');
    });
    it('60% → under', () => {
      expect(
        weekDayStatus(
          makeWeekDay({ hasPlan: true, isPast: true, loggedCal: 1200, targetCal: 2000 }),
        ),
      ).toBe('past-under');
    });
    it('40% → extreme (under-extreme)', () => {
      expect(
        weekDayStatus(
          makeWeekDay({ hasPlan: true, isPast: true, loggedCal: 800, targetCal: 2000 }),
        ),
      ).toBe('past-extreme');
    });
    it('160% → extreme (over-extreme)', () => {
      expect(
        weekDayStatus(
          makeWeekDay({ hasPlan: true, isPast: true, loggedCal: 3200, targetCal: 2000 }),
        ),
      ).toBe('past-extreme');
    });
    it('targetCal=0 (degenerate) → extreme', () => {
      expect(
        weekDayStatus(makeWeekDay({ hasPlan: true, isPast: true, loggedCal: 100, targetCal: 0 })),
      ).toBe('past-extreme');
    });
  });
});

describe('weekDayStatusIcon', () => {
  it('maps each status to its ionicon name', () => {
    expect(weekDayStatusIcon('no-plan')).toBe('ellipse-outline');
    expect(weekDayStatusIcon('future-planned')).toBe('ellipse-outline');
    expect(weekDayStatusIcon('today-recording')).toBe('radio-button-on-outline');
    expect(weekDayStatusIcon('past-on-target')).toBe('checkmark-circle-outline');
    expect(weekDayStatusIcon('past-under')).toBe('remove-circle-outline');
    expect(weekDayStatusIcon('past-over')).toBe('alert-circle-outline');
    expect(weekDayStatusIcon('past-extreme')).toBe('close-circle-outline');
  });
});
