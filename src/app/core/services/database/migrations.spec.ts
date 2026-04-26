import {
  buildInitialSchemaMigration,
  buildMealTagMigration,
  buildNutritionSchemaFinalizationMigration,
  buildNutritionUnitsMigration,
  SCHEMA_VERSION,
} from './schema';
import { MIGRATION_REGISTRY } from './migrations';

describe('MIGRATION_REGISTRY', () => {
  it('exposes the initial, nutrition, finalization, and meal-tag migrations in order', () => {
    const initial = buildInitialSchemaMigration();
    const nutrition = buildNutritionUnitsMigration();
    const finalization = buildNutritionSchemaFinalizationMigration();
    const mealTag = buildMealTagMigration();

    expect(MIGRATION_REGISTRY.length).toBe(4);
    expect(MIGRATION_REGISTRY[0].version).toBe(1);
    expect(MIGRATION_REGISTRY[0].statements).toEqual(initial.statements);
    expect(MIGRATION_REGISTRY[1].version).toBe(2);
    expect(MIGRATION_REGISTRY[1].statements).toEqual(nutrition.statements);
    expect(MIGRATION_REGISTRY[2].version).toBe(3);
    expect(MIGRATION_REGISTRY[2].statements).toEqual(finalization.statements);
    expect(MIGRATION_REGISTRY[3].version).toBe(SCHEMA_VERSION);
    expect(MIGRATION_REGISTRY[3].statements).toEqual(mealTag.statements);
  });

  it('keeps migrations sorted by ascending version', () => {
    const versions = MIGRATION_REGISTRY.map((migration: { version: number }) => migration.version);
    expect(versions).toEqual([...versions].sort((left, right) => left - right));
  });
});
