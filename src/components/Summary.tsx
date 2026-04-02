import { Activity, Beef, ChevronDown, Droplet, Edit3, Flame, Leaf, Wheat } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DayNutritionSummary } from '../types';

interface SummaryProps {
  dayNutrition: DayNutritionSummary;
  targetCalories: number;
  targetProtein: number;
  onEditGoals?: () => void;
}

export const Summary = React.memo(function Summary({
  dayNutrition,
  targetCalories,
  targetProtein,
  onEditGoals,
}: SummaryProps) {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const totalCalories = dayNutrition.breakfast.calories + dayNutrition.lunch.calories + dayNutrition.dinner.calories;
  const totalProtein = dayNutrition.breakfast.protein + dayNutrition.lunch.protein + dayNutrition.dinner.protein;
  const totalCarbs = dayNutrition.breakfast.carbs + dayNutrition.lunch.carbs + dayNutrition.dinner.carbs;
  const totalFat = dayNutrition.breakfast.fat + dayNutrition.lunch.fat + dayNutrition.dinner.fat;
  const totalFiber = dayNutrition.breakfast.fiber + dayNutrition.lunch.fiber + dayNutrition.dinner.fiber;
  const remainingCalories = Math.round(targetCalories - totalCalories);
  const remainingProtein = Math.round(targetProtein - totalProtein);

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/50 sm:p-6 md:p-8 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50">
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 sm:p-3 dark:bg-indigo-900/30 dark:text-indigo-400">
            <Activity className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 sm:text-xl dark:text-slate-100">{t('summary.title')}</h2>
            <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
              {t('summary.goal', { cal: targetCalories, pro: targetProtein })}
            </p>
          </div>
        </div>
        {onEditGoals && (
          <button
            onClick={onEditGoals}
            aria-label={t('summary.editGoal')}
            data-testid="btn-edit-goals"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-600 sm:min-h-9 sm:min-w-9 dark:hover:bg-emerald-900/30"
            title={t('summary.editGoal')}
          >
            <Edit3 className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-4 sm:mb-8 sm:gap-8">
        {/* Calories Progress */}
        <div className="min-w-[200px] flex-1 space-y-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-1.5 font-medium text-slate-700 sm:gap-2 dark:text-slate-300">
              <Flame className="h-4 w-4 text-orange-500 sm:h-5 sm:w-5" />{' '}
              <span className="text-sm sm:text-base">{t('common.calories')}</span>
            </div>
            <div className="text-left sm:text-right">
              <span
                data-testid="summary-total-calories"
                className="text-xl font-bold text-slate-800 sm:text-2xl dark:text-slate-100"
              >
                {Math.round(totalCalories)}
              </span>
              <span className="text-xs text-slate-500 sm:text-sm dark:text-slate-400"> / {targetCalories}</span>
            </div>
          </div>
          <progress
            data-testid="progress-calories"
            className={`h-2.5 w-full appearance-none overflow-hidden rounded-full sm:h-3 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:transition-all [&::-moz-progress-bar]:duration-500 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-slate-100 dark:[&::-webkit-progress-bar]:bg-slate-700 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-500 ${totalCalories > targetCalories ? '[&::-moz-progress-bar]:bg-rose-500 [&::-webkit-progress-value]:bg-rose-500' : '[&::-moz-progress-bar]:bg-orange-500 [&::-webkit-progress-value]:bg-orange-500'}`}
            aria-label={t('common.calories')}
            value={Math.round(totalCalories)}
            max={targetCalories}
          />
          <p
            data-testid="remaining-calories"
            className={`text-xs font-medium ${remainingCalories >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
          >
            {remainingCalories >= 0
              ? t('summary.remaining', { value: remainingCalories, unit: 'kcal' })
              : t('summary.over', { value: Math.abs(remainingCalories), unit: 'kcal' })}
          </p>
        </div>

        {/* Protein Progress */}
        <div className="min-w-[200px] flex-1 space-y-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-1.5 font-medium text-slate-700 sm:gap-2 dark:text-slate-300">
              <Beef className="h-4 w-4 text-blue-500 sm:h-5 sm:w-5" />{' '}
              <span className="text-sm sm:text-base">{t('common.protein')}</span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xl font-bold text-slate-800 sm:text-2xl dark:text-slate-100">
                {Math.round(totalProtein)}
              </span>
              <span className="text-xs text-slate-500 sm:text-sm dark:text-slate-400"> / {targetProtein}g</span>
            </div>
          </div>
          <progress
            data-testid="progress-protein"
            className="h-2.5 w-full appearance-none overflow-hidden rounded-full sm:h-3 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-blue-500 [&::-moz-progress-bar]:transition-all [&::-moz-progress-bar]:duration-500 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-slate-100 dark:[&::-webkit-progress-bar]:bg-slate-700 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-blue-500 [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-500"
            aria-label={t('common.protein')}
            value={Math.round(totalProtein)}
            max={targetProtein}
          />
          <p
            data-testid="remaining-protein"
            className={`text-xs font-medium ${remainingProtein >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
          >
            {remainingProtein >= 0
              ? t('summary.remaining', { value: remainingProtein, unit: 'g' })
              : t('summary.over', { value: Math.abs(remainingProtein), unit: 'g' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-amber-100/50 bg-amber-50 p-3 sm:p-4 dark:border-amber-800/30 dark:bg-amber-900/20">
          <div className="mb-1 flex items-center gap-1.5 text-amber-700 sm:gap-2 dark:text-amber-400">
            <Wheat className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-xs font-medium sm:text-sm">{t('common.carbs')}</span>
          </div>
          <p className="text-lg font-bold text-amber-900 sm:text-2xl dark:text-amber-300">
            {Math.round(totalCarbs)}
            <span className="ml-1 text-xs font-normal text-amber-700/70 sm:text-sm dark:text-amber-500/70">g</span>
          </p>
        </div>
        <div className="rounded-2xl border border-rose-100/50 bg-rose-50 p-3 sm:p-4 dark:border-rose-800/30 dark:bg-rose-900/20">
          <div className="mb-1 flex items-center gap-1.5 text-rose-700 sm:gap-2 dark:text-rose-400">
            <Droplet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-xs font-medium sm:text-sm">{t('common.fat')}</span>
          </div>
          <p className="text-lg font-bold text-rose-900 sm:text-2xl dark:text-rose-300">
            {Math.round(totalFat)}
            <span className="ml-1 text-xs font-normal text-rose-700/70 sm:text-sm dark:text-rose-500/70">g</span>
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100/50 bg-emerald-50 p-3 sm:p-4 dark:border-emerald-800/30 dark:bg-emerald-900/20">
          <div className="mb-1 flex items-center gap-1.5 text-emerald-700 sm:gap-2 dark:text-emerald-400">
            <Leaf className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-xs font-medium sm:text-sm">{t('common.fiber')}</span>
          </div>
          <p className="text-lg font-bold text-emerald-900 sm:text-2xl dark:text-emerald-300">
            {Math.round(totalFiber)}
            <span className="ml-1 text-xs font-normal text-emerald-700/70 sm:text-sm dark:text-emerald-500/70">g</span>
          </p>
        </div>
      </div>

      <button
        type="button"
        data-testid="btn-macro-details"
        onClick={() => setShowDetails(prev => !prev)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-500 transition-all hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
      >
        <span>{showDetails ? t('summary.hideDetails') : t('summary.showDetails')}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
      </button>

      {showDetails && (
        <div data-testid="macro-details" className="mt-2 border-t border-slate-100 pt-3 dark:border-slate-700">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="pb-2 text-left font-medium">{t('summary.meal')}</th>
                <th className="pb-2 text-right font-medium">{t('common.carbs')}</th>
                <th className="pb-2 text-right font-medium">{t('common.fat')}</th>
                <th className="pb-2 text-right font-medium">{t('common.fiber')}</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr>
                <td className="py-1">{t('meal.breakfast')}</td>
                <td className="py-1 text-right">{Math.round(dayNutrition.breakfast.carbs)}g</td>
                <td className="py-1 text-right">{Math.round(dayNutrition.breakfast.fat)}g</td>
                <td className="py-1 text-right">{Math.round(dayNutrition.breakfast.fiber)}g</td>
              </tr>
              <tr>
                <td className="py-1">{t('meal.lunch')}</td>
                <td className="py-1 text-right">{Math.round(dayNutrition.lunch.carbs)}g</td>
                <td className="py-1 text-right">{Math.round(dayNutrition.lunch.fat)}g</td>
                <td className="py-1 text-right">{Math.round(dayNutrition.lunch.fiber)}g</td>
              </tr>
              <tr>
                <td className="py-1">{t('meal.dinner')}</td>
                <td className="py-1 text-right">{Math.round(dayNutrition.dinner.carbs)}g</td>
                <td className="py-1 text-right">{Math.round(dayNutrition.dinner.fat)}g</td>
                <td className="py-1 text-right">{Math.round(dayNutrition.dinner.fiber)}g</td>
              </tr>
              <tr className="border-t border-slate-200 font-bold dark:border-slate-600">
                <td className="pt-2">{t('summary.total')}</td>
                <td className="pt-2 text-right">{Math.round(totalCarbs)}g</td>
                <td className="pt-2 text-right">{Math.round(totalFat)}g</td>
                <td className="pt-2 text-right">{Math.round(totalFiber)}g</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

Summary.displayName = 'Summary';
