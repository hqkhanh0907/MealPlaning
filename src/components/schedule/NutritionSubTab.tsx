import { AlertCircle, CheckCircle2, Info, UtensilsCrossed } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { DayNutritionSummary } from '../../types';
import { getDynamicTips, NutritionTip } from '../../utils/tips';
import { EnergyBalanceCard } from '../nutrition/EnergyBalanceCard';
import { Summary } from '../Summary';
import { MacroChart } from './MacroChart';

interface RecommendationPanelProps {
  weight: number;
  targetCalories: number;
  targetProtein: number;
  dayNutrition: DayNutritionSummary;
  onSwitchToMeals?: () => void;
}

const TIP_STYLES: Record<NutritionTip['type'], string> = {
  success: 'bg-primary-subtle border-primary/10 text-primary',
  warning: 'bg-warning/10 border-warning/20 text-warning',
  info: 'bg-info/10 border-info/20 text-info',
};

const RecommendationPanel = ({
  weight,
  targetCalories,
  targetProtein,
  dayNutrition,
  onSwitchToMeals,
}: RecommendationPanelProps) => {
  const { t } = useTranslation();
  const tips = React.useMemo(
    () => getDynamicTips(dayNutrition, targetCalories, targetProtein, t),
    [dayNutrition, targetCalories, targetProtein, t],
  );
  const isComplete =
    dayNutrition.breakfast.dishIds.length > 0 &&
    dayNutrition.lunch.dishIds.length > 0 &&
    dayNutrition.dinner.dishIds.length > 0;
  const hasAnyPlan =
    dayNutrition.breakfast.dishIds.length > 0 ||
    dayNutrition.lunch.dishIds.length > 0 ||
    dayNutrition.dinner.dishIds.length > 0;

  const getMissingSlots = (): string => {
    const missing: string[] = [];
    if (dayNutrition.breakfast.dishIds.length === 0) missing.push(t('tips.mealBreakfast'));
    if (dayNutrition.lunch.dishIds.length === 0) missing.push(t('tips.mealLunch'));
    if (dayNutrition.dinner.dishIds.length === 0) missing.push(t('tips.mealDinner'));
    return missing.join(', ');
  };

  return (
    <div className="bg-card border-border-subtle flex flex-col rounded-2xl border p-6 shadow-sm">
      <div className="text-color-ai mb-4 flex items-center gap-2 font-semibold">
        <Info className="h-5 w-5" aria-hidden="true" />
        <h3>{t('recommendation.title')}</h3>
      </div>
      <div className="text-foreground-secondary flex-1 space-y-3 text-sm leading-relaxed">
        <p className="text-muted-foreground">
          {t('recommendation.goal')} <strong>{weight}kg</strong> · <strong>{targetCalories} kcal</strong> ·{' '}
          <strong>{targetProtein}g protein</strong>
        </p>

        {tips.map(tip => (
          <div key={tip.text} className={`rounded-xl border p-3 ${TIP_STYLES[tip.type]}`}>
            <p className="inline-flex items-center gap-1.5 font-medium">
              <tip.icon className="size-4 shrink-0" aria-hidden="true" />
              {tip.text}
            </p>
          </div>
        ))}

        {isComplete && (
          <div className="text-primary flex items-center gap-2 pt-1 font-medium">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {t('recommendation.planComplete')}
          </div>
        )}
        {!isComplete && hasAnyPlan && (
          <div className="text-warning flex items-center gap-2 pt-1 font-medium">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            {t('recommendation.missing')} {getMissingSlots()}
          </div>
        )}
        {!hasAnyPlan && onSwitchToMeals && (
          <button
            type="button"
            onClick={onSwitchToMeals}
            data-testid="btn-switch-to-meals"
            className="bg-primary-subtle text-primary-emphasis border-primary/20 hover:bg-primary/10 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all active:scale-[0.98]"
          >
            <UtensilsCrossed className="text-color-energy h-4 w-4" aria-hidden="true" />
            {t('schedule.switchToMeals')}
          </button>
        )}
      </div>
    </div>
  );
};

export interface NutritionSubTabProps {
  dayNutrition: DayNutritionSummary;
  targetCalories: number;
  targetProtein: number;
  userWeight: number;
  onEditGoals: () => void;
  onSwitchToMeals?: () => void;
  caloriesOut?: number;
}

export const NutritionSubTab = React.memo(function NutritionSubTab({
  dayNutrition,
  targetCalories,
  targetProtein,
  userWeight,
  onEditGoals,
  onSwitchToMeals,
  caloriesOut,
}: NutritionSubTabProps) {
  const totalCalories = dayNutrition.breakfast.calories + dayNutrition.lunch.calories + dayNutrition.dinner.calories;
  const totalProtein = dayNutrition.breakfast.protein + dayNutrition.lunch.protein + dayNutrition.dinner.protein;

  return (
    <div data-testid="nutrition-subtab" className="space-y-6">
      {caloriesOut != null && (
        <EnergyBalanceCard
          caloriesIn={totalCalories}
          caloriesOut={caloriesOut}
          targetCalories={targetCalories}
          proteinCurrent={totalProtein}
          proteinTarget={targetProtein}
          isCollapsible
        />
      )}
      <Summary
        dayNutrition={dayNutrition}
        targetCalories={targetCalories}
        targetProtein={targetProtein}
        onEditGoals={onEditGoals}
      />
      <MacroChart dayNutrition={dayNutrition} />
      <RecommendationPanel
        weight={userWeight}
        targetCalories={targetCalories}
        targetProtein={targetProtein}
        dayNutrition={dayNutrition}
        onSwitchToMeals={onSwitchToMeals}
      />
    </div>
  );
});

NutritionSubTab.displayName = 'NutritionSubTab';
