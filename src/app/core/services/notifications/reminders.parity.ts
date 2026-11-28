import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { loadLeptosModule } from '../../leptos-module';
import {
  androidReminderPlan,
  capLocalNotifications,
  LocalNotifications,
  REMINDER_PLANNER,
  type ReminderPolicy,
  type ReminderPlan,
  webReminderPlan,
} from './local-notifications';

describe('Android reminder policy compiled from Rust', () => {
  let compiled: (input: string) => string;
  beforeAll(async () => {
    const loading = loadLeptosModule();
    expect(loadLeptosModule()).toBe(loading);
    const module = await loading;
    if (!('reminderPlan' in module) || typeof module.reminderPlan !== 'function')
      throw Error('Real Wasm reminderPlan missing');
    compiled = module.reminderPlan as (input: string) => string;
  });
  it('matches the production schedule, cancellation set and Vietnamese wording across every preference mask', () => {
    const candidates = [
      { weekday: 6, rest: 0, exercises: 2 },
      { weekday: 0, rest: 0, exercises: 1 },
      { weekday: 6, rest: 0, exercises: 1 },
      { weekday: 3, rest: 1, exercises: 1 },
      { weekday: 4, rest: 0, exercises: 0 },
      { weekday: 1.5, rest: 0, exercises: 2 },
      { weekday: -1, rest: 0, exercises: 1 },
      { weekday: 7, rest: 0, exercises: 1 },
    ];
    for (let mask = 0; mask < 16; mask++) {
      for (const granted of [false, true])
        for (const workoutEnabled of [false, true]) {
          const policy: ReminderPolicy = {
            profile: {
              notif_morning: mask & 1,
              notif_lunch: mask & 2,
              notif_evening: mask & 4,
              notif_weekly: mask & 8,
            },
            granted,
            workoutEnabled,
            days: candidates,
          };
          const rust = JSON.parse(compiled(JSON.stringify(policy))) as ReminderPlan;
          expect(rust)
            .withContext(JSON.stringify({ mask, granted, workoutEnabled }))
            .toEqual(webReminderPlan(policy));
        }
    }
    const empty: ReminderPolicy = {
      profile: null,
      granted: true,
      workoutEnabled: true,
      days: candidates,
    };
    expect(JSON.parse(compiled(JSON.stringify(empty)))).toEqual(webReminderPlan(empty));
  });
  it('uses the Android planner and sends recurring calendar fields to the installed plugin boundary', async () => {
    spyOn(Capacitor, 'getPlatform').and.returnValue('android');
    const cancel = spyOn(capLocalNotifications, 'cancel').and.resolveTo();
    const schedule = spyOn(capLocalNotifications, 'schedule').and.resolveTo({ notifications: [] });
    expect(TestBed.inject(REMINDER_PLANNER)).toBe(androidReminderPlan);
    const policy: ReminderPolicy = {
      profile: { notif_morning: 0, notif_lunch: 0, notif_evening: 1, notif_weekly: 1 },
      granted: true,
      workoutEnabled: true,
      days: [{ weekday: 0, rest: 0, exercises: 2 }],
    };
    await TestBed.inject(LocalNotifications).reconcile(policy);
    const { cancelIds, notifications } = JSON.parse(
      compiled(JSON.stringify(policy)),
    ) as ReminderPlan;
    expect(cancel).toHaveBeenCalledOnceWith({ notifications: cancelIds.map((id) => ({ id })) });
    expect(schedule).toHaveBeenCalledOnceWith({ notifications });
    expect(cancel).toHaveBeenCalledBefore(schedule);
    expect(notifications.map((n) => n.id)).toEqual([103, 104, 151]);
  });
});
