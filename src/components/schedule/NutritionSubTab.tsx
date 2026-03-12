import React from 'react';
import { useTranslation } from 'react-i18next';
import { Info, AlertCircle, CheckCircle2, UtensilsCrossed } from 'lucide-react';
import { Summary } from '../Summary';
import { MacroChart } from './MacroChart';
import { DayNutritionSummary } from '../../types';
import { getDynamicTips, NutritionTip } from '../../utils/tips';

interface RecommendationPanelProps {
  weight: number;
  targetCalories: number;
  targetProtein: number;
  dayNutrition: DayNutritionSummary;
  onSwitchToMeals?: () => void;
}

const TIP_STYLES: Record<NutritionTip['type'], string> = {
  success: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
  warning: 'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800 text-amber-800 dark:text-amber-300',
  info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300',
};

const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  weight, targetCalories, targetProtein, dayNutrition, onSwitchToMeals,
}) => {
  const { t } = useTranslation();
  const tips = React.useMemo(
    () => getDynamicTips(dayNutrition, targetCalories, targetProtein, t),
    [dayNutrition, targetCalories, targetProtein, t],
  );
  const isComplete = dayNutrition.breakfast.dishIds.length > 0
    && dayNutrition.lunch.dishIds.length > 0
    && dayNutrition.dinner.dishIds.length > 0;
  const hasAnyPlan = dayNutrition.breakfast.dishIds.length > 0
    || dayNutrition.lunch.dishIds.length > 0
    || dayNutrition.dinner.dishIds.length > 0;

  const getMissingSlots = (): string => {
    const missing: string[] = [];
    if (dayNutrition.breakfast.dishIds.length === 0) missing.push(t('tips.mealBreakfast'));
    if (dayNutrition.lunch.dishIds.length === 0) missing.push(t('tips.mealLunch'));
    if (dayNutrition.dinner.dishIds.length === 0) missing.push(t('tips.mealDinner'));
    return missing.join(', ');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col">
      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold mb-4">
        <Info className="w-5 h-5" />
        <h3>{t('recommendation.title')}</h3>
      </div>
      <div className="flex-1 space-y-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        <p className="text-slate-500 dark:text-slate-400">
          {t('recommendation.goal')} <strong>{weight}kg</strong> · <strong>{targetCalories} kcal</strong> · <strong>{targetProtein}g protein</strong>
        </p>

        {tips.map((tip) => (
          <div key={tip.text} className={`p-3 rounded-xl border ${TIP_STYLES[tip.type]}`}>
            <p className="font-medium">
              <span className="mr-1.5">{tip.emoji}</span>
              {tip.text}
            </p>
          </div>
        ))}

        {isComplete && (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium pt-1">
            <CheckCircle2 className="w-4 h-4" />
            {t('recommendation.planComplete')}
          </div>
        )}
        {!isComplete && hasAnyPlan && (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium pt-1">
            <AlertCircle className="w-4 h-4" />
            {t('recommendation.missing')} {getMissingSlots()}
          </div>
        )}
        {!hasAnyPlan && onSwitchToMeals && (
          <button
            type="button"
            onClick={onSwitchToMeals}
            data-testid="btn-switch-to-meals"
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:scale-[0.98] transition-all min-h-11"
          >
            <UtensilsCrossed className="w-4 h-4" />
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

export const NutritionSubTab: React.FC<NutritionSubTabProps> = React.memo(({
  dayNutrition, targetCalories, targetProtein, userWeight, onEditGoals, onSwitchToMeals,
}) => {
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
