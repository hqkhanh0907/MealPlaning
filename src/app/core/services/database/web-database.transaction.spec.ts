import { createTestDatabase, teardownTestDatabase } from './__test__/create-test-database';
import type { WebDatabase } from './web-database';

describe('WebDatabase transactions', () => {
  let db: WebDatabase;

  beforeEach(async () => {
    db = await createTestDatabase();
    await db.execute('CREATE TABLE tx_probe (id TEXT PRIMARY KEY, name TEXT NOT NULL)');
  });

  afterEach(() => {
    teardownTestDatabase();
  });

  it('does not persist/export the sql.js database before the outer transaction commits', async () => {
    await db.withTransaction(async () => {
      await db.execute('INSERT INTO tx_probe (id, name) VALUES (?, ?)', ['tx-1', 'first']);
      await db.execute('INSERT INTO tx_probe (id, name) VALUES (?, ?)', ['tx-2', 'second']);
    });

    const rows = await db.query<{ id: string; name: string }>(
      'SELECT id, name FROM tx_probe ORDER BY id',
    );

    expect(rows).toEqual([
      { id: 'tx-1', name: 'first' },
      { id: 'tx-2', name: 'second' },
    ]);
  });
});
