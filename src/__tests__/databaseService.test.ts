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

  it('exportToJSON() returns V2ExportPayload envelope with table data', async () => {
    const { createSchema } = await import('../services/schema');
    await createSchema(db);
    await db.execute("INSERT INTO ingredients VALUES ('i1','Alpha','AlphaEN',100,10,20,5,3,'g','g')");

    const json = await db.exportToJSON();
    const parsed = JSON.parse(json);

    expect(parsed._version).toBe('2.0');
    expect(parsed._format).toBe('sqlite-json');
    expect(parsed._exportedAt).toBeDefined();
    expect(parsed.tables).toBeDefined();
    expect(parsed.tables.ingredients).toHaveLength(1);
    expect(parsed.tables.ingredients[0]).toMatchObject({ id: 'i1', name_vi: 'Alpha' });
  });

  it('exportToJSON() includes all SCHEMA_TABLES even if empty', async () => {
    const { createSchema, SCHEMA_TABLES } = await import('../services/schema');
    await createSchema(db);
    const json = await db.exportToJSON();
    const parsed = JSON.parse(json);
    for (const table of SCHEMA_TABLES) {
      expect(parsed.tables).toHaveProperty(table);
    }
  });

  it('importFromJSON() preserves schema types (FK-safe)', async () => {
    const { createSchema } = await import('../services/schema');
    await createSchema(db);
    await db.execute("INSERT INTO ingredients VALUES ('i1','Test','TestEN',100,10,20,5,3,'g','g')");
    const json = await db.exportToJSON();

    await db.importFromJSON(json);

    const rows = await db.query<{ id: string }>('SELECT id FROM ingredients');
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('i1');

    // Verify column types preserved (not all TEXT)
    const info = await db.query<{ type: string; name: string }>("PRAGMA table_info('ingredients')");
    const calCol = info.find(c => c.name === 'calories_per_100');
    expect(calCol?.type).toBe('REAL');
  });

  it('importFromJSON() handles V2ExportPayload envelope format', async () => {
    const { createSchema } = await import('../services/schema');
    await createSchema(db);
    await db.execute("INSERT INTO ingredients VALUES ('i1','Test','TestEN',100,10,20,5,3,'g','g')");
    const json = await db.exportToJSON();
    const parsed = JSON.parse(json);
    expect(parsed._version).toBe('2.0');
    expect(parsed.tables.ingredients).toHaveLength(1);
  });

  it('importFromJSON() accepts raw table map for backward compat', async () => {
    const { createSchema } = await import('../services/schema');
    await createSchema(db);
    const rawJson = JSON.stringify({
      ingredients: [
        {
          id: 'i1',
          name_vi: 'Test',
          name_en: null,
          calories_per_100: 100,
          protein_per_100: 10,
          carbs_per_100: 20,
          fat_per_100: 5,
          fiber_per_100: 3,
          unit_vi: 'g',
          unit_en: null,
        },
      ],
    });
    await db.importFromJSON(rawJson);
    const rows = await db.query<{ id: string }>('SELECT id FROM ingredients');
    expect(rows).toHaveLength(1);
  });

  it('importFromJSON() handles FK tables correctly (dishes → dish_ingredients)', async () => {
    const { createSchema } = await import('../services/schema');
    await createSchema(db);
    await db.execute("INSERT INTO ingredients VALUES ('i1','Ga','Chicken',165,31,0,4,0,'g','g')");
    await db.execute("INSERT INTO dishes VALUES ('d1','Mon 1',NULL,'[]',NULL,NULL)");
    await db.execute("INSERT INTO dish_ingredients VALUES ('d1','i1',150)");

    const json = await db.exportToJSON();
    await db.importFromJSON(json);

    const di = await db.query<{ dishId: string }>('SELECT dish_id FROM dish_ingredients');
    expect(di).toHaveLength(1);
  });

  it('importFromJSON() replaces existing data', async () => {
    const { createSchema } = await import('../services/schema');
    await createSchema(db);
    await db.execute("INSERT INTO ingredients VALUES ('old','Old','OldEN',0,0,0,0,0,'g','g')");

    const newData = JSON.stringify({
      ingredients: [
        {
          id: 'new1',
          name_vi: 'New',
          name_en: null,
          calories_per_100: 50,
          protein_per_100: 5,
          carbs_per_100: 10,
          fat_per_100: 2,
          fiber_per_100: 1,
          unit_vi: 'g',
          unit_en: null,
        },
      ],
    });
    await db.importFromJSON(newData);

    const rows = await db.query<{ id: string }>('SELECT id FROM ingredients');
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('new1');
  });

  it('importFromJSON() throws on invalid JSON', async () => {
    await expect(db.importFromJSON('not-json')).rejects.toThrow('invalid JSON string');
  });

  it('importFromJSON() rolls back on SQL error during import', async () => {
    const { createSchema } = await import('../services/schema');
    await createSchema(db);
    const validData = {
      ingredients: [
        {
          id: 'i1',
          name_vi: 'Test',
          name_en: null,
          calories_per_100: 100,
          protein_per_100: 10,
          carbs_per_100: 20,
          fat_per_100: 5,
          fiber_per_100: 3,
          unit_vi: 'g',
          unit_en: null,
        },
      ],
    };
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
    const { createSchema } = await import('../services/schema');
    await createSchema(db);
    const json = await db.exportToJSON();
    const parsed = JSON.parse(json);
    expect(parsed.tables.ingredients).toEqual([]);
  });

  it('importFromJSON() skips empty row arrays', async () => {
    const { createSchema } = await import('../services/schema');
    await createSchema(db);
    await db.importFromJSON(JSON.stringify({ ingredients: [] }));
    const rows = await db.query('SELECT * FROM ingredients');
    expect(rows).toEqual([]);
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
