/**
 * Signal Forms schema for the dish edit modal (Phase B3).
 *
 * Mirrors the validation rules previously hard-coded in
 * `DishEditModalComponent.isValid()` + `isServingsValid()`. Pure schema —
 * no DI, no template coupling — so the rules can be unit-tested in
 * isolation.
 *
 * @see docs/5-development/signal-forms-migration-plan.md §B3
 */

import { applyEach, schema, validate, type ValidationError } from '@angular/forms/signals';
import type {
  DishEditFormValue,
  DishIngredientFormItem,
} from '../../../features/management/dish-edit/dish-edit.types';

const itemSchema = schema<DishIngredientFormItem>((p) => {
  validate(p.amount_value, ({ value }) => {
    const v = value();
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
      return {
        kind: 'amountPositive',
        message: 'Số lượng phải lớn hơn 0.',
      };
    }
    return null;
  });

  validate(p.unit_id, ({ value }) => {
    if (!value().trim()) {
      return { kind: 'unitRequired', message: 'Vui lòng chọn đơn vị.' };
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
    return errors;
  });
});
