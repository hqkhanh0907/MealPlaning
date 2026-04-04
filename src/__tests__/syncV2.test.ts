import type { DatabaseService } from '../services/databaseService';
import type { ImportResult, V2ExportPayload } from '../services/syncV2Utils';
import { buildLegacyFormat, createV2Export, detectVersion, importV2Data } from '../services/syncV2Utils';

/* ------------------------------------------------------------------ */
/* All 16 schema table names */
/* ------------------------------------------------------------------ */
const ALL_TABLES = [
  'ingredients',
  'dishes',
  'dish_ingredients',
  'day_plans',
  'meal_templates',
  'user_profile',
  'goals',
  'exercises',
  'training_profile',
  'training_plans',
  'training_plan_days',
  'workouts',
  'workout_sets',
  'weight_log',
  'daily_log',
  'adjustments',
];

/* ------------------------------------------------------------------ */
/* Mock DatabaseService */
/* ------------------------------------------------------------------ */

interface MockDb extends DatabaseService {
  _stored: Record<string, unknown[]>;
}

function createMockDb(tables: Record<string, unknown[]> = {}, opts?: { executeError?: (sql: string) => void }): MockDb {
  const _stored: Record<string, unknown[]> = {};
  for (const t of ALL_TABLES) _stored[t] = [];
  for (const [k, v] of Object.entries(tables)) _stored[k] = structuredClone(v);

  const executeFn = vi.fn(async (sql: string, params?: unknown[]) => {
    if (opts?.executeError) opts.executeError(sql);

    const delMatch = sql.match(/DELETE\s+FROM\s+"?(\w+)"?/i);
    if (delMatch) {
      const tbl = delMatch[1];
      if (_stored[tbl]) _stored[tbl] = [];
      return;
    }

    const insMatch = sql.match(/INSERT\s+INTO\s+"?(\w+)"?\s*\(([^)]+)\)/i);
    if (insMatch) {
      const tbl = insMatch[1];
      const cols = insMatch[2].split(',').map(c => c.trim().replace(/"/g, ''));
      if (!_stored[tbl]) _stored[tbl] = [];
      const row: Record<string, unknown> = {};
      cols.forEach((col, i) => {
        row[col] = params?.[i] ?? null;
      });
      _stored[tbl].push(row);
    }
  });

  const transactionFn = vi.fn(async (fn: () => Promise<void>) => {
    const backup = JSON.parse(JSON.stringify(_stored)) as Record<string, unknown[]>;
    try {
      await fn();
    } catch (error) {
      for (const key of Object.keys(_stored)) delete _stored[key];
      for (const [key, value] of Object.entries(backup)) _stored[key] = value;
      throw error;
    }
  });

  return {
    _stored,
    initialize: vi.fn(),
    execute: executeFn,
    query: vi.fn(async (sql: string) => {
      const match = sql.match(/SELECT\s+\*\s+FROM\s+"?(\w+)"?/i);
      if (match && _stored[match[1]]) {
        return _stored[match[1]];
      }
      return [];
    }) as DatabaseService['query'],
    queryOne: vi.fn(),
    transaction: transactionFn,
    close: vi.fn().mockResolvedValue(undefined),
    exportToJSON: vi.fn(async () => JSON.stringify(_stored)),
    importFromJSON: vi.fn(async (json: string) => {
      const parsed = JSON.parse(json) as Record<string, unknown[]>;
      for (const key of Object.keys(_stored)) _stored[key] = [];
      for (const [key, value] of Object.entries(parsed)) _stored[key] = value;
    }),
  };
}

/* ------------------------------------------------------------------ */
/* Tests */
/* ------------------------------------------------------------------ */

describe('syncV2Utils', () => {
  /* ---------- detectVersion ---------- */

  describe('detectVersion', () => {
    it('returns "2.0" for v2.0 format', () => {
      const data = { _version: '2.0', _format: 'sqlite-json', tables: {} };
      expect(detectVersion(data)).toBe('2.0');
    });

    it('returns "1.x" for legacy format (no _version)', () => {
      const data = { 'mp-dishes': [{ id: 'd1' }], _syncedAt: '2024-01-01T00:00:00Z' };
      expect(detectVersion(data)).toBe('1.x');
    });

    it('returns "1.x" when _version is "1.0"', () => {
      expect(detectVersion({ _version: '1.0' })).toBe('1.x');
    });

    it('returns "1.x" for null', () => {
      expect(detectVersion(null)).toBe('1.x');
    });

    it('returns "1.x" for non-object values', () => {
      expect(detectVersion('string')).toBe('1.x');
      expect(detectVersion(42)).toBe('1.x');
      expect(detectVersion(undefined)).toBe('1.x');
    });
  });

  /* ---------- createV2Export ---------- */

  describe('createV2Export', () => {
    it('produces correct structure with _version, _exportedAt, tables', async () => {
      const db = createMockDb({
        ingredients: [
          {
            id: 'i1',
            name_vi: 'Gạo',
            name_en: 'Rice',
            calories_per_100: 100,
            protein_per_100: 2,
            carbs_per_100: 22,
            fat_per_100: 0.3,
            fiber_per_100: 0.4,
            unit_vi: 'g',
            unit_en: 'g',
          },
        ],
        dishes: [{ id: 'd1', name_vi: 'Cơm', name_en: null, tags: '[]', rating: null, notes: null }],
      });

      const result = await createV2Export(db);

      expect(result._version).toBe('2.0');
      expect(result._format).toBe('sqlite-json');
      expect(typeof result._exportedAt).toBe('string');
      expect(new Date(result._exportedAt).getTime()).not.toBeNaN();
      expect(result.tables).toBeDefined();
      expect(result.tables['ingredients'][0]).toMatchObject({ id: 'i1', name_vi: 'Gạo' });
      expect(result.tables['dishes'][0]).toMatchObject({ id: 'd1', name_vi: 'Cơm' });
    });

    it('includes all 16 SCHEMA_TABLES keys (empty arrays for missing)', async () => {
      const db = createMockDb({});
      const result = await createV2Export(db);

      for (const t of ALL_TABLES) {
        expect(result.tables).toHaveProperty(t);
        expect(Array.isArray(result.tables[t])).toBe(true);
      }
    });

    it('includes _legacyFormat when provided', async () => {
      const db = createMockDb({});
      const legacy = { 'mp-dishes': [{ id: 'd1' }], 'mp-ingredients': [{ id: 'i1' }] };
      const result = await createV2Export(db, legacy);

      expect(result._legacyFormat).toEqual(legacy);
    });

    it('omits _legacyFormat when all tables are empty and no legacy provided', async () => {
      const db = createMockDb({});
      const result = await createV2Export(db);
      expect(result._legacyFormat).toBeUndefined();
    });

    it('omits _legacyFormat when provided empty object and all tables empty', async () => {
      const db = createMockDb({});
      const result = await createV2Export(db, {});
      expect(result._legacyFormat).toBeUndefined();
    });

    it('auto-generates _legacyFormat from SQL data when no legacy provided', async () => {
      const db = createMockDb({
        ingredients: [
          {
            id: 'i1',
            name_vi: 'Gạo',
            name_en: 'Rice',
            calories_per_100: 130,
            protein_per_100: 2.7,
            carbs_per_100: 28,
            fat_per_100: 0.3,
            fiber_per_100: 0.4,
            unit_vi: 'g',
            unit_en: 'g',
          },
        ],
        dishes: [{ id: 'd1', name_vi: 'Cơm', name_en: null, tags: '["breakfast"]', rating: 5, notes: null }],
        dish_ingredients: [{ dish_id: 'd1', ingredient_id: 'i1', amount: 200 }],
        user_profile: [
          {
            id: 'default',
            gender: 'male',
            age: 30,
            height_cm: 170,
            weight_kg: 65,
            activity_level: 'moderate',
            body_fat_pct: null,
            bmr_override: null,
            protein_ratio: 2.0,
            fat_pct: 0.25,
            updated_at: '2026-01-01',
          },
        ],
      });

      const result = await createV2Export(db);

      expect(result._legacyFormat).toBeDefined();
      const legacy = result._legacyFormat as Record<string, unknown>;
      expect(legacy['mp-ingredients']).toEqual([
        {
          id: 'i1',
          name: { vi: 'Gạo', en: 'Rice' },
          caloriesPer100: 130,
          proteinPer100: 2.7,
          carbsPer100: 28,
          fatPer100: 0.3,
          fiberPer100: 0.4,
          unit: { vi: 'g', en: 'g' },
        },
      ]);
      const dishes = legacy['mp-dishes'] as Array<Record<string, unknown>>;
      expect(dishes[0].id).toBe('d1');
      expect(dishes[0].name).toEqual({ vi: 'Cơm' });
      expect(dishes[0].ingredients).toEqual([{ ingredientId: 'i1', amount: 200 }]);
      expect(dishes[0].tags).toEqual(['breakfast']);
      const profile = legacy['mp-user-profile'] as Record<string, unknown>;
      expect(profile.weight).toBe(65);
      expect(profile.proteinRatio).toBe(2.0);
    });
  });

  /* ---------- buildLegacyFormat ---------- */

  describe('buildLegacyFormat', () => {
    it('transforms ingredients with LocalizedString names', () => {
      const tables: Record<string, unknown[]> = {
        ingredients: [
          {
            id: 'i1',
            name_vi: 'Gạo',
            name_en: 'Rice',
            calories_per_100: 130,
            protein_per_100: 2.7,
            carbs_per_100: 28,
            fat_per_100: 0.3,
            fiber_per_100: 0.4,
            unit_vi: 'g',
            unit_en: 'g',
          },
          {
            id: 'i2',
            name_vi: 'Trứng',
            name_en: null,
            calories_per_100: 155,
            protein_per_100: 13,
            carbs_per_100: 1.1,
            fat_per_100: 11,
            fiber_per_100: 0,
            unit_vi: 'quả',
            unit_en: null,
          },
        ],
      };

      const legacy = buildLegacyFormat(tables);
      const items = legacy['mp-ingredients'] as Array<Record<string, unknown>>;

      expect(items).toHaveLength(2);
      expect(items[0].name).toEqual({ vi: 'Gạo', en: 'Rice' });
      expect(items[0].unit).toEqual({ vi: 'g', en: 'g' });
      expect(items[1].name).toEqual({ vi: 'Trứng' });
      expect(items[1].unit).toEqual({ vi: 'quả' });
    });

    it('transforms dishes with embedded dish_ingredients', () => {
      const tables: Record<string, unknown[]> = {
        dishes: [{ id: 'd1', name_vi: 'Cơm', name_en: 'Rice', tags: '["breakfast"]', rating: 5, notes: null }],
        dish_ingredients: [
          { dish_id: 'd1', ingredient_id: 'i1', amount: 200 },
          { dish_id: 'd1', ingredient_id: 'i2', amount: 50 },
        ],
      };

      const legacy = buildLegacyFormat(tables);
      const dishes = legacy['mp-dishes'] as Array<Record<string, unknown>>;

      expect(dishes).toHaveLength(1);
      expect(dishes[0].ingredients).toEqual([
        { ingredientId: 'i1', amount: 200 },
        { ingredientId: 'i2', amount: 50 },
      ]);
      expect(dishes[0].tags).toEqual(['breakfast']);
      expect(dishes[0].rating).toBe(5);
    });

    it('transforms day_plans with JSON-parsed arrays', () => {
      const tables: Record<string, unknown[]> = {
        day_plans: [
          {
            date: '2024-01-01',
            breakfast_dish_ids: '["d1"]',
            lunch_dish_ids: '["d2"]',
            dinner_dish_ids: '[]',
            servings: '{"d1":2}',
          },
        ],
      };

      const legacy = buildLegacyFormat(tables);
      const plans = legacy['mp-day-plans'] as Array<Record<string, unknown>>;

      expect(plans).toHaveLength(1);
      expect(plans[0].breakfastDishIds).toEqual(['d1']);
      expect(plans[0].lunchDishIds).toEqual(['d2']);
      expect(plans[0].dinnerDishIds).toEqual([]);
      expect(plans[0].servings).toEqual({ d1: 2 });
    });

    it('transforms user_profile', () => {
      const tables: Record<string, unknown[]> = {
        user_profile: [{ id: 'default', weight_kg: 70, protein_ratio: 2.5 }],
      };

      const legacy = buildLegacyFormat(tables);
      const profile = legacy['mp-user-profile'] as Record<string, unknown>;

      expect(profile.weight).toBe(70);
      expect(profile.proteinRatio).toBe(2.5);
    });

    it('transforms meal_templates by parsing data column', () => {
      const tplData = { id: 't1', name: 'Bulk', breakfastDishIds: ['d1'], lunchDishIds: [], dinnerDishIds: [] };
      const tables: Record<string, unknown[]> = {
        meal_templates: [{ id: 't1', name: 'Bulk', data: JSON.stringify(tplData) }],
      };

      const legacy = buildLegacyFormat(tables);
      const templates = legacy['meal-templates'] as Array<Record<string, unknown>>;

      expect(templates).toHaveLength(1);
      expect(templates[0]).toEqual(tplData);
    });

    it('returns empty object when all tables are empty', () => {
      const legacy = buildLegacyFormat({});
      expect(Object.keys(legacy)).toHaveLength(0);
    });
  });

  /* ---------- importV2Data ---------- */

  describe('importV2Data', () => {
    it('imports v2.0 data via execute in FK order (transaction)', async () => {
      const db = createMockDb();
      const v2Data: V2ExportPayload = {
        _version: '2.0',
        _exportedAt: '2026-03-23T10:00:00.000Z',
        _format: 'sqlite-json',
        tables: {
          ingredients: [
            {
              id: 'i1',
              name_vi: 'Gạo',
              name_en: null,
              calories_per_100: 130,
              protein_per_100: 2.7,
              carbs_per_100: 28,
              fat_per_100: 0.3,
              fiber_per_100: 0.4,
              unit_vi: 'g',
              unit_en: null,
            },
          ],
          dishes: [{ id: 'd1', name_vi: 'Cơm', name_en: null, tags: '[]', rating: null, notes: null }],
        },
      };

      const result = await importV2Data(db, v2Data as unknown as Record<string, unknown>);

      expect(result.success).toBe(true);
      expect(db.transaction).toHaveBeenCalledTimes(1);
      expect(db._stored['ingredients']).toEqual([
        {
          id: 'i1',
          name_vi: 'Gạo',
          name_en: null,
          calories_per_100: 130,
          protein_per_100: 2.7,
          carbs_per_100: 28,
          fat_per_100: 0.3,
          fiber_per_100: 0.4,
          unit_vi: 'g',
          unit_en: null,
        },
      ]);
      expect(db._stored['dishes']).toEqual([
        { id: 'd1', name_vi: 'Cơm', name_en: null, tags: '[]', rating: null, notes: null },
      ]);
    });

    it('returns ImportResult with importedCounts', async () => {
      const db = createMockDb();
      const v2Data: V2ExportPayload = {
        _version: '2.0',
        _exportedAt: '2026-01-01T00:00:00Z',
        _format: 'sqlite-json',
        tables: {
          ingredients: [{ id: 'i1', name_vi: 'A' }],
          dishes: [
            { id: 'd1', name_vi: 'B' },
            { id: 'd2', name_vi: 'C' },
          ],
        },
      };

      const result: ImportResult = await importV2Data(db, v2Data as unknown as Record<string, unknown>);

      expect(result.success).toBe(true);
      expect(result.importedCounts).toBeDefined();
      expect(result.importedCounts?.['ingredients']).toBe(1);
      expect(result.importedCounts?.['dishes']).toBe(2);
      expect(result.importedCounts?.['goals']).toBe(0);
    });

    it('imports all 16 tables populated with data', async () => {
      const db = createMockDb();
      const tables: Record<string, unknown[]> = {
        ingredients: [
          {
            id: 'i1',
            name_vi: 'Gạo',
            name_en: 'Rice',
            calories_per_100: 130,
            protein_per_100: 2.7,
            carbs_per_100: 28,
            fat_per_100: 0.3,
            fiber_per_100: 0.4,
            unit_vi: 'g',
            unit_en: 'g',
          },
        ],
        dishes: [{ id: 'd1', name_vi: 'Cơm', name_en: 'Rice', tags: '["breakfast"]', rating: 5, notes: null }],
        dish_ingredients: [{ dish_id: 'd1', ingredient_id: 'i1', amount: 200 }],
        day_plans: [
          {
            date: '2024-01-01',
            breakfast_dish_ids: '["d1"]',
            lunch_dish_ids: '[]',
            dinner_dish_ids: '[]',
            servings: null,
          },
        ],
        meal_templates: [{ id: 't1', name: 'Bulk', data: '{}' }],
        user_profile: [
          {
            id: 'default',
            gender: 'male',
            age: 30,
            height_cm: 170,
            weight_kg: 65,
            activity_level: 'moderate',
            body_fat_pct: null,
            bmr_override: null,
            protein_ratio: 2.0,
            fat_pct: 0.25,
            updated_at: '2026-01-01',
          },
        ],
        goals: [
          {
            id: 'g1',
            type: 'cut',
            rate_of_change: 'moderate',
            target_weight_kg: 60,
            calorie_offset: -300,
            start_date: '2024-01-01',
            end_date: null,
            is_active: 1,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
        exercises: [
          {
            id: 'e1',
            name_vi: 'Squat',
            name_en: 'Squat',
            muscle_group: 'legs',
            secondary_muscles: '[]',
            category: 'compound',
            equipment: '["barbell"]',
            contraindicated: '[]',
            exercise_type: 'strength',
            default_reps_min: 5,
            default_reps_max: 8,
            is_custom: 0,
            updated_at: '2024-01-01',
          },
        ],
        training_profile: [
          {
            id: 'default',
            training_experience: 'intermediate',
            days_per_week: 4,
            session_duration_min: 60,
            training_goal: 'hypertrophy',
            available_equipment: '["barbell"]',
            injury_restrictions: '[]',
            periodization_model: 'linear',
            plan_cycle_weeks: 4,
            priority_muscles: '[]',
            cardio_sessions_week: 2,
            cardio_type_pref: 'mixed',
            cardio_duration_min: 30,
            known_1rm: null,
            avg_sleep_hours: 7.5,
            updated_at: '2024-01-01',
          },
        ],
        training_plans: [
          {
            id: 'tp1',
            name: 'PPL',
            status: 'active',
            split_type: 'push_pull_legs',
            duration_weeks: 8,
            start_date: '2024-01-01',
            end_date: null,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
        training_plan_days: [
          {
            id: 'tpd1',
            plan_id: 'tp1',
            day_of_week: 1,
            workout_type: 'push',
            muscle_groups: '["chest"]',
            exercises: '["e1"]',
            notes: null,
          },
        ],
        workouts: [
          {
            id: 'w1',
            date: '2024-01-01',
            name: 'Push Day',
            duration_min: 60,
            notes: null,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
        workout_sets: [
          {
            id: 'ws1',
            workout_id: 'w1',
            exercise_id: 'e1',
            set_number: 1,
            reps: 8,
            weight_kg: 80,
            rpe: 8,
            rest_seconds: 120,
            duration_min: null,
            distance_km: null,
            avg_heart_rate: null,
            intensity: 'high',
            estimated_calories: null,
            updated_at: '2024-01-01',
          },
        ],
        weight_log: [
          {
            id: 'wl1',
            date: '2024-01-01',
            weight_kg: 65,
            notes: null,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
        daily_log: [
          {
            id: 'dl1',
            date: '2024-01-01',
            target_calories: 2200,
            actual_calories: 2100,
            target_protein: 130,
            actual_protein: 125,
            target_fat: null,
            actual_fat: 0,
            target_carbs: null,
            actual_carbs: 0,
            adherence_cal: 95,
            adherence_protein: 96,
            updated_at: '2024-01-01',
          },
        ],
        adjustments: [
          {
            id: 'a1',
            date: '2024-01-01',
            reason: 'weight stall',
            old_target_cal: 2200,
            new_target_cal: 2000,
            trigger_type: 'auto',
            moving_avg_weight: 65.2,
            applied: 1,
            created_at: '2024-01-01',
          },
        ],
      };

      const v2Data: V2ExportPayload = {
        _version: '2.0',
        _exportedAt: '2026-01-01T00:00:00Z',
        _format: 'sqlite-json',
        tables,
      };

      const result = await importV2Data(db, v2Data as unknown as Record<string, unknown>);

      expect(result.success).toBe(true);
      for (const tableName of ALL_TABLES) {
        expect(db._stored[tableName]).toEqual(tables[tableName]);
      }
      expect(result.importedCounts?.['ingredients']).toBe(1);
      expect(result.importedCounts?.['workout_sets']).toBe(1);
      expect(result.importedCounts?.['adjustments']).toBe(1);
    });

    it('handles empty tables gracefully (no INSERT executed)', async () => {
      const db = createMockDb();
      const v2Data: V2ExportPayload = {
        _version: '2.0',
        _exportedAt: '2026-03-23T10:00:00.000Z',
        _format: 'sqlite-json',
        tables: {},
      };

      const result = await importV2Data(db, v2Data as unknown as Record<string, unknown>);

      expect(result.success).toBe(true);
      const executeCalls = (db.execute as ReturnType<typeof vi.fn>).mock.calls;
      const insertCalls = executeCalls.filter(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('INSERT'),
      );
      expect(insertCalls).toHaveLength(0);
    });

    it('handles v2.0 data with missing tables field', async () => {
      const db = createMockDb();
      const data = { _version: '2.0', _exportedAt: '2026-01-01T00:00:00Z', _format: 'sqlite-json' };

      const result = await importV2Data(db, data as Record<string, unknown>);

      expect(result.success).toBe(true);
      expect(result.importedCounts).toBeDefined();
    });

    it('rolls back on transaction failure', async () => {
      let callCount = 0;
      const db = createMockDb(
        {},
        {
          executeError: (sql: string) => {
            if (sql.includes('INSERT')) {
              callCount += 1;
              if (callCount > 1) throw new Error('Simulated FK constraint violation');
            }
          },
        },
      );

      const v2Data: V2ExportPayload = {
        _version: '2.0',
        _exportedAt: '2026-01-01T00:00:00Z',
        _format: 'sqlite-json',
        tables: {
          ingredients: [{ id: 'i1', name_vi: 'A' }],
          dishes: [{ id: 'd1', name_vi: 'B' }],
        },
      };

      const result = await importV2Data(db, v2Data as unknown as Record<string, unknown>);

      expect(result.success).toBe(false);
      expect(result.error).toContain('FK constraint violation');
      expect(db._stored['ingredients']).toEqual([]);
      expect(db._stored['dishes']).toEqual([]);
    });

    it('handles corrupted data gracefully', async () => {
      const db = createMockDb(
        {},
        {
          executeError: () => {
            throw new Error('malformed SQL');
          },
        },
      );

      const v2Data: V2ExportPayload = {
        _version: '2.0',
        _exportedAt: '2026-01-01T00:00:00Z',
        _format: 'sqlite-json',
        tables: {
          ingredients: [{ id: 'i1' }],
        },
      };

      const result = await importV2Data(db, v2Data as unknown as Record<string, unknown>);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('skips rows with no columns', async () => {
      const db = createMockDb();
      const v2Data: V2ExportPayload = {
        _version: '2.0',
        _exportedAt: '2026-01-01T00:00:00Z',
        _format: 'sqlite-json',
        tables: {
          ingredients: [{}, { id: 'i1', name_vi: 'A' }],
        },
      };

      const result = await importV2Data(db, v2Data as unknown as Record<string, unknown>);

      expect(result.success).toBe(true);
      expect(db._stored['ingredients']).toEqual([{ id: 'i1', name_vi: 'A' }]);
    });

    it('converts undefined values to null', async () => {
      const db = createMockDb();
      const v2Data: V2ExportPayload = {
        _version: '2.0',
        _exportedAt: '2026-01-01T00:00:00Z',
        _format: 'sqlite-json',
        tables: {
          ingredients: [{ id: 'i1', name_vi: 'A', name_en: undefined }],
        },
      };

      const result = await importV2Data(db, v2Data as unknown as Record<string, unknown>);

      expect(result.success).toBe(true);
      expect(db._stored['ingredients'][0]).toEqual({ id: 'i1', name_vi: 'A', name_en: null });
    });
  });

  /* ---------- v1.x auto-upgrade ---------- */

  describe('v1.x auto-upgrade', () => {
    it('transforms v1.x ingredients with LocalizedString to flat rows', async () => {
      const db = createMockDb();
      const v1Data: Record<string, unknown> = {
        'mp-ingredients': [
          {
            id: 'i1',
            name: { vi: 'Gạo', en: 'Rice' },
            caloriesPer100: 130,
            proteinPer100: 2.7,
            carbsPer100: 28,
            fatPer100: 0.3,
            fiberPer100: 0.4,
            unit: { vi: 'g', en: 'g' },
          },
        ],
        _syncedAt: '2024-01-01T00:00:00Z',
      };

      const result = await importV2Data(db, v1Data);

      expect(result.success).toBe(true);
      expect(db._stored['ingredients']).toEqual([
        {
          id: 'i1',
          name_vi: 'Gạo',
          name_en: 'Rice',
          calories_per_100: 130,
          protein_per_100: 2.7,
          carbs_per_100: 28,
          fat_per_100: 0.3,
          fiber_per_100: 0.4,
          unit_vi: 'g',
          unit_en: 'g',
        },
      ]);
    });

    it('transforms v1.x dishes with embedded ingredients to separate tables', async () => {
      const db = createMockDb();
      const v1Data: Record<string, unknown> = {
        'mp-dishes': [
          {
            id: 'd1',
            name: { vi: 'Cơm rang' },
            ingredients: [{ ingredientId: 'i1', amount: 200 }],
            tags: ['breakfast'],
            rating: 5,
          },
        ],
      };

      const result = await importV2Data(db, v1Data);

      expect(result.success).toBe(true);
      expect(db._stored['dishes']).toEqual([
        { id: 'd1', name_vi: 'Cơm rang', name_en: null, tags: '["breakfast"]', rating: 5, notes: null },
      ]);
      expect(db._stored['dish_ingredients']).toEqual([{ dish_id: 'd1', ingredient_id: 'i1', amount: 200 }]);
    });

    it('transforms v1.x day_plans with camelCase to snake_case', async () => {
      const db = createMockDb();
      const v1Data: Record<string, unknown> = {
        'mp-day-plans': [
          {
            date: '2024-01-01',
            breakfastDishIds: ['d1'],
            lunchDishIds: ['d2'],
            dinnerDishIds: [],
            servings: { d1: 2 },
          },
        ],
      };

      const result = await importV2Data(db, v1Data);

      expect(result.success).toBe(true);
      expect(db._stored['day_plans']).toEqual([
        {
          date: '2024-01-01',
          breakfast_dish_ids: '["d1"]',
          lunch_dish_ids: '["d2"]',
          dinner_dish_ids: '[]',
          servings: '{"d1":2}',
        },
      ]);
    });

    it('transforms v1.x user_profile to v2 schema row', async () => {
      const db = createMockDb();
      const v1Data: Record<string, unknown> = {
        'mp-user-profile': { weight: 70, proteinRatio: 2.5, targetCalories: 2000 },
      };

      const result = await importV2Data(db, v1Data);

      expect(result.success).toBe(true);
      const profile = db._stored['user_profile'][0] as Record<string, unknown>;
      expect(profile.id).toBe('default');
      expect(profile.weight_kg).toBe(70);
      expect(profile.protein_ratio).toBe(2.5);
      expect(profile.gender).toBe('male');
      expect(profile.activity_level).toBe('moderate');
    });

    it('transforms v1.x meal-templates with JSON data column', async () => {
      const db = createMockDb();
      const tpl = { id: 't1', name: 'Bulk', breakfastDishIds: ['d1'] };
      const v1Data: Record<string, unknown> = {
        'meal-templates': [tpl],
      };

      const result = await importV2Data(db, v1Data);

      expect(result.success).toBe(true);
      expect(db._stored['meal_templates']).toEqual([{ id: 't1', name: 'Bulk', data: JSON.stringify(tpl) }]);
    });

    it('handles v1.x data with missing keys gracefully', async () => {
      const db = createMockDb();
      const v1Data: Record<string, unknown> = {
        'mp-dishes': [{ id: 'd1', name: { vi: 'Cơm' }, ingredients: [], tags: [] }],
        _syncedAt: '2024-01-01T00:00:00Z',
      };

      const result = await importV2Data(db, v1Data);

      expect(result.success).toBe(true);
      expect(db._stored['dishes']).toHaveLength(1);
      expect(db._stored['ingredients']).toEqual([]);
      expect(db._stored['day_plans']).toEqual([]);
    });

    it('detects v1.x version for _version: "1.0"', async () => {
      const db = createMockDb();
      const v1Data: Record<string, unknown> = {
        _version: '1.0',
        'mp-ingredients': [
          {
            id: 'i1',
            name: { vi: 'Gạo' },
            caloriesPer100: 100,
            proteinPer100: 2,
            carbsPer100: 20,
            fatPer100: 0.5,
            fiberPer100: 0.3,
            unit: { vi: 'g' },
          },
        ],
      };

      const result = await importV2Data(db, v1Data);

      expect(result.success).toBe(true);
      expect(db._stored['ingredients']).toHaveLength(1);
    });
  });

  /* ---------- Round-trip ---------- */

  describe('round-trip', () => {
    it('export → import → export produces same table data', async () => {
      const seedTables: Record<string, unknown[]> = {
        ingredients: [
          {
            id: 'i1',
            name_vi: 'Gạo',
            name_en: 'Rice',
            calories_per_100: 130,
            protein_per_100: 2.7,
            carbs_per_100: 28,
            fat_per_100: 0.3,
            fiber_per_100: 0.4,
            unit_vi: 'g',
            unit_en: 'g',
          },
        ],
        dishes: [{ id: 'd1', name_vi: 'Cơm', name_en: 'Rice', tags: '["breakfast"]', rating: 5, notes: null }],
        dish_ingredients: [{ dish_id: 'd1', ingredient_id: 'i1', amount: 200 }],
        day_plans: [],
        meal_templates: [],
        user_profile: [],
        goals: [],
        training_profile: [],
        training_plans: [],
        training_plan_days: [],
        exercises: [],
        workouts: [],
        workout_sets: [],
        weight_log: [],
        daily_log: [],
        adjustments: [],
      };

      const db1 = createMockDb(seedTables);
      const exported1 = await createV2Export(db1);

      const db2 = createMockDb();
      const importResult = await importV2Data(db2, exported1 as unknown as Record<string, unknown>);
      expect(importResult.success).toBe(true);

      const db3 = createMockDb(db2._stored);
      const exported2 = await createV2Export(db3);

      expect(exported2._version).toBe('2.0');
      expect(exported2._format).toBe('sqlite-json');
      expect(exported2.tables).toEqual(exported1.tables);
    });

    it('round-trip preserves _legacyFormat structure', async () => {
      const seedTables: Record<string, unknown[]> = {
        ingredients: [
          {
            id: 'i1',
            name_vi: 'Gạo',
            name_en: 'Rice',
            calories_per_100: 130,
            protein_per_100: 2.7,
            carbs_per_100: 28,
            fat_per_100: 0.3,
            fiber_per_100: 0.4,
            unit_vi: 'g',
            unit_en: 'g',
          },
        ],
        dishes: [{ id: 'd1', name_vi: 'Cơm', name_en: null, tags: '["breakfast"]', rating: 5, notes: null }],
        dish_ingredients: [{ dish_id: 'd1', ingredient_id: 'i1', amount: 200 }],
      };

      const db = createMockDb(seedTables);
      const exported = await createV2Export(db);

      expect(exported._legacyFormat).toBeDefined();
      const legacy = exported._legacyFormat as Record<string, unknown>;
      expect(legacy['mp-ingredients']).toBeDefined();
      expect(legacy['mp-dishes']).toBeDefined();
      const dishes = legacy['mp-dishes'] as Array<Record<string, unknown>>;
      expect(dishes[0].ingredients).toEqual([{ ingredientId: 'i1', amount: 200 }]);
    });
  });
});
