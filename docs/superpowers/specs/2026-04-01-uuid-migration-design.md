# Design Spec: Migrate ID Generation to `crypto.randomUUID()`

**Date:** 2026-04-01
**Status:** Draft
**Scope:** Full migration — all 24+ ID generation points to pure UUID

---

## Problem

The project has **24+ locations** generating IDs using 3 inconsistent strategies:

| Strategy | Count | Risk |
|---|---|---|
| `Date.now() + Math.random()` | 8 files | SonarQube security hotspot, not crypto-safe |
| `Date.now()` only | 8+ files | **No random component** — collision risk |
| `crypto.randomUUID()` | 2 files | Already correct |

This creates:
- **6 SonarQube security hotspots** (Math.random)
- **Collision risk** in timestamp-only IDs (GoalPhaseSelector, IngredientEditModal, fitnessStore)
- **Inconsistent ID formats** across the app
- **Duplicated logic** — local `generateId()` functions in 3+ files

## Solution

Replace all ID generation with a single centralized `generateUUID()` function using the native `crypto.randomUUID()` browser API.

### Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| ID Format | Pure UUID v4 (`550e8400-e29b-41d4-a716-446655440000`) | User preference, standard, no prefix needed |
| Function Name | `generateUUID()` | Clear intent, distinguishes from old `generateId()` |
| API | No parameters | Pure UUID needs no prefix or config |
| Shuffle | Fisher-Yates algorithm | Correct O(n) shuffle, replaces biased `.sort(() => Math.random() - 0.5)` |
| Insight IDs (`p8-tip-*`) | Keep as-is | Not entity IDs, not stored in DB, not a security concern |
| Test fixture IDs (`dish-1`, `plan-a`) | Keep as-is | Simple test data, no Math.random() involved |

### Browser Compatibility

- `crypto.randomUUID()` available since Chrome 92 (July 2021)
- Capacitor requires Android WebView Chrome 60+ (project default)
- Android 10+ System WebView auto-updates → Chrome 92+ guaranteed on modern devices
- **Fallback not needed** — target devices all support it

---

## Changes Required

### 1. Core: `src/utils/helpers.ts`

**Before:**
```typescript
export const generateId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
```

**After:**
```typescript
export const generateUUID = (): string => crypto.randomUUID();
```

- Remove `generateId` export
- Add `generateUUID` export
- No parameters

### 2. Centralize: Replace all local ID generation

Files with local `generateId()` or inline `Date.now()` patterns → import `generateUUID`:

| File | Current Pattern | Change To |
|---|---|---|
| `WeightQuickLog.tsx` | Local `generateId()` with `w-${Date.now()}-${random}` | `generateUUID()` |
| `DailyWeightInput.tsx` | Local `generateId()` with `w-${Date.now()}-${random}` | `generateUUID()` |
| `GoalPhaseSelector.tsx` | Local `generateId()` with `goal-${Date.now()}` | `generateUUID()` |
| `NotificationContext.tsx` | Inline `toast-${Date.now()}-${random}` | `generateUUID()` |
| `WorkoutLogger.tsx` | Inline `workout-${Date.now()}` and `set-${Date.now()}-${count}` | `generateUUID()` |
| `CardioLogger.tsx` | Inline `workout-${Date.now()}` and `set-${Date.now()}-cardio` | `generateUUID()` |
| `ExerciseSelector.tsx` | Inline `custom-${Date.now()}` | `generateUUID()` |
| `IngredientEditModal.tsx` | Inline `ing-${Date.now()}` | `generateUUID()` |
| `useTrainingPlan.ts` | Inline `plan_${Date.now()}` (line 460) — **no random, highest collision risk** | `generateUUID()` |
| `logger.ts` | `generateTraceId()` with `Math.random()` | `crypto.randomUUID().slice(0, 8)` (keep short for trace) |

### 3. Update import sites of old `generateId(prefix)`

All 6 production files that import `generateId` from `utils/helpers`:

| File | Current | Change To |
|---|---|---|
| `App.tsx` | `generateId('dish')` | `generateUUID()` |
| `DishManager.tsx` | `generateId('dish')` | `generateUUID()` |
| `DishEditModal.tsx` | `generateId('dish')`, `generateId('ing')` | `generateUUID()` |
| `QuickAddIngredientForm.tsx` | `generateId('ing')` | `generateUUID()` |
| `dataService.ts` | `generateId('ing')` | `generateUUID()` |
| `mealTemplateStore.ts` | `generateId('tpl')` | `generateUUID()` |

### 4. fitnessStore.ts — 5 composite ID patterns

All composite IDs in `fitnessStore.ts` that use `Date.now()`:

| Line | Current | Change To |
|---|---|---|
| 195 | `${planId}_day_${dayOfWeek}_s${count}_${Date.now()}` | `generateUUID()` |
| 820 | `${planId}_split_${i}_${Date.now()}` | `generateUUID()` |
| 874 | `${planId}_remap_${i}_${Date.now()}` | `generateUUID()` |
| 995 | `${planId}_tpl_${i}_${Date.now()}` | `generateUUID()` |
| 1055 | `user_tpl_${Date.now()}` | `generateUUID()` |

**Confirmed safe:** These composite IDs are NEVER parsed. All usage is opaque equality checks (`===`).

### 5. Already using `crypto.randomUUID()` — No change needed

| File | Status |
|---|---|
| `TrainingDetailSteps.tsx` | ✅ Already uses `crypto.randomUUID()` — optionally migrate to `generateUUID()` for consistency |
| `TrainingProfileForm.tsx` | ✅ Already uses `crypto.randomUUID()` — optionally migrate to `generateUUID()` for consistency |

### 6. Fisher-Yates shuffle for `geminiService.ts`

**Before (biased):**
```typescript
const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
```

**After (correct Fisher-Yates):**
```typescript
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

**Note:** Fisher-Yates uses `crypto.getRandomValues()` for cryptographically secure randomness — no `Math.random()` remains in production code. Zero SonarQube security hotspots from this migration.

### 7. Test file updates (minimal)

Only tests that assert ID **format** need changes:

| File | Line | Current Assertion | Action |
|---|---|---|---|
| `helpers.test.ts` | 7+ | `.startsWith('ing-')`, format checks | Rewrite to test UUID format |
| `dishEditModal.test.tsx` | 321 | `toMatch(/^dish-/)` | Change to UUID regex |
| `quickAddIngredientForm.test.tsx` | 178 | `toMatch(/^ing-/)` | Change to UUID regex |
| `ingredientEditModal.test.tsx` | 303 | `toMatch(/^ing-/)` | Change to UUID regex |
| `DailyWeightInput.test.tsx` | 29 | `makeEntry()` uses `Math.random()` | Use `generateUUID()` or fixed test ID |
| `WeightQuickLog.test.tsx` | 39 | `makeEntry()` uses `Math.random()` | Use `generateUUID()` or fixed test ID |
| `integration.test.ts` | 9, 242 | Imports `generateId` from helpers | Update import to `generateUUID` |

**Not changed:** 150+ hardcoded test fixture IDs (`'dish-1'`, `'plan-a'`, etc.) — kept as simple test data.

---

## Out of Scope

- **Insight IDs** (`p8-tip-*` in `useInsightEngine.ts`) — not entity IDs, not stored in DB
- **Hardcoded test fixture IDs** — simple test data, not using Math.random()
- **Database migration** — existing data retains old ID format; new records use UUID. Both formats coexist as TEXT.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Existing data has old format IDs | None | DB uses TEXT columns, old IDs remain valid |
| Old/new format IDs coexist | None | All code uses opaque equality, never parses format |
| Fisher-Yates shuffle | None | Uses `crypto.getRandomValues()` — fully crypto-safe, no SonarQube hotspot |
| Test assertions on ID format break | Expected | Part of the migration — update assertions to UUID regex |

## Expected Outcomes

- **All SonarQube security hotspots eliminated** from this migration (0 new hotspots, 2 pre-existing regex hotspots remain)
- **0 collision risk** — crypto.randomUUID() is RFC 4122 v4 compliant
- **1 single source** for all ID generation — `generateUUID()` in `utils/helpers.ts`
- **Consistent format** across entire app
- **Zero bundle size increase** — native browser API
