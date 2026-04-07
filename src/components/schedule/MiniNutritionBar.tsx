import { Beef, Flame } from 'lucide-react';
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

  const nudgeText = useMemo(() => {
    if (!hasIntake) return null;
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
  }, [hasIntake, remainingPro, remainingCal, t]);

  const ariaLabel = nudgeText ? `${t('schedule.quickNutrition')} — ${nudgeText}` : t('schedule.quickNutrition');

  return (
    <button
      type="button"
      onClick={onSwitchToNutrition}
      data-testid="mini-nutrition-bar"
      className="border-primary/20 bg-primary/5 hover:bg-primary/10 w-full cursor-pointer rounded-2xl border p-4 text-left transition-all active:scale-[0.99] lg:hidden"
      aria-label={ariaLabel}
    >
      <p className="text-primary mb-2 text-xs font-semibold">{t('schedule.quickNutrition')}</p>
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
              ? t('summary.remaining', { value: remainingCal, unit: 'kcal' })
              : t('summary.over', { value: Math.abs(remainingCal), unit: 'kcal' })}
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
              ? t('summary.remaining', { value: remainingPro, unit: 'g' })
              : t('summary.over', { value: Math.abs(remainingPro), unit: 'g' })}
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
