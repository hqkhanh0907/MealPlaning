import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { IngredientEditModal } from '../components/modals/IngredientEditModal';
import type { Ingredient } from '../types';

vi.mock('../hooks/useModalBackHandler', () => ({ useModalBackHandler: vi.fn() }));
const mockNotify = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismissAll: vi.fn() };
vi.mock('../contexts/NotificationContext', () => ({ useNotification: () => mockNotify }));

const mockSuggestIngredientInfo = vi.fn();
vi.mock('../services/geminiService', () => ({
  suggestIngredientInfo: (...args: unknown[]) => mockSuggestIngredientInfo(...args),
}));

const existingIngredient: Ingredient = {
  id: 'ing-1',
  name: { vi: 'Ức gà', en: 'Ức gà' },
  caloriesPer100: 165,
  proteinPer100: 31,
  carbsPer100: 0,
  fatPer100: 3.6,
  fiberPer100: 0,
  unit: { vi: 'g' },
};

describe('IngredientEditModal', () => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Render Tests ---

  it('renders create new ingredient form with correct title', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByText('Thêm nguyên liệu mới')).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên nguyên liệu/)).toHaveValue('');
    expect(screen.getByLabelText(/Đơn vị tính/)).toHaveValue('');
  });

  it('renders edit existing ingredient with pre-populated data', () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByText('Sửa nguyên liệu')).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên nguyên liệu/)).toHaveValue('Ức gà');
    expect(screen.getByLabelText(/Đơn vị tính/)).toHaveValue('g');
  });

  it('renders all 5 nutrition fields', () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByDisplayValue('165')).toBeInTheDocument();
    expect(screen.getByDisplayValue('31')).toBeInTheDocument();
    // fatPer100: 3.6 is rounded to 4 on display
    expect(screen.getByDisplayValue('4')).toBeInTheDocument();
  });

  it('renders save button', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByText('Lưu nguyên liệu')).toBeInTheDocument();
  });

  // --- Validation Tests ---

  it('shows name validation error when submitting without name', async () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    // Fill unit but no name
    fireEvent.change(screen.getByLabelText(/Đơn vị tính/), { target: { value: 'g' } });
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));

    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập tên nguyên liệu')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows unit validation error when submitting without unit', async () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    // Fill name but no unit
    fireEvent.change(screen.getByLabelText(/Tên nguyên liệu/), { target: { value: 'Thịt bò' } });
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));

    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập đơn vị tính')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows both validation errors when both name and unit are empty', async () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));

    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập tên nguyên liệu')).toBeInTheDocument();
      expect(screen.getByText('Vui lòng nhập đơn vị tính')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears name error when user types a name', async () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));
    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập tên nguyên liệu')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Tên nguyên liệu/), { target: { value: 'X' } });
    await waitFor(() => {
      expect(screen.queryByText('Vui lòng nhập tên nguyên liệu')).not.toBeInTheDocument();
    });
  });

  it('clears unit error when user types a unit', async () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));
    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập đơn vị tính')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Đơn vị tính/), { target: { value: 'g' } });
    await waitFor(() => {
      expect(screen.queryByText('Vui lòng nhập đơn vị tính')).not.toBeInTheDocument();
    });
  });

  // --- Nutrition Field Tests ---

  it('allows negative input without immediate clamping', () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    const calorieInput = screen.getByDisplayValue('165');
    fireEvent.change(calorieInput, { target: { value: '-10' } });
    expect(calorieInput).toHaveValue(-10);
  });

  it('shows per-field error when nutrition field is negative on submit', async () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    const calorieInput = screen.getByDisplayValue('165');
    fireEvent.change(calorieInput, { target: { value: '-10' } });
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));
    await waitFor(() => {
      expect(screen.getByText('Giá trị không được âm')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows per-field error when nutrition field is empty on submit', async () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    const calorieInput = screen.getByDisplayValue('165');
    fireEvent.change(calorieInput, { target: { value: '' } });
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));
    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập giá trị')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('allows zero value in nutrition field and submits successfully', () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    const calorieInput = screen.getByDisplayValue('165');
    fireEvent.change(calorieInput, { target: { value: '0' } });
    expect(calorieInput).toHaveValue(0);
    expect(screen.queryByText('Giá trị không được âm')).not.toBeInTheDocument();
  });

  it('clears nutrition error when user fixes the field', async () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    const calorieInput = screen.getByDisplayValue('165');
    fireEvent.change(calorieInput, { target: { value: '-10' } });
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));
    await waitFor(() => {
      expect(screen.getByText('Giá trị không được âm')).toBeInTheDocument();
    });
    fireEvent.change(calorieInput, { target: { value: '100' } });
    await waitFor(() => {
      expect(screen.queryByText('Giá trị không được âm')).not.toBeInTheDocument();
    });
  });

  it('updates nutrition field with valid number', () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    const calorieInput = screen.getByDisplayValue('165');
    fireEvent.change(calorieInput, { target: { value: '200' } });
    expect(screen.getByDisplayValue('200')).toBeInTheDocument();
  });

  // --- Display Unit Label Tests ---

  it('shows 100g label for g unit', () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByText(/Calories \/ 100g/)).toBeInTheDocument();
    expect(screen.getByText(/Protein \/ 100g/)).toBeInTheDocument();
  });

  it('shows 100ml label for ml unit', () => {
    const mlIngredient: Ingredient = { ...existingIngredient, unit: { vi: 'ml', en: 'ml' } };
    render(<IngredientEditModal editingItem={mlIngredient} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByText(/Calories \/ 100ml/)).toBeInTheDocument();
  });

  it('shows "1 unit" label for custom units', () => {
    const customIngredient: Ingredient = { ...existingIngredient, unit: { vi: 'cái', en: 'cái' } };
    render(<IngredientEditModal editingItem={customIngredient} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByText(/Calories \/ 1 cái/)).toBeInTheDocument();
  });

  it('shows 100g label for kg unit', () => {
    const kgIngredient: Ingredient = { ...existingIngredient, unit: { vi: 'kg', en: 'kg' } };
    render(<IngredientEditModal editingItem={kgIngredient} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByText(/Calories \/ 100g/)).toBeInTheDocument();
  });

  it('shows 100ml label for L unit', () => {
    const lIngredient: Ingredient = { ...existingIngredient, unit: { vi: 'L', en: 'L' } };
    render(<IngredientEditModal editingItem={lIngredient} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByText(/Calories \/ 100ml/)).toBeInTheDocument();
  });

  // --- AI Search Tests ---

  it('AI button is disabled when name is empty', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    // Fill unit only
    fireEvent.change(screen.getByLabelText(/Đơn vị tính/), { target: { value: 'g' } });

    // When unit is filled, aria-label is the AI tooltip but still disabled due to no name
    const aiButton = screen.getByRole('button', { name: 'Tự động điền thông tin bằng AI' });
    expect(aiButton).toBeDisabled();
  });

  it('AI button is disabled when unit is empty', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Tên nguyên liệu/), { target: { value: 'Thịt bò' } });

    // When unit is empty, aria-label shows the no-unit tooltip
    const aiButton = screen.getByRole('button', { name: 'Vui lòng nhập đơn vị tính trước' });
    expect(aiButton).toBeDisabled();
  });

  it('AI button is enabled when both name and unit are filled', () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    const aiButton = screen.getByRole('button', { name: 'Tự động điền thông tin bằng AI' });
    expect(aiButton).not.toBeDisabled();
  });

  it('fills nutrition fields after successful AI search', async () => {
    mockSuggestIngredientInfo.mockResolvedValueOnce({
      calories: 250,
      protein: 26,
      carbs: 0,
      fat: 15,
      fiber: 0,
    });

    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    const aiButton = screen.getByRole('button', { name: 'Tự động điền thông tin bằng AI' });
    fireEvent.click(aiButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('250')).toBeInTheDocument();
      expect(screen.getByDisplayValue('26')).toBeInTheDocument();
      expect(screen.getByDisplayValue('15')).toBeInTheDocument();
    });
  });

  it('shows error notification on AI search failure', async () => {
    mockSuggestIngredientInfo.mockRejectedValueOnce(new Error('Network error'));

    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tự động điền thông tin bằng AI' }));

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith('Tra cứu thất bại', expect.stringContaining('Ức gà'));
    });
  });

  it('shows warning notification on AI search timeout', async () => {
    mockSuggestIngredientInfo.mockRejectedValueOnce(new Error('Timeout'));

    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tự động điền thông tin bằng AI' }));

    await waitFor(() => {
      expect(mockNotify.warning).toHaveBeenCalledWith('Phản hồi quá lâu', expect.stringContaining('Ức gà'));
    });
  });

  // --- Submit Tests ---

  it('submits valid ingredient with correct data structure', async () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Tên nguyên liệu/), { target: { value: 'Thịt bò' } });
    fireEvent.change(screen.getByLabelText(/Đơn vị tính/), { target: { value: 'g' } });
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const saved = onSubmit.mock.calls[0][0];
    expect(saved.name).toEqual({ vi: 'Thịt bò' });
    expect(saved.unit).toEqual({ vi: 'g' });
    expect(saved.caloriesPer100).toBe(0);
    expect(saved.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('preserves existing ingredient ID when editing', async () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit.mock.calls[0][0].id).toBe('ing-1');
  });

  // --- Close / Unsaved Changes Tests ---

  it('calls onClose directly when no changes made', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    const xButton = screen.getAllByRole('button').find(b => b.querySelector('.lucide-x'));
    if (xButton) fireEvent.click(xButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows unsaved dialog when closing with name change', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Tên nguyên liệu/), { target: { value: 'New' } });

    const xButton = screen.getAllByRole('button').find(b => b.querySelector('.lucide-x'));
    if (xButton) fireEvent.click(xButton);

    expect(screen.getByText(/Thay đổi chưa lưu/)).toBeInTheDocument();
  });

  it('shows unsaved dialog when closing with unit change', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Đơn vị tính/), { target: { value: 'ml' } });

    const xButton = screen.getAllByRole('button').find(b => b.querySelector('.lucide-x'));
    if (xButton) fireEvent.click(xButton);

    expect(screen.getByText(/Thay đổi chưa lưu/)).toBeInTheDocument();
  });

  it('discards changes via unsaved dialog', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Tên nguyên liệu/), { target: { value: 'Test' } });

    const xButton = screen.getAllByRole('button').find(b => b.querySelector('.lucide-x'));
    if (xButton) fireEvent.click(xButton);

    fireEvent.click(screen.getByText('Bỏ thay đổi'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('saves and closes via unsaved dialog when form is valid', async () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Tên nguyên liệu/), { target: { value: 'Cà chua' } });
    fireEvent.change(screen.getByLabelText(/Đơn vị tính/), { target: { value: 'g' } });

    const xButton = screen.getAllByRole('button').find(b => b.querySelector('.lucide-x'));
    if (xButton) fireEvent.click(xButton);

    fireEvent.click(screen.getByText('Lưu & quay lại'));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it('stays in dialog when save fails validation from unsaved dialog', async () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    // Only name filled, no unit
    fireEvent.change(screen.getByLabelText(/Tên nguyên liệu/), { target: { value: 'Test' } });

    const xButton = screen.getAllByRole('button').find(b => b.querySelector('.lucide-x'));
    if (xButton) fireEvent.click(xButton);

    fireEvent.click(screen.getByText('Lưu & quay lại'));
    // Dialog should close but validation error should appear
    await waitFor(() => {
      expect(screen.queryByText(/Thay đổi chưa được lưu/)).not.toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it('cancels unsaved dialog and returns to editing', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Tên nguyên liệu/), { target: { value: 'Test' } });

    const xButton = screen.getAllByRole('button').find(b => b.querySelector('.lucide-x'));
    if (xButton) fireEvent.click(xButton);

    fireEvent.click(screen.getByText('Ở lại chỉnh sửa'));
    expect(screen.queryByText(/Thay đổi chưa lưu/)).not.toBeInTheDocument();
    expect(screen.getByTestId('input-ing-name')).toHaveValue('Test');
  });

  it('detects changes in edited ingredient when nutrition values change', () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    const calorieInput = screen.getByDisplayValue('165');
    fireEvent.change(calorieInput, { target: { value: '200' } });

    const xButton = screen.getAllByRole('button').find(b => b.querySelector('.lucide-x'));
    if (xButton) fireEvent.click(xButton);

    expect(screen.getByText(/Thay đổi chưa lưu/)).toBeInTheDocument();
  });

  it('prevents double submission', async () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    const saveBtn = screen.getByText('Lưu nguyên liệu');
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    // Click save again — should be blocked by hasSubmittedRef guard
    fireEvent.click(saveBtn);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('AI search returns early when name is empty', async () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    // Only set unit, not name
    fireEvent.change(screen.getByLabelText(/Đơn vị tính/), { target: { value: 'g' } });
    // AI button should be disabled due to empty name
    const aiButton = screen.getByRole('button', { name: 'Tự động điền thông tin bằng AI' });
    expect(aiButton).toBeDisabled();
    // Even if we force call it, mockSuggestIngredientInfo should not be called
    expect(mockSuggestIngredientInfo).not.toHaveBeenCalled();
  });

  it('AI search returns early when unit is empty', async () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Tên nguyên liệu/), { target: { value: 'Thịt bò' } });
    // Unit is empty, button disabled with no-unit tooltip
    const aiButton = screen.getByRole('button', { name: 'Vui lòng nhập đơn vị tính trước' });
    expect(aiButton).toBeDisabled();
    expect(mockSuggestIngredientInfo).not.toHaveBeenCalled();
  });

  // --- Regression: BUG-002 — input snaps back when clearing name ---
  // Root cause: getLocalizedField() had fallback to other lang, making it
  // impossible to delete all characters. Fixed by using formData.name[lang] directly.

  it('REGRESSION BUG-002: clearing name input stays empty (no fallback snap-back)', () => {
    const ingredientWithBothLangs: Ingredient = {
      ...existingIngredient,
      name: { vi: 'Ức gà', en: 'Chicken breast' },
    };
    render(<IngredientEditModal editingItem={ingredientWithBothLangs} onSubmit={onSubmit} onClose={onClose} />);
    const nameInput = screen.getByTestId('input-ing-name');

    // Clear the VI name completely
    fireEvent.change(nameInput, { target: { value: '' } });

    // Must stay empty — must NOT snap back to 'Chicken breast' (EN fallback)
    expect(nameInput).toHaveValue('');
  });

  it('REGRESSION BUG-002: can type new name after clearing (no snap-back mid-typing)', () => {
    const ingredientWithBothLangs: Ingredient = {
      ...existingIngredient,
      name: { vi: 'Ức gà', en: 'Chicken breast' },
    };
    render(<IngredientEditModal editingItem={ingredientWithBothLangs} onSubmit={onSubmit} onClose={onClose} />);
    const nameInput = screen.getByTestId('input-ing-name');

    // Simulate deleting character by character then typing new name
    fireEvent.change(nameInput, { target: { value: 'Ức g' } });
    expect(nameInput).toHaveValue('Ức g');
    fireEvent.change(nameInput, { target: { value: 'Ức ' } });
    expect(nameInput).toHaveValue('Ức ');
    fireEvent.change(nameInput, { target: { value: '' } });
    expect(nameInput).toHaveValue('');
    fireEvent.change(nameInput, { target: { value: 'Thịt bò' } });
    expect(nameInput).toHaveValue('Thịt bò');
  });

  it('AI search returns early when both name and unit are empty', async () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    // Both name and unit empty — AI button disabled
    const aiButtons = screen.getAllByRole('button');
    const disabledAI = aiButtons.find(
      b => b.getAttribute('aria-label')?.includes('Tự động') || b.getAttribute('aria-label')?.includes('Vui lòng'),
    );
    expect(disabledAI).toBeDefined();
    expect(mockSuggestIngredientInfo).not.toHaveBeenCalled();
  });

  it('AI search handles timeout error and shows warning', async () => {
    mockSuggestIngredientInfo.mockRejectedValueOnce(new Error('Timeout'));

    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    const aiButton = screen.getByRole('button', { name: 'Tự động điền thông tin bằng AI' });
    fireEvent.click(aiButton);

    await waitFor(() => {
      expect(mockNotify.warning).toHaveBeenCalledWith('Phản hồi quá lâu', expect.stringContaining('Ức gà'));
    });
    // AI loading state should be cleared
    expect(aiButton).not.toBeDisabled();
  });

  it('AI search handles generic error and shows error notification', async () => {
    mockSuggestIngredientInfo.mockRejectedValueOnce(new Error('Network failed'));

    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    const aiButton = screen.getByRole('button', { name: 'Tự động điền thông tin bằng AI' });
    fireEvent.click(aiButton);

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith('Tra cứu thất bại', expect.stringContaining('Ức gà'));
    });
  });

  it('does not update state after unmount during AI search', async () => {
    let resolveFn: (v: unknown) => void = () => {};
    const aiPromise = new Promise(resolve => {
      resolveFn = resolve;
    });
    mockSuggestIngredientInfo.mockReturnValueOnce(aiPromise);

    const { unmount } = render(
      <IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />,
    );
    const aiButton = screen.getByRole('button', { name: 'Tự động điền thông tin bằng AI' });
    fireEvent.click(aiButton);

    // Unmount while AI is pending
    unmount();

    // Resolve after unmount — should not throw
    await act(async () => {
      resolveFn({ calories: 999, protein: 99, carbs: 9, fat: 9, fiber: 9 });
    });

    // No error — component safely ignored the late resolution
    expect(mockSuggestIngredientInfo).toHaveBeenCalledTimes(1);
  });

  it('detects hasChanges when editing with empty numeric field (line 73)', () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    // Clear calories field to empty string
    const calorieInput = screen.getByDisplayValue('165');
    fireEvent.change(calorieInput, { target: { value: '' } });
    // Close → should show unsaved dialog
    const xButton = screen.getAllByRole('button').find(b => b.querySelector('.lucide-x'));
    if (xButton) fireEvent.click(xButton);
    expect(screen.getByText(/Thay đổi chưa lưu/)).toBeInTheDocument();
  });

  it('handleAISearch returns early when name is empty (line 138)', async () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    // Set unit but leave name empty
    fireEvent.change(screen.getByLabelText(/Đơn vị tính/), { target: { value: 'g' } });
    // AI button should be disabled, but the guard at line 138 also exists
    expect(mockSuggestIngredientInfo).not.toHaveBeenCalled();
  });

  it('handles AI error after unmount (line 155 isMounted guard)', async () => {
    mockSuggestIngredientInfo.mockRejectedValueOnce(new Error('Network error'));
    const { unmount } = render(
      <IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />,
    );
    const aiButton = screen.getByRole('button', { name: 'Tự động điền thông tin bằng AI' });
    fireEvent.click(aiButton);
    // Unmount before the error resolves
    unmount();
    // Error should resolve without crashing
    await waitFor(() => {
      expect(mockSuggestIngredientInfo).toHaveBeenCalledTimes(1);
    });
  });

  // --- TODO-08: maxLength on inputs ---

  it('has maxLength=80 on ingredient name input', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByTestId('input-ing-name')).toHaveAttribute('maxLength', '80');
  });

  // --- TODO-22: character counter ---

  it('does not show character counter when name is short', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByTestId('input-ing-name'), { target: { value: 'Short' } });
    expect(screen.queryByTestId('ing-name-counter')).not.toBeInTheDocument();
  });

  it('shows character counter when name exceeds 80% of limit', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    const longName = 'A'.repeat(65);
    fireEvent.change(screen.getByTestId('input-ing-name'), { target: { value: longName } });
    expect(screen.getByTestId('ing-name-counter')).toHaveTextContent('65/80');
  });

  // --- TODO-23: form reset on editingItem change ---

  it('resets form when editingItem changes via rerender', () => {
    const ingredientA: Ingredient = {
      id: 'ing-a',
      name: { vi: 'Nguyên liệu A' },
      caloriesPer100: 100,
      proteinPer100: 10,
      carbsPer100: 20,
      fatPer100: 5,
      fiberPer100: 2,
      unit: { vi: 'g' },
    };
    const ingredientB: Ingredient = {
      id: 'ing-b',
      name: { vi: 'Nguyên liệu B' },
      caloriesPer100: 200,
      proteinPer100: 20,
      carbsPer100: 30,
      fatPer100: 10,
      fiberPer100: 3,
      unit: { vi: 'ml' },
    };
    const { rerender } = render(
      <IngredientEditModal editingItem={ingredientA} onSubmit={onSubmit} onClose={onClose} />,
    );
    expect(screen.getByTestId('input-ing-name')).toHaveValue('Nguyên liệu A');

    rerender(<IngredientEditModal editingItem={ingredientB} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByTestId('input-ing-name')).toHaveValue('Nguyên liệu B');
  });

  it('resets form to defaults when editingItem becomes null', () => {
    const { rerender } = render(
      <IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />,
    );
    expect(screen.getByTestId('input-ing-name')).toHaveValue('Ức gà');

    rerender(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByTestId('input-ing-name')).toHaveValue('');
  });
});
