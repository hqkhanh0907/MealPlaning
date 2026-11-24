import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import type { MealType } from '../models/meal-plan.types';
import { portionNutrition, validPhotoGrams, type PhotoMealPortion } from '../models/photo-meal';
import { Database } from '../services/database/database';
import type { CreateDishIngredientInput } from './dish-ingredient.repository';
import { DishRepository } from './dish.repository';
import { IngredientRepository } from './ingredient.repository';
import { PlannedDishRepository } from './planned-dish.repository';

@Injectable({ providedIn: 'root' })
export class PhotoMealRepository {
  private readonly db = inject(Database);
  private readonly ingredients = inject(IngredientRepository);
  private readonly dishes = inject(DishRepository);
  private readonly planned = inject(PlannedDishRepository);
  private readonly reviewIds = new WeakMap<readonly PhotoMealPortion[], string>();
  private queue = Promise.resolve();

  save(
    date: string,
    mealType: MealType,
    items: readonly PhotoMealPortion[],
    captureId = this.reviewIds.get(items) ?? uuidv4(),
  ): Promise<void> {
    this.reviewIds.set(items, captureId);
    const result = this.queue.then(() => this.saveReview(date, mealType, items, captureId));
    this.queue = result.catch(() => undefined);
    return result;
  }

  private async saveReview(
    date: string,
    mealType: MealType,
    items: readonly PhotoMealPortion[],
    dishId: string,
  ): Promise<void> {
    if (
      !items.length ||
      items.some(
        ({ item, grams }) =>
          !validPhotoGrams(grams) || !validPhotoGrams(item.estimatedGrams) || !item.name.trim(),
      )
    ) {
      throw new Error('Khẩu phần trong ảnh không hợp lệ.');
    }

    await this.db.withTransaction(async () => {
      if (await this.db.getOne('SELECT id FROM dish WHERE id = ?', [dishId])) return;
      const links: CreateDishIngredientInput[] = [];
      for (const { item, grams } of items) {
        const ingredient = await this.ingredients.insert({
          name: item.name,
          category: 'Khác',
          source: 'ai',
          ...portionNutrition({ item, grams: 100 }),
        });
        links.push({ ingredient_id: ingredient.id, gram_weight: grams });
      }
      await this.dishes.insert(
        {
          name: items.map(({ item, grams }) => `${item.name} (${grams} g)`).join(', '),
          description: 'Ước tính dinh dưỡng từ ảnh bữa ăn.',
          type: 'ai_autofill',
          source: 'ai',
          servings: 1,
          image_url: null,
          meal_tag: mealType === 'snack' ? null : mealType,
        },
        links,
        dishId,
      );
      const entry = await this.planned.addToDateMealType(date, mealType, dishId, 1);
      await this.planned.markCompleted(entry.id);
    });
  }
}
