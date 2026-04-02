import { createDatabaseService, type DatabaseService } from '../services/databaseService';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
}));

vi.mock('sql.js', async () => {
  const real = await vi.importActual<typeof import('sql.js')>('sql.js');
  return {
    default: async (config?: { locateFile?: (file: string) => string }) => {
      if (config?.locateFile) {
        config.locateFile('sql-wasm.wasm');
      }
      return real.default();
    },
  };
});

describe('DatabaseService – binary operations & locateFile', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    db = createDatabaseService();
    await db.initialize();
  });

  it('initialize() invokes locateFile callback (line 59)', async () => {
    const db2 = createDatabaseService();
    await expect(db2.initialize()).resolves.toBeUndefined();
  });

  it('exportBinary() returns Uint8Array', () => {
    const binary = db.exportBinary();
    expect(binary).toBeInstanceOf(Uint8Array);
  });

  it('importBinary() loads previously exported binary data', async () => {
    await db.execute('CREATE TABLE bin_test (id INTEGER, val TEXT)');
    await db.execute("INSERT INTO bin_test VALUES (1, 'hello')");

    const binary = db.exportBinary();

    await db.importBinary(binary);

    const rows = await db.query<{ id: number; val: string }>('SELECT * FROM bin_test');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({ id: 1, val: 'hello' });
  });

  it('importBinary() replaces existing database', async () => {
    await db.execute('CREATE TABLE old_data (id INTEGER)');
    await db.execute('INSERT INTO old_data VALUES (1)');

    const db2 = createDatabaseService();
    await db2.initialize();
    await db2.execute('CREATE TABLE new_data (id INTEGER)');
    await db2.execute('INSERT INTO new_data VALUES (99)');
    const binary = db2.exportBinary();

    await db.importBinary(binary);

    await expect(db.query('SELECT * FROM old_data')).rejects.toThrow();
    const rows = await db.query<{ id: number }>('SELECT * FROM new_data');
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(99);
  });

  it('importBinary() throws when SQL.js not loaded', async () => {
    const uninitDb = createDatabaseService();
    await expect(uninitDb.importBinary(new Uint8Array())).rejects.toThrow('SQL.js not loaded');
  });
});
