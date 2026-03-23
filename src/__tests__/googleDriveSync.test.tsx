import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { GoogleDriveSync } from '../components/GoogleDriveSync';

// Mock useAuth
const mockSignIn = vi.fn();
const mockSignOut = vi.fn().mockResolvedValue(undefined);
const mockAuthState = {
  user: null as { id: string; email: string; displayName: string; photoUrl: string | null } | null,
  accessToken: null as string | null,
  isLoading: false,
  isInitialized: true,
  signIn: mockSignIn,
  signOut: mockSignOut,
};

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

// Mock NotificationContext
const mockNotify = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismissAll: vi.fn() };
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => mockNotify,
}));

// Mock driveService
const mockUploadBackup = vi.fn();
const mockDownloadLatestBackup = vi.fn();
vi.mock('../services/googleDriveService', () => ({
  uploadBackup: (...args: unknown[]) => mockUploadBackup(...args),
  downloadLatestBackup: (...args: unknown[]) => mockDownloadLatestBackup(...args),
}));

const mockUser = {
  id: 'user123',
  email: 'test@gmail.com',
  displayName: 'Test User',
  photoUrl: 'https://photo.url/avatar.jpg',
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockAuthState.user = null;
  mockAuthState.accessToken = null;
  mockAuthState.isLoading = false;
  mockAuthState.isInitialized = true;
});

describe('GoogleDriveSync', () => {
  const onImportData = vi.fn();

  describe('Signed out state', () => {
    it('renders signed-out view when no user', () => {
      render(<GoogleDriveSync onImportData={onImportData} />);
      expect(screen.getByTestId('cloud-sync-signed-out')).toBeInTheDocument();
    });

    it('renders cloud sync title', () => {
      render(<GoogleDriveSync onImportData={onImportData} />);
      expect(screen.getByText('Đồng bộ đám mây')).toBeInTheDocument();
    });

    it('renders description text', () => {
      render(<GoogleDriveSync onImportData={onImportData} />);
      expect(screen.getByText('Đăng nhập Google để sao lưu và đồng bộ dữ liệu qua Google Drive')).toBeInTheDocument();
    });

    it('renders sign in button', () => {
      render(<GoogleDriveSync onImportData={onImportData} />);
      expect(screen.getByTestId('btn-google-sign-in')).toBeInTheDocument();
      expect(screen.getByText('Đăng nhập bằng Google')).toBeInTheDocument();
    });

    it('calls signIn on button click and shows success', async () => {
      mockSignIn.mockResolvedValueOnce(undefined);
      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-google-sign-in'));
      });
      expect(mockSignIn).toHaveBeenCalled();
      expect(mockNotify.success).toHaveBeenCalledWith('Đăng nhập thành công');
    });

    it('shows error notification when signIn fails', async () => {
      mockSignIn.mockRejectedValueOnce(new Error('fail'));
      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-google-sign-in'));
      });
      expect(mockNotify.error).toHaveBeenCalledWith('Đăng nhập thất bại. Vui lòng thử lại.');
    });

    it('disables sign-in button when auth is loading', () => {
      mockAuthState.isLoading = true;
      render(<GoogleDriveSync onImportData={onImportData} />);
      expect(screen.getByTestId('btn-google-sign-in')).toBeDisabled();
    });

    it('shows loader icon when auth is loading', () => {
      mockAuthState.isLoading = true;
      render(<GoogleDriveSync onImportData={onImportData} />);
      const btn = screen.getByTestId('btn-google-sign-in');
      expect(btn.querySelector('.animate-spin')).toBeTruthy();
    });

    it('shows Google SVG icon when not loading', () => {
      render(<GoogleDriveSync onImportData={onImportData} />);
      const btn = screen.getByTestId('btn-google-sign-in');
      expect(btn.querySelector('svg')).toBeTruthy();
    });
  });

  describe('Signed in state', () => {
    beforeEach(() => {
      mockAuthState.user = mockUser;
      mockAuthState.accessToken = 'test-token';
    });

    it('renders signed-in view when user exists', () => {
      render(<GoogleDriveSync onImportData={onImportData} />);
      expect(screen.getByTestId('cloud-sync-signed-in')).toBeInTheDocument();
    });

    it('renders user email', () => {
      render(<GoogleDriveSync onImportData={onImportData} />);
      expect(screen.getByText('test@gmail.com')).toBeInTheDocument();
    });

    it('renders user avatar when photoUrl exists', () => {
      render(<GoogleDriveSync onImportData={onImportData} />);
      const img = screen.getByAltText('');
      expect(img).toBeInTheDocument();
      expect(img.getAttribute('src')).toBe('https://photo.url/avatar.jpg');
    });

    it('does not render avatar when photoUrl is null', () => {
      mockAuthState.user = { ...mockUser, photoUrl: null };
      render(<GoogleDriveSync onImportData={onImportData} />);
      expect(screen.queryByAltText('')).not.toBeInTheDocument();
    });

    it('renders upload and download buttons', () => {
      render(<GoogleDriveSync onImportData={onImportData} />);
      expect(screen.getByTestId('btn-upload-drive')).toBeInTheDocument();
      expect(screen.getByTestId('btn-download-drive')).toBeInTheDocument();
      expect(screen.getByText('Tải lên Drive')).toBeInTheDocument();
      expect(screen.getByText('Tải xuống từ Drive')).toBeInTheDocument();
    });

    it('renders sign out button', () => {
      render(<GoogleDriveSync onImportData={onImportData} />);
      expect(screen.getByTestId('btn-google-sign-out')).toBeInTheDocument();
      expect(screen.getByText('Đăng xuất')).toBeInTheDocument();
    });

    it('signs out and clears last sync', async () => {
      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-google-sign-out'));
      });
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockNotify.success).toHaveBeenCalledWith('Đã đăng xuất');
    });

    it('clears lastSyncAt from localStorage on sign out', async () => {
      localStorage.setItem('mp-last-sync-at', '2024-01-01T00:00:00Z');
      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-google-sign-out'));
      });
      expect(localStorage.getItem('mp-last-sync-at')).toBeNull();
    });
  });

  describe('Upload', () => {
    beforeEach(() => {
      mockAuthState.user = mockUser;
      mockAuthState.accessToken = 'test-token';
      localStorage.clear();
    });

    it('uploads backup data to Drive', async () => {
      localStorage.setItem('mp-dishes', JSON.stringify([{ id: 'd1' }]));
      mockUploadBackup.mockResolvedValueOnce({ id: 'file1', name: 'backup.json', modifiedTime: '2024-01-01T00:00:00Z' });

      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-upload-drive'));
      });

      expect(mockUploadBackup).toHaveBeenCalledWith('test-token', expect.objectContaining({
        'mp-dishes': [{ id: 'd1' }],
        _version: '1.0',
      }));
      expect(mockNotify.success).toHaveBeenCalledWith('Dữ liệu đã tải lên Google Drive');
    });

    it('shows error notification on upload failure', async () => {
      mockUploadBackup.mockRejectedValueOnce(new Error('upload failed'));

      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-upload-drive'));
      });

      expect(mockNotify.error).toHaveBeenCalledWith('Tải lên thất bại. Vui lòng thử lại.');
    });

    it('shows last sync time after successful upload', async () => {
      mockUploadBackup.mockResolvedValueOnce({ id: 'f1', name: 'b.json', modifiedTime: '2024-01-01T00:00:00Z' });

      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-upload-drive'));
      });

      expect(screen.getByText(/Đồng bộ lần cuối/)).toBeInTheDocument();
    });

    it('does not upload when accessToken is null', async () => {
      mockAuthState.accessToken = null;
      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-upload-drive'));
      });
      expect(mockUploadBackup).not.toHaveBeenCalled();
    });

    it('disables buttons during upload', async () => {
      let resolveUpload: (v: unknown) => void = () => {};
      mockUploadBackup.mockImplementation(() => new Promise(r => { resolveUpload = r; }));

      render(<GoogleDriveSync onImportData={onImportData} />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-upload-drive'));
      });

      expect(screen.getByTestId('btn-upload-drive')).toBeDisabled();
      expect(screen.getByTestId('btn-download-drive')).toBeDisabled();

      await act(async () => {
        resolveUpload({ id: 'f1', name: 'b.json', modifiedTime: '2024-01-01T00:00:00Z' });
      });
    });

    it('builds export data with only existing localStorage keys', async () => {
      mockUploadBackup.mockResolvedValueOnce({ id: 'f1', name: 'b.json', modifiedTime: '2024-01-01T00:00:00Z' });

      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-upload-drive'));
      });

      const callData = mockUploadBackup.mock.calls[0][1] as Record<string, unknown>;
      expect(callData._syncedAt).toBeDefined();
      expect(callData._version).toBe('1.0');
      expect(callData['mp-dishes']).toBeUndefined();
    });

    it('shows error status icon after upload failure', async () => {
      mockUploadBackup.mockRejectedValueOnce(new Error('fail'));

      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-upload-drive'));
      });

      expect(screen.getByText('Lỗi đồng bộ')).toBeInTheDocument();
    });

    it('persists lastSyncAt to localStorage using Drive modifiedTime', async () => {
      mockUploadBackup.mockResolvedValueOnce({ id: 'f1', name: 'b.json', modifiedTime: '2024-06-15T10:30:00Z' });

      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-upload-drive'));
      });

      expect(localStorage.getItem('mp-last-sync-at')).toBe('2024-06-15T10:30:00Z');
    });
  });

  describe('Download', () => {
    beforeEach(() => {
      mockAuthState.user = mockUser;
      mockAuthState.accessToken = 'test-token';
      localStorage.clear();
    });

    it('downloads and imports backup data', async () => {
      const remoteData = { 'mp-dishes': [{ id: 'd1' }], _syncedAt: '2024-01-15T10:00:00Z' };
      mockDownloadLatestBackup.mockResolvedValueOnce({
        data: remoteData,
        file: { id: 'f1', name: 'b.json', modifiedTime: '2099-01-01T00:00:00Z' },
      });

      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      expect(onImportData).toHaveBeenCalledWith(remoteData);
      expect(mockNotify.success).toHaveBeenCalledWith('Dữ liệu đã tải xuống từ Google Drive');
    });

    it('shows warning when no backup found', async () => {
      mockDownloadLatestBackup.mockResolvedValueOnce(null);

      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      expect(mockNotify.warning).toHaveBeenCalledWith('Không tìm thấy bản sao lưu trên Google Drive');
      expect(onImportData).not.toHaveBeenCalled();
    });

    it('shows error notification on download failure', async () => {
      mockDownloadLatestBackup.mockRejectedValueOnce(new Error('download failed'));

      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      expect(mockNotify.error).toHaveBeenCalledWith('Tải xuống thất bại. Vui lòng thử lại.');
    });

    it('does not download when accessToken is null', async () => {
      mockAuthState.accessToken = null;
      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });
      expect(mockDownloadLatestBackup).not.toHaveBeenCalled();
    });

    it('shows conflict modal when local data is newer than remote', async () => {
      localStorage.setItem('mp-dishes', JSON.stringify([{ id: 'local' }]));
      localStorage.setItem('mp-last-sync-at', '2025-01-01T00:00:00Z');
      mockDownloadLatestBackup.mockResolvedValueOnce({
        data: { 'mp-dishes': [{ id: 'remote' }] },
        file: { id: 'f1', name: 'b.json', modifiedTime: '2020-01-01T00:00:00Z' },
      });

      render(<GoogleDriveSync onImportData={onImportData} />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('sync-conflict-modal')).toBeInTheDocument();
      });
    });

    it('imports remote data when choosing cloud in conflict modal', async () => {
      localStorage.setItem('mp-dishes', JSON.stringify([{ id: 'local' }]));
      localStorage.setItem('mp-last-sync-at', '2025-01-01T00:00:00Z');

      const remoteData = { 'mp-dishes': [{ id: 'remote' }] };
      mockDownloadLatestBackup.mockResolvedValueOnce({
        data: remoteData,
        file: { id: 'f1', name: 'b.json', modifiedTime: '2020-01-01T00:00:00Z' },
      });

      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('sync-conflict-modal')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-use-cloud'));
      });

      expect(onImportData).toHaveBeenCalledWith(remoteData);
      expect(mockNotify.success).toHaveBeenCalledWith('Dữ liệu đã tải xuống từ Google Drive');
    });

    it('keeps local data when choosing local in conflict modal', async () => {
      localStorage.setItem('mp-dishes', JSON.stringify([{ id: 'local' }]));
      localStorage.setItem('mp-last-sync-at', '2025-01-01T00:00:00Z');
      mockDownloadLatestBackup.mockResolvedValueOnce({
        data: { 'mp-dishes': [{ id: 'remote' }] },
        file: { id: 'f1', name: 'b.json', modifiedTime: '2020-01-01T00:00:00Z' },
      });

      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('sync-conflict-modal')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-keep-local'));
      });

      expect(onImportData).not.toHaveBeenCalled();
      expect(screen.queryByTestId('sync-conflict-modal')).not.toBeInTheDocument();
    });

    it('closes conflict modal on cancel', async () => {
      localStorage.setItem('mp-dishes', JSON.stringify([{ id: 'local' }]));
      localStorage.setItem('mp-last-sync-at', '2025-01-01T00:00:00Z');
      mockDownloadLatestBackup.mockResolvedValueOnce({
        data: { 'mp-dishes': [{ id: 'remote' }] },
        file: { id: 'f1', name: 'b.json', modifiedTime: '2020-01-01T00:00:00Z' },
      });

      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('sync-conflict-modal')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-cancel-sync'));
      });

      expect(screen.queryByTestId('sync-conflict-modal')).not.toBeInTheDocument();
      expect(onImportData).not.toHaveBeenCalled();
    });

    it('imports directly when remote is newer (no conflict)', async () => {
      const remoteData = { 'mp-dishes': [{ id: 'remote' }], _syncedAt: '2020-01-01T00:00:00Z' };
      mockDownloadLatestBackup.mockResolvedValueOnce({
        data: remoteData,
        file: { id: 'f1', name: 'b.json', modifiedTime: '2099-12-31T23:59:59Z' },
      });

      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      expect(onImportData).toHaveBeenCalledWith(remoteData);
      expect(screen.queryByTestId('sync-conflict-modal')).not.toBeInTheDocument();
    });

    it('imports directly when local has no stored data', async () => {
      const remoteData = { 'mp-dishes': [{ id: 'remote' }] };
      mockDownloadLatestBackup.mockResolvedValueOnce({
        data: remoteData,
        file: { id: 'f1', name: 'b.json', modifiedTime: '2099-12-31T23:59:59Z' },
      });

      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      expect(onImportData).toHaveBeenCalledWith(remoteData);
    });

    it('does not show conflict after upload then immediate download', async () => {
      localStorage.setItem('mp-dishes', JSON.stringify([{ id: 'd1' }]));
      const driveModifiedTime = '2024-06-15T10:30:00Z';
      mockUploadBackup.mockResolvedValueOnce({ id: 'f1', name: 'b.json', modifiedTime: driveModifiedTime });

      render(<GoogleDriveSync onImportData={onImportData} />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-upload-drive'));
      });

      expect(localStorage.getItem('mp-last-sync-at')).toBe(driveModifiedTime);

      const remoteData = { 'mp-dishes': [{ id: 'd1' }] };
      mockDownloadLatestBackup.mockResolvedValueOnce({
        data: remoteData,
        file: { id: 'f1', name: 'b.json', modifiedTime: driveModifiedTime },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      expect(onImportData).toHaveBeenCalledWith(remoteData);
      expect(screen.queryByTestId('sync-conflict-modal')).not.toBeInTheDocument();
    });

    it('persists remote modifiedTime as lastSyncAt after download', async () => {
      const remoteData = { 'mp-dishes': [{ id: 'remote' }] };
      mockDownloadLatestBackup.mockResolvedValueOnce({
        data: remoteData,
        file: { id: 'f1', name: 'b.json', modifiedTime: '2024-07-20T15:00:00Z' },
      });

      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      expect(localStorage.getItem('mp-last-sync-at')).toBe('2024-07-20T15:00:00Z');
    });
  });

  describe('Status display', () => {
    beforeEach(() => {
      mockAuthState.user = mockUser;
      mockAuthState.accessToken = 'test-token';
      localStorage.clear();
    });

    it('does not show status when idle and no sync yet', () => {
      render(<GoogleDriveSync onImportData={onImportData} />);
      expect(screen.queryByText(/Đồng bộ lần cuối/)).not.toBeInTheDocument();
      expect(screen.queryByText('Lỗi đồng bộ')).not.toBeInTheDocument();
    });

    it('shows green check icon after successful sync', async () => {
      mockUploadBackup.mockResolvedValueOnce({ id: 'f1', name: 'b.json', modifiedTime: '2024-01-01T00:00:00Z' });

      render(<GoogleDriveSync onImportData={onImportData} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-upload-drive'));
      });

      expect(screen.getByText(/Đồng bộ lần cuối/)).toBeInTheDocument();
    });
  });
});
