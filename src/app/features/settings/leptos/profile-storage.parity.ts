import { Location } from '@angular/common';
import { signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { AccountSession } from '../../../core/account/account-session';
import { Database } from '../../../core/services/database/database';
import {
  createTestDatabase,
  teardownTestDatabase,
} from '../../../core/services/database/__test__/create-test-database';
import { LocalDay } from '../../../core/stores/local-day';
import { ProfileStore } from '../../../core/stores/profile.store';
import { UserProfileRepository } from '../../../core/repositories/user-profile.repository';
import BodyEdit from '../body-edit/body-edit.page';
import { loadSettingsPage } from './settings-renderer';
import { frame, profile } from './settings.fixture';

async function stored(component: Type<unknown>) {
  const db = await createTestDatabase();
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideRouter([]),
      provideIonicAngular(),
      { provide: Database, useValue: db },
      { provide: ActivatedRoute, useValue: { snapshot: { routeConfig: { path: 'body' } } } },
      { provide: AccountSession, useValue: { current: signal({ id: 'synthetic-user' }) } },
    ],
  }).compileComponents();
  const day = TestBed.inject(LocalDay);
  day.iso.set('2026-11-28');
  const store = TestBed.inject(ProfileStore),
    repo = TestBed.inject(UserProfileRepository);
  const { id: _id, created_at: _created, updated_at: _updated, ...data } = profile;
  await store.saveOnboardingProfile({
    ...data,
    activity_factor: 1.55,
    target_calories: 1800,
    calorie_target_mode: 'manual',
    target_protein: 100,
    protein_target_mode: 'manual',
  });
  const location = spyOn(TestBed.inject(Location), 'back');
  const fixture = TestBed.createComponent(component);
  try {
    fixture.detectChanges();
    await frame();
    await frame();
    const root: HTMLElement = fixture.nativeElement;
    const weight = root.querySelector<HTMLInputElement>('#body-field-weight')!;
    weight.value = '68.5';
    weight.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await frame();
    const save = root.querySelector<HTMLElement>('ion-footer ion-button')!;
    save.click();
    save.click();
    await fixture.whenStable();
    await frame();
    expect(location).toHaveBeenCalledTimes(1);
    const saved = await repo.getProfile();
    const log = await repo.getLatestWeightLog();
    return {
      weight: saved?.weight_kg,
      calories: saved?.target_calories,
      protein: saved?.target_protein,
      carbs: saved?.target_carbs,
      fat: saved?.target_fat,
      bmr: saved?.bmr,
      tdee: saved?.tdee,
      weightLog: log?.weight_kg,
    };
  } finally {
    fixture.destroy();
    TestBed.resetTestingModule();
    teardownTestDatabase();
  }
}
describe('Settings persists through the SQLite profile repository', () => {
  it('records the new weight and retains manual targets on both routes', async () => {
    const before = await stored(BodyEdit),
      after = await stored(await loadSettingsPage('body'));
    expect(after).toEqual(before);
    expect(after).toEqual(
      jasmine.objectContaining({
        weight: 68.5,
        weightLog: 68.5,
        calories: 1800,
        protein: 100,
        carbs: 0,
        fat: null,
      }),
    );
  });
});
