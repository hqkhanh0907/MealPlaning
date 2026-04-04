import type { DatabaseService } from '@/services/databaseService';
import { logger } from '@/utils/logger';

interface WriteOp {
  db: DatabaseService;
  sql: string;
  params: unknown[];
  context: string;
  retryCount: number;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 50;

let queue: WriteOp[] = [];
let processing = false;

export function persistToDb(db: DatabaseService, sql: string, params: unknown[], context: string): void {
  queue.push({ db, sql, params, context, retryCount: 0 });
  if (!processing) void processQueue();
}

async function processQueue(): Promise<void> {
  processing = true;
  while (queue.length > 0) {
    const op = queue.shift()!;
    try {
      await op.db.execute(op.sql, op.params);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (isTransientError(msg) && op.retryCount < MAX_RETRIES) {
        queue.unshift({ ...op, retryCount: op.retryCount + 1 });
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        logger.error({ component: 'dbWriteQueue', action: op.context }, error);
      }
    }
  }
  processing = false;
  notifyIdle();
}

function isTransientError(msg: string): boolean {
  return msg.includes('SQLITE_BUSY') || msg.includes('database is locked');
}

// Idle notification for deterministic testing
let idleResolvers: Array<() => void> = [];

function notifyIdle(): void {
  for (const resolve of idleResolvers) resolve();
  idleResolvers = [];
}

/** @internal Wait until the queue finishes processing — test-only */
export function _waitForIdle(): Promise<void> {
  if (!processing && queue.length === 0) return Promise.resolve();
  return new Promise(resolve => {
    idleResolvers.push(resolve);
  });
}

/** @internal Reset queue state — test-only */
export function _resetQueue(): void {
  queue = [];
  processing = false;
  idleResolvers = [];
}
