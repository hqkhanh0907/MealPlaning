import {
  camelToSnake,
  createDatabaseService,
  type DatabaseService,
  rowToType,
  snakeToCamel,
  typeToRow,
} from '../services/databaseService';

/* ------------------------------------------------------------------ */
/* Mocks: allow the real WebDatabaseService to run in Node.js/jsdom */
/* ------------------------------------------------------------------ */
const { mockIsNativePlatform } = vi.hoisted(() => ({
  mockIsNativePlatform: vi.fn(() => false),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: mockIsNativePlatform },
}));

vi.mock('sql.js', async () => {
  const real = await vi.importActual<typeof import('sql.js')>('sql.js');
  return { default: () => real.default() };
});

/* ================================================================== */
/* Conversion helper tests */
/* ================================================================== */
describe('snakeToCamel', () => {
  it('converts snake_case keys correctly', () => {
    expect(snakeToCamel('created_at')).toBe('createdAt');
    expect(snakeToCamel('user_first_name')).toBe('userFirstName');
    expect(snakeToCamel('id')).toBe('id');
    expect(snakeToCamel('some_long_key_name')).toBe('someLongKeyName');
  });
});

describe('camelToSnake', () => {
  it('converts camelCase keys correctly', () => {
    expect(camelToSnake('createdAt')).toBe('created_at');
    expect(camelToSnake('userFirstName')).toBe('user_first_name');
    expect(camelToSnake('id')).toBe('id');
    expect(camelToSnake('someLongKeyName')).toBe('some_long_key_name');
  });
});

describe('rowToType', () => {
  it('transforms full row object from snake_case to camelCase', () => {
    const row = { user_id: 1, first_name: 'Alice', created_at: '2024-01-01' };
    const result = rowToType<{ userId: number; firstName: string; createdAt: string }>(row);
    expect(result).toEqual({ userId: 1, firstName: 'Alice', createdAt: '2024-01-01' });
  });
});

describe('typeToRow', () => {
  it('transforms camelCase object to snake_case', () => {
    const obj = { userId: 1, firstName: 'Alice', createdAt: '2024-01-01' };
    const result = typeToRow(obj);
    expect(result).toEqual({ user_id: 1, first_name: 'Alice', created_at: '2024-01-01' });
  });
});

/* ================================================================== */
/* DatabaseService integration tests (real WebDatabaseService) */
/* ================================================================== */
describe('DatabaseService', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    db = createDatabaseService();
    await db.initialize();
  });

  it('initialize() creates database without error', async () => {
    const db2 = createDatabaseService();
    await expect(db2.initialize()).resolves.toBeUndefined();
  });

  it('execute() runs DDL (CREATE TABLE) without error', async () => {
    await expect(db.execute('CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT)')).resolves.toBeUndefined();
  });

  it('execute() runs INSERT with params', async () => {
    await db.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, user_name TEXT)');
    await expect(db.execute('INSERT INTO users VALUES (?, ?)', [1, 'Alice'])).resolves.toBeUndefined();

    const rows = await db.query<{ id: number; userName: string }>('SELECT * FROM users');
    expect(rows).toHaveLength(1);
    expect(rows[0].userName).toBe('Alice');
  });

  it('query<T>() returns rows with camelCase keys', async () => {
    await db.execute('CREATE TABLE items (item_id INTEGER, item_name TEXT, created_at TEXT)');
    await db.execute("INSERT INTO items VALUES (1, 'Widget', '2024-01-01')");
    await db.execute("INSERT INTO items VALUES (2, 'Gadget', '2024-02-01')");

    const rows = await db.query<{ itemId: number; itemName: string; createdAt: string }>('SELECT * FROM items');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ itemId: 1, itemName: 'Widget', createdAt: '2024-01-01' });
    expect(rows[1]).toEqual({ itemId: 2, itemName: 'Gadget', createdAt: '2024-02-01' });
  });

  it('query<T>() returns empty array when no results', async () => {
    await db.execute('CREATE TABLE empty_table (id INTEGER)');
    const rows = await db.query<{ id: number }>('SELECT * FROM empty_table');
    expect(rows).toEqual([]);
  });

  it('queryOne<T>() returns single row', async () => {
    await db.execute('CREATE TABLE people (id INTEGER, full_name TEXT)');
    await db.execute("INSERT INTO people VALUES (1, 'Bob')");

    const result = await db.queryOne<{ id: number; fullName: string }>('SELECT * FROM people WHERE id = ?', [1]);
    expect(result).toEqual({ id: 1, fullName: 'Bob' });
  });

  it('queryOne<T>() returns null when no match', async () => {
    await db.execute('CREATE TABLE people (id INTEGER, full_name TEXT)');

    const result = await db.queryOne<{ id: number; fullName: string }>('SELECT * FROM people WHERE id = ?', [999]);
    expect(result).toBeNull();
  });

  it('transaction() commits on success', async () => {
    await db.execute('CREATE TABLE txn_test (id INTEGER, val TEXT)');

    await db.transaction(async () => {
      await db.execute("INSERT INTO txn_test VALUES (1, 'a')");
      await db.execute("INSERT INTO txn_test VALUES (2, 'b')");
    });

    const rows = await db.query<{ id: number; val: string }>('SELECT * FROM txn_test');
    expect(rows).toHaveLength(2);
  });

  it('transaction() rolls back on error', async () => {
    await db.execute('CREATE TABLE txn_test (id INTEGER, val TEXT)');

    await expect(
      db.transaction(async () => {
        await db.execute("INSERT INTO txn_test VALUES (1, 'a')");
        throw new Error('Intentional rollback');
      }),
    ).rejects.toThrow('Intentional rollback');

    const rows = await db.query<{ id: number; val: string }>('SELECT * FROM txn_test');
    expect(rows).toHaveLength(0);
  });

  it('exportToJSON() returns valid JSON string', async () => {
    await db.execute('CREATE TABLE export_test (id INTEGER, name TEXT)');
    await db.execute("INSERT INTO export_test VALUES (1, 'Alpha')");
    await db.execute("INSERT INTO export_test VALUES (2, 'Beta')");

    const json = await db.exportToJSON();
    const parsed = JSON.parse(json) as Record<string, unknown[]>;

    expect(parsed).toHaveProperty('export_test');
    expect(parsed['export_test']).toHaveLength(2);
    expect(parsed['export_test'][0]).toEqual({ id: 1, name: 'Alpha' });
  });

  it('exportToJSON() returns empty object when no tables', async () => {
    const json = await db.exportToJSON();
    expect(JSON.parse(json)).toEqual({});
  });

  it('importFromJSON() imports data correctly', async () => {
    const importData = {
      products: [
        { id: '1', product_name: 'Coffee' },
        { id: '2', product_name: 'Tea' },
      ],
    };

    await db.importFromJSON(JSON.stringify(importData));

    const rows = await db.query<{ id: string; productName: string }>('SELECT * FROM products');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ id: '1', productName: 'Coffee' });
    expect(rows[1]).toEqual({ id: '2', productName: 'Tea' });
  });

  it('importFromJSON() replaces existing data', async () => {
    await db.execute('CREATE TABLE old_table (id INTEGER)');
    await db.execute('INSERT INTO old_table VALUES (1)');

    await db.importFromJSON(JSON.stringify({ new_table: [{ id: '10', val: 'x' }] }));

    await expect(db.query('SELECT * FROM old_table')).rejects.toThrow();
    const rows = await db.query<{ id: string; val: string }>('SELECT * FROM new_table');
    expect(rows).toHaveLength(1);
  });

  it('importFromJSON() throws on invalid JSON', async () => {
    await expect(db.importFromJSON('not-json')).rejects.toThrow('invalid JSON string');
  });

  it('importFromJSON() rolls back on SQL error during import', async () => {
    await db.execute('CREATE TABLE before_import (id INTEGER)');
    await db.execute('INSERT INTO before_import VALUES (1)');

    const validData = { before_import: [{ id: '1' }] };
    await expect(db.importFromJSON(JSON.stringify(validData))).resolves.toBeUndefined();
  });

  it('execute() throws descriptive error on bad SQL', async () => {
    await expect(db.execute('INVALID SQL')).rejects.toThrow('SQL execute error');
  });

  it('query() throws descriptive error on bad SQL', async () => {
    await expect(db.query('SELECT * FROM nonexistent')).rejects.toThrow('SQL query error');
  });

  it('execute() throws when database is not initialized', async () => {
    const uninitDb = createDatabaseService();
    await expect(uninitDb.execute('SELECT 1')).rejects.toThrow('not initialized');
  });

  it('query() throws when database is not initialized', async () => {
    const uninitDb = createDatabaseService();
    await expect(uninitDb.query('SELECT 1')).rejects.toThrow('not initialized');
  });

  it('exportToJSON() handles table with no rows', async () => {
    await db.execute('CREATE TABLE empty_export (id INTEGER, name TEXT)');
    const json = await db.exportToJSON();
    const parsed = JSON.parse(json) as Record<string, unknown[]>;
    expect(parsed).toHaveProperty('empty_export');
    expect(parsed['empty_export']).toEqual([]);
  });

  it('importFromJSON() skips empty row arrays', async () => {
    await db.importFromJSON(JSON.stringify({ skip_table: [] }));
    const json = await db.exportToJSON();
    expect(JSON.parse(json)).toEqual({});
  });

  it('close() resolves without error', async () => {
    await expect(db.close()).resolves.toBeUndefined();
  });

  it('close() makes subsequent operations fail', async () => {
    await db.close();
    await expect(db.execute('SELECT 1')).rejects.toThrow();
  });
});

/* ================================================================== */
/* NativeDatabaseService (stub) tests */
/* ================================================================== */
describe('NativeDatabaseService', () => {
  let nativeDb: DatabaseService;

  beforeEach(() => {
    mockIsNativePlatform.mockReturnValue(true);
    nativeDb = createDatabaseService();
    mockIsNativePlatform.mockReturnValue(false);
  });

  it('initialize() succeeds (uses WebDatabaseService universally)', async () => {
    await expect(nativeDb.initialize()).resolves.toBeUndefined();
  });

  it('execute() throws not initialized', async () => {
    await expect(nativeDb.execute('SELECT 1')).rejects.toThrow('not initialized');
  });

  it('query() throws not initialized', async () => {
    await expect(nativeDb.query('SELECT 1')).rejects.toThrow('not initialized');
  });

  it('queryOne() throws not initialized', async () => {
    await expect(nativeDb.queryOne('SELECT 1')).rejects.toThrow('not initialized');
  });

  it('transaction() throws not initialized', async () => {
    await expect(nativeDb.transaction(async () => {})).rejects.toThrow('not initialized');
  });

  it('exportToJSON() throws not initialized', async () => {
    await expect(nativeDb.exportToJSON()).rejects.toThrow('not initialized');
  });

  it('importFromJSON() throws not initialized', async () => {
    await expect(nativeDb.importFromJSON('{}')).rejects.toThrow('not initialized');
  });
});
