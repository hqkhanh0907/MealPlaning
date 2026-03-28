import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SettingsTab } from '../components/SettingsTab';

// Mock notification
const mockNotify = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismissAll: vi.fn() };
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => mockNotify,
}));

vi.mock('../hooks/useModalBackHandler', () => ({ useModalBackHandler: vi.fn() }));

const mockSetTheme = vi.fn();

vi.mock('../components/DataBackup', () => ({
  DataBackup: ({ onImport }: { onImport: (d: Record<string, unknown>) => void }) => (
    <div data-testid="data-backup">
      <button onClick={() => onImport({ 'mp-dishes': [] })}>Import</button>
    </div>
  ),
}));

vi.mock('../components/GoogleDriveSync', () => ({
  GoogleDriveSync: ({ onImportData }: { onImportData: (d: Record<string, unknown>) => void }) => (
    <div data-testid="google-drive-sync">
      <button onClick={() => onImportData({ 'mp-dishes': [] })}>SyncImport</button>
    </div>
  ),
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



afterEach(cleanup);

describe('SettingsTab', () => {
  const defaultProps = {
    onImportData: vi.fn(),
    theme: 'system' as const,
    setTheme: mockSetTheme,
  };

  it('renders settings title', () => {
    render(<SettingsTab {...defaultProps} />);
    expect(screen.getByText('Cài đặt')).toBeInTheDocument();
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

  it('passes onImportData to GoogleDriveSync', () => {
    render(<SettingsTab {...defaultProps} />);
    fireEvent.click(screen.getByText('SyncImport'));
    expect(defaultProps.onImportData).toHaveBeenCalledWith({ 'mp-dishes': [] });
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

  it('passes onImportData to DataBackup', () => {
    render(<SettingsTab {...defaultProps} />);
    const importBtn = screen.getByText('Import');
    fireEvent.click(importBtn);
    expect(defaultProps.onImportData).toHaveBeenCalledWith({ 'mp-dishes': [] });
  });

  it('highlights active system theme button', () => {
    render(<SettingsTab {...defaultProps} />);
    const sysBtn = screen.getByText('Hệ thống').closest('button');
    expect(sysBtn?.className).toContain('border-emerald-500');

    const lightBtn = screen.getByText('Sáng').closest('button');
    expect(lightBtn?.className).not.toContain('border-emerald-500');
  });

  it('non-active theme buttons do not have border-emerald-500', () => {
    render(<SettingsTab {...defaultProps} />);
    // system is active (from mock), so light and dark should NOT have the border
    const lightBtn = screen.getByText('Sáng').closest('button');
    const darkBtn = screen.getByText('Tối').closest('button');
    expect(lightBtn?.className).not.toContain('border-emerald-500');
    expect(darkBtn?.className).not.toContain('border-emerald-500');
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

  it('filters to theme section when searching for theme keyword', () => {
    render(<SettingsTab {...defaultProps} />);
    const searchInput = screen.getByTestId('settings-search');
    fireEvent.change(searchInput, { target: { value: 'Giao diện' } });
    expect(screen.getByText('Giao diện')).toBeInTheDocument();
    expect(screen.queryByText('Dữ liệu')).not.toBeInTheDocument();
  });
});
