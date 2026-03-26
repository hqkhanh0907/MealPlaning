declare module 'sql.js' {
  interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  interface Database {
    run(sql: string, params?: unknown[]): void;
    exec(sql: string, params?: unknown[]): QueryExecResult[];
    close(): void;
  }

  interface SqlJsStatic {
    Database: new () => Database;
  }

  interface SqlJsConfig {
    locateFile?: (file: string) => string;
  }

  function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
  export default initSqlJs;
  export type { Database, QueryExecResult, SqlJsStatic };
}
