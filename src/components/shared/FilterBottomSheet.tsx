import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FilterConfig } from '../../types';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
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

export const FilterBottomSheet = ({
  config,
  onChange,
  onClose,
}: FilterBottomSheetProps) => {
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
        className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md max-h-[70dvh] overflow-y-auto sm:mx-4"
      >
        <div className="px-5 pt-5 pb-4 space-y-5">
          {/* Sort section */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
              {t('filter.sortTitle')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map(opt => {
                const isActive = draft.sortBy === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSortChange(opt.value)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all min-h-11 ${
                      isActive
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
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
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
              {t('filter.filterTitle')}
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleMaxCalories(300)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all min-h-11 ${
                  draft.maxCalories === 300
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {t('filter.lessThan300')}
              </button>
              <button
                type="button"
                onClick={() => toggleMaxCalories(500)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all min-h-11 ${
                  draft.maxCalories === 500
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {t('filter.lessThan500')}
              </button>
              <button
                type="button"
                onClick={() => toggleMinProtein(20)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all min-h-11 ${
                  draft.minProtein === 20
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
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
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium text-sm min-h-11 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              {t('filter.reset')}
            </button>
            <button
              type="button"
              data-testid="filter-apply-btn"
              onClick={handleApply}
              className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm min-h-11 hover:bg-emerald-600 active:scale-[0.98] transition-all"
            >
              {t('filter.apply')}
            </button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
};
