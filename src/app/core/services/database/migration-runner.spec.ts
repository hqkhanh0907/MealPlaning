import { DatabaseService } from './database.service';
import { MigrationRunner, type Migration } from './migration-runner';

describe('MigrationRunner', () => {
  let db: jasmine.SpyObj<DatabaseService>;

  beforeEach(() => {
    db = jasmine.createSpyObj<DatabaseService>('DatabaseService', ['execute', 'query']);
  });

  it('applies pending migrations in version order and stamps user_version', async () => {
    const migrations: Migration[] = [
      { version: 1, statements: ['CREATE TABLE one (id INTEGER PRIMARY KEY)'] },
      { version: 2, statements: ['CREATE TABLE two (id INTEGER PRIMARY KEY)', 'CREATE INDEX idx_two_id ON two(id)'] },
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
    const migrations: Migration[] = [{ version: 2, statements: ['CREATE TABLE ignored (id INTEGER PRIMARY KEY)'] }];
    db.query.and.resolveTo([{ user_version: 2 }]);

    await new MigrationRunner(db, migrations).run();

    expect(db.execute).not.toHaveBeenCalled();
  });

  it('treats missing user_version rows as version zero', async () => {
    const migrations: Migration[] = [{ version: 1, statements: ['CREATE TABLE first (id INTEGER PRIMARY KEY)'] }];
    db.query.and.resolveTo([]);
    db.execute.and.resolveTo();

    await new MigrationRunner(db, migrations).run();

    expect(db.execute.calls.allArgs()).toEqual([
      ['CREATE TABLE first (id INTEGER PRIMARY KEY)'],
      ['PRAGMA user_version = 1;'],
    ]);
  });
});
