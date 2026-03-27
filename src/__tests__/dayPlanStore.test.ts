import {
  createDatabaseService,
  type DatabaseService,
} from '../services/databaseService';
import { useDayPlanStore } from '../store/dayPlanStore';
import type { DayPlan } from '../types';

/* ------------------------------------------------------------------ */
/*  Mocks                                                               */
/* ------------------------------------------------------------------ */
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

vi.mock('sql.js', async () => {
  const real = await vi.importActual<typeof import('sql.js')>('sql.js');
  return { default: () => real.default() };
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
const makePlan = (overrides: Partial<DayPlan> = {}): DayPlan => ({
  date: '2025-01-15',
  breakfastDishIds: ['d1', 'd2'],
  lunchDishIds: ['d3'],
  dinnerDishIds: [],
  servings: { d1: 2, d3: 3 },
  ...overrides,
});

function resetStore(): void {
  useDayPlanStore.setState({ dayPlans: [] });
}

/* ================================================================== */
/*  Tests                                                               */
/* ================================================================== */
describe('dayPlanStore SQLite methods', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    resetStore();
    db = createDatabaseService();
    await db.initialize();
  });

  /* ---------------------------------------------------------------- */
  /*  loadDayPlansFromDb                                                */
  /* ---------------------------------------------------------------- */
  describe('loadDayPlansFromDb', () => {
    it('loads and parses JSON columns from SQLite', async () => {
      await db.execute(
        `INSERT INTO day_plans (date, breakfast_dish_ids, lunch_dish_ids, dinner_dish_ids, servings)
         VALUES (?, ?, ?, ?, ?)`,
        ['2025-01-15', '["d1","d2"]', '["d3"]', '[]', '{"d1":2}'],
      );

      await useDayPlanStore.getState().loadDayPlansFromDb(db);

      const plans = useDayPlanStore.getState().dayPlans;
      expect(plans).toHaveLength(1);
      expect(plans[0]).toEqual({
        date: '2025-01-15',
        breakfastDishIds: ['d1', 'd2'],
        lunchDishIds: ['d3'],
        dinnerDishIds: [],
        servings: { d1: 2 },
      });
    });

    it('loads multiple day plans', async () => {
      await db.execute(
        `INSERT INTO day_plans VALUES (?, ?, ?, ?, ?)`,
        ['2025-01-15', '["d1"]', '[]', '[]', null],
      );
      await db.execute(
        `INSERT INTO day_plans VALUES (?, ?, ?, ?, ?)`,
        ['2025-01-16', '[]', '["d2"]', '["d3"]', '{"d2":4}'],
      );

      await useDayPlanStore.getState().loadDayPlansFromDb(db);

      const plans = useDayPlanStore.getState().dayPlans;
      expect(plans).toHaveLength(2);
    });

    it('sets empty dayPlans when table is empty', async () => {
      useDayPlanStore.setState({ dayPlans: [makePlan()] });

      await useDayPlanStore.getState().loadDayPlansFromDb(db);

      expect(useDayPlanStore.getState().dayPlans).toEqual([]);
    });

    it('handles null servings as undefined', async () => {
      await db.execute(
        `INSERT INTO day_plans VALUES (?, ?, ?, ?, ?)`,
        ['2025-01-15', '[]', '[]', '[]', null],
      );

      await useDayPlanStore.getState().loadDayPlansFromDb(db);

      const plan = useDayPlanStore.getState().dayPlans[0];
      expect(plan.servings).toBeUndefined();
    });
  });

  /* ---------------------------------------------------------------- */
  /*  saveDayPlan                                                       */
  /* ---------------------------------------------------------------- */
  describe('saveDayPlan', () => {
    it('inserts a new day plan into SQLite', async () => {
      const plan = makePlan();

      await useDayPlanStore.getState().saveDayPlan(db, plan);

      const rows = await db.query<Record<string, unknown>>('SELECT * FROM day_plans');
      expect(rows).toHaveLength(1);

      const storeState = useDayPlanStore.getState().dayPlans;
      expect(storeState).toHaveLength(1);
      expect(storeState[0]).toEqual(plan);
    });

    it('replaces existing day plan on same date', async () => {
      const original = makePlan();
      await useDayPlanStore.getState().saveDayPlan(db, original);

      const updated = makePlan({ breakfastDishIds: ['d9'] });
      await useDayPlanStore.getState().saveDayPlan(db, updated);

      const rows = await db.query<Record<string, unknown>>('SELECT * FROM day_plans');
      expect(rows).toHaveLength(1);

      const storeState = useDayPlanStore.getState().dayPlans;
      expect(storeState).toHaveLength(1);
      expect(storeState[0].breakfastDishIds).toEqual(['d9']);
    });

    it('saves plan with undefined servings as null in SQLite', async () => {
      const plan = makePlan({ servings: undefined });

      await useDayPlanStore.getState().saveDayPlan(db, plan);

      const row = await db.queryOne<{ servings: string | null }>(
        'SELECT servings FROM day_plans WHERE date = ?',
        ['2025-01-15'],
      );
      expect(row?.servings).toBeNull();
    });
  });

  /* ---------------------------------------------------------------- */
  /*  deleteDayPlan                                                     */
  /* ---------------------------------------------------------------- */
  describe('deleteDayPlan', () => {
    it('removes a day plan by date', async () => {
      await useDayPlanStore.getState().saveDayPlan(db, makePlan({ date: '2025-01-15' }));
      await useDayPlanStore.getState().saveDayPlan(db, makePlan({ date: '2025-01-16' }));

      await useDayPlanStore.getState().deleteDayPlan(db, '2025-01-15');

      const rows = await db.query<Record<string, unknown>>('SELECT * FROM day_plans');
      expect(rows).toHaveLength(1);

      const storeState = useDayPlanStore.getState().dayPlans;
      expect(storeState).toHaveLength(1);
      expect(storeState[0].date).toBe('2025-01-16');
    });

    it('is a no-op when date does not exist', async () => {
      await useDayPlanStore.getState().saveDayPlan(db, makePlan());

      await useDayPlanStore.getState().deleteDayPlan(db, '9999-12-31');

      expect(useDayPlanStore.getState().dayPlans).toHaveLength(1);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  clearDayPlans                                                     */
  /* ---------------------------------------------------------------- */
  describe('clearDayPlans', () => {
    it('deletes all day plans when no dates provided', async () => {
      await useDayPlanStore.getState().saveDayPlan(db, makePlan({ date: '2025-01-15' }));
      await useDayPlanStore.getState().saveDayPlan(db, makePlan({ date: '2025-01-16' }));

      await useDayPlanStore.getState().clearDayPlans(db);

      const rows = await db.query<Record<string, unknown>>('SELECT * FROM day_plans');
      expect(rows).toHaveLength(0);
      expect(useDayPlanStore.getState().dayPlans).toEqual([]);
    });

    it('deletes only specified dates', async () => {
      await useDayPlanStore.getState().saveDayPlan(db, makePlan({ date: '2025-01-15' }));
      await useDayPlanStore.getState().saveDayPlan(db, makePlan({ date: '2025-01-16' }));
      await useDayPlanStore.getState().saveDayPlan(db, makePlan({ date: '2025-01-17' }));

      await useDayPlanStore.getState().clearDayPlans(db, ['2025-01-15', '2025-01-17']);

      const rows = await db.query<Record<string, unknown>>('SELECT * FROM day_plans');
      expect(rows).toHaveLength(1);

      const storeState = useDayPlanStore.getState().dayPlans;
      expect(storeState).toHaveLength(1);
      expect(storeState[0].date).toBe('2025-01-16');
    });
  });

  /* ---------------------------------------------------------------- */
  /*  JSON roundtrip                                                    */
  /* ---------------------------------------------------------------- */
  describe('JSON roundtrip', () => {
    it('preserves arrays and servings object through save/load', async () => {
      const plan: DayPlan = {
        date: '2025-06-01',
        breakfastDishIds: ['a', 'b', 'c'],
        lunchDishIds: ['d'],
        dinnerDishIds: ['e', 'f'],
        servings: { a: 2, d: 5, e: 1 },
      };

      await useDayPlanStore.getState().saveDayPlan(db, plan);

      resetStore();
      await useDayPlanStore.getState().loadDayPlansFromDb(db);

      expect(useDayPlanStore.getState().dayPlans[0]).toEqual(plan);
    });

    it('handles empty arrays correctly through roundtrip', async () => {
      const plan: DayPlan = {
        date: '2025-06-02',
        breakfastDishIds: [],
        lunchDishIds: [],
        dinnerDishIds: [],
      };

      await useDayPlanStore.getState().saveDayPlan(db, plan);

      resetStore();
      await useDayPlanStore.getState().loadDayPlansFromDb(db);

      const loaded = useDayPlanStore.getState().dayPlans[0];
      expect(loaded.breakfastDishIds).toEqual([]);
      expect(loaded.lunchDishIds).toEqual([]);
      expect(loaded.dinnerDishIds).toEqual([]);
      expect(loaded.servings).toBeUndefined();
    });
  });
});
