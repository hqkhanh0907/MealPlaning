import { create } from 'zustand';
import type { MainTab } from '../components/navigation/types';

const MAX_PAGE_STACK_DEPTH = 2;

interface PageEntry {
  id: string;
  component: string;
  props?: Record<string, unknown>;
}

interface NavigationState {
  activeTab: MainTab;
  pageStack: PageEntry[];
  showBottomNav: boolean;
  tabScrollPositions: Record<string, number>;
  tabHistory: MainTab[];

  navigateTab: (tab: MainTab) => void;
  navigateTabBack: (tab: MainTab) => void;
  pushPage: (page: PageEntry) => void;
  popPage: () => void;
  canGoBack: () => boolean;
  setScrollPosition: (tab: string, position: number) => void;
  getScrollPosition: (tab: string) => number;
}

const useNavigationStore = create<NavigationState>((set, get) => ({
  activeTab: 'calendar',
  pageStack: [],
  showBottomNav: true,
  tabScrollPositions: {},
  tabHistory: [],

  navigateTab: (tab: MainTab) => {
    set((state) => ({
      activeTab: tab,
      tabHistory: [...state.tabHistory, state.activeTab],
      pageStack: [],
      showBottomNav: true,
    }));
  },

  navigateTabBack: (tab: MainTab) => {
    set({
      activeTab: tab,
      pageStack: [],
      showBottomNav: true,
    });
  },

  pushPage: (page: PageEntry) => {
    set((state) => {
      const stack = state.pageStack;
      if (stack.length >= MAX_PAGE_STACK_DEPTH) {
        return {
          pageStack: [...stack.slice(0, -1), page],
          showBottomNav: false,
        };
      }
      return {
        pageStack: [...stack, page],
        showBottomNav: false,
      };
    });
  },

  popPage: () => {
    set((state) => {
      if (state.pageStack.length === 0) return state;
      const newStack = state.pageStack.slice(0, -1);
      return {
        pageStack: newStack,
        showBottomNav: newStack.length === 0,
      };
    });
  },

  canGoBack: () => get().pageStack.length > 0,

  setScrollPosition: (tab: string, position: number) => {
    set((state) => ({
      tabScrollPositions: { ...state.tabScrollPositions, [tab]: position },
    }));
  },

  getScrollPosition: (tab: string) => get().tabScrollPositions[tab] ?? 0,
}));

export type { PageEntry, NavigationState };
export type { MainTab } from '../components/navigation/types';
export { useNavigationStore };
