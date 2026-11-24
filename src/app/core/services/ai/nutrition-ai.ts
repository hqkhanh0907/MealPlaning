import { Injectable, inject } from '@angular/core';

import { INGREDIENT_CATEGORIES, type IngredientCategory } from '../../models/management.constants';
import { findFuzzyMatches, type FuzzyCandidate } from '../../utils/fuzzy-match';
import { AiGeneration } from './ai-generation';
import {
  buildDishAutofillPrompt,
  dishAutofillResponseSchema,
  DISH_AUTOFILL_SYSTEM_INSTRUCTION,
  type DishAutofillResponse,
} from './prompts/dish-autofill.prompt';
import {
  buildIngredientLookupPrompt,
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
 * Logic match (rev 1.5 — app-side, không phụ thuộc AI):
 *   - distance == 0 → `existing` (auto-link, dùng nutrition từ DB).
 *   - distance ∈ {1, 2} → `fuzzyConfirm` (UI hỏi "Có phải X?").
 *   - distance > 2 → `new` (tạo ingredient mới với nutrition AI cung cấp).
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
   * Nếu user reject → row trở thành `new` (AI đã cung cấp full nutrition
   *   trong `pendingNew`).
   */
  readonly suggestedMatchId: string;
  readonly suggestedMatchName: string;
  readonly distance: number;
  /** Nutrition AI đã sinh — dùng nếu user reject suggestion. */
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
  private readonly ai = inject(AiGeneration);

  /**
   * F-01 — gọi AI với prompt ingredient-lookup, validate qua zod,
   * fuzzy-map category, trả về result đã ready-to-prefill.

   */
  async lookupIngredient(name: string): Promise<IngredientLookupResult> {
    const prompt = buildIngredientLookupPrompt(name);

    const response = await this.ai.generateText(prompt, {
      feature: 'ingredient_lookup',
      systemInstruction: INGREDIENT_LOOKUP_SYSTEM_INSTRUCTION,

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
   * F-02 — gọi AI với prompt dish-autofill (KHÔNG truyền DB list),
   * validate qua zod (flat schema), sau đó match local per row vs
   * `dbIngredients` bằng `findFuzzyMatches`:
   *
   *   - distance == 0 → kind=`existing` (auto-link, dùng nutrition DB).
   *   - distance ∈ {1, 2} → kind=`fuzzyConfirm` (UI hỏi user).
   *   - distance > 2 → kind=`new` (tạo ingredient mới).
   *
   * @param dishName Tên món để AI phân tích.
   * @param dbIngredients Ingredient hiện có trong DB (id + name) — CHỈ
   *   dùng cho fuzzy match local, KHÔNG đưa vào prompt.
   */
  async autofillDish(
    dishName: string,
    dbIngredients: readonly FuzzyCandidate[],
  ): Promise<DishAutofillResult> {
    const prompt = buildDishAutofillPrompt(dishName);

    const response = await this.ai.generateText(prompt, {
      feature: 'dish_autofill',
      systemInstruction: DISH_AUTOFILL_SYSTEM_INSTRUCTION,

      schema: dishAutofillResponseSchema,
      // Gemini 2.5-flash burns ~2k internal "thinking" tokens before content.
      // Default 2048 caps content mid-array → JSON.parse fail. Dish autofill
      // can return up to ~25 ingredients × ~120 tokens = 3k content + 2k think.
      // Bumping to 8192 leaves headroom for complex dishes (Bún bò Huế 18 rows).
      maxOutputTokens: 8192,
      // Generating 8k tokens with thinking on 2.5-flash regularly takes 25-45s
      // on real network. Default 15s timeout fires before first token. 60s
      // gives enough buffer; if it still times out, the network is genuinely down.
      timeoutMs: 60_000,
    });

    const rows: DishAutofillRow[] = response.ingredients.map((row) => {
      const cleanName = row.name.trim().replace(/\s+/g, ' ');
      const pendingNew: Omit<DishAutofillNewRow, 'kind'> = {
        name: cleanName,
        gramWeight: row.gram_weight,
        category: mapCategory(row.category),
        caloriesPer100g: row.calories_per_100g,
        proteinPer100g: row.protein_per_100g,
        carbsPer100g: row.carbs_per_100g,
        fatPer100g: row.fat_per_100g,
        fiberPer100g: row.fiber_per_100g,
        confidence: row.confidence,
      };

      const matches = findFuzzyMatches(cleanName, dbIngredients);
      if (matches.length === 0) {
        return { kind: 'new', ...pendingNew } satisfies DishAutofillNewRow;
      }

      const top = matches[0];
      if (top.distance === 0) {
        // Exact match (sau normalize) → auto-link, dùng nutrition từ DB.
        return {
          kind: 'existing',
          name: top.match.name,
          gramWeight: pendingNew.gramWeight,
          matchedIngredientId: top.match.id,
          confidence: pendingNew.confidence,
        } satisfies DishAutofillExistingRow;
      }

      // distance ∈ {1, 2} → cần user confirm.
      return {
        kind: 'fuzzyConfirm',
        name: pendingNew.name,
        gramWeight: pendingNew.gramWeight,
        suggestedMatchId: top.match.id,
        suggestedMatchName: top.match.name,
        distance: top.distance,
        pendingNew,
      } satisfies DishAutofillFuzzyConfirmRow;
    });

    return {
      dishName: dishName.trim(),
      rows,
      raw: response,
    };
  }
}
