import { Component, computed, inject, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
} from '@ionic/angular/standalone';
import { LocalDay } from '../../../core/stores/local-day';
import SettingsPage from '../settings.page';
import { SettingsSection } from './settings-section';
import { SettingsDevices } from './settings-devices';
import type { SettingsAction } from './settings-renderer';
@Component({
  selector: 'app-leptos-settings',
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonContent,
    IonTitle,
    SettingsSection,
    SettingsDevices,
  ],
})
export default class LeptosSettingsPage extends SettingsPage {
  private readonly router = inject(Router);
  private readonly today = inject(LocalDay);
  private readonly identity = new WeakMap<object, number>();
  private identityCount = 0;
  private readonly conflictId = computed(() => {
    const c = this.accountSync.workoutConflict();
    if (!c) return 0;
    let id = this.identity.get(c);
    if (!id) {
      id = ++this.identityCount;
      this.identity.set(c, id);
    }
    return id;
  });
  protected readonly accountData = computed(() =>
    JSON.stringify({
      account: this.accountSession.current(),
      status: this.accountSync.status(),
      reason: this.accountSync.reason(),
      lastSync: this.accountSync.lastSync(),
      conflict: this.accountSync.workoutConflict(),
      conflictRef: this.conflictId(),
      signOutBusy: this.signOutBusy(),
      signOutError: this.signOutError(),
    }),
  );
  protected readonly prefsData = computed(() =>
    JSON.stringify({
      account: this.accountSession.current(),
      profile: this.profile(),
      today: this.today.iso(),
      version: this.appVersion,
      reminders: [
        ...this.reminderSlots.map((r) => ({
          key: r.key,
          title: r.title,
          label: this.reminderTimeLabel(r),
        })),
        {
          key: 'workout',
          title: this.workoutReminder.title,
          label:
            this.reminderTimeLabel(this.workoutReminder) + ' vào ngày tập trong giáo án đang dùng.',
        },
      ],
      flags: { ...this.selectedNotifications(), workout: this.workoutReminderEnabled() },
      paused: this.notificationsPaused(),
      configured: this.groq.configured(),
      groqSupported: this.groq.supported,
      groqBusy: this.groqBusy(),
      feedback: this.groqFeedback(),
    }),
  );
  protected run(a: SettingsAction): void {
    if (a.ownerId !== (this.accountSession.current()?.id ?? null)) return;
    switch (a.type) {
      case 'navigate':
        void this.router.navigateByUrl(a.path);
        break;
      case 'sync':
        void this.accountSync.sync();
        break;
      case 'resolve':
        void this.accountSync.resolveConflict(a.server);
        break;
      case 'resolveWorkout':
        if (a.version === this.conflictId())
          void this.accountSync.resolveWorkoutConflict(a.choices);
        break;
      case 'signOut':
        void this.signOut();
        break;
      case 'toggle':
        void this.toggleNotif(a.key, a.enabled);
        break;
      case 'resume':
        void this.resumeNotifications();
        break;
      case 'keyConfigure':
        void this.configureGroqKey();
        break;
      case 'keyRemove':
        void this.removeGroqKey();
        break;
    }
  }
}
