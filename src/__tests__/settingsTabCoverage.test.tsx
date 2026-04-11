import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { SettingsTab } from '../components/SettingsTab';

// Mutable mock state so individual tests can override
let mockActiveGoal: { type: string } | null = null;
let mockCoverageProfile: Record<string, unknown> | null = {
  weightKg: 70,
  heightCm: 170,
  age: 30,
  gender: 'male',
  activityLevel: 'moderate',
  proteinRatio: 2,
  fatPct: 25,
  bodyFatPct: null,
  bmrOverride: null,
  name: 'Test User',
  dateOfBirth: '1995-06-15',
};

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
      profile: mockCoverageProfile,
      activeGoal: mockActiveGoal,
    }),
}));

vi.mock('../features/health-profile/types', () => ({
  getAge: () => 30,
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
  mockCoverageProfile = {
    weightKg: 70,
    heightCm: 170,
    age: 30,
    gender: 'male',
    activityLevel: 'moderate',
    proteinRatio: 2,
    fatPct: 25,
    bodyFatPct: null,
    bmrOverride: null,
    name: 'Test User',
    dateOfBirth: '1995-06-15',
  };
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
    expect(screen.getByTestId('settings-nav-goal')).toHaveTextContent('Đang theo mục tiêu Giảm cân');
  });
});

describe('SettingsMenu null profile branch (coverage)', () => {
  const defaultProps = { theme: 'system' as const, setTheme: vi.fn() };

  it('renders with BMR=0 and TDEE=0 when profile is null', () => {
    mockCoverageProfile = null;
    render(<SettingsTab {...defaultProps} />);
    expect(screen.getByTestId('settings-nav-health-profile')).toHaveTextContent('Chưa hoàn tất');
    expect(screen.queryByText(/BMR: 0/)).not.toBeInTheDocument();
  });
});
