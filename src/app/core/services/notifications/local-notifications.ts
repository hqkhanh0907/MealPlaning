import { inject, Injectable, InjectionToken } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications as Cap, type ScheduleOptions } from '@capacitor/local-notifications';
import type { UserProfile } from '../../models/user-profile.model';
import { loadLeptosModule } from '../../leptos-module';
import { REMINDER_SLOTS, WORKOUT_REMINDER } from './notification-schedule';
import { notificationFlags, type SlotFlags } from './notification-preferences';
export type { SlotFlags, SlotKey } from './notification-preferences';

const WORKOUT_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WORKOUT_REMINDER_START_ID = 151;
const MANAGED_IDS = [
  ...REMINDER_SLOTS.map(({ id }) => id),
  ...WORKOUT_DAYS.map((day) => WORKOUT_REMINDER_START_ID + day),
];

export interface ReminderPolicy {
  profile: Pick<
    UserProfile,
    'notif_morning' | 'notif_lunch' | 'notif_evening' | 'notif_weekly'
  > | null;
  granted: boolean;
  workoutEnabled: boolean;
  days: readonly { weekday: number; rest: number; exercises: number }[];
}
export interface ReminderPlan extends ScheduleOptions {
  cancelIds: readonly number[];
}
type Planner = (input: ReminderPolicy) => ReminderPlan | Promise<ReminderPlan>;

export function webReminderPlan(input: ReminderPolicy): ReminderPlan {
  const flags = notificationFlags(input.profile, input.granted);
  const weekdays =
    input.granted && input.profile && input.workoutEnabled
      ? input.days.filter((day) => !day.rest && day.exercises > 0).map((day) => day.weekday)
      : [];
  const workouts = WORKOUT_DAYS.filter((day) => weekdays.includes(day)).map((day) => ({
    ...WORKOUT_REMINDER,
    id: WORKOUT_REMINDER_START_ID + day,
    body: 'Mở ứng dụng để xem lịch hôm nay.',
    weekday: day + 1,
  }));
  const enabled = [...REMINDER_SLOTS.filter((slot) => flags[slot.key]), ...workouts];
  return {
    cancelIds: MANAGED_IDS,
    notifications: enabled.map(({ id, title, body, hour, minute, weekday }) => ({
      id,
      title,
      body,
      schedule: {
        on: { hour, minute, ...(weekday !== undefined ? { weekday } : {}) },
        repeats: true,
      },
    })),
  };
}

export async function androidReminderPlan(input: ReminderPolicy): Promise<ReminderPlan> {
  const module = await loadLeptosModule().catch(() => null);
  if (!module || !('reminderPlan' in module) || typeof module.reminderPlan !== 'function')
    return webReminderPlan(input);
  return JSON.parse(module.reminderPlan(JSON.stringify(input))) as ReminderPlan;
}

export const REMINDER_PLANNER = new InjectionToken<Planner>('Reminder planner', {
  providedIn: 'root',
  factory: () => (Capacitor.getPlatform() === 'android' ? androidReminderPlan : webReminderPlan),
});

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
  private readonly plan = inject(REMINDER_PLANNER);

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
    return this.reconcile(
      {
        profile: {
          notif_morning: Number(flags.morning),
          notif_lunch: Number(flags.lunch),
          notif_evening: Number(flags.evening),
          notif_weekly: Number(flags.weekly),
        },
        granted: true,
        workoutEnabled: true,
        days: workoutWeekdays.map((weekday) => ({ weekday, rest: 0, exercises: 1 })),
      },
      isCurrent,
    );
  }

  reconcile(input: ReminderPolicy, isCurrent: () => boolean = () => true): Promise<void> {
    const result = this.pending.then(async () => {
      if (!isCurrent()) return;
      const selected = this.plan(input);
      const plan = selected instanceof Promise ? await selected : selected;
      if (!isCurrent()) return;
      await capLocalNotifications.cancel({ notifications: plan.cancelIds.map((id) => ({ id })) });
      if (!isCurrent()) return;
      if (plan.notifications.length)
        await capLocalNotifications.schedule({ notifications: plan.notifications });
    });
    this.pending = result.catch(() => undefined);
    return result;
  }
}
