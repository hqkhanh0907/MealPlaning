import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppOnboardingState {
  isAppOnboarded: boolean;
  onboardingSection: number | null;
  setAppOnboarded: (value: boolean) => void;
  setOnboardingSection: (section: number | null) => void;
}

export const useAppOnboardingStore = create<AppOnboardingState>()(
  persist(
    (set) => ({
      isAppOnboarded: false,
      onboardingSection: null,
      setAppOnboarded: (value: boolean) => set({ isAppOnboarded: value }),
      setOnboardingSection: (section: number | null) =>
        set({ onboardingSection: section }),
    }),
    {
      name: 'app-onboarding-storage',
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 1) {
          return { ...state, onboardingSection: null };
        }
        return state;
      },
    },
  ),
);
