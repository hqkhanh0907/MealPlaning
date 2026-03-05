# BUG-001 — Scroll permanently locked after closing IngredientEditModal with unsaved changes

| Field | Value |
|-------|-------|
| **ID** | BUG-001 |
| **Severity** | High |
| **Priority** | P1 |
| **Component** | `ModalBackdrop`, `IngredientEditModal`, `UnsavedChangesDialog` |
| **Reported** | 2025 |
| **Status** | ✅ Fixed (reference-counted scroll lock) |

---

## 1. Bug Description

After performing the following sequence on mobile, all scrolling across the entire application breaks permanently (until a hard-reload):

1. Open the **Add Ingredient** modal.
2. Fill in the **Name** and **Unit** fields.
3. Tap the **AI suggestion** button and wait for it to return an error ("ingredient not found").
4. Tap the **✕ close** button.
5. The `UnsavedChangesDialog` appears (because the form has unsaved changes).
6. Tap **Discard**.
7. → **Scroll is broken on every page** (ingredient list, calendar, dish management).

**Environment:**
- OS: macOS / Android (emulator API 31 + real device)
- Browser: Chrome 91 (Capacitor WebView)
- React: 18 + StrictMode

---

## 2. Steps to Reproduce

| # | Action | Expected | Actual |
|---|--------|----------|--------|
| 1 | Navigate to Management → Ingredients | Ingredient list displayed | ✓ |
| 2 | Tap "+ Add ingredient" | `IngredientEditModal` opens | ✓ |
| 3 | Type a name (e.g., "Test") and unit (e.g., "g") | Fields filled | ✓ |
| 4 | Tap AI suggestion button | Loading then error toast | ✓ |
| 5 | Tap ✕ close button | `UnsavedChangesDialog` appears | ✓ |
| 6 | Tap Discard | Both modals close | ✓ |
| 7 | Try to scroll the ingredient list | List should scroll | **Cannot scroll** ❌ |

---

## 3. Root Cause Analysis

### Architecture involved

```
IngredientEditModal renders a Fragment:
  <>
    <ModalBackdrop onClose={handleClose} zIndex="z-60">   ← Backdrop A
      ...form fields...
    </ModalBackdrop>
    <UnsavedChangesDialog isOpen={...} ... />             ← renders its own Backdrop B (z-70)
  </>
```

`ModalBackdrop` locks iOS body scroll using the `position:fixed` approach:

```tsx
// OLD (buggy) implementation
useEffect(() => {
  const scrollY = window.scrollY;
  const body = document.body;
  const prevOverflow = body.style.overflow;  // captures 'hidden' when nested!
  const prevPosition = body.style.position;  // captures 'fixed' when nested!
  // ... lock body ...
  return () => {
    body.style.overflow = prevOverflow;  // re-locks when inner modal closes!
    body.style.position = prevPosition;
    // ...
  };
}, []);
```

### Bug sequence

1. Backdrop **A** mounts → captures `prevOverflow=''`, `prevPosition=''` → **locks** body (`fixed/hidden`).
2. User fills form → `hasChanges()` returns `true`.
3. User taps ✕ → `UnsavedChangesDialog` renders → Backdrop **B** mounts → captures `prevOverflow='hidden'`, `prevPosition='fixed'` (body already locked!).
4. User clicks Discard → `onClose()` → React unmounts **both** `ModalBackdrop` instances in the same commit.
5. **React cleanup order** (siblings, first-to-second):
   - Backdrop A cleanup: restores `overflow=''`, `position=''` → **unlocked** ✓
   - Backdrop B cleanup: "restores" `overflow='hidden'`, `position='fixed'` → **RE-LOCKS** ❌
6. `document.body.style.position` is permanently `fixed` → scroll broken everywhere.

### Why the cleanup order is non-deterministic

React does not guarantee the cleanup order for sibling `useEffect` calls unmounting in the same commit. The issue manifests consistently on mobile because React processes sibling cleanups in mount order (first-in first-cleaned), but this is an internal implementation detail, not a contract.

---

## 4. Solution Options Considered

| # | Solution | Trade-offs |
|---|----------|-----------|
| 1 | **Reference-counted module-level lock** | ✅ Order-independent, minimal code, correct for any nesting depth |
| 2 | Track "lock owner" and only restore from owner | More code, still fragile if owner unmounts before non-owner |
| 3 | Render `UnsavedChangesDialog` inside the `ModalBackdrop` (avoid Fragment) | Structural refactor, changes component API |

**Chosen: Option 1** — module-level `_scrollLockDepth` counter.

---

## 5. Fix Applied

**File:** `src/components/shared/ModalBackdrop.tsx`

```tsx
// Module-level reference counter — shared across ALL ModalBackdrop instances
let _scrollLockDepth = 0;
let _savedScrollY = 0;

useEffect(() => {
  if (_scrollLockDepth === 0) {
    // First (outermost) modal: apply the lock
    _savedScrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${_savedScrollY}px`;
    document.body.style.width = '100%';
  }
  _scrollLockDepth += 1;

  return () => {
    _scrollLockDepth = Math.max(0, _scrollLockDepth - 1);
    if (_scrollLockDepth === 0) {
      // Last modal closed: restore scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, _savedScrollY);
    }
  };
}, []);
```

**Why this is order-independent:**
- Cleanup order A then B: counter goes 2→1 (no restore) then 1→0 (restore) ✓
- Cleanup order B then A: counter goes 2→1 (no restore) then 1→0 (restore) ✓

---

## 6. Regression Tests Added

### Unit tests — `src/__tests__/modalBackdrop.test.tsx`

| Test | Verifies |
|------|----------|
| `locks body scroll when a modal mounts` | Single modal locks body |
| `restores body scroll when the modal unmounts` | Single modal restores body |
| `keeps body locked when inner modal closes while outer is still open` | Counter > 0 keeps lock |
| **`BUG-regression: two nested modals unmounting together fully restores body scroll`** | Core regression |

### E2E test — `e2e/specs/04-ingredient-crud.spec.ts`

`describe('Scroll lock regression (nested modal close)')` — fills ingredient form, closes with Discard, then asserts `document.body.style.position === ''` via `browser.execute`.

---

## 7. Chrome DevTools Verification

After applying the fix, confirmed via DevTools Console:

```javascript
// Before fix: after closing modal → 'fixed'
document.body.style.position  // ''  ✅ after fix
document.body.style.overflow  // ''  ✅ after fix
```

---

## 8. Evidence / Log

> **Console (before fix):** No JS errors. Body styles silently stuck:
> `document.body.style.position = "fixed"; document.body.style.overflow = "hidden";`
>
> **Console (after fix):** Body styles fully cleared after modal close.
