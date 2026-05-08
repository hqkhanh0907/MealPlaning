import { TestBed } from '@angular/core/testing';
import { ProfileStore } from './profile.store';
import { UserProfileRepository } from '../repositories/user-profile.repository';
import { UserProfile } from '../models/user-profile.model';

describe('ProfileStore', () => {
  let repoSpy: jasmine.SpyObj<UserProfileRepository>;
  let store: ProfileStore;

  const baseProfile: UserProfile = {
    id: 'p1',
    height_cm: 170,
    weight_kg: 65,
    age: 30,
    gender: 'male',
    goal: 'maintain',
    fitness_level: 'beginner',
    activity_factor: 1.55,
    bmr: 1600,
    tdee: 2480,
    target_calories: 2480,
    target_protein: 130,
    target_carbs: null,
    target_fat: null,
    theme: 'light',
    notif_morning: 1,
    notif_lunch: 1,
    notif_evening: 1,
    notif_weekly: 1,
    onboarding_completed: 1,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: null,
  };

  beforeEach(() => {
    repoSpy = jasmine.createSpyObj<UserProfileRepository>('UserProfileRepository', [
      'getProfile',
      'insert',
      'update',
    ]);

    TestBed.configureTestingModule({
      providers: [ProfileStore, { provide: UserProfileRepository, useValue: repoSpy }],
    });
    store = TestBed.inject(ProfileStore);
  });

  it('calls repo.update with the patch and refreshes the signal from getProfile', async () => {
    const patch: Partial<UserProfile> = { weight_kg: 70, target_calories: 2600 };
    const fresh: UserProfile = {
      ...baseProfile,
      weight_kg: 70,
      target_calories: 2600,
      updated_at: '2024-02-01T00:00:00.000Z',
    };
    repoSpy.update.and.resolveTo();
    repoSpy.getProfile.and.resolveTo(fresh);

    await store.updateProfile(patch);

    expect(repoSpy.update).toHaveBeenCalledOnceWith(patch);
    expect(repoSpy.getProfile).toHaveBeenCalledTimes(1);
    expect(store.profile()).toEqual(fresh);
  });

  it('updates after update() is awaited (getProfile called after update)', async () => {
    const callOrder: string[] = [];
    repoSpy.update.and.callFake(async () => {
      callOrder.push('update');
    });
    repoSpy.getProfile.and.callFake(async () => {
      callOrder.push('getProfile');
      return baseProfile;
    });

    await store.updateProfile({ age: 31 });

    expect(callOrder).toEqual(['update', 'getProfile']);
    expect(store.profile()).toEqual(baseProfile);
  });

  describe('loadProfile()', () => {
    it('sets the profile signal when repo returns a profile', async () => {
      repoSpy.getProfile.and.resolveTo(baseProfile);

      await store.loadProfile();

      expect(repoSpy.getProfile).toHaveBeenCalledTimes(1);
      expect(store.profile()).toEqual(baseProfile);
    });

    it('sets signal to null and isOnboardingComplete to false when repo returns null', async () => {
      repoSpy.getProfile.and.resolveTo(null);

      await store.loadProfile();

      expect(store.profile()).toBeNull();
      expect(store.isOnboardingComplete()).toBeFalse();
    });
  });

  describe('saveOnboardingProfile()', () => {
    it('calls repo.insert with data and updates signal with the saved row', async () => {
      const data: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> = {
        height_cm: 170,
        weight_kg: 65,
        age: 30,
        gender: 'male',
        goal: 'maintain',
        fitness_level: 'beginner',
        activity_factor: 1.55,
        bmr: 1600,
        tdee: 2480,
        target_calories: 2480,
        target_protein: 130,
        target_carbs: null,
        target_fat: null,
        theme: 'light',
        notif_morning: 1,
        notif_lunch: 1,
        notif_evening: 1,
        notif_weekly: 1,
        onboarding_completed: 1,
      };
      repoSpy.insert.and.resolveTo(baseProfile);

      await store.saveOnboardingProfile(data);

      expect(repoSpy.insert).toHaveBeenCalledOnceWith(data);
      expect(store.profile()).toEqual(baseProfile);
    });
  });

  describe('isOnboardingComplete()', () => {
    it('returns true when profile.onboarding_completed === 1', () => {
      store.profile.set({ ...baseProfile, onboarding_completed: 1 });
      expect(store.isOnboardingComplete()).toBeTrue();
    });

    it('returns false when profile.onboarding_completed === 0', () => {
      store.profile.set({ ...baseProfile, onboarding_completed: 0 });
      expect(store.isOnboardingComplete()).toBeFalse();
    });

    it('returns false when profile is null', () => {
      store.profile.set(null);
      expect(store.isOnboardingComplete()).toBeFalse();
    });
  });

  describe('updateProfile() error path', () => {
    it('propagates error from repo.update and leaves signal unchanged', async () => {
      store.profile.set(baseProfile);
      const err = new Error('update failed');
      repoSpy.update.and.rejectWith(err);

      await expectAsync(store.updateProfile({ age: 31 })).toBeRejectedWith(err);

      expect(repoSpy.getProfile).not.toHaveBeenCalled();
      expect(store.profile()).toEqual(baseProfile);
    });

    it('propagates error from repo.getProfile and leaves signal unchanged', async () => {
      store.profile.set(baseProfile);
      const err = new Error('getProfile failed');
      repoSpy.update.and.resolveTo();
      repoSpy.getProfile.and.rejectWith(err);

      await expectAsync(store.updateProfile({ age: 31 })).toBeRejectedWith(err);

      expect(store.profile()).toEqual(baseProfile);
    });
  });
});
