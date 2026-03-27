import type { DatabaseService } from './databaseService';
import type { Ingredient, Dish, DayPlan, UserProfile, MealTemplate } from '../types';

/* ------------------------------------------------------------------ */
/*  Public types                                                        */
/* ------------------------------------------------------------------ */
export interface MigrationResult {
  success: boolean;
  error?: string;
  migratedCounts?: {
    ingredients: number;
    dishes: number;
    dishIngredients: number;
    dayPlans: number;
    userProfile: boolean;
    mealTemplates: number;
  };
}

export interface FitnessMigrationResult {
  migrated: boolean;
  recordCount: number;
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  localStorage key constants                                          */
/* ------------------------------------------------------------------ */
const LS_INGREDIENTS = 'mp-ingredients';
const LS_DISHES = 'mp-dishes';
const LS_DAY_PLANS = 'mp-day-plans';
const LS_USER_PROFILE = 'mp-user-profile';
const LS_MEAL_TEMPLATES = 'meal-templates';
const LS_MIGRATION_FLAG = 'mp-migrated-to-sqlite';
const LS_FITNESS_STORAGE = 'fitness-storage';
const LS_FITNESS_MIGRATION_FLAG = 'fitness_migrated_to_sqlite';

/* ------------------------------------------------------------------ */
/*  Zustand persist helper                                              */
/* ------------------------------------------------------------------ */
function readZustandState<T>(key: string, prop: string): T | null {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;

  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) return null;

  const state = (parsed as Record<string, unknown>).state;
  if (typeof state !== 'object' || state === null) return null;

  const value = (state as Record<string, unknown>)[prop];
  return value === undefined ? null : (value as T);
}

/* ------------------------------------------------------------------ */
/*  Individual migration helpers                                        */
/* ------------------------------------------------------------------ */
async function migrateIngredients(db: DatabaseService, items: Ingredient[]): Promise<number> {
  for (const ing of items) {
    await db.execute(
      `INSERT INTO ingredients
         (id, name_vi, name_en, calories_per_100, protein_per_100,
          carbs_per_100, fat_per_100, fiber_per_100, unit_vi, unit_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ing.id,
        ing.name.vi,
        ing.name.en ?? null,
        ing.caloriesPer100,
        ing.proteinPer100,
        ing.carbsPer100,
        ing.fatPer100,
        ing.fiberPer100,
        ing.unit.vi,
        ing.unit.en ?? null,
      ],
    );
  }
  return items.length;
}

async function migrateDishes(
  db: DatabaseService,
  items: Dish[],
): Promise<{ dishes: number; dishIngredients: number }> {
  let dishIngredientCount = 0;
  for (const dish of items) {
    await db.execute(
      `INSERT INTO dishes (id, name_vi, name_en, tags, rating, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        dish.id,
        dish.name.vi,
        dish.name.en ?? null,
        JSON.stringify(dish.tags),
        dish.rating ?? null,
        dish.notes ?? null,
      ],
    );

    for (const di of dish.ingredients) {
      await db.execute(
        `INSERT INTO dish_ingredients (dish_id, ingredient_id, amount)
         VALUES (?, ?, ?)`,
        [dish.id, di.ingredientId, di.amount],
      );
      dishIngredientCount += 1;
    }
  }
  return { dishes: items.length, dishIngredients: dishIngredientCount };
}

async function migrateDayPlans(db: DatabaseService, items: DayPlan[]): Promise<number> {
  for (const plan of items) {
    await db.execute(
      `INSERT INTO day_plans (date, breakfast_dish_ids, lunch_dish_ids, dinner_dish_ids, servings)
       VALUES (?, ?, ?, ?, ?)`,
      [
        plan.date,
        JSON.stringify(plan.breakfastDishIds),
        JSON.stringify(plan.lunchDishIds),
        JSON.stringify(plan.dinnerDishIds),
        plan.servings ? JSON.stringify(plan.servings) : null,
      ],
    );
  }
  return items.length;
}

async function migrateUserProfile(db: DatabaseService, profile: UserProfile): Promise<boolean> {
  await db.execute(
    `INSERT INTO user_profile
       (id, gender, age, height_cm, weight_kg, activity_level, protein_ratio, fat_pct, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'default',
      'male',
      30,
      170,
      profile.weight,
      'moderate',
      profile.proteinRatio,
      0.25,
      new Date().toISOString(),
    ],
  );
  return true;
}

async function migrateMealTemplates(db: DatabaseService, items: MealTemplate[]): Promise<number> {
  for (const tpl of items) {
    await db.execute(`INSERT INTO meal_templates (id, name, data) VALUES (?, ?, ?)`, [
      tpl.id,
      tpl.name,
      JSON.stringify(tpl),
    ]);
  }
  return items.length;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                          */
/* ------------------------------------------------------------------ */

export function isMigrationCompleted(): boolean {
  return localStorage.getItem(LS_MIGRATION_FLAG) !== null;
}

export function isMigrationNeeded(): boolean {
  if (isMigrationCompleted()) return false;

  const keys = [LS_INGREDIENTS, LS_DISHES, LS_DAY_PLANS, LS_USER_PROFILE, LS_MEAL_TEMPLATES];
  return keys.some((k) => localStorage.getItem(k) !== null);
}

export async function migrateFromLocalStorage(db: DatabaseService): Promise<MigrationResult> {
  if (isMigrationCompleted()) {
    return { success: true, migratedCounts: undefined };
  }

  const counts = {
    ingredients: 0,
    dishes: 0,
    dishIngredients: 0,
    dayPlans: 0,
    userProfile: false,
    mealTemplates: 0,
  };

  try {
    const ingredients = readZustandState<Ingredient[]>(LS_INGREDIENTS, 'ingredients');
    const dishes = readZustandState<Dish[]>(LS_DISHES, 'dishes');
    const dayPlans = readZustandState<DayPlan[]>(LS_DAY_PLANS, 'dayPlans');
    const userProfile = readZustandState<UserProfile>(LS_USER_PROFILE, 'userProfile');
    const templates = readZustandState<MealTemplate[]>(LS_MEAL_TEMPLATES, 'templates');

    await db.transaction(async () => {
      if (ingredients && ingredients.length > 0) {
        counts.ingredients = await migrateIngredients(db, ingredients);
      }

      if (dishes && dishes.length > 0) {
        const result = await migrateDishes(db, dishes);
        counts.dishes = result.dishes;
        counts.dishIngredients = result.dishIngredients;
      }

      if (dayPlans && dayPlans.length > 0) {
        counts.dayPlans = await migrateDayPlans(db, dayPlans);
      }

      if (userProfile) {
        counts.userProfile = await migrateUserProfile(db, userProfile);
      }

      if (templates && templates.length > 0) {
        counts.mealTemplates = await migrateMealTemplates(db, templates);
      }
    });

    localStorage.setItem(LS_MIGRATION_FLAG, Date.now().toString());
    return { success: true, migratedCounts: counts };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/* ------------------------------------------------------------------ */
/*  Fitness migration                                                   */
/* ------------------------------------------------------------------ */

export function isFitnessMigrationCompleted(): boolean {
  return localStorage.getItem(LS_FITNESS_MIGRATION_FLAG) !== null;
}

export async function migrateFitnessData(
  db: DatabaseService,
): Promise<FitnessMigrationResult> {
  if (isFitnessMigrationCompleted()) {
    return { migrated: false, recordCount: 0 };
  }

  const raw = localStorage.getItem(LS_FITNESS_STORAGE);
  if (!raw) {
    localStorage.setItem(LS_FITNESS_MIGRATION_FLAG, Date.now().toString());
    return { migrated: false, recordCount: 0 };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    localStorage.setItem(LS_FITNESS_MIGRATION_FLAG, Date.now().toString());
    return { migrated: false, recordCount: 0 };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    localStorage.setItem(LS_FITNESS_MIGRATION_FLAG, Date.now().toString());
    return { migrated: false, recordCount: 0 };
  }

  const state = (parsed as Record<string, unknown>).state;
  if (typeof state !== 'object' || state === null) {
    localStorage.setItem(LS_FITNESS_MIGRATION_FLAG, Date.now().toString());
    return { migrated: false, recordCount: 0 };
  }

  const s = state as Record<string, unknown>;
  let recordCount = 0;

  try {
    await db.execute('PRAGMA foreign_keys = OFF');

    await db.transaction(async () => {
      if (s.trainingProfile && typeof s.trainingProfile === 'object') {
        const p = s.trainingProfile as Record<string, unknown>;
        const now = new Date().toISOString();
        await db.execute(
          `INSERT OR REPLACE INTO fitness_profiles
             (id, experience, goal, days_per_week, body_weight_kg, height_cm, gender, birthdate, created_at, updated_at)
           VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            (p.trainingExperience as string | undefined) ?? 'beginner',
            (p.trainingGoal as string | undefined) ?? 'general',
            (p.daysPerWeek as number | undefined) ?? 3,
            (p.bodyWeightKg as number | undefined) ?? null,
            (p.heightCm as number | undefined) ?? null,
            (p.gender as string | undefined) ?? null,
            (p.birthdate as string | undefined) ?? null,
            now,
            now,
          ],
        );
        recordCount++;
      }

      if (Array.isArray(s.workouts)) {
        for (const w of s.workouts) {
          const wo = w as Record<string, unknown>;
          await db.execute(
            `INSERT OR IGNORE INTO workouts
               (id, date, name, duration_min, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              wo.id as string,
              wo.date as string,
              wo.name as string,
              (wo.durationMin as number | undefined) ?? null,
              (wo.notes as string | undefined) ?? null,
              (wo.createdAt as string | undefined) ?? new Date().toISOString(),
              (wo.updatedAt as string | undefined) ?? new Date().toISOString(),
            ],
          );
          recordCount++;
        }
      }

      if (Array.isArray(s.workoutSets)) {
        for (const ws of s.workoutSets) {
          const wset = ws as Record<string, unknown>;
          await db.execute(
            `INSERT OR IGNORE INTO workout_sets
               (id, workout_id, exercise_id, set_number, reps, weight_kg, rpe, rest_seconds, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              wset.id as string,
              wset.workoutId as string,
              wset.exerciseId as string,
              wset.setNumber as number,
              (wset.reps as number | undefined) ?? null,
              (wset.weightKg as number | undefined) ?? 0,
              (wset.rpe as number | undefined) ?? null,
              (wset.restSeconds as number | undefined) ?? null,
              (wset.updatedAt as string | undefined) ?? new Date().toISOString(),
            ],
          );
          recordCount++;
        }
      }
    });

    await db.execute('PRAGMA foreign_keys = ON');
    localStorage.setItem(LS_FITNESS_MIGRATION_FLAG, Date.now().toString());
    return { migrated: true, recordCount };
  } catch (error) {
    await db.execute('PRAGMA foreign_keys = ON').catch(() => {});
    return {
      migrated: false,
      recordCount: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}