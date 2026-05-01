/**
 * Prompt template cho F-02 — AI Auto-fill Dish.
 *
 * Source-of-truth:
 *   - docs/5-ai/ai-strategy.md §3.2 (rev 1.4)
 *   - docs/5-development/phase-1.5b-ai-foundation.md §2-bis Q7 / §3.3 / §4.2
 *
 * Architecture (rev 1.5 — 2026-05-01):
 *   AI là CONTENT PROVIDER, app là MATCH ENGINE.
 *
 *   - Prompt KHÔNG truyền DB ingredient list → AI không quyết match.
 *   - AI trả về 1 row type duy nhất: name + gram + nutrition_per_100g + category.
 *   - NutritionAi.autofillDish() chạy `findFuzzyMatches` per row vs `dbIngredients`:
 *       distance == 0  → kind='existing'      (auto-link, silent)
 *       distance ∈ 1..2 → kind='fuzzyConfirm' (UI hỏi user)
 *       distance > 2   → kind='new'           (tạo ingredient mới)
 *   - Lợi ích:
 *       • Prompt giảm ~60% (3.9 KB → ~1.6 KB cho 40 candidates) → 503-rate ↓.
 *       • Output AI ổn định hơn (1 task: phân tích món, không phải đoán DB id).
 *       • Logic match deterministic, test được, scale tốt khi DB lớn.
 *   - Trade-off đã chấp nhận:
 *       • Mất khả năng AI semantic-match xa (vd "thịt heo nạc" → "thịt heo",
 *         Lev=4). Mitigation: sheet Layer 6 cho user override inline.
 *
 * Naming convention (audit A7 giữ nguyên):
 *   - Gemini & Zod input: snake_case.
 *   - NutritionAi map sang camelCase TS sau khi parse (Layer 3).
 */

import { z } from 'zod';

import { INGREDIENT_CATEGORIES } from '../../../models/management.constants';

// ---------------------------------------------------------------------------
// Zod schema — flat row, KHÔNG còn discriminator is_in_db
// ---------------------------------------------------------------------------

export const dishAutofillRowSchema = z
  .object({
    name: z.string().min(1).max(120),
    gram_weight: z.number().positive().max(10_000),
    category: z.string().min(1).max(60),
    calories_per_100g: z.number().min(0).max(900),
    protein_per_100g: z.number().min(0).max(100),
    carbs_per_100g: z.number().min(0).max(100),
    fat_per_100g: z.number().min(0).max(100),
    fiber_per_100g: z.number().min(0).max(100),
    confidence: z.enum(['high', 'medium', 'low']),
  })
  .strict();

export const dishAutofillResponseSchema = z.object({
  ingredients: z.array(dishAutofillRowSchema).max(30),
});

export type DishAutofillRowResponse = z.infer<typeof dishAutofillRowSchema>;
export type DishAutofillResponse = z.infer<typeof dishAutofillResponseSchema>;

// ---------------------------------------------------------------------------
// Gemini responseSchema — flat, mọi field required
// ---------------------------------------------------------------------------

export const dishAutofillGeminiSchema = {
  type: 'OBJECT',
  properties: {
    ingredients: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          gram_weight: { type: 'NUMBER' },
          category: { type: 'STRING' },
          calories_per_100g: { type: 'NUMBER' },
          protein_per_100g: { type: 'NUMBER' },
          carbs_per_100g: { type: 'NUMBER' },
          fat_per_100g: { type: 'NUMBER' },
          fiber_per_100g: { type: 'NUMBER' },
          confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
        },
        required: [
          'name',
          'gram_weight',
          'category',
          'calories_per_100g',
          'protein_per_100g',
          'carbs_per_100g',
          'fat_per_100g',
          'fiber_per_100g',
          'confidence',
        ],
      },
    },
  },
  required: ['ingredients'],
} as const;

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

const SYSTEM_INSTRUCTION =
  'Bạn là chuyên gia ẩm thực + dinh dưỡng người Việt. Trả lời chỉ bằng JSON theo schema yêu cầu, không thêm prose, không markdown.';

/**
 * Build prompt body cho `autofillDish(name)`.
 *
 * Thiết kế (rev 1.5):
 *  - KHÔNG truyền DB ingredient list. App tự match local sau khi AI trả.
 *  - AI tập trung vào 1 task: phân tích món + sinh nutrition per 100g.
 *  - Cap servings = 1 (RULE-DISH-TOTAL-04 — per-ingredient gram cho 1 serving).
 */
export function buildDishAutofillPrompt(dishName: string): string {
  const trimmedDish = dishName.trim();
  const categories = INGREDIENT_CATEGORIES.map((c) => `"${c}"`).join(', ');

  return [
    `Phân tích món "${trimmedDish}" và liệt kê các nguyên liệu chính cho 1 phần ăn (1 serving).`,
    '',
    'Rules về `ingredients[]`:',
    '- Mỗi row mô tả 1 nguyên liệu cho 1 serving của món.',
    '- `name` = tên tiếng Việt chuẩn, ngắn gọn (vd "Hành lá", "Nước mắm", "Thịt heo").',
    '- `gram_weight` = số gram NGUYÊN LIỆU đó cho 1 serving (KHÔNG phải tổng món).',
    '- `category` = 1 trong 11 enum sau:',
    `    ${categories}`,
    '    Nếu không khớp, chọn "Khác".',
    '- `calories_per_100g`, `protein_per_100g`, `carbs_per_100g`, `fat_per_100g`,',
    '  `fiber_per_100g` = số dinh dưỡng per 100g (USDA-style).',
    '- `confidence` = "high" | "medium" | "low".',
    '',
    'Rules số liệu:',
    '- KHÔNG bịa số — không chắc → confidence "low".',
    '- KHÔNG trả unit/measurement/density/conversion — gram-only absolute.',
    '- KHÔNG vi phạm RULE-DISH-TOTAL-04: nutrition_per_100g ≠ tổng dish.',
    '- Dùng tên tiếng Việt CHUẨN, ngắn, không kèm trạng thái nấu nướng',
    '  (vd "Thịt heo" thay vì "Thịt heo nạc luộc"; app sẽ tự dò trùng với DB).',
    '',
    'Trả JSON đúng schema:',
    '{',
    '  "ingredients": [',
    '    {',
    '      "name": string,',
    '      "gram_weight": number,            // gram cho 1 serving',
    '      "category": string,',
    '      "calories_per_100g": number,',
    '      "protein_per_100g": number,',
    '      "carbs_per_100g": number,',
    '      "fat_per_100g": number,',
    '      "fiber_per_100g": number,',
    '      "confidence": "high" | "medium" | "low"',
    '    }',
    '  ]',
    '}',
  ].join('\n');
}

export const DISH_AUTOFILL_SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTION;
