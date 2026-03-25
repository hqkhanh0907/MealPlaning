# Phase 0: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose the monolithic App.tsx (545 lines, 8 state vars, 18 handlers) into Zustand stores + create navigation infrastructure + setup design tokens — all prerequisite for Phases 1-7.

**Architecture:** Extract state from App.tsx into domain Zustand stores (still backed by localStorage — zero behavior change). Create a Zustand-based navigation store to support full-screen pages (WorkoutLogger, CardioLogger) without adding React Router. Setup CSS custom properties for design tokens (spacing, color, shadow, radius, typography). Extract reusable SubTabBar from CalendarTab's inline sub-tab code.

**Tech Stack:** React 19, TypeScript 5.8, Zustand 5.0.11, Vite 6, Tailwind CSS 4.1, lucide-react 0.546.0, motion 12.23.24, Vitest 4.0.18

**Spec:** `docs/superpowers/specs/2026-03-23-nutrition-fitness-integration-design.md` — §2.4, §2.5, §3.3, §12.1-12.6

---

## File Structure (all new files)

```
src/
├── store/                          # NEW: Zustand stores
│   ├── navigationStore.ts          # Tab + page stack navigation
│   ├── ingredientStore.ts          # Ingredients state (from App.tsx)
│   ├── dishStore.ts                # Dishes state (from App.tsx)
│   ├── dayPlanStore.ts             # Day plans state (from App.tsx)
│   ├── userProfileStore.ts         # User profile state (from App.tsx)
│   └── uiStore.ts                  # UI state: modals, selectedDate, activeSubTab
├── components/
│   ├── shared/
│   │   └── SubTabBar.tsx           # NEW: Reusable sub-tab navigation bar
│   └── navigation/
│       ├── AppNavigation.tsx       # MODIFY: Use navigationStore, update icons/tabs
│       ├── types.ts                # MODIFY: Update MainTab type
│       └── TabRouter.tsx           # NEW: Renders active tab + page stack
├── styles/
│   └── tokens.css                  # NEW: Design tokens CSS custom properties
├── App.tsx                         # MODIFY: Slim from 545 → ~120 lines
└── index.css                       # MODIFY: Import tokens.css
```

### Test files (all new)

```
src/__tests__/
├── navigationStore.test.ts         # Navigation store unit tests
├── ingredientStore.test.ts         # Ingredient store unit tests
├── dishStore.test.ts               # Dish store unit tests
├── dayPlanStore.test.ts            # Day plan store unit tests
├── userProfileStore.test.ts        # User profile store unit tests
├── uiStore.test.ts                 # UI store unit tests
├── subTabBar.test.tsx              # SubTabBar component tests
└── tabRouter.test.tsx              # TabRouter component tests
```

---

## Task 1: Navigation Store

**Files:**
- Create: `src/store/navigationStore.ts`
- Create: `src/__tests__/navigationStore.test.ts`
- Modify: `src/components/navigation/types.ts`

### Step 1.1: Update MainTab type

- [ ] **Update MainTab type in types.ts**

```typescript
// src/components/navigation/types.ts
import { TFunction } from 'i18next';

// Phase 3 will activate 'fitness' | 'dashboard'. For now keep old tabs working.
export type MainTab = 'calendar' | 'management' | 'ai-analysis' | 'grocery' | 'settings';

// Future (Phase 3):
// export type MainTab = 'calendar' | 'library' | 'ai-analysis' | 'fitness' | 'dashboard';

export type PageEntry = {
  id: string;
  component?: string;  // For lazy-loaded component name (used in Phase 3+)
  props?: Record<string, unknown>;
};

export type ScheduleSubTab = 'meals' | 'nutrition';
export type ManagementSubTab = 'dishes' | 'ingredients';

/** i18n-aware tab labels factory — callers pass `t` from useTranslation(). */
export const getTabLabels = (t: TFunction): Record<MainTab, string> => ({
  'calendar': t('nav.calendar'),
  'management': t('nav.management'),
  'ai-analysis': t('nav.aiAnalysis'),
  'grocery': t('nav.grocery'),
  'settings': t('nav.settings'),
});
```

> **Note:** MainTab type stays the same for now — Phase 3 will change it. We only add `PageEntry`, `ScheduleSubTab`, `ManagementSubTab` exports here.

- [ ] **Run lint to verify types compile**

```bash
npx tsc --noEmit
```

Expected: PASS (no type errors)

### Step 1.2: Write failing tests for navigation store

- [ ] **Write navigation store tests**

```typescript
// src/__tests__/navigationStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNavigationStore } from '../store/navigationStore';

describe('navigationStore', () => {
  beforeEach(() => {
    // Reset Zustand store between tests
    useNavigationStore.setState(useNavigationStore.getInitialState());
  });

  describe('tab navigation', () => {
    it('starts on calendar tab', () => {
      const state = useNavigationStore.getState();
      expect(state.activeTab).toBe('calendar');
    });

    it('switches tab and shows bottom nav', () => {
      useNavigationStore.getState().navigateTab('settings');
      const state = useNavigationStore.getState();
      expect(state.activeTab).toBe('settings');
      expect(state.showBottomNav).toBe(true);
    });

    it('preserves scroll position per tab', () => {
      useNavigationStore.getState().setTabScrollPosition('calendar', 250);
      useNavigationStore.getState().navigateTab('settings');
      useNavigationStore.getState().navigateTab('calendar');
      const state = useNavigationStore.getState();
      expect(state.tabScrollPositions.calendar).toBe(250);
    });
  });

  describe('page stack navigation', () => {
    it('pushPage hides bottom nav', () => {
      useNavigationStore.getState().pushPage({ id: 'workout-logger' });
      const state = useNavigationStore.getState();
      expect(state.pageStack).toHaveLength(1);
      expect(state.pageStack[0].id).toBe('workout-logger');
      expect(state.showBottomNav).toBe(false);
    });

    it('popPage restores bottom nav when stack empty', () => {
      useNavigationStore.getState().pushPage({ id: 'workout-logger' });
      useNavigationStore.getState().popPage();
      const state = useNavigationStore.getState();
      expect(state.pageStack).toHaveLength(0);
      expect(state.showBottomNav).toBe(true);
    });

    it('popPage keeps bottom nav hidden when stack still has pages', () => {
      useNavigationStore.getState().pushPage({ id: 'workout-logger' });
      useNavigationStore.getState().pushPage({ id: 'exercise-selector' });
      useNavigationStore.getState().popPage();
      const state = useNavigationStore.getState();
      expect(state.pageStack).toHaveLength(1);
      expect(state.showBottomNav).toBe(false);
    });

    it('enforces max depth of 2', () => {
      useNavigationStore.getState().pushPage({ id: 'page-1' });
      useNavigationStore.getState().pushPage({ id: 'page-2' });
      useNavigationStore.getState().pushPage({ id: 'page-3' });
      const state = useNavigationStore.getState();
      expect(state.pageStack).toHaveLength(2);
    });

    it('canGoBack returns true when page stack has entries', () => {
      expect(useNavigationStore.getState().canGoBack()).toBe(false);
      useNavigationStore.getState().pushPage({ id: 'workout-logger' });
      expect(useNavigationStore.getState().canGoBack()).toBe(true);
    });

    it('pushPage passes props', () => {
      useNavigationStore.getState().pushPage({ id: 'workout-logger', props: { workoutId: '123' } });
      const state = useNavigationStore.getState();
      expect(state.pageStack[0].props).toEqual({ workoutId: '123' });
    });
  });

  describe('tab switch clears page stack', () => {
    it('navigateTab clears page stack', () => {
      useNavigationStore.getState().pushPage({ id: 'workout-logger' });
      useNavigationStore.getState().navigateTab('settings');
      const state = useNavigationStore.getState();
      expect(state.pageStack).toHaveLength(0);
      expect(state.showBottomNav).toBe(true);
    });
  });
});
```

- [ ] **Run test to verify it fails**

```bash
npx vitest run src/__tests__/navigationStore.test.ts
```

Expected: FAIL — `Cannot find module '../store/navigationStore'`

### Step 1.3: Implement navigation store

- [ ] **Create navigation store**

```typescript
// src/store/navigationStore.ts
import { create } from 'zustand';
import type { MainTab, PageEntry } from '../components/navigation/types';

const MAX_PAGE_STACK_DEPTH = 2;

interface NavigationState {
  activeTab: MainTab;
  pageStack: PageEntry[];
  showBottomNav: boolean;
  tabScrollPositions: Record<string, number>;

  navigateTab: (tab: MainTab) => void;
  pushPage: (page: PageEntry) => void;
  popPage: () => void;
  canGoBack: () => boolean;
  setTabScrollPosition: (tab: MainTab, position: number) => void;
}

export const useNavigationStore = create<NavigationState>()((set, get) => ({
  activeTab: 'calendar',
  pageStack: [],
  showBottomNav: true,
  tabScrollPositions: {},

  navigateTab: (tab) => set({
    activeTab: tab,
    pageStack: [],
    showBottomNav: true,
  }),

  pushPage: (page) => set((state) => {
    if (state.pageStack.length >= MAX_PAGE_STACK_DEPTH) {
      return state;
    }
    return {
      pageStack: [...state.pageStack, page],
      showBottomNav: false,
    };
  }),

  popPage: () => set((state) => {
    const newStack = state.pageStack.slice(0, -1);
    return {
      pageStack: newStack,
      showBottomNav: newStack.length === 0,
    };
  }),

  canGoBack: () => get().pageStack.length > 0,

  setTabScrollPosition: (tab, position) => set((state) => ({
    tabScrollPositions: { ...state.tabScrollPositions, [tab]: position },
  })),
}));
```

- [ ] **Run test to verify it passes**

```bash
npx vitest run src/__tests__/navigationStore.test.ts
```

Expected: ALL PASS (8 tests)

- [ ] **Run lint**

```bash
npm run lint
```

Expected: PASS

- [ ] **Commit**

```bash
git add src/store/navigationStore.ts src/__tests__/navigationStore.test.ts src/components/navigation/types.ts
git commit -m "feat: add Zustand navigation store with page stack support

- NavigationState: activeTab, pageStack, showBottomNav, tabScrollPositions
- pushPage hides bottom nav, popPage restores when stack empty
- Max depth: 2 (Tab → Full-screen page)
- navigateTab clears page stack
- 8 unit tests all passing

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: Ingredient Store (extract from App.tsx)

**Files:**
- Create: `src/store/ingredientStore.ts`
- Create: `src/__tests__/ingredientStore.test.ts`

### Step 2.1: Write failing tests

- [ ] **Write ingredient store tests**

```typescript
// src/__tests__/ingredientStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useIngredientStore } from '../store/ingredientStore';
import { initialIngredients } from '../data/initialData';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ingredientStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useIngredientStore.setState(useIngredientStore.getInitialState());
  });

  it('initializes with initial ingredients', () => {
    const state = useIngredientStore.getState();
    expect(state.ingredients.length).toBeGreaterThan(0);
    expect(state.ingredients).toEqual(initialIngredients);
  });

  it('adds an ingredient', () => {
    const newIngredient = {
      id: 'test-1',
      name: { vi: 'Test' },
      caloriesPer100g: 100,
      proteinPer100g: 10,
      carbsPer100g: 20,
      fatPer100g: 5,
      fiberPer100g: 2,
      unit: 'g' as const,
      numericValuePer100g: 100,
    };
    useIngredientStore.getState().addIngredient(newIngredient);
    const state = useIngredientStore.getState();
    expect(state.ingredients).toContainEqual(newIngredient);
  });

  it('updates an ingredient', () => {
    const ingredients = useIngredientStore.getState().ingredients;
    const first = ingredients[0];
    const updated = { ...first, caloriesPer100g: 999 };
    useIngredientStore.getState().updateIngredient(updated);
    const state = useIngredientStore.getState();
    const found = state.ingredients.find(i => i.id === first.id);
    expect(found?.caloriesPer100g).toBe(999);
  });

  it('deletes an ingredient', () => {
    const ingredients = useIngredientStore.getState().ingredients;
    const firstId = ingredients[0].id;
    const originalLen = ingredients.length;
    useIngredientStore.getState().deleteIngredient(firstId);
    const state = useIngredientStore.getState();
    expect(state.ingredients).toHaveLength(originalLen - 1);
    expect(state.ingredients.find(i => i.id === firstId)).toBeUndefined();
  });

  it('sets all ingredients (for import)', () => {
    useIngredientStore.getState().setIngredients([]);
    expect(useIngredientStore.getState().ingredients).toEqual([]);
  });
});
```

- [ ] **Run test to verify it fails**

```bash
npx vitest run src/__tests__/ingredientStore.test.ts
```

Expected: FAIL — `Cannot find module '../store/ingredientStore'`

### Step 2.2: Implement ingredient store

- [ ] **Create ingredient store**

```typescript
// src/store/ingredientStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Ingredient } from '../types';
import { initialIngredients } from '../data/initialData';
import { migrateIngredients } from '../services/dataService';

interface IngredientState {
  ingredients: Ingredient[];
  addIngredient: (ingredient: Ingredient) => void;
  updateIngredient: (ingredient: Ingredient) => void;
  deleteIngredient: (id: string) => void;
  setIngredients: (ingredients: Ingredient[]) => void;
}

export const useIngredientStore = create<IngredientState>()(
  persist(
    (set) => ({
      ingredients: initialIngredients,

      addIngredient: (ingredient) => set((state) => ({
        ingredients: [...state.ingredients, ingredient],
      })),

      updateIngredient: (ingredient) => set((state) => ({
        ingredients: state.ingredients.map((i) =>
          i.id === ingredient.id ? ingredient : i
        ),
      })),

      deleteIngredient: (id) => set((state) => ({
        ingredients: state.ingredients.filter((i) => i.id !== id),
      })),

      setIngredients: (ingredients) => set({ ingredients }),
    }),
    {
      name: 'mp-ingredients',
      // Transform on hydration: apply migrations
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.ingredients = migrateIngredients(state.ingredients);
        }
      },
    }
  )
);
```

- [ ] **Run test to verify it passes**

```bash
npx vitest run src/__tests__/ingredientStore.test.ts
```

Expected: ALL PASS (5 tests)

- [ ] **Run lint**

```bash
npm run lint
```

Expected: PASS

- [ ] **Commit**

```bash
git add src/store/ingredientStore.ts src/__tests__/ingredientStore.test.ts
git commit -m "feat: extract ingredient state to Zustand store

- CRUD operations: add, update, delete, setAll
- Persist to localStorage (key: mp-ingredients)
- Migration on rehydration via migrateIngredients()
- 5 unit tests all passing

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: Dish Store (extract from App.tsx)

**Files:**
- Create: `src/store/dishStore.ts`
- Create: `src/__tests__/dishStore.test.ts`

### Step 3.1: Write failing tests

- [ ] **Write dish store tests**

```typescript
// src/__tests__/dishStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDishStore } from '../store/dishStore';
import { initialDishes } from '../data/initialData';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('dishStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useDishStore.setState(useDishStore.getInitialState());
  });

  it('initializes with initial dishes', () => {
    const state = useDishStore.getState();
    expect(state.dishes.length).toBeGreaterThan(0);
    expect(state.dishes).toEqual(initialDishes);
  });

  it('adds a dish', () => {
    const newDish = {
      id: 'test-dish-1',
      name: { vi: 'Test Dish' },
      ingredients: [],
      tags: ['breakfast' as const],
    };
    useDishStore.getState().addDish(newDish);
    expect(useDishStore.getState().dishes).toContainEqual(newDish);
  });

  it('updates a dish', () => {
    const dishes = useDishStore.getState().dishes;
    const first = dishes[0];
    const updated = { ...first, tags: ['lunch' as const] };
    useDishStore.getState().updateDish(updated);
    const found = useDishStore.getState().dishes.find(d => d.id === first.id);
    expect(found?.tags).toEqual(['lunch']);
  });

  it('deletes a dish', () => {
    const dishes = useDishStore.getState().dishes;
    const firstId = dishes[0].id;
    const originalLen = dishes.length;
    useDishStore.getState().deleteDish(firstId);
    expect(useDishStore.getState().dishes).toHaveLength(originalLen - 1);
  });

  it('sets all dishes (for import)', () => {
    useDishStore.getState().setDishes([]);
    expect(useDishStore.getState().dishes).toEqual([]);
  });
});
```

- [ ] **Run test to verify it fails**

```bash
npx vitest run src/__tests__/dishStore.test.ts
```

Expected: FAIL — `Cannot find module '../store/dishStore'`

### Step 3.2: Implement dish store

- [ ] **Create dish store**

```typescript
// src/store/dishStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Dish } from '../types';
import { initialDishes } from '../data/initialData';
import { migrateDishes } from '../services/dataService';

interface DishState {
  dishes: Dish[];
  addDish: (dish: Dish) => void;
  updateDish: (dish: Dish) => void;
  deleteDish: (id: string) => void;
  setDishes: (dishes: Dish[]) => void;
}

export const useDishStore = create<DishState>()(
  persist(
    (set) => ({
      dishes: initialDishes,

      addDish: (dish) => set((state) => ({
        dishes: [...state.dishes, dish],
      })),

      updateDish: (dish) => set((state) => ({
        dishes: state.dishes.map((d) =>
          d.id === dish.id ? dish : d
        ),
      })),

      deleteDish: (id) => set((state) => ({
        dishes: state.dishes.filter((d) => d.id !== id),
      })),

      setDishes: (dishes) => set({ dishes }),
    }),
    {
      name: 'mp-dishes',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.dishes = migrateDishes(state.dishes);
        }
      },
    }
  )
);
```

- [ ] **Run tests, lint, commit**

```bash
npx vitest run src/__tests__/dishStore.test.ts
npm run lint
git add src/store/dishStore.ts src/__tests__/dishStore.test.ts
git commit -m "feat: extract dish state to Zustand store

- CRUD operations: add, update, delete, setAll
- Persist to localStorage (key: mp-dishes)
- Migration on rehydration via migrateDishes()
- 5 unit tests all passing

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: DayPlan Store (extract from App.tsx)

**Files:**
- Create: `src/store/dayPlanStore.ts`
- Create: `src/__tests__/dayPlanStore.test.ts`

### Step 4.1: Write failing tests

- [ ] **Write day plan store tests**

```typescript
// src/__tests__/dayPlanStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDayPlanStore } from '../store/dayPlanStore';
import type { DayPlan } from '../types';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('dayPlanStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useDayPlanStore.setState(useDayPlanStore.getInitialState());
  });

  it('initializes with empty day plans', () => {
    expect(useDayPlanStore.getState().dayPlans).toEqual([]);
  });

  it('sets day plans', () => {
    const plans: DayPlan[] = [{
      date: '2026-03-25',
      breakfastDishIds: ['d1'],
      lunchDishIds: [],
      dinnerDishIds: [],
    }];
    useDayPlanStore.getState().setDayPlans(plans);
    expect(useDayPlanStore.getState().dayPlans).toEqual(plans);
  });

  it('updates a specific day plan', () => {
    const plan: DayPlan = {
      date: '2026-03-25',
      breakfastDishIds: [],
      lunchDishIds: [],
      dinnerDishIds: [],
    };
    useDayPlanStore.getState().setDayPlans([plan]);
    const updated = { ...plan, breakfastDishIds: ['d1', 'd2'] };
    useDayPlanStore.getState().updateDayPlan(updated);
    const found = useDayPlanStore.getState().dayPlans.find(p => p.date === '2026-03-25');
    expect(found?.breakfastDishIds).toEqual(['d1', 'd2']);
  });

  it('adds day plan if not exists during update', () => {
    const plan: DayPlan = {
      date: '2026-03-26',
      breakfastDishIds: ['d1'],
      lunchDishIds: [],
      dinnerDishIds: [],
    };
    useDayPlanStore.getState().updateDayPlan(plan);
    expect(useDayPlanStore.getState().dayPlans).toHaveLength(1);
    expect(useDayPlanStore.getState().dayPlans[0].date).toBe('2026-03-26');
  });

  it('clears plans by date range', () => {
    const plans: DayPlan[] = [
      { date: '2026-03-24', breakfastDishIds: ['d1'], lunchDishIds: [], dinnerDishIds: [] },
      { date: '2026-03-25', breakfastDishIds: ['d2'], lunchDishIds: [], dinnerDishIds: [] },
      { date: '2026-03-26', breakfastDishIds: ['d3'], lunchDishIds: [], dinnerDishIds: [] },
    ];
    useDayPlanStore.getState().setDayPlans(plans);
    useDayPlanStore.getState().clearPlansByDates(['2026-03-24', '2026-03-25']);
    const remaining = useDayPlanStore.getState().dayPlans;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].date).toBe('2026-03-26');
  });
});
```

- [ ] **Run test to verify it fails**

```bash
npx vitest run src/__tests__/dayPlanStore.test.ts
```

Expected: FAIL

### Step 4.2: Implement day plan store

- [ ] **Create day plan store**

```typescript
// src/store/dayPlanStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DayPlan } from '../types';
import { migrateDayPlans } from '../services/dataService';

interface DayPlanState {
  dayPlans: DayPlan[];
  setDayPlans: (plans: DayPlan[]) => void;
  updateDayPlan: (plan: DayPlan) => void;
  clearPlansByDates: (dates: string[]) => void;
}

export const useDayPlanStore = create<DayPlanState>()(
  persist(
    (set) => ({
      dayPlans: [],

      setDayPlans: (plans) => set({ dayPlans: plans }),

      updateDayPlan: (plan) => set((state) => {
        const exists = state.dayPlans.some((p) => p.date === plan.date);
        if (exists) {
          return {
            dayPlans: state.dayPlans.map((p) =>
              p.date === plan.date ? plan : p
            ),
          };
        }
        return { dayPlans: [...state.dayPlans, plan] };
      }),

      clearPlansByDates: (dates) => set((state) => ({
        dayPlans: state.dayPlans.filter((p) => !dates.includes(p.date)),
      })),
    }),
    {
      name: 'mp-day-plans',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.dayPlans = migrateDayPlans(state.dayPlans);
        }
      },
    }
  )
);
```

- [ ] **Run tests, lint, commit**

```bash
npx vitest run src/__tests__/dayPlanStore.test.ts
npm run lint
git add src/store/dayPlanStore.ts src/__tests__/dayPlanStore.test.ts
git commit -m "feat: extract day plan state to Zustand store

- Operations: setAll, update (upsert), clearByDates
- Persist to localStorage (key: mp-day-plans)
- Migration on rehydration via migrateDayPlans()
- 5 unit tests all passing

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 5: UserProfile Store + UI Store

**Files:**
- Create: `src/store/userProfileStore.ts`
- Create: `src/store/uiStore.ts`
- Create: `src/__tests__/userProfileStore.test.ts`
- Create: `src/__tests__/uiStore.test.ts`

### Step 5.1: Write failing tests for both stores

- [ ] **Write userProfile store tests**

```typescript
// src/__tests__/userProfileStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUserProfileStore } from '../store/userProfileStore';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('userProfileStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useUserProfileStore.setState(useUserProfileStore.getInitialState());
  });

  it('initializes with default profile', () => {
    const state = useUserProfileStore.getState();
    expect(state.profile.weight).toBe(70);
    expect(state.profile.proteinRatio).toBe(1.6);
    expect(state.profile.targetCalories).toBe(2000);
  });

  it('updates profile', () => {
    useUserProfileStore.getState().updateProfile({ weight: 80, proteinRatio: 2.0, targetCalories: 2500 });
    const state = useUserProfileStore.getState();
    expect(state.profile.weight).toBe(80);
    expect(state.profile.proteinRatio).toBe(2.0);
    expect(state.profile.targetCalories).toBe(2500);
  });

  it('partially updates profile', () => {
    useUserProfileStore.getState().updateProfile({ weight: 85 });
    const state = useUserProfileStore.getState();
    expect(state.profile.weight).toBe(85);
    expect(state.profile.proteinRatio).toBe(1.6); // unchanged
  });
});
```

- [ ] **Write UI store tests**

```typescript
// src/__tests__/uiStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../store/uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState(useUIStore.getInitialState());
  });

  it('initializes with today as selected date', () => {
    const state = useUIStore.getState();
    expect(state.selectedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('sets selected date', () => {
    useUIStore.getState().setSelectedDate('2026-03-25');
    expect(useUIStore.getState().selectedDate).toBe('2026-03-25');
  });

  it('tracks hasNewAIResult', () => {
    expect(useUIStore.getState().hasNewAIResult).toBe(false);
    useUIStore.getState().setHasNewAIResult(true);
    expect(useUIStore.getState().hasNewAIResult).toBe(true);
  });

  it('tracks management sub-tab', () => {
    expect(useUIStore.getState().activeManagementSubTab).toBe('dishes');
    useUIStore.getState().setActiveManagementSubTab('ingredients');
    expect(useUIStore.getState().activeManagementSubTab).toBe('ingredients');
  });
});
```

- [ ] **Run tests to verify they fail**

```bash
npx vitest run src/__tests__/userProfileStore.test.ts src/__tests__/uiStore.test.ts
```

Expected: FAIL

### Step 5.2: Implement both stores

- [ ] **Create userProfile store**

```typescript
// src/store/userProfileStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '../types';

const DEFAULT_USER_PROFILE: UserProfile = {
  weight: 70,
  proteinRatio: 1.6,
  targetCalories: 2000,
};

interface UserProfileState {
  profile: UserProfile;
  updateProfile: (partial: Partial<UserProfile>) => void;
  setProfile: (profile: UserProfile) => void;
}

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set) => ({
      profile: DEFAULT_USER_PROFILE,

      updateProfile: (partial) => set((state) => ({
        profile: { ...state.profile, ...partial },
      })),

      setProfile: (profile) => set({ profile }),
    }),
    { name: 'mp-user-profile' }
  )
);
```

- [ ] **Create UI store**

```typescript
// src/store/uiStore.ts
import { create } from 'zustand';
import type { ManagementSubTab } from '../components/navigation/types';

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface UIState {
  selectedDate: string;
  hasNewAIResult: boolean;
  activeManagementSubTab: ManagementSubTab;

  setSelectedDate: (date: string) => void;
  setHasNewAIResult: (value: boolean) => void;
  setActiveManagementSubTab: (tab: ManagementSubTab) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  selectedDate: getTodayString(),
  hasNewAIResult: false,
  activeManagementSubTab: 'dishes',

  setSelectedDate: (date) => set({ selectedDate: date }),
  setHasNewAIResult: (value) => set({ hasNewAIResult: value }),
  setActiveManagementSubTab: (tab) => set({ activeManagementSubTab: tab }),
}));
```

- [ ] **Run tests, lint, commit**

```bash
npx vitest run src/__tests__/userProfileStore.test.ts src/__tests__/uiStore.test.ts
npm run lint
git add src/store/userProfileStore.ts src/store/uiStore.ts src/__tests__/userProfileStore.test.ts src/__tests__/uiStore.test.ts
git commit -m "feat: extract userProfile + UI state to Zustand stores

- userProfileStore: weight, proteinRatio, targetCalories with partial updates
- uiStore: selectedDate, hasNewAIResult, activeManagementSubTab
- Both with unit tests (3 + 4 tests)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 6: Design Tokens (CSS Custom Properties)

**Files:**
- Create: `src/styles/tokens.css`
- Modify: `src/index.css` (import tokens)

### Step 6.1: Create design tokens CSS

- [ ] **Create tokens.css with all spec §12.2-12.3 tokens**

```css
/* src/styles/tokens.css
 * Design Tokens — Single source of truth for spacing, color, shadow, radius, typography.
 * Spec reference: §12.2 Design Tokens, §12.3 Typography Scale
 */

:root {
  /* === Spacing Scale (4px base grid) === */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;

  /* === Border Radius === */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* === Elevation (Shadow) === */
  --shadow-none: none;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 4px 20px rgba(0, 0, 0, 0.12);
  --shadow-glow: 0 2px 6px rgba(16, 185, 129, 0.3);

  /* === Semantic Colors (Light Mode) === */
  --color-primary: #10B981;
  --color-primary-text: #059669;
  --color-on-primary: #FFFFFF;
  --color-surface: #FFFFFF;
  --color-surface-alt: #F8FAFC;
  --color-on-surface: #1E293B;
  --color-on-surface-secondary: #64748B;
  --color-border: #E2E8F0;
  --color-success: #059669;
  --color-warning: #D97706;
  --color-warning-dark: #92400E;
  --color-warning-surface: #FFFBEB;
  --color-info: #2563EB;
  --color-muted: #64748B;

  /* === Typography Scale (size / weight / line-height) === */
  --text-xs: 10px;
  --text-xs-lh: 14px;
  --text-sm: 12px;
  --text-sm-lh: 16px;
  --text-base: 14px;
  --text-base-lh: 20px;
  --text-md: 16px;
  --text-md-lh: 24px;
  --text-lg: 20px;
  --text-lg-lh: 28px;
  --text-xl: 24px;
  --text-xl-lh: 32px;
  --text-2xl: 30px;
  --text-2xl-lh: 36px;
  --text-3xl: 36px;
  --text-3xl-lh: 40px;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* === Motion Durations === */
  --duration-instant: 0ms;
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;

  /* === Easing Curves === */
  --ease-enter: cubic-bezier(0, 0, 0.2, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-linear: linear;
}

/* === Dark Mode Overrides === */
.dark {
  --color-primary: #34D399;
  --color-primary-text: #6EE7B7;
  --color-on-primary: #FFFFFF;
  --color-surface: #1E293B;
  --color-surface-alt: #0F172A;
  --color-on-surface: #E2E8F0;
  --color-on-surface-secondary: #94A3B8;
  --color-border: #334155;
  --color-success: #34D399;
  --color-warning: #FBBF24;
  --color-warning-dark: #F59E0B;
  --color-warning-surface: #422006;
  --color-info: #60A5FA;
  --color-muted: #475569;
}

/* === Reduced Motion === */
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 0ms;
    --duration-normal: 0ms;
    --duration-slow: 0ms;
  }
}
```

- [ ] **Import tokens in index.css**

In `src/index.css`, add at the top (before `@import "tailwindcss"`):

```css
@import './styles/tokens.css';
```

- [ ] **Run lint and verify no errors**

```bash
npm run lint
```

Expected: PASS

- [ ] **Commit**

```bash
git add src/styles/tokens.css src/index.css
git commit -m "feat: add design tokens CSS custom properties

- Spacing: 4px grid (7 tokens)
- Border radius: 5 tokens (sm/md/lg/xl/full)
- Shadow: 5 tokens (none/sm/md/lg/glow)
- Semantic colors: 14 tokens with dark mode overrides
- Typography: 8 size tokens
- Motion: 4 duration + 4 easing tokens
- Reduced motion: disables all durations
- Spec §12.2-12.3

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 7: SubTabBar Reusable Component

**Files:**
- Create: `src/components/shared/SubTabBar.tsx`
- Create: `src/__tests__/subTabBar.test.tsx`

### Step 7.1: Write failing tests

- [ ] **Write SubTabBar tests**

```typescript
// src/__tests__/subTabBar.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubTabBar, type SubTab } from '../components/shared/SubTabBar';
import { UtensilsCrossed, BarChart3 } from 'lucide-react';

const mockTabs: SubTab[] = [
  { key: 'meals', label: 'Meals', icon: <UtensilsCrossed className="w-4 h-4" /> },
  { key: 'nutrition', label: 'Nutrition', icon: <BarChart3 className="w-4 h-4" /> },
];

describe('SubTabBar', () => {
  it('renders all tabs', () => {
    render(<SubTabBar tabs={mockTabs} activeTab="meals" onTabChange={() => {}} />);
    expect(screen.getByText('Meals')).toBeInTheDocument();
    expect(screen.getByText('Nutrition')).toBeInTheDocument();
  });

  it('highlights active tab', () => {
    render(<SubTabBar tabs={mockTabs} activeTab="meals" onTabChange={() => {}} />);
    const mealsButton = screen.getByTestId('subtab-meals');
    expect(mealsButton.className).toContain('bg-white');
  });

  it('calls onTabChange when clicked', () => {
    const onTabChange = vi.fn();
    render(<SubTabBar tabs={mockTabs} activeTab="meals" onTabChange={onTabChange} />);
    fireEvent.click(screen.getByText('Nutrition'));
    expect(onTabChange).toHaveBeenCalledWith('nutrition');
  });

  it('renders icons', () => {
    render(<SubTabBar tabs={mockTabs} activeTab="meals" onTabChange={() => {}} />);
    const mealsButton = screen.getByTestId('subtab-meals');
    expect(mealsButton.querySelector('svg')).toBeInTheDocument();
  });
});
```

- [ ] **Run test to verify it fails**

```bash
npx vitest run src/__tests__/subTabBar.test.tsx
```

Expected: FAIL

### Step 7.2: Implement SubTabBar

- [ ] **Create SubTabBar component**

```typescript
// src/components/shared/SubTabBar.tsx
import type { ReactNode } from 'react';

export interface SubTab {
  key: string;
  label: string;
  icon?: ReactNode;
}

interface SubTabBarProps {
  tabs: SubTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function SubTabBar({ tabs, activeTab, onTabChange }: SubTabBarProps) {
  return (
    <div
      className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl"
      role="tablist"
    >
      {tabs.map(({ key, label, icon }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={activeTab === key}
          onClick={() => onTabChange(key)}
          data-testid={`subtab-${key}`}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all min-h-11 ${
            activeTab === key
              ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Run tests, lint, commit**

```bash
npx vitest run src/__tests__/subTabBar.test.tsx
npm run lint
git add src/components/shared/SubTabBar.tsx src/__tests__/subTabBar.test.tsx
git commit -m "feat: add reusable SubTabBar component

- Extracted from CalendarTab inline sub-tab pattern
- Props: tabs (key/label/icon), activeTab, onTabChange
- ARIA: role=tablist, role=tab, aria-selected
- Dark mode support, emerald active state
- 4 unit tests all passing

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 8: Migrate Emoji to Lucide Icons

**Files:**
- Modify: `src/components/schedule/MealsSubTab.tsx` (📋 → ClipboardList)
- Modify: `src/components/modals/MealPlannerModal.tsx` (💪🔥 → Beef, Flame)
- Modify: `src/components/modals/DishEditModal.tsx` (💪 → Beef)
- Modify: `src/components/modals/GoalSettingsModal.tsx` (💪 → Dumbbell)

### Step 8.1: Fix emoji in each file

- [ ] **Search and replace all emoji in source files**

For each file found by the explore agent, replace emoji with the corresponding Lucide icon from spec §12.4 Icon Migration Map. The exact replacements depend on the emoji context in each file — inspect each occurrence and swap emoji text with `<IconName className="w-4 h-4 inline" />` import from lucide-react.

> **Important:** Do NOT use emoji in `aria-label` or `accessibilityLabel` strings — those are text content for screen readers, not visual icons.

- [ ] **Run lint to verify no errors**

```bash
npm run lint
```

Expected: PASS

- [ ] **Run all existing tests to verify no regression**

```bash
npx vitest run
```

Expected: ALL PASS

- [ ] **Commit**

```bash
git add -A
git commit -m "refactor: migrate emoji to Lucide SVG icons in UI controls

- MealsSubTab: 📋 → ClipboardList
- MealPlannerModal: 💪🔥 → Beef, Flame
- DishEditModal: 💪 → Beef
- GoalSettingsModal: 💪 → Dumbbell
- Spec §12.4 compliance

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 9: Refactor App.tsx to Use Stores

**Files:**
- Modify: `src/App.tsx` (major refactor: 545 → ~150 lines)

> **⚠️ This is the highest-risk task.** Approach: incremental replacement. Replace one state slice at a time, run tests after each swap.

### Step 9.1: Replace ingredient state

- [ ] **In App.tsx, replace usePersistedState('mp-ingredients') with useIngredientStore**

Replace:
```typescript
const [rawIngredients, setIngredients] = usePersistedState<Ingredient[]>('mp-ingredients', initialIngredients);
```

With:
```typescript
const ingredients = useIngredientStore(s => s.ingredients);
const { addIngredient: storeAddIngredient, updateIngredient: storeUpdateIngredient, deleteIngredient: storeDeleteIngredient, setIngredients } = useIngredientStore();
```

Update all handler functions that reference `rawIngredients` or `setIngredients` to use the store methods. The computed `ingredients` (with migration) can now use the store directly since migration happens in `onRehydrateStorage`.

- [ ] **Run all tests**

```bash
npx vitest run
```

Expected: ALL PASS (no behavior change)

### Step 9.2: Replace dish state

- [ ] **Replace usePersistedState('mp-dishes') with useDishStore**

Same pattern as Step 9.1.

- [ ] **Run all tests**

```bash
npx vitest run
```

Expected: ALL PASS

### Step 9.3: Replace dayPlan state

- [ ] **Replace usePersistedState('mp-day-plans') with useDayPlanStore**

Same pattern.

- [ ] **Run all tests**

```bash
npx vitest run
```

Expected: ALL PASS

### Step 9.4: Replace userProfile state

- [ ] **Replace usePersistedState('mp-user-profile') with useUserProfileStore**

- [ ] **Run all tests**

```bash
npx vitest run
```

Expected: ALL PASS

### Step 9.5: Replace UI state

- [ ] **Replace useState for selectedDate, hasNewAIResult, activeManagementSubTab with useUIStore**

- [ ] **Run all tests**

```bash
npx vitest run
```

Expected: ALL PASS

### Step 9.6: Replace tab state with navigationStore

- [ ] **Replace useState for activeMainTab with useNavigationStore**

- [ ] **Run all tests + lint**

```bash
npx vitest run
npm run lint
```

Expected: ALL PASS

### Step 9.7: Final cleanup and commit

- [ ] **Remove unused imports (usePersistedState, initialData imports now in stores)**
- [ ] **Verify App.tsx line count is ≤200 lines**
- [ ] **Run full test suite + lint + coverage**

```bash
npm run lint
npx vitest run --coverage
```

Expected: ALL PASS, coverage maintained

- [ ] **Commit**

```bash
git add -A
git commit -m "refactor: decompose App.tsx from 545 to ~150 lines

- Replace 5 usePersistedState calls with Zustand stores
- Replace 3 useState calls with navigationStore + uiStore
- State now accessible globally (no props drilling)
- Zero behavior change — all existing tests pass
- localStorage keys preserved for backward compatibility

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 10: Update CalendarTab to Use SubTabBar

**Files:**
- Modify: `src/components/CalendarTab.tsx`

### Step 10.1: Replace inline sub-tab bar with SubTabBar component

- [ ] **Import and use SubTabBar in CalendarTab**

Replace the inline `<div className="flex bg-slate-100...">` sub-tab rendering (lines ~88-110 in CalendarTab.tsx) with:

```typescript
import { SubTabBar, type SubTab } from './shared/SubTabBar';

const SUB_TABS: SubTab[] = [
  { key: 'meals', label: t('schedule.mealsTab'), icon: <UtensilsCrossed className="w-4 h-4" /> },
  { key: 'nutrition', label: t('schedule.nutritionTab'), icon: <BarChart3 className="w-4 h-4" /> },
];

// In render:
{!isDesktop && (
  <>
    <SubTabBar tabs={SUB_TABS} activeTab={activeSubTab} onTabChange={(key) => setActiveSubTab(key as ScheduleSubTab)} />
    {activeSubTab === 'meals' && <MealsSubTab ... />}
    {activeSubTab === 'nutrition' && <NutritionSubTab ... />}
  </>
)}
```

- [ ] **Run existing CalendarTab tests**

```bash
npx vitest run src/__tests__/scheduleComponents.test.tsx src/__tests__/components.test.tsx
```

Expected: ALL PASS

- [ ] **Run lint, commit**

```bash
npm run lint
git add src/components/CalendarTab.tsx
git commit -m "refactor: CalendarTab uses SubTabBar component

- Replace inline sub-tab bar with shared SubTabBar
- Zero visual change — same classes, same behavior
- Prepares for FitnessTab to reuse same component

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 11: Add Accessibility Labels

**Files:**
- Modify: Various existing components

### Step 11.1: Audit and add aria-labels

- [ ] **Add accessibilityLabel/aria-label to all interactive elements**

Key components to update:
- `AppNavigation.tsx` — nav items already have `role="tab"` and `aria-selected`. Verify `aria-label` on icon-only buttons.
- `CalendarTab.tsx` — date selector, sub-tab buttons (SubTabBar already has `role="tablist"`)
- All modals — close buttons need `aria-label="Đóng"`
- `DishManager.tsx` / `IngredientManager.tsx` — action buttons (edit, delete)

- [ ] **Run all tests + lint**

```bash
npx vitest run
npm run lint
```

Expected: ALL PASS

- [ ] **Commit**

```bash
git add -A
git commit -m "feat: add accessibility labels to interactive components

- aria-label on icon-only buttons (close, edit, delete)
- role=tablist on navigation components
- Spec §12.1 compliance

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 12: Final Validation

### Step 12.1: Full test suite + coverage

- [ ] **Run complete test suite with coverage**

```bash
npm run test:coverage
```

Expected: ALL PASS, coverage ≥ previous baseline

### Step 12.2: Lint + type check

- [ ] **Run full lint**

```bash
npm run lint
```

Expected: PASS (zero errors, zero warnings)

### Step 12.3: Build verification

- [ ] **Run production build**

```bash
npm run build
```

Expected: Build succeeds, no errors

### Step 12.4: Manual smoke test

- [ ] **Start dev server and verify app works**

```bash
npm run dev
```

Verify in browser at localhost:3000:
- [ ] All 5 tabs switch correctly
- [ ] Ingredients/dishes load from localStorage
- [ ] Day plans persist across page refresh
- [ ] Dark mode toggle works
- [ ] AI image analysis tab loads
- [ ] Settings tab loads

### Step 12.5: Final commit (if any remaining changes)

```bash
git add -A
git commit -m "chore: Phase 0 Foundation complete — final validation

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Summary

| Task | Files Created | Files Modified | Tests |
|------|---------------|----------------|-------|
| 1. Navigation Store | 2 | 1 | 8 |
| 2. Ingredient Store | 2 | 0 | 5 |
| 3. Dish Store | 2 | 0 | 5 |
| 4. DayPlan Store | 2 | 0 | 5 |
| 5. UserProfile + UI Store | 4 | 0 | 7 |
| 6. Design Tokens | 1 | 1 | 0 |
| 7. SubTabBar | 2 | 0 | 4 |
| 8. Emoji Migration | 0 | 4 | 0 |
| 9. App.tsx Refactor | 0 | 1 | 0 (existing) |
| 10. CalendarTab SubTabBar | 0 | 1 | 0 (existing) |
| 11. Accessibility Labels | 0 | ~5 | 0 |
| 12. Final Validation | 0 | 0 | full suite |
| **Total** | **15** | **~13** | **34 new** |
