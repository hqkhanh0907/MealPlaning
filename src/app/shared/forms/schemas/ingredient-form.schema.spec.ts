import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { FieldTree } from '@angular/forms/signals';
import { form } from '@angular/forms/signals';
import type { IngredientEditFormValue } from '../../../features/management/ingredient-edit/ingredient-edit.types';
import { ingredientFormSchema } from './ingredient-form.schema';

const baseValue = (overrides: Partial<IngredientEditFormValue> = {}): IngredientEditFormValue => ({
  name: 'Trứng gà',
  category: 'Trứng & Sữa',
  calories: 155,
  protein: 13,
  carbs: 1,
  fat: 11,
  fiber: 0,
  ...overrides,
});

const buildForm = (initial: IngredientEditFormValue): FieldTree<IngredientEditFormValue> =>
  TestBed.runInInjectionContext(() => {
    const model = signal(initial);
    return form(model, ingredientFormSchema);
  });

const allErrorKinds = (f: FieldTree<IngredientEditFormValue>): string[] =>
  f()
    .errorSummary()
    .map((e) => e.kind);

describe('ingredientFormSchema (gram-only)', () => {
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

  it('flags negative protein', () => {
    const f = buildForm(baseValue({ protein: -0.5 }));
    expect(
      f
        .protein()
        .errors()
        .some((e) => e.kind === 'positive'),
    ).toBeTrue();
  });

  it('flags negative carbs', () => {
    const f = buildForm(baseValue({ carbs: -0.5 }));
    expect(
      f
        .carbs()
        .errors()
        .some((e) => e.kind === 'positive'),
    ).toBeTrue();
  });

  it('flags negative fat', () => {
    const f = buildForm(baseValue({ fat: -0.5 }));
    expect(
      f
        .fat()
        .errors()
        .some((e) => e.kind === 'positive'),
    ).toBeTrue();
  });

  it('flags negative fiber', () => {
    const f = buildForm(baseValue({ fiber: -0.5 }));
    expect(
      f
        .fiber()
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

  it('flags macroOver100 when protein + carbs + fat > 100', () => {
    const f = buildForm(baseValue({ protein: 40, carbs: 40, fat: 30 }));
    expect(allErrorKinds(f)).toContain('macroOver100');
  });

  it('does not flag macroOver100 when sum equals 100 exactly', () => {
    const f = buildForm(baseValue({ protein: 30, carbs: 40, fat: 30 }));
    expect(allErrorKinds(f)).not.toContain('macroOver100');
  });

  it('flags calories over 1000 kcal/100g as tooHigh', () => {
    const f = buildForm(baseValue({ calories: 1001 }));
    expect(
      f
        .calories()
        .errors()
        .some((e) => e.kind === 'tooHigh'),
    ).toBeTrue();
  });

  it('allows calories at the 1000 kcal/100g ceiling', () => {
    const f = buildForm(baseValue({ calories: 1000, protein: 0, carbs: 0, fat: 0 }));
    expect(
      f
        .calories()
        .errors()
        .some((e) => e.kind === 'tooHigh'),
    ).toBeFalse();
  });

  it('flags protein over 100 g/100g as tooHigh', () => {
    const f = buildForm(baseValue({ protein: 101, carbs: 0, fat: 0 }));
    expect(
      f
        .protein()
        .errors()
        .some((e) => e.kind === 'tooHigh'),
    ).toBeTrue();
  });

  it('flags carbs over 100 g/100g as tooHigh', () => {
    const f = buildForm(baseValue({ protein: 0, carbs: 101, fat: 0 }));
    expect(
      f
        .carbs()
        .errors()
        .some((e) => e.kind === 'tooHigh'),
    ).toBeTrue();
  });

  it('flags fat over 100 g/100g as tooHigh', () => {
    const f = buildForm(baseValue({ protein: 0, carbs: 0, fat: 101 }));
    expect(
      f
        .fat()
        .errors()
        .some((e) => e.kind === 'tooHigh'),
    ).toBeTrue();
  });

  it('flags fiber over 100 g/100g as tooHigh', () => {
    const f = buildForm(baseValue({ fiber: 101 }));
    expect(
      f
        .fiber()
        .errors()
        .some((e) => e.kind === 'tooHigh'),
    ).toBeTrue();
  });
});
