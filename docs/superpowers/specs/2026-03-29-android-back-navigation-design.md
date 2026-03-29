# Android Back Navigation — Design Spec

## §1 Problem Statement

The app's Android back button/gesture navigation is **partially broken**:

| Layer | Current state | Expected behavior |
|-------|--------------|-------------------|
| Modals (19 components) | ✅ Works via `useModalBackHandler` | Back closes modal |
| PageStack pages (Settings, WorkoutLogger, CardioLogger, PlanDayEditor) | ❌ **Exits app** | Back returns to previous screen |
| Settings internal nav (Menu → Detail views) | ❌ **Exits app** | Back returns to Settings menu |
| Tab navigation (5 tabs) | ❌ No history | Back returns to previous tab |
| WeightLogger | ❌ Bug — `pushPage('WeightLogger')` but WeightQuickLog is a modal, not a page | Should use modal pattern (show/hide) instead of pushPage |

### Root Cause

`useModalBackHandler` registers its Capacitor `backButton` listener **only when a modal is open** (`isOpen=true`). When no modal is open:
- Zero Capacitor listeners active
- Android back button → Capacitor default behavior → nothing happens or exit app
- PageStack pages, settings detail views, and tab switches don't push browser history entries

## §2 Architecture: Centralized Back Stack Service

### Principle

1. **Single centralized `BackNavigationService`** — ONE handler stack, ONE popstate listener, ONE Capacitor listener
2. **No per-component event listeners** — all layers push/pop through the service
3. **LIFO ordering** — explicit handler stack ensures the most recent handler runs first
4. **Zero coordination needed** — exactly ONE handler runs per back event (the top of the stack)

### Why Centralized (lessons from review rounds 1-2)

Per-component `addEventListener('popstate')` handlers **cannot coordinate**:
- ONE popstate event triggers ALL registered listeners simultaneously
- Each listener checks its own `pushedRef` and may incorrectly respond
- No reliable way to determine which listener "owns" a given popstate

The centralized service eliminates this entirely: **1 stack, 1 listener, 1 handler per event**.

### Handler Stack Example

```
User flow: Calendar → Library tab → Settings → Health Profile → Confirm modal

Handler stack (LIFO):
  [4] modal.onClose()          ← TOP (most recent)
  [3] settings.handleBack()
  [2] page.popPage()
  [1] tab.navigateTabBack()

Back 1: pop [4] → modal.onClose() → modal closes
Back 2: pop [3] → settings.handleBack() → returns to settings menu
Back 3: pop [2] → page.popPage() → settings overlay closes
Back 4: pop [1] → tab.navigateTabBack() → returns to Calendar
Back 5: stack empty → exitApp()
```

### Browser History Sync

The service maintains a 1:1 mapping between its handler stack and browser history entries:
- `pushBackEntry(handler)` → pushes handler to stack + `history.pushState()`
- User back → `history.back()` → ONE popstate → service pops top handler + calls it
- Programmatic close → service pops handler + `history.back()` (skipped via counter)

## §3 Detailed Changes

### §3.1 Modify `useModalBackHandler.ts`

**Remove** Capacitor `App.addListener('backButton')` (lines 56-69).
**Keep** browser history `pushState` + `popstate` logic.
**Change** `pushState` to use tagged state: `{ type: 'modal' }`.
**Add** unmount cleanup: pop history entry if still pushed when component unmounts.
**Import** shared `programmaticBackCount` from `backNavigationState.ts`.

```typescript
import { incrementProgrammaticBack, decrementProgrammaticBack, getProgrammaticBackCount } from '../services/backNavigationState';

export function useModalBackHandler(isOpen: boolean, onClose: () => void) {
  const isPushedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      if (isPushedRef.current) {
        isPushedRef.current = false;
        incrementProgrammaticBack();
        globalThis.history.back();
      }
      return;
    }

    // Push tagged history entry
    globalThis.history.pushState({ type: 'modal' }, '');
    isPushedRef.current = true;

    const handlePopState = () => {
      if (getProgrammaticBackCount() > 0) {
        decrementProgrammaticBack();
        return;
      }
      if (isPushedRef.current) {
        isPushedRef.current = false;
        onCloseRef.current();
      }
    };

    globalThis.addEventListener('popstate', handlePopState);

    // Cleanup: also pop history if component unmounts while still pushed
    return () => {
      globalThis.removeEventListener('popstate', handlePopState);
      if (isPushedRef.current) {
        isPushedRef.current = false;
        incrementProgrammaticBack();
        globalThis.history.back();
      }
    };
  }, [isOpen]);
}
```

After change: All 19 modal components continue using `useModalBackHandler(isOpen, onClose)` — **zero API change**.

### §3.2 New: `useAppBackHandler.ts` hook

Single app-level Capacitor `backButton` listener. Used ONLY in `App.tsx`.

```typescript
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export function useAppBackHandler(): void {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cleanup: (() => void) | null = null;

    void App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        globalThis.history.back(); // triggers popstate → per-layer handlers
      } else {
        void App.exitApp();
      }
    }).then(handle => {
      cleanup = () => { void handle.remove(); };
    });

    return () => { cleanup?.(); };
  }, []);
}
```

### §3.3 New: `usePageStackBackHandler.ts` hook

Integrates `navigationStore.pageStack` with browser history.

**Behavior:**
- When `pushPage()` causes `pageStack.length` to increase → `history.pushState({ type: 'page' }, '')`
- When `popstate` fires and we have pushed page entries → call `popPage()`
- When `popPage()` is called programmatically (e.g., UI back button) → use `history.go(-delta)` to sync (NOT loop of `history.back()` — async-safe)

**State discrimination:** Popstate handler checks `isPushedRef` to determine ownership — it only responds if it has pushed entries.

**Note on `MAX_PAGE_STACK_DEPTH` replacement:** When `pushPage` is called at max depth (2), the top page is replaced and `pageStack.length` stays the same. No new history entry is pushed. The replaced page is unreachable via back. This is acceptable — it matches the store's replacement semantics.

**Note on Settings vs PageStackOverlay:** Settings is rendered as a special case in App.tsx (separate overlay), not through `PageStackOverlay`. The hook treats ALL pageStack entries equally since both render paths use the same `pageStack` and `popPage()`.

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { useNavigationStore } from '../store/navigationStore';
import { incrementProgrammaticBack, decrementProgrammaticBack, getProgrammaticBackCount } from '../services/backNavigationState';

export function usePageStackBackHandler(): void {
  const pageStack = useNavigationStore(s => s.pageStack);
  const popPage = useNavigationStore(s => s.popPage);
  const prevLengthRef = useRef(0);
  const pushedCountRef = useRef(0);

  useEffect(() => {
    const curr = pageStack.length;
    const prev = prevLengthRef.current;
    prevLengthRef.current = curr;

    if (curr > prev) {
      // Pages were pushed — add history entries
      const delta = curr - prev;
      for (let i = 0; i < delta; i++) {
        globalThis.history.pushState({ type: 'page' }, '');
        pushedCountRef.current++;
      }
    } else if (curr < prev && pushedCountRef.current > 0) {
      // Pages were popped programmatically → sync history with history.go()
      const delta = Math.min(prev - curr, pushedCountRef.current);
      if (delta > 0) {
        incrementProgrammaticBack(); // Single increment — history.go fires ONE popstate
        pushedCountRef.current -= delta;
        globalThis.history.go(-delta); // Go back N entries in one shot
      }
    }
  }, [pageStack.length]);

  useEffect(() => {
    const handlePopState = () => {
      if (getProgrammaticBackCount() > 0) {
        decrementProgrammaticBack();
        return;
      }
      if (pushedCountRef.current > 0) {
        pushedCountRef.current--;
        popPage();
      }
    };

    globalThis.addEventListener('popstate', handlePopState);
    return () => globalThis.removeEventListener('popstate', handlePopState);
  }, [popPage]);
}
```

### §3.4 Settings Internal Navigation Back Handler

In `SettingsTab.tsx`, reuse `useModalBackHandler` for detail views:

```typescript
// When navigating to a detail view, treat it like a "modal" for back purposes
useModalBackHandler(currentView !== 'menu', handleBack);
```

This pushes a history entry (tagged `{ type: 'modal' }`) when entering a detail view. Android back → app handler → `history.back()` → popstate → `handleBack()` → returns to menu.

**Cleanup on unmount:** If user switches tab while in Settings detail view, SettingsTab unmounts. The `useModalBackHandler` cleanup (§3.1) now properly pops the orphaned history entry, preventing stale entries in the history stack.

### §3.5 Tab History

Add `tabHistory: MainTab[]` stack to `navigationStore` (not just single `previousTab` — prevents infinite back loops):

```typescript
// In navigationStore.ts
interface NavigationState {
  // ... existing
  tabHistory: MainTab[];
}

navigateTab: (tab: MainTab) => {
  set((state) => ({
    activeTab: tab,
    tabHistory: [...state.tabHistory, state.activeTab], // Push current to history
    pageStack: [],
    showBottomNav: true,
  }));
},

// New: navigate back to previous tab WITHOUT pushing to tabHistory
navigateTabBack: (tab: MainTab) => {
  set({
    activeTab: tab,
    // tabHistory NOT modified — it was already popped by the caller
    pageStack: [],
    showBottomNav: true,
  });
},
```

New hook `useTabHistoryBackHandler`:

```typescript
import { useEffect, useRef } from 'react';
import { useNavigationStore } from '../store/navigationStore';
import { incrementProgrammaticBack, decrementProgrammaticBack, getProgrammaticBackCount } from '../services/backNavigationState';

export function useTabHistoryBackHandler(): void {
  const activeTab = useNavigationStore(s => s.activeTab);
  const tabHistory = useNavigationStore(s => s.tabHistory);
  const navigateTabBack = useNavigationStore(s => s.navigateTabBack);
  const prevTabRef = useRef(activeTab);
  const pushedCountRef = useRef(0);
  const isBackNavigatingRef = useRef(false);

  useEffect(() => {
    if (isBackNavigatingRef.current) {
      // This tab change was caused by back navigation — don't push new history
      isBackNavigatingRef.current = false;
      return;
    }
    if (activeTab !== prevTabRef.current) {
      prevTabRef.current = activeTab;
      globalThis.history.pushState({ type: 'tab', from: tabHistory[tabHistory.length - 1] }, '');
      pushedCountRef.current++;
    }
  }, [activeTab, tabHistory]);

  useEffect(() => {
    const handlePopState = () => {
      if (getProgrammaticBackCount() > 0) {
        decrementProgrammaticBack();
        return;
      }
      if (pushedCountRef.current > 0 && tabHistory.length > 0) {
        pushedCountRef.current--;
        const prevTab = tabHistory[tabHistory.length - 1];
        // Pop from tabHistory in the store
        useNavigationStore.setState((state) => ({
          tabHistory: state.tabHistory.slice(0, -1),
        }));
        isBackNavigatingRef.current = true; // Flag to prevent re-pushing history
        navigateTabBack(prevTab);
        prevTabRef.current = prevTab;
      }
    };

    globalThis.addEventListener('popstate', handlePopState);
    return () => globalThis.removeEventListener('popstate', handlePopState);
  }, [tabHistory, navigateTabBack]);
}
```

**Why `tabHistory[]` stack instead of single `previousTab`:** A single `previousTab` causes infinite loops. When back-navigating, `navigateTab(previousTab)` would set a NEW `previousTab` (the tab we just left), creating A→B→A→B→... bouncing. A full stack correctly unwinds: Calendar→Library→Fitness → back → Library → back → Calendar → back → exitApp.

**Why `navigateTabBack` + `isBackNavigatingRef`:** Back-navigation must NOT push a new tab history entry. The `isBackNavigatingRef` flag prevents the `useEffect` from pushing a new history entry when the tab change was caused by a back action.

### §3.6 Fix WeightLogger Bug

`WeightQuickLog` is a **modal** (uses `ModalBackdrop` + `useModalBackHandler` with `onClose` prop). It should NOT be pushed to `pageStack`.

**Fix in `TodaysPlanCard.tsx`:** Replace `pushPage` with modal state:

```typescript
// BEFORE (bug):
const handleLogWeight = useCallback(() => {
  pushPage({ id: 'weight-logger', component: 'WeightLogger' });
}, [pushPage]);

// AFTER (fix):
const [showWeightLog, setShowWeightLog] = useState(false);
const handleLogWeight = useCallback(() => {
  setShowWeightLog(true);
}, []);

// In JSX:
{showWeightLog && <WeightQuickLog onClose={() => setShowWeightLog(false)} />}
```

### §3.7 Extract Shared `programmaticBackCount`

Create `src/services/backNavigationState.ts`:

```typescript
/**
 * Shared counter for tracking programmatic history.back() calls.
 * When > 0, popstate events should be skipped (they're from our own code, not user action).
 * JavaScript is single-threaded, so no race conditions.
 */
let programmaticBackCount = 0;

export function incrementProgrammaticBack(): void { programmaticBackCount++; }
export function decrementProgrammaticBack(): void { programmaticBackCount--; }
export function getProgrammaticBackCount(): number { return programmaticBackCount; }
```

Update `useModalBackHandler` to import from this module instead of using a module-level variable.

## §4 File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/services/backNavigationService.ts` | Centralized back stack + popstate + Capacitor listener |
| Create | `src/hooks/useAppBackHandler.ts` | Init hook for App.tsx |
| Create | `src/hooks/usePageStackBackHandler.ts` | PageStack ↔ back stack sync |
| Create | `src/hooks/useTabHistoryBackHandler.ts` | Tab history ↔ back stack sync |
| Modify | `src/hooks/useModalBackHandler.ts` | Use centralized service, add unmount cleanup |
| Modify | `src/store/navigationStore.ts` | Add `tabHistory[]` stack, `navigateTabBack()` |
| Modify | `src/components/SettingsTab.tsx` | Add `useModalBackHandler` for detail views |
| Modify | `src/App.tsx` | Add `useAppBackHandler()`, `usePageStackBackHandler()`, `useTabHistoryBackHandler()` |
| Modify | `src/features/dashboard/components/TodaysPlanCard.tsx` | Fix WeightLogger: modal state instead of pushPage |
| Create | `src/__tests__/backNavigation.test.ts` | Tests for back navigation service + hooks |

## §5 Edge Cases

### §5.1 navigateTab clears pageStack
When user switches tabs, `navigateTab()` clears `pageStack` to `[]`. The `usePageStackBackHandler` detects `pageStack.length` decrease and calls `history.go(-delta)` (single call, fires ONE popstate) to sync. Simultaneously, `useTabHistoryBackHandler` pushes a tab history entry. The `history.go()` is async and resolves after the `pushState`, which is fine — the `programmaticBackCount` ensures the resulting popstate is skipped.

### §5.2 Settings detail + tab switch (orphaned entries)
If user is in Settings → Health Profile detail and switches tab via bottom nav:
1. `navigateTab()` clears `pageStack = []`
2. Settings overlay unmounts
3. `useModalBackHandler` cleanup fires (§3.2): calls `removeTopBackEntry()` → pops settings-detail handler from stack + syncs history
4. `usePageStackBackHandler` detects pageStack decrease → calls `removeBackEntries(1)` → pops page handler from stack + syncs history
5. `useTabHistoryBackHandler` calls `pushBackEntry(tabHandler)` → pushes new tab entry

All entries properly cleaned up via centralized service. No orphans.

### §5.3 Multiple rapid back presses
The `programmaticBackCount` global ensures that programmatic `history.back()` calls don't trigger handlers. Each back press processes sequentially through the browser event loop (JS is single-threaded).

### §5.4 Modal on top of pageStack page
Handler stack: `[tab_handler, page_handler, modal_handler]`. Back → service pops `modal_handler` → calls modal `onClose()`. Next back → pops `page_handler` → calls `popPage()`. Correct LIFO ordering guaranteed by single stack — **no multi-handler conflict possible**.

### §5.5 Settings detail + modal (nested)
Handler stack: `[tab_handler, page_handler, settings_detail_handler, modal_handler]`. Back pops in order: modal → settings detail → page → tab. Each step pops exactly ONE handler from the centralized stack.

### §5.6 Browser forward button
Not handled — users don't use forward in mobile apps. `pushState` entries are one-directional.

### §5.7 Tab back terminates correctly
Tab history: Calendar → Library → Fitness. History stack: `[tab:calendar] → [tab:library]`.
Back 1: pops `[tab:library]` → `navigateTabBack(Library)` → Library tab. `tabHistory = [Calendar]`
Back 2: pops `[tab:calendar]` → `navigateTabBack(Calendar)` → Calendar tab. `tabHistory = []`
Back 3: no history → `canGoBack=false` → `exitApp()`. **No infinite loop.**

## §6 Testing Strategy

1. **Unit tests** for each new hook (mock Capacitor, mock history)
2. **Integration test** for the full back navigation flow
3. **Manual test** on Android emulator via Chrome DevTools
4. **Test matrix:**
   - Modal back (existing behavior preserved — 19 modals)
   - PageStack page back (Settings, WorkoutLogger, CardioLogger, PlanDayEditor)
   - Settings internal detail back (Health Profile, Goal, Training Profile)
   - Tab back history (Calendar → Library → Fitness → back → back → back)
   - Nested modal + page back
   - Tab switch while in Settings detail (orphan cleanup)
   - WeightLogger opens as modal (not pushPage)
   - Rapid back presses (no double-handling)
   - Tab back terminates at initial tab → exitApp

## §7 Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Removing Capacitor listener from `useModalBackHandler` breaks modal back | Centralized service's Capacitor listener calls `history.back()` → triggers popstate → service pops top handler (which is the modal handler) → `onClose()`. Same result, different routing. |
| Multiple popstate handlers conflict | **ELIMINATED** — only ONE popstate listener exists (in `backNavigationService`). `handlerStack.pop()` returns exactly one handler per event. |
| `programmaticBackCount` races | JavaScript is single-threaded; counter operations are synchronous. No race possible. |
| Tab history infinite loop | `tabHistory[]` stack + `navigateTabBack()` (doesn't push) + `isBackNavigatingRef` flag. |
| Orphaned history entries on unmount | `useModalBackHandler` cleanup calls `removeTopBackEntry()` on unmount (§3.2). |
| `removeBackEntries(N)` / `history.go(-N)` | Uses single `programmaticBackCount++` + `history.go(-N)` → ONE popstate → skipped. |
| Tab switch + pageStack clear timing | `removeBackEntries()` removes handlers from stack synchronously. `history.go()` is async but its popstate is skipped via counter. Tab `pushBackEntry()` executes synchronously. No conflict. |
| Handler stack out of sync with history | Both are managed by the same service functions (`pushBackEntry` and `removeTopBackEntry`/`removeBackEntries`). 1:1 mapping enforced at the API level. |
