import { TestBed } from '@angular/core/testing';
import { LocalNotifications, capLocalNotifications } from './local-notifications';

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
    it('cancels all 4 known IDs and does not schedule when all flags are false', async () => {
      await svc.sync({ morning: false, lunch: false, evening: false, weekly: false });
      expect(cancelSpy).toHaveBeenCalledWith({
        notifications: [{ id: 101 }, { id: 102 }, { id: 103 }, { id: 104 }],
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
  });
});
