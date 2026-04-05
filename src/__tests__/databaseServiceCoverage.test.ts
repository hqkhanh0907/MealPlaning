/**
 * Supplementary branch-coverage tests for databaseService.ts.
 * Covers NativeDatabaseService exportToJSON / importFromJSON paths
 * and edge-case branches not exercised by the main test file.
 */
import { vi } from 'vitest';

/* ------------------------------------------------------------------ */
/* Hoisted mocks                                                       */
/* ------------------------------------------------------------------ */
const { mockIsNativePlatform } = vi.hoisted(() => ({
  mockIsNativePlatform: vi.fn(() => false),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: mockIsNativePlatform },
}));

const mockConnection = {
  open: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  execute: vi.fn().mockResolvedValue({ changes: { changes: 0 } }),
  run: vi.fn().mockResolvedValue({ changes: { changes: 1 } }),
  query: vi.fn().mockResolvedValue({ values: [] }),
};

const mockSqliteConnection = {
  checkConnectionsConsistency: vi.fn().mockResolvedValue({ result: false }),
  isConnection: vi.fn().mockResolvedValue({ result: false }),
  createConnection: vi.fn().mockResolvedValue(mockConnection),
  retrieveConnection: vi.fn().mockResolvedValue(mockConnection),
};

vi.mock('@capacitor-community/sqlite', () => ({
  CapacitorSQLite: {},
  SQLiteConnection: function () {
    return mockSqliteConnection;
  },
}));

vi.mock('../services/schema', () => ({
  SCHEMA_TABLES: ['ingredients', 'dishes'],
  createSchema: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/syncV2Utils', () => ({
  IMPORT_ORDER: ['ingredients', 'dishes'],
}));

import { createDatabaseService, type DatabaseService } from '../services/databaseService';

/* ================================================================== */
/* NativeDatabaseService — exportToJSON                                */
/* ================================================================== */
describe('NativeDatabaseService exportToJSON', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockIsNativePlatform.mockReturnValue(true);
    db = createDatabaseService();
    mockIsNativePlatform.mockReturnValue(false);
    await db.initialize();
  });

  it('exports tables with data in V2 envelope', async () => {
    mockConnection.query
      .mockResolvedValueOnce({ values: [{ id: 'i1', name_vi: 'Test' }] })
      .mockResolvedValueOnce({ values: [] });

    const json = await db.exportToJSON();
    const parsed = JSON.parse(json);

    expect(parsed._version).toBe('2.0');
    expect(parsed._format).toBe('sqlite-json');
    expect(parsed._exportedAt).toBeDefined();
    expect(parsed.tables.ingredients).toEqual([{ id: 'i1', name_vi: 'Test' }]);
    expect(parsed.tables.dishes).toEqual([]);
  });

  it('exports empty arrays when query returns no values key', async () => {
    mockConnection.query.mockResolvedValueOnce({ values: undefined }).mockResolvedValueOnce({ values: undefined });

    const json = await db.exportToJSON();
    const parsed = JSON.parse(json);
    expect(parsed.tables.ingredients).toEqual([]);
    expect(parsed.tables.dishes).toEqual([]);
  });
});

/* ================================================================== */
/* NativeDatabaseService — importFromJSON                              */
/* ================================================================== */
describe('NativeDatabaseService importFromJSON', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockIsNativePlatform.mockReturnValue(true);
    db = createDatabaseService();
    mockIsNativePlatform.mockReturnValue(false);
    await db.initialize();
  });

  it('throws on invalid JSON', async () => {
    await expect(db.importFromJSON('not-json')).rejects.toThrow('invalid JSON string');
  });

  it('handles V2 export envelope', async () => {
    const payload = JSON.stringify({
      _version: '2.0',
      tables: {
        ingredients: [{ id: 'i1', name_vi: 'Test' }],
      },
    });

    await db.importFromJSON(payload);

    // Drops tables in reverse order
    expect(mockConnection.execute).toHaveBeenCalledWith('DROP TABLE IF EXISTS "dishes"', false);
    expect(mockConnection.execute).toHaveBeenCalledWith('DROP TABLE IF EXISTS "ingredients"', false);
    // Inserts data
    expect(mockConnection.run).toHaveBeenCalledWith(
      'INSERT INTO "ingredients" ("id", "name_vi") VALUES (?, ?)',
      ['i1', 'Test'],
      false,
    );
  });

  it('handles raw table map (non-V2)', async () => {
    const payload = JSON.stringify({
      ingredients: [{ id: 'i2', name_vi: 'Raw' }],
    });

    await db.importFromJSON(payload);
    expect(mockConnection.run).toHaveBeenCalledWith(
      'INSERT INTO "ingredients" ("id", "name_vi") VALUES (?, ?)',
      ['i2', 'Raw'],
      false,
    );
  });

  it('skips empty row arrays', async () => {
    const payload = JSON.stringify({
      ingredients: [],
      dishes: [],
    });

    await db.importFromJSON(payload);
    // Only structural calls, no INSERT calls
    expect(mockConnection.run).not.toHaveBeenCalled();
  });

  it('skips non-array table entries', async () => {
    const payload = JSON.stringify({
      ingredients: 'not-an-array',
    });

    await db.importFromJSON(payload);
    expect(mockConnection.run).not.toHaveBeenCalled();
  });

  it('skips rows with empty columns', async () => {
    const payload = JSON.stringify({
      ingredients: [{}],
    });

    await db.importFromJSON(payload);
    expect(mockConnection.run).not.toHaveBeenCalled();
  });

  it('maps null values correctly with ?? null', async () => {
    // JSON.parse converts explicit null values — test that ?? null handles them
    const payload = JSON.stringify({
      ingredients: [{ id: 'i3', name_vi: 'Test', name_en: null }],
    });

    await db.importFromJSON(payload);
    const lastRunCall = mockConnection.run.mock.calls[0];
    // null preserved via ?? null
    expect(lastRunCall[1]).toContain(null);
  });

  it('handles V2 envelope with missing tables key', async () => {
    const payload = JSON.stringify({
      _version: '2.0',
    });

    await db.importFromJSON(payload);
    // No inserts — tables is effectively {}
    expect(mockConnection.run).not.toHaveBeenCalled();
  });
});

/* ================================================================== */
/* NativeDatabaseService — queryOne with result                        */
/* ================================================================== */
describe('NativeDatabaseService queryOne', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockIsNativePlatform.mockReturnValue(true);
    db = createDatabaseService();
    mockIsNativePlatform.mockReturnValue(false);
    await db.initialize();
  });

  it('returns first row when results exist', async () => {
    mockConnection.query.mockResolvedValueOnce({
      values: [{ user_name: 'Alice' }, { user_name: 'Bob' }],
    });
    const result = await db.queryOne<{ userName: string }>('SELECT * FROM users');
    expect(result).toEqual({ userName: 'Alice' });
  });

  it('returns null via nullish coalescing when values undefined', async () => {
    mockConnection.query.mockResolvedValueOnce({ values: undefined });
    const result = await db.queryOne('SELECT * FROM users');
    expect(result).toBeNull();
  });
});

/* ================================================================== */
/* NativeDatabaseService — execute transaction flag                     */
/* ================================================================== */
describe('NativeDatabaseService execute without params', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockIsNativePlatform.mockReturnValue(true);
    db = createDatabaseService();
    mockIsNativePlatform.mockReturnValue(false);
    await db.initialize();
  });

  it('calls connection.execute (not run) when no params provided', async () => {
    await db.execute('CREATE TABLE t (id TEXT)');
    expect(mockConnection.execute).toHaveBeenCalledWith('CREATE TABLE t (id TEXT)', true);
    expect(mockConnection.run).not.toHaveBeenCalled();
  });

  it('calls connection.execute when params is empty array', async () => {
    await db.execute('CREATE TABLE t (id TEXT)', []);
    expect(mockConnection.execute).toHaveBeenCalledWith('CREATE TABLE t (id TEXT)', true);
  });

  it('sets transaction flag false inside transaction block', async () => {
    mockConnection.execute.mockClear();
    mockConnection.run.mockClear();

    await db.transaction(async () => {
      await db.execute('INSERT INTO t VALUES (?)', ['x']);
      await db.execute('CREATE INDEX idx ON t(id)');
    });

    // run called with transaction=false inside transaction
    expect(mockConnection.run).toHaveBeenCalledWith('INSERT INTO t VALUES (?)', ['x'], false);
    // execute called with transaction=false inside transaction
    const executeCallsInsideTx = mockConnection.execute.mock.calls.filter(
      c => c[0] !== 'BEGIN TRANSACTION' && c[0] !== 'COMMIT',
    );
    expect(executeCallsInsideTx[0]).toEqual(['CREATE INDEX idx ON t(id)', false]);
  });
});

/* ================================================================== */
/* NativeDatabaseService — importFromJSON with multiple rows            */
/* ================================================================== */
describe('NativeDatabaseService importFromJSON multiple rows', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockIsNativePlatform.mockReturnValue(true);
    db = createDatabaseService();
    mockIsNativePlatform.mockReturnValue(false);
    await db.initialize();
  });

  it('inserts multiple rows in order', async () => {
    const payload = JSON.stringify({
      ingredients: [
        { id: 'i1', name_vi: 'Apple' },
        { id: 'i2', name_vi: 'Banana' },
      ],
    });

    await db.importFromJSON(payload);
    expect(mockConnection.run).toHaveBeenCalledTimes(2);
    expect(mockConnection.run.mock.calls[0][1]).toEqual(['i1', 'Apple']);
    expect(mockConnection.run.mock.calls[1][1]).toEqual(['i2', 'Banana']);
  });

  it('handles tables not in IMPORT_ORDER gracefully', async () => {
    const payload = JSON.stringify({
      unknown_table: [{ id: 'x' }],
    });

    // Should not throw — unknown tables are simply skipped
    await db.importFromJSON(payload);
    // Only structural calls (DROP, FK pragma), no INSERT for unknown_table
    const runCalls = mockConnection.run.mock.calls;
    expect(runCalls.length).toBe(0);
  });
});
