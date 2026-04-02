import type { HealthProfile } from '../features/health-profile/types';
import { getAge } from '../features/health-profile/types';

const baseProfile: HealthProfile = {
  id: 'default',
  name: 'Test',
  gender: 'male',
  age: 30,
  dateOfBirth: null,
  heightCm: 175,
  weightKg: 70,
  activityLevel: 'moderate',
  proteinRatio: 2,
  fatPct: 0.25,
  targetCalories: 2000,
  updatedAt: '2024-01-01',
};

describe('getAge', () => {
  it('returns profile.age when dateOfBirth is null', () => {
    const age = getAge({ ...baseProfile, dateOfBirth: null, age: 30 });
    expect(age).toBe(30);
  });

  it('returns profile.age when dateOfBirth is empty string', () => {
    const age = getAge({ ...baseProfile, dateOfBirth: '', age: 45 });
    expect(age).toBe(45);
  });

  it('calculates age from dateOfBirth when provided', () => {
    const now = new Date();
    const dob = `${now.getFullYear() - 25}-01-01`;
    const age = getAge({ ...baseProfile, dateOfBirth: dob, age: 99 });
    expect(age).toBeGreaterThanOrEqual(24);
    expect(age).toBeLessThanOrEqual(25);
  });
});
