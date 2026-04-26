import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import type { DishIngredientModel, DishModel } from '../models/management.model';
import type { DishSource, DishType } from '../models/management.types';
import { DatabaseService } from '../services/database/database.service';
import { DishIngredientRepository, type CreateDishIngredientInput } from './dish-ingredient.repository';

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
}

@Injectable({ providedIn: 'root' })
export class DishRepository {
  private readonly db = inject(DatabaseService);
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

  async getById(id: string): Promise<DishWithIngredients | null> {
    const dish = await this.db.getOne<DishListItem>('SELECT * FROM dish_with_totals WHERE id = ?', [id]);
    if (!dish) {
      return null;
    }

    const ingredients = await this.dishIngredientRepository.listByDish(id);
    return {
      ...dish,
      ingredients,
    };
  }

  async insert(data: CreateDishInput, ingredients: CreateDishIngredientInput[]): Promise<DishWithIngredients> {
    if (ingredients.length === 0) {
      throw new Error('Dish must contain at least one ingredient.');
    }

    const dishId = uuidv4();

    await this.db.withTransaction(async () => {
      await this.db.execute(
        `INSERT INTO dish (
          id, name, description, type, source, servings, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [dishId, data.name, data.description, data.type, data.source, data.servings, data.image_url],
      );

      await this.dishIngredientRepository.bulkInsert(dishId, ingredients);
    });

    return (await this.getById(dishId)) as DishWithIngredients;
  }

  async update(id: string, data: CreateDishInput, ingredients: CreateDishIngredientInput[]): Promise<DishWithIngredients> {
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
         SET name = ?, description = ?, type = ?, source = ?, servings = ?, image_url = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [data.name, data.description, data.type, nextSource, data.servings, data.image_url, id],
      );

      await this.dishIngredientRepository.deleteByDish(id);
      await this.dishIngredientRepository.bulkInsert(id, ingredients);
    });

    return (await this.getById(id)) as DishWithIngredients;
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM dish WHERE id = ?', [id]);
  }

  async countReferences(id: string): Promise<number> {
    const row = await this.db.getOne<{ ref_count: number }>(
      'SELECT COUNT(*) AS ref_count FROM planned_dish WHERE dish_id = ?',
      [id],
    );
    return row?.ref_count ?? 0;
  }
}
