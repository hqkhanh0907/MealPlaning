import React from 'react';
import { Search, Plus, LayoutGrid, List } from 'lucide-react';

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
}

export const ListToolbar: React.FC<ListToolbarProps> = ({
  searchQuery, onSearchChange, searchPlaceholder,
  sortOptions, sortBy, onSortChange,
  viewLayout, onLayoutChange,
  onAdd, addLabel,
  children,
}) => (
  <>
    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
      <div className="relative w-full sm:w-80">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-emerald-500 outline-none bg-white dark:bg-slate-800 dark:text-slate-100 shadow-sm text-base sm:text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="flex-1 sm:flex-none sm:w-44 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-emerald-500 outline-none bg-white dark:bg-slate-800 shadow-sm text-slate-700 dark:text-slate-200 font-medium text-sm min-h-11"
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {/* Layout Switcher */}
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => onLayoutChange('grid')}
            className={`p-2.5 transition-all min-h-11 min-w-11 flex items-center justify-center ${viewLayout === 'grid' ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            title="Xem dạng lưới"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => onLayoutChange('list')}
            className={`p-2.5 transition-all min-h-11 min-w-11 flex items-center justify-center ${viewLayout === 'list' ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            title="Xem dạng danh sách"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
        {/* Add Button */}
        <button
          onClick={onAdd}
          className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm shadow-emerald-200 min-h-11 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">{addLabel}</span>
        </button>
      </div>
    </div>
    {children}
  </>
);

