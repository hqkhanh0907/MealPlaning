# SQLite Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace in-memory sql.js with @capacitor-community/sqlite for persistent storage on Android, while keeping sql.js for web dev and Vitest.

**Architecture:** Two implementations behind one `DatabaseService` interface. `WebDatabaseService` (sql.js) for web/test. `NativeDatabaseService` (@capacitor-community/sqlite) for Android. Factory detects platform. All sync/backup uses JSON format — binary methods removed entirely.

**Tech Stack:** React 19, Capacitor 8, @capacitor-community/sqlite 8.1.0, Vitest, sql.js

**Spec:** `docs/superpowers/specs/2026-04-04-sqlite-migration-design.md`

---

## File Map

| File                                          | Action | Responsibility                                                                                              |
| --------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| `src/services/databaseService.ts`             | Modify | Remove binary methods, add `close()`, fix `importFromJSON`, fix `exportToJSON`, add `NativeDatabaseService` |
| `src/services/syncV2Utils.ts`                 | Modify | Extend `IMPORT_ORDER` with 6 missing tables                                                                 |
| `src/contexts/DatabaseContext.tsx`            | Modify | Add migration check, `close()` cleanup, cancelled guard                                                     |
| `src/services/googleDriveService.ts`          | Modify | `Uint8Array` → `string`, JSON MIME type                                                                     |
| `src/hooks/useAutoSync.ts`                    | Modify | `exportBinary` → `exportToJSON`, `importBinary` → `importFromJSON`                                          |
| `src/components/GoogleDriveSync.tsx`          | Modify | Same as useAutoSync + `conflictData` type                                                                   |
| `src/components/DataBackup.tsx`               | Modify | JSON export/import, remove SQLite header check                                                              |
| `capacitor.config.ts`                         | Modify | Add CapacitorSQLite plugin config                                                                           |
| `src/__tests__/databaseServiceBinary.test.ts` | Delete | Binary methods removed                                                                                      |
| `src/__tests__/databaseService.test.ts`       | Modify | Add `close()` tests, update `importFromJSON` tests                                                          |
| `src/__tests__/nativeDatabaseService.test.ts` | Create | Full NativeDatabaseService test suite                                                                       |
| `src/__tests__/databaseContext.test.tsx`      | Create | Migration order + cleanup tests                                                                             |
| 12 other test files                           | Modify | Remove `exportBinary`/`importBinary` from mocks, add `close`                                                |

---

## Task 1: Update DatabaseService Interface + WebDatabaseService

**Files:**

- Modify: `src/services/databaseService.ts`
- Delete: `src/__tests__/databaseServiceBinary.test.ts`
- Modify: `src/__tests__/databaseService.test.ts`

- [ ] **Step 1: Write failing test for `close()` method**

In `src/__tests__/databaseService.test.ts`, add:

```typescript
describe('close', () => {
  it('close() resolves without error', async () => {
    await expect(db.close()).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/databaseService.test.ts`
Expected: FAIL — `close` is not a function

- [ ] **Step 3: Update interface and WebDatabaseService**

In `src/services/databaseService.ts`:

1. Remove from interface:

```typescript
// DELETE these two lines:
exportBinary(): Uint8Array;
importBinary(data: Uint8Array): Promise<void>;
```

2. Add to interface:

```typescript
close(): Promise<void>;
```

3. Remove `exportBinary()` method from `WebDatabaseService` (lines 118-120)

4. Remove `importBinary()` method from `WebDatabaseService` (lines 122-127)

5. Add `close()` method to `WebDatabaseService`:

```typescript
async close(): Promise<void> {
  this.db?.close();
  this.db = null;
}
```

- [ ] **Step 4: Delete binary test file**

```bash
rm src/__tests__/databaseServiceBinary.test.ts
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/__tests__/databaseService.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "refactor: remove binary methods, add close() to DatabaseService

- Remove exportBinary()/importBinary() from interface and WebDatabaseService
- Add close() method for connection cleanup
- Delete databaseServiceBinary.test.ts (binary tests no longer needed)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: Fix importFromJSON (FK-safe, schema-preserving)

**Files:**

- Modify: `src/services/databaseService.ts:154-184` (importFromJSON)
- Modify: `src/services/syncV2Utils.ts:29-46` (IMPORT_ORDER)
- Modify: `src/__tests__/databaseService.test.ts`

- [ ] **Step 1: Extend IMPORT_ORDER with 6 missing tables**

In `src/services/syncV2Utils.ts`, add after `'adjustments'` (line 45):

```typescript
'fitness_profiles',
'fitness_preferences',
'workout_drafts',
'app_settings',
'grocery_checked',
'plan_templates',
```

Also export the constant (change from `const` to `export const`).

- [ ] **Step 2: Write failing test for FK-safe importFromJSON**

In `src/__tests__/databaseService.test.ts`, add test that verifies proper schema is preserved after import:

```typescript
describe('importFromJSON (FK-safe)', () => {
  it('preserves column types and constraints after import', async () => {
    await createSchema(db);
    // Insert test data
    await db.execute("INSERT INTO ingredients VALUES ('i1','Test','TestEN',100,10,20,5,3,'g','g')");
    const json = await db.exportToJSON();

    // Import should preserve schema
    await db.importFromJSON(json);

    // Verify data round-tripped
    const rows = await db.query<{ id: string }>('SELECT id FROM ingredients');
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('i1');

    // Verify column types preserved (not all TEXT)
    const info = await db.query<{ type: string; name: string }>("PRAGMA table_info('ingredients')");
    const calCol = info.find(c => c.name === 'calories_per_100');
    expect(calCol?.type).toBe('REAL');
  });

  it('handles V2ExportPayload envelope format', async () => {
    await createSchema(db);
    await db.execute("INSERT INTO ingredients VALUES ('i1','Test','TestEN',100,10,20,5,3,'g','g')");
    const json = await db.exportToJSON();
    const parsed = JSON.parse(json);
    // Should be V2ExportPayload format
    expect(parsed._version).toBe('2.0');
    expect(parsed._format).toBe('sqlite-json');
    expect(parsed.tables).toBeDefined();
    expect(parsed.tables.ingredients).toHaveLength(1);
  });

  it('accepts raw table map for backward compat', async () => {
    await createSchema(db);
    const rawJson = JSON.stringify({
      ingredients: [
        {
          id: 'i1',
          name_vi: 'Test',
          calories_per_100: 100,
          protein_per_100: 10,
          carbs_per_100: 20,
          fat_per_100: 5,
          fiber_per_100: 3,
          unit_vi: 'g',
        },
      ],
    });
    await db.importFromJSON(rawJson);
    const rows = await db.query<{ id: string }>('SELECT id FROM ingredients');
    expect(rows).toHaveLength(1);
  });

  it('handles FK tables correctly (dishes → dish_ingredients)', async () => {
    await createSchema(db);
    // Insert parent + child
    await db.execute("INSERT INTO ingredients VALUES ('i1','Ga','Chicken',165,31,0,4,0,'g','g')");
    await db.execute("INSERT INTO dishes VALUES ('d1','Mon 1',NULL,'[]',NULL,NULL)");
    await db.execute("INSERT INTO dish_ingredients VALUES ('d1','i1',150)");

    const json = await db.exportToJSON();
    await db.importFromJSON(json);

    const di = await db.query<{ dishId: string }>('SELECT dish_id FROM dish_ingredients');
    expect(di).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/databaseService.test.ts`
Expected: FAIL — column types are TEXT (current broken behavior)

- [ ] **Step 4: Fix importFromJSON in WebDatabaseService**

Replace `importFromJSON` method (lines 154-184) with:

```typescript
async importFromJSON(json: string): Promise<void> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('invalid JSON string');
  }

  // Accept V2ExportPayload envelope or raw table map
  let tables: Record<string, unknown[]>;
  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    '_version' in parsed &&
    (parsed as Record<string, unknown>)._version === '2.0'
  ) {
    tables = (parsed as { tables: Record<string, unknown[]> }).tables ?? {};
  } else {
    tables = parsed as Record<string, unknown[]>;
  }

  const db = this.getDb();

  // 1. Disable FK constraints during reset
  db.run('PRAGMA foreign_keys = OFF');

  // 2. Drop existing tables in reverse dependency order
  const { IMPORT_ORDER } = await import('./syncV2Utils');
  const reverseOrder = [...IMPORT_ORDER].reverse();
  for (const t of reverseOrder) {
    db.run(`DROP TABLE IF EXISTS "${t}"`);
  }

  // 3. Recreate schema with proper types/constraints
  const { createSchema } = await import('./schema');
  await createSchema(this);

  // 4. Re-enable FK constraints
  db.run('PRAGMA foreign_keys = ON');

  // 5. Insert data in forward dependency order
  for (const tableName of IMPORT_ORDER) {
    const rows = tables[tableName];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    for (const row of rows) {
      const obj = row as Record<string, unknown>;
      const columns = Object.keys(obj);
      if (columns.length === 0) continue;
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(c => obj[c] ?? null);
      const columnList = columns.map(c => `"${c}"`).join(', ');
      db.run(
        `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders})`,
        values,
      );
    }
  }
}
```

- [ ] **Step 5: Fix exportToJSON to use V2ExportPayload envelope**

Replace `exportToJSON` method (lines 129-152) with:

```typescript
async exportToJSON(): Promise<string> {
  const db = this.getDb();
  const { SCHEMA_TABLES } = await import('./schema');
  const tables: Record<string, unknown[]> = {};

  for (const tableName of SCHEMA_TABLES) {
    const data = db.exec(`SELECT * FROM "${tableName}"`);
    if (data.length === 0) {
      tables[tableName] = [];
    } else {
      const { columns, values } = data[0];
      tables[tableName] = values.map(r => {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
          obj[col] = r[i];
        });
        return obj;
      });
    }
  }

  return JSON.stringify({
    _version: '2.0',
    _exportedAt: new Date().toISOString(),
    _format: 'sqlite-json',
    tables,
  });
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/databaseService.test.ts`
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "fix: importFromJSON preserves schema types, exportToJSON uses V2 envelope

- importFromJSON: DROP → createSchema() → INSERT (FK-safe, proper types)
- exportToJSON: V2ExportPayload envelope format
- IMPORT_ORDER: add 6 missing tables (fitness_profiles, etc.)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: Fix DatabaseContext (Migrations + Cleanup)

**Files:**

- Modify: `src/contexts/DatabaseContext.tsx`
- Create: `src/__tests__/databaseContext.test.tsx`

- [ ] **Step 1: Write failing test for migration-aware startup**

Create `src/__tests__/databaseContext.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules before import
const mockCreateSchema = vi.fn().mockResolvedValue(undefined);
const mockRunSchemaMigrations = vi.fn().mockResolvedValue(undefined);
const mockGetSchemaVersion = vi.fn().mockResolvedValue(0);
const mockIsMigrationNeeded = vi.fn().mockReturnValue(false);
const mockMigrateFitnessData = vi.fn().mockResolvedValue(undefined);
const mockIsFitnessMigrationCompleted = vi.fn().mockReturnValue(true);

vi.mock('../services/schema', () => ({
  createSchema: (...args: unknown[]) => mockCreateSchema(...args),
  getSchemaVersion: (...args: unknown[]) => mockGetSchemaVersion(...args),
  runSchemaMigrations: (...args: unknown[]) => mockRunSchemaMigrations(...args),
}));

vi.mock('../services/migrationService', () => ({
  isMigrationNeeded: () => mockIsMigrationNeeded(),
  migrateFromLocalStorage: vi.fn().mockResolvedValue(undefined),
  isFitnessMigrationCompleted: () => mockIsFitnessMigrationCompleted(),
  migrateFitnessData: (...args: unknown[]) => mockMigrateFitnessData(...args),
}));

const mockClose = vi.fn().mockResolvedValue(undefined);
vi.mock('../services/databaseService', () => ({
  createDatabaseService: () => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    execute: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue([]),
    queryOne: vi.fn().mockResolvedValue(null),
    transaction: vi.fn().mockResolvedValue(undefined),
    exportToJSON: vi.fn().mockResolvedValue('{}'),
    importFromJSON: vi.fn().mockResolvedValue(undefined),
    close: mockClose,
  }),
}));

// Mock store loading
vi.mock('../store/ingredientStore', () => ({
  useIngredientStore: { getState: () => ({ loadAll: vi.fn().mockResolvedValue(undefined) }) },
}));
vi.mock('../store/dishStore', () => ({
  useDishStore: { getState: () => ({ loadAll: vi.fn().mockResolvedValue(undefined) }) },
}));
vi.mock('../store/dayPlanStore', () => ({
  useDayPlanStore: { getState: () => ({ loadAll: vi.fn().mockResolvedValue(undefined) }) },
}));
vi.mock('../store/mealTemplateStore', () => ({
  useMealTemplateStore: { getState: () => ({ loadAll: vi.fn().mockResolvedValue(undefined) }) },
}));
vi.mock('../features/health-profile/store/healthProfileStore', () => ({
  useHealthProfileStore: {
    getState: () => ({
      loadProfile: vi.fn().mockResolvedValue(undefined),
      loadActiveGoal: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));
vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: { getState: () => ({ initializeFromSQLite: vi.fn().mockResolvedValue(undefined) }) },
}));

import { DatabaseProvider, useDatabase } from '../contexts/DatabaseContext';

const TestChild = () => {
  const db = useDatabase();
  return <div data-testid="loaded">{db ? 'ready' : 'not ready'}</div>;
};

describe('DatabaseContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls createSchema on fresh DB (version 0)', async () => {
    mockGetSchemaVersion.mockResolvedValue(0);
    render(
      <DatabaseProvider><TestChild /></DatabaseProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loaded')).toHaveTextContent('ready'));
    expect(mockCreateSchema).toHaveBeenCalled();
    expect(mockRunSchemaMigrations).not.toHaveBeenCalled();
  });

  it('calls runSchemaMigrations then createSchema on existing DB', async () => {
    mockGetSchemaVersion.mockResolvedValue(3);
    render(
      <DatabaseProvider><TestChild /></DatabaseProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loaded')).toHaveTextContent('ready'));
    expect(mockRunSchemaMigrations).toHaveBeenCalled();
    expect(mockCreateSchema).toHaveBeenCalled();
    // migrations BEFORE createSchema
    const migrationOrder = mockRunSchemaMigrations.mock.invocationCallOrder[0];
    const createOrder = mockCreateSchema.mock.invocationCallOrder[0];
    expect(migrationOrder).toBeLessThan(createOrder);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/databaseContext.test.tsx`
Expected: FAIL — current code always calls createSchema first

- [ ] **Step 3: Implement migration-aware startup + cleanup**

Replace `src/contexts/DatabaseContext.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

import { createDatabaseService, type DatabaseService } from '../services/databaseService';
import {
  isFitnessMigrationCompleted,
  isMigrationNeeded,
  migrateFitnessData,
  migrateFromLocalStorage,
} from '../services/migrationService';
import { createSchema, getSchemaVersion, runSchemaMigrations } from '../services/schema';

const DatabaseContext = createContext<DatabaseService | null>(null);

export function DatabaseProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [db, setDb] = useState<DatabaseService | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const service = createDatabaseService();

    service
      .initialize()
      .then(async () => {
        // Check schema version BEFORE createSchema (critical for persistent DBs)
        const version = await getSchemaVersion(service);
        if (version === 0) {
          await createSchema(service);
        } else {
          await runSchemaMigrations(service);
          await createSchema(service); // CREATE IF NOT EXISTS — adds new tables safely
        }

        // Migrate legacy localStorage data to SQLite on first load
        if (isMigrationNeeded()) {
          await migrateFromLocalStorage(service);
        }
        if (!isFitnessMigrationCompleted()) {
          await migrateFitnessData(service);
        }

        // Load all stores from SQLite before rendering the app
        const { useIngredientStore } = await import('../store/ingredientStore');
        const { useDishStore } = await import('../store/dishStore');
        const { useDayPlanStore } = await import('../store/dayPlanStore');
        const { useMealTemplateStore } = await import('../store/mealTemplateStore');
        const { useHealthProfileStore } = await import(
          '../features/health-profile/store/healthProfileStore'
        );
        const { useFitnessStore } = await import('../store/fitnessStore');

        await Promise.all([
          useIngredientStore.getState().loadAll(service),
          useDishStore.getState().loadAll(service),
          useDayPlanStore.getState().loadAll(service),
          useMealTemplateStore.getState().loadAll(service),
          useHealthProfileStore.getState().loadProfile(service),
          useFitnessStore.getState().initializeFromSQLite(service),
        ]);

        if (!cancelled) setDb(service);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
      service.close().catch(() => {});
    };
  }, []);

  if (error) {
    return <div role="alert">Database error: {error}</div>;
  }

  if (!db) {
    return <div>Loading...</div>;
  }

  return <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>;
}

export function useDatabase(): DatabaseService {
  const db = useContext(DatabaseContext);
  if (!db) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return db;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/databaseContext.test.tsx`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "fix: DatabaseContext checks schema version before createSchema

- Fresh DB (version=0): createSchema() only
- Existing DB: runSchemaMigrations() → createSchema() (IF NOT EXISTS)
- Add close() cleanup on unmount
- Add cancelled guard for StrictMode double-mount

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: Update All Test Mocks (remove binary, add close)

**Files:**

- Modify: 12 test files that mock `exportBinary`/`importBinary`

All files that need mock updates (replace `exportBinary`/`importBinary` with `close`):

| File                                                  | Mock location  |
| ----------------------------------------------------- | -------------- |
| `src/__tests__/exerciseDatabase.test.ts`              | lines 19-20    |
| `src/__tests__/HealthProfileForm.test.tsx`            | lines 19-20    |
| `src/__tests__/healthProfileStore.test.ts`            | lines 19-20    |
| `src/__tests__/schema.test.ts`                        | lines 321-322  |
| `src/__tests__/useInsightEngine.test.ts`              | lines 27-28    |
| `src/__tests__/integration/syncV2Integration.test.ts` | lines 392-393  |
| `src/__tests__/syncV2.test.ts`                        | lines 87-88    |
| `src/__tests__/storeLoader.test.ts`                   | lines 58-59    |
| `src/__tests__/GoalPhaseSelector.test.tsx`            | lines 18-19    |
| `src/__tests__/fitnessStore.test.ts`                  | line 1386-1387 |

- [ ] **Step 1: Update each test file**

In each file, replace:

```typescript
exportBinary: vi.fn().mockReturnValue(new Uint8Array()),
importBinary: vi.fn(),
```

With:

```typescript
close: vi.fn().mockResolvedValue(undefined),
```

For `fitnessStore.test.ts` (line 1386-1387), replace:

```typescript
exportBinary: db.exportBinary.bind(db),
importBinary: db.importBinary.bind(db),
```

With:

```typescript
close: db.close.bind(db),
```

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS (no compilation errors about missing binary methods)

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "test: update all mocks to remove binary methods, add close()

12 test files updated to match new DatabaseService interface.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 5: NativeDatabaseService (TDD)

**Files:**

- Create: `src/__tests__/nativeDatabaseService.test.ts`
- Modify: `src/services/databaseService.ts` (add NativeDatabaseService + factory)
- Modify: `capacitor.config.ts`

- [ ] **Step 1: Install plugin**

```bash
npm install @capacitor-community/sqlite
```

- [ ] **Step 2: Write NativeDatabaseService tests**

Create `src/__tests__/nativeDatabaseService.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Capacitor plugin
const mockExecute = vi.fn().mockResolvedValue({ changes: { changes: 0 } });
const mockRun = vi.fn().mockResolvedValue({ changes: { changes: 0, lastId: 0 } });
const mockQuery = vi.fn().mockResolvedValue({ values: [] });
const mockOpen = vi.fn().mockResolvedValue(undefined);
const mockClose = vi.fn().mockResolvedValue(undefined);
const mockIsConnection = vi.fn().mockResolvedValue({ result: false });
const mockCreateConnection = vi.fn().mockResolvedValue(undefined);
const mockRetrieveConnection = vi.fn().mockResolvedValue(undefined);
const mockBeginTransaction = vi.fn().mockResolvedValue(undefined);
const mockCommitTransaction = vi.fn().mockResolvedValue(undefined);
const mockRollbackTransaction = vi.fn().mockResolvedValue(undefined);

vi.mock('@capacitor-community/sqlite', () => ({
  CapacitorSQLite: {
    execute: mockExecute,
    run: mockRun,
    query: mockQuery,
    open: mockOpen,
    close: mockClose,
    isConnection: mockIsConnection,
    createConnection: mockCreateConnection,
    retrieveConnection: mockRetrieveConnection,
    beginTransaction: mockBeginTransaction,
    commitTransaction: mockCommitTransaction,
    rollbackTransaction: mockRollbackTransaction,
  },
}));

// Must import AFTER mock
import { NativeDatabaseService } from '../services/databaseService';

describe('NativeDatabaseService', () => {
  let svc: NativeDatabaseService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new NativeDatabaseService();
  });

  describe('initialize', () => {
    it('creates new connection when none exists', async () => {
      mockIsConnection.mockResolvedValue({ result: false });
      await svc.initialize();
      expect(mockCreateConnection).toHaveBeenCalledWith(expect.objectContaining({ database: 'mealplanner' }));
      expect(mockOpen).toHaveBeenCalledWith({ database: 'mealplanner' });
    });

    it('reuses existing connection', async () => {
      mockIsConnection.mockResolvedValue({ result: true });
      await svc.initialize();
      expect(mockRetrieveConnection).toHaveBeenCalledWith({ database: 'mealplanner' });
      expect(mockCreateConnection).not.toHaveBeenCalled();
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      mockIsConnection.mockResolvedValue({ result: false });
      await svc.initialize();
    });

    it('uses execute() for DDL (no params)', async () => {
      await svc.execute('CREATE TABLE test (id TEXT)');
      expect(mockExecute).toHaveBeenCalledWith({
        database: 'mealplanner',
        statements: 'CREATE TABLE test (id TEXT)',
        transaction: true,
      });
    });

    it('uses run() for DML (with params)', async () => {
      await svc.execute('INSERT INTO test VALUES (?)', ['val']);
      expect(mockRun).toHaveBeenCalledWith({
        database: 'mealplanner',
        statement: 'INSERT INTO test VALUES (?)',
        values: ['val'],
        transaction: true,
      });
    });

    it('passes transaction:false inside explicit transaction', async () => {
      await svc.transaction(async () => {
        await svc.execute('INSERT INTO test VALUES (?)', ['val']);
      });
      expect(mockRun).toHaveBeenCalledWith(expect.objectContaining({ transaction: false }));
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      mockIsConnection.mockResolvedValue({ result: false });
      await svc.initialize();
    });

    it('returns empty array for no results', async () => {
      mockQuery.mockResolvedValue({ values: [] });
      const result = await svc.query('SELECT * FROM test');
      expect(result).toEqual([]);
    });

    it('maps snake_case to camelCase via rowToType', async () => {
      mockQuery.mockResolvedValue({
        values: [{ user_name: 'Alice', created_at: '2026-01-01' }],
      });
      const result = await svc.query<{ userName: string; createdAt: string }>('SELECT * FROM users');
      expect(result[0].userName).toBe('Alice');
      expect(result[0].createdAt).toBe('2026-01-01');
    });
  });

  describe('queryOne', () => {
    beforeEach(async () => {
      mockIsConnection.mockResolvedValue({ result: false });
      await svc.initialize();
    });

    it('returns first row or null', async () => {
      mockQuery.mockResolvedValue({ values: [{ id: '1' }] });
      const result = await svc.queryOne<{ id: string }>('SELECT * FROM test');
      expect(result?.id).toBe('1');

      mockQuery.mockResolvedValue({ values: [] });
      const empty = await svc.queryOne('SELECT * FROM test');
      expect(empty).toBeNull();
    });
  });

  describe('transaction', () => {
    beforeEach(async () => {
      mockIsConnection.mockResolvedValue({ result: false });
      await svc.initialize();
    });

    it('commits on success', async () => {
      await svc.transaction(async () => {
        await svc.execute('INSERT INTO test VALUES (?)', ['a']);
      });
      expect(mockBeginTransaction).toHaveBeenCalled();
      expect(mockCommitTransaction).toHaveBeenCalled();
      expect(mockRollbackTransaction).not.toHaveBeenCalled();
    });

    it('rolls back on error', async () => {
      await expect(
        svc.transaction(async () => {
          throw new Error('fail');
        }),
      ).rejects.toThrow('fail');
      expect(mockBeginTransaction).toHaveBeenCalled();
      expect(mockRollbackTransaction).toHaveBeenCalled();
      expect(mockCommitTransaction).not.toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('closes connection', async () => {
      mockIsConnection.mockResolvedValue({ result: false });
      await svc.initialize();
      await svc.close();
      expect(mockClose).toHaveBeenCalledWith({ database: 'mealplanner' });
    });
  });

  describe('exportToJSON / importFromJSON', () => {
    beforeEach(async () => {
      mockIsConnection.mockResolvedValue({ result: false });
      await svc.initialize();
    });

    it('exportToJSON queries all SCHEMA_TABLES', async () => {
      mockQuery.mockResolvedValue({ values: [] });
      const json = await svc.exportToJSON();
      const parsed = JSON.parse(json);
      expect(parsed._version).toBe('2.0');
      expect(parsed._format).toBe('sqlite-json');
      expect(parsed.tables).toBeDefined();
    });

    it('importFromJSON processes V2ExportPayload', async () => {
      const payload = JSON.stringify({
        _version: '2.0',
        _exportedAt: '2026-01-01',
        _format: 'sqlite-json',
        tables: { ingredients: [{ id: 'i1', name_vi: 'Test' }] },
      });
      await svc.importFromJSON(payload);
      // Should have called execute for PRAGMA, DROP, schema, INSERT
      expect(mockExecute.mock.calls.length).toBeGreaterThan(0);
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/nativeDatabaseService.test.ts`
Expected: FAIL — `NativeDatabaseService` doesn't exist yet

- [ ] **Step 4: Implement NativeDatabaseService**

Add to `src/services/databaseService.ts` (before the factory function):

```typescript
/* ------------------------------------------------------------------ */
/* Native implementation (@capacitor-community/sqlite)                */
/* ------------------------------------------------------------------ */
export class NativeDatabaseService implements DatabaseService {
  private readonly dbName = 'mealplanner';
  private inTransaction = false;

  async initialize(): Promise<void> {
    const { CapacitorSQLite } = await import('@capacitor-community/sqlite');
    const { result } = await CapacitorSQLite.isConnection({ database: this.dbName });
    if (result) {
      await CapacitorSQLite.retrieveConnection({ database: this.dbName });
    } else {
      await CapacitorSQLite.createConnection({
        database: this.dbName,
        encrypted: false,
        mode: 'no-encryption',
        version: 1,
        readonly: false,
      });
    }
    await CapacitorSQLite.open({ database: this.dbName });
  }

  async execute(sql: string, params?: unknown[]): Promise<void> {
    const { CapacitorSQLite } = await import('@capacitor-community/sqlite');
    if (params && params.length > 0) {
      await CapacitorSQLite.run({
        database: this.dbName,
        statement: sql,
        values: params as (string | number | null)[],
        transaction: !this.inTransaction,
      });
    } else {
      await CapacitorSQLite.execute({
        database: this.dbName,
        statements: sql,
        transaction: !this.inTransaction,
      });
    }
  }

  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const { CapacitorSQLite } = await import('@capacitor-community/sqlite');
    const result = await CapacitorSQLite.query({
      database: this.dbName,
      statement: sql,
      values: (params as (string | number | null)[]) ?? [],
    });
    if (!result.values || result.values.length === 0) return [];
    return result.values.map(row => rowToType<T>(row as Record<string, unknown>));
  }

  async queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  async transaction(fn: () => Promise<void>): Promise<void> {
    const { CapacitorSQLite } = await import('@capacitor-community/sqlite');
    await CapacitorSQLite.beginTransaction({ database: this.dbName });
    this.inTransaction = true;
    try {
      await fn();
      await CapacitorSQLite.commitTransaction({ database: this.dbName });
    } catch (error) {
      await CapacitorSQLite.rollbackTransaction({ database: this.dbName });
      throw error;
    } finally {
      this.inTransaction = false;
    }
  }

  async exportToJSON(): Promise<string> {
    const { SCHEMA_TABLES } = await import('./schema');
    const tables: Record<string, unknown[]> = {};
    for (const tableName of SCHEMA_TABLES) {
      const rows = await this.query(`SELECT * FROM "${tableName}"`);
      // rows already camelCase from rowToType — convert back to snake_case for export
      tables[tableName] = rows.map(row => typeToRow(row as Record<string, unknown>));
    }
    return JSON.stringify({
      _version: '2.0',
      _exportedAt: new Date().toISOString(),
      _format: 'sqlite-json',
      tables,
    });
  }

  async importFromJSON(json: string): Promise<void> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('invalid JSON string');
    }

    let tables: Record<string, unknown[]>;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      '_version' in parsed &&
      (parsed as Record<string, unknown>)._version === '2.0'
    ) {
      tables = (parsed as { tables: Record<string, unknown[]> }).tables ?? {};
    } else {
      tables = parsed as Record<string, unknown[]>;
    }

    await this.execute('PRAGMA foreign_keys = OFF');

    const { IMPORT_ORDER } = await import('./syncV2Utils');
    const reverseOrder = [...IMPORT_ORDER].reverse();
    for (const t of reverseOrder) {
      await this.execute(`DROP TABLE IF EXISTS "${t}"`);
    }

    const { createSchema } = await import('./schema');
    await createSchema(this);

    await this.execute('PRAGMA foreign_keys = ON');

    for (const tableName of IMPORT_ORDER) {
      const rows = tables[tableName];
      if (!Array.isArray(rows) || rows.length === 0) continue;
      for (const row of rows) {
        const obj = row as Record<string, unknown>;
        const columns = Object.keys(obj);
        if (columns.length === 0) continue;
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(c => obj[c] ?? null);
        const columnList = columns.map(c => `"${c}"`).join(', ');
        await this.execute(`INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders})`, values);
      }
    }
  }

  async close(): Promise<void> {
    const { CapacitorSQLite } = await import('@capacitor-community/sqlite');
    await CapacitorSQLite.close({ database: this.dbName });
  }
}
```

- [ ] **Step 5: Update factory with platform detection (ESM-safe)**

Add ESM import at top of `src/services/databaseService.ts`:

```typescript
import { Capacitor } from '@capacitor/core';
```

Replace factory function:

```typescript
export function createDatabaseService(): DatabaseService {
  if (Capacitor.isNativePlatform()) {
    return new NativeDatabaseService();
  }
  return new WebDatabaseService();
}
```

Note: `@capacitor/core` is already a project dependency (used in DataBackup.tsx, etc). In Vitest, `Capacitor.isNativePlatform()` returns `false` by default (or is mocked), so WebDatabaseService is always used in tests. No `require()` — fully ESM-compatible.

- [ ] **Step 6: Update capacitor.config.ts**

Add CapacitorSQLite plugin config:

```typescript
plugins: {
  SocialLogin: {
    providers: {
      google: true,
    },
  },
  CapacitorSQLite: {
    iosDatabaseLocation: 'Library/CapacitorDatabase',
    iosIsEncryption: false,
    androidIsEncryption: false,
  },
},
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/nativeDatabaseService.test.ts`
Expected: ALL PASS

- [ ] **Step 8: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: add NativeDatabaseService with @capacitor-community/sqlite

- NativeDatabaseService: full DatabaseService implementation using native plugin
- Factory: auto-detect platform (native → NativeDatabaseService, web → WebDatabaseService)
- CapacitorSQLite plugin config in capacitor.config.ts
- Complete test suite with mocked plugin

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

- [ ] **Step 10: Add round-trip integration test (Web export → Native import)**

Add to `src/__tests__/nativeDatabaseService.test.ts`:

```typescript
describe('cross-implementation round-trip', () => {
  it('NativeDatabaseService imports data exported by WebDatabaseService format', async () => {
    // Simulate a V2ExportPayload as WebDatabaseService would produce
    const webExport = JSON.stringify({
      _version: '2.0',
      _exportedAt: '2026-04-04T00:00:00Z',
      _format: 'sqlite-json',
      tables: {
        ingredients: [
          {
            id: 'i1',
            name_vi: 'Gà',
            name_en: 'Chicken',
            calories_per_100: 165,
            protein_per_100: 31,
            carbs_per_100: 0,
            fat_per_100: 4,
            fiber_per_100: 0,
            unit_vi: 'g',
            unit_en: 'g',
          },
        ],
        dishes: [{ id: 'd1', name_vi: 'Gà áp chảo', name_en: null, tags: '["lunch"]', rating: null, notes: null }],
        dish_ingredients: [{ dish_id: 'd1', ingredient_id: 'i1', amount: 200 }],
      },
    });

    mockIsConnection.mockResolvedValue({ result: false });
    await svc.initialize();

    // importFromJSON should process the payload without errors
    await svc.importFromJSON(webExport);

    // Verify execute was called for PRAGMA, DROP, schema creation, and INSERT
    const executeCalls = mockExecute.mock.calls.map(c => c[0]?.statements ?? '');
    const runCalls = mockRun.mock.calls.map(c => c[0]?.statement ?? '');

    // Should have FK pragma calls
    expect(executeCalls.some((s: string) => s.includes('foreign_keys = OFF'))).toBe(true);
    expect(executeCalls.some((s: string) => s.includes('foreign_keys = ON'))).toBe(true);

    // Should have INSERT calls for the 3 tables with data
    const insertCalls = runCalls.filter((s: string) => s.startsWith('INSERT'));
    expect(insertCalls.length).toBe(3); // i1, d1, di
  });

  it('NativeDatabaseService export produces same V2 envelope format', async () => {
    mockIsConnection.mockResolvedValue({ result: false });
    await svc.initialize();
    mockQuery.mockResolvedValue({ values: [] });

    const json = await svc.exportToJSON();
    const parsed = JSON.parse(json);

    // Same envelope as WebDatabaseService
    expect(parsed._version).toBe('2.0');
    expect(parsed._format).toBe('sqlite-json');
    expect(typeof parsed._exportedAt).toBe('string');
    expect(typeof parsed.tables).toBe('object');
  });
});
```

- [ ] **Step 11: Run integration test**

Run: `npx vitest run src/__tests__/nativeDatabaseService.test.ts`
Expected: ALL PASS

- [ ] **Step 12: Commit**

```bash
git add -A && git commit -m "test: add cross-implementation round-trip integration test

Verifies Web → Native JSON contract compatibility.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 6: Update Sync Consumers (binary → JSON)

**Files:**

- Modify: `src/services/googleDriveService.ts`
- Modify: `src/hooks/useAutoSync.ts`
- Modify: `src/components/GoogleDriveSync.tsx`
- Modify: `src/components/DataBackup.tsx`
- Modify: `src/__tests__/useAutoSync.test.tsx`
- Modify: `src/__tests__/googleDriveSync.test.tsx`
- Modify: `src/__tests__/dataBackup.test.tsx`

- [ ] **Step 1: Update googleDriveService.ts**

Changes:

1. Line 3: `BACKUP_FILE_NAME = 'meal-planner-backup.json'`
2. `downloadBackup`: return `string` instead of `Uint8Array`

```typescript
export const downloadBackup = async (accessToken: string, fileId: string): Promise<string> => {
  const res = await fetch(`${DRIVE_API}/${fileId}?alt=media`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
  return res.text();
};
```

3. `downloadLatestBackup`: return type `{ data: string; file: DriveFileInfo }`
4. `uploadBackup`: accept `string` instead of `Uint8Array`

```typescript
export const uploadBackup = async (accessToken: string, data: string): Promise<DriveFileInfo> => {
  const existing = await listBackups(accessToken);

  if (existing.length > 0) {
    const fileId = existing[0].id;
    const res = await fetch(`${DRIVE_UPLOAD_API}/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        ...authHeaders(accessToken),
        'Content-Type': 'application/json',
      },
      body: data,
    });
    if (!res.ok) throw new Error(`Drive update failed: ${res.status}`);
    return res.json();
  }

  const boundary = '___meal_planner_boundary___';
  const metadata = {
    name: BACKUP_FILE_NAME,
    mimeType: 'application/json',
    parents: ['appDataFolder'],
  };
  const body = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n`,
    data,
    `\r\n--${boundary}--`,
  ].join('');

  const res = await fetch(`${DRIVE_UPLOAD_API}?uploadType=multipart`, {
    method: 'POST',
    headers: {
      ...authHeaders(accessToken),
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`);
  return res.json();
};
```

- [ ] **Step 2: Update useAutoSync.ts**

Line 58: `const data = dbRef.current.exportBinary()` → `const data = await dbRef.current.exportToJSON()`
Line 75: `await dbRef.current.importBinary(result.data)` → `await dbRef.current.importFromJSON(result.data)`
Line 96: `await dbRef.current.importBinary(result.data)` → `await dbRef.current.importFromJSON(result.data)`

- [ ] **Step 3: Update GoogleDriveSync.tsx**

Line 22-25: Change `conflictData` state type:

```typescript
const [conflictData, setConflictData] = useState<{
  remoteData: string;
  remoteModifiedTime: string;
} | null>(null);
```

Line 65: `const data = db.exportBinary()` → `const data = await db.exportToJSON()`
Line 98: `await db.importBinary(result.data)` → `await db.importFromJSON(result.data)`
Line 113: `await db.importBinary(conflictData.remoteData)` → `await db.importFromJSON(conflictData.remoteData)`

- [ ] **Step 4: Update DataBackup.tsx**

Major changes:

1. Line 52: `exportFileName` → `.json` extension
2. Line 99: `pendingImport` type → `{ data: string; fileName: string }`
3. `exportWeb`: Blob type → `application/json`, data is string
4. `exportNative`: Base64 encode the string
5. `handleExport`: `db.exportBinary()` → `await db.exportToJSON()`
6. `handleImport`: Read file as text, validate JSON, remove SQLite header check
7. `confirmImport`: `db.importBinary` → `db.importFromJSON`
8. File input `accept`: `.json` instead of `.sqlite,.db`

- [ ] **Step 5: Update test files**

Update `src/__tests__/useAutoSync.test.tsx`:

- Mock `exportToJSON` (returns string) instead of `exportBinary` (returns Uint8Array)
- Mock `importFromJSON` instead of `importBinary`
- Update assertions: `expect(mockDb.exportToJSON)` / `expect(mockDb.importFromJSON)`
- Update `driveService` mock download to return `{ data: '{}', file: {...} }` (string)
- Update `driveService` mock upload to accept string

Update `src/__tests__/googleDriveSync.test.tsx`:

- Same pattern as useAutoSync
- `conflictData` uses `string` for `remoteData`

Update `src/__tests__/dataBackup.test.tsx`:

- Mock `exportToJSON` instead of `exportBinary`
- Mock `importFromJSON` instead of `importBinary`
- Update file handling: JSON instead of binary
- Remove SQLite header validation tests
- Add JSON validation tests

- [ ] **Step 6: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: migrate all sync/backup from binary to JSON format

- googleDriveService: Uint8Array → string, application/json MIME
- useAutoSync: exportToJSON/importFromJSON
- GoogleDriveSync: same + conflictData type string
- DataBackup: JSON export/import, .json extension
- All tests updated

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 7: Quality Gates

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Expected: 0 errors

- [ ] **Step 2: Run tests with coverage**

```bash
npm run test:coverage
```

Expected: 0 failures, 100% coverage for new code

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: Clean build

- [ ] **Step 4: Fix any issues found in steps 1-3**

Iterate until all gates pass.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A && git commit -m "fix: quality gate fixes

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 8: Android Sync + Build APK

- [ ] **Step 1: Sync Android project**

```bash
npx cap sync android
```

Expected: Success. Verify `@capacitor-community/sqlite` plugin registered.

- [ ] **Step 2: Build debug APK**

```bash
cd android && ./gradlew assembleDebug
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit if any Android config changes needed**

---

## Task 9: Emulator Verification

- [ ] **Step 1: Install APK on emulator**

```bash
adb -s emulator-5556 install -r android/app/build/outputs/apk/debug/app-debug.apk
```

- [ ] **Step 2: Test app launch + fresh onboarding**

1. `pm clear com.mealplaner.app`
2. Launch app
3. Complete onboarding
4. Verify seed data loaded

- [ ] **Step 3: Test persistence after force-stop**

1. Force-stop: `am force-stop com.mealplaner.app`
2. Relaunch
3. Verify data persists (ingredients, dishes, health profile, meals)
4. This is THE KEY TEST — previously data was lost

- [ ] **Step 4: Test JSON export/import**

1. Navigate to Settings → Data Backup
2. Export backup (verify .json download)
3. Clear app data → restart → import backup
4. Verify data restored

- [ ] **Step 5: Screenshot evidence**

Save screenshots proving:

- App loads with data after force-stop
- JSON backup exports/imports successfully

---

## Task 10: Update Memory + Final Commit

- [ ] **Step 1: Update memory files**

Append to `.github/instructions/memory/emulator-testing.instructions.md` (and other relevant files):

- Native SQLite connection patterns
- importFromJSON FK-safe pattern
- Plugin execute vs run gotchas
- Anything learned during implementation

- [ ] **Step 2: Final commit**

```bash
git add -A && git commit -m "docs: update memory with SQLite migration lessons

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Dependency Graph

```
Task 1 (interface) → Task 2 (importFromJSON) → Task 3 (DatabaseContext)
                                              → Task 4 (update mocks)
Task 4 → Task 5 (NativeDatabaseService + round-trip test)
Task 5 → Task 6 (sync consumers)
Task 6 → Task 7 (quality gates)
Task 7 → Task 8 (Android build)
Task 8 → Task 9 (emulator test)
Task 9 → Task 10 (memory)
```

Tasks 2, 3, 4 can partially parallelize after Task 1.
Tasks 1-6 are code changes. Tasks 7-10 are verification.
