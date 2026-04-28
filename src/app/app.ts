import { Component, afterNextRender } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [IonApp, IonRouterOutlet],
})
export class App {
  constructor() {
    afterNextRender(() => {
      SplashScreen.hide();
    });
  }
}
