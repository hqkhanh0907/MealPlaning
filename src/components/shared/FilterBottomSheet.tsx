import React from 'react';
import { useTranslation } from 'react-i18next';

import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import type { FilterConfig } from '../../types';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { buildStateDescription, createSurfaceStateContract } from './surfaceState';

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
  const titleId = React.useId();
  const sheetContract = createSurfaceStateContract({
    surface: 'overlay.filter-sheet',
    state: 'success',
    copy: {
      title: t('filter.sheetTitle'),
      missing: t('filter.sheetMissing'),
      reason: t('filter.sheetReason'),
      nextStep: t('filter.sheetNextStep'),
    },
  });

  useModalBackHandler(true, onClose);

  React.useEffect(() => {
    setDraft(config);
  }, [config]);

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
    <ModalBackdrop onClose={onClose} zIndex="z-60" mobileLayout="sheet" ariaLabelledBy={titleId}>
      <div
        data-testid="filter-bottom-sheet"
        className="bg-card relative flex max-h-[85dvh] w-full flex-col rounded-t-2xl shadow-xl sm:mx-4 sm:max-w-md sm:rounded-2xl"
      >
        <div className="px-5 pt-5 pb-3 text-center">
          <h3 id={titleId} data-testid="filter-bottom-sheet-title" className="text-foreground text-lg font-semibold">
            {sheetContract.copy.title}
          </h3>
          <p data-testid="filter-bottom-sheet-description" className="text-muted-foreground mt-2 text-sm">
            {buildStateDescription(sheetContract.copy)}
          </p>
        </div>
        <div data-testid="filter-bottom-sheet-scroll-region" className="flex-1 overflow-y-auto px-5 pb-4">
          <div className="space-y-5">
            <div>
              <h4 className="text-foreground mb-3 text-sm font-semibold">{t('filter.sortTitle')}</h4>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map(opt => {
                  const isActive = draft.sortBy === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSortChange(opt.value)}
                      className={`min-h-11 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                        isActive ? 'bg-primary text-primary-foreground' : 'text-foreground-secondary bg-muted'
                      }`}
                    >
                      {t(opt.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-foreground mb-3 text-sm font-semibold">{t('filter.quickFiltersTitle')}</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleMaxCalories(300)}
                  className={`min-h-11 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                    draft.maxCalories === 300
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground-secondary bg-muted'
                  }`}
                >
                  {t('filter.lessThan300')}
                </button>
                <button
                  type="button"
                  onClick={() => toggleMaxCalories(500)}
                  className={`min-h-11 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                    draft.maxCalories === 500
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground-secondary bg-muted'
                  }`}
                >
                  {t('filter.lessThan500')}
                </button>
                <button
                  type="button"
                  onClick={() => toggleMinProtein(20)}
                  className={`min-h-11 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                    draft.minProtein === 20
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground-secondary bg-muted'
                  }`}
                >
                  {t('filter.highProtein')}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="pb-safe border-border shrink-0 border-t px-5 py-4">
          <div className="flex gap-3">
            <button
              type="button"
              data-testid="filter-reset-btn"
              onClick={handleReset}
              className="border-border text-foreground-secondary hover:bg-accent min-h-11 flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all"
            >
              {t('filter.reset')}
            </button>
            <button
              type="button"
              data-testid="filter-apply-btn"
              onClick={handleApply}
              className="bg-primary text-primary-foreground hover:bg-primary min-h-11 flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98]"
            >
              {t('filter.apply')}
            </button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
};
