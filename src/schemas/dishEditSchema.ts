import { z } from 'zod';

/* ── MealType values (single source of truth from types.ts) ── */

const MEAL_TYPE_VALUES = ['breakfast', 'lunch', 'dinner'] as const;

/* ── Quick-Add Ingredient Sub-Schema ── */

export const quickAddIngredientSchema = z.object({
  qaName: z.string().min(1, 'Ingredient name is required'),
  qaUnit: z.object({
    vi: z.string().min(1, 'Unit (vi) is required'),
    en: z.string().optional(),
  }),
  qaCal: z.coerce.number().min(0),
  qaProtein: z.coerce.number().min(0),
  qaCarbs: z.coerce.number().min(0),
  qaFat: z.coerce.number().min(0),
  qaFiber: z.coerce.number().min(0),
});

export type QuickAddIngredientData = z.infer<typeof quickAddIngredientSchema>;

export const quickAddIngredientDefaults: QuickAddIngredientData = {
  qaName: '',
  qaUnit: { vi: 'g' },
  qaCal: 0,
  qaProtein: 0,
  qaCarbs: 0,
  qaFat: 0,
  qaFiber: 0,
};

/* ── Dish Ingredient (ingredientId + amount) ── */

const dishIngredientSchema = z.object({
  ingredientId: z.string().min(1),
  amount: z.coerce.number({ error: 'dish.validationAmountRequired' }).min(1, 'dish.validationAmountNegative'),
});

/* ── Main Dish Edit Schema ── */

export const dishEditSchema = z.object({
  name: z.string().min(1, 'Dish name is required'),
  tags: z.array(z.enum(MEAL_TYPE_VALUES)).min(1, 'Select at least one meal tag'),
  rating: z.number().min(0).max(5),
  notes: z.string().optional(),
  ingredients: z
    .array(dishIngredientSchema)
    .min(1, 'At least one ingredient is required'),
});

export type DishEditFormData = z.infer<typeof dishEditSchema>;

export const dishEditDefaults: DishEditFormData = {
  name: '',
  tags: [],
  rating: 0,
  notes: '',
  ingredients: [],
};
