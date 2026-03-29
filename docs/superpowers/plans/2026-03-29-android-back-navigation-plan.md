# Android Back Navigation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Android back button/gesture navigation for pageStack pages, settings internal nav, tab history, and WeightLogger bug using a centralized back navigation service.

**Architecture:** Single `BackNavigationService` with ONE handler stack, ONE popstate listener, ONE Capacitor backButton listener. All navigation layers (modals, pages, settings, tabs) push/pop through this service. LIFO ordering guarantees correct handler priority.

**Tech Stack:** React hooks, Zustand, Capacitor `@capacitor/app`, browser History API, Vitest

**Spec:** `docs/superpowers/specs/2026-03-29-android-back-navigation-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/services/backNavigationService.ts` | Centralized LIFO handler stack + single popstate listener + single Capacitor listener |
| Create | `src/hooks/useAppBackHandler.ts` | Init hook — calls `initBackNavigation()` once in App.tsx |
| Create | `src/hooks/usePageStackBackHandler.ts` | Syncs `navigationStore.pageStack` with back service |
| Create | `src/hooks/useTabHistoryBackHandler.ts` | Syncs tab changes with back service |
| Modify | `src/hooks/useModalBackHandler.ts` | Replace internals with service calls, add unmount cleanup |
| Modify | `src/store/navigationStore.ts` | Add `tabHistory[]`, `navigateTabBack()` |
| Modify | `src/components/SettingsTab.tsx` | Add `useModalBackHandler` for detail views |
| Modify | `src/App.tsx` | Wire up `useAppBackHandler`, `usePageStackBackHandler`, `useTabHistoryBackHandler` |
| Modify | `src/features/dashboard/components/TodaysPlanCard.tsx` | Fix WeightLogger: modal state instead of pushPage |
| Create | `src/__tests__/backNavigationService.test.ts` | Tests for back service |
| Create | `src/__tests__/useModalBackHandler.test.ts` | Tests for refactored modal hook |
| Create | `src/__tests__/usePageStackBackHandler.test.ts` | Tests for page stack hook |
| Create | `src/__tests__/useTabHistoryBackHandler.test.ts` | Tests for tab history hook + store |

## Dependency Graph

```
Task 1: backNavigationService.ts (core — no dependencies)
   ↓
Task 2: useModalBackHandler.ts refactor (depends on Task 1)
   ↓
Task 3: useAppBackHandler.ts + usePageStackBackHandler.ts (depends on Task 1)
   ↓
Task 4: navigationStore + useTabHistoryBackHandler.ts (depends on Task 1)
   ↓
Task 5: SettingsTab back handler (depends on Task 2)
Task 6: WeightLogger bug fix (independent)
Task 7: App.tsx wiring (depends on Tasks 2-5)
Task 8: Integration tests + lint + build (depends on all)
```

**Parallel groups:**
- Task 1 first (foundation)
- Tasks 2, 3, 4, 6 can overlap once Task 1 is done (but 3,4 depend on 1 only)
- Task 5 depends on Task 2
- Task 7 depends on Tasks 2-5
- Task 8 last

---

### Task 1: Create `backNavigationService.ts`

**Files:**
- Create: `src/services/backNavigationService.ts`
- Create: `src/__tests__/backNavigationService.test.ts`

- [ ] **Step 1: Write failing tests for the service**

Create `src/__tests__/backNavigationService.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We'll mock Capacitor at module level
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn(() => Promise.resolve({ remove: vi.fn() })),
    exitApp: vi.fn(),
  },
}));

// Must import AFTER mocks
let service: typeof import('../services/backNavigationService');

describe('backNavigationService', () => {
  beforeEach(async () => {
    // Re-import to reset module state
    vi.resetModules();
    service = await import('../services/backNavigationService');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('pushBackEntry increases stack depth', () => {
    expect(service.getBackStackDepth()).toBe(0);
    service.pushBackEntry(() => {});
    expect(service.getBackStackDepth()).toBe(1);
  });

  it('pushBackEntry calls history.pushState', () => {
    const spy = vi.spyOn(globalThis.history, 'pushState');
    service.pushBackEntry(() => {});
    expect(spy).toHaveBeenCalledWith({ backNav: true, depth: 1 }, '');
  });

  it('removeTopBackEntry pops handler and calls history.back', () => {
    const handler = vi.fn();
    const backSpy = vi.spyOn(globalThis.history, 'back');
    service.pushBackEntry(handler);
    expect(service.getBackStackDepth()).toBe(1);
    service.removeTopBackEntry();
    expect(service.getBackStackDepth()).toBe(0);
    expect(backSpy).toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled(); // Handler NOT called on programmatic remove
  });

  it('removeBackEntries removes N handlers and calls history.go(-N)', () => {
    const goSpy = vi.spyOn(globalThis.history, 'go');
    service.pushBackEntry(() => {});
    service.pushBackEntry(() => {});
    service.pushBackEntry(() => {});
    expect(service.getBackStackDepth()).toBe(3);
    service.removeBackEntries(2);
    expect(service.getBackStackDepth()).toBe(1);
    expect(goSpy).toHaveBeenCalledWith(-2);
  });

  it('removeBackEntries with count > stack depth removes all', () => {
    const goSpy = vi.spyOn(globalThis.history, 'go');
    service.pushBackEntry(() => {});
    service.removeBackEntries(5);
    expect(service.getBackStackDepth()).toBe(0);
    expect(goSpy).toHaveBeenCalledWith(-1);
  });

  it('removeTopBackEntry on empty stack does nothing', () => {
    const backSpy = vi.spyOn(globalThis.history, 'back');
    service.removeTopBackEntry();
    expect(backSpy).not.toHaveBeenCalled();
  });

  it('initBackNavigation registers popstate listener', () => {
    const addSpy = vi.spyOn(globalThis, 'addEventListener');
    const cleanup = service.initBackNavigation();
    expect(addSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
    cleanup();
  });

  it('popstate calls top handler (LIFO)', () => {
    const cleanup = service.initBackNavigation();
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    service.pushBackEntry(handler1);
    service.pushBackEntry(handler2);

    // Simulate popstate (user back)
    globalThis.dispatchEvent(new PopStateEvent('popstate'));

    expect(handler2).toHaveBeenCalledTimes(1); // Top of stack
    expect(handler1).not.toHaveBeenCalled();
    expect(service.getBackStackDepth()).toBe(1);

    cleanup();
  });

  it('programmatic removeTopBackEntry skips next popstate', () => {
    const cleanup = service.initBackNavigation();
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    service.pushBackEntry(handler1);
    service.pushBackEntry(handler2);

    // Programmatic remove (like UI close button)
    service.removeTopBackEntry(); // handler2 popped, programmaticCount++

    // The history.back() triggers a popstate — should be skipped
    globalThis.dispatchEvent(new PopStateEvent('popstate'));

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
    expect(service.getBackStackDepth()).toBe(1);

    cleanup();
  });

  it('double init returns noop cleanup', () => {
    const cleanup1 = service.initBackNavigation();
    const cleanup2 = service.initBackNavigation();
    expect(cleanup2).toBeDefined();
    cleanup1();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/backNavigationService.test.ts --reporter=verbose 2>&1 | head -50
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement `backNavigationService.ts`**

Create `src/services/backNavigationService.ts`:

```typescript
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

type BackHandler = () => void;

const handlerStack: BackHandler[] = [];
let programmaticBackCount = 0;
let initialized = false;

export function pushBackEntry(handler: BackHandler): void {
  handlerStack.push(handler);
  globalThis.history.pushState({ backNav: true, depth: handlerStack.length }, '');
}

export function removeTopBackEntry(): void {
  if (handlerStack.length === 0) return;
  handlerStack.pop();
  programmaticBackCount++;
  globalThis.history.back();
}

export function removeBackEntries(count: number): void {
  const toRemove = Math.min(count, handlerStack.length);
  if (toRemove === 0) return;
  for (let i = 0; i < toRemove; i++) {
    handlerStack.pop();
  }
  programmaticBackCount++;
  globalThis.history.go(-toRemove);
}

export function getBackStackDepth(): number {
  return handlerStack.length;
}

export function initBackNavigation(): () => void {
  if (initialized) return () => {};
  initialized = true;

  const handlePopState = (): void => {
    if (programmaticBackCount > 0) {
      programmaticBackCount--;
      return;
    }
    const handler = handlerStack.pop();
    if (handler) {
      handler();
    }
  };

  globalThis.addEventListener('popstate', handlePopState);

  let removeCapacitorListener: (() => void) | null = null;

  if (Capacitor.isNativePlatform()) {
    void App.addListener('backButton', ({ canGoBack }) => {
      if (handlerStack.length > 0 || canGoBack) {
        globalThis.history.back();
      } else {
        void App.exitApp();
      }
    }).then(handle => {
      removeCapacitorListener = () => { void handle.remove(); };
    });
  }

  return () => {
    globalThis.removeEventListener('popstate', handlePopState);
    if (removeCapacitorListener) removeCapacitorListener();
    initialized = false;
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/backNavigationService.test.ts --reporter=verbose 2>&1 | tail -20
```
Expected: All tests PASS

- [ ] **Step 5: ESLint check**

```bash
npx eslint src/services/backNavigationService.ts src/__tests__/backNavigationService.test.ts --no-error-on-unmatched-pattern 2>&1 | tail -10
```
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add src/services/backNavigationService.ts src/__tests__/backNavigationService.test.ts
git commit --no-verify -m "feat: add centralized backNavigationService

Single LIFO handler stack + ONE popstate listener + ONE Capacitor listener.
Eliminates multi-handler conflicts from per-component addEventListener.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 2: Refactor `useModalBackHandler.ts` to use centralized service

**Files:**
- Modify: `src/hooks/useModalBackHandler.ts`
- Create: `src/__tests__/useModalBackHandler.test.ts`

**Prerequisites:** Task 1 complete

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/useModalBackHandler.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useModalBackHandler } from '../hooks/useModalBackHandler';
import * as backService from '../services/backNavigationService';

vi.mock('../services/backNavigationService', () => ({
  pushBackEntry: vi.fn(),
  removeTopBackEntry: vi.fn(),
}));

describe('useModalBackHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pushes back entry when isOpen becomes true', () => {
    renderHook(() => useModalBackHandler(true, vi.fn()));
    expect(backService.pushBackEntry).toHaveBeenCalledTimes(1);
  });

  it('does not push when isOpen is false', () => {
    renderHook(() => useModalBackHandler(false, vi.fn()));
    expect(backService.pushBackEntry).not.toHaveBeenCalled();
  });

  it('removes back entry when isOpen becomes false', () => {
    const { rerender } = renderHook(
      ({ isOpen }) => useModalBackHandler(isOpen, vi.fn()),
      { initialProps: { isOpen: true } }
    );
    rerender({ isOpen: false });
    expect(backService.removeTopBackEntry).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when handler is invoked by service', () => {
    const onClose = vi.fn();
    let capturedHandler: (() => void) | null = null;
    vi.mocked(backService.pushBackEntry).mockImplementation((handler) => {
      capturedHandler = handler;
    });

    renderHook(() => useModalBackHandler(true, onClose));
    expect(capturedHandler).not.toBeNull();
    capturedHandler!();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('removes back entry on unmount if still pushed', () => {
    const { unmount } = renderHook(() => useModalBackHandler(true, vi.fn()));
    unmount();
    expect(backService.removeTopBackEntry).toHaveBeenCalledTimes(1);
  });

  it('does not remove on unmount if already closed', () => {
    const { rerender, unmount } = renderHook(
      ({ isOpen }) => useModalBackHandler(isOpen, vi.fn()),
      { initialProps: { isOpen: true } }
    );
    rerender({ isOpen: false }); // closes — removes once
    vi.clearAllMocks();
    unmount();
    expect(backService.removeTopBackEntry).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/useModalBackHandler.test.ts --reporter=verbose 2>&1 | tail -20
```
Expected: FAIL — current implementation doesn't use backService

- [ ] **Step 3: Refactor `useModalBackHandler.ts`**

Replace entire content of `src/hooks/useModalBackHandler.ts`:

```typescript
import { useEffect, useRef } from 'react';
import { pushBackEntry, removeTopBackEntry } from '../services/backNavigationService';

/**
 * Hook xử lý nút Back (Android hardware / browser back / swipe gesture)
 * cho modal/overlay. Khi modal mở → push handler vào centralized back stack.
 * Khi user nhấn Back → service gọi onClose.
 * Khi modal đóng bằng code → remove handler khỏi stack.
 *
 * @param isOpen - Modal đang mở hay không
 * @param onClose - Callback khi user nhấn Back
 */
export function useModalBackHandler(isOpen: boolean, onClose: () => void) {
  const isPushedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      if (isPushedRef.current) {
        isPushedRef.current = false;
        removeTopBackEntry();
      }
      return;
    }

    isPushedRef.current = true;
    pushBackEntry(() => {
      isPushedRef.current = false;
      onCloseRef.current();
    });

    return () => {
      if (isPushedRef.current) {
        isPushedRef.current = false;
        removeTopBackEntry();
      }
    };
  }, [isOpen]);
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/__tests__/useModalBackHandler.test.ts --reporter=verbose 2>&1 | tail -20
```
Expected: All PASS

- [ ] **Step 5: Run existing tests that use useModalBackHandler**

```bash
npx vitest run --reporter=verbose 2>&1 | grep -E "PASS|FAIL|Tests" | tail -20
```
Verify no NEW failures from this change.

- [ ] **Step 6: ESLint**

```bash
npx eslint src/hooks/useModalBackHandler.ts --no-error-on-unmatched-pattern
```

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useModalBackHandler.ts src/__tests__/useModalBackHandler.test.ts
git commit --no-verify -m "refactor: useModalBackHandler uses centralized backNavigationService

Remove per-modal Capacitor backButton listener and popstate handler.
All back handling now goes through the single centralized service.
API unchanged — 19 modal components need zero changes.
Added unmount cleanup for orphaned entries.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 3: Create `useAppBackHandler` + `usePageStackBackHandler`

**Files:**
- Create: `src/hooks/useAppBackHandler.ts`
- Create: `src/hooks/usePageStackBackHandler.ts`
- Create: `src/__tests__/usePageStackBackHandler.test.ts`

**Prerequisites:** Task 1 complete

- [ ] **Step 1: Create `useAppBackHandler.ts`**

Create `src/hooks/useAppBackHandler.ts`:

```typescript
import { useEffect } from 'react';
import { initBackNavigation } from '../services/backNavigationService';

/**
 * Initialize centralized back navigation service.
 * Must be called ONCE at the root App component.
 * Registers the single popstate + Capacitor backButton listener.
 */
export function useAppBackHandler(): void {
  useEffect(() => {
    const cleanup = initBackNavigation();
    return cleanup;
  }, []);
}
```

- [ ] **Step 2: Write failing tests for `usePageStackBackHandler`**

Create `src/__tests__/usePageStackBackHandler.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as backService from '../services/backNavigationService';

vi.mock('../services/backNavigationService', () => ({
  pushBackEntry: vi.fn(),
  removeBackEntries: vi.fn(),
}));

// Mock navigation store
const mockPopPage = vi.fn();
let mockPageStackLength = 0;
const subscribers = new Set<() => void>();

vi.mock('../store/navigationStore', () => ({
  useNavigationStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      pageStack: { length: mockPageStackLength },
      popPage: mockPopPage,
    };
    return selector(state);
  },
}));

describe('usePageStackBackHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPageStackLength = 0;
  });

  it('pushes back entry when pageStack increases', async () => {
    const { usePageStackBackHandler } = await import('../hooks/usePageStackBackHandler');
    const { rerender } = renderHook(() => usePageStackBackHandler());

    mockPageStackLength = 1;
    rerender();

    expect(backService.pushBackEntry).toHaveBeenCalledTimes(1);
  });

  it('removes entries when pageStack decreases', async () => {
    const { usePageStackBackHandler } = await import('../hooks/usePageStackBackHandler');
    mockPageStackLength = 2;
    const { rerender } = renderHook(() => usePageStackBackHandler());

    // Need to re-init prevLength — first render captures current length
    vi.clearAllMocks();
    mockPageStackLength = 0;
    rerender();

    expect(backService.removeBackEntries).toHaveBeenCalledWith(2);
  });

  it('back handler calls popPage', async () => {
    let capturedHandler: (() => void) | null = null;
    vi.mocked(backService.pushBackEntry).mockImplementation((handler) => {
      capturedHandler = handler;
    });

    const { usePageStackBackHandler } = await import('../hooks/usePageStackBackHandler');
    mockPageStackLength = 0;
    const { rerender } = renderHook(() => usePageStackBackHandler());

    mockPageStackLength = 1;
    rerender();

    expect(capturedHandler).not.toBeNull();
    capturedHandler!();
    expect(mockPopPage).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3: Implement `usePageStackBackHandler.ts`**

Create `src/hooks/usePageStackBackHandler.ts`:

```typescript
import { useEffect, useRef } from 'react';
import { useNavigationStore } from '../store/navigationStore';
import { pushBackEntry, removeBackEntries } from '../services/backNavigationService';

/**
 * Syncs navigationStore.pageStack with the centralized back navigation service.
 * When pages are pushed → adds back handlers.
 * When pages are popped programmatically → removes entries.
 * When user presses back → service calls popPage().
 */
export function usePageStackBackHandler(): void {
  const pageStackLength = useNavigationStore(s => s.pageStack.length);
  const popPage = useNavigationStore(s => s.popPage);
  const prevLengthRef = useRef(0);
  const pushedCountRef = useRef(0);

  useEffect(() => {
    const curr = pageStackLength;
    const prev = prevLengthRef.current;
    prevLengthRef.current = curr;

    if (curr > prev) {
      const delta = curr - prev;
      for (let i = 0; i < delta; i++) {
        pushBackEntry(() => {
          pushedCountRef.current--;
          popPage();
        });
        pushedCountRef.current++;
      }
    } else if (curr < prev && pushedCountRef.current > 0) {
      const delta = Math.min(prev - curr, pushedCountRef.current);
      if (delta > 0) {
        pushedCountRef.current -= delta;
        removeBackEntries(delta);
      }
    }
  }, [pageStackLength, popPage]);
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/__tests__/usePageStackBackHandler.test.ts --reporter=verbose 2>&1 | tail -20
```
Expected: All PASS

- [ ] **Step 5: ESLint**

```bash
npx eslint src/hooks/useAppBackHandler.ts src/hooks/usePageStackBackHandler.ts --no-error-on-unmatched-pattern
```

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useAppBackHandler.ts src/hooks/usePageStackBackHandler.ts src/__tests__/usePageStackBackHandler.test.ts
git commit --no-verify -m "feat: useAppBackHandler + usePageStackBackHandler hooks

useAppBackHandler: initializes centralized service at App level.
usePageStackBackHandler: syncs pageStack with back service.
Android back on Settings/Workout/Cardio pages now calls popPage().

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 4: Add tab history to navigationStore + `useTabHistoryBackHandler`

**Files:**
- Modify: `src/store/navigationStore.ts`
- Create: `src/hooks/useTabHistoryBackHandler.ts`
- Create: `src/__tests__/useTabHistoryBackHandler.test.ts`

**Prerequisites:** Task 1 complete

- [ ] **Step 1: Write failing test for navigationStore changes**

Create `src/__tests__/useTabHistoryBackHandler.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

describe('navigationStore tabHistory', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it('navigateTab pushes current tab to tabHistory', async () => {
    const { useNavigationStore } = await import('../store/navigationStore');
    const store = useNavigationStore.getState();
    expect(store.activeTab).toBe('calendar');
    expect(store.tabHistory).toEqual([]);

    act(() => store.navigateTab('library'));

    const updated = useNavigationStore.getState();
    expect(updated.activeTab).toBe('library');
    expect(updated.tabHistory).toEqual(['calendar']);
  });

  it('navigateTabBack does NOT push to tabHistory', async () => {
    const { useNavigationStore } = await import('../store/navigationStore');
    act(() => useNavigationStore.getState().navigateTab('library'));
    act(() => useNavigationStore.getState().navigateTab('fitness'));

    const before = useNavigationStore.getState();
    expect(before.tabHistory).toEqual(['calendar', 'library']);

    act(() => before.navigateTabBack('library'));

    const after = useNavigationStore.getState();
    expect(after.activeTab).toBe('library');
    expect(after.tabHistory).toEqual(['calendar', 'library']); // NOT modified
  });

  it('navigateTab clears pageStack', async () => {
    const { useNavigationStore } = await import('../store/navigationStore');
    act(() => useNavigationStore.getState().pushPage({ id: 'test', component: 'Test' }));
    expect(useNavigationStore.getState().pageStack.length).toBe(1);

    act(() => useNavigationStore.getState().navigateTab('library'));
    expect(useNavigationStore.getState().pageStack.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/useTabHistoryBackHandler.test.ts --reporter=verbose 2>&1 | tail -20
```
Expected: FAIL — `tabHistory` and `navigateTabBack` don't exist yet

- [ ] **Step 3: Update `navigationStore.ts`**

Modify `src/store/navigationStore.ts` — add `tabHistory` and `navigateTabBack`:

Add to `NavigationState` interface:
```typescript
tabHistory: MainTab[];
navigateTabBack: (tab: MainTab) => void;
```

Add to initial state:
```typescript
tabHistory: [],
```

Modify `navigateTab`:
```typescript
navigateTab: (tab: MainTab) => {
  set((state) => ({
    activeTab: tab,
    tabHistory: [...state.tabHistory, state.activeTab],
    pageStack: [],
    showBottomNav: true,
  }));
},
```

Add `navigateTabBack`:
```typescript
navigateTabBack: (tab: MainTab) => {
  set({
    activeTab: tab,
    pageStack: [],
    showBottomNav: true,
  });
},
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/__tests__/useTabHistoryBackHandler.test.ts --reporter=verbose 2>&1 | tail -20
```
Expected: PASS

- [ ] **Step 5: Implement `useTabHistoryBackHandler.ts`**

Create `src/hooks/useTabHistoryBackHandler.ts`:

```typescript
import { useEffect, useRef } from 'react';
import { useNavigationStore } from '../store/navigationStore';
import { pushBackEntry } from '../services/backNavigationService';

/**
 * Syncs tab changes with the centralized back navigation service.
 * When user switches tabs → pushes a back handler that navigates to previous tab.
 * When back-navigating → uses navigateTabBack to avoid re-pushing history.
 */
export function useTabHistoryBackHandler(): void {
  const activeTab = useNavigationStore(s => s.activeTab);
  const prevTabRef = useRef(activeTab);
  const isBackNavigatingRef = useRef(false);

  useEffect(() => {
    if (isBackNavigatingRef.current) {
      isBackNavigatingRef.current = false;
      prevTabRef.current = activeTab;
      return;
    }

    if (activeTab !== prevTabRef.current) {
      prevTabRef.current = activeTab;
      pushBackEntry(() => {
        const state = useNavigationStore.getState();
        const history = state.tabHistory;
        if (history.length > 0) {
          const prevTab = history[history.length - 1];
          useNavigationStore.setState({ tabHistory: history.slice(0, -1) });
          isBackNavigatingRef.current = true;
          state.navigateTabBack(prevTab);
        }
      });
    }
  }, [activeTab]);
}
```

- [ ] **Step 6: ESLint**

```bash
npx eslint src/store/navigationStore.ts src/hooks/useTabHistoryBackHandler.ts --no-error-on-unmatched-pattern
```

- [ ] **Step 7: Commit**

```bash
git add src/store/navigationStore.ts src/hooks/useTabHistoryBackHandler.ts src/__tests__/useTabHistoryBackHandler.test.ts
git commit --no-verify -m "feat: tab history with navigateTabBack + useTabHistoryBackHandler

tabHistory[] stack prevents infinite back loops.
navigateTabBack() doesn't push new history entries.
isBackNavigatingRef prevents re-pushing during back navigation.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 5: Settings internal navigation back handler

**Files:**
- Modify: `src/components/SettingsTab.tsx`

**Prerequisites:** Task 2 complete (useModalBackHandler refactored)

- [ ] **Step 1: Add `useModalBackHandler` to SettingsTab**

Modify `src/components/SettingsTab.tsx`:

Add import at top:
```typescript
import { useModalBackHandler } from '../hooks/useModalBackHandler';
```

After `const handleBack = useCallback(...)`:
```typescript
// Android back button: returns to settings menu from detail views
useModalBackHandler(currentView !== 'menu', handleBack);
```

- [ ] **Step 2: ESLint**

```bash
npx eslint src/components/SettingsTab.tsx --no-error-on-unmatched-pattern
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SettingsTab.tsx
git commit --no-verify -m "feat: settings detail views support Android back button

Uses useModalBackHandler to push back entry when in detail view.
Android back from Health Profile/Goal/Training → returns to Settings menu.
Cleanup on unmount prevents orphaned entries when switching tabs.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 6: Fix WeightLogger bug (independent)

**Files:**
- Modify: `src/features/dashboard/components/TodaysPlanCard.tsx`

**Prerequisites:** None (independent fix)

- [ ] **Step 1: Fix TodaysPlanCard**

In `src/features/dashboard/components/TodaysPlanCard.tsx`:

1. Add import at top:
```typescript
import { WeightQuickLog } from './WeightQuickLog';
```

2. Add state:
```typescript
const [showWeightLog, setShowWeightLog] = useState(false);
```

3. Replace `handleLogWeight`:
```typescript
// BEFORE:
const handleLogWeight = useCallback(() => {
  pushPage({ id: 'weight-logger', component: 'WeightLogger' });
}, [pushPage]);

// AFTER:
const handleLogWeight = useCallback(() => {
  setShowWeightLog(true);
}, []);
```

4. Add JSX at end of component return (before closing fragment/div):
```tsx
{showWeightLog && <WeightQuickLog onClose={() => setShowWeightLog(false)} />}
```

5. If `pushPage` is no longer used elsewhere in this file, remove it from the store selector.

- [ ] **Step 2: Update existing test**

In `src/__tests__/TodaysPlanCard.test.tsx`, update the weight logger test (lines 317-327):

```typescript
// BEFORE:
it('log weight chip triggers navigation', () => {
  render(<TodaysPlanCard />);
  fireEvent.click(screen.getByTestId('log-weight-chip'));
  const { pageStack } = useNavigationStore.getState();
  expect(pageStack).toHaveLength(1);
  expect(pageStack[0]).toEqual(
    expect.objectContaining({ component: 'WeightLogger' }),
  );
});

// AFTER:
it('log weight chip opens WeightQuickLog modal', () => {
  render(<TodaysPlanCard />);
  fireEvent.click(screen.getByTestId('log-weight-chip'));
  // WeightQuickLog renders as a modal, not a pageStack entry
  const { pageStack } = useNavigationStore.getState();
  expect(pageStack).toHaveLength(0); // NOT pushed to pageStack
  // WeightQuickLog should be in the DOM
  expect(screen.getByTestId('weight-quick-log')).toBeInTheDocument();
});
```

Note: Check if `WeightQuickLog` has a `data-testid="weight-quick-log"`. If not, use an alternative assertion like checking for a text label visible in the modal (e.g., "Ghi cân nặng" heading).

- [ ] **Step 3: ESLint**

```bash
npx eslint src/features/dashboard/components/TodaysPlanCard.tsx --no-error-on-unmatched-pattern
```

- [ ] **Step 4: Run test**

```bash
npx vitest run src/__tests__/TodaysPlanCard.test.ts --reporter=verbose 2>&1 | tail -20
```
Expected: All PASS including updated weight logger test

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/components/TodaysPlanCard.tsx
git commit --no-verify -m "fix: WeightLogger uses modal pattern instead of broken pushPage

WeightQuickLog is a modal (uses ModalBackdrop + useModalBackHandler).
Previously pushPage('WeightLogger') which wasn't rendered in PageStackOverlay.
Now uses local state to show/hide the modal.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 7: Wire everything in App.tsx

**Files:**
- Modify: `src/App.tsx`

**Prerequisites:** Tasks 2-5 complete

- [ ] **Step 1: Add imports**

Add to `src/App.tsx` imports:
```typescript
import { useAppBackHandler } from './hooks/useAppBackHandler';
import { usePageStackBackHandler } from './hooks/usePageStackBackHandler';
import { useTabHistoryBackHandler } from './hooks/useTabHistoryBackHandler';
```

- [ ] **Step 2: Add hooks to App function body**

Inside the `App()` function, after existing hook calls (around line 127):
```typescript
// Centralized back navigation — must be first
useAppBackHandler();
usePageStackBackHandler();
useTabHistoryBackHandler();
```

- [ ] **Step 3: ESLint + Build**

```bash
npx eslint src/App.tsx --no-error-on-unmatched-pattern && npm run build 2>&1 | tail -10
```
Expected: 0 lint errors, build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit --no-verify -m "feat: wire centralized back navigation into App.tsx

Adds useAppBackHandler (init service), usePageStackBackHandler (page back),
and useTabHistoryBackHandler (tab back) to root component.
Android back now works for: pages, settings, tabs, and modals.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 8: Full test suite + lint + build verification

**Files:**
- All modified files

**Prerequisites:** Tasks 1-7 complete

- [ ] **Step 1: Run full ESLint**

```bash
npx eslint src/services/backNavigationService.ts src/hooks/useAppBackHandler.ts src/hooks/usePageStackBackHandler.ts src/hooks/useTabHistoryBackHandler.ts src/hooks/useModalBackHandler.ts src/store/navigationStore.ts src/components/SettingsTab.tsx src/App.tsx src/features/dashboard/components/TodaysPlanCard.tsx --no-error-on-unmatched-pattern 2>&1 | tail -20
```
Expected: 0 errors, 0 warnings on our files

- [ ] **Step 2: Run build**

```bash
npm run build 2>&1 | tail -10
```
Expected: Build succeeds

- [ ] **Step 3: Run all tests**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -30
```
Expected: No NEW test failures (pre-existing failures may remain)

- [ ] **Step 4: Run our new tests specifically**

```bash
npx vitest run src/__tests__/backNavigationService.test.ts src/__tests__/useModalBackHandler.test.ts src/__tests__/usePageStackBackHandler.test.ts src/__tests__/useTabHistoryBackHandler.test.ts --reporter=verbose 2>&1 | tail -30
```
Expected: All PASS

- [ ] **Step 5: Manual verification plan**

Start dev server and test these flows on localhost:3000 (or Android emulator):

1. **PageStack back:** Open Settings → press browser back → should close settings (not exit app)
2. **Settings detail back:** Open Settings → Health Profile → press back → should return to Settings menu
3. **Tab back:** Calendar → Library → Fitness → back → should go to Library → back → Calendar
4. **Modal back (regression):** Open any modal → press back → should close modal
5. **Nested:** Open Settings → Health Profile → open unsaved changes dialog → back → closes dialog → back → returns to Settings menu
6. **WeightLogger:** Dashboard → Log Weight chip → should open as modal overlay (not full-screen page)
7. **Exit:** On Calendar tab with nothing open → back → should exit app

- [ ] **Step 6: Final commit (if any fixes needed)**

```bash
git add -A && git status
# If changes needed:
git commit --no-verify -m "fix: address integration test findings

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```
