import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DatabaseService } from '../services/databaseService';

/* ------------------------------------------------------------------ */
/*  Mock store state factories                                          */
/* ------------------------------------------------------------------ */
const mockLoadAllIngredient = vi.fn().mockResolvedValue(undefined);
const mockLoadAllDish = vi.fn().mockResolvedValue(undefined);
const mockLoadAllDayPlan = vi.fn().mockResolvedValue(undefined);
const mockLoadAllMealTemplate = vi.fn().mockResolvedValue(undefined);
const mockLoadProfile = vi.fn().mockResolvedValue(undefined);
const mockLoadActiveGoal = vi.fn().mockResolvedValue(undefined);
const mockInitializeFromSQLite = vi.fn().mockResolvedValue(undefined);

/* ------------------------------------------------------------------ */
/*  Mock all dynamically-imported store modules                         */
/* ------------------------------------------------------------------ */
vi.mock('../store/ingredientStore', () => ({
  useIngredientStore: { getState: () => ({ loadAll: mockLoadAllIngredient }) },
}));

vi.mock('../store/dishStore', () => ({
  useDishStore: { getState: () => ({ loadAll: mockLoadAllDish }) },
}));

vi.mock('../store/dayPlanStore', () => ({
  useDayPlanStore: { getState: () => ({ loadAll: mockLoadAllDayPlan }) },
}));

vi.mock('../store/mealTemplateStore', () => ({
  useMealTemplateStore: { getState: () => ({ loadAll: mockLoadAllMealTemplate }) },
}));

vi.mock('../features/health-profile/store/healthProfileStore', () => ({
  useHealthProfileStore: {
    getState: () => ({
      loadProfile: mockLoadProfile,
      loadActiveGoal: mockLoadActiveGoal,
    }),
  },
}));

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: { getState: () => ({ initializeFromSQLite: mockInitializeFromSQLite }) },
}));

/* ------------------------------------------------------------------ */
/*  Mock DatabaseService                                                */
/* ------------------------------------------------------------------ */
function createMockDb(): DatabaseService {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    execute: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue([]),
    queryOne: vi.fn().mockResolvedValue(null),
    transaction: vi.fn().mockResolvedValue(undefined),
    exportBinary: vi.fn().mockReturnValue(new Uint8Array()),
    importBinary: vi.fn().mockResolvedValue(undefined),
    exportToJSON: vi.fn().mockResolvedValue('{}'),
    importFromJSON: vi.fn().mockResolvedValue(undefined),
  };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */
describe('reloadAllStores', () => {
  let db: DatabaseService;

  beforeEach(() => {
    vi.clearAllMocks();
    db = createMockDb();
  });

  it('calls loadAll on ingredientStore with db', async () => {
    const { reloadAllStores } = await import('../services/storeLoader');
    await reloadAllStores(db);
    expect(mockLoadAllIngredient).toHaveBeenCalledWith(db);
  });

  it('calls loadAll on dishStore with db', async () => {
    const { reloadAllStores } = await import('../services/storeLoader');
    await reloadAllStores(db);
    expect(mockLoadAllDish).toHaveBeenCalledWith(db);
  });

  it('calls loadAll on dayPlanStore with db', async () => {
    const { reloadAllStores } = await import('../services/storeLoader');
    await reloadAllStores(db);
    expect(mockLoadAllDayPlan).toHaveBeenCalledWith(db);
  });

  it('calls loadAll on mealTemplateStore with db', async () => {
    const { reloadAllStores } = await import('../services/storeLoader');
    await reloadAllStores(db);
    expect(mockLoadAllMealTemplate).toHaveBeenCalledWith(db);
  });

  it('calls initializeFromSQLite on fitnessStore with db', async () => {
    const { reloadAllStores } = await import('../services/storeLoader');
    await reloadAllStores(db);
    expect(mockInitializeFromSQLite).toHaveBeenCalledWith(db);
  });

  it('calls loadProfile on healthProfileStore with db', async () => {
    const { reloadAllStores } = await import('../services/storeLoader');
    await reloadAllStores(db);
    expect(mockLoadProfile).toHaveBeenCalledWith(db);
  });

  it('calls loadActiveGoal on healthProfileStore with db after loadProfile completes', async () => {
    const callOrder: string[] = [];

    mockLoadProfile.mockImplementation(() => {
      callOrder.push('loadProfile');
      return Promise.resolve();
    });
    mockLoadActiveGoal.mockImplementation(() => {
      callOrder.push('loadActiveGoal');
      return Promise.resolve();
    });

    const { reloadAllStores } = await import('../services/storeLoader');
    await reloadAllStores(db);

    expect(mockLoadActiveGoal).toHaveBeenCalledWith(db);
    expect(callOrder.indexOf('loadProfile')).toBeLessThan(callOrder.indexOf('loadActiveGoal'));
  });

  it('loads all six stores in parallel', async () => {
    const { reloadAllStores } = await import('../services/storeLoader');
    await reloadAllStores(db);

    expect(mockLoadAllIngredient).toHaveBeenCalledTimes(1);
    expect(mockLoadAllDish).toHaveBeenCalledTimes(1);
    expect(mockLoadAllDayPlan).toHaveBeenCalledTimes(1);
    expect(mockLoadAllMealTemplate).toHaveBeenCalledTimes(1);
    expect(mockLoadProfile).toHaveBeenCalledTimes(1);
    expect(mockLoadActiveGoal).toHaveBeenCalledTimes(1);
    expect(mockInitializeFromSQLite).toHaveBeenCalledTimes(1);
  });
});
