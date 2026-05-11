import {
  buildFiberSnapshotSchemaMigration,
  buildHybridPolicySchemaMigration,
  buildInitialSchemaMigration,
  SCHEMA_VERSION,
} from './schema';
import type { Migration } from './migration-runner';

/**
 * Ordered registry of schema migrations. Append-only — shipped migrations
 * are immutable. New schema changes get a new version + builder.
 *
 * v1 — initial canonical schema (Story 2.6, 2026-05-08).
 * v2 — Hybrid policy enforcement (D8 DEC-11, 2026-05-09).
 * v3 — Fiber snapshot column for logged meal nutrition details.
 */
export const MIGRATION_REGISTRY: readonly Migration[] = [
  buildInitialSchemaMigration(),
  buildHybridPolicySchemaMigration(),
  buildFiberSnapshotSchemaMigration(),
];

if (MIGRATION_REGISTRY[MIGRATION_REGISTRY.length - 1]?.version !== SCHEMA_VERSION) {
  throw new Error('Latest migration version must match SCHEMA_VERSION.');
}
