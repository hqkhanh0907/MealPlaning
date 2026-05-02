import { Component, afterNextRender, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

import { Database } from './core/services/database/database';
import { NetworkStore } from './core/stores/network.store';
import { ProfileStore } from './core/stores/profile.store';
import { Theme } from './core/services/theme/theme-service';
import { LocalNotifications } from './core/services/notifications/local-notifications';
import { cleanupOldAiLogs } from './core/services/ai/gemini-client';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [IonApp, IonRouterOutlet],
})
export class App {
  private readonly db = inject(Database);
  private readonly network = inject(NetworkStore);
  private readonly profileStore = inject(ProfileStore);
  private readonly themeService = inject(Theme);
  private readonly notifications = inject(LocalNotifications);

  constructor() {
    // Profile is loaded by APP_INITIALIZER (xem database.provider.ts) before
    // the App component is instantiated, so the signal is already populated
    // (or null if onboarding hasn't been completed).
    this.themeService.apply(this.profileStore.profile()?.theme ?? 'system');

    const p = this.profileStore.profile();
    if (p) {
      void this.notifications.sync({
        morning: !!p.notif_morning,
        lunch: !!p.notif_lunch,
        evening: !!p.notif_evening,
        weekly: !!p.notif_weekly,
      });
    }

    afterNextRender(() => {
      SplashScreen.hide();

      // Sage wellness status bar (Android native only — sage tinted, light icons).
      // No-op on web platform; safe to call without try/catch (Capacitor returns Promise.reject silently).
      if (Capacitor.isNativePlatform()) {
        void StatusBar.setBackgroundColor({ color: '#6B8E6F' });
        void StatusBar.setStyle({ style: Style.Dark });
      }

      // Phase 1.5B infra hooks — fire-and-forget; failures must NOT block UI.
      void this.network.start();
      // 30-day retention for ai_chat_log (xem ai-strategy.md §4.4).
      void cleanupOldAiLogs(this.db, 30).catch((err) =>
        console.warn('[App] cleanupOldAiLogs failed:', err),
      );
    });
  }
}
