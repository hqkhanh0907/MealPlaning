import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DishEditModal } from '../components/modals/DishEditModal';
import type { Dish, Ingredient } from '../types';

vi.mock('../hooks/useModalBackHandler', () => ({ useModalBackHandler: vi.fn() }));

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

  beforeEach(() => {
    vi.clearAllMocks();
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
});
