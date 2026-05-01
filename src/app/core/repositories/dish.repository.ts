import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import type { DishIngredientModel, DishModel } from '../models/management.model';
import type { DishSource, DishType, MealTag } from '../models/management.types';
import { Database } from '../services/database/database';
import {
  DishIngredientRepository,
  type CreateDishIngredientInput,
} from './dish-ingredient.repository';

export interface DishListItem extends DishModel {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
}

export interface DishWithIngredients extends DishListItem {
  ingredients: DishIngredientModel[];
}

export interface CreateDishInput {
  name: string;
  description: string | null;
  type: DishType;
  source: DishSource;
  servings: number;
  image_url: string | null;
  meal_tag?: MealTag | null;
}

@Injectable({ providedIn: 'root' })
export class DishRepository {
  private readonly db = inject(Database);
  private readonly dishIngredientRepository = inject(DishIngredientRepository);

  async list(): Promise<DishListItem[]> {
    return this.db.query<DishListItem>(
      'SELECT * FROM dish_with_totals ORDER BY name COLLATE NOCASE ASC',
    );
  }

  async searchByName(query: string): Promise<DishListItem[]> {
    return this.db.query<DishListItem>(
      'SELECT * FROM dish_with_totals WHERE name LIKE ? ORDER BY name COLLATE NOCASE ASC',
      [`%${query}%`],
    );
  }

  /**
   * Exact case-insensitive name lookup (TRIM both sides). Returns first match
   * or `null`. Used by AI autofill pre-check to block creating a dish whose
   * name already exists. NOTE: only normalizes case + edge whitespace; does
   * NOT strip diacritics ("Phở" vs "Pho" stays distinct).
   */
  async findByNormalizedName(name: string): Promise<DishListItem | null> {
    const trimmed = name.trim();
    if (!trimmed) {
      return null;
    }
    return this.db.getOne<DishListItem>(
      'SELECT * FROM dish_with_totals WHERE LOWER(TRIM(name)) = LOWER(?) LIMIT 1',
      [trimmed],
    );
  }

  async getById(id: string): Promise<DishWithIngredients | null> {
    const dish = await this.db.getOne<DishListItem>('SELECT * FROM dish_with_totals WHERE id = ?', [
      id,
    ]);
    if (!dish) {
      return null;
    }

    const ingredients = await this.dishIngredientRepository.listByDish(id);
    return {
      ...dish,
      ingredients,
    };
  }

  async insert(
    data: CreateDishInput,
    ingredients: CreateDishIngredientInput[],
  ): Promise<DishWithIngredients> {
    if (ingredients.length === 0) {
      throw new Error('Dish must contain at least one ingredient.');
    }

    const dishId = uuidv4();

    await this.db.withTransaction(async () => {
      await this.db.execute(
        `INSERT INTO dish (
          id, name, description, type, source, servings, image_url, meal_tag
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dishId,
          data.name,
          data.description,
          data.type,
          data.source,
          data.servings,
          data.image_url,
          data.meal_tag ?? null,
        ],
      );

      await this.dishIngredientRepository.bulkInsert(dishId, ingredients);
    });

    return (await this.getById(dishId)) as DishWithIngredients;
  }

  async update(
    id: string,
    data: CreateDishInput,
    ingredients: CreateDishIngredientInput[],
  ): Promise<DishWithIngredients> {
    if (ingredients.length === 0) {
      throw new Error('Dish must contain at least one ingredient.');
    }

    const existing = await this.db.getOne<DishModel>('SELECT * FROM dish WHERE id = ?', [id]);
    if (!existing) {
      throw new Error(`Dish '${id}' not found.`);
    }

    const nextSource: DishSource = existing.source === 'db' ? 'custom' : existing.source;

    await this.db.withTransaction(async () => {
      await this.db.execute(
        `UPDATE dish
         SET name = ?, description = ?, type = ?, source = ?, servings = ?, image_url = ?, meal_tag = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [
          data.name,
          data.description,
          data.type,
          nextSource,
          data.servings,
          data.image_url,
          data.meal_tag ?? null,
          id,
        ],
      );

      await this.dishIngredientRepository.deleteByDish(id);
      await this.dishIngredientRepository.bulkInsert(id, ingredients);
    });

    return (await this.getById(id)) as DishWithIngredients;
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM dish WHERE id = ?', [id]);
  }

  /**
   * Returns all dishes that contain the given ingredient. Used by the
   * "Đang dùng trong N món" sheet on the ingredient-edit page so the user
   * can see which dishes will be affected before deleting/editing the
   * ingredient. Sorted by dish name ASC.
   */
  async findDishesUsingIngredient(ingredientId: string): Promise<DishListItem[]> {
    return this.db.query<DishListItem>(
      `SELECT DISTINCT d.*
       FROM dish_with_totals d
       INNER JOIN dish_ingredient di ON di.dish_id = d.id
       WHERE di.ingredient_id = ?
       ORDER BY d.name COLLATE NOCASE ASC`,
      [ingredientId],
    );
  }

  async countReferences(id: string): Promise<number> {
    const row = await this.db.getOne<{ ref_count: number }>(
      'SELECT COUNT(*) AS ref_count FROM planned_dish WHERE dish_id = ?',
      [id],
    );
    return row?.ref_count ?? 0;
  }
}
