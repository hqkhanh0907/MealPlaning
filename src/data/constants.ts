import { TFunction } from 'i18next';
import { MealType } from '../types';

/** i18n-aware meal tag options factory — single source of truth. */
export const getMealTagOptions = (t: TFunction): { type: MealType; label: string; icon: string }[] => [
  { type: 'breakfast', label: t('meal.breakfast'), icon: '🌅' },
  { type: 'lunch', label: t('meal.lunch'), icon: '🌤️' },
  { type: 'dinner', label: t('meal.dinner'), icon: '🌙' },
];

/** i18n-aware meal type labels factory — single source of truth. */
export const getMealTypeLabels = (t: TFunction): Record<MealType, string> => ({
  breakfast: t('meal.breakfastFull'),
  lunch: t('meal.lunchFull'),
  dinner: t('meal.dinnerFull'),
});

/** i18n-aware tag short labels factory — single source of truth. */
export const getTagShortLabels = (t: TFunction): Record<MealType, string> => ({
  breakfast: t('meal.breakfastShort'),
  lunch: t('meal.lunchShort'),
  dinner: t('meal.dinnerShort'),
});

/** Meal type icons — emoji values don't need i18n. */
export const MEAL_TYPE_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '🌤️',
  dinner: '🌙',
};

// --- Sort options shared by DishManager & IngredientManager ---

/** Base sort values common to all item managers. */
export type BaseSortOption = 'name-asc' | 'name-desc' | 'cal-asc' | 'cal-desc' | 'pro-asc' | 'pro-desc';

/** i18n-aware base sort options factory — single source of truth. */
export const getBaseSortOptions = (t: TFunction): { value: BaseSortOption; label: string }[] => [
  { value: 'name-asc', label: t('sort.nameAsc') },
  { value: 'name-desc', label: t('sort.nameDesc') },
  { value: 'cal-asc', label: t('sort.calAsc') },
  { value: 'cal-desc', label: t('sort.calDesc') },
  { value: 'pro-asc', label: t('sort.proAsc') },
  { value: 'pro-desc', label: t('sort.proDesc') },
];

// --- Shared UI timing constants ---

/** Duration (ms) for undo toast notifications after delete actions. */
export const UNDO_TOAST_DURATION_MS = 6000;
