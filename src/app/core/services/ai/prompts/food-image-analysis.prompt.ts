import { z } from 'zod';

const CONFIDENCE = ['high', 'medium', 'low'] as const;

export const foodImageItemSchema = z
  .object({
    name: z.string().min(1).max(80),
    estimated_grams: z.number().min(1).max(2000),
    calories: z.number().min(0).max(3000),
    protein: z.number().min(0).max(300),
    carbs: z.number().min(0).max(500),
    fat: z.number().min(0).max(300),
    fiber: z.number().min(0).max(100),
    confidence: z.enum(CONFIDENCE),
    warning: z.string().max(160).nullable(),
  })
  .strict();

export const foodImageResponseSchema = z
  .object({
    overall_confidence: z.enum(CONFIDENCE),
    image_quality_warning: z.string().max(160).nullable(),
    items: z.array(foodImageItemSchema).min(1).max(8),
  })
  .strict();

export type FoodImageResponse = z.infer<typeof foodImageResponseSchema>;

export const foodImageGeminiSchema = {
  type: 'OBJECT',
  properties: {
    overall_confidence: { type: 'STRING', enum: CONFIDENCE },
    image_quality_warning: { type: 'STRING', nullable: true },
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          estimated_grams: { type: 'NUMBER' },
          calories: { type: 'NUMBER' },
          protein: { type: 'NUMBER' },
          carbs: { type: 'NUMBER' },
          fat: { type: 'NUMBER' },
          fiber: { type: 'NUMBER' },
          confidence: { type: 'STRING', enum: CONFIDENCE },
          warning: { type: 'STRING', nullable: true },
        },
        required: [
          'name',
          'estimated_grams',
          'calories',
          'protein',
          'carbs',
          'fat',
          'fiber',
          'confidence',
          'warning',
        ],
      },
    },
  },
  required: ['overall_confidence', 'image_quality_warning', 'items'],
} as const;

export function buildFoodImagePrompt(mealContext: string): string {
  return [
    'Phân tích ảnh bữa ăn Việt Nam này.',
    `Ngữ cảnh bữa ăn: ${mealContext || 'không rõ'}.`,
    '',
    'Yêu cầu:',
    '- Nhận diện từng món/thành phần nhìn thấy được.',
    '- Ước tính gram và macro theo khẩu phần trong ảnh, không dùng per-100g.',
    '- Nếu ảnh mờ/tối/khuất, vẫn best-guess nhưng đặt confidence thấp và warning rõ.',
    '- Không phán xét người dùng. Chỉ trả JSON đúng schema.',
  ].join('\n');
}

export const FOOD_IMAGE_SYSTEM_INSTRUCTION =
  'Bạn là chuyên gia dinh dưỡng Việt Nam dùng Gemini Vision. Chỉ trả JSON đúng schema, không markdown.';
