import { create } from 'zustand';

export type ManagementSubTab = 'ingredients' | 'dishes';

const getLocalToday = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

interface UIState {
  hasNewAIResult: boolean;
  activeManagementSubTab: ManagementSubTab;
  selectedDate: string;
  setHasNewAIResult: (value: boolean) => void;
  setActiveManagementSubTab: (tab: ManagementSubTab) => void;
  setSelectedDate: (date: string) => void;
  hydrate: () => void;
}

export const useUIStore = create<UIState>(set => ({
  hasNewAIResult: false,
  activeManagementSubTab: 'dishes',
  selectedDate: getLocalToday(),
  setHasNewAIResult: value => set({ hasNewAIResult: value }),
  setActiveManagementSubTab: tab => set({ activeManagementSubTab: tab }),
  setSelectedDate: date => set({ selectedDate: date }),
  hydrate: () =>
    set({
      hasNewAIResult: false,
      activeManagementSubTab: 'dishes',
      selectedDate: getLocalToday(),
    }),
}));
