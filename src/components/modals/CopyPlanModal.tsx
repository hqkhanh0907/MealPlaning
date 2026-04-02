import { ChefHat, Copy, Plus, Trash2, X } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';

import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { DayPlan, Dish, SupportedLang } from '../../types';
import { parseLocalDate } from '../../utils/helpers';
import { getLocalizedField } from '../../utils/localize';
import { ModalBackdrop } from '../shared/ModalBackdrop';

interface CopyPlanModalProps {
  sourceDate: string;
  sourcePlan: DayPlan;
  dishes: Dish[];
  onCopy: (targetDates: string[], mergeMode: boolean) => void;
  onClose: () => void;
}

const formatDate = (dateStr: string, locale: string): string =>
  parseLocalDate(dateStr).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'numeric' });

const addDays = (dateStr: string, days: number): string => {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const CopyPlanModal = ({ sourceDate, sourcePlan, dishes, onCopy, onClose }: CopyPlanModalProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;
  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  useModalBackHandler(true, onClose);

  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [mergeMode, setMergeMode] = useState(false);

  const tomorrowDate = useMemo(() => addDays(sourceDate, 1), [sourceDate]);

  const handleTomorrow = useCallback(() => {
    setSelectedDates([tomorrowDate]);
    setShowCustomInput(false);
  }, [tomorrowDate]);

  const handleWeek = useCallback(() => {
    const dates: string[] = [];
    for (let i = 1; i <= 6; i++) {
      dates.push(addDays(sourceDate, i));
    }
    setSelectedDates(dates);
    setShowCustomInput(false);
  }, [sourceDate]);

  const handleCustom = useCallback(() => {
    setShowCustomInput(true);
  }, []);

  const handleAddDate = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const date = e.target.value;
      if (date && date !== sourceDate && !selectedDates.includes(date)) {
        setSelectedDates(prev => [...prev, date].sort((a, b) => a.localeCompare(b)));
      }
      e.target.value = '';
    },
    [sourceDate, selectedDates],
  );

  const handleRemoveDate = useCallback((date: string) => {
    setSelectedDates(prev => prev.filter(d => d !== date));
  }, []);

  const getDishInfo = useCallback(
    (ids: string[]): { id: string; name: string }[] =>
      ids
        .map(id => dishes.find(d => d.id === id))
        .filter(Boolean)
        .map(d => ({ id: d!.id, name: getLocalizedField(d!.name, lang) })),
    [dishes, lang],
  );

  const sourcePreviewSections = useMemo(() => {
    const breakfast = getDishInfo(sourcePlan.breakfastDishIds);
    const lunch = getDishInfo(sourcePlan.lunchDishIds);
    const dinner = getDishInfo(sourcePlan.dinnerDishIds);
    const total = breakfast.length + lunch.length + dinner.length;
    if (total === 0) return null;

    return [
      { key: 'b', label: t('calendar.morning'), items: breakfast, color: 'text-amber-600 dark:text-amber-400' },
      { key: 'l', label: t('calendar.afternoon'), items: lunch, color: 'text-blue-600 dark:text-blue-400' },
      { key: 'd', label: t('calendar.evening'), items: dinner, color: 'text-indigo-600 dark:text-indigo-400' },
    ];
  }, [getDishInfo, sourcePlan, t]);

  const handleConfirm = useCallback(() => {
    if (selectedDates.length > 0) {
      onCopy(selectedDates, mergeMode);
    }
  }, [selectedDates, onCopy, mergeMode]);

  return (
    <ModalBackdrop onClose={onClose}>
      <div
        className="relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:mx-4 sm:max-w-md sm:rounded-3xl dark:bg-slate-800"
        data-testid="copy-plan-modal"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-8 sm:py-6 dark:border-slate-700">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('copyPlan.title')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {formatDate(sourceDate, dateLocale)} — {t('copyPlan.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.closeDialog')}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-6 sm:p-8">
          {/* Source plan preview */}
          {sourcePreviewSections && (
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700/50">
              <p className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                {t('copyPlan.sourcePreview')}
              </p>
              <div className="space-y-1.5">
                {sourcePreviewSections
                  .filter(s => s.items.length > 0)
                  .map(({ key, label, items, color }) => (
                    <div key={key} className="flex items-start gap-2">
                      <span className={`text-xs font-bold ${color} min-w-14`}>{label}:</span>
                      <div className="flex flex-wrap gap-1">
                        {items.map((item, idx) => (
                          <span
                            key={item.id}
                            className="inline-flex items-center gap-0.5 text-xs text-slate-600 dark:text-slate-300"
                          >
                            <ChefHat className="h-3 w-3" />
                            {item.name}
                            {idx < items.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Quick select buttons */}
          <div className="flex gap-2">
            <button
              data-testid="btn-copy-tomorrow"
              onClick={handleTomorrow}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-4 py-2.5 font-medium text-slate-700 transition-all hover:border-emerald-500 hover:text-emerald-600 active:scale-[0.98] dark:border-slate-600 dark:text-slate-300 dark:hover:text-emerald-400"
            >
              {t('copyPlan.tomorrow')}
            </button>
            <button
              data-testid="btn-copy-week"
              onClick={handleWeek}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-4 py-2.5 font-medium text-slate-700 transition-all hover:border-emerald-500 hover:text-emerald-600 active:scale-[0.98] dark:border-slate-600 dark:text-slate-300 dark:hover:text-emerald-400"
            >
              {t('copyPlan.thisWeek')}
            </button>
            <button
              onClick={handleCustom}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-4 py-2.5 font-medium text-slate-700 transition-all hover:border-emerald-500 hover:text-emerald-600 active:scale-[0.98] dark:border-slate-600 dark:text-slate-300 dark:hover:text-emerald-400"
            >
              {t('copyPlan.custom')}
            </button>
          </div>

          {/* Copy mode toggle */}
          <div
            className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-700/50"
            data-testid="copy-mode-toggle"
          >
            <button
              data-testid="btn-mode-overwrite"
              onClick={() => setMergeMode(false)}
              className={`min-h-10 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${mergeMode ? 'text-slate-500 dark:text-slate-400' : 'bg-white text-emerald-700 shadow-sm dark:bg-slate-600 dark:text-emerald-400'}`}
            >
              {t('copyPlan.overwriteMode')}
            </button>
            <button
              data-testid="btn-mode-merge"
              onClick={() => setMergeMode(true)}
              className={`min-h-10 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${mergeMode ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {t('copyPlan.mergeMode')}
            </button>
          </div>

          {/* Custom date input */}
          {showCustomInput && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                onChange={handleAddDate}
                min={addDays(sourceDate, 1)}
                aria-label={t('copyPlan.selectDate')}
                className="min-h-11 flex-1 text-slate-800"
              />
              <Plus className="h-5 w-5 text-slate-400" />
            </div>
          )}

          {/* Selected dates list */}
          {selectedDates.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                {t('copyPlan.selectedDates')}
              </h4>
              <div className="space-y-1.5">
                {selectedDates.map(date => (
                  <div
                    key={date}
                    className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2 dark:bg-emerald-900/20"
                  >
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      {formatDate(date, dateLocale)}
                    </span>
                    <button
                      onClick={() => handleRemoveDate(date)}
                      className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-1.5 text-slate-400 transition-all hover:text-rose-500"
                      aria-label={t('copyPlan.remove')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedDates.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">{t('copyPlan.noSelection')}</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 sm:px-8 dark:border-slate-700">
          <button
            data-testid="btn-copy-confirm"
            onClick={handleConfirm}
            disabled={selectedDates.length === 0}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-bold text-white shadow-sm shadow-emerald-200 transition-all hover:bg-emerald-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy className="h-4 w-4" />
            {t('copyPlan.confirm')}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};
