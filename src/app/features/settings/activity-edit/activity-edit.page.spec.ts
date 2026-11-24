import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { ProfileStore } from '../../../core/stores/profile.store';
import { recalcTargets } from '../../../core/services/profile/recalc-targets';
import { UserProfile } from '../../../core/models/user-profile.model';
import ActivityEditPage from './activity-edit.page';

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

describe('ActivityEditPage', () => {
  let fixture: ComponentFixture<ActivityEditPage>;
  let component: ActivityEditPage;
  let profileSignal: ReturnType<typeof signal<UserProfile | null>>;
  let profileStore: { profile: typeof profileSignal; updateProfile: jasmine.Spy };
  let location: jasmine.SpyObj<Location>;

  async function setup(profile: UserProfile | null): Promise<void> {
    profileSignal = signal<UserProfile | null>(profile);
    profileStore = {
      profile: profileSignal,
      updateProfile: jasmine
        .createSpy('updateProfile')
        .and.callFake(async (patch: Partial<UserProfile>) => {
          const cur = profileSignal();
          if (cur) profileSignal.set({ ...cur, ...patch });
        }),
    };
    location = jasmine.createSpyObj<Location>('Location', ['back']);

    await TestBed.configureTestingModule({
      imports: [ActivityEditPage],
      providers: [
        provideRouter([]),
        { provide: ProfileStore, useValue: profileStore },
        { provide: Location, useValue: location },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('ngOnInit populates factor from profile', async () => {
    await setup(makeProfile({ activity_factor: 1.375 }));
    expect(component.factor()).toBe(1.375);
  });

  it('does nothing in ngOnInit when profile is null', async () => {
    await setup(null);
    expect(component.factor()).toBe(1.55);
    expect(component.preview()).toBeNull();
  });

  it('saves a new training level independently of activity and energy targets', async () => {
    await setup(makeProfile({ fitness_level: 'intermediate', calorie_target_mode: 'manual' }));
    expect(component.fitnessLevel()).toBe('intermediate');
    component.fitnessLevel.set('advanced');
    expect(component.isDirty()).toBeTrue();
    await component.save();
    expect(profileStore.updateProfile).toHaveBeenCalledOnceWith({ fitness_level: 'advanced' });
    expect(location.back).toHaveBeenCalled();
  });

  it('preview reflects current factor (1.2 vs 1.55 yields different tdee)', async () => {
    await setup(makeProfile());
    component.factor.set(1.2);
    const lo = component.preview();
    component.factor.set(1.55);
    const hi = component.preview();
    expect(lo).not.toBeNull();
    expect(hi).not.toBeNull();
    expect(lo!.tdee).toBeLessThan(hi!.tdee);
    const expected = recalcTargets({
      height_cm: 170,
      weight_kg: 65,
      age: 28,
      gender: 'male',
      goal: 'lose_weight',
      activity_factor: 1.2,
    });
    expect(lo).toEqual(expected);
  });

  it('activeLabel returns correct VN label for each factor', async () => {
    await setup(makeProfile());
    component.factor.set(1.2);
    expect(component.activeLabel()).toBe('Ít vận động');
    component.factor.set(1.375);
    expect(component.activeLabel()).toBe('Vận động nhẹ');
    component.factor.set(1.55);
    expect(component.activeLabel()).toBe('Vận động vừa');
    component.factor.set(1.725);
    expect(component.activeLabel()).toBe('Vận động nặng');
  });

  for (const mode of ['auto', 'manual'] as const) {
    it(`passes only the edited activity factor with ${mode} targets`, async () => {
      await setup(makeProfile({ calorie_target_mode: mode, protein_target_mode: mode }));
      component.factor.set(1.725);
      await component.save();
      expect(profileStore.updateProfile).toHaveBeenCalledOnceWith({ activity_factor: 1.725 });
      expect(location.back).toHaveBeenCalled();
    });
  }

  it('save() bails when profile is null', async () => {
    await setup(null);
    await component.save();
    expect(profileStore.updateProfile).not.toHaveBeenCalled();
    expect(location.back).not.toHaveBeenCalled();
  });

  it('keeps the edit after a failed write and handles two retry taps only once', async () => {
    await setup(makeProfile());
    component.fitnessLevel.set('advanced');
    fixture.detectChanges();
    const button: HTMLIonButtonElement = fixture.nativeElement.querySelector('.save-button');
    profileStore.updateProfile.and.rejectWith(new Error('write failed'));
    button.click();
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(profileStore.updateProfile).toHaveBeenCalledTimes(1);
    expect(location.back).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('ion-footer [role="alert"]')?.textContent).toContain(
      'thử lại',
    );
    expect(button.disabled).toBeFalse();
    expect(component.fitnessLevel()).toBe('advanced');

    profileStore.updateProfile.and.resolveTo();
    button.click();
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(profileStore.updateProfile).toHaveBeenCalledTimes(2);
    expect(location.back).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('ion-footer [role="alert"]')).toBeNull();
  });
});
