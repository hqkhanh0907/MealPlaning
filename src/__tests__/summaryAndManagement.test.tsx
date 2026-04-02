import { fireEvent, render, screen } from '@testing-library/react';

import { ManagementTab } from '../components/ManagementTab';
import { Summary } from '../components/Summary';
import type { DayNutritionSummary, Dish, Ingredient } from '../types';

// Mock notification
const mockNotify = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismissAll: vi.fn() };
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => mockNotify,
}));

// Mock child components for ManagementTab
vi.mock('../components/DishManager', () => ({
  DishManager: () => <div data-testid="dish-manager">DishManager</div>,
}));
vi.mock('../components/IngredientManager', () => ({
  IngredientManager: () => <div data-testid="ingredient-manager">IngredientManager</div>,
}));

const makeSlot = (dishIds: string[], cal: number, pro: number, carbs = 0, fat = 0, fiber = 0) => ({
  dishIds,
  calories: cal,
  protein: pro,
  carbs,
  fat,
  fiber,
});

const makeNutrition = (): DayNutritionSummary => ({
  breakfast: makeSlot(['d1'], 400, 20, 50, 15, 5),
  lunch: makeSlot(['d2'], 600, 30, 70, 20, 8),
  dinner: makeSlot(['d3'], 500, 25, 60, 18, 6),
});

// --- Summary ---
describe('Summary', () => {
  it('renders all nutrition info', () => {
    render(<Summary dayNutrition={makeNutrition()} targetCalories={2000} targetProtein={100} />);
    expect(screen.getByText('Dinh dưỡng trong ngày')).toBeInTheDocument();
    expect(screen.getByText('Calo')).toBeInTheDocument();
    expect(screen.getByText('Protein')).toBeInTheDocument();
    expect(screen.getByText('Carbs')).toBeInTheDocument();
    expect(screen.getByText('Béo')).toBeInTheDocument();
    expect(screen.getByText('Chất xơ')).toBeInTheDocument();
  });

  it('shows total calories and protein values', () => {
    render(<Summary dayNutrition={makeNutrition()} targetCalories={2000} targetProtein={100} />);
    // Total calories: 400+600+500 = 1500
    expect(screen.getByText('1500')).toBeInTheDocument();
    // Total protein: 20+30+25 = 75
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('shows target in subtitle', () => {
    render(<Summary dayNutrition={makeNutrition()} targetCalories={2000} targetProtein={100} />);
    expect(screen.getByText(/2000 kcal/)).toBeInTheDocument();
    expect(screen.getByText(/100g Protein/)).toBeInTheDocument();
  });

  it('renders progress bars with correct aria attributes', () => {
    render(<Summary dayNutrition={makeNutrition()} targetCalories={2000} targetProtein={100} />);
    const calBar = screen.getByRole('progressbar', { name: 'Calo' });
    expect(calBar).toHaveAttribute('value', '1500');
    expect(calBar).toHaveAttribute('max', '2000');
  });

  it('renders edit goals button when onEditGoals is provided', () => {
    const onEditGoals = vi.fn();
    render(
      <Summary dayNutrition={makeNutrition()} targetCalories={2000} targetProtein={100} onEditGoals={onEditGoals} />,
    );
    const editBtn = screen.getByLabelText('Chỉnh sửa mục tiêu dinh dưỡng');
    fireEvent.click(editBtn);
    expect(onEditGoals).toHaveBeenCalled();
  });

  it('does not render edit button when no onEditGoals', () => {
    render(<Summary dayNutrition={makeNutrition()} targetCalories={2000} targetProtein={100} />);
    expect(screen.queryByLabelText('Chỉnh sửa mục tiêu dinh dưỡng')).not.toBeInTheDocument();
  });

  it('handles over-target calories (>100%)', () => {
    const overNutrition: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 1000, 40),
      lunch: makeSlot(['d2'], 1000, 40),
      dinner: makeSlot(['d3'], 1000, 40),
    };
    render(<Summary dayNutrition={overNutrition} targetCalories={2000} targetProtein={100} />);
    expect(screen.getByText('3000')).toBeInTheDocument();
  });

  it('shows remaining calories when under target', () => {
    render(<Summary dayNutrition={makeNutrition()} targetCalories={2000} targetProtein={100} />);
    // Remaining: 2000 - 1500 = 500
    expect(screen.getByTestId('remaining-calories')).toHaveTextContent('500');
    expect(screen.getByTestId('remaining-calories')).toHaveTextContent('kcal');
  });

  it('shows remaining protein when under target', () => {
    render(<Summary dayNutrition={makeNutrition()} targetCalories={2000} targetProtein={100} />);
    // Remaining: 100 - 75 = 25
    expect(screen.getByTestId('remaining-protein')).toHaveTextContent('25');
    expect(screen.getByTestId('remaining-protein')).toHaveTextContent('g');
  });

  it('shows over text when calories exceed target', () => {
    const overNutrition: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 1000, 40),
      lunch: makeSlot(['d2'], 1000, 40),
      dinner: makeSlot(['d3'], 1000, 40),
    };
    render(<Summary dayNutrition={overNutrition} targetCalories={2000} targetProtein={100} />);
    // Over: 3000 - 2000 = 1000
    expect(screen.getByTestId('remaining-calories')).toHaveTextContent('1000');
  });

  it('shows over text when protein exceeds target', () => {
    const overNutrition: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 500, 50),
      lunch: makeSlot(['d2'], 500, 50),
      dinner: makeSlot(['d3'], 500, 50),
    };
    render(<Summary dayNutrition={overNutrition} targetCalories={2000} targetProtein={100} />);
    // Over: 150 - 100 = 50
    expect(screen.getByTestId('remaining-protein')).toHaveTextContent('50');
  });

  it('shows per-meal details toggle button', () => {
    render(<Summary dayNutrition={makeNutrition()} targetCalories={2000} targetProtein={100} />);
    expect(screen.getByTestId('btn-macro-details')).toBeInTheDocument();
    expect(screen.getByText('Chi tiết theo bữa')).toBeInTheDocument();
  });

  it('expands per-meal details table on toggle click', () => {
    render(<Summary dayNutrition={makeNutrition()} targetCalories={2000} targetProtein={100} />);
    expect(screen.queryByTestId('macro-details')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-macro-details'));
    expect(screen.getByTestId('macro-details')).toBeInTheDocument();
    expect(screen.getByText('Ẩn chi tiết')).toBeInTheDocument();
  });

  it('collapses per-meal details on second toggle click', () => {
    render(<Summary dayNutrition={makeNutrition()} targetCalories={2000} targetProtein={100} />);
    fireEvent.click(screen.getByTestId('btn-macro-details'));
    expect(screen.getByTestId('macro-details')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-macro-details'));
    expect(screen.queryByTestId('macro-details')).not.toBeInTheDocument();
  });

  it('shows correct per-meal macro values in details table', () => {
    const nutrition = makeNutrition();
    render(<Summary dayNutrition={nutrition} targetCalories={2000} targetProtein={100} />);
    fireEvent.click(screen.getByTestId('btn-macro-details'));
    const table = screen.getByTestId('macro-details');
    expect(table).toHaveTextContent('Sáng');
    expect(table).toHaveTextContent('Trưa');
    expect(table).toHaveTextContent('Tối');
    expect(table).toHaveTextContent('Tổng');
  });
});

// --- ManagementTab ---
describe('ManagementTab', () => {
  const mockIngredients: Ingredient[] = [];
  const mockDishes: Dish[] = [];
  const defaultProps = {
    activeSubTab: 'dishes' as const,
    onSubTabChange: vi.fn(),
    ingredients: mockIngredients,
    dishes: mockDishes,
    onAddIngredient: vi.fn(),
    onUpdateIngredient: vi.fn(),
    onDeleteIngredient: vi.fn(),
    isIngredientUsed: vi.fn().mockReturnValue(false),
    onAddDish: vi.fn(),
    onUpdateDish: vi.fn(),
    onDeleteDish: vi.fn(),
    isDishUsed: vi.fn().mockReturnValue(false),
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders title and sub tabs', () => {
    render(<ManagementTab {...defaultProps} />);
    expect(screen.getByText('Thư viện dữ liệu')).toBeInTheDocument();
    expect(screen.getByText('Món ăn')).toBeInTheDocument();
    expect(screen.getByText('Nguyên liệu')).toBeInTheDocument();
  });

  it('renders DishManager when activeSubTab is dishes', () => {
    render(<ManagementTab {...defaultProps} activeSubTab="dishes" />);
    expect(screen.getByTestId('dish-manager')).toBeInTheDocument();
  });

  it('renders IngredientManager when activeSubTab is ingredients', () => {
    render(<ManagementTab {...defaultProps} activeSubTab="ingredients" />);
    expect(screen.getByTestId('ingredient-manager')).toBeInTheDocument();
  });

  it('calls onSubTabChange when tab button is clicked', () => {
    render(<ManagementTab {...defaultProps} activeSubTab="dishes" />);
    fireEvent.click(screen.getByText('Nguyên liệu'));
    expect(defaultProps.onSubTabChange).toHaveBeenCalledWith('ingredients');
  });
});
