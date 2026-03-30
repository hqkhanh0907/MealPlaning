import { renderHook, act } from '@testing-library/react';
import { useNutritionTargets } from '../features/health-profile/hooks/useNutritionTargets';
import { useHealthProfileStore } from '../features/health-profile/store/healthProfileStore';
import { DEFAULT_HEALTH_PROFILE } from '../features/health-profile/types';
import type { HealthProfile, Goal } from '../features/health-profile/types';
import {
  calculateBMR,
  calculateTDEE,
  calculateTarget,
  calculateMacros,
} from '../services/nutritionEngine';

describe('useNutritionTargets', () => {
  beforeEach(() => {
    // Reset stores to defaults
    useHealthProfileStore.setState({
      profile: { ...DEFAULT_HEALTH_PROFILE },
      activeGoal: null,
      loading: false,
    });
  });

  it('falls back to default health profile values when no health profile is configured', () => {
    const { result } = renderHook(() => useNutritionTargets());

    // DEFAULT_HEALTH_PROFILE: weightKg=70, proteinRatio=2.0, targetCalories=1500
    expect(result.current.targetCalories).toBe(1500);
    expect(result.current.targetProtein).toBe(Math.round(70 * 2));
    expect(result.current.bmr).toBe(0);
    expect(result.current.tdee).toBe(0);
    expect(result.current.targetFat).toBe(0);
    expect(result.current.targetCarbs).toBe(0);
  });

  it('returns computed targets when health profile is configured', () => {
    const customProfile: HealthProfile = {
      id: 'default',
      name: '',
      gender: 'male',
      age: 25,
      dateOfBirth: null,
      heightCm: 180,
      weightKg: 80,
      activityLevel: 'active',
      proteinRatio: 2.2,
      fatPct: 0.25,
      targetCalories: 0,
      updatedAt: new Date().toISOString(),
    };
    useHealthProfileStore.setState({ profile: customProfile });

    const { result } = renderHook(() => useNutritionTargets());

    const expectedBMR = calculateBMR(80, 180, 25, 'male');
    const expectedTDEE = calculateTDEE(expectedBMR, 'active');
    const expectedTarget = calculateTarget(expectedTDEE, 0);
    const expectedMacros = calculateMacros(expectedTarget, 80, 2.2, 0.25);

    expect(result.current.bmr).toBe(expectedBMR);
    expect(result.current.tdee).toBe(expectedTDEE);
    expect(result.current.targetCalories).toBe(expectedTarget);
    expect(result.current.targetProtein).toBe(expectedMacros.proteinG);
    expect(result.current.targetFat).toBe(expectedMacros.fatG);
    expect(result.current.targetCarbs).toBe(expectedMacros.carbsG);
  });

  it('recalculates when profile changes', () => {
    const profileA: HealthProfile = {
      id: 'default',
      name: '',
      gender: 'female',
      age: 28,
      dateOfBirth: null,
      heightCm: 165,
      weightKg: 60,
      activityLevel: 'light',
      proteinRatio: 1.8,
      fatPct: 0.3,
      targetCalories: 0,
      updatedAt: new Date().toISOString(),
    };
    useHealthProfileStore.setState({ profile: profileA });

    const { result } = renderHook(() => useNutritionTargets());
    const firstCalories = result.current.targetCalories;

    const profileB: HealthProfile = {
      ...profileA,
      weightKg: 70,
      activityLevel: 'active',
    };

    act(() => {
      useHealthProfileStore.setState({ profile: profileB });
    });

    expect(result.current.targetCalories).not.toBe(firstCalories);

    const expectedBMR = calculateBMR(70, 165, 28, 'female');
    const expectedTDEE = calculateTDEE(expectedBMR, 'active');
    expect(result.current.targetCalories).toBe(calculateTarget(expectedTDEE, 0));
  });

  it('includes active goal offset in target', () => {
    const customProfile: HealthProfile = {
      id: 'default',
      name: '',
      gender: 'male',
      age: 30,
      dateOfBirth: null,
      heightCm: 175,
      weightKg: 85,
      activityLevel: 'moderate',
      proteinRatio: 2.0,
      fatPct: 0.25,
      targetCalories: 0,
      updatedAt: new Date().toISOString(),
    };

    const cuttingGoal: Goal = {
      id: 'g1',
      type: 'cut',
      rateOfChange: 'moderate',
      calorieOffset: -550,
      startDate: '2024-01-01',
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    useHealthProfileStore.setState({
      profile: customProfile,
      activeGoal: cuttingGoal,
    });

    const { result } = renderHook(() => useNutritionTargets());

    const expectedBMR = calculateBMR(85, 175, 30, 'male');
    const expectedTDEE = calculateTDEE(expectedBMR, 'moderate');
    const expectedTarget = calculateTarget(expectedTDEE, -550);

    expect(result.current.targetCalories).toBe(expectedTarget);
    expect(result.current.targetCalories).toBeLessThan(expectedTDEE);
  });

  it('returns correct macro split', () => {
    const customProfile: HealthProfile = {
      id: 'default',
      name: '',
      gender: 'male',
      age: 25,
      dateOfBirth: null,
      heightCm: 180,
      weightKg: 80,
      activityLevel: 'active',
      proteinRatio: 2.0,
      fatPct: 0.25,
      bodyFatPct: 15,
      targetCalories: 0,
      updatedAt: new Date().toISOString(),
    };
    useHealthProfileStore.setState({ profile: customProfile });

    const { result } = renderHook(() => useNutritionTargets());

    const expectedBMR = calculateBMR(80, 180, 25, 'male');
    const expectedTDEE = calculateTDEE(expectedBMR, 'active');
    const expectedTarget = calculateTarget(expectedTDEE, 0);
    const expectedMacros = calculateMacros(expectedTarget, 80, 2.0, 0.25, 0.15);

    expect(result.current.targetProtein).toBe(expectedMacros.proteinG);
    expect(result.current.targetFat).toBe(expectedMacros.fatG);
    expect(result.current.targetCarbs).toBe(expectedMacros.carbsG);

    // With bodyFatPct=0.15, LBM = 80*(1-0.15) = 68kg, protein = 68*2 = 136g
    expect(result.current.targetProtein).toBe(136);
  });
});
