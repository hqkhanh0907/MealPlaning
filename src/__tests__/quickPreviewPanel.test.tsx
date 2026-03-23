import { render, screen, fireEvent } from '@testing-library/react';
import { QuickPreviewPanel } from '../components/QuickPreviewPanel';
import type { DayPlan, Dish, Ingredient, MealType } from '../types';

const ingredients: Ingredient[] = [
  { id: 'i1', name: { vi: 'Ức gà', en: 'Chicken breast' }, caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, fiberPer100: 0, unit: { vi: 'g', en: 'g' } },
  { id: 'i2', name: { vi: 'Cơm trắng', en: 'White rice' }, caloriesPer100: 130, proteinPer100: 2.7, carbsPer100: 28, fatPer100: 0.3, fiberPer100: 0.4, unit: { vi: 'g', en: 'g' } },
  { id: 'i3', name: { vi: 'Rau xà lách', en: 'Lettuce' }, caloriesPer100: 15, proteinPer100: 1.4, carbsPer100: 2.9, fatPer100: 0.2, fiberPer100: 1.3, unit: { vi: 'g', en: 'g' } },
];

const dishes: Dish[] = [
  { id: 'd1', name: { vi: 'Gà nướng', en: 'Grilled chicken' }, ingredients: [{ ingredientId: 'i1', amount: 200 }], tags: ['breakfast'] },
  { id: 'd2', name: { vi: 'Cơm gà', en: 'Chicken rice' }, ingredients: [{ ingredientId: 'i1', amount: 100 }, { ingredientId: 'i2', amount: 150 }], tags: ['lunch'] },
  { id: 'd3', name: { vi: 'Salad gà', en: 'Chicken salad' }, ingredients: [{ ingredientId: 'i1', amount: 100 }, { ingredientId: 'i3', amount: 100 }], tags: ['dinner'] },
  { id: 'd4', name: { vi: 'Cơm chiên', en: 'Fried rice' }, ingredients: [{ ingredientId: 'i2', amount: 200 }], tags: ['lunch'] },
  { id: 'd5', name: { vi: 'Trứng luộc', en: 'Boiled egg' }, ingredients: [{ ingredientId: 'i1', amount: 50 }], tags: ['breakfast'] },
];

const emptyPlan: DayPlan = {
  date: '2025-01-01',
  breakfastDishIds: [],
  lunchDishIds: [],
  dinnerDishIds: [],
};

const partialPlan: DayPlan = {
  date: '2025-01-01',
  breakfastDishIds: ['d1'],
  lunchDishIds: [],
  dinnerDishIds: ['d3'],
};

const fullPlan: DayPlan = {
  date: '2025-01-01',
  breakfastDishIds: ['d1'],
  lunchDishIds: ['d2'],
  dinnerDishIds: ['d3'],
};

const planWithManyDishes: DayPlan = {
  date: '2025-01-01',
  breakfastDishIds: ['d1', 'd5', 'd4'],
  lunchDishIds: ['d2'],
  dinnerDishIds: [],
};

const renderPanel = (plan: DayPlan, overrides?: Partial<{ onPlanMeal: (t: MealType) => void; onPlanAll: () => void }>) => {
  const onPlanMeal = overrides?.onPlanMeal ?? vi.fn();
  const onPlanAll = overrides?.onPlanAll ?? vi.fn();
  return {
    onPlanMeal,
    onPlanAll,
    ...render(
      <QuickPreviewPanel
        currentPlan={plan}
        dishes={dishes}
        ingredients={ingredients}
        onPlanMeal={onPlanMeal}
        onPlanAll={onPlanAll}
      />,
    ),
  };
};

describe('QuickPreviewPanel', () => {
  it('renders 3 meal rows', () => {
    renderPanel(emptyPlan);
    expect(screen.getByTestId('quick-preview-row-breakfast')).toBeInTheDocument();
    expect(screen.getByTestId('quick-preview-row-lunch')).toBeInTheDocument();
    expect(screen.getByTestId('quick-preview-row-dinner')).toBeInTheDocument();
  });

  it('shows dish names for planned meals', () => {
    renderPanel(fullPlan);
    expect(screen.getByText(/Gà nướng/)).toBeInTheDocument();
    expect(screen.getByText(/Cơm gà/)).toBeInTheDocument();
    expect(screen.getByText(/Salad gà/)).toBeInTheDocument();
  });

  it('shows "+N more" when more than 2 dishes', () => {
    renderPanel(planWithManyDishes);
    expect(screen.getByText(/\+1 món nữa/)).toBeInTheDocument();
  });

  it('shows "Chưa có món" for empty meal slots', () => {
    renderPanel(emptyPlan);
    const emptyTexts = screen.getAllByText('Chưa có món');
    expect(emptyTexts).toHaveLength(3);
  });

  it('shows edit button for meals with dishes', () => {
    renderPanel(partialPlan);
    const breakfastRow = screen.getByTestId('quick-preview-row-breakfast');
    const editBtn = breakfastRow.querySelector('button');
    expect(editBtn).toBeTruthy();
    expect(editBtn?.getAttribute('aria-label')).toBe('Sửa');
  });

  it('shows add button for empty meals', () => {
    renderPanel(partialPlan);
    const lunchRow = screen.getByTestId('quick-preview-row-lunch');
    const addBtn = lunchRow.querySelector('button');
    expect(addBtn).toBeTruthy();
    expect(addBtn?.getAttribute('aria-label')).toBe('Thêm');
  });

  it('calls onPlanMeal with correct type when edit clicked', () => {
    const onPlanMeal = vi.fn();
    renderPanel(fullPlan, { onPlanMeal });
    const breakfastRow = screen.getByTestId('quick-preview-row-breakfast');
    const editBtn = breakfastRow.querySelector('button');
    if (editBtn) fireEvent.click(editBtn);
    expect(onPlanMeal).toHaveBeenCalledWith('breakfast');
  });

  it('calls onPlanMeal with correct type when add clicked', () => {
    const onPlanMeal = vi.fn();
    renderPanel(partialPlan, { onPlanMeal });
    const lunchRow = screen.getByTestId('quick-preview-row-lunch');
    const addBtn = lunchRow.querySelector('button');
    if (addBtn) fireEvent.click(addBtn);
    expect(onPlanMeal).toHaveBeenCalledWith('lunch');
  });

  it('shows "Lên kế hoạch tất cả" button when at least 1 slot empty', () => {
    renderPanel(partialPlan);
    expect(screen.getByText('Lên kế hoạch tất cả')).toBeInTheDocument();
  });

  it('hides "Lên kế hoạch tất cả" when all 3 slots have dishes', () => {
    renderPanel(fullPlan);
    expect(screen.queryByText('Lên kế hoạch tất cả')).not.toBeInTheDocument();
  });

  it('calls onPlanAll when "Lên kế hoạch tất cả" clicked', () => {
    const onPlanAll = vi.fn();
    renderPanel(emptyPlan, { onPlanAll });
    fireEvent.click(screen.getByText('Lên kế hoạch tất cả'));
    expect(onPlanAll).toHaveBeenCalledTimes(1);
  });

  it('shows mini nutrition bars with correct values', () => {
    renderPanel(fullPlan);
    const calBar = screen.getByTestId('cal-bar-breakfast');
    expect(calBar).toBeInTheDocument();
    const widthStyle = calBar.style.width;
    expect(widthStyle).toBeTruthy();
    expect(widthStyle).not.toBe('0%');

    const proBar = screen.getByTestId('pro-bar-breakfast');
    expect(proBar).toBeInTheDocument();
    expect(proBar.style.width).toBeTruthy();
    expect(proBar.style.width).not.toBe('0%');
  });

  it('handles completely empty plan (all 3 slots empty)', () => {
    renderPanel(emptyPlan);
    const emptyTexts = screen.getAllByText('Chưa có món');
    expect(emptyTexts).toHaveLength(3);
    expect(screen.getByText('Lên kế hoạch tất cả')).toBeInTheDocument();
    expect(screen.queryByTestId('cal-bar-breakfast')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cal-bar-lunch')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cal-bar-dinner')).not.toBeInTheDocument();
  });

  it('renders panel root with correct data-testid', () => {
    renderPanel(emptyPlan);
    expect(screen.getByTestId('quick-preview-panel')).toBeInTheDocument();
  });

  it('renders title text', () => {
    renderPanel(emptyPlan);
    expect(screen.getByText('Tổng quan bữa ăn')).toBeInTheDocument();
  });
});
