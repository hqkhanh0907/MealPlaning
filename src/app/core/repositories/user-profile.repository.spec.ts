import { TestBed } from '@angular/core/testing';
import { Database } from '../services/database/database';
import { UserProfileRepository, type WeightLogEntry } from './user-profile.repository';
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
    theme: 'light',
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
    const warnSpy = spyOn(console, 'warn');
    const first = await repo.insert(sampleData);
    const second = await repo.insert(sampleData);

    expect(rows.length).toBe(1);
    expect(second.id).toBe(first.id);
    expect(fakeDb.execute).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      '[UserProfileRepository] insert() called but profile already exists; returning existing row',
    );
  });

  it('updates only whitelisted profile fields', async () => {
    await repo.update({ target_calories: 2100, notif_lunch: 0 });

    const [sql, params] = fakeDb.execute.calls.mostRecent().args;
    expect(sql).toContain('target_calories = ?');
    expect(sql).toContain('notif_lunch = ?');
    expect(sql).toContain('updated_at = datetime');
    expect(params).toEqual([2100, 0]);
  });

  it('rejects unknown update fields before building SQL', async () => {
    const unsafe = { 'target_calories = 1 WHERE 1=1 --': 1 } as unknown as Partial<UserProfile>;

    await expectAsync(repo.update(unsafe)).toBeRejectedWithError(
      "UserProfileRepository: update field 'target_calories = 1 WHERE 1=1 --' is not allowed.",
    );
    expect(fakeDb.execute).not.toHaveBeenCalled();
  });

  it('reads the latest weight_log by date', async () => {
    const latest: WeightLogEntry = {
      id: 'w2',
      weight_kg: 64.5,
      date: '2026-05-10',
      notes: null,
      created_at: '2026-05-10T06:00:00',
    };
    fakeDb.getOne.and.resolveTo(latest);

    const result = await repo.getLatestWeightLog();

    expect(result).toEqual(latest);
    const [sql, params] = fakeDb.getOne.calls.mostRecent().args;
    expect(sql).toContain('FROM weight_log');
    expect(sql).toContain('ORDER BY date DESC');
    expect(params).toBeUndefined();
  });

  it('reads the previous weight_log before a given date', async () => {
    const previous: WeightLogEntry = {
      id: 'w1',
      weight_kg: 65.2,
      date: '2026-05-03',
      notes: 'weekly check-in',
      created_at: '2026-05-03T06:00:00',
    };
    fakeDb.getOne.and.resolveTo(previous);

    const result = await repo.getPreviousWeightLog('2026-05-10');

    expect(result).toEqual(previous);
    const [sql, params] = fakeDb.getOne.calls.mostRecent().args;
    expect(sql).toContain('WHERE date < ?');
    expect(sql).toContain('ORDER BY date DESC');
    expect(params).toEqual(['2026-05-10']);
  });
});
