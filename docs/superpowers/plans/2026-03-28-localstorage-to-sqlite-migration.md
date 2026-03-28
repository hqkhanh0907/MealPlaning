# localStorage → SQLite Full Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all localStorage usage — migrate every store and config key to SQLite as single source of truth.

**Architecture:** All 6 Zustand stores (ingredients, dishes, dayPlans, userProfile, mealTemplates, fitness) become DB-first: read from SQLite on startup, write to SQLite on mutation. Config/metadata moves to a new `app_settings` table. Google Drive sync exports/imports binary SQLite. `useUserProfileStore` is deleted and merged into `healthProfileStore`.

**Tech Stack:** React, Zustand, sql.js (WASM SQLite), TypeScript, Vite

**Spec:** `docs/superpowers/specs/2026-03-28-localstorage-to-sqlite-migration-design.md`

---

## File Structure

### New Files
- `src/services/appSettings.ts` — Generic key-value get/set for `app_settings` SQLite table

### Files to Delete
- `src/store/userProfileStore.ts` — Merged into healthProfileStore
- `src/__tests__/userProfileStore.test.ts` — Tests for deleted store
- `src/hooks/usePersistedState.ts` — No longer needed (localStorage wrapper)
- `src/__tests__/usePersistedState.test.ts` — Tests for deleted hook
- `src/hooks/useMealTemplate.ts` — Uses usePersistedState, replaced by mealTemplateStore
- `src/services/migrationService.ts` — One-time migration no longer needed

### Major Modifications
- `src/services/schema.ts` — Add `app_settings` table, `target_calories` column, `grocery_checked` table
- `src/services/databaseService.ts` — Add `exportBinary()` / `importBinary()` methods
- `src/contexts/DatabaseContext.tsx` — Orchestrate store loading from SQLite on init
- `src/store/ingredientStore.ts` — Remove localStorage, add SQLite read/write
- `src/store/dishStore.ts` — Remove localStorage, add SQLite read/write
- `src/store/dayPlanStore.ts` — Remove localStorage, add SQLite read/write
- `src/store/mealTemplateStore.ts` — Remove localStorage, add SQLite read/write
- `src/store/fitnessStore.ts` — Remove `persist()` middleware
- `src/features/health-profile/store/healthProfileStore.ts` — Add `targetCalories` field
- `src/App.tsx` — Remove useUserProfileStore, remove hydrate calls, read from healthProfileStore
- `src/components/GoogleDriveSync.tsx` — Binary export/import
- `src/components/DataBackup.tsx` — Binary export/import
- `src/hooks/useAutoSync.ts` — Read sync timestamps from SQLite
- `src/hooks/useDarkMode.ts` — Read/write theme from SQLite
- `src/contexts/AuthContext.tsx` — Read/write auth state from SQLite
- `src/components/DateSelector.tsx` — Read/write hint flag from SQLite
- `src/features/dashboard/hooks/useInsightEngine.ts` — Read/write dismissed IDs from SQLite
- `src/components/GroceryList.tsx` — Replace usePersistedState with SQLite
- `src/features/health-profile/hooks/useNutritionTargets.ts` — Remove useUserProfileStore ref
- `src/features/fitness/components/FitnessTab.tsx` — Remove useUserProfileStore ref

### Test Updates
- `src/__tests__/ingredientStore.test.ts`
- `src/__tests__/dishStore.test.ts`
- `src/__tests__/dayPlanStore.test.ts`
- `src/__tests__/mealTemplateStore.test.ts`
- `src/__tests__/fitnessStore.test.ts`
- `src/__tests__/settingsTab.test.tsx`
- `src/__tests__/FitnessTab.test.tsx`
- `src/__tests__/useNutritionTargets.test.ts`
- `src/__tests__/mealTemplate.test.tsx`

---

## Phase 1: Foundation

### Task 1: Add `app_settings` table and `target_calories` column to schema

**Files:**
- Modify: `src/services/schema.ts`

- [ ] **Step 1: Add `app_settings` table to schema**

In `src/services/schema.ts`, add to the `TABLE_DEFINITIONS` array:

```sql
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
)
```

- [ ] **Step 2: Add `target_calories` column to `user_profile` table**

In the `user_profile` CREATE TABLE statement, add after `fat_pct`:

```sql
target_calories INTEGER DEFAULT 1500,
```

- [ ] **Step 3: Add `grocery_checked` table for GroceryList persistence**

```sql
CREATE TABLE IF NOT EXISTS grocery_checked (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
)
```

- [ ] **Step 4: Verify schema builds**

Run: `npx vitest run src/__tests__/schema.test --reporter=verbose 2>&1 | tail -20`

If no schema test exists, verify via build: `npx vite build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add src/services/schema.ts
git commit -m "feat(schema): add app_settings table, target_calories column, grocery_checked table

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 2: Create `appSettings` service

**Files:**
- Create: `src/services/appSettings.ts`

- [ ] **Step 1: Create the service file**

```typescript
import type { DatabaseService } from './databaseService';

export async function getSetting(db: DatabaseService, key: string): Promise<string | null> {
  const row = await db.queryOne<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setSetting(db: DatabaseService, key: string, value: string): Promise<void> {
  await db.execute(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
    [key, value],
  );
}

export async function deleteSetting(db: DatabaseService, key: string): Promise<void> {
  await db.execute('DELETE FROM app_settings WHERE key = ?', [key]);
}

export async function getAllSettings(db: DatabaseService): Promise<Record<string, string>> {
  const rows = await db.query<{ key: string; value: string }>('SELECT key, value FROM app_settings');
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}
```

- [ ] **Step 2: Verify build**

Run: `npx vite build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/services/appSettings.ts
git commit -m "feat(services): add appSettings key-value service for SQLite

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 3: Add `exportBinary()` / `importBinary()` to DatabaseService

**Files:**
- Modify: `src/services/databaseService.ts`

- [ ] **Step 1: Add methods to interface**

Add to `DatabaseService` interface:

```typescript
exportBinary(): Uint8Array;
importBinary(data: Uint8Array): Promise<void>;
```

- [ ] **Step 2: Implement in WebDatabaseService**

`exportBinary()`:
```typescript
exportBinary(): Uint8Array {
  if (!this.db) throw new Error('Database not initialized');
  return this.db.export();
}
```

`importBinary()`:
```typescript
async importBinary(data: Uint8Array): Promise<void> {
  if (!this.SQL) throw new Error('SQL.js not loaded');
  this.db?.close();
  this.db = new this.SQL.Database(data);
}
```

- [ ] **Step 3: Remove old `exportToJSON()` / `importFromJSON()` methods**

Delete both methods from the interface and implementation since they are replaced by the binary equivalents. Update any callers (if any remain) to use the new methods.

- [ ] **Step 4: Verify build**

Run: `npx vite build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/services/databaseService.ts
git commit -m "feat(db): add exportBinary/importBinary, remove old JSON methods

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Phase 2: Delete `useUserProfileStore` — Fix Weight Bug

### Task 4: Add `targetCalories` to healthProfileStore and HealthProfile type

**Files:**
- Modify: `src/features/health-profile/types.ts`
- Modify: `src/features/health-profile/store/healthProfileStore.ts`

- [ ] **Step 1: Add `targetCalories` to HealthProfile type**

In `src/features/health-profile/types.ts`, add to `HealthProfile`:

```typescript
targetCalories: number;
```

Update `DEFAULT_HEALTH_PROFILE` to include:

```typescript
targetCalories: 1500,
```

- [ ] **Step 2: Update healthProfileStore `saveProfile` to include targetCalories**

In `healthProfileStore.ts`, update the INSERT query to include `target_calories` column and value `saved.targetCalories`.

- [ ] **Step 3: Update healthProfileStore `loadProfile` to read targetCalories**

In the `loadProfile` method, map `target_calories` from DB row → `targetCalories` field.

- [ ] **Step 4: Verify build**

Run: `npx vite build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add src/features/health-profile/types.ts src/features/health-profile/store/healthProfileStore.ts
git commit -m "feat(health-profile): add targetCalories to HealthProfile and SQLite

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 5: Replace all `useUserProfileStore` consumers with `healthProfileStore`

**Files:**
- Modify: `src/App.tsx` — main consumer (import, hydrate, read, write, pass as props)
- Modify: `src/features/health-profile/hooks/useNutritionTargets.ts` — reads userProfile
- Modify: `src/features/fitness/components/FitnessTab.tsx` — reads userProfile.weight
- Modify: `src/components/modals/GoalSettingsModal.tsx` — receives UserProfile props
- Modify: `src/hooks/useAutoSync.ts` — receives userProfile in options
- Modify: `src/types.ts` — UserProfile type (keep for backward compat or delete)
- Delete: `src/store/userProfileStore.ts`
- Delete: `src/__tests__/userProfileStore.test.ts`

- [ ] **Step 1: Update App.tsx**

1. Remove `import { useUserProfileStore }` line
2. Remove `useUserProfileStore.getState().hydrate()` from hydration block
3. Replace `const { userProfile, setUserProfile } = useUserProfileStore()` with reading from `useHealthProfileStore`:
   ```typescript
   const healthProfile = useHealthProfileStore((s) => s.profile);
   // Compute derived values:
   const userWeight = healthProfile.weightKg;
   const userProteinRatio = healthProfile.proteinRatio;
   const userTargetCalories = healthProfile.targetCalories;
   ```
4. Update `targetProtein` computation: `Math.round(userWeight * userProteinRatio)`
5. Update all prop passes: `userProfile.weight` → `userWeight`, `userProfile.targetCalories` → `userTargetCalories`
6. Update `handleImportData`: remove `setUserProfile` call and `mp-user-profile` handling
7. Update `useAutoSync` call: remove `userProfile` from options
8. Update GoalSettingsModal props: pass healthProfile-derived values

- [ ] **Step 2: Update useNutritionTargets.ts**

Replace `useUserProfileStore` import with `useHealthProfileStore`. Read `targetCalories` from healthProfile instead of userProfile.

- [ ] **Step 3: Update FitnessTab.tsx**

Replace `useUserProfileStore` import with `useHealthProfileStore`. Read `profile.weightKg` instead of `userProfile.weight`.

- [ ] **Step 4: Update GoalSettingsModal.tsx**

Update `GoalSettingsModalProps` interface: replace `UserProfile` with `HealthProfile`-compatible type (or use individual props: `weight`, `proteinRatio`, `targetCalories`). Update field reads accordingly.

- [ ] **Step 5: Delete userProfileStore files**

```bash
rm src/store/userProfileStore.ts
rm src/__tests__/userProfileStore.test.ts
```

- [ ] **Step 6: Verify build and lint**

```bash
npx vite build 2>&1 | tail -10
npx eslint src/App.tsx src/features/health-profile/hooks/useNutritionTargets.ts src/features/fitness/components/FitnessTab.tsx --no-error-on-unmatched-pattern 2>&1 | tail -20
```

- [ ] **Step 7: Run tests**

```bash
npx vitest run src/__tests__/settingsTab.test.tsx src/__tests__/FitnessTab.test.tsx src/__tests__/useNutritionTargets.test.ts --reporter=verbose 2>&1 | tail -30
```

Fix any failing tests by updating mocks (replace `useUserProfileStore` mock with `useHealthProfileStore` mock).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: delete useUserProfileStore, merge into healthProfileStore

Fixes weight data inconsistency between Settings and Nutrition tabs.
Single source of truth: healthProfileStore (SQLite) for weight,
proteinRatio, and targetCalories.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Phase 3: Migrate Core Stores to SQLite

### Task 6: Migrate `ingredientStore` to SQLite

**Files:**
- Modify: `src/store/ingredientStore.ts`
- Modify: `src/__tests__/ingredientStore.test.ts`

- [ ] **Step 1: Rewrite ingredientStore**

Remove: `STORAGE_KEY`, `loadIngredients()`, `hydrate()`, `subscribe()` block.

Add: `loadAll(db)`, make mutations take `db` param. New pattern:

```typescript
import { create } from 'zustand';
import type { Ingredient } from '../types';
import type { DatabaseService } from '../services/databaseService';

interface IngredientState {
  ingredients: Ingredient[];
  loading: boolean;
  setIngredients: (ingredients: Ingredient[]) => void;
  addIngredient: (ing: Ingredient) => void;
  updateIngredient: (ing: Ingredient) => void;
  loadAll: (db: DatabaseService) => Promise<void>;
  saveAll: (db: DatabaseService, ingredients: Ingredient[]) => Promise<void>;
  addToDB: (db: DatabaseService, ing: Ingredient) => Promise<void>;
  updateInDB: (db: DatabaseService, ing: Ingredient) => Promise<void>;
}
```

Key methods:
- `loadAll(db)`: `SELECT * FROM ingredients` → map to `Ingredient[]` → set state
- `addToDB(db, ing)`: `INSERT INTO ingredients` → then `addIngredient(ing)`
- `updateInDB(db, ing)`: `UPDATE ingredients SET ... WHERE id = ?` → then `updateIngredient(ing)`
- `saveAll(db, ingredients)`: Transaction: delete all + insert all (for bulk import)

**Column mapping:**
- `name_vi` / `name_en` ↔ `name.vi` / `name.en`
- `calories_per_100` ↔ `caloriesPer100`
- `protein_per_100` ↔ `proteinPer100`
- `carbs_per_100` ↔ `carbsPer100`
- `fat_per_100` ↔ `fatPer100`
- `fiber_per_100` ↔ `fiberPer100`
- `unit_vi` / `unit_en` ↔ `unit.vi` / `unit.en`

- [ ] **Step 2: Update tests**

Update `src/__tests__/ingredientStore.test.ts` — mock DatabaseService, test loadAll/addToDB/updateInDB.

- [ ] **Step 3: Verify build and tests**

```bash
npx vite build 2>&1 | tail -5
npx vitest run src/__tests__/ingredientStore.test.ts --reporter=verbose 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add src/store/ingredientStore.ts src/__tests__/ingredientStore.test.ts
git commit -m "refactor(store): migrate ingredientStore from localStorage to SQLite

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 7: Migrate `dishStore` to SQLite

**Files:**
- Modify: `src/store/dishStore.ts`
- Modify: `src/__tests__/dishStore.test.ts`

- [ ] **Step 1: Rewrite dishStore**

Same pattern as ingredientStore. Extra complexity: `dish_ingredients` junction table.

Key methods:
- `loadAll(db)`: JOIN query dishes + dish_ingredients → map to `Dish[]`
- `addToDB(db, dish)`: Transaction: INSERT dish + INSERT dish_ingredients rows
- `updateInDB(db, dish)`: Transaction: UPDATE dish + DELETE old ingredients + INSERT new
- `deleteFromDB(db, id)`: DELETE dish (CASCADE deletes dish_ingredients)

**Load query:**
```sql
SELECT d.id, d.name_vi, d.name_en, d.tags, d.rating, d.notes
FROM dishes d
```
Then for each dish: `SELECT ingredient_id, amount FROM dish_ingredients WHERE dish_id = ?`

Or batch: load all `dish_ingredients` and group by `dish_id` in JS.

- [ ] **Step 2: Update tests**

- [ ] **Step 3: Verify build and tests**

- [ ] **Step 4: Commit**

```bash
git add src/store/dishStore.ts src/__tests__/dishStore.test.ts
git commit -m "refactor(store): migrate dishStore from localStorage to SQLite

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 8: Migrate `dayPlanStore` to SQLite

**Files:**
- Modify: `src/store/dayPlanStore.ts`
- Modify: `src/__tests__/dayPlanStore.test.ts`

- [ ] **Step 1: Rewrite dayPlanStore**

Key methods:
- `loadAll(db)`: `SELECT * FROM day_plans` → parse JSON columns → `DayPlan[]`
- `savePlan(db, plan)`: `INSERT OR REPLACE INTO day_plans` with JSON.stringify for arrays
- `updatePlan(db, date, type, dishIds)`: Update specific meal column
- `updateServings(db, date, dishId, count)`: Update servings JSON

**Column mapping:**
- `breakfast_dish_ids` ↔ `breakfastDishIds` (JSON string ↔ string[])
- `lunch_dish_ids` ↔ `lunchDishIds`
- `dinner_dish_ids` ↔ `dinnerDishIds`
- `servings` ↔ `servings` (JSON string ↔ Record<string, number>)

- [ ] **Step 2: Update tests**

- [ ] **Step 3: Verify build and tests**

- [ ] **Step 4: Commit**

```bash
git add src/store/dayPlanStore.ts src/__tests__/dayPlanStore.test.ts
git commit -m "refactor(store): migrate dayPlanStore from localStorage to SQLite

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 9: Migrate `mealTemplateStore` to SQLite

**Files:**
- Modify: `src/store/mealTemplateStore.ts`
- Delete: `src/hooks/useMealTemplate.ts` (uses usePersistedState with same key)
- Modify: `src/__tests__/mealTemplateStore.test.ts`

- [ ] **Step 1: Rewrite mealTemplateStore**

Key methods:
- `loadAll(db)`: `SELECT * FROM meal_templates` → parse `data` JSON column
- `saveTemplate(db, name, plan, tags)`: INSERT with JSON.stringify(template)
- `deleteTemplate(db, id)`: DELETE
- `renameTemplate(db, id, newName)`: UPDATE name

- [ ] **Step 2: Delete useMealTemplate.ts**

```bash
rm src/hooks/useMealTemplate.ts
```

Check if any component imports it and update to use `useMealTemplateStore` directly.

- [ ] **Step 3: Update tests**

- [ ] **Step 4: Verify build and tests**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(store): migrate mealTemplateStore from localStorage to SQLite

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 10: Remove `persist()` middleware from `fitnessStore`

**Files:**
- Modify: `src/store/fitnessStore.ts`
- Modify: `src/__tests__/fitnessStore.test.ts`

- [ ] **Step 1: Remove persist wrapper**

1. Remove `import { persist } from 'zustand/middleware'`
2. Change store creation from `create<FitnessState>()(persist((set, get) => ({...}), { name: 'fitness-storage' }))` to `create<FitnessState>()((set, get) => ({...}))`
3. Remove localStorage fallback logic (around line 384)

- [ ] **Step 2: Update tests**

Remove any mocks for `fitness-storage` localStorage key.

- [ ] **Step 3: Verify build and tests**

```bash
npx vite build 2>&1 | tail -5
npx vitest run src/__tests__/fitnessStore.test.ts --reporter=verbose 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add src/store/fitnessStore.ts src/__tests__/fitnessStore.test.ts
git commit -m "refactor(store): remove persist() middleware from fitnessStore, SQLite-only

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Phase 4: Migrate Config/Metadata to SQLite

### Task 11: Migrate `useDarkMode` to SQLite

**Files:**
- Modify: `src/hooks/useDarkMode.ts`

- [ ] **Step 1: Replace localStorage with appSettings**

1. Import `getSetting`, `setSetting` from `../services/appSettings`
2. Accept `db: DatabaseService | null` parameter (will be null during initial render before DB ready)
3. On mount: if db available, `getSetting(db, 'theme')` → set theme
4. On change: `setSetting(db, 'theme', newTheme)` instead of `localStorage.setItem`
5. Keep `document.documentElement.classList` toggling as-is
6. Fallback: if DB not ready, use `'system'` as default (no flash since system preference applies)

- [ ] **Step 2: Update useDarkMode callers**

In `App.tsx`: pass `db` from DatabaseContext to `useDarkMode`. Since `useDarkMode` is called in App.tsx which may be outside DatabaseProvider, consider making theme loading part of DatabaseContext init.

- [ ] **Step 3: Verify build**

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useDarkMode.ts src/App.tsx
git commit -m "refactor: migrate useDarkMode from localStorage to SQLite app_settings

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 12: Migrate `AuthContext` to SQLite

**Files:**
- Modify: `src/contexts/AuthContext.tsx`

- [ ] **Step 1: Replace localStorage with appSettings**

1. Import `getSetting`, `setSetting`, `deleteSetting`
2. Accept `db` from DatabaseContext (AuthProvider must be inside DatabaseProvider)
3. `persistAuth()`: `setSetting(db, 'auth_state', JSON.stringify(auth))` or `deleteSetting(db, 'auth_state')` if null
4. `restoreAuth()`: `getSetting(db, 'auth_state')` → parse JSON → set state
5. Remove `AUTH_STORAGE_KEY` constant and all `localStorage.*` calls

- [ ] **Step 2: Ensure AuthProvider is inside DatabaseProvider in component tree**

Check `src/main.tsx` or wherever providers are nested. DatabaseProvider must wrap AuthProvider.

- [ ] **Step 3: Verify build**

- [ ] **Step 4: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "refactor: migrate AuthContext from localStorage to SQLite app_settings

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 13: Migrate remaining config keys to SQLite

**Files:**
- Modify: `src/components/DateSelector.tsx` — `mp-date-hint-dismissed`
- Modify: `src/features/dashboard/hooks/useInsightEngine.ts` — `mp-insight-dismissed`
- Modify: `src/components/GroceryList.tsx` — `mp-grocery-checked` via usePersistedState

- [ ] **Step 1: DateSelector — replace localStorage hint flag**

Replace `localStorage.getItem(HINT_DISMISSED_KEY)` with `getSetting(db, 'date_hint_dismissed')`.
Replace `localStorage.setItem(HINT_DISMISSED_KEY, '1')` with `setSetting(db, 'date_hint_dismissed', '1')`.
Component must receive `db` from context via `useDatabase()`.

- [ ] **Step 2: useInsightEngine — replace localStorage dismissed IDs**

Replace `loadDismissedIds()` with `getSetting(db, 'insight_dismissed')` → parse JSON.
Replace `persistDismissedIds()` with `setSetting(db, 'insight_dismissed', JSON.stringify(ids))`.

- [ ] **Step 3: GroceryList — replace usePersistedState**

Replace `usePersistedState('mp-grocery-checked', [])` with direct SQLite read/write using the `grocery_checked` table (created in Task 1 schema). Use `useDatabase()` hook to get db instance.

- [ ] **Step 4: Verify build**

- [ ] **Step 5: Commit**

```bash
git add src/components/DateSelector.tsx src/features/dashboard/hooks/useInsightEngine.ts src/components/GroceryList.tsx
git commit -m "refactor: migrate DateSelector, InsightEngine, GroceryList from localStorage to SQLite

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Phase 5: Refactor Google Drive Sync + App Startup

### Task 14: Refactor Google Drive sync to binary SQLite export/import

**Files:**
- Modify: `src/components/GoogleDriveSync.tsx`
- Modify: `src/components/DataBackup.tsx`
- Modify: `src/hooks/useAutoSync.ts`

- [ ] **Step 1: Rewrite GoogleDriveSync export**

Replace `buildExportData()` (reads localStorage) with:
```typescript
const exportData = db.exportBinary(); // Uint8Array
await driveService.uploadBackup(accessToken, exportData);
```

Update `driveService.uploadBackup()` to accept `Uint8Array` and upload as binary with content type `application/x-sqlite3`. Change backup filename to `meal-planner-backup.sqlite`.

- [ ] **Step 2: Rewrite GoogleDriveSync import**

Replace JSON download with binary download:
```typescript
const binary = await driveService.downloadLatestBackup(accessToken); // Uint8Array
await db.importBinary(binary);
// Reload all stores from new DB
await reloadAllStores(db);
```

Create a `reloadAllStores(db)` utility (in `src/contexts/DatabaseContext.tsx` or a shared helper) that calls each store's `loadAll(db)` / `loadProfile(db)` / `initializeFromSQLite(db)`. This is the same sequence used in Task 15's DatabaseContext init — extract it as a reusable function.

- [ ] **Step 3: Rewrite DataBackup export/import**

Export: `db.exportBinary()` → Blob → download as `.sqlite` file (or share via Capacitor).
Import: File → ArrayBuffer → `Uint8Array` → `db.importBinary(data)` → reload stores.

- [ ] **Step 4: Rewrite useAutoSync**

1. Remove `buildExportData()` function (no longer reads localStorage)
2. Remove `EXPORT_KEYS` constant
3. Change `triggerUpload()` to call `db.exportBinary()` → upload
4. Change `syncOnLaunch()` to download binary → `db.importBinary()` → reload
5. Read/write `last_sync_at` from SQLite via `getSetting/setSetting`
6. Change options interface: remove individual store arrays, just take `db: DatabaseService`

- [ ] **Step 5: Verify build**

- [ ] **Step 6: Commit**

```bash
git add src/components/GoogleDriveSync.tsx src/components/DataBackup.tsx src/hooks/useAutoSync.ts
git commit -m "refactor: migrate Google Drive sync and backup to binary SQLite export/import

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 15: Refactor App.tsx startup — DB-first loading

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/contexts/DatabaseContext.tsx`

- [ ] **Step 1: Move store loading into DatabaseContext**

After `createSchema(service)` succeeds, load all stores from SQLite:

```typescript
// In DatabaseContext useEffect, after createSchema:
await ingredientStore.loadAll(service);
await dishStore.loadAll(service);
await dayPlanStore.loadAll(service);
await mealTemplateStore.loadAll(service);
await healthProfileStore.loadProfile(service);
await fitnessStore.initializeFromSQLite(service);
```

- [ ] **Step 2: Remove all hydrate() calls from App.tsx**

Delete the `useState(() => { ... hydrate() ... })` block entirely. Stores are now loaded by DatabaseContext before App renders.

- [ ] **Step 3: Ensure App renders loading state until DB ready**

DatabaseContext already shows `<div>Loading...</div>` until db is set. All store data will be loaded before children render.

- [ ] **Step 4: Verify build and manual test**

```bash
npx vite build 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/contexts/DatabaseContext.tsx
git commit -m "refactor: move store hydration from localStorage to SQLite via DatabaseContext

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Phase 6: Cleanup

### Task 16: Delete all remaining localStorage references and unused files

**Files:**
- Delete: `src/hooks/usePersistedState.ts`
- Delete: `src/__tests__/usePersistedState.test.ts`
- Delete: `src/__tests__/mealTemplate.test.tsx` (if it only tests useMealTemplate hook)
- Delete: `src/services/migrationService.ts`
- Modify: any file still referencing `localStorage`

- [ ] **Step 1: Delete unused files**

```bash
rm src/hooks/usePersistedState.ts
rm src/__tests__/usePersistedState.test.ts
rm src/hooks/useMealTemplate.ts
```

Check if `migrationService.ts` is imported anywhere. If only by tests or unused code, delete it too.

- [ ] **Step 2: Grep for remaining localStorage references**

```bash
grep -rn 'localStorage' src/ --include='*.ts' --include='*.tsx' | grep -v node_modules | grep -v '__tests__'
```

Fix any remaining references found. Every single one must be eliminated.

- [ ] **Step 3: Grep for remaining `STORAGE_KEY` references**

```bash
grep -rn 'STORAGE_KEY' src/ --include='*.ts' --include='*.tsx' | grep -v node_modules | grep -v '__tests__'
```

Should return 0 results.

- [ ] **Step 4: Remove `UserProfile` type from types.ts if no longer used**

Check: `grep -rn 'UserProfile' src/ --include='*.ts' --include='*.tsx'`

If only used in deleted files, remove the type definition.

- [ ] **Step 5: Full build verification**

```bash
npx vite build 2>&1 | tail -10
```

- [ ] **Step 6: Full lint verification**

```bash
npx eslint src/ --ext .ts,.tsx 2>&1 | tail -20
```

- [ ] **Step 7: Full test run**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -40
```

Document any pre-existing failures vs new failures. Fix only new failures.

- [ ] **Step 8: Final localStorage verification**

```bash
grep -rn 'localStorage' src/ --include='*.ts' --include='*.tsx' | grep -v node_modules
```

Must return **0 results** (excluding test mocks if necessary).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: remove all localStorage references, delete unused files

Zero localStorage usage remaining. All data persisted in SQLite.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task Dependency Graph

```
Phase 1 (Foundation):
  Task 1 (schema) ─┐
  Task 2 (appSettings) ─┤── All must complete before Phase 2+
  Task 3 (exportBinary) ─┘

Phase 2 (Delete userProfileStore):
  Task 4 (add targetCalories) → Task 5 (replace consumers)

Phase 3 (Core stores — parallelizable after Phase 1):
  Task 6 (ingredientStore) ─┐
  Task 7 (dishStore) ────────┤── Can run in PARALLEL
  Task 8 (dayPlanStore) ─────┤   (no cross-dependencies)
  Task 9 (mealTemplateStore)─┤
  Task 10 (fitnessStore) ────┘

Phase 4 (Config — parallelizable after Phase 1):
  Task 11 (darkMode) ────┐
  Task 12 (AuthContext) ──┤── Can run in PARALLEL
  Task 13 (remaining) ────┘

Phase 5 (Sync + Startup — after Phase 2, 3, 4):
  Task 14 (Google Drive) → Task 15 (App startup)

Phase 6 (Cleanup — after everything):
  Task 16 (final cleanup + verification)
```

**Parallelization opportunities:**
- Phase 3 tasks 6-10: ALL parallel (different stores, different files)
- Phase 4 tasks 11-13: ALL parallel (different hooks/components)
- Phase 2 can run parallel with Phase 3 & 4 (different files)
- Phase 5 must wait for 2+3+4 completion
- Phase 6 is strictly last
