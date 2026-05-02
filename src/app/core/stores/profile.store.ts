import { computed, inject, Injectable, signal } from '@angular/core';
import { UserProfile } from '../models/user-profile.model';
import { UserProfileRepository } from '../repositories/user-profile.repository';

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly repo = inject(UserProfileRepository);

  /** Current user profile — null if onboarding not completed */
  readonly profile = signal<UserProfile | null>(null);

  /** Whether onboarding has been completed */
  readonly isOnboardingComplete = computed(() => !!this.profile()?.onboarding_completed);

  /** Load profile from database. Called once at app startup. */
  async loadProfile(): Promise<void> {
    const p = await this.repo.getProfile();
    this.profile.set(p);
  }

  /** Save new profile after onboarding and update signal */
  async saveOnboardingProfile(
    data: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<void> {
    const saved = await this.repo.insert(data);
    this.profile.set(saved);
  }

  /**
   * Apply a partial patch to the user profile and refresh the signal.
   *
   * @throws if repo.update or repo.getProfile throws. On failure of either,
   * the signal is NOT updated. On success of both, the signal is set to the
   * latest row returned by getProfile.
   */
  async updateProfile(patch: Partial<UserProfile>): Promise<void> {
    await this.repo.update(patch);
    const fresh = await this.repo.getProfile();
    this.profile.set(fresh);
  }
}
