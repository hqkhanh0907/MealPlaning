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
import { chevronForwardOutline, logOutOutline, syncOutline } from 'ionicons/icons';
import { ProfileStore } from '../../core/stores/profile.store';
import { GroqCredentials } from '../../core/services/ai/groq-credentials';
import { LocalNotifications } from '../../core/services/notifications/local-notifications';
import { ReminderCoordinator } from '../../core/services/notifications/reminder-coordinator';
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
  WORKOUT_REMINDER,
} from '../../core/services/notifications/notification-schedule';
import { activitySummaryForFactor } from '../../core/services/profile/activity-label';
import { environment } from '../../../environments/environment';
import { AccountSession } from '../../core/account/account-session';
import { AccountSync } from '../../core/account/account-sync';

type ReminderKey = SlotKey | 'workout';

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
  protected readonly accountSession = inject(AccountSession);
  protected readonly accountSync = inject(AccountSync);
  protected readonly groq = inject(GroqCredentials);
  protected readonly groqBusy = signal(false);
  protected readonly groqFeedback = signal<{ message: string; error: boolean } | null>(null);
  protected readonly signOutBusy = signal(false);
  protected readonly signOutError = signal('');
  protected readonly lastSyncLabel = computed(() => {
    const value = this.accountSync.lastSync();
    return value
      ? new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
      : '';
  });
  protected readonly syncLabel = computed(
    () =>
      ({
        idle: 'Chưa đồng bộ',
        working: 'Đang đồng bộ',
        saved: 'Đã đồng bộ',
        offline: 'Chưa kết nối được. Dữ liệu đã lưu trên máy.',
        expired:
          this.accountSync.reason() === 'session_revoked'
            ? 'Phiên đã bị thu hồi. Đăng nhập lại để đồng bộ.'
            : 'Phiên đã hết hạn. Đăng nhập lại để đồng bộ.',
        forbidden: 'Tài khoản thiếu quyền đồng bộ. Dữ liệu vẫn lưu trên máy.',
        conflict: 'Dữ liệu đã đổi ở nơi khác.',
        error: 'Đồng bộ gặp lỗi. Dữ liệu vẫn lưu trên máy.',
      })[this.accountSync.status()],
  );
  private readonly day = inject(LocalDay);
  private readonly profileStore = inject(ProfileStore);
  private readonly notifications = inject(LocalNotifications);
  private readonly reminders = inject(ReminderCoordinator);
  private readonly toastCtrl = inject(ToastController);

  readonly profile = this.profileStore.profile;

  readonly bodySummary = computed(() => {
    const p = this.profile();
    if (!p) return '';
    const age = ageOnDate(p.birth_date, this.day.date());
    const ageLabel = age === null ? 'Bổ sung ngày sinh' : `${age} tuổi`;
    return `${p.height_cm} cm, ${p.weight_kg} kg, ${ageLabel}, ${GENDER_LABELS[p.gender]}`;
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
  readonly workoutReminder = WORKOUT_REMINDER;
  readonly workoutReminderEnabled = this.reminders.workoutEnabled;
  readonly selectedNotifications = computed(() => notificationFlags(this.profile()));
  private readonly permissionMissing = signal(false);
  readonly notificationsPaused = computed(
    () =>
      this.permissionMissing() &&
      (this.workoutReminderEnabled() || Object.values(this.selectedNotifications()).some(Boolean)),
  );

  async ionViewWillEnter(): Promise<void> {
    void this.accountSync.refreshStatus();
    if (Capacitor.isNativePlatform())
      this.permissionMissing.set(!(await this.notifications.hasPermission()));
  }

  async resumeNotifications(): Promise<void> {
    if (await this.allowNotifications()) await this.reminders.refresh(true);
  }

  async configureGroqKey(): Promise<void> {
    await this.runGroqAction(() => this.groq.configure(), 'Đã lưu khóa Groq.');
  }

  async removeGroqKey(): Promise<void> {
    await this.runGroqAction(() => this.groq.remove(), 'Đã gỡ khóa Groq.');
  }

  private async runGroqAction(
    action: () => Promise<boolean | void>,
    message: string,
  ): Promise<void> {
    const owner = this.accountSession.current();
    if (!owner || !this.groq.supported || this.groqBusy()) return;
    this.groqBusy.set(true);
    this.groqFeedback.set(null);
    try {
      const changed = await action();
      if (changed !== false && owner === this.accountSession.current()) {
        this.groqFeedback.set({ message, error: false });
      }
    } catch {
      if (owner === this.accountSession.current()) {
        this.groqFeedback.set({
          message: 'Chưa cập nhật được khóa Groq. Hãy thử lại.',
          error: true,
        });
      }
    } finally {
      this.groqBusy.set(false);
    }
  }

  protected async signOut(): Promise<void> {
    const account = this.accountSession.current();
    if (!account || this.signOutBusy()) return;
    this.signOutBusy.set(true);
    this.signOutError.set('');
    try {
      await this.accountSession.clear();
    } catch {
      this.signOutError.set('Chưa thể đăng xuất. Hãy thử lại.');
      this.signOutBusy.set(false);
      return;
    }
    await this.reminders.clear().catch(() => undefined);
    window.location.replace('/account');
  }

  readonly appVersion = environment.appVersion;

  constructor() {
    addIcons({ chevronForwardOutline, logOutOutline, syncOutline });
  }

  async onToggleChange(
    key: ReminderKey,
    enabled: boolean,
    toggle: Pick<IonToggle, 'checked'>,
  ): Promise<void> {
    const current =
      key === 'workout' ? this.workoutReminderEnabled() : this.selectedNotifications()[key];
    if (enabled === current) return;
    toggle.checked = current;
    await this.toggleNotif(key, enabled);
  }

  async toggleNotif(key: ReminderKey, enabled: boolean): Promise<boolean> {
    const owner = this.accountSession.current();
    if (enabled && !(await this.allowNotifications())) return false;
    if (this.accountSession.current() !== owner) return false;
    if (key === 'workout') {
      this.reminders.setWorkoutEnabled(enabled);
    } else {
      await this.profileStore.updateProfile(notificationPatch(key, enabled));
    }
    await this.reminders.refresh(enabled ? true : undefined);
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
}
