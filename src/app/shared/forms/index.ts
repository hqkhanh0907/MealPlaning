/**
 * Form infrastructure barrel.
 *
 * NOTE (2026-04-27): Signal Forms API (`@angular/forms/signals`) is
 * @experimental in Angular 21. Production code in this directory MUST NOT
 * import from there yet. See `docs/5-development/signal-forms-migration-plan.md`.
 *
 * For now this barrel re-exports the wrapper component + manual error
 * helpers so feature code can adopt the layered architecture (Phase B1)
 * without depending on the Signal Forms API itself.
 */

export * from './types';
export * from './form-field/form-field.component';
export * as schemas from './schemas/common';
