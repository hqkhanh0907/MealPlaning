import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useFitnessStore } from '../store/fitnessStore';

/* ------------------------------------------------------------------ */
/* Mocks                                                               */
/* ------------------------------------------------------------------ */
const mockSaveResult = vi.hoisted(() => ({ value: true }));

vi.mock('../features/fitness/components/TrainingProfileForm', () => ({
  TrainingProfileForm: ({
    saveRef,
  }: {
    embedded?: boolean;
    saveRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
  }) => {
    React.useEffect(() => {
      if (saveRef) {
        saveRef.current = async () => mockSaveResult.value;
      }
    }, [saveRef]);
    return <div data-testid="training-profile-form">TrainingProfileForm</div>;
  },
}));

vi.mock('../features/fitness/components/TrainingProfileSection', () => ({
  TrainingProfileSection: () => <div data-testid="training-profile-section">TrainingProfileSection</div>,
}));

import TrainingProfileDetailPage from '../components/settings/TrainingProfileDetailPage';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockSaveResult.value = true;
});

const MOCK_PROFILE = {
  id: 'tp-1',
  trainingExperience: 'intermediate' as const,
  daysPerWeek: 4,
  sessionDurationMin: 60,
  trainingGoal: 'hypertrophy' as const,
  availableEquipment: ['barbell' as const],
  injuryRestrictions: [],
  periodizationModel: 'linear' as const,
  planCycleWeeks: 8,
  priorityMuscles: [],
  cardioSessionsWeek: 2,
  cardioTypePref: 'mixed' as const,
  cardioDurationMin: 30,
  updatedAt: new Date().toISOString(),
};

describe('TrainingProfileDetailPage', () => {
  /* ---------------------------------------------------------------- */
  /* View mode — with profile data                                     */
  /* ---------------------------------------------------------------- */
  describe('view mode with profile', () => {
    beforeEach(() => {
      useFitnessStore.setState({ trainingProfile: MOCK_PROFILE });
    });

    it('renders layout and profile section', () => {
      render(<TrainingProfileDetailPage onBack={vi.fn()} />);
      expect(screen.getByTestId('settings-detail-layout')).toBeInTheDocument();
      expect(screen.getByTestId('training-profile-section')).toBeInTheDocument();
    });

    it('does NOT show form or empty state', () => {
      render(<TrainingProfileDetailPage onBack={vi.fn()} />);
      expect(screen.queryByTestId('training-profile-form')).not.toBeInTheDocument();
      expect(screen.queryByTestId('training-profile-empty')).not.toBeInTheDocument();
    });

    it('calls onBack when back button clicked', () => {
      const onBack = vi.fn();
      render(<TrainingProfileDetailPage onBack={onBack} />);
      fireEvent.click(screen.getByTestId('settings-detail-back'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  /* ---------------------------------------------------------------- */
  /* View mode — empty (no profile)                                    */
  /* ---------------------------------------------------------------- */
  describe('view mode without profile', () => {
    beforeEach(() => {
      useFitnessStore.setState({ trainingProfile: null });
    });

    it('shows empty state', () => {
      render(<TrainingProfileDetailPage onBack={vi.fn()} />);
      expect(screen.getByTestId('training-profile-empty')).toBeInTheDocument();
    });

    it('does NOT show profile section', () => {
      render(<TrainingProfileDetailPage onBack={vi.fn()} />);
      expect(screen.queryByTestId('training-profile-section')).not.toBeInTheDocument();
    });
  });

  /* ---------------------------------------------------------------- */
  /* Edit mode                                                         */
  /* ---------------------------------------------------------------- */
  describe('edit mode', () => {
    beforeEach(() => {
      useFitnessStore.setState({ trainingProfile: MOCK_PROFILE });
    });

    it('switches to edit mode when edit button clicked', () => {
      render(<TrainingProfileDetailPage onBack={vi.fn()} />);

      fireEvent.click(screen.getByTestId('settings-detail-edit'));

      expect(screen.getByTestId('training-profile-form')).toBeInTheDocument();
      expect(screen.queryByTestId('training-profile-section')).not.toBeInTheDocument();
    });

    it('exits edit mode on cancel', () => {
      render(<TrainingProfileDetailPage onBack={vi.fn()} />);

      fireEvent.click(screen.getByTestId('settings-detail-edit'));
      expect(screen.getByTestId('training-profile-form')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('settings-detail-cancel'));
      expect(screen.queryByTestId('training-profile-form')).not.toBeInTheDocument();
      expect(screen.getByTestId('training-profile-section')).toBeInTheDocument();
    });

    it('exits edit mode on successful save', async () => {
      render(<TrainingProfileDetailPage onBack={vi.fn()} />);

      // Enter edit mode
      fireEvent.click(screen.getByTestId('settings-detail-edit'));
      expect(screen.getByTestId('training-profile-form')).toBeInTheDocument();

      // Save
      fireEvent.click(screen.getByTestId('settings-detail-save'));

      await waitFor(() => {
        expect(screen.queryByTestId('training-profile-form')).not.toBeInTheDocument();
      });
    });

    it('stays in edit mode when save returns false', async () => {
      mockSaveResult.value = false;

      render(<TrainingProfileDetailPage onBack={vi.fn()} />);
      fireEvent.click(screen.getByTestId('settings-detail-edit'));
      fireEvent.click(screen.getByTestId('settings-detail-save'));

      // Should stay in edit mode since save returned false
      await waitFor(() => {
        expect(screen.getByTestId('training-profile-form')).toBeInTheDocument();
      });
    });
  });

  /* ---------------------------------------------------------------- */
  /* Save ref not set                                                  */
  /* ---------------------------------------------------------------- */
  it('handleSave does nothing if saveRef is not set', () => {
    useFitnessStore.setState({ trainingProfile: null });
    render(<TrainingProfileDetailPage onBack={vi.fn()} />);

    // Enter edit mode (with null profile, form renders)
    fireEvent.click(screen.getByTestId('settings-detail-edit'));

    // Click save — saveRef might be null in edge case
    // This should not throw
    fireEvent.click(screen.getByTestId('settings-detail-save'));
  });
});
