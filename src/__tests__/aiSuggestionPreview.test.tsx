import { render, screen, fireEvent } from '@testing-library/react';
import { AISuggestionPreviewModal } from '../components/modals/AISuggestionPreviewModal';
import { Dish, Ingredient, MealPlanSuggestion } from '../types';

vi.mock('../hooks/useModalBackHandler', () => ({ useModalBackHandler: vi.fn() }));

const ingredients: Ingredient[] = [
  { id: 'i1', name: { vi: 'Ức gà', en: 'Ức gà' }, caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, fiberPer100: 0, unit: { vi: 'g', en: 'g' } },
  { id: 'i2', name: { vi: 'Cơm trắng', en: 'Cơm trắng' }, caloriesPer100: 130, proteinPer100: 2.7, carbsPer100: 28, fatPer100: 0.3, fiberPer100: 0.4, unit: { vi: 'g', en: 'g' } },
];

const dishes: Dish[] = [
  { id: 'd1', name: { vi: 'Gà nướng', en: 'Gà nướng' }, ingredients: [{ ingredientId: 'i1', amount: 200 }], tags: ['lunch', 'dinner'] },
  { id: 'd2', name: { vi: 'Cơm gà', en: 'Cơm gà' }, ingredients: [{ ingredientId: 'i1', amount: 100 }, { ingredientId: 'i2', amount: 200 }], tags: ['lunch'] },
  { id: 'd3', name: { vi: 'Cháo gà', en: 'Cháo gà' }, ingredients: [{ ingredientId: 'i1', amount: 50 }], tags: ['breakfast'] },
];

const suggestion: MealPlanSuggestion = {
  breakfastDishIds: ['d3'],
  lunchDishIds: ['d2'],
  dinnerDishIds: ['d1'],
  reasoning: 'Thực đơn cân bằng protein',
};

const defaultProps = {
  isOpen: true,
  suggestion,
  dishes,
  ingredients,
  targetCalories: 2000,
  targetProtein: 100,
  isLoading: false,
  error: null as string | null,
  onClose: vi.fn(),
  onApply: vi.fn(),
  onRegenerate: vi.fn(),
  onEditMeal: vi.fn(),
};

describe('AISuggestionPreviewModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when isOpen is false', () => {
    const { container } = render(<AISuggestionPreviewModal {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders header with title', () => {
    render(<AISuggestionPreviewModal {...defaultProps} />);
    expect(screen.getByText('Gợi ý bữa ăn từ AI')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<AISuggestionPreviewModal {...defaultProps} isLoading={true} />);
    expect(screen.getByText('AI đang phân tích...')).toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    render(<AISuggestionPreviewModal {...defaultProps} error="Lỗi kết nối" suggestion={null} />);
    expect(screen.getByText('Không thể tạo gợi ý')).toBeInTheDocument();
    expect(screen.getByText('Lỗi kết nối')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Thử lại'));
    expect(defaultProps.onRegenerate).toHaveBeenCalled();
  });

  it('shows empty suggestion state', () => {
    const emptySuggestion: MealPlanSuggestion = {
      breakfastDishIds: [], lunchDishIds: [], dinnerDishIds: [], reasoning: '',
    };
    render(<AISuggestionPreviewModal {...defaultProps} suggestion={emptySuggestion} />);
    expect(screen.getByText('Chưa tìm được gợi ý phù hợp')).toBeInTheDocument();
  });

  it('renders meal cards with dish names', () => {
    render(<AISuggestionPreviewModal {...defaultProps} />);
    expect(screen.getByText('Gà nướng')).toBeInTheDocument();
    expect(screen.getByText('Cơm gà')).toBeInTheDocument();
    expect(screen.getByText('Cháo gà')).toBeInTheDocument();
  });

  it('shows reasoning card', () => {
    render(<AISuggestionPreviewModal {...defaultProps} />);
    expect(screen.getByText('Lý do gợi ý')).toBeInTheDocument();
    expect(screen.getByText('Thực đơn cân bằng protein')).toBeInTheDocument();
  });

  it('toggles meal selection via checkbox', () => {
    render(<AISuggestionPreviewModal {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    // All should be checked initially
    checkboxes.forEach(cb => expect(cb).toBeChecked());
    // Uncheck first one
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();
  });

  it('calls onApply with selected meals', () => {
    render(<AISuggestionPreviewModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Áp dụng'));
    expect(defaultProps.onApply).toHaveBeenCalledWith({ breakfast: true, lunch: true, dinner: true });
  });

  it('calls onClose when close button clicked', () => {
    render(<AISuggestionPreviewModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Hủy'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onEditMeal when edit button is clicked', () => {
    render(<AISuggestionPreviewModal {...defaultProps} />);
    const editBtns = screen.getAllByText('Thay đổi');
    fireEvent.click(editBtns[0]);
    expect(defaultProps.onEditMeal).toHaveBeenCalled();
  });

  it('shows total nutrition summary', () => {
    render(<AISuggestionPreviewModal {...defaultProps} />);
    expect(screen.getByText(/Tổng cộng/)).toBeInTheDocument();
    expect(screen.getByText(/Mục tiêu/)).toBeInTheDocument();
  });

  it('renders nutrition progress bars with percentages', () => {
    render(<AISuggestionPreviewModal {...defaultProps} />);
    // Should display calorie and protein percentage
    const percentages = screen.getAllByText(/%$/);
    expect(percentages.length).toBeGreaterThanOrEqual(2);
  });

  it('does not render meal card when meal type has no dishes', () => {
    const partialSuggestion: MealPlanSuggestion = {
      breakfastDishIds: [],
      lunchDishIds: ['d2'],
      dinnerDishIds: ['d1'],
      reasoning: 'No breakfast today',
    };
    render(<AISuggestionPreviewModal {...defaultProps} suggestion={partialSuggestion} />);
    // Should NOT render the breakfast meal card since it has no dishes
    // Check that only lunch and dinner checkboxes are rendered
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
  });
});
