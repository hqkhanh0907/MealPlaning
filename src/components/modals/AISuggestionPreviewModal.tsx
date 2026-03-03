import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Sparkles, ChefHat, RefreshCw, CheckCircle2, AlertCircle, Edit3 } from 'lucide-react';
import { Dish, Ingredient, MealType, MealPlanSuggestion } from '../../types';
import { calculateDishesNutrition } from '../../utils/nutrition';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { getMealTypeLabels, MEAL_TYPE_ICONS } from '../../data/constants';

const MEAL_TYPE_COLORS: Record<MealType, { bg: string; border: string; text: string }> = {
  breakfast: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  lunch: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  dinner: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
};

interface AISuggestionPreviewModalProps {
  isOpen: boolean;
  suggestion: MealPlanSuggestion | null;
  dishes: Dish[];
  ingredients: Ingredient[];
  targetCalories: number;
  targetProtein: number;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onApply: (selectedMeals: { breakfast: boolean; lunch: boolean; dinner: boolean }) => void;
  onRegenerate: () => void;
  onEditMeal: (type: MealType) => void;
}

export const AISuggestionPreviewModal: React.FC<AISuggestionPreviewModalProps> = ({
  isOpen,
  suggestion,
  dishes,
  ingredients,
  targetCalories,
  targetProtein,
  isLoading,
  error,
  onClose,
  onApply,
  onRegenerate,
  onEditMeal,
}) => {
  useModalBackHandler(isOpen, onClose);
  const { t } = useTranslation();
  const mealTypeLabels = getMealTypeLabels(t);

  const [selectedMeals, setSelectedMeals] = useState({
    breakfast: true,
    lunch: true,
    dinner: true,
  });

  // Reset selections when suggestion changes
  React.useEffect(() => {
    if (suggestion) {
      setSelectedMeals({
        breakfast: (suggestion.breakfastDishIds?.length ?? 0) > 0,
        lunch: (suggestion.lunchDishIds?.length ?? 0) > 0,
        dinner: (suggestion.dinnerDishIds?.length ?? 0) > 0,
      });
    }
  }, [suggestion]);

  const nutritionSummary = useMemo(() => {
    if (!suggestion) return { calories: 0, protein: 0 };

    let totalCalories = 0;
    let totalProtein = 0;

    if (selectedMeals.breakfast && suggestion.breakfastDishIds?.length) {
      const n = calculateDishesNutrition(suggestion.breakfastDishIds, dishes, ingredients);
      totalCalories += n.calories;
      totalProtein += n.protein;
    }
    if (selectedMeals.lunch && suggestion.lunchDishIds?.length) {
      const n = calculateDishesNutrition(suggestion.lunchDishIds, dishes, ingredients);
      totalCalories += n.calories;
      totalProtein += n.protein;
    }
    if (selectedMeals.dinner && suggestion.dinnerDishIds?.length) {
      const n = calculateDishesNutrition(suggestion.dinnerDishIds, dishes, ingredients);
      totalCalories += n.calories;
      totalProtein += n.protein;
    }

    return { calories: Math.round(totalCalories), protein: Math.round(totalProtein) };
  }, [suggestion, selectedMeals, dishes, ingredients]);

  const getMealNutrition = (dishIds: string[] | undefined) => {
    if (!dishIds?.length) return { calories: 0, protein: 0 };
    const n = calculateDishesNutrition(dishIds, dishes, ingredients);
    return { calories: Math.round(n.calories), protein: Math.round(n.protein) };
  };

  const getDishNames = (dishIds: string[] | undefined) => {
    if (!dishIds?.length) return [];
    return dishIds.map(id => dishes.find(d => d.id === id)?.name).filter((name): name is string => !!name);
  };

  const toggleMeal = (type: MealType) => {
    setSelectedMeals(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const hasAnySuggestion = suggestion && (
    (suggestion.breakfastDishIds?.length ?? 0) > 0 ||
    (suggestion.lunchDishIds?.length ?? 0) > 0 ||
    (suggestion.dinnerDishIds?.length ?? 0) > 0
  );

  const hasAnySelected = selectedMeals.breakfast || selectedMeals.lunch || selectedMeals.dinner;

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-2xl h-[95dvh] sm:h-auto sm:max-h-[90dvh] overflow-hidden flex flex-col sm:mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('ai.suggestionTitle')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('ai.suggestionDesc')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="w-8 h-8 text-indigo-600 animate-bounce" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('ai.suggestionLoading')}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('ai.suggestionLoadingHint')}</p>
              </div>
              <div className="w-48 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"
                  style={{ width: '60%', animation: 'loading 1.5s ease-in-out infinite' }} />
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('ai.suggestionError')}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{error}</p>
              </div>
              <button
                onClick={onRegenerate}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                {t('common.retry')}
              </button>
            </div>
          )}

          {/* Empty Suggestion State */}
          {!isLoading && !error && !hasAnySuggestion && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <ChefHat className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('ai.suggestionEmpty')}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t('ai.suggestionEmptyHint')}
                </p>
              </div>
              <button
                onClick={onRegenerate}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                {t('ai.suggestionRegenerate')}
              </button>
            </div>
          )}

          {/* Suggestion Preview */}
          {!isLoading && !error && hasAnySuggestion && suggestion && (
            <>
              {/* Reasoning Card */}
              {suggestion.reasoning && (
                <div className="p-4 bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-1">{t('ai.reasoning')}</p>
                      <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">{suggestion.reasoning}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Meal Cards */}
              {(['breakfast', 'lunch', 'dinner'] as MealType[]).map(type => {
                const suggestionDishIds: Record<MealType, string[]> = {
                  breakfast: suggestion.breakfastDishIds,
                  lunch: suggestion.lunchDishIds,
                  dinner: suggestion.dinnerDishIds,
                };
                const dishIds = suggestionDishIds[type];
                const names = getDishNames(dishIds);
                const nutrition = getMealNutrition(dishIds);
                const isSelected = selectedMeals[type];
                const hasContent = names.length > 0;
                const colors = MEAL_TYPE_COLORS[type];

                if (!hasContent) return null;

                return (
                  <div
                    key={type}
                    className={`rounded-2xl border-2 transition-all ${
                      isSelected 
                        ? `${colors.bg} ${colors.border}` 
                        : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 opacity-60'
                    }`}
                  >
                    <div className="p-4">
                      {/* Header with checkbox and edit */}
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMeal(type)}
                            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className={`text-sm font-bold uppercase tracking-wider ${isSelected ? colors.text : 'text-slate-400 dark:text-slate-500'}`}>
                            {MEAL_TYPE_ICONS[type]} {mealTypeLabels[type]}
                          </span>
                        </label>
                        <button
                          onClick={() => onEditMeal(type)}
                          disabled={!isSelected}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isSelected 
                              ? 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600 hover:text-slate-800 dark:hover:text-slate-100' 
                              : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {t('common.change')}
                        </button>
                      </div>

                      {/* Dish names */}
                      <div className="space-y-2 mb-3">
                        {names.map((name) => (
                          <div key={name} className="flex items-center gap-2">
                            <ChefHat className={`w-4 h-4 ${isSelected ? 'text-emerald-500' : 'text-slate-300'}`} />
                            <span className={`font-medium ${isSelected ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                              {name}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Nutrition summary */}
                      <div className={`pt-3 border-t ${isSelected ? 'border-slate-200/50' : 'border-slate-200'}`}>
                        <div className="flex gap-4 text-sm">
                          <span className={`font-bold ${isSelected ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                            {nutrition.calories} kcal
                          </span>
                          <span className={`font-bold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                            {nutrition.protein}g protein
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Total Summary */}
              <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{t('ai.totalSelected')}</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {nutritionSummary.calories} kcal · {nutritionSummary.protein}g protein
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{t('ai.targetLabel')}</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {targetCalories} kcal · {targetProtein}g protein
                    </p>
                  </div>
                </div>
                {/* Progress indicator */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400">{t('common.calories')}</span>
                      <span className={`font-medium ${nutritionSummary.calories > targetCalories ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {Math.round((nutritionSummary.calories / targetCalories) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${nutritionSummary.calories > targetCalories ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, (nutritionSummary.calories / targetCalories) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400">{t('common.protein')}</span>
                      <span className={`font-medium ${nutritionSummary.protein >= targetProtein ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {Math.round((nutritionSummary.protein / targetProtein) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${nutritionSummary.protein >= targetProtein ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, (nutritionSummary.protein / targetProtein) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !error && hasAnySuggestion && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              {t('common.cancel')}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onRegenerate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">{t('ai.suggestionRegenerate')}</span>
              </button>
              <button
                onClick={() => onApply(selectedMeals)}
                disabled={!hasAnySelected}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                {t('common.apply')}
              </button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </ModalBackdrop>
  );
};

