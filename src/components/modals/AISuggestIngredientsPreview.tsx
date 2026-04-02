import { Check, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';

import { Ingredient, SuggestedDishIngredient } from '../../types';
import { getLocalizedField } from '../../utils/localize';

let _keyCounter = 0;
const nextKey = () => `ai-sug-${++_keyCounter}`;
import { ModalBackdrop } from '../shared/ModalBackdrop';

interface SelectedItem {
  suggestion: SuggestedDishIngredient;
  checked: boolean;
  amount: string;
  matchedIngredient: Ingredient | null;
}

export interface ConfirmedSuggestion {
  suggestion: SuggestedDishIngredient;
  amount: number;
  matchedIngredient: Ingredient | null;
}

interface AISuggestIngredientsPreviewProps {
  dishName: string;
  suggestions: SuggestedDishIngredient[];
  existingIngredients: Ingredient[];
  onConfirm: (selected: ConfirmedSuggestion[]) => void;
  onClose: () => void;
}

const fuzzyMatch = (aiName: string, ingredientName: string): boolean => {
  const a = aiName.toLowerCase().trim();
  const b = ingredientName.toLowerCase().trim();
  return a.includes(b) || b.includes(a);
};

export const AISuggestIngredientsPreview = ({
  dishName,
  suggestions,
  existingIngredients,
  onConfirm,
  onClose,
}: AISuggestIngredientsPreviewProps) => {
  const { t } = useTranslation();

  const [keys] = useState(() => suggestions.map(() => nextKey()));

  const [items, setItems] = useState<SelectedItem[]>(() =>
    suggestions.map(s => {
      const matched =
        existingIngredients.find(
          ing =>
            fuzzyMatch(s.name, getLocalizedField(ing.name, 'vi')) ||
            fuzzyMatch(s.name, getLocalizedField(ing.name, 'en')),
        ) ?? null;
      return { suggestion: s, checked: true, amount: String(s.amount), matchedIngredient: matched };
    }),
  );

  const selectedCount = useMemo(() => items.filter(i => i.checked).length, [items]);

  const handleToggle = (index: number) => {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item)));
  };

  const handleAmountChange = (index: number, value: string) => {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, amount: value } : item)));
  };

  const handleConfirm = () => {
    const selected = items
      .filter(item => item.checked)
      .map(item => ({
        suggestion: item.suggestion,
        amount: Math.round(Number.parseFloat(item.amount) || item.suggestion.amount),
        matchedIngredient: item.matchedIngredient,
      }));
    onConfirm(selected);
  };

  if (suggestions.length === 0) {
    return (
      <ModalBackdrop onClose={onClose} zIndex="z-70">
        <div className="bg-card relative w-full rounded-t-2xl p-6 shadow-xl sm:mx-4 sm:max-w-lg sm:rounded-2xl">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">
              ✨ {t('dish.aiSuggestTitle', { name: dishName })}
            </p>
            <button
              type="button"
              onClick={onClose}
              data-testid="btn-ai-suggest-close"
              aria-label={t('common.closeDialog')}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500" data-testid="ai-suggest-empty">
            {t('dish.aiSuggestEmpty')}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-500 transition-all hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {t('dish.aiSuggestCancel')}
          </button>
        </div>
      </ModalBackdrop>
    );
  }

  return (
    <ModalBackdrop onClose={onClose} zIndex="z-70">
      <div className="bg-card relative flex h-[85dvh] w-full flex-col overflow-hidden rounded-t-2xl shadow-xl sm:mx-4 sm:h-auto sm:max-h-[85dvh] sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-700">
          <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">
            ✨ {t('dish.aiSuggestTitle', { name: dishName })}
          </p>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-ai-suggest-close"
            aria-label={t('common.closeDialog')}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto overscroll-contain p-4">
          {items.map((item, index) => (
            <div
              key={keys[index]}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-700/50"
              data-testid={`ai-suggest-item-${index}`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggle(index)}
                  data-testid={`ai-suggest-checkbox-${index}`}
                  aria-label={`${item.checked ? t('common.deselect') : t('common.select')} ${item.suggestion.name}`}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${item.checked ? 'border-primary bg-primary text-primary-foreground' : 'border-slate-300 dark:border-slate-500'}`}
                >
                  {item.checked && <Check className="h-4 w-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                      {item.suggestion.name}
                    </span>
                    {item.matchedIngredient ? (
                      <span
                        className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                        data-testid={`ai-suggest-badge-existing-${index}`}
                      >
                        {t('dish.aiSuggestExisting')}
                      </span>
                    ) : (
                      <span
                        className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                        data-testid={`ai-suggest-badge-new-${index}`}
                      >
                        {t('dish.aiSuggestNew')}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                    {Math.round(item.suggestion.calories)}cal · {Math.round(item.suggestion.protein)}g pro ·{' '}
                    {Math.round(item.suggestion.carbs)}g carb · {Math.round(item.suggestion.fat)}g fat
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={item.amount}
                    onChange={e => handleAmountChange(index, e.target.value)}
                    data-testid={`ai-suggest-amount-${index}`}
                    aria-label={`${t('ingredient.quantity')} ${item.suggestion.name}`}
                    className="w-16 text-center"
                  />
                  <span className="text-xs text-slate-400 dark:text-slate-500">{item.suggestion.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-t border-slate-100 p-4 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-ai-suggest-cancel"
            className="text-muted-foreground flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-medium transition-all hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {t('dish.aiSuggestCancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            data-testid="btn-ai-suggest-confirm"
            className="bg-primary text-primary-foreground hover:bg-primary flex flex-[2] items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check className="h-4 w-4" /> {t('dish.aiSuggestConfirm', { count: selectedCount })}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};
