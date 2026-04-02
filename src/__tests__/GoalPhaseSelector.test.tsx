import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GoalPhaseSelector } from '../features/health-profile/components/GoalPhaseSelector';
import { useHealthProfileStore } from '../features/health-profile/store/healthProfileStore';
import type { DatabaseService } from '../services/databaseService';

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */
const mockDb: DatabaseService = {
  initialize: vi.fn(),
  execute: vi.fn(),
  query: vi.fn().mockResolvedValue([]),
  queryOne: vi.fn().mockResolvedValue(null),
  transaction: vi.fn(),
  exportBinary: vi.fn().mockReturnValue(new Uint8Array()),
  importBinary: vi.fn(),
  exportToJSON: vi.fn(),
  importFromJSON: vi.fn(),
};

vi.mock('../contexts/DatabaseContext', () => ({
  useDatabase: () => mockDb,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  useHealthProfileStore.setState({ activeGoal: null });
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function setupProfileWithWeight(weight: number) {
  useHealthProfileStore.setState({
    profile: {
      id: 'default',
      name: 'Test',
      gender: 'male',
      age: 30,
      dateOfBirth: null,
      heightCm: 170,
      weightKg: weight,
      activityLevel: 'moderate',
      proteinRatio: 2.0,
      fatPct: 0.25,
      targetCalories: 2000,
      updatedAt: new Date().toISOString(),
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe('GoalPhaseSelector', () => {
  it('renders 3 goal type options', () => {
    render(<GoalPhaseSelector />);

    expect(screen.getByTestId('goal-type-cut')).toBeInTheDocument();
    expect(screen.getByTestId('goal-type-maintain')).toBeInTheDocument();
    expect(screen.getByTestId('goal-type-bulk')).toBeInTheDocument();

    expect(screen.getByText('Giảm cân')).toBeInTheDocument();
    expect(screen.getByText('Duy trì')).toBeInTheDocument();
    expect(screen.getByText('Tăng cân')).toBeInTheDocument();
  });

  it('selecting Cut shows rate selector', async () => {
    const user = userEvent.setup();
    render(<GoalPhaseSelector />);

    await user.click(screen.getByTestId('goal-type-cut'));

    expect(screen.getByTestId('rate-selector')).toBeInTheDocument();
    expect(screen.getByText('Tốc độ thay đổi')).toBeInTheDocument();
  });

  it('selecting Maintain hides rate selector and target weight', async () => {
    const user = userEvent.setup();
    render(<GoalPhaseSelector />);

    // First select Cut to show rate selector and target weight
    await user.click(screen.getByTestId('goal-type-cut'));
    expect(screen.getByTestId('rate-selector')).toBeInTheDocument();
    expect(screen.getByTestId('target-weight-input')).toBeInTheDocument();

    // Then select Maintain to hide both
    await user.click(screen.getByTestId('goal-type-maintain'));
    expect(screen.queryByTestId('rate-selector')).not.toBeInTheDocument();
    expect(screen.queryByTestId('target-weight-input')).not.toBeInTheDocument();
  });

  it('rate change updates calorie offset display', async () => {
    const user = userEvent.setup();
    render(<GoalPhaseSelector />);

    await user.click(screen.getByTestId('goal-type-cut'));

    // Default is moderate → -550
    expect(screen.getByTestId('calorie-offset-display')).toHaveTextContent('-550 kcal');

    // Switch to conservative → -275
    await user.click(screen.getByTestId('rate-conservative'));
    expect(screen.getByTestId('calorie-offset-display')).toHaveTextContent('-275 kcal');

    // Switch to aggressive → -1100
    await user.click(screen.getByTestId('rate-aggressive'));
    expect(screen.getByTestId('calorie-offset-display')).toHaveTextContent('-1100 kcal');
  });

  it('save button creates goal with correct offset', async () => {
    const user = userEvent.setup();
    render(<GoalPhaseSelector />);

    await user.click(screen.getByTestId('goal-type-bulk'));
    await user.click(screen.getByTestId('rate-moderate'));
    await user.click(screen.getByTestId('save-goal-button'));

    const { activeGoal } = useHealthProfileStore.getState();
    expect(activeGoal).not.toBeNull();
    expect(activeGoal!.type).toBe('bulk');
    expect(activeGoal!.rateOfChange).toBe('moderate');
    expect(activeGoal!.calorieOffset).toBe(550);
    expect(activeGoal!.isActive).toBe(true);
  });

  it('target weight field is optional', async () => {
    const user = userEvent.setup();
    render(<GoalPhaseSelector />);

    // Save without entering target weight
    await user.click(screen.getByTestId('goal-type-cut'));
    await user.click(screen.getByTestId('save-goal-button'));

    const { activeGoal } = useHealthProfileStore.getState();
    expect(activeGoal).not.toBeNull();
    expect(activeGoal!.targetWeightKg).toBeUndefined();

    // Reset and save with target weight
    useHealthProfileStore.setState({ activeGoal: null });
    cleanup();
    render(<GoalPhaseSelector />);

    await user.click(screen.getByTestId('goal-type-cut'));
    const input = screen.getByTestId('target-weight-input');
    await user.type(input, '65');
    await user.click(screen.getByTestId('save-goal-button'));

    const updated = useHealthProfileStore.getState().activeGoal;
    expect(updated).not.toBeNull();
    expect(updated!.targetWeightKg).toBe(65);
  });

  it('manual override toggle for calorie offset works', async () => {
    const user = userEvent.setup();
    render(<GoalPhaseSelector />);

    await user.click(screen.getByTestId('goal-type-cut'));
    expect(screen.getByTestId('calorie-offset-display')).toHaveTextContent('-550 kcal');

    // Toggle to manual override
    await user.click(screen.getByTestId('manual-override-toggle'));
    expect(screen.getByTestId('custom-offset-input')).toBeInTheDocument();

    // Custom input should be pre-filled with auto value
    expect(screen.getByTestId('custom-offset-input')).toHaveValue('-550');

    // Clear and type custom value
    await user.clear(screen.getByTestId('custom-offset-input'));
    await user.type(screen.getByTestId('custom-offset-input'), '-400');
    expect(screen.getByTestId('calorie-offset-display')).toHaveTextContent('-400 kcal');

    // Save with custom offset
    await user.click(screen.getByTestId('save-goal-button'));
    const { activeGoal } = useHealthProfileStore.getState();
    expect(activeGoal!.calorieOffset).toBe(-400);
  });

  it('correct offset values for each rate × goal combo', async () => {
    const user = userEvent.setup();

    const expectedOffsets: [string, string, string][] = [
      ['goal-type-cut', 'rate-conservative', '-275 kcal'],
      ['goal-type-cut', 'rate-moderate', '-550 kcal'],
      ['goal-type-cut', 'rate-aggressive', '-1100 kcal'],
      ['goal-type-bulk', 'rate-conservative', '+275 kcal'],
      ['goal-type-bulk', 'rate-moderate', '+550 kcal'],
      ['goal-type-bulk', 'rate-aggressive', '+1100 kcal'],
    ];

    for (const [goalTestId, rateTestId, expected] of expectedOffsets) {
      cleanup();
      render(<GoalPhaseSelector />);

      await user.click(screen.getByTestId(goalTestId));
      await user.click(screen.getByTestId(rateTestId));

      expect(screen.getByTestId('calorie-offset-display')).toHaveTextContent(expected);
    }

    // Maintain should always show ±0
    cleanup();
    render(<GoalPhaseSelector />);
    await user.click(screen.getByTestId('goal-type-maintain'));
    expect(screen.getByTestId('calorie-offset-display')).toHaveTextContent('±0 kcal');
  });

  it('handleSave returns false when saveGoal throws', async () => {
    const user = userEvent.setup();

    const originalSaveGoal = useHealthProfileStore.getState().saveGoal;
    useHealthProfileStore.setState({
      saveGoal: vi.fn().mockRejectedValue(new Error('DB error')) as never,
    });

    render(<GoalPhaseSelector />);
    await user.click(screen.getByTestId('goal-type-cut'));
    await user.click(screen.getByTestId('save-goal-button'));

    const { activeGoal } = useHealthProfileStore.getState();
    expect(activeGoal).toBeNull();

    useHealthProfileStore.setState({ saveGoal: originalSaveGoal });
  });

  it('assigns handleSave to saveRef when provided', () => {
    const saveRef = { current: null as (() => Promise<boolean>) | null };
    render(<GoalPhaseSelector saveRef={saveRef} />);
    expect(saveRef.current).not.toBeNull();
    expect(typeof saveRef.current).toBe('function');
  });

  it('saveRef.current calls handleSave and returns true on success', async () => {
    const user = userEvent.setup();
    const saveRef = { current: null as (() => Promise<boolean>) | null };
    render(<GoalPhaseSelector saveRef={saveRef} />);

    await user.click(screen.getByTestId('goal-type-bulk'));

    const result = await saveRef.current!();
    expect(result).toBe(true);

    const { activeGoal } = useHealthProfileStore.getState();
    expect(activeGoal).not.toBeNull();
    expect(activeGoal!.type).toBe('bulk');
  });

  // --- New validation tests ---

  it('blocks save when cut target weight >= current weight', async () => {
    const user = userEvent.setup();
    setupProfileWithWeight(80);
    render(<GoalPhaseSelector />);

    await user.click(screen.getByTestId('goal-type-cut'));
    const input = screen.getByTestId('target-weight-input');
    await user.type(input, '85');
    await user.click(screen.getByTestId('save-goal-button'));

    // Should show error and NOT save
    expect(screen.getByRole('alert')).toHaveTextContent('Mục tiêu giảm cân phải nhỏ hơn cân nặng hiện tại');
    expect(useHealthProfileStore.getState().activeGoal).toBeNull();
  });

  it('blocks save when bulk target weight <= current weight', async () => {
    const user = userEvent.setup();
    setupProfileWithWeight(80);
    render(<GoalPhaseSelector />);

    await user.click(screen.getByTestId('goal-type-bulk'));
    const input = screen.getByTestId('target-weight-input');
    await user.type(input, '75');
    await user.click(screen.getByTestId('save-goal-button'));

    expect(screen.getByRole('alert')).toHaveTextContent('Mục tiêu tăng cơ phải lớn hơn cân nặng hiện tại');
    expect(useHealthProfileStore.getState().activeGoal).toBeNull();
  });

  it('blocks save when cut target weight equals current weight', async () => {
    const user = userEvent.setup();
    setupProfileWithWeight(80);
    render(<GoalPhaseSelector />);

    await user.click(screen.getByTestId('goal-type-cut'));
    const input = screen.getByTestId('target-weight-input');
    await user.type(input, '80');
    await user.click(screen.getByTestId('save-goal-button'));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(useHealthProfileStore.getState().activeGoal).toBeNull();
  });

  it('allows save when cut target weight < current weight', async () => {
    const user = userEvent.setup();
    setupProfileWithWeight(80);
    render(<GoalPhaseSelector />);

    await user.click(screen.getByTestId('goal-type-cut'));
    const input = screen.getByTestId('target-weight-input');
    await user.type(input, '75');
    await user.click(screen.getByTestId('save-goal-button'));

    const { activeGoal } = useHealthProfileStore.getState();
    expect(activeGoal).not.toBeNull();
    expect(activeGoal!.targetWeightKg).toBe(75);
  });

  it('allows save when bulk target weight > current weight', async () => {
    const user = userEvent.setup();
    setupProfileWithWeight(70);
    render(<GoalPhaseSelector />);

    await user.click(screen.getByTestId('goal-type-bulk'));
    const input = screen.getByTestId('target-weight-input');
    await user.type(input, '85');
    await user.click(screen.getByTestId('save-goal-button'));

    const { activeGoal } = useHealthProfileStore.getState();
    expect(activeGoal).not.toBeNull();
    expect(activeGoal!.targetWeightKg).toBe(85);
  });

  it('hides target weight entirely for maintain', async () => {
    const user = userEvent.setup();
    render(<GoalPhaseSelector />);

    // Maintain is default — target weight should not appear
    expect(screen.queryByTestId('target-weight-input')).not.toBeInTheDocument();

    // Select cut — target weight should appear
    await user.click(screen.getByTestId('goal-type-cut'));
    expect(screen.getByTestId('target-weight-input')).toBeInTheDocument();

    // Back to maintain — target weight hidden again
    await user.click(screen.getByTestId('goal-type-maintain'));
    expect(screen.queryByTestId('target-weight-input')).not.toBeInTheDocument();
  });

  it('clears target weight error when switching to maintain', async () => {
    const user = userEvent.setup();
    setupProfileWithWeight(80);
    render(<GoalPhaseSelector />);

    // Enter invalid cut target
    await user.click(screen.getByTestId('goal-type-cut'));
    const input = screen.getByTestId('target-weight-input');
    await user.type(input, '90');
    await user.click(screen.getByTestId('save-goal-button'));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Switch to maintain — error should be gone and save should work
    await user.click(screen.getByTestId('goal-type-maintain'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('save-goal-button'));
    const { activeGoal } = useHealthProfileStore.getState();
    expect(activeGoal).not.toBeNull();
    expect(activeGoal!.type).toBe('maintain');
  });
});
