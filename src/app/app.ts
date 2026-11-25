import { LocalDay } from './core/stores/local-day';
import { Component, DestroyRef, NgZone, afterNextRender, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

import { Database } from './core/services/database/database';
import { NetworkStore } from './core/stores/network.store';
import { ProfileStore } from './core/stores/profile.store';
import { Theme } from './core/services/theme/theme-service';
import { LocalNotifications } from './core/services/notifications/local-notifications';
import { notificationFlags } from './core/services/notifications/notification-preferences';
import { cleanupOldAiLogs } from './core/services/ai/ai-log';
import { localIsoDate } from './core/utils/local-date';
import { AccountSession } from './core/account/account-session';
import { AccountSync } from './core/account/account-sync';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [IonApp, IonRouterOutlet],
  host: {
    '(document:visibilitychange)': 'onVisibilityChange()',
    '(window:pageshow)': 'onVisibilityChange()',
  },
})
export class App {
  private readonly account = inject(AccountSession);
  private readonly sync = inject(AccountSync);
  private readonly db = inject(Database);
  private readonly network = inject(NetworkStore);
  private readonly profileStore = inject(ProfileStore);
  private readonly themeService = inject(Theme);
  private readonly notifications = inject(LocalNotifications);
  private readonly zone = inject(NgZone);
  private readonly localDay = inject(LocalDay);
  private dateTimer?: number;
  private syncTimer?: number;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      window.clearTimeout(this.dateTimer);
      window.clearInterval(this.syncTimer);
    });
    // Profile is loaded by APP_INITIALIZER (xem database.provider.ts) before
    // the App component is instantiated, so the signal is already populated
    // (or null if onboarding hasn't been completed).
    // Light-only since Story 2.6 (2026-05-08). Theme service is a no-op shim.
    this.themeService.apply('light');

    afterNextRender(() => {
      this.onVisibilityChange();
      SplashScreen.hide();
      if (this.account.required && !this.account.current()) return;
      if (Capacitor.isNativePlatform()) {
        void this.syncNotificationsFromProfile().catch((err) =>
          console.warn('[App] notification sync failed:', err),
        );
      }

      if (Capacitor.isNativePlatform()) {
        const color = getComputedStyle(document.documentElement)
          .getPropertyValue('--ion-toolbar-background')
          .trim();
        void StatusBar.setBackgroundColor({ color });
        void StatusBar.setStyle({ style: Style.Light });
      }

      // Phase 1.5B infra hooks — fire-and-forget; failures must NOT block UI.
      void this.network.start();
      if (this.account.required) {
        this.zone.runOutsideAngular(() => {
          this.syncTimer = window.setInterval(() => {
            if (!document.hidden && this.network.online() && this.sync.status() !== 'conflict') {
              void this.sync.sync();
            }
          }, 15_000);
        });
      }
      // 30-day retention for ai_chat_log (xem ai-strategy.md §4.4).
      void cleanupOldAiLogs(this.db, 30).catch((err) =>
        console.warn('[App] cleanupOldAiLogs failed:', err),
      );
    });
  }

  protected onVisibilityChange(): void {
    window.clearTimeout(this.dateTimer);
    if (this.account.required && !this.account.current()) return;
    if (!document.hidden) this.watchLocalDay();
  }

  private watchLocalDay(previousDay?: string, quickChecks = 5): void {
    if (document.hidden) return;
    const now = new Date();
    const today = localIsoDate(now);
    if (today !== previousDay) {
      this.localDay.iso.set(today);
      void this.profileStore
        .refreshTargets(now)
        .catch((err) => console.warn('[App] profile targets refresh failed:', err));
    }
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    // Android can publish a new time zone after the WebView becomes visible.
    const delay = Math.min(midnight.getTime() - now.getTime(), quickChecks > 0 ? 1000 : 60_000);
    this.zone.runOutsideAngular(() => {
      this.dateTimer = window.setTimeout(
        () => this.watchLocalDay(today, Math.max(0, quickChecks - 1)),
        delay,
      );
    });
  }

  private async syncNotificationsFromProfile(): Promise<void> {
    const p = this.profileStore.profile();
    if (!p) {
      return;
    }

    const granted = await this.notifications.hasPermission();
    await this.notifications.sync(notificationFlags(p, granted));
  }
}
