import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GoalSettingsModal } from '../components/modals/GoalSettingsModal';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi' },
  }),
}));

vi.mock('../components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div data-testid="backdrop" onClick={onClose}>{children}</div>
  ),
}));

vi.mock('../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

const defaultProfile = {
  weight: 70,
  proteinRatio: 1.6,
  targetCalories: 2000,
};

function renderModal(overrides: Partial<{
  userProfile: { weight: number; proteinRatio: number; targetCalories: number };
  onUpdateProfile: ReturnType<typeof vi.fn>;
  onClose: ReturnType<typeof vi.fn>;
}> = {}) {
  const props = {
    userProfile: overrides.userProfile ?? { ...defaultProfile },
    onUpdateProfile: overrides.onUpdateProfile ?? vi.fn(),
    onClose: overrides.onClose ?? vi.fn(),
  };
  const result = render(<GoalSettingsModal {...props} />);
  return { ...result, props };
}

describe('GoalSettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders modal title and all form fields', () => {
      renderModal();
      expect(screen.getByText('goalSettings.title')).toBeInTheDocument();
      expect(screen.getByTestId('input-goal-weight')).toBeInTheDocument();
      expect(screen.getByTestId('input-goal-protein')).toBeInTheDocument();
      expect(screen.getByTestId('input-goal-calories')).toBeInTheDocument();
      expect(screen.getByTestId('btn-goal-done')).toBeInTheDocument();
    });

    it('renders close button with aria-label', () => {
      renderModal();
      expect(screen.getByLabelText('common.closeDialog')).toBeInTheDocument();
    });

    it('renders all four goal presets', () => {
      renderModal();
      expect(screen.getByTestId('btn-goal-preset-2000')).toBeInTheDocument();
      expect(screen.getByTestId('btn-goal-preset-2200')).toBeInTheDocument();
      expect(screen.getByTestId('btn-goal-preset-1600')).toBeInTheDocument();
      expect(screen.getByTestId('btn-goal-preset-1400')).toBeInTheDocument();
    });

    it('renders all four protein ratio preset buttons', () => {
      renderModal();
      expect(screen.getByTestId('btn-preset-1')).toBeInTheDocument();
      expect(screen.getByTestId('btn-preset-2')).toBeInTheDocument();
      expect(screen.getByTestId('btn-preset-3')).toBeInTheDocument();
      expect(screen.getByTestId('btn-preset-4')).toBeInTheDocument();
    });

    it('renders preset labels and descriptions', () => {
      renderModal();
      expect(screen.getByText('goalSettings.presetBalanced')).toBeInTheDocument();
      expect(screen.getByText('goalSettings.presetHighProtein')).toBeInTheDocument();
      expect(screen.getByText('goalSettings.presetLowCarb')).toBeInTheDocument();
      expect(screen.getByText('goalSettings.presetLightDiet')).toBeInTheDocument();
    });

    it('renders auto-save hint', () => {
      renderModal();
      expect(screen.getByText('goalSettings.autoSaveHint')).toBeInTheDocument();
    });

    it('renders recommendation text', () => {
      renderModal();
      expect(screen.getByText('goalSettings.recommendation')).toBeInTheDocument();
    });

    it('renders presets section header', () => {
      renderModal();
      expect(screen.getByText('goalSettings.presets')).toBeInTheDocument();
    });

    it('renders unit labels (kg, g/kg, kcal)', () => {
      renderModal();
      expect(screen.getByText('kg')).toBeInTheDocument();
      expect(screen.getByText('goalSettings.perKg')).toBeInTheDocument();
      expect(screen.getByText('kcal')).toBeInTheDocument();
    });

    it('renders field labels for weight, protein and calories', () => {
      renderModal();
      expect(screen.getByText('goalSettings.weight')).toBeInTheDocument();
      expect(screen.getByText('goalSettings.proteinGoal')).toBeInTheDocument();
      expect(screen.getByText('goalSettings.caloriesGoal')).toBeInTheDocument();
    });
  });

  describe('Pre-filled values', () => {
    it('displays the user weight from profile', () => {
      renderModal({ userProfile: { weight: 85, proteinRatio: 2, targetCalories: 2500 } });
      expect(screen.getByTestId('input-goal-weight')).toHaveValue(85);
    });

    it('displays the protein ratio from profile', () => {
      renderModal({ userProfile: { weight: 70, proteinRatio: 2.5, targetCalories: 2000 } });
      expect(screen.getByTestId('input-goal-protein')).toHaveValue(2.5);
    });

    it('displays the target calories from profile', () => {
      renderModal({ userProfile: { weight: 70, proteinRatio: 1.6, targetCalories: 1800 } });
      expect(screen.getByTestId('input-goal-calories')).toHaveValue(1800);
    });

    it('computes and displays protein per day badge', () => {
      renderModal({ userProfile: { weight: 80, proteinRatio: 2, targetCalories: 2000 } });
      // 80 * 2 = 160
      expect(screen.getByText('160goalSettings.perDay')).toBeInTheDocument();
    });
  });

  describe('Weight input', () => {
    it('updates profile when valid weight entered', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-weight'), { target: { value: '80' } });
      expect(props.onUpdateProfile).toHaveBeenCalledWith({ ...defaultProfile, weight: 80 });
    });

    it('does not update profile for weight < 1', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-weight'), { target: { value: '0' } });
      expect(props.onUpdateProfile).not.toHaveBeenCalled();
    });

    it('does not update profile for non-numeric weight', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-weight'), { target: { value: 'abc' } });
      expect(props.onUpdateProfile).not.toHaveBeenCalled();
    });

    it('rounds weight to nearest integer', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-weight'), { target: { value: '75.7' } });
      expect(props.onUpdateProfile).toHaveBeenCalledWith({ ...defaultProfile, weight: 76 });
    });

    it('restores previous weight on blur when input is empty', () => {
      renderModal();
      const input = screen.getByTestId('input-goal-weight');
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);
      expect(input).toHaveValue(70);
    });

    it('restores previous weight on blur when input is NaN', () => {
      renderModal();
      const input = screen.getByTestId('input-goal-weight');
      fireEvent.change(input, { target: { value: 'abc' } });
      fireEvent.blur(input);
      expect(input).toHaveValue(70);
    });

    it('restores previous weight on blur with whitespace-only input', () => {
      renderModal();
      const input = screen.getByTestId('input-goal-weight');
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.blur(input);
      expect(input).toHaveValue(70);
    });
  });

  describe('Protein ratio input', () => {
    it('updates profile when valid protein ratio entered', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-protein'), { target: { value: '2.5' } });
      expect(props.onUpdateProfile).toHaveBeenCalledWith({ ...defaultProfile, proteinRatio: 2.5 });
    });

    it('clamps protein ratio minimum to 1', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-protein'), { target: { value: '0.5' } });
      expect(props.onUpdateProfile).toHaveBeenCalledWith({ ...defaultProfile, proteinRatio: 1 });
    });

    it('does not update profile for protein value < 0.1', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-protein'), { target: { value: '0.05' } });
      expect(props.onUpdateProfile).not.toHaveBeenCalled();
    });

    it('does not update profile for non-numeric protein', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-protein'), { target: { value: 'xyz' } });
      expect(props.onUpdateProfile).not.toHaveBeenCalled();
    });

    it('rounds protein ratio to 1 decimal place', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-protein'), { target: { value: '2.56' } });
      expect(props.onUpdateProfile).toHaveBeenCalledWith({ ...defaultProfile, proteinRatio: 2.6 });
    });

    it('restores previous protein ratio on blur when input is empty', () => {
      renderModal();
      const input = screen.getByTestId('input-goal-protein');
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);
      expect(input).toHaveValue(1.6);
    });

    it('restores previous protein ratio on blur when input is NaN', () => {
      renderModal();
      const input = screen.getByTestId('input-goal-protein');
      fireEvent.change(input, { target: { value: 'abc' } });
      fireEvent.blur(input);
      expect(input).toHaveValue(1.6);
    });
  });

  describe('Calories input', () => {
    it('updates profile when valid calories entered', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-calories'), { target: { value: '2500' } });
      expect(props.onUpdateProfile).toHaveBeenCalledWith({ ...defaultProfile, targetCalories: 2500 });
    });

    it('does not update profile for calories < 100', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-calories'), { target: { value: '50' } });
      expect(props.onUpdateProfile).not.toHaveBeenCalled();
    });

    it('does not update profile for non-numeric calories', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-calories'), { target: { value: 'abc' } });
      expect(props.onUpdateProfile).not.toHaveBeenCalled();
    });

    it('rounds calories to nearest integer', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-calories'), { target: { value: '1850.6' } });
      expect(props.onUpdateProfile).toHaveBeenCalledWith({ ...defaultProfile, targetCalories: 1851 });
    });

    it('restores previous calories on blur when input is empty', () => {
      renderModal();
      const input = screen.getByTestId('input-goal-calories');
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);
      expect(input).toHaveValue(2000);
    });

    it('restores previous calories on blur when input is NaN', () => {
      renderModal();
      const input = screen.getByTestId('input-goal-calories');
      fireEvent.change(input, { target: { value: 'abc' } });
      fireEvent.blur(input);
      expect(input).toHaveValue(2000);
    });
  });

  describe('Goal presets', () => {
    it('applies Balanced preset (2000 kcal, 1.6g/kg)', () => {
      const { props } = renderModal({ userProfile: { weight: 70, proteinRatio: 2.5, targetCalories: 2500 } });
      fireEvent.click(screen.getByTestId('btn-goal-preset-2000'));
      expect(props.onUpdateProfile).toHaveBeenCalledWith({
        weight: 70,
        targetCalories: 2000,
        proteinRatio: 1.6,
      });
    });

    it('applies HighProtein preset (2200 kcal, 2.5g/kg)', () => {
      const { props } = renderModal();
      fireEvent.click(screen.getByTestId('btn-goal-preset-2200'));
      expect(props.onUpdateProfile).toHaveBeenCalledWith({
        ...defaultProfile,
        targetCalories: 2200,
        proteinRatio: 2.5,
      });
    });

    it('applies LowCarb preset (1600 kcal, 2g/kg)', () => {
      const { props } = renderModal();
      fireEvent.click(screen.getByTestId('btn-goal-preset-1600'));
      expect(props.onUpdateProfile).toHaveBeenCalledWith({
        ...defaultProfile,
        targetCalories: 1600,
        proteinRatio: 2,
      });
    });

    it('applies LightDiet preset (1400 kcal, 1.2g/kg)', () => {
      const { props } = renderModal();
      fireEvent.click(screen.getByTestId('btn-goal-preset-1400'));
      expect(props.onUpdateProfile).toHaveBeenCalledWith({
        ...defaultProfile,
        targetCalories: 1400,
        proteinRatio: 1.2,
      });
    });

    it('updates calories and protein input values after preset click', () => {
      renderModal();
      fireEvent.click(screen.getByTestId('btn-goal-preset-2200'));
      expect(screen.getByTestId('input-goal-calories')).toHaveValue(2200);
      expect(screen.getByTestId('input-goal-protein')).toHaveValue(2.5);
    });

    it('highlights active preset when profile matches', () => {
      const { container } = render(
        <GoalSettingsModal
          userProfile={{ weight: 70, proteinRatio: 1.6, targetCalories: 2000 }}
          onUpdateProfile={vi.fn()}
          onClose={vi.fn()}
        />
      );
      const balancedBtn = screen.getByTestId('btn-goal-preset-2000');
      expect(balancedBtn.className).toContain('border-emerald-500');
    });

    it('does not highlight non-matching presets', () => {
      renderModal({ userProfile: { weight: 70, proteinRatio: 1.6, targetCalories: 2000 } });
      const highProteinBtn = screen.getByTestId('btn-goal-preset-2200');
      expect(highProteinBtn.className).not.toContain('border-emerald-500');
    });
  });

  describe('Protein ratio presets', () => {
    it('applies protein preset 1', () => {
      const { props } = renderModal();
      fireEvent.click(screen.getByTestId('btn-preset-1'));
      expect(props.onUpdateProfile).toHaveBeenCalledWith({ ...defaultProfile, proteinRatio: 1 });
    });

    it('applies protein preset 2', () => {
      const { props } = renderModal();
      fireEvent.click(screen.getByTestId('btn-preset-2'));
      expect(props.onUpdateProfile).toHaveBeenCalledWith({ ...defaultProfile, proteinRatio: 2 });
    });

    it('applies protein preset 3', () => {
      const { props } = renderModal();
      fireEvent.click(screen.getByTestId('btn-preset-3'));
      expect(props.onUpdateProfile).toHaveBeenCalledWith({ ...defaultProfile, proteinRatio: 3 });
    });

    it('applies protein preset 4', () => {
      const { props } = renderModal();
      fireEvent.click(screen.getByTestId('btn-preset-4'));
      expect(props.onUpdateProfile).toHaveBeenCalledWith({ ...defaultProfile, proteinRatio: 4 });
    });

    it('updates protein input value after protein preset click', () => {
      renderModal();
      fireEvent.click(screen.getByTestId('btn-preset-3'));
      expect(screen.getByTestId('input-goal-protein')).toHaveValue(3);
    });

    it('highlights active protein preset button', () => {
      renderModal({ userProfile: { weight: 70, proteinRatio: 2, targetCalories: 2000 } });
      const btn2 = screen.getByTestId('btn-preset-2');
      expect(btn2.className).toContain('bg-blue-500');
    });

    it('does not highlight inactive protein preset button', () => {
      renderModal({ userProfile: { weight: 70, proteinRatio: 2, targetCalories: 2000 } });
      const btn1 = screen.getByTestId('btn-preset-1');
      expect(btn1.className).not.toContain('bg-blue-500');
    });

    it('displays protein preset labels with g suffix', () => {
      renderModal();
      expect(screen.getByTestId('btn-preset-1')).toHaveTextContent('1g');
      expect(screen.getByTestId('btn-preset-2')).toHaveTextContent('2g');
      expect(screen.getByTestId('btn-preset-3')).toHaveTextContent('3g');
      expect(screen.getByTestId('btn-preset-4')).toHaveTextContent('4g');
    });
  });

  describe('Close / Done actions', () => {
    it('calls onClose when Done button clicked', () => {
      const { props } = renderModal();
      fireEvent.click(screen.getByTestId('btn-goal-done'));
      expect(props.onClose).toHaveBeenCalled();
    });

    it('calls onClose when X button clicked', () => {
      const { props } = renderModal();
      fireEvent.click(screen.getByLabelText('common.closeDialog'));
      expect(props.onClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop clicked', () => {
      const { props } = renderModal();
      fireEvent.click(screen.getByTestId('backdrop'));
      expect(props.onClose).toHaveBeenCalled();
    });

    it('does not call onUpdateProfile when Done is clicked', () => {
      const { props } = renderModal();
      fireEvent.click(screen.getByTestId('btn-goal-done'));
      expect(props.onUpdateProfile).not.toHaveBeenCalled();
    });
  });

  describe('Computed protein badge', () => {
    it('shows correct protein per day (weight * proteinRatio)', () => {
      renderModal({ userProfile: { weight: 70, proteinRatio: 1.6, targetCalories: 2000 } });
      // Math.round(70 * 1.6) = 112
      expect(screen.getByText('112goalSettings.perDay')).toBeInTheDocument();
    });

    it('updates computed value when profile has different data', () => {
      renderModal({ userProfile: { weight: 100, proteinRatio: 3, targetCalories: 3000 } });
      // Math.round(100 * 3) = 300
      expect(screen.getByText('300goalSettings.perDay')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles weight of 1 (minimum)', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-weight'), { target: { value: '1' } });
      expect(props.onUpdateProfile).toHaveBeenCalledWith({ ...defaultProfile, weight: 1 });
    });

    it('handles weight of 500 (max attribute)', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-weight'), { target: { value: '500' } });
      expect(props.onUpdateProfile).toHaveBeenCalledWith({ ...defaultProfile, weight: 500 });
    });

    it('handles calories of 100 (minimum)', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-calories'), { target: { value: '100' } });
      expect(props.onUpdateProfile).toHaveBeenCalledWith({ ...defaultProfile, targetCalories: 100 });
    });

    it('handles calories of 10000 (max attribute)', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-calories'), { target: { value: '10000' } });
      expect(props.onUpdateProfile).toHaveBeenCalledWith({ ...defaultProfile, targetCalories: 10000 });
    });

    it('handles protein ratio at exactly 0.1 boundary (triggers update but clamps to 1)', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-protein'), { target: { value: '0.1' } });
      expect(props.onUpdateProfile).toHaveBeenCalledWith({ ...defaultProfile, proteinRatio: 1 });
    });

    it('handles very large weight gracefully', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-weight'), { target: { value: '999' } });
      expect(props.onUpdateProfile).toHaveBeenCalledWith({ ...defaultProfile, weight: 999 });
    });

    it('handles very large calorie value', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-calories'), { target: { value: '99999' } });
      expect(props.onUpdateProfile).toHaveBeenCalledWith({ ...defaultProfile, targetCalories: 99999 });
    });

    it('preserves weight when goal preset is applied', () => {
      const { props } = renderModal({ userProfile: { weight: 90, proteinRatio: 1.6, targetCalories: 2000 } });
      fireEvent.click(screen.getByTestId('btn-goal-preset-1400'));
      expect(props.onUpdateProfile).toHaveBeenCalledWith({
        weight: 90,
        targetCalories: 1400,
        proteinRatio: 1.2,
      });
    });

    it('preserves weight and calories when protein preset is applied', () => {
      const profile = { weight: 90, proteinRatio: 1.6, targetCalories: 2500 };
      const { props } = renderModal({ userProfile: profile });
      fireEvent.click(screen.getByTestId('btn-preset-4'));
      expect(props.onUpdateProfile).toHaveBeenCalledWith({
        weight: 90,
        targetCalories: 2500,
        proteinRatio: 4,
      });
    });
  });

  describe('useModalBackHandler', () => {
    it('calls useModalBackHandler with isOpen=true and onClose', async () => {
      const { useModalBackHandler } = await import('../hooks/useModalBackHandler');
      const onClose = vi.fn();
      renderModal({ onClose });
      expect(useModalBackHandler).toHaveBeenCalledWith(true, onClose);
    });
  });

  describe('Goal preset detail text', () => {
    it('shows calorie and protein info for each preset', () => {
      renderModal();
      expect(screen.getByText('2000 kcal · 1.6g/kg')).toBeInTheDocument();
      expect(screen.getByText('2200 kcal · 2.5g/kg')).toBeInTheDocument();
      expect(screen.getByText('1600 kcal · 2g/kg')).toBeInTheDocument();
      expect(screen.getByText('1400 kcal · 1.2g/kg')).toBeInTheDocument();
    });
  });

  describe('Sequential interactions', () => {
    it('allows changing weight then applying a preset (preserves new weight)', () => {
      const { props } = renderModal();
      fireEvent.change(screen.getByTestId('input-goal-weight'), { target: { value: '90' } });
      expect(props.onUpdateProfile).toHaveBeenCalledWith({ ...defaultProfile, weight: 90 });
    });

    it('applies multiple protein presets in sequence (last wins)', () => {
      const { props } = renderModal();
      fireEvent.click(screen.getByTestId('btn-preset-1'));
      fireEvent.click(screen.getByTestId('btn-preset-4'));
      expect(props.onUpdateProfile).toHaveBeenLastCalledWith({ ...defaultProfile, proteinRatio: 4 });
    });

    it('applies multiple goal presets in sequence (last wins)', () => {
      const { props } = renderModal();
      fireEvent.click(screen.getByTestId('btn-goal-preset-1400'));
      fireEvent.click(screen.getByTestId('btn-goal-preset-2200'));
      expect(props.onUpdateProfile).toHaveBeenLastCalledWith({
        ...defaultProfile,
        targetCalories: 2200,
        proteinRatio: 2.5,
      });
    });
  });

  describe('Input attributes', () => {
    it('weight input has correct attributes', () => {
      renderModal();
      const input = screen.getByTestId('input-goal-weight');
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toHaveAttribute('min', '1');
      expect(input).toHaveAttribute('max', '500');
      expect(input).toHaveAttribute('inputmode', 'numeric');
      expect(input).toHaveAttribute('autocomplete', 'off');
    });

    it('protein input has correct attributes', () => {
      renderModal();
      const input = screen.getByTestId('input-goal-protein');
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toHaveAttribute('step', '0.1');
      expect(input).toHaveAttribute('min', '1');
      expect(input).toHaveAttribute('max', '5');
      expect(input).toHaveAttribute('inputmode', 'decimal');
      expect(input).toHaveAttribute('autocomplete', 'off');
    });

    it('calories input has correct attributes', () => {
      renderModal();
      const input = screen.getByTestId('input-goal-calories');
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toHaveAttribute('min', '100');
      expect(input).toHaveAttribute('max', '10000');
      expect(input).toHaveAttribute('inputmode', 'numeric');
      expect(input).toHaveAttribute('autocomplete', 'off');
    });

    it('weight input has correct htmlFor/id linkage', () => {
      renderModal();
      const label = screen.getByText('goalSettings.weight');
      expect(label).toHaveAttribute('for', 'goal-weight');
      expect(screen.getByTestId('input-goal-weight')).toHaveAttribute('id', 'goal-weight');
    });

    it('protein input has correct htmlFor/id linkage', () => {
      renderModal();
      const label = screen.getByText('goalSettings.proteinGoal');
      expect(label).toHaveAttribute('for', 'goal-protein');
      expect(screen.getByTestId('input-goal-protein')).toHaveAttribute('id', 'goal-protein');
    });

    it('calories input has correct htmlFor/id linkage', () => {
      renderModal();
      const label = screen.getByText('goalSettings.caloriesGoal');
      expect(label).toHaveAttribute('for', 'goal-calories');
      expect(screen.getByTestId('input-goal-calories')).toHaveAttribute('id', 'goal-calories');
    });
  });
});
