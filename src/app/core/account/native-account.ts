import { registerPlugin } from '@capacitor/core';
import { type WorkoutConflictResolution, type WorkoutSyncConflict } from './workout-sync-conflict';

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
  clear(): Promise<void>;
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
