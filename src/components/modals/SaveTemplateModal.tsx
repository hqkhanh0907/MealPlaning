import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, ChefHat } from 'lucide-react';
import { DayPlan, Dish, SupportedLang } from '../../types';
import { getLocalizedField } from '../../utils/localize';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from '../shared/ModalBackdrop';

interface SaveTemplateModalProps {
  currentPlan: DayPlan;
  dishes: Dish[];
  onSave: (name: string) => void;
  onClose: () => void;
}

const MAX_NAME_LENGTH = 100;

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({ currentPlan, dishes, onSave, onClose }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;
  useModalBackHandler(true, onClose);

  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);

  const trimmedName = name.trim();
  const isValid = trimmedName.length > 0;

  const getDishNames = useCallback((ids: string[]): string[] =>
    ids.map(id => dishes.find(d => d.id === id)).filter(Boolean).map(d => getLocalizedField(d!.name, lang)),
  [dishes, lang]);

  const preview = useMemo(() => ({
    breakfast: getDishNames(currentPlan.breakfastDishIds),
    lunch: getDishNames(currentPlan.lunchDishIds),
    dinner: getDishNames(currentPlan.dinnerDishIds),
  }), [currentPlan, getDishNames]);

  const totalDishes = preview.breakfast.length + preview.lunch.length + preview.dinner.length;

  const handleSubmit = useCallback(() => {
    setTouched(true);
    if (isValid) {
      onSave(trimmedName);
    }
  }, [isValid, trimmedName, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }, [handleSubmit]);

  const mealSections: { key: string; label: string; items: string[]; color: string }[] = [
    { key: 'breakfast', label: t('calendar.morning'), items: preview.breakfast, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
    { key: 'lunch', label: t('calendar.afternoon'), items: preview.lunch, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
    { key: 'dinner', label: t('calendar.evening'), items: preview.dinner, color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' },
  ];

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md overflow-hidden flex flex-col max-h-[90dvh] sm:mx-4" data-testid="save-template-modal">
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('template.saveTitle')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('template.saveSubtitle')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 transition-all min-h-11 min-w-11 flex items-center justify-center">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-5 overflow-y-auto">
          <div>
            <label htmlFor="template-name" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('template.saveName')}</label>
            <input
              id="template-name"
              data-testid="input-template-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => setTouched(true)}
              maxLength={MAX_NAME_LENGTH}
              placeholder={t('template.namePlaceholder')}
              autoFocus
              className={`w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all min-h-12 ${
                touched && !isValid
                  ? 'border-rose-300 dark:border-rose-600 focus:border-rose-500'
                  : 'border-slate-200 dark:border-slate-600 focus:border-emerald-500'
              } focus:outline-none`}
            />
            <div className="flex items-center justify-between mt-1.5">
              {touched && !isValid ? (
                <p className="text-xs text-rose-500 font-medium">{t('template.nameRequired')}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-slate-400 dark:text-slate-500">{name.length}/{MAX_NAME_LENGTH}</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              {t('template.preview')} — {t('template.mealsCount', { count: totalDishes })}
            </p>
            <div className="space-y-2">
              {mealSections.map(({ key, label, items, color }) => (
                <div key={key} className={`rounded-xl px-4 py-3 ${color}`}>
                  <p className="text-xs font-bold uppercase mb-1">{label}</p>
                  {items.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((name, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-sm font-medium">
                          <ChefHat className="w-3 h-3" /> {name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs opacity-60">{t('copyPlan.noMeals')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-slate-700">
          <button
            data-testid="btn-save-template"
            onClick={handleSubmit}
            disabled={touched && !isValid}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-12"
          >
            <Save className="w-4 h-4" />
            {t('template.save')}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};
