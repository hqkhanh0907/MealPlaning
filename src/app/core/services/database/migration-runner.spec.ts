import { Database } from './database';
import { MigrationRunner, type Migration } from './migration-runner';
import { createTestDatabase, teardownTestDatabase } from './__test__/create-test-database';
import { MIGRATION_REGISTRY } from './migrations';
import { SCHEMA_VERSION } from './schema';

describe('MigrationRunner', () => {
  let db: jasmine.SpyObj<Database>;

  beforeEach(() => {
    db = jasmine.createSpyObj<Database>('DatabaseService', ['execute', 'query']);
  });

  it('applies pending migrations in version order and stamps user_version', async () => {
    const migrations: Migration[] = [
      { version: 1, statements: ['CREATE TABLE one (id INTEGER PRIMARY KEY)'] },
      {
        version: 2,
        statements: [
          'CREATE TABLE two (id INTEGER PRIMARY KEY)',
          'CREATE INDEX idx_two_id ON two(id)',
        ],
      },
    ];
    db.query.and.resolveTo([{ user_version: 0 }]);
    db.execute.and.resolveTo();

    await new MigrationRunner(db, migrations).run();

    expect(db.query).toHaveBeenCalledWith('PRAGMA user_version;');
    expect(db.execute.calls.allArgs()).toEqual([
      ['CREATE TABLE one (id INTEGER PRIMARY KEY)'],
      ['PRAGMA user_version = 1;'],
      ['CREATE TABLE two (id INTEGER PRIMARY KEY)'],
      ['CREATE INDEX idx_two_id ON two(id)'],
      ['PRAGMA user_version = 2;'],
    ]);
  });

  it('skips all migrations when schema is already up to date', async () => {
    const migrations: Migration[] = [
      { version: 2, statements: ['CREATE TABLE ignored (id INTEGER PRIMARY KEY)'] },
    ];
    db.query.and.resolveTo([{ user_version: 2 }]);

    await new MigrationRunner(db, migrations).run();

    expect(db.execute).not.toHaveBeenCalled();
  });

  it('treats missing user_version rows as version zero', async () => {
    const migrations: Migration[] = [
      { version: 1, statements: ['CREATE TABLE first (id INTEGER PRIMARY KEY)'] },
    ];
    db.query.and.resolveTo([]);
    db.execute.and.resolveTo();

    await new MigrationRunner(db, migrations).run();

    expect(db.execute.calls.allArgs()).toEqual([
      ['CREATE TABLE first (id INTEGER PRIMARY KEY)'],
      ['PRAGMA user_version = 1;'],
    ]);
  });
});

describe('MigrationRunner idempotency — runtime (Story 3.1)', () => {
  it('is idempotent when MigrationRunner.run() executes a second time', async () => {
    const liveDb = await createTestDatabase();
    try {
      // First run already happened inside `WebDatabase.initialize()`; capture
      // the post-init footprint to compare against.
      const beforeVersion = await liveDb.query<{ user_version: number }>('PRAGMA user_version;');
      expect(beforeVersion[0].user_version).toBe(SCHEMA_VERSION);

      const beforeTables = await liveDb.query<{ count: number }>(
        `SELECT COUNT(*) AS count FROM sqlite_master WHERE type IN ('table', 'index', 'view') AND name NOT LIKE 'sqlite_%'`,
      );

      // Insert a sentinel row so the test can detect a hidden DROP+CREATE
      // regression: if the runner ever stops filtering `version > current`
      // and replays v2 (which DROPs planned_dish/meal_slot/day_plan), this
      // row disappears even though `user_version` and table count remain
      // unchanged. Counting rows survives that regression where counting
      // tables does not.
      const dayId = crypto.randomUUID();
      const slotId = crypto.randomUUID();
      await liveDb.execute(
        `INSERT INTO day_plan (id, date, target_calories, target_protein) VALUES (?, ?, ?, ?)`,
        [dayId, '2026-05-10', 2000, 150],
      );
      await liveDb.execute(`INSERT INTO meal_slot (id, day_plan_id, meal_type) VALUES (?, ?, ?)`, [
        slotId,
        dayId,
        'breakfast',
      ]);

      // Run the registry again on the same DB — must not redo migrations.
      await new MigrationRunner(liveDb, MIGRATION_REGISTRY).run();

      const afterVersion = await liveDb.query<{ user_version: number }>('PRAGMA user_version;');
      const afterTables = await liveDb.query<{ count: number }>(
        `SELECT COUNT(*) AS count FROM sqlite_master WHERE type IN ('table', 'index', 'view') AND name NOT LIKE 'sqlite_%'`,
      );
      const afterDayPlanCount = await liveDb.query<{ count: number }>(
        `SELECT COUNT(*) AS count FROM day_plan WHERE id = ?`,
        [dayId],
      );
      const afterMealSlotCount = await liveDb.query<{ count: number }>(
        `SELECT COUNT(*) AS count FROM meal_slot WHERE id = ?`,
        [slotId],
      );

      expect(afterVersion[0].user_version).toBe(SCHEMA_VERSION);
      expect(afterTables[0].count).toBe(beforeTables[0].count);
      // Sentinel rows survive — proves replay was actually skipped, not
      // re-executed-and-recreated-with-same-shape.
      expect(afterDayPlanCount[0].count).toBe(1);
      expect(afterMealSlotCount[0].count).toBe(1);
    } finally {
      teardownTestDatabase();
    }
  });
});
