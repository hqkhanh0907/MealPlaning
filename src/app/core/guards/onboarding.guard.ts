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
