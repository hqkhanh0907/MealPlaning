import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QuickAddIngredientForm } from '../components/modals/QuickAddIngredientForm';
import type { Ingredient } from '../types';

vi.mock('../hooks/useModalBackHandler', () => ({ useModalBackHandler: vi.fn() }));

const mockSuggestIngredientInfo = vi.fn();
vi.mock('../services/geminiService', () => ({
  suggestIngredientInfo: (...args: unknown[]) => mockSuggestIngredientInfo(...args),
}));

describe('QuickAddIngredientForm', () => {
  const onAdd = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderForm = () =>
    render(<QuickAddIngredientForm onAdd={onAdd} onCancel={onCancel} />);

  describe('Renders all form fields', () => {
    it('renders ingredient name input', () => {
      renderForm();
      expect(screen.getByTestId('input-qa-name')).toBeInTheDocument();
    });

    it('renders name label with required indicator', () => {
      renderForm();
      expect(screen.getByText('Tên nguyên liệu')).toBeInTheDocument();
    });

    it('renders unit selector', () => {
      renderForm();
      expect(screen.getByText('Đơn vị')).toBeInTheDocument();
    });

    it('renders nutrition section label', () => {
      renderForm();
      expect(screen.getByText(/Dinh dưỡng/)).toBeInTheDocument();
    });

    it('renders all 5 nutrition fields', () => {
      renderForm();
      expect(screen.getByTestId('qa-cal')).toBeInTheDocument();
      expect(screen.getByTestId('qa-protein')).toBeInTheDocument();
      expect(screen.getByTestId('qa-carbs')).toBeInTheDocument();
      expect(screen.getByTestId('qa-fat')).toBeInTheDocument();
      expect(screen.getByTestId('qa-fiber')).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      renderForm();
      expect(screen.getByTestId('btn-qa-cancel')).toBeInTheDocument();
      expect(screen.getByText('Huỷ')).toBeInTheDocument();
    });

    it('renders submit button', () => {
      renderForm();
      expect(screen.getByTestId('btn-qa-submit')).toBeInTheDocument();
      expect(screen.getByText('Tạo & thêm vào món')).toBeInTheDocument();
    });

    it('renders AI fill button', () => {
      renderForm();
      expect(screen.getByTestId('btn-qa-ai-fill')).toBeInTheDocument();
    });

    it('renders title', () => {
      renderForm();
      expect(screen.getByText('Tạo nguyên liệu mới')).toBeInTheDocument();
    });

    it('renders close dialog button', () => {
      renderForm();
      expect(screen.getByLabelText('Đóng hộp thoại')).toBeInTheDocument();
    });
  });

  describe('Default values are correct', () => {
    it('name field starts empty', () => {
      renderForm();
      expect(screen.getByTestId('input-qa-name')).toHaveValue('');
    });

    it('nutrition fields default to 0', () => {
      renderForm();
      expect(screen.getByTestId('qa-cal')).toHaveValue('0');
      expect(screen.getByTestId('qa-protein')).toHaveValue('0');
      expect(screen.getByTestId('qa-carbs')).toHaveValue('0');
      expect(screen.getByTestId('qa-fat')).toHaveValue('0');
      expect(screen.getByTestId('qa-fiber')).toHaveValue('0');
    });
  });

  describe('Shows validation error for empty name', () => {
    it('shows error when submitting with empty name', async () => {
      renderForm();
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-qa-submit'));
      });
      await waitFor(() => {
        expect(screen.getByText('Vui lòng nhập tên nguyên liệu')).toBeInTheDocument();
      });
      expect(onAdd).not.toHaveBeenCalled();
    });

    it('shows error when name is only whitespace', async () => {
      renderForm();
      fireEvent.change(screen.getByTestId('input-qa-name'), { target: { value: '   ' } });
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-qa-submit'));
      });
      await waitFor(() => {
        expect(screen.getByText('Vui lòng nhập tên nguyên liệu')).toBeInTheDocument();
      });
      expect(onAdd).not.toHaveBeenCalled();
    });

    it('clears name error when user types a valid name', async () => {
      renderForm();
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-qa-submit'));
      });
      await waitFor(() => {
        expect(screen.getByText('Vui lòng nhập tên nguyên liệu')).toBeInTheDocument();
      });
      fireEvent.change(screen.getByTestId('input-qa-name'), { target: { value: 'Ức gà' } });
      await waitFor(() => {
        expect(screen.queryByText('Vui lòng nhập tên nguyên liệu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Shows validation error for negative numbers', () => {
    it('nutrition fields clamp to minimum of 0', () => {
      renderForm();
      const calInput = screen.getByTestId('qa-cal');
      fireEvent.change(calInput, { target: { value: '-5' } });
      fireEvent.blur(calInput);
      expect(calInput).toHaveValue('0');
    });
  });

  describe('Valid submission calls onSave with correct data', () => {
    it('calls onAdd with ingredient data when form is valid', async () => {
      renderForm();
      fireEvent.change(screen.getByTestId('input-qa-name'), { target: { value: 'Ức gà' } });
      fireEvent.change(screen.getByTestId('qa-cal'), { target: { value: '165' } });
      fireEvent.change(screen.getByTestId('qa-protein'), { target: { value: '31' } });
      fireEvent.change(screen.getByTestId('qa-carbs'), { target: { value: '0' } });
      fireEvent.change(screen.getByTestId('qa-fat'), { target: { value: '4' } });
      fireEvent.change(screen.getByTestId('qa-fiber'), { target: { value: '0' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-qa-submit'));
      });

      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledTimes(1);
      });

      const createdIngredient: Ingredient = onAdd.mock.calls[0][0];
      expect(createdIngredient.name.vi).toBe('Ức gà');
      expect(createdIngredient.name.en).toBe('Ức gà');
      expect(createdIngredient.caloriesPer100).toBe(165);
      expect(createdIngredient.proteinPer100).toBe(31);
      expect(createdIngredient.carbsPer100).toBe(0);
      expect(createdIngredient.fatPer100).toBe(4);
      expect(createdIngredient.fiberPer100).toBe(0);
      expect(createdIngredient.unit.vi).toBe('g');
      expect(createdIngredient.id).toMatch(/^ing-/);
    });

    it('trims the name on submission', async () => {
      renderForm();
      fireEvent.change(screen.getByTestId('input-qa-name'), {
        target: { value: '  Ức gà  ' },
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-qa-submit'));
      });
      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledTimes(1);
      });
      const createdIngredient: Ingredient = onAdd.mock.calls[0][0];
      expect(createdIngredient.name.vi).toBe('Ức gà');
    });

    it('defaults nutrition to 0 when fields are left empty', async () => {
      renderForm();
      fireEvent.change(screen.getByTestId('input-qa-name'), { target: { value: 'Muối' } });
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-qa-submit'));
      });
      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledTimes(1);
      });
      const createdIngredient: Ingredient = onAdd.mock.calls[0][0];
      expect(createdIngredient.caloriesPer100).toBe(0);
      expect(createdIngredient.proteinPer100).toBe(0);
      expect(createdIngredient.carbsPer100).toBe(0);
      expect(createdIngredient.fatPer100).toBe(0);
      expect(createdIngredient.fiberPer100).toBe(0);
    });
  });

  describe('Cancel calls onClose', () => {
    it('calls onCancel when cancel button is clicked', () => {
      renderForm();
      fireEvent.click(screen.getByTestId('btn-qa-cancel'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when close (X) button is clicked', () => {
      renderForm();
      fireEvent.click(screen.getByLabelText('Đóng hộp thoại'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when backdrop overlay is clicked', () => {
      renderForm();
      fireEvent.click(screen.getByLabelText('close quick-add'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('successful submission also calls onCancel to close the form', async () => {
      renderForm();
      fireEvent.change(screen.getByTestId('input-qa-name'), { target: { value: 'Ức gà' } });
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-qa-submit'));
      });
      await waitFor(() => {
        expect(onCancel).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Numeric fields accept decimal values', () => {
    it('accepts decimal input in calories field', () => {
      renderForm();
      const calInput = screen.getByTestId('qa-cal');
      fireEvent.change(calInput, { target: { value: '12.5' } });
      expect(calInput).toHaveValue('12.5');
    });

    it('accepts decimal input in protein field', () => {
      renderForm();
      const proteinInput = screen.getByTestId('qa-protein');
      fireEvent.change(proteinInput, { target: { value: '3.7' } });
      expect(proteinInput).toHaveValue('3.7');
    });

    it('accepts decimal input in fat field', () => {
      renderForm();
      const fatInput = screen.getByTestId('qa-fat');
      fireEvent.change(fatInput, { target: { value: '0.5' } });
      expect(fatInput).toHaveValue('0.5');
    });
  });

  describe('AI fill functionality', () => {
    it('AI fill button is disabled when name is empty', () => {
      renderForm();
      const aiFillBtn = screen.getByTestId('btn-qa-ai-fill');
      expect(aiFillBtn).toBeDisabled();
    });

    it('AI fill button is enabled when name has value', () => {
      renderForm();
      fireEvent.change(screen.getByTestId('input-qa-name'), { target: { value: 'Ức gà' } });
      const aiFillBtn = screen.getByTestId('btn-qa-ai-fill');
      expect(aiFillBtn).not.toBeDisabled();
    });

    it('triggers AI fill on name blur with debounce', async () => {
      mockSuggestIngredientInfo.mockResolvedValue({
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
      });

      renderForm();
      const nameInput = screen.getByTestId('input-qa-name');
      fireEvent.change(nameInput, { target: { value: 'Ức gà' } });
      fireEvent.blur(nameInput);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      await waitFor(() => {
        expect(mockSuggestIngredientInfo).toHaveBeenCalledWith(
          'Ức gà',
          'g',
          expect.any(AbortSignal),
        );
      });
    });

    it('fills nutrition fields after successful AI suggestion', async () => {
      mockSuggestIngredientInfo.mockResolvedValue({
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 4,
        fiber: 0,
      });

      renderForm();
      fireEvent.change(screen.getByTestId('input-qa-name'), { target: { value: 'Ức gà' } });
      fireEvent.blur(screen.getByTestId('input-qa-name'));

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      await waitFor(() => {
        expect(screen.getByTestId('qa-cal')).toHaveValue('165');
        expect(screen.getByTestId('qa-protein')).toHaveValue('31');
        expect(screen.getByTestId('qa-carbs')).toHaveValue('0');
        expect(screen.getByTestId('qa-fat')).toHaveValue('4');
        expect(screen.getByTestId('qa-fiber')).toHaveValue('0');
      });
    });

    it('handles AI suggestion failure gracefully', async () => {
      mockSuggestIngredientInfo.mockRejectedValue(new Error('Network error'));

      renderForm();
      fireEvent.change(screen.getByTestId('input-qa-name'), { target: { value: 'Ức gà' } });
      fireEvent.blur(screen.getByTestId('input-qa-name'));

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      await waitFor(() => {
        expect(mockSuggestIngredientInfo).toHaveBeenCalled();
      });

      expect(screen.getByTestId('qa-cal')).toHaveValue('0');
    });

    it('clicking AI fill button triggers suggestion', async () => {
      mockSuggestIngredientInfo.mockResolvedValue({
        calories: 100,
        protein: 20,
        carbs: 5,
        fat: 2,
        fiber: 1,
      });

      renderForm();
      fireEvent.change(screen.getByTestId('input-qa-name'), { target: { value: 'Thịt bò' } });

      fireEvent.click(screen.getByTestId('btn-qa-ai-fill'));

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      await waitFor(() => {
        expect(mockSuggestIngredientInfo).toHaveBeenCalledWith(
          'Thịt bò',
          'g',
          expect.any(AbortSignal),
        );
      });
    });

    it('does not trigger AI fill when name is empty on blur', async () => {
      renderForm();
      fireEvent.blur(screen.getByTestId('input-qa-name'));

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(mockSuggestIngredientInfo).not.toHaveBeenCalled();
    });
  });
});
