import type { UserProfile } from '../../models/user-profile.model';

const profileFields = {
  morning: 'notif_morning',
  lunch: 'notif_lunch',
  evening: 'notif_evening',
  weekly: 'notif_weekly',
} as const satisfies Record<string, keyof UserProfile>;

export type SlotKey = keyof typeof profileFields;
export type SlotFlags = Record<SlotKey, boolean>;
type Preferences = Pick<UserProfile, (typeof profileFields)[SlotKey]>;

export function notificationFlags(profile: Preferences | null, hasPermission = true): SlotFlags {
  const enabled = (key: SlotKey): boolean =>
    hasPermission && Boolean(profile?.[profileFields[key]]);
  return {
    morning: enabled('morning'),
    lunch: enabled('lunch'),
    evening: enabled('evening'),
    weekly: enabled('weekly'),
  };
}

export function notificationPatch(key: SlotKey, enabled: boolean): Partial<Preferences> {
  return { [profileFields[key]]: enabled ? 1 : 0 };
}
