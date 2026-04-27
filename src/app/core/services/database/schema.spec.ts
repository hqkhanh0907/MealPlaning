import { DatabaseService } from './database.service';
import {
  buildInitialSchemaMigration,
  buildMealTagMigration,
  buildNutritionSchemaFinalizationMigration,
  buildNutritionUnitsMigration,
  buildSeedArtifactMigration,
} from './schema';

describe('buildInitialSchemaMigration', () => {
  it('builds a V1 migration with all schema statements in order', () => {
    const migration = buildInitialSchemaMigration();

    expect(migration.version).toBe(1);
    expect(migration.statements.length).toBeGreaterThan(10);
    expect(migration.statements[0]).toContain('CREATE TABLE IF NOT EXISTS user_profile');
    expect(
      migration.statements.some((statement: string) =>
        statement.includes('CREATE VIEW IF NOT EXISTS dish_with_totals'),
      ),
    ).toBeTrue();
  });
});

describe('buildNutritionUnitsMigration', () => {
  it('builds a V2 migration for unit registry and ingredient-specific units', () => {
    const migration = buildNutritionUnitsMigration();

    expect(migration.version).toBe(2);
    expect(
      migration.statements.some((statement: string) =>
        statement.includes('CREATE TABLE IF NOT EXISTS unit'),
      ),
    ).toBeTrue();
    expect(
      migration.statements.some((statement: string) =>
        statement.includes('CREATE TABLE IF NOT EXISTS ingredient_unit'),
      ),
    ).toBeTrue();
    expect(
      migration.statements.some((statement: string) =>
        statement.includes('ALTER TABLE dish_ingredient ADD COLUMN unit_id'),
      ),
    ).toBeTrue();
  });
});

describe('buildNutritionSchemaFinalizationMigration', () => {
  it('builds a V3 migration that removes legacy runtime columns and tables', () => {
    const migration = buildNutritionSchemaFinalizationMigration();

    expect(migration.version).toBe(3);
    expect(
      migration.statements.some((statement: string) =>
        statement.includes('CREATE TABLE IF NOT EXISTS ingredient_v3'),
      ),
    ).toBeTrue();
    expect(
      migration.statements.some((statement: string) => statement.includes('DROP TABLE ingredient')),
    ).toBeTrue();
    expect(
      migration.statements.some((statement: string) =>
        statement.includes('ALTER TABLE ingredient_v3 RENAME TO ingredient'),
      ),
    ).toBeTrue();
  });
});

describe('buildMealTagMigration', () => {
  it('builds a V4 migration that adds dish.meal_tag with CHECK constraint and index', () => {
    const migration = buildMealTagMigration();

    expect(migration.version).toBe(4);
    expect(
      migration.statements.some((statement: string) =>
        statement.includes('ALTER TABLE dish ADD COLUMN meal_tag'),
      ),
    ).toBeTrue();
    expect(
      migration.statements.some((statement: string) =>
        statement.includes("CHECK (meal_tag IN ('breakfast', 'lunch', 'dinner'))"),
      ),
    ).toBeTrue();
    expect(
      migration.statements.some((statement: string) =>
        statement.includes('CREATE INDEX IF NOT EXISTS idx_dish_meal_tag ON dish(meal_tag)'),
      ),
    ).toBeTrue();
  });
});

describe('buildSeedArtifactMigration', () => {
  it('builds a V5 migration that creates seed_artifact table + index', () => {
    const migration = buildSeedArtifactMigration();

    expect(migration.version).toBe(5);
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

describe('schema migration compatibility smoke test', () => {
  let db: jasmine.SpyObj<DatabaseService>;

  beforeEach(() => {
    db = jasmine.createSpyObj<DatabaseService>('DatabaseService', ['execute', 'query']);
    db.execute.and.resolveTo();
  });

  it('can replay the generated V1 migration sequentially without custom branching', async () => {
    const migration = buildInitialSchemaMigration();

    for (const statement of migration.statements) {
      await db.execute(statement);
    }

    expect(db.execute.calls.count()).toBe(migration.statements.length);
    expect(db.execute.calls.first().args[0]).toContain('CREATE TABLE IF NOT EXISTS user_profile');
    expect(db.execute.calls.mostRecent().args[0]).toContain(
      'CREATE INDEX IF NOT EXISTS idx_app_config_key',
    );
  });

  it('can replay the generated V2 migration sequentially without custom branching', async () => {
    const migration = buildNutritionUnitsMigration();

    for (const statement of migration.statements) {
      await db.execute(statement);
    }

    expect(db.execute.calls.count()).toBe(migration.statements.length);
    expect(db.execute.calls.first().args[0]).toContain('CREATE TABLE IF NOT EXISTS unit');
    expect(db.execute.calls.mostRecent().args[0]).toContain(
      'CREATE VIEW IF NOT EXISTS dish_with_totals',
    );
  });

  it('can replay the generated V3 migration sequentially without custom branching', async () => {
    const migration = buildNutritionSchemaFinalizationMigration();

    for (const statement of migration.statements) {
      await db.execute(statement);
    }

    expect(db.execute.calls.count()).toBe(migration.statements.length);
    expect(db.execute.calls.first().args[0]).toContain('PRAGMA foreign_keys = OFF');
    expect(db.execute.calls.mostRecent().args[0]).toContain('PRAGMA foreign_keys = ON');
  });
});
