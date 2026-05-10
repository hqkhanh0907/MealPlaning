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
    const db = await createTestDatabase();
    try {
      // First run already happened inside `WebDatabase.initialize()`; capture
      // the post-init footprint to compare against.
      const beforeVersion = await db.query<{ user_version: number }>('PRAGMA user_version;');
      expect(beforeVersion[0].user_version).toBe(SCHEMA_VERSION);

      const beforeTables = await db.query<{ count: number }>(
        `SELECT COUNT(*) AS count FROM sqlite_master WHERE type IN ('table', 'index', 'view') AND name NOT LIKE 'sqlite_%'`,
      );

      // Run the registry again on the same DB — must not redo migrations.
      await new MigrationRunner(db, MIGRATION_REGISTRY).run();

      const afterVersion = await db.query<{ user_version: number }>('PRAGMA user_version;');
      const afterTables = await db.query<{ count: number }>(
        `SELECT COUNT(*) AS count FROM sqlite_master WHERE type IN ('table', 'index', 'view') AND name NOT LIKE 'sqlite_%'`,
      );

      expect(afterVersion[0].user_version).toBe(SCHEMA_VERSION);
      expect(afterTables[0].count).toBe(beforeTables[0].count);
    } finally {
      teardownTestDatabase(db);
    }
  });
});
