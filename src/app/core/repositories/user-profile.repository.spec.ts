import { TestBed } from '@angular/core/testing';
import { Database } from '../services/database/database';
import { UserProfileRepository } from './user-profile.repository';
import { UserProfile } from '../models/user-profile.model';

/**
 * Verifies UserProfileRepository.insert() is idempotent — a second call
 * must NOT create a second row, and must return the existing profile.
 * Guards against duplicate rows from onboarding re-run / legacy migration.
 */
describe('UserProfileRepository (singleton semantics)', () => {
  let rows: UserProfile[];
  let fakeDb: jasmine.SpyObj<Database>;
  let repo: UserProfileRepository;

  const sampleData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> = {
    height_cm: 170,
    weight_kg: 65,
    age: 30,
    gender: 'male',
    goal: 'maintain',
    fitness_level: 'beginner',
    activity_factor: 1.55,
    bmr: 1600,
    tdee: 2480,
    target_calories: 2480,
    target_protein: 130,
    target_carbs: null,
    target_fat: null,
    theme: 'system',
    notif_morning: 1,
    notif_lunch: 1,
    notif_evening: 1,
    notif_weekly: 1,
    onboarding_completed: 1,
  };

  beforeEach(() => {
    rows = [];
    fakeDb = jasmine.createSpyObj<Database>('DatabaseService', [
      'initialize',
      'execute',
      'query',
      'getOne',
    ]);
    fakeDb.getOne.and.callFake((async () => rows[0] ?? null) as Database['getOne']);
    fakeDb.execute.and.callFake((async (_sql: string, params?: unknown[]) => {
      rows.push({
        id: params![0] as string,
        ...sampleData,
        created_at: new Date().toISOString(),
        updated_at: null,
      });
    }) as Database['execute']);

    TestBed.configureTestingModule({
      providers: [UserProfileRepository, { provide: Database, useValue: fakeDb }],
    });
    repo = TestBed.inject(UserProfileRepository);
  });

  it('first insert() creates a new row', async () => {
    const saved = await repo.insert(sampleData);
    expect(saved.id).toBeTruthy();
    expect(rows.length).toBe(1);
    expect(fakeDb.execute).toHaveBeenCalledTimes(1);
  });

  it('second insert() is a no-op and returns the existing row', async () => {
    const first = await repo.insert(sampleData);
    const second = await repo.insert(sampleData);

    expect(rows.length).toBe(1);
    expect(second.id).toBe(first.id);
    expect(fakeDb.execute).toHaveBeenCalledTimes(1);
  });
});
