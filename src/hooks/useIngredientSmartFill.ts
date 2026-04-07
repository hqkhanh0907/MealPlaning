import { useCallback, useState } from 'react';

import { useIngredientStore } from '@/store/ingredientStore';

import type { Ingredient } from '../types';

interface SmartFillResult {
  /** Try to match name against existing ingredients. Returns matched ingredient or null. */
  findMatch: (name: string) => Ingredient | null;
  /** Whether the last fill came from the local database */
  isAutoFilled: boolean;
  /** Mark as auto-filled (called after successful store match) */
  setAutoFilled: (value: boolean) => void;
  /** Timestamp of last auto-fill for highlight animation */
  autoFillTimestamp: number;
}

/**
 * Hook to auto-populate nutrition fields from existing ingredients in the store.
 * Searches for exact name match (case-insensitive, trimmed) before falling back to AI.
 *
 * @param excludeId - Ingredient ID to exclude from matching (for edit mode)
 */
export function useIngredientSmartFill(excludeId?: string): SmartFillResult {
  const ingredients = useIngredientStore(s => s.ingredients);
  const [isAutoFilled, setAutoFilled] = useState(false);
  const [autoFillTimestamp, setAutoFillTimestamp] = useState(0);

  const findMatch = useCallback(
    (name: string): Ingredient | null => {
      const trimmed = name.trim().toLowerCase();
      if (!trimmed) return null;

      const match =
        ingredients.find(ing => ing.id !== excludeId && ing.name.vi.trim().toLowerCase() === trimmed) ?? null;

      if (match) {
        setAutoFilled(true);
        setAutoFillTimestamp(Date.now());
      }

      return match;
    },
    [excludeId, ingredients],
  );

  return { findMatch, isAutoFilled, setAutoFilled, autoFillTimestamp };
}
