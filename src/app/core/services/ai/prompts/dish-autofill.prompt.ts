/**
 * Prompt template cho F-02 — AI Auto-fill Dish.
 *
 * Source-of-truth:
 *   - docs/5-ai/ai-strategy.md §3.2 (rev 1.4)
 *   - docs/5-development/phase-1.5b-ai-foundation.md §2-bis Q7 / §3.3 / §4.2
 *
 * Output schema:
 *   - `ingredients[]` — mỗi row có `is_in_db: boolean` discriminator.
 *   - is_in_db=true: row khớp DB → có `matched_ingredient_id` (uuid).
 *   - is_in_db=false: row chưa có trong DB → có 5 macro per 100g + category +
 *     confidence để NutritionAi tạo ingredient mới (source='ai').
 *
 * Schema strategy (audit decision A7=A):
 *   - Gemini responseSchema = FLAT object với mọi field optional + nullable.
 *     Gemini 2.5 Flash structured output ổn định hơn `anyOf`/`oneOf` phức tạp;
 *     model tự fill đúng field theo prompt instruction.
 *   - Zod = STRICT `discriminatedUnion('is_in_db')` validate runtime — đây là
 *     hàng phòng thủ nếu model trả lệch (vd thiếu `matched_ingredient_id` cho
 *     row is_in_db=true, hay thiếu nutrition cho row is_in_db=false).
 *
 * Divergence vs F-01 ingredient-lookup prompt (cố ý, audit 2026-04-30):
 *   - F-02 KHÔNG copy "liquid density rule" (nước/sữa/dầu g/ml) từ F-01: row
 *     liquid trong dish hiếm + AI 2.5 Flash đã hiểu basis "per 100g" trong
 *     context dish.
 *   - F-02 KHÔNG copy "confidence definition high/medium/low" từ F-01: F-02
 *     row được user verify inline trong sheet trước Save, hậu quả mis-grading
 *     thấp hơn F-01 (ingredient lưu thẳng DB).
 *   - F-02 dùng `_per_100g` suffix trong field name (vs F-01 root `calories`):
 *     F-02 row có 2 nhánh + cần nhấn basis để model không nhầm với "tổng cho
 *     1 serving"; F-01 root object không có ambiguity nên giữ tên ngắn.
 *   - Mục tiêu: giữ prompt F-02 ngắn (~3.9 KB cho 40 candidates, 53% là DB
 *     hint block); thêm rules sẽ đẩy lên >4.2 KB không có evidence cải thiện
 *     output quality.
 *
 * Naming convention (audit A7):
 *   - Gemini & Zod input: snake_case (đồng bộ output Gemini thường thấy).
 *   - NutritionAi map sang camelCase TS sau khi parse (Layer 3).
 */

import { z } from 'zod';

import { INGREDIENT_CATEGORIES } from '../../../models/management.constants';

// ---------------------------------------------------------------------------
// Zod schema — strict discriminatedUnion('is_in_db')
// ---------------------------------------------------------------------------

/** Row khớp với 1 ingredient đã có trong DB. Chỉ cần id + tên + gram. */
const inDbRowSchema = z
  .object({
    name: z.string().min(1).max(120),
    gram_weight: z.number().positive().max(10_000),
    is_in_db: z.literal(true),
    matched_ingredient_id: z.string().uuid(),
  })
  .strict();

/** Row chưa có trong DB. Bắt buộc nutrition + category + confidence. */
const newIngRowSchema = z
  .object({
    name: z.string().min(1).max(120),
    gram_weight: z.number().positive().max(10_000),
    is_in_db: z.literal(false),
    category: z.string().min(1).max(60),
    calories_per_100g: z.number().min(0).max(900),
    protein_per_100g: z.number().min(0).max(100),
    carbs_per_100g: z.number().min(0).max(100),
    fat_per_100g: z.number().min(0).max(100),
    fiber_per_100g: z.number().min(0).max(100),
    confidence: z.enum(['high', 'medium', 'low']),
  })
  .strict();

export const dishAutofillRowSchema = z.discriminatedUnion('is_in_db', [
  inDbRowSchema,
  newIngRowSchema,
]);

export const dishAutofillResponseSchema = z.object({
  ingredients: z.array(dishAutofillRowSchema).max(30),
});

export type DishAutofillRowResponse = z.infer<typeof dishAutofillRowSchema>;
export type DishAutofillResponse = z.infer<typeof dishAutofillResponseSchema>;

// ---------------------------------------------------------------------------
// Gemini responseSchema — FLAT with nullable fields (A7=A)
// ---------------------------------------------------------------------------
//
// Gemini structured output với `anyOf`/`oneOf` discriminator phức tạp dễ fail
// hoặc bị model "rút gọn"; FLAT schema + nullable + strict Zod ở TS là chiến
// lược an toàn nhất cho Gemini 2.5 Flash. Prompt instructs model về quy tắc
// điền/để null cho từng nhánh is_in_db.

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
          is_in_db: { type: 'BOOLEAN' },
          matched_ingredient_id: { type: 'STRING', nullable: true },
          category: { type: 'STRING', nullable: true },
          calories_per_100g: { type: 'NUMBER', nullable: true },
          protein_per_100g: { type: 'NUMBER', nullable: true },
          carbs_per_100g: { type: 'NUMBER', nullable: true },
          fat_per_100g: { type: 'NUMBER', nullable: true },
          fiber_per_100g: { type: 'NUMBER', nullable: true },
          confidence: { type: 'STRING', enum: ['high', 'medium', 'low'], nullable: true },
        },
        required: ['name', 'gram_weight', 'is_in_db'],
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

/** DB ingredient candidate truyền vào prompt (id + tên hiển thị cho AI tham chiếu). */
export interface DbIngredientHint {
  readonly id: string;
  readonly name: string;
}

/**
 * Build prompt body cho `autofillDish(name, dbIngredients)`.
 *
 * Thiết kế:
 *  - Liệt kê DB ingredient hiện có (id + tên) để AI tái sử dụng → giảm trùng lặp.
 *  - Nhấn mạnh basis per 100g cho row is_in_db=false.
 *  - Hướng dẫn quy tắc null: row is_in_db=true → matched_ingredient_id required
 *    + nutrition fields = null; row is_in_db=false → ngược lại.
 *  - Cap servings = 1 (theo §3.3 RULE-DISH-TOTAL-04 — per-ingredient gram cho
 *    1 serving của món, KHÔNG phải tổng dish).
 */
export function buildDishAutofillPrompt(
  dishName: string,
  dbIngredients: readonly DbIngredientHint[],
): string {
  const trimmedDish = dishName.trim();
  const categories = INGREDIENT_CATEGORIES.map((c) => `"${c}"`).join(', ');

  const dbList =
    dbIngredients.length === 0
      ? '  (chưa có nguyên liệu nào trong DB — mọi row sẽ là is_in_db=false)'
      : dbIngredients.map((ing) => `  - ${ing.id} | ${ing.name}`).join('\n');

  return [
    `Phân tích món "${trimmedDish}" và liệt kê các nguyên liệu chính cho 1 phần ăn (1 serving).`,
    '',
    'DB nguyên liệu hiện có (ưu tiên dùng lại, KHÔNG tạo trùng):',
    dbList,
    '',
    'Rules về `ingredients[]`:',
    '- Mỗi row mô tả 1 nguyên liệu cho 1 serving của món.',
    '- `gram_weight` = số gram NGUYÊN LIỆU đó cho 1 serving (KHÔNG phải tổng món).',
    '- Nếu nguyên liệu match 1 dòng trong DB ở trên → set:',
    '    is_in_db = true',
    '    matched_ingredient_id = id từ DB list',
    '    name = tên đúng theo DB',
    '    các field nutrition (calories_per_100g, protein_per_100g, carbs_per_100g,',
    '      fat_per_100g, fiber_per_100g), category, confidence = null',
    '- Nếu nguyên liệu CHƯA có trong DB → set:',
    '    is_in_db = false',
    '    matched_ingredient_id = null',
    '    name = tên tiếng Việt chuẩn (vd "Hành lá", "Nước mắm")',
    '    category = 1 trong 11 enum sau:',
    `      ${categories}`,
    '      Nếu không khớp, chọn "Khác".',
    '    calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g',
    '      = số dinh dưỡng per 100g (USDA-style).',
    '    confidence = "high" | "medium" | "low".',
    '',
    'Rules số liệu:',
    '- KHÔNG bịa số — không chắc → confidence "low".',
    '- KHÔNG trả unit/measurement/density/conversion — gram-only absolute.',
    '- KHÔNG vi phạm RULE-DISH-TOTAL-04: nutrition_per_100g ≠ tổng dish.',
    '',
    'Trả JSON đúng schema:',
    '{',
    '  "ingredients": [',
    '    {',
    '      "name": string,',
    '      "gram_weight": number,            // gram cho 1 serving',
    '      "is_in_db": boolean,',
    '      "matched_ingredient_id": string | null,',
    '      "category": string | null,',
    '      "calories_per_100g": number | null,',
    '      "protein_per_100g": number | null,',
    '      "carbs_per_100g": number | null,',
    '      "fat_per_100g": number | null,',
    '      "fiber_per_100g": number | null,',
    '      "confidence": "high" | "medium" | "low" | null',
    '    }',
    '  ]',
    '}',
  ].join('\n');
}

export const DISH_AUTOFILL_SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTION;
