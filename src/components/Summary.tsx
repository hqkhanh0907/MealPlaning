import React from 'react';
import { Activity, Flame, Beef, Wheat, Droplet, Leaf, Edit3 } from 'lucide-react';
import { DayNutritionSummary } from '../types';

interface SummaryProps {
  dayNutrition: DayNutritionSummary;
  targetCalories: number;
  targetProtein: number;
  onEditGoals?: () => void;
}

export const Summary: React.FC<SummaryProps> = React.memo(({ dayNutrition, targetCalories, targetProtein, onEditGoals }) => {
  const totalCalories = dayNutrition.breakfast.calories + dayNutrition.lunch.calories + dayNutrition.dinner.calories;
  const totalProtein = dayNutrition.breakfast.protein + dayNutrition.lunch.protein + dayNutrition.dinner.protein;
  const totalCarbs = dayNutrition.breakfast.carbs + dayNutrition.lunch.carbs + dayNutrition.dinner.carbs;
  const totalFat = dayNutrition.breakfast.fat + dayNutrition.lunch.fat + dayNutrition.dinner.fat;
  const totalFiber = dayNutrition.breakfast.fiber + dayNutrition.lunch.fiber + dayNutrition.dinner.fiber;

  const calPercent = Math.min(100, (totalCalories / targetCalories) * 100);
  const proPercent = Math.min(100, (totalProtein / targetProtein) * 100);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 p-4 sm:p-6 md:p-8 border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Dinh dưỡng trong ngày</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Mục tiêu: {targetCalories} kcal, {targetProtein}g Protein</p>
          </div>
        </div>
        {onEditGoals && (
          <button 
            onClick={onEditGoals}
            aria-label="Chỉnh sửa mục tiêu dinh dưỡng"
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 flex items-center justify-center"
            title="Chỉnh sửa mục tiêu"
          >
            <Edit3 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 sm:gap-8 mb-4 sm:mb-8">
        {/* Calories Progress */}
        <div className="space-y-2 col-span-1">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-1">
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-700 dark:text-slate-300 font-medium">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" /> <span className="text-sm sm:text-base">Calories</span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">{Math.round(totalCalories)}</span>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400"> / {targetCalories}</span>
            </div>
          </div>
          <div className="h-2.5 sm:h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden" role="progressbar" aria-label="Calories" aria-valuenow={Math.round(totalCalories)} aria-valuemax={targetCalories}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${totalCalories > targetCalories ? 'bg-rose-500' : 'bg-orange-500'}`}
              style={{ width: `${calPercent}%` }}
            />
          </div>
        </div>

        {/* Protein Progress */}
        <div className="space-y-2 col-span-1">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-1">
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-700 dark:text-slate-300 font-medium">
              <Beef className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" /> <span className="text-sm sm:text-base">Protein</span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">{Math.round(totalProtein)}</span>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400"> / {targetProtein}g</span>
            </div>
          </div>
          <div className="h-2.5 sm:h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden" role="progressbar" aria-label="Protein" aria-valuenow={Math.round(totalProtein)} aria-valuemax={targetProtein}>
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${proPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-3 sm:p-4 border border-amber-100/50 dark:border-amber-800/30">
          <div className="flex items-center gap-1.5 sm:gap-2 text-amber-700 dark:text-amber-400 mb-1">
            <Wheat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">Carbs</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-amber-900 dark:text-amber-300">{Math.round(totalCarbs)}<span className="text-xs sm:text-sm font-normal text-amber-700/70 dark:text-amber-500/70 ml-1">g</span></p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-3 sm:p-4 border border-rose-100/50 dark:border-rose-800/30">
          <div className="flex items-center gap-1.5 sm:gap-2 text-rose-700 dark:text-rose-400 mb-1">
            <Droplet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">Fat</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-rose-900 dark:text-rose-300">{Math.round(totalFat)}<span className="text-xs sm:text-sm font-normal text-rose-700/70 dark:text-rose-500/70 ml-1">g</span></p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-3 sm:p-4 border border-emerald-100/50 dark:border-emerald-800/30 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-700 dark:text-emerald-400 mb-1">
            <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">Chất xơ</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-900 dark:text-emerald-300">{Math.round(totalFiber)}<span className="text-xs sm:text-sm font-normal text-emerald-700/70 dark:text-emerald-500/70 ml-1">g</span></p>
        </div>
      </div>
    </div>
  );
});

Summary.displayName = 'Summary';
