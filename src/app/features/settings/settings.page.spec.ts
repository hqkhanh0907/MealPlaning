import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { provideRouter } from '@angular/router';
import { ProfileStore } from '../../core/stores/profile.store';
import { Theme } from '../../core/services/theme/theme-service';
import { LocalNotifications } from '../../core/services/notifications/local-notifications';
import { UserProfile } from '../../core/models/user-profile.model';
import SettingsPage from './settings.page';

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'p1',
    height_cm: 170,
    weight_kg: 65,
    age: 28,
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
    theme: 'system',
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
  let theme: jasmine.SpyObj<Theme>;
  let notifications: jasmine.SpyObj<LocalNotifications>;
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
    theme = jasmine.createSpyObj<Theme>('Theme', ['apply']);
    notifications = jasmine.createSpyObj<LocalNotifications>('LocalNotifications', [
      'requestPermission',
      'sync',
    ]);
    notifications.sync.and.resolveTo();
    toastEl = { present: jasmine.createSpy('present').and.resolveTo() };
    toastCtrl = jasmine.createSpyObj<ToastController>('ToastController', ['create']);
    toastCtrl.create.and.resolveTo(toastEl as unknown as HTMLIonToastElement);

    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        provideRouter([]),
        { provide: ProfileStore, useValue: profileStore },
        { provide: Theme, useValue: theme },
        { provide: LocalNotifications, useValue: notifications },
        { provide: ToastController, useValue: toastCtrl },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('bodySummary formats profile fields correctly', () => {
    expect(component.bodySummary()).toBe('170cm · 65kg · 28 tuổi · Nam');
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

  it('renders em-dash for Carbs/Fat when null', () => {
    profileSignal.set(makeProfile({ target_carbs: null, target_fat: null }));
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    // Both rows should show — (em-dash). Match at least 2 occurrences.
    const matches = text.match(/—/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('activitySummary maps activity_factor 1.55 to "Vừa"', () => {
    expect(component.activitySummary()).toBe('Vừa');
  });

  it('setTheme updates store and applies theme service', async () => {
    await component.setTheme('dark');
    expect(theme.apply).toHaveBeenCalledWith('dark');
    expect(profileStore.updateProfile).toHaveBeenCalledWith({ theme: 'dark' });
  });

  it('toggleNotif denied path does not update profile', async () => {
    notifications.requestPermission.and.resolveTo(false);
    const ok = await component.toggleNotif('morning', true);
    expect(ok).toBe(false);
    expect(profileStore.updateProfile).not.toHaveBeenCalled();
    expect(notifications.sync).not.toHaveBeenCalled();
    expect(toastCtrl.create).toHaveBeenCalled();
    expect(toastEl.present).toHaveBeenCalled();
  });

  it('toggleNotif granted path updates profile and calls sync with current flags', async () => {
    notifications.requestPermission.and.resolveTo(true);
    const ok = await component.toggleNotif('lunch', true);
    expect(ok).toBe(true);
    expect(profileStore.updateProfile).toHaveBeenCalledWith({ notif_lunch: 1 });
    expect(notifications.sync).toHaveBeenCalledWith({
      morning: false,
      lunch: true,
      evening: false,
      weekly: false,
    });
  });

  it('toggleNotif disabling does not request permission', async () => {
    profileSignal.set(makeProfile({ notif_evening: 1 }));
    const ok = await component.toggleNotif('evening', false);
    expect(ok).toBe(true);
    expect(notifications.requestPermission).not.toHaveBeenCalled();
    expect(profileStore.updateProfile).toHaveBeenCalledWith({ notif_evening: 0 });
    expect(notifications.sync).toHaveBeenCalled();
  });
});
