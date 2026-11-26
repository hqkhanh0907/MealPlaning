import type { Database } from '../services/database/database';
import tableSchema from '../../../../server/pb_hooks/sync-schema.json';

const TABLES = Object.keys(tableSchema);
const mutationTable =
  /^\s*(?:INSERT(?:\s+OR\s+\w+)?\s+INTO|REPLACE\s+INTO|UPDATE(?:\s+OR\s+\w+)?|DELETE\s+FROM)\s+["`[]?([a-z_][a-z_0-9]*)/i;

export function isWorkspaceWrite(sql: string): boolean {
  const table = mutationTable.exec(sql)?.[1].toLowerCase();
  return !!table && Object.hasOwn(tableSchema, table);
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
