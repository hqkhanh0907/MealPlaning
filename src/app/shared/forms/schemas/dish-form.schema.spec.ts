import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { FieldTree } from '@angular/forms/signals';
import { form } from '@angular/forms/signals';
import type {
  DishEditFormValue,
  DishIngredientFormItem,
} from '../../../features/management/dish-edit/dish-edit.types';
import { dishFormSchema } from './dish-form.schema';

const baseItem = (overrides: Partial<DishIngredientFormItem> = {}): DishIngredientFormItem => ({
  local_id: 'i-1',
  ingredient_id: 'ing-1',
  amount_value: 100,
  unit_id: 'unit-g',
  ...overrides,
});

const baseValue = (overrides: Partial<DishEditFormValue> = {}): DishEditFormValue => ({
  name: 'Cơm gà',
  description: '',
  servings: 2,
  items: [baseItem()],
  ...overrides,
});

const buildForm = (initial: DishEditFormValue): FieldTree<DishEditFormValue> => {
  return TestBed.runInInjectionContext(() => {
    const model = signal(initial);
    return form(model, dishFormSchema);
  });
};

const allErrorKinds = (f: FieldTree<DishEditFormValue>): string[] =>
  f()
    .errorSummary()
    .map((e) => e.kind);

describe('dishFormSchema', () => {
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

  it('flags servings null as out-of-range', () => {
    const f = buildForm(baseValue({ servings: null }));
    expect(
      f
        .servings()
        .errors()
        .some((e) => e.kind === 'servingsRange'),
    ).toBeTrue();
  });

  it('flags servings below 0.5', () => {
    const f = buildForm(baseValue({ servings: 0.4 }));
    expect(
      f
        .servings()
        .errors()
        .some((e) => e.kind === 'servingsRange'),
    ).toBeTrue();
  });

  it('flags servings above 20', () => {
    const f = buildForm(baseValue({ servings: 20.1 }));
    expect(
      f
        .servings()
        .errors()
        .some((e) => e.kind === 'servingsRange'),
    ).toBeTrue();
  });

  it('accepts boundary values 0.5 and 20', () => {
    expect(
      buildForm(baseValue({ servings: 0.5 }))
        .servings()
        .errors().length,
    ).toBe(0);
    expect(
      buildForm(baseValue({ servings: 20 }))
        .servings()
        .errors().length,
    ).toBe(0);
  });

  it('flags empty items list', () => {
    const f = buildForm(baseValue({ items: [] }));
    expect(allErrorKinds(f)).toContain('itemsRequired');
  });

  it('flags zero or negative amount_value on an item', () => {
    const f = buildForm(baseValue({ items: [baseItem({ amount_value: 0 })] }));
    expect(allErrorKinds(f)).toContain('amountPositive');
  });

  it('flags missing unit_id on an item', () => {
    const f = buildForm(baseValue({ items: [baseItem({ unit_id: '   ' })] }));
    expect(allErrorKinds(f)).toContain('unitRequired');
  });
});
