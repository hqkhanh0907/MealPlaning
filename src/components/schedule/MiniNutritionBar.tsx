import { Beef, Flame } from 'lucide-react';
import React from 'react';
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
  const calPct = Math.min(100, Math.round((totalCal / safeCal) * 100));
  const proPct = Math.min(100, Math.round((totalPro / safePro) * 100));
  const remainingCal = displayCal - totalCal;
  const remainingPro = displayPro - totalPro;

  return (
    <button
      type="button"
      onClick={onSwitchToNutrition}
      data-testid="mini-nutrition-bar"
      className="border-primary/20 bg-primary/5 hover:bg-primary/10 w-full cursor-pointer rounded-2xl border p-4 text-left transition-all active:scale-[0.99] lg:hidden"
      aria-label={t('schedule.quickNutrition')}
    >
      <p className="text-primary mb-2 text-xs font-semibold">{t('schedule.quickNutrition')}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-foreground flex items-center gap-1.5">
            <Flame className="text-color-energy h-3.5 w-3.5" />
            <span className="text-xs font-medium">
              {totalCal}/{displayCal} kcal
            </span>
          </div>
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-color-energy h-full rounded-full transition-all"
              style={{ width: `${calPct}%` }}
              data-testid="mini-cal-bar"
            />
          </div>
          <p
            data-testid="mini-remaining-cal"
            className={`text-xs font-medium ${remainingCal >= 0 ? 'text-primary' : 'text-destructive'}`}
          >
            {remainingCal >= 0
              ? t('summary.remaining', { value: remainingCal, unit: 'kcal' })
              : t('summary.over', { value: Math.abs(remainingCal), unit: 'kcal' })}
          </p>
        </div>
        <div className="space-y-1">
          <div className="text-foreground flex items-center gap-1.5">
            <Beef className="text-macro-protein h-3.5 w-3.5" />
            <span className="text-xs font-medium">
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
            className={`text-xs font-medium ${remainingPro >= 0 ? 'text-primary' : 'text-destructive'}`}
          >
            {remainingPro >= 0
              ? t('summary.remaining', { value: remainingPro, unit: 'g' })
              : t('summary.over', { value: Math.abs(remainingPro), unit: 'g' })}
          </p>
        </div>
      </div>
    </button>
  );
});

MiniNutritionBar.displayName = 'MiniNutritionBar';
