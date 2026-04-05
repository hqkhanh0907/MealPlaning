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
    <div className="bg-card border-border-subtle rounded-2xl border p-4 shadow-xl shadow-black/5 sm:p-6 md:p-8 dark:shadow-black/10">
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-color-ai-subtle text-color-ai rounded-xl p-2.5 sm:p-3">
            <Activity className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h2 className="text-foreground text-lg font-semibold sm:text-xl">{t('summary.title')}</h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {t('summary.goal', { cal: targetCalories, pro: targetProtein })}
            </p>
          </div>
        </div>
        {onEditGoals && (
          <button
            onClick={onEditGoals}
            aria-label={t('summary.editGoal')}
            data-testid="btn-edit-goals"
            className="hover:bg-primary-subtle text-muted-foreground hover:text-primary flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 transition-all sm:min-h-9 sm:min-w-9"
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
            <div className="text-foreground flex items-center gap-1.5 font-medium sm:gap-2">
              <Flame className="text-color-energy h-4 w-4 sm:h-5 sm:w-5" />{' '}
              <span className="text-sm sm:text-base">{t('common.calories')}</span>
            </div>
            <div className="text-left sm:text-right">
              <span data-testid="summary-total-calories" className="text-foreground text-xl font-bold sm:text-2xl">
                {Math.round(totalCalories)}
              </span>
              <span className="text-muted-foreground text-xs sm:text-sm"> / {targetCalories}</span>
            </div>
          </div>
          <progress
            data-testid="progress-calories"
            className={`[&::-webkit-progress-bar]:bg-muted h-2.5 w-full appearance-none overflow-hidden rounded-full sm:h-3 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:transition-all [&::-moz-progress-bar]:duration-500 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-500 ${totalCalories > targetCalories ? '[&::-moz-progress-bar]:bg-rose-500 [&::-webkit-progress-value]:bg-rose-500' : '[&::-moz-progress-bar]:bg-orange-500 [&::-webkit-progress-value]:bg-orange-500'}`}
            aria-label={t('common.calories')}
            value={Math.round(totalCalories)}
            max={targetCalories}
          />
          <p
            data-testid="remaining-calories"
            className={`text-xs font-medium ${remainingCalories >= 0 ? 'text-primary' : 'text-destructive'}`}
          >
            {remainingCalories >= 0
              ? t('summary.remaining', { value: remainingCalories, unit: 'kcal' })
              : t('summary.over', { value: Math.abs(remainingCalories), unit: 'kcal' })}
          </p>
        </div>

        {/* Protein Progress */}
        <div className="min-w-[200px] flex-1 space-y-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="text-foreground flex items-center gap-1.5 font-medium sm:gap-2">
              <Beef className="text-macro-protein h-4 w-4 sm:h-5 sm:w-5" />{' '}
              <span className="text-sm sm:text-base">{t('common.protein')}</span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-foreground text-xl font-bold sm:text-2xl">{Math.round(totalProtein)}</span>
              <span className="text-muted-foreground text-xs sm:text-sm"> / {targetProtein}g</span>
            </div>
          </div>
          <progress
            data-testid="progress-protein"
            className="[&::-webkit-progress-bar]:bg-muted [&::-moz-progress-bar]:bg-macro-protein [&::-webkit-progress-value]:bg-macro-protein h-2.5 w-full appearance-none overflow-hidden rounded-full sm:h-3 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:transition-all [&::-moz-progress-bar]:duration-500 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-500"
            aria-label={t('common.protein')}
            value={Math.round(totalProtein)}
            max={targetProtein}
          />
          <p
            data-testid="remaining-protein"
            className={`text-xs font-medium ${remainingProtein >= 0 ? 'text-primary' : 'text-destructive'}`}
          >
            {remainingProtein >= 0
              ? t('summary.remaining', { value: remainingProtein, unit: 'g' })
              : t('summary.over', { value: Math.abs(remainingProtein), unit: 'g' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="border-macro-carbs/20 bg-macro-carbs/10 rounded-2xl border p-4">
          <div className="text-macro-carbs mb-1 flex items-center gap-1.5 sm:gap-2">
            <Wheat className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-xs font-medium sm:text-sm">{t('common.carbs')}</span>
          </div>
          <p className="text-macro-carbs text-lg font-bold sm:text-2xl">
            {Math.round(totalCarbs)}
            <span className="text-macro-carbs/70 ml-1 text-xs font-normal sm:text-sm">g</span>
          </p>
        </div>
        <div className="border-macro-fat/20 bg-macro-fat/10 rounded-2xl border p-4">
          <div className="text-macro-fat mb-1 flex items-center gap-1.5 sm:gap-2">
            <Droplet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-xs font-medium sm:text-sm">{t('common.fat')}</span>
          </div>
          <p className="text-macro-fat text-lg font-bold sm:text-2xl">
            {Math.round(totalFat)}
            <span className="text-macro-fat/70 ml-1 text-xs font-normal sm:text-sm">g</span>
          </p>
        </div>
        <div className="bg-primary-subtle border-primary/10 rounded-2xl border p-4">
          <div className="text-primary-emphasis mb-1 flex items-center gap-1.5 sm:gap-2">
            <Leaf className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-xs font-medium sm:text-sm">{t('common.fiber')}</span>
          </div>
          <p className="text-primary text-lg font-bold sm:text-2xl">
            {Math.round(totalFiber)}
            <span className="dark:text-primary/70 text-primary-emphasis/70 ml-1 text-xs font-normal sm:text-sm">g</span>
          </p>
        </div>
      </div>

      <button
        type="button"
        data-testid="btn-macro-details"
        onClick={() => setShowDetails(prev => !prev)}
        className="text-muted-foreground hover:text-foreground mt-3 flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium transition-all"
      >
        <span>{showDetails ? t('summary.hideDetails') : t('summary.showDetails')}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
      </button>

      {showDetails && (
        <div data-testid="macro-details" className="border-border-subtle mt-2 border-t pt-3">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="pb-2 text-left font-medium">{t('summary.meal')}</th>
                <th className="pb-2 text-right font-medium">{t('common.carbs')}</th>
                <th className="pb-2 text-right font-medium">{t('common.fat')}</th>
                <th className="pb-2 text-right font-medium">{t('common.fiber')}</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
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
              <tr className="border-border border-t font-semibold">
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
