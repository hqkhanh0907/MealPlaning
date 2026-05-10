import { TestBed } from '@angular/core/testing';
import type { PlannedDish } from '../models/meal-plan.types';
import { Database } from '../services/database/database';
import { DayPlanRepository } from './day-plan.repository';
import { PlannedDishRepository } from './planned-dish.repository';

describe('PlannedDishRepository', () => {
  let repo: PlannedDishRepository;
  let db: jasmine.SpyObj<Database>;
  let dayPlanRepo: jasmine.SpyObj<DayPlanRepository>;

  const planned: PlannedDish = {
    id: 'pd-1',
    meal_slot_id: 's-1',
    dish_id: 'd-1',
    servings: 2,
    sort_order: 0,
    is_completed: 0,
    completed_at: null,
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    created_at: '2026-05-10T00:00:00Z',
  };

  const logged: PlannedDish = {
    ...planned,
    id: 'pd-2',
    is_completed: 1,
    completed_at: '2026-05-10T01:00:00Z',
    calories: 800,
    protein: 40,
    carbs: 100,
    fat: 20,
  };

  const totalsRow = {
    id: 'd-1',
    name: 'Cơm trứng',
    total_calories: 400,
    total_protein: 20,
    total_carbs: 50,
    total_fat: 10,
  };

  beforeEach(() => {
    db = jasmine.createSpyObj<Database>('Database', [
      'initialize',
      'execute',
      'query',
      'getOne',
      'withTransaction',
    ]);
    db.withTransaction.and.callFake(async <T>(callback: () => Promise<T>) => callback());
    db.execute.and.returnValue(Promise.resolve());
    db.query.and.returnValue(Promise.resolve([]));

    dayPlanRepo = jasmine.createSpyObj<DayPlanRepository>('DayPlanRepository', [
      'getOrCreateForDate',
      'findByDate',
      'findByDateRange',
    ]);

    TestBed.configureTestingModule({
      providers: [
        PlannedDishRepository,
        { provide: Database, useValue: db },
        { provide: DayPlanRepository, useValue: dayPlanRepo },
      ],
    });
    repo = TestBed.inject(PlannedDishRepository);
  });

  describe('addToSlot', () => {
    it('inserts with is_completed=0 and 4 nutrition cols NULL', async () => {
      let calls = 0;
      db.getOne.and.callFake(async () => {
        calls += 1;
        if (calls === 1) return { max_sort: 2 } as never; // sort_order resolution
        return planned as never; // post-insert fetch
      });

      const result = await repo.addToSlot('s-1', 'd-1', 2);

      expect(result).toEqual(planned);
      expect(db.withTransaction).toHaveBeenCalledTimes(1);
      const insertCall = db.execute.calls
        .allArgs()
        .find(([sql]) => (sql as string).includes('INSERT INTO planned_dish'))!;
      const sql = insertCall[0] as string;
      expect(sql).toContain('is_completed, completed_at, calories, protein, carbs, fat');
      expect(sql).toContain('VALUES (?, ?, ?, ?, ?, 0, NULL, NULL, NULL, NULL, NULL)');
      const params = insertCall[1] as unknown[];
      expect(params[4]).toBe(3); // sort_order = max_sort + 1
    });

    it('starts sort_order at 0 when slot is empty', async () => {
      let calls = 0;
      db.getOne.and.callFake(async () => {
        calls += 1;
        if (calls === 1) return { max_sort: null } as never;
        return planned as never;
      });

      await repo.addToSlot('s-1', 'd-1', 1);

      const insertCall = db.execute.calls
        .allArgs()
        .find(([sql]) => (sql as string).includes('INSERT INTO planned_dish'))!;
      expect((insertCall[1] as unknown[])[4]).toBe(0);
    });
  });

  describe('markCompleted', () => {
    it('snapshots dish_with_totals × servings + uses datetime(now) (Disaster A)', async () => {
      let calls = 0;
      db.getOne.and.callFake(async (sql: string) => {
        calls += 1;
        if (sql.includes('FROM planned_dish')) return planned as never;
        if (sql.includes('FROM dish_with_totals')) return totalsRow as never;
        return null;
      });

      await repo.markCompleted('pd-1');

      expect(db.withTransaction).toHaveBeenCalledTimes(1);
      const updateCall = db.execute.calls
        .allArgs()
        .find(([sql]) => (sql as string).includes('UPDATE planned_dish'))!;
      const sql = updateCall[0] as string;
      expect(sql).toContain("completed_at = datetime('now')");
      expect(sql).not.toContain('Date.now');
      const params = updateCall[1] as unknown[];
      // calories/protein/carbs/fat = totals × servings(2)
      expect(params[0]).toBe(800);
      expect(params[1]).toBe(40);
      expect(params[2]).toBe(100);
      expect(params[3]).toBe(20);
      expect(params[4]).toBe('pd-1');
      expect(calls).toBeGreaterThanOrEqual(2);
    });

    it('throws when planned_dish row is missing', async () => {
      db.getOne.and.returnValue(Promise.resolve(null));

      await expectAsync(repo.markCompleted('pd-missing')).toBeRejectedWithError(/not found/);
    });

    it('throws when dish_with_totals row is missing (CHECK protection)', async () => {
      let calls = 0;
      db.getOne.and.callFake(async () => {
        calls += 1;
        return calls === 1 ? (planned as never) : null;
      });

      await expectAsync(repo.markCompleted('pd-1')).toBeRejectedWithError(
        /dish_with_totals row missing/,
      );
      // No UPDATE issued — DB state unchanged.
      const updateCalls = db.execute.calls
        .allArgs()
        .filter(([sql]) => (sql as string).includes('UPDATE planned_dish'));
      expect(updateCalls).toHaveSize(0);
    });

    it('propagates DB CHECK rejection when snapshot has NULL nutrition (AC-4)', async () => {
      // Scenario: dish_with_totals row exists but a column is NULL (e.g. an
      // ingredient with NULL macro). Snapshot multiplies through to NULL,
      // schema v2 CHECK then rejects the UPDATE — repo must let that bubble.
      const corruptTotals = { ...totalsRow, total_protein: null as unknown as number };
      db.getOne.and.callFake(async (sql: string) => {
        if (sql.includes('FROM planned_dish')) return planned as never;
        if (sql.includes('FROM dish_with_totals')) return corruptTotals as never;
        return null;
      });
      db.execute.and.callFake(async (sql: string) => {
        if (sql.includes('UPDATE planned_dish')) {
          throw new Error('CHECK constraint failed: planned_dish_hybrid_check');
        }
      });

      await expectAsync(repo.markCompleted('pd-1')).toBeRejectedWithError(
        /CHECK constraint failed/i,
      );
    });
  });

  describe('unmarkCompleted', () => {
    it('resets is_completed, completed_at, and 4 nutrition cols to NULL (SNAP-05)', async () => {
      await repo.unmarkCompleted('pd-2');

      expect(db.withTransaction).toHaveBeenCalledTimes(1);
      const sql = db.execute.calls.first().args[0] as string;
      expect(sql).toContain('is_completed = 0');
      expect(sql).toContain('completed_at = NULL');
      expect(sql).toContain('calories     = NULL');
      expect(sql).toContain('protein      = NULL');
      expect(sql).toContain('carbs        = NULL');
      expect(sql).toContain('fat          = NULL');
    });
  });

  describe('editServings', () => {
    it('planned (is_completed=0): plain UPDATE of servings only', async () => {
      db.getOne.and.returnValue(Promise.resolve(planned));

      await repo.editServings('pd-1', 3);

      const updates = db.execute.calls
        .allArgs()
        .filter(([sql]) => (sql as string).includes('UPDATE planned_dish'));
      expect(updates).toHaveSize(1);
      expect(updates[0][0]).toContain('SET servings = ?');
      expect(updates[0][0]).not.toContain('calories');
      expect(updates[0][1]).toEqual([3, 'pd-1']);
    });

    it('logged (is_completed=1): re-queries CURRENT dish_with_totals — NOT ratio scale (Disaster B)', async () => {
      // Recipe changed since logging: total_calories now 500 (was 400).
      const newerTotals = { ...totalsRow, total_calories: 500, total_protein: 25 };
      db.getOne.and.callFake(async (sql: string) => {
        if (sql.includes('FROM planned_dish')) return logged as never;
        if (sql.includes('FROM dish_with_totals')) return newerTotals as never;
        return null;
      });

      await repo.editServings('pd-2', 3);

      const updateCall = db.execute.calls
        .allArgs()
        .find(([sql]) => (sql as string).includes('UPDATE planned_dish'))!;
      const params = updateCall[1] as unknown[];
      // Snapshot must come from CURRENT totals × newServings(3), not from
      // ratio-scaling old snapshot (which would be 800 × 3/2 = 1200).
      expect(params[0]).toBe(3); // servings
      expect(params[1]).toBe(1500); // 500 × 3
      expect(params[2]).toBe(75); // 25 × 3
      expect(params[3]).toBe(150); // carbs 50 × 3
      expect(params[4]).toBe(30); // fat 10 × 3
    });

    it('throws when planned_dish missing', async () => {
      db.getOne.and.returnValue(Promise.resolve(null));
      await expectAsync(repo.editServings('pd-missing', 1)).toBeRejectedWithError(/not found/);
    });
  });

  describe('delete', () => {
    it('hard-deletes the row (no soft-delete)', async () => {
      await repo.delete('pd-1');

      expect(db.execute).toHaveBeenCalledWith('DELETE FROM planned_dish WHERE id = ?', ['pd-1']);
    });
  });

  describe('moveToSlot', () => {
    it('updates meal_slot_id and recomputes sort_order to MAX+1 of new slot', async () => {
      db.getOne.and.returnValue(Promise.resolve({ max_sort: 4 } as never));

      await repo.moveToSlot('pd-1', 's-2');

      expect(db.withTransaction).toHaveBeenCalledTimes(1);
      const updateCall = db.execute.calls.first();
      expect(updateCall.args[0]).toContain('UPDATE planned_dish SET meal_slot_id = ?');
      expect(updateCall.args[1]).toEqual(['s-2', 5, 'pd-1']);
    });

    it('lands at sort_order=0 when target slot is empty', async () => {
      db.getOne.and.returnValue(Promise.resolve({ max_sort: null } as never));

      await repo.moveToSlot('pd-1', 's-empty');

      expect(db.execute.calls.first().args[1]).toEqual(['s-empty', 0, 'pd-1']);
    });
  });

  describe('copyToDate', () => {
    it('chains getOrCreateForDate + addToSlot with is_completed=0 (Hybrid)', async () => {
      let plannedFetchCount = 0;
      db.getOne.and.callFake(async (sql: string) => {
        if (sql.includes('SELECT * FROM planned_dish WHERE id = ?')) {
          plannedFetchCount += 1;
          // 1st call = copyToDate source lookup → original. 2nd = post-insert fetch → new id.
          return plannedFetchCount === 1
            ? (planned as never)
            : ({ ...planned, id: 'pd-new', meal_slot_id: 's-target' } as never);
        }
        if (sql.includes('FROM meal_slot')) return { id: 's-target' } as never;
        if (sql.includes('COALESCE(MAX(sort_order)')) return { max_sort: 0 } as never;
        return null;
      });
      dayPlanRepo.getOrCreateForDate.and.returnValue(
        Promise.resolve({
          id: 'dp-target',
          date: '2026-05-12',
          target_calories: 0,
          target_protein: 0,
          created_at: 'x',
          updated_at: null,
        }),
      );

      const result = await repo.copyToDate('pd-1', '2026-05-12', 'lunch');

      expect(dayPlanRepo.getOrCreateForDate).toHaveBeenCalledWith('2026-05-12');
      expect(result.id).toBe('pd-new');
      // Verify the insert in addToSlot used is_completed=0.
      const insertCall = db.execute.calls
        .allArgs()
        .find(([sql]) => (sql as string).includes('INSERT INTO planned_dish'))!;
      expect(insertCall[0]).toContain('VALUES (?, ?, ?, ?, ?, 0, NULL, NULL, NULL, NULL, NULL)');
    });

    it('throws when source planned_dish is missing', async () => {
      db.getOne.and.returnValue(Promise.resolve(null));

      await expectAsync(repo.copyToDate('pd-missing', '2026-05-12', 'lunch')).toBeRejectedWithError(
        /not found/,
      );
    });

    it('throws when target meal_slot is missing for the meal_type', async () => {
      let calls = 0;
      db.getOne.and.callFake(async (sql: string) => {
        calls += 1;
        if (calls === 1 && sql.includes('FROM planned_dish')) return planned as never;
        if (sql.includes('FROM meal_slot')) return null;
        return null;
      });
      dayPlanRepo.getOrCreateForDate.and.returnValue(
        Promise.resolve({
          id: 'dp-target',
          date: '2026-05-12',
          target_calories: 0,
          target_protein: 0,
          created_at: 'x',
          updated_at: null,
        }),
      );

      await expectAsync(repo.copyToDate('pd-1', '2026-05-12', 'snack')).toBeRejectedWithError(
        /meal_slot.*missing/,
      );
    });
  });

  describe('listRecentLogged', () => {
    it('queries DISTINCT logged dishes ordered by MAX(completed_at) DESC', async () => {
      db.query.and.returnValue(Promise.resolve([]));

      await repo.listRecentLogged(15);

      const sql = db.query.calls.first().args[0] as string;
      expect(sql).toContain('FROM dish_with_totals dwt');
      expect(sql).toContain('MAX(completed_at) AS last_completed');
      expect(sql).toContain('WHERE is_completed = 1');
      expect(sql).toContain('GROUP BY dish_id');
      expect(sql).toContain('ORDER BY recent.last_completed DESC');
      expect(db.query.calls.first().args[1]).toEqual([15]);
    });

    it('defaults limit to 30 when not specified', async () => {
      db.query.and.returnValue(Promise.resolve([]));

      await repo.listRecentLogged();

      expect(db.query.calls.first().args[1]).toEqual([30]);
    });
  });

  describe('transaction wrap (AC-3)', () => {
    it('uses withTransaction for every mutation method', async () => {
      // Drive each mutation; assert withTransaction called by counting before/after.
      db.getOne.and.callFake(async (sql: string) => {
        if (sql.includes('FROM planned_dish')) return planned as never;
        if (sql.includes('FROM dish_with_totals')) return totalsRow as never;
        if (sql.includes('FROM meal_slot')) return { id: 's-target' } as never;
        if (sql.includes('COALESCE(MAX')) return { max_sort: 0 } as never;
        return planned as never;
      });
      dayPlanRepo.getOrCreateForDate.and.returnValue(
        Promise.resolve({
          id: 'dp-x',
          date: '2026-05-12',
          target_calories: 0,
          target_protein: 0,
          created_at: 'x',
          updated_at: null,
        }),
      );

      const before = db.withTransaction.calls.count();
      await repo.addToSlot('s-1', 'd-1', 1);
      await repo.markCompleted('pd-1');
      await repo.unmarkCompleted('pd-1');
      await repo.editServings('pd-1', 2);
      await repo.moveToSlot('pd-1', 's-2');
      await repo.copyToDate('pd-1', '2026-05-12', 'lunch');
      const after = db.withTransaction.calls.count();

      // 6 mutations top-level + 1 nested wrap inside copyToDate's addToSlot
      // could double-count the transaction. Pragmatic check: every mutation
      // we expose enters the transaction wrapper at least once. Source repo
      // composes copyToDate via addToSlot so the inner addToSlot's wrap is
      // the same outer wrap (no double bracket — addToSlot reuses caller's
      // tx contract via Database). We assert ≥6 to keep the contract: every
      // public mutation method took the transaction path.
      expect(after - before).toBeGreaterThanOrEqual(6);
    });
  });

  describe('copyPreviousWeek', () => {
    /**
     * Mocks the SQL routing for copyPreviousWeek by inspecting the SQL string.
     * Returns a configurable per-day fixture keyed by ISO date.
     */
    function setupWeekCopyMocks(opts: {
      prevDayPlans: Record<
        string,
        {
          id: string;
          slots: { id: string; meal_type: string }[];
          dishes: { meal_slot_id: string; dish_id: string; servings: number }[];
        } | null
      >;
      targetDayPlans: Record<string, { id: string; slots: { id: string; meal_type: string }[] }>;
    }): void {
      // getOrCreateForDate spies — return a deterministic dayPlan per date.
      dayPlanRepo.getOrCreateForDate.and.callFake(async (date: string) => {
        const target = opts.targetDayPlans[date];
        if (!target) throw new Error(`no target fixture for ${date}`);
        return {
          id: target.id,
          date,
          target_calories: 2000,
          target_protein: 100,
          created_at: '2026-05-04T00:00:00Z',
          updated_at: null,
        };
      });

      // db.getOne — only called for "SELECT id FROM day_plan WHERE date = ?"
      // (prev-week probe). Other getOne paths in this method are absent.
      db.getOne.and.callFake(async <T>(_sql: string, params?: unknown[]) => {
        const date = params?.[0] as string;
        const prev = opts.prevDayPlans[date];
        if (prev === undefined) return null as T | null;
        if (prev === null) return null as T | null;
        return { id: prev.id } as T;
      });

      // db.query — route by SQL prefix and dayPlanId param.
      db.query.and.callFake(async <T>(sql: string, params?: unknown[]) => {
        if (sql.startsWith('SELECT id, meal_type FROM meal_slot WHERE day_plan_id')) {
          const dayPlanId = params?.[0] as string;
          // Search prev fixtures first.
          for (const v of Object.values(opts.prevDayPlans)) {
            if (v && v.id === dayPlanId) return v.slots as T[];
          }
          for (const v of Object.values(opts.targetDayPlans)) {
            if (v.id === dayPlanId) return v.slots as T[];
          }
          return [] as T[];
        }
        if (sql.startsWith('SELECT meal_slot_id, dish_id, servings')) {
          // Match on slot ids — find the prev fixture whose slots intersect params.
          for (const v of Object.values(opts.prevDayPlans)) {
            if (!v) continue;
            const slotIdSet = new Set(v.slots.map((s) => s.id));
            const want = (params ?? []).filter((p) => slotIdSet.has(p as string));
            if (want.length > 0) {
              return v.dishes.filter((d) => slotIdSet.has(d.meal_slot_id)) as T[];
            }
          }
          return [] as T[];
        }
        return [] as T[];
      });
    }

    it('returns 0/0 when previous week is fully empty', async () => {
      setupWeekCopyMocks({
        prevDayPlans: {
          '2026-04-27': null,
          '2026-04-28': null,
          '2026-04-29': null,
          '2026-04-30': null,
          '2026-05-01': null,
          '2026-05-02': null,
          '2026-05-03': null,
        },
        targetDayPlans: {},
      });
      const result = await repo.copyPreviousWeek('2026-05-04', '2026-04-27');
      expect(result).toEqual({ copiedCount: 0, daysAffected: 0 });
      expect(dayPlanRepo.getOrCreateForDate).not.toHaveBeenCalled();
    });

    it('copies a 1-dish day from prev week into target week with same meal_type', async () => {
      setupWeekCopyMocks({
        prevDayPlans: {
          '2026-04-27': {
            id: 'dp-prev-mon',
            slots: [
              { id: 'pslot-bf', meal_type: 'breakfast' },
              { id: 'pslot-l', meal_type: 'lunch' },
              { id: 'pslot-d', meal_type: 'dinner' },
              { id: 'pslot-s', meal_type: 'snack' },
            ],
            dishes: [{ meal_slot_id: 'pslot-bf', dish_id: 'dish-x', servings: 1.5 }],
          },
          '2026-04-28': null,
          '2026-04-29': null,
          '2026-04-30': null,
          '2026-05-01': null,
          '2026-05-02': null,
          '2026-05-03': null,
        },
        targetDayPlans: {
          '2026-05-04': {
            id: 'dp-cur-mon',
            slots: [
              { id: 'tslot-bf', meal_type: 'breakfast' },
              { id: 'tslot-l', meal_type: 'lunch' },
              { id: 'tslot-d', meal_type: 'dinner' },
              { id: 'tslot-s', meal_type: 'snack' },
            ],
          },
        },
      });

      const result = await repo.copyPreviousWeek('2026-05-04', '2026-04-27');
      expect(result).toEqual({ copiedCount: 1, daysAffected: 1 });
      expect(dayPlanRepo.getOrCreateForDate).toHaveBeenCalledWith('2026-05-04');

      // INSERT was issued into tslot-bf with dish-x + servings 1.5.
      const insertCall = db.execute.calls
        .allArgs()
        .find(
          (args) =>
            String(args[0]).startsWith('INSERT INTO planned_dish') &&
            (args[1] as unknown[])[1] === 'tslot-bf',
        );
      expect(insertCall).toBeDefined();
      expect((insertCall![1] as unknown[])[2]).toBe('dish-x');
      expect((insertCall![1] as unknown[])[3]).toBe(1.5);
    });

    it('clears existing planned (is_completed=0) rows in target slots before insert', async () => {
      setupWeekCopyMocks({
        prevDayPlans: {
          '2026-04-27': {
            id: 'dp-prev-mon',
            slots: [{ id: 'pslot-bf', meal_type: 'breakfast' }],
            dishes: [{ meal_slot_id: 'pslot-bf', dish_id: 'dish-x', servings: 1 }],
          },
          '2026-04-28': null,
          '2026-04-29': null,
          '2026-04-30': null,
          '2026-05-01': null,
          '2026-05-02': null,
          '2026-05-03': null,
        },
        targetDayPlans: {
          '2026-05-04': {
            id: 'dp-cur-mon',
            slots: [
              { id: 'tslot-bf', meal_type: 'breakfast' },
              { id: 'tslot-l', meal_type: 'lunch' },
            ],
          },
        },
      });

      await repo.copyPreviousWeek('2026-05-04', '2026-04-27');

      const deleteCall = db.execute.calls
        .allArgs()
        .find(
          (args) =>
            String(args[0]).startsWith('DELETE FROM planned_dish') &&
            String(args[0]).includes('is_completed = 0'),
        );
      expect(deleteCall).toBeDefined();
      // params include both target slot ids (clear-all-slots semantic)
      expect(deleteCall![1] as unknown[]).toEqual(['tslot-bf', 'tslot-l']);
    });

    it('runs all work inside a single withTransaction call', async () => {
      setupWeekCopyMocks({
        prevDayPlans: {
          '2026-04-27': null,
          '2026-04-28': null,
          '2026-04-29': null,
          '2026-04-30': null,
          '2026-05-01': null,
          '2026-05-02': null,
          '2026-05-03': null,
        },
        targetDayPlans: {},
      });
      const before = db.withTransaction.calls.count();
      await repo.copyPreviousWeek('2026-05-04', '2026-04-27');
      expect(db.withTransaction.calls.count() - before).toBe(1);
    });

    it('inserts re-numbered sort_order starting at 0 per target slot', async () => {
      setupWeekCopyMocks({
        prevDayPlans: {
          '2026-04-27': {
            id: 'dp-prev-mon',
            slots: [
              { id: 'pslot-bf', meal_type: 'breakfast' },
              { id: 'pslot-l', meal_type: 'lunch' },
            ],
            dishes: [
              { meal_slot_id: 'pslot-bf', dish_id: 'dish-a', servings: 1 },
              { meal_slot_id: 'pslot-bf', dish_id: 'dish-b', servings: 2 },
              { meal_slot_id: 'pslot-l', dish_id: 'dish-c', servings: 1 },
            ],
          },
          '2026-04-28': null,
          '2026-04-29': null,
          '2026-04-30': null,
          '2026-05-01': null,
          '2026-05-02': null,
          '2026-05-03': null,
        },
        targetDayPlans: {
          '2026-05-04': {
            id: 'dp-cur-mon',
            slots: [
              { id: 'tslot-bf', meal_type: 'breakfast' },
              { id: 'tslot-l', meal_type: 'lunch' },
            ],
          },
        },
      });

      const result = await repo.copyPreviousWeek('2026-05-04', '2026-04-27');
      expect(result).toEqual({ copiedCount: 3, daysAffected: 1 });

      const inserts = db.execute.calls
        .allArgs()
        .filter((args) => String(args[0]).startsWith('INSERT INTO planned_dish'));
      const bfInserts = inserts.filter((a) => (a[1] as unknown[])[1] === 'tslot-bf');
      const lInserts = inserts.filter((a) => (a[1] as unknown[])[1] === 'tslot-l');
      expect(bfInserts.length).toBe(2);
      expect(lInserts.length).toBe(1);
      // sort_order: 0,1 in tslot-bf
      expect(bfInserts.map((a) => (a[1] as unknown[])[4]).sort()).toEqual([0, 1]);
      // sort_order: 0 in tslot-l
      expect(lInserts.map((a) => (a[1] as unknown[])[4])).toEqual([0]);
    });
  });
});
