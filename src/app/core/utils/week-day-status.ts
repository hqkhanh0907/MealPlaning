import type { WeekDayStatus, WeekDayTotal } from '../models/meal-plan.types';

/**
 * Pure decision table (F-04 §4) mapping a `WeekDayTotal` to its visual status.
 *
 * Order matters — `!hasPlan` short-circuits before time-of-day checks so that
 * a future day with zero dishes never gets the "today-recording" branch.
 */
export function weekDayStatus(d: WeekDayTotal): WeekDayStatus {
  if (!d.hasPlan) return 'no-plan';
  if (d.isToday) return 'today-recording';
  if (!d.isPast) return 'future-planned';

  if (d.targetCal <= 0) return 'past-extreme';
  const pct = Math.round((d.loggedCal / d.targetCal) * 100);
  if (pct < 50 || pct > 120) return 'past-extreme';
  if (pct >= 110) return 'past-over';
  if (pct >= 80) return 'past-on-target';
  return 'past-under';
}

const STATUS_ICON: Record<WeekDayStatus, string> = {
  'no-plan': 'ellipse-outline',
  'future-planned': 'ellipse-outline',
  'today-recording': 'radio-button-on-outline',
  'past-on-target': 'checkmark-circle-outline',
  'past-under': 'remove-circle-outline',
  'past-over': 'alert-circle-outline',
  'past-extreme': 'close-circle-outline',
};

export function weekDayStatusIcon(s: WeekDayStatus): string {
  return STATUS_ICON[s];
}
