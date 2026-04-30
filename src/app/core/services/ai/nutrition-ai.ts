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
import { GeminiClient } from './gemini-client';
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
  /** Empty string nếu AI không trả note. */
  note: string;
  /** Đã raw (chưa map) — giữ để debug nếu cần. */
  raw: IngredientLookupResponse;
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
      note: response.note ?? '',
      raw: response,
    };
  }
}
