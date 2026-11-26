import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { provideRouter } from '@angular/router';
import { ProfileStore } from '../../core/stores/profile.store';
import { GroqCredentials } from '../../core/services/ai/groq-credentials';
import { AccountSession, type AccountIdentity } from '../../core/account/account-session';
import { AccountSync } from '../../core/account/account-sync';
import { LocalNotifications } from '../../core/services/notifications/local-notifications';
import { ReminderCoordinator } from '../../core/services/notifications/reminder-coordinator';
import { UserProfile } from '../../core/models/user-profile.model';
import SettingsPage from './settings.page';

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'p1',
    height_cm: 170,
    weight_kg: 65,
    birth_date: `${new Date().getFullYear() - 28}-01-01`,
    gender: 'male',
    goal: 'lose_weight',
    fitness_level: 'beginner',
    activity_factor: 1.55,
    bmr: 1500,
    tdee: 2000,
    target_calories: 1900,
    target_protein: 154,
    target_carbs: 200,
    target_fat: 60,
    theme: 'light',
    notif_morning: 0,
    notif_lunch: 0,
    notif_evening: 0,
    notif_weekly: 0,
    onboarding_completed: 1,
    created_at: '2025-01-01',
    updated_at: null,
    ...overrides,
  };
}

describe('SettingsPage', () => {
  let fixture: ComponentFixture<SettingsPage>;
  let component: SettingsPage;
  let profileSignal: ReturnType<typeof signal<UserProfile | null>>;
  let profileStore: { profile: typeof profileSignal; updateProfile: jasmine.Spy };
  let notifications: jasmine.SpyObj<LocalNotifications>;
  let reminders: jasmine.SpyObj<ReminderCoordinator>;
  let workoutEnabled: ReturnType<typeof signal<boolean>>;
  let groqEnabled: ReturnType<typeof signal<boolean>>;
  let groq: jasmine.SpyObj<GroqCredentials>;
  let account: ReturnType<typeof signal<AccountIdentity | null>>;
  let toastCtrl: jasmine.SpyObj<ToastController>;
  let toastEl: { present: jasmine.Spy };

  beforeEach(async () => {
    profileSignal = signal<UserProfile | null>(makeProfile());
    profileStore = {
      profile: profileSignal,
      updateProfile: jasmine
        .createSpy('updateProfile')
        .and.callFake(async (patch: Partial<UserProfile>) => {
          const cur = profileSignal();
          if (cur) profileSignal.set({ ...cur, ...patch });
        }),
    };
    notifications = jasmine.createSpyObj<LocalNotifications>('LocalNotifications', [
      'requestPermission',
    ]);
    workoutEnabled = signal(false);
    account = signal<AccountIdentity | null>(null);
    groqEnabled = signal(false);
    groq = jasmine.createSpyObj<GroqCredentials>('GroqCredentials', ['configure', 'remove'], {
      supported: true,
      configured: groqEnabled,
    });
    groq.configure.and.callFake(async () => {
      groqEnabled.set(true);
      return true;
    });
    groq.remove.and.callFake(async () => groqEnabled.set(false));
    reminders = jasmine.createSpyObj<ReminderCoordinator>(
      'ReminderCoordinator',
      ['setWorkoutEnabled', 'refresh', 'clear'],
      { workoutEnabled },
    );
    reminders.setWorkoutEnabled.and.callFake((enabled) => workoutEnabled.set(enabled));
    reminders.refresh.and.resolveTo();
    reminders.clear.and.resolveTo();
    toastEl = { present: jasmine.createSpy('present').and.resolveTo() };
    toastCtrl = jasmine.createSpyObj<ToastController>('ToastController', ['create']);
    toastCtrl.create.and.resolveTo(toastEl as unknown as HTMLIonToastElement);

    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        provideRouter([]),
        { provide: AccountSession, useValue: { required: false, current: account } },
        {
          provide: AccountSync,
          useValue: {
            status: signal('idle'),
            reason: signal(''),
            lastSync: signal(null),
            refreshStatus: async () => undefined,
          },
        },
        { provide: ProfileStore, useValue: profileStore },
        { provide: LocalNotifications, useValue: notifications },
        { provide: GroqCredentials, useValue: groq },
        { provide: ReminderCoordinator, useValue: reminders },
        { provide: ToastController, useValue: toastCtrl },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('bodySummary formats profile fields correctly', () => {
    expect(component.bodySummary()).toBe('170 cm, 65 kg, 28 tuổi, Nam');
  });

  it('offers separate key setup and removal actions to the device account', async () => {
    const screen = fixture.nativeElement as HTMLElement;
    expect(screen.textContent).not.toContain('Nhập khóa');

    account.set({ id: 'member-a', username: 'an', name: 'An' });
    fixture.detectChanges();
    expect(screen.textContent).toContain('Nhập khóa');

    await component.configureGroqKey();
    fixture.detectChanges();
    expect(screen.textContent).toContain('Đổi khóa');
    expect(screen.textContent).toContain('Đã lưu khóa Groq.');

    await component.removeGroqKey();
    fixture.detectChanges();
    expect(screen.textContent).toContain('Chưa nhập khóa');
    expect(screen.textContent).toContain('Đã gỡ khóa Groq.');
  });

  it('does not show success when the native Groq dialog is canceled', async () => {
    account.set({ id: 'member-a', username: 'an', name: 'An' });
    groqEnabled.set(true);
    groq.configure.and.resolveTo(false);

    await component.configureGroqKey();
    fixture.detectChanges();

    const screen = fixture.nativeElement as HTMLElement;
    expect(screen.textContent).toContain('Đổi khóa');
    expect(screen.textContent).not.toContain('Đã lưu khóa Groq.');
  });

  it('offers a separate workout reminder with the active-plan rule', () => {
    const screen = fixture.nativeElement as HTMLElement;
    const reminder = Array.from(screen.querySelectorAll('ion-toggle')).find((toggle) =>
      toggle.textContent?.includes('Nhắc buổi tập'),
    );

    expect(reminder?.textContent).toContain('ngày tập trong giáo án đang dùng');
    expect(reminder?.textContent).toContain('17:30');
  });

  it('labels an unknown legacy activity factor as an estimate', () => {
    profileSignal.set(makeProfile({ activity_factor: 1.31 }));
    expect(component.activitySummary()).toBe('Chưa xác định · tạm tính vận động vừa');
  });

  it('keeps other saved reminders paused when one is turned off after permission was denied', async () => {
    profileSignal.set(makeProfile({ notif_morning: 1, notif_weekly: 1 }));
    notifications.requestPermission.and.resolveTo(false);
    await component.resumeNotifications();
    await component.toggleNotif('morning', false);
    expect(profileSignal()?.notif_weekly).toBe(1);
    expect(reminders.refresh).toHaveBeenCalledOnceWith(undefined);
  });

  it('keeps saved reminders visible as paused after denial and resumes them when permission returns', async () => {
    profileSignal.set(makeProfile({ notif_morning: 1, notif_weekly: 1 }));
    notifications.requestPermission.and.resolveTo(false);
    await component.resumeNotifications();
    expect(component.notificationsPaused()).toBeTrue();
    expect(reminders.refresh).not.toHaveBeenCalled();
    notifications.requestPermission.and.resolveTo(true);
    await component.resumeNotifications();
    expect(component.notificationsPaused()).toBeFalse();
    expect(reminders.refresh).toHaveBeenCalledOnceWith(true);
    expect(profileStore.updateProfile).not.toHaveBeenCalled();
  });

  it('goalSummary maps goal value to Vietnamese label', () => {
    expect(component.goalSummary()).toBe('Giảm cân');
  });

  it('goalSummary renders "Tăng sức mạnh" for performance enum (canonical)', () => {
    profileSignal.set(makeProfile({ goal: 'performance' }));
    fixture.detectChanges();
    expect(component.goalSummary()).toBe('Tăng sức mạnh');
  });

  it('renders Carbs and Fat rows with values when set', () => {
    profileSignal.set(makeProfile({ target_carbs: 250, target_fat: 70 }));
    fixture.detectChanges();
    const html = (fixture.nativeElement as HTMLElement).innerHTML;
    expect(html).toContain('Carbs');
    expect(html).toContain('250 g');
    expect(html).toContain('Fat');
    expect(html).toContain('70 g');
  });

  it('shows Carbs and Fat as unset when their targets are null', () => {
    profileSignal.set(makeProfile({ target_carbs: null, target_fat: null }));
    fixture.detectChanges();
    const screen = fixture.nativeElement as HTMLElement;
    const targets = Array.from(screen.querySelectorAll('ion-item')).filter((item) =>
      ['Carbs', 'Fat'].includes(item.querySelector('ion-label')?.textContent?.trim() ?? ''),
    );
    expect(targets.map((item) => item.querySelector('ion-note')?.textContent?.trim())).toEqual([
      'Chưa đặt',
      'Chưa đặt',
    ]);
  });

  it('activitySummary maps activity_factor 1.55 to "Vận động vừa"', () => {
    expect(component.activitySummary()).toBe('Vận động vừa');
  });

  it('shows training experience separately from activity and displays all reminder times', () => {
    profileSignal.set(makeProfile({ activity_factor: 1.375, fitness_level: 'advanced' }));
    fixture.detectChanges();
    const screen = fixture.nativeElement as HTMLElement;
    expect(screen.querySelector('ion-item[routerLink="activity"]')?.textContent).toContain(
      'Vận động nhẹ, Nâng cao',
    );
    const reminders = Array.from(screen.querySelectorAll('ion-toggle p'), (p) =>
      p.textContent?.trim(),
    );
    expect(reminders).toEqual([
      'Khoảng 07:30',
      'Khoảng 12:00',
      'Khoảng 18:30',
      'Chủ nhật, khoảng 20:00',
      'Khoảng 17:30 vào ngày tập trong giáo án đang dùng.',
    ]);
  });

  it('toggleNotif denied path does not update profile', async () => {
    notifications.requestPermission.and.resolveTo(false);
    const ok = await component.toggleNotif('morning', true);
    expect(ok).toBe(false);
    expect(profileStore.updateProfile).not.toHaveBeenCalled();
    expect(reminders.refresh).not.toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalled();
    expect(toastEl.present).toHaveBeenCalled();
  });

  it('toggleNotif granted path updates profile and calls sync with current flags', async () => {
    notifications.requestPermission.and.resolveTo(true);
    const ok = await component.toggleNotif('lunch', true);
    expect(ok).toBe(true);
    expect(profileStore.updateProfile).toHaveBeenCalledWith({ notif_lunch: 1 });
    expect(reminders.refresh).toHaveBeenCalledOnceWith(true);
  });

  it('toggleNotif disabling does not request permission', async () => {
    profileSignal.set(makeProfile({ notif_evening: 1 }));
    const ok = await component.toggleNotif('evening', false);
    expect(ok).toBe(true);
    expect(notifications.requestPermission).not.toHaveBeenCalled();
    expect(profileStore.updateProfile).toHaveBeenCalledWith({ notif_evening: 0 });
    expect(reminders.refresh).toHaveBeenCalledOnceWith(undefined);
  });

  it('persists a workout selection on the device after permission is granted', async () => {
    notifications.requestPermission.and.resolveTo(true);

    await component.onToggleChange('workout', true, { checked: true });

    expect(workoutEnabled()).toBeTrue();
    expect(reminders.refresh).toHaveBeenCalledOnceWith(true);
    expect(profileStore.updateProfile).not.toHaveBeenCalled();
  });

  it('keeps a saved workout reminder visibly paused without permission', async () => {
    workoutEnabled.set(true);
    notifications.requestPermission.and.resolveTo(false);

    await component.resumeNotifications();

    expect(component.notificationsPaused()).toBeTrue();
    expect(reminders.setWorkoutEnabled).not.toHaveBeenCalled();
  });

  it('drops a workout opt-in if the active session changes during the permission request', async () => {
    let allow!: (granted: boolean) => void;
    const firstLogin = { id: 'member-a', username: 'an', name: 'An' };
    account.set(firstLogin);
    notifications.requestPermission.and.returnValue(
      new Promise<boolean>((resolve) => {
        allow = resolve;
      }),
    );
    const pending = component.toggleNotif('workout', true);
    account.set({ ...firstLogin });
    allow(true);

    expect(await pending).toBeFalse();
    expect(reminders.setWorkoutEnabled).not.toHaveBeenCalled();
    expect(reminders.refresh).not.toHaveBeenCalled();
  });

  it('onToggleChange ignores unchanged notification state', async () => {
    profileSignal.set(makeProfile({ notif_morning: 1 }));
    await component.onToggleChange('morning', true, { checked: true });

    expect(notifications.requestPermission).not.toHaveBeenCalled();
    expect(profileStore.updateProfile).not.toHaveBeenCalled();
  });

  it('keeps an inactive reminder off when notification permission is denied', async () => {
    notifications.requestPermission.and.resolveTo(false);
    const toggle = { checked: true };
    await component.onToggleChange('morning', true, toggle);

    expect(toggle.checked).toBeFalse();
    expect(profileStore.updateProfile).not.toHaveBeenCalled();
  });

  it('keeps an inactive reminder off while the notification permission prompt is open', async () => {
    let finishPermission!: (granted: boolean) => void;
    notifications.requestPermission.and.returnValue(
      new Promise<boolean>((resolve) => {
        finishPermission = resolve;
      }),
    );
    const toggle = { checked: true };

    const change = component.onToggleChange('morning', true, toggle);
    const displayedBeforeAnswer = toggle.checked;
    finishPermission(false);
    await change;

    expect(displayedBeforeAnswer).toBeFalse();
    expect(profileStore.updateProfile).not.toHaveBeenCalled();
  });
});
