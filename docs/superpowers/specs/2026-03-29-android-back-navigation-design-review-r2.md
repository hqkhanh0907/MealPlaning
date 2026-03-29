# Spec Review — Round 2: Android Back Navigation Design

**Verdict: ❌ Issues Found — 1 Critical (unfixed C1), 1 Major (new)**

---

## Previous Issues Assessment

### C1: Multiple popstate handlers fire for one event — ❌ NOT FIXED

**The spec describes state discrimination in §2 prose but the code doesn't implement it.**

§2 states: *"Each popstate handler checks `event.state?.type` BEFORE processing"* and references *"a parallel tracking array — see §3.7"*.

However, examining the actual handler code:

- **§3.1 modal handler** (line 108): `const handlePopState = () => { ... if (isPushedRef.current) ... }` — **NO `event.state?.type` check**
- **§3.3 page handler** (line 216): `const handlePopState = () => { ... if (pushedCountRef.current > 0) ... }` — **NO `event.state?.type` check**
- **§3.5 tab handler** (line 306): `const handlePopState = () => { ... if (pushedCountRef.current > 0) ... }` — **NO `event.state?.type` check**
- **§3.7** contains only `programmaticBackCount` — **NO "parallel tracking array"**

All handlers rely solely on their pushed refs (`isPushedRef` / `pushedCountRef`), which are ALL true when multiple layers are active.

**Concrete scenario — Settings page + detail view:**

```
State: pageStack=[{settings}], Settings detail open
History: [initial] → [{type:'page'}] → [{type:'modal'}]  (§3.4 reuses useModalBackHandler)
Active handlers: page (pushedCountRef=1), modal (isPushedRef=true)

User presses back → app handler → history.back() → ONE popstate fires

  Modal handler runs:   isPushedRef.current === true  → onClose() → returns to Settings menu
  Page handler runs:    pushedCountRef.current === 1   → popPage() → closes Settings overlay!

Result: Both fire. Settings page closes entirely instead of just returning to menu.
```

§5.4 claims: *"Page handler also sees the popstate but its pushedCountRef is for a DIFFERENT history entry"*. This is incorrect — `pushedCountRef` is a plain counter; it doesn't track WHICH entries it owns. The handler has no way to distinguish "this popstate was for my entry" vs "this popstate was for another handler's entry."

Furthermore, `event.state` cannot solve this either: `popstate` provides the DESTINATION state (the entry you land on), not the POPPED entry state. When the modal entry is popped, `event.state = { type: 'page' }`, which would cause the page handler to match, not the modal handler.

**Fix suggestion:** Replace per-handler `addEventListener('popstate')` with a single global popstate handler + a shared navigation entry stack:

```typescript
// backNavigationState.ts
const entryStack: Array<'modal' | 'page' | 'tab'> = [];
const handlers: Record<string, () => void> = {};

export function pushEntry(type: string) { entryStack.push(type); }
export function registerHandler(type: string, fn: () => void) { handlers[type] = fn; }

// Single global popstate listener:
window.addEventListener('popstate', () => {
  if (programmaticBackCount > 0) { programmaticBackCount--; return; }
  const type = entryStack.pop();
  if (type && handlers[type]) handlers[type]();
});
```

### C2: Tab back infinite loop — ✅ FIXED

Traced Calendar→Library→Fitness→back→back→back:

```
Initial: activeTab='calendar', tabHistory=[], pushedCount=0
→ Library: tabHistory=['calendar'], pushedCount=1, push {type:'tab'}
→ Fitness: tabHistory=['calendar','library'], pushedCount=2, push {type:'tab'}

Back 1: pushedCount=1, navigateTabBack('library'), isBackNavigating=true → Library
Back 2: pushedCount=0, navigateTabBack('calendar'), isBackNavigating=true → Calendar
Back 3: pushedCount=0, tabHistory=[], no processing → canGoBack=false → exitApp()
```

The `tabHistory[]` stack + `navigateTabBack` (doesn't push) + `isBackNavigatingRef` correctly prevents loops. ✅

### M1: Orphaned history entries on unmount — ✅ FIXED

§3.1 cleanup (lines 122-129) correctly pops history when component unmounts with `isPushedRef.current === true`. Verified: when SettingsTab unmounts (App.tsx conditional render removes it when pageStack clears), the `useModalBackHandler` cleanup fires and pops the orphaned detail entry. ✅

### M2: history.back() loop unreliable — ✅ FIXED

§3.3 uses `history.go(-delta)` which fires ONE popstate, matched by single `incrementProgrammaticBack()`. Correct per HTML spec — `history.go(n)` traverses to one target entry, one event. ✅

### M3: navigateTab race condition — ⚠️ PARTIALLY FIXED (see N1 below)

`programmaticBackCount` prevents double-handling of the resulting popstate. However, the count is consumed by the wrong handler when multiple handlers are active (see N1).

### m1: WeightQuickLog prop — ✅ FIXED

Modal pattern with `onClose` is correct. `useModalBackHandler(true, onClose)` with hardcoded `true` works because the component conditionally renders (`{showWeightLog && <WeightQuickLog />}`). Unmount cleanup properly handles both back-button and X-button closure paths. ✅

### m2: Line numbers — ✅ FIXED
### m3: MAX_PAGE_STACK_DEPTH — ✅ FIXED (documented in §3.3 note)
### m4: Settings special rendering — ✅ FIXED (acknowledged in §3.3 note)

---

## New Issues

### N1 (MAJOR): `programmaticBackCount` single-decrement consumed by wrong handler

When `navigateTab` clears `pageStack` while tab+page handlers are both registered:

```
State: pageStack=[{settings}], activeTab changing from calendar→library
Effects fire in order:

1. Page handler effect: pageStack decreased → incrementProgrammaticBack() (count=1),
   pushedCountRef=0, history.go(-1) [async]
2. Tab handler effect: activeTab changed → pushState({type:'tab'}) [sync], pushedCountRef=1

Later, popstate fires from history.go(-1):
  Page handler: count=1 → decrement to 0, return (correct: skip)
  Tab handler:  count=0 → proceed → pushedCountRef=1 > 0 → navigateTabBack() ← WRONG!
```

The page handler consumes the skip, leaving the tab handler to incorrectly process a programmatic popstate as a user back action. This navigates the user back to the previous tab immediately after switching.

Additionally, `history.go(-1)` is async while `pushState` is sync. Per HTML spec, `history.go()` resolves at task execution time using the THEN-current index. Since `pushState` already incremented the index, `go(-1)` targets `currentIndex-1` which is now the freshly-pushed tab entry, NOT the page entry. The page entry becomes orphaned.

**Fix suggestion:** Ensure `history.go(-delta)` runs BEFORE `pushState` by combining the page cleanup and tab push into a single coordinated operation, or use the shared entry stack from the C1 fix.

### N2 (MINOR): Tab handler's useEffect dependency causes listener churn

§3.5 line 326: `[tabHistory, navigateTabBack]` — `tabHistory` is a new array reference on every tab navigation. This causes the popstate listener to be removed and re-added on each tab change. Not a bug (JS is single-threaded, no missed events between cleanup/setup), but unnecessary churn. Consider using a ref for `tabHistory` inside the handler.

---

## Summary

| ID | Issue | Status |
|----|-------|--------|
| C1 | Multi-handler popstate conflict | ❌ **NOT FIXED** — described but not implemented |
| C2 | Tab back infinite loop | ✅ Fixed |
| M1 | Orphaned history entries | ✅ Fixed |
| M2 | history.back() loop | ✅ Fixed |
| M3 | navigateTab race | ⚠️ Partially (blocked by N1) |
| m1 | WeightQuickLog prop | ✅ Fixed |
| m2 | Line numbers | ✅ Fixed |
| m3 | MAX_PAGE_STACK_DEPTH | ✅ Fixed |
| m4 | Settings rendering | ✅ Fixed |
| N1 | programmaticBackCount wrong consumer + async go/pushState race | ❌ **NEW MAJOR** |
| N2 | Tab handler listener churn | ⚠️ New minor |

**Recommendation:** C1 and N1 share the same root cause — independent per-handler popstate listeners with no coordination. The fix is architectural: replace N independent listeners with 1 global popstate dispatcher + a shared LIFO entry-type stack that routes each popstate to exactly one handler. This eliminates both the multi-handler conflict and the programmaticBackCount consumption race.
