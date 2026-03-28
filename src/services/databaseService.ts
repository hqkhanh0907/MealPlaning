import { Capacitor } from '@capacitor/core';

/* ------------------------------------------------------------------ */
/*  Public interface                                                    */
/* ------------------------------------------------------------------ */
export interface DatabaseService {
  initialize(): Promise<void>;
  execute(sql: string, params?: unknown[]): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>;
  transaction(fn: () => Promise<void>): Promise<void>;
  exportBinary(): Uint8Array;
  importBinary(data: Uint8Array): Promise<void>;
}

/* ------------------------------------------------------------------ */
/*  Key conversion helpers                                              */
/* ------------------------------------------------------------------ */
export function snakeToCamel(str: string): string {
  return str.replaceAll(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function camelToSnake(str: string): string {
  return str.replaceAll(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
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
/*  sql.js re-exports (types declared in src/sql-js.d.ts)               */
/* ------------------------------------------------------------------ */
import type { Database as SqlJsDatabase } from 'sql.js';
import type initSqlJsType from 'sql.js';

/* ------------------------------------------------------------------ */
/*  Web implementation (sql.js WASM)                                    */
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
      throw new Error(
        `SQL execute error: ${error instanceof Error ? error.message : String(error)} | SQL: ${sql}`,
        { cause: error },
      );
    }
  }

  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    try {
      const results = this.getDb().exec(sql, params);
      if (results.length === 0) return [];
      const { columns, values } = results[0];
      return values.map((row) => {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return rowToType<T>(obj);
      });
    } catch (error) {
      throw new Error(
        `SQL query error: ${error instanceof Error ? error.message : String(error)} | SQL: ${sql}`,
        { cause: error },
      );
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

  exportBinary(): Uint8Array {
    return this.getDb().export();
  }

  async importBinary(data: Uint8Array): Promise<void> {
    if (!this.SQL) throw new Error('SQL.js not loaded');
    this.db?.close();
    this.db = new this.SQL.Database(data);
  }
}

/* ------------------------------------------------------------------ */
/*  Native stub (Capacitor SQLite – future implementation)              */
/* ------------------------------------------------------------------ */
class NativeDatabaseService implements DatabaseService {
  async initialize(): Promise<void> {
    throw new Error('Not implemented on native platform');
  }
  async execute(): Promise<void> {
    throw new Error('Not implemented on native platform');
  }
  async query<T>(): Promise<T[]> {
    throw new Error('Not implemented on native platform');
  }
  async queryOne<T>(): Promise<T | null> {
    throw new Error('Not implemented on native platform');
  }
  async transaction(): Promise<void> {
    throw new Error('Not implemented on native platform');
  }
  exportBinary(): Uint8Array {
    throw new Error('Not implemented on native platform');
  }
  async importBinary(): Promise<void> {
    throw new Error('Not implemented on native platform');
  }
}

/* ------------------------------------------------------------------ */
/*  Factory                                                             */
/* ------------------------------------------------------------------ */
export function createDatabaseService(): DatabaseService {
  if (Capacitor.isNativePlatform()) {
    return new NativeDatabaseService();
  }
  return new WebDatabaseService();
}
