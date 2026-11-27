import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, Platform } from '@ionic/angular/standalone';

@Injectable({ providedIn: 'root' })
export class WorkoutNavigation {
  private readonly router = inject(Router);
  private readonly nav = inject(NavController);
  private origin = '/tabs/dashboard';

  constructor() {
    inject(Platform).backButton.subscribeWithPriority(5, (next) => {
      if (this.router.url.startsWith('/training/')) void this.back();
      else next();
    });
  }

  rememberOrigin(): boolean {
    if (this.router.url.startsWith('/tabs/') && !this.router.url.startsWith('/tabs/fitness')) {
      this.origin = this.router.url;
    }
    return true;
  }

  back(): Promise<boolean> {
    return this.nav.navigateRoot(
      this.router.url.startsWith('/training/session') ? '/training/today' : this.origin,
    );
  }

  today(): Promise<boolean> {
    return this.nav.navigateRoot('/training/today');
  }

  session(): Promise<boolean> {
    return this.nav.navigateForward('/training/session');
  }
}
