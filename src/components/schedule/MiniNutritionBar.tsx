import { Beef, Flame, Settings2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DayNutritionSummary } from '../../types';

export interface MiniNutritionBarProps {
  dayNutrition: DayNutritionSummary;
  targetCalories: number;
  targetProtein: number;
  onSwitchToNutrition: () => void;
}

export const MiniNutritionBar = React.memo(function MiniNutritionBar({
  dayNutrition,
  targetCalories,
  targetProtein,
  onSwitchToNutrition,
}: MiniNutritionBarProps) {
  const { t } = useTranslation();
  const displayCal = Number.isFinite(targetCalories) ? targetCalories : 0;
  const displayPro = Number.isFinite(targetProtein) ? targetProtein : 0;
  const safeCal = displayCal > 0 ? displayCal : 1;
  const safePro = displayPro > 0 ? displayPro : 1;
  const totalCal = Math.round(
    dayNutrition.breakfast.calories + dayNutrition.lunch.calories + dayNutrition.dinner.calories,
  );
  const totalPro = Math.round(
    dayNutrition.breakfast.protein + dayNutrition.lunch.protein + dayNutrition.dinner.protein,
  );
  const totalFat = Math.round(dayNutrition.breakfast.fat + dayNutrition.lunch.fat + dayNutrition.dinner.fat);
  const totalCarbs = Math.round(dayNutrition.breakfast.carbs + dayNutrition.lunch.carbs + dayNutrition.dinner.carbs);
  const calPct = Math.min(100, Math.round((totalCal / safeCal) * 100));
  const proPct = Math.min(100, Math.round((totalPro / safePro) * 100));
  const remainingCal = displayCal - totalCal;
  const remainingPro = displayPro - totalPro;
  const hasMacros = totalPro > 0 || totalFat > 0 || totalCarbs > 0;
  const hasIntake = totalCal > 0 || totalPro > 0;

  const isSetup = displayCal <= 0;
  const isGoalReached = !isSetup && totalCal >= displayCal && displayCal > 0;

  const nudgeText = useMemo(() => {
    if (!hasIntake || isSetup || isGoalReached) return null;
    if (remainingPro > 30) {
      return t('nutrition.proteinNudge', {
        amount: remainingPro,
        suggestion: t('nutrition.proteinNudgeSuggestions'),
      });
    }
    if (remainingPro <= 30 && remainingCal > 200) {
      return t('nutrition.calorieNudge', { amount: remainingCal });
    }
    return null;
  }, [hasIntake, isSetup, isGoalReached, remainingPro, remainingCal, t]);

  const headerText = isGoalReached ? t('calendar.budgetGoalReached') : `📊 ${t('calendar.budgetStripTitle')}`;

  const ariaLabel = nudgeText ? `${t('calendar.budgetStripTitle')} — ${nudgeText}` : t('calendar.budgetStripTitle');

  const containerClass = isGoalReached
    ? 'border-success/20 bg-success/5 hover:bg-success/10'
    : 'border-primary/20 bg-primary/5 hover:bg-primary/10';

  if (isSetup) {
    return (
      <button
        type="button"
        onClick={onSwitchToNutrition}
        data-testid="mini-nutrition-bar"
        data-budget-strip=""
        className="border-primary/20 bg-primary/5 hover:bg-primary/10 w-full cursor-pointer rounded-2xl border p-4 text-left transition-all active:scale-[0.99] lg:hidden"
        aria-label={t('calendar.budgetSetupLabel')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary mb-1 text-xs font-semibold">{`📊 ${t('calendar.budgetStripTitle')}`}</p>
            <p data-testid="budget-setup-label" className="text-muted-foreground text-sm">
              {t('calendar.budgetSetupLabel')}
            </p>
          </div>
          <span className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold">
            <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t('calendar.budgetSetupCta')}
          </span>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSwitchToNutrition}
      data-testid="mini-nutrition-bar"
      data-budget-strip=""
      className={`${containerClass} w-full cursor-pointer rounded-2xl border p-4 text-left transition-all active:scale-[0.99] lg:hidden`}
      aria-label={ariaLabel}
    >
      <p className={`mb-2 text-xs font-semibold ${isGoalReached ? 'text-success' : 'text-primary'}`}>{headerText}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-foreground flex items-center gap-1.5">
            <Flame className="text-energy h-3.5 w-3.5" />
            <span className="text-xs font-medium tabular-nums">
              {totalCal}/{displayCal} kcal
            </span>
          </div>
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-energy h-full rounded-full transition-all"
              style={{ width: `${calPct}%` }}
              data-testid="mini-cal-bar"
            />
          </div>
          <p
            data-testid="mini-remaining-cal"
            className={`text-xs font-medium tabular-nums ${remainingCal >= 0 ? 'text-primary' : 'text-destructive'}`}
          >
            {remainingCal >= 0
              ? t('calendar.budgetRemaining', { value: remainingCal, unit: 'kcal' })
              : t('calendar.budgetOverflow', { value: Math.abs(remainingCal), unit: 'kcal' })}
          </p>
        </div>
        <div className="space-y-1">
          <div className="text-foreground flex items-center gap-1.5">
            <Beef className="text-macro-protein h-3.5 w-3.5" />
            <span className="text-xs font-medium tabular-nums">
              {totalPro}/{displayPro}g Pro
            </span>
          </div>
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-macro-protein h-full rounded-full transition-all"
              style={{ width: `${proPct}%` }}
              data-testid="mini-pro-bar"
            />
          </div>
          <p
            data-testid="mini-remaining-pro"
            className={`text-xs font-medium tabular-nums ${remainingPro >= 0 ? 'text-primary' : 'text-destructive'}`}
          >
            {remainingPro >= 0
              ? t('calendar.budgetRemaining', { value: remainingPro, unit: 'g' })
              : t('calendar.budgetOverflow', { value: Math.abs(remainingPro), unit: 'g' })}
          </p>
        </div>
      </div>
      {hasMacros && (
        <div data-testid="mini-macro-pills" className="border-primary/10 mt-2 flex gap-3 border-t pt-2">
          <span className="text-macro-protein text-xs font-medium tabular-nums">P {totalPro}g</span>
          <span className="text-macro-fat text-xs font-medium tabular-nums">F {totalFat}g</span>
          <span className="text-macro-carbs text-xs font-medium tabular-nums">C {totalCarbs}g</span>
        </div>
      )}
      {nudgeText && (
        <p data-testid="mini-nutrition-nudge" className="text-muted-foreground mt-2 text-xs italic">
          {nudgeText}
        </p>
      )}
    </button>
  );
});

MiniNutritionBar.displayName = 'MiniNutritionBar';
