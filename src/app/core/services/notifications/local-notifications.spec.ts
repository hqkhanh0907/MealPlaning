import { TestBed } from '@angular/core/testing';
import {
  LocalNotifications,
  capLocalNotifications,
  REMINDER_PLANNER,
  type ReminderPlan,
  webReminderPlan,
} from './local-notifications';
import { notificationFlags } from './notification-preferences';

describe('LocalNotifications', () => {
  let svc: LocalNotifications;
  let cancelSpy: jasmine.Spy;
  let scheduleSpy: jasmine.Spy;
  let requestSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(LocalNotifications);
    cancelSpy = spyOn(capLocalNotifications, 'cancel').and.returnValue(Promise.resolve());
    scheduleSpy = spyOn(capLocalNotifications, 'schedule').and.returnValue(
      Promise.resolve({ notifications: [] }) as never,
    );
    requestSpy = spyOn(capLocalNotifications, 'requestPermissions').and.returnValue(
      Promise.resolve({ display: 'granted' }) as never,
    );
  });

  describe('sync()', () => {
    it('cancels managed meal and workout IDs when no reminders are enabled', async () => {
      await svc.sync({ morning: false, lunch: false, evening: false, weekly: false });
      expect(cancelSpy).toHaveBeenCalledWith({
        notifications: [101, 102, 103, 104, 151, 152, 153, 154, 155, 156, 157].map((id) => ({
          id,
        })),
      });
      expect(scheduleSpy).not.toHaveBeenCalled();
    });

    it('schedules only morning (id=101, hour=7, min=30, no weekday) when only morning is enabled', async () => {
      await svc.sync({ morning: true, lunch: false, evening: false, weekly: false });
      expect(cancelSpy).toHaveBeenCalled();
      expect(scheduleSpy).toHaveBeenCalledTimes(1);
      const arg = scheduleSpy.calls.mostRecent().args[0];
      expect(arg.notifications.length).toBe(1);
      const n = arg.notifications[0];
      expect(n.id).toBe(101);
      expect(n.title).toBe('Bữa sáng');
      expect(n.schedule.on.hour).toBe(7);
      expect(n.schedule.on.minute).toBe(30);
      expect(n.schedule.on.weekday).toBeUndefined();
      expect(n.schedule.repeats).toBeTrue();
    });

    it('schedules weekly with weekday=1 when only weekly is enabled', async () => {
      await svc.sync({ morning: false, lunch: false, evening: false, weekly: true });
      expect(scheduleSpy).toHaveBeenCalledTimes(1);
      const arg = scheduleSpy.calls.mostRecent().args[0];
      expect(arg.notifications.length).toBe(1);
      const n = arg.notifications[0];
      expect(n.id).toBe(104);
      expect(n.schedule.on.hour).toBe(20);
      expect(n.schedule.on.minute).toBe(0);
      expect(n.schedule.on.weekday).toBe(1);
    });

    it('schedules all 4 when all flags are true', async () => {
      await svc.sync({ morning: true, lunch: true, evening: true, weekly: true });
      const arg = scheduleSpy.calls.mostRecent().args[0];
      expect(arg.notifications.length).toBe(4);
      expect(arg.notifications.map((x: { id: number }) => x.id)).toEqual([101, 102, 103, 104]);
    });

    it('preserves weekly recap and schedules Sunday and Saturday workout reminders once', async () => {
      const flags = notificationFlags({
        notif_morning: 0,
        notif_lunch: 0,
        notif_evening: 0,
        notif_weekly: 1,
      });
      await svc.sync(flags, [0, 6, 0, -1, 7, 1.5]);

      const request = scheduleSpy.calls.mostRecent().args[0];
      expect(request.notifications.map(({ id }: { id: number }) => id)).toEqual([104, 151, 157]);
      expect(
        request.notifications.slice(1).map(({ schedule }: { schedule: object }) => schedule),
      ).toEqual([
        { on: { hour: 17, minute: 30, weekday: 1 }, repeats: true },
        { on: { hour: 17, minute: 30, weekday: 7 }, repeats: true },
      ]);
    });

    it('waits for cancellation and skips obsolete reconciliation before canceling or scheduling', async () => {
      const flags = notificationFlags(null);
      let finishCancellation!: () => void;
      const cancellation = new Promise<void>((resolve) => {
        finishCancellation = resolve;
      });
      cancelSpy.and.returnValues(cancellation, Promise.resolve());
      let current = true;
      const first = svc.sync(flags, [1], () => current);
      await Promise.resolve();

      current = false;
      const obsolete = svc.sync(flags, [3], () => false);
      const latest = svc.sync(flags, [6]);
      expect(cancelSpy).toHaveBeenCalledTimes(1);
      expect(scheduleSpy).not.toHaveBeenCalled();

      finishCancellation();
      await Promise.all([first, obsolete, latest]);
      expect(cancelSpy).toHaveBeenCalledTimes(2);
      expect(scheduleSpy).toHaveBeenCalledTimes(1);
      expect(scheduleSpy.calls.mostRecent().args[0].notifications[0].id).toBe(157);
    });

    it('continues reconciling after a failed operation', async () => {
      const error = new Error('Android cancellation failed');
      const flags = notificationFlags({
        notif_morning: 1,
        notif_lunch: 0,
        notif_evening: 0,
        notif_weekly: 0,
      });
      cancelSpy.and.returnValues(Promise.reject(error), Promise.resolve());
      await expectAsync(svc.sync(flags)).toBeRejectedWith(error);

      await svc.sync(flags);

      expect(cancelSpy).toHaveBeenCalledTimes(2);
      expect(scheduleSpy).toHaveBeenCalledTimes(1);
    });

    it('retries the complete replacement after a schedule failure following cancellation', async () => {
      const error = new Error('Android schedule failed');
      scheduleSpy.and.returnValues(Promise.reject(error), Promise.resolve({ notifications: [] }));
      const flags = { morning: true, lunch: false, evening: false, weekly: false };
      await expectAsync(svc.sync(flags)).toBeRejectedWith(error);
      await svc.sync(flags);
      expect(cancelSpy).toHaveBeenCalledTimes(2);
      expect(scheduleSpy.calls.argsFor(1)).toEqual(scheduleSpy.calls.argsFor(0));
    });
  });

  describe('requestPermission()', () => {
    it('returns true when display is granted', async () => {
      requestSpy.and.returnValue(Promise.resolve({ display: 'granted' }));
      expect(await svc.requestPermission()).toBeTrue();
    });

    it('returns false when display is denied', async () => {
      requestSpy.and.returnValue(Promise.resolve({ display: 'denied' }));
      expect(await svc.requestPermission()).toBeFalse();
    });

    it('returns false when display is prompt (user has not yet decided)', async () => {
      requestSpy.and.returnValue(Promise.resolve({ display: 'prompt' }));
      expect(await svc.requestPermission()).toBeFalse();
    });
  });
});

describe('Reminder reconciliation across the asynchronous Android planner', () => {
  it('discards a plan when the account changes while the module loads', async () => {
    let release!: (result: ReminderPlan) => void;
    const delayed = new Promise<ReminderPlan>((resolve) => {
      release = resolve;
    });
    TestBed.configureTestingModule({
      providers: [{ provide: REMINDER_PLANNER, useValue: () => delayed }],
    });
    const service = TestBed.inject(LocalNotifications);
    const cancel = spyOn(capLocalNotifications, 'cancel').and.resolveTo();
    const schedule = spyOn(capLocalNotifications, 'schedule').and.resolveTo({ notifications: [] });
    let current = true;
    const input = { profile: null, granted: true, workoutEnabled: false, days: [] };
    const queued = service.reconcile(input, () => current);
    await Promise.resolve();
    current = false;
    release(webReminderPlan(input));
    await queued;
    expect(cancel).not.toHaveBeenCalled();
    expect(schedule).not.toHaveBeenCalled();
  });
});
