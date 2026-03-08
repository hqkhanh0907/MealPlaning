import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check } from 'lucide-react';
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

export const AISuggestIngredientsPreview: React.FC<AISuggestIngredientsPreviewProps> = ({
  dishName, suggestions, existingIngredients, onConfirm, onClose,
}) => {
  const { t } = useTranslation();

  const [keys] = useState(() => suggestions.map(() => nextKey()));

  const [items, setItems] = useState<SelectedItem[]>(() =>
    suggestions.map(s => {
      const matched = existingIngredients.find(ing =>
        fuzzyMatch(s.name, getLocalizedField(ing.name, 'vi')) ||
        fuzzyMatch(s.name, getLocalizedField(ing.name, 'en'))
      ) ?? null;
      return { suggestion: s, checked: true, amount: String(s.amount), matchedIngredient: matched };
    })
  );

  const selectedCount = useMemo(() => items.filter(i => i.checked).length, [items]);

  const handleToggle = (index: number) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, checked: !item.checked } : item));
  };

  const handleAmountChange = (index: number, value: string) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, amount: value } : item));
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
        <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-lg p-6 sm:mx-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">✨ {t('dish.aiSuggestTitle', { name: dishName })}</p>
            <button type="button" onClick={onClose} data-testid="btn-ai-suggest-close" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8" data-testid="ai-suggest-empty">{t('dish.aiSuggestEmpty')}</p>
          <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">{t('dish.aiSuggestCancel')}</button>
        </div>
      </ModalBackdrop>
    );
  }

  return (
    <ModalBackdrop onClose={onClose} zIndex="z-70">
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-lg h-[85dvh] sm:h-auto sm:max-h-[85dvh] overflow-hidden flex flex-col sm:mx-4">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">✨ {t('dish.aiSuggestTitle', { name: dishName })}</p>
          <button type="button" onClick={onClose} data-testid="btn-ai-suggest-close" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-2">
          {items.map((item, index) => (
            <div key={keys[index]} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-200 dark:border-slate-600" data-testid={`ai-suggest-item-${index}`}>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggle(index)}
                  data-testid={`ai-suggest-checkbox-${index}`}
                  className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-500'}`}
                >
                  {item.checked && <Check className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{item.suggestion.name}</span>
                    {item.matchedIngredient ? (
                      <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-medium" data-testid={`ai-suggest-badge-existing-${index}`}>{t('dish.aiSuggestExisting')}</span>
                    ) : (
                      <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-medium" data-testid={`ai-suggest-badge-new-${index}`}>{t('dish.aiSuggestNew')}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {Math.round(item.suggestion.calories)}cal · {Math.round(item.suggestion.protein)}g pro · {Math.round(item.suggestion.carbs)}g carb · {Math.round(item.suggestion.fat)}g fat
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={item.amount}
                    onChange={e => handleAmountChange(index, e.target.value)}
                    data-testid={`ai-suggest-amount-${index}`}
                    className="w-16 px-2 py-1 text-sm text-center rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all"
                  />
                  <span className="text-xs text-slate-400 dark:text-slate-500">{item.suggestion.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
          <button type="button" onClick={onClose} data-testid="btn-ai-suggest-cancel" className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
            {t('dish.aiSuggestCancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            data-testid="btn-ai-suggest-confirm"
            className="flex-[2] py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" /> {t('dish.aiSuggestConfirm', { count: selectedCount })}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};
