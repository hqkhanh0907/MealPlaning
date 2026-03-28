import { z } from 'zod';

export const ingredientEditSchema = z.object({
  name: z.object({
    vi: z.string().trim().min(1, { message: 'Tên nguyên liệu không được bỏ trống' }),
  }),
  unit: z.object({
    vi: z.string().trim().min(1, { message: 'Đơn vị không được bỏ trống' }),
  }),
  caloriesPer100: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number({ message: 'Vui lòng nhập số hợp lệ' }).min(0, { message: 'Giá trị không được âm' }),
  ),
  proteinPer100: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number({ message: 'Vui lòng nhập số hợp lệ' }).min(0, { message: 'Giá trị không được âm' }),
  ),
  carbsPer100: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number({ message: 'Vui lòng nhập số hợp lệ' }).min(0, { message: 'Giá trị không được âm' }),
  ),
  fatPer100: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number({ message: 'Vui lòng nhập số hợp lệ' }).min(0, { message: 'Giá trị không được âm' }),
  ),
  fiberPer100: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number({ message: 'Vui lòng nhập số hợp lệ' }).min(0, { message: 'Giá trị không được âm' }),
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
