import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModalManager } from '../hooks/useModalManager';

describe('useModalManager', () => {
  it('should have all modals closed and planningType null initially', () => {
    const { result } = renderHook(() => useModalManager());

    expect(result.current.isMealPlannerOpen).toBe(false);
    expect(result.current.isClearPlanModalOpen).toBe(false);
    expect(result.current.isGoalModalOpen).toBe(false);
    expect(result.current.planningType).toBeNull();
  });

  it('should open and close meal planner with type', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.openMealPlanner('lunch'));
    expect(result.current.isMealPlannerOpen).toBe(true);
    expect(result.current.planningType).toBe('lunch');

    act(() => result.current.closeMealPlanner());
    expect(result.current.isMealPlannerOpen).toBe(false);
  });

  it('should open and close clear plan modal', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.openClearPlan());
    expect(result.current.isClearPlanModalOpen).toBe(true);

    act(() => result.current.closeClearPlan());
    expect(result.current.isClearPlanModalOpen).toBe(false);
  });

  it('should open and close goal modal', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.openGoalModal());
    expect(result.current.isGoalModalOpen).toBe(true);

    act(() => result.current.closeGoalModal());
    expect(result.current.isGoalModalOpen).toBe(false);
  });

  it('should only allow one modal open at a time', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.openGoalModal());
    expect(result.current.isGoalModalOpen).toBe(true);

    act(() => result.current.openClearPlan());
    expect(result.current.isGoalModalOpen).toBe(false);
    expect(result.current.isClearPlanModalOpen).toBe(true);
    expect(result.current.isMealPlannerOpen).toBe(false);

    act(() => result.current.openMealPlanner('breakfast'));
    expect(result.current.isClearPlanModalOpen).toBe(false);
    expect(result.current.isMealPlannerOpen).toBe(true);
    expect(result.current.planningType).toBe('breakfast');

    act(() => result.current.closeMealPlanner());
    expect(result.current.isMealPlannerOpen).toBe(false);
  });
});
