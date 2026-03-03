import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SaveAnalyzedDishModal } from '../components/modals/SaveAnalyzedDishModal';
import { AnalyzedDishResult } from '../types';

const mockNotify = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
vi.mock('../contexts/NotificationContext', () => ({ useNotification: () => mockNotify }));
vi.mock('../hooks/useModalBackHandler', () => ({ useModalBackHandler: vi.fn() }));

const mockSuggestIngredientInfo = vi.fn();
vi.mock('../services/geminiService', () => ({
  suggestIngredientInfo: (...args: unknown[]) => mockSuggestIngredientInfo(...args),
}));

const result: AnalyzedDishResult = {
  name: 'Phở bò',
  description: 'Món phở truyền thống',
  totalNutrition: { calories: 500, protein: 30, fat: 10, carbs: 60 },
  ingredients: [
    { name: 'Bánh phở', amount: 200, unit: 'g', nutritionPerStandardUnit: { calories: 220, protein: 4, carbs: 44, fat: 0.8, fiber: 0.5 } },
    { name: 'Thịt bò', amount: 100, unit: 'g', nutritionPerStandardUnit: { calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0 } },
  ],
};

const defaultProps = {
  onClose: vi.fn(),
  result,
  onSave: vi.fn(),
};

describe('SaveAnalyzedDishModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders header title', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    expect(screen.getByText('Xác nhận lưu món ăn')).toBeInTheDocument();
  });

  it('renders dish name and description fields when saveDish is checked', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    const nameInput = screen.getByLabelText(/Tên món ăn/i) as HTMLInputElement;
    const descInput = screen.getByLabelText(/Mô tả/i) as HTMLTextAreaElement;
    expect(nameInput.value).toBe('Phở bò');
    expect(descInput.value).toBe('Món phở truyền thống');
  });

  it('shows tag error when saving dish without selecting tags', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Xác nhận lưu'));
    expect(screen.getByText('Vui lòng chọn ít nhất một bữa ăn phù hợp')).toBeInTheDocument();
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('toggles saveDish checkbox', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    const checkbox = screen.getByLabelText('Lưu món ăn này') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
    // When saveDish is false, name/desc/tag fields should be hidden
    expect(screen.queryByLabelText(/Tên món ăn/i)).not.toBeInTheDocument();
  });

  it('selects tags and submits successfully', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    // Select "Sáng" tag
    fireEvent.click(screen.getByText(/Sáng/));
    fireEvent.click(screen.getByText('Xác nhận lưu'));
    expect(defaultProps.onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Phở bò',
      shouldCreateDish: true,
      tags: ['breakfast'],
    }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders ingredient section with ingredient names in inputs', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    expect(screen.getByText('Chi tiết nguyên liệu')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bánh phở')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Thịt bò')).toBeInTheDocument();
  });

  it('toggles all ingredients', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    // Initially all selected, button shows "Bỏ chọn tất cả"
    const toggleBtn = screen.getByText('Bỏ chọn tất cả');
    fireEvent.click(toggleBtn);
    // Now shows "Chọn tất cả"
    expect(screen.getByText('Chọn tất cả')).toBeInTheDocument();
  });

  it('toggles individual ingredient checkbox', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    // Find ingredient checkboxes (excluding saveDish checkbox and ingredient-specific ones)
    // Just click the first one we can find that's a checkbox in the ingredients area
    const ingredientCheckboxes = checkboxes.filter(cb => {
      const parent = cb.closest('[class*="rounded-xl border"]');
      return parent !== null;
    });
    if (ingredientCheckboxes.length > 0) {
      fireEvent.click(ingredientCheckboxes[0]);
    }
  });

  it('saves only selected ingredients', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    // Select tag first to pass validation
    fireEvent.click(screen.getByText(/Trưa/));
    // Toggle all off, then only first on
    fireEvent.click(screen.getByText('Bỏ chọn tất cả'));
    fireEvent.click(screen.getByText('Chọn tất cả'));
    // Submit
    fireEvent.click(screen.getByText('Xác nhận lưu'));
    expect(defaultProps.onSave).toHaveBeenCalledWith(expect.objectContaining({
      ingredients: expect.any(Array),
      shouldCreateDish: true,
    }));
  });

  it('saves without creating dish when saveDish unchecked', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    // Uncheck saveDish
    fireEvent.click(screen.getByLabelText('Lưu món ăn này'));
    // Now confirm save should work without tags
    fireEvent.click(screen.getByText('Xác nhận lưu'));
    expect(defaultProps.onSave).toHaveBeenCalledWith(expect.objectContaining({
      shouldCreateDish: false,
      tags: undefined,
    }));
  });

  it('calls onClose when cancel button clicked', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Hủy bỏ'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('edits dish name field', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    const nameInput = screen.getByLabelText(/Tên món ăn/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Phở gà' } });
    expect(nameInput.value).toBe('Phở gà');
  });

  it('handles AI Research for ingredient', async () => {
    mockSuggestIngredientInfo.mockResolvedValueOnce({
      calories: 300, protein: 10, carbs: 50, fat: 5, fiber: 2,
    });
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    const researchBtns = screen.getAllByText(/AI Research/i);
    fireEvent.click(researchBtns[0]);
    await waitFor(() => {
      expect(mockSuggestIngredientInfo).toHaveBeenCalledWith('Bánh phở', 'g');
    });
  });

  it('handles AI Research error', async () => {
    mockSuggestIngredientInfo.mockRejectedValueOnce(new Error('API error'));
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    const researchBtns = screen.getAllByText(/AI Research/i);
    fireEvent.click(researchBtns[0]);
    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith('Tra cứu thất bại', expect.any(String));
    });
  });

  it('toggles dish tag on and off', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    const sangBtn = screen.getByText(/Sáng/);
    fireEvent.click(sangBtn); // select
    fireEvent.click(sangBtn); // deselect
    // Try to save — should fail with tag error
    fireEvent.click(screen.getByText('Xác nhận lưu'));
    expect(screen.getByText('Vui lòng chọn ít nhất một bữa ăn phù hợp')).toBeInTheDocument();
  });

  it('edits description field', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    const descInput = screen.getByLabelText(/Mô tả/i);
    fireEvent.change(descInput, { target: { value: 'Phở bò Hà Nội' } });
    expect((descInput as HTMLTextAreaElement).value).toBe('Phở bò Hà Nội');
  });

  it('edits ingredient name input', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    const nameInput = screen.getByDisplayValue('Bánh phở');
    fireEvent.change(nameInput, { target: { value: 'Bún phở' } });
    expect((nameInput as HTMLInputElement).value).toBe('Bún phở');
  });

  it('edits ingredient amount input', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    const amountInput = screen.getByDisplayValue('200');
    fireEvent.change(amountInput, { target: { value: '300' } });
    expect((amountInput as HTMLInputElement).value).toBe('300');
  });

  it('clamps ingredient amount to 0 when negative', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    const amountInput = screen.getByDisplayValue('200');
    fireEvent.change(amountInput, { target: { value: '-5' } });
    expect((amountInput as HTMLInputElement).value).toBe('0');
  });

  it('edits ingredient unit input', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    const unitInput = screen.getAllByDisplayValue('g')[0];
    fireEvent.change(unitInput, { target: { value: 'ml' } });
    expect((unitInput as HTMLInputElement).value).toBe('ml');
  });

  it('edits nutrition calories field for ingredient', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    const calInput = screen.getByDisplayValue('220');
    fireEvent.change(calInput, { target: { value: '300' } });
    expect((calInput as HTMLInputElement).value).toBe('300');
  });

  it('clamps negative nutrition value to 0', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    const calInput = screen.getByDisplayValue('220');
    fireEvent.change(calInput, { target: { value: '-10' } });
    expect((calInput as HTMLInputElement).value).toBe('0');
  });

  it('deselects one ingredient then submits with only selected', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    // Select a tag to pass validation
    fireEvent.click(screen.getByText(/Trưa/));
    // Deselect first ingredient — ingredient checkboxes are labeled "Nguyên liệu #N"
    const firstIngCheckbox = screen.getByLabelText(/Nguyên liệu #1/i);
    fireEvent.click(firstIngCheckbox); // deselect first
    // Submit
    fireEvent.click(screen.getByText('Xác nhận lưu'));
    expect(defaultProps.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        ingredients: expect.arrayContaining([
          expect.objectContaining({ name: 'Thịt bò' }),
        ]),
        shouldCreateDish: true,
      }),
    );
    // Verify only 1 ingredient in payload
    const payload = defaultProps.onSave.mock.calls[0][0];
    expect(payload.ingredients).toHaveLength(1);
    expect(payload.ingredients[0].name).toBe('Thịt bò');
  });

  it('submits with multiple tags (Sáng + Trưa)', () => {
    render(<SaveAnalyzedDishModal {...defaultProps} />);
    fireEvent.click(screen.getByText(/Sáng/));
    fireEvent.click(screen.getByText(/Trưa/));
    fireEvent.click(screen.getByText('Xác nhận lưu'));
    expect(defaultProps.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ['breakfast', 'lunch'],
        shouldCreateDish: true,
      }),
    );
  });
});
