import type { DayPlanWithSlots } from '../models/meal-plan.types';
import { InjectionToken } from '@angular/core';
import { parseLocalDate } from '../utils/local-date';
import { nativeAccount } from './native-account';

export const NATIVE_CALENDAR_READ = new InjectionToken<typeof readAccountCalendar>(
  'Native calendar read',
  {
    providedIn: 'root',
    factory: () => readAccountCalendar,
  },
);

export interface NativeCalendarDays {
  ownerId: string;
  start: string;
  end: string;
  days: DayPlanWithSlots[];
}

export async function readAccountCalendar(
  start: string,
  end: string,
  owner: string,
  read: (window: { start: string; end: string }) => Promise<NativeCalendarDays> = (window) =>
    nativeAccount.calendarDays(window),
): Promise<DayPlanWithSlots[] | null> {
  if (
    !Number.isFinite(parseLocalDate(start).getTime()) ||
    !Number.isFinite(parseLocalDate(end).getTime())
  )
    return null;
  try {
    const result = await read({ start, end });
    if (result.ownerId !== owner || result.start !== start || result.end !== end) {
      throw new Error('Calendar account or date changed.');
    }
    return result.days;
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
    if (code === 'UNIMPLEMENTED' || code === 'calendar_native_unavailable') return null;
    throw error;
  }
}
