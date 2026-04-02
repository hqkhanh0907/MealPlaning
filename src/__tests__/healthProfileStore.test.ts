import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type HealthProfileState, useHealthProfileStore } from '../features/health-profile/store/healthProfileStore';
import type { Goal } from '../features/health-profile/types';
import { DEFAULT_HEALTH_PROFILE } from '../features/health-profile/types';
import type { DatabaseService } from '../services/databaseService';

/* ------------------------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------------------------ */
function createMockDb(overrides: Partial<DatabaseService> = {}): DatabaseService {
  return {
    initialize: vi.fn(),
    execute: vi.fn(),
    query: vi.fn().mockResolvedValue([]),
    queryOne: vi.fn().mockResolvedValue(null),
    transaction: vi.fn(),
    exportBinary: vi.fn().mockReturnValue(new Uint8Array()),
    importBinary: vi.fn(),
    exportToJSON: vi.fn(),
    importFromJSON: vi.fn(),
    ...overrides,
  };
}

function resetStore() {
  useHealthProfileStore.setState({
    profile: null,
    activeGoal: null,
    loading: false,
  } as Partial<HealthProfileState>);
}

function sampleGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    type: 'cut',
    rateOfChange: 'moderate',
    calorieOffset: -500,
    startDate: '2025-01-01',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* Tests */
/* ------------------------------------------------------------------ */
describe('healthProfileStore', () => {
  beforeEach(() => {
    resetStore();
  });

  /* ---------- initial state ---------- */
  it('initial state has null profile', () => {
    useHealthProfileStore.setState({ profile: null, activeGoal: null, loading: false });
    const { profile, activeGoal, loading } = useHealthProfileStore.getState();
    expect(profile).toBeNull();
    expect(activeGoal).toBeNull();
    expect(loading).toBe(false);
  });

  /* ---------- loadProfile ---------- */
  it('loadProfile loads from SQLite', async () => {
    const db = createMockDb({
      queryOne: vi.fn().mockResolvedValue({
        id: 'default',
        gender: 'female',
        age: 25,
        height_cm: 165,
        weight_kg: 60,
        activity_level: 'active',
        body_fat_pct: 20,
        bmr_override: null,
        protein_ratio: 1.8,
        fat_pct: 0.3,
        updated_at: '2025-06-01T00:00:00.000Z',
      }),
    });

    await useHealthProfileStore.getState().loadProfile(db);

    expect(db.queryOne).toHaveBeenCalledWith("SELECT * FROM user_profile WHERE id = 'default'");

    const { profile } = useHealthProfileStore.getState();
    expect(profile).not.toBeNull();
    expect(profile!.gender).toBe('female');
    expect(profile!.age).toBe(25);
    expect(profile!.heightCm).toBe(165);
    expect(profile!.weightKg).toBe(60);
    expect(profile!.activityLevel).toBe('active');
    expect(profile!.bodyFatPct).toBe(20);
    expect(profile!.bmrOverride).toBeUndefined();
    expect(profile!.proteinRatio).toBe(1.8);
    expect(profile!.fatPct).toBe(0.3);
  });

  it('loadProfile returns null when no data', async () => {
    const db = createMockDb({ queryOne: vi.fn().mockResolvedValue(null) });

    await useHealthProfileStore.getState().loadProfile(db);

    const { profile } = useHealthProfileStore.getState();
    expect(profile).toBeNull();
  });

  /* ---------- saveProfile ---------- */
  it('saveProfile writes to SQLite', async () => {
    const db = createMockDb();
    const profile = {
      ...DEFAULT_HEALTH_PROFILE,
      gender: 'female' as const,
      weightKg: 58,
      activityLevel: 'active' as const,
    };

    await useHealthProfileStore.getState().saveProfile(db, profile);

    expect(db.execute).toHaveBeenCalledTimes(1);
    const [sql, params] = (db.execute as ReturnType<typeof vi.fn>).mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('INSERT OR REPLACE INTO user_profile');
    expect(params[0]).toBe('default');
    expect(params[1]).toBe(''); // name
    expect(params[2]).toBe('female'); // gender
    expect(params[6]).toBe(58); // weight_kg
    expect(params[7]).toBe('active'); // activity_level

    const { profile: stored } = useHealthProfileStore.getState();
    expect(stored).not.toBeNull();
    expect(stored!.gender).toBe('female');
    expect(stored!.weightKg).toBe(58);
  });

  /* ---------- loadActiveGoal ---------- */
  it('loadActiveGoal loads active goal', async () => {
    const db = createMockDb({
      queryOne: vi.fn().mockResolvedValue({
        id: 'goal-1',
        type: 'cut',
        rate_of_change: 'moderate',
        target_weight_kg: 65,
        calorie_offset: -500,
        start_date: '2025-01-01',
        end_date: null,
        is_active: 1,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      }),
    });

    await useHealthProfileStore.getState().loadActiveGoal(db);

    expect(db.queryOne).toHaveBeenCalledWith('SELECT * FROM goals WHERE is_active = 1 LIMIT 1');

    const { activeGoal } = useHealthProfileStore.getState();
    expect(activeGoal).not.toBeNull();
    expect(activeGoal!.id).toBe('goal-1');
    expect(activeGoal!.type).toBe('cut');
    expect(activeGoal!.rateOfChange).toBe('moderate');
    expect(activeGoal!.targetWeightKg).toBe(65);
    expect(activeGoal!.isActive).toBe(true);
    expect(activeGoal!.endDate).toBeUndefined();
  });

  it('loadActiveGoal returns null when none active', async () => {
    const db = createMockDb({ queryOne: vi.fn().mockResolvedValue(null) });

    await useHealthProfileStore.getState().loadActiveGoal(db);

    expect(useHealthProfileStore.getState().activeGoal).toBeNull();
  });

  /* ---------- saveGoal ---------- */
  it('saveGoal deactivates others first', async () => {
    const db = createMockDb();
    const goal = sampleGoal();

    await useHealthProfileStore.getState().saveGoal(db, goal);

    const calls = (db.execute as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBe(2);

    const [deactivateSql] = calls[0] as [string, unknown[]];
    expect(deactivateSql).toContain('UPDATE goals SET is_active = 0');
  });

  it('saveGoal inserts new active goal', async () => {
    const db = createMockDb();
    const goal = sampleGoal({ id: 'goal-new', type: 'bulk', calorieOffset: 300 });

    await useHealthProfileStore.getState().saveGoal(db, goal);

    const calls = (db.execute as ReturnType<typeof vi.fn>).mock.calls;
    const [insertSql, insertParams] = calls[1] as [string, unknown[]];
    expect(insertSql).toContain('INSERT OR REPLACE INTO goals');
    expect(insertParams[0]).toBe('goal-new');
    expect(insertParams[1]).toBe('bulk');
    expect(insertParams[4]).toBe(300);
    expect(insertParams[7]).toBe(1);

    const { activeGoal } = useHealthProfileStore.getState();
    expect(activeGoal).not.toBeNull();
    expect(activeGoal!.id).toBe('goal-new');
    expect(activeGoal!.isActive).toBe(true);
  });

  /* ---------- deactivateAllGoals ---------- */
  it('deactivateAllGoals sets all to inactive', async () => {
    const db = createMockDb();
    useHealthProfileStore.setState({ activeGoal: sampleGoal() });

    await useHealthProfileStore.getState().deactivateAllGoals(db);

    const [sql] = (db.execute as ReturnType<typeof vi.fn>).mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('UPDATE goals SET is_active = 0');
    expect(useHealthProfileStore.getState().activeGoal).toBeNull();
  });

  /* ---------- boolean ↔ integer conversion ---------- */
  it('boolean ↔ INTEGER conversion works', async () => {
    const db = createMockDb({
      queryOne: vi.fn().mockResolvedValue({
        id: 'goal-conv',
        type: 'maintain',
        rate_of_change: 'conservative',
        target_weight_kg: null,
        calorie_offset: 0,
        start_date: '2025-06-01',
        end_date: null,
        is_active: 1,
        created_at: '2025-06-01T00:00:00.000Z',
        updated_at: '2025-06-01T00:00:00.000Z',
      }),
    });

    await useHealthProfileStore.getState().loadActiveGoal(db);
    const { activeGoal } = useHealthProfileStore.getState();
    expect(activeGoal!.isActive).toBe(true);
    expect(typeof activeGoal!.isActive).toBe('boolean');

    const saveMockDb = createMockDb();
    await useHealthProfileStore.getState().saveGoal(saveMockDb, activeGoal!);

    const calls = (saveMockDb.execute as ReturnType<typeof vi.fn>).mock.calls;
    const [, insertParams] = calls[1] as [string, unknown[]];
    expect(insertParams[7]).toBe(1);
    expect(typeof insertParams[7]).toBe('number');
  });
});
