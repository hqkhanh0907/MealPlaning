import { NativeDatabase } from './native-database';

describe('NativeDatabaseService transaction behavior', () => {
  const createDb = (): {
    execute: jasmine.Spy;
    run: jasmine.Spy;
  } => ({
    execute: jasmine.createSpy('execute').and.resolveTo({ changes: { changes: 0 } }),
    run: jasmine.createSpy('run').and.resolveTo({ changes: { changes: 1 } }),
  });

  it('uses direct run calls inside an open transaction and commits once', async () => {
    const service = new NativeDatabase();
    const db = createDb();
    (service as unknown as { db: ReturnType<typeof createDb> }).db = db;

    await service.withTransaction(async () => {
      await service.execute('INSERT INTO dish VALUES (?)', ['1']);
    });

    expect(db.execute.calls.argsFor(0)[0]).toBe('BEGIN TRANSACTION;');
    expect(db.run).toHaveBeenCalledWith('INSERT INTO dish VALUES (?)', ['1'], false);
    expect(db.execute.calls.argsFor(1)[0]).toBe('COMMIT;');
  });
});
