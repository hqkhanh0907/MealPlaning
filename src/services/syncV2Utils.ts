import type { DatabaseService } from './databaseService';
import { typeToRow } from './databaseService';
import { SCHEMA_TABLES } from './schema';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface V2ExportPayload {
  _version: '2.0';
  _exportedAt: string;
  _format: 'sqlite-json';
  _legacyFormat?: Record<string, unknown>;
  tables: Record<string, unknown[]>;
}

export interface ImportResult {
  success: boolean;
  error?: string;
  importedCounts?: Record<string, number>;
}

type DataVersion = '1.x' | '2.0';

/**
 * FK-safe import order: parents before children.
 * Delete uses reverse order (children first).
 */
const IMPORT_ORDER: readonly string[] = [
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
] as const;

/* ------------------------------------------------------------------ */
/*  Version detection                                                   */
/* ------------------------------------------------------------------ */

export function detectVersion(data: unknown): DataVersion {
  if (
    typeof data === 'object' &&
    data !== null &&
    '_version' in data &&
    (data as Record<string, unknown>)._version === '2.0'
  ) {
    return '2.0';
  }
  return '1.x';
}

/* ------------------------------------------------------------------ */
/*  Legacy format helpers                                               */
/* ------------------------------------------------------------------ */

function safeJsonParse(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Transform flat SQL rows back to v1.x localStorage object structure.
 */
export function buildLegacyFormat(tables: Record<string, unknown[]>): Record<string, unknown> {
  const legacy: Record<string, unknown> = {};

  const ingredients = tables['ingredients'] ?? [];
  if (ingredients.length > 0) {
    legacy['mp-ingredients'] = ingredients.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: r.id,
        name: { vi: r.name_vi as string, ...(r.name_en ? { en: r.name_en } : {}) },
        caloriesPer100: r.calories_per_100,
        proteinPer100: r.protein_per_100,
        carbsPer100: r.carbs_per_100,
        fatPer100: r.fat_per_100,
        fiberPer100: r.fiber_per_100,
        unit: { vi: r.unit_vi as string, ...(r.unit_en ? { en: r.unit_en } : {}) },
      };
    });
  }

  const dishes = tables['dishes'] ?? [];
  const dishIngredients = tables['dish_ingredients'] ?? [];
  if (dishes.length > 0) {
    const diMap = new Map<string, Array<{ ingredientId: string; amount: number }>>();
    for (const di of dishIngredients) {
      const r = di as Record<string, unknown>;
      const dishId = r.dish_id as string;
      const arr = diMap.get(dishId) ?? [];
      arr.push({ ingredientId: r.ingredient_id as string, amount: r.amount as number });
      diMap.set(dishId, arr);
    }
    legacy['mp-dishes'] = dishes.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: r.id,
        name: { vi: r.name_vi as string, ...(r.name_en ? { en: r.name_en } : {}) },
        ingredients: diMap.get(r.id as string) ?? [],
        tags: safeJsonParse(r.tags) ?? [],
        ...(r.rating != null ? { rating: r.rating } : {}),
        ...(r.notes != null ? { notes: r.notes } : {}),
      };
    });
  }

  const dayPlans = tables['day_plans'] ?? [];
  if (dayPlans.length > 0) {
    legacy['mp-day-plans'] = dayPlans.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        date: r.date,
        breakfastDishIds: safeJsonParse(r.breakfast_dish_ids) ?? [],
        lunchDishIds: safeJsonParse(r.lunch_dish_ids) ?? [],
        dinnerDishIds: safeJsonParse(r.dinner_dish_ids) ?? [],
        ...(r.servings != null ? { servings: safeJsonParse(r.servings) } : {}),
      };
    });
  }

  const userProfile = tables['user_profile'] ?? [];
  if (userProfile.length > 0) {
    const r = userProfile[0] as Record<string, unknown>;
    legacy['mp-user-profile'] = {
      weight: r.weight_kg ?? 0,
      proteinRatio: r.protein_ratio ?? 2.0,
      targetCalories: 0,
    };
  }

  const templates = tables['meal_templates'] ?? [];
  if (templates.length > 0) {
    legacy['meal-templates'] = templates.map((row) => {
      const r = row as Record<string, unknown>;
      const parsed = safeJsonParse(r.data);
      if (parsed && typeof parsed === 'object') return parsed;
      return { id: r.id, name: r.name };
    });
  }

  return legacy;
}

/**
 * Transform v1.x localStorage objects into flat v2 table rows.
 */
function transformLegacyToV2Tables(data: Record<string, unknown>): Record<string, unknown[]> {
  const tables: Record<string, unknown[]> = {};

  const rawIngredients = data['mp-ingredients'];
  if (Array.isArray(rawIngredients)) {
    tables['ingredients'] = rawIngredients.map((ing) => {
      const i = ing as Record<string, unknown>;
      const name = i.name as Record<string, unknown> | undefined;
      const unit = i.unit as Record<string, unknown> | undefined;
      return {
        id: i.id,
        name_vi: name?.vi ?? '',
        name_en: name?.en ?? null,
        calories_per_100: i.caloriesPer100 ?? i.calories_per_100 ?? 0,
        protein_per_100: i.proteinPer100 ?? i.protein_per_100 ?? 0,
        carbs_per_100: i.carbsPer100 ?? i.carbs_per_100 ?? 0,
        fat_per_100: i.fatPer100 ?? i.fat_per_100 ?? 0,
        fiber_per_100: i.fiberPer100 ?? i.fiber_per_100 ?? 0,
        unit_vi: unit?.vi ?? 'g',
        unit_en: unit?.en ?? null,
      };
    });
  }

  const rawDishes = data['mp-dishes'];
  if (Array.isArray(rawDishes)) {
    const dishRows: unknown[] = [];
    const diRows: unknown[] = [];
    for (const dish of rawDishes) {
      const d = dish as Record<string, unknown>;
      const name = d.name as Record<string, unknown> | undefined;
      const tags = Array.isArray(d.tags) ? JSON.stringify(d.tags) : (d.tags ?? '[]');
      dishRows.push({
        id: d.id,
        name_vi: name?.vi ?? '',
        name_en: name?.en ?? null,
        tags,
        rating: d.rating ?? null,
        notes: d.notes ?? null,
      });
      const ings = d.ingredients;
      if (Array.isArray(ings)) {
        for (const di of ings) {
          const r = di as Record<string, unknown>;
          diRows.push({
            dish_id: d.id,
            ingredient_id: r.ingredientId ?? r.ingredient_id,
            amount: r.amount ?? 0,
          });
        }
      }
    }
    tables['dishes'] = dishRows;
    if (diRows.length > 0) {
      tables['dish_ingredients'] = diRows;
    }
  }

  const rawDayPlans = data['mp-day-plans'];
  if (Array.isArray(rawDayPlans)) {
    tables['day_plans'] = rawDayPlans.map((plan) => {
      const p = plan as Record<string, unknown>;
      return {
        date: p.date,
        breakfast_dish_ids: JSON.stringify(p.breakfastDishIds ?? p.breakfast_dish_ids ?? []),
        lunch_dish_ids: JSON.stringify(p.lunchDishIds ?? p.lunch_dish_ids ?? []),
        dinner_dish_ids: JSON.stringify(p.dinnerDishIds ?? p.dinner_dish_ids ?? []),
        servings: p.servings ? JSON.stringify(p.servings) : null,
      };
    });
  }

  const rawProfile = data['mp-user-profile'];
  if (rawProfile && typeof rawProfile === 'object' && !Array.isArray(rawProfile)) {
    const p = rawProfile as Record<string, unknown>;
    tables['user_profile'] = [
      {
        id: 'default',
        gender: 'male',
        age: 30,
        height_cm: 170,
        weight_kg: p.weight ?? 70,
        activity_level: 'moderate',
        body_fat_pct: null,
        bmr_override: null,
        protein_ratio: p.proteinRatio ?? 2.0,
        fat_pct: 0.25,
        updated_at: new Date().toISOString(),
      },
    ];
  }

  const rawTemplates = data['meal-templates'];
  if (Array.isArray(rawTemplates)) {
    tables['meal_templates'] = rawTemplates.map((tpl) => {
      const t = tpl as Record<string, unknown>;
      return {
        id: t.id,
        name: t.name ?? '',
        data: JSON.stringify(tpl),
      };
    });
  }

  return tables;
}

/* ------------------------------------------------------------------ */
/*  Export                                                               */
/* ------------------------------------------------------------------ */

export async function createV2Export(
  db: DatabaseService,
  legacyData?: Record<string, unknown>,
): Promise<V2ExportPayload> {
  const tables: Record<string, unknown[]> = {};
  for (const name of SCHEMA_TABLES) {
    const rows = await db.query(`SELECT * FROM "${name}"`);
    tables[name] = rows.map((row) => typeToRow(row as Record<string, unknown>));
  }

  const legacy =
    legacyData && Object.keys(legacyData).length > 0
      ? legacyData
      : buildLegacyFormat(tables);

  const payload: V2ExportPayload = {
    _version: '2.0',
    _exportedAt: new Date().toISOString(),
    _format: 'sqlite-json',
    tables,
  };

  if (Object.keys(legacy).length > 0) {
    payload._legacyFormat = legacy;
  }

  return payload;
}

/* ------------------------------------------------------------------ */
/*  Import                                                               */
/* ------------------------------------------------------------------ */

export async function importV2Data(
  db: DatabaseService,
  data: Record<string, unknown>,
): Promise<ImportResult> {
  const version = detectVersion(data);

  let tables: Record<string, unknown[]>;

  if (version === '2.0') {
    const payload = data as unknown as V2ExportPayload;
    tables = payload.tables ?? {};
  } else {
    tables = transformLegacyToV2Tables(data);
  }

  const counts: Record<string, number> = {};

  try {
    await db.transaction(async () => {
      const reverseOrder = [...IMPORT_ORDER].reverse();
      for (const tableName of reverseOrder) {
        await db.execute(`DELETE FROM "${tableName}"`);
      }

      for (const tableName of IMPORT_ORDER) {
        const rows = tables[tableName];
        if (!Array.isArray(rows) || rows.length === 0) {
          counts[tableName] = 0;
          continue;
        }

        for (const row of rows) {
          const obj = row as Record<string, unknown>;
          const columns = Object.keys(obj);
          if (columns.length === 0) continue;
          const placeholders = columns.map(() => '?').join(', ');
          const values = columns.map((c) => {
            const v = obj[c];
            return v === undefined ? null : v;
          });
          await db.execute(
            `INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders})`,
            values,
          );
        }

        counts[tableName] = rows.length;
      }
    });

    return { success: true, importedCounts: counts };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
