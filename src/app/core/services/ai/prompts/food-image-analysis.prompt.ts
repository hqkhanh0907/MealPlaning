import { z } from 'zod';
import { MAX_PHOTO_GRAMS, MAX_PHOTO_NAME_LENGTH } from '../../../models/photo-meal';

const CONFIDENCE = ['high', 'medium', 'low'] as const;

export const foodImageItemSchema = z
  .object({
    name: z.string().trim().min(1).max(MAX_PHOTO_NAME_LENGTH),
    estimated_grams: z.number().min(1).max(MAX_PHOTO_GRAMS),
    calories: z.number().min(0).max(3000),
    protein: z.number().min(0).max(300),
    carbs: z.number().min(0).max(500),
    fat: z.number().min(0).max(300),
    fiber: z.number().min(0).max(100),
    confidence: z.enum(CONFIDENCE),
    warning: z.string().nullable(),
  })
  .strict();

export const foodImageResponseSchema = z
  .object({
    overall_confidence: z.enum(CONFIDENCE),
    image_quality_warning: z.string().nullable(),
    items: z.array(foodImageItemSchema).max(8),
  })
  .strict();

export type FoodImageResponse = z.infer<typeof foodImageResponseSchema>;

export function buildFoodImagePrompt(mealContext: string): string {
  return [
    'Phân tích ảnh bữa ăn. Viết tên món và cảnh báo bằng tiếng Việt.',
    `Ngữ cảnh: ${mealContext || 'không rõ'}.`,
    'Nhận diện tối đa tám món. Ước tính khối lượng và dinh dưỡng cho khẩu phần trong ảnh.',
    'Không tính một thành phần hai lần. Nếu không thấy món ăn, trả items rỗng.',
    'Trả về JSON gồm overall_confidence, image_quality_warning và items.',
    'Mỗi món gồm name, estimated_grams, calories (kcal), protein, carbs, fat, fiber (gram), confidence và warning.',
    'Dùng số cho khối lượng và dinh dưỡng. Confidence dùng high, medium hoặc low.',
    'Khi ảnh mờ hoặc thiếu căn cứ, giảm độ tin cậy và nêu lý do. Nếu không cần cảnh báo, dùng null.',
  ].join('\n');
}
