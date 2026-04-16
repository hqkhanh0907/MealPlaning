/**
 * Abstract Database Service — HealthMate AI
 *
 * Provides a platform-agnostic interface for SQLite operations.
 * Two concrete implementations:
 *   - WebDatabaseService  — sql.js WASM (web / tests)
 *   - NativeDatabaseService — @capacitor-community/sqlite (Android)
 */
export abstract class DatabaseService {
  /**
   * Initialize the database: open connection, run schema DDL + migrations.
   * Must be called once at app startup before any queries.
   */
  abstract initialize(): Promise<void>;

  /**
   * Execute a write statement (INSERT, UPDATE, DELETE, DDL).
   * @param sql   SQL string with `?` placeholders
   * @param params  Ordered parameter values
   */
  abstract execute(sql: string, params?: unknown[]): Promise<void>;

  /**
   * Query rows and return them as an array of T.
   * Returns empty array if no rows match.
   */
  abstract query<T>(sql: string, params?: unknown[]): Promise<T[]>;

  /**
   * Query a single row. Returns null if no row matches.
   */
  abstract getOne<T>(sql: string, params?: unknown[]): Promise<T | null>;
}
