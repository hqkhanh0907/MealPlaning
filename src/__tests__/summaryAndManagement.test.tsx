import { fireEvent, render, screen } from '@testing-library/react';

import { ManagementTab } from '../components/ManagementTab';
import type { Dish, Ingredient } from '../types';

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
