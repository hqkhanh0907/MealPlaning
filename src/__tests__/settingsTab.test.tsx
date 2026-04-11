import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { SettingsTab } from '../components/SettingsTab';

// Mock notification
const mockNotify = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismissAll: vi.fn() };
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => mockNotify,
}));

vi.mock('../hooks/useModalBackHandler', () => ({ useModalBackHandler: vi.fn() }));

vi.mock('../contexts/DatabaseContext', () => ({
  DatabaseProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mutable mock profile so individual tests can override
let mockSettingsProfile: Record<string, unknown> | null = {
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

// Mock stores for SettingsMenu summary data
vi.mock('../features/health-profile/store/healthProfileStore', () => ({
  useHealthProfileStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      profile: mockSettingsProfile,
      activeGoal: null,
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

const mockSetTheme = vi.fn();

vi.mock('../components/DataBackup', () => ({
  DataBackup: () => <div data-testid="data-backup">DataBackup</div>,
}));

vi.mock('../components/GoogleDriveSync', () => ({
  GoogleDriveSync: () => <div data-testid="google-drive-sync">GoogleDriveSync</div>,
}));

vi.mock('../features/health-profile/components/HealthProfileForm', () => ({
  HealthProfileForm: () => <div data-testid="health-profile-form">HealthProfileForm</div>,
}));

vi.mock('../features/health-profile/components/GoalPhaseSelector', () => ({
  GoalPhaseSelector: () => <div data-testid="goal-phase-selector">GoalPhaseSelector</div>,
}));

vi.mock('../features/fitness/components/TrainingProfileSection', () => ({
  TrainingProfileSection: () => <div data-testid="training-profile-section">TrainingProfileSection</div>,
}));

afterEach(() => {
  cleanup();
  mockSettingsProfile = {
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

describe('SettingsTab', () => {
  const defaultProps = {
    theme: 'system' as const,
    setTheme: mockSetTheme,
  };

  it('renders with BMR=0 and TDEE=0 when profile is null', () => {
    mockSettingsProfile = null;
    render(<SettingsTab {...defaultProps} />);
    const healthCard = screen.getByTestId('settings-nav-health-profile');
    expect(healthCard).toHaveTextContent('Chưa hoàn tất');
    expect(healthCard).toHaveTextContent('Thiếu hồ sơ cơ bản nên chưa thể tính BMR, TDEE và macro.');
    expect(screen.queryByText(/BMR: 0/)).not.toBeInTheDocument();
  });

  it('renders settings page without duplicate heading', () => {
    render(<SettingsTab {...defaultProps} />);
    expect(screen.getByTestId('settings-search')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Cài đặt' })).not.toBeInTheDocument();
  });

  it('renders navigable section cards', () => {
    render(<SettingsTab {...defaultProps} />);
    expect(screen.getByTestId('settings-nav-health-profile')).toBeInTheDocument();
    expect(screen.getByTestId('settings-nav-goal')).toBeInTheDocument();
    expect(screen.getByTestId('settings-nav-training-profile')).toBeInTheDocument();
  });

  it('shows summary info on menu cards', () => {
    render(<SettingsTab {...defaultProps} />);
    const healthCard = screen.getByTestId('settings-nav-health-profile');
    expect(healthCard).toHaveTextContent('Đã sẵn sàng');
    expect(healthCard).toHaveTextContent('Hồ sơ đã đủ dữ liệu để tính BMR, TDEE và gợi ý macro hằng ngày.');
    expect(healthCard).toHaveTextContent('BMR 1618 • TDEE 2508');
  });

  it('treats zero weight as needs attention instead of not configured', () => {
    mockSettingsProfile = { ...mockSettingsProfile, weightKg: 0 };
    render(<SettingsTab {...defaultProps} />);
    expect(screen.getByText('Cần chú ý')).toBeInTheDocument();
    expect(
      screen.getByText('Cân nặng (kg) đang có giá trị chưa hợp lệ nên ứng dụng chưa thể tính đúng nhu cầu năng lượng.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/BMR 1618 • TDEE 2508/)).not.toBeInTheDocument();
  });

  it('renders theme section with all options', () => {
    render(<SettingsTab {...defaultProps} />);
    expect(screen.getByText('Giao diện')).toBeInTheDocument();
    expect(screen.getByText('Sáng')).toBeInTheDocument();
    expect(screen.getByText('Tối')).toBeInTheDocument();
    expect(screen.getByText('Hệ thống')).toBeInTheDocument();
  });

  it('renders theme description', () => {
    render(<SettingsTab {...defaultProps} />);
    expect(screen.getByText('Tùy chỉnh chế độ hiển thị')).toBeInTheDocument();
  });

  it('renders data section with DataBackup', () => {
    render(<SettingsTab {...defaultProps} />);
    expect(screen.getByText('Dữ liệu')).toBeInTheDocument();
    expect(screen.getByText('Quản lý dữ liệu ứng dụng')).toBeInTheDocument();
    expect(screen.getByTestId('data-backup')).toBeInTheDocument();
  });

  it('renders cloud sync section with GoogleDriveSync', () => {
    render(<SettingsTab {...defaultProps} />);
    expect(screen.getByTestId('google-drive-sync')).toBeInTheDocument();
  });

  it('calls setTheme when theme button is clicked', () => {
    render(<SettingsTab {...defaultProps} />);
    const lightBtn = screen.getByText('Sáng').closest('button');
    expect(lightBtn).toBeTruthy();
    if (lightBtn) fireEvent.click(lightBtn);
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('calls setTheme with dark when dark button is clicked', () => {
    render(<SettingsTab {...defaultProps} />);
    const darkBtn = screen.getByText('Tối').closest('button');
    expect(darkBtn).toBeTruthy();
    if (darkBtn) fireEvent.click(darkBtn);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme with system when system button is clicked', () => {
    render(<SettingsTab {...defaultProps} />);
    const sysBtn = screen.getByText('Hệ thống').closest('button');
    expect(sysBtn).toBeTruthy();
    if (sysBtn) fireEvent.click(sysBtn);
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('highlights active system theme button', () => {
    render(<SettingsTab {...defaultProps} />);
    const sysBtn = screen.getByText('Hệ thống').closest('button');
    expect(sysBtn?.className).toContain('border-primary');

    const lightBtn = screen.getByText('Sáng').closest('button');
    expect(lightBtn?.className).not.toContain('border-primary');
  });

  it('non-active theme buttons do not have border-primary', () => {
    render(<SettingsTab {...defaultProps} />);
    const lightBtn = screen.getByText('Sáng').closest('button');
    const darkBtn = screen.getByText('Tối').closest('button');
    expect(lightBtn?.className).not.toContain('border-primary');
    expect(darkBtn?.className).not.toContain('border-primary');
  });

  it('calls setTheme with schedule when schedule button is clicked', () => {
    render(<SettingsTab {...defaultProps} />);
    const schedBtn = screen.getByText('Tự động').closest('button');
    expect(schedBtn).toBeTruthy();
    if (schedBtn) fireEvent.click(schedBtn);
    expect(mockSetTheme).toHaveBeenCalledWith('schedule');
  });

  it('renders search input', () => {
    render(<SettingsTab {...defaultProps} />);
    expect(screen.getByTestId('settings-search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tìm kiếm cài đặt...')).toBeInTheDocument();
  });

  it('filters sections when typing in search', () => {
    render(<SettingsTab {...defaultProps} />);
    const searchInput = screen.getByTestId('settings-search');
    fireEvent.change(searchInput, { target: { value: 'Giao diện' } });
    expect(screen.getByText('Giao diện')).toBeInTheDocument();
    expect(screen.queryByText('Dữ liệu')).not.toBeInTheDocument();
  });

  it('shows all sections when search is cleared', () => {
    render(<SettingsTab {...defaultProps} />);
    const searchInput = screen.getByTestId('settings-search');
    fireEvent.change(searchInput, { target: { value: 'Giao diện' } });
    expect(screen.queryByText('Dữ liệu')).not.toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Giao diện')).toBeInTheDocument();
    expect(screen.getByText('Dữ liệu')).toBeInTheDocument();
  });
});
