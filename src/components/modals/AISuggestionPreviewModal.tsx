import { AlertCircle, CheckCircle2, ChefHat, Edit3, RefreshCw, Sparkles, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getMealTypeLabels, MEAL_TYPE_ICON_COLORS, MEAL_TYPE_ICONS } from '../../data/constants';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { Dish, Ingredient, MealPlanSuggestion, MealType, SupportedLang } from '../../types';
import { getLocalizedField } from '../../utils/localize';
import { calculateDishesNutrition } from '../../utils/nutrition';
import { DisabledReason } from '../shared/DisabledReason';
import { ModalBackdrop } from '../shared/ModalBackdrop';

const MEAL_TYPE_COLORS: Record<MealType, { bg: string; border: string; text: string }> = {
  breakfast: {
    bg: 'bg-energy-subtle',
    border: 'border-warning/30',
    text: 'text-warning',
  },
  lunch: {
    bg: 'bg-macro-carbs-subtle',
    border: 'border-info/30',
    text: 'text-info',
  },
  dinner: {
    bg: 'bg-ai-subtle',
    border: 'border-ai/30',
    text: 'text-ai',
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
        <div className="border-border-subtle bg-ai-subtle flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-ai-subtle flex h-10 w-10 items-center justify-center rounded-xl">
              <Sparkles className="text-ai h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-foreground text-lg font-semibold">{t('ai.suggestionTitle')}</h3>
              <p className="text-muted-foreground text-xs">{t('ai.suggestionDesc')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.closeDialog')}
            className="dark:text-muted-foreground text-muted-foreground hover:bg-card/50 rounded-full p-2 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain p-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-4 py-16">
              <div className="bg-ai-subtle flex h-16 w-16 animate-pulse items-center justify-center rounded-full">
                <Sparkles className="text-ai h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-foreground text-lg font-semibold">{t('ai.suggestionLoading')}</p>
                <p className="text-muted-foreground mt-1 text-sm">{t('ai.suggestionLoadingHint')}</p>
              </div>
              <div className="bg-muted h-2 w-48 overflow-hidden rounded-full">
                <div className="animate-loading-bar bg-ai h-full w-3/5 rounded-full" />
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <div className="bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-full">
                <AlertCircle className="text-destructive h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-foreground text-lg font-semibold">{t('ai.suggestionError')}</p>
                <p className="text-muted-foreground mt-1 text-sm">{error}</p>
              </div>
              <button
                onClick={onRegenerate}
                className="bg-ai-subtle text-ai hover:bg-ai/15 flex items-center gap-2 rounded-xl px-6 py-2.5 font-medium transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                {t('common.retry')}
              </button>
            </div>
          )}

          {/* Empty Suggestion State */}
          {!isLoading && !error && !hasAnySuggestion && (
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <div className="bg-warning/15 flex h-16 w-16 items-center justify-center rounded-full">
                <ChefHat className="text-warning h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-foreground text-lg font-semibold">{t('ai.suggestionEmpty')}</p>
                <p className="text-muted-foreground mt-1 text-sm">{t('ai.suggestionEmptyHint')}</p>
              </div>
              <button
                onClick={onRegenerate}
                className="bg-ai-subtle text-ai hover:bg-ai/15 flex items-center gap-2 rounded-xl px-6 py-2.5 font-medium transition-all"
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
                <div className="border-ai/30 bg-ai-subtle rounded-2xl border p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-ai-subtle mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                      <Sparkles className="text-ai h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-ai mb-1 text-sm font-semibold">{t('ai.reasoning')}</p>
                      <p className="text-ai text-sm leading-relaxed">{suggestion.reasoning}</p>
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
                      isSelected ? `${colors.bg} ${colors.border}` : 'border-border bg-muted opacity-60'
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
                            className="text-primary focus:ring-ring border-border h-5 w-5 rounded"
                          />
                          <span
                            className={`text-sm font-semibold tracking-wider uppercase ${isSelected ? colors.text : 'text-muted-foreground'}`}
                          >
                            {(() => {
                              const Icon = MEAL_TYPE_ICONS[type];
                              return (
                                <Icon
                                  className={`mr-1 inline-block size-4 ${MEAL_TYPE_ICON_COLORS[type]}`}
                                  aria-hidden="true"
                                />
                              );
                            })()}
                            {mealTypeLabels[type]}
                          </span>
                        </label>
                        <button
                          onClick={() => onEditMeal(type)}
                          disabled={!isSelected}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                            isSelected
                              ? 'text-foreground-secondary hover:bg-card/50 hover:text-foreground'
                              : 'text-muted-foreground cursor-not-allowed'
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
                            <ChefHat className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={`font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {name}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Nutrition summary */}
                      <div className={`border-t pt-3 ${isSelected ? 'border-border/50' : 'border-border'}`}>
                        <div className="flex gap-4 text-sm">
                          <span className={`font-semibold ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {nutrition.calories} kcal
                          </span>
                          <span className={`font-semibold ${isSelected ? 'text-info' : 'text-muted-foreground'}`}>
                            {nutrition.protein}g protein
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Total Summary */}
              <div className="bg-muted rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase">
                      {t('ai.totalSelected')}
                    </p>
                    <p className="text-foreground text-lg font-semibold">
                      {nutritionSummary.calories} kcal · {nutritionSummary.protein}g protein
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase">{t('ai.targetLabel')}</p>
                    <p className="text-foreground-secondary text-sm font-medium">
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
                        className={`font-medium ${nutritionSummary.calories > targetCalories ? 'text-destructive' : 'text-primary'}`}
                      >
                        {targetCalories > 0 ? Math.round((nutritionSummary.calories / targetCalories) * 100) : 0}%
                      </span>
                    </div>
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div
                        className={`h-full rounded-full transition-all ${nutritionSummary.calories > targetCalories ? 'bg-destructive' : 'bg-primary'}`}
                        style={{
                          width: `${targetCalories > 0 ? Math.min(100, (nutritionSummary.calories / targetCalories) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-muted-foreground">{t('common.protein')}</span>
                      <span
                        className={`font-medium ${nutritionSummary.protein >= targetProtein ? 'text-primary' : 'text-warning'}`}
                      >
                        {targetProtein > 0 ? Math.round((nutritionSummary.protein / targetProtein) * 100) : 0}%
                      </span>
                    </div>
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div
                        className={`h-full rounded-full transition-all ${nutritionSummary.protein >= targetProtein ? 'bg-primary' : 'bg-warning'}`}
                        style={{
                          width: `${targetProtein > 0 ? Math.min(100, (nutritionSummary.protein / targetProtein) * 100) : 0}%`,
                        }}
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
          <div className="border-border-subtle bg-muted flex flex-col gap-2 border-t px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onClose}
                className="text-foreground-secondary hover:bg-accent rounded-xl px-5 py-2.5 font-medium transition-all"
              >
                {t('common.cancel')}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={onRegenerate}
                  className="bg-ai-subtle text-ai hover:bg-ai/15 flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium transition-all"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>{t('ai.suggestionRegenerate')}</span>
                </button>
                <button
                  onClick={() => onApply(selectedMeals)}
                  disabled={!hasAnySelected}
                  aria-describedby={hasAnySelected ? undefined : 'ai-apply-disabled-reason'}
                  className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary flex items-center gap-2 rounded-xl px-6 py-2.5 font-semibold shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {t('common.apply')}
                </button>
              </div>
            </div>
            <DisabledReason
              id="ai-apply-disabled-reason"
              reason={t('disabledReason.selectMeal')}
              show={!hasAnySelected}
              className="text-center"
            />
          </div>
        )}
      </div>
    </ModalBackdrop>
  );
};
