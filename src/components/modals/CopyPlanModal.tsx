import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Copy, Plus, Trash2 } from 'lucide-react';
import { DayPlan } from '../../types';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { parseLocalDate } from '../../utils/helpers';

interface CopyPlanModalProps {
  sourceDate: string;
  sourcePlan: DayPlan;
  onCopy: (targetDates: string[]) => void;
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

export const CopyPlanModal: React.FC<CopyPlanModalProps> = ({ sourceDate, onCopy, onClose }) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  useModalBackHandler(true, onClose);

  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);

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
      setSelectedDates(prev => [...prev, date].sort());
    }
    e.target.value = '';
  }, [sourceDate, selectedDates]);

  const handleRemoveDate = useCallback((date: string) => {
    setSelectedDates(prev => prev.filter(d => d !== date));
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedDates.length > 0) {
      onCopy(selectedDates);
    }
  }, [selectedDates, onCopy]);

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
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 transition-all min-h-11 min-w-11 flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-5 overflow-y-auto">
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

          {/* Custom date input */}
          {showCustomInput && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                onChange={handleAddDate}
                min={addDays(sourceDate, 1)}
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
