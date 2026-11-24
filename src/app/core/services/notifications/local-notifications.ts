import { Injectable } from '@angular/core';
import { LocalNotifications as Cap } from '@capacitor/local-notifications';
import { REMINDER_SLOTS } from './notification-schedule';
import type { SlotFlags } from './notification-preferences';
export type { SlotFlags, SlotKey } from './notification-preferences';

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
  async hasPermission(): Promise<boolean> {
    return (await capLocalNotifications.checkPermissions()).display === 'granted';
  }

  /** Request OS-level notification permission. Returns true if granted. */
  async requestPermission(): Promise<boolean> {
    const r = await capLocalNotifications.requestPermissions();
    return r.display === 'granted';
  }

  /**
   * Reconcile scheduled notifications with the given flag set.
   * Always cancels all known slot IDs first, then schedules only enabled ones.
   * Idempotent and safe to call repeatedly.
   */
  async sync(flags: SlotFlags): Promise<void> {
    await capLocalNotifications.cancel({
      notifications: REMINDER_SLOTS.map((s) => ({ id: s.id })),
    });
    const enabled = REMINDER_SLOTS.filter((s) => flags[s.key]);
    if (enabled.length === 0) return;
    await capLocalNotifications.schedule({
      notifications: enabled.map((s) => ({
        id: s.id,
        title: s.title,
        body: s.body,
        schedule: {
          on: {
            hour: s.hour,
            minute: s.minute,
            ...(s.weekday !== undefined ? { weekday: s.weekday } : {}),
          },
          repeats: true,
        },
      })),
    });
  }
}
