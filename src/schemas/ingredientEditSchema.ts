import { z } from 'zod';

export const ingredientEditSchema = z.object({
  name: z.object({
    vi: z.string().trim().min(1, { error: 'Vui lòng nhập tên nguyên liệu' }),
  }),
  unit: z.object({
    vi: z.string().trim().min(1, { error: 'Vui lòng nhập đơn vị tính' }),
  }),
  caloriesPer100: z.preprocess(
    val => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number({ error: 'Vui lòng nhập giá trị' }).min(0, { error: 'Giá trị không được âm' }),
  ),
  proteinPer100: z.preprocess(
    val => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number({ error: 'Vui lòng nhập giá trị' }).min(0, { error: 'Giá trị không được âm' }),
  ),
  carbsPer100: z.preprocess(
    val => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number({ error: 'Vui lòng nhập giá trị' }).min(0, { error: 'Giá trị không được âm' }),
  ),
  fatPer100: z.preprocess(
    val => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number({ error: 'Vui lòng nhập giá trị' }).min(0, { error: 'Giá trị không được âm' }),
  ),
  fiberPer100: z.preprocess(
    val => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number({ error: 'Vui lòng nhập giá trị' }).min(0, { error: 'Giá trị không được âm' }),
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
