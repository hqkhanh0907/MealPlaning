import { useState, useMemo } from 'react';
import type { ViewLayout } from '../components/shared/ListToolbar';

interface UseListManagerConfig<T, S extends string> {
  items: T[];
  searchFn: (item: T, query: string) => boolean;
  sortFn: (a: T, b: T, sortBy: S) => number;
  defaultSort: S;
  /** Extra filter applied after search (e.g. tag filter) */
  extraFilter?: (item: T) => boolean;
}

interface UseListManagerReturn<T, S extends string> {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: S;
  setSortBy: (s: S) => void;
  viewLayout: ViewLayout;
  setViewLayout: (v: ViewLayout) => void;
  filteredItems: T[];
}

export function useListManager<T, S extends string>(
  config: UseListManagerConfig<T, S>
): UseListManagerReturn<T, S> {
  const { items, searchFn, sortFn, defaultSort, extraFilter } = config;
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<S>(defaultSort);
  const [viewLayout, setViewLayout] = useState<ViewLayout>('grid');

  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => searchFn(item, searchQuery));
    if (extraFilter) filtered = filtered.filter(extraFilter);
    return filtered.sort((a, b) => sortFn(a, b, sortBy));
  }, [items, searchQuery, sortBy, searchFn, sortFn, extraFilter]);

  return { searchQuery, setSearchQuery, sortBy, setSortBy, viewLayout, setViewLayout, filteredItems };
}

