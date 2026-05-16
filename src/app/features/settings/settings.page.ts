import { Component, computed, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
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
import { LocalNotifications, SlotKey } from '../../core/services/notifications/local-notifications';
import { UserProfile } from '../../core/models/user-profile.model';
import { activityLabelShort } from '../../core/services/profile/activity-label';
import { getActivityLevelFromFactor } from '../onboarding/onboarding-calculation';
import { environment } from '../../../environments/environment';

const GENDER_LABELS: Record<UserProfile['gender'], string> = {
  male: 'Nam',
  female: 'Nữ',
};

const GOAL_LABELS: Record<UserProfile['goal'], string> = {
  lose_weight: 'Giảm cân',
  gain_muscle: 'Tăng cơ',
  maintain: 'Duy trì',
  performance: 'Tăng sức mạnh',
};

function activityLabel(factor: number): string {
  const level = getActivityLevelFromFactor(factor) ?? 'sedentary';
  return activityLabelShort(level);
}

function notificationPatch(key: SlotKey, value: 0 | 1): Partial<UserProfile> {
  switch (key) {
    case 'morning':
      return { notif_morning: value };
    case 'lunch':
      return { notif_lunch: value };
    case 'evening':
      return { notif_evening: value };
    case 'weekly':
      return { notif_weekly: value };
  }
}

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
  private readonly profileStore = inject(ProfileStore);
  private readonly notifications = inject(LocalNotifications);
  private readonly toastCtrl = inject(ToastController);

  readonly profile = this.profileStore.profile;

  readonly bodySummary = computed(() => {
    const p = this.profile();
    if (!p) return '';
    return `${p.height_cm}cm · ${p.weight_kg}kg · ${p.age} tuổi · ${GENDER_LABELS[p.gender]}`;
  });

  readonly goalSummary = computed(() => {
    const p = this.profile();
    return p ? GOAL_LABELS[p.goal] : '';
  });

  readonly activitySummary = computed(() => {
    const p = this.profile();
    return p ? activityLabel(p.activity_factor) : '';
  });

  readonly morningEnabled = computed(() => !!this.profile()?.notif_morning);
  readonly lunchEnabled = computed(() => !!this.profile()?.notif_lunch);
  readonly eveningEnabled = computed(() => !!this.profile()?.notif_evening);
  readonly weeklyEnabled = computed(() => !!this.profile()?.notif_weekly);

  readonly appVersion = environment.appVersion;

  constructor() {
    addIcons({ chevronForwardOutline });
  }

  async onToggleChange(key: SlotKey, event: CustomEvent<{ checked: boolean }>): Promise<void> {
    const enabled = event.detail.checked;
    const current = this.readFlag(key);
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
    if (enabled) {
      const granted = await this.notifications.requestPermission();
      if (!granted) {
        const t = await this.toastCtrl.create({
          message: 'Vui lòng vào Cài đặt > Ứng dụng > HealthMate AI > Thông báo để bật quyền.',
          duration: 4000,
          position: 'bottom',
        });
        await t.present();
        return false;
      }
    }
    await this.profileStore.updateProfile(notificationPatch(key, enabled ? 1 : 0));
    const p = this.profile();
    if (p) {
      await this.notifications.sync({
        morning: !!p.notif_morning,
        lunch: !!p.notif_lunch,
        evening: !!p.notif_evening,
        weekly: !!p.notif_weekly,
      });
    }
    return true;
  }

  private readFlag(key: SlotKey): boolean {
    const p = this.profile();
    if (!p) return false;
    switch (key) {
      case 'morning':
        return !!p.notif_morning;
      case 'lunch':
        return !!p.notif_lunch;
      case 'evening':
        return !!p.notif_evening;
      case 'weekly':
        return !!p.notif_weekly;
    }
  }
}
