import type { Database, DatabaseStatement } from '../services/database/database';
import { SCHEMA_VERSION } from '../services/database/schema';
import tableSchema from '../../../../server/pb_hooks/sync-schema.json';

type Value = number | string | null;
type Row = Record<string, Value>;
type Table = keyof typeof tableSchema;
const TABLES = Object.keys(tableSchema) as Table[];

export interface WorkspaceSnapshot {
  schemaVersion: number;
  tables: Record<Table, Row[]>;
}

export interface OutboxRow {
  revision: number;
  change_version: number;
  clean_version: number;
  pending: string | null;
  pending_version: number | null;
}

export async function prepareWorkspace(db: Database): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_workspace (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      revision INTEGER NOT NULL DEFAULT 0,
      change_version INTEGER NOT NULL DEFAULT 0,
      clean_version INTEGER NOT NULL DEFAULT 0,
      pending TEXT,
      pending_version INTEGER
    )`);
  await db.execute('INSERT OR IGNORE INTO sync_workspace (id) VALUES (1)');
  await db.execute('CREATE TABLE IF NOT EXISTS sync_import_guard (valid INTEGER CHECK (valid = 1))');
  for (const table of TABLES) {
    for (const action of ['INSERT', 'UPDATE', 'DELETE']) {
      await db.execute(`
        CREATE TRIGGER IF NOT EXISTS sync_${table}_${action.toLowerCase()}
        AFTER ${action} ON "${table}" BEGIN
          UPDATE sync_workspace SET change_version = change_version + 1 WHERE id = 1;
        END`);
    }
  }
}

export async function outbox(db: Database): Promise<OutboxRow> {
  const value = await db.getOne<OutboxRow>('SELECT * FROM sync_workspace WHERE id = 1');
  if (!value) throw new Error('Chưa khởi tạo đồng bộ.');
  return value;
}

export async function exportWorkspace(db: Database): Promise<WorkspaceSnapshot> {
  const tables = {} as WorkspaceSnapshot['tables'];
  for (const table of TABLES) {
    const { key } = tableSchema[table];
    tables[table] = await db.query<Row>(`SELECT * FROM "${table}" ORDER BY "${key}"`);
  }
  return { schemaVersion: SCHEMA_VERSION, tables };
}

export async function importWorkspace(
  db: Database,
  snapshot: WorkspaceSnapshot,
  revision: number,
  expectedChange: number,
): Promise<void> {
  if (snapshot.schemaVersion !== SCHEMA_VERSION) throw new Error('Cần cập nhật ứng dụng.');
  const statements: DatabaseStatement[] = [{
    statement: 'INSERT INTO sync_import_guard (valid) SELECT change_version = ? FROM sync_workspace WHERE id = 1',
    values: [expectedChange],
  }];
  for (const table of [...TABLES].reverse()) {
    statements.push({ statement: `DELETE FROM "${table}"`, values: [] });
  }
  for (const table of TABLES) {
    const columns = Object.keys(tableSchema[table].cols);
    const identifiers = columns.map((column) => `"${column}"`).join(', ');
    const placeholders = columns.map(() => '?').join(', ');
    for (const row of snapshot.tables[table]) {
      statements.push({
        statement: `INSERT INTO "${table}" (${identifiers}) VALUES (${placeholders})`,
        values: columns.map((column) => row[column]),
      });
    }
  }
  statements.push({
    statement: `UPDATE sync_workspace SET revision = ?, clean_version = change_version,
                  pending = NULL, pending_version = NULL WHERE id = 1`,
    values: [revision],
  }, { statement: 'DELETE FROM sync_import_guard', values: [] });
  await db.executeAtomically(statements);
}
