import { inject, Injectable, signal } from '@angular/core';
import { UserProfile } from '../models/user-profile.model';
import { UserProfileRepository } from '../repositories/user-profile.repository';

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly repo = inject(UserProfileRepository);

  /** Current user profile — null if onboarding not completed */
  readonly profile = signal<UserProfile | null>(null);

  /** Whether onboarding has been completed */
  readonly isOnboardingComplete = (): boolean => !!this.profile()?.onboarding_completed;

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
}
