import { AlertCircle, CheckCircle2, Info, UtensilsCrossed } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { DayNutritionSummary } from '../../types';
import { getDynamicTips, NutritionTip } from '../../utils/tips';
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
  success:
    'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
  warning: 'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800 text-amber-800 dark:text-amber-300',
  info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300',
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
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400">
        <Info className="h-5 w-5" />
        <h3>{t('recommendation.title')}</h3>
      </div>
      <div className="flex-1 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        <p className="text-slate-500 dark:text-slate-400">
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
          <div className="flex items-center gap-2 pt-1 font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            {t('recommendation.planComplete')}
          </div>
        )}
        {!isComplete && hasAnyPlan && (
          <div className="flex items-center gap-2 pt-1 font-medium text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
            {t('recommendation.missing')} {getMissingSlots()}
          </div>
        )}
        {!hasAnyPlan && onSwitchToMeals && (
          <button
            type="button"
            onClick={onSwitchToMeals}
            data-testid="btn-switch-to-meals"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700 transition-all hover:bg-emerald-100 active:scale-[0.98] dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
          >
            <UtensilsCrossed className="h-4 w-4" />
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
}

export const NutritionSubTab = React.memo(function NutritionSubTab({
  dayNutrition,
  targetCalories,
  targetProtein,
  userWeight,
  onEditGoals,
  onSwitchToMeals,
}: NutritionSubTabProps) {
  return (
    <div data-testid="nutrition-subtab" className="space-y-6">
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
