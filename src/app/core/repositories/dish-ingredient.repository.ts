import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import type { DishIngredientModel } from '../models/management.model';
import { Database } from '../services/database/database';

/**
 * Dish-ingredient repository — gram-only revision (schema v6).
 *
 * Mỗi link chỉ lưu `gram_weight` (đã chuẩn hoá về gram). Không còn unit picker
 * hay normalized_amount + amount_value/unit_id.
 */

export interface CreateDishIngredientInput {
  ingredient_id: string;
  /** Gram weight, must be > 0 (DB CHECK enforces). */
  gram_weight: number;
  /** Optional explicit ordering; defaults to insertion order. */
  sort_order?: number;
}

@Injectable({ providedIn: 'root' })
export class DishIngredientRepository {
  private readonly db = inject(Database);

  async listByDish(dishId: string): Promise<DishIngredientModel[]> {
    return this.db.query<DishIngredientModel>(
      'SELECT * FROM dish_ingredient WHERE dish_id = ? ORDER BY sort_order ASC, rowid ASC',
      [dishId],
    );
  }

  async bulkInsert(dishId: string, items: CreateDishIngredientInput[]): Promise<void> {
    let index = 0;
    for (const item of items) {
      if (!Number.isFinite(item.gram_weight) || item.gram_weight <= 0) {
        throw new Error(
          `Invalid gram_weight for ingredient '${item.ingredient_id}': ${item.gram_weight}`,
        );
      }
      await this.db.execute(
        `INSERT INTO dish_ingredient (
          id, dish_id, ingredient_id, gram_weight, sort_order
        ) VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), dishId, item.ingredient_id, item.gram_weight, item.sort_order ?? index],
      );
      index += 1;
    }
  }

  async deleteByDish(dishId: string): Promise<void> {
    await this.db.execute('DELETE FROM dish_ingredient WHERE dish_id = ?', [dishId]);
  }
}
