import { z } from 'zod';

/* ── MealType values (single source of truth from types.ts) ── */

const MEAL_TYPE_VALUES = ['breakfast', 'lunch', 'dinner'] as const;

/* ── Nutrition per standard unit (calories, protein, carbs, fat, fiber) ── */

const analyzedNutritionSchema = z.object({
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fat: z.coerce.number().min(0),
  fiber: z.coerce.number().min(0),
});

/* ── Single ingredient row ── */

export const ingredientNutritionSchema = z.object({
  name: z.string().min(1),
  amount: z.coerce.number().min(0),
  unit: z.string().min(1),
  nutritionPerStandardUnit: analyzedNutritionSchema,
});

/* ── Full form schema ── */

export const saveAnalyzedDishSchema = z
  .object({
    name: z.string().min(1),
    description: z.string(),
    saveDish: z.boolean(),
    dishTags: z.array(z.enum(MEAL_TYPE_VALUES)),
    ingredients: z.array(ingredientNutritionSchema).min(1),
  })
  .refine(data => !data.saveDish || data.dishTags.length > 0, {
    error: 'At least one meal tag is required when saving dish',
    path: ['dishTags'],
  });

export type SaveAnalyzedDishFormData = z.infer<typeof saveAnalyzedDishSchema>;

export const saveAnalyzedDishDefaults: SaveAnalyzedDishFormData = {
  name: '',
  description: '',
  saveDish: true,
  dishTags: [],
  ingredients: [
    {
      name: '',
      amount: 0,
      unit: 'g',
      nutritionPerStandardUnit: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    },
  ],
};
