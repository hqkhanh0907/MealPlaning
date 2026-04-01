import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SetEditor } from '../features/fitness/components/SetEditor';

afterEach(cleanup);

describe('SetEditor', () => {
  const defaultProps = {
    initialWeight: 60,
    initialReps: 10,
    initialRpe: undefined as number | undefined,
    recentWeights: [50, 55, 60, 65, 70],
    onSave: vi.fn(),
    onCancel: vi.fn(),
    isVisible: true,
  };

  function renderEditor(overrides: Partial<typeof defaultProps> = {}) {
    const props = { ...defaultProps, ...overrides, onSave: overrides.onSave ?? vi.fn(), onCancel: overrides.onCancel ?? vi.fn() };
    const result = render(<SetEditor {...props} />);
    return { ...result, props };
  }

  it('renders the editor when isVisible is true', () => {
    renderEditor();
    expect(screen.getByTestId('set-editor')).toBeInTheDocument();
  });

  it('renders nothing when isVisible is false', () => {
    renderEditor({ isVisible: false });
    expect(screen.queryByTestId('set-editor')).not.toBeInTheDocument();
  });

  it('displays initial weight value', () => {
    renderEditor({ initialWeight: 75 });
    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    expect(input.value).toBe('75');
  });

  it('displays initial reps value', () => {
    renderEditor({ initialReps: 12 });
    const input = screen.getByTestId('reps-input') as HTMLInputElement;
    expect(input.value).toBe('12');
  });

  // Weight ±2.5kg tests
  it('+2.5kg button increments weight', () => {
    renderEditor({ initialWeight: 60 });
    fireEvent.click(screen.getByTestId('weight-plus-button'));
    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    expect(input.value).toBe('62.5');
  });

  it('-2.5kg button decrements weight', () => {
    renderEditor({ initialWeight: 60 });
    fireEvent.click(screen.getByTestId('weight-minus-button'));
    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    expect(input.value).toBe('57.5');
  });

  it('weight does not go below 0', () => {
    renderEditor({ initialWeight: 1 });
    fireEvent.click(screen.getByTestId('weight-minus-button'));
    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    expect(input.value).toBe('0');
  });

  it('direct weight input updates value', () => {
    renderEditor({ initialWeight: 60 });
    const input = screen.getByTestId('weight-input');
    fireEvent.change(input, { target: { value: '80' } });
    expect((input as HTMLInputElement).value).toBe('80');
  });

  it('direct weight input accepts negative values during typing', () => {
    renderEditor({ initialWeight: 60 });
    const input = screen.getByTestId('weight-input');
    fireEvent.change(input, { target: { value: '-5' } });
    fireEvent.blur(input);
    expect((input as HTMLInputElement).value).toBe('-5');
  });

  // Quick weight chips
  it('renders recent weight chips', () => {
    renderEditor({ recentWeights: [50, 55, 60] });
    expect(screen.getByTestId('weight-chip-50')).toBeInTheDocument();
    expect(screen.getByTestId('weight-chip-55')).toBeInTheDocument();
    expect(screen.getByTestId('weight-chip-60')).toBeInTheDocument();
  });

  it('clicking a weight chip sets the weight', () => {
    renderEditor({ initialWeight: 60, recentWeights: [50, 55, 70] });
    fireEvent.click(screen.getByTestId('weight-chip-70'));
    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    expect(input.value).toBe('70');
  });

  it('hides recent weights section when recentWeights is empty', () => {
    renderEditor({ recentWeights: [] });
    expect(screen.queryByTestId('recent-weights-section')).not.toBeInTheDocument();
  });

  // Reps ±1 tests
  it('+1 button increments reps', () => {
    renderEditor({ initialReps: 10 });
    fireEvent.click(screen.getByTestId('reps-plus-button'));
    const input = screen.getByTestId('reps-input') as HTMLInputElement;
    expect(input.value).toBe('11');
  });

  it('-1 button decrements reps', () => {
    renderEditor({ initialReps: 10 });
    fireEvent.click(screen.getByTestId('reps-minus-button'));
    const input = screen.getByTestId('reps-input') as HTMLInputElement;
    expect(input.value).toBe('9');
  });

  it('reps does not go below 1', () => {
    renderEditor({ initialReps: 1 });
    fireEvent.click(screen.getByTestId('reps-minus-button'));
    const input = screen.getByTestId('reps-input') as HTMLInputElement;
    expect(input.value).toBe('1');
  });

  it('direct reps input updates value', () => {
    renderEditor({ initialReps: 10 });
    const input = screen.getByTestId('reps-input');
    fireEvent.change(input, { target: { value: '15' } });
    expect((input as HTMLInputElement).value).toBe('15');
  });

  it('direct reps input accepts zero during typing', () => {
    renderEditor({ initialReps: 10 });
    const input = screen.getByTestId('reps-input');
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.blur(input);
    expect((input as HTMLInputElement).value).toBe('0');
  });

  // RPE selector
  it('renders RPE pill buttons 6 through 10', () => {
    renderEditor();
    for (const rpe of [6, 7, 8, 9, 10]) {
      expect(screen.getByTestId(`rpe-button-${rpe}`)).toBeInTheDocument();
    }
  });

  it('selecting an RPE value highlights it', () => {
    renderEditor();
    const rpeButton = screen.getByTestId('rpe-button-8');
    fireEvent.click(rpeButton);
    expect(rpeButton.className).toContain('bg-primary');
  });

  it('toggling same RPE value deselects it', () => {
    renderEditor({ initialRpe: 8 });
    const rpeButton = screen.getByTestId('rpe-button-8');
    expect(rpeButton.className).toContain('bg-primary');
    fireEvent.click(rpeButton);
    expect(rpeButton.className).not.toContain('bg-primary');
  });

  it('selecting a different RPE value switches selection', () => {
    renderEditor({ initialRpe: 7 });
    const rpe7 = screen.getByTestId('rpe-button-7');
    const rpe9 = screen.getByTestId('rpe-button-9');
    expect(rpe7.className).toContain('bg-primary');
    fireEvent.click(rpe9);
    expect(rpe9.className).toContain('bg-primary');
    expect(rpe7.className).not.toContain('bg-primary');
  });

  it('RPE buttons have aria-pressed attribute', () => {
    renderEditor({ initialRpe: 8 });
    expect(screen.getByTestId('rpe-button-8')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('rpe-button-6')).toHaveAttribute('aria-pressed', 'false');
  });

  // Save behavior
  it('save button calls onSave with correct data', () => {
    const onSave = vi.fn();
    renderEditor({ initialWeight: 60, initialReps: 10, onSave });

    fireEvent.click(screen.getByTestId('weight-plus-button'));
    fireEvent.click(screen.getByTestId('reps-plus-button'));
    fireEvent.click(screen.getByTestId('rpe-button-8'));
    fireEvent.click(screen.getByTestId('save-button'));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      weight: 62.5,
      reps: 11,
      rpe: 8,
    });
  });

  it('save without RPE selection returns rpe as undefined', () => {
    const onSave = vi.fn();
    renderEditor({ initialWeight: 50, initialReps: 8, onSave });
    fireEvent.click(screen.getByTestId('save-button'));
    expect(onSave).toHaveBeenCalledWith({
      weight: 50,
      reps: 8,
      rpe: undefined,
    });
  });

  // Cancel behavior
  it('cancel button calls onCancel', () => {
    const onCancel = vi.fn();
    renderEditor({ onCancel });
    fireEvent.click(screen.getByTestId('cancel-button'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('close (X) button calls onCancel', () => {
    const onCancel = vi.fn();
    renderEditor({ onCancel });
    fireEvent.click(screen.getByTestId('editor-close-button'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  // Labels
  it('renders Vietnamese labels', () => {
    renderEditor();
    expect(screen.getByText('Chỉnh sửa set')).toBeInTheDocument();
    expect(screen.getByText('Lưu')).toBeInTheDocument();
    expect(screen.getByText('Hủy')).toBeInTheDocument();
  });

  it('renders recent weights label', () => {
    renderEditor({ recentWeights: [50] });
    expect(screen.getByText('Cân nặng gần đây')).toBeInTheDocument();
  });

  // Accessibility
  it('editor has proper aria attributes', () => {
    renderEditor();
    const editor = screen.getByTestId('set-editor');
    expect(editor).toHaveAttribute('aria-modal', 'true');
    expect(editor).toHaveAttribute('aria-label', 'Chỉnh sửa set');
  });

  // Touch target size
  it('increment/decrement buttons have minimum 44px touch targets', () => {
    renderEditor();
    const weightMinus = screen.getByTestId('weight-minus-button');
    expect(weightMinus.className).toContain('h-11');
    expect(weightMinus.className).toContain('w-11');
  });

  // Tabular nums
  it('weight input uses tabular-nums for number display', () => {
    renderEditor();
    const input = screen.getByTestId('weight-input');
    expect(input.className).toContain('tabular-nums');
  });

  it('reps input uses tabular-nums for number display', () => {
    renderEditor();
    const input = screen.getByTestId('reps-input');
    expect(input.className).toContain('tabular-nums');
  });

  // Clear input bug-fix tests
  it('clearing weight input shows empty, not zero', () => {
    renderEditor({ initialWeight: 60 });
    const input = screen.getByTestId('weight-input');
    fireEvent.change(input, { target: { value: '' } });
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('clearing reps input shows empty, not one', () => {
    renderEditor({ initialReps: 10 });
    const input = screen.getByTestId('reps-input');
    fireEvent.change(input, { target: { value: '' } });
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('blur after clearing weight keeps empty', () => {
    renderEditor({ initialWeight: 60 });
    const input = screen.getByTestId('weight-input');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('blur after clearing reps keeps empty', () => {
    renderEditor({ initialReps: 10 });
    const input = screen.getByTestId('reps-input');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('save after clear and blur uses last valid weight', () => {
    const onSave = vi.fn();
    renderEditor({ initialWeight: 75, initialReps: 8, onSave });
    const input = screen.getByTestId('weight-input');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    fireEvent.click(screen.getByTestId('save-button'));
    expect(onSave).toHaveBeenCalledWith({ weight: 75, reps: 8, rpe: undefined });
  });
});
