import { buildInitialSchemaMigration, SCHEMA_VERSION } from './schema';
import type { Migration } from './migration-runner';

export const MIGRATION_REGISTRY: readonly Migration[] = [
  buildInitialSchemaMigration(),
];

if (MIGRATION_REGISTRY[MIGRATION_REGISTRY.length - 1]?.version !== SCHEMA_VERSION) {
  throw new Error('Latest migration version must match SCHEMA_VERSION.');
}
