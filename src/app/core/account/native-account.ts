import type { CatalogCommand, NativeCatalogRead } from './catalog-read';
import { registerPlugin } from '@capacitor/core';
import { type WorkoutConflictResolution, type WorkoutSyncConflict } from './workout-sync-conflict';
import type { NativeDashboardSummary } from './dashboard-read';
import type { NativeCalendarDays } from './calendar-read';

export type SyncStatus =
  | 'idle'
  | 'working'
  | 'saved'
  | 'offline'
  | 'expired'
  | 'conflict'
  | 'forbidden'
  | 'error';

export interface NativeSyncState {
  status: SyncStatus;
  lastSync?: string | null;
  reason?: string;
  remoteApplied?: boolean;
  remoteRevision?: number;
  workoutConflict?: WorkoutSyncConflict;
}

interface DeviceAccount {
  ownerId?: string;
  username?: string;
  fullName?: string;
  accessToken?: string;
  reason?: string;
}

export interface DeviceSessionSummary {
  id: string;
  label: string;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}

interface NativeAccount {
  catalogRead(options: { ownerId: string; command: CatalogCommand }): Promise<NativeCatalogRead>;
  calendarDays(options: { start: string; end: string }): Promise<NativeCalendarDays>;
  dashboardSummary(options: { date: string }): Promise<NativeDashboardSummary>;
  configure(options: {
    origin: string;
    ownerId: string;
    dbName: string;
    username: string;
    fullName: string;
    accessToken: string;
    sessionToken: string;
    accessExpiresAt: string;
  }): Promise<void>;
  session(options?: { renew?: boolean }): Promise<DeviceAccount>;
  updateProfile(options: { fullName: string }): Promise<void>;
  deviceLabel(): Promise<{ label: string }>;
  listDeviceSessions(options: {
    ownerId: string;
  }): Promise<{ devices?: DeviceSessionSummary[]; reason?: string }>;
  revokeDeviceSession(options: { ownerId: string; id: string }): Promise<{ reason?: string }>;
  clear(options?: { ownerId?: string; generation?: string }): Promise<void>;
  enqueue(options: { guard?: boolean; ownerId: string }): Promise<void>;
  syncNow(options: { ownerId: string }): Promise<NativeSyncState>;
  status(): Promise<NativeSyncState>;
  resolveConflict(options: { ownerId: string; useServer: boolean }): Promise<NativeSyncState>;
  resolveWorkoutConflict(options: {
    ownerId: string;
    resolution: WorkoutConflictResolution;
  }): Promise<NativeSyncState>;
}

export const nativeAccount = registerPlugin<NativeAccount>('MealPlanSync');
