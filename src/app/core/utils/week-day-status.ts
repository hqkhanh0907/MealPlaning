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

const STATUS_EMOJI: Record<WeekDayStatus, string> = {
  'no-plan': '⚪',
  'future-planned': '⚪',
  'today-recording': '🟠',
  'past-on-target': '✅',
  'past-under': '🟡',
  'past-over': '⚠️',
  'past-extreme': '⛔',
};

export function weekDayStatusEmoji(s: WeekDayStatus): string {
  return STATUS_EMOJI[s];
}
