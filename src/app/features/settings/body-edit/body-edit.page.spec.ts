import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { ProfileStore } from '../../../core/stores/profile.store';
import { recalcTargets } from '../../../core/services/profile/recalc-targets';
import { UserProfile } from '../../../core/models/user-profile.model';
import BodyEditPage from './body-edit.page';

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

describe('BodyEditPage', () => {
  let fixture: ComponentFixture<BodyEditPage>;
  let component: BodyEditPage;
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
      imports: [BodyEditPage],
      providers: [
        provideRouter([]),
        { provide: ProfileStore, useValue: profileStore },
        { provide: Location, useValue: location },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BodyEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('ngOnInit populates signals from profile', async () => {
    await setup(makeProfile());
    expect(component.height()).toBe(170);
    expect(component.weight()).toBe(65);
    expect(component.age()).toBe(28);
    expect(component.gender()).toBe('male');
  });

  it('does nothing in ngOnInit when profile is null', async () => {
    await setup(null);
    expect(component.height()).toBe(0);
    expect(component.formInvalid()).toBe(true);
  });

  it('heightInvalid: 99 invalid, 100 valid, 250 valid, 251 invalid', async () => {
    await setup(makeProfile());
    component.height.set(99);
    expect(component.heightInvalid()).toBe(true);
    component.height.set(100);
    expect(component.heightInvalid()).toBe(false);
    component.height.set(250);
    expect(component.heightInvalid()).toBe(false);
    component.height.set(251);
    expect(component.heightInvalid()).toBe(true);
  });

  it('weightInvalid: 29 invalid, 30 valid, 300 valid, 301 invalid', async () => {
    await setup(makeProfile());
    component.weight.set(29);
    expect(component.weightInvalid()).toBe(true);
    component.weight.set(30);
    expect(component.weightInvalid()).toBe(false);
    component.weight.set(300);
    expect(component.weightInvalid()).toBe(false);
    component.weight.set(301);
    expect(component.weightInvalid()).toBe(true);
  });

  it('ageInvalid: 9 invalid, 10 valid, 120 valid, 121 invalid', async () => {
    await setup(makeProfile());
    component.age.set(9);
    expect(component.ageInvalid()).toBe(true);
    component.age.set(10);
    expect(component.ageInvalid()).toBe(false);
    component.age.set(120);
    expect(component.ageInvalid()).toBe(false);
    component.age.set(121);
    expect(component.ageInvalid()).toBe(true);
  });

  it('preview returns null when form invalid, recalc result when valid', async () => {
    await setup(makeProfile());
    expect(component.preview()).not.toBeNull();
    component.height.set(50);
    expect(component.preview()).toBeNull();
    component.height.set(170);
    const expected = recalcTargets({
      height_cm: 170,
      weight_kg: 65,
      age: 28,
      gender: 'male',
      goal: 'lose_weight',
      activity_factor: 1.55,
    });
    expect(component.preview()).toEqual(expected);
  });

  it('save() updates targets when they were auto-computed', async () => {
    const auto = recalcTargets({
      height_cm: 170,
      weight_kg: 65,
      age: 28,
      gender: 'male',
      goal: 'lose_weight',
      activity_factor: 1.55,
    });
    await setup(
      makeProfile({
        target_calories: auto.target_calories,
        target_protein: auto.target_protein,
      }),
    );
    component.weight.set(70);
    await component.save();

    expect(profileStore.updateProfile).toHaveBeenCalled();
    const patch = profileStore.updateProfile.calls.mostRecent().args[0] as Partial<UserProfile>;
    expect(patch.weight_kg).toBe(70);
    expect(patch.target_calories).toBeDefined();
    expect(patch.target_protein).toBeDefined();
    expect(location.back).toHaveBeenCalled();
  });

  it('save() preserves customized target_calories and target_protein when overridden', async () => {
    await setup(
      makeProfile({
        target_calories: 9999,
        target_protein: 999,
      }),
    );
    component.weight.set(70);
    await component.save();

    const patch = profileStore.updateProfile.calls.mostRecent().args[0] as Partial<UserProfile>;
    expect(patch.weight_kg).toBe(70);
    expect('target_calories' in patch).toBe(false);
    expect('target_protein' in patch).toBe(false);
    expect(patch.bmr).toBeDefined();
    expect(patch.tdee).toBeDefined();
  });

  it('save() bails when profile is null', async () => {
    await setup(null);
    await component.save();
    expect(profileStore.updateProfile).not.toHaveBeenCalled();
    expect(location.back).not.toHaveBeenCalled();
  });

  it('save() bails when preview is null (invalid form)', async () => {
    await setup(makeProfile());
    component.height.set(50);
    await component.save();
    expect(profileStore.updateProfile).not.toHaveBeenCalled();
  });
});
