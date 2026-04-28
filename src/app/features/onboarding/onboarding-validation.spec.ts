import { validateStep2b } from './onboarding-validation';

describe('onboarding-validation (step 2b)', () => {
  it('returns no errors for valid step 2b input', () => {
    expect(
      validateStep2b({
        activityLevel: 'moderate',
        gymExperience: '6m_2y',
      }),
    ).toEqual({ activityLevel: '', gymExperience: '' });
  });

  it('returns validation errors for missing step 2b input', () => {
    expect(
      validateStep2b({
        activityLevel: null,
        gymExperience: null,
      }),
    ).toEqual({
      activityLevel: 'Vui lòng chọn mức vận động',
      gymExperience: 'Vui lòng chọn kinh nghiệm gym',
    });
  });
});
