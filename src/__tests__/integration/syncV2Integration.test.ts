import type { DatabaseService } from '../../services/databaseService';
import type { ImportResult, V2ExportPayload } from '../../services/syncV2Utils';
import { buildLegacyFormat, createV2Export, detectVersion, importV2Data } from '../../services/syncV2Utils';

/* ------------------------------------------------------------------ */
/*  All 16 schema table names                                           */
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
/*  Realistic seed data for all 16 tables                               */
/* ------------------------------------------------------------------ */
function buildFullSeedData(): Record<string, unknown[]> {
  return {
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
        name_vi: 'Trứng gà',
        name_en: 'Chicken egg',
        calories_per_100: 155,
        protein_per_100: 13,
        carbs_per_100: 1.1,
        fat_per_100: 11,
        fiber_per_100: 0,
        unit_vi: 'quả',
        unit_en: 'egg',
      },
      {
        id: 'i3',
        name_vi: 'Ức gà',
        name_en: 'Chicken breast',
        calories_per_100: 165,
        protein_per_100: 31,
        carbs_per_100: 0,
        fat_per_100: 3.6,
        fiber_per_100: 0,
        unit_vi: 'g',
        unit_en: 'g',
      },
    ],
    dishes: [
      {
        id: 'd1',
        name_vi: 'Cơm rang trứng',
        name_en: 'Egg fried rice',
        tags: '["breakfast","quick"]',
        rating: 4,
        notes: 'Easy to make',
      },
      {
        id: 'd2',
        name_vi: 'Ức gà luộc',
        name_en: 'Boiled chicken breast',
        tags: '["lunch","high-protein"]',
        rating: 5,
        notes: null,
      },
    ],
    dish_ingredients: [
      { dish_id: 'd1', ingredient_id: 'i1', amount: 200 },
      { dish_id: 'd1', ingredient_id: 'i2', amount: 100 },
      { dish_id: 'd2', ingredient_id: 'i3', amount: 250 },
    ],
    day_plans: [
      {
        date: '2024-06-01',
        breakfast_dish_ids: '["d1"]',
        lunch_dish_ids: '["d2"]',
        dinner_dish_ids: '["d1","d2"]',
        servings: '{"d1":1,"d2":1.5}',
      },
      {
        date: '2024-06-02',
        breakfast_dish_ids: '[]',
        lunch_dish_ids: '["d1"]',
        dinner_dish_ids: '["d2"]',
        servings: null,
      },
    ],
    meal_templates: [
      {
        id: 't1',
        name: 'Bulk Plan',
        data: JSON.stringify({
          id: 't1',
          name: 'Bulk Plan',
          breakfastDishIds: ['d1'],
          lunchDishIds: ['d2'],
          dinnerDishIds: ['d1', 'd2'],
        }),
      },
    ],
    user_profile: [
      {
        id: 'default',
        gender: 'male',
        age: 28,
        height_cm: 175,
        weight_kg: 72,
        activity_level: 'active',
        body_fat_pct: 15.0,
        bmr_override: null,
        protein_ratio: 2.2,
        fat_pct: 0.25,
        updated_at: '2024-06-01T08:00:00.000Z',
      },
    ],
    goals: [
      {
        id: 'g1',
        type: 'cut',
        rate_of_change: 'moderate',
        target_weight_kg: 68,
        calorie_offset: -300,
        start_date: '2024-06-01',
        end_date: '2024-09-01',
        is_active: 1,
        created_at: '2024-06-01T00:00:00Z',
        updated_at: '2024-06-01T00:00:00Z',
      },
    ],
    exercises: [
      {
        id: 'e1',
        name_vi: 'Squat',
        name_en: 'Barbell Back Squat',
        muscle_group: 'legs',
        secondary_muscles: '["glutes","core"]',
        category: 'compound',
        equipment: '["barbell","rack"]',
        contraindicated: '[]',
        exercise_type: 'strength',
        default_reps_min: 5,
        default_reps_max: 8,
        is_custom: 0,
        updated_at: '2024-06-01T00:00:00Z',
      },
      {
        id: 'e2',
        name_vi: 'Chạy bộ',
        name_en: 'Running',
        muscle_group: 'cardio',
        secondary_muscles: '["legs"]',
        category: 'compound',
        equipment: '["treadmill"]',
        contraindicated: '[]',
        exercise_type: 'cardio',
        default_reps_min: 1,
        default_reps_max: 1,
        is_custom: 0,
        updated_at: '2024-06-01T00:00:00Z',
      },
    ],
    training_profile: [
      {
        id: 'default',
        training_experience: 'intermediate',
        days_per_week: 4,
        session_duration_min: 60,
        training_goal: 'hypertrophy',
        available_equipment: '["barbell","dumbbell","cable"]',
        injury_restrictions: '[]',
        periodization_model: 'undulating',
        plan_cycle_weeks: 6,
        priority_muscles: '["chest","back"]',
        cardio_sessions_week: 2,
        cardio_type_pref: 'mixed',
        cardio_duration_min: 30,
        known_1rm: '{"squat":120,"bench":80,"deadlift":150}',
        avg_sleep_hours: 7.5,
        updated_at: '2024-06-01T00:00:00Z',
      },
    ],
    training_plans: [
      {
        id: 'tp1',
        name: 'PPL Summer Cut',
        status: 'active',
        split_type: 'push_pull_legs',
        duration_weeks: 8,
        start_date: '2024-06-01',
        end_date: '2024-07-27',
        created_at: '2024-06-01T00:00:00Z',
        updated_at: '2024-06-01T00:00:00Z',
      },
    ],
    training_plan_days: [
      {
        id: 'tpd1',
        plan_id: 'tp1',
        day_of_week: 1,
        workout_type: 'push',
        muscle_groups: '["chest","shoulders","triceps"]',
        exercises: '["e1"]',
        notes: 'Heavy compound focus',
      },
      {
        id: 'tpd2',
        plan_id: 'tp1',
        day_of_week: 3,
        workout_type: 'pull',
        muscle_groups: '["back","biceps"]',
        exercises: '[]',
        notes: null,
      },
    ],
    workouts: [
      {
        id: 'w1',
        date: '2024-06-01',
        name: 'Push Day A',
        duration_min: 65,
        notes: 'Felt strong',
        created_at: '2024-06-01T09:00:00Z',
        updated_at: '2024-06-01T10:05:00Z',
      },
    ],
    workout_sets: [
      {
        id: 'ws1',
        workout_id: 'w1',
        exercise_id: 'e1',
        set_number: 1,
        reps: 8,
        weight_kg: 100,
        rpe: 7.5,
        rest_seconds: 180,
        duration_min: null,
        distance_km: null,
        avg_heart_rate: null,
        intensity: 'high',
        estimated_calories: null,
        updated_at: '2024-06-01T09:10:00Z',
      },
      {
        id: 'ws2',
        workout_id: 'w1',
        exercise_id: 'e1',
        set_number: 2,
        reps: 7,
        weight_kg: 100,
        rpe: 8.5,
        rest_seconds: 180,
        duration_min: null,
        distance_km: null,
        avg_heart_rate: null,
        intensity: 'high',
        estimated_calories: null,
        updated_at: '2024-06-01T09:15:00Z',
      },
    ],
    weight_log: [
      {
        id: 'wl1',
        date: '2024-06-01',
        weight_kg: 72.3,
        notes: 'Morning fasted',
        created_at: '2024-06-01T06:00:00Z',
        updated_at: '2024-06-01T06:00:00Z',
      },
      {
        id: 'wl2',
        date: '2024-06-02',
        weight_kg: 72.1,
        notes: null,
        created_at: '2024-06-02T06:00:00Z',
        updated_at: '2024-06-02T06:00:00Z',
      },
    ],
    daily_log: [
      {
        id: 'dl1',
        date: '2024-06-01',
        target_calories: 2200,
        actual_calories: 2150,
        target_protein: 158,
        actual_protein: 162,
        target_fat: 61,
        actual_fat: 58,
        target_carbs: 248,
        actual_carbs: 240,
        adherence_cal: 97,
        adherence_protein: 102,
        updated_at: '2024-06-01T22:00:00Z',
      },
    ],
    adjustments: [
      {
        id: 'a1',
        date: '2024-06-15',
        reason: '2-week weight stall',
        old_target_cal: 2200,
        new_target_cal: 2050,
        trigger_type: 'auto',
        moving_avg_weight: 71.8,
        applied: 1,
        created_at: '2024-06-15T00:00:00Z',
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/*  Mock DatabaseService (same pattern as unit tests)                    */
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
    exportBinary: vi.fn(() => new Uint8Array()),
    importBinary: vi.fn(),
    exportToJSON: vi.fn(async () => JSON.stringify(_stored)),
    importFromJSON: vi.fn(async (json: string) => {
      const parsed = JSON.parse(json) as Record<string, unknown[]>;
      for (const key of Object.keys(_stored)) _stored[key] = [];
      for (const [key, value] of Object.entries(parsed)) _stored[key] = value;
    }),
  };
}

/* ================================================================== */
/*  Integration Tests                                                   */
/* ================================================================== */

describe('syncV2 Integration', () => {
  /* ---------------------------------------------------------------- */
  /*  1. Round-trip: export → import → export → compare                 */
  /* ---------------------------------------------------------------- */

  describe('round-trip: export → import → export → compare', () => {
    it('produces identical table data across full round-trip with all 16 tables', async () => {
      const seed = buildFullSeedData();
      const dbSource = createMockDb(seed);

      const export1 = await createV2Export(dbSource);

      expect(export1._version).toBe('2.0');
      expect(export1._format).toBe('sqlite-json');

      const dbTarget = createMockDb();
      const importResult = await importV2Data(dbTarget, export1 as unknown as Record<string, unknown>);
      expect(importResult.success).toBe(true);

      const dbReExport = createMockDb(dbTarget._stored);
      const export2 = await createV2Export(dbReExport);

      expect(export2.tables).toEqual(export1.tables);
    });

    it('preserves every row in every table through the round-trip', async () => {
      const seed = buildFullSeedData();
      const dbSource = createMockDb(seed);
      const export1 = await createV2Export(dbSource);

      const dbTarget = createMockDb();
      await importV2Data(dbTarget, export1 as unknown as Record<string, unknown>);

      for (const tableName of ALL_TABLES) {
        expect(dbTarget._stored[tableName]).toEqual(seed[tableName]);
      }
    });

    it('preserves _legacyFormat through the round-trip', async () => {
      const seed = buildFullSeedData();
      const dbSource = createMockDb(seed);
      const export1 = await createV2Export(dbSource);

      expect(export1._legacyFormat).toBeDefined();

      const dbTarget = createMockDb();
      await importV2Data(dbTarget, export1 as unknown as Record<string, unknown>);
      const dbReExport = createMockDb(dbTarget._stored);
      const export2 = await createV2Export(dbReExport);

      expect(export2._legacyFormat).toEqual(export1._legacyFormat);
    });

    it('handles numeric precision correctly (REAL columns)', async () => {
      const seed: Record<string, unknown[]> = {
        ingredients: [
          {
            id: 'i-precise',
            name_vi: 'Test',
            name_en: null,
            calories_per_100: 99.999,
            protein_per_100: 0.001,
            carbs_per_100: 33.333,
            fat_per_100: 12.567,
            fiber_per_100: 0.0,
            unit_vi: 'g',
            unit_en: null,
          },
        ],
      };

      const db1 = createMockDb(seed);
      const exported = await createV2Export(db1);

      const db2 = createMockDb();
      await importV2Data(db2, exported as unknown as Record<string, unknown>);

      const row = db2._stored['ingredients'][0] as Record<string, unknown>;
      expect(row.calories_per_100).toBe(99.999);
      expect(row.protein_per_100).toBe(0.001);
      expect(row.carbs_per_100).toBe(33.333);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  2. Import with all 16 tables populated                            */
  /* ---------------------------------------------------------------- */

  describe('import with all 16 tables populated', () => {
    it('imports every table and verifies row counts', async () => {
      const seed = buildFullSeedData();
      const db = createMockDb();

      const v2Data: V2ExportPayload = {
        _version: '2.0',
        _exportedAt: new Date().toISOString(),
        _format: 'sqlite-json',
        tables: seed,
      };

      const result: ImportResult = await importV2Data(db, v2Data as unknown as Record<string, unknown>);

      expect(result.success).toBe(true);
      expect(result.importedCounts).toBeDefined();

      expect(result.importedCounts?.['ingredients']).toBe(3);
      expect(result.importedCounts?.['dishes']).toBe(2);
      expect(result.importedCounts?.['dish_ingredients']).toBe(3);
      expect(result.importedCounts?.['day_plans']).toBe(2);
      expect(result.importedCounts?.['meal_templates']).toBe(1);
      expect(result.importedCounts?.['user_profile']).toBe(1);
      expect(result.importedCounts?.['goals']).toBe(1);
      expect(result.importedCounts?.['exercises']).toBe(2);
      expect(result.importedCounts?.['training_profile']).toBe(1);
      expect(result.importedCounts?.['training_plans']).toBe(1);
      expect(result.importedCounts?.['training_plan_days']).toBe(2);
      expect(result.importedCounts?.['workouts']).toBe(1);
      expect(result.importedCounts?.['workout_sets']).toBe(2);
      expect(result.importedCounts?.['weight_log']).toBe(2);
      expect(result.importedCounts?.['daily_log']).toBe(1);
      expect(result.importedCounts?.['adjustments']).toBe(1);
    });

    it('verifies data integrity for every table after import', async () => {
      const seed = buildFullSeedData();
      const db = createMockDb();

      const v2Data: V2ExportPayload = {
        _version: '2.0',
        _exportedAt: new Date().toISOString(),
        _format: 'sqlite-json',
        tables: seed,
      };

      await importV2Data(db, v2Data as unknown as Record<string, unknown>);

      for (const tableName of ALL_TABLES) {
        expect(db._stored[tableName]).toEqual(seed[tableName]);
      }
    });

    it('clears pre-existing data before importing', async () => {
      const existingData: Record<string, unknown[]> = {
        ingredients: [
          {
            id: 'old-i1',
            name_vi: 'Old',
            name_en: null,
            calories_per_100: 0,
            protein_per_100: 0,
            carbs_per_100: 0,
            fat_per_100: 0,
            fiber_per_100: 0,
            unit_vi: 'g',
            unit_en: null,
          },
        ],
      };
      const db = createMockDb(existingData);

      const seed = buildFullSeedData();
      const v2Data: V2ExportPayload = {
        _version: '2.0',
        _exportedAt: new Date().toISOString(),
        _format: 'sqlite-json',
        tables: seed,
      };

      await importV2Data(db, v2Data as unknown as Record<string, unknown>);

      expect(db._stored['ingredients']).toEqual(seed['ingredients']);
      const ids = (db._stored['ingredients'] as Array<Record<string, unknown>>).map(r => r.id);
      expect(ids).not.toContain('old-i1');
    });
  });

  /* ---------------------------------------------------------------- */
  /*  3. Import with empty tables                                       */
  /* ---------------------------------------------------------------- */

  describe('import with empty tables', () => {
    it('imports successfully when some tables have data and others are empty', async () => {
      const partialData: Record<string, unknown[]> = {
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
        dishes: [],
        dish_ingredients: [],
        day_plans: [],
        meal_templates: [],
        user_profile: [],
        goals: [],
        exercises: [],
        training_profile: [],
        training_plans: [],
        training_plan_days: [],
        workouts: [],
        workout_sets: [],
        weight_log: [],
        daily_log: [],
        adjustments: [],
      };

      const db = createMockDb();
      const v2Data: V2ExportPayload = {
        _version: '2.0',
        _exportedAt: new Date().toISOString(),
        _format: 'sqlite-json',
        tables: partialData,
      };

      const result = await importV2Data(db, v2Data as unknown as Record<string, unknown>);

      expect(result.success).toBe(true);
      expect(db._stored['ingredients']).toHaveLength(1);
      expect(result.importedCounts?.['ingredients']).toBe(1);
      expect(result.importedCounts?.['dishes']).toBe(0);
      expect(result.importedCounts?.['workout_sets']).toBe(0);
    });

    it('imports successfully when all tables are explicitly empty arrays', async () => {
      const allEmpty: Record<string, unknown[]> = {};
      for (const t of ALL_TABLES) allEmpty[t] = [];

      const db = createMockDb();
      const v2Data: V2ExportPayload = {
        _version: '2.0',
        _exportedAt: new Date().toISOString(),
        _format: 'sqlite-json',
        tables: allEmpty,
      };

      const result = await importV2Data(db, v2Data as unknown as Record<string, unknown>);

      expect(result.success).toBe(true);
      for (const t of ALL_TABLES) {
        expect(result.importedCounts?.[t]).toBe(0);
        expect(db._stored[t]).toEqual([]);
      }
    });

    it('imports successfully when tables key is missing entirely', async () => {
      const db = createMockDb();
      const v2Data = {
        _version: '2.0' as const,
        _exportedAt: new Date().toISOString(),
        _format: 'sqlite-json' as const,
      };

      const result = await importV2Data(db, v2Data as unknown as Record<string, unknown>);

      expect(result.success).toBe(true);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  4. Import with FK violations — rollback                           */
  /* ---------------------------------------------------------------- */

  describe('import with FK violations — transaction rollback', () => {
    it('rolls back entire transaction when workout_sets references non-existent workout_id', async () => {
      const preExisting: Record<string, unknown[]> = {
        ingredients: [
          {
            id: 'pre-i1',
            name_vi: 'Pre',
            name_en: null,
            calories_per_100: 0,
            protein_per_100: 0,
            carbs_per_100: 0,
            fat_per_100: 0,
            fiber_per_100: 0,
            unit_vi: 'g',
            unit_en: null,
          },
        ],
      };

      let insertCount = 0;
      const db = createMockDb(preExisting, {
        executeError: (sql: string) => {
          if (sql.includes('INSERT') && sql.includes('workout_sets')) {
            insertCount += 1;
            if (insertCount >= 1) {
              throw new Error('FOREIGN KEY constraint failed: workout_sets.workout_id');
            }
          }
        },
      });

      const badData: Record<string, unknown[]> = {
        ingredients: [
          {
            id: 'i1',
            name_vi: 'New',
            name_en: null,
            calories_per_100: 100,
            protein_per_100: 5,
            carbs_per_100: 20,
            fat_per_100: 1,
            fiber_per_100: 0,
            unit_vi: 'g',
            unit_en: null,
          },
        ],
        exercises: [
          {
            id: 'e1',
            name_vi: 'Squat',
            name_en: null,
            muscle_group: 'legs',
            secondary_muscles: '[]',
            category: 'compound',
            equipment: '[]',
            contraindicated: '[]',
            exercise_type: 'strength',
            default_reps_min: 8,
            default_reps_max: 12,
            is_custom: 0,
            updated_at: '2024-01-01',
          },
        ],
        workout_sets: [
          {
            id: 'ws-bad',
            workout_id: 'non-existent-workout',
            exercise_id: 'e1',
            set_number: 1,
            reps: 10,
            weight_kg: 60,
            rpe: null,
            rest_seconds: null,
            duration_min: null,
            distance_km: null,
            avg_heart_rate: null,
            intensity: 'moderate',
            estimated_calories: null,
            updated_at: '2024-01-01',
          },
        ],
      };

      const v2Data: V2ExportPayload = {
        _version: '2.0',
        _exportedAt: new Date().toISOString(),
        _format: 'sqlite-json',
        tables: badData,
      };

      const result = await importV2Data(db, v2Data as unknown as Record<string, unknown>);

      expect(result.success).toBe(false);
      expect(result.error).toContain('FOREIGN KEY constraint failed');
      expect(db._stored['ingredients']).toEqual(preExisting['ingredients']);
      expect(db._stored['workout_sets']).toEqual([]);
    });

    it('database remains completely unchanged after rollback', async () => {
      const preExisting = buildFullSeedData();
      let insertCount = 0;
      const db = createMockDb(preExisting, {
        executeError: (sql: string) => {
          if (sql.includes('INSERT')) {
            insertCount += 1;
            if (insertCount >= 2) {
              throw new Error('Simulated constraint violation on second insert');
            }
          }
        },
      });

      const snapshotBefore = JSON.parse(JSON.stringify(db._stored)) as Record<string, unknown[]>;

      const newData: V2ExportPayload = {
        _version: '2.0',
        _exportedAt: new Date().toISOString(),
        _format: 'sqlite-json',
        tables: {
          ingredients: [{ id: 'new-i1', name_vi: 'New' }],
          dishes: [{ id: 'new-d1', name_vi: 'New Dish' }],
        },
      };

      const result = await importV2Data(db, newData as unknown as Record<string, unknown>);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Simulated constraint violation');
      expect(db._stored).toEqual(snapshotBefore);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  5. v1.x detection + auto-upgrade                                  */
  /* ---------------------------------------------------------------- */

  describe('v1.x detection + auto-upgrade', () => {
    it('detects v1.x format and transforms to v2 tables', async () => {
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
        'mp-dishes': [
          {
            id: 'd1',
            name: { vi: 'Cơm rang' },
            ingredients: [{ ingredientId: 'i1', amount: 200 }],
            tags: ['breakfast'],
            rating: 4,
          },
        ],
        'mp-day-plans': [
          {
            date: '2024-06-01',
            breakfastDishIds: ['d1'],
            lunchDishIds: [],
            dinnerDishIds: ['d1'],
            servings: { d1: 2 },
          },
        ],
        'mp-user-profile': {
          weight: 72,
          proteinRatio: 2.2,
          targetCalories: 2200,
        },
        'meal-templates': [{ id: 't1', name: 'Cut', breakfastDishIds: ['d1'] }],
        _syncedAt: '2024-06-01T00:00:00Z',
      };

      expect(detectVersion(v1Data)).toBe('1.x');

      const db = createMockDb();
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

      expect(db._stored['dishes']).toEqual([
        {
          id: 'd1',
          name_vi: 'Cơm rang',
          name_en: null,
          tags: '["breakfast"]',
          rating: 4,
          notes: null,
        },
      ]);

      expect(db._stored['dish_ingredients']).toEqual([{ dish_id: 'd1', ingredient_id: 'i1', amount: 200 }]);

      expect(db._stored['day_plans']).toEqual([
        {
          date: '2024-06-01',
          breakfast_dish_ids: '["d1"]',
          lunch_dish_ids: '[]',
          dinner_dish_ids: '["d1"]',
          servings: '{"d1":2}',
        },
      ]);

      const profile = db._stored['user_profile'][0] as Record<string, unknown>;
      expect(profile.id).toBe('default');
      expect(profile.weight_kg).toBe(72);
      expect(profile.protein_ratio).toBe(2.2);
      expect(profile.gender).toBe('male');
      expect(profile.activity_level).toBe('moderate');

      expect(db._stored['meal_templates']).toEqual([
        {
          id: 't1',
          name: 'Cut',
          data: JSON.stringify({ id: 't1', name: 'Cut', breakfastDishIds: ['d1'] }),
        },
      ]);
    });

    it('handles v1.x data with only some keys present', async () => {
      const v1Data: Record<string, unknown> = {
        'mp-ingredients': [
          {
            id: 'i1',
            name: { vi: 'Trứng' },
            caloriesPer100: 155,
            proteinPer100: 13,
            carbsPer100: 1.1,
            fatPer100: 11,
            fiberPer100: 0,
            unit: { vi: 'quả' },
          },
        ],
      };

      const db = createMockDb();
      const result = await importV2Data(db, v1Data);

      expect(result.success).toBe(true);
      expect(db._stored['ingredients']).toHaveLength(1);
      expect(db._stored['dishes']).toEqual([]);
      expect(db._stored['day_plans']).toEqual([]);
      expect(db._stored['user_profile']).toEqual([]);
      expect(db._stored['meal_templates']).toEqual([]);
    });

    it('transforms v1.x data that uses snake_case property names (fallback)', async () => {
      const v1Data: Record<string, unknown> = {
        'mp-ingredients': [
          {
            id: 'i1',
            name: { vi: 'Gạo' },
            calories_per_100: 130,
            protein_per_100: 2.7,
            carbs_per_100: 28,
            fat_per_100: 0.3,
            fiber_per_100: 0.4,
            unit: { vi: 'g' },
          },
        ],
      };

      const db = createMockDb();
      const result = await importV2Data(db, v1Data);

      expect(result.success).toBe(true);
      const row = db._stored['ingredients'][0] as Record<string, unknown>;
      expect(row.calories_per_100).toBe(130);
      expect(row.protein_per_100).toBe(2.7);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  6. _legacyFormat backward compatibility                           */
  /* ---------------------------------------------------------------- */

  describe('_legacyFormat backward compatibility', () => {
    it('export includes _legacyFormat section when data exists', async () => {
      const seed = buildFullSeedData();
      const db = createMockDb(seed);
      const exported = await createV2Export(db);

      expect(exported._legacyFormat).toBeDefined();
    });

    it('legacy keys contain correct mp-ingredients data with LocalizedString', async () => {
      const seed = buildFullSeedData();
      const db = createMockDb(seed);
      const exported = await createV2Export(db);
      const legacy = exported._legacyFormat as Record<string, unknown>;

      const ingredients = legacy['mp-ingredients'] as Array<Record<string, unknown>>;
      expect(ingredients).toHaveLength(3);

      expect(ingredients[0]).toEqual({
        id: 'i1',
        name: { vi: 'Gạo', en: 'Rice' },
        caloriesPer100: 130,
        proteinPer100: 2.7,
        carbsPer100: 28,
        fatPer100: 0.3,
        fiberPer100: 0.4,
        unit: { vi: 'g', en: 'g' },
      });

      expect(ingredients[1].name).toEqual({ vi: 'Trứng gà', en: 'Chicken egg' });
      expect(ingredients[1].unit).toEqual({ vi: 'quả', en: 'egg' });
    });

    it('legacy keys contain correct mp-dishes with re-embedded ingredients', async () => {
      const seed = buildFullSeedData();
      const db = createMockDb(seed);
      const exported = await createV2Export(db);
      const legacy = exported._legacyFormat as Record<string, unknown>;

      const dishes = legacy['mp-dishes'] as Array<Record<string, unknown>>;
      expect(dishes).toHaveLength(2);

      const dish1 = dishes[0];
      expect(dish1.id).toBe('d1');
      expect(dish1.name).toEqual({ vi: 'Cơm rang trứng', en: 'Egg fried rice' });
      expect(dish1.tags).toEqual(['breakfast', 'quick']);
      expect(dish1.rating).toBe(4);
      expect(dish1.ingredients).toEqual([
        { ingredientId: 'i1', amount: 200 },
        { ingredientId: 'i2', amount: 100 },
      ]);

      const dish2 = dishes[1];
      expect(dish2.ingredients).toEqual([{ ingredientId: 'i3', amount: 250 }]);
    });

    it('legacy keys contain correct mp-day-plans with camelCase keys', async () => {
      const seed = buildFullSeedData();
      const db = createMockDb(seed);
      const exported = await createV2Export(db);
      const legacy = exported._legacyFormat as Record<string, unknown>;

      const plans = legacy['mp-day-plans'] as Array<Record<string, unknown>>;
      expect(plans).toHaveLength(2);
      expect(plans[0].breakfastDishIds).toEqual(['d1']);
      expect(plans[0].lunchDishIds).toEqual(['d2']);
      expect(plans[0].dinnerDishIds).toEqual(['d1', 'd2']);
      expect(plans[0].servings).toEqual({ d1: 1, d2: 1.5 });
    });

    it('legacy keys contain correct mp-user-profile', async () => {
      const seed = buildFullSeedData();
      const db = createMockDb(seed);
      const exported = await createV2Export(db);
      const legacy = exported._legacyFormat as Record<string, unknown>;

      const profile = legacy['mp-user-profile'] as Record<string, unknown>;
      expect(profile.weight).toBe(72);
      expect(profile.proteinRatio).toBe(2.2);
    });

    it('legacy keys contain correct meal-templates with parsed data', async () => {
      const seed = buildFullSeedData();
      const db = createMockDb(seed);
      const exported = await createV2Export(db);
      const legacy = exported._legacyFormat as Record<string, unknown>;

      const templates = legacy['meal-templates'] as Array<Record<string, unknown>>;
      expect(templates).toHaveLength(1);
      expect(templates[0]).toEqual({
        id: 't1',
        name: 'Bulk Plan',
        breakfastDishIds: ['d1'],
        lunchDishIds: ['d2'],
        dinnerDishIds: ['d1', 'd2'],
      });
    });

    it('omits _legacyFormat when all tables are empty', async () => {
      const db = createMockDb();
      const exported = await createV2Export(db);
      expect(exported._legacyFormat).toBeUndefined();
    });

    it('buildLegacyFormat restores LocalizedString (flat → {vi, en})', () => {
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

      expect(items[0].name).toEqual({ vi: 'Gạo', en: 'Rice' });
      expect(items[0].unit).toEqual({ vi: 'g', en: 'g' });
      expect(items[1].name).toEqual({ vi: 'Trứng' });
      expect(items[1].unit).toEqual({ vi: 'quả' });
    });
  });

  /* ---------------------------------------------------------------- */
  /*  7. Version detection edge cases                                   */
  /* ---------------------------------------------------------------- */

  describe('version detection edge cases', () => {
    it('null input → 1.x', () => {
      expect(detectVersion(null)).toBe('1.x');
    });

    it('undefined input → 1.x', () => {
      expect(detectVersion(undefined)).toBe('1.x');
    });

    it('missing _version field → 1.x', () => {
      expect(detectVersion({ foo: 'bar' })).toBe('1.x');
    });

    it('_version: "2.0" → 2.0', () => {
      expect(detectVersion({ _version: '2.0' })).toBe('2.0');
    });

    it('_version: "1.0" → 1.x (unknown version)', () => {
      expect(detectVersion({ _version: '1.0' })).toBe('1.x');
    });

    it('_version: "3.0" → 1.x (future unknown version)', () => {
      expect(detectVersion({ _version: '3.0' })).toBe('1.x');
    });

    it('empty object → 1.x', () => {
      expect(detectVersion({})).toBe('1.x');
    });

    it('non-object primitive string → 1.x', () => {
      expect(detectVersion('hello')).toBe('1.x');
    });

    it('non-object primitive number → 1.x', () => {
      expect(detectVersion(42)).toBe('1.x');
    });

    it('non-object boolean → 1.x', () => {
      expect(detectVersion(true)).toBe('1.x');
    });

    it('array input → 1.x', () => {
      expect(detectVersion([1, 2, 3])).toBe('1.x');
    });

    it('v2 payload with full structure → 2.0', () => {
      const fullV2: V2ExportPayload = {
        _version: '2.0',
        _exportedAt: new Date().toISOString(),
        _format: 'sqlite-json',
        tables: {},
      };
      expect(detectVersion(fullV2)).toBe('2.0');
    });
  });
});
