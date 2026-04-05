import i18n from 'i18next';
import { z } from 'zod';

export const ingredientEditSchema = z.object({
  name: z.object({
    vi: z
      .string()
      .trim()
      .min(1, { error: i18n.t('validation.ingredient.nameRequired') }),
  }),
  unit: z.object({
    vi: z
      .string()
      .trim()
      .min(1, { error: i18n.t('validation.ingredient.unitRequired') }),
  }),
  caloriesPer100: z.preprocess(
    val => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z
      .number({ error: i18n.t('validation.ingredient.valueRequired') })
      .min(0, { error: i18n.t('validation.ingredient.valueNonNegative') }),
  ),
  proteinPer100: z.preprocess(
    val => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z
      .number({ error: i18n.t('validation.ingredient.valueRequired') })
      .min(0, { error: i18n.t('validation.ingredient.valueNonNegative') }),
  ),
  carbsPer100: z.preprocess(
    val => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z
      .number({ error: i18n.t('validation.ingredient.valueRequired') })
      .min(0, { error: i18n.t('validation.ingredient.valueNonNegative') }),
  ),
  fatPer100: z.preprocess(
    val => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z
      .number({ error: i18n.t('validation.ingredient.valueRequired') })
      .min(0, { error: i18n.t('validation.ingredient.valueNonNegative') }),
  ),
  fiberPer100: z.preprocess(
    val => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z
      .number({ error: i18n.t('validation.ingredient.valueRequired') })
      .min(0, { error: i18n.t('validation.ingredient.valueNonNegative') }),
  ),
});

export type IngredientEditFormData = z.infer<typeof ingredientEditSchema>;

export const ingredientEditDefaults: IngredientEditFormData = {
  name: { vi: '' },
  unit: { vi: '' },
  caloriesPer100: 0,
  proteinPer100: 0,
  carbsPer100: 0,
  fatPer100: 0,
  fiberPer100: 0,
};
