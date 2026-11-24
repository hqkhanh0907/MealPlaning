import { TestBed } from '@angular/core/testing';
import type { UserProfile } from '../models/user-profile.model';
import { UserProfileRepository } from '../repositories/user-profile.repository';
import {
  createTestDatabase,
  teardownTestDatabase,
} from '../services/database/__test__/create-test-database';
import { Database } from '../services/database/database';
import { MigrationRunner } from '../services/database/migration-runner';
import { MIGRATION_REGISTRY } from '../services/database/migrations';
import { WebDatabase } from '../services/database/web-database';
import { ProfileStore } from './profile.store';

const birthday = new Date(2026, 10, 24);
const previousDay = new Date(2026, 10, 23);
const personalProfile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> = {
  height_cm: 170,
  weight_kg: 65,
  age: 29,
  gender: 'male',
  goal: 'maintain',
  fitness_level: 'beginner',
  activity_factor: 1.55,
  bmr: 1573,
  tdee: 2438,
  target_calories: 2438,
  calorie_target_mode: 'auto',
  target_protein: 104,
  protein_target_mode: 'auto',
  target_carbs: null,
  target_fat: null,
  theme: 'light',
  notif_morning: 1,
  notif_lunch: 1,
  notif_evening: 1,
  notif_weekly: 0,
  onboarding_completed: 1,
};

describe('Personal profile persistence', () => {
  let db: WebDatabase;
  let store: ProfileStore;
  let repository: UserProfileRepository;

  function connect(): void {
    TestBed.configureTestingModule({ providers: [{ provide: Database, useValue: db }] });
    store = TestBed.inject(ProfileStore);
    repository = TestBed.inject(UserProfileRepository);
  }

  beforeEach(async () => {
    db = await createTestDatabase();
    connect();
  });

  afterEach(teardownTestDatabase);

  it('validates manual goal edits and preserves the zero sentinel and old out-of-range values', async () => {
    await repository.insert(personalProfile);
    for (const patch of [
      { calorie_target_mode: 'manual', target_calories: 799 },
      { protein_target_mode: 'manual', target_protein: 401 },
      { target_carbs: -1 },
      { target_fat: Infinity },
    ] as const) {
      await expectAsync(store.updateProfile(patch)).toBeRejectedWithError();
    }
    await repository.update({ target_calories: 123 });
    expect((await repository.getProfile())?.target_calories).toBe(2438);
    await store.updateProfile({ calorie_target_mode: 'manual', target_calories: 0 });
    expect(store.profile()?.target_calories).toBe(0);
    await db.execute(
      "UPDATE user_profile SET protein_target_mode='auto', target_protein=5, target_carbs=1050",
    );
    await expectAsync(
      store.updateProfile({ protein_target_mode: 'manual' }),
    ).toBeRejectedWithError();
    await store.updateProfile({ notif_lunch: 0, target_carbs: 1050 });
    expect(store.profile()?.target_carbs).toBe(1050);
  });

  it('stores a new profile using its actual birthday even when the preview age is stale', async () => {
    const saved = await repository.insert(
      {
        ...personalProfile,
        birth_date: '1996-11-24',
        protein_target_mode: 'manual',
        target_protein: 135,
      },
      birthday,
    );
    expect(saved).toEqual(
      jasmine.objectContaining({
        age: 30,
        bmr: 1568,
        tdee: 2430,
        target_calories: 2430,
        target_protein: 135,
      }),
    );
  });

  it('upgrades a v9 profile without inferring birth date from the registration date', async () => {
    await db.execute('ALTER TABLE user_profile DROP COLUMN birth_date');
    await db.execute('PRAGMA user_version = 9');
    await db.execute(`INSERT INTO user_profile
      (id,height_cm,weight_kg,age,gender,goal,fitness_level,bmr,tdee,target_calories,target_protein,created_at)
      VALUES ('legacy',170,65,29,'male','maintain','beginner',1573,2438,2100,127,'2010-11-24')`);
    const migrations = new MigrationRunner(db, MIGRATION_REGISTRY);
    await migrations.run();
    await migrations.run();
    await store.loadProfile(birthday);
    await store.refreshAge(new Date(2030, 10, 24));
    expect(store.profile()).toEqual(
      jasmine.objectContaining({
        birth_date: null,
        age: 29,
        target_calories: 2100,
        target_protein: 127,
        updated_at: null,
      }),
    );
  });

  it('refreshes at a local birthday, preserves a day snapshot and persists after reopening', async () => {
    await store.saveOnboardingProfile(personalProfile);
    await repository.update({ birth_date: '1996-11-24' }, previousDay);
    await db.execute(`INSERT INTO day_plan (id,date,target_calories,target_protein)
      VALUES ('yesterday','2026-11-23',2438,104)`);
    await store.loadProfile(previousDay);
    expect(store.profile()?.age).toBe(29);
    const write = spyOn(db, 'execute').and.callThrough();
    await Promise.all([store.refreshAge(birthday), store.refreshAge(birthday)]);
    expect(write).toHaveBeenCalledTimes(1);
    expect(store.profile()).toEqual(
      jasmine.objectContaining({
        age: 30,
        bmr: 1568,
        tdee: 2430,
        target_calories: 2430,
        target_protein: 104,
      }),
    );
    TestBed.resetTestingModule();
    db = new WebDatabase();
    await db.initialize();
    connect();
    await store.loadProfile(birthday);
    expect(store.profile()?.age).toBe(30);
    expect(store.profile()?.birth_date).toBe('1996-11-24');
    expect(await db.getOne('SELECT target_calories,target_protein FROM day_plan')).toEqual({
      target_calories: 2438,
      target_protein: 104,
    });
  });

  it('keeps manual targets including a protein target equal to the previous automatic estimate', async () => {
    await repository.insert({ ...personalProfile, protein_target_mode: 'manual' });
    await repository.update({ birth_date: '1996-11-24' }, previousDay);
    await repository.update({ weight_kg: 70 }, birthday);
    expect(await repository.getProfile()).toEqual(
      jasmine.objectContaining({
        age: 30,
        bmr: 1618,
        tdee: 2508,
        target_calories: 2508,
        target_protein: 104,
      }),
    );
    await repository.update({ calorie_target_mode: 'manual', target_calories: 2100 }, birthday);
    await repository.update({ weight_kg: 67 }, birthday);
    expect(await repository.getProfile()).toEqual(
      jasmine.objectContaining({
        bmr: 1588,
        tdee: 2461,
        target_calories: 2100,
        target_protein: 104,
      }),
    );
  });

  it('preserves edits when a birthday refresh and a goal save overlap', async () => {
    await repository.insert(personalProfile);
    await repository.update({ birth_date: '1996-11-24' }, previousDay);
    await store.loadProfile(previousDay);
    await Promise.all([
      store.refreshAge(birthday),
      store.updateProfile({ target_calories: 2123, calorie_target_mode: 'manual', notif_lunch: 0 }),
    ]);
    expect(store.profile()?.target_calories).toBe(2123);
    expect(store.profile()?.notif_lunch).toBe(0);
    expect(store.profile()).toEqual(await repository.getProfile());
  });

  it('validates entered dates and measurements, accepts a later edit and clears DOB explicitly', async () => {
    await store.saveOnboardingProfile(personalProfile);
    for (const patch of [
      { birth_date: '2020-02-30' },
      { birth_date: '2999-01-01' },
      { birth_date: '2000-2-2' },
      { birth_date: '1910-01-01', age: 105, weight_kg: NaN },
      { age: 25.1 },
      { birth_date: '2026-01-01' },
      { height_cm: 99 },
      { weight_kg: 301 },
    ]) {
      await expectAsync(repository.update(patch, birthday)).toBeRejectedWithError();
    }
    expect(await repository.getProfile()).toEqual(
      jasmine.objectContaining({ birth_date: null, age: 29 }),
    );
    await repository.update({ birth_date: '1996-11-24', age: 99 }, birthday);
    expect((await repository.getProfile())?.age).toBe(30);
    await store.updateProfile({ birth_date: null, age: 34 });
    await store.refreshAge(new Date(2030, 10, 24));
    expect(store.profile()).toEqual(jasmine.objectContaining({ birth_date: null, age: 34 }));
  });

  it('permits a previously saved birthday to age past the entry limit and leaves legacy outliers editable', async () => {
    await repository.insert(personalProfile);
    await repository.update({ birth_date: '1906-11-24' }, birthday);
    await store.loadProfile(new Date(2027, 10, 24));
    expect(store.profile()?.age).toBe(121);
    await db.execute('UPDATE user_profile SET birth_date=NULL, height_cm=95, age=132');
    await store.updateProfile({ notif_lunch: 0 });
    expect(store.profile()).toEqual(
      jasmine.objectContaining({ height_cm: 95, age: 132, notif_lunch: 0 }),
    );
  });
});
