import { renderHook, act } from '@testing-library/react';
import { usePersistedState } from '../hooks/usePersistedState';

describe('usePersistedState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => usePersistedState('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('hydrates from localStorage on mount', () => {
    localStorage.setItem('test-key', JSON.stringify('saved-value'));
    const { result } = renderHook(() => usePersistedState('test-key', 'default'));
    expect(result.current[0]).toBe('saved-value');
  });

  it('persists value to localStorage on update', () => {
    const { result } = renderHook(() => usePersistedState('test-key', 'default'));
    act(() => {
      result.current[1]('new-value');
    });
    expect(result.current[0]).toBe('new-value');
    expect(JSON.parse(localStorage.getItem('test-key') ?? '')).toBe('new-value');
  });

  it('falls back to initial value on corrupted localStorage', () => {
    localStorage.setItem('test-key', 'NOT_VALID_JSON{{{');
    const { result } = renderHook(() => usePersistedState('test-key', 42));
    expect(result.current[0]).toBe(42);
  });

  it('resetValue resets value to initial', () => {
    localStorage.setItem('test-key', JSON.stringify('stored'));
    const { result } = renderHook(() => usePersistedState('test-key', 'initial'));
    expect(result.current[0]).toBe('stored');

    act(() => {
      result.current[2](); // resetValue
    });
    expect(result.current[0]).toBe('initial');
    // resetValue calls localStorage.removeItem, but then useEffect writes initialValue back
    // The important thing is the state was reset
  });

  it('handles objects as values', () => {
    const initial = { a: 1, b: 'test' };
    const { result } = renderHook(() => usePersistedState('obj-key', initial));
    expect(result.current[0]).toEqual(initial);

    act(() => {
      result.current[1]({ a: 2, b: 'updated' });
    });
    expect(result.current[0]).toEqual({ a: 2, b: 'updated' });
  });

  it('handles localStorage.setItem failure gracefully', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    const { result } = renderHook(() => usePersistedState('fail-key', 'value'));
    // Should not crash
    expect(result.current[0]).toBe('value');
    warnSpy.mockRestore();
    setItemSpy.mockRestore();
  });
});
