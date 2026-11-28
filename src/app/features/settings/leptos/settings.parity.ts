import { TestBed } from '@angular/core/testing';
import { signal, type Type } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular, ToastController } from '@ionic/angular/standalone';
import { ProfileStore } from '../../../core/stores/profile.store';
import { LocalDay } from '../../../core/stores/local-day';
import { AccountSession, type AccountIdentity } from '../../../core/account/account-session';
import { AccountSync } from '../../../core/account/account-sync';
import { GroqCredentials } from '../../../core/services/ai/groq-credentials';
import { LocalNotifications } from '../../../core/services/notifications/local-notifications';
import { ReminderCoordinator } from '../../../core/services/notifications/reminder-coordinator';
import type { UserProfile } from '../../../core/models/user-profile.model';
import SettingsPage from '../settings.page';
import { loadSettingsPage } from './settings-renderer';

import { profile, frame } from './settings.fixture';
function visible(root: HTMLElement) {
  const clean = (s: string | null) => s?.trim().replace(/\s+/g, ' ');
  return {
    labels: Array.from(
      root.querySelectorAll(
        'h2,h3,ion-label>p,ion-note,ion-item>p,.device-note,.device-current,.workout-conflict__choice>p',
      ),
      (n) => clean(n.textContent),
    ),
    actions: Array.from(root.querySelectorAll<HTMLElement>('ion-button,ion-item[button]'), (n) => [
      clean(n.querySelector('h3')?.textContent ?? n.textContent),
      (n as HTMLButtonElement).disabled ?? false,
      n.getAttribute('aria-label'),
    ]),
    toggles: Array.from(root.querySelectorAll('ion-toggle'), (n) => [
      n.checked,
      clean(n.textContent),
    ]),
  };
}
describe('Settings home Angular and Leptos', () => {
  it('keeps the broadcast account state, reminders, key state and conflict choices identical', async () => {
    const owner = signal<AccountIdentity | null>({ id: 'aaa', username: 'an', name: 'An' }),
      currentProfile = signal<UserProfile | null>(profile);
    const status = signal('saved'),
      reason = signal(''),
      conflict = signal<unknown>(null),
      key = signal(false);
    const choose = jasmine.createSpy('resolve'),
      workout = jasmine.createSpy('resolveWorkout');
    const session = {
      required: true,
      current: owner,
      listDeviceSessions: jasmine
        .createSpy()
        .and.resolveTo([
          { id: 'device-a1', label: 'Máy An', current: true, createdAt: '2026-11-20T08:00:00Z' },
        ]),
      clear: jasmine.createSpy().and.rejectWith(Error()),
    };
    const updates = jasmine.createSpy('updateProfile').and.resolveTo();
    const permission = jasmine.createSpy('requestPermission').and.resolveTo(false);
    const configure = jasmine.createSpy('configure').and.resolveTo(false);
    const next = await loadSettingsPage('home');
    expect(next).not.toBe(SettingsPage);
    await TestBed.configureTestingModule({
      imports: [SettingsPage, next],
      providers: [
        provideRouter([]),
        provideIonicAngular(),
        { provide: ProfileStore, useValue: { profile: currentProfile, updateProfile: updates } },
        { provide: AccountSession, useValue: session },
        {
          provide: AccountSync,
          useValue: {
            status,
            reason,
            lastSync: signal('2026-11-28T03:04:00Z'),
            workoutConflict: conflict,
            resolveConflict: choose,
            resolveWorkoutConflict: workout,
            sync: jasmine.createSpy(),
            refreshStatus: async () => undefined,
          },
        },
        {
          provide: LocalNotifications,
          useValue: { requestPermission: permission, hasPermission: async () => true },
        },
        {
          provide: ReminderCoordinator,
          useValue: { workoutEnabled: signal(true), refresh: async () => undefined },
        },
        {
          provide: ToastController,
          useValue: { create: async () => ({ present: async () => undefined }) },
        },
        {
          provide: GroqCredentials,
          useValue: {
            configured: key,
            supported: true,
            configure,
            remove: async () => undefined,
          },
        },
      ],
    }).compileComponents();
    TestBed.inject(LocalDay).iso.set('2026-11-28');
    const before = TestBed.createComponent(SettingsPage),
      after = TestBed.createComponent(next as Type<unknown>);
    const first: HTMLElement = before.nativeElement,
      second: HTMLElement = after.nativeElement;
    const sync = async () => {
      before.detectChanges();
      after.detectChanges();
      await frame();
      await frame();
      expect(visible(second)).toEqual(visible(first));
    };
    await sync();
    expect(second.querySelector('[data-settings-renderer]')).not.toBeNull();
    let grant!: (v: boolean) => void;
    permission.and.returnValue(new Promise<boolean>((resolve) => (grant = resolve)));
    for (const screen of [first, second]) {
      const lunch = screen.querySelectorAll('ion-toggle')[1];
      lunch.checked = true;
      lunch.dispatchEvent(
        new CustomEvent('ionChange', { detail: { checked: true }, bubbles: true }),
      );
      expect(lunch.checked).toBeFalse();
    }
    expect(permission.calls.count()).toBe(2);
    owner.set({ id: 'bbb', username: 'binh', name: 'Bình' });
    grant(true);
    await sync();
    expect(updates).not.toHaveBeenCalled();
    permission.and.resolveTo(true);
    for (const screen of [first, second])
      screen
        .querySelectorAll('ion-toggle')[1]
        .dispatchEvent(new CustomEvent('ionChange', { detail: { checked: true }, bubbles: true }));
    await sync();
    expect(updates.calls.allArgs()).toEqual([[{ notif_lunch: 1 }], [{ notif_lunch: 1 }]]);
    let completeKey!: (v: boolean) => void;
    configure.and.returnValue(new Promise<boolean>((resolve) => (completeKey = resolve)));
    for (const screen of [first, second])
      Array.from(screen.querySelectorAll('ion-button'))
        .find((b) => b.textContent?.trim() === 'Nhập khóa')!
        .click();
    expect(configure).toHaveBeenCalledTimes(2);
    owner.set({ id: 'ccc', username: 'chi', name: 'Chi' });
    completeKey(true);
    await sync();
    expect(second.textContent).not.toContain('Đã lưu khóa Groq.');
    for (const screen of [first, second])
      screen.querySelector<HTMLElement>('.sign-out-row')!.click();
    await sync();
    expect(second.textContent).toContain('Chưa thể đăng xuất.');
    for (const v of ['idle', 'working', 'offline', 'expired', 'forbidden', 'error', 'conflict']) {
      status.set(v);
      await sync();
    }
    reason.set('session_revoked');
    status.set('expired');
    await sync();
    status.set('conflict');
    conflict.set({
      operationId: 'op',
      revision: 1,
      items: [
        {
          kind: 'workout_set_field',
          key: 'a',
          sessionId: 'w',
          sessionDate: '2026-11-20',
          exerciseName: 'Squat',
          setNumber: 2,
          field: 'reps',
          local: 7,
          server: 9,
        },
      ],
    });
    await sync();
    for (const root of [first, second])
      (root.querySelector('.workout-conflict__options ion-button') as HTMLElement).click();
    await sync();
    for (const root of [first, second])
      (root.querySelector('.workout-conflict ion-button[expand=block]') as HTMLElement).click();
    expect(workout.calls.allArgs()).toEqual([[{ a: 'local' }], [{ a: 'local' }]]);
    key.set(true);
    await sync();
    owner.set(null);
    await sync();
    currentProfile.set(null);
    await sync();
    before.destroy();
    after.destroy();
  });
});
