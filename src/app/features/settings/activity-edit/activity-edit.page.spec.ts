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
    component.factor.set(1.725);
    await component.save();

    const patch = profileStore.updateProfile.calls.mostRecent().args[0] as Partial<UserProfile>;
    expect(patch.activity_factor).toBe(1.725);
    expect(patch.bmr).toBeDefined();
    expect(patch.tdee).toBeDefined();
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
    component.factor.set(1.725);
    await component.save();

    const patch = profileStore.updateProfile.calls.mostRecent().args[0] as Partial<UserProfile>;
    expect(patch.activity_factor).toBe(1.725);
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
});
