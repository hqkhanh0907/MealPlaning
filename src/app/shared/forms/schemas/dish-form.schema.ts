/**
 * Signal Forms schema for the dish edit page — gram-only (schema v6).
 *
 * Each ingredient row is (ingredient_id, gram_weight); there is no unit
 * picker anymore. Validation kinds:
 *   - required, maxLength            (name)
 *   - servingsRange                  (servings)
 *   - itemsRequired                  (items array)
 *   - gramPositive                   (per item.gram_weight)
 *   - ingredientRequired             (per item.ingredient_id)
 */

import { applyEach, schema, validate, type ValidationError } from '@angular/forms/signals';
import type {
  DishEditFormValue,
  DishIngredientFormItem,
} from '../../../features/management/dish-edit/dish-edit.types';

const itemSchema = schema<DishIngredientFormItem>((p) => {
  validate(p.gram_weight, ({ value }) => {
    const v = value();
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
      return {
        kind: 'gramPositive',
        message: 'Trọng lượng (g) phải lớn hơn 0.',
      };
    }
    if (v > 5000) {
      return {
        kind: 'gramTooHigh',
        message: 'Trọng lượng (g) không được vượt 5000 g.',
      };
    }
    return null;
  });

  validate(p.ingredient_id, ({ value }) => {
    if (!value().trim()) {
      return { kind: 'ingredientRequired', message: 'Vui lòng chọn nguyên liệu.' };
    }
    return null;
  });
});

export const dishFormSchema = schema<DishEditFormValue>((p) => {
  validate(p.name, ({ value }) => {
    const trimmed = value().trim();
    if (!trimmed) {
      return { kind: 'required', message: 'Vui lòng nhập tên món ăn' };
    }
    if (trimmed.length > 100) {
      return { kind: 'maxLength', message: 'Tối đa 100 ký tự' };
    }
    return null;
  });

  validate(p.servings, ({ value }) => {
    const v = value();
    if (v === null || v === undefined || Number.isNaN(v)) {
      return {
        kind: 'servingsRange',
        message: 'Số phần ăn cần nằm trong khoảng 0.5 đến 20.',
      };
    }
    if (v < 0.5 || v > 20) {
      return {
        kind: 'servingsRange',
        message: 'Số phần ăn cần nằm trong khoảng 0.5 đến 20.',
      };
    }
    return null;
  });

  applyEach(p.items, itemSchema);

  validate(p.items, ({ value }) => {
    const items = value();
    const errors: ValidationError[] = [];
    if (items.length === 0) {
      errors.push({
        kind: 'itemsRequired',
        message: 'Cần ít nhất 1 nguyên liệu trước khi lưu món ăn.',
      });
    }
    if (items.length > 30) {
      errors.push({
        kind: 'itemsTooMany',
        message: 'Một món ăn tối đa 30 nguyên liệu.',
      });
    }
    return errors;
  });
});
