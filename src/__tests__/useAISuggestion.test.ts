import { act, renderHook } from '@testing-library/react';

import { useAISuggestion } from '../hooks/useAISuggestion';
import type { DayPlan, Dish, Ingredient, MealPlanSuggestion } from '../types';

// Mock dependencies
const mockNotify = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismissAll: vi.fn() };
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => mockNotify,
}));

const mockSuggestMealPlan = vi.fn();
vi.mock('../services/geminiService', () => ({
  suggestMealPlan: (...args: unknown[]) => mockSuggestMealPlan(...args),
}));

const mockApplySuggestion = vi.fn();
vi.mock('../services/planService', () => ({
  applySuggestionToDayPlans: (...args: unknown[]) => mockApplySuggestion(...args),
}));

vi.mock('../utils/logger', () => ({
  logger: { error: vi.fn() },
}));

vi.mock('../utils/nutrition', () => ({
  calculateDishNutrition: () => ({ calories: 500, protein: 30, fat: 15, fiber: 5 }),
}));

const makeDish = (id: string, name: string): Dish => ({
  id,
  name: { vi: name, en: name },
  tags: ['lunch'],
  ingredients: [],
});
const makeIngredient = (id: string, name: string): Ingredient => ({
  id,
  name: { vi: name, en: name },
  unit: { vi: 'g', en: 'g' },
  caloriesPer100: 50,
  proteinPer100: 5,
  carbsPer100: 20,
  fatPer100: 2,
  fiberPer100: 1,
});

const baseSuggestion: MealPlanSuggestion = {
  breakfastDishIds: ['d1'],
  lunchDishIds: ['d2'],
  dinnerDishIds: ['d1'],
  reasoning: 'Balanced meal',
};

const baseParams = {
  dishes: [makeDish('d1', 'Phở'), makeDish('d2', 'Cơm tấm')],
  ingredients: [makeIngredient('i1', 'Thịt bò')],
  targetCalories: 2000,
  targetProtein: 100,
  selectedDate: '2024-01-15',
  setDayPlans: vi.fn() as React.Dispatch<React.SetStateAction<DayPlan[]>>,
};

describe('useAISuggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSuggestMealPlan.mockResolvedValue(baseSuggestion);
    mockApplySuggestion.mockReturnValue([]);
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useAISuggestion(baseParams));
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.suggestion).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('startSuggestion opens modal and fetches suggestion', async () => {
    const { result } = renderHook(() => useAISuggestion(baseParams));

    await act(async () => {
      result.current.startSuggestion();
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.suggestion).toEqual(baseSuggestion);
    expect(result.current.isLoading).toBe(false);
    expect(mockSuggestMealPlan).toHaveBeenCalledWith(
      2000,
      100,
      expect.arrayContaining([expect.objectContaining({ id: 'd1', name: 'Phở' })]),
      expect.any(AbortSignal),
    );
  });

  it('regenerate fetches without reopening modal', async () => {
    const { result } = renderHook(() => useAISuggestion(baseParams));

    await act(async () => {
      result.current.startSuggestion();
    });
    expect(result.current.isModalOpen).toBe(true);

    const newSuggestion = { ...baseSuggestion, reasoning: 'New reason' };
    mockSuggestMealPlan.mockResolvedValueOnce(newSuggestion);

    await act(async () => {
      result.current.regenerate();
    });

    expect(result.current.suggestion).toEqual(newSuggestion);
  });

  it('handles fetch error gracefully', async () => {
    mockSuggestMealPlan.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useAISuggestion(baseParams));

    await act(async () => {
      result.current.startSuggestion();
    });

    expect(result.current.error).toBe('Có lỗi xảy ra khi gợi ý thực đơn. Vui lòng thử lại.');
    expect(result.current.isLoading).toBe(false);
  });

  it('ignores AbortError silently', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    mockSuggestMealPlan.mockRejectedValueOnce(abortError);
    const { result } = renderHook(() => useAISuggestion(baseParams));

    await act(async () => {
      result.current.startSuggestion();
    });

    // AbortError is swallowed — error should remain null
    expect(result.current.error).toBeNull();
  });

  it('apply applies selected meals and closes modal', async () => {
    const setDayPlans = vi.fn();
    const params = { ...baseParams, setDayPlans };
    const { result } = renderHook(() => useAISuggestion(params));

    await act(async () => {
      result.current.startSuggestion();
    });

    act(() => {
      result.current.apply({ breakfast: true, lunch: true, dinner: false });
    });

    expect(setDayPlans).toHaveBeenCalledWith(expect.any(Function));
    // Call the updater function passed to setDayPlans
    const updater = setDayPlans.mock.calls[0][0];
    updater([]);
    expect(mockApplySuggestion).toHaveBeenCalledWith(
      [],
      '2024-01-15',
      expect.objectContaining({
        breakfastDishIds: ['d1'],
        lunchDishIds: ['d2'],
        dinnerDishIds: [],
        reasoning: 'Balanced meal',
      }),
    );
    expect(result.current.isModalOpen).toBe(false);
    expect(mockNotify.success).toHaveBeenCalled();
  });

  it('apply does nothing when no suggestion', () => {
    const { result } = renderHook(() => useAISuggestion(baseParams));
    act(() => {
      result.current.apply({ breakfast: true, lunch: true, dinner: true });
    });
    expect(baseParams.setDayPlans).not.toHaveBeenCalled();
  });

  it('editMeal aborts request and returns meal type', async () => {
    const { result } = renderHook(() => useAISuggestion(baseParams));

    await act(async () => {
      result.current.startSuggestion();
    });

    let returned: string = '';
    act(() => {
      returned = result.current.editMeal('lunch');
    });

    expect(returned).toBe('lunch');
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('close aborts and resets all state', async () => {
    const { result } = renderHook(() => useAISuggestion(baseParams));

    await act(async () => {
      result.current.startSuggestion();
    });
    expect(result.current.isModalOpen).toBe(true);

    act(() => {
      result.current.close();
    });

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.suggestion).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('close when no active request (no abort controller)', () => {
    const { result } = renderHook(() => useAISuggestion(baseParams));
    // Close without ever starting — should not throw
    act(() => {
      result.current.close();
    });
    expect(result.current.isModalOpen).toBe(false);
  });

  it('startSuggestion aborts previous request', async () => {
    // First request that never resolves
    mockSuggestMealPlan.mockImplementationOnce(
      () =>
        new Promise<MealPlanSuggestion>(() => {
          /* intentionally unresolved */
        }),
    );

    const { result } = renderHook(() => useAISuggestion(baseParams));

    // Start first request
    act(() => {
      result.current.startSuggestion();
    });
    expect(result.current.isLoading).toBe(true);

    // Start second (will abort the first)
    mockSuggestMealPlan.mockResolvedValueOnce(baseSuggestion);
    await act(async () => {
      result.current.startSuggestion();
    });

    expect(result.current.suggestion).toEqual(baseSuggestion);
  });

  it('editMeal on fresh hook returns meal type without aborting', () => {
    const { result } = renderHook(() => useAISuggestion(baseParams));
    let returned = '';
    act(() => {
      returned = result.current.editMeal('lunch');
    });
    expect(returned).toBe('lunch');
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('close resets isLoading when a request is in-flight', () => {
    mockSuggestMealPlan.mockImplementationOnce(() => new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useAISuggestion(baseParams));
    act(() => {
      result.current.startSuggestion();
    });
    expect(result.current.isLoading).toBe(true);
    act(() => {
      result.current.close();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isModalOpen).toBe(false);
  });

  it('apply with all meals false calls setDayPlans with empty dish arrays', async () => {
    mockSuggestMealPlan.mockResolvedValueOnce(baseSuggestion);
    const { result } = renderHook(() => useAISuggestion(baseParams));
    await act(async () => {
      result.current.startSuggestion();
    });
    expect(result.current.suggestion).toEqual(baseSuggestion);

    act(() => {
      result.current.apply({ breakfast: false, lunch: false, dinner: false });
    });

    // setDayPlans called (apply was not a no-op)
    expect(baseParams.setDayPlans).toHaveBeenCalled();
    // Modal closes and suggestion cleared
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.suggestion).toBeNull();
  });
});
