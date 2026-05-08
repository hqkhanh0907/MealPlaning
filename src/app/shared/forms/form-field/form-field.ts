import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { FormError } from '../types';

/**
 * Canonical floating-label form-field wrapper.
 *
 * Renders the `.input-wrapper` + `.input-label` markup defined by
 * `src/theme/form-field.scss` and design-system §8.6, so feature code
 * stops repeating that boilerplate per field.
 *
 * **Three error modes** (mutually exclusive — provide at most one):
 *
 * 1. **Boolean mode** — `[invalid]="showErrors && !form.name"`,
 *    `[errorMessage]="'Vui lòng nhập'"`.
 *    Fits today's `ngModel` + `computed canSave()` style.
 *
 * 2. **Error-object mode** — `[error]="nameError()"` where
 *    `nameError()` is a `Signal<FormError | null>`.
 *    Fits the schemas API in `shared/forms/schemas/common.ts`.
 *
 * 3. **Reserved for Phase B2** — `[field]="ingredientForm.name"` after
 *    Signal Forms graduates from `@experimental`. The wrapper will read
 *    `field().errors()` + `field().touched()` directly. Not implemented
 *    yet (slot kept to keep call sites stable).
 *
 * Accepts the input element via `<ng-content>` so callers retain full
 * control of `type=`, `id=`, `[(ngModel)]`, `#nameInput`, etc.
 *
 * Example:
 * ```html
 * <app-form-field
 *   label="Tên nguyên liệu"
 *   inputId="ingr-field-1"
 *   [invalid]="showErrors && !form.name.trim()"
 *   errorMessage="Vui lòng nhập tên nguyên liệu"
 * >
 *   <input id="ingr-field-1" class="input-native" [(ngModel)]="form.name" />
 * </app-form-field>
 * ```
 */
@Component({
  selector: 'app-form-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './form-field.html',
  styleUrl: './form-field.scss',
})
export class AppFormField {
  /** Visible label text. Empty string hides the label. */
  readonly label = input<string>('');

  /**
   * `for=` attribute on the label, matching the projected input's `id=`.
   * Improves a11y; pass null/empty to omit.
   */
  readonly inputId = input<string>('');

  /** Boolean-mode invalid flag. */
  readonly invalid = input<boolean>(false);

  /** Boolean-mode error text shown below the input when `invalid` is true. */
  readonly errorMessage = input<string>('');

  /**
   * Optional `id=` placed on the rendered `.field-error` div when an error
   * is shown. Lets callers reference the error from `aria-describedby` or
   * imperative scroll-to-error helpers (e.g. onboarding's
   * `focusFirstInvalidField2a()`). When set, also adds `role="alert"`.
   */
  readonly errorId = input<string>('');

  /** Error-object mode signal; takes precedence over boolean mode. */
  readonly error = input<FormError | null>(null);

  protected readonly isInvalid = computed(() => this.error() !== null || this.invalid());

  protected readonly resolvedMessage = computed(() => {
    const e = this.error();
    if (e) {
      return e.message;
    }
    return this.errorMessage();
  });
}
