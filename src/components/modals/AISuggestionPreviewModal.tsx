import { AlertCircle, CheckCircle2, ChefHat, Edit3, RefreshCw, Sparkles, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getMealTypeLabels, MEAL_TYPE_ICONS } from '../../data/constants';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { Dish, Ingredient, MealPlanSuggestion, MealType, SupportedLang } from '../../types';
import { getLocalizedField } from '../../utils/localize';
import { calculateDishesNutrition } from '../../utils/nutrition';
import { ModalBackdrop } from '../shared/ModalBackdrop';

const MEAL_TYPE_COLORS: Record<MealType, { bg: string; border: string; text: string }> = {
  breakfast: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-700',
    text: 'text-amber-700 dark:text-amber-400',
  },
  lunch: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-400',
  },
  dinner: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-700',
    text: 'text-indigo-700 dark:text-indigo-400',
  },
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

export const AISuggestionPreviewModal = ({
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
}: AISuggestionPreviewModalProps) => {
  useModalBackHandler(isOpen, onClose);
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;
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
    return dishIds
      .map(id => {
        const d = dishes.find(x => x.id === id);
        return d ? getLocalizedField(d.name, lang) : undefined;
      })
      .filter((name): name is string => !!name);
  };

  const toggleMeal = (type: MealType) => {
    setSelectedMeals(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const hasAnySuggestion =
    suggestion &&
    ((suggestion.breakfastDishIds?.length ?? 0) > 0 ||
      (suggestion.lunchDishIds?.length ?? 0) > 0 ||
      (suggestion.dinnerDishIds?.length ?? 0) > 0);

  const hasAnySelected = selectedMeals.breakfast || selectedMeals.lunch || selectedMeals.dinner;

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-card relative flex h-[95dvh] w-full flex-col overflow-hidden rounded-t-2xl shadow-xl sm:mx-4 sm:h-auto sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-indigo-50 to-purple-50 px-6 py-4 dark:border-slate-700 dark:from-indigo-900/30 dark:to-purple-900/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('ai.suggestionTitle')}</h3>
              <p className="text-muted-foreground text-xs">{t('ai.suggestionDesc')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.closeDialog')}
            className="dark:text-muted-foreground rounded-full p-2 text-slate-400 transition-all hover:bg-white/50 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain p-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-4 py-16">
              <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <Sparkles className="h-8 w-8 animate-bounce text-indigo-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('ai.suggestionLoading')}</p>
                <p className="text-muted-foreground mt-1 text-sm">{t('ai.suggestionLoadingHint')}</p>
              </div>
              <div className="h-2 w-48 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  className="h-full animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-indigo-500"
                  style={{ width: '60%', animation: 'loading 1.5s ease-in-out infinite' }}
                />
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                <AlertCircle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('ai.suggestionError')}</p>
                <p className="text-muted-foreground mt-1 text-sm">{error}</p>
              </div>
              <button
                onClick={onRegenerate}
                className="flex items-center gap-2 rounded-xl bg-indigo-50 px-6 py-2.5 font-medium text-indigo-600 transition-all hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
              >
                <RefreshCw className="h-4 w-4" />
                {t('common.retry')}
              </button>
            </div>
          )}

          {/* Empty Suggestion State */}
          {!isLoading && !error && !hasAnySuggestion && (
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <ChefHat className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('ai.suggestionEmpty')}</p>
                <p className="text-muted-foreground mt-1 text-sm">{t('ai.suggestionEmptyHint')}</p>
              </div>
              <button
                onClick={onRegenerate}
                className="flex items-center gap-2 rounded-xl bg-indigo-50 px-6 py-2.5 font-medium text-indigo-600 transition-all hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
              >
                <RefreshCw className="h-4 w-4" />
                {t('ai.suggestionRegenerate')}
              </button>
            </div>
          )}

          {/* Suggestion Preview */}
          {!isLoading && !error && hasAnySuggestion && suggestion && (
            <>
              {/* Reasoning Card */}
              {suggestion.reasoning && (
                <div className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-50 to-purple-50 p-4 dark:border-indigo-800 dark:from-indigo-900/20 dark:to-purple-900/20">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                      <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-bold text-indigo-800 dark:text-indigo-300">{t('ai.reasoning')}</p>
                      <p className="text-sm leading-relaxed text-indigo-700 dark:text-indigo-400">
                        {suggestion.reasoning}
                      </p>
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
                        : 'border-slate-200 bg-slate-50 opacity-60 dark:border-slate-600 dark:bg-slate-700'
                    }`}
                  >
                    <div className="p-4">
                      {/* Header with checkbox and edit */}
                      <div className="mb-3 flex items-center justify-between">
                        <label className="flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMeal(type)}
                            className="text-primary focus:ring-ring h-5 w-5 rounded border-slate-300"
                          />
                          <span
                            className={`text-sm font-bold tracking-wider uppercase ${isSelected ? colors.text : 'text-slate-500 dark:text-slate-500'}`}
                          >
                            {(() => {
                              const Icon = MEAL_TYPE_ICONS[type];
                              return <Icon className="mr-1 inline-block size-4" aria-hidden="true" />;
                            })()}
                            {mealTypeLabels[type]}
                          </span>
                        </label>
                        <button
                          onClick={() => onEditMeal(type)}
                          disabled={!isSelected}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                            isSelected
                              ? 'text-slate-600 hover:bg-white/50 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-slate-100'
                              : 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                          }`}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          {t('common.change')}
                        </button>
                      </div>

                      {/* Dish names */}
                      <div className="mb-3 space-y-2">
                        {names.map(name => (
                          <div key={name} className="flex items-center gap-2">
                            <ChefHat className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-slate-300'}`} />
                            <span
                              className={`font-medium ${isSelected ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-500'}`}
                            >
                              {name}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Nutrition summary */}
                      <div
                        className={`border-t pt-3 ${isSelected ? 'border-slate-200/50 dark:border-slate-600/50' : 'border-slate-200 dark:border-slate-600'}`}
                      >
                        <div className="flex gap-4 text-sm">
                          <span
                            className={`font-bold ${isSelected ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-500'}`}
                          >
                            {nutrition.calories} kcal
                          </span>
                          <span
                            className={`font-bold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-500'}`}
                          >
                            {nutrition.protein}g protein
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Total Summary */}
              <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs font-bold uppercase">{t('ai.totalSelected')}</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {nutritionSummary.calories} kcal · {nutritionSummary.protein}g protein
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground mb-1 text-xs font-bold uppercase">{t('ai.targetLabel')}</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {targetCalories} kcal · {targetProtein}g protein
                    </p>
                  </div>
                </div>
                {/* Progress indicator */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-muted-foreground">{t('common.calories')}</span>
                      <span
                        className={`font-medium ${nutritionSummary.calories > targetCalories ? 'text-rose-600' : 'text-primary'}`}
                      >
                        {Math.round((nutritionSummary.calories / targetCalories) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
                      <div
                        className={`h-full rounded-full transition-all ${nutritionSummary.calories > targetCalories ? 'bg-rose-500' : 'bg-primary'}`}
                        style={{ width: `${Math.min(100, (nutritionSummary.calories / targetCalories) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-muted-foreground">{t('common.protein')}</span>
                      <span
                        className={`font-medium ${nutritionSummary.protein >= targetProtein ? 'text-primary' : 'text-amber-600'}`}
                      >
                        {Math.round((nutritionSummary.protein / targetProtein) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
                      <div
                        className={`h-full rounded-full transition-all ${nutritionSummary.protein >= targetProtein ? 'bg-primary' : 'bg-amber-500'}`}
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
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/50">
            <button
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 font-medium text-slate-600 transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {t('common.cancel')}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onRegenerate}
                className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 font-medium text-indigo-600 transition-all hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
              >
                <RefreshCw className="h-4 w-4" />
                <span>{t('ai.suggestionRegenerate')}</span>
              </button>
              <button
                onClick={() => onApply(selectedMeals)}
                disabled={!hasAnySelected}
                className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary flex items-center gap-2 rounded-xl px-6 py-2.5 font-bold shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
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
