import { buildInitialSchemaMigration, SCHEMA_VERSION } from './schema';
import { MIGRATION_REGISTRY } from './migrations';

describe('MIGRATION_REGISTRY', () => {
  it('exposes a single canonical schema migration matching SCHEMA_VERSION', () => {
    const initial = buildInitialSchemaMigration();

    expect(MIGRATION_REGISTRY.length).toBe(1);
    expect(MIGRATION_REGISTRY[0].version).toBe(SCHEMA_VERSION);
    expect(MIGRATION_REGISTRY[0].statements).toEqual(initial.statements);
  });

  it('keeps migrations sorted by ascending version (trivially true for length 1)', () => {
    const versions = MIGRATION_REGISTRY.map((migration: { version: number }) => migration.version);
    expect(versions).toEqual([...versions].sort((left, right) => left - right));
  });
});
