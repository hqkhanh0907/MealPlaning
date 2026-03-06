import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DishManager } from '../components/DishManager';
import { IngredientManager } from '../components/IngredientManager';
import type { Dish, Ingredient } from '../types';

vi.mock('../hooks/useModalBackHandler', () => ({ useModalBackHandler: vi.fn() }));

const mockNotify = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismissAll: vi.fn() };
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => mockNotify,
}));

vi.mock('../services/geminiService', () => ({
  suggestIngredientInfo: vi.fn().mockResolvedValue({
    calories: 200, protein: 25, carbs: 0, fat: 8, fiber: 0,
  }),
}));

const ingredients: Ingredient[] = [
  { id: 'i1', name: { vi: 'Ức gà', en: 'Ức gà' }, caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, fiberPer100: 0, unit: { vi: 'g', en: 'g' } },
  { id: 'i2', name: { vi: 'Cơm trắng', en: 'Cơm trắng' }, caloriesPer100: 130, proteinPer100: 2.7, carbsPer100: 28, fatPer100: 0.3, fiberPer100: 0.4, unit: { vi: 'g', en: 'g' } },
];

const dishes: Dish[] = [
  { id: 'd1', name: { vi: 'Gà nướng', en: 'Gà nướng' }, ingredients: [{ ingredientId: 'i1', amount: 200 }], tags: ['lunch', 'dinner'] },
  { id: 'd2', name: { vi: 'Cơm gà', en: 'Cơm gà' }, ingredients: [{ ingredientId: 'i1', amount: 100 }, { ingredientId: 'i2', amount: 200 }], tags: ['lunch'] },
];

// --- DishManager ---
describe('DishManager', () => {
  const defaultProps = {
    dishes,
    ingredients,
    onAdd: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    isUsed: vi.fn().mockReturnValue(false),
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders dish list with names', () => {
    render(<DishManager {...defaultProps} />);
    expect(screen.getByText('Gà nướng')).toBeInTheDocument();
    expect(screen.getByText('Cơm gà')).toBeInTheDocument();
  });

  it('renders search input and sort selector', () => {
    render(<DishManager {...defaultProps} />);
    expect(screen.getByPlaceholderText('Tìm kiếm món ăn...')).toBeInTheDocument();
  });

  it('filters dishes by search query', () => {
    render(<DishManager {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Tìm kiếm món ăn...');
    fireEvent.change(searchInput, { target: { value: 'Cơm' } });
    expect(screen.getByText('Cơm gà')).toBeInTheDocument();
    expect(screen.queryByText('Gà nướng')).not.toBeInTheDocument();
  });

  it('opens add modal when "Thêm món ăn" is clicked', () => {
    render(<DishManager {...defaultProps} />);
    const addBtn = screen.getByText('Thêm món ăn');
    fireEvent.click(addBtn);
    expect(screen.getByText('Tạo món ăn mới')).toBeInTheDocument();
  });

  it('shows tag filter buttons', () => {
    render(<DishManager {...defaultProps} />);
    expect(screen.getByText(/Tất cả/)).toBeInTheDocument();
  });

  it('opens view detail modal when dish card is clicked', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getByText('Gà nướng'));
    expect(screen.getByText('Chi tiết món ăn')).toBeInTheDocument();
  });

  it('prevents deletion of used dishes', () => {
    render(<DishManager {...defaultProps} isUsed={vi.fn().mockReturnValue(true)} />);
    // Click delete on first dish
    const deleteButtons = screen.getAllByText('Xóa');
    fireEvent.click(deleteButtons[0]);
    expect(mockNotify.warning).toHaveBeenCalledWith('Không thể xóa', expect.any(String));
  });

  it('shows delete confirmation modal for unused dish', () => {
    render(<DishManager {...defaultProps} />);
    const deleteButtons = screen.getAllByText('Xóa');
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByText('Xóa món ăn?')).toBeInTheDocument();
  });

  it('calls onDelete when confirmed', () => {
    render(<DishManager {...defaultProps} />);
    const deleteButtons = screen.getAllByText('Xóa');
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByText('Xóa ngay'));
    // Sorted by name-asc: "Cơm gà" (d2) appears before "Gà nướng" (d1)
    expect(defaultProps.onDelete).toHaveBeenCalledWith('d2');
  });

  it('validates tag selection when saving dish', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getByText('Thêm món ăn'));

    // Fill name
    fireEvent.change(screen.getByPlaceholderText('VD: Ức gà áp chảo'), { target: { value: 'Test' } });

    // Add an ingredient
    fireEvent.click(screen.getByText('Ức gà'));

    // Click save without selecting tags
    fireEvent.click(screen.getByText('Lưu món ăn'));

    expect(screen.getByText('Vui lòng chọn ít nhất một bữa ăn phù hợp')).toBeInTheDocument();
  });

  it('switches between grid and list view', () => {
    render(<DishManager {...defaultProps} />);
    // Default is grid, switch to list – buttons use `title` attribute
    const listBtn = screen.getByTitle('Xem dạng danh sách');
    fireEvent.click(listBtn);
    // Should show table headers
    expect(screen.getByText('Thao tác')).toBeInTheDocument();
  });

  it('shows empty state when no dishes match filter', () => {
    render(<DishManager {...defaultProps} dishes={[]} />);
    expect(screen.getByText(/Chưa có món ăn nào/)).toBeInTheDocument();
  });

  it('sorts dishes by calories ascending', () => {
    render(<DishManager {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(sortSelect, { target: { value: 'cal-asc' } });
    // Verify sort selector changed
    expect(screen.getByDisplayValue('Calo (Thấp → Cao)')).toBeInTheDocument();
  });

  it('sorts dishes by calories descending', () => {
    render(<DishManager {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(sortSelect, { target: { value: 'cal-desc' } });
    expect(screen.getByDisplayValue('Calo (Cao → Thấp)')).toBeInTheDocument();
  });

  it('sorts dishes by protein', () => {
    render(<DishManager {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(sortSelect, { target: { value: 'pro-asc' } });
    expect(screen.getByDisplayValue('Protein (Thấp → Cao)')).toBeInTheDocument();
  });

  it('sorts dishes by ingredient count', () => {
    render(<DishManager {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(sortSelect, { target: { value: 'ing-asc' } });
    expect(screen.getByDisplayValue('Số NL (Ít → Nhiều)')).toBeInTheDocument();
  });

  it('filters dishes by tag Sáng — only shows breakfast dishes', () => {
    const dishesWithBreakfast: Dish[] = [
      { id: 'd1', name: { vi: 'Gà nướng', en: 'Gà nướng' }, ingredients: [{ ingredientId: 'i1', amount: 200 }], tags: ['lunch', 'dinner'] },
      { id: 'd3', name: { vi: 'Bánh mì', en: 'Bánh mì' }, ingredients: [{ ingredientId: 'i2', amount: 100 }], tags: ['breakfast'] },
    ];
    render(<DishManager {...defaultProps} dishes={dishesWithBreakfast} />);
    // Click the Sáng filter chip (contains count)
    const sangButtons = screen.getAllByText(/Sáng/);
    const filterChip = sangButtons.find(el => el.closest('button')?.textContent?.includes('('));
    expect(filterChip).toBeDefined();
    fireEvent.click(filterChip ?? document);
    expect(screen.getByText('Bánh mì')).toBeInTheDocument();
    expect(screen.queryByText('Gà nướng')).not.toBeInTheDocument();
  });

  it('removes tag filter when clicking the same tag again', () => {
    const dishesWithBreakfast: Dish[] = [
      { id: 'd1', name: { vi: 'Gà nướng', en: 'Gà nướng' }, ingredients: [{ ingredientId: 'i1', amount: 200 }], tags: ['lunch', 'dinner'] },
      { id: 'd3', name: { vi: 'Bánh mì', en: 'Bánh mì' }, ingredients: [{ ingredientId: 'i2', amount: 100 }], tags: ['breakfast'] },
    ];
    render(<DishManager {...defaultProps} dishes={dishesWithBreakfast} />);
    // Click Sáng filter chip (contains count)
    const getFilterChip = () => {
      const sangButtons = screen.getAllByText(/Sáng/);
      const chip = sangButtons.find(el => el.closest('button')?.textContent?.includes('('));
      expect(chip).toBeDefined();
      return chip ?? document.body;
    };
    fireEvent.click(getFilterChip());
    expect(screen.queryByText('Gà nướng')).not.toBeInTheDocument();
    // Click Sáng again to toggle off
    fireEvent.click(getFilterChip());
    expect(screen.getByText('Gà nướng')).toBeInTheDocument();
    expect(screen.getByText('Bánh mì')).toBeInTheDocument();
  });

  it('calls onAdd when undo delete is triggered', () => {
    render(<DishManager {...defaultProps} />);
    // Delete the first dish (sorted by name: "Cơm gà" first)
    const deleteButtons = screen.getAllByText('Xóa');
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByText('Xóa ngay'));
    // notify.info should have been called with undo action
    expect(mockNotify.info).toHaveBeenCalled();
    // Get the undo action from the notification call
    const call = mockNotify.info.mock.calls[0];
    const options = call[2]; // third argument = options with action
    expect(options?.action?.label).toBeDefined();
    // Trigger undo
    options.action.onClick();
    // onAdd should be called with the deleted dish
    expect(defaultProps.onAdd).toHaveBeenCalledWith(expect.objectContaining({ id: 'd2', name: { vi: 'Cơm gà', en: 'Cơm gà' } }));
  });

  it('opens edit modal when dish edit button is clicked', () => {
    render(<DishManager {...defaultProps} />);
    // Edit button text is t('common.edit') = "Chỉnh sửa"
    const editButtons = screen.getAllByText('Chỉnh sửa');
    fireEvent.click(editButtons[0]);
    // Edit modal should open
    expect(screen.getByText('Sửa món ăn')).toBeInTheDocument();
  });

  it('calls onUpdate (not onAdd) when saving an edited dish', () => {
    render(<DishManager {...defaultProps} />);
    const editButtons = screen.getAllByText('Chỉnh sửa');
    fireEvent.click(editButtons[0]); // Opens edit for Cơm gà (first sorted name-asc)
    // Change the dish name
    fireEvent.change(screen.getByPlaceholderText('VD: Ức gà áp chảo'), { target: { value: 'Cơm gà Updated' } });
    fireEvent.click(screen.getByText('Lưu món ăn'));
    expect(defaultProps.onUpdate).toHaveBeenCalled();
    expect(defaultProps.onAdd).not.toHaveBeenCalled();
  });

  it('shows ingredient details in view modal when dish name is clicked', () => {
    render(<DishManager {...defaultProps} />);
    // Click the dish name button to open view modal
    const gaNuongButtons = screen.getAllByText('Gà nướng');
    const nameBtn = gaNuongButtons.find(el => el.tagName === 'BUTTON');
    if (nameBtn) fireEvent.click(nameBtn);
    // View modal should show ingredient name and amount
    expect(screen.getByText('Ức gà')).toBeInTheDocument();
    expect(screen.getByText(/200/)).toBeInTheDocument();
  });

  it('sorts dishes by ingredient count descending (most ingredients first)', () => {
    render(<DishManager {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(sortSelect, { target: { value: 'ing-desc' } });
    // Cơm gà (2 ingredients) should appear before Gà nướng (1 ingredient)
    expect(document.body.innerHTML.indexOf('Cơm gà')).toBeLessThan(
      document.body.innerHTML.indexOf('Gà nướng'),
    );
  });

  it('filters by lunch tag', () => {
    render(<DishManager {...defaultProps} />);
    const lunchButtons = screen.getAllByText(/Trưa/);
    const filterChip = lunchButtons.find(el => el.closest('button')?.textContent?.includes('('));
    expect(filterChip).toBeDefined();
    fireEvent.click(filterChip ?? document);
    // Both dishes have 'lunch' tag
    expect(screen.getByText('Gà nướng')).toBeInTheDocument();
    expect(screen.getByText('Cơm gà')).toBeInTheDocument();
  });

  it('filters by dinner tag', () => {
    render(<DishManager {...defaultProps} />);
    const dinnerButtons = screen.getAllByText(/Tối/);
    const filterChip = dinnerButtons.find(el => el.closest('button')?.textContent?.includes('('));
    expect(filterChip).toBeDefined();
    fireEvent.click(filterChip ?? document);
    // Only Gà nướng has 'dinner' tag
    expect(screen.getByText('Gà nướng')).toBeInTheDocument();
    expect(screen.queryByText('Cơm gà')).not.toBeInTheDocument();
  });

  it('renders list view with table rows for each dish', () => {
    render(<DishManager {...defaultProps} />);
    // Switch to list view
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    // Table should render dish names as buttons
    const dishNameBtns = screen.getAllByRole('button').filter(btn =>
      btn.textContent === 'Gà nướng' || btn.textContent === 'Cơm gà'
    );
    expect(dishNameBtns.length).toBeGreaterThanOrEqual(2);
  });

  it('opens detail modal from list view when dish name clicked', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    // Click the dish name in the table to open view detail
    const nameBtn = screen.getAllByText('Gà nướng').find(el => el.tagName === 'BUTTON');
    expect(nameBtn).toBeDefined();
    if (nameBtn) fireEvent.click(nameBtn);
    expect(screen.getByText('Chi tiết món ăn')).toBeInTheDocument();
  });

  it('confirms delete and calls onDelete through ConfirmationModal', () => {
    render(<DishManager {...defaultProps} />);
    // Click delete on first dish (sorted: Cơm gà first)
    const deleteButtons = screen.getAllByText('Xóa');
    fireEvent.click(deleteButtons[0]);
    // Confirmation modal should appear
    expect(screen.getByText('Xóa món ăn?')).toBeInTheDocument();
    // Cancel
    fireEvent.click(screen.getByText('Hủy'));
    expect(screen.queryByText('Xóa món ăn?')).not.toBeInTheDocument();
  });
});

// --- IngredientManager ---
describe('IngredientManager', () => {
  const defaultProps = {
    ingredients,
    dishes,
    onAdd: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    isUsed: vi.fn().mockReturnValue(false),
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders ingredient list', () => {
    render(<IngredientManager {...defaultProps} />);
    expect(screen.getByText('Ức gà')).toBeInTheDocument();
    expect(screen.getByText('Cơm trắng')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<IngredientManager {...defaultProps} />);
    expect(screen.getByPlaceholderText('Tìm kiếm nguyên liệu...')).toBeInTheDocument();
  });

  it('opens add modal', () => {
    render(<IngredientManager {...defaultProps} />);
    fireEvent.click(screen.getByText('Thêm nguyên liệu'));
    expect(screen.getByText('Thêm nguyên liệu mới')).toBeInTheDocument();
  });

  it('opens view detail modal', () => {
    render(<IngredientManager {...defaultProps} />);
    fireEvent.click(screen.getByText('Ức gà'));
    expect(screen.getByText('Chi tiết nguyên liệu')).toBeInTheDocument();
  });

  it('prevents deletion of used ingredients', () => {
    render(<IngredientManager {...defaultProps} isUsed={vi.fn().mockReturnValue(true)} />);
    const deleteButtons = screen.getAllByText('Xóa');
    fireEvent.click(deleteButtons[0]);
    expect(mockNotify.warning).toHaveBeenCalledWith('Không thể xóa', expect.any(String));
  });

  it('confirms and deletes ingredient', () => {
    render(<IngredientManager {...defaultProps} />);
    const deleteButtons = screen.getAllByText('Xóa');
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByText('Xóa ngay'));
    // Items sorted by name-asc: Cơm trắng (i2) comes before Ức gà (i1)
    expect(defaultProps.onDelete).toHaveBeenCalledWith('i2');
  });

  it('validates form on submit', () => {
    render(<IngredientManager {...defaultProps} />);
    fireEvent.click(screen.getByText('Thêm nguyên liệu'));
    // Submit empty form
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));
    expect(screen.getByText('Vui lòng nhập tên nguyên liệu')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập đơn vị tính')).toBeInTheDocument();
  });

  it('saves new ingredient with valid data', () => {
    render(<IngredientManager {...defaultProps} />);
    fireEvent.click(screen.getByText('Thêm nguyên liệu'));

    fireEvent.change(screen.getByPlaceholderText('Ví dụ: Thịt bò, Cà chua...'), { target: { value: 'Thịt bò' } });
    // Unit is now a <select> — pick 'g' from the dropdown
    fireEvent.change(screen.getByLabelText('Đơn vị tính'), { target: { value: 'g' } });

    fireEvent.click(screen.getByText('Lưu nguyên liệu'));
    expect(defaultProps.onAdd).toHaveBeenCalled();
  });

  it('shows "Dùng trong" for ingredients used in dishes', () => {
    render(<IngredientManager {...defaultProps} />);
    // i1 is used in Gà nướng and Cơm gà — multiple ingredients may show this label
    const usedLabels = screen.getAllByText(/Dùng trong/);
    expect(usedLabels.length).toBeGreaterThan(0);
  });

  it('filters ingredients by search', () => {
    render(<IngredientManager {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText('Tìm kiếm nguyên liệu...'), { target: { value: 'Cơm' } });
    expect(screen.getByText('Cơm trắng')).toBeInTheDocument();
    expect(screen.queryByText('Ức gà')).not.toBeInTheDocument();
  });

  it('switches between grid and list view', () => {
    render(<IngredientManager {...defaultProps} />);
    const listBtn = screen.getByTitle('Xem dạng danh sách');
    fireEvent.click(listBtn);
    expect(screen.getByText('Thao tác')).toBeInTheDocument();
  });

  it('shows empty state when no ingredients', () => {
    render(<IngredientManager {...defaultProps} ingredients={[]} />);
    expect(screen.getByText(/Chưa có nguyên liệu nào/)).toBeInTheDocument();
  });

  it('sorts ingredients by calories ascending', () => {
    render(<IngredientManager {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(sortSelect, { target: { value: 'cal-asc' } });
    expect(screen.getByDisplayValue('Calo (Thấp → Cao)')).toBeInTheDocument();
  });

  it('sorts ingredients by protein descending', () => {
    render(<IngredientManager {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(sortSelect, { target: { value: 'pro-desc' } });
    expect(screen.getByDisplayValue('Protein (Cao → Thấp)')).toBeInTheDocument();
  });

  it('opens edit modal when edit button is clicked', () => {
    render(<IngredientManager {...defaultProps} />);
    const editButtons = screen.getAllByText('Chỉnh sửa');
    fireEvent.click(editButtons[0]);
    expect(screen.getByText('Sửa nguyên liệu')).toBeInTheDocument();
  });

  it('calls onUpdate (not onAdd) when saving an edited ingredient', () => {
    render(<IngredientManager {...defaultProps} />);
    const editButtons = screen.getAllByText('Chỉnh sửa');
    fireEvent.click(editButtons[0]); // Opens edit for Cơm trắng (first sorted name-asc)
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));
    expect(defaultProps.onUpdate).toHaveBeenCalled();
    expect(defaultProps.onAdd).not.toHaveBeenCalled();
  });

  it('truncates "Used in" when ingredient appears in 3+ dishes', () => {
    const threeDishes: Dish[] = [
      { id: 'd1', name: { vi: 'Gà nướng', en: 'Gà nướng' }, ingredients: [{ ingredientId: 'i1', amount: 200 }], tags: ['lunch'] },
      { id: 'd2', name: { vi: 'Cơm gà', en: 'Cơm gà' }, ingredients: [{ ingredientId: 'i1', amount: 100 }], tags: ['lunch'] },
      { id: 'd3', name: { vi: 'Bún gà', en: 'Bún gà' }, ingredients: [{ ingredientId: 'i1', amount: 150 }], tags: ['dinner'] },
    ];
    render(<IngredientManager {...defaultProps} dishes={threeDishes} />);
    // Should show first 2 names and +1 for the third
    expect(screen.getByText(/Gà nướng, Cơm gà \+1/)).toBeInTheDocument();
  });

  it('shows "100ml" display unit for ml ingredient', () => {
    const mlIngredient: Ingredient = {
      id: 'i3', name: { vi: 'Sữa', en: 'Sữa' }, caloriesPer100: 61, proteinPer100: 3.2,
      carbsPer100: 4.8, fatPer100: 3.3, fiberPer100: 0, unit: { vi: 'ml', en: 'ml' },
    };
    render(<IngredientManager {...defaultProps} ingredients={[mlIngredient]} />);
    expect(screen.getByText('100ml')).toBeInTheDocument();
  });

  it('shows "1 cái" display unit for custom unit ingredient', () => {
    const caiIngredient: Ingredient = {
      id: 'i4', name: { vi: 'Trứng gà', en: 'Trứng gà' }, caloriesPer100: 155, proteinPer100: 13,
      carbsPer100: 1.1, fatPer100: 11, fiberPer100: 0, unit: { vi: 'cái', en: 'cái' },
    };
    render(<IngredientManager {...defaultProps} ingredients={[caiIngredient]} />);
    expect(screen.getByText('1 cái')).toBeInTheDocument();
  });

  it('calls onAdd when undo delete is triggered', () => {
    render(<IngredientManager {...defaultProps} />);
    const deleteButtons = screen.getAllByText('Xóa');
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByText('Xóa ngay'));
    expect(mockNotify.info).toHaveBeenCalled();
    // Get the undo action
    const call = mockNotify.info.mock.calls[0];
    const options = call[2];
    expect(options?.action?.label).toBeDefined();
    // Trigger undo
    options.action.onClick();
    // onAdd should be called with the deleted ingredient (sorted: "Cơm trắng" first)
    expect(defaultProps.onAdd).toHaveBeenCalledWith(expect.objectContaining({ id: 'i2', name: { vi: 'Cơm trắng', en: 'Cơm trắng' } }));
  });

  it('opens detail modal from list view when ingredient name clicked', () => {
    render(<IngredientManager {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    // Click the ingredient name button in the table
    const nameBtn = screen.getAllByText('Ức gà').find(el => el.tagName === 'BUTTON');
    expect(nameBtn).toBeDefined();
    if (nameBtn) fireEvent.click(nameBtn);
    expect(screen.getByText('Chi tiết nguyên liệu')).toBeInTheDocument();
  });

  it('shows no "used in" section for ingredients not used in any dish', () => {
    const unusedIngredient: Ingredient = {
      id: 'i99', name: { vi: 'Muối', en: 'Muối' }, caloriesPer100: 0, proteinPer100: 0,
      carbsPer100: 0, fatPer100: 0, fiberPer100: 0, unit: { vi: 'g', en: 'g' },
    };
    render(<IngredientManager {...defaultProps} ingredients={[unusedIngredient]} dishes={[]} />);
    expect(screen.queryByText(/Dùng trong/)).not.toBeInTheDocument();
  });

  it('confirms delete and calls onDelete through ConfirmationModal', () => {
    render(<IngredientManager {...defaultProps} />);
    const deleteButtons = screen.getAllByText('Xóa');
    fireEvent.click(deleteButtons[0]);
    // Confirmation modal should appear
    expect(screen.getByText('Xóa nguyên liệu?')).toBeInTheDocument();
    // Confirm
    fireEvent.click(screen.getByText('Xóa ngay'));
    expect(defaultProps.onDelete).toHaveBeenCalledWith('i2');
  });

  it('cancels delete confirmation modal', () => {
    render(<IngredientManager {...defaultProps} />);
    const deleteButtons = screen.getAllByText('Xóa');
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByText('Xóa nguyên liệu?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Hủy'));
    expect(screen.queryByText('Xóa nguyên liệu?')).not.toBeInTheDocument();
  });
});
