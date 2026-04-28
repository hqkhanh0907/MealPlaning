import { Injectable } from '@angular/core';
import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import { Database } from './database';
import { environment } from '../../../../environments/environment';
import { MigrationRunner } from './migration-runner';
import { MIGRATION_REGISTRY } from './migrations';

/**
 * Web implementation of DatabaseService using sql.js (WASM).
 * Used for browser development (`ionic serve`) and unit tests.
 */
@Injectable()
export class WebDatabase extends Database {
  private db: SqlJsDatabase | null = null;

  override async initialize(): Promise<void> {
    try {
      const SQL = await initSqlJs({
        // sql.js WASM binary — loaded from node_modules via Angular assets config
        locateFile: (file: string) => `assets/sql.js/${file}`,
      });

      // Try to restore from localStorage
      const saved = localStorage.getItem(`sqljs_${environment.dbName}`);
      if (saved) {
        const buf = Uint8Array.from(atob(saved), (c) => c.charCodeAt(0));
        this.db = new SQL.Database(buf);
      } else {
        this.db = new SQL.Database();
      }

      // Enable foreign keys and run schema migrations
      this.db.run('PRAGMA foreign_keys = ON;');
      await new MigrationRunner(this, MIGRATION_REGISTRY).run();

      this.persist();
    } catch (error) {
      console.error('WebDatabaseService: initialization failed', error);
      throw new Error(
        `Database initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  override async execute(sql: string, params?: unknown[]): Promise<void> {
    this.ensureDb();
    this.db!.run(sql, params as (string | number | null | Uint8Array)[]);
    this.persist();
  }

  override async withTransaction<T>(callback: () => Promise<T>): Promise<T> {
    this.ensureDb();
    this.db!.run('BEGIN');
    try {
      const result = await callback();
      this.db!.run('COMMIT');
      this.persist();
      return result;
    } catch (error) {
      this.db!.run('ROLLBACK');
      throw error;
    }
  }

  override async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    this.ensureDb();
    const stmt = this.db!.prepare(sql);
    if (params) {
      stmt.bind(params as (string | number | null | Uint8Array)[]);
    }

    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  }

  override async getOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Persist database to localStorage so data survives page refresh
   * during development. Not used in production (Android uses native SQLite).
   */
  private persist(): void {
    if (!this.db) return;
    const data = this.db.export();
    const base64 = this.uint8ToBase64(data);
    try {
      localStorage.setItem(`sqljs_${environment.dbName}`, base64);
    } catch {
      // localStorage quota exceeded — non-critical in dev
      console.warn('WebDatabaseService: localStorage quota exceeded, data not persisted.');
    }
  }

  /**
   * Convert Uint8Array to base64 without spread operator.
   * Avoids "Maximum call stack size exceeded" for large databases.
   */
  private uint8ToBase64(data: Uint8Array): string {
    const CHUNK_SIZE = 8192;
    let binary = '';
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.subarray(i, i + CHUNK_SIZE);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  }

  private ensureDb(): void {
    if (!this.db) {
      throw new Error('WebDatabaseService: database not initialized. Call initialize() first.');
    }
  }
}
