/**
 * Reusable form-field validators.
 *
 * Phase B0: pure functions returning `FormError | null`. Used by feature
 * code via `computed()` checks today.
 *
 * Phase B2: each will be wrapped into a `schema()` + `validate()` block
 * from `@angular/forms/signals`. The pure-function core is reusable as-is
 * inside the validate callback.
 *
 * Convention: validators take the value, return `FormError` on failure,
 * `null` on success. Keep them framework-free for trivial unit testing.
 */

import { type FormError, maxLengthError, positiveError, requiredError } from '../types';

/**
 * Required Vietnamese label, max 100 chars (matches DB `name` columns).
 */
export const validateVnName = (raw: string): FormError | null => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return requiredError();
  }
  if (trimmed.length > 100) {
    return maxLengthError(100);
  }
  return null;
};

/**
 * Optional non-negative number. `null` = empty input, treated as valid.
 */
export const validateOptionalNonNegative = (v: number | null): FormError | null => {
  if (v === null) {
    return null;
  }
  if (Number.isNaN(v)) {
    return { kind: 'invalid', message: 'Số không hợp lệ' };
  }
  if (v < 0) {
    return positiveError();
  }
  return null;
};

/**
 * Required positive number (> 0). Used for unit factors, servings, etc.
 */
export const validateRequiredPositive = (v: number | null): FormError | null => {
  if (v === null || Number.isNaN(v)) {
    return requiredError('Bắt buộc nhập số');
  }
  if (v <= 0) {
    return { kind: 'positive', message: 'Phải > 0' };
  }
  return null;
};
