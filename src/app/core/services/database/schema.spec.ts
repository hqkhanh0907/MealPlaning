import { Database } from './database';
import { buildInitialSchemaMigration, SCHEMA_DDL, SCHEMA_VERSION } from './schema';

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

    it('declares 4 nutrition snapshot columns as nullable', () => {
      const stmt = findPlannedDishDdl();
      expect(stmt).toBeDefined();
      // None of the snapshot columns should be NOT NULL.
      expect(stmt).toContain('calories          REAL,');
      expect(stmt).toContain('protein           REAL,');
      expect(stmt).toContain('carbs             REAL,');
      expect(stmt).toContain('fat               REAL,');
      expect(stmt).not.toMatch(/calories\s+REAL\s+NOT\s+NULL/);
    });

    it('enforces servings BETWEEN 0.1 AND 20', () => {
      const stmt = findPlannedDishDdl();
      expect(stmt).toContain('CHECK (servings BETWEEN 0.1 AND 20)');
    });

    it('enforces bidirectional Hybrid CHECK (RT-01..02 + SNAP-01..05)', () => {
      const stmt = findPlannedDishDdl();
      expect(stmt).toBeDefined();
      // is_completed=0 branch — all snapshot columns must be NULL
      expect(stmt).toMatch(/is_completed = 0[\s\S]*?calories IS NULL[\s\S]*?protein IS NULL[\s\S]*?carbs IS NULL[\s\S]*?fat IS NULL[\s\S]*?completed_at IS NULL/);
      // is_completed=1 branch — all snapshot columns must be NOT NULL
      expect(stmt).toMatch(/is_completed = 1[\s\S]*?calories IS NOT NULL[\s\S]*?protein IS NOT NULL[\s\S]*?carbs IS NOT NULL[\s\S]*?fat IS NOT NULL[\s\S]*?completed_at IS NOT NULL/);
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
