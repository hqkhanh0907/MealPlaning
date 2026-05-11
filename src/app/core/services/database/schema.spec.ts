import { Database } from './database';
import { buildInitialSchemaMigration, SCHEMA_DDL } from './schema';
import { createTestDatabase, teardownTestDatabase } from './__test__/create-test-database';
import type { WebDatabase } from './web-database';

describe('buildInitialSchemaMigration', () => {
  it('builds a single migration at version 1 (immutable) with all DDL statements', () => {
    const migration = buildInitialSchemaMigration();

    expect(migration.version).toBe(1);
    expect(migration.statements).toBe(SCHEMA_DDL);
    expect(migration.statements.length).toBeGreaterThan(10);
    expect(migration.statements[0]).toContain('CREATE TABLE IF NOT EXISTS user_profile');
  });

  it('declares user_profile.theme as light-only via CHECK constraint', () => {
    const migration = buildInitialSchemaMigration();
    const userProfileStatement = migration.statements.find((statement: string) =>
      statement.includes('CREATE TABLE IF NOT EXISTS user_profile'),
    );
    expect(userProfileStatement).toBeDefined();
    expect(userProfileStatement).toContain("DEFAULT 'light'");
    expect(userProfileStatement).toContain("CHECK (theme = 'light')");
    // Legacy 'dark' / 'system' must not appear in the canonical schema.
    expect(userProfileStatement).not.toContain("'dark'");
    expect(userProfileStatement).not.toContain("'system'");
  });

  it('uses gram-only nutrition (no nutrition_basis_unit, density, unit table)', () => {
    const migration = buildInitialSchemaMigration();
    const joined = migration.statements.join('\n');
    expect(joined).not.toContain('nutrition_basis_unit');
    expect(joined).not.toContain('density_g_per_ml');
    expect(joined).not.toContain('CREATE TABLE IF NOT EXISTS unit ');
    expect(joined).not.toContain('CREATE TABLE IF NOT EXISTS ingredient_unit');
    expect(joined).toContain('gram_weight   REAL NOT NULL CHECK (gram_weight > 0)');
  });

  it('exposes dish_with_totals view with gram-based macro projection', () => {
    const migration = buildInitialSchemaMigration();
    expect(
      migration.statements.some((statement: string) =>
        statement.includes('CREATE VIEW IF NOT EXISTS dish_with_totals'),
      ),
    ).toBeTrue();
    const view = migration.statements.find((statement: string) =>
      statement.includes('CREATE VIEW IF NOT EXISTS dish_with_totals'),
    );
    expect(view).toContain('di.gram_weight / 100.0');
    expect(view).toContain('d.meal_tag');
    expect(view).toContain('d.is_favorite');
  });

  it('includes meal_tag CHECK + index on dish for seed-grouping queries', () => {
    const migration = buildInitialSchemaMigration();
    const dishStatement = migration.statements.find((statement: string) =>
      statement.includes('CREATE TABLE IF NOT EXISTS dish '),
    );
    expect(dishStatement).toBeDefined();
    expect(dishStatement).toContain("meal_tag IN ('breakfast', 'lunch', 'dinner')");
    expect(
      migration.statements.some((statement: string) =>
        statement.includes('CREATE INDEX IF NOT EXISTS idx_dish_meal_tag ON dish(meal_tag)'),
      ),
    ).toBeTrue();
  });

  it('creates seed_artifact table with allowed artifact_type values', () => {
    const migration = buildInitialSchemaMigration();
    expect(
      migration.statements.some((statement: string) =>
        statement.includes('CREATE TABLE IF NOT EXISTS seed_artifact'),
      ),
    ).toBeTrue();
    expect(
      migration.statements.some((statement: string) =>
        statement.includes("artifact_type IN ('ingredient', 'dish')"),
      ),
    ).toBeTrue();
    expect(
      migration.statements.some((statement: string) =>
        statement.includes(
          'CREATE INDEX IF NOT EXISTS idx_seed_artifact_type ON seed_artifact(artifact_type)',
        ),
      ),
    ).toBeTrue();
  });

  describe('planned_dish Hybrid policy schema (D8 DEC-01)', () => {
    const findPlannedDishDdl = (): string | undefined => {
      const ddl = buildInitialSchemaMigration().statements;
      return ddl.find((statement: string) =>
        statement.includes('CREATE TABLE IF NOT EXISTS planned_dish'),
      );
    };

    it('declares nutrition snapshot columns as nullable', () => {
      const stmt = findPlannedDishDdl();
      expect(stmt).toBeDefined();
      // None of the snapshot columns should be NOT NULL.
      expect(stmt).toContain('calories          REAL,');
      expect(stmt).toContain('protein           REAL,');
      expect(stmt).toContain('carbs             REAL,');
      expect(stmt).toContain('fat               REAL,');
      expect(stmt).toContain('fiber             REAL,');
      expect(stmt).not.toMatch(/calories\s+REAL\s+NOT\s+NULL/);
    });

    it('enforces servings BETWEEN 0.1 AND 20', () => {
      const stmt = findPlannedDishDdl();
      expect(stmt).toContain('CHECK (servings BETWEEN 0.1 AND 20)');
    });

    it('enforces bidirectional Hybrid CHECK while allowing unknown legacy fiber', () => {
      const stmt = findPlannedDishDdl();
      expect(stmt).toBeDefined();
      // is_completed=0 branch — all snapshot columns must be NULL
      expect(stmt).toMatch(
        /is_completed = 0[\s\S]*?calories IS NULL[\s\S]*?protein IS NULL[\s\S]*?carbs IS NULL[\s\S]*?fat IS NULL[\s\S]*?fiber IS NULL[\s\S]*?completed_at IS NULL/,
      );
      // is_completed=1 branch — pre-fiber legacy rows may have unknown fiber,
      // but the original snapshot macros and completed_at are still required.
      expect(stmt).toMatch(
        /is_completed = 1[\s\S]*?calories IS NOT NULL[\s\S]*?protein IS NOT NULL[\s\S]*?carbs IS NOT NULL[\s\S]*?fat IS NOT NULL[\s\S]*?completed_at IS NOT NULL/,
      );
    });

    it('drops cached total_* columns from day_plan and meal_slot (DEC-07)', () => {
      const ddl = buildInitialSchemaMigration().statements;
      const dayPlan = ddl.find((s: string) => s.includes('CREATE TABLE IF NOT EXISTS day_plan'));
      const mealSlot = ddl.find((s: string) => s.includes('CREATE TABLE IF NOT EXISTS meal_slot'));
      expect(dayPlan).toBeDefined();
      expect(mealSlot).toBeDefined();
      for (const col of ['total_calories', 'total_protein', 'total_carbs', 'total_fat']) {
        expect(dayPlan).not.toContain(col);
        expect(mealSlot).not.toContain(col);
      }
    });

    it('declares meal_slot.position + created_at (sync data-model §4.5)', () => {
      const ddl = buildInitialSchemaMigration().statements;
      const mealSlot = ddl.find((s: string) => s.includes('CREATE TABLE IF NOT EXISTS meal_slot'));
      expect(mealSlot).toContain('position          INTEGER NOT NULL DEFAULT 0');
      expect(mealSlot).toContain("created_at        TEXT NOT NULL DEFAULT (datetime('now'))");
    });

    it('declares synced index naming + partial indexes (DEC-01/06)', () => {
      const ddl = buildInitialSchemaMigration().statements;
      const joined = ddl.join('\n');
      expect(joined).toContain('idx_planned_dish_meal_slot');
      expect(joined).toContain('idx_planned_dish_dish');
      expect(joined).toContain('idx_planned_dish_completed');
      expect(joined).toContain('idx_planned_dish_completed_at');
      expect(joined).toContain('idx_meal_slot_day_plan');
      expect(joined).toContain('idx_dish_favorite');
      // Legacy names are gone
      expect(joined).not.toContain('idx_planned_dish_slot ');
      expect(joined).not.toMatch(/idx_meal_slot_day\s/);
    });
  });
});

describe('schema migration replay smoke test', () => {
  let db: jasmine.SpyObj<Database>;

  beforeEach(() => {
    db = jasmine.createSpyObj<Database>('DatabaseService', ['execute', 'query']);
    db.execute.and.resolveTo();
  });

  it('replays SCHEMA_DDL sequentially and includes both nutrition + fitness anchors', async () => {
    const migration = buildInitialSchemaMigration();

    for (const statement of migration.statements) {
      await db.execute(statement);
    }

    expect(db.execute.calls.count()).toBe(migration.statements.length);
    expect(db.execute.calls.first().args[0]).toContain('CREATE TABLE IF NOT EXISTS user_profile');

    const allStatements = db.execute.calls
      .all()
      .map((call: jasmine.CallInfo<Database['execute']>) => call.args[0]);
    // D8 DEC-08 partial index for Tab "Đã lưu" must be in the canonical DDL.
    expect(allStatements.some((s: string) => s.includes('idx_dish_favorite'))).toBeTrue();
    // Legacy seed_artifact index still present.
    expect(allStatements.some((s: string) => s.includes('idx_seed_artifact_type'))).toBeTrue();
  });
});

// =============================================================================
// Runtime spec coverage (Story 3.1) — applies SCHEMA_DDL + migrations on a real
// sql.js instance and asserts CHECK / partial-index behavior.
// =============================================================================

interface PlannedDishRow {
  id: string;
  is_completed: number;
  servings: number;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  completed_at: string | null;
}

async function seedDayPlanAndSlot(db: WebDatabase): Promise<{ slotId: string; dishId: string }> {
  const dayId = crypto.randomUUID();
  const slotId = crypto.randomUUID();
  const dishId = crypto.randomUUID();

  await db.execute(
    `INSERT INTO day_plan (id, date, target_calories, target_protein) VALUES (?, ?, ?, ?)`,
    [dayId, '2026-05-10', 2000, 150],
  );
  await db.execute(`INSERT INTO meal_slot (id, day_plan_id, meal_type) VALUES (?, ?, ?)`, [
    slotId,
    dayId,
    'breakfast',
  ]);
  await db.execute(`INSERT INTO dish (id, name, type, source) VALUES (?, ?, ?, ?)`, [
    dishId,
    'Cháo gà',
    'ingredient_based',
    'custom',
  ]);
  return { slotId, dishId };
}

async function insertPlannedDish(
  db: WebDatabase,
  slotId: string,
  dishId: string,
  overrides: Partial<Omit<PlannedDishRow, 'id'>> = {},
): Promise<string> {
  const id = crypto.randomUUID();
  const row: Omit<PlannedDishRow, 'id'> = {
    is_completed: 0,
    servings: 1,
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
    completed_at: null,
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

describe('Hybrid CHECK truth-table — runtime (Story 3.1)', () => {
  let db: WebDatabase;
  let slotId: string;
  let dishId: string;

  beforeEach(async () => {
    db = await createTestDatabase();
    const seed = await seedDayPlanAndSlot(db);
    slotId = seed.slotId;
    dishId = seed.dishId;
  });

  afterEach(() => {
    teardownTestDatabase();
  });

  it('Case 1 — is_completed=0 + nutrition snapshot cols NULL + completed_at NULL → resolves', async () => {
    const id = await insertPlannedDish(db, slotId, dishId, { is_completed: 0 });
    const rows = await db.query<{ id: string }>('SELECT id FROM planned_dish WHERE id = ?', [id]);
    expect(rows.length).toBe(1);
  });

  it('Case 2 — is_completed=0 + non-NULL calories → REJECT (CHECK fails)', async () => {
    await expectAsync(
      insertPlannedDish(db, slotId, dishId, { is_completed: 0, calories: 500 }),
    ).toBeRejectedWithError(/check.*constraint.*failed/i);

    const count = await db.query<{ count: number }>('SELECT COUNT(*) AS count FROM planned_dish');
    expect(count[0].count).toBe(0);
  });

  it('Case 3 — is_completed=1 + nutrition snapshot non-NULL + completed_at non-NULL → resolves', async () => {
    const id = await insertPlannedDish(db, slotId, dishId, {
      is_completed: 1,
      calories: 500,
      protein: 30,
      carbs: 40,
      fat: 10,
      fiber: 7,
      completed_at: '2026-05-10 12:00:00',
    });
    const rows = await db.query<{ id: string }>('SELECT id FROM planned_dish WHERE id = ?', [id]);
    expect(rows.length).toBe(1);
  });

  it('Case 3b — is_completed=1 + legacy fiber NULL + completed_at non-NULL → resolves', async () => {
    const id = await insertPlannedDish(db, slotId, dishId, {
      is_completed: 1,
      calories: 500,
      protein: 30,
      carbs: 40,
      fat: 10,
      fiber: null,
      completed_at: '2026-05-10 12:00:00',
    });
    const rows = await db.query<{ id: string }>('SELECT id FROM planned_dish WHERE id = ?', [id]);
    expect(rows.length).toBe(1);
  });

  it('Case 4 — is_completed=1 + protein NULL → REJECT (CHECK fails on missing snapshot)', async () => {
    await expectAsync(
      insertPlannedDish(db, slotId, dishId, {
        is_completed: 1,
        calories: 500,
        protein: null,
        carbs: 40,
        fat: 10,
        fiber: 7,
        completed_at: '2026-05-10 12:00:00',
      }),
    ).toBeRejectedWithError(/check.*constraint.*failed/i);

    const count = await db.query<{ count: number }>('SELECT COUNT(*) AS count FROM planned_dish');
    expect(count[0].count).toBe(0);
  });
});

describe('servings boundary — runtime (Story 3.1)', () => {
  let db: WebDatabase;
  let slotId: string;
  let dishId: string;

  beforeEach(async () => {
    db = await createTestDatabase();
    const seed = await seedDayPlanAndSlot(db);
    slotId = seed.slotId;
    dishId = seed.dishId;
  });

  afterEach(() => {
    teardownTestDatabase();
  });

  it('servings=0 → REJECT', async () => {
    await expectAsync(insertPlannedDish(db, slotId, dishId, { servings: 0 })).toBeRejectedWithError(
      /check.*constraint.*failed/i,
    );
  });

  it('servings=0.1 → pass', async () => {
    const id = await insertPlannedDish(db, slotId, dishId, { servings: 0.1 });
    expect(id).toBeTruthy();
  });

  it('servings=20 → pass', async () => {
    const id = await insertPlannedDish(db, slotId, dishId, { servings: 20 });
    expect(id).toBeTruthy();
  });

  it('servings=20.01 → REJECT', async () => {
    await expectAsync(
      insertPlannedDish(db, slotId, dishId, { servings: 20.01 }),
    ).toBeRejectedWithError(/check.*constraint.*failed/i);
  });

  it('servings=-1 → REJECT', async () => {
    await expectAsync(
      insertPlannedDish(db, slotId, dishId, { servings: -1 }),
    ).toBeRejectedWithError(/check.*constraint.*failed/i);
  });
});

describe('partial index hit — EXPLAIN QUERY PLAN (Story 3.1)', () => {
  let db: WebDatabase;

  beforeEach(async () => {
    db = await createTestDatabase();
    const { slotId, dishId } = await seedDayPlanAndSlot(db);

    // Mark dish favorite to feed idx_dish_favorite.
    await db.execute('UPDATE dish SET is_favorite = 1 WHERE id = ?', [dishId]);

    // 1 not-completed, 1 completed planned_dish — feeds completed-only partial indexes.
    await insertPlannedDish(db, slotId, dishId, { is_completed: 0 });
    await insertPlannedDish(db, slotId, dishId, {
      is_completed: 1,
      servings: 2,
      calories: 600,
      protein: 35,
      carbs: 60,
      fat: 12,
      fiber: 8,
      completed_at: '2026-05-10 13:00:00',
    });
  });

  afterEach(() => {
    teardownTestDatabase();
  });

  async function explain(sql: string, params: unknown[] = []): Promise<string> {
    const plan = await db.query<Record<string, unknown>>(`EXPLAIN QUERY PLAN ${sql}`, params);
    return JSON.stringify(plan);
  }

  // Why INDEXED BY:
  //   With a single seeded row and no ANALYZE statistics, the SQLite query
  //   planner's natural choice between two partial indexes covering the same
  //   WHERE predicate (`is_completed = 1`) is not deterministic across builds.
  //   `INDEXED BY` *locks the contract*: each test asserts that the named
  //   partial index is *structurally usable* for the access pattern (matching
  //   columns, satisfying the partial WHERE). If the index were missing,
  //   dropped, or its partial predicate diverged from the query, sql.js would
  //   throw `no query solution`. That is exactly the regression Story 3.1
  //   guards against.

  it('Query A — completed lookup by meal_slot uses idx_planned_dish_completed', async () => {
    const planJson = await explain(
      `SELECT * FROM planned_dish INDEXED BY idx_planned_dish_completed
        WHERE is_completed = 1 AND meal_slot_id = ?`,
      ['anything'],
    );
    expect(planJson).toContain('idx_planned_dish_completed');
    // Guard against substring collision with idx_planned_dish_completed_at —
    // INDEXED BY locks the contract today, but if a future sql.js build
    // ignored the directive, the bare `toContain` above would silently match
    // the wrong partial index. This negative assertion enforces specificity.
    expect(planJson).not.toContain('idx_planned_dish_completed_at');
  });

  it('Query B — completed dishes ORDER BY completed_at uses idx_planned_dish_completed_at', async () => {
    const planJson = await explain(
      `SELECT * FROM planned_dish INDEXED BY idx_planned_dish_completed_at
        WHERE is_completed = 1 ORDER BY completed_at DESC LIMIT 30`,
    );
    expect(planJson).toContain('idx_planned_dish_completed_at');
  });

  it('Query C — favorite dish lookup uses idx_dish_favorite', async () => {
    const planJson = await explain(
      `SELECT * FROM dish INDEXED BY idx_dish_favorite WHERE is_favorite = 1`,
    );
    expect(planJson).toContain('idx_dish_favorite');
  });
});
