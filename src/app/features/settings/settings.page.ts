import { LocalDay } from '../../core/stores/local-day';
import { ageOnDate } from '../../core/services/profile/profile-birth-date';
import { Component, computed, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonBackButton,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonNote,
  IonIcon,
  IonToggle,
  ToastController,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { chevronForwardOutline } from 'ionicons/icons';
import { ProfileStore } from '../../core/stores/profile.store';
import { LocalNotifications } from '../../core/services/notifications/local-notifications';
import {
  notificationFlags,
  notificationPatch,
  type SlotKey,
} from '../../core/services/notifications/notification-preferences';
import {
  FITNESS_LEVEL_LABELS,
  GENDER_LABELS,
  GOAL_LABELS,
} from '../../core/models/user-profile.types';
import {
  REMINDER_SLOTS,
  reminderTimeLabel,
} from '../../core/services/notifications/notification-schedule';
import { activitySummaryForFactor } from '../../core/services/profile/activity-label';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonBackButton,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
    IonIcon,
    IonToggle,
    RouterLink,
  ],
})
export default class SettingsPage {
  private readonly day = inject(LocalDay);
  private readonly profileStore = inject(ProfileStore);
  private readonly notifications = inject(LocalNotifications);
  private readonly toastCtrl = inject(ToastController);

  readonly profile = this.profileStore.profile;

  readonly bodySummary = computed(() => {
    const p = this.profile();
    if (!p) return '';
    const age = ageOnDate(p.birth_date, this.day.date());
    const ageLabel = age === null ? 'Bổ sung ngày sinh' : `${age} tuổi`;
    return `${p.height_cm}cm · ${p.weight_kg}kg · ${ageLabel} · ${GENDER_LABELS[p.gender]}`;
  });

  readonly goalSummary = computed(() => {
    const p = this.profile();
    return p ? GOAL_LABELS[p.goal] : '';
  });

  readonly activitySummary = computed(() => {
    const p = this.profile();
    return p ? activitySummaryForFactor(p.activity_factor) : '';
  });

  readonly trainingLevelLabel = computed(() => {
    const p = this.profile();
    return p ? FITNESS_LEVEL_LABELS[p.fitness_level] : '';
  });

  readonly reminderSlots = REMINDER_SLOTS;
  readonly reminderTimeLabel = reminderTimeLabel;
  readonly selectedNotifications = computed(() => notificationFlags(this.profile()));
  private readonly permissionMissing = signal(false);
  readonly notificationsPaused = computed(
    () => this.permissionMissing() && Object.values(this.selectedNotifications()).some(Boolean),
  );

  async ionViewWillEnter(): Promise<void> {
    if (Capacitor.isNativePlatform())
      this.permissionMissing.set(!(await this.notifications.hasPermission()));
  }

  async resumeNotifications(): Promise<void> {
    if (await this.allowNotifications()) await this.syncSelectedNotifications();
  }

  readonly appVersion = environment.appVersion;

  constructor() {
    addIcons({ chevronForwardOutline });
  }

  async onToggleChange(key: SlotKey, event: CustomEvent<{ checked: boolean }>): Promise<void> {
    const enabled = event.detail.checked;
    const current = this.selectedNotifications()[key];
    if (enabled === current) return;
    const ok = await this.toggleNotif(key, enabled);
    if (!ok) {
      // Revert UI: signal-driven [checked] will re-read from profile() which
      // was not mutated, so on next change detection the toggle re-aligns.
      // Force an immediate visual revert by patching the toggle target.
      const target = event.target as HTMLIonToggleElement | null;
      if (target) target.checked = current;
    }
  }

  async toggleNotif(key: SlotKey, enabled: boolean): Promise<boolean> {
    if (enabled && !(await this.allowNotifications())) return false;
    await this.profileStore.updateProfile(notificationPatch(key, enabled));
    await this.syncSelectedNotifications();
    return true;
  }

  private async allowNotifications(): Promise<boolean> {
    const granted = await this.notifications.requestPermission();
    this.permissionMissing.set(!granted);
    if (!granted) {
      const toast = await this.toastCtrl.create({
        message: 'Vui lòng vào Cài đặt > Ứng dụng > HealthMate AI > Thông báo để bật quyền.',
        duration: 4000,
        position: 'bottom',
      });
      await toast.present();
    }
    return granted;
  }

  private async syncSelectedNotifications(): Promise<void> {
    const profile = this.profile();
    if (profile)
      await this.notifications.sync(notificationFlags(profile, !this.permissionMissing()));
  }
}
