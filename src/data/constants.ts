import { TFunction } from 'i18next';
import type { LucideIcon } from 'lucide-react';
import { Moon, Sun, Sunrise } from 'lucide-react';

import { MealType } from '../types';

/** i18n-aware meal tag options factory — single source of truth. */
export const getMealTagOptions = (t: TFunction): { type: MealType; label: string; icon: LucideIcon }[] => [
  { type: 'breakfast', label: t('meal.breakfast'), icon: Sunrise },
  { type: 'lunch', label: t('meal.lunch'), icon: Sun },
  { type: 'dinner', label: t('meal.dinner'), icon: Moon },
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

/** Meal type icons — Lucide component references, no i18n needed. */
export const MEAL_TYPE_ICONS: Record<MealType, LucideIcon> = {
  breakfast: Sunrise,
  lunch: Sun,
  dinner: Moon,
};

/** Semantic colors for meal type icons. */
export const MEAL_TYPE_ICON_COLORS: Record<MealType, string> = {
  breakfast: 'text-energy',
  lunch: 'text-energy',
  dinner: 'text-info',
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
