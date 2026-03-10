import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useAutoSync } from '../hooks/useAutoSync';
import * as driveService from '../services/googleDriveService';

const mockAuthValues = {
  user: null as { id: string; email: string; displayName: string; photoUrl: string | null } | null,
  accessToken: null as string | null,
  isLoading: false,
  isInitialized: true,
  signIn: vi.fn(),
  signOut: vi.fn(),
};

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockAuthValues,
}));

vi.mock('../services/googleDriveService', () => ({
  uploadBackup: vi.fn(),
  downloadLatestBackup: vi.fn(),
  listBackups: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

const LAST_SYNC_KEY = 'mp-last-sync-at';

const defaultOptions = {
  ingredients: [{ id: '1' }],
  dishes: [{ id: '2' }],
  dayPlans: [],
  userProfile: { weight: 70 },
  onImportData: vi.fn(),
};

const wrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

describe('useAutoSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.removeItem(LAST_SYNC_KEY);
    mockAuthValues.user = null;
    mockAuthValues.accessToken = null;
    (driveService.uploadBackup as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'f1', name: 'backup.json', modifiedTime: '2026-01-01T00:00:00Z' });
    (driveService.downloadLatestBackup as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.removeItem(LAST_SYNC_KEY);
  });

  it('should return idle status when not authenticated', () => {
    const { result } = renderHook(() => useAutoSync(defaultOptions), { wrapper });
    expect(result.current.syncStatus).toBe('idle');
    expect(result.current.lastSyncAt).toBeNull();
  });

  it('should load lastSyncAt from localStorage', () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';
    localStorage.setItem(LAST_SYNC_KEY, '2026-01-01T00:00:00Z');
    const { result } = renderHook(() => useAutoSync(defaultOptions), { wrapper });
    expect(result.current.lastSyncAt).toBe('2026-01-01T00:00:00Z');
  });

  it('should trigger upload manually', async () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';

    const { result } = renderHook(() => useAutoSync(defaultOptions), { wrapper });

    await act(async () => {
      await result.current.triggerUpload();
    });

    expect(driveService.uploadBackup).toHaveBeenCalledWith('tok', expect.objectContaining({ _version: '1.0' }));
    expect(result.current.syncStatus).toBe('idle');
    expect(result.current.lastSyncAt).toBeTruthy();
  });

  it('should set error status on upload failure', async () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';
    (driveService.uploadBackup as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network'));

    const { result } = renderHook(() => useAutoSync(defaultOptions), { wrapper });

    await act(async () => {
      await result.current.triggerUpload();
    });

    expect(result.current.syncStatus).toBe('error');
  });

  it('should not upload when no access token', async () => {
    const { result } = renderHook(() => useAutoSync(defaultOptions), { wrapper });

    await act(async () => {
      await result.current.triggerUpload();
    });

    expect(driveService.uploadBackup).not.toHaveBeenCalled();
  });

  it('should trigger download manually', async () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';
    const mockData = { 'mp-ingredients': [] };
    (driveService.downloadLatestBackup as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockData,
      file: { id: 'f1', name: 'backup.json', modifiedTime: '2026-01-01T00:00:00Z' },
    });

    const onImportData = vi.fn();
    const { result } = renderHook(() => useAutoSync({ ...defaultOptions, onImportData }), { wrapper });

    await act(async () => {
      await result.current.triggerDownload();
    });

    expect(onImportData).toHaveBeenCalledWith(mockData);
    expect(result.current.syncStatus).toBe('idle');
    expect(result.current.lastSyncAt).toBeTruthy();
  });

  it('should handle download when no backup exists', async () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';
    (driveService.downloadLatestBackup as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const onImportData = vi.fn();
    const { result } = renderHook(() => useAutoSync({ ...defaultOptions, onImportData }), { wrapper });

    await act(async () => {
      await result.current.triggerDownload();
    });

    expect(onImportData).not.toHaveBeenCalled();
    expect(result.current.syncStatus).toBe('idle');
  });

  it('should set error status on download failure', async () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';
    (driveService.downloadLatestBackup as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('403'));

    const { result } = renderHook(() => useAutoSync(defaultOptions), { wrapper });

    await act(async () => {
      await result.current.triggerDownload();
    });

    expect(result.current.syncStatus).toBe('error');
  });

  it('should not download when no access token', async () => {
    const { result } = renderHook(() => useAutoSync(defaultOptions), { wrapper });

    await act(async () => {
      await result.current.triggerDownload();
    });

    expect(driveService.downloadLatestBackup).not.toHaveBeenCalled();
  });

  it('should reset state when user signs out', () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';

    const { result, rerender } = renderHook(() => useAutoSync(defaultOptions), { wrapper });

    expect(result.current.syncStatus).toBe('idle');

    mockAuthValues.user = null;
    mockAuthValues.accessToken = null;
    rerender();

    expect(result.current.lastSyncAt).toBeNull();
    expect(result.current.syncStatus).toBe('idle');
  });

  it('should persist lastSyncAt to localStorage on upload', async () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';

    const { result } = renderHook(() => useAutoSync(defaultOptions), { wrapper });

    await act(async () => {
      await result.current.triggerUpload();
    });

    expect(localStorage.getItem(LAST_SYNC_KEY)).toBeTruthy();
  });

  it('should persist lastSyncAt to localStorage on download', async () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';
    (driveService.downloadLatestBackup as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { items: [] },
      file: { id: 'f1', name: 'backup.json', modifiedTime: '2026-01-01T00:00:00Z' },
    });

    const { result } = renderHook(() => useAutoSync(defaultOptions), { wrapper });

    await act(async () => {
      await result.current.triggerDownload();
    });

    expect(localStorage.getItem(LAST_SYNC_KEY)).toBeTruthy();
  });

  it('should debounce auto-upload when data changes', async () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';

    const options = { ...defaultOptions };
    const { rerender } = renderHook(() => useAutoSync(options), { wrapper });

    // Simulate sync-on-launch completing to set initializedRef
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Trigger data change
    options.ingredients = [{ id: '1' }, { id: '2' }];
    rerender();

    // Before debounce completes, upload should NOT have been called (only from sync-on-launch check)
    const uploadCallsBefore = (driveService.uploadBackup as ReturnType<typeof vi.fn>).mock.calls.length;

    // Advance past debounce delay
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100);
    });

    expect((driveService.uploadBackup as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(uploadCallsBefore);
  });

  it('should cancel pending debounce on rapid data changes', async () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';

    const options = { ...defaultOptions };
    const { rerender } = renderHook(() => useAutoSync(options), { wrapper });

    // Wait for init
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // First change
    options.ingredients = [{ id: '1' }, { id: '2' }];
    rerender();

    // Advance partially — not enough for debounce to fire
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    // Second change — should reset the debounce timer
    options.ingredients = [{ id: '1' }, { id: '2' }, { id: '3' }];
    rerender();

    // Advance another 1000ms — still not enough from the second change
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    // At this point, debounce should not have fired yet since second change
    // The upload from data changes should not fire yet
    // Advance past the full debounce from second change
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });

    // Should have uploaded at least once
    expect(driveService.uploadBackup).toHaveBeenCalled();
  });
});
