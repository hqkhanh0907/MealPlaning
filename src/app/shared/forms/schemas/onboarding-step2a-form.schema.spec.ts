import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { FieldTree } from '@angular/forms/signals';
import { form } from '@angular/forms/signals';
import type { BodyMeasurementsDraft } from '../../../core/models/body-measurements';
import { onboardingStep2aSchema } from './onboarding-step2a-form.schema';

const baseValue = (overrides: Partial<BodyMeasurementsDraft> = {}): BodyMeasurementsDraft => ({
  heightCm: 170,
  weightKg: 65,
  birthDate: '1996-01-01',
  gender: 'male',
  ...overrides,
});

const buildForm = (initial: BodyMeasurementsDraft): FieldTree<BodyMeasurementsDraft> => {
  return TestBed.runInInjectionContext(() => {
    const model = signal(initial);
    return form(
      model,
      onboardingStep2aSchema(() => new Date()),
    );
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

  it('flags heightCm below 100', () => {
    const f = buildForm(baseValue({ heightCm: 99 }));
    expect(f.heightCm().errors()[0]?.message).toBe('Chiều cao cần từ 100 đến 250 cm.');
  });

  it('flags heightCm above 250', () => {
    const f = buildForm(baseValue({ heightCm: 251 }));
    expect(f.heightCm().errors()[0]?.message).toBe('Chiều cao cần từ 100 đến 250 cm.');
  });

  it('accepts boundary values 100 and 250', () => {
    expect(
      buildForm(baseValue({ heightCm: 100 }))
        .heightCm()
        .errors().length,
    ).toBe(0);
    expect(
      buildForm(baseValue({ heightCm: 250 }))
        .heightCm()
        .errors().length,
    ).toBe(0);
  });

  it('flags weightKg out of 30-300 range', () => {
    expect(
      buildForm(baseValue({ weightKg: 29 }))
        .weightKg()
        .errors()
        .some((e) => e.kind === 'range'),
    ).toBeTrue();
    expect(
      buildForm(baseValue({ weightKg: 301 }))
        .weightKg()
        .errors()
        .some((e) => e.kind === 'range'),
    ).toBeTrue();
  });

  it('flags age out of 10-120 range', () => {
    expect(
      buildForm(baseValue({ birthDate: `${new Date().getFullYear() - 9}-01-01` }))
        .birthDate()
        .errors()
        .some((e) => e.kind === 'date'),
    ).toBeTrue();
    expect(
      buildForm(baseValue({ birthDate: `${new Date().getFullYear() - 121}-01-01` }))
        .birthDate()
        .errors()
        .some((e) => e.kind === 'date'),
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
