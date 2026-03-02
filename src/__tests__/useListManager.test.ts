import { renderHook, act } from '@testing-library/react';
import { useListManager } from '../hooks/useListManager';

type TestItem = { id: string; name: string; value: number };

const items: TestItem[] = [
  { id: '1', name: 'Apple', value: 30 },
  { id: '2', name: 'Banana', value: 10 },
  { id: '3', name: 'Cherry', value: 20 },
];

const searchFn = (item: TestItem, query: string) =>
  item.name.toLowerCase().includes(query.toLowerCase());

const sortFn = (a: TestItem, b: TestItem, sortBy: 'name' | 'value') => {
  if (sortBy === 'name') return a.name.localeCompare(b.name);
  return a.value - b.value;
};

describe('useListManager', () => {
  it('returns all items sorted by default', () => {
    const { result } = renderHook(() =>
      useListManager({ items, searchFn, sortFn, defaultSort: 'name' as const }),
    );
    expect(result.current.filteredItems).toHaveLength(3);
    expect(result.current.filteredItems[0].name).toBe('Apple');
    expect(result.current.filteredItems[2].name).toBe('Cherry');
  });

  it('filters items by search query', () => {
    const { result } = renderHook(() =>
      useListManager({ items, searchFn, sortFn, defaultSort: 'name' as const }),
    );
    act(() => result.current.setSearchQuery('ban'));
    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].name).toBe('Banana');
  });

  it('changes sort order', () => {
    const { result } = renderHook(() =>
      useListManager({ items, searchFn, sortFn, defaultSort: 'name' as const }),
    );
    act(() => result.current.setSortBy('value'));
    expect(result.current.filteredItems[0].name).toBe('Banana'); // value=10
    expect(result.current.filteredItems[2].name).toBe('Apple');  // value=30
  });

  it('applies extraFilter', () => {
    const { result } = renderHook(() =>
      useListManager({
        items,
        searchFn,
        sortFn,
        defaultSort: 'name' as const,
        extraFilter: (item) => item.value > 15,
      }),
    );
    expect(result.current.filteredItems).toHaveLength(2); // Apple(30) and Cherry(20)
  });

  it('manages viewLayout state', () => {
    const { result } = renderHook(() =>
      useListManager({ items, searchFn, sortFn, defaultSort: 'name' as const }),
    );
    expect(result.current.viewLayout).toBe('grid');
    act(() => result.current.setViewLayout('list'));
    expect(result.current.viewLayout).toBe('list');
  });

  it('returns empty when no search matches', () => {
    const { result } = renderHook(() =>
      useListManager({ items, searchFn, sortFn, defaultSort: 'name' as const }),
    );
    act(() => result.current.setSearchQuery('zzz'));
    expect(result.current.filteredItems).toHaveLength(0);
  });
});
