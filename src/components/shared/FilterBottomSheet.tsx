import React from 'react';
import { useTranslation } from 'react-i18next';

import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import type { FilterConfig } from '../../types';
import { ModalBackdrop } from '../shared/ModalBackdrop';

interface FilterBottomSheetProps {
  config: FilterConfig;
  onChange: (config: FilterConfig) => void;
  onClose: () => void;
}

type SortOption = FilterConfig['sortBy'];

const SORT_OPTIONS: { value: SortOption; labelKey: string }[] = [
  { value: 'name-asc', labelKey: 'sort.nameAsc' },
  { value: 'name-desc', labelKey: 'sort.nameDesc' },
  { value: 'cal-asc', labelKey: 'sort.calAsc' },
  { value: 'cal-desc', labelKey: 'sort.calDesc' },
  { value: 'pro-asc', labelKey: 'sort.proAsc' },
  { value: 'pro-desc', labelKey: 'sort.proDesc' },
];

const DEFAULT_CONFIG: FilterConfig = { sortBy: 'name-asc' };

export const FilterBottomSheet = ({ config, onChange, onClose }: FilterBottomSheetProps) => {
  const { t } = useTranslation();
  const [draft, setDraft] = React.useState<FilterConfig>(config);

  useModalBackHandler(true, onClose);

  const handleSortChange = (value: SortOption) => {
    setDraft(prev => ({ ...prev, sortBy: value }));
  };

  const toggleMaxCalories = (value: number) => {
    setDraft(prev => ({
      ...prev,
      maxCalories: prev.maxCalories === value ? undefined : value,
    }));
  };

  const toggleMinProtein = (value: number) => {
    setDraft(prev => ({
      ...prev,
      minProtein: prev.minProtein === value ? undefined : value,
    }));
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_CONFIG });
  };

  const handleApply = () => {
    onChange(draft);
    onClose();
  };

  return (
    <ModalBackdrop onClose={onClose} zIndex="z-60">
      <div
        data-testid="filter-bottom-sheet"
        className="relative max-h-[70dvh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:mx-4 sm:max-w-md sm:rounded-2xl dark:bg-slate-800"
      >
        <div className="space-y-5 px-5 pt-5 pb-4">
          {/* Sort section */}
          <div>
            <h4 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">{t('filter.sortTitle')}</h4>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map(opt => {
                const isActive = draft.sortBy === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSortChange(opt.value)}
                    className={`min-h-11 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {t(opt.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick filter section */}
          <div>
            <h4 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">{t('filter.filterTitle')}</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleMaxCalories(300)}
                className={`min-h-11 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                  draft.maxCalories === 300
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {t('filter.lessThan300')}
              </button>
              <button
                type="button"
                onClick={() => toggleMaxCalories(500)}
                className={`min-h-11 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                  draft.maxCalories === 500
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {t('filter.lessThan500')}
              </button>
              <button
                type="button"
                onClick={() => toggleMinProtein(20)}
                className={`min-h-11 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                  draft.minProtein === 20
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {t('filter.highProtein')}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              data-testid="filter-reset-btn"
              onClick={handleReset}
              className="min-h-11 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {t('filter.reset')}
            </button>
            <button
              type="button"
              data-testid="filter-apply-btn"
              onClick={handleApply}
              className="min-h-11 flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-600 active:scale-[0.98]"
            >
              {t('filter.apply')}
            </button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
};
