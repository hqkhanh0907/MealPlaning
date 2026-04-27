import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { FieldTree } from '@angular/forms/signals';
import { form } from '@angular/forms/signals';
import type {
  IngredientEditFormValue,
  IngredientEditUnitFormValue,
} from '../../components/ingredient-edit-modal/ingredient-edit-modal.types';
import { ingredientFormSchema } from './ingredient-form.schema';

const baseUnit = (
  overrides: Partial<IngredientEditUnitFormValue> = {},
): IngredientEditUnitFormValue => ({
  local_id: 'u-1',
  unit_id: 'unit-g',
  factor_to_basis: 1,
  is_default: true,
  display_label: 'g',
  is_approximate: false,
  short_name_vi: 'g',
  ...overrides,
});

const baseValue = (overrides: Partial<IngredientEditFormValue> = {}): IngredientEditFormValue => ({
  name: 'Trứng gà',
  category: 'Trứng & Sữa',
  nutrition_basis_unit: 'g',
  calories: 155,
  protein: 13,
  carbs: 1,
  fat: 11,
  fiber: 0,
  density_g_per_ml: null,
  units: [baseUnit()],
  ...overrides,
});

const buildForm = (initial: IngredientEditFormValue): FieldTree<IngredientEditFormValue> => {
  return TestBed.runInInjectionContext(() => {
    const model = signal(initial);
    return form(model, ingredientFormSchema);
  });
};

const allErrorKinds = (f: FieldTree<IngredientEditFormValue>): string[] =>
  f()
    .errorSummary()
    .map((e) => e.kind);

describe('ingredientFormSchema', () => {
  it('reports no errors for a fully valid model', () => {
    const f = buildForm(baseValue());
    expect(f().valid()).toBeTrue();
    expect(f().errorSummary().length).toBe(0);
  });

  it('flags empty name as required', () => {
    const f = buildForm(baseValue({ name: '   ' }));
    expect(
      f
        .name()
        .errors()
        .some((e) => e.kind === 'required'),
    ).toBeTrue();
  });

  it('flags name longer than 100 chars as maxLength', () => {
    const f = buildForm(baseValue({ name: 'x'.repeat(101) }));
    expect(
      f
        .name()
        .errors()
        .some((e) => e.kind === 'maxLength'),
    ).toBeTrue();
  });

  it('accepts exactly 100 chars on name', () => {
    const f = buildForm(baseValue({ name: 'x'.repeat(100) }));
    expect(f.name().errors().length).toBe(0);
  });

  it('flags empty category as required', () => {
    const f = buildForm(baseValue({ category: '' }));
    expect(
      f
        .category()
        .errors()
        .some((e) => e.kind === 'required'),
    ).toBeTrue();
  });

  it('flags negative calories', () => {
    const f = buildForm(baseValue({ calories: -1 }));
    expect(
      f
        .calories()
        .errors()
        .some((e) => e.kind === 'positive'),
    ).toBeTrue();
  });

  it('allows null nutrition values (optional)', () => {
    const f = buildForm(
      baseValue({ calories: null, protein: null, carbs: null, fat: null, fiber: null }),
    );
    expect(f().valid()).toBeTrue();
  });

  it('flags empty units list', () => {
    const f = buildForm(baseValue({ units: [] }));
    expect(allErrorKinds(f)).toContain('unitsRequired');
  });

  it('flags zero default units', () => {
    const f = buildForm(
      baseValue({
        units: [baseUnit({ is_default: false })],
      }),
    );
    expect(allErrorKinds(f)).toContain('unitsDefault');
  });

  it('flags more than one default unit', () => {
    const f = buildForm(
      baseValue({
        units: [
          baseUnit({ local_id: 'u1', is_default: true }),
          baseUnit({ local_id: 'u2', unit_id: 'unit-ml', is_default: true }),
        ],
      }),
    );
    expect(allErrorKinds(f)).toContain('unitsDefault');
  });

  it('flags non-positive factor_to_basis on a unit item', () => {
    const f = buildForm(
      baseValue({
        units: [baseUnit({ factor_to_basis: 0 })],
      }),
    );
    expect(allErrorKinds(f)).toContain('unitFactorPositive');
  });
});
