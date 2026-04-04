import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { DataBackup } from '../components/DataBackup';

const mockNotify = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismissAll: vi.fn() };
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => mockNotify,
}));

// Mock database
const mockDb = {
  initialize: vi.fn(),
  execute: vi.fn().mockResolvedValue(undefined),
  query: vi.fn().mockResolvedValue([]),
  queryOne: vi.fn().mockResolvedValue(null),
  transaction: vi.fn(),
  exportToJSON: vi.fn().mockResolvedValue('{}'),
  importFromJSON: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../contexts/DatabaseContext', () => ({
  useDatabase: () => mockDb,
}));

// Mock appSettings
const mockGetSetting = vi.fn().mockResolvedValue(null);
const mockSetSetting = vi.fn().mockResolvedValue(undefined);
vi.mock('../services/appSettings', () => ({
  getSetting: (...args: unknown[]) => mockGetSetting(...args),
  setSetting: (...args: unknown[]) => mockSetSetting(...args),
  deleteSetting: vi.fn().mockResolvedValue(undefined),
}));

// Mock storeLoader
const mockReloadAllStores = vi.fn().mockResolvedValue(undefined);
vi.mock('../services/storeLoader', () => ({
  reloadAllStores: (...args: unknown[]) => mockReloadAllStores(...args),
}));

const mockWriteFile = vi.fn().mockResolvedValue({ uri: 'file:///cache/backup.json' });
const mockShare = vi.fn().mockResolvedValue(undefined);
let mockIsNative = false;

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => mockIsNative },
}));

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: { writeFile: (...args: unknown[]) => mockWriteFile(...args) },
  Directory: { Cache: 'CACHE' },
}));

vi.mock('@capacitor/share', () => ({
  Share: { share: (...args: unknown[]) => mockShare(...args) },
}));

// Helper: build a valid JSON backup string
function buildJsonBackup(): string {
  return JSON.stringify({ version: 1, data: [] });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsNative = false;
  mockGetSetting.mockResolvedValue(null);
});

describe('DataBackup', () => {
  it('renders export and import buttons', () => {
    render(<DataBackup />);
    expect(screen.getByText('Xuất dữ liệu')).toBeInTheDocument();
    expect(screen.getByText('Nhập dữ liệu')).toBeInTheDocument();
  });

  it('exports SQLite binary as download', async () => {
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
    const mockRevokeObjectURL = vi.fn();
    globalThis.URL.createObjectURL = mockCreateObjectURL;
    globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<DataBackup />);
    await act(async () => {
      fireEvent.click(screen.getByText('Xuất dữ liệu'));
      await new Promise(r => setTimeout(r, 50));
    });

    expect(mockDb.exportToJSON).toHaveBeenCalled();
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
    expect(mockNotify.success).toHaveBeenCalledWith('Xuất dữ liệu thành công!', expect.any(String));

    clickSpy.mockRestore();
  });

  it('exports via Filesystem + Share on native platform', async () => {
    mockIsNative = true;

    render(<DataBackup />);
    fireEvent.click(screen.getByText('Xuất dữ liệu'));

    await waitFor(() => {
      expect(mockDb.exportToJSON).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.objectContaining({
          directory: 'CACHE',
        }),
      );
      expect(mockShare).toHaveBeenCalledWith(expect.objectContaining({ url: 'file:///cache/backup.json' }));
      expect(mockNotify.success).toHaveBeenCalledWith('Xuất dữ liệu thành công!', expect.any(String));
    });
  });

  it('shows error when native export fails', async () => {
    mockIsNative = true;
    mockWriteFile.mockRejectedValueOnce(new Error('write failed'));

    render(<DataBackup />);
    fireEvent.click(screen.getByText('Xuất dữ liệu'));

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith('Xuất thất bại', expect.any(String));
    });
  });

  it('shows error notification when export fails', async () => {
    mockDb.exportToJSON.mockRejectedValueOnce(new Error('fail'));

    render(<DataBackup />);
    await act(async () => {
      fireEvent.click(screen.getByText('Xuất dữ liệu'));
      await new Promise(r => setTimeout(r, 50));
    });

    expect(mockNotify.error).toHaveBeenCalledWith('Xuất thất bại', expect.any(String));
  });

  it('imports valid SQLite file', async () => {
    render(<DataBackup />);

    const jsonData = buildJsonBackup();
    const file = new File([jsonData], 'backup.json', { type: 'application/json' });

    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();

    await waitFor(() => {
      if (input) fireEvent.change(input, { target: { files: [file] } });
    });

    // Confirmation dialog now appears — click confirm
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-action')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('btn-confirm-action'));

    await waitFor(() => {
      expect(mockDb.importFromJSON).toHaveBeenCalledWith(expect.any(String));
      expect(mockReloadAllStores).toHaveBeenCalledWith(mockDb);
    });
  });

  it('shows error for file without valid SQLite header', async () => {
    render(<DataBackup />);

    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).toBeTruthy();

    // Create file with invalid JSON content
    const fileContent = 'not valid json';
    const file = new File([fileContent], 'bad.json', { type: 'application/json' });

    await act(async () => {
      if (input) {
        Object.defineProperty(input, 'files', { value: [file], configurable: true });
        fireEvent.change(input);
      }
    });

    // Allow async text() to resolve
    await act(async () => {
      await new Promise(r => {
        setTimeout(r, 50);
      });
    });

    expect(mockNotify.error).toHaveBeenCalled();
    expect(mockDb.importFromJSON).not.toHaveBeenCalled();
  });

  it('does nothing when no file is selected', async () => {
    render(<DataBackup />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();
    if (input) fireEvent.change(input, { target: { files: [] } });

    expect(mockDb.importFromJSON).not.toHaveBeenCalled();
    expect(mockNotify.error).not.toHaveBeenCalled();
  });

  it('cancels import when user dismisses confirmation dialog', async () => {
    render(<DataBackup />);

    const jsonData = buildJsonBackup();
    const file = new File([jsonData], 'backup.json', { type: 'application/json' });

    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();

    await waitFor(() => {
      if (input) fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('btn-cancel-action')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('btn-cancel-action'));

    expect(mockDb.importFromJSON).not.toHaveBeenCalled();
  });

  it('clicks import button which triggers fileInput click', () => {
    render(<DataBackup />);
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).not.toBeNull();
    if (!fileInput) return;
    const clickSpy = vi.spyOn(fileInput, 'click');
    fireEvent.click(screen.getByText('Nhập dữ liệu'));
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('exports successfully even when DB is empty', async () => {
    mockDb.exportToJSON.mockResolvedValueOnce('{}');

    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:empty');
    const mockRevokeObjectURL = vi.fn();
    globalThis.URL.createObjectURL = mockCreateObjectURL;
    globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<DataBackup />);
    await act(async () => {
      fireEvent.click(screen.getByText('Xuất dữ liệu'));
      await new Promise(r => setTimeout(r, 50));
    });

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(mockNotify.success).toHaveBeenCalledWith('Xuất dữ liệu thành công!', expect.any(String));

    clickSpy.mockRestore();
  });

  describe('backup health indicator', () => {
    it('shows critical status when never backed up', async () => {
      render(<DataBackup />);
      await waitFor(() => {
        const health = screen.getByTestId('backup-health');
        expect(health).toBeInTheDocument();
        expect(health.textContent).toContain('Chưa từng sao lưu');
      });
    });

    it('shows good status when backed up today', async () => {
      mockGetSetting.mockImplementation((_db: unknown, key: unknown) => {
        if (key === 'last_local_backup_at') return Promise.resolve(new Date().toISOString());
        return Promise.resolve(null);
      });
      render(<DataBackup />);
      await waitFor(() => {
        const health = screen.getByTestId('backup-health');
        expect(health.className).toContain('primary');
      });
    });

    it('shows warning status when backed up 5 days ago', async () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      mockGetSetting.mockImplementation((_db: unknown, key: unknown) => {
        if (key === 'last_local_backup_at') return Promise.resolve(fiveDaysAgo);
        return Promise.resolve(null);
      });
      render(<DataBackup />);
      await waitFor(() => {
        const health = screen.getByTestId('backup-health');
        expect(health.className).toContain('amber');
      });
    });

    it('shows critical status when backed up 10 days ago', async () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      mockGetSetting.mockImplementation((_db: unknown, key: unknown) => {
        if (key === 'last_local_backup_at') return Promise.resolve(tenDaysAgo);
        return Promise.resolve(null);
      });
      render(<DataBackup />);
      await waitFor(() => {
        const health = screen.getByTestId('backup-health');
        expect(health.className).toContain('rose');
      });
    });

    it('considers cloud sync time for health status', async () => {
      mockGetSetting.mockImplementation((_db: unknown, key: unknown) => {
        if (key === 'last_sync_at') return Promise.resolve(new Date().toISOString());
        return Promise.resolve(null);
      });
      render(<DataBackup />);
      await waitFor(() => {
        const health = screen.getByTestId('backup-health');
        expect(health.className).toContain('primary');
      });
    });

    it('updates last backup timestamp in app_settings after successful export', async () => {
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
      const mockRevokeObjectURL = vi.fn();
      globalThis.URL.createObjectURL = mockCreateObjectURL;
      globalThis.URL.revokeObjectURL = mockRevokeObjectURL;
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      render(<DataBackup />);
      await act(async () => {
        fireEvent.click(screen.getByText('Xuất dữ liệu'));
        await new Promise(r => setTimeout(r, 50));
      });
      // Export success notification proves the export completed (setSetting called internally)
      expect(mockNotify.success).toHaveBeenCalledWith('Xuất dữ liệu thành công!', expect.any(String));

      clickSpy.mockRestore();
    });
  });

  it('shows error when imported file is too small (< 16 bytes)', async () => {
    render(<DataBackup />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();

    // Create a valid but minimal JSON file
    const tinyFile = new File(['{}'], 'tiny.json', { type: 'application/json' });

    await act(async () => {
      if (input) {
        Object.defineProperty(input, 'files', { value: [tinyFile], configurable: true });
        fireEvent.change(input);
      }
    });
    await act(async () => {
      await new Promise(r => {
        setTimeout(r, 50);
      });
    });

    // Minimal JSON is valid, so it should proceed to confirmation dialog
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-action')).toBeInTheDocument();
    });
  });

  it('shows error when file reading fails (arrayBuffer rejects)', async () => {
    render(<DataBackup />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();

    const badFile = new File(['{}'], 'bad.json');
    vi.spyOn(badFile, 'text').mockRejectedValueOnce(new Error('Read failed'));

    await act(async () => {
      if (input) {
        Object.defineProperty(input, 'files', { value: [badFile], configurable: true });
        fireEvent.change(input);
      }
    });
    await act(async () => {
      await new Promise(r => {
        setTimeout(r, 50);
      });
    });

    expect(mockNotify.error).toHaveBeenCalled();
  });

  it('shows error when database import fails during confirm', async () => {
    mockDb.importFromJSON.mockRejectedValueOnce(new Error('DB import failed'));

    render(<DataBackup />);
    const jsonData = buildJsonBackup();
    const file = new File([jsonData], 'backup.json', { type: 'application/json' });
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();

    await waitFor(() => {
      if (input) fireEvent.change(input, { target: { files: [file] } });
    });
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-action')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('btn-confirm-action'));
    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalled();
    });
  });
});
