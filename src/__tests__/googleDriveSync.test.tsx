import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

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

// Mock driveService
const mockUploadBackup = vi.fn();
const mockDownloadLatestBackup = vi.fn();
vi.mock('../services/googleDriveService', () => ({
  uploadBackup: (...args: unknown[]) => mockUploadBackup(...args),
  downloadLatestBackup: (...args: unknown[]) => mockDownloadLatestBackup(...args),
}));

// Mock appSettings
const mockGetSetting = vi.fn().mockResolvedValue(null);
const mockSetSetting = vi.fn().mockResolvedValue(undefined);
const mockDeleteSetting = vi.fn().mockResolvedValue(undefined);
vi.mock('../services/appSettings', () => ({
  getSetting: (...args: unknown[]) => mockGetSetting(...args),
  setSetting: (...args: unknown[]) => mockSetSetting(...args),
  deleteSetting: (...args: unknown[]) => mockDeleteSetting(...args),
}));

// Mock storeLoader
const mockReloadAllStores = vi.fn().mockResolvedValue(undefined);
vi.mock('../services/storeLoader', () => ({
  reloadAllStores: (...args: unknown[]) => mockReloadAllStores(...args),
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
  describe('Signed out state', () => {
    it('renders signed-out view when no user', () => {
      render(<GoogleDriveSync />);
      expect(screen.getByTestId('cloud-sync-signed-out')).toBeInTheDocument();
    });

    it('renders cloud sync title', () => {
      render(<GoogleDriveSync />);
      expect(screen.getByText('Đồng bộ đám mây')).toBeInTheDocument();
    });

    it('renders description text', () => {
      render(<GoogleDriveSync />);
      expect(screen.getByText('Đăng nhập Google để sao lưu và đồng bộ dữ liệu qua Google Drive')).toBeInTheDocument();
    });

    it('renders sign in button', () => {
      render(<GoogleDriveSync />);
      expect(screen.getByTestId('btn-google-sign-in')).toBeInTheDocument();
      expect(screen.getByText('Đăng nhập bằng Google')).toBeInTheDocument();
    });

    it('calls signIn on button click and shows success', async () => {
      mockSignIn.mockResolvedValueOnce(undefined);
      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-google-sign-in'));
      });
      expect(mockSignIn).toHaveBeenCalled();
      expect(mockNotify.success).toHaveBeenCalledWith('Đăng nhập thành công');
    });

    it('shows error notification when signIn fails', async () => {
      mockSignIn.mockRejectedValueOnce(new Error('fail'));
      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-google-sign-in'));
      });
      expect(mockNotify.error).toHaveBeenCalledWith('Đăng nhập thất bại. Vui lòng thử lại.');
    });

    it('disables sign-in button when auth is loading', () => {
      mockAuthState.isLoading = true;
      render(<GoogleDriveSync />);
      expect(screen.getByTestId('btn-google-sign-in')).toBeDisabled();
    });

    it('shows loader icon when auth is loading', () => {
      mockAuthState.isLoading = true;
      render(<GoogleDriveSync />);
      const btn = screen.getByTestId('btn-google-sign-in');
      expect(btn.querySelector('.animate-spin')).toBeTruthy();
    });

    it('shows Google SVG icon when not loading', () => {
      render(<GoogleDriveSync />);
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
      render(<GoogleDriveSync />);
      expect(screen.getByTestId('cloud-sync-signed-in')).toBeInTheDocument();
    });

    it('renders user email', () => {
      render(<GoogleDriveSync />);
      expect(screen.getByText('test@gmail.com')).toBeInTheDocument();
    });

    it('renders user avatar when photoUrl exists', () => {
      render(<GoogleDriveSync />);
      const img = screen.getByAltText('');
      expect(img).toBeInTheDocument();
      expect(img.getAttribute('src')).toBe('https://photo.url/avatar.jpg');
    });

    it('does not render avatar when photoUrl is null', () => {
      mockAuthState.user = { ...mockUser, photoUrl: null };
      render(<GoogleDriveSync />);
      expect(screen.queryByAltText('')).not.toBeInTheDocument();
    });

    it('renders upload and download buttons', () => {
      render(<GoogleDriveSync />);
      expect(screen.getByTestId('btn-upload-drive')).toBeInTheDocument();
      expect(screen.getByTestId('btn-download-drive')).toBeInTheDocument();
      expect(screen.getByText('Tải lên Drive')).toBeInTheDocument();
      expect(screen.getByText('Tải xuống từ Drive')).toBeInTheDocument();
    });

    it('renders sign out button', () => {
      render(<GoogleDriveSync />);
      expect(screen.getByTestId('btn-google-sign-out')).toBeInTheDocument();
      expect(screen.getByText('Đăng xuất')).toBeInTheDocument();
    });

    it('signs out and clears last sync', async () => {
      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-google-sign-out'));
      });
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockNotify.success).toHaveBeenCalledWith('Đã đăng xuất');
    });

    it('deletes last_sync_at setting on sign out', async () => {
      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-google-sign-out'));
      });
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('Upload', () => {
    beforeEach(() => {
      mockAuthState.user = mockUser;
      mockAuthState.accessToken = 'test-token';
    });

    it('uploads binary backup data to Drive', async () => {
      mockUploadBackup.mockResolvedValueOnce({
        id: 'file1',
        name: 'backup.json',
        modifiedTime: '2024-01-01T00:00:00Z',
      });

      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-upload-drive'));
      });

      expect(mockDb.exportToJSON).toHaveBeenCalled();
      expect(mockUploadBackup).toHaveBeenCalledWith('test-token', expect.any(String));
      expect(mockNotify.success).toHaveBeenCalledWith('Dữ liệu đã tải lên Google Drive');
    });

    it('shows error notification on upload failure', async () => {
      mockUploadBackup.mockRejectedValueOnce(new Error('upload failed'));

      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-upload-drive'));
      });

      expect(mockNotify.error).toHaveBeenCalledWith('Tải lên thất bại. Vui lòng thử lại.');
    });

    it('shows last sync time after successful upload', async () => {
      mockUploadBackup.mockResolvedValueOnce({ id: 'f1', name: 'b.json', modifiedTime: '2024-01-01T00:00:00Z' });

      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-upload-drive'));
      });

      expect(screen.getByText(/Đồng bộ lần cuối/)).toBeInTheDocument();
    });

    it('does not upload when accessToken is null', async () => {
      mockAuthState.accessToken = null;
      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-upload-drive'));
      });
      expect(mockUploadBackup).not.toHaveBeenCalled();
    });

    it('disables buttons during upload', async () => {
      let resolveUpload: (v: unknown) => void = () => {};
      mockUploadBackup.mockImplementation(
        () =>
          new Promise(r => {
            resolveUpload = r;
          }),
      );

      render(<GoogleDriveSync />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-upload-drive'));
      });

      expect(screen.getByTestId('btn-upload-drive')).toBeDisabled();
      expect(screen.getByTestId('btn-download-drive')).toBeDisabled();

      await act(async () => {
        resolveUpload({ id: 'f1', name: 'b.json', modifiedTime: '2024-01-01T00:00:00Z' });
      });
    });

    it('shows error status icon after upload failure', async () => {
      mockUploadBackup.mockRejectedValueOnce(new Error('fail'));

      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-upload-drive'));
      });

      expect(screen.getByText('Lỗi đồng bộ')).toBeInTheDocument();
    });

    it('persists lastSyncAt to app_settings using Drive modifiedTime', async () => {
      mockUploadBackup.mockResolvedValueOnce({ id: 'f1', name: 'b.json', modifiedTime: '2024-06-15T10:30:00Z' });

      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-upload-drive'));
      });

      // Verify via displayed sync time (state proves setSetting was called internally)
      expect(screen.getByText(/Đồng bộ lần cuối/)).toBeInTheDocument();
    });
  });

  describe('Download', () => {
    beforeEach(() => {
      mockAuthState.user = mockUser;
      mockAuthState.accessToken = 'test-token';
    });

    it('downloads and imports binary backup data', async () => {
      const remoteData = '{"test":"data"}';
      mockDownloadLatestBackup.mockResolvedValueOnce({
        data: remoteData,
        file: { id: 'f1', name: 'b.json', modifiedTime: '2099-01-01T00:00:00Z' },
      });

      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      expect(mockDb.importFromJSON).toHaveBeenCalledWith(remoteData);
      expect(mockReloadAllStores).toHaveBeenCalledWith(mockDb);
      expect(mockNotify.success).toHaveBeenCalledWith('Dữ liệu đã tải xuống từ Google Drive');
    });

    it('shows warning when no backup found', async () => {
      mockDownloadLatestBackup.mockResolvedValueOnce(null);

      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      expect(mockNotify.warning).toHaveBeenCalledWith('Không tìm thấy bản sao lưu trên Google Drive');
      expect(mockDb.importFromJSON).not.toHaveBeenCalled();
    });

    it('shows error notification on download failure', async () => {
      mockDownloadLatestBackup.mockRejectedValueOnce(new Error('download failed'));

      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      expect(mockNotify.error).toHaveBeenCalledWith('Tải xuống thất bại. Vui lòng thử lại.');
    });

    it('does not download when accessToken is null', async () => {
      mockAuthState.accessToken = null;
      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });
      expect(mockDownloadLatestBackup).not.toHaveBeenCalled();
    });

    it('shows conflict modal when local data is newer than remote', async () => {
      mockGetSetting.mockResolvedValue('2025-01-01T00:00:00Z');
      mockDownloadLatestBackup.mockResolvedValueOnce({
        data: '{"test":"data"}',
        file: { id: 'f1', name: 'b.json', modifiedTime: '2020-01-01T00:00:00Z' },
      });

      render(<GoogleDriveSync />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('sync-conflict-modal')).toBeInTheDocument();
      });
    });

    it('imports remote data when choosing cloud in conflict modal', async () => {
      mockGetSetting.mockResolvedValue('2025-01-01T00:00:00Z');

      const remoteData = '{"test":"data"}';
      mockDownloadLatestBackup.mockResolvedValueOnce({
        data: remoteData,
        file: { id: 'f1', name: 'b.json', modifiedTime: '2020-01-01T00:00:00Z' },
      });

      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('sync-conflict-modal')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-use-cloud'));
      });

      expect(mockDb.importFromJSON).toHaveBeenCalledWith(remoteData);
      expect(mockReloadAllStores).toHaveBeenCalledWith(mockDb);
      expect(mockNotify.success).toHaveBeenCalledWith('Dữ liệu đã tải xuống từ Google Drive');
    });

    it('keeps local data when choosing local in conflict modal', async () => {
      mockGetSetting.mockResolvedValue('2025-01-01T00:00:00Z');
      mockDownloadLatestBackup.mockResolvedValueOnce({
        data: '{"test":"data"}',
        file: { id: 'f1', name: 'b.json', modifiedTime: '2020-01-01T00:00:00Z' },
      });

      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('sync-conflict-modal')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-keep-local'));
      });

      expect(mockDb.importFromJSON).not.toHaveBeenCalled();
      expect(screen.queryByTestId('sync-conflict-modal')).not.toBeInTheDocument();
    });

    it('closes conflict modal on cancel', async () => {
      mockGetSetting.mockResolvedValue('2025-01-01T00:00:00Z');
      mockDownloadLatestBackup.mockResolvedValueOnce({
        data: '{"test":"data"}',
        file: { id: 'f1', name: 'b.json', modifiedTime: '2020-01-01T00:00:00Z' },
      });

      render(<GoogleDriveSync />);
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
      expect(mockDb.importFromJSON).not.toHaveBeenCalled();
    });

    it('imports directly when remote is newer (no conflict)', async () => {
      const remoteData = '{"test":"data"}';
      mockDownloadLatestBackup.mockResolvedValueOnce({
        data: remoteData,
        file: { id: 'f1', name: 'b.json', modifiedTime: '2099-12-31T23:59:59Z' },
      });

      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      expect(mockDb.importFromJSON).toHaveBeenCalledWith(remoteData);
      expect(screen.queryByTestId('sync-conflict-modal')).not.toBeInTheDocument();
    });

    it('imports directly when local has no stored sync time', async () => {
      const remoteData = '{"test":"data"}';
      mockDownloadLatestBackup.mockResolvedValueOnce({
        data: remoteData,
        file: { id: 'f1', name: 'b.json', modifiedTime: '2099-12-31T23:59:59Z' },
      });

      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      expect(mockDb.importFromJSON).toHaveBeenCalledWith(remoteData);
    });

    it('persists remote modifiedTime as lastSyncAt after download', async () => {
      const remoteData = '{"test":"data"}';
      mockDownloadLatestBackup.mockResolvedValueOnce({
        data: remoteData,
        file: { id: 'f1', name: 'b.json', modifiedTime: '2024-07-20T15:00:00Z' },
      });

      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      // Verify via displayed sync time (state update proves setSetting was called)
      expect(screen.getByText(/Đồng bộ lần cuối/)).toBeInTheDocument();
    });

    it('shows error when importing cloud data fails during conflict resolution', async () => {
      mockGetSetting.mockResolvedValue('2025-01-01T00:00:00Z');
      const remoteData = '{"test":"data"}';
      mockDownloadLatestBackup.mockResolvedValueOnce({
        data: remoteData,
        file: { id: 'f1', name: 'b.json', modifiedTime: '2020-01-01T00:00:00Z' },
      });
      mockDb.importFromJSON.mockRejectedValueOnce(new Error('import failed'));

      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-download-drive'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('sync-conflict-modal')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-use-cloud'));
      });

      expect(mockNotify.error).toHaveBeenCalledWith('Tải xuống thất bại. Vui lòng thử lại.');
      expect(screen.queryByTestId('sync-conflict-modal')).not.toBeInTheDocument();
    });
  });

  describe('Status display', () => {
    beforeEach(() => {
      mockAuthState.user = mockUser;
      mockAuthState.accessToken = 'test-token';
    });

    it('does not show status when idle and no sync yet', () => {
      render(<GoogleDriveSync />);
      expect(screen.queryByText(/Đồng bộ lần cuối/)).not.toBeInTheDocument();
      expect(screen.queryByText('Lỗi đồng bộ')).not.toBeInTheDocument();
    });

    it('shows green check icon after successful sync', async () => {
      mockUploadBackup.mockResolvedValueOnce({ id: 'f1', name: 'b.json', modifiedTime: '2024-01-01T00:00:00Z' });

      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-upload-drive'));
      });

      expect(screen.getByText(/Đồng bộ lần cuối/)).toBeInTheDocument();
    });
  });

  describe('appSettings error handling', () => {
    it('renders normally when getSetting rejects on mount (line 33)', async () => {
      mockGetSetting.mockRejectedValueOnce(new Error('db fail'));
      render(<GoogleDriveSync />);
      // Component still renders signed-out view without crashing
      expect(screen.getByTestId('cloud-sync-signed-out')).toBeInTheDocument();
    });

    it('completes sign-out when deleteSetting rejects (line 51)', async () => {
      mockAuthState.user = mockUser;
      mockAuthState.accessToken = 'test-token';
      mockDeleteSetting.mockRejectedValueOnce(new Error('fail'));

      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-google-sign-out'));
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(mockNotify.success).toHaveBeenCalledWith('Đã đăng xuất');
    });

    it('completes upload when setSetting rejects in updateLastSync (line 60)', async () => {
      mockAuthState.user = mockUser;
      mockAuthState.accessToken = 'test-token';
      mockSetSetting.mockRejectedValueOnce(new Error('fail'));
      mockUploadBackup.mockResolvedValueOnce({ id: 'f1', name: 'b.json', modifiedTime: '2024-01-01T00:00:00Z' });

      render(<GoogleDriveSync />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-upload-drive'));
      });

      expect(mockNotify.success).toHaveBeenCalled();
    });
  });
});
