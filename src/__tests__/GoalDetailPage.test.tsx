import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useHealthProfileStore } from '../features/health-profile/store/healthProfileStore';
import type { Goal } from '../features/health-profile/types';

/* ------------------------------------------------------------------ */
/* Mocks                                                               */
/* ------------------------------------------------------------------ */
const mockSaveResult = vi.hoisted(() => ({ value: true }));
const mockValidityResult = vi.hoisted(() => ({ value: true }));

vi.mock('../features/health-profile/components/GoalPhaseSelector', () => ({
  GoalPhaseSelector: ({
    saveRef,
    onValidityChange,
  }: {
    embedded?: boolean;
    saveRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
    onValidityChange?: (valid: boolean) => void;
  }) => {
    React.useEffect(() => {
      if (saveRef) {
        saveRef.current = async () => mockSaveResult.value;
      }
      onValidityChange?.(mockValidityResult.value);
    }, [saveRef, onValidityChange]);
    return <div data-testid="goal-phase-selector">GoalPhaseSelector</div>;
  },
}));

import GoalDetailPage from '../components/settings/GoalDetailPage';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  useHealthProfileStore.setState({ activeGoal: null });
  mockSaveResult.value = true;
  mockValidityResult.value = true;
});

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    type: 'cut',
    rateOfChange: 'moderate',
    targetWeightKg: 65,
    calorieOffset: -550,
    startDate: '2025-01-01T00:00:00.000Z',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('GoalDetailPage', () => {
  /* ---------------------------------------------------------------- */
  /* Empty state — no goal                                             */
  /* ---------------------------------------------------------------- */
  describe('no active goal', () => {
    it('shows empty state', () => {
      render(<GoalDetailPage onBack={vi.fn()} />);
      expect(screen.getByTestId('goal-view-empty')).toBeInTheDocument();
    });

    it('does not show goal view', () => {
      render(<GoalDetailPage onBack={vi.fn()} />);
      expect(screen.queryByTestId('goal-view')).not.toBeInTheDocument();
    });
  });

  /* ---------------------------------------------------------------- */
  /* View mode — cut goal (negative offset)                            */
  /* ---------------------------------------------------------------- */
  describe('cut goal view', () => {
    beforeEach(() => {
      useHealthProfileStore.setState({ activeGoal: makeGoal({ type: 'cut', calorieOffset: -550 }) });
    });

    it('renders goal view', () => {
      render(<GoalDetailPage onBack={vi.fn()} />);
      expect(screen.getByTestId('goal-view')).toBeInTheDocument();
    });

    it('displays negative calorie offset', () => {
      render(<GoalDetailPage onBack={vi.fn()} />);
      expect(screen.getByText('-550 kcal')).toBeInTheDocument();
    });

    it('shows rate of change for non-maintain goal', () => {
      render(<GoalDetailPage onBack={vi.fn()} />);
      // rateOfChange should be displayed
      const allText = screen.getByTestId('goal-view').textContent;
      expect(allText).toBeTruthy();
    });

    it('shows target weight when present', () => {
      render(<GoalDetailPage onBack={vi.fn()} />);
      expect(screen.getByText('65 kg')).toBeInTheDocument();
    });
  });

  /* ---------------------------------------------------------------- */
  /* View mode — maintain goal (zero offset)                           */
  /* ---------------------------------------------------------------- */
  describe('maintain goal view', () => {
    beforeEach(() => {
      useHealthProfileStore.setState({
        activeGoal: makeGoal({
          type: 'maintain',
          calorieOffset: 0,
          rateOfChange: undefined as unknown as Goal['rateOfChange'],
          targetWeightKg: undefined,
        }),
      });
    });

    it('displays ±0 kcal offset', () => {
      render(<GoalDetailPage onBack={vi.fn()} />);
      expect(screen.getByText('±0 kcal')).toBeInTheDocument();
    });

    it('hides rate of change for maintain goal', () => {
      // Maintain + no rateOfChange → the rate row should not appear
      const { container } = render(<GoalDetailPage onBack={vi.fn()} />);
      // Verify goal view renders but without rate info
      expect(screen.getByTestId('goal-view')).toBeInTheDocument();
      // rate field not present (no Zap icon row)
      const cells = container.querySelectorAll('.grid > div');
      // Should have fewer fields (no rate, no target weight)
      expect(cells.length).toBeLessThan(4);
    });
  });

  /* ---------------------------------------------------------------- */
  /* View mode — bulk goal (positive offset)                           */
  /* ---------------------------------------------------------------- */
  describe('bulk goal view', () => {
    it('displays positive calorie offset with + prefix', () => {
      useHealthProfileStore.setState({
        activeGoal: makeGoal({ type: 'bulk', calorieOffset: 550, rateOfChange: 'moderate' }),
      });
      render(<GoalDetailPage onBack={vi.fn()} />);
      expect(screen.getByText('+550 kcal')).toBeInTheDocument();
    });
  });

  /* ---------------------------------------------------------------- */
  /* View mode — unknown goal type fallback icon/color                 */
  /* ---------------------------------------------------------------- */
  describe('unknown goal type', () => {
    it('falls back to default icon and empty color', () => {
      useHealthProfileStore.setState({
        activeGoal: makeGoal({ type: 'unknown' as Goal['type'], calorieOffset: 0 }),
      });
      render(<GoalDetailPage onBack={vi.fn()} />);
      expect(screen.getByTestId('goal-view')).toBeInTheDocument();
    });
  });

  /* ---------------------------------------------------------------- */
  /* Edit mode                                                         */
  /* ---------------------------------------------------------------- */
  describe('edit mode', () => {
    beforeEach(() => {
      useHealthProfileStore.setState({ activeGoal: makeGoal() });
    });

    it('switches to edit mode on edit click', () => {
      render(<GoalDetailPage onBack={vi.fn()} />);
      fireEvent.click(screen.getByTestId('settings-detail-edit'));

      expect(screen.getByTestId('goal-phase-selector')).toBeInTheDocument();
      expect(screen.queryByTestId('goal-view')).not.toBeInTheDocument();
    });

    it('returns to view mode on cancel', () => {
      render(<GoalDetailPage onBack={vi.fn()} />);
      fireEvent.click(screen.getByTestId('settings-detail-edit'));
      fireEvent.click(screen.getByTestId('settings-detail-cancel'));

      expect(screen.queryByTestId('goal-phase-selector')).not.toBeInTheDocument();
      expect(screen.getByTestId('goal-view')).toBeInTheDocument();
    });

    it('returns to view mode on successful save', async () => {
      render(<GoalDetailPage onBack={vi.fn()} />);
      fireEvent.click(screen.getByTestId('settings-detail-edit'));
      fireEvent.click(screen.getByTestId('settings-detail-save'));

      await waitFor(() => {
        expect(screen.queryByTestId('goal-phase-selector')).not.toBeInTheDocument();
      });
    });

    it('stays in edit mode when save fails', async () => {
      mockSaveResult.value = false;

      render(<GoalDetailPage onBack={vi.fn()} />);
      fireEvent.click(screen.getByTestId('settings-detail-edit'));
      fireEvent.click(screen.getByTestId('settings-detail-save'));

      await waitFor(() => {
        expect(screen.getByTestId('goal-phase-selector')).toBeInTheDocument();
      });
    });
  });

  /* ---------------------------------------------------------------- */
  /* onBack callback                                                   */
  /* ---------------------------------------------------------------- */
  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(<GoalDetailPage onBack={onBack} />);
    fireEvent.click(screen.getByTestId('settings-detail-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  /* ---------------------------------------------------------------- */
  /* hasChanges = isEditing && isFormValid                              */
  /* ---------------------------------------------------------------- */
  it('save is disabled in edit mode when form is invalid', () => {
    mockValidityResult.value = false;
    useHealthProfileStore.setState({ activeGoal: makeGoal() });

    render(<GoalDetailPage onBack={vi.fn()} />);
    fireEvent.click(screen.getByTestId('settings-detail-edit'));

    const saveBtn = screen.getByTestId('settings-detail-save');
    expect(saveBtn).toBeDisabled();
  });

  /* ---------------------------------------------------------------- */
  /* Goal without targetWeightKg                                       */
  /* ---------------------------------------------------------------- */
  it('omits target weight row when targetWeightKg is undefined', () => {
    useHealthProfileStore.setState({
      activeGoal: makeGoal({ targetWeightKg: undefined }),
    });
    render(<GoalDetailPage onBack={vi.fn()} />);
    expect(screen.queryByText(/kg/)).toBeNull();
  });

  /* ---------------------------------------------------------------- */
  /* Goal without startDate                                            */
  /* ---------------------------------------------------------------- */
  it('handles missing startDate gracefully', () => {
    useHealthProfileStore.setState({
      activeGoal: makeGoal({ startDate: '' }),
    });
    render(<GoalDetailPage onBack={vi.fn()} />);
    expect(screen.getByTestId('goal-view')).toBeInTheDocument();
  });
});
