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
  IonRadioGroup,
  IonRadio,
  IonToggle,
  ToastController,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { chevronForwardOutline } from 'ionicons/icons';
import { ProfileStore } from '../../core/stores/profile.store';
import { Theme, ThemeMode } from '../../core/services/theme/theme-service';
import { LocalNotifications, SlotKey } from '../../core/services/notifications/local-notifications';
import { UserProfile } from '../../core/models/user-profile.model';
import { activityLabelShort } from '../../core/services/profile/activity-label';
import { getActivityLevelFromFactor } from '../onboarding/onboarding-calculation';

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
    IonRadioGroup,
    IonRadio,
    IonToggle,
    RouterLink,
  ],
})
export default class SettingsPage {
  private profileStore = inject(ProfileStore);
  private theme = inject(Theme);
  private notifications = inject(LocalNotifications);
  private toastCtrl = inject(ToastController);

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

  readonly themeMode = computed<ThemeMode>(() => this.profile()?.theme ?? 'system');

  readonly morningEnabled = computed(() => !!this.profile()?.notif_morning);
  readonly lunchEnabled = computed(() => !!this.profile()?.notif_lunch);
  readonly eveningEnabled = computed(() => !!this.profile()?.notif_evening);
  readonly weeklyEnabled = computed(() => !!this.profile()?.notif_weekly);

  readonly appVersion = '1.0.0';

  constructor() {
    addIcons({ chevronForwardOutline });
  }

  async setTheme(mode: ThemeMode): Promise<void> {
    if (mode === this.themeMode()) return;
    this.theme.apply(mode);
    await this.profileStore.updateProfile({ theme: mode });
  }

  async onThemeChange(event: CustomEvent<{ value: ThemeMode }>): Promise<void> {
    await this.setTheme(event.detail.value);
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
    const v = enabled ? 1 : 0;
    const patch: Partial<UserProfile> =
      key === 'morning'
        ? { notif_morning: v }
        : key === 'lunch'
          ? { notif_lunch: v }
          : key === 'evening'
            ? { notif_evening: v }
            : { notif_weekly: v };
    await this.profileStore.updateProfile(patch);
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
