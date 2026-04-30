/**
 * NutritionAi — wrapper service trên GeminiClient cho 2 method nghiệp vụ:
 *   1. `lookupIngredient(name)` — F-01 (Phase 1.5B.2). Implemented đầy đủ.
 *   2. `autofillDish(name, dbIngredients)` — F-02 (Phase 1.5B.3). NOT YET — sẽ
 *      thêm trong commit kế tiếp; ngoài scope 1.5B.2.
 *
 * Source-of-truth:
 *   - docs/5-development/phase-1.5b-ai-foundation.md §3
 *   - docs/5-ai/ai-strategy.md §3.9
 *
 * Decision log (1.5B.2):
 *   - #2 Duplicate check: exact match có normalize nhẹ (lowercase + trim
 *        + collapse whitespace, KHÔNG bỏ dấu).
 *   - #10 Category mismatch: fuzzy map AI output → IngredientCategory enum;
 *         fallback "Khác".
 */

import { Injectable, inject } from '@angular/core';

import { INGREDIENT_CATEGORIES, type IngredientCategory } from '../../models/management.constants';
import { findFuzzyMatches, type FuzzyCandidate } from '../../utils/fuzzy-match';
import { GeminiClient } from './gemini-client';
import {
  buildDishAutofillPrompt,
  dishAutofillGeminiSchema,
  dishAutofillResponseSchema,
  DISH_AUTOFILL_SYSTEM_INSTRUCTION,
  type DishAutofillResponse,
} from './prompts/dish-autofill.prompt';
import {
  buildIngredientLookupPrompt,
  ingredientLookupGeminiSchema,
  ingredientLookupResponseSchema,
  INGREDIENT_LOOKUP_SYSTEM_INSTRUCTION,
  type IngredientLookupResponse,
} from './prompts/ingredient-lookup.prompt';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Result của `lookupIngredient` sau khi NutritionAi đã hậu xử lý
 * (fuzzy-map category, normalize name) — sẵn sàng để pre-fill bottom sheet.
 */
export interface IngredientLookupResult {
  /** Tên đã chuẩn hoá (trim + collapse whitespace, GIỮ dấu/case từ AI). */
  name: string;
  /** Category đã được map vào `IngredientCategory` enum (fallback "Khác"). */
  category: IngredientCategory;
  /** kcal per 100g. */
  calories: number;
  /** g per 100g. */
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  confidence: 'high' | 'medium' | 'low';
  /** Đã raw (chưa map) — giữ để debug nếu cần. */
  raw: IngredientLookupResponse;
}

/**
 * Một row trong kết quả `autofillDish`.
 *
 * `kind` là discriminator phía client:
 *   - `existing` — Gemini đã match được vào DB (is_in_db=true) HOẶC
 *      fuzzy-match post-process tìm ra match (distance ≤ 2). Có
 *      `matchedIngredientId`. KHÔNG có nutrition (lấy từ DB).
 *   - `new` — không match → sẽ tạo ingredient mới trong Layer 4.
 *      Có nutrition per-100g + category.
 *   - `fuzzyConfirm` — Gemini báo is_in_db=false NHƯNG fuzzy-match local
 *      tìm thấy candidate. UI cần hiển thị "Có phải X?" cho user
 *      confirm trước khi xử lý như existing/new (Q5-C).
 */
export interface DishAutofillExistingRow {
  readonly kind: 'existing';
  readonly name: string;
  readonly gramWeight: number;
  readonly matchedIngredientId: string;
  readonly confidence: 'high' | 'medium' | 'low';
}

export interface DishAutofillNewRow {
  readonly kind: 'new';
  readonly name: string;
  readonly gramWeight: number;
  readonly category: IngredientCategory;
  readonly caloriesPer100g: number;
  readonly proteinPer100g: number;
  readonly carbsPer100g: number;
  readonly fatPer100g: number;
  readonly fiberPer100g: number;
  readonly confidence: 'high' | 'medium' | 'low';
}

export interface DishAutofillFuzzyConfirmRow {
  readonly kind: 'fuzzyConfirm';
  readonly name: string;
  readonly gramWeight: number;
  /**
   * Top-1 fuzzy candidate từ DB (distance ≤ 2). UI dùng cái này để hỏi user.
   * Nếu user confirm → row trở thành `existing` với matchedIngredientId này.
   * Nếu user reject → row trở thành `new` (Gemini đã cung cấp full nutrition
   *   trong `pendingNew`).
   */
  readonly suggestedMatchId: string;
  readonly suggestedMatchName: string;
  readonly distance: number;
  /** Nutrition Gemini đã sinh — dùng nếu user reject suggestion. */
  readonly pendingNew: Omit<DishAutofillNewRow, 'kind'>;
}

export type DishAutofillRow =
  | DishAutofillExistingRow
  | DishAutofillNewRow
  | DishAutofillFuzzyConfirmRow;

export interface DishAutofillResult {
  readonly dishName: string;
  readonly rows: readonly DishAutofillRow[];
  readonly raw: DishAutofillResponse;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Normalize tên ingredient cho duplicate check (Decision #2).
 *
 * Quy tắc:
 *  - lowercase
 *  - trim hai đầu
 *  - collapse mọi run whitespace (\s+) thành một space
 *  - KHÔNG bỏ dấu — "ức gà" ≠ "uc ga"
 *
 * Exposed để page có thể tái sử dụng.
 */
export function normalizeIngredientName(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Fuzzy-map raw category string from AI → `IngredientCategory` enum value
 * (Decision #10).
 *
 * Strategy:
 *   1. Exact match (case + diacritic insensitive) on full enum value.
 *   2. Substring match — enum value chứa AI string hoặc ngược lại.
 *   3. Fallback "Khác".
 *
 * Diacritics-fold dùng nội bộ CHỈ cho category match (không dùng cho
 * ingredient name) vì 11 enum value đều khác nhau khi đã fold dấu.
 */
function foldDiacritics(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

export function mapCategory(raw: string): IngredientCategory {
  const folded = foldDiacritics(raw);
  if (!folded) return 'Khác';

  // Pass 1 — exact folded match
  for (const cat of INGREDIENT_CATEGORIES) {
    if (foldDiacritics(cat) === folded) return cat;
  }

  // Pass 2 — substring (enum contains AI or AI contains enum)
  for (const cat of INGREDIENT_CATEGORIES) {
    const foldedCat = foldDiacritics(cat);
    if (foldedCat.includes(folded) || folded.includes(foldedCat)) {
      return cat;
    }
  }

  return 'Khác';
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class NutritionAi {
  private readonly gemini = inject(GeminiClient);

  /**
   * F-01 — gọi Gemini với prompt ingredient-lookup, validate qua zod,
   * fuzzy-map category, trả về result đã ready-to-prefill.
   *
   * Errors propagate as-is từ GeminiClient (caller bắt + show toast theo
   * `GEMINI_ERROR_TOAST` map).
   */
  async lookupIngredient(name: string): Promise<IngredientLookupResult> {
    const prompt = buildIngredientLookupPrompt(name);

    const response = await this.gemini.generateContent(prompt, {
      feature: 'ingredient_lookup',
      systemInstruction: INGREDIENT_LOOKUP_SYSTEM_INSTRUCTION,
      responseSchema: ingredientLookupGeminiSchema,
      schema: ingredientLookupResponseSchema,
    });

    return {
      name: response.name.trim().replace(/\s+/g, ' '),
      category: mapCategory(response.category),
      calories: response.calories,
      protein: response.protein,
      carbs: response.carbs,
      fat: response.fat,
      fiber: response.fiber,
      confidence: response.confidence,
      raw: response,
    };
  }

  /**
   * F-02 — gọi Gemini với prompt dish-autofill, validate qua zod
   * (discriminatedUnion `is_in_db`), sau đó chạy fuzzy-match local
   * post-process (Q5-C):
   *
   *   - Row is_in_db=true → kind=`existing`.
   *   - Row is_in_db=false:
   *      - Tìm fuzzy match trong `dbIngredients` (distance ≤ 2).
   *      - Có match → kind=`fuzzyConfirm` (UI hỏi user).
   *      - Không match → kind=`new`.
   *
   * @param dishName Tên món để Gemini phân tích.
   * @param dbIngredients Danh sách ingredient hiện có trong DB
   *   (id + name) — dùng cho cả prompt context lẫn fuzzy post-process.
   */
  async autofillDish(
    dishName: string,
    dbIngredients: readonly FuzzyCandidate[],
  ): Promise<DishAutofillResult> {
    const prompt = buildDishAutofillPrompt(dishName, dbIngredients);

    const response = await this.gemini.generateContent(prompt, {
      feature: 'dish_autofill',
      systemInstruction: DISH_AUTOFILL_SYSTEM_INSTRUCTION,
      responseSchema: dishAutofillGeminiSchema,
      schema: dishAutofillResponseSchema,
    });

    const rows: DishAutofillRow[] = response.ingredients.map((row) => {
      if (row.is_in_db) {
        return {
          kind: 'existing',
          name: row.name.trim().replace(/\s+/g, ' '),
          gramWeight: row.gram_weight,
          matchedIngredientId: row.matched_ingredient_id,
          confidence: 'high',
        } satisfies DishAutofillExistingRow;
      } else {
        // is_in_db=false → fuzzy match local
        const matches = findFuzzyMatches(row.name, dbIngredients);
        const pendingNew: Omit<DishAutofillNewRow, 'kind'> = {
          name: row.name.trim().replace(/\s+/g, ' '),
          gramWeight: row.gram_weight,
          category: mapCategory(row.category),
          caloriesPer100g: row.calories_per_100g,
          proteinPer100g: row.protein_per_100g,
          carbsPer100g: row.carbs_per_100g,
          fatPer100g: row.fat_per_100g,
          fiberPer100g: row.fiber_per_100g,
          confidence: row.confidence,
        };

        if (matches.length > 0) {
          const top = matches[0];
          return {
            kind: 'fuzzyConfirm',
            name: pendingNew.name,
            gramWeight: pendingNew.gramWeight,
            suggestedMatchId: top.match.id,
            suggestedMatchName: top.match.name,
            distance: top.distance,
            pendingNew,
          } satisfies DishAutofillFuzzyConfirmRow;
        }

        return { kind: 'new', ...pendingNew } satisfies DishAutofillNewRow;
      }
    });

    return {
      dishName: dishName.trim(),
      rows,
      raw: response,
    };
  }
}
