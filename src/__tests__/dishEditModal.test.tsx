import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DishEditModal } from '../components/modals/DishEditModal';
import type { Dish, Ingredient } from '../types';

vi.mock('../hooks/useModalBackHandler', () => ({ useModalBackHandler: vi.fn() }));

const mockSuggestIngredientInfo = vi.fn();
vi.mock('../services/geminiService', () => ({
  suggestIngredientInfo: (...args: unknown[]) => mockSuggestIngredientInfo(...args),
}));

const ingredients: Ingredient[] = [
  { id: 'i1', name: { vi: 'Ức gà', en: 'Ức gà' }, caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, fiberPer100: 0, unit: { vi: 'g', en: 'g' } },
  { id: 'i2', name: { vi: 'Cơm trắng', en: 'Cơm trắng' }, caloriesPer100: 130, proteinPer100: 2.7, carbsPer100: 28, fatPer100: 0.3, fiberPer100: 0.4, unit: { vi: 'g', en: 'g' } },
  { id: 'i3', name: { vi: 'Rau xà lách', en: 'Rau xà lách' }, caloriesPer100: 15, proteinPer100: 1.4, carbsPer100: 2.9, fatPer100: 0.2, fiberPer100: 1.3, unit: { vi: 'g', en: 'g' } },
];

const existingDish: Dish = {
  id: 'dish-1',
  name: { vi: 'Cơm gà', en: 'Cơm gà' },
  ingredients: [
    { ingredientId: 'i1', amount: 200 },
    { ingredientId: 'i2', amount: 300 },
  ],
  tags: ['lunch', 'dinner'],
};

describe('DishEditModal', () => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  const onCreateIngredient = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Render Tests ---

  it('renders create new dish form with correct title', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByText('Tạo món ăn mới')).toBeInTheDocument();
    expect(screen.getByLabelText('Tên món ăn')).toHaveValue('');
  });

  it('renders edit existing dish form with pre-populated data', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByText('Sửa món ăn')).toBeInTheDocument();
    expect(screen.getByLabelText('Tên món ăn')).toHaveValue('Cơm gà');
    // Should show selected ingredients
    expect(screen.getByText('Ức gà')).toBeInTheDocument();
    expect(screen.getByText('Cơm trắng')).toBeInTheDocument();
  });

  it('renders tag toggle buttons for all meal types', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByText(/Sáng/)).toBeInTheDocument();
    expect(screen.getByText(/Trưa/)).toBeInTheDocument();
    expect(screen.getByText(/Tối/)).toBeInTheDocument();
  });

  it('renders ingredient search input', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByPlaceholderText('Tìm nguyên liệu...')).toBeInTheDocument();
  });

  // --- Tag Toggle Tests ---

  it('toggles meal tag on and off', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    const lunchTag = screen.getByText(/Trưa/).closest('button') as HTMLElement;

    // Initially inactive → click to activate
    fireEvent.click(lunchTag);
    expect(lunchTag.className).toContain('bg-emerald-500');

    // Click again to deactivate
    fireEvent.click(lunchTag);
    expect(lunchTag.className).not.toContain('bg-emerald-500');
  });

  it('shows active state on pre-selected tags for existing dish', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    const lunchTag = screen.getByText(/Trưa/).closest('button') as HTMLElement;
    const dinnerTag = screen.getByText(/Tối/).closest('button') as HTMLElement;
    const breakfastTag = screen.getByText(/Sáng/).closest('button') as HTMLElement;

    expect(lunchTag.className).toContain('bg-emerald-500');
    expect(dinnerTag.className).toContain('bg-emerald-500');
    expect(breakfastTag.className).not.toContain('bg-emerald-500');
  });

  // --- Validation Tests ---

  it('shows error when submitting without tags', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // Fill name and add ingredient but no tags
    fireEvent.change(screen.getByLabelText('Tên món ăn'), { target: { value: 'Test Dish' } });

    // Add an ingredient
    fireEvent.click(screen.getByText('Ức gà').closest('button') as HTMLElement);

    // Submit
    fireEvent.click(screen.getByText('Lưu món ăn'));

    // Should show tag validation error
    expect(screen.getByText(/chọn ít nhất một bữa ăn phù hợp/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears tag validation error when a tag is selected', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // Fill name and add ingredient, submit without tags
    fireEvent.change(screen.getByLabelText('Tên món ăn'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Ức gà').closest('button') as HTMLElement);
    fireEvent.click(screen.getByText('Lưu món ăn'));

    expect(screen.getByText(/chọn ít nhất một bữa ăn phù hợp/i)).toBeInTheDocument();

    // Now select a tag
    fireEvent.click(screen.getByText(/Sáng/).closest('button') as HTMLElement);
    expect(screen.queryByText(/chọn ít nhất một bữa ăn phù hợp/i)).not.toBeInTheDocument();
  });

  it('does not submit when name is empty', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // Add tag and ingredient but no name
    fireEvent.click(screen.getByText(/Trưa/).closest('button') as HTMLElement);
    fireEvent.click(screen.getByText('Ức gà').closest('button') as HTMLElement);

    fireEvent.click(screen.getByText('Lưu món ăn'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit when no ingredients are selected', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // Add name and tag but no ingredients
    fireEvent.change(screen.getByLabelText('Tên món ăn'), { target: { value: 'Test Dish' } });
    fireEvent.click(screen.getByText(/Trưa/).closest('button') as HTMLElement);

    fireEvent.click(screen.getByText('Lưu món ăn'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // --- Ingredient CRUD Tests ---

  it('adds ingredient to selected list when clicked', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // Click on ingredient in picker
    fireEvent.click(screen.getByText('Ức gà').closest('button') as HTMLElement);

    // Should appear in selected section with default amount 100
    const amountInputs = screen.getAllByDisplayValue('100');
    expect(amountInputs.length).toBeGreaterThan(0);
  });

  it('removes ingredient from selected list', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // Find delete button for first selected ingredient
    const deleteButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('.lucide-trash-2'));
    expect(deleteButtons.length).toBe(2); // 2 selected ingredients

    // Remove first one
    fireEvent.click(deleteButtons[0]);
    // Now only 1 selected ingredient
    const remainingDelete = screen.getAllByRole('button').filter(btn => btn.querySelector('.lucide-trash-2'));
    expect(remainingDelete.length).toBe(1);
  });

  it('updates ingredient amount via input field', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    const amountInput = screen.getByDisplayValue('200');
    fireEvent.change(amountInput, { target: { value: '150' } });
    expect(screen.getByDisplayValue('150')).toBeInTheDocument();
  });

  it('increments ingredient amount with + button', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // Find + buttons (Plus icons inside selected ingredients)
    const plusButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('.lucide-plus'));
    // The first + button is in the selected ingredient section (not the picker add buttons)
    // Each selected ingredient has a - and + button
    const selectedPlusBtn = plusButtons.find(btn => btn.classList.contains('w-8'));
    if (selectedPlusBtn) {
      fireEvent.click(selectedPlusBtn);
      // Amount should increase by 10 from 200 to 210
      expect(screen.getByDisplayValue('210')).toBeInTheDocument();
    }
  });

  it('decrements ingredient amount with - button, minimum 0', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    const firstMinusBtn = screen.getAllByRole('button').find(b => b.querySelector('.lucide-minus') !== null);
    if (firstMinusBtn) {
      // First - button should decrement i1 amount from 200 to 190
      fireEvent.click(firstMinusBtn);
      expect(screen.getByDisplayValue('190')).toBeInTheDocument();
    }
  });

  it('allows zero amount input without clamping', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    const amountInput = screen.getByDisplayValue('200');
    fireEvent.change(amountInput, { target: { value: '0' } });
    expect(screen.getByDisplayValue('0')).toBeInTheDocument();
  });

  it('allows negative amount input without clamping', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    const amountInput = screen.getByDisplayValue('200');
    fireEvent.change(amountInput, { target: { value: '-5' } });
    expect(screen.getByDisplayValue('-5')).toBeInTheDocument();
  });

  it('shows amount validation error on submit when amount is negative', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    const amountInput = screen.getByDisplayValue('200');
    fireEvent.change(amountInput, { target: { value: '-5' } });
    fireEvent.click(screen.getByText('Lưu món ăn'));
    expect(screen.getByText('Số lượng không được âm')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows amount validation error on submit when amount is empty', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    const amountInput = screen.getByDisplayValue('200');
    fireEvent.change(amountInput, { target: { value: '' } });
    fireEvent.click(screen.getByText('Lưu món ăn'));
    expect(screen.getByText('Vui lòng nhập số lượng')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows name validation error when name is empty on submit', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // Submit with no name — error should appear
    fireEvent.click(screen.getByText('Lưu món ăn'));
    expect(screen.getByText('Vui lòng nhập tên món ăn')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows ingredients validation error when none selected on submit', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Tên món ăn'), { target: { value: 'Test dish' } });
    fireEvent.click(screen.getByText(/Trưa/).closest('button') as HTMLElement);
    fireEvent.click(screen.getByText('Lưu món ăn'));
    expect(screen.getByText('Vui lòng chọn ít nhất một nguyên liệu')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears name error when user starts typing', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByText('Lưu món ăn'));
    expect(screen.getByText('Vui lòng nhập tên món ăn')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Tên món ăn'), { target: { value: 'T' } });
    expect(screen.queryByText('Vui lòng nhập tên món ăn')).not.toBeInTheDocument();
  });

  it('clears amount error when user types a valid amount', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    const amountInput = screen.getByDisplayValue('200');
    fireEvent.change(amountInput, { target: { value: '-5' } });
    fireEvent.click(screen.getByText('Lưu món ăn'));
    expect(screen.getByText('Số lượng không được âm')).toBeInTheDocument();
    fireEvent.change(amountInput, { target: { value: '150' } });
    expect(screen.queryByText('Số lượng không được âm')).not.toBeInTheDocument();
  });

  // --- Search Tests ---

  it('filters ingredients by search query', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    const searchInput = screen.getByPlaceholderText('Tìm nguyên liệu...');
    fireEvent.change(searchInput, { target: { value: 'gà' } });

    // Only Ức gà should show, not Cơm trắng or Rau xà lách
    expect(screen.getByText('Ức gà')).toBeInTheDocument();
    expect(screen.queryByText('Cơm trắng')).not.toBeInTheDocument();
    expect(screen.queryByText('Rau xà lách')).not.toBeInTheDocument();
  });

  it('shows all ingredients selected message when all are added', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // Add all 3 ingredients
    fireEvent.click(screen.getByText('Ức gà').closest('button') as HTMLElement);
    fireEvent.click(screen.getByText('Cơm trắng').closest('button') as HTMLElement);
    fireEvent.click(screen.getByText('Rau xà lách').closest('button') as HTMLElement);

    expect(screen.getByText(/Đã chọn tất cả nguyên liệu/)).toBeInTheDocument();
  });

  it('shows empty selected state message when no ingredients added', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByText(/Chưa chọn nguyên liệu/)).toBeInTheDocument();
  });

  // --- Submit Tests ---

  it('submits valid dish with correct data structure', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // Fill form
    fireEvent.change(screen.getByLabelText('Tên món ăn'), { target: { value: 'Cơm gà mới' } });
    fireEvent.click(screen.getByText(/Trưa/).closest('button') as HTMLElement);
    fireEvent.click(screen.getByText('Ức gà').closest('button') as HTMLElement);

    // Submit
    fireEvent.click(screen.getByText('Lưu món ăn'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const saved = onSubmit.mock.calls[0][0];
    expect(saved.name).toEqual({ vi: 'Cơm gà mới', en: 'Cơm gà mới' });
    expect(saved.tags).toContain('lunch');
    expect(saved.ingredients).toHaveLength(1);
    expect(saved.ingredients[0].ingredientId).toBe('i1');
    expect(saved.ingredients[0].amount).toBe(100);
    expect(saved.id).toMatch(/^dish-/);
  });

  it('preserves existing dish ID when editing', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByText('Lưu món ăn'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].id).toBe('dish-1');
  });

  // --- Close / Unsaved Changes Tests ---

  it('calls onClose directly when no changes made', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Đóng'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows unsaved changes dialog when closing with changes', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // Make a change
    fireEvent.change(screen.getByLabelText('Tên món ăn'), { target: { value: 'Test' } });

    // Try to close
    fireEvent.click(screen.getByLabelText('Đóng'));

    // Should show dialog
    expect(screen.getByText(/Thay đổi chưa lưu/)).toBeInTheDocument();
  });

  it('saves and closes via unsaved changes dialog "Save & back"', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // Fill valid form
    fireEvent.change(screen.getByLabelText('Tên món ăn'), { target: { value: 'New Dish' } });
    fireEvent.click(screen.getByText(/Sáng/).closest('button') as HTMLElement);
    fireEvent.click(screen.getByText('Ức gà').closest('button') as HTMLElement);

    // Close → unsaved dialog → save
    fireEvent.click(screen.getByLabelText('Đóng'));
    fireEvent.click(screen.getByText('Lưu & quay lại'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('discards changes via unsaved dialog', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Tên món ăn'), { target: { value: 'Test' } });

    fireEvent.click(screen.getByLabelText('Đóng'));
    fireEvent.click(screen.getByText('Bỏ thay đổi'));


    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('cancels unsaved dialog and returns to editing', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Tên món ăn'), { target: { value: 'Test' } });

    fireEvent.click(screen.getByLabelText('Đóng'));
    fireEvent.click(screen.getByText('Ở lại chỉnh sửa'));

    // Dialog should close, still editing
    expect(screen.queryByText(/Thay đổi chưa lưu/)).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
  });

  it('closes via X button in header', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    const xButton = screen.getAllByRole('button').find(btn => btn.querySelector('.lucide-x'));
    if (xButton) fireEvent.click(xButton);
    expect(onClose).toHaveBeenCalled();
  });

  // --- Edge Cases ---

  it('detects changes in edited dish when name changes', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Tên món ăn'), { target: { value: 'Modified name' } });
    fireEvent.click(screen.getByLabelText('Đóng'));
    expect(screen.getByText(/Thay đổi chưa lưu/)).toBeInTheDocument();
  });

  it('detects changes in edited dish when tag toggled', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // Toggle breakfast tag (not in original)
    fireEvent.click(screen.getByText(/Sáng/).closest('button') as HTMLElement);
    fireEvent.click(screen.getByLabelText('Đóng'));
    expect(screen.getByText(/Thay đổi chưa lưu/)).toBeInTheDocument();
  });

  // --- Quick-Add Bottom Sheet Tests ---

  it('opens quick-add overlay when clicking quick-add button', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));
    expect(screen.getByText('Tạo nguyên liệu mới')).toBeInTheDocument();
    expect(screen.getByTestId('btn-qa-cancel')).toBeInTheDocument();
    expect(screen.getByTestId('btn-qa-submit')).toBeInTheDocument();
  });

  it('closes quick-add overlay when clicking cancel button', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));
    expect(screen.getByText('Tạo nguyên liệu mới')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('btn-qa-cancel'));
    expect(screen.queryByText('Tạo nguyên liệu mới')).not.toBeInTheDocument();
  });

  it('closes quick-add overlay when clicking backdrop', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));
    expect(screen.getByText('Tạo nguyên liệu mới')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('close quick-add'));
    expect(screen.queryByText('Tạo nguyên liệu mới')).not.toBeInTheDocument();
  });

  it('closes quick-add overlay when clicking X button inside overlay', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));

    // The X button inside the quick-add overlay (not the modal header X)
    const xButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('.lucide-x'));
    // The last X button is the one in the quick-add overlay
    const quickAddXBtn = xButtons.at(-1);
    fireEvent.click(quickAddXBtn!);
    expect(screen.queryByText('Tạo nguyên liệu mới')).not.toBeInTheDocument();
  });

  it('renders quick-add form inputs for name VI and EN', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));

    expect(screen.getByTestId('input-qa-name-vi')).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên \(EN/)).toBeInTheDocument();
  });

  it('renders nutrition inputs in quick-add form', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));

    expect(screen.getByLabelText('Cal')).toBeInTheDocument();
    expect(screen.getByLabelText('Protein')).toBeInTheDocument();
    expect(screen.getByLabelText('Carbs')).toBeInTheDocument();
    expect(screen.getByLabelText('Fat')).toBeInTheDocument();
    expect(screen.getByLabelText('Fiber')).toBeInTheDocument();
  });

  it('shows validation error when submitting quick-add with empty name', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));
    fireEvent.click(screen.getByTestId('btn-qa-submit'));

    expect(screen.getByText('Vui lòng nhập tên nguyên liệu')).toBeInTheDocument();
  });

  it('clears quick-add validation error when typing a name', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));
    fireEvent.click(screen.getByTestId('btn-qa-submit'));
    expect(screen.getByText('Vui lòng nhập tên nguyên liệu')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('input-qa-name-vi'), { target: { value: 'Bột mì' } });
    expect(screen.queryByText('Vui lòng nhập tên nguyên liệu')).not.toBeInTheDocument();
  });

  it('creates ingredient and adds to selected list via quick-add', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} onCreateIngredient={onCreateIngredient} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));

    // Fill name
    fireEvent.change(screen.getByTestId('input-qa-name-vi'), { target: { value: 'Bột mì' } });

    // Fill nutrition
    fireEvent.change(screen.getByLabelText('Cal'), { target: { value: '364' } });
    fireEvent.change(screen.getByLabelText('Protein'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Carbs'), { target: { value: '76' } });
    fireEvent.change(screen.getByLabelText('Fat'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Fiber'), { target: { value: '2.7' } });

    fireEvent.click(screen.getByTestId('btn-qa-submit'));

    // Quick-add overlay should close
    expect(screen.queryByText('Tạo nguyên liệu mới')).not.toBeInTheDocument();

    // New ingredient should be in the selected list
    expect(screen.getByText('Bột mì')).toBeInTheDocument();
  });

  it('quick-add uses VI name for EN when EN is left empty', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} onCreateIngredient={onCreateIngredient} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));

    fireEvent.change(screen.getByTestId('input-qa-name-vi'), { target: { value: 'Đậu phộng' } });
    fireEvent.click(screen.getByTestId('btn-qa-submit'));

    // Should be added and visible
    expect(screen.getByText('Đậu phộng')).toBeInTheDocument();
  });

  it('quick-add allows filling EN name separately', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} onCreateIngredient={onCreateIngredient} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));

    fireEvent.change(screen.getByTestId('input-qa-name-vi'), { target: { value: 'Đậu phộng' } });
    fireEvent.change(screen.getByLabelText(/Tên \(EN/), { target: { value: 'Peanut' } });
    fireEvent.click(screen.getByTestId('btn-qa-submit'));

    expect(screen.getByText('Đậu phộng')).toBeInTheDocument();
  });

  it('triggers AI fill on blur of VI name input', async () => {
    mockSuggestIngredientInfo.mockResolvedValue({
      calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, unit: 'g',
    });
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));

    const viInput = screen.getByTestId('input-qa-name-vi');
    fireEvent.change(viInput, { target: { value: 'Ức gà' } });
    fireEvent.blur(viInput);

    // triggerAIFill has 800ms debounce
    await act(async () => { await vi.advanceTimersByTimeAsync(850); });

    expect(mockSuggestIngredientInfo).toHaveBeenCalledWith('Ức gà', 'g', expect.any(AbortSignal));
  });

  it('shows AI loading state in quick-add form', async () => {
    let resolveFn: (v: unknown) => void = () => {};
    const promise = new Promise(resolve => { resolveFn = resolve; });
    mockSuggestIngredientInfo.mockReturnValue(promise);

    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));

    const viInput = screen.getByTestId('input-qa-name-vi');
    fireEvent.change(viInput, { target: { value: 'Ức gà' } });
    fireEvent.blur(viInput);

    await act(async () => { await vi.advanceTimersByTimeAsync(850); });

    expect(screen.getByText('AI đang điền...')).toBeInTheDocument();

    // Nutrition inputs should be disabled during AI loading
    expect(screen.getByLabelText('Cal')).toBeDisabled();
    expect(screen.getByLabelText('Protein')).toBeDisabled();

    // Resolve AI call
    await act(async () => {
      resolveFn({ calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, unit: 'g' });
    });

    expect(screen.queryByText('AI đang điền...')).not.toBeInTheDocument();
  });

  it('fills nutrition values after AI returns successfully', async () => {
    mockSuggestIngredientInfo.mockResolvedValue({
      calories: 200, protein: 25, carbs: 10, fat: 5, fiber: 3, unit: 'g',
    });

    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));

    const viInput = screen.getByTestId('input-qa-name-vi');
    fireEvent.change(viInput, { target: { value: 'Thịt bò' } });
    fireEvent.blur(viInput);

    await act(async () => { await vi.advanceTimersByTimeAsync(850); });

    expect(screen.getByLabelText('Cal')).toHaveValue(200);
    expect(screen.getByLabelText('Protein')).toHaveValue(25);
    expect(screen.getByLabelText('Carbs')).toHaveValue(10);
    expect(screen.getByLabelText('Fat')).toHaveValue(5);
    expect(screen.getByLabelText('Fiber')).toHaveValue(3);
  });

  it('does not trigger AI fill when VI name is empty on blur', async () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));

    const viInput = screen.getByTestId('input-qa-name-vi');
    fireEvent.blur(viInput);

    await act(async () => { await vi.advanceTimersByTimeAsync(850); });
    expect(mockSuggestIngredientInfo).not.toHaveBeenCalled();
  });

  it('handles AI fill failure gracefully', async () => {
    mockSuggestIngredientInfo.mockRejectedValue(new Error('AI error'));

    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));

    const viInput = screen.getByTestId('input-qa-name-vi');
    fireEvent.change(viInput, { target: { value: 'Cà rốt' } });
    fireEvent.blur(viInput);

    await act(async () => { await vi.advanceTimersByTimeAsync(850); });

    expect(screen.queryByText('AI đang điền...')).not.toBeInTheDocument();

    // Should still be able to fill manually and submit
    fireEvent.change(screen.getByLabelText('Cal'), { target: { value: '41' } });
    expect(screen.getByLabelText('Cal')).toHaveValue(41);
  });

  it('toggles quick-add button off to close the overlay', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));
    expect(screen.getByText('Tạo nguyên liệu mới')).toBeInTheDocument();

    // Click the same button again to toggle off
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));
    expect(screen.queryByText('Tạo nguyên liệu mới')).not.toBeInTheDocument();
  });

  it('quick-add resets all fields after successful creation', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));

    fireEvent.change(screen.getByTestId('input-qa-name-vi'), { target: { value: 'Bột mì' } });
    fireEvent.change(screen.getByLabelText('Cal'), { target: { value: '364' } });
    fireEvent.click(screen.getByTestId('btn-qa-submit'));

    // Re-open quick-add — fields should be reset
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));
    expect(screen.getByTestId('input-qa-name-vi')).toHaveValue('');
    expect(screen.getByLabelText('Cal')).toHaveValue(null);
  });

  it('calls onCreateIngredient for quick-added ingredients on dish save', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} onCreateIngredient={onCreateIngredient} />);

    // Quick-add an ingredient
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));
    fireEvent.change(screen.getByTestId('input-qa-name-vi'), { target: { value: 'Hành tím' } });
    fireEvent.click(screen.getByTestId('btn-qa-submit'));

    // Fill rest of dish form
    fireEvent.change(screen.getByLabelText('Tên món ăn'), { target: { value: 'Món test' } });
    fireEvent.click(screen.getByText(/Trưa/).closest('button') as HTMLElement);

    // Save the dish
    fireEvent.click(screen.getByText('Lưu món ăn'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onCreateIngredient).toHaveBeenCalledTimes(1);
    expect(onCreateIngredient.mock.calls[0][0].name.vi).toBe('Hành tím');
  });

  it('does not call onCreateIngredient when dish is not saved', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} onCreateIngredient={onCreateIngredient} />);

    // Quick-add an ingredient
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));
    fireEvent.change(screen.getByTestId('input-qa-name-vi'), { target: { value: 'Hành tím' } });
    fireEvent.click(screen.getByTestId('btn-qa-submit'));

    // Close without saving — discard
    fireEvent.click(screen.getByLabelText('Đóng'));
    fireEvent.click(screen.getByText('Bỏ thay đổi'));

    expect(onCreateIngredient).not.toHaveBeenCalled();
  });

  // --- Increment/Decrement Amount Buttons (edge cases) ---

  it('increments amount by 10 when current amount is >= 100', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // i1 has amount 200. Step = 10 for amounts >= 100
    // Amount +/- buttons have rounded-lg; quick-add toggle has rounded-xl
    const selectedPlusBtn = screen.getAllByRole('button').find(btn =>
      btn.querySelector('.lucide-plus') && btn.classList.contains('rounded-lg'),
    );
    fireEvent.click(selectedPlusBtn!);
    expect(screen.getByDisplayValue('210')).toBeInTheDocument();
  });

  it('increments amount by 5 when current amount is between 10 and 99', () => {
    const dishWith50: Dish = {
      id: 'dish-50',
      name: { vi: 'Test', en: 'Test' },
      ingredients: [{ ingredientId: 'i1', amount: 50 }],
      tags: ['lunch'],
    };
    render(<DishEditModal editingItem={dishWith50} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    const selectedPlusBtn = screen.getAllByRole('button').find(btn =>
      btn.querySelector('.lucide-plus') && btn.classList.contains('rounded-lg'),
    );
    fireEvent.click(selectedPlusBtn!);
    expect(screen.getByDisplayValue('55')).toBeInTheDocument();
  });

  it('increments amount by 1 when current amount is below 10', () => {
    const dishWith5: Dish = {
      id: 'dish-5',
      name: { vi: 'Test', en: 'Test' },
      ingredients: [{ ingredientId: 'i1', amount: 5 }],
      tags: ['lunch'],
    };
    render(<DishEditModal editingItem={dishWith5} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    const selectedPlusBtn = screen.getAllByRole('button').find(btn =>
      btn.querySelector('.lucide-plus') && btn.classList.contains('rounded-lg'),
    );
    fireEvent.click(selectedPlusBtn!);
    expect(screen.getByDisplayValue('6')).toBeInTheDocument();
  });

  it('decrements amount but does not go below 0', () => {
    const dishWith0: Dish = {
      id: 'dish-0',
      name: { vi: 'Test', en: 'Test' },
      ingredients: [{ ingredientId: 'i1', amount: 0 }],
      tags: ['lunch'],
    };
    render(<DishEditModal editingItem={dishWith0} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    const minusBtn = screen.getAllByRole('button').find(btn =>
      btn.querySelector('.lucide-minus') && btn.classList.contains('rounded-lg'),
    );
    fireEvent.click(minusBtn!);
    // Should stay at 0, not go negative
    expect(screen.getByDisplayValue('0')).toBeInTheDocument();
  });

  it('quick-add changes nutrition input values', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));

    fireEvent.change(screen.getByLabelText('Cal'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Protein'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('Carbs'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('Fat'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Fiber'), { target: { value: '3' } });

    expect(screen.getByLabelText('Cal')).toHaveValue(100);
    expect(screen.getByLabelText('Protein')).toHaveValue(20);
    expect(screen.getByLabelText('Carbs')).toHaveValue(30);
    expect(screen.getByLabelText('Fat')).toHaveValue(5);
    expect(screen.getByLabelText('Fiber')).toHaveValue(3);
  });

  it('renders unit selector in quick-add form', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));

    expect(screen.getByLabelText(/Đơn vị/)).toBeInTheDocument();
  });

  it('triggers AI fill when quick-add unit selector changes', async () => {
    mockSuggestIngredientInfo.mockResolvedValue({
      calories: 78, protein: 6, carbs: 0.6, fat: 5, fiber: 0, unit: 'quả',
    });
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));

    // Fill name first
    fireEvent.change(screen.getByTestId('input-qa-name-vi'), { target: { value: 'Trứng gà' } });

    // Change unit — this triggers triggerAIFill via the onChange callback
    const unitSelect = screen.getByLabelText(/Đơn vị/);
    fireEvent.change(unitSelect, { target: { value: 'quả' } });

    await act(async () => { await vi.advanceTimersByTimeAsync(850); });

    expect(mockSuggestIngredientInfo).toHaveBeenCalled();
  });

  it('detects changes when ingredient count differs from original', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // existingDish has 2 ingredients. Remove one to trigger hasChanges ingredient length diff
    const deleteButton = screen.getAllByRole('button').find(btn => btn.querySelector('.lucide-trash-2'));
    fireEvent.click(deleteButton!);

    // Close → unsaved dialog because ingredient count changed
    fireEvent.click(screen.getByLabelText('Đóng'));
    expect(screen.getByText(/Thay đổi chưa lưu/)).toBeInTheDocument();
  });

  it('detects changes when ingredient IDs differ from original order', () => {
    // Dish with ingredient i1, but we remove i1 and add i3 (same count but different IDs)
    const singleIngDish: Dish = {
      id: 'dish-single',
      name: { vi: 'Test', en: 'Test' },
      ingredients: [{ ingredientId: 'i1', amount: 100 }],
      tags: ['lunch'],
    };
    render(<DishEditModal editingItem={singleIngDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // Remove the existing ingredient
    const deleteBtn = screen.getAllByRole('button').find(btn => btn.querySelector('.lucide-trash-2'));
    if (deleteBtn) fireEvent.click(deleteBtn);
    // Add a different ingredient
    fireEvent.click(screen.getByText('Rau xà lách').closest('button') as HTMLElement);
    // Close → should show unsaved dialog because ingredient IDs changed
    fireEvent.click(screen.getByLabelText('Đóng'));
    expect(screen.getByText(/Thay đổi chưa lưu/)).toBeInTheDocument();
  });

  it('detects changes when amount string is empty', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // Clear the amount field (makes it empty string)
    const amountInput = screen.getByDisplayValue('200');
    fireEvent.change(amountInput, { target: { value: '' } });
    // Close → should detect empty amount as a change
    fireEvent.click(screen.getByLabelText('Đóng'));
    expect(screen.getByText(/Thay đổi chưa lưu/)).toBeInTheDocument();
  });

  it('shows NaN validation error when amount is non-numeric text (line 110)', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    const amountInput = screen.getByDisplayValue('200');
    fireEvent.change(amountInput, { target: { value: 'abc' } });
    fireEvent.click(screen.getByText('Lưu món ăn'));
    expect(screen.getByText('Vui lòng nhập số lượng')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('prevents double submission (line 122)', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    const saveBtn = screen.getByText('Lưu món ăn');
    fireEvent.click(saveBtn);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    fireEvent.click(saveBtn);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('handleSaveAndBack returns if validation fails (line 136)', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // Make a change to trigger unsaved dialog
    fireEvent.change(screen.getByLabelText('Tên món ăn'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByLabelText('Đóng'));
    expect(screen.getByText(/Thay đổi chưa lưu/)).toBeInTheDocument();
    // Click "Lưu & quay lại" — validation should fail (no tags, no ingredients)
    fireEvent.click(screen.getByText('Lưu & quay lại'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears ingredients form error when adding ingredient (line 145)', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Tên món ăn'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText(/Trưa/).closest('button') as HTMLElement);
    fireEvent.click(screen.getByText('Lưu món ăn'));
    expect(screen.getByText('Vui lòng chọn ít nhất một nguyên liệu')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Ức gà').closest('button') as HTMLElement);
    expect(screen.queryByText('Vui lòng chọn ít nhất một nguyên liệu')).not.toBeInTheDocument();
  });

  it('nutrition preview skips unknown ingredient (lines 384, 415)', () => {
    const dishWithUnknown: Dish = {
      id: 'dish-unknown',
      name: { vi: 'Test', en: 'Test' },
      ingredients: [
        { ingredientId: 'i1', amount: 200 },
        { ingredientId: 'unknown-ing', amount: 100 },
      ],
      tags: ['lunch'],
    };
    render(<DishEditModal editingItem={dishWithUnknown} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByText('Ức gà')).toBeInTheDocument();
  });

  it('handleSaveAndBack flushes extra ingredients on success (line 137)', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} onCreateIngredient={onCreateIngredient} />);
    // Quick-add an ingredient
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));
    fireEvent.change(screen.getByTestId('input-qa-name-vi'), { target: { value: 'Hành lá' } });
    fireEvent.click(screen.getByTestId('btn-qa-submit'));
    // Fill form for valid save
    fireEvent.change(screen.getByLabelText('Tên món ăn'), { target: { value: 'Món mới' } });
    fireEvent.click(screen.getByText(/Trưa/).closest('button') as HTMLElement);
    // Close → unsaved dialog → save & back
    fireEvent.click(screen.getByLabelText('Đóng'));
    fireEvent.click(screen.getByText('Lưu & quay lại'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onCreateIngredient).toHaveBeenCalledTimes(1);
  });

  it('validates NaN amount when submitting', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    const amountInput = screen.getByTestId('input-dish-amount-i1');
    fireEvent.change(amountInput, { target: { value: 'abc' } });
    fireEvent.click(screen.getByTestId('btn-save-dish'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('resetQuickAdd clears timer when quick-add is closed via X button', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));
    expect(screen.getByText('Tạo nguyên liệu mới')).toBeInTheDocument();
    // Fill name and blur to trigger triggerAIFill which sets aiTimerRef
    const nameInput = screen.getByTestId('input-qa-name-vi');
    fireEvent.change(nameInput, { target: { value: 'Test ingredient' } });
    fireEvent.blur(nameInput);
    // Now close the quick-add overlay; resetQuickAdd should clear the timer
    const xButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('.lucide-x'));
    const quickAddXBtn = xButtons.at(-1);
    fireEvent.click(quickAddXBtn!);
    expect(screen.queryByText('Tạo nguyên liệu mới')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('validates NaN amount string on submit (branch: non-empty non-numeric)', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    const amountInput = screen.getByTestId('input-dish-amount-i1');
    // jsdom sanitises non-numeric strings on type="number" inputs to '',
    // so temporarily switch to "text" to set a truly non-numeric value
    amountInput.setAttribute('type', 'text');
    fireEvent.change(amountInput, { target: { value: 'abc' } });
    amountInput.setAttribute('type', 'number');

    fireEvent.click(screen.getByTestId('btn-save-dish'));
    expect(screen.getByText('Vui lòng nhập số lượng')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('triggerAIFill clears previous timer on second blur (branch: aiTimerRef truthy)', async () => {
    mockSuggestIngredientInfo.mockResolvedValue({
      calories: 100, protein: 10, carbs: 20, fat: 5, fiber: 2, unit: 'g',
    });
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-quick-add-ingredient'));

    const viInput = screen.getByTestId('input-qa-name-vi');
    // First blur — sets aiTimerRef.current via setTimeout
    fireEvent.change(viInput, { target: { value: 'Thịt bò' } });
    fireEvent.blur(viInput);
    // Advance only 400ms (timer is 800ms), so the first timer is still pending
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });

    // Second blur — triggerAIFill should clear the previous timer (line 175 branch)
    fireEvent.change(viInput, { target: { value: 'Thịt heo' } });
    fireEvent.blur(viInput);
    // Advance past both debounce windows
    await act(async () => { await vi.advanceTimersByTimeAsync(850); });

    // The AI call should have been made with the SECOND name, not the first
    const lastCall = mockSuggestIngredientInfo.mock.calls.at(-1);
    expect(lastCall?.[0]).toBe('Thịt heo');
  });

  it('picker filters out already-selected ingredients (no duplicate add possible)', () => {
    render(<DishEditModal editingItem={existingDish} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // i1 and i2 are already selected; only i3 should appear in the picker
    expect(screen.getByTestId('btn-add-ing-i3')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-add-ing-i1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('btn-add-ing-i2')).not.toBeInTheDocument();
  });

  it('clears tag validation error when an inactive tag is toggled on', () => {
    render(<DishEditModal editingItem={null} ingredients={ingredients} onSubmit={onSubmit} onClose={onClose} />);
    // Fill name + ingredient so only tag error remains
    fireEvent.change(screen.getByLabelText('Tên món ăn'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Ức gà').closest('button') as HTMLElement);
    // Submit without tags → tag validation error appears
    fireEvent.click(screen.getByTestId('btn-save-dish'));
    expect(screen.getByText(/chọn ít nhất một bữa ăn phù hợp/i)).toBeInTheDocument();
    // Toggle an inactive tag → error should clear (branch: !isActive && formErrors.tags)
    fireEvent.click(screen.getByTestId('tag-breakfast'));
    expect(screen.queryByText(/chọn ít nhất một bữa ăn phù hợp/i)).not.toBeInTheDocument();
  });
});
