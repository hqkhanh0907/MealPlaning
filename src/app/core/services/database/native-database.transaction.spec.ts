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

    expect(db.execute).toHaveBeenCalledWith('BEGIN TRANSACTION;', false);
    expect(db.run).toHaveBeenCalledWith('INSERT INTO dish VALUES (?)', ['1'], false);
    expect(db.execute).toHaveBeenCalledWith('COMMIT;', false);
  });

  it('passes transaction=false on ROLLBACK so the plugin does not auto-wrap it', async () => {
    const service = new NativeDatabase();
    const db = createDb();
    (service as unknown as { db: ReturnType<typeof createDb> }).db = db;

    await expectAsync(
      service.withTransaction(async () => {
        throw new Error('boom');
      }),
    ).toBeRejectedWithError('boom');

    expect(db.execute).toHaveBeenCalledWith('BEGIN TRANSACTION;', false);
    expect(db.execute).toHaveBeenCalledWith('ROLLBACK;', false);
    expect(db.execute).not.toHaveBeenCalledWith('COMMIT;', false);
  });
});
