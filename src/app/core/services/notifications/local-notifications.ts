import { Injectable } from '@angular/core';
import { LocalNotifications as Cap } from '@capacitor/local-notifications';
import { REMINDER_SLOTS, WORKOUT_REMINDER } from './notification-schedule';
import type { SlotFlags } from './notification-preferences';
export type { SlotFlags, SlotKey } from './notification-preferences';

const WORKOUT_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WORKOUT_REMINDER_START_ID = 151;
const MANAGED_IDS = [
  ...REMINDER_SLOTS.map(({ id }) => id),
  ...WORKOUT_DAYS.map((day) => WORKOUT_REMINDER_START_ID + day),
];

/**
 * Indirection layer around the Capacitor plugin proxy. Tests can spy on
 * these methods because they live on a normal object (the plugin itself
 * is a Proxy from registerPlugin() that does not honor property
 * reassignment cleanly).
 */
export const capLocalNotifications = {
  cancel: (opts: Parameters<typeof Cap.cancel>[0]) => Cap.cancel(opts),
  schedule: (opts: Parameters<typeof Cap.schedule>[0]) => Cap.schedule(opts),
  requestPermissions: () => Cap.requestPermissions(),
  checkPermissions: () => Cap.checkPermissions(),
};

@Injectable({ providedIn: 'root' })
export class LocalNotifications {
  private pending: Promise<void> = Promise.resolve();

  async hasPermission(): Promise<boolean> {
    return (await capLocalNotifications.checkPermissions()).display === 'granted';
  }

  /** Request OS-level notification permission. Returns true if granted. */
  async requestPermission(): Promise<boolean> {
    const r = await capLocalNotifications.requestPermissions();
    return r.display === 'granted';
  }

  sync(
    flags: SlotFlags,
    workoutWeekdays: readonly number[] = [],
    isCurrent: () => boolean = () => true,
  ): Promise<void> {
    const result = this.pending.then(async () => {
      if (!isCurrent()) return;
      await capLocalNotifications.cancel({ notifications: MANAGED_IDS.map((id) => ({ id })) });
      if (!isCurrent()) return;

      const workouts = WORKOUT_DAYS.filter((day) => workoutWeekdays.includes(day)).map((day) => ({
        ...WORKOUT_REMINDER,
        id: WORKOUT_REMINDER_START_ID + day,
        body: 'Mở ứng dụng để xem lịch hôm nay.',
        weekday: day + 1,
      }));
      const enabled = [...REMINDER_SLOTS.filter((slot) => flags[slot.key]), ...workouts];
      if (!enabled.length) return;
      await capLocalNotifications.schedule({
        notifications: enabled.map(({ id, title, body, hour, minute, weekday }) => ({
          id,
          title,
          body,
          schedule: {
            on: { hour, minute, ...(weekday !== undefined ? { weekday } : {}) },
            repeats: true,
          },
        })),
      });
    });
    this.pending = result.catch(() => undefined);
    return result;
  }
}
