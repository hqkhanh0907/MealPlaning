import { LayoutGrid, List, Plus, Search } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';

export type ViewLayout = 'grid' | 'list';

interface SortOptionItem {
  value: string;
  label: string;
}

interface ListToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder: string;
  sortOptions: SortOptionItem[];
  sortBy: string;
  onSortChange: (v: string) => void;
  viewLayout: ViewLayout;
  onLayoutChange: (v: ViewLayout) => void;
  onAdd: () => void;
  addLabel: string;
  children?: React.ReactNode;
  searchTestId?: string;
  addTestId?: string;
  sortTestId?: string;
}

export const ListToolbar = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  sortOptions,
  sortBy,
  onSortChange,
  viewLayout,
  onLayoutChange,
  onAdd,
  addLabel,
  children,
  searchTestId,
  addTestId,
  sortTestId,
}: ListToolbarProps) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            id={searchTestId || 'list-search'}
            name={searchTestId || 'list-search'}
            autoComplete="off"
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pr-4 pl-10 shadow-sm"
            {...(searchTestId ? { 'data-testid': searchTestId } : {})}
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <select
            id="list-sort-select"
            name="list-sort-select"
            aria-label={t('listToolbar.sortBy')}
            value={sortBy}
            onChange={e => onSortChange(e.target.value)}
            className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-emerald-500 sm:w-44 sm:flex-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            {...(sortTestId ? { 'data-testid': sortTestId } : {})}
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Layout Switcher */}
          <div className="flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onLayoutChange('grid')}
              className={`flex min-h-11 min-w-11 items-center justify-center p-2.5 transition-all ${viewLayout === 'grid' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700'}`}
              title={t('listToolbar.gridView')}
              aria-label={t('listToolbar.gridView')}
              data-testid="btn-view-grid"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => onLayoutChange('list')}
              className={`flex min-h-11 min-w-11 items-center justify-center p-2.5 transition-all ${viewLayout === 'list' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700'}`}
              title={t('listToolbar.listView')}
              aria-label={t('listToolbar.listView')}
              data-testid="btn-view-list"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
          {/* Add Button */}
          <button
            onClick={onAdd}
            aria-label={addLabel}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 font-bold whitespace-nowrap text-white shadow-sm shadow-emerald-200 transition-all hover:bg-emerald-600 active:scale-[0.98]"
            {...(addTestId ? { 'data-testid': addTestId } : {})}
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">{addLabel}</span>
          </button>
        </div>
      </div>
      {children}
    </>
  );
};
