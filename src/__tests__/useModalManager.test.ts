import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useModalManager } from '../hooks/useModalManager';

describe('useModalManager', () => {
  it('should have all modals closed and planningType null initially', () => {
    const { result } = renderHook(() => useModalManager());

    expect(result.current.isMealPlannerOpen).toBe(false);
    expect(result.current.isClearPlanModalOpen).toBe(false);
    expect(result.current.isGoalModalOpen).toBe(false);
    expect(result.current.isCopyPlanOpen).toBe(false);
    expect(result.current.isTemplateManagerOpen).toBe(false);
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

  it('should open and close copy plan modal', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.openCopyPlanModal());
    expect(result.current.isCopyPlanOpen).toBe(true);

    act(() => result.current.closeCopyPlanModal());
    expect(result.current.isCopyPlanOpen).toBe(false);
  });

  it('should open and close template manager', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.openTemplateManager());
    expect(result.current.isTemplateManagerOpen).toBe(true);

    act(() => result.current.closeTemplateManager());
    expect(result.current.isTemplateManagerOpen).toBe(false);
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

  it('copy plan modal closes other modals', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.openGoalModal());
    expect(result.current.isGoalModalOpen).toBe(true);

    act(() => result.current.openCopyPlanModal());
    expect(result.current.isGoalModalOpen).toBe(false);
    expect(result.current.isCopyPlanOpen).toBe(true);
  });

  it('template manager closes other modals', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.openCopyPlanModal());
    expect(result.current.isCopyPlanOpen).toBe(true);

    act(() => result.current.openTemplateManager());
    expect(result.current.isCopyPlanOpen).toBe(false);
    expect(result.current.isTemplateManagerOpen).toBe(true);
  });

  it('save template modal opens and closes', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.openSaveTemplate());
    expect(result.current.isSaveTemplateOpen).toBe(true);

    act(() => result.current.closeSaveTemplate());
    expect(result.current.isSaveTemplateOpen).toBe(false);
  });

  it('save template modal closes other modals', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.openTemplateManager());
    expect(result.current.isTemplateManagerOpen).toBe(true);

    act(() => result.current.openSaveTemplate());
    expect(result.current.isTemplateManagerOpen).toBe(false);
    expect(result.current.isSaveTemplateOpen).toBe(true);
  });
});
