import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import {
  type IngredientModel,
  type IngredientUnitModel,
} from '../models/management.model';
import type { IngredientSource, NutritionBasisUnit } from '../models/management.types';
import { DatabaseService } from '../services/database/database.service';

export interface IngredientListUnit extends IngredientUnitModel {
  is_approximate: number;
  short_name_vi: string;
  display_name_vi: string;
}

export interface IngredientListItem extends IngredientModel {
  units: IngredientListUnit[];
}

export interface CreateIngredientUnitInput {
  unit_id: string;
  factor_to_basis: number;
  is_default: number;
  display_label: string | null;
}

export interface CreateIngredientInput {
  name: string;
  category: string;
  nutrition_basis_unit: NutritionBasisUnit;
  nutrition_basis_quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  density_g_per_ml: number | null;
  source: IngredientSource;
  units: CreateIngredientUnitInput[];
}

export interface UpdateIngredientInput extends Partial<Omit<CreateIngredientInput, 'units'>> {
  units?: CreateIngredientUnitInput[];
}

type IngredientRow = IngredientModel;

@Injectable({ providedIn: 'root' })
export class IngredientRepository {
  private readonly db = inject(DatabaseService);

  async list(): Promise<IngredientListItem[]> {
    const ingredients = await this.db.query<IngredientRow>(
      'SELECT * FROM ingredient ORDER BY name COLLATE NOCASE ASC',
    );
    return this.hydrateUnits(ingredients);
  }

  async searchByName(query: string): Promise<IngredientListItem[]> {
    const ingredients = await this.db.query<IngredientRow>(
      'SELECT * FROM ingredient WHERE name LIKE ? ORDER BY name COLLATE NOCASE ASC',
      [`%${query}%`],
    );
    return this.hydrateUnits(ingredients);
  }

  async getById(id: string): Promise<IngredientListItem | null> {
    const ingredient = await this.db.getOne<IngredientRow>('SELECT * FROM ingredient WHERE id = ?', [id]);
    if (!ingredient) {
      return null;
    }

    const [hydrated] = await this.hydrateUnits([ingredient]);
    return hydrated ?? null;
  }

  async insert(data: CreateIngredientInput): Promise<IngredientListItem> {
    const id = uuidv4();
    await this.db.execute(
      `INSERT INTO ingredient (
        id, name, category, nutrition_basis_unit, nutrition_basis_quantity,
        calories, protein, carbs, fat, fiber, density_g_per_ml, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.category,
        data.nutrition_basis_unit,
        data.nutrition_basis_quantity,
        data.calories,
        data.protein,
        data.carbs,
        data.fat,
        data.fiber,
        data.density_g_per_ml,
        data.source,
      ],
    );

    await this.replaceUnits(id, data.units);
    return (await this.getById(id)) as IngredientListItem;
  }

  async update(id: string, data: UpdateIngredientInput): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Ingredient '${id}' not found.`);
    }

    const fields: [string, unknown][] = [];

    for (const [key, value] of Object.entries(data)) {
      if (key === 'units' || value === undefined) {
        continue;
      }
      fields.push([key, value]);
    }

    fields.push(['source', 'manual']);

    if (fields.length > 0) {
      const setClause = fields.map(([key]) => `${key} = ?`).join(', ');
      const values = fields.map(([, value]) => value);
      await this.db.execute(
        `UPDATE ingredient SET ${setClause}, updated_at = datetime('now') WHERE id = ?`,
        [...values, id],
      );
    }

    if (data.units) {
      await this.replaceUnits(id, data.units);
    }
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM ingredient WHERE id = ?', [id]);
  }

  async countDishReferences(id: string): Promise<number> {
    const row = await this.db.getOne<{ ref_count: number }>(
      'SELECT COUNT(*) AS ref_count FROM dish_ingredient WHERE ingredient_id = ?',
      [id],
    );
    return row?.ref_count ?? 0;
  }

  private async hydrateUnits(ingredients: IngredientRow[]): Promise<IngredientListItem[]> {
    if (ingredients.length === 0) {
      return [];
    }

    const ids = ingredients.map(({ id }) => id);
    const placeholders = ids.map(() => '?').join(', ');
    const units = await this.db.query<IngredientListUnit>(
      `SELECT iu.*, u.is_approximate, u.short_name_vi, u.display_name_vi
       FROM ingredient_unit iu
       INNER JOIN unit u ON u.id = iu.unit_id
       WHERE iu.ingredient_id IN (${placeholders})
       ORDER BY iu.is_default DESC, u.display_order ASC`,
      ids,
    );

    const unitsByIngredient = new Map<string, IngredientListUnit[]>();
    for (const unit of units) {
      const bucket = unitsByIngredient.get(unit.ingredient_id) ?? [];
      bucket.push(unit);
      unitsByIngredient.set(unit.ingredient_id, bucket);
    }

    return ingredients.map((ingredient) => ({
      ...ingredient,
      units: unitsByIngredient.get(ingredient.id) ?? [],
    }));
  }

  private async replaceUnits(ingredientId: string, units: CreateIngredientUnitInput[]): Promise<void> {
    await this.db.execute('DELETE FROM ingredient_unit WHERE ingredient_id = ?', [ingredientId]);

    for (const unit of units) {
      await this.db.execute(
        `INSERT INTO ingredient_unit (
          ingredient_id, unit_id, factor_to_basis, is_default, display_label
        ) VALUES (?, ?, ?, ?, ?)`,
        [ingredientId, unit.unit_id, unit.factor_to_basis, unit.is_default, unit.display_label],
      );
    }
  }
}
