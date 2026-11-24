import { bodyMeasurementError, isProfileGender } from './body-measurements';

describe('body measurement inputs', () => {
  it('keeps accepted centimetres, kilograms and whole years at their limits', () => {
    for (const value of [100, 129, 170.5, 250])
      expect(bodyMeasurementError('heightCm', value)).toBeNull();
    for (const value of [30, 65.2, 201, 300])
      expect(bodyMeasurementError('weightKg', value)).toBeNull();
    for (const value of [10, 12, 18, 120]) expect(bodyMeasurementError('age', value)).toBeNull();
  });

  it('rejects blank and nonfinite measurements, decimal ages and unknown sex values', () => {
    for (const field of ['heightCm', 'weightKg', 'age'] as const) {
      for (const value of [null, undefined, '', '25', NaN, Infinity, -Infinity]) {
        expect(bodyMeasurementError(field, value)).withContext(field).not.toBeNull();
      }
    }
    expect(bodyMeasurementError('age', 30.5)).not.toBeNull();
    expect(isProfileGender('male')).toBeTrue();
    expect(isProfileGender('female')).toBeTrue();
    for (const value of ['', null, 'other']) expect(isProfileGender(value)).toBeFalse();
  });
});
