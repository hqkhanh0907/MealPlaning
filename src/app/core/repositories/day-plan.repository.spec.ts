import { TestBed } from '@angular/core/testing';
import type { DayPlan, MealSlot } from '../models/meal-plan.types';
import { Database } from '../services/database/database';
import { DayPlanRepository } from './day-plan.repository';

describe('DayPlanRepository', () => {
  let repo: DayPlanRepository;
  let db: jasmine.SpyObj<Database>;

  const fixedDayPlan: DayPlan = {
    id: 'dp-1',
    date: '2026-05-10',
    target_calories: 0,
    target_protein: 0,
    created_at: '2026-05-10T00:00:00Z',
    updated_at: null,
  };

  const fourSlots: MealSlot[] = [
    {
      id: 's-b',
      day_plan_id: 'dp-1',
      meal_type: 'breakfast',
      position: 0,
      created_at: '2026-05-10T00:00:00Z',
    },
    {
      id: 's-l',
      day_plan_id: 'dp-1',
      meal_type: 'lunch',
      position: 1,
      created_at: '2026-05-10T00:00:00Z',
    },
    {
      id: 's-d',
      day_plan_id: 'dp-1',
      meal_type: 'dinner',
      position: 2,
      created_at: '2026-05-10T00:00:00Z',
    },
    {
      id: 's-s',
      day_plan_id: 'dp-1',
      meal_type: 'snack',
      position: 3,
      created_at: '2026-05-10T00:00:00Z',
    },
  ];

  beforeEach(() => {
    db = jasmine.createSpyObj<Database>('Database', [
      'initialize',
      'execute',
      'query',
      'getOne',
      'withTransaction',
    ]);
    db.withTransaction.and.callFake(async <T>(callback: () => Promise<T>) => callback());

    TestBed.configureTestingModule({
      providers: [DayPlanRepository, { provide: Database, useValue: db }],
    });
    repo = TestBed.inject(DayPlanRepository);
  });

  describe('getOrCreateForDate', () => {
    it('returns existing day_plan without writing when row already exists', async () => {
      db.getOne.and.returnValue(Promise.resolve(fixedDayPlan));

      const result = await repo.getOrCreateForDate('2026-05-10');

      expect(result).toEqual(fixedDayPlan);
      expect(db.withTransaction).not.toHaveBeenCalled();
      expect(db.execute).not.toHaveBeenCalled();
    });

    it('creates day_plan + 4 meal_slots in a single transaction when missing', async () => {
      let lookupCount = 0;
      db.getOne.and.callFake(async () => {
        lookupCount += 1;
        // first call: existence probe → null. second call: post-insert fetch → fixed row.
        return lookupCount === 1 ? null : (fixedDayPlan as never);
      });
      db.execute.and.returnValue(Promise.resolve());

      await repo.getOrCreateForDate('2026-05-10');

      expect(db.withTransaction).toHaveBeenCalledTimes(1);
      // 1 day_plan insert + 4 meal_slot inserts.
      expect(db.execute).toHaveBeenCalledTimes(5);

      const insertedSlotMealTypes = db.execute.calls
        .allArgs()
        .filter(([sql]) => (sql as string).includes('INSERT INTO meal_slot'))
        .map(([, params]) => (params as unknown[])[2]);
      expect(insertedSlotMealTypes).toEqual(['breakfast', 'lunch', 'dinner', 'snack']);
    });

    it('throws if day_plan disappears immediately after insert (defensive)', async () => {
      db.getOne.and.returnValue(Promise.resolve(null));
      db.execute.and.returnValue(Promise.resolve());

      await expectAsync(repo.getOrCreateForDate('2026-05-10')).toBeRejectedWithError(
        /missing after insert/,
      );
    });
  });

  describe('findByDate', () => {
    it('returns null when no day_plan exists for the date', async () => {
      db.getOne.and.returnValue(Promise.resolve(null));

      const result = await repo.findByDate('2026-05-10');

      expect(result).toBeNull();
      expect(db.query).not.toHaveBeenCalled();
    });

    it('returns nested day_plan with 4 slots and grouped planned_dishes', async () => {
      db.getOne.and.returnValue(Promise.resolve(fixedDayPlan));
      db.query.and.callFake(async (sql: string) => {
        if (sql.includes('FROM meal_slot')) {
          return fourSlots as never;
        }
        if (sql.includes('FROM planned_dish pd')) {
          return [
            {
              id: 'pd-1',
              meal_slot_id: 's-l',
              dish_id: 'd-1',
              servings: 1.5,
              sort_order: 0,
              is_completed: 0,
              completed_at: null,
              calories: null,
              protein: null,
              carbs: null,
              fat: null,
              fiber: null,
              created_at: '2026-05-10T00:00:00Z',
              dish_name: 'Cơm trứng',
              effective_calories: 600,
              effective_protein: 30,
              effective_carbs: 80,
              effective_fat: 15,
              effective_fiber: 6,
            },
          ] as never;
        }
        return [] as never;
      });

      const result = await repo.findByDate('2026-05-10');

      expect(result).not.toBeNull();
      expect(result!.meal_slots).toHaveSize(4);
      const lunch = result!.meal_slots.find((s) => s.meal_type === 'lunch')!;
      expect(lunch.planned_dishes).toHaveSize(1);
      expect(lunch.planned_dishes[0].effective_calories).toBe(600);

      // Verify SELECT contains the effective_* CASE projection (AC-5).
      const dishQuerySql = db.query.calls
        .allArgs()
        .map(([sql]) => sql as string)
        .find((sql) => sql.includes('FROM planned_dish pd'))!;
      expect(dishQuerySql).toContain('effective_calories');
      expect(dishQuerySql).toContain('effective_protein');
      expect(dishQuerySql).toContain('effective_carbs');
      expect(dishQuerySql).toContain('effective_fat');
      expect(dishQuerySql).toContain('effective_fiber');
      expect(dishQuerySql).toContain('CASE WHEN pd.is_completed = 1 THEN pd.calories');
    });

    it('returns slots with empty planned_dishes when no dishes scheduled', async () => {
      db.getOne.and.returnValue(Promise.resolve(fixedDayPlan));
      db.query.and.callFake(async (sql: string) => {
        if (sql.includes('FROM meal_slot')) {
          return fourSlots as never;
        }
        return [] as never;
      });

      const result = await repo.findByDate('2026-05-10');

      expect(result!.meal_slots.every((s) => s.planned_dishes.length === 0)).toBeTrue();
    });
  });

  describe('findByDateRange', () => {
    it('returns empty array when range has no day_plans', async () => {
      db.query.and.returnValue(Promise.resolve([]));

      const result = await repo.findByDateRange('2026-05-01', '2026-05-07');

      expect(result).toEqual([]);
      const rangeSql = db.query.calls.first().args[0] as string;
      expect(rangeSql).toContain('BETWEEN ? AND ?');
      expect(rangeSql).toContain('ORDER BY date ASC');
    });

    it('assembles each day_plan in the range with its slots and dishes', async () => {
      const second: DayPlan = { ...fixedDayPlan, id: 'dp-2', date: '2026-05-11' };
      let queryCalls = 0;
      db.query.and.callFake(async (sql: string) => {
        queryCalls += 1;
        if (queryCalls === 1) {
          return [fixedDayPlan, second] as never;
        }
        if (sql.includes('FROM meal_slot')) {
          return fourSlots as never;
        }
        return [] as never;
      });

      const result = await repo.findByDateRange('2026-05-10', '2026-05-11');

      expect(result).toHaveSize(2);
      expect(result[0].meal_slots).toHaveSize(4);
      expect(result[1].meal_slots).toHaveSize(4);
    });
  });
});
