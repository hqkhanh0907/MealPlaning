import type { Database, DatabaseStatement } from '../services/database/database';
import tableSchema from '../../../../server/pb_hooks/sync-schema.json';

const TABLES = Object.keys(tableSchema);
const mutationTable =
  /^\s*(?:INSERT(?:\s+OR\s+\w+)?\s+INTO|REPLACE\s+INTO|UPDATE(?:\s+OR\s+\w+)?|DELETE\s+FROM)\s+["`[]?([a-z_][a-z_0-9]*)/i;

export function isWorkspaceWrite(sql: string): boolean {
  const table = mutationTable.exec(sql)?.[1].toLowerCase();
  return !!table && Object.hasOwn(tableSchema, table);
}

export function prepareWorkspace(db: Database): Promise<void> {
  const statements: DatabaseStatement[] = [
    {
      statement: `
        CREATE TABLE IF NOT EXISTS sync_workspace (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          revision INTEGER NOT NULL DEFAULT 0,
          change_version INTEGER NOT NULL DEFAULT 0,
          clean_version INTEGER NOT NULL DEFAULT 0,
          pending TEXT,
          pending_version INTEGER
        )`,
      values: [],
    },
    { statement: 'INSERT OR IGNORE INTO sync_workspace (id) VALUES (1)', values: [] },
  ];
  for (const table of TABLES) {
    for (const action of ['INSERT', 'UPDATE', 'DELETE']) {
      statements.push({
        statement: `
          CREATE TRIGGER IF NOT EXISTS sync_${table}_${action.toLowerCase()}
          AFTER ${action} ON "${table}" BEGIN
            UPDATE sync_workspace SET change_version = change_version + 1 WHERE id = 1;
          END`,
        values: [],
      });
    }
  }
  statements.push(
    {
      statement: `UPDATE sync_workspace SET change_version = change_version + 1 WHERE id = 1
        AND EXISTS (SELECT 1 FROM app_config WHERE key = 'workout_preference_upload_pending')`,
      values: [],
    },
    {
      statement: "DELETE FROM app_config WHERE key = 'workout_preference_upload_pending'",
      values: [],
    },
  );
  return db.executeAtomically(statements);
}
