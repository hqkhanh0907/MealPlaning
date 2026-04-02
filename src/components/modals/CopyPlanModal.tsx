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
        className="bg-card relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl shadow-xl sm:mx-4 sm:max-w-md sm:rounded-2xl"
        data-testid="copy-plan-modal"
      >
        <div className="border-border-subtle flex items-center justify-between border-b px-6 py-5 sm:px-8 sm:py-6">
          <div>
            <h3 className="text-foreground text-xl font-bold">{t('copyPlan.title')}</h3>
            <p className="text-muted-foreground text-sm">
              {formatDate(sourceDate, dateLocale)} — {t('copyPlan.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.closeDialog')}
            className="text-muted-foreground hover:bg-accent flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 transition-all"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-6 sm:p-8">
          {/* Source plan preview */}
          {sourcePreviewSections && (
            <div className="bg-muted rounded-xl p-4">
              <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                {t('copyPlan.sourcePreview')}
              </p>
              <div className="space-y-1.5">
                {sourcePreviewSections
                  .filter(s => s.items.length > 0)
                  .map(({ key, label, items, color }) => (
                    <div key={key} className="flex items-start gap-2">
                      <span className={`text-xs font-medium ${color} min-w-14`}>{label}:</span>
                      <div className="flex flex-wrap gap-1">
                        {items.map((item, idx) => (
                          <span
                            key={item.id}
                            className="text-foreground-secondary inline-flex items-center gap-0.5 text-xs"
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
              className="hover:border-primary hover:text-primary border-border text-foreground flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 font-medium transition-all active:scale-[0.98]"
            >
              {t('copyPlan.tomorrow')}
            </button>
            <button
              data-testid="btn-copy-week"
              onClick={handleWeek}
              className="hover:border-primary hover:text-primary border-border text-foreground flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 font-medium transition-all active:scale-[0.98]"
            >
              {t('copyPlan.thisWeek')}
            </button>
            <button
              onClick={handleCustom}
              className="hover:border-primary hover:text-primary border-border text-foreground flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 font-medium transition-all active:scale-[0.98]"
            >
              {t('copyPlan.custom')}
            </button>
          </div>

          {/* Copy mode toggle */}
          <div className="bg-muted flex items-center gap-2 rounded-xl p-3" data-testid="copy-mode-toggle">
            <button
              data-testid="btn-mode-overwrite"
              onClick={() => setMergeMode(false)}
              className={`min-h-10 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${mergeMode ? 'text-muted-foreground' : 'text-primary-emphasis bg-card shadow-sm dark:bg-slate-600'}`}
            >
              {t('copyPlan.overwriteMode')}
            </button>
            <button
              data-testid="btn-mode-merge"
              onClick={() => setMergeMode(true)}
              className={`min-h-10 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${mergeMode ? 'text-primary-emphasis bg-card shadow-sm dark:bg-slate-600' : 'text-muted-foreground'}`}
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
                className="text-foreground min-h-11 flex-1"
              />
              <Plus className="text-muted-foreground h-5 w-5" />
            </div>
          )}

          {/* Selected dates list */}
          {selectedDates.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
                {t('copyPlan.selectedDates')}
              </h4>
              <div className="space-y-1.5">
                {selectedDates.map(date => (
                  <div key={date} className="bg-primary-subtle flex items-center justify-between rounded-xl px-4 py-2">
                    <span className="text-primary-emphasis text-sm font-medium">{formatDate(date, dateLocale)}</span>
                    <button
                      onClick={() => handleRemoveDate(date)}
                      className="text-muted-foreground flex min-h-11 min-w-11 items-center justify-center rounded-lg p-1.5 transition-all hover:text-rose-500"
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
            <p className="text-muted-foreground py-4 text-center text-sm">{t('copyPlan.noSelection')}</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-border-subtle border-t px-6 py-4 sm:px-8">
          <button
            data-testid="btn-copy-confirm"
            onClick={handleConfirm}
            disabled={selectedDates.length === 0}
            className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy className="h-4 w-4" />
            {t('copyPlan.confirm')}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};
