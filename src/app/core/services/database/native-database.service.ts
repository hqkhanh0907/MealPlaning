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
import {
  shouldResetLegacyManagementSchema,
  type ManagementSchemaSnapshot,
} from './schema-compatibility';
import { environment } from '../../../../environments/environment';
import { MigrationRunner } from './migration-runner';
import { MIGRATION_REGISTRY } from './migrations';

const DB_NAME = environment.dbName.replace(/\.db$/, '');
const DB_ENCRYPTED = false;
const DB_MODE = 'no-encryption';
const DB_READONLY = false;

type Primitive = string | number | boolean | null;
type SqlParam = Primitive | Uint8Array;

@Injectable()
export class NativeDatabaseService extends DatabaseService {
  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private initPromise: Promise<void> | null = null;
  private transactionDepth = 0;

  override initialize(): Promise<void> {
    this.initPromise ??= this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
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
      await this.db.execute('PRAGMA foreign_keys = ON;', false);
      try {
        await this.db.execute('PRAGMA journal_mode = WAL;', false);
      } catch (err) {
        console.warn('[NativeDatabaseService] WAL not enabled:', err);
      }

      await this.resetLegacyManagementSchemaIfNeeded();
      await this.applySchema();
      await new MigrationRunner(this, MIGRATION_REGISTRY).run();
    } catch (err) {
      this.initPromise = null;
      console.error('[NativeDatabaseService] initialize failed', err);
      throw new Error(
        `Native database initialization failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async applySchema(): Promise<void> {
    const statements = SCHEMA_DDL.map((ddl) => ({ statement: ddl, values: [] as SqlParam[] }));
    const res = await this.db!.executeSet(statements);
    if ((res.changes?.changes ?? 0) < 0) {
      throw new Error('Schema application returned error code');
    }
  }

  private async resetLegacyManagementSchemaIfNeeded(): Promise<void> {
    const snapshot = await this.readManagementSchemaSnapshot();
    if (!shouldResetLegacyManagementSchema(snapshot)) {
      return;
    }

    console.warn('[NativeDatabaseService] resetting legacy management schema before applying v1');
    await this.db!.execute('DROP VIEW IF EXISTS dish_with_totals;', false);
    await this.db!.execute('DROP TABLE IF EXISTS dish_ingredient;', false);
    await this.db!.execute('DROP TABLE IF EXISTS dish;', false);
    await this.db!.execute('DROP TABLE IF EXISTS ingredient;', false);
  }

  private async readManagementSchemaSnapshot(): Promise<ManagementSchemaSnapshot> {
    const [{ user_version = 0 } = { user_version: 0 }] =
      await this.query<{ user_version: number }>('PRAGMA user_version;');

    return {
      userVersion: user_version,
      ingredientColumns: await this.readTableColumns('ingredient'),
      dishColumns: await this.readTableColumns('dish'),
      dishIngredientColumns: await this.readTableColumns('dish_ingredient'),
    };
  }

  private async readTableColumns(tableName: string): Promise<string[]> {
    const rows = await this.query<{ name?: string }>(`PRAGMA table_info(${tableName});`);
    return rows.map((row) => row.name).filter((name): name is string => typeof name === 'string');
  }

  override async execute(sql: string, params?: unknown[]): Promise<void> {
    this.ensureDb();
    await this.db!.run(sql, (params as SqlParam[]) ?? [], this.transactionDepth === 0);
  }

  override async withTransaction<T>(callback: () => Promise<T>): Promise<T> {
    this.ensureDb();
    const isOuterTransaction = this.transactionDepth === 0;
    if (isOuterTransaction) {
      await this.db!.execute('BEGIN TRANSACTION;');
    }

    this.transactionDepth += 1;
    try {
      const result = await callback();
      this.transactionDepth -= 1;
      if (isOuterTransaction) {
        await this.db!.execute('COMMIT;');
      }
      return result;
    } catch (error) {
      this.transactionDepth = Math.max(0, this.transactionDepth - 1);
      if (isOuterTransaction) {
        await this.db!.execute('ROLLBACK;');
      }
      throw error;
    }
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
