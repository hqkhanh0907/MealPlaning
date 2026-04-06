import { fireEvent, render, screen } from '@testing-library/react';

import { MealPlannerModal } from '../components/modals/MealPlannerModal';
import type { DayPlan, Dish, Ingredient } from '../types';

vi.mock('../hooks/useModalBackHandler', () => ({ useModalBackHandler: vi.fn() }));

const ingredients: Ingredient[] = [
  {
    id: 'i1',
    name: { vi: 'Ức gà', en: 'Chicken breast' },
    caloriesPer100: 165,
    proteinPer100: 31,
    carbsPer100: 0,
    fatPer100: 3.6,
    fiberPer100: 0,
    unit: { vi: 'g', en: 'g' },
  },
  {
    id: 'i2',
    name: { vi: 'Cơm trắng', en: 'White rice' },
    caloriesPer100: 130,
    proteinPer100: 2.7,
    carbsPer100: 28,
    fatPer100: 0.3,
    fiberPer100: 0.4,
    unit: { vi: 'g', en: 'g' },
  },
  {
    id: 'i3',
    name: { vi: 'Yến mạch', en: 'Oatmeal' },
    caloriesPer100: 389,
    proteinPer100: 16.9,
    carbsPer100: 66,
    fatPer100: 6.9,
    fiberPer100: 10.6,
    unit: { vi: 'g', en: 'g' },
  },
];

const dishes: Dish[] = [
  {
    id: 'd1',
    name: { vi: 'Gà nướng', en: 'Grilled chicken' },
    ingredients: [{ ingredientId: 'i1', amount: 200 }],
    tags: ['lunch', 'dinner'],
  },
  {
    id: 'd2',
    name: { vi: 'Cơm gà', en: 'Chicken rice' },
    ingredients: [
      { ingredientId: 'i1', amount: 100 },
      { ingredientId: 'i2', amount: 200 },
    ],
    tags: ['lunch'],
  },
  {
    id: 'd3',
    name: { vi: 'Cháo gà', en: 'Chicken porridge' },
    ingredients: [{ ingredientId: 'i1', amount: 50 }],
    tags: ['breakfast'],
  },
  {
    id: 'd4',
    name: { vi: 'Yến mạch trái cây', en: 'Fruit oatmeal' },
    ingredients: [{ ingredientId: 'i3', amount: 100 }],
    tags: ['breakfast'],
  },
  {
    id: 'd5',
    name: { vi: 'Gà xào', en: 'Stir-fried chicken' },
    ingredients: [{ ingredientId: 'i1', amount: 150 }],
    tags: ['dinner'],
  },
];

const emptyPlan: DayPlan = {
  date: '2024-01-15',
  breakfastDishIds: [],
  lunchDishIds: [],
  dinnerDishIds: [],
};

const populatedPlan: DayPlan = {
  date: '2024-01-15',
  breakfastDishIds: ['d3'],
  lunchDishIds: ['d1'],
  dinnerDishIds: ['d5'],
};

describe('MealPlannerModal', () => {
  const defaultProps = {
    dishes,
    ingredients,
    currentPlan: emptyPlan,
    selectedDate: '2024-01-15',
    initialTab: 'lunch' as const,
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  describe('Rendering', () => {
    it('renders with correct title including selected date', () => {
      render(<MealPlannerModal {...defaultProps} />);
      expect(screen.getByText(/Kế hoạch bữa ăn/)).toBeInTheDocument();
      expect(screen.getByText(/2024-01-15/)).toBeInTheDocument();
    });

    it('renders subtitle text', () => {
      render(<MealPlannerModal {...defaultProps} />);
      expect(screen.getByText('Chọn món cho từng bữa')).toBeInTheDocument();
    });

    it('renders all 3 meal tabs', () => {
      render(<MealPlannerModal {...defaultProps} />);
      expect(screen.getByText('Bữa Sáng')).toBeInTheDocument();
      expect(screen.getByText('Bữa Trưa')).toBeInTheDocument();
      expect(screen.getByText('Bữa Tối')).toBeInTheDocument();
    });

    it('renders search input', () => {
      render(<MealPlannerModal {...defaultProps} />);
      expect(screen.getByTestId('input-search-plan')).toBeInTheDocument();
    });

    it('renders filter button', () => {
      render(<MealPlannerModal {...defaultProps} />);
      expect(screen.getByTestId('btn-filter')).toBeInTheDocument();
    });

    it('renders confirm button', () => {
      render(<MealPlannerModal {...defaultProps} />);
      expect(screen.getByTestId('btn-confirm-plan')).toBeInTheDocument();
    });

    it('renders close button with aria-label', () => {
      render(<MealPlannerModal {...defaultProps} />);
      expect(screen.getByLabelText('Đóng hộp thoại')).toBeInTheDocument();
    });

    it('renders total day summary in footer', () => {
      render(<MealPlannerModal {...defaultProps} />);
      expect(screen.getByText(/Tổng ngày/)).toBeInTheDocument();
    });
  });

  describe('Dish list display', () => {
    it('displays dishes matching the active tab tag', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      expect(screen.getByText('Gà nướng')).toBeInTheDocument();
      expect(screen.getByText('Cơm gà')).toBeInTheDocument();
      expect(screen.queryByText('Cháo gà')).not.toBeInTheDocument();
    });

    it('displays breakfast dishes when breakfast tab is active', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="breakfast" />);
      expect(screen.getByText('Cháo gà')).toBeInTheDocument();
      expect(screen.getByText('Yến mạch trái cây')).toBeInTheDocument();
      expect(screen.queryByText('Cơm gà')).not.toBeInTheDocument();
    });

    it('displays dinner dishes when dinner tab is active', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="dinner" />);
      expect(screen.getByText('Gà nướng')).toBeInTheDocument();
      expect(screen.getByText('Gà xào')).toBeInTheDocument();
      expect(screen.queryByText('Cơm gà')).not.toBeInTheDocument();
    });

    it('shows nutrition pills (kcal and protein) on dish cards', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      expect(screen.getAllByText(/kcal/).length).toBeGreaterThan(0);
    });

    it('defaults to breakfast tab when no initialTab is provided', () => {
      render(<MealPlannerModal {...defaultProps} initialTab={undefined} />);
      expect(screen.getByText('Cháo gà')).toBeInTheDocument();
      expect(screen.getByText('Yến mạch trái cây')).toBeInTheDocument();
    });
  });

  describe('Search input filters dishes', () => {
    it('filters dishes matching search query', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      const search = screen.getByTestId('input-search-plan');
      fireEvent.change(search, { target: { value: 'Cơm' } });
      expect(screen.getByText('Cơm gà')).toBeInTheDocument();
      expect(screen.queryByText('Gà nướng')).not.toBeInTheDocument();
    });

    it('filters are case-insensitive', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      const search = screen.getByTestId('input-search-plan');
      fireEvent.change(search, { target: { value: 'gà' } });
      expect(screen.getByText('Gà nướng')).toBeInTheDocument();
      expect(screen.getByText('Cơm gà')).toBeInTheDocument();
    });

    it('keeps search query across tab switches', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      const search = screen.getByTestId('input-search-plan');
      fireEvent.change(search, { target: { value: 'Cơm' } });
      fireEvent.click(screen.getByText('Bữa Sáng'));
      expect((search as HTMLInputElement).value).toBe('Cơm');
    });
  });

  describe('Selecting a dish adds it to selection', () => {
    it('clicking a dish selects it and updates tab count', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      fireEvent.click(screen.getByText('Gà nướng'));
      const footer = screen.getByTestId('btn-confirm-plan').closest('div')?.parentElement;
      expect(footer?.textContent).toContain('1');
    });

    it('selecting multiple dishes accumulates count', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      fireEvent.click(screen.getByText('Gà nướng'));
      fireEvent.click(screen.getByText('Cơm gà'));
      const footer = screen.getByTestId('btn-confirm-plan').closest('div')?.parentElement;
      expect(footer?.textContent).toContain('2');
    });
  });

  describe('Deselecting a dish removes it from selection', () => {
    it('clicking a selected dish deselects it', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      fireEvent.click(screen.getByText('Gà nướng'));
      fireEvent.click(screen.getByText('Gà nướng'));
      const footer = screen.getByTestId('btn-confirm-plan').closest('div')?.parentElement;
      expect(footer?.textContent).toContain('0');
    });

    it('deselecting one dish does not affect another selected dish', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      fireEvent.click(screen.getByText('Gà nướng'));
      fireEvent.click(screen.getByText('Cơm gà'));
      fireEvent.click(screen.getByText('Gà nướng'));
      const lunchTab = screen.getByText('Bữa Trưa').closest('button');
      expect(lunchTab?.textContent).toContain('1');
    });
  });

  describe('Confirm button calls onConfirm with selected dishes', () => {
    it('calls onConfirm with only changed tab data', () => {
      render(<MealPlannerModal {...defaultProps} currentPlan={emptyPlan} initialTab="lunch" />);
      fireEvent.click(screen.getByText('Gà nướng'));
      fireEvent.click(screen.getByTestId('btn-confirm-plan'));
      expect(defaultProps.onConfirm).toHaveBeenCalledWith({ lunch: ['d1'] });
    });

    it('calls onConfirm with changes from multiple tabs', () => {
      render(<MealPlannerModal {...defaultProps} currentPlan={emptyPlan} initialTab="lunch" />);
      fireEvent.click(screen.getByText('Gà nướng'));
      fireEvent.click(screen.getByText('Bữa Sáng'));
      fireEvent.click(screen.getByText('Cháo gà'));
      fireEvent.click(screen.getByTestId('btn-confirm-plan'));
      expect(defaultProps.onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ lunch: ['d1'], breakfast: ['d3'] }),
      );
    });

    it('calls onConfirm with empty object when nothing changed', () => {
      render(<MealPlannerModal {...defaultProps} currentPlan={emptyPlan} />);
      fireEvent.click(screen.getByTestId('btn-confirm-plan'));
      expect(defaultProps.onConfirm).toHaveBeenCalledWith({});
    });

    it('does not include unchanged tabs in onConfirm payload', () => {
      render(<MealPlannerModal {...defaultProps} currentPlan={populatedPlan} initialTab="lunch" />);
      fireEvent.click(screen.getByTestId('btn-confirm-plan'));
      expect(defaultProps.onConfirm).toHaveBeenCalledWith({});
    });

    it('shows single-tab confirm label when 1 tab changed', () => {
      render(<MealPlannerModal {...defaultProps} currentPlan={emptyPlan} initialTab="lunch" />);
      fireEvent.click(screen.getByText('Gà nướng'));
      expect(screen.getByText(/Xác nhận \(1\)/)).toBeInTheDocument();
    });

    it('shows "Lưu tất cả" when multiple tabs changed', () => {
      render(<MealPlannerModal {...defaultProps} currentPlan={emptyPlan} initialTab="lunch" />);
      fireEvent.click(screen.getByText('Gà nướng'));
      fireEvent.click(screen.getByText('Bữa Sáng'));
      fireEvent.click(screen.getByText('Cháo gà'));
      expect(screen.getByText(/Lưu tất cả/)).toBeInTheDocument();
    });
  });

  describe('Cancel/close calls onClose', () => {
    it('calls onClose when close button (X) is clicked', () => {
      render(<MealPlannerModal {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Đóng hộp thoại'));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop is clicked', () => {
      render(<MealPlannerModal {...defaultProps} />);
      const backdropBtn = screen.getByLabelText('Đóng');
      fireEvent.click(backdropBtn);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Shows empty state when no dishes match search', () => {
    it('shows empty state for dishes list when no dishes exist for tab', () => {
      render(<MealPlannerModal {...defaultProps} dishes={[]} />);
      expect(screen.getByText(/Chưa có món ăn phù hợp/)).toBeInTheDocument();
    });

    it('shows empty state when search matches nothing', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      const search = screen.getByTestId('input-search-plan');
      fireEvent.change(search, { target: { value: 'không tồn tại xyz' } });
      expect(screen.queryByText('Gà nướng')).not.toBeInTheDocument();
      expect(screen.queryByText('Cơm gà')).not.toBeInTheDocument();
    });

    it('shows hint text in empty state', () => {
      render(<MealPlannerModal {...defaultProps} dishes={[]} />);
      expect(screen.getByText(/Hãy thêm món ăn/)).toBeInTheDocument();
    });
  });

  describe('Tab switching works correctly', () => {
    it('switches from lunch to breakfast and shows correct dishes', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      fireEvent.click(screen.getByText('Bữa Sáng'));
      expect(screen.getByText('Cháo gà')).toBeInTheDocument();
      expect(screen.queryByText('Cơm gà')).not.toBeInTheDocument();
    });

    it('switches from lunch to dinner and shows correct dishes', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      fireEvent.click(screen.getByText('Bữa Tối'));
      expect(screen.getByText('Gà xào')).toBeInTheDocument();
      expect(screen.queryByText('Cơm gà')).not.toBeInTheDocument();
    });

    it('preserves selections across tab switches', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      fireEvent.click(screen.getByText('Gà nướng'));
      fireEvent.click(screen.getByText('Bữa Sáng'));
      fireEvent.click(screen.getByText('Bữa Trưa'));
      const lunchTab = screen.getByText('Bữa Trưa').closest('button');
      expect(lunchTab?.textContent).toContain('1');
    });

    it('shows tab badge count for pre-selected dishes', () => {
      render(<MealPlannerModal {...defaultProps} currentPlan={populatedPlan} initialTab="lunch" />);
      const breakfastTab = screen.getByText('Bữa Sáng').closest('button');
      expect(breakfastTab?.textContent).toContain('1');
    });

    it('shows change indicator dot when tab has unsaved changes', () => {
      render(<MealPlannerModal {...defaultProps} currentPlan={emptyPlan} initialTab="lunch" />);
      fireEvent.click(screen.getByText('Gà nướng'));
      const lunchTab = screen.getByText('Bữa Trưa').closest('button');
      const dot = lunchTab?.querySelector('.rounded-full.w-2');
      expect(dot).toBeTruthy();
    });

    it('does not show change indicator when tab is unchanged', () => {
      render(<MealPlannerModal {...defaultProps} currentPlan={emptyPlan} initialTab="lunch" />);
      const breakfastTab = screen.getByText('Bữa Sáng').closest('button');
      const dot = breakfastTab?.querySelector('.rounded-full.w-2');
      expect(dot).toBeNull();
    });
  });

  describe('Pre-selected dishes are checked on open', () => {
    it('shows pre-selected lunch dishes from currentPlan', () => {
      render(<MealPlannerModal {...defaultProps} currentPlan={populatedPlan} initialTab="lunch" />);
      const footer = screen.getByTestId('btn-confirm-plan').closest('div')?.parentElement;
      expect(footer?.textContent).toContain('1');
    });

    it('shows pre-selected breakfast dishes from currentPlan', () => {
      render(<MealPlannerModal {...defaultProps} currentPlan={populatedPlan} initialTab="breakfast" />);
      const breakfastTab = screen.getByText('Bữa Sáng').closest('button');
      expect(breakfastTab?.textContent).toContain('1');
    });

    it('shows pre-selected dinner dishes from currentPlan', () => {
      render(<MealPlannerModal {...defaultProps} currentPlan={populatedPlan} initialTab="dinner" />);
      const dinnerTab = screen.getByText('Bữa Tối').closest('button');
      expect(dinnerTab?.textContent).toContain('1');
    });

    it('shows total day count across all pre-selected meals', () => {
      render(<MealPlannerModal {...defaultProps} currentPlan={populatedPlan} initialTab="lunch" />);
      const footer = screen.getByTestId('btn-confirm-plan').closest('div')?.parentElement;
      expect(footer?.textContent).toContain('3 món');
    });
  });

  describe('Sorting', () => {
    it('opens FilterBottomSheet when filter button clicked', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      expect(screen.queryByTestId('filter-bottom-sheet')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('btn-filter'));
      expect(screen.getByTestId('filter-bottom-sheet')).toBeInTheDocument();
    });

    it('sorts by name descending', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      fireEvent.click(screen.getByTestId('btn-filter'));
      fireEvent.click(screen.getByText('Tên (Z-A)'));
      fireEvent.click(screen.getByTestId('filter-apply-btn'));
      expect(screen.getByText('Gà nướng')).toBeInTheDocument();
      expect(screen.getByText('Cơm gà')).toBeInTheDocument();
    });

    it('sorts by calories ascending', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      fireEvent.click(screen.getByTestId('btn-filter'));
      fireEvent.click(screen.getByText('Calo (Thấp → Cao)'));
      fireEvent.click(screen.getByTestId('filter-apply-btn'));
      const calMatches = screen.getAllByText(/kcal/);
      expect(calMatches[0].textContent).toContain('330');
    });

    it('sorts by calories descending', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      fireEvent.click(screen.getByTestId('btn-filter'));
      fireEvent.click(screen.getByText('Calo (Cao → Thấp)'));
      fireEvent.click(screen.getByTestId('filter-apply-btn'));
      const calMatches = screen.getAllByText(/kcal/);
      expect(calMatches[0].textContent).toContain('425');
    });

    it('sorts by protein ascending', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      fireEvent.click(screen.getByTestId('btn-filter'));
      fireEvent.click(screen.getByText('Protein (Thấp → Cao)'));
      fireEvent.click(screen.getByTestId('filter-apply-btn'));
      const dishNames = screen.getAllByText(/gà/i);
      expect(dishNames[0].textContent).toContain('Cơm gà');
    });

    it('sorts by protein descending', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      fireEvent.click(screen.getByTestId('btn-filter'));
      fireEvent.click(screen.getByText('Protein (Cao → Thấp)'));
      fireEvent.click(screen.getByTestId('filter-apply-btn'));
      const dishNames = screen.getAllByText(/gà/i);
      expect(dishNames[0].textContent).toContain('Gà nướng');
    });

    it('combines search filter with sort order', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      const search = screen.getByTestId('input-search-plan');
      fireEvent.change(search, { target: { value: 'gà' } });
      fireEvent.click(screen.getByTestId('btn-filter'));
      fireEvent.click(screen.getByText('Calo (Cao → Thấp)'));
      fireEvent.click(screen.getByTestId('filter-apply-btn'));
      expect(screen.getByText('Gà nướng')).toBeInTheDocument();
      expect(screen.getByText('Cơm gà')).toBeInTheDocument();
    });
  });

  describe('Calorie filters', () => {
    it('hides dishes exceeding calorie limit', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      expect(screen.getByText('Gà nướng')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('btn-filter'));
      fireEvent.click(screen.getByText('< 300 kcal'));
      fireEvent.click(screen.getByTestId('filter-apply-btn'));
      expect(screen.queryByText('Gà nướng')).not.toBeInTheDocument();
      expect(screen.queryByText('Cơm gà')).not.toBeInTheDocument();
    });

    it('shows active filter indicator dot', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      const filterBtn = screen.getByTestId('btn-filter');
      expect(filterBtn.querySelector('.bg-primary')).toBeNull();
      fireEvent.click(filterBtn);
      fireEvent.click(screen.getByText('< 500 kcal'));
      fireEvent.click(screen.getByTestId('filter-apply-btn'));
      expect(screen.getByTestId('btn-filter').querySelector('.bg-primary')).toBeTruthy();
    });
  });

  describe('Remaining budget display', () => {
    it('shows remaining budget when targets provided and dishes selected', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" targetCalories={2000} targetProtein={150} />);
      fireEvent.click(screen.getByText('Gà nướng'));
      expect(screen.getByTestId('meal-planner-remaining-budget')).toBeInTheDocument();
      expect(screen.getByTestId('meal-planner-remaining-cal')).toBeInTheDocument();
      expect(screen.getByTestId('meal-planner-remaining-pro')).toBeInTheDocument();
    });

    it('shows protein remaining with "g Pro" unit for clarity', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" targetCalories={2000} targetProtein={150} />);
      fireEvent.click(screen.getByText('Gà nướng'));
      const proRemaining = screen.getByTestId('meal-planner-remaining-pro');
      expect(proRemaining.textContent).toContain('g Pro');
    });

    it('does not show remaining budget when no targets provided', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
      fireEvent.click(screen.getByText('Gà nướng'));
      expect(screen.queryByTestId('meal-planner-remaining-budget')).not.toBeInTheDocument();
    });

    it('does not show remaining budget when no dishes selected', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" targetCalories={2000} targetProtein={150} />);
      expect(screen.queryByTestId('meal-planner-remaining-budget')).not.toBeInTheDocument();
    });

    it('shows green text when remaining budget is positive', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" targetCalories={2000} targetProtein={150} />);
      fireEvent.click(screen.getByText('Gà nướng'));
      const calRemaining = screen.getByTestId('meal-planner-remaining-cal');
      expect(calRemaining.className).toContain('text-primary');
      expect(calRemaining.textContent).toContain('Còn lại');
    });

    it('shows red text when budget is exceeded', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" targetCalories={100} targetProtein={10} />);
      fireEvent.click(screen.getByText('Gà nướng'));
      const calRemaining = screen.getByTestId('meal-planner-remaining-cal');
      expect(calRemaining.className).toContain('text-destructive');
      expect(calRemaining.textContent).toContain('Vượt');
    });

    it('updates remaining budget as dishes are toggled', () => {
      render(<MealPlannerModal {...defaultProps} initialTab="lunch" targetCalories={2000} targetProtein={200} />);
      fireEvent.click(screen.getByText('Gà nướng'));
      const initialText = screen.getByTestId('meal-planner-remaining-cal').textContent;
      fireEvent.click(screen.getByText('Cơm gà'));
      const updatedText = screen.getByTestId('meal-planner-remaining-cal').textContent;
      expect(updatedText).not.toBe(initialText);
    });

    it('shows remaining budget for pre-populated plan', () => {
      render(
        <MealPlannerModal
          {...defaultProps}
          currentPlan={populatedPlan}
          initialTab="lunch"
          targetCalories={2000}
          targetProtein={150}
        />,
      );
      expect(screen.getByTestId('meal-planner-remaining-budget')).toBeInTheDocument();
    });
  });

  describe('Nutrition summary', () => {
    it('shows active tab nutrition when dishes selected', () => {
      render(<MealPlannerModal {...defaultProps} currentPlan={populatedPlan} initialTab="lunch" />);
      const calMatches = screen.getAllByText(/330/);
      expect(calMatches.length).toBeGreaterThan(0);
    });

    it('shows total nutrition for multiple selected dishes', () => {
      render(
        <MealPlannerModal
          {...defaultProps}
          currentPlan={{ ...emptyPlan, lunchDishIds: ['d1', 'd2'] }}
          initialTab="lunch"
        />,
      );
      const footer = screen.getByTestId('btn-confirm-plan').closest('div')?.parentElement;
      expect(footer?.textContent).toContain('2');
      const calMatches = screen.getAllByText(/755/);
      expect(calMatches.length).toBeGreaterThan(0);
    });
  });
});
