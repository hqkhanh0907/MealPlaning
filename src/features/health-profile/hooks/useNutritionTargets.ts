import { useMemo } from 'react';
import { useHealthProfileStore } from '../store/healthProfileStore';
import { useUserProfileStore } from '../../../store/userProfileStore';
import { DEFAULT_HEALTH_PROFILE } from '../types';
import {
  calculateBMR,
  calculateTDEE,
  calculateTarget,
  calculateMacros,
} from '../../../services/nutritionEngine';

export interface NutritionTargets {
  targetCalories: number;
  targetProtein: number;
  targetFat: number;
  targetCarbs: number;
  bmr: number;
  tdee: number;
}

/**
 * Detect whether the health profile has been customised by the user.
 * A profile that still matches every DEFAULT_HEALTH_PROFILE field
 * (except the volatile `updatedAt`) is considered "not set up".
 */
function isProfileConfigured(profile: typeof DEFAULT_HEALTH_PROFILE): boolean {
  return (
    profile.gender !== DEFAULT_HEALTH_PROFILE.gender ||
    profile.age !== DEFAULT_HEALTH_PROFILE.age ||
    profile.heightCm !== DEFAULT_HEALTH_PROFILE.heightCm ||
    profile.weightKg !== DEFAULT_HEALTH_PROFILE.weightKg ||
    profile.activityLevel !== DEFAULT_HEALTH_PROFILE.activityLevel ||
    profile.proteinRatio !== DEFAULT_HEALTH_PROFILE.proteinRatio ||
    profile.fatPct !== DEFAULT_HEALTH_PROFILE.fatPct ||
    profile.id !== DEFAULT_HEALTH_PROFILE.id
  );
}

/**
 * Computes personalised nutrition targets.
 *
 * Priority:
 *  1. If the user has customised their HealthProfile → full engine calculation
 *  2. Otherwise → fall back to the legacy `userProfileStore.targetCalories`
 */
export function useNutritionTargets(): NutritionTargets {
  const healthProfile = useHealthProfileStore((s) => s.profile);
  const activeGoal = useHealthProfileStore((s) => s.activeGoal);
  const userProfile = useUserProfileStore((s) => s.userProfile);

  return useMemo(() => {
    const configured = isProfileConfigured(healthProfile);

    if (!configured) {
      // Legacy fallback: derive protein from weight × ratio, keep old targetCalories
      const fallbackProtein = Math.round(
        userProfile.weight * userProfile.proteinRatio,
      );
      return {
        targetCalories: userProfile.targetCalories,
        targetProtein: fallbackProtein,
        targetFat: 0,
        targetCarbs: 0,
        bmr: 0,
        tdee: 0,
      };
    }

    // Full calculation via nutritionEngine
    const bmr = calculateBMR(
      healthProfile.weightKg,
      healthProfile.heightCm,
      healthProfile.age,
      healthProfile.gender,
      healthProfile.bmrOverride,
    );

    const tdee = calculateTDEE(bmr, healthProfile.activityLevel);

    const calorieOffset = activeGoal ? activeGoal.calorieOffset : 0;
    const targetCalories = calculateTarget(tdee, calorieOffset);

    const macros = calculateMacros(
      targetCalories,
      healthProfile.weightKg,
      healthProfile.proteinRatio,
      healthProfile.fatPct,
      healthProfile.bodyFatPct,
    );

    return {
      targetCalories,
      targetProtein: macros.proteinG,
      targetFat: macros.fatG,
      targetCarbs: macros.carbsG,
      bmr,
      tdee,
    };
  }, [healthProfile, activeGoal, userProfile]);
}
