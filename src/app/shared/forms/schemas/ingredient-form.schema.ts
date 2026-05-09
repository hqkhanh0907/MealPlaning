/**
 * Signal Forms schema for the ingredient edit page — gram-only (schema v6).
 *
 * Pure schema (không DI, không template coupling) để rule có thể unit-test
 * độc lập. Tất cả nutrition đều per-100g.
 *
 * Validation rules:
 *  - name: required, trim, ≤ 100 ký tự
 *  - category: required (non-empty trim)
 *  - calories/protein/carbs/fat/fiber: optional, nếu nhập phải finite & ≥ 0
 *  - cross-field: protein + carbs + fat ≤ 100 (per-100g sanity check)
 *
 * @see docs/3-design/design-system.md §8.6 Form Field Pattern (mockup phase-1 đã xoá 2026-05-09 — code là source of truth)
 */

import { schema, validate, type ValidationError } from '@angular/forms/signals';
import type { IngredientEditFormValue } from '../../../features/management/ingredient-edit/ingredient-edit.types';

const optionalNonNegative = (
  v: number | null,
  kindWhenNeg: string,
  msgWhenNeg: string,
): ValidationError | null => {
  if (v === null) {
    return null;
  }
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    return { kind: 'invalid', message: 'Số không hợp lệ' };
  }
  if (v < 0) {
    return { kind: kindWhenNeg, message: msgWhenNeg };
  }
  return null;
};

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
    optionalNonNegative(value(), 'positive', 'Fiber không được nhỏ hơn 0'),
  );

  // Cross-field sanity check: protein + carbs + fat ≤ 100 g per 100 g.
  // Surface via the calories field path so the template can display it
  // alongside the macro inputs.
  validate(p.calories, ({ valueOf }) => {
    const protein = valueOf(p.protein) ?? 0;
    const carbs = valueOf(p.carbs) ?? 0;
    const fat = valueOf(p.fat) ?? 0;
    if (protein < 0 || carbs < 0 || fat < 0) {
      return null;
    }
    if (protein + carbs + fat > 100) {
      return {
        kind: 'macroOver100',
        message: 'Protein + Carbs + Fat trên 100 g không được vượt 100 g.',
      };
    }
    return null;
  });
});
