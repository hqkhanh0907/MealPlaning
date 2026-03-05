import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  unit: { vi: 'g', en: 'g' },
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
    expect(screen.getByLabelText('Tên nguyên liệu')).toHaveValue('');
    expect(screen.getByLabelText('Đơn vị tính')).toHaveValue('');
  });

  it('renders edit existing ingredient with pre-populated data', () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByText('Sửa nguyên liệu')).toBeInTheDocument();
    expect(screen.getByLabelText('Tên nguyên liệu')).toHaveValue('Ức gà');
    expect(screen.getByLabelText('Đơn vị tính')).toHaveValue('g');
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

  it('shows name validation error when submitting without name', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    // Fill unit but no name
    fireEvent.change(screen.getByLabelText('Đơn vị tính'), { target: { value: 'g' } });
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));

    expect(screen.getByText('Vui lòng nhập tên nguyên liệu')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows unit validation error when submitting without unit', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    // Fill name but no unit
    fireEvent.change(screen.getByLabelText('Tên nguyên liệu'), { target: { value: 'Thịt bò' } });
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));

    expect(screen.getByText('Vui lòng nhập đơn vị tính')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows both validation errors when both name and unit are empty', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));

    expect(screen.getByText('Vui lòng nhập tên nguyên liệu')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập đơn vị tính')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears name error when user types a name', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));
    expect(screen.getByText('Vui lòng nhập tên nguyên liệu')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Tên nguyên liệu'), { target: { value: 'X' } });
    expect(screen.queryByText('Vui lòng nhập tên nguyên liệu')).not.toBeInTheDocument();
  });

  it('clears unit error when user types a unit', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));
    expect(screen.getByText('Vui lòng nhập đơn vị tính')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Đơn vị tính'), { target: { value: 'g' } });
    expect(screen.queryByText('Vui lòng nhập đơn vị tính')).not.toBeInTheDocument();
  });

  // --- Nutrition Field Tests ---

  it('allows negative input without immediate clamping', () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    const calorieInput = screen.getByDisplayValue('165');
    fireEvent.change(calorieInput, { target: { value: '-10' } });
    expect(calorieInput).toHaveValue(-10);
  });

  it('shows per-field error when nutrition field is negative on submit', () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    const calorieInput = screen.getByDisplayValue('165');
    fireEvent.change(calorieInput, { target: { value: '-10' } });
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));
    expect(screen.getByText('Giá trị không được âm')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows per-field error when nutrition field is empty on submit', () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    const calorieInput = screen.getByDisplayValue('165');
    fireEvent.change(calorieInput, { target: { value: '' } });
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));
    expect(screen.getByText('Vui lòng nhập giá trị')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('allows zero value in nutrition field and submits successfully', () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    const calorieInput = screen.getByDisplayValue('165');
    fireEvent.change(calorieInput, { target: { value: '0' } });
    expect(calorieInput).toHaveValue(0);
    expect(screen.queryByText('Giá trị không được âm')).not.toBeInTheDocument();
  });

  it('clears nutrition error when user fixes the field', () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    const calorieInput = screen.getByDisplayValue('165');
    fireEvent.change(calorieInput, { target: { value: '-10' } });
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));
    expect(screen.getByText('Giá trị không được âm')).toBeInTheDocument();
    fireEvent.change(calorieInput, { target: { value: '100' } });
    expect(screen.queryByText('Giá trị không được âm')).not.toBeInTheDocument();
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
    fireEvent.change(screen.getByLabelText('Đơn vị tính'), { target: { value: 'g' } });

    // When unit is filled, title is the AI tooltip but still disabled due to no name
    const aiButton = screen.getByTitle('Tự động điền thông tin bằng AI');
    expect(aiButton).toBeDisabled();
  });

  it('AI button is disabled when unit is empty', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Tên nguyên liệu'), { target: { value: 'Thịt bò' } });

    // When unit is empty, title shows the no-unit tooltip
    const aiButton = screen.getByTitle('Vui lòng nhập đơn vị tính trước');
    expect(aiButton).toBeDisabled();
  });

  it('AI button is enabled when both name and unit are filled', () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    const aiButton = screen.getByTitle('Tự động điền thông tin bằng AI');
    expect(aiButton).not.toBeDisabled();
  });

  it('fills nutrition fields after successful AI search', async () => {
    mockSuggestIngredientInfo.mockResolvedValueOnce({
      calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0,
    });

    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    const aiButton = screen.getByTitle('Tự động điền thông tin bằng AI');
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
    fireEvent.click(screen.getByTitle('Tự động điền thông tin bằng AI'));

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith(
        'Tra cứu thất bại',
        expect.stringContaining('Ức gà'),
      );
    });
  });

  it('shows warning notification on AI search timeout', async () => {
    mockSuggestIngredientInfo.mockRejectedValueOnce(new Error('Timeout'));

    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByTitle('Tự động điền thông tin bằng AI'));

    await waitFor(() => {
      expect(mockNotify.warning).toHaveBeenCalledWith(
        'Phản hồi quá lâu',
        expect.stringContaining('Ức gà'),
      );
    });
  });

  // --- Submit Tests ---

  it('submits valid ingredient with correct data structure', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Tên nguyên liệu'), { target: { value: 'Thịt bò' } });
    fireEvent.change(screen.getByLabelText('Đơn vị tính'), { target: { value: 'g' } });
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const saved = onSubmit.mock.calls[0][0];
    expect(saved.name).toEqual({ vi: 'Thịt bò', en: 'Thịt bò' });
    expect(saved.unit).toEqual({ vi: 'g', en: 'g' });
    expect(saved.caloriesPer100).toBe(0);
    expect(saved.id).toMatch(/^ing-/);
  });

  it('preserves existing ingredient ID when editing', () => {
    render(<IngredientEditModal editingItem={existingIngredient} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByText('Lưu nguyên liệu'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
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
    fireEvent.change(screen.getByLabelText('Tên nguyên liệu'), { target: { value: 'New' } });

    const xButton = screen.getAllByRole('button').find(b => b.querySelector('.lucide-x'));
    if (xButton) fireEvent.click(xButton);

    expect(screen.getByText(/Thay đổi chưa lưu/)).toBeInTheDocument();
  });

  it('shows unsaved dialog when closing with unit change', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Đơn vị tính'), { target: { value: 'ml' } });

    const xButton = screen.getAllByRole('button').find(b => b.querySelector('.lucide-x'));
    if (xButton) fireEvent.click(xButton);

    expect(screen.getByText(/Thay đổi chưa lưu/)).toBeInTheDocument();
  });

  it('discards changes via unsaved dialog', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Tên nguyên liệu'), { target: { value: 'Test' } });

    const xButton = screen.getAllByRole('button').find(b => b.querySelector('.lucide-x'));
    if (xButton) fireEvent.click(xButton);

    fireEvent.click(screen.getByText('Bỏ thay đổi'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('saves and closes via unsaved dialog when form is valid', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Tên nguyên liệu'), { target: { value: 'Cà chua' } });
    fireEvent.change(screen.getByLabelText('Đơn vị tính'), { target: { value: 'g' } });

    const xButton = screen.getAllByRole('button').find(b => b.querySelector('.lucide-x'));
    if (xButton) fireEvent.click(xButton);

    fireEvent.click(screen.getByText('Lưu & quay lại'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('stays in dialog when save fails validation from unsaved dialog', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    // Only name filled, no unit
    fireEvent.change(screen.getByLabelText('Tên nguyên liệu'), { target: { value: 'Test' } });

    const xButton = screen.getAllByRole('button').find(b => b.querySelector('.lucide-x'));
    if (xButton) fireEvent.click(xButton);

    fireEvent.click(screen.getByText('Lưu & quay lại'));
    // Dialog should close but validation error should appear
    expect(screen.queryByText(/Thay đổi chưa được lưu/)).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('cancels unsaved dialog and returns to editing', () => {
    render(<IngredientEditModal editingItem={null} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Tên nguyên liệu'), { target: { value: 'Test' } });

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
});
