import type { UserProfile } from '../../../core/models/user-profile.model';

export type OnboardingProfile = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;

export interface OnboardingHandle {
  setDay(date: string): void;
  back(): boolean;
  free(): void;
}

interface OnboardingRenderer {
  default(): Promise<void>;
  mountOnboarding(
    host: HTMLElement,
    localDay: string,
    save: (profile: OnboardingProfile) => Promise<void>,
  ): OnboardingHandle;
}

export async function loadOnboardingRenderer(): Promise<OnboardingRenderer> {
  const url = new URL('assets/leptos/healthmate_dashboard.js', document.baseURI);
  const module: OnboardingRenderer = await import(
    /* webpackIgnore: true */ /* @vite-ignore */ url.href
  );
  await module.default();
  return module;
}
