import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DataBackup } from '../components/DataBackup';

const mockNotify = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismissAll: vi.fn() };
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => mockNotify,
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
  Encoding: { UTF8: 'utf8' },
}));

vi.mock('@capacitor/share', () => ({
  Share: { share: (...args: unknown[]) => mockShare(...args) },
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockIsNative = false;
});

describe('DataBackup', () => {
  it('renders export and import buttons', () => {
    render(<DataBackup onImport={vi.fn()} />);
    expect(screen.getByText('Xuất dữ liệu')).toBeInTheDocument();
    expect(screen.getByText('Nhập dữ liệu')).toBeInTheDocument();
  });

  it('exports localStorage data as JSON download', () => {
    localStorage.setItem('mp-dishes', JSON.stringify([{ id: 'd1' }]));
    localStorage.setItem('mp-ingredients', JSON.stringify([{ id: 'i1' }]));

    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
    const mockRevokeObjectURL = vi.fn();
    globalThis.URL.createObjectURL = mockCreateObjectURL;
    globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

    // Spy on anchor click via HTMLAnchorElement prototype
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<DataBackup onImport={vi.fn()} />);
    fireEvent.click(screen.getByText('Xuất dữ liệu'));

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
    expect(mockNotify.success).toHaveBeenCalledWith('Xuất dữ liệu thành công!', expect.any(String));

    clickSpy.mockRestore();
  });

  it('exports via Filesystem + Share on native platform', async () => {
    mockIsNative = true;
    localStorage.setItem('mp-dishes', JSON.stringify([{ id: 'd1' }]));

    render(<DataBackup onImport={vi.fn()} />);
    fireEvent.click(screen.getByText('Xuất dữ liệu'));

    await waitFor(() => {
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.objectContaining({
          directory: 'CACHE',
          encoding: 'utf8',
        }),
      );
      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'file:///cache/backup.json' }),
      );
      expect(mockNotify.success).toHaveBeenCalledWith('Xuất dữ liệu thành công!', expect.any(String));
    });
  });

  it('shows error when native export fails', async () => {
    mockIsNative = true;
    mockWriteFile.mockRejectedValueOnce(new Error('write failed'));

    render(<DataBackup onImport={vi.fn()} />);
    fireEvent.click(screen.getByText('Xuất dữ liệu'));

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith('Xuất thất bại', expect.any(String));
    });
  });

  it('shows error notification when export fails', () => {
    // Force localStorage.getItem to throw
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('fail'); });

    render(<DataBackup onImport={vi.fn()} />);
    fireEvent.click(screen.getByText('Xuất dữ liệu'));

    expect(mockNotify.error).toHaveBeenCalledWith('Xuất thất bại', expect.any(String));
    vi.restoreAllMocks();
  });

  it('imports valid JSON file', async () => {
    const onImport = vi.fn();
    render(<DataBackup onImport={onImport} />);

    const fileContent = JSON.stringify({ 'mp-dishes': [{ id: 'd1' }] });
    const file = new File([fileContent], 'backup.json', { type: 'application/json' });

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
      expect(onImport).toHaveBeenCalledWith(expect.objectContaining({ 'mp-dishes': [{ id: 'd1' }] }));
    });
  });

  it('shows error for file without valid keys', async () => {
    const onImport = vi.fn();
    render(<DataBackup onImport={onImport} />);

    const fileContent = JSON.stringify({ 'invalid-key': true });
    const file = new File([fileContent], 'bad.json', { type: 'application/json' });

    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).toBeTruthy();

    await waitFor(() => {
      if (input) fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith('File không hợp lệ', expect.any(String));
    });
    expect(onImport).not.toHaveBeenCalled();
  });

  it('shows error for invalid JSON file', async () => {
    render(<DataBackup onImport={vi.fn()} />);
    const file = new File(['not json at all'], 'bad.json', { type: 'application/json' });
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).toBeTruthy();

    await waitFor(() => {
      if (input) fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith('Nhập thất bại', expect.any(String));
    });
  });

  it('does nothing when no file is selected', async () => {
    const onImport = vi.fn();
    render(<DataBackup onImport={onImport} />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();
    if (input) fireEvent.change(input, { target: { files: [] } });

    expect(onImport).not.toHaveBeenCalled();
    expect(mockNotify.error).not.toHaveBeenCalled();
  });

  it('imports partial data with only mp-dishes key', async () => {
    const onImport = vi.fn();
    render(<DataBackup onImport={onImport} />);

    const partialData = { 'mp-dishes': [{ id: 'd1', name: 'Phở' }] };
    const file = new File([JSON.stringify(partialData)], 'partial.json', { type: 'application/json' });

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
      expect(onImport).toHaveBeenCalledWith(expect.objectContaining({ 'mp-dishes': [{ id: 'd1', name: 'Phở' }] }));
    });
    expect(mockNotify.error).not.toHaveBeenCalled();
  });

  it('cancels import when user dismisses confirmation dialog', async () => {
    const onImport = vi.fn();
    render(<DataBackup onImport={onImport} />);

    const fileContent = JSON.stringify({ 'mp-dishes': [{ id: 'd1' }] });
    const file = new File([fileContent], 'backup.json', { type: 'application/json' });

    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();

    await waitFor(() => {
      if (input) fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('btn-cancel-action')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('btn-cancel-action'));

    expect(onImport).not.toHaveBeenCalled();
  });

  it('clicks import button which triggers fileInput click (line 121)', () => {
    render(<DataBackup onImport={vi.fn()} />);
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).not.toBeNull();
    if (!fileInput) return;
    const clickSpy = vi.spyOn(fileInput, 'click');
    fireEvent.click(screen.getByText('Nhập dữ liệu'));
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('exports successfully even when localStorage is empty', () => {
    // localStorage is already cleared in beforeEach
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:empty');
    const mockRevokeObjectURL = vi.fn();
    globalThis.URL.createObjectURL = mockCreateObjectURL;
    globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<DataBackup onImport={vi.fn()} />);
    fireEvent.click(screen.getByText('Xuất dữ liệu'));

    // Should still create a blob with metadata only (_exportedAt, _version)
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(mockNotify.success).toHaveBeenCalledWith('Xuất dữ liệu thành công!', expect.any(String));

    clickSpy.mockRestore();
  });

  describe('backup health indicator', () => {
    it('shows critical status when never backed up', () => {
      render(<DataBackup onImport={vi.fn()} />);
      const health = screen.getByTestId('backup-health');
      expect(health).toBeInTheDocument();
      expect(health.textContent).toContain('Chưa từng sao lưu');
    });

    it('shows good status when backed up today', () => {
      localStorage.setItem('mp-last-local-backup-at', new Date().toISOString());
      render(<DataBackup onImport={vi.fn()} />);
      const health = screen.getByTestId('backup-health');
      expect(health.className).toContain('emerald');
    });

    it('shows warning status when backed up 5 days ago', () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem('mp-last-local-backup-at', fiveDaysAgo);
      render(<DataBackup onImport={vi.fn()} />);
      const health = screen.getByTestId('backup-health');
      expect(health.className).toContain('amber');
    });

    it('shows critical status when backed up 10 days ago', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem('mp-last-local-backup-at', tenDaysAgo);
      render(<DataBackup onImport={vi.fn()} />);
      const health = screen.getByTestId('backup-health');
      expect(health.className).toContain('rose');
    });

    it('considers cloud sync time for health status', () => {
      localStorage.setItem('mp-last-sync-at', new Date().toISOString());
      render(<DataBackup onImport={vi.fn()} />);
      const health = screen.getByTestId('backup-health');
      expect(health.className).toContain('emerald');
    });

    it('updates last backup timestamp after successful export', () => {
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
      const mockRevokeObjectURL = vi.fn();
      globalThis.URL.createObjectURL = mockCreateObjectURL;
      globalThis.URL.revokeObjectURL = mockRevokeObjectURL;
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      render(<DataBackup onImport={vi.fn()} />);
      fireEvent.click(screen.getByText('Xuất dữ liệu'));
      expect(localStorage.getItem('mp-last-local-backup-at')).not.toBeNull();

      clickSpy.mockRestore();
    });
  });
});
