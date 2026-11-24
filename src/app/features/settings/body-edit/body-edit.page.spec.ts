import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { ProfileStore } from '../../../core/stores/profile.store';
import { updateMeasurementTargets } from '../../../core/services/profile/profile-measurement-update';
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
          if (cur)
            profileSignal.set({ ...cur, ...updateMeasurementTargets(cur, patch, new Date()) });
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
    expect(component.height()).toBeNull();
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
    expect(profileSignal()?.target_calories).toBe(2023);
    expect(profileSignal()?.target_protein).toBe(154);
    expect(location.back).toHaveBeenCalled();
  });

  it('keeps an explicit manual protein target equal to the old suggestion while calories update', async () => {
    await setup(
      makeProfile({
        calorie_target_mode: 'auto',
        protein_target_mode: 'manual',
        target_protein: 143,
      }),
    );
    component.weight.set(70);
    await component.save();
    const patch = profileStore.updateProfile.calls.mostRecent().args[0] as Partial<UserProfile>;
    expect(profileSignal()?.target_calories).toBe(2023);
    expect(profileSignal()?.target_protein).toBe(143);
    expect(patch.target_protein).toBeUndefined();
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
    expect(profileSignal()?.target_calories).toBe(9999);
    expect(profileSignal()?.target_protein).toBe(999);
    expect(profileSignal()?.tdee).not.toBe(2000);
  });

  function enter(selector: string, value: string): void {
    const element: HTMLInputElement = fixture.nativeElement.querySelector(selector);
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  it('uses an entered birthday as the only age source', async () => {
    await setup(makeProfile());
    const year = new Date().getFullYear() - 24;
    enter('#body-field-birth-date', `${year}-01-01`);
    const age: HTMLInputElement = fixture.nativeElement.querySelector('#body-field-age');
    expect(age.readOnly).toBeTrue();
    expect(age.value).toBe('24');
    await component.save();
    expect(profileStore.updateProfile).toHaveBeenCalledOnceWith({ birth_date: `${year}-01-01` });
  });

  it('keeps the actual age when switching from a birthday to manual entry', async () => {
    const date = `${new Date().getFullYear() - 24}-01-01`;
    await setup(makeProfile({ birth_date: date, age: 23 }));
    fixture.nativeElement.querySelector('.clear-date').click();
    fixture.detectChanges();
    const age: HTMLInputElement = fixture.nativeElement.querySelector('#body-field-age');
    expect(age.readOnly).toBeFalse();
    expect(age.value).toBe('24');
    enter('#body-field-age', '25');
    await component.save();
    expect(profileStore.updateProfile).toHaveBeenCalledOnceWith({ birth_date: null, age: 25 });
  });

  it('retains an existing birthday beyond the manual entry limit when editing weight', async () => {
    const date = `${new Date().getFullYear() - 121}-01-01`;
    await setup(makeProfile({ birth_date: date, age: 121 }));
    enter('#body-field-weight', '70');
    await component.save();
    expect(profileStore.updateProfile).toHaveBeenCalledOnceWith({ weight_kg: 70 });
    expect(profileSignal()?.birth_date).toBe(date);
  });

  it('blocks empty, fractional and future age entries through the form', async () => {
    await setup(makeProfile());
    for (const value of ['', '26.5']) {
      enter('#body-field-age', value);
      expect(component.formInvalid()).toBeTrue();
      await component.save();
    }
    enter('#body-field-birth-date', '2999-01-01');
    expect(component.formInvalid()).toBeTrue();
    expect(profileStore.updateProfile).not.toHaveBeenCalled();
  });

  it('save() bails when profile is null', async () => {
    await setup(null);
    await component.save();
    expect(profileStore.updateProfile).not.toHaveBeenCalled();
    expect(location.back).not.toHaveBeenCalled();
  });

  it('keeps the edited value available for a retry after a failed save', async () => {
    await setup(makeProfile());
    enter('#body-field-weight', '72.5');
    profileStore.updateProfile.and.rejectWith(new Error('offline storage unavailable'));
    await component.save();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('thử lại');
    expect(component.weight()).toBe(72.5);
    expect(location.back).not.toHaveBeenCalled();
    profileStore.updateProfile.and.resolveTo();
    await component.save();
    expect(location.back).toHaveBeenCalledTimes(1);
  });

  it('save() bails when preview is null (invalid form)', async () => {
    await setup(makeProfile());
    component.height.set(50);
    await component.save();
    expect(profileStore.updateProfile).not.toHaveBeenCalled();
  });

  it('handles two save taps with one write and one navigation', async () => {
    await setup(makeProfile());
    component.weight.set(72.5);
    fixture.detectChanges();
    const button: HTMLElement = fixture.nativeElement.querySelector('.save-button');
    button.click();
    button.click();
    await fixture.whenStable();
    expect(profileStore.updateProfile).toHaveBeenCalledOnceWith({ weight_kg: 72.5 });
    expect(location.back).toHaveBeenCalledTimes(1);
  });
});
