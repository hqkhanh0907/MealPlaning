import { fireEvent, render, screen, waitFor } from '@testing-library/react';

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
    calories: 200,
    protein: 25,
    carbs: 0,
    fat: 8,
    fiber: 0,
  }),
}));

const ingredients: Ingredient[] = [
  {
    id: 'i1',
    name: { vi: 'Ức gà', en: 'Ức gà' },
    caloriesPer100: 165,
    proteinPer100: 31,
    carbsPer100: 0,
    fatPer100: 3.6,
    fiberPer100: 0,
    unit: { vi: 'g', en: 'g' },
  },
  {
    id: 'i2',
    name: { vi: 'Cơm trắng', en: 'Cơm trắng' },
    caloriesPer100: 130,
    proteinPer100: 2.7,
    carbsPer100: 28,
    fatPer100: 0.3,
    fiberPer100: 0.4,
    unit: { vi: 'g', en: 'g' },
  },
];

const dishes: Dish[] = [
  {
    id: 'd1',
    name: { vi: 'Gà nướng', en: 'Gà nướng' },
    ingredients: [{ ingredientId: 'i1', amount: 200 }],
    tags: ['lunch', 'dinner'],
  },
  {
    id: 'd2',
    name: { vi: 'Cơm gà', en: 'Cơm gà' },
    ingredients: [
      { ingredientId: 'i1', amount: 100 },
      { ingredientId: 'i2', amount: 200 },
    ],
    tags: ['lunch'],
  },
  {
    id: 'd3',
    name: { vi: 'Salad gà', en: 'Salad gà' },
    ingredients: [{ ingredientId: 'i1', amount: 150 }],
    tags: ['dinner'],
  },
  {
    id: 'd4',
    name: { vi: 'Cháo gà', en: 'Cháo gà' },
    ingredients: [
      { ingredientId: 'i1', amount: 50 },
      { ingredientId: 'i2', amount: 100 },
    ],
    tags: ['breakfast'],
  },
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
    const deleteButtons = screen.getAllByText('Xóa');
    // Button should be disabled for used dishes
    expect(deleteButtons[0]).toBeDisabled();
    // Click should not trigger warning or confirmation
    fireEvent.click(deleteButtons[0]);
    expect(mockNotify.warning).not.toHaveBeenCalled();
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
    // Sorted by name-asc: "Cháo gà" (d4) appears first
    expect(defaultProps.onDelete).toHaveBeenCalledWith('d4');
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
    expect(screen.getByText(/Chưa có món ăn/)).toBeInTheDocument();
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
      {
        id: 'd1',
        name: { vi: 'Gà nướng', en: 'Gà nướng' },
        ingredients: [{ ingredientId: 'i1', amount: 200 }],
        tags: ['lunch', 'dinner'],
      },
      {
        id: 'd3',
        name: { vi: 'Bánh mì', en: 'Bánh mì' },
        ingredients: [{ ingredientId: 'i2', amount: 100 }],
        tags: ['breakfast'],
      },
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
      {
        id: 'd1',
        name: { vi: 'Gà nướng', en: 'Gà nướng' },
        ingredients: [{ ingredientId: 'i1', amount: 200 }],
        tags: ['lunch', 'dinner'],
      },
      {
        id: 'd3',
        name: { vi: 'Bánh mì', en: 'Bánh mì' },
        ingredients: [{ ingredientId: 'i2', amount: 100 }],
        tags: ['breakfast'],
      },
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
    // Delete the first dish (sorted by name: "Cháo gà" first)
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
    expect(defaultProps.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'd4', name: { vi: 'Cháo gà', en: 'Cháo gà' } }),
    );
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
    expect(document.body.innerHTML.indexOf('Cơm gà')).toBeLessThan(document.body.innerHTML.indexOf('Gà nướng'));
  });

  it('sorts dishes by name descending', () => {
    render(<DishManager {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(sortSelect, { target: { value: 'name-desc' } });
    expect(screen.getByDisplayValue('Tên (Z-A)')).toBeInTheDocument();
  });

  it('sorts dishes by protein descending', () => {
    render(<DishManager {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(sortSelect, { target: { value: 'pro-desc' } });
    expect(screen.getByDisplayValue('Protein (Cao → Thấp)')).toBeInTheDocument();
  });

  it('clears tag filter by clicking the Tất cả tag button', () => {
    render(<DishManager {...defaultProps} />);
    // First activate a filter
    const dinnerButtons = screen.getAllByText(/Tối/);
    const filterChip = dinnerButtons.find(el => el.closest('button')?.textContent?.includes('('));
    if (filterChip) fireEvent.click(filterChip);
    // Now click the "Tất cả" filter chip
    fireEvent.click(screen.getByTestId('btn-filter-all-dishes'));
    // Both dishes should be visible
    expect(screen.getByText('Gà nướng')).toBeInTheDocument();
    expect(screen.getByText('Cơm gà')).toBeInTheDocument();
  });

  it('closes edit modal via edit close handler', () => {
    render(<DishManager {...defaultProps} />);
    const editButtons = screen.getAllByText('Chỉnh sửa');
    fireEvent.click(editButtons[0]);
    expect(screen.getByText('Sửa món ăn')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-close-dish'));
    expect(screen.queryByText('Sửa món ăn')).not.toBeInTheDocument();
  });

  it('renders detail modal with missing ingredient gracefully', () => {
    const dishWithMissingIng: Dish = {
      id: 'dm-bad',
      name: { vi: 'Món lỗi', en: 'Bad Dish' },
      ingredients: [{ ingredientId: 'nonexistent-ing', amount: 100 }],
      tags: ['lunch'],
    };
    render(<DishManager {...defaultProps} dishes={[dishWithMissingIng]} />);
    // Open detail modal
    fireEvent.click(screen.getByText('Món lỗi'));
    expect(screen.getByText('Chi tiết món ăn')).toBeInTheDocument();
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
    const dishNameBtns = screen
      .getAllByRole('button')
      .filter(btn => btn.textContent === 'Gà nướng' || btn.textContent === 'Cơm gà');
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

  it('deletes dish via list view table delete button', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    // Both table rows and mobile items share testid; use the first match (table row)
    const deleteBtns = screen.getAllByTestId('btn-delete-dish-d2');
    fireEvent.click(deleteBtns[0]);
    expect(screen.getByText('Xóa món ăn?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Xóa ngay'));
    expect(defaultProps.onDelete).toHaveBeenCalledWith('d2');
  });

  it('renders mobile list items in list view with dish info', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    // Mobile list items show "kcal" and "Pro" suffixes
    const kcalTexts = screen.getAllByText(/kcal/);
    expect(kcalTexts.length).toBeGreaterThan(0);
    const proTexts = screen.getAllByText(/Pro/);
    expect(proTexts.length).toBeGreaterThan(0);
  });

  it('opens detail modal from mobile list item name button', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    // Multiple buttons have the dish name; find one inside the mobile list (sm:hidden div)
    const allNameBtns = screen.getAllByText('Gà nướng').filter(el => el.tagName === 'BUTTON');
    // Click the last button (mobile list item renders after table row)
    fireEvent.click(allNameBtns.at(-1)!);
    expect(screen.getByText('Chi tiết món ăn')).toBeInTheDocument();
  });

  it('opens edit from detail modal via edit icon button', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getByText('Gà nướng'));
    expect(screen.getByText('Chi tiết món ăn')).toBeInTheDocument();
    const editIcons = screen.getAllByTitle('Chỉnh sửa');
    const modalEditBtn = editIcons.find(el => el.closest('[class*="z-60"]'));
    if (modalEditBtn) fireEvent.click(modalEditBtn);
    expect(screen.getByText('Sửa món ăn')).toBeInTheDocument();
  });

  it('clicks edit button in list view table row', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    // Table edit buttons use the same testid pattern
    const editBtns = screen.getAllByTestId('btn-edit-dish-d1');
    fireEvent.click(editBtns[0]);
    expect(screen.getByText('Sửa món ăn')).toBeInTheDocument();
  });

  it('clicks edit button in mobile list view', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    // Mobile edit buttons are the second occurrence (after table row)
    const editBtns = screen.getAllByTestId('btn-edit-dish-d1');
    fireEvent.click(editBtns.at(-1)!);
    expect(screen.getByText('Sửa món ăn')).toBeInTheDocument();
  });

  it('clicks delete button in mobile list view', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    // Mobile delete buttons are the second occurrence
    const deleteBtns = screen.getAllByTestId('btn-delete-dish-d1');
    fireEvent.click(deleteBtns.at(-1)!);
    expect(screen.getByText('Xóa món ăn?')).toBeInTheDocument();
  });

  it('shows empty state action in grid view', () => {
    render(<DishManager {...defaultProps} dishes={[]} />);
    // Empty state shows add button with actionLabel; toolbar also has one.
    // The EmptyState button has bg-primary class.
    const btns = screen.getAllByText('Thêm món ăn');
    const emptyBtn = btns.find(el => el.closest('button')?.className.includes('bg-primary'));
    expect(emptyBtn).toBeDefined();
    const emptyBtnEl = emptyBtn?.closest('button');
    if (emptyBtnEl) fireEvent.click(emptyBtnEl);
    expect(screen.getByText('Tạo món ăn mới')).toBeInTheDocument();
  });

  it('shows empty state action in list view', () => {
    render(<DishManager {...defaultProps} dishes={[]} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    const btns = screen.getAllByText('Thêm món ăn');
    const emptyBtn = btns.find(el => el.closest('button')?.className.includes('bg-primary'));
    expect(emptyBtn).toBeDefined();
    const emptyBtnEl = emptyBtn?.closest('button');
    if (emptyBtnEl) fireEvent.click(emptyBtnEl);
    expect(screen.getByText('Tạo món ăn mới')).toBeInTheDocument();
  });

  it('opens edit modal via EmptyState onAction callback in grid view', () => {
    render(<DishManager {...defaultProps} dishes={[]} />);
    // Target the EmptyState button inside the dashed-border container
    const emptyContainer = document.querySelector('[class*="border-dashed"]');
    expect(emptyContainer).toBeTruthy();
    if (!emptyContainer) return;
    const actionBtn = emptyContainer.querySelector('button');
    expect(actionBtn).toBeTruthy();
    if (!actionBtn) return;
    fireEvent.click(actionBtn);
    expect(screen.getByText('Tạo món ăn mới')).toBeInTheDocument();
  });

  it('opens edit modal via EmptyState onAction callback in list view', () => {
    render(<DishManager {...defaultProps} dishes={[]} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    const emptyContainer = document.querySelector('[class*="border-dashed"]');
    expect(emptyContainer).toBeTruthy();
    if (!emptyContainer) return;
    const actionBtn = emptyContainer.querySelector('button');
    expect(actionBtn).toBeTruthy();
    if (!actionBtn) return;
    fireEvent.click(actionBtn);
    expect(screen.getByText('Tạo món ăn mới')).toBeInTheDocument();
  });

  it('submits a new dish through DishManager (handleDishSubmit onAdd path, line 89)', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getByText('Thêm món ăn'));
    // Fill form name
    fireEvent.change(screen.getByPlaceholderText('VD: Ức gà áp chảo'), { target: { value: 'Món test mới' } });
    // Add ingredient — same approach as existing test 'validates tag selection'
    const ingPickerBtns = screen.getAllByText('Ức gà');
    fireEvent.click(ingPickerBtns[0]);
    // Select tag — find the Sáng tag button that does NOT contain a count "(N)"
    const sangBtns = screen.getAllByText(/Sáng/);
    const modalTagBtn = sangBtns.find(el => {
      const btn = el.closest('button');
      return btn && !(btn.textContent && /\(\d+\)/.exec(btn.textContent));
    });
    expect(modalTagBtn).toBeDefined();
    const tagButton = modalTagBtn?.closest('button');
    if (!tagButton) return;
    fireEvent.click(tagButton);
    // Submit
    fireEvent.click(screen.getByText('Lưu món ăn'));
    expect(defaultProps.onAdd).toHaveBeenCalled();
  });

  it('opens edit modal with prefilled data when duplicate button is clicked (grid view)', () => {
    render(<DishManager {...defaultProps} />);
    const cloneBtn = screen.getByTestId('btn-clone-dish-d1');
    fireEvent.click(cloneBtn);
    // Edit modal should open with the duplicated name
    expect(screen.getByText(/Tạo món ăn mới|Sửa món ăn/)).toBeInTheDocument();
    // onAdd is NOT called yet — only on save
    expect(defaultProps.onAdd).not.toHaveBeenCalled();
  });

  it('opens edit modal when duplicate button is clicked in list view (desktop)', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    const cloneBtns = screen.getAllByTestId('btn-clone-dish-d1');
    fireEvent.click(cloneBtns[0]);
    expect(screen.getByText(/Tạo món ăn mới|Sửa món ăn/)).toBeInTheDocument();
  });

  it('opens edit modal when duplicate button is clicked in mobile list view', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    const cloneBtns = screen.getAllByTestId('btn-clone-dish-d1');
    fireEvent.click(cloneBtns.at(-1)!);
    expect(screen.getByText(/Tạo món ăn mới|Sửa món ăn/)).toBeInTheDocument();
  });

  it('calls onAdd (not onUpdate) when saving a duplicated dish', () => {
    render(<DishManager {...defaultProps} />);
    // Click duplicate on a dish
    fireEvent.click(screen.getByTestId('btn-clone-dish-d1'));
    // Modal opens — click save (which validates form)
    fireEvent.click(screen.getByText('Lưu món ăn'));
    // Since editingItem is null (create mode), onAdd should be called
    expect(defaultProps.onAdd).toHaveBeenCalled();
    expect(defaultProps.onUpdate).not.toHaveBeenCalled();
  });

  it('renders compare buttons on each dish card', () => {
    render(<DishManager {...defaultProps} />);
    expect(screen.getAllByTestId('btn-compare-d1').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('btn-compare-d2').length).toBeGreaterThan(0);
  });

  it('shows floating compare button when 2 dishes selected', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getAllByTestId('btn-compare-d1')[0]);
    expect(screen.queryByTestId('btn-open-compare')).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByTestId('btn-compare-d2')[0]);
    expect(screen.getByTestId('btn-open-compare')).toBeInTheDocument();
  });

  it('opens compare panel with nutrition table', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getAllByTestId('btn-compare-d1')[0]);
    fireEvent.click(screen.getAllByTestId('btn-compare-d2')[0]);
    fireEvent.click(screen.getByTestId('btn-open-compare'));
    expect(screen.getByTestId('compare-panel')).toBeInTheDocument();
    expect(screen.getByText('So sánh dinh dưỡng')).toBeInTheDocument();
  });

  it('closes compare panel when X is clicked', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getAllByTestId('btn-compare-d1')[0]);
    fireEvent.click(screen.getAllByTestId('btn-compare-d2')[0]);
    fireEvent.click(screen.getByTestId('btn-open-compare'));
    expect(screen.getByTestId('compare-panel')).toBeInTheDocument();
    fireEvent.click(screen.getAllByLabelText('Đóng')[1]);
    expect(screen.queryByTestId('compare-panel')).not.toBeInTheDocument();
  });

  it('deselects a dish from compare by clicking again', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getAllByTestId('btn-compare-d1')[0]);
    fireEvent.click(screen.getAllByTestId('btn-compare-d2')[0]);
    expect(screen.getByTestId('btn-open-compare')).toBeInTheDocument();
    fireEvent.click(screen.getAllByTestId('btn-compare-d1')[0]);
    expect(screen.queryByTestId('btn-open-compare')).not.toBeInTheDocument();
  });

  it('warns when trying to select more than 3 dishes', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getAllByTestId('btn-compare-d1')[0]);
    fireEvent.click(screen.getAllByTestId('btn-compare-d2')[0]);
    fireEvent.click(screen.getAllByTestId('btn-compare-d3')[0]);
    fireEvent.click(screen.getAllByTestId('btn-compare-d4')[0]);
    expect(mockNotify.warning).toHaveBeenCalledWith('Tối đa 3 món');
  });

  it('closes compare panel when backdrop is clicked', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getAllByTestId('btn-compare-d1')[0]);
    fireEvent.click(screen.getAllByTestId('btn-compare-d2')[0]);
    fireEvent.click(screen.getByTestId('btn-open-compare'));
    fireEvent.click(screen.getAllByLabelText('Đóng')[0]);
    expect(screen.queryByTestId('compare-panel')).not.toBeInTheDocument();
  });

  it('selects dish for compare in mobile list view', () => {
    render(<DishManager {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    const compareBtns = screen.getAllByTestId('btn-compare-d1');
    fireEvent.click(compareBtns.at(-1)!);
    const compareBtns2 = screen.getAllByTestId('btn-compare-d2');
    fireEvent.click(compareBtns2.at(-1)!);
    expect(screen.getByTestId('btn-open-compare')).toBeInTheDocument();
  });

  it('displays rating stars on dish cards', () => {
    const ratedDishes: Dish[] = [
      { ...dishes[0], rating: 4 },
      { ...dishes[1], rating: 0 },
    ];
    render(<DishManager {...defaultProps} dishes={ratedDishes} />);
    expect(screen.getByTestId('dish-rating-d1')).toBeInTheDocument();
    expect(screen.queryByTestId('dish-rating-d2')).not.toBeInTheDocument();
  });

  it('sorts dishes by rating', () => {
    const ratedDishes: Dish[] = [
      { ...dishes[0], rating: 2 },
      { ...dishes[1], rating: 5 },
      { ...dishes[2], rating: 1 },
    ];
    render(<DishManager {...defaultProps} dishes={ratedDishes} />);
    const sortSelect = screen.getByTestId('select-sort-dish');
    fireEvent.change(sortSelect, { target: { value: 'rating-desc' } });
    const allText = document.body.textContent ?? '';
    const pos5 = allText.indexOf('Cơm gà');
    const pos2 = allText.indexOf('Gà nướng');
    expect(pos5).toBeLessThan(pos2);
  });

  it('sorts dishes by rating ascending', () => {
    const ratedDishes: Dish[] = [
      { ...dishes[0], rating: 5 },
      { ...dishes[1], rating: 1 },
    ];
    render(<DishManager {...defaultProps} dishes={ratedDishes} />);
    const sortSelect = screen.getByTestId('select-sort-dish');
    fireEvent.change(sortSelect, { target: { value: 'rating-asc' } });
    const allText = document.body.textContent ?? '';
    const pos1 = allText.indexOf('Cơm gà');
    const pos5 = allText.indexOf('Gà nướng');
    expect(pos1).toBeLessThan(pos5);
  });

  it('shows warning when handleDelete is called for a used dish (line 165-166)', () => {
    const isUsedMock = vi.fn().mockReturnValue(false);
    render(<DishManager {...defaultProps} isUsed={isUsedMock} />);
    // Button is enabled (isUsed returned false during render)
    // Now change isUsed to return true before clicking delete
    isUsedMock.mockReturnValue(true);
    const deleteButtons = screen.getAllByText('Xóa');
    fireEvent.click(deleteButtons[0]);
    expect(mockNotify.warning).toHaveBeenCalledWith('Không thể xóa', 'Món ăn này đang được sử dụng trong kế hoạch.');
  });

  it('toggles compare in list view table layout (line 404)', () => {
    render(<DishManager {...defaultProps} />);
    // Switch to list view
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    // Click compare button in the table — first occurrence is from table row
    const compareBtn = screen.getAllByTestId('btn-compare-d1')[0];
    fireEvent.click(compareBtn);
    // Select a second dish to see the floating compare button
    const compareBtn2 = screen.getAllByTestId('btn-compare-d2')[0];
    fireEvent.click(compareBtn2);
    expect(screen.getByTestId('btn-open-compare')).toBeInTheDocument();
  });

  it('delete button uses destructive color by default for unused dishes', () => {
    render(<DishManager {...defaultProps} />);
    const deleteButtons = screen.getAllByText('Xóa');
    expect(deleteButtons[0].className).toContain('text-destructive/70');
    expect(deleteButtons[0].className).toContain('hover:text-destructive');
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
    // Button should be disabled for used ingredients
    expect(deleteButtons[0]).toBeDisabled();
    // Click should not trigger warning or confirmation
    fireEvent.click(deleteButtons[0]);
    expect(mockNotify.warning).not.toHaveBeenCalled();
  });

  it('confirms and deletes ingredient', () => {
    render(<IngredientManager {...defaultProps} />);
    const deleteButtons = screen.getAllByText('Xóa');
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByText('Xóa ngay'));
    // Items sorted by name-asc: Cơm trắng (i2) comes before Ức gà (i1)
    expect(defaultProps.onDelete).toHaveBeenCalledWith('i2');
  });

  it('validates form on submit', async () => {
    render(<IngredientManager {...defaultProps} />);
    fireEvent.click(screen.getByText('Thêm nguyên liệu'));
    // Submit empty form
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));
    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập tên nguyên liệu')).toBeInTheDocument();
      expect(screen.getByText('Vui lòng nhập đơn vị tính')).toBeInTheDocument();
    });
  });

  it('saves new ingredient with valid data', async () => {
    render(<IngredientManager {...defaultProps} />);
    fireEvent.click(screen.getByText('Thêm nguyên liệu'));

    fireEvent.change(screen.getByPlaceholderText('Ví dụ: Thịt bò, Cà chua...'), { target: { value: 'Thịt bò' } });
    // Unit is now a <select> — pick 'g' from the dropdown
    fireEvent.change(screen.getByLabelText(/Đơn vị tính/), { target: { value: 'g' } });

    fireEvent.click(screen.getByText('Lưu nguyên liệu'));
    await waitFor(() => {
      expect(defaultProps.onAdd).toHaveBeenCalled();
    });
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
    expect(screen.getByText(/Chưa có nguyên liệu/)).toBeInTheDocument();
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

  it('sorts ingredients by name descending', () => {
    render(<IngredientManager {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(sortSelect, { target: { value: 'name-desc' } });
    expect(screen.getByDisplayValue('Tên (Z-A)')).toBeInTheDocument();
  });

  it('sorts ingredients by calories descending', () => {
    render(<IngredientManager {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(sortSelect, { target: { value: 'cal-desc' } });
    expect(screen.getByDisplayValue('Calo (Cao → Thấp)')).toBeInTheDocument();
  });

  it('sorts ingredients by protein ascending', () => {
    render(<IngredientManager {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(sortSelect, { target: { value: 'pro-asc' } });
    expect(screen.getByDisplayValue('Protein (Thấp → Cao)')).toBeInTheDocument();
  });

  it('opens edit modal when edit button is clicked', () => {
    render(<IngredientManager {...defaultProps} />);
    const editButtons = screen.getAllByText('Chỉnh sửa');
    fireEvent.click(editButtons[0]);
    expect(screen.getByText('Sửa nguyên liệu')).toBeInTheDocument();
  });

  it('calls onUpdate (not onAdd) when saving an edited ingredient', async () => {
    render(<IngredientManager {...defaultProps} />);
    const editButtons = screen.getAllByText('Chỉnh sửa');
    fireEvent.click(editButtons[0]); // Opens edit for Cơm trắng (first sorted name-asc)
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));
    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalled();
      expect(defaultProps.onAdd).not.toHaveBeenCalled();
    });
  });

  it('truncates "Used in" when ingredient appears in 3+ dishes', () => {
    const threeDishes: Dish[] = [
      {
        id: 'd1',
        name: { vi: 'Gà nướng', en: 'Gà nướng' },
        ingredients: [{ ingredientId: 'i1', amount: 200 }],
        tags: ['lunch'],
      },
      {
        id: 'd2',
        name: { vi: 'Cơm gà', en: 'Cơm gà' },
        ingredients: [{ ingredientId: 'i1', amount: 100 }],
        tags: ['lunch'],
      },
      {
        id: 'd3',
        name: { vi: 'Bún gà', en: 'Bún gà' },
        ingredients: [{ ingredientId: 'i1', amount: 150 }],
        tags: ['dinner'],
      },
    ];
    render(<IngredientManager {...defaultProps} dishes={threeDishes} />);
    // Should show first 2 names and +1 for the third
    expect(screen.getByText(/Gà nướng, Cơm gà \+1/)).toBeInTheDocument();
  });

  it('shows "100ml" display unit for ml ingredient', () => {
    const mlIngredient: Ingredient = {
      id: 'i3',
      name: { vi: 'Sữa', en: 'Sữa' },
      caloriesPer100: 61,
      proteinPer100: 3.2,
      carbsPer100: 4.8,
      fatPer100: 3.3,
      fiberPer100: 0,
      unit: { vi: 'ml', en: 'ml' },
    };
    render(<IngredientManager {...defaultProps} ingredients={[mlIngredient]} />);
    expect(screen.getByText('100ml')).toBeInTheDocument();
  });

  it('shows "1 cái" display unit for custom unit ingredient', () => {
    const caiIngredient: Ingredient = {
      id: 'i4',
      name: { vi: 'Trứng gà', en: 'Trứng gà' },
      caloriesPer100: 155,
      proteinPer100: 13,
      carbsPer100: 1.1,
      fatPer100: 11,
      fiberPer100: 0,
      unit: { vi: 'cái', en: 'cái' },
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
    expect(defaultProps.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'i2', name: { vi: 'Cơm trắng', en: 'Cơm trắng' } }),
    );
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
      id: 'i99',
      name: { vi: 'Muối', en: 'Muối' },
      caloriesPer100: 0,
      proteinPer100: 0,
      carbsPer100: 0,
      fatPer100: 0,
      fiberPer100: 0,
      unit: { vi: 'g', en: 'g' },
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

  it('renders mobile list items in list view with ingredient info', () => {
    render(<IngredientManager {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    // Mobile list items show "kcal" and "Pro" suffixes
    const kcalTexts = screen.getAllByText(/kcal/);
    expect(kcalTexts.length).toBeGreaterThan(0);
    const proTexts = screen.getAllByText(/Pro/);
    expect(proTexts.length).toBeGreaterThan(0);
  });

  it('opens detail modal from mobile list item name button', () => {
    render(<IngredientManager {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    // Find all buttons with ingredient name text
    const allNameBtns = screen.getAllByText('Ức gà').filter(el => el.tagName === 'BUTTON');
    // Click the last button (mobile list item renders after table row)
    fireEvent.click(allNameBtns.at(-1)!);
    expect(screen.getByText('Chi tiết nguyên liệu')).toBeInTheDocument();
  });

  it('edits ingredient from mobile list item edit button', () => {
    render(<IngredientManager {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    // Edit buttons in mobile list use same testid pattern
    const editBtns = screen.getAllByTestId('btn-edit-ingredient-i1');
    fireEvent.click(editBtns.at(-1)!);
    expect(screen.getByText('Sửa nguyên liệu')).toBeInTheDocument();
  });

  it('deletes ingredient from mobile list item delete button', () => {
    render(<IngredientManager {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    const deleteBtns = screen.getAllByTestId('btn-delete-ingredient-i2');
    fireEvent.click(deleteBtns.at(-1)!);
    expect(screen.getByText('Xóa nguyên liệu?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Xóa ngay'));
    expect(defaultProps.onDelete).toHaveBeenCalledWith('i2');
  });

  it('opens edit from detail modal via edit icon button', () => {
    render(<IngredientManager {...defaultProps} />);
    fireEvent.click(screen.getByText('Ức gà'));
    expect(screen.getByText('Chi tiết nguyên liệu')).toBeInTheDocument();
    // Click the edit icon button in the detail modal header
    const editIcons = screen.getAllByTitle('Chỉnh sửa');
    const modalEditBtn = editIcons.find(el => el.closest('[class*="z-60"]'));
    if (modalEditBtn) fireEvent.click(modalEditBtn);
    expect(screen.getByText('Sửa nguyên liệu')).toBeInTheDocument();
  });

  it('closes edit modal without saving to trigger onClose callback', () => {
    render(<IngredientManager {...defaultProps} />);
    const editButtons = screen.getAllByText('Chỉnh sửa');
    fireEvent.click(editButtons[0]);
    expect(screen.getByText('Sửa nguyên liệu')).toBeInTheDocument();
    // Close via X button without changing anything
    const xButton = screen.getAllByRole('button').find(b => b.querySelector('.lucide-x'));
    if (xButton) fireEvent.click(xButton);
    expect(screen.queryByText('Sửa nguyên liệu')).not.toBeInTheDocument();
  });

  it('shows empty state action in list view', () => {
    render(<IngredientManager {...defaultProps} ingredients={[]} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    const btns = screen.getAllByText('Thêm nguyên liệu');
    const emptyBtn = btns.find(el => el.closest('button')?.className.includes('bg-primary'));
    expect(emptyBtn).toBeDefined();
    if (emptyBtn) fireEvent.click(emptyBtn.closest('button') as HTMLElement);
    expect(screen.getByText('Thêm nguyên liệu mới')).toBeInTheDocument();
  });

  it('shows empty state action in grid view', () => {
    render(<IngredientManager {...defaultProps} ingredients={[]} />);
    const btns = screen.getAllByText('Thêm nguyên liệu');
    const emptyBtn = btns.find(el => el.closest('button')?.className.includes('bg-primary'));
    expect(emptyBtn).toBeDefined();
    if (emptyBtn) fireEvent.click(emptyBtn.closest('button') as HTMLElement);
    expect(screen.getByText('Thêm nguyên liệu mới')).toBeInTheDocument();
  });

  it('opens edit modal via EmptyState onAction callback in grid view', () => {
    render(<IngredientManager {...defaultProps} ingredients={[]} />);
    const emptyContainer = document.querySelector('[class*="border-dashed"]');
    expect(emptyContainer).toBeTruthy();
    if (!emptyContainer) return;
    const actionBtn = emptyContainer.querySelector('button');
    expect(actionBtn).toBeTruthy();
    if (!actionBtn) return;
    fireEvent.click(actionBtn);
    expect(screen.getByText('Thêm nguyên liệu mới')).toBeInTheDocument();
  });

  it('opens edit modal via EmptyState onAction callback in list view', () => {
    render(<IngredientManager {...defaultProps} ingredients={[]} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    const emptyContainer = document.querySelector('[class*="border-dashed"]');
    expect(emptyContainer).toBeTruthy();
    if (!emptyContainer) return;
    const actionBtn = emptyContainer.querySelector('button');
    expect(actionBtn).toBeTruthy();
    if (!actionBtn) return;
    fireEvent.click(actionBtn);
    expect(screen.getByText('Thêm nguyên liệu mới')).toBeInTheDocument();
  });

  it('clicks edit button in list view table row (line 176)', () => {
    render(<IngredientManager {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    const editBtns = screen.getAllByTestId('btn-edit-ingredient-i1');
    fireEvent.click(editBtns[0]); // Table row button
    expect(screen.getByText('Sửa nguyên liệu')).toBeInTheDocument();
  });

  it('clicks delete button in list view table row (line 177)', () => {
    render(<IngredientManager {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    const deleteBtns = screen.getAllByTestId('btn-delete-ingredient-i2');
    fireEvent.click(deleteBtns[0]); // Table row button
    expect(screen.getByText('Xóa nguyên liệu?')).toBeInTheDocument();
  });

  it('shows empty state in list view when no ingredients match', () => {
    render(<IngredientManager {...defaultProps} ingredients={[]} />);
    fireEvent.click(screen.getByTitle('Xem dạng danh sách'));
    expect(screen.getByText(/Chưa có nguyên liệu/)).toBeInTheDocument();
  });

  it('delete button uses destructive color by default for unused ingredients', () => {
    render(<IngredientManager {...defaultProps} />);
    const deleteButtons = screen.getAllByText('Xóa');
    expect(deleteButtons[0].className).toContain('text-destructive/70');
    expect(deleteButtons[0].className).toContain('hover:text-destructive');
  });
});
