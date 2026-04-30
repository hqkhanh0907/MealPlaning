import {
  buildGramOnlyRevisionMigration,
  buildInitialSchemaMigration,
  buildMealTagMigration,
  buildNutritionSchemaFinalizationMigration,
  buildNutritionUnitsMigration,
  buildSeedArtifactMigration,
  SCHEMA_VERSION,
} from './schema';
import type { Migration } from './migration-runner';

export const MIGRATION_REGISTRY: readonly Migration[] = [
  buildInitialSchemaMigration(),
  buildNutritionUnitsMigration(),
  buildNutritionSchemaFinalizationMigration(),
  buildMealTagMigration(),
  buildSeedArtifactMigration(),
  buildGramOnlyRevisionMigration(),
].sort((left, right) => left.version - right.version);

if (MIGRATION_REGISTRY[MIGRATION_REGISTRY.length - 1]?.version !== SCHEMA_VERSION) {
  throw new Error('Latest migration version must match SCHEMA_VERSION.');
}
