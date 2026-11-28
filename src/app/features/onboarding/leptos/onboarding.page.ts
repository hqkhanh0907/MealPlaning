import {
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { App as CapacitorApp } from '@capacitor/app';
import { defineCustomElement as defineButton } from '@ionic/core/components/ion-button';
import { defineCustomElement as defineButtons } from '@ionic/core/components/ion-buttons';
import { defineCustomElement as defineContent } from '@ionic/core/components/ion-content';
import { defineCustomElement as defineFooter } from '@ionic/core/components/ion-footer';
import { defineCustomElement as defineHeader } from '@ionic/core/components/ion-header';
import { defineCustomElement as defineProgress } from '@ionic/core/components/ion-progress-bar';
import { defineCustomElement as defineText } from '@ionic/core/components/ion-text';
import { defineCustomElement as defineTitle } from '@ionic/core/components/ion-title';
import { defineCustomElement as defineToolbar } from '@ionic/core/components/ion-toolbar';
import { addIcons } from 'ionicons';
import { defineCustomElement as defineIcon } from 'ionicons/components/ion-icon';
import {
  arrowBackOutline,
  barbellOutline,
  bodyOutline,
  checkmark,
  chevronDownOutline,
  scaleOutline,
  trophyOutline,
} from 'ionicons/icons';
import { AccountSession } from '../../../core/account/account-session';
import { LocalDay } from '../../../core/stores/local-day';
import { ProfileStore } from '../../../core/stores/profile.store';
import LegacyOnboardingPage from '../onboarding.page';
import {
  loadOnboardingRenderer,
  type OnboardingHandle,
  type OnboardingProfile,
} from './onboarding-renderer';

@Component({
  selector: 'app-leptos-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrl: './onboarding.page.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [LegacyOnboardingPage],
})
export default class LeptosOnboardingPage {
  protected readonly fallback = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly day = inject(LocalDay);
  private readonly profiles = inject(ProfileStore);
  private readonly accounts = inject(AccountSession);
  private readonly owner = this.accounts.current()?.id;
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);
  private readonly wizard = signal<OnboardingHandle | null>(null);
  private readonly legacy = viewChild(LegacyOnboardingPage);
  private listener?: Promise<{ remove(): Promise<void> }>;
  private active = true;

  constructor() {
    afterNextRender(async () => {
      try {
        const module = await loadOnboardingRenderer();
        if (this.destroy.destroyed) return;
        [
          defineButton,
          defineButtons,
          defineContent,
          defineFooter,
          defineHeader,
          defineProgress,
          defineText,
          defineTitle,
          defineToolbar,
          defineIcon,
        ].forEach((register) => register());
        addIcons({
          arrowBackOutline,
          barbellOutline,
          bodyOutline,
          checkmark,
          chevronDownOutline,
          scaleOutline,
          trophyOutline,
        });
        this.wizard.set(
          module.mountOnboarding(this.host.nativeElement, this.day.iso(), (profile) =>
            this.save(profile),
          ),
        );
        this.listen();
      } catch {
        if (!this.destroy.destroyed) this.fallback.set(true);
      }
    });
    effect(() => this.wizard()?.setDay(this.day.iso()));
    this.destroy.onDestroy(() => {
      this.ionViewWillLeave();
      this.wizard()?.free();
    });
  }

  ionViewWillEnter(): void {
    this.active = true;
    this.listen();
  }

  ionViewWillLeave(): void {
    this.active = false;
    this.legacy()?.ionViewWillLeave();
    const listener = this.listener;
    this.listener = undefined;
    void listener?.then((handle) => handle.remove());
  }

  private listen(): void {
    if (!this.active || this.listener || !this.wizard()) return;
    this.listener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (this.active && !this.wizard()?.back() && !canGoBack) void CapacitorApp.exitApp();
    });
  }

  private async save(profile: OnboardingProfile): Promise<void> {
    if (!this.active || this.accounts.current()?.id !== this.owner)
      throw new Error('Session changed');
    await this.profiles.saveOnboardingProfile(profile);
    if (this.active && !this.destroy.destroyed && this.accounts.current()?.id === this.owner) {
      void this.router.navigateByUrl('/', { replaceUrl: true });
    }
  }
}
