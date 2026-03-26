import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Copy, Plus, Trash2, ChefHat } from 'lucide-react';
import { DayPlan, Dish, SupportedLang } from '../../types';
import { getLocalizedField } from '../../utils/localize';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { parseLocalDate } from '../../utils/helpers';

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

export const CopyPlanModal: React.FC<CopyPlanModalProps> = ({ sourceDate, sourcePlan, dishes, onCopy, onClose }) => {
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

  const handleAddDate = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    if (date && date !== sourceDate && !selectedDates.includes(date)) {
      setSelectedDates(prev => [...prev, date].sort((a, b) => a.localeCompare(b)));
    }
    e.target.value = '';
  }, [sourceDate, selectedDates]);

  const handleRemoveDate = useCallback((date: string) => {
    setSelectedDates(prev => prev.filter(d => d !== date));
  }, []);

  const getDishInfo = useCallback((ids: string[]): { id: string; name: string }[] =>
    ids.map(id => dishes.find(d => d.id === id))
      .filter(Boolean)
      .map(d => ({ id: d!.id, name: getLocalizedField(d!.name, lang) })),
  [dishes, lang]);

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
        className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md overflow-hidden flex flex-col max-h-[90dvh] sm:mx-4"
        data-testid="copy-plan-modal"
      >
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('copyPlan.title')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {formatDate(sourceDate, dateLocale)} — {t('copyPlan.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.closeDialog')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 transition-all min-h-11 min-w-11 flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-5 overflow-y-auto">
          {/* Source plan preview */}
          {sourcePreviewSections && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('copyPlan.sourcePreview')}</p>
              <div className="space-y-1.5">
                {sourcePreviewSections.filter(s => s.items.length > 0).map(({ key, label, items, color }) => (
                  <div key={key} className="flex items-start gap-2">
                    <span className={`text-xs font-bold ${color} min-w-14`}>{label}:</span>
                    <div className="flex flex-wrap gap-1">
                      {items.map((item, idx) => (
                        <span key={item.id} className="inline-flex items-center gap-0.5 text-xs text-slate-600 dark:text-slate-300">
                          <ChefHat className="w-3 h-3" />{item.name}{idx < items.length - 1 ? ',' : ''}
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium border-2 transition-all min-h-11 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-[0.98]"
            >
              {t('copyPlan.tomorrow')}
            </button>
            <button
              data-testid="btn-copy-week"
              onClick={handleWeek}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium border-2 transition-all min-h-11 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-[0.98]"
            >
              {t('copyPlan.thisWeek')}
            </button>
            <button
              onClick={handleCustom}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium border-2 transition-all min-h-11 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-[0.98]"
            >
              {t('copyPlan.custom')}
            </button>
          </div>

          {/* Copy mode toggle */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3" data-testid="copy-mode-toggle">
            <button
              data-testid="btn-mode-overwrite"
              onClick={() => setMergeMode(false)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all min-h-10 ${mergeMode ? 'text-slate-500 dark:text-slate-400' : 'bg-white dark:bg-slate-600 text-emerald-700 dark:text-emerald-400 shadow-sm'}`}
            >
              {t('copyPlan.overwriteMode')}
            </button>
            <button
              data-testid="btn-mode-merge"
              onClick={() => setMergeMode(true)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all min-h-10 ${mergeMode ? 'bg-white dark:bg-slate-600 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {t('copyPlan.mergeMode')}
            </button>
          </div>

          {/* Custom date input */}
          {showCustomInput && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                onChange={handleAddDate}
                min={addDays(sourceDate, 1)}
                aria-label={t('copyPlan.selectDate')}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 min-h-11"
              />
              <Plus className="w-5 h-5 text-slate-400" />
            </div>
          )}

          {/* Selected dates list */}
          {selectedDates.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('copyPlan.selectedDates')}
              </h4>
              <div className="space-y-1.5">
                {selectedDates.map(date => (
                  <div key={date} className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl">
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      {formatDate(date, dateLocale)}
                    </span>
                    <button
                      onClick={() => handleRemoveDate(date)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-all min-h-11 min-w-11 flex items-center justify-center"
                      aria-label={t('copyPlan.remove')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedDates.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
              {t('copyPlan.noSelection')}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-slate-700">
          <button
            data-testid="btn-copy-confirm"
            onClick={handleConfirm}
            disabled={selectedDates.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-12"
          >
            <Copy className="w-4 h-4" />
            {t('copyPlan.confirm')}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};
