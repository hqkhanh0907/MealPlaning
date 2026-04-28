import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import type {
  DishIngredientModel,
  IngredientModel,
  IngredientUnitModel,
  UnitModel,
} from '../models/management.model';
import { Database } from '../services/database/database';
import { resolveUnit } from '../services/unit-resolver';

export interface CreateDishIngredientInput {
  ingredient_id: string;
  amount_value: number;
  unit_id: string;
}

type IngredientUnitRow = IngredientUnitModel;
type UnitRow = UnitModel;
type IngredientRow = IngredientModel;

@Injectable({ providedIn: 'root' })
export class DishIngredientRepository {
  private readonly db = inject(Database);

  async listByDish(dishId: string): Promise<DishIngredientModel[]> {
    return this.db.query<DishIngredientModel>(
      'SELECT * FROM dish_ingredient WHERE dish_id = ? ORDER BY rowid ASC',
      [dishId],
    );
  }

  async bulkInsert(dishId: string, items: CreateDishIngredientInput[]): Promise<void> {
    for (const item of items) {
      const ingredient = await this.db.getOne<IngredientRow>(
        'SELECT * FROM ingredient WHERE id = ?',
        [item.ingredient_id],
      );
      const unit = await this.db.getOne<UnitRow>('SELECT * FROM unit WHERE id = ?', [item.unit_id]);
      const ingredientUnit = await this.db.getOne<IngredientUnitRow>(
        'SELECT * FROM ingredient_unit WHERE ingredient_id = ? AND unit_id = ?',
        [item.ingredient_id, item.unit_id],
      );

      if (!ingredient) {
        throw new Error(`Ingredient '${item.ingredient_id}' not found.`);
      }

      if (!unit) {
        throw new Error(`Unit '${item.unit_id}' not found.`);
      }

      const resolved = resolveUnit({
        ingredient,
        unit,
        amountValue: item.amount_value,
        ingredientUnit,
      });

      await this.db.execute(
        `INSERT INTO dish_ingredient (
          id, dish_id, ingredient_id, amount_value, unit_id, normalized_amount
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          dishId,
          item.ingredient_id,
          item.amount_value,
          item.unit_id,
          resolved.normalizedAmount,
        ],
      );
    }
  }

  async deleteByDish(dishId: string): Promise<void> {
    await this.db.execute('DELETE FROM dish_ingredient WHERE dish_id = ?', [dishId]);
  }
}
