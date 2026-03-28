import { describe, it, expect, beforeEach } from 'vitest';
import { useUserProfileStore, DEFAULT_USER_PROFILE } from '../store/userProfileStore';

function resetStore() {
  useUserProfileStore.setState({
    userProfile: { ...DEFAULT_USER_PROFILE },
  });
}

describe('userProfileStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('DEFAULT_USER_PROFILE', () => {
    it('has expected default values', () => {
      expect(DEFAULT_USER_PROFILE.weight).toBe(83);
      expect(DEFAULT_USER_PROFILE.proteinRatio).toBe(2);
      expect(DEFAULT_USER_PROFILE.targetCalories).toBe(1500);
    });
  });

  describe('setUserProfile', () => {
    it('sets the user profile from a value', () => {
      const profile = { weight: 75, proteinRatio: 1.8, targetCalories: 2000 };

      useUserProfileStore.getState().setUserProfile(profile);

      const { userProfile } = useUserProfileStore.getState();
      expect(userProfile.weight).toBe(75);
      expect(userProfile.proteinRatio).toBe(1.8);
      expect(userProfile.targetCalories).toBe(2000);
    });

    it('accepts an updater function', () => {
      useUserProfileStore.getState().setUserProfile((prev) => ({
        ...prev,
        weight: 90,
      }));

      const { userProfile } = useUserProfileStore.getState();
      expect(userProfile.weight).toBe(90);
      expect(userProfile.proteinRatio).toBe(DEFAULT_USER_PROFILE.proteinRatio);
      expect(userProfile.targetCalories).toBe(DEFAULT_USER_PROFILE.targetCalories);
    });

    it('replaces the entire profile', () => {
      const profile = { weight: 90, proteinRatio: 2.5, targetCalories: 2000 };

      useUserProfileStore.getState().setUserProfile(profile);

      const { userProfile } = useUserProfileStore.getState();
      expect(userProfile).toEqual(profile);
    });
  });

  describe('data roundtrip', () => {
    it('preserves all fields through set and get', () => {
      const original = { weight: 68, proteinRatio: 1.5, targetCalories: 1800 };

      useUserProfileStore.getState().setUserProfile(original);

      const { userProfile } = useUserProfileStore.getState();
      expect(userProfile.weight).toBe(68);
      expect(userProfile.proteinRatio).toBe(1.5);
      expect(userProfile.targetCalories).toBe(1800);
    });

    it('partial update via updater function preserves other fields', () => {
      const initial = { weight: 68, proteinRatio: 1.5, targetCalories: 1800 };
      useUserProfileStore.getState().setUserProfile(initial);

      useUserProfileStore.getState().setUserProfile((prev) => ({
        ...prev,
        weight: 72,
      }));

      const { userProfile } = useUserProfileStore.getState();
      expect(userProfile.weight).toBe(72);
      expect(userProfile.proteinRatio).toBe(1.5);
      expect(userProfile.targetCalories).toBe(1800);
    });
  });

  describe('default profile handling', () => {
    it('starts with default profile', () => {
      const { userProfile } = useUserProfileStore.getState();
      expect(userProfile).toEqual(DEFAULT_USER_PROFILE);
    });

    it('can reset to defaults', () => {
      useUserProfileStore.getState().setUserProfile({ weight: 100, proteinRatio: 3, targetCalories: 3000 });

      useUserProfileStore.getState().setUserProfile({ ...DEFAULT_USER_PROFILE });

      const { userProfile } = useUserProfileStore.getState();
      expect(userProfile).toEqual(DEFAULT_USER_PROFILE);
    });
  });
});
