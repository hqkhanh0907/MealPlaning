import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type ActionType, determineQuickActions, useQuickActions } from '../features/dashboard/hooks/useQuickActions';
import { useNavigationStore } from '../store/navigationStore';

/* ------------------------------------------------------------------ */
/* determineQuickActions – pure function */
/* ------------------------------------------------------------------ */
describe('determineQuickActions', () => {
  it('returns exactly 2 actions', () => {
    const actions = determineQuickActions();
    expect(actions).toHaveLength(2);
  });

  it('first action is log-weight', () => {
    const [left] = determineQuickActions();
    expect(left.id).toBe('log-weight');
    expect(left.label).toBe('quickActions.logWeight');
  });

  it('second action is log-cardio', () => {
    const [, right] = determineQuickActions();
    expect(right.id).toBe('log-cardio');
    expect(right.label).toBe('quickActions.logCardio');
  });

  it('returns consistent results across multiple calls', () => {
    const first = determineQuickActions();
    const second = determineQuickActions();
    expect(first[0].id).toBe(second[0].id);
    expect(first[1].id).toBe(second[1].id);
  });
});

/* ------------------------------------------------------------------ */
/* useQuickActions – hook */
/* ------------------------------------------------------------------ */
describe('useQuickActions', () => {
  beforeEach(() => {
    useNavigationStore.setState({
      navigateTab: vi.fn(),
    });
  });

  it('returns two fixed actions', () => {
    const { result } = renderHook(() => useQuickActions());
    const [left, right] = result.current.actions;

    expect(left.id).toBe('log-weight');
    expect(right.id).toBe('log-cardio');
  });

  it('handleAction navigates to fitness for log-weight', () => {
    const mockNavigateTab = vi.fn();
    useNavigationStore.setState({ navigateTab: mockNavigateTab });

    const { result } = renderHook(() => useQuickActions());

    act(() => {
      result.current.handleAction({ id: 'log-weight', label: '' });
    });

    expect(mockNavigateTab).toHaveBeenCalledWith('fitness');
  });

  it('handleAction navigates to fitness for log-cardio', () => {
    const mockNavigateTab = vi.fn();
    useNavigationStore.setState({ navigateTab: mockNavigateTab });

    const { result } = renderHook(() => useQuickActions());

    act(() => {
      result.current.handleAction({ id: 'log-cardio', label: '' });
    });

    expect(mockNavigateTab).toHaveBeenCalledWith('fitness');
  });

  it('handleAction calls onLogWeight callback instead of navigating when provided', () => {
    const mockNavigateTab = vi.fn();
    const mockOnLogWeight = vi.fn();
    useNavigationStore.setState({ navigateTab: mockNavigateTab });

    const { result } = renderHook(() => useQuickActions({ onLogWeight: mockOnLogWeight }));

    act(() => {
      result.current.handleAction({ id: 'log-weight', label: '' });
    });

    expect(mockOnLogWeight).toHaveBeenCalledTimes(1);
    expect(mockNavigateTab).not.toHaveBeenCalled();
  });

  it('both actions navigate to fitness tab', () => {
    const mockNavigateTab = vi.fn();
    useNavigationStore.setState({ navigateTab: mockNavigateTab });

    const { result } = renderHook(() => useQuickActions());
    const fitnessActions: ActionType[] = ['log-weight', 'log-cardio'];

    for (const id of fitnessActions) {
      act(() => {
        result.current.handleAction({ id, label: '' });
      });
    }

    expect(mockNavigateTab).toHaveBeenCalledTimes(2);
    for (const call of mockNavigateTab.mock.calls) {
      expect(call[0]).toBe('fitness');
    }
  });
});
