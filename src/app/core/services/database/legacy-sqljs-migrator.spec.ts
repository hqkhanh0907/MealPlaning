import { Database } from './database';
import { LegacySqlJsMigrator } from './legacy-sqljs-migrator';

describe('LegacySqlJsMigrator', () => {
  let db: jasmine.SpyObj<Database>;

  beforeEach(() => {
    db = jasmine.createSpyObj<Database>('DatabaseService', ['getOne', 'execute']);
    localStorage.clear();
  });

  it('returns no-legacy-key when localStorage has no legacy database', async () => {
    db.getOne.and.resolveTo({ c: 0 });

    const result = await new LegacySqlJsMigrator(db).migrate();

    expect(result).toEqual({ attempted: false, imported: false, reason: 'no-legacy-key' });
    expect(db.getOne).not.toHaveBeenCalled();
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('skips import when native database already has a profile', async () => {
    localStorage.setItem('sqljs_healthmate.db', btoa('not-a-real-db'));
    db.getOne.and.resolveTo({ c: 1 });

    const result = await new LegacySqlJsMigrator(db).migrate();

    expect(result).toEqual({
      attempted: false,
      imported: false,
      reason: 'native-already-populated',
    });
    expect(db.getOne).toHaveBeenCalled();
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('returns structured failure when legacy blob cannot be parsed as sql.js database', async () => {
    localStorage.setItem('sqljs_healthmate.db', btoa('not-a-real-db'));
    db.getOne.and.resolveTo({ c: 0 });

    const result = await new LegacySqlJsMigrator(db).migrate();

    expect(result.attempted).toBeTrue();
    expect(result.imported).toBeFalse();
    expect(result.sourceKey).toBe('sqljs_healthmate.db');
    expect(typeof result.reason).toBe('string');
    expect(db.execute).not.toHaveBeenCalled();
  });
});
