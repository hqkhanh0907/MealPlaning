import { Database } from './database';
import { buildInitialSchemaMigration, SCHEMA_DDL, SCHEMA_VERSION } from './schema';

describe('buildInitialSchemaMigration', () => {
  it('builds a single migration matching SCHEMA_VERSION with all DDL statements', () => {
    const migration = buildInitialSchemaMigration();

    expect(migration.version).toBe(SCHEMA_VERSION);
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
});

describe('schema migration replay smoke test', () => {
  let db: jasmine.SpyObj<Database>;

  beforeEach(() => {
    db = jasmine.createSpyObj<Database>('DatabaseService', ['execute', 'query']);
    db.execute.and.resolveTo();
  });

  it('can replay the canonical migration sequentially without custom branching', async () => {
    const migration = buildInitialSchemaMigration();

    for (const statement of migration.statements) {
      await db.execute(statement);
    }

    expect(db.execute.calls.count()).toBe(migration.statements.length);
    expect(db.execute.calls.first().args[0]).toContain('CREATE TABLE IF NOT EXISTS user_profile');
    // Last statement is the seed_artifact_type index after collapse.
    expect(db.execute.calls.mostRecent().args[0]).toContain(
      'CREATE INDEX IF NOT EXISTS idx_seed_artifact_type',
    );
  });
});
