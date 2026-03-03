import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModalManager } from '../hooks/useModalManager';

describe('useModalManager', () => {
  // --- Initial State ---
  it('should have all modals closed and planningType null initially', () => {
    const { result } = renderHook(() => useModalManager());

    expect(result.current.isPlanningModalOpen).toBe(false);
    expect(result.current.isTypeSelectionModalOpen).toBe(false);
    expect(result.current.isClearPlanModalOpen).toBe(false);
    expect(result.current.isGoalModalOpen).toBe(false);
    expect(result.current.planningType).toBeNull();
  });

  // --- TypeSelection Modal ---
  it('should open and close type selection modal', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.openTypeSelection());
    expect(result.current.isTypeSelectionModalOpen).toBe(true);

    act(() => result.current.closeTypeSelection());
    expect(result.current.isTypeSelectionModalOpen).toBe(false);
  });

  // --- ClearPlan Modal ---
  it('should open and close clear plan modal', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.openClearPlan());
    expect(result.current.isClearPlanModalOpen).toBe(true);

    act(() => result.current.closeClearPlan());
    expect(result.current.isClearPlanModalOpen).toBe(false);
  });

  // --- Goal Modal ---
  it('should open and close goal modal', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.openGoalModal());
    expect(result.current.isGoalModalOpen).toBe(true);

    act(() => result.current.closeGoalModal());
    expect(result.current.isGoalModalOpen).toBe(false);
  });

  // --- Planning Modal ---
  it('should open planning modal with correct type and close type selection', () => {
    const { result } = renderHook(() => useModalManager());

    // First open type selection
    act(() => result.current.openTypeSelection());
    expect(result.current.isTypeSelectionModalOpen).toBe(true);

    // Then pick a type → should close type selection, open planning
    act(() => result.current.openPlanningModal('lunch'));
    expect(result.current.isPlanningModalOpen).toBe(true);
    expect(result.current.isTypeSelectionModalOpen).toBe(false);
    expect(result.current.planningType).toBe('lunch');
  });

  it('should close planning modal', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.openPlanningModal('breakfast'));
    expect(result.current.isPlanningModalOpen).toBe(true);

    act(() => result.current.closePlanningModal());
    expect(result.current.isPlanningModalOpen).toBe(false);
  });

  // --- Back to Type Selection ---
  it('should navigate back from planning to type selection', () => {
    const { result } = renderHook(() => useModalManager());

    // Open planning first
    act(() => result.current.openPlanningModal('dinner'));
    expect(result.current.isPlanningModalOpen).toBe(true);

    // Press back → should close planning, re-open type selection
    act(() => result.current.backToPlanningTypeSelection());
    expect(result.current.isPlanningModalOpen).toBe(false);
    expect(result.current.isTypeSelectionModalOpen).toBe(true);
  });

  // --- Independence ---
  it('should manage each modal independently', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.openGoalModal());
    act(() => result.current.openClearPlan());

    expect(result.current.isGoalModalOpen).toBe(true);
    expect(result.current.isClearPlanModalOpen).toBe(true);
    expect(result.current.isPlanningModalOpen).toBe(false);

    act(() => result.current.closeGoalModal());
    expect(result.current.isGoalModalOpen).toBe(false);
    expect(result.current.isClearPlanModalOpen).toBe(true);
  });
});
