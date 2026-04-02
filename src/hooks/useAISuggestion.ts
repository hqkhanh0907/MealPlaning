import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useNotification } from '../contexts/NotificationContext';
import { suggestMealPlan } from '../services/geminiService';
import { applySuggestionToDayPlans } from '../services/planService';
import { AvailableDishInfo, DayPlan, Dish, Ingredient, MealPlanSuggestion, MealType } from '../types';
import { logger } from '../utils/logger';
import { calculateDishNutrition } from '../utils/nutrition';

interface UseAISuggestionParams {
  dishes: Dish[];
  ingredients: Ingredient[];
  targetCalories: number;
  targetProtein: number;
  selectedDate: string;
  setDayPlans: React.Dispatch<React.SetStateAction<DayPlan[]>>;
}

interface UseAISuggestionReturn {
  isModalOpen: boolean;
  suggestion: MealPlanSuggestion | null;
  error: string | null;
  isLoading: boolean;
  startSuggestion: () => void;
  regenerate: () => void;
  apply: (selectedMeals: { breakfast: boolean; lunch: boolean; dinner: boolean }) => void;
  editMeal: (type: MealType) => MealType;
  close: () => void;
}

// Extracted from App.tsx to reduce component size and eliminate duplication
export function useAISuggestion({
  dishes,
  ingredients,
  targetCalories,
  targetProtein,
  selectedDate,
  setDayPlans,
}: UseAISuggestionParams): UseAISuggestionReturn {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<MealPlanSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const notify = useNotification();
  const { t } = useTranslation();

  const buildAvailableDishes = useCallback(
    (): AvailableDishInfo[] =>
      dishes.map(d => {
        const n = calculateDishNutrition(d, ingredients);
        return {
          id: d.id,
          name: typeof d.name === 'object' ? d.name.vi : d.name,
          tags: d.tags,
          calories: Math.round(n.calories),
          protein: Math.round(n.protein),
        };
      }),
    [dishes, ingredients],
  );

  const fetchSuggestion = useCallback(
    async (openModal: boolean) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (openModal) setIsModalOpen(true);
      setSuggestion(null);
      setError(null);
      setIsLoading(true);

      try {
        const result = await suggestMealPlan(targetCalories, targetProtein, buildAvailableDishes(), controller.signal);
        if (!controller.signal.aborted) setSuggestion(result);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        logger.error({ component: 'useAISuggestion', action: 'fetchSuggestion' }, err);
        if (!controller.signal.aborted) {
          setError(t('notification.aiSuggestionError'));
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    },
    [targetCalories, targetProtein, buildAvailableDishes, t],
  );

  const startSuggestion = useCallback(() => {
    void fetchSuggestion(true);
  }, [fetchSuggestion]);
  const regenerate = useCallback(() => {
    void fetchSuggestion(false);
  }, [fetchSuggestion]);

  const apply = useCallback(
    (selectedMeals: { breakfast: boolean; lunch: boolean; dinner: boolean }) => {
      if (!suggestion) return;

      const filtered = {
        breakfastDishIds: selectedMeals.breakfast ? suggestion.breakfastDishIds : [],
        lunchDishIds: selectedMeals.lunch ? suggestion.lunchDishIds : [],
        dinnerDishIds: selectedMeals.dinner ? suggestion.dinnerDishIds : [],
        reasoning: suggestion.reasoning,
      };

      setDayPlans(prev => applySuggestionToDayPlans(prev, selectedDate, filtered));
      setIsModalOpen(false);
      setSuggestion(null);
      abortRef.current = null;
      notify.success(t('notification.aiSuggestionApplied'), t('notification.aiSuggestionAppliedDesc'));
    },
    [suggestion, selectedDate, setDayPlans, notify, t],
  );

  // Returns meal type so caller can open MealPlannerModal for manual editing
  const editMeal = useCallback((type: MealType): MealType => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsModalOpen(false);
    setIsLoading(false);
    return type;
  }, []);

  const close = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsModalOpen(false);
    setSuggestion(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    isModalOpen,
    suggestion,
    error,
    isLoading,
    startSuggestion,
    regenerate,
    apply,
    editMeal,
    close,
  };
}
