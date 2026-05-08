import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { ProfileStore } from '../../../core/stores/profile.store';
import { recalcTargets } from '../../../core/services/profile/recalc-targets';
import { UserProfile } from '../../../core/models/user-profile.model';
import GoalsEditPage from './goals-edit.page';

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'p1',
    height_cm: 170,
    weight_kg: 65,
    age: 28,
    gender: 'male',
    goal: 'maintain',
    fitness_level: 'beginner',
    activity_factor: 1.55,
    bmr: 1500,
    tdee: 2000,
    target_calories: 2000,
    target_protein: 120,
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

describe('GoalsEditPage', () => {
  let fixture: ComponentFixture<GoalsEditPage>;
  let component: GoalsEditPage;
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
      imports: [GoalsEditPage],
      providers: [
        provideRouter([]),
        { provide: ProfileStore, useValue: profileStore },
        { provide: Location, useValue: location },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GoalsEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('ngOnInit populates signals from profile', async () => {
    await setup(makeProfile());
    expect(component.goal()).toBe('maintain');
    expect(component.calo()).toBe(2000);
    expect(component.protein()).toBe(120);
  });

  it('does nothing in ngOnInit when profile is null', async () => {
    await setup(null);
    expect(component.calo()).toBe(0);
    expect(component.formInvalid()).toBe(true);
  });

  it('changing goal auto-fills calo/protein from recalc when user has not edited', async () => {
    await setup(makeProfile());
    component.setGoal('gain_muscle');
    fixture.detectChanges();
    await fixture.whenStable();
    const r = recalcTargets({
      height_cm: 170,
      weight_kg: 65,
      age: 28,
      gender: 'male',
      goal: 'gain_muscle',
      activity_factor: 1.55,
    });
    expect(component.calo()).toBe(r.target_calories);
    expect(component.protein()).toBe(r.target_protein);
  });

  it('setCalo flips userTouched flag so subsequent goal change does NOT overwrite', async () => {
    await setup(makeProfile());
    component.setCalo(2500);
    component.setGoal('gain_muscle');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.calo()).toBe(2500);
  });

  it('setProtein flips userTouched flag so subsequent goal change does NOT overwrite protein', async () => {
    await setup(makeProfile());
    component.setProtein(180);
    component.setGoal('gain_muscle');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.protein()).toBe(180);
  });

  it('reset() restores recalc-derived values and clears touched flag', async () => {
    await setup(makeProfile());
    component.setCalo(2500);
    component.setProtein(200);
    component.setGoal('gain_muscle');
    fixture.detectChanges();
    await fixture.whenStable();
    // user-touched, so values stayed manual
    expect(component.calo()).toBe(2500);

    component.reset();
    const r = recalcTargets({
      height_cm: 170,
      weight_kg: 65,
      age: 28,
      gender: 'male',
      goal: 'gain_muscle',
      activity_factor: 1.55,
    });
    expect(component.calo()).toBe(r.target_calories);
    expect(component.protein()).toBe(r.target_protein);

    // After reset, changing goal should auto-fill again.
    component.setGoal('lose_weight');
    fixture.detectChanges();
    await fixture.whenStable();
    const r2 = recalcTargets({
      height_cm: 170,
      weight_kg: 65,
      age: 28,
      gender: 'male',
      goal: 'lose_weight',
      activity_factor: 1.55,
    });
    expect(component.calo()).toBe(r2.target_calories);
  });

  it('reset() bails when profile is null', async () => {
    await setup(null);
    component.reset();
    expect(component.calo()).toBe(0);
  });

  it('caloInvalid: 799 invalid, 800 valid, 6000 valid, 6001 invalid', async () => {
    await setup(makeProfile());
    component.calo.set(799);
    expect(component.caloInvalid()).toBe(true);
    component.calo.set(800);
    expect(component.caloInvalid()).toBe(false);
    component.calo.set(6000);
    expect(component.caloInvalid()).toBe(false);
    component.calo.set(6001);
    expect(component.caloInvalid()).toBe(true);
  });

  it('proteinInvalid: 19 invalid, 20 valid, 400 valid, 401 invalid', async () => {
    await setup(makeProfile());
    component.protein.set(19);
    expect(component.proteinInvalid()).toBe(true);
    component.protein.set(20);
    expect(component.proteinInvalid()).toBe(false);
    component.protein.set(400);
    expect(component.proteinInvalid()).toBe(false);
    component.protein.set(401);
    expect(component.proteinInvalid()).toBe(true);
  });

  it('save() persists goal + targets and navigates back', async () => {
    await setup(makeProfile());
    component.setGoal('gain_muscle');
    component.setCalo(2400);
    component.setProtein(150);
    await component.save();

    expect(profileStore.updateProfile).toHaveBeenCalled();
    const patch = profileStore.updateProfile.calls.mostRecent().args[0] as Partial<UserProfile>;
    expect(patch.goal).toBe('gain_muscle');
    expect(patch.target_calories).toBe(2400);
    expect(patch.target_protein).toBe(150);
    expect(location.back).toHaveBeenCalled();
  });

  // === Story 2.1: carbs/fat targets, label canonical, selected card ===

  it('ngOnInit seeds carbs/fat from profile (number values)', async () => {
    await setup(makeProfile({ target_carbs: 250, target_fat: 70 }));
    expect(component.carbs()).toBe(250);
    expect(component.fat()).toBe(70);
  });

  it('ngOnInit seeds carbs/fat as null when profile has null', async () => {
    await setup(makeProfile({ target_carbs: null, target_fat: null }));
    expect(component.carbs()).toBeNull();
    expect(component.fat()).toBeNull();
  });

  it('save() persists target_carbs and target_fat from inputs', async () => {
    await setup(makeProfile({ target_carbs: null, target_fat: null }));
    component.setCarbs(250);
    component.setFat(70);
    await component.save();
    const patch = profileStore.updateProfile.calls.mostRecent().args[0] as Partial<UserProfile>;
    expect(patch.target_carbs).toBe(250);
    expect(patch.target_fat).toBe(70);
  });

  it('save() persists null when carbs/fat input cleared', async () => {
    await setup(makeProfile({ target_carbs: 250, target_fat: 70 }));
    component.setCarbs(null);
    component.setFat(null);
    await component.save();
    const patch = profileStore.updateProfile.calls.mostRecent().args[0] as Partial<UserProfile>;
    expect(patch.target_carbs).toBeNull();
    expect(patch.target_fat).toBeNull();
  });

  it('setCarbs treats NaN as null (cleared input emits NaN)', async () => {
    await setup(makeProfile());
    component.setCarbs(Number.NaN);
    expect(component.carbs()).toBeNull();
  });

  it('carbsInvalid: null valid, -1 invalid, 0 valid, 1000 valid, 1001 invalid', async () => {
    await setup(makeProfile());
    component.carbs.set(null);
    expect(component.carbsInvalid()).toBe(false);
    component.carbs.set(-1);
    expect(component.carbsInvalid()).toBe(true);
    component.carbs.set(0);
    expect(component.carbsInvalid()).toBe(false);
    component.carbs.set(1000);
    expect(component.carbsInvalid()).toBe(false);
    component.carbs.set(1001);
    expect(component.carbsInvalid()).toBe(true);
  });

  it('fatInvalid: null valid, -1 invalid, 0 valid, 1000 valid, 1001 invalid', async () => {
    await setup(makeProfile());
    component.fat.set(null);
    expect(component.fatInvalid()).toBe(false);
    component.fat.set(-1);
    expect(component.fatInvalid()).toBe(true);
    component.fat.set(0);
    expect(component.fatInvalid()).toBe(false);
    component.fat.set(1000);
    expect(component.fatInvalid()).toBe(false);
    component.fat.set(1001);
    expect(component.fatInvalid()).toBe(true);
  });

  it('formInvalid is true when carbs out of range', async () => {
    await setup(makeProfile());
    component.carbs.set(1500);
    expect(component.formInvalid()).toBe(true);
  });

  it('formInvalid is true when fat out of range', async () => {
    await setup(makeProfile());
    component.fat.set(-10);
    expect(component.formInvalid()).toBe(true);
  });

  it('goalOptions has performance label = "Tăng sức mạnh" (canonical)', async () => {
    await setup(makeProfile());
    const performanceOpt = component.goalOptions.find((o) => o.value === 'performance');
    expect(performanceOpt?.label).toBe('Tăng sức mạnh');
    expect(component.goalOptions.some((o) => o.label === 'Tăng hiệu suất')).toBe(false);
  });

  it('ngOnInit with non-default goal does NOT overwrite stored manual targets', async () => {
    // Regression: persisted goal !== signal default ('maintain') used to trigger
    // the auto-suggest effect on initial load and clobber manual targets.
    await setup(
      makeProfile({
        goal: 'lose_weight',
        target_calories: 9999, // intentionally unrealistic to detect overwrite
        target_protein: 999,
      }),
    );
    expect(component.goal()).toBe('lose_weight');
    expect(component.calo()).toBe(9999);
    expect(component.protein()).toBe(999);
  });

  it('save() bails when form invalid', async () => {
    await setup(makeProfile());
    component.setCalo(50);
    await component.save();
    expect(profileStore.updateProfile).not.toHaveBeenCalled();
    expect(location.back).not.toHaveBeenCalled();
  });
});
