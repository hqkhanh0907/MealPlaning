import type { DatabaseService } from './databaseService';

export async function getSetting(db: DatabaseService, key: string): Promise<string | null> {
  const row = await db.queryOne<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setSetting(db: DatabaseService, key: string, value: string): Promise<void> {
  await db.execute(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
    [key, value],
  );
}

export async function deleteSetting(db: DatabaseService, key: string): Promise<void> {
  await db.execute('DELETE FROM app_settings WHERE key = ?', [key]);
}

export async function getAllSettings(db: DatabaseService): Promise<Record<string, string>> {
  const rows = await db.query<{ key: string; value: string }>(
    'SELECT key, value FROM app_settings',
  );
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}
