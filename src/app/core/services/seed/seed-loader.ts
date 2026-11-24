import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database/database';
import type { SeedDishRecord, SeedIngredientRecord } from './seed-records';
export type { SeedDishIngredient, SeedDishRecord, SeedIngredientRecord } from './seed-records';

/**
 * Phase 1 §5.2.6 — Idempotent seed loader (gram-only revision).
 *
 * Loads the curated Vietnamese ingredient + composite + dish seed JSON
 * artifacts into SQLite, gated by the `seed_artifact` tracker.
 * Re-runs are safe: each artifact_id is processed at most once.
 *
 * Schema v6: ingredient nutrition is per-100g (no basis_unit/quantity/density).
 * dish_ingredient stores gram_weight directly (no unit_id/normalized_amount).
 */

export const SEED_VERSION = '1.3.0';
const RAW_CHICKEN_ID = '7c4e8b1a-0002-4000-8000-000000000101';
type SeedMacros = readonly [
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  fiber: number,
];

const PREVIOUS_FISH_SAUCE_RECIPES: Readonly<Record<string, SeedMacros>> = {
  '7c4e8b1a-0002-4000-8000-000000000001': [29.17, 4.25, 3, 0, 0],
  'c0114c01-0001-4000-8000-000000000001': [88.04, 1.45, 21.28, 0.03, 0.11],
  'c0114c01-0001-4000-8000-000000000002': [28.32, 2.73, 0.81, 1.48, 0.13],
  'c0114c01-0001-4000-8000-000000000003': [30.92, 2.78, 1.53, 1.49, 0.09],
  'c0114c01-0001-4000-8000-000000000004': [73.3, 4.85, 1.52, 5.25, 0.19],
  'c0114c01-0001-4000-8000-000000000005': [18.06, 0.29, 4.56, 0.04, 0.35],
  'c0114c01-0001-4000-8000-000000000006': [20.01, 0.36, 4.96, 0.06, 0.19],
  'c0114c01-0001-4000-8000-000000000007': [20.66, 2.97, 1.23, 0.49, 0.22],
};

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

interface SeedArtifactRow {
  artifact_id: string;
  seed_version: string;
}

const SEED_ARTIFACT_LOOKUP_CHUNK_SIZE = 400;

@Injectable({ providedIn: 'root' })
export class SeedLoader {
  private readonly db = inject(Database);
  private readonly http = inject(HttpClient);
  readonly dataRevision = signal(0);

  async run(): Promise<{ ingredients: number; dishes: number }> {
    const [ingredients, composites, dishes] = await Promise.all([
      firstValueFrom(this.http.get<SeedIngredientRecord[]>(INGREDIENTS_URL)),
      firstValueFrom(this.http.get<SeedIngredientRecord[]>(COMPOSITES_URL)),
      firstValueFrom(this.http.get<SeedDishRecord[]>(DISHES_URL)),
    ]);

    const seedIngredients = [...ingredients, ...composites];
    let ingredientCount = 0;
    let dishCount = 0;
    await this.db.withTransaction(async () => {
      const seededVersions = await this.loadSeededVersions([
        ...seedIngredients.map((rec) => rec.id),
        ...dishes.map((rec) => rec.id),
      ]);
      for (const rec of seedIngredients) {
        const version = seededVersions.get(rec.id);
        if (version !== undefined) {
          if (version === '1.1.0' || version === '1.2.0') {
            const oldChicken = version === '1.1.0' && rec.id === RAW_CHICKEN_ID;
            const oldValues: SeedMacros | undefined = oldChicken
              ? [165, 31, 0, 3.6, 0]
              : PREVIOUS_FISH_SAUCE_RECIPES[rec.id];
            if (
              oldValues &&
              (await this.correctIngredient(rec, oldChicken ? 'ức gà' : rec.name_vi, oldValues))
            ) {
              ingredientCount += 1;
            }
          }
          continue;
        }
        if (await this.processIngredient(rec)) {
          ingredientCount += 1;
        }
      }

      for (const rec of dishes) {
        if (seededVersions.has(rec.id)) {
          continue;
        }
        if (await this.processDish(rec)) {
          dishCount += 1;
        }
      }
    });

    if (ingredientCount > 0 || dishCount > 0) this.dataRevision.update((value) => value + 1);
    return { ingredients: ingredientCount, dishes: dishCount };
  }

  private async processIngredient(rec: SeedIngredientRecord): Promise<boolean> {
    const fingerprint = await fingerprintRecord(rec);
    const category = CATEGORY_MAP[rec.category] ?? 'Khác';

    await this.db.execute(
      `INSERT INTO ingredient (
        id, name, category, calories, protein, carbs, fat, fiber, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rec.id,
        rec.name_vi,
        category,
        rec.calories,
        rec.protein,
        rec.carbs,
        rec.fat,
        rec.fiber,
        'db',
      ],
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
    const fingerprint = await fingerprintRecord(rec);

    await this.db.execute(
      `INSERT INTO dish (
        id, name, description, type, servings, image_url, source, meal_tag, is_favorite
      ) VALUES (?, ?, NULL, 'ingredient_based', ?, NULL, 'db', ?, ?)`,
      [rec.id, rec.name_vi, rec.servings, rec.meal_tag, rec.is_favorite ? 1 : 0],
    );

    let position = 0;
    for (const ing of rec.ingredients) {
      await this.db.execute(
        `INSERT INTO dish_ingredient (
          id, dish_id, ingredient_id, gram_weight, sort_order
        ) VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), rec.id, ing.ingredient_id, ing.gram_weight, position],
      );
      position += 1;
    }

    await this.db.execute(
      `INSERT INTO seed_artifact (
        artifact_id, artifact_type, seed_version, fingerprint_hash
      ) VALUES (?, 'dish', ?, ?)`,
      [rec.id, SEED_VERSION, fingerprint],
    );

    return true;
  }

  private async correctIngredient(
    rec: SeedIngredientRecord,
    oldName: string,
    oldValues: SeedMacros,
  ): Promise<boolean> {
    await this.db.execute(
      `UPDATE ingredient SET name = ?, calories = ?, protein = ?, carbs = ?, fat = ?, fiber = ?
        WHERE id = ? AND source = 'db' AND updated_at IS NULL AND name = ? AND category = ?
          AND calories = ? AND protein = ? AND carbs = ? AND fat = ? AND fiber = ?`,
      [
        rec.name_vi,
        rec.calories,
        rec.protein,
        rec.carbs,
        rec.fat,
        rec.fiber,
        rec.id,
        oldName,
        CATEGORY_MAP[rec.category] ?? 'Khác',
        ...oldValues,
      ],
    );
    const changes = await this.db.getOne<{ count: number }>('SELECT changes() AS count');
    await this.db.execute(
      'UPDATE seed_artifact SET seed_version = ?, fingerprint_hash = ? WHERE artifact_id = ?',
      [SEED_VERSION, await fingerprintRecord(rec), rec.id],
    );
    return (changes?.count ?? 0) > 0;
  }

  private async loadSeededVersions(artifactIds: readonly string[]): Promise<Map<string, string>> {
    if (artifactIds.length === 0) {
      return new Map();
    }

    const versions = new Map<string, string>();
    for (let i = 0; i < artifactIds.length; i += SEED_ARTIFACT_LOOKUP_CHUNK_SIZE) {
      const chunk = artifactIds.slice(i, i + SEED_ARTIFACT_LOOKUP_CHUNK_SIZE);
      const placeholders = chunk.map(() => '?').join(', ');
      const rows = await this.db.query<SeedArtifactRow>(
        `SELECT artifact_id, seed_version FROM seed_artifact WHERE artifact_id IN (${placeholders})`,
        chunk,
      );
      for (const row of rows) {
        versions.set(row.artifact_id, row.seed_version);
      }
    }

    return versions;
  }
}

async function fingerprintRecord(record: object): Promise<string> {
  const json = JSON.stringify(
    record,
    Object.keys(record).sort((a, b) => a.localeCompare(b)),
  );
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
