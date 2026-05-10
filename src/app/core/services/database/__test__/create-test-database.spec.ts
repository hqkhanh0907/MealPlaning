import { createTestDatabase, teardownTestDatabase } from './create-test-database';
import type { WebDatabase } from '../web-database';
import { SCHEMA_VERSION } from '../schema';

describe('createTestDatabase helper', () => {
  let db: WebDatabase;

  afterEach(() => {
    teardownTestDatabase(db);
  });

  it('boots a fresh sql.js DB at the canonical SCHEMA_VERSION', async () => {
    db = await createTestDatabase();

    const rows = await db.query<{ user_version: number }>('PRAGMA user_version;');
    expect(rows.length).toBe(1);
    expect(rows[0].user_version).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBe(2);
  });

  it('returns a clean DB on each call (no cross-spec contamination)', async () => {
    db = await createTestDatabase();
    await db.execute(
      `INSERT INTO day_plan (id, date, target_calories, target_protein) VALUES (?, ?, ?, ?)`,
      ['test-day-1', '2026-05-10', 2000, 150],
    );
    teardownTestDatabase(db);

    db = await createTestDatabase();
    const rows = await db.query<{ count: number }>('SELECT COUNT(*) AS count FROM day_plan');
    expect(rows[0].count).toBe(0);
  });
});
