import { deleteSetting, getAllSettings, getSetting, setSetting } from '../services/appSettings';
import { createDatabaseService, type DatabaseService } from '../services/databaseService';
import { createSchema } from '../services/schema';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
}));

vi.mock('sql.js', async () => {
  const real = await vi.importActual<typeof import('sql.js')>('sql.js');
  return { default: () => real.default() };
});

describe('appSettings – deleteSetting & getAllSettings', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    db = createDatabaseService();
    await db.initialize();
    await createSchema(db);
  });

  /* --- deleteSetting --- */

  it('deletes an existing setting by key', async () => {
    await setSetting(db, 'theme', 'dark');
    expect(await getSetting(db, 'theme')).toBe('dark');

    await deleteSetting(db, 'theme');
    expect(await getSetting(db, 'theme')).toBeNull();
  });

  it('does not throw when deleting a non-existent key', async () => {
    await expect(deleteSetting(db, 'non-existent')).resolves.toBeUndefined();
  });

  /* --- getAllSettings --- */

  it('returns empty object when no settings exist', async () => {
    const result = await getAllSettings(db);
    expect(result).toEqual({});
  });

  it('returns all settings as key-value pairs', async () => {
    await setSetting(db, 'theme', 'dark');
    await setSetting(db, 'language', 'vi');
    await setSetting(db, 'fontSize', '14');

    const result = await getAllSettings(db);
    expect(result).toEqual({
      theme: 'dark',
      language: 'vi',
      fontSize: '14',
    });
  });

  it('getAllSettings reflects updates after setSetting overwrites', async () => {
    await setSetting(db, 'theme', 'dark');
    await setSetting(db, 'theme', 'light');

    const result = await getAllSettings(db);
    expect(result).toEqual({ theme: 'light' });
  });
});
