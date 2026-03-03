import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Utensils } from 'lucide-react';
import { MealType, DayPlan } from '../../types';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from '../shared/ModalBackdrop';

interface TypeSelectionModalProps {
  currentPlan: DayPlan;
  onSelectType: (type: MealType) => void;
  onClose: () => void;
}

export const TypeSelectionModal: React.FC<TypeSelectionModalProps> = ({ currentPlan, onSelectType, onClose }) => {
  const { t } = useTranslation();
  useModalBackHandler(true, onClose);

  const MEAL_OPTIONS: { type: MealType; planKey: keyof DayPlan; label: string; desc: string; colorClass: string }[] = [
    { type: 'breakfast', planKey: 'breakfastDishIds', label: t('meal.breakfastFull'), desc: t('typeSelection.breakfastDesc'), colorClass: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
    { type: 'lunch', planKey: 'lunchDishIds', label: t('meal.lunchFull'), desc: t('typeSelection.lunchDesc'), colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    { type: 'dinner', planKey: 'dinnerDishIds', label: t('meal.dinnerFull'), desc: t('typeSelection.dinnerDesc'), colorClass: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
  ];

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md overflow-hidden flex flex-col max-h-[90vh] sm:mx-4">
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('typeSelection.title')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('typeSelection.subtitle')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 sm:p-8 space-y-4">
          {MEAL_OPTIONS.map(({ type, planKey, label, desc, colorClass }) => {
            const dishCount = (currentPlan[planKey] as string[]).length;
            const isPlanned = dishCount > 0;
            return (
              <button
                key={type}
                data-testid={`btn-type-${type}`}
                onClick={() => onSelectType(type)}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group min-h-16 active:scale-[0.98] ${isPlanned ? 'border-emerald-500 bg-white dark:bg-slate-800' : 'border-slate-100 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${colorClass} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Utensils className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className={`font-bold text-lg ${isPlanned ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'}`}>{label}</p>
                    <p className={`text-sm ${isPlanned ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>{desc}</p>
                  </div>
                </div>
                {isPlanned && (
                  <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full shrink-0">
                    {dishCount} {t('common.item')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </ModalBackdrop>
  );
};
