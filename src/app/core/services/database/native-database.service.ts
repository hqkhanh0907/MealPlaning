/**
 * Native implementation of DatabaseService using @capacitor-community/sqlite.
 *
 * Persists to the native Android/iOS SQLite file in app-private storage
 * (no WebView localStorage involvement), so data survives WebView cache
 * clears and respects native app-data lifecycle.
 *
 * Initialization is idempotent and safe against repeat-calls caused by
 * hot-reload, Angular zone reruns, or Capacitor app resume.
 */
import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { DatabaseService } from './database.service';
import { SCHEMA_DDL, SCHEMA_VERSION } from './schema';
import { environment } from '../../../../environments/environment';

// Capacitor SQLite requires a non-"-" database filename; strip the `.db` it appends.
const DB_NAME = environment.dbName.replace(/\.db$/, '');
const DB_ENCRYPTED = false;
const DB_MODE = 'no-encryption';
const DB_READONLY = false;

type Primitive = string | number | boolean | null;
type SqlParam = Primitive | Uint8Array;

@Injectable()
export class NativeDatabaseService extends DatabaseService {
  private readonly sqlite = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private initPromise: Promise<void> | null = null;

  override initialize(): Promise<void> {
    // Cache the in-flight promise so concurrent callers share the same work.
    this.initPromise ??= this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      // A prior connection may still be registered after a soft-reload.
      const isConn = (await this.sqlite.isConnection(DB_NAME, DB_READONLY)).result === true;
      this.db = isConn
        ? await this.sqlite.retrieveConnection(DB_NAME, DB_READONLY)
        : await this.sqlite.createConnection(
            DB_NAME,
            DB_ENCRYPTED,
            DB_MODE,
            SCHEMA_VERSION,
            DB_READONLY,
          );

      await this.db.open();

      // Safe pragmas — FK must be on per-connection; WAL gives better
      // concurrent read/write on mobile. PRAGMA journal_mode cannot run
      // inside a transaction, so we disable the implicit transaction wrap.
      await this.db.execute('PRAGMA foreign_keys = ON;', /* transaction */ false);
      try {
        await this.db.execute('PRAGMA journal_mode = WAL;', /* transaction */ false);
      } catch (err) {
        // Non-fatal — some emulators disallow WAL; fall back silently.
        console.warn('[NativeDatabaseService] WAL not enabled:', err);
      }

      await this.applySchema();
      await this.applyMigrations();
    } catch (err) {
      this.initPromise = null; // allow retry
      console.error('[NativeDatabaseService] initialize failed', err);
      throw new Error(
        `Native database initialization failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async applySchema(): Promise<void> {
    // SCHEMA_DDL uses IF NOT EXISTS so this is idempotent.
    const statements = SCHEMA_DDL.map((ddl) => ({ statement: ddl, values: [] as SqlParam[] }));
    const res = await this.db!.executeSet(statements);
    if ((res.changes?.changes ?? 0) < 0) {
      throw new Error('Schema application returned error code');
    }
  }

  private async applyMigrations(): Promise<void> {
    const [{ user_version = 0 } = { user_version: 0 }] =
      (await this.db!.query('PRAGMA user_version;')).values ?? [];
    if (user_version >= SCHEMA_VERSION) return;

    // Baseline (v1): schema already applied by applySchema(); just stamp version.
    // Future deltas: add conditional blocks here.
    await this.db!.execute(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  }

  override async execute(sql: string, params?: unknown[]): Promise<void> {
    this.ensureDb();
    await this.db!.run(sql, (params as SqlParam[]) ?? [], /* transaction */ true);
  }

  override async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    this.ensureDb();
    const res = await this.db!.query(sql, (params as SqlParam[]) ?? []);
    return (res.values ?? []) as T[];
  }

  override async getOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  private ensureDb(): void {
    if (!this.db) {
      throw new Error('NativeDatabaseService: not initialized. Call initialize() first.');
    }
  }
}
