import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { Database } from './core/services/database/database';
import { ProfileStore } from './core/stores/profile.store';
import { NetworkStore } from './core/stores/network.store';

describe('App birthday refresh', () => {
  const realDate = window.Date;
  afterEach(() => {
    window.Date = realDate;
  });

  it('detects a late date change after resume and stops watching in the background', () => {
    const refreshAge = jasmine.createSpy('refreshAge').and.resolveTo();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: ProfileStore, useValue: { refreshAge } },
        { provide: Database, useValue: { execute: () => Promise.resolve() } },
        { provide: NetworkStore, useValue: { start: () => Promise.resolve() } },
      ],
    }).overrideComponent(App, { set: { imports: [], template: '' } });

    const fixture = TestBed.createComponent(App);
    const hidden = spyOnProperty(document, 'hidden', 'get').and.returnValue(false);
    const schedule = spyOn(window, 'setTimeout').and.returnValue(151);
    const cancel = spyOn(window, 'clearTimeout');

    jasmine.clock().mockDate(new realDate(2026, 10, 24, 22));
    window.dispatchEvent(new Event('pageshow'));
    const now: Date = refreshAge.calls.mostRecent().args[0];
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeLeft = midnight.getTime() - now.getTime();
    const runCheck = (): void => (schedule.calls.mostRecent().args[0] as () => void)();
    expect(schedule.calls.mostRecent().args[1]).toBe(Math.min(1000, timeLeft));
    for (let n = 0; n < 5; n++) runCheck();
    expect(refreshAge).toHaveBeenCalledTimes(1);
    expect(schedule.calls.mostRecent().args[1]).toBe(Math.min(60_000, timeLeft));
    jasmine.clock().mockDate(new realDate(midnight.getTime()));
    runCheck();
    expect(refreshAge).toHaveBeenCalledTimes(2);
    expect(refreshAge.calls.mostRecent().args[0].getTime()).toBe(midnight.getTime());

    hidden.and.returnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(cancel).toHaveBeenCalledWith(151);
    expect(refreshAge).toHaveBeenCalledTimes(2);
    hidden.and.returnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(refreshAge).toHaveBeenCalledTimes(3);
    fixture.destroy();
  });
});
