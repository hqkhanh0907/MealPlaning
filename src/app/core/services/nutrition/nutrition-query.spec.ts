import { TestBed } from '@angular/core/testing';
import { Database } from '../database/database';
import { WebDatabase } from '../database/web-database';
import {
  createTestDatabase,
  teardownTestDatabase,
} from '../database/__test__/create-test-database';
import { NutritionQuery } from './nutrition-query';
import { DayPlanRepository } from '../../repositories/day-plan.repository';
import { DishRepository } from '../../repositories/dish.repository';
import { PlannedDishRepository } from '../../repositories/planned-dish.repository';
import { CalendarStore } from '../../stores/calendar.store';

/**
 * Spec for NutritionQuery aggregate service (Story 4.0 T1+T2).
 *
 * Coverage:
 *   - dailyTotals: with-data (mixed planned + logged), empty day → all zeros
 *   - weekTotals: with-data (logged-only across 3 days), empty week → 7 zero rows
 *   - trend: with-data (3-of-7-day window), empty range → 7 zero values
 *   - EXPLAIN QUERY PLAN: 3 index assertions (DEC-06)
 */
describe('NutritionQuery (aggregate service)', () => {
  let db: WebDatabase;
  let svc: NutritionQuery;

  beforeEach(async () => {
    db = await createTestDatabase();
    TestBed.configureTestingModule({
      providers: [{ provide: Database, useValue: db }],
    });
    svc = TestBed.inject(NutritionQuery);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    teardownTestDatabase();
  });

  // ─── helpers ──────────────────────────────────────────────────────────

  async function seedDay(
    date: string,
  ): Promise<{ dayPlanId: string; slots: Record<string, string> }> {
    const dayPlanId = crypto.randomUUID();
    await db.execute(
      `INSERT INTO day_plan (id, date, target_calories, target_protein) VALUES (?, ?, ?, ?)`,
      [dayPlanId, date, 2000, 150],
    );
    const slots: Record<string, string> = {};
    for (const meal of ['breakfast', 'lunch', 'dinner', 'snack']) {
      const slotId = crypto.randomUUID();
      slots[meal] = slotId;
      await db.execute(`INSERT INTO meal_slot (id, day_plan_id, meal_type) VALUES (?, ?, ?)`, [
        slotId,
        dayPlanId,
        meal,
      ]);
    }
    return { dayPlanId, slots };
  }

  /**
   * Create a dish whose `dish_with_totals` returns the supplied per-100g
   * macros (gram_weight = 100, single ingredient).
   */
  async function seedDish(
    name: string,
    macros: { calories: number; protein: number; carbs: number; fat: number; fiber?: number },
  ): Promise<string> {
    const dishId = crypto.randomUUID();
    const ingId = crypto.randomUUID();
    await db.execute(`INSERT INTO dish (id, name, type, source) VALUES (?, ?, ?, ?)`, [
      dishId,
      name,
      'ingredient_based',
      'custom',
    ]);
    await db.execute(
      `INSERT INTO ingredient (id, name, category, calories, protein, carbs, fat, fiber) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ingId,
        name + '-ing',
        'Khác',
        macros.calories,
        macros.protein,
        macros.carbs,
        macros.fat,
        macros.fiber ?? 0,
      ],
    );
    await db.execute(
      `INSERT INTO dish_ingredient (id, dish_id, ingredient_id, gram_weight) VALUES (?, ?, ?, ?)`,
      [crypto.randomUUID(), dishId, ingId, 100],
    );
    return dishId;
  }

  async function insertPlannedDish(
    slotId: string,
    dishId: string,
    overrides: {
      servings?: number;
      is_completed?: 0 | 1;
      calories?: number | null;
      protein?: number | null;
      carbs?: number | null;
      fat?: number | null;
      fiber?: number | null;
      completed_at?: string | null;
    } = {},
  ): Promise<string> {
    const id = crypto.randomUUID();
    const row = {
      servings: 1,
      is_completed: 0 as 0 | 1,
      calories: null as number | null,
      protein: null as number | null,
      carbs: null as number | null,
      fat: null as number | null,
      fiber: null as number | null,
      completed_at: null as string | null,
      ...overrides,
    };
    await db.execute(
      `INSERT INTO planned_dish
          (id, meal_slot_id, dish_id, servings, is_completed,
           calories, protein, carbs, fat, fiber, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        slotId,
        dishId,
        row.servings,
        row.is_completed,
        row.calories,
        row.protein,
        row.carbs,
        row.fat,
        row.fiber,
        row.completed_at,
      ],
    );
    return id;
  }

  // ─── dailyTotals ──────────────────────────────────────────────────────

  describe('copying yesterday into an empty day', () => {
    let store: CalendarStore;
    const target = '2026-05-12';
    let targetLunch: string;
    let targetDinner: string;

    beforeEach(async () => {
      const source = await seedDay('2026-05-11');
      const destination = await seedDay(target);
      targetLunch = destination.slots['lunch'];
      targetDinner = destination.slots['dinner'];
      const dish = await seedDish('Món hôm qua', { calories: 100, protein: 10, carbs: 6, fat: 4 });
      await insertPlannedDish(source.slots['lunch'], dish, {
        servings: 1.5,
        is_completed: 1,
        calories: 120,
        protein: 12,
        carbs: 8,
        fat: 4,
        completed_at: '2026-05-11 12:00:00',
      });
      const dinnerId = await insertPlannedDish(source.slots['dinner'], dish, { servings: 2 });
      await db.execute('UPDATE planned_dish SET sort_order = 1 WHERE id = ?', [dinnerId]);
      store = TestBed.inject(CalendarStore);
      store.setDate(target);
    });

    it('keeps exactly two fresh plans after simultaneous taps and a retry', async () => {
      await Promise.all([store.copyFromYesterday(), store.copyFromYesterday()]);
      await store.copyFromYesterday();
      const rows = await db.query(
        'SELECT servings, is_completed, calories FROM planned_dish WHERE meal_slot_id IN (?, ?) ORDER BY servings',
        [targetLunch, targetDinner],
      );
      expect(rows).toEqual([
        { servings: 1.5, is_completed: 0, calories: null },
        { servings: 2, is_completed: 0, calories: null },
      ]);
      expect((await svc.dailyTotals(target)).calories).toBe(350);
      expect((await svc.loggedTotalsForDates([target]))[0].calories).toBe(0);
    });

    it('rolls back every meal if the second insert fails and allows retry', async () => {
      await db.execute(
        `CREATE TRIGGER fail_second_meal BEFORE INSERT ON planned_dish WHEN NEW.servings = 2
         BEGIN SELECT RAISE(ABORT, 'test insert failure'); END`,
      );
      await expectAsync(store.copyFromYesterday()).toBeRejected();
      expect((await svc.dailyTotals(target)).calories).toBe(0);
      await db.execute('DROP TRIGGER fail_second_meal');
      expect((await store.copyFromYesterday()).copiedCount).toBe(2);
      expect((await svc.dailyTotals(target)).calories).toBe(350);
    });
  });

  describe('dailyTotals', () => {
    it('restores the same row in order when a new meal is added during undo', async () => {
      const { slots } = await seedDay('2026-05-13');
      const id = await seedDish('Món trong thứ tự', {
        calories: 100,
        protein: 10,
        carbs: 6,
        fat: 4,
      });
      const repo = TestBed.inject(PlannedDishRepository);
      const slot = slots['lunch'];
      const a = await repo.addToSlot(slot, id, 1);
      const b = await repo.addToSlot(slot, id, 1.5);
      const c = await repo.addToSlot(slot, id, 2);
      await repo.markCompleted(b.id);
      const saved = (await db.getOne<typeof b>('SELECT * FROM planned_dish WHERE id = ?', [b.id]))!;
      const deleted = (await repo.delete(b.id))!;
      const d = await repo.addToSlot(slot, id, 3);
      expect(await repo.restoreDeletedDish(deleted)).toEqual(saved);
      const ids = (): Promise<string[]> =>
        db
          .query<{
            id: string;
          }>('SELECT id FROM planned_dish WHERE meal_slot_id = ? ORDER BY sort_order, created_at', [
            slot,
          ])
          .then((rows) => rows.map((row) => row.id));
      expect(await ids()).toEqual([a.id, b.id, c.id, d.id]);
      const tail = (await repo.delete(d.id))!;
      const e = await repo.addToSlot(slot, id, 4);
      await repo.restoreDeletedDish(tail);
      expect(await ids()).toEqual([a.id, b.id, c.id, d.id, e.id]);
    });

    it('keeps previously ordered peers when undoing a meal with a tied position', async () => {
      const { slots } = await seedDay('2026-05-14');
      const dish = await seedDish('Món trùng vị trí', {
        calories: 100,
        protein: 10,
        carbs: 6,
        fat: 4,
      });
      const entries = TestBed.inject(PlannedDishRepository);
      const slot = slots['lunch'];
      const first = await entries.addToSlot(slot, dish, 1);
      const middle = await entries.addToSlot(slot, dish, 2);
      const last = await entries.addToSlot(slot, dish, 3);
      await db.execute(
        "UPDATE planned_dish SET sort_order = 0, created_at = '2026-05-14 12:00:00' WHERE meal_slot_id = ?",
        [slot],
      );
      const deleted = (await entries.delete(middle.id))!;
      await entries.restoreDeletedDish(deleted);
      const day = await TestBed.inject(DayPlanRepository).findByDate('2026-05-14');
      expect(
        day?.meal_slots.find((meal) => meal.id === slot)?.planned_dishes.map((row) => row.id),
      ).toEqual([first.id, middle.id, last.id]);
    });

    it('appends week copies after an existing eaten meal without reusing its order', async () => {
      const source = await seedDay('2026-04-27');
      const target = await seedDay('2026-05-04');
      const dish = await seedDish('Thứ tự sao tuần', {
        calories: 100,
        protein: 10,
        carbs: 6,
        fat: 4,
      });
      const entries = TestBed.inject(PlannedDishRepository);
      await entries.addToSlot(source.slots['lunch'], dish, 1.5);
      const existing = await entries.addToSlot(target.slots['lunch'], dish, 1);
      await entries.markCompleted(existing.id);
      await entries.copyPreviousWeek('2026-05-04', '2026-04-27');
      const rows = await db.query(
        'SELECT sort_order, is_completed, servings FROM planned_dish WHERE meal_slot_id = ? ORDER BY sort_order',
        [target.slots['lunch']],
      );
      expect(rows).toEqual([
        { sort_order: 0, is_completed: 1, servings: 1 },
        { sort_order: 1, is_completed: 0, servings: 1.5 },
      ]);
    });

    it('scales a two-serving recipe across the library, calendar and eaten history', async () => {
      const date = '2026-05-11';
      const { slots } = await seedDay(date);
      const dishId = await seedDish('Món hai phần', {
        calories: 100,
        protein: 10,
        carbs: 6,
        fat: 4,
        fiber: 1,
      });
      await db.execute('UPDATE dish SET servings = 2 WHERE id = ?', [dishId]);
      await db.execute('UPDATE dish_ingredient SET gram_weight = 200 WHERE dish_id = ?', [dishId]);
      const dishes = TestBed.inject(DishRepository);
      const plans = TestBed.inject(DayPlanRepository);
      const entries = TestBed.inject(PlannedDishRepository);
      const entry = await entries.addToSlot(slots['lunch'], dishId, 1.5);
      const expected = { calories: 150, protein: 15, carbs: 9, fat: 6, fiber: 1.5 };

      const raw = await db.getOne<{ total_calories: number }>(
        'SELECT total_calories FROM dish_with_totals WHERE id = ?',
        [dishId],
      );
      expect(raw?.total_calories).toBe(200);
      expect((await dishes.list())[0].total_calories).toBe(100);
      const day = await plans.findByDate(date);
      const lunch = day?.meal_slots.find((slot) => slot.meal_type === 'lunch');
      expect(lunch?.planned_dishes[0].effective_calories).toBe(150);
      expect(await svc.dailyTotals(date)).toEqual(expected);
      expect((await svc.weekTotals(date))[0].calories).toBe(0);

      await entries.markCompleted(entry.id);
      const history = (await svc.weekTotals(date))[0];
      expect(history).toEqual({ date, ...expected });
      await db.execute('UPDATE dish SET servings = 4 WHERE id = ?', [dishId]);
      await entries.markCompleted(entry.id);
      expect((await entries.listRecentLogged())[0].total_calories).toBe(50);
      expect(await svc.dailyTotals(date)).toEqual(expected);
      const snapshot = await entries.delete(entry.id);
      expect(snapshot).not.toBeNull();
      if (!snapshot) return;
      const restored = await entries.restoreDeletedDish(snapshot);
      expect(restored.completed_at).toBe(snapshot.completed_at);
      expect((await svc.weekTotals(date))[0]).toEqual(history);
      await entries.copyToDate(restored.id, '2026-05-12', 'dinner');
      expect((await svc.dailyTotals('2026-05-12')).calories).toBe(75);
      expect((await svc.weekTotals(date))[1].calories).toBe(0);
    });

    it('returns sum of effective_* across logged + planned rows', async () => {
      const { slots } = await seedDay('2026-05-10');
      const dish = await seedDish('Cháo gà', {
        calories: 300,
        protein: 20,
        carbs: 40,
        fat: 5,
        fiber: 8,
      });

      // 1 planned (is_completed=0) → 300 cal × 2 servings = 600
      await insertPlannedDish(slots['breakfast'], dish, { servings: 2, is_completed: 0 });
      // 1 logged (is_completed=1) → snapshot 450 cal direct (servings ignored for snapshot)
      await insertPlannedDish(slots['lunch'], dish, {
        is_completed: 1,
        calories: 450,
        protein: 35,
        carbs: 50,
        fat: 12,
        fiber: 6,
        completed_at: '2026-05-10T12:00:00',
      });

      const totals = await svc.dailyTotals('2026-05-10');
      expect(totals.calories).toBe(600 + 450);
      expect(totals.protein).toBe(40 + 35);
      expect(totals.carbs).toBe(80 + 50);
      expect(totals.fat).toBe(10 + 12);
      expect(totals.fiber).toBe(16 + 6);
    });

    it('preserves pre-existing logged amounts on reopen even when recipe yield changes', async () => {
      const date = '2026-05-12';
      const { slots } = await seedDay(date);
      const dishId = await seedDish('Món đã ghi', { calories: 120, protein: 12, carbs: 6, fat: 4 });
      await insertPlannedDish(slots['breakfast'], dishId, {
        servings: 1.5,
        is_completed: 1,
        calories: 180,
        protein: 18,
        carbs: 9,
        fat: 6,
        fiber: 0,
        completed_at: '2026-05-12 07:00:00',
      });
      await db.execute('UPDATE dish SET servings = 2 WHERE id = ?', [dishId]);
      await insertPlannedDish(slots['lunch'], dishId, { servings: 1.5 });
      const reopened = new WebDatabase();
      await reopened.initialize();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [{ provide: Database, useValue: reopened }] });
      const query = TestBed.inject(NutritionQuery);
      expect((await query.loggedTotalsForDates([date]))[0].calories).toBe(180);
      expect((await query.dailyTotals(date)).calories).toBe(270);
    });

    it('returns all zeros for a date with no day_plan', async () => {
      const totals = await svc.dailyTotals('2099-01-01');
      expect(totals).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
    });
  });

  // ─── weekTotals ───────────────────────────────────────────────────────

  describe('weekTotals', () => {
    it('keeps existing meals intact when either week has an invalid calendar date', async () => {
      const date = '2026-05-04';
      const { slots } = await seedDay(date);
      const dish = await seedDish('Cơm', { calories: 120, protein: 5, carbs: 20, fat: 2 });
      await insertPlannedDish(slots['lunch'], dish, { servings: 1.5 });
      const entries = TestBed.inject(PlannedDishRepository);
      expect(await svc.weekTotals('2026-02-30')).toEqual([]);
      await expectAsync(entries.copyPreviousWeek(date, '2026-02-30')).toBeRejected();
      await expectAsync(entries.copyPreviousWeek('2026-02-30', date)).toBeRejected();
      expect((await svc.dailyTotals(date)).calories).toBe(180);
      expect(await db.getOne('SELECT id FROM day_plan WHERE date != ?', [date])).toBeNull();
    });

    it('returns 7 entries (Mon-Sun), logged-only sum', async () => {
      // Mon = 2026-05-04, Sun = 2026-05-10
      const monday = '2026-05-04';
      const day1 = await seedDay('2026-05-04');
      const day3 = await seedDay('2026-05-06');
      const dish = await seedDish('Phở', {
        calories: 500,
        protein: 30,
        carbs: 60,
        fat: 12,
        fiber: 10,
      });
      // logged on Mon
      await insertPlannedDish(day1.slots['lunch'], dish, {
        is_completed: 1,
        calories: 500,
        protein: 30,
        carbs: 60,
        fat: 12,
        fiber: 10,
        completed_at: '2026-05-04T12:00:00',
      });
      // PLANNED (NOT logged) on Mon — must be excluded
      await insertPlannedDish(day1.slots['dinner'], dish, { is_completed: 0, servings: 1 });
      // logged on Wed
      await insertPlannedDish(day3.slots['breakfast'], dish, {
        is_completed: 1,
        calories: 200,
        protein: 10,
        carbs: 25,
        fat: 4,
        fiber: 5,
        completed_at: '2026-05-06T08:00:00',
      });

      const week = await svc.weekTotals(monday);
      expect(week.length).toBe(7);
      expect(week.map((d) => d.date)).toEqual([
        '2026-05-04',
        '2026-05-05',
        '2026-05-06',
        '2026-05-07',
        '2026-05-08',
        '2026-05-09',
        '2026-05-10',
      ]);
      // Mon = ONLY logged (planned dinner excluded → 500, NOT 1000)
      expect(week[0].calories).toBe(500);
      // Tue = no day_plan → 0
      expect(week[1].calories).toBe(0);
      // Wed = 200
      expect(week[2].calories).toBe(200);
      expect(week[0].fiber).toBe(10);
      expect(week[2].fiber).toBe(5);
    });

    it('returns 7 zero rows for an empty week', async () => {
      const week = await svc.weekTotals('2030-01-06');
      expect(week.length).toBe(7);
      expect(week.every((d) => d.calories === 0 && d.protein === 0 && d.fiber === 0)).toBeTrue();
    });
  });

  // ─── loggedTotalsForDates ──────────────────────────────────────────────

  describe('loggedTotalsForDates', () => {
    it('returns caller-ordered logged-only totals and excludes planned rows', async () => {
      const day1 = await seedDay('2026-05-08');
      const day2 = await seedDay('2026-05-09');
      const dish = await seedDish('Cơm gà', {
        calories: 520,
        protein: 38,
        carbs: 55,
        fat: 16,
        fiber: 7,
      });

      await insertPlannedDish(day1.slots['lunch'], dish, {
        is_completed: 1,
        calories: 520,
        protein: 38,
        carbs: 55,
        fat: 16,
        fiber: 7,
        completed_at: '2026-05-08T12:00:00',
      });
      await insertPlannedDish(day2.slots['dinner'], dish, {
        is_completed: 0,
        servings: 1,
      });

      const totals = await svc.loggedTotalsForDates(['2026-05-09', '2026-05-08', '2026-05-07']);

      expect(totals.map((d) => d.date)).toEqual(['2026-05-09', '2026-05-08', '2026-05-07']);
      expect(totals.map((d) => d.calories)).toEqual([0, 520, 0]);
      expect(totals[1].fiber).toBe(7);
    });
  });

  // ─── trend ────────────────────────────────────────────────────────────

  describe('trend', () => {
    it('returns one TrendPoint per day in the range, logged-only', async () => {
      const day1 = await seedDay('2026-05-04');
      const day2 = await seedDay('2026-05-05');
      const dish = await seedDish('Bún bò', {
        calories: 600,
        protein: 35,
        carbs: 70,
        fat: 18,
        fiber: 9,
      });
      await insertPlannedDish(day1.slots['lunch'], dish, {
        is_completed: 1,
        calories: 600,
        protein: 35,
        carbs: 70,
        fat: 18,
        fiber: 9,
        completed_at: '2026-05-04T12:30:00',
      });
      await insertPlannedDish(day2.slots['dinner'], dish, {
        is_completed: 1,
        calories: 800,
        protein: 40,
        carbs: 90,
        fat: 22,
        fiber: 11,
        completed_at: '2026-05-05T19:00:00',
      });

      const points = await svc.trend('2026-05-03', '2026-05-06', 'calories');
      expect(points.map((p) => p.date)).toEqual([
        '2026-05-03',
        '2026-05-04',
        '2026-05-05',
        '2026-05-06',
      ]);
      expect(points.map((p) => p.value)).toEqual([0, 600, 800, 0]);
    });

    it('honors the requested metric column (protein vs calories)', async () => {
      const day1 = await seedDay('2026-05-04');
      const dish = await seedDish('Gà nướng', {
        calories: 400,
        protein: 50,
        carbs: 5,
        fat: 18,
        fiber: 3,
      });
      await insertPlannedDish(day1.slots['lunch'], dish, {
        is_completed: 1,
        calories: 400,
        protein: 50,
        carbs: 5,
        fat: 18,
        fiber: 3,
        completed_at: '2026-05-04T12:00:00',
      });
      const cal = await svc.trend('2026-05-04', '2026-05-04', 'calories');
      const pro = await svc.trend('2026-05-04', '2026-05-04', 'protein');
      expect(cal[0].value).toBe(400);
      expect(pro[0].value).toBe(50);
    });

    it('returns empty array when end < start (defensive)', async () => {
      const points = await svc.trend('2026-05-10', '2026-05-04', 'calories');
      expect(points).toEqual([]);
    });
  });

  // ─── EXPLAIN QUERY PLAN — DEC-06 index assertions ─────────────────────

  describe('EXPLAIN QUERY PLAN — index usage (DEC-06)', () => {
    it('dailyTotals uses idx_day_plan_date for the date WHERE', async () => {
      // Force the planner to pick the index by populating enough rows so
      // a full scan looks costlier than the index probe.
      for (let i = 1; i <= 20; i += 1) {
        await db.execute(
          `INSERT INTO day_plan (id, date, target_calories, target_protein) VALUES (?, ?, ?, ?)`,
          [crypto.randomUUID(), `2026-04-${String(i).padStart(2, '0')}`, 2000, 150],
        );
      }
      const plan = await db.query<{ detail: string }>(
        `EXPLAIN QUERY PLAN
         SELECT 1 FROM day_plan WHERE date = ?`,
        ['2026-04-15'],
      );
      const joined = plan.map((p) => p.detail).join(' | ');
      // Either the explicit idx_day_plan_date OR SQLite's UNIQUE autoindex on
      // day_plan(date) is acceptable — both prove the planner uses an index
      // probe (NOT a full-table SCAN) for the date WHERE.
      const usesIndex =
        joined.includes('idx_day_plan_date') || joined.includes('sqlite_autoindex_day_plan');
      expect(usesIndex)
        .withContext(`expected index usage on day_plan(date), got: ${joined}`)
        .toBeTrue();
      // Belt-and-braces: never a full SCAN.
      expect(joined).not.toContain('SCAN day_plan');
    });

    it('weekTotals filter (is_completed=1) hits idx_planned_dish_completed', async () => {
      const plan = await db.query<{ detail: string }>(
        `EXPLAIN QUERY PLAN
         SELECT * FROM planned_dish INDEXED BY idx_planned_dish_completed
         WHERE is_completed = 1`,
      );
      const joined = plan.map((p) => p.detail).join(' | ');
      expect(joined).toContain('idx_planned_dish_completed');
    });

    it('trend ORDER BY completed_at uses idx_planned_dish_completed_at', async () => {
      const plan = await db.query<{ detail: string }>(
        `EXPLAIN QUERY PLAN
         SELECT * FROM planned_dish INDEXED BY idx_planned_dish_completed_at
         WHERE is_completed = 1
         ORDER BY completed_at DESC`,
      );
      const joined = plan.map((p) => p.detail).join(' | ');
      expect(joined).toContain('idx_planned_dish_completed_at');
    });
  });
});
