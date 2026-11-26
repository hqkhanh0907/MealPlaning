import { registerPlugin } from '@capacitor/core';

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
}

interface DeviceAccount {
  ownerId?: string;
  username?: string;
  fullName?: string;
  accessToken?: string;
  reason?: string;
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
  clear(): Promise<void>;
  enqueue(options: { guard?: boolean; ownerId: string }): Promise<void>;
  syncNow(options: { ownerId: string }): Promise<NativeSyncState>;
  status(): Promise<NativeSyncState>;
  resolveConflict(options: { ownerId: string; useServer: boolean }): Promise<NativeSyncState>;
}

export const nativeAccount = registerPlugin<NativeAccount>('MealPlanSync');
