import { computed, inject, Injectable, signal } from '@angular/core';
import { UserProfile } from '../models/user-profile.model';
import { UserProfileRepository } from '../repositories/user-profile.repository';
import { updateMeasurementTargets } from '../services/profile/profile-measurement-update';

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly repo = inject(UserProfileRepository);
  private pending: Promise<void> = Promise.resolve();
  readonly profile = signal<UserProfile | null>(null);
  readonly isOnboardingComplete = computed(() => !!this.profile()?.onboarding_completed);

  loadProfile(onDate?: Date): Promise<void> {
    return this.inOrder(async () =>
      this.publish(await this.repo.getProfile(), onDate ?? new Date()),
    );
  }

  refreshTargets(onDate?: Date): Promise<void> {
    return this.inOrder(() => this.publish(this.profile(), onDate ?? new Date()));
  }

  saveOnboardingProfile(
    data: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<void> {
    return this.inOrder(async () => this.publish(await this.repo.insert(data), new Date()));
  }

  updateProfile(patch: Partial<UserProfile>): Promise<void> {
    return this.inOrder(async () => {
      await this.repo.update(patch);
      this.profile.set(await this.repo.getProfile());
    });
  }

  private async publish(profile: UserProfile | null, today: Date): Promise<void> {
    if (profile) {
      const patch = updateMeasurementTargets(profile, {}, today);
      if (Object.keys(patch).length) {
        await this.repo.update(patch, today);
        this.profile.set(await this.repo.getProfile());
        return;
      }
    }
    this.profile.set(profile);
  }

  private inOrder(work: () => Promise<void>): Promise<void> {
    const result = this.pending.then(work);
    this.pending = result.catch(() => undefined);
    return result;
  }
}
