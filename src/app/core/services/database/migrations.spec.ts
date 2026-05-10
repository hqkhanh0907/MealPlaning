import {
  buildHybridPolicySchemaMigration,
  buildInitialSchemaMigration,
  SCHEMA_VERSION,
} from './schema';
import { MIGRATION_REGISTRY } from './migrations';

describe('MIGRATION_REGISTRY', () => {
  it('exposes v1 + v2 migrations matching SCHEMA_VERSION', () => {
    expect(SCHEMA_VERSION).toBe(2);
    expect(MIGRATION_REGISTRY.length).toBe(2);
    expect(MIGRATION_REGISTRY[0].version).toBe(1);
    expect(MIGRATION_REGISTRY[1].version).toBe(2);
    expect(MIGRATION_REGISTRY[1].version).toBe(SCHEMA_VERSION);
  });

  it('uses the canonical builders (immutable v1, hybrid-policy v2)', () => {
    const v1 = buildInitialSchemaMigration();
    const v2 = buildHybridPolicySchemaMigration();
    expect(MIGRATION_REGISTRY[0].statements).toEqual(v1.statements);
    expect(MIGRATION_REGISTRY[1].statements).toEqual(v2.statements);
  });

  it('keeps migrations sorted by ascending version', () => {
    const versions = MIGRATION_REGISTRY.map((m: { version: number }) => m.version);
    expect(versions).toEqual([...versions].sort((a, b) => a - b));
  });
});

describe('buildHybridPolicySchemaMigration (D8 DEC-11)', () => {
  it('declares version 2', () => {
    expect(buildHybridPolicySchemaMigration().version).toBe(2);
  });

  it('drops legacy 3 tables in dependency order before recreate', () => {
    const stmts = buildHybridPolicySchemaMigration().statements;
    const dropOrder = stmts.filter((s: string) => s.startsWith('DROP TABLE'));
    expect(dropOrder).toEqual([
      'DROP TABLE IF EXISTS planned_dish',
      'DROP TABLE IF EXISTS meal_slot',
      'DROP TABLE IF EXISTS day_plan',
    ]);
  });

  it('drops legacy index names from v1', () => {
    const joined = buildHybridPolicySchemaMigration().statements.join('\n');
    expect(joined).toContain('DROP INDEX IF EXISTS idx_planned_dish_slot');
    expect(joined).toContain('DROP INDEX IF EXISTS idx_meal_slot_day');
  });

  it('recreates planned_dish with bidirectional Hybrid CHECK', () => {
    const stmts = buildHybridPolicySchemaMigration().statements;
    const plannedDish = stmts.find((s: string) => s.startsWith('CREATE TABLE planned_dish'));
    expect(plannedDish).toBeDefined();
    expect(plannedDish).toContain('CHECK (servings BETWEEN 0.1 AND 20)');
    expect(plannedDish).toMatch(/is_completed = 0[\s\S]*?completed_at IS NULL/);
    expect(plannedDish).toMatch(/is_completed = 1[\s\S]*?completed_at IS NOT NULL/);
  });

  it('does NOT include cached total_* columns on day_plan / meal_slot', () => {
    const joined = buildHybridPolicySchemaMigration().statements.join('\n');
    expect(joined).not.toContain('total_calories');
    expect(joined).not.toContain('total_protein');
    expect(joined).not.toContain('total_carbs');
    expect(joined).not.toContain('total_fat');
  });

  it('adds 4 partial / canonical indexes for planned_dish + meal_slot', () => {
    const joined = buildHybridPolicySchemaMigration().statements.join('\n');
    expect(joined).toContain('idx_planned_dish_meal_slot');
    expect(joined).toContain('idx_planned_dish_dish');
    expect(joined).toContain('idx_planned_dish_completed');
    expect(joined).toContain('idx_planned_dish_completed_at');
    expect(joined).toContain('idx_meal_slot_day_plan');
  });
});
