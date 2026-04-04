/* ------------------------------------------------------------------ */
/* Public interface */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* Key conversion helpers */
/* ------------------------------------------------------------------ */
export function snakeToCamel(str: string): string {
  return str.replaceAll(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function camelToSnake(str: string): string {
  return str.replaceAll(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function rowToType<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    result[snakeToCamel(key)] = row[key];
  }
  return result as T;
}

export function typeToRow<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    result[camelToSnake(key)] = obj[key];
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* sql.js re-exports (types declared in src/sql-js.d.ts) */
/* ------------------------------------------------------------------ */
import type { Database as SqlJsDatabase } from 'sql.js';
import type initSqlJsType from 'sql.js';

/* ------------------------------------------------------------------ */
/* Web implementation (sql.js WASM) */
/* ------------------------------------------------------------------ */
class WebDatabaseService implements DatabaseService {
  private db: SqlJsDatabase | null = null;
  private SQL: Awaited<ReturnType<typeof initSqlJsType>> | null = null;

  async initialize(): Promise<void> {
    const initSqlJs: typeof initSqlJsType = (await import('sql.js')).default;
    const SQL = await initSqlJs({
      locateFile: (file: string) => `/wasm/${file}`,
    });
    this.SQL = SQL;
    this.db = new SQL.Database();
  }

  private getDb(): SqlJsDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  async execute(sql: string, params?: unknown[]): Promise<void> {
    try {
      this.getDb().run(sql, params);
    } catch (error) {
      throw new Error(`SQL execute error: ${error instanceof Error ? error.message : String(error)} | SQL: ${sql}`, {
        cause: error,
      });
    }
  }

  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    try {
      const results = this.getDb().exec(sql, params);
      if (results.length === 0) return [];
      const { columns, values } = results[0];
      return values.map(row => {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return rowToType<T>(obj);
      });
    } catch (error) {
      throw new Error(`SQL query error: ${error instanceof Error ? error.message : String(error)} | SQL: ${sql}`, {
        cause: error,
      });
    }
  }

  async queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async transaction(fn: () => Promise<void>): Promise<void> {
    const db = this.getDb();
    db.run('BEGIN TRANSACTION');
    try {
      await fn();
      db.run('COMMIT');
    } catch (error) {
      db.run('ROLLBACK');
      throw error;
    }
  }

  async close(): Promise<void> {
    this.db?.close();
    this.db = null;
  }

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
        db.run(`INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders})`, values);
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* Factory */
/* ------------------------------------------------------------------ */
export function createDatabaseService(): DatabaseService {
  // sql.js (WASM) works in both web browsers and Capacitor WebViews,
  // so we use WebDatabaseService universally until a native SQLite
  // plugin is integrated for better performance on mobile.
  return new WebDatabaseService();
}
