import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ProfileStore } from '../stores/profile.store';

/**
 * Route guard that redirects to /onboarding if the user
 * hasn't completed onboarding yet.
 *
 * Applied to the TabsPage route — blocks access to all tabs
 * until user_profile.onboarding_completed = 1.
 */
export const onboardingGuard: CanActivateFn = () => {
  const profileStore = inject(ProfileStore);
  const router = inject(Router);

  if (profileStore.isOnboardingComplete()) {
    return true;
  }

  return router.createUrlTree(['/onboarding']);
};

/**
 * Reverse guard for the /onboarding route — if the user has
 * already completed onboarding, redirect them back to the app
 * shell instead of letting them re-enter the wizard. Prevents
 * Android hardware-back from popping into a stale onboarding
 * page that is still sitting in the navigation stack.
 */
export const onboardingCompletedRedirectGuard: CanActivateFn = () => {
  const profileStore = inject(ProfileStore);
  const router = inject(Router);

  if (profileStore.isOnboardingComplete()) {
    return router.createUrlTree(['/']);
  }

  return true;
};
