import { Component, afterNextRender } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [IonApp, IonRouterOutlet],
})
export class App {
  constructor() {
    afterNextRender(() => {
      SplashScreen.hide();

      // Sage wellness status bar (Android native only — sage tinted, light icons).
      // No-op on web platform; safe to call without try/catch (Capacitor returns Promise.reject silently).
      if (Capacitor.isNativePlatform()) {
        void StatusBar.setBackgroundColor({ color: '#6B8E6F' });
        void StatusBar.setStyle({ style: Style.Dark });
      }
    });
  }
}
