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
  const totalCal = Math.round(
    dayNutrition.breakfast.calories + dayNutrition.lunch.calories + dayNutrition.dinner.calories,
  );
  const totalPro = Math.round(
    dayNutrition.breakfast.protein + dayNutrition.lunch.protein + dayNutrition.dinner.protein,
  );
  const calPct = Math.min(100, Math.round((totalCal / targetCalories) * 100));
  const proPct = Math.min(100, Math.round((totalPro / targetProtein) * 100));
  const remainingCal = targetCalories - totalCal;
  const remainingPro = targetProtein - totalPro;

  return (
    <button
      type="button"
      onClick={onSwitchToNutrition}
      data-testid="mini-nutrition-bar"
      className="w-full cursor-pointer rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-left transition-all hover:bg-indigo-100 active:scale-[0.99] lg:hidden dark:border-indigo-800/30 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30"
      aria-label={t('schedule.quickNutrition')}
    >
      <p className="mb-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">{t('schedule.quickNutrition')}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-xs font-medium">
              {totalCal}/{targetCalories} kcal
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
            <div
              className="h-full rounded-full bg-orange-400 transition-all"
              style={{ width: `${calPct}%` }}
              data-testid="mini-cal-bar"
            />
          </div>
          <p
            data-testid="mini-remaining-cal"
            className={`text-[10px] font-medium ${remainingCal >= 0 ? 'text-primary' : 'text-rose-600 dark:text-rose-400'}`}
          >
            {remainingCal >= 0
              ? t('summary.remaining', { value: remainingCal, unit: 'kcal' })
              : t('summary.over', { value: Math.abs(remainingCal), unit: 'kcal' })}
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Beef className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-medium">
              {totalPro}/{targetProtein}g Pro
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
            <div
              className="h-full rounded-full bg-blue-400 transition-all"
              style={{ width: `${proPct}%` }}
              data-testid="mini-pro-bar"
            />
          </div>
          <p
            data-testid="mini-remaining-pro"
            className={`text-[10px] font-medium ${remainingPro >= 0 ? 'text-primary' : 'text-rose-600 dark:text-rose-400'}`}
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
