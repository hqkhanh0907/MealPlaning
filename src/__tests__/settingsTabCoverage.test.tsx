import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { SettingsTab } from '../components/SettingsTab';

// Mutable mock state so individual tests can override
let mockActiveGoal: { type: string } | null = null;

const mockNotify = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismissAll: vi.fn() };
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => mockNotify,
}));

vi.mock('../hooks/useModalBackHandler', () => ({ useModalBackHandler: vi.fn() }));

vi.mock('../contexts/DatabaseContext', () => ({
  DatabaseProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../features/health-profile/store/healthProfileStore', () => ({
  useHealthProfileStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      profile: {
        weightKg: 70,
        heightCm: 170,
        age: 30,
        gender: 'male',
        activityLevel: 'moderate',
        proteinRatio: 2,
        fatPct: 25,
        bodyFatPct: null,
        bmrOverride: null,
      },
      activeGoal: mockActiveGoal,
    }),
}));

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      trainingProfile: { daysPerWeek: 5, sessionDurationMin: 60 },
    }),
}));

vi.mock('../services/nutritionEngine', () => ({
  calculateBMR: () => 1618,
  calculateTDEE: () => 2508,
  calculateMacros: () => ({ proteinG: 140, fatG: 70, carbsG: 330 }),
  getCalorieOffset: () => 0,
}));

vi.mock('../components/DataBackup', () => ({
  DataBackup: () => <div data-testid="data-backup">DataBackup</div>,
}));

vi.mock('../components/GoogleDriveSync', () => ({
  GoogleDriveSync: () => <div data-testid="google-drive-sync">GoogleDriveSync</div>,
}));

// Mock lazy-loaded detail pages (must export default for React.lazy)
vi.mock('../components/settings/HealthProfileDetailPage', () => ({
  default: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="health-profile-detail">
      <button data-testid="health-detail-back" onClick={onBack}>
        Back
      </button>
    </div>
  ),
}));

vi.mock('../components/settings/GoalDetailPage', () => ({
  default: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="goal-detail">
      <button data-testid="goal-detail-back" onClick={onBack}>
        Back
      </button>
    </div>
  ),
}));

vi.mock('../components/settings/TrainingProfileDetailPage', () => ({
  default: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="training-profile-detail">
      <button data-testid="training-detail-back" onClick={onBack}>
        Back
      </button>
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  mockActiveGoal = null;
});

describe('SettingsTab navigation (coverage)', () => {
  const defaultProps = { theme: 'system' as const, setTheme: vi.fn() };

  it('navigates to health-profile detail and back to menu', async () => {
    render(<SettingsTab {...defaultProps} />);

    fireEvent.click(screen.getByTestId('settings-nav-health-profile'));

    await waitFor(() => {
      expect(screen.getByTestId('health-profile-detail')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('health-detail-back'));

    await waitFor(() => {
      expect(screen.getByTestId('settings-nav-health-profile')).toBeInTheDocument();
    });
  });

  it('navigates to goal detail page', async () => {
    render(<SettingsTab {...defaultProps} />);

    fireEvent.click(screen.getByTestId('settings-nav-goal'));

    await waitFor(() => {
      expect(screen.getByTestId('goal-detail')).toBeInTheDocument();
    });
  });

  it('navigates to training-profile detail page', async () => {
    render(<SettingsTab {...defaultProps} />);

    fireEvent.click(screen.getByTestId('settings-nav-training-profile'));

    await waitFor(() => {
      expect(screen.getByTestId('training-profile-detail')).toBeInTheDocument();
    });
  });
});

describe('SettingsMenu activeGoal branch (coverage)', () => {
  const defaultProps = { theme: 'system' as const, setTheme: vi.fn() };

  it('displays translated goal type when activeGoal exists', () => {
    mockActiveGoal = { type: 'cut' };
    render(<SettingsTab {...defaultProps} />);

    expect(screen.getByText('Giảm cân')).toBeInTheDocument();
  });
});
