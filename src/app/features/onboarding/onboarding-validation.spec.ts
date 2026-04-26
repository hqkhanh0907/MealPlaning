import {
  validateStep2a,
  validateStep2b,
} from './onboarding-validation';

describe('onboarding-validation', () => {
  it('returns no errors for valid step 2a input', () => {
    expect(
      validateStep2a({
        heightCm: 170,
        weightKg: 65,
        age: 30,
        gender: 'male',
      }),
    ).toEqual({ heightCm: '', weightKg: '', age: '', gender: '' });
  });

  it('returns validation errors for out-of-range step 2a input', () => {
    expect(
      validateStep2a({
        heightCm: 120,
        weightKg: 20,
        age: 10,
        gender: null,
      }),
    ).toEqual({
      heightCm: 'Chiều cao phải từ 130–250 cm',
      weightKg: 'Cân nặng phải từ 30–200 kg',
      age: 'Tuổi phải từ 13–120',
      gender: 'Vui lòng chọn giới tính',
    });
  });

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
