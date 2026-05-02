import { Injectable } from '@angular/core';
import { LocalNotifications as Cap } from '@capacitor/local-notifications';

export type SlotKey = 'morning' | 'lunch' | 'evening' | 'weekly';
export interface SlotFlags {
  morning: boolean;
  lunch: boolean;
  evening: boolean;
  weekly: boolean;
}

interface Slot {
  id: number;
  key: SlotKey;
  title: string;
  body: string;
  hour: number;
  minute: number;
  weekday?: number;
}

const SLOTS: readonly Slot[] = [
  {
    id: 101,
    key: 'morning',
    title: 'Bữa sáng',
    body: 'Hôm nay ăn gì? Ghi lại nhé.',
    hour: 7,
    minute: 30,
  },
  {
    id: 102,
    key: 'lunch',
    title: 'Bữa trưa',
    body: 'Đừng quên log bữa trưa.',
    hour: 12,
    minute: 0,
  },
  {
    id: 103,
    key: 'evening',
    title: 'Bữa tối',
    body: 'Cập nhật bữa tối nào.',
    hour: 18,
    minute: 30,
  },
  {
    id: 104,
    key: 'weekly',
    title: 'Tổng kết tuần',
    body: 'Xem tiến độ tuần qua.',
    hour: 20,
    minute: 0,
    weekday: 1,
  },
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
};

@Injectable({ providedIn: 'root' })
export class LocalNotifications {
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
    await capLocalNotifications.cancel({ notifications: SLOTS.map((s) => ({ id: s.id })) });
    const enabled = SLOTS.filter((s) => flags[s.key]);
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
