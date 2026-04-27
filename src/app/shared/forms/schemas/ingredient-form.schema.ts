/**
 * Signal Forms schema for the ingredient edit modal (Phase B2).
 *
 * Mirrors the validation rules previously hard-coded in
 * `IngredientEditModalComponent.isValid()` + `unitErrors`. Pure schema —
 * no DI, no template coupling — so the rules can be unit-tested in
 * isolation.
 *
 * @see docs/5-development/signal-forms-migration-plan.md §B2
 */

import { applyEach, schema, validate, type ValidationError } from '@angular/forms/signals';
import type {
  IngredientEditFormValue,
  IngredientEditUnitFormValue,
} from '../../components/ingredient-edit-modal/ingredient-edit-modal.types';

const optionalNonNegative = (
  v: number | null,
  kindWhenNeg: string,
  msgWhenNeg: string,
): ValidationError | null => {
  if (v === null) {
    return null;
  }
  if (Number.isNaN(v)) {
    return { kind: 'invalid', message: 'Số không hợp lệ' };
  }
  if (v < 0) {
    return { kind: kindWhenNeg, message: msgWhenNeg };
  }
  return null;
};

const unitItemSchema = schema<IngredientEditUnitFormValue>((p) => {
  validate(p.factor_to_basis, ({ value }) => {
    const v = value();
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
      return {
        kind: 'unitFactorPositive',
        message: 'Mỗi đơn vị cần có quy đổi lớn hơn 0.',
      };
    }
    return null;
  });
});

export const ingredientFormSchema = schema<IngredientEditFormValue>((p) => {
  validate(p.name, ({ value }) => {
    const trimmed = value().trim();
    if (!trimmed) {
      return { kind: 'required', message: 'Vui lòng nhập tên nguyên liệu' };
    }
    if (trimmed.length > 100) {
      return { kind: 'maxLength', message: 'Tối đa 100 ký tự' };
    }
    return null;
  });

  validate(p.category, ({ value }) => {
    if (!value().trim()) {
      return { kind: 'required', message: 'Vui lòng chọn nhóm nguyên liệu' };
    }
    return null;
  });

  validate(p.calories, ({ value }) =>
    optionalNonNegative(value(), 'positive', 'Calories không được nhỏ hơn 0'),
  );
  validate(p.protein, ({ value }) =>
    optionalNonNegative(value(), 'positive', 'Protein không được nhỏ hơn 0'),
  );
  validate(p.carbs, ({ value }) =>
    optionalNonNegative(value(), 'positive', 'Carbs không được nhỏ hơn 0'),
  );
  validate(p.fat, ({ value }) =>
    optionalNonNegative(value(), 'positive', 'Fat không được nhỏ hơn 0'),
  );
  validate(p.fiber, ({ value }) =>
    optionalNonNegative(value(), 'positive', 'Chất xơ không được nhỏ hơn 0'),
  );

  applyEach(p.units, unitItemSchema);

  validate(p.units, ({ value }) => {
    const units = value();
    const errors: ValidationError[] = [];
    if (units.length === 0) {
      errors.push({
        kind: 'unitsRequired',
        message: 'Cần ít nhất 1 đơn vị hợp lệ.',
      });
    }
    if (units.length > 0 && units.filter((u) => u.is_default).length !== 1) {
      errors.push({
        kind: 'unitsDefault',
        message: 'Chọn đúng 1 đơn vị mặc định trước khi lưu.',
      });
    }
    return errors;
  });
});
