# Design: Migrate sql.js → @capacitor-community/sqlite

> Date: 2026-04-04  
> Status: Draft  
> App: MealPlaning (React 19 + Capacitor 8 Android)

## Problem

App dùng `sql.js` WASM tạo SQLite database **trong bộ nhớ** (`new SQL.Database()`). Data mất khi force-stop hoặc restart. Cần chuyển sang native SQLite plugin để data persist trên filesystem.

## Constraints

- App **chưa production** → không cần backward compat cho old binary backups.
- Schema migrations VẪN CẦN cho persistent DB (app upgrades thay đổi schema).
- JSON backup format cần versioning để tương thích tương lai.
- Vitest tests chạy trên Node.js → **giữ sql.js** cho test environment.
- Android native → dùng `@capacitor-community/sqlite` (v8.1.0, Capacitor 8 compatible).

## Architecture

```
                    DatabaseService (interface)
                    /                         \
    WebDatabaseService                NativeDatabaseService (NEW)
    (sql.js WASM)                     (@capacitor-community/sqlite)
    - Used: web dev, Vitest           - Used: Android production
    - In-memory (no persist)          - On-disk (persistent!)
```

### Factory

```typescript
export function createDatabaseService(): DatabaseService {
  if (Capacitor.isNativePlatform()) {
    return new NativeDatabaseService();
  }
  return new WebDatabaseService();
}
```

## Interface Changes

### Remove

```typescript
// REMOVED — chưa production, không cần binary format
exportBinary(): Uint8Array;
importBinary(data: Uint8Array): Promise<void>;
```

### Add

```typescript
// NEW — cleanup on unmount
close(): Promise<void>;
```

### Updated Interface

```typescript
export interface DatabaseService {
  initialize(): Promise<void>;
  execute(sql: string, params?: unknown[]): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>;
  transaction(fn: () => Promise<void>): Promise<void>;
  exportToJSON(): Promise<string>;
  importFromJSON(json: string): Promise<void>;
  close(): Promise<void>;
}
```

## NativeDatabaseService Implementation

### Plugin API Mapping

| Interface Method        | Plugin API                                                                      | Notes                              |
| ----------------------- | ------------------------------------------------------------------------------- | ---------------------------------- |
| `initialize()`          | `createConnection()` → `open()`                                                 | DB name: `mealplanner`             |
| `execute(sql)`          | `sqlite.execute({statements: sql})`                                             | DDL, PRAGMA, no params             |
| `execute(sql, params)`  | `sqlite.run({statement: sql, values: params, transaction: !inTx})`              | DML with params                    |
| `query(sql, params)`    | `sqlite.query({statement: sql, values: params})`                                | Returns `{values: [{col:val}...]}` |
| `queryOne(sql, params)` | `query()[0] ?? null`                                                            |                                    |
| `transaction(fn)`       | `beginTransaction()` → `fn()` → `commitTransaction()` / `rollbackTransaction()` |                                    |
| `exportToJSON()`        | Iterate SCHEMA_TABLES via `query()` → JSON string                               | Same logic as WebDatabaseService   |
| `importFromJSON(json)`  | DROP tables → `createSchema()` → INSERT data                                    | Schema-first approach              |
| `close()`               | `closeConnection()`                                                             |                                    |

### Transaction Tracking

Plugin's `run()` wraps each call in its own transaction by default (`transaction: true`). Inside our explicit transaction, this causes nested transaction errors.

**Solution**: Track `inTransaction` state. When active, pass `transaction: false` to `run()`.

```typescript
class NativeDatabaseService implements DatabaseService {
  private inTransaction = false;

  async execute(sql: string, params?: unknown[]): Promise<void> {
    if (params && params.length > 0) {
      await this.sqlite.run({
        database: this.dbName,
        statement: sql,
        values: params as (string | number | null)[],
        transaction: !this.inTransaction,
      });
    } else {
      await this.sqlite.execute({
        database: this.dbName,
        statements: sql,
        transaction: !this.inTransaction,
      });
    }
  }

  async transaction(fn: () => Promise<void>): Promise<void> {
    await this.sqlite.beginTransaction({ database: this.dbName });
    this.inTransaction = true;
    try {
      await fn();
      await this.sqlite.commitTransaction({ database: this.dbName });
    } catch (error) {
      await this.sqlite.rollbackTransaction({ database: this.dbName });
      throw error;
    } finally {
      this.inTransaction = false;
    }
  }
}
```

### Query Result Mapping

Plugin `query()` returns objects with original column names (snake_case). Same as sql.js after we build objects from columns+values. Both pass through `rowToType<T>()` for camelCase conversion.

```typescript
async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
  const result = await this.sqlite.query({
    database: this.dbName,
    statement: sql,
    values: (params as (string | number | null)[]) ?? [],
  });
  if (!result.values || result.values.length === 0) return [];
  return result.values.map(row => rowToType<T>(row as Record<string, unknown>));
}
```

## Fix: importFromJSON

### Current (BROKEN for persistent DB)

```typescript
// Drops ALL tables → recreates with ALL columns as TEXT
// Loses: types, constraints, indexes, foreign keys
db.run(`CREATE TABLE "${tableName}" (${columns.map(c => `"${c}" TEXT`).join(', ')})`);
```

### Fixed (Schema-first, FK-safe)

```typescript
async importFromJSON(json: string): Promise<void> {
  const data = JSON.parse(json) as Record<string, unknown[]>;

  // 1. Disable FK constraints during reset
  await this.execute('PRAGMA foreign_keys = OFF');

  // 2. Drop existing tables in reverse dependency order
  const reverseOrder = [...FULL_IMPORT_ORDER].reverse();
  for (const t of reverseOrder) {
    await this.execute(`DROP TABLE IF EXISTS "${t}"`);
  }

  // 3. Recreate schema with proper types/constraints
  await createSchema(this);

  // 4. Re-enable FK constraints
  await this.execute('PRAGMA foreign_keys = ON');

  // 5. Insert data in forward dependency order (parents before children)
  for (const tableName of FULL_IMPORT_ORDER) {
    const rows = data[tableName];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    for (const row of rows) {
      const obj = row as Record<string, unknown>;
      const columns = Object.keys(obj);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(c => obj[c] ?? null);
      const columnList = columns.map(c => `"${c}"`).join(', ');
      await this.execute(
        `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders})`, values
      );
    }
  }
}
```

**Key points:**

- `PRAGMA foreign_keys = OFF` before drop (avoids FK constraint errors)
- Drop in reverse dependency order (children before parents)
- `createSchema()` recreates with proper types, constraints, indexes
- Insert in forward dependency order (parents before children)

## Fix: IMPORT_ORDER in syncV2Utils.ts

Add 6 missing tables (no FK dependencies, safe to add at end):

```typescript
const IMPORT_ORDER: readonly string[] = [
  // ... existing 16 tables ...
  'fitness_profiles',
  'fitness_preferences',
  'workout_drafts',
  'app_settings',
  'grocery_checked',
  'plan_templates',
] as const;
```

## Fix: DatabaseContext

### Startup Order (CRITICAL — must check version BEFORE createSchema)

`createSchema()` sets `PRAGMA user_version = 5` unconditionally. On a persistent DB with version 3, this would skip migrations v3→v4→v5. **Must run migrations FIRST.**

```typescript
// CORRECT startup order:
const version = await getSchemaVersion(service);
if (version === 0) {
  // Fresh DB — create schema from scratch
  await createSchema(service);
} else {
  // Existing DB — run migrations first, then ensure all tables exist
  await runSchemaMigrations(service);
  await createSchema(service); // CREATE TABLE IF NOT EXISTS — safe, adds any new tables
}
```

### Add cleanup on unmount (connection lifecycle)

Native SQLite connections must be closed. Also guard against StrictMode double-mount and race conditions:

```typescript
useEffect(() => {
  let cancelled = false;
  const service = createDatabaseService();

  service
    .initialize()
    .then(async () => {
      const version = await getSchemaVersion(service);
      if (version === 0) {
        await createSchema(service);
      } else {
        await runSchemaMigrations(service);
        await createSchema(service);
      }
      // ... load stores ...
      if (!cancelled) setDb(service);
    })
    .catch(err => {
      if (!cancelled) setError(err.message);
    });

  return () => {
    cancelled = true;
    service.close().catch(() => {});
  };
}, []);
```

### Native Connection Reuse (StrictMode / HMR)

Capacitor SQLite fails on duplicate `createConnection()` calls. `NativeDatabaseService.initialize()` must check for existing connection:

```typescript
async initialize(): Promise<void> {
  const { result } = await this.sqlite.isConnection({ database: this.dbName });
  if (result) {
    // Reuse existing connection
    this.connection = await this.sqlite.retrieveConnection({ database: this.dbName });
  } else {
    this.connection = await this.sqlite.createConnection({
      database: this.dbName,
      encrypted: false,
      mode: 'no-encryption',
      version: 1,
      readonly: false,
    });
  }
  await this.sqlite.open({ database: this.dbName });
}
```

## Sync Consumer Updates

### Canonical JSON Format

One format everywhere — `V2ExportPayload` from `syncV2Utils.ts`:

```typescript
interface V2ExportPayload {
  _version: '2.0';
  _exportedAt: string;
  _format: 'sqlite-json';
  tables: Record<string, unknown[]>;
}
```

Both `exportToJSON()` and sync/backup use this envelope format. `importFromJSON()` accepts the full payload (extracts `tables` field) or raw `Record<string, unknown[]>` for backward compat.

### Before (binary)

```typescript
// useAutoSync.ts
const data = dbRef.current.exportBinary(); // Uint8Array
await driveService.uploadBackup(accessToken, data);

// Download
await dbRef.current.importBinary(result.data); // Uint8Array
```

### After (JSON)

```typescript
// useAutoSync.ts
const json = await dbRef.current.exportToJSON(); // string
await driveService.uploadBackup(accessToken, json);

// Download
await dbRef.current.importFromJSON(result.data); // string
```

### googleDriveService.ts Changes

- `uploadBackup(token, data: string)` — change `Uint8Array` → `string`
- `downloadLatestBackup()` returns `string` instead of `Uint8Array`
- Upload as `application/json` instead of `application/octet-stream`
- Filename: `meal-planner-backup.json` (was `.sqlite`)

### DataBackup.tsx Changes

- Export: download `.json` file instead of `.sqlite`
- Import: accept `.json` files, parse as JSON
- Remove SQLite header validation (`SQLite format 3\0`)

### SyncConflictModal

- `remoteData: string` instead of `Uint8Array`

## Files Changed

| File                                          | Change                                                                            |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/services/databaseService.ts`             | Remove binary methods, add close(), fix importFromJSON, add NativeDatabaseService |
| `src/services/syncV2Utils.ts`                 | Extend IMPORT_ORDER                                                               |
| `src/contexts/DatabaseContext.tsx`            | Add runSchemaMigrations, close cleanup                                            |
| `src/services/googleDriveService.ts`          | String instead of Uint8Array                                                      |
| `src/hooks/useAutoSync.ts`                    | exportToJSON/importFromJSON                                                       |
| `src/components/GoogleDriveSync.tsx`          | exportToJSON/importFromJSON                                                       |
| `src/components/DataBackup.tsx`               | JSON export/import                                                                |
| `src/components/modals/SyncConflictModal.tsx` | remoteData: string                                                                |
| `capacitor.config.ts`                         | CapacitorSQLite plugin settings                                                   |
| `~14 test files`                              | Update mocks (remove binary, add close)                                           |

## Testing Strategy

1. **Unit tests (Vitest)**: Mock plugin, test NativeDatabaseService methods
2. **Integration tests**: Round-trip web export → native import
3. **Emulator test**: Build APK → test persistence after force-stop/restart
4. **Sync test**: Export JSON → upload → download → import → verify data

## Capacitor Config

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  // ... existing config ...
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      androidIsEncryption: false,
    },
  },
};
```
