import { computed, inject, Injectable, Injector, signal, type Signal } from '@angular/core';
import { AccountSession } from '../../account/account-session';
import { TrainingPlanRepository } from '../../repositories/training-plan.repository';
import { ProfileStore } from '../../stores/profile.store';
import { LocalNotifications, type ReminderPolicy } from './local-notifications';
import { notificationFlags } from './notification-preferences';

const PREFERENCE_PREFIX = 'mealplan.workout-reminder.v1:';

@Injectable({ providedIn: 'root' })
export class ReminderCoordinator {
  private readonly account = inject(AccountSession);
  private readonly profiles = inject(ProfileStore);
  private readonly notifications = inject(LocalNotifications);
  private readonly injector = inject(Injector);
  private readonly preferenceVersion = signal(0);
  private readonly preferenceKey = computed(() => {
    const owner = this.account.current()?.id;
    if (!this.account.required) return PREFERENCE_PREFIX + 'web';
    return owner ? PREFERENCE_PREFIX + owner : null;
  });

  readonly workoutEnabled: Signal<boolean> = computed(() => {
    this.preferenceVersion();
    const key = this.preferenceKey();
    return key !== null && localStorage.getItem(key) === '1';
  });

  private latestRequest = 0;
  private clearing: Promise<void> | null = null;

  setWorkoutEnabled(enabled: boolean): void {
    const key = this.preferenceKey();
    if (!key || enabled === this.workoutEnabled()) return;
    if (enabled) localStorage.setItem(key, '1');
    else localStorage.removeItem(key);
    this.preferenceVersion.update((version) => version + 1);
    this.latestRequest++;
  }

  async refresh(hasPermission?: boolean): Promise<void> {
    if (this.clearing) return this.clearing;
    const owner = this.account.current();
    const request = ++this.latestRequest;
    const isCurrent = (): boolean =>
      this.latestRequest === request && this.account.current() === owner;
    if ((this.account.required && !owner) || !this.profiles.profile()) {
      return this.notifications.sync(notificationFlags(null), [], isCurrent);
    }

    const granted = hasPermission ?? (await this.notifications.hasPermission());
    if (!isCurrent()) return;
    const workoutEnabled = Boolean(granted && this.profiles.profile() && this.workoutEnabled());
    const plan = workoutEnabled
      ? await this.injector.get(TrainingPlanRepository).getActivePlan()
      : null;
    if (!isCurrent()) return;

    const profile = this.profiles.profile();
    const preferences: ReminderPolicy['profile'] = profile && {
      notif_morning: profile.notif_morning,
      notif_lunch: profile.notif_lunch,
      notif_evening: profile.notif_evening,
      notif_weekly: profile.notif_weekly,
    };
    return this.notifications.reconcile(
      {
        profile: preferences,
        granted,
        workoutEnabled,
        days: (plan?.days ?? []).map(({ day_of_week, is_rest_day, exercises }) => ({
          weekday: day_of_week,
          rest: is_rest_day,
          exercises: exercises.length,
        })),
      },
      isCurrent,
    );
  }

  clear(): Promise<void> {
    this.latestRequest++;
    this.clearing ??= this.notifications.sync(notificationFlags(null)).finally(() => {
      this.clearing = null;
    });
    return this.clearing;
  }
}
