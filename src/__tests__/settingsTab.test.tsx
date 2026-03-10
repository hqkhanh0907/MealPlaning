import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SettingsTab } from '../components/SettingsTab';
import i18n from '../i18n';
import type { Dish, Ingredient } from '../types';

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

const mockScanMissing = vi.fn();
vi.mock('../services/translateQueueService', () => ({
  useTranslateQueue: (selector: (s: { scanMissing: typeof mockScanMissing }) => unknown) =>
    selector({ scanMissing: mockScanMissing }),
}));

const mockDishes: Dish[] = [];
const mockIngredients: Ingredient[] = [];

afterEach(cleanup);

describe('SettingsTab', () => {
  const defaultProps = {
    onImportData: vi.fn(),
    dishes: mockDishes,
    ingredients: mockIngredients,
    theme: 'system' as const,
    setTheme: mockSetTheme,
  };

  it('renders settings title', () => {
    render(<SettingsTab {...defaultProps} />);
    expect(screen.getByText('Cài đặt')).toBeInTheDocument();
  });

  it('renders language section with both options', () => {
    render(<SettingsTab {...defaultProps} />);
    expect(screen.getByText('Ngôn ngữ')).toBeInTheDocument();
    expect(screen.getByText('Tiếng Việt')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('renders language description', () => {
    render(<SettingsTab {...defaultProps} />);
    expect(screen.getByText('Chọn ngôn ngữ hiển thị cho ứng dụng')).toBeInTheDocument();
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

  it('highlights active Vietnamese language button', () => {
    render(<SettingsTab {...defaultProps} />);
    const viBtn = screen.getByText('Tiếng Việt').closest('button');
    expect(viBtn?.className).toContain('border-emerald-500');

    const enBtn = screen.getByText('English').closest('button');
    expect(enBtn?.className).not.toContain('border-emerald-500');
  });

  it('switches language to English when clicked', () => {
    render(<SettingsTab {...defaultProps} />);
    const enBtn = screen.getByText('English').closest('button');
    expect(enBtn).toBeTruthy();
    if (enBtn) fireEvent.click(enBtn);
    expect(i18n.language).toBe('en');
    expect(mockScanMissing).toHaveBeenCalledWith(mockDishes, mockIngredients, 'en');
    // Restore
    i18n.changeLanguage('vi');
  });

  it('switches language to Vietnamese when clicked', () => {
    i18n.changeLanguage('en');
    render(<SettingsTab {...defaultProps} />);
    const viBtn = screen.getByText('Tiếng Việt').closest('button') ?? screen.getByText('Vietnamese').closest('button');
    expect(viBtn).toBeTruthy();
    if (viBtn) fireEvent.click(viBtn);
    expect(i18n.language).toBe('vi');
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

  it('shows flag emojis for language options', () => {
    render(<SettingsTab {...defaultProps} />);
    expect(screen.getByText('🇻🇳')).toBeInTheDocument();
    expect(screen.getByText('🇬🇧')).toBeInTheDocument();
  });

  it('highlights active system theme button', () => {
    render(<SettingsTab {...defaultProps} />);
    const sysBtn = screen.getByText('Hệ thống').closest('button');
    expect(sysBtn?.className).toContain('border-emerald-500');

    const lightBtn = screen.getByText('Sáng').closest('button');
    expect(lightBtn?.className).not.toContain('border-emerald-500');
  });

  it('shows English labels after switching to English', async () => {
    await i18n.changeLanguage('en');
    cleanup();
    render(<SettingsTab {...defaultProps} />);
    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
    await i18n.changeLanguage('vi');
  });

  it('restores Vietnamese labels after switching back from English', async () => {
    await i18n.changeLanguage('en');
    cleanup();
    await i18n.changeLanguage('vi');
    render(<SettingsTab {...defaultProps} />);
    expect(screen.getByText('Ngôn ngữ')).toBeInTheDocument();
    expect(screen.getByText('Giao diện')).toBeInTheDocument();
    expect(screen.getByText('Dữ liệu')).toBeInTheDocument();
  });

  it('non-active theme buttons do not have border-emerald-500', () => {
    render(<SettingsTab {...defaultProps} />);
    // system is active (from mock), so light and dark should NOT have the border
    const lightBtn = screen.getByText('Sáng').closest('button');
    const darkBtn = screen.getByText('Tối').closest('button');
    expect(lightBtn?.className).not.toContain('border-emerald-500');
    expect(darkBtn?.className).not.toContain('border-emerald-500');
  });
});
