/**
 * Form infrastructure types.
 *
 * Phase B0 (current): pure manual types. No `@angular/forms/signals` import
 * because the API is still @experimental in Angular 21.
 *
 * Phase B2+ (when Signal Forms is stable): swap `FormError` for the
 * built-in `ValidationError`/`NgValidationError` and re-export
 * `FieldTree`/`FieldState` from `@angular/forms/signals`. Existing call
 * sites in feature code should not need to change.
 *
 * See `docs/5-development/signal-forms-migration-plan.md` §2 for the
 * rationale.
 */

/**
 * Manual error shape used by `<app-form-field>` until Signal Forms is
 * adopted. Designed to be a strict subset of Angular's
 * `NgValidationError` so migration is mechanical.
 */
export interface FormError {
  /** Discriminator, e.g. `'required'`, `'minLength'`, `'positive'`. */
  readonly kind: string;
  /** Vietnamese-language message ready for display. */
  readonly message: string;
}

/** Convenience helper: required field error in Vietnamese. */
export const requiredError = (message = 'Bắt buộc nhập'): FormError => ({
  kind: 'required',
  message,
});

/** Convenience helper: max-length error in Vietnamese. */
export const maxLengthError = (max: number): FormError => ({
  kind: 'maxLength',
  message: `Tối đa ${max} ký tự`,
});

/** Convenience helper: positive-number error in Vietnamese. */
export const positiveError = (message = 'Phải >= 0'): FormError => ({
  kind: 'positive',
  message,
});

/**
 * Reserved name for Phase B2 — will become `import { FieldTree } from
 * '@angular/forms/signals'`. Kept as `unknown` for now so call sites can
 * declare `field?: SignalFormField<MyShape>` without locking in the API.
 */
export type SignalFormField<_TShape> = unknown;
