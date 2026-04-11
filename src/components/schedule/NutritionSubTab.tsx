import { Target } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useMinimumDelay } from '../../hooks/useMinimumDelay';
import type { DayNutritionSummary } from '../../types';
import { EmptyState } from '../shared/EmptyState';
import { createSurfaceStateContract } from '../shared/surfaceState';
import { NutritionDetails } from './NutritionDetails';
import { NutritionDetailsSkeleton } from './NutritionDetailsSkeleton';
import { NutritionOverview } from './NutritionOverview';
import { NutritionOverviewSkeleton } from './NutritionOverviewSkeleton';

export interface NutritionSubTabProps {
  dayNutrition: DayNutritionSummary;
  targetCalories: number;
  targetProtein: number;
  onEditGoals: () => void;
  onSwitchToMeals?: () => void;
  caloriesOut?: number;
  isHydrating?: boolean;
}

const FALLBACK_SWITCH = () => {};

export const NutritionSubTab = React.memo(function NutritionSubTab({
  dayNutrition,
  targetCalories,
  targetProtein,
  onEditGoals,
  onSwitchToMeals,
  caloriesOut,
  isHydrating,
}: NutritionSubTabProps) {
  const { t } = useTranslation();
  const showSkeleton = useMinimumDelay(isHydrating ?? false);

  const isSetup = !Number.isFinite(targetCalories) || targetCalories <= 0;

  if (showSkeleton) {
    return (
      <div data-testid="nutrition-subtab" className="space-y-6" aria-busy="true">
        <NutritionOverviewSkeleton />
        <NutritionDetailsSkeleton />
      </div>
    );
  }

  if (isSetup) {
    const setupContract = createSurfaceStateContract({
      surface: 'calendar.nutrition',
      state: 'setup',
      copy: {
        title: t('calendar.nutritionSetupTitle'),
        missing: t('calendar.nutritionSetupMissing'),
        reason: t('calendar.nutritionSetupReason'),
        nextStep: t('calendar.nutritionSetupNextStep'),
      },
      primaryAction: {
        label: t('calendar.nutritionSetupAction'),
        onAction: onEditGoals,
      },
    });

    return (
      <div data-testid="nutrition-subtab" className="space-y-6">
        <EmptyState
          variant="standard"
          icon={Target}
          contract={setupContract}
          className="border-info/20 bg-info/5 rounded-2xl border"
        />
      </div>
    );
  }

  const totalCalories = dayNutrition.breakfast.calories + dayNutrition.lunch.calories + dayNutrition.dinner.calories;
  const totalProtein = dayNutrition.breakfast.protein + dayNutrition.lunch.protein + dayNutrition.dinner.protein;
  const totalFat = dayNutrition.breakfast.fat + dayNutrition.lunch.fat + dayNutrition.dinner.fat;
  const totalCarbs = dayNutrition.breakfast.carbs + dayNutrition.lunch.carbs + dayNutrition.dinner.carbs;

  return (
    <div data-testid="nutrition-subtab" className="space-y-6">
      <NutritionOverview
        eaten={totalCalories}
        target={targetCalories}
        protein={totalProtein}
        targetProtein={targetProtein}
        fat={totalFat}
        carbs={totalCarbs}
        caloriesOut={caloriesOut}
        isSetup={false}
        onSetup={onEditGoals}
      />
      <NutritionDetails
        dayNutrition={dayNutrition}
        targetCalories={targetCalories}
        targetProtein={targetProtein}
        isSetup={false}
        onSwitchToMeals={onSwitchToMeals ?? FALLBACK_SWITCH}
        onEditGoal={onEditGoals}
      />
    </div>
  );
});

NutritionSubTab.displayName = 'NutritionSubTab';
