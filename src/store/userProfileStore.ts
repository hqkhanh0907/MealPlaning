import { create } from 'zustand';
import type { UserProfile } from '../types';

const STORAGE_KEY = 'mp-user-profile';

export const DEFAULT_USER_PROFILE: UserProfile = { weight: 83, proteinRatio: 2, targetCalories: 1500 };

/** Coerce all numeric fields so string values from localStorage are safe.
 *  Also clamp targetCalories to a sane range (500–10000) to auto-repair
 *  corrupted data from the old string-concatenation bug (e.g. "1500100"). */
function coerceNumericFields(raw: UserProfile): UserProfile {
  const calories = Number(raw.targetCalories);
  return {
    weight: Number(raw.weight),
    proteinRatio: Number(raw.proteinRatio),
    targetCalories: calories > 10000 || calories < 500 || Number.isNaN(calories)
      ? DEFAULT_USER_PROFILE.targetCalories
      : calories,
  };
}

const loadUserProfile = (): UserProfile => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return coerceNumericFields(JSON.parse(saved) as UserProfile);
  } catch { /* corrupted data — use default */ }
  return DEFAULT_USER_PROFILE;
};

interface UserProfileState {
  userProfile: UserProfile;
  setUserProfile: (updater: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  hydrate: () => void;
}

export const useUserProfileStore = create<UserProfileState>((set) => ({
  userProfile: DEFAULT_USER_PROFILE,
  setUserProfile: (updater) => set((state) => ({
    userProfile: typeof updater === 'function' ? updater(state.userProfile) : updater,
  })),
  hydrate: () => set({ userProfile: loadUserProfile() }),
}));

useUserProfileStore.subscribe((state, prev) => {
  if (state.userProfile !== prev.userProfile) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.userProfile)); }
    catch { /* localStorage full */ }
  }
});
