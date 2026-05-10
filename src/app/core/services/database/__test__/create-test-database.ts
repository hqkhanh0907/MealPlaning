import { environment } from '../../../../../environments/environment';
import { WebDatabase } from '../web-database';

/**
 * Boot a fresh in-memory `WebDatabase` for spec runs.
 *
 * Why this helper:
 *   `WebDatabase.initialize()` rehydrates from `localStorage` using key
 *   `sqljs_${environment.dbName}`. Without explicit cleanup each spec inherits
 *   the previous spec's mutations (planned_dish rows, broken CHECK fixtures,
 *   half-applied migrations). Clearing the key right before `initialize()`
 *   forces sql.js into a pristine state — schema migrations run from
 *   `user_version=0` up to the current `SCHEMA_VERSION` (2) every call.
 *
 * Pair with `afterEach(() => { teardownTestDatabase(); })` so
 * the persisted blob does not leak into the next spec's bootstrap.
 *
 * @returns A `WebDatabase` already at `user_version=2`, foreign keys ON.
 */
export async function createTestDatabase(): Promise<WebDatabase> {
  // Wipe persisted blob so this spec gets a fresh DB, not a rehydration of the
  // previous spec's writes (Pitfall E — localStorage cross-spec contamination).
  localStorage.removeItem(`sqljs_${environment.dbName}`);

  const db = new WebDatabase();
  await db.initialize();
  return db;
}

/**
 * Symmetric cleanup. `WebDatabase` does not expose a `close()` method, so the
 * cheapest deterministic teardown is dropping the persisted blob — the next
 * `createTestDatabase()` call cannot inherit any state from this spec.
 */
export function teardownTestDatabase(): void {
  localStorage.removeItem(`sqljs_${environment.dbName}`);
}
