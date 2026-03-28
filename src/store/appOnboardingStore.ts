import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppOnboardingState {
  isAppOnboarded: boolean;
  setAppOnboarded: (value: boolean) => void;
}

export const useAppOnboardingStore = create<AppOnboardingState>()(
  persist(
    (set) => ({
      isAppOnboarded: false,
      setAppOnboarded: (value: boolean) => set({ isAppOnboarded: value }),
    }),
    { name: 'app-onboarding-storage' },
  ),
);
