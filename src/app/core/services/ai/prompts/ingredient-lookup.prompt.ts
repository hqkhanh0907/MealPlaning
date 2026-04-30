/**
 * Prompt template cho F-01 — AI Ingredient Lookup.
 *
 * Source-of-truth:
 *   - docs/5-ai/ai-strategy.md §3.9 (gram-only revision)
 *   - docs/5-development/phase-1.5b-ai-foundation.md §4.1
 *
 * Output schema: 5 macro per 100g + name/category/confidence/note.
 * KHÔNG có unit/density/conversion — gram-only absolute (RULE-DI-GRAM-01..05).
 *
 * Category strategy (Decision #10): AI được instruct list 11 enum value;
 * NutritionAi sẽ fuzzy-map output về `IngredientCategory` (fallback "Khác").
 * Zod KHÔNG dùng z.enum để tránh hard-fail khi AI trả gần đúng.
 */

import { z } from 'zod';

import { INGREDIENT_CATEGORIES } from '../../../models/management.constants';

// ---------------------------------------------------------------------------
// Zod schema (parsed from Gemini response)
// ---------------------------------------------------------------------------

export const ingredientLookupResponseSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(60),
  calories: z.number().min(0).max(900), // kcal/100g, dầu ~884 max
  protein: z.number().min(0).max(100),
  carbs: z.number().min(0).max(100),
  fat: z.number().min(0).max(100),
  fiber: z.number().min(0).max(100),
  confidence: z.enum(['high', 'medium', 'low']),
  note: z.string().max(280).default(''),
});

export type IngredientLookupResponse = z.infer<typeof ingredientLookupResponseSchema>;

// ---------------------------------------------------------------------------
// Gemini responseSchema (JSON-Schema subset for `generationConfig`)
// ---------------------------------------------------------------------------

export const ingredientLookupGeminiSchema = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    category: { type: 'STRING' },
    calories: { type: 'NUMBER' },
    protein: { type: 'NUMBER' },
    carbs: { type: 'NUMBER' },
    fat: { type: 'NUMBER' },
    fiber: { type: 'NUMBER' },
    confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
    note: { type: 'STRING' },
  },
  required: [
    'name',
    'category',
    'calories',
    'protein',
    'carbs',
    'fat',
    'fiber',
    'confidence',
    'note',
  ],
} as const;

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

const SYSTEM_INSTRUCTION =
  'Bạn là chuyên gia dinh dưỡng người Việt. Trả lời chỉ bằng JSON theo schema yêu cầu, không thêm prose, không markdown.';

/**
 * Build prompt body cho `lookupIngredient(name)`.
 *
 * Thiết kế prompt:
 *  - Liệt kê 11 category enum values để AI chọn (Decision #10).
 *  - Nhấn mạnh per-100g basis (gram-only).
 *  - USDA là authority chính, tiếng Việt chỉ alias.
 */
export function buildIngredientLookupPrompt(name: string): string {
  const trimmed = name.trim();
  const categories = INGREDIENT_CATEGORIES.map((c) => `"${c}"`).join(', ');

  return [
    `Tra cứu thông tin dinh dưỡng canonical cho nguyên liệu "${trimmed}".`,
    '',
    'Rules về basis:',
    '- LUÔN trả nutrition theo per 100 gram (cả nguyên liệu rắn lẫn lỏng).',
    '- Với liquid (sữa, dầu, nước chấm): tự quy đổi về 100g bằng quy ước:',
    '    * nước ≈ 1 g/ml',
    '    * sữa ~1.03 g/ml',
    '    * dầu thực vật ~0.92 g/ml',
    '  Không trả per 100ml.',
    '',
    'Rules về category (BẮT BUỘC chọn 1 trong 11 giá trị sau):',
    `  ${categories}`,
    '  Nếu không khớp, ưu tiên "Khác".',
    '',
    'Rules về số liệu:',
    '- Phase 1 ưu tiên USDA làm nutrition authority chính.',
    '- Nguồn phụ tiếng Việt chỉ dùng để hỗ trợ naming/alias.',
    '- KHÔNG được bịa số — nếu không chắc, trả confidence: "low" + note giải thích.',
    '- KHÔNG trả unit/measurement/density/conversion.',
    '',
    'Rules về confidence:',
    '- "high": data USDA chuẩn, tên rõ ràng, không mơ hồ.',
    '- "medium": có data nhưng tên hơi mơ hồ hoặc cần giả định trạng thái nấu chín.',
    '- "low": tên quá mơ hồ (VD "thịt", "cá") hoặc không có data tin cậy.',
    '',
    'Trả JSON đúng schema:',
    '{',
    '  "name": string,                  // Chuẩn hóa tên tiếng Việt',
    '  "category": string,              // 1 trong 11 giá trị enum',
    '  "calories": number,              // kcal per 100g',
    '  "protein": number,               // g per 100g',
    '  "carbs": number,                 // g per 100g',
    '  "fat": number,                   // g per 100g',
    '  "fiber": number,                 // g per 100g',
    '  "confidence": "high" | "medium" | "low",',
    '  "note": string                   // Ghi chú nếu cần (VD: "đã nấu chín", "raw")',
    '}',
  ].join('\n');
}

export const INGREDIENT_LOOKUP_SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTION;
