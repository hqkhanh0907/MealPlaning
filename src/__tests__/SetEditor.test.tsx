import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { SetEditor } from '../features/fitness/components/SetEditor';

afterEach(cleanup);

const defaultProps = {
  initialWeight: 60,
  initialReps: 10,
  initialRpe: undefined as number | undefined,
  initialRestSeconds: 90,
  recentWeights: [50, 55, 60, 65, 70],
  onSave: vi.fn(),
  onCancel: vi.fn(),
  isVisible: true,
};

function renderEditor(overrides: Partial<typeof defaultProps> = {}) {
  const props = {
    ...defaultProps,
    ...overrides,
    onSave: overrides.onSave ?? vi.fn(),
    onCancel: overrides.onCancel ?? vi.fn(),
  };
  const result = render(<SetEditor {...props} />);
  return { ...result, props };
}

function clickStepper(testId: string) {
  const btn = screen.getByTestId(testId);
  fireEvent.pointerDown(btn);
  fireEvent.pointerUp(btn);
}

/* ================================================================== */
/* SC_W504_01: Modal Rendering & Structure                             */
/* ================================================================== */
describe('SC_W504_01: Modal Rendering & Structure', () => {
  it('TC_W504_01: renders modal when isVisible=true', () => {
    renderEditor();
    expect(screen.getByTestId('set-editor')).toBeInTheDocument();
  });

  it('TC_W504_02: returns null when isVisible=false', () => {
    renderEditor({ isVisible: false });
    expect(screen.queryByTestId('set-editor')).not.toBeInTheDocument();
  });

  it('TC_W504_03: modal container has animate-slide-up class', () => {
    renderEditor();
    expect(screen.getByTestId('set-editor').className).toContain('animate-slide-up');
  });

  it('TC_W504_04: title displays "Chỉnh sửa set"', () => {
    renderEditor();
    expect(screen.getByText('Chỉnh sửa set')).toBeInTheDocument();
  });

  it('TC_W504_05: close button has aria-label "Đóng"', () => {
    renderEditor();
    expect(screen.getByTestId('editor-close-button')).toHaveAttribute('aria-label', 'Đóng');
  });
});

/* ================================================================== */
/* SC_W504_02: Weight StepperInput                                     */
/* ================================================================== */
describe('SC_W504_02: Weight StepperInput', () => {
  it('TC_W504_06: renders initial weight value', () => {
    renderEditor({ initialWeight: 75 });
    expect((screen.getByTestId('weight-stepper-input') as HTMLInputElement).value).toBe('75');
  });

  it('TC_W504_07: increment adds 0.5kg', () => {
    renderEditor({ initialWeight: 60 });
    clickStepper('weight-stepper-increment');
    expect((screen.getByTestId('weight-stepper-input') as HTMLInputElement).value).toBe('60.5');
  });

  it('TC_W504_08: decrement subtracts 0.5kg', () => {
    renderEditor({ initialWeight: 60 });
    clickStepper('weight-stepper-decrement');
    expect((screen.getByTestId('weight-stepper-input') as HTMLInputElement).value).toBe('59.5');
  });

  it('TC_W504_09: weight=0 disables decrement', () => {
    renderEditor({ initialWeight: 0 });
    expect(screen.getByTestId('weight-stepper-decrement')).toBeDisabled();
  });

  it('TC_W504_10: weight 0.5 → 0 on decrement', () => {
    renderEditor({ initialWeight: 0.5 });
    clickStepper('weight-stepper-decrement');
    expect((screen.getByTestId('weight-stepper-input') as HTMLInputElement).value).toBe('0');
  });

  it('TC_W504_11: unit displays "kg"', () => {
    renderEditor();
    expect(screen.getByTestId('weight-stepper-unit')).toHaveTextContent('kg');
  });

  it('TC_W504_12: warning at >300kg', () => {
    renderEditor({ initialWeight: 301 });
    expect(screen.getByTestId('weight-stepper-warning')).toBeInTheDocument();
  });

  it('TC_W504_13: no warning at 300kg', () => {
    renderEditor({ initialWeight: 300 });
    expect(screen.queryByTestId('weight-stepper-warning')).not.toBeInTheDocument();
  });

  it('TC_W504_14: no warning at 100kg', () => {
    renderEditor({ initialWeight: 100 });
    expect(screen.queryByTestId('weight-stepper-warning')).not.toBeInTheDocument();
  });
});

/* ================================================================== */
/* SC_W504_03: Recent Weight Chips                                     */
/* ================================================================== */
describe('SC_W504_03: Recent Weight Chips', () => {
  it('TC_W504_15: renders chips for each recent weight', () => {
    renderEditor({ recentWeights: [50, 55, 60] });
    expect(screen.getByTestId('weight-chip-50')).toBeInTheDocument();
    expect(screen.getByTestId('weight-chip-55')).toBeInTheDocument();
    expect(screen.getByTestId('weight-chip-60')).toBeInTheDocument();
  });

  it('TC_W504_16: clicking chip updates weight', () => {
    renderEditor({ initialWeight: 60, recentWeights: [70, 80] });
    fireEvent.click(screen.getByTestId('weight-chip-70'));
    expect((screen.getByTestId('weight-stepper-input') as HTMLInputElement).value).toBe('70');
  });

  it('TC_W504_17: active chip has default variant', () => {
    renderEditor({ initialWeight: 60, recentWeights: [50, 60, 70] });
    expect(screen.getByTestId('weight-chip-60').className).toContain('bg-primary');
    expect(screen.getByTestId('weight-chip-50').className).not.toContain('bg-primary');
    expect(screen.getByTestId('weight-chip-70').className).not.toContain('bg-primary');
  });

  it('TC_W504_18: no chips section when recentWeights empty', () => {
    renderEditor({ recentWeights: [] });
    expect(screen.queryByTestId('recent-weights-section')).not.toBeInTheDocument();
  });

  it('TC_W504_19: label "Cân nặng gần đây" visible', () => {
    renderEditor({ recentWeights: [50] });
    expect(screen.getByText('Cân nặng gần đây')).toBeInTheDocument();
  });
});

/* ================================================================== */
/* SC_W504_04: Reps StepperInput                                       */
/* ================================================================== */
describe('SC_W504_04: Reps StepperInput', () => {
  it('TC_W504_20: renders initial reps value', () => {
    renderEditor({ initialReps: 12 });
    expect((screen.getByTestId('reps-stepper-input') as HTMLInputElement).value).toBe('12');
  });

  it('TC_W504_21: increment adds 1', () => {
    renderEditor({ initialReps: 10 });
    clickStepper('reps-stepper-increment');
    expect((screen.getByTestId('reps-stepper-input') as HTMLInputElement).value).toBe('11');
  });

  it('TC_W504_22: decrement subtracts 1', () => {
    renderEditor({ initialReps: 10 });
    clickStepper('reps-stepper-decrement');
    expect((screen.getByTestId('reps-stepper-input') as HTMLInputElement).value).toBe('9');
  });

  it('TC_W504_23: reps=1 disables decrement (min=1)', () => {
    renderEditor({ initialReps: 1 });
    expect(screen.getByTestId('reps-stepper-decrement')).toBeDisabled();
  });

  it('TC_W504_24: unit displays "rep"', () => {
    renderEditor();
    expect(screen.getByTestId('reps-stepper-unit')).toHaveTextContent('rep');
  });
});

/* ================================================================== */
/* SC_W504_05: RPE Selector                                            */
/* ================================================================== */
describe('SC_W504_05: RPE Selector', () => {
  it('TC_W504_25: renders 5 RPE buttons [6,7,8,9,10]', () => {
    renderEditor();
    for (const val of [6, 7, 8, 9, 10]) {
      expect(screen.getByTestId(`rpe-button-${val}`)).toBeInTheDocument();
    }
  });

  it('TC_W504_26: buttons display correct values', () => {
    renderEditor();
    for (const val of [6, 7, 8, 9, 10]) {
      expect(screen.getByTestId(`rpe-button-${val}`)).toHaveTextContent(String(val));
    }
  });

  it('TC_W504_27: selecting RPE sets aria-pressed=true', () => {
    renderEditor();
    fireEvent.click(screen.getByTestId('rpe-button-8'));
    expect(screen.getByTestId('rpe-button-8')).toHaveAttribute('aria-pressed', 'true');
    for (const val of [6, 7, 9, 10]) {
      expect(screen.getByTestId(`rpe-button-${val}`)).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('TC_W504_28: toggling same RPE deselects', () => {
    renderEditor({ initialRpe: 8 });
    expect(screen.getByTestId('rpe-button-8')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByTestId('rpe-button-8'));
    expect(screen.getByTestId('rpe-button-8')).toHaveAttribute('aria-pressed', 'false');
  });

  it('TC_W504_29: switching RPE from 7 → 9', () => {
    renderEditor({ initialRpe: 7 });
    fireEvent.click(screen.getByTestId('rpe-button-9'));
    expect(screen.getByTestId('rpe-button-9')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('rpe-button-7')).toHaveAttribute('aria-pressed', 'false');
  });

  it('TC_W504_30: initial RPE 10 highlighted', () => {
    renderEditor({ initialRpe: 10 });
    expect(screen.getByTestId('rpe-button-10')).toHaveAttribute('aria-pressed', 'true');
  });

  it('TC_W504_31: RPE color progression classes', () => {
    renderEditor();
    expect(screen.getByTestId('rpe-button-6').className).toContain('green');
    expect(screen.getByTestId('rpe-button-7').className).toContain('lime');
    expect(screen.getByTestId('rpe-button-8').className).toContain('yellow');
    expect(screen.getByTestId('rpe-button-9').className).toContain('orange');
    expect(screen.getByTestId('rpe-button-10').className).toContain('red');
  });

  it('TC_W504_32: fieldset has RPE aria-label', () => {
    renderEditor();
    expect(screen.getByTestId('rpe-selector')).toHaveAttribute('aria-label', 'RPE');
  });
});

/* ================================================================== */
/* SC_W504_06: Rest Seconds StepperInput                               */
/* ================================================================== */
describe('SC_W504_06: Rest Seconds StepperInput', () => {
  it('TC_W504_33: renders default 90s', () => {
    renderEditor();
    expect((screen.getByTestId('rest-stepper-input') as HTMLInputElement).value).toBe('90');
  });

  it('TC_W504_34: increment adds 15s', () => {
    renderEditor({ initialRestSeconds: 90 });
    clickStepper('rest-stepper-increment');
    expect((screen.getByTestId('rest-stepper-input') as HTMLInputElement).value).toBe('105');
  });

  it('TC_W504_35: decrement subtracts 15s', () => {
    renderEditor({ initialRestSeconds: 90 });
    clickStepper('rest-stepper-decrement');
    expect((screen.getByTestId('rest-stepper-input') as HTMLInputElement).value).toBe('75');
  });

  it('TC_W504_36: rest=0 disables decrement', () => {
    renderEditor({ initialRestSeconds: 0 });
    expect(screen.getByTestId('rest-stepper-decrement')).toBeDisabled();
  });

  it('TC_W504_37: rest 15 → 0 on decrement', () => {
    renderEditor({ initialRestSeconds: 15 });
    clickStepper('rest-stepper-decrement');
    expect((screen.getByTestId('rest-stepper-input') as HTMLInputElement).value).toBe('0');
  });

  it('TC_W504_38: unit displays "s"', () => {
    renderEditor();
    expect(screen.getByTestId('rest-stepper-unit')).toHaveTextContent('s');
  });

  it('TC_W504_39: custom initial rest value', () => {
    renderEditor({ initialRestSeconds: 120 });
    expect((screen.getByTestId('rest-stepper-input') as HTMLInputElement).value).toBe('120');
  });

  it('TC_W504_39b: defaults to 90 when initialRestSeconds undefined', () => {
    renderEditor({ initialRestSeconds: undefined });
    expect((screen.getByTestId('rest-stepper-input') as HTMLInputElement).value).toBe('90');
  });
});

/* ================================================================== */
/* SC_W504_07: Save Behavior                                           */
/* ================================================================== */
describe('SC_W504_07: Save Behavior', () => {
  it('TC_W504_40: save with defaults', () => {
    const onSave = vi.fn();
    renderEditor({ onSave });
    fireEvent.click(screen.getByTestId('save-button'));
    expect(onSave).toHaveBeenCalledWith({
      weight: 60,
      reps: 10,
      rpe: undefined,
      restSeconds: 90,
    });
  });

  it('TC_W504_41: save after modifying all fields', () => {
    const onSave = vi.fn();
    renderEditor({ onSave });
    clickStepper('weight-stepper-increment');
    clickStepper('reps-stepper-increment');
    fireEvent.click(screen.getByTestId('rpe-button-8'));
    clickStepper('rest-stepper-increment');
    fireEvent.click(screen.getByTestId('save-button'));
    expect(onSave).toHaveBeenCalledWith({
      weight: 60.5,
      reps: 11,
      rpe: 8,
      restSeconds: 105,
    });
  });

  it('TC_W504_42: save enforces min weight=0', () => {
    const onSave = vi.fn();
    renderEditor({ initialWeight: 60, onSave });
    const input = screen.getByTestId('weight-stepper-input');
    fireEvent.change(input, { target: { value: '-5' } });
    fireEvent.blur(input);
    fireEvent.click(screen.getByTestId('save-button'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ weight: 0 }));
  });

  it('TC_W504_43: save enforces min reps=1', () => {
    const onSave = vi.fn();
    renderEditor({ initialReps: 10, onSave });
    const input = screen.getByTestId('reps-stepper-input');
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.blur(input);
    fireEvent.click(screen.getByTestId('save-button'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ reps: 1 }));
  });

  it('TC_W504_44: save without RPE → undefined', () => {
    const onSave = vi.fn();
    renderEditor({ onSave });
    fireEvent.click(screen.getByTestId('save-button'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ rpe: undefined }));
  });

  it('TC_W504_45: save button text "Lưu"', () => {
    renderEditor();
    expect(screen.getByTestId('save-button')).toHaveTextContent('Lưu');
  });

  it('TC_W504_46: save button has min-h-12', () => {
    renderEditor();
    expect(screen.getByTestId('save-button').className).toContain('min-h-12');
  });
});

/* ================================================================== */
/* SC_W504_08: Cancel & Dismiss                                        */
/* ================================================================== */
describe('SC_W504_08: Cancel & Dismiss', () => {
  it('TC_W504_47: cancel button calls onCancel', () => {
    const onCancel = vi.fn();
    renderEditor({ onCancel });
    fireEvent.click(screen.getByTestId('cancel-button'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('TC_W504_48: cancel button text "Hủy"', () => {
    renderEditor();
    expect(screen.getByTestId('cancel-button')).toHaveTextContent('Hủy');
  });

  it('TC_W504_49: cancel button has min-h-12', () => {
    renderEditor();
    expect(screen.getByTestId('cancel-button').className).toContain('min-h-12');
  });

  it('TC_W504_50: close (X) button calls onCancel', () => {
    const onCancel = vi.fn();
    renderEditor({ onCancel });
    fireEvent.click(screen.getByTestId('editor-close-button'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('TC_W504_51: backdrop click calls onCancel', () => {
    const onCancel = vi.fn();
    renderEditor({ onCancel });
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.querySelector('button[tabindex="-1"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('TC_W504_52: Escape key calls onCancel', () => {
    const onCancel = vi.fn();
    renderEditor({ onCancel });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

/* ================================================================== */
/* SC_W504_09: Accessibility                                           */
/* ================================================================== */
describe('SC_W504_09: Accessibility', () => {
  it('TC_W504_53: dialog has aria-modal=true', () => {
    renderEditor();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('TC_W504_54: editor has aria-label', () => {
    renderEditor();
    expect(screen.getByTestId('set-editor')).toHaveAttribute('aria-label', 'Chỉnh sửa set');
  });

  it('TC_W504_55: RPE buttons have correct aria-pressed', () => {
    renderEditor({ initialRpe: 7 });
    expect(screen.getByTestId('rpe-button-7')).toHaveAttribute('aria-pressed', 'true');
    for (const val of [6, 8, 9, 10]) {
      expect(screen.getByTestId(`rpe-button-${val}`)).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('TC_W504_56: RPE fieldset element', () => {
    renderEditor();
    const selector = screen.getByTestId('rpe-selector');
    expect(selector.tagName.toLowerCase()).toBe('fieldset');
  });

  it('TC_W504_57: weight label contains "Cân nặng"', () => {
    renderEditor();
    expect(screen.getAllByText(/Cân nặng/).length).toBeGreaterThanOrEqual(1);
  });
});

/* ================================================================== */
/* SC_W504_10: i18n Labels                                             */
/* ================================================================== */
describe('SC_W504_10: i18n Labels', () => {
  it('TC_W504_58: title "Chỉnh sửa set"', () => {
    renderEditor();
    expect(screen.getByText('Chỉnh sửa set')).toBeInTheDocument();
  });

  it('TC_W504_59: weight label "Cân nặng (kg)"', () => {
    renderEditor();
    expect(screen.getByText('Cân nặng (kg)')).toBeInTheDocument();
  });

  it('TC_W504_60: reps label "Số lần"', () => {
    renderEditor();
    expect(screen.getByText('Số lần')).toBeInTheDocument();
  });

  it('TC_W504_61: RPE label', () => {
    renderEditor();
    expect(screen.getByText('RPE')).toBeInTheDocument();
  });

  it('TC_W504_62: save text "Lưu"', () => {
    renderEditor();
    expect(screen.getByTestId('save-button')).toHaveTextContent('Lưu');
  });

  it('TC_W504_63: cancel text "Hủy"', () => {
    renderEditor();
    expect(screen.getByTestId('cancel-button')).toHaveTextContent('Hủy');
  });
});
