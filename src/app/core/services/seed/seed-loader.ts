import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database/database';

/**
 * Phase 1 §5.2.6 — Idempotent seed loader.
 *
 * Loads the curated Vietnamese ingredient + composite + dish seed JSON
 * artifacts into SQLite, gated by the `seed_artifact` tracker (V5).
 * Re-runs are safe: each artifact_id is processed at most once.
 */

export const SEED_VERSION = '1.0.0';

const INGREDIENTS_URL = 'assets/seed/ingredients.json';
const COMPOSITES_URL = 'assets/seed/composites.json';
const DISHES_URL = 'assets/seed/dishes.json';

const CATEGORY_MAP: Record<string, string> = {
  meat: 'Thịt',
  seafood: 'Cá & Hải sản',
  vegetable: 'Rau củ',
  fruit: 'Trái cây',
  grain: 'Ngũ cốc & Tinh bột',
  dairy: 'Trứng & Sữa',
  egg: 'Trứng & Sữa',
  condiment: 'Gia vị',
  spice: 'Gia vị',
  staple: 'Khác',
  composite: 'Nước dùng & Nước chấm',
};

export interface SeedIngredientRecord {
  id: string;
  name_vi: string;
  category: string;
  nutrition_basis_unit: 'g' | 'ml';
  nutrition_basis_quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  density_g_per_ml: number | null;
}

export interface SeedDishIngredient {
  ingredient_id: string;
  quantity: number;
  unit_id: string;
}

export interface SeedDishRecord {
  id: string;
  name_vi: string;
  meal_tag: 'breakfast' | 'lunch' | 'dinner';
  servings: number;
  is_favorite: boolean;
  ingredients: SeedDishIngredient[];
}

@Injectable({ providedIn: 'root' })
export class SeedLoader {
  private readonly db = inject(Database);
  private readonly http = inject(HttpClient);

  async run(): Promise<{ ingredients: number; dishes: number }> {
    const [ingredients, composites, dishes] = await Promise.all([
      firstValueFrom(this.http.get<SeedIngredientRecord[]>(INGREDIENTS_URL)),
      firstValueFrom(this.http.get<SeedIngredientRecord[]>(COMPOSITES_URL)),
      firstValueFrom(this.http.get<SeedDishRecord[]>(DISHES_URL)),
    ]);

    let ingredientCount = 0;
    for (const rec of [...ingredients, ...composites]) {
      if (await this.processIngredient(rec)) {
        ingredientCount += 1;
      }
    }

    let dishCount = 0;
    for (const rec of dishes) {
      if (await this.processDish(rec)) {
        dishCount += 1;
      }
    }

    return { ingredients: ingredientCount, dishes: dishCount };
  }

  private async processIngredient(rec: SeedIngredientRecord): Promise<boolean> {
    if (await this.alreadySeeded(rec.id)) {
      return false;
    }

    const fingerprint = await fingerprintRecord(rec);
    const category = CATEGORY_MAP[rec.category] ?? 'Khác';

    await this.db.execute(
      `INSERT INTO ingredient (
        id, name, category, nutrition_basis_unit, nutrition_basis_quantity,
        calories, protein, carbs, fat, fiber, density_g_per_ml, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rec.id,
        rec.name_vi,
        category,
        rec.nutrition_basis_unit,
        rec.nutrition_basis_quantity,
        rec.calories,
        rec.protein,
        rec.carbs,
        rec.fat,
        rec.fiber,
        rec.density_g_per_ml,
        'db',
      ],
    );

    await this.db.execute(
      `INSERT INTO ingredient_unit (
        ingredient_id, unit_id, factor_to_basis, is_default, display_label
      ) VALUES (?, ?, 1, 1, NULL)`,
      [rec.id, rec.nutrition_basis_unit],
    );

    await this.db.execute(
      `INSERT INTO seed_artifact (
        artifact_id, artifact_type, seed_version, fingerprint_hash
      ) VALUES (?, 'ingredient', ?, ?)`,
      [rec.id, SEED_VERSION, fingerprint],
    );

    return true;
  }

  private async processDish(rec: SeedDishRecord): Promise<boolean> {
    if (await this.alreadySeeded(rec.id)) {
      return false;
    }

    const fingerprint = await fingerprintRecord(rec);

    await this.db.execute(
      `INSERT INTO dish (
        id, name, description, type, servings, image_url, source, meal_tag, is_favorite
      ) VALUES (?, ?, NULL, 'ingredient_based', ?, NULL, 'db', ?, ?)`,
      [rec.id, rec.name_vi, rec.servings, rec.meal_tag, rec.is_favorite ? 1 : 0],
    );

    for (const ing of rec.ingredients) {
      await this.db.execute(
        `INSERT INTO dish_ingredient (
          id, dish_id, ingredient_id, amount_value, unit_id, normalized_amount
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), rec.id, ing.ingredient_id, ing.quantity, ing.unit_id, ing.quantity],
      );
    }

    await this.db.execute(
      `INSERT INTO seed_artifact (
        artifact_id, artifact_type, seed_version, fingerprint_hash
      ) VALUES (?, 'dish', ?, ?)`,
      [rec.id, SEED_VERSION, fingerprint],
    );

    return true;
  }

  private async alreadySeeded(artifactId: string): Promise<boolean> {
    const rows = await this.db.query<{ one: number }>(
      'SELECT 1 AS one FROM seed_artifact WHERE artifact_id = ?',
      [artifactId],
    );
    return rows.length > 0;
  }
}

async function fingerprintRecord(record: object): Promise<string> {
  const json = JSON.stringify(record, Object.keys(record).sort());
  const bytes = new TextEncoder().encode(json);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return bytesToHex(new Uint8Array(digest));
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}
