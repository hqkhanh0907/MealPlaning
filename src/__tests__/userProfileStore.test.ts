import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUserProfileStore, DEFAULT_USER_PROFILE } from '../store/userProfileStore';
import type { DatabaseService } from '../services/databaseService';

function createMockDb(overrides: Partial<DatabaseService> = {}): DatabaseService {
  return {
    initialize: vi.fn(),
    execute: vi.fn(),
    query: vi.fn().mockResolvedValue([]),
    queryOne: vi.fn().mockResolvedValue(null),
    transaction: vi.fn(),
    exportToJSON: vi.fn(),
    importFromJSON: vi.fn(),
    ...overrides,
  };
}

function resetStore() {
  useUserProfileStore.setState({
    userProfile: { ...DEFAULT_USER_PROFILE },
  });
}

describe('userProfileStore — SQLite methods', () => {
  beforeEach(() => {
    resetStore();
  });

  it('loadProfile loads from SQLite and updates store', async () => {
    const db = createMockDb({
      queryOne: vi.fn().mockResolvedValue({ weightKg: 75, proteinRatio: 1.8 }),
    });

    await useUserProfileStore.getState().loadProfile(db);

    expect(db.queryOne).toHaveBeenCalledWith(
      "SELECT weight_kg, protein_ratio FROM user_profile WHERE id = 'default'",
    );

    const { userProfile } = useUserProfileStore.getState();
    expect(userProfile.weight).toBe(75);
    expect(userProfile.proteinRatio).toBe(1.8);
    expect(userProfile.targetCalories).toBe(DEFAULT_USER_PROFILE.targetCalories);
  });

  it('saveProfile writes to SQLite with defaults', async () => {
    const db = createMockDb();
    const profile = { weight: 90, proteinRatio: 2.5, targetCalories: 2000 };

    await useUserProfileStore.getState().saveProfile(db, profile);

    expect(db.execute).toHaveBeenCalledTimes(1);
    const [sql, params] = (db.execute as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      unknown[],
    ];
    expect(sql).toContain('INSERT OR REPLACE INTO user_profile');
    expect(params[0]).toBe('default');
    expect(params[1]).toBe('male');
    expect(params[2]).toBe(30);
    expect(params[3]).toBe(170);
    expect(params[4]).toBe(90);
    expect(params[5]).toBe('moderate');
    expect(params[8]).toBe(2.5);
    expect(params[9]).toBe(0.25);

    const { userProfile } = useUserProfileStore.getState();
    expect(userProfile).toEqual(profile);
  });

  it('roundtrip preserves data', async () => {
    const saved: Record<string, unknown[]> = {};
    const db = createMockDb({
      execute: vi.fn().mockImplementation((_sql: string, params?: unknown[]) => {
        if (params) {
          saved['row'] = params;
        }
        return Promise.resolve();
      }),
      queryOne: vi.fn().mockImplementation(() => {
        if (saved['row']) {
          const params = saved['row'];
          return Promise.resolve({
            weightKg: params[4],
            proteinRatio: params[8],
          });
        }
        return Promise.resolve(null);
      }),
    });

    const original = { weight: 68, proteinRatio: 1.5, targetCalories: 1800 };
    await useUserProfileStore.getState().saveProfile(db, original);
    await useUserProfileStore.getState().loadProfile(db);

    const { userProfile } = useUserProfileStore.getState();
    expect(userProfile.weight).toBe(68);
    expect(userProfile.proteinRatio).toBe(1.5);
    expect(userProfile.targetCalories).toBe(1800);
  });

  it('handles missing profile gracefully (returns defaults)', async () => {
    const db = createMockDb({
      queryOne: vi.fn().mockResolvedValue(null),
    });

    await useUserProfileStore.getState().loadProfile(db);

    const { userProfile } = useUserProfileStore.getState();
    expect(userProfile).toEqual(DEFAULT_USER_PROFILE);
  });
});
