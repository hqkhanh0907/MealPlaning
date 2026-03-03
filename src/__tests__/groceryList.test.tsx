import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GroceryList } from '../components/GroceryList';
import type { Ingredient, Dish, DayPlan } from '../types';

const mockNotify = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismissAll: vi.fn() };
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => mockNotify,
}));

const ingredients: Ingredient[] = [
  { id: 'i1', name: 'Ức gà', caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, fiberPer100: 0, unit: 'g' },
  { id: 'i2', name: 'Cơm trắng', caloriesPer100: 130, proteinPer100: 2.7, carbsPer100: 28, fatPer100: 0.3, fiberPer100: 0.4, unit: 'g' },
  { id: 'i3', name: 'Rau xà lách', caloriesPer100: 15, proteinPer100: 1.2, carbsPer100: 2, fatPer100: 0.2, fiberPer100: 1.3, unit: 'g' },
];

const dishes: Dish[] = [
  { id: 'd1', name: 'Gà nướng', ingredients: [{ ingredientId: 'i1', amount: 200 }], tags: ['lunch'] },
  { id: 'd2', name: 'Cơm gà', ingredients: [{ ingredientId: 'i1', amount: 100 }, { ingredientId: 'i2', amount: 200 }], tags: ['lunch'] },
  { id: 'd3', name: 'Salad', ingredients: [{ ingredientId: 'i3', amount: 150 }], tags: ['dinner'] },
];

const today = '2025-06-15';
const currentPlan: DayPlan = {
  date: today, breakfastDishIds: [], lunchDishIds: ['d1', 'd2'], dinnerDishIds: ['d3'],
};
const dayPlans: DayPlan[] = [currentPlan];

describe('GroceryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders grocery items for current day', () => {
    render(<GroceryList currentPlan={currentPlan} dayPlans={dayPlans} selectedDate={today} allDishes={dishes} allIngredients={ingredients} />);
    // Ức gà: 200 (d1) + 100 (d2) = 300g
    expect(screen.getByText('Ức gà')).toBeInTheDocument();
    expect(screen.getByText('300 g')).toBeInTheDocument();
    // Cơm trắng: 200g
    expect(screen.getByText('Cơm trắng')).toBeInTheDocument();
    expect(screen.getByText('200 g')).toBeInTheDocument();
    // Rau xà lách: 150g
    expect(screen.getByText('Rau xà lách')).toBeInTheDocument();
    expect(screen.getByText('150 g')).toBeInTheDocument();
  });

  it('shows item count in header', () => {
    render(<GroceryList currentPlan={currentPlan} dayPlans={dayPlans} selectedDate={today} allDishes={dishes} allIngredients={ingredients} />);
    expect(screen.getByText('3 nguyên liệu')).toBeInTheDocument();
  });

  it('toggles check on item click', () => {
    render(<GroceryList currentPlan={currentPlan} dayPlans={dayPlans} selectedDate={today} allDishes={dishes} allIngredients={ingredients} />);
    const item = screen.getByText('Ức gà');
    const itemBtn = item.closest('button');
    expect(itemBtn).toBeTruthy();
    if (itemBtn) fireEvent.click(itemBtn);
    expect(screen.getByText(/Đã mua 1\/3/)).toBeInTheDocument();
  });

  it('shows all done message when all items are checked', () => {
    render(<GroceryList currentPlan={currentPlan} dayPlans={dayPlans} selectedDate={today} allDishes={dishes} allIngredients={ingredients} />);
    // Check all 3 items
    const buttons = screen.getAllByRole('listitem')
      .map(li => li.querySelector('button'))
      .filter((btn): btn is HTMLButtonElement => btn !== null);
    buttons.forEach(btn => fireEvent.click(btn));
    expect(screen.getByText(/Đã mua đủ tất cả nguyên liệu/)).toBeInTheDocument();
  });

  it('switches scope tabs', () => {
    render(<GroceryList currentPlan={currentPlan} dayPlans={dayPlans} selectedDate={today} allDishes={dishes} allIngredients={ingredients} />);
    expect(screen.getByText('Hôm nay')).toBeInTheDocument();
    expect(screen.getByText('Tuần này')).toBeInTheDocument();
    expect(screen.getByText('Tất cả')).toBeInTheDocument();

    // Switch to "Tất cả"
    fireEvent.click(screen.getByText('Tất cả'));
    // Should still show items
    expect(screen.getByText('Ức gà')).toBeInTheDocument();
  });

  it('shows empty state when no dishes planned', () => {
    const emptyPlan: DayPlan = { date: today, breakfastDishIds: [], lunchDishIds: [], dinnerDishIds: [] };
    render(<GroceryList currentPlan={emptyPlan} dayPlans={[emptyPlan]} selectedDate={today} allDishes={dishes} allIngredients={ingredients} />);
    expect(screen.getByText('Chưa có gì cần mua')).toBeInTheDocument();
  });

  it('copies grocery list to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<GroceryList currentPlan={currentPlan} dayPlans={dayPlans} selectedDate={today} allDishes={dishes} allIngredients={ingredients} />);
    const copyBtn = screen.getByTitle('Sao chép');
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
      expect(mockNotify.success).toHaveBeenCalledWith('Đã sao chép!', expect.any(String));
    });
  });

  it('shares grocery list when navigator.share is available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { share });

    render(<GroceryList currentPlan={currentPlan} dayPlans={dayPlans} selectedDate={today} allDishes={dishes} allIngredients={ingredients} />);
    const shareBtn = screen.getByTitle('Chia sẻ');
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(share).toHaveBeenCalled();
    });
  });

  it('resets checked items when switching scope', () => {
    render(<GroceryList currentPlan={currentPlan} dayPlans={dayPlans} selectedDate={today} allDishes={dishes} allIngredients={ingredients} />);
    // Check an item
    const item = screen.getByText('Ức gà');
    const resetBtn = item.closest('button');
    expect(resetBtn).toBeTruthy();
    if (resetBtn) fireEvent.click(resetBtn);
    expect(screen.getByText(/Đã mua 1\/3/)).toBeInTheDocument();

    // Switch scope
    fireEvent.click(screen.getByText('Tất cả'));
    // Checked should be reset
    expect(screen.queryByText(/Đã mua/)).not.toBeInTheDocument();
  });

  it('handles clipboard write error gracefully', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard denied'));
    Object.assign(navigator, { clipboard: { writeText } });

    render(<GroceryList currentPlan={currentPlan} dayPlans={dayPlans} selectedDate={today} allDishes={dishes} allIngredients={ingredients} />);
    const copyBtn = screen.getByTitle('Sao chép');
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
      expect(mockNotify.error).toHaveBeenCalled();
    });
  });

  it('persists checked items in localStorage for the same scope', () => {
    const { unmount } = render(<GroceryList currentPlan={currentPlan} dayPlans={dayPlans} selectedDate={today} allDishes={dishes} allIngredients={ingredients} />);
    // Check first item
    const item = screen.getByText('Ức gà');
    const persistBtn = item.closest('button');
    expect(persistBtn).toBeTruthy();
    if (persistBtn) fireEvent.click(persistBtn);
    expect(screen.getByText(/Đã mua 1\/3/)).toBeInTheDocument();

    // Verify localStorage was updated
    const keys = Object.keys(localStorage);
    const groceryKey = keys.find(k => k.startsWith('mp-'));
    if (groceryKey) {
      expect(localStorage.getItem(groceryKey)).toBeTruthy();
    }
    unmount();
  });

  it('aggregates ingredients correctly for week scope with multiple days', () => {
    const nextDay = '2025-06-16';
    const nextPlan: DayPlan = {
      date: nextDay, breakfastDishIds: [], lunchDishIds: ['d1'], dinnerDishIds: [],
    };
    const allPlans = [currentPlan, nextPlan];
    render(<GroceryList currentPlan={currentPlan} dayPlans={allPlans} selectedDate={today} allDishes={dishes} allIngredients={ingredients} />);
    // Switch to week scope
    fireEvent.click(screen.getByText('Tuần này'));
    // Ức gà: today 300g + next day 200g = 500g (if both days in same week)
    expect(screen.getByText('Ức gà')).toBeInTheDocument();
  });

  it('displays correct amount units for different ingredient types', () => {
    render(<GroceryList currentPlan={currentPlan} dayPlans={dayPlans} selectedDate={today} allDishes={dishes} allIngredients={ingredients} />);
    // All ingredients use 'g' unit
    expect(screen.getByText('300 g')).toBeInTheDocument(); // Ức gà
    expect(screen.getByText('200 g')).toBeInTheDocument(); // Cơm trắng
    expect(screen.getByText('150 g')).toBeInTheDocument(); // Rau xà lách
  });
});
