import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DatabaseService } from '../services/databaseService';
import { _resetQueue, _waitForIdle, persistToDb } from '../store/helpers/dbWriteQueue';

function createMockDb(executeFn?: (sql: string, params?: unknown[]) => Promise<void>): DatabaseService {
  return {
    execute: vi.fn(executeFn ?? (() => Promise.resolve())),
    initialize: vi.fn(),
    query: vi.fn(),
    queryOne: vi.fn(),
    transaction: vi.fn(),
    exportToJSON: vi.fn(),
    importFromJSON: vi.fn(),
    close: vi.fn(),
  } as unknown as DatabaseService;
}

beforeEach(() => {
  _resetQueue();
  vi.restoreAllMocks();
});

afterEach(() => {
  _resetQueue();
});

describe('dbWriteQueue', () => {
  describe('persistToDb', () => {
    it('should execute a single write', async () => {
      const db = createMockDb();
      persistToDb(db, 'INSERT INTO t VALUES (?)', [1], 'test.insert');
      await _waitForIdle();

      expect(db.execute).toHaveBeenCalledOnce();
      expect(db.execute).toHaveBeenCalledWith('INSERT INTO t VALUES (?)', [1]);
    });

    it('should serialize multiple rapid calls', async () => {
      const order: number[] = [];
      const db = createMockDb(async (_sql, params) => {
        order.push((params as number[])[0]);
      });

      persistToDb(db, 'INSERT INTO t VALUES (?)', [1], 'op1');
      persistToDb(db, 'INSERT INTO t VALUES (?)', [2], 'op2');
      persistToDb(db, 'INSERT INTO t VALUES (?)', [3], 'op3');
      await _waitForIdle();

      expect(order).toEqual([1, 2, 3]);
      expect(db.execute).toHaveBeenCalledTimes(3);
    });

    it('should use the db from each op (not a shared reference)', async () => {
      const db1 = createMockDb();
      const db2 = createMockDb();

      persistToDb(db1, 'SQL1', [], 'ctx1');
      persistToDb(db2, 'SQL2', [], 'ctx2');
      await _waitForIdle();

      expect(db1.execute).toHaveBeenCalledWith('SQL1', []);
      expect(db2.execute).toHaveBeenCalledWith('SQL2', []);
    });
  });

  describe('transient error retries', () => {
    it('should retry SQLITE_BUSY errors up to MAX_RETRIES', async () => {
      let callCount = 0;
      const db = createMockDb(async () => {
        callCount++;
        if (callCount <= 2) throw new Error('SQLITE_BUSY');
      });

      persistToDb(db, 'INSERT INTO t VALUES (?)', [1], 'busy.retry');
      await _waitForIdle();

      // 2 failures + 1 success = 3 calls
      expect(db.execute).toHaveBeenCalledTimes(3);
    });

    it('should retry database is locked errors', async () => {
      let callCount = 0;
      const db = createMockDb(async () => {
        callCount++;
        if (callCount === 1) throw new Error('database is locked');
      });

      persistToDb(db, 'UPDATE t SET x = 1', [], 'locked.retry');
      await _waitForIdle();

      expect(db.execute).toHaveBeenCalledTimes(2);
    });

    it('should log error after MAX_RETRIES exhausted', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const db = createMockDb(async () => {
        throw new Error('SQLITE_BUSY');
      });

      persistToDb(db, 'INSERT INTO t VALUES (?)', [1], 'exhaust.retry');
      await _waitForIdle();

      // Initial + 2 retries = 3 calls
      expect(db.execute).toHaveBeenCalledTimes(3);
      expect(errorSpy).toHaveBeenCalled();
      expect(errorSpy.mock.calls[0][0]).toContain('dbWriteQueue');
    });
  });

  describe('non-transient errors', () => {
    it('should log error immediately without retry', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const db = createMockDb(async () => {
        throw new Error('UNIQUE constraint failed');
      });

      persistToDb(db, 'INSERT INTO t VALUES (?)', [1], 'unique.fail');
      await _waitForIdle();

      expect(db.execute).toHaveBeenCalledOnce();
      expect(errorSpy).toHaveBeenCalled();
      expect(errorSpy.mock.calls[0][0]).toContain('unique.fail');
    });

    it('should handle non-Error thrown values', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const db = createMockDb(async () => {
        throw 'string error';
      });

      persistToDb(db, 'SQL', [], 'string.throw');
      await _waitForIdle();

      expect(db.execute).toHaveBeenCalledOnce();
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should continue processing remaining ops after an error', async () => {
      let callCount = 0;
      const db = createMockDb(async () => {
        callCount++;
        if (callCount === 1) throw new Error('UNIQUE constraint failed');
      });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      persistToDb(db, 'SQL1', [], 'fail');
      persistToDb(db, 'SQL2', [], 'succeed');
      await _waitForIdle();

      expect(db.execute).toHaveBeenCalledTimes(2);
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('_resetQueue', () => {
    it('should clear all pending operations', () => {
      const db = createMockDb(async () => {
        // Never resolves quickly — simulates slow DB
        await new Promise(() => {});
      });

      persistToDb(db, 'SQL', [], 'ctx');
      _resetQueue();

      // After reset, no more calls should happen
      expect(db.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('_waitForIdle', () => {
    it('should resolve immediately when queue is empty', async () => {
      await expect(_waitForIdle()).resolves.toBeUndefined();
    });

    it('should resolve when processing completes', async () => {
      const db = createMockDb();
      persistToDb(db, 'SQL', [], 'ctx');

      await _waitForIdle();
      expect(db.execute).toHaveBeenCalledOnce();
    });
  });
});
