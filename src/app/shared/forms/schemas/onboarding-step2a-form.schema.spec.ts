import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { FieldTree } from '@angular/forms/signals';
import { form } from '@angular/forms/signals';
import type { OnboardingStep2aFormValue } from '../../../features/onboarding/onboarding-form.types';
import { onboardingStep2aSchema } from './onboarding-step2a-form.schema';

const baseValue = (
  overrides: Partial<OnboardingStep2aFormValue> = {},
): OnboardingStep2aFormValue => ({
  heightCm: 170,
  weightKg: 65,
  age: 30,
  gender: 'male',
  ...overrides,
});

const buildForm = (initial: OnboardingStep2aFormValue): FieldTree<OnboardingStep2aFormValue> => {
  return TestBed.runInInjectionContext(() => {
    const model = signal(initial);
    return form(model, onboardingStep2aSchema);
  });
};

describe('onboardingStep2aSchema', () => {
  it('reports no errors for a fully valid model', () => {
    const f = buildForm(baseValue());
    expect(f().valid()).toBeTrue();
    expect(f().errorSummary().length).toBe(0);
  });

  it('flags null heightCm as range error', () => {
    const f = buildForm(baseValue({ heightCm: null }));
    expect(
      f
        .heightCm()
        .errors()
        .some((e) => e.kind === 'range'),
    ).toBeTrue();
  });

  it('flags heightCm below 130', () => {
    const f = buildForm(baseValue({ heightCm: 129 }));
    expect(f.heightCm().errors()[0]?.message).toBe('Chiều cao phải từ 130–250 cm');
  });

  it('flags heightCm above 250', () => {
    const f = buildForm(baseValue({ heightCm: 251 }));
    expect(f.heightCm().errors()[0]?.message).toBe('Chiều cao phải từ 130–250 cm');
  });

  it('accepts boundary values 130 and 250', () => {
    expect(
      buildForm(baseValue({ heightCm: 130 }))
        .heightCm()
        .errors().length,
    ).toBe(0);
    expect(
      buildForm(baseValue({ heightCm: 250 }))
        .heightCm()
        .errors().length,
    ).toBe(0);
  });

  it('flags weightKg out of 30-200 range', () => {
    expect(
      buildForm(baseValue({ weightKg: 29 }))
        .weightKg()
        .errors()
        .some((e) => e.kind === 'range'),
    ).toBeTrue();
    expect(
      buildForm(baseValue({ weightKg: 201 }))
        .weightKg()
        .errors()
        .some((e) => e.kind === 'range'),
    ).toBeTrue();
  });

  it('flags age out of 13-120 range', () => {
    expect(
      buildForm(baseValue({ age: 12 }))
        .age()
        .errors()
        .some((e) => e.kind === 'range'),
    ).toBeTrue();
    expect(
      buildForm(baseValue({ age: 121 }))
        .age()
        .errors()
        .some((e) => e.kind === 'range'),
    ).toBeTrue();
  });

  it('flags null gender as required', () => {
    const f = buildForm(baseValue({ gender: null }));
    expect(
      f
        .gender()
        .errors()
        .some((e) => e.kind === 'required'),
    ).toBeTrue();
  });
});
