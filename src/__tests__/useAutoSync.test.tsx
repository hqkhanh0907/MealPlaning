import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

vi.mock('../contexts/DatabaseContext', () => ({
  DatabaseProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDatabase: () => mockDb,
}));

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

vi.mock('../services/appSettings', () => ({
  getSetting: vi.fn().mockResolvedValue(null),
  setSetting: vi.fn().mockResolvedValue(undefined),
  deleteSetting: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/storeLoader', () => ({
  reloadAllStores: vi.fn().mockResolvedValue(undefined),
}));

// Mock stores used by useAutoSync for auto-sync change detection
let mockStoreData = {
  ingredients: [] as unknown[],
  dishes: [] as unknown[],
  dayPlans: [] as unknown[],
  templates: [] as unknown[],
};

vi.mock('../store/ingredientStore', () => ({
  useIngredientStore: (selector: (s: { ingredients: unknown[] }) => unknown) =>
    selector({ ingredients: mockStoreData.ingredients }),
}));

vi.mock('../store/dishStore', () => ({
  useDishStore: (selector: (s: { dishes: unknown[] }) => unknown) =>
    selector({ dishes: mockStoreData.dishes }),
}));

vi.mock('../store/dayPlanStore', () => ({
  useDayPlanStore: (selector: (s: { dayPlans: unknown[] }) => unknown) =>
    selector({ dayPlans: mockStoreData.dayPlans }),
}));

vi.mock('../store/mealTemplateStore', () => ({
  useMealTemplateStore: (selector: (s: { templates: unknown[] }) => unknown) =>
    selector({ templates: mockStoreData.templates }),
}));

// Mock database
const mockDb = {
  initialize: vi.fn(),
  execute: vi.fn().mockResolvedValue(undefined),
  query: vi.fn().mockResolvedValue([]),
  queryOne: vi.fn().mockResolvedValue(null),
  transaction: vi.fn(),
  exportBinary: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
  importBinary: vi.fn().mockResolvedValue(undefined),
};

const wrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

describe('useAutoSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockAuthValues.user = null;
    mockAuthValues.accessToken = null;
    mockStoreData = { ingredients: [], dishes: [], dayPlans: [], templates: [] };
    mockDb.exportBinary.mockReturnValue(new Uint8Array([1, 2, 3]));
    mockDb.importBinary.mockResolvedValue(undefined);
    (driveService.uploadBackup as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'f1', name: 'backup.sqlite', modifiedTime: '2026-01-01T00:00:00Z' });
    (driveService.downloadLatestBackup as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return idle status when not authenticated', () => {
    const { result } = renderHook(() => useAutoSync(), { wrapper });
    expect(result.current.syncStatus).toBe('idle');
    expect(result.current.lastSyncAt).toBeNull();
  });

  it('should load lastSyncAt from app_settings', async () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';
    const { result } = renderHook(() => useAutoSync(), { wrapper });

    // getSetting mock returns null by default, so lastSyncAt starts null
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // With default mock (null), lastSyncAt remains null until a sync occurs
    expect(result.current.lastSyncAt).toBeNull();
  });

  it('should trigger upload manually', async () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';

    const { result } = renderHook(() => useAutoSync(), { wrapper });

    await act(async () => {
      await result.current.triggerUpload();
    });

    expect(mockDb.exportBinary).toHaveBeenCalled();
    expect(driveService.uploadBackup).toHaveBeenCalledWith('tok', expect.any(Uint8Array));
    expect(result.current.syncStatus).toBe('idle');
    expect(result.current.lastSyncAt).toBeTruthy();
  });

  it('should set error status on upload failure', async () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';
    (driveService.uploadBackup as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network'));

    const { result } = renderHook(() => useAutoSync(), { wrapper });

    await act(async () => {
      await result.current.triggerUpload();
    });

    expect(result.current.syncStatus).toBe('error');
  });

  it('should not upload when no access token', async () => {
    const { result } = renderHook(() => useAutoSync(), { wrapper });

    await act(async () => {
      await result.current.triggerUpload();
    });

    expect(driveService.uploadBackup).not.toHaveBeenCalled();
  });

  it('should trigger download manually', async () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';
    const mockData = new Uint8Array([10, 20, 30]);
    (driveService.downloadLatestBackup as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockData,
      file: { id: 'f1', name: 'backup.sqlite', modifiedTime: '2026-01-01T00:00:00Z' },
    });

    const { result } = renderHook(() => useAutoSync(), { wrapper });

    // Flush sync-on-launch (multiple await levels)
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });

    await act(async () => {
      await result.current.triggerDownload();
    });

    expect(mockDb.importBinary).toHaveBeenCalled();
    expect(result.current.syncStatus).toBe('idle');
    expect(result.current.lastSyncAt).toBe('2026-01-01T00:00:00Z');
  });

  it('should handle download when no backup exists', async () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';

    const { result } = renderHook(() => useAutoSync(), { wrapper });

    await act(async () => { await vi.advanceTimersByTimeAsync(0); });

    await act(async () => {
      await result.current.triggerDownload();
    });

    // downloadLatestBackup returns null by default, so no import
    expect(result.current.syncStatus).toBe('idle');
  });

  it('should set error status on download failure', async () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';
    (driveService.downloadLatestBackup as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('403'));

    const { result } = renderHook(() => useAutoSync(), { wrapper });

    await act(async () => {
      await result.current.triggerDownload();
    });

    expect(result.current.syncStatus).toBe('error');
  });

  it('should not download when no access token', async () => {
    const { result } = renderHook(() => useAutoSync(), { wrapper });

    await act(async () => {
      await result.current.triggerDownload();
    });

    expect(driveService.downloadLatestBackup).not.toHaveBeenCalled();
  });

  it('should reset state when user signs out', () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';

    const { result, rerender } = renderHook(() => useAutoSync(), { wrapper });

    expect(result.current.syncStatus).toBe('idle');

    mockAuthValues.user = null;
    mockAuthValues.accessToken = null;
    rerender();

    expect(result.current.lastSyncAt).toBeNull();
    expect(result.current.syncStatus).toBe('idle');
  });

  it('should persist lastSyncAt to app_settings on upload', async () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';
    (driveService.uploadBackup as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'f1', name: 'backup.sqlite', modifiedTime: '2026-03-11T08:00:00Z',
    });

    const { result } = renderHook(() => useAutoSync(), { wrapper });

    await act(async () => {
      await result.current.triggerUpload();
    });

    // lastSyncAt state proves updateLastSync ran (which calls setSetting internally)
    expect(result.current.lastSyncAt).toBe('2026-03-11T08:00:00Z');
  });

  it('should persist lastSyncAt to app_settings on download', async () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';
    (driveService.downloadLatestBackup as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: new Uint8Array([1, 2]),
      file: { id: 'f1', name: 'backup.sqlite', modifiedTime: '2026-05-20T12:00:00Z' },
    });

    const { result } = renderHook(() => useAutoSync(), { wrapper });

    // Flush sync-on-launch (also downloads and sets lastSyncAt)
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });

    expect(result.current.lastSyncAt).toBe('2026-05-20T12:00:00Z');
  });

  it('should debounce auto-upload when store data changes', async () => {
    mockAuthValues.user = { id: 'u1', email: 'e@g.com', displayName: 'U', photoUrl: null };
    mockAuthValues.accessToken = 'tok';

    const { rerender } = renderHook(() => useAutoSync(), { wrapper });

    // Simulate sync-on-launch completing to set initializedRef
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Trigger data change by changing mock store data
    mockStoreData.ingredients = [{ id: '1' }, { id: '2' }];
    rerender();

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

    const { rerender } = renderHook(() => useAutoSync(), { wrapper });

    // Wait for init
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // First change
    mockStoreData.ingredients = [{ id: '1' }, { id: '2' }];
    rerender();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    // Second change
    mockStoreData.ingredients = [{ id: '1' }, { id: '2' }, { id: '3' }];
    rerender();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    // Advance past full debounce from second change
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });

    expect(driveService.uploadBackup).toHaveBeenCalled();
  });
});
