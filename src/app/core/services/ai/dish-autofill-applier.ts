/**
 * F-02 Layer 4 — Apply DishAutofillResult → ingredient findOrCreate +
 * dish_ingredient rows ready for `DishRepository.insert/update`.
 *
 * Pure orchestration. Mọi DB mutation đều đi qua IngredientRepository
 * (không touch SQL trực tiếp).
 *
 * Reference: phase-1.5b §2-bis Q5/Q7/Q13 + .hermes/plans/f02-implementation.md Layer 4.
 */

import { Injectable, inject } from '@angular/core';

import type { CreateDishIngredientInput } from '../../repositories/dish-ingredient.repository';
import { IngredientRepository } from '../../repositories/ingredient.repository';
import type {
  DishAutofillExistingRow,
  DishAutofillFuzzyConfirmRow,
  DishAutofillNewRow,
  DishAutofillResult,
  DishAutofillRow,
} from './nutrition-ai';

/**
 * User decisions cho mỗi `fuzzyConfirm` row, key theo index của row trong
 * `DishAutofillResult.rows`.
 *
 *  - `'accept-suggestion'` → dùng `suggestedMatchId` (như existing).
 *  - `'reject-create-new'` → tạo ingredient mới từ `pendingNew`.
 *
 * Row index không có trong map sẽ throw — UI bắt buộc phải resolve hết.
 */
export type FuzzyConfirmDecision = 'accept-suggestion' | 'reject-create-new';

export interface ApplyAutofillOptions {
  readonly fuzzyDecisions: ReadonlyMap<number, FuzzyConfirmDecision>;
}

/**
 * Output của `applyAutofill`:
 *  - `dishIngredients` — list sẵn sàng cho `DishRepository.insert/update`.
 *  - `createdIngredientIds` — id của các ingredient mới được tạo trong call này
 *    (UI có thể dùng cho toast / undo-hint).
 */
export interface ApplyAutofillResult {
  readonly dishIngredients: readonly CreateDishIngredientInput[];
  readonly createdIngredientIds: readonly string[];
}

@Injectable({ providedIn: 'root' })
export class DishAutofillApplier {
  private readonly ingredientRepo = inject(IngredientRepository);

  async apply(
    result: DishAutofillResult,
    options: ApplyAutofillOptions,
  ): Promise<ApplyAutofillResult> {
    const dishIngredients: CreateDishIngredientInput[] = [];
    const createdIngredientIds: string[] = [];

    // Dedup intra-call: 2 row AI cùng tên (sau khi user reject suggestion)
    // không được tạo 2 ingredient. Key = normalized name (re-check qua DB
    // findByExactName để bắt cả case ingredient vừa tạo trong vòng lặp này).
    for (let i = 0; i < result.rows.length; i++) {
      const link = await this.applyRow(result.rows[i], i, options);
      dishIngredients.push(link.dishIngredient);
      if (link.createdIngredientId) {
        createdIngredientIds.push(link.createdIngredientId);
      }
    }

    return { dishIngredients, createdIngredientIds };
  }

  private async applyRow(
    row: DishAutofillRow,
    index: number,
    options: ApplyAutofillOptions,
  ): Promise<{ dishIngredient: CreateDishIngredientInput; createdIngredientId: string | null }> {
    if (row.kind === 'existing') {
      return this.linkExisting(row, index);
    }

    if (row.kind === 'fuzzyConfirm') {
      return this.linkFuzzy(row, index, options);
    }

    return this.linkNew(row, index);
  }

  private linkExisting(
    row: DishAutofillExistingRow,
    index: number,
  ): { dishIngredient: CreateDishIngredientInput; createdIngredientId: null } {
    return {
      dishIngredient: this.toLink(row.matchedIngredientId, row.gramWeight, index),
      createdIngredientId: null,
    };
  }

  private async linkFuzzy(
    row: DishAutofillFuzzyConfirmRow,
    index: number,
    options: ApplyAutofillOptions,
  ): Promise<{ dishIngredient: CreateDishIngredientInput; createdIngredientId: string | null }> {
    const decision = options.fuzzyDecisions.get(index);
    if (!decision) {
      throw new Error(
        `[DishAutofillApplier] Missing fuzzyDecision for row ${index} ('${row.name}').`,
      );
    }
    if (decision === 'accept-suggestion') {
      return {
        dishIngredient: this.toLink(row.suggestedMatchId, row.gramWeight, index),
        createdIngredientId: null,
      };
    }
    return this.linkNew(row.pendingNew, index);
  }

  private async linkNew(
    row: Omit<DishAutofillNewRow, 'kind'>,
    index: number,
  ): Promise<{ dishIngredient: CreateDishIngredientInput; createdIngredientId: string | null }> {
    const id = await this.findOrCreate(row);
    return {
      dishIngredient: this.toLink(id.ingredientId, row.gramWeight, index),
      createdIngredientId: id.created ? id.ingredientId : null,
    };
  }

  private toLink(
    ingredientId: string,
    gramWeight: number,
    sortOrder: number,
  ): CreateDishIngredientInput {
    return { ingredient_id: ingredientId, gram_weight: gramWeight, sort_order: sortOrder };
  }

  private async findOrCreate(
    payload: Omit<DishAutofillNewRow, 'kind'>,
  ): Promise<{ ingredientId: string; created: boolean }> {
    // Re-check DB: có thể trong cùng call này vừa tạo (loop trước) hoặc
    // user đã có sẵn nhưng AI bỏ sót (Q5-C edge case).
    const existing = await this.ingredientRepo.findByExactName(payload.name);
    if (existing) {
      return { ingredientId: existing.id, created: false };
    }
    const inserted = await this.ingredientRepo.insert({
      name: payload.name,
      category: payload.category,
      calories: payload.caloriesPer100g,
      protein: payload.proteinPer100g,
      carbs: payload.carbsPer100g,
      fat: payload.fatPer100g,
      fiber: payload.fiberPer100g,
      source: 'ai',
    });
    return { ingredientId: inserted.id, created: true };
  }
}
