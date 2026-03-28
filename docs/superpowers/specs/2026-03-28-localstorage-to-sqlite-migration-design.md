# localStorage → SQLite Full Migration Design

**Date:** 2026-03-28
**Status:** Draft
**Author:** AI Assistant

---

## 1. Problem Statement

The app currently uses **two separate storage systems** with no synchronization:

- **localStorage** — 5 Zustand stores with manual `subscribe()` + `setItem()` (ingredients, dishes, dayPlans, userProfile, mealTemplates) + 1 Zustand store with `persist()` middleware (fitnessStore, key `fitness-storage`) + 5 config/metadata keys
- **SQLite** (sql.js WASM) — health profile, goals, training profile, fitness data (duplicated with fitnessStore localStorage)

This causes:
1. **Weight data conflict** — `useUserProfileStore` (localStorage, 83kg default) vs `useHealthProfileStore` (SQLite, 70kg default) hold the same field with different values
2. **No single source of truth** — business data split across two systems
3. **Inconsistent persistence patterns** — some stores auto-persist synchronously, others write async to SQLite
4. **Google Drive sync only backs up localStorage** — SQLite data (health profile, goals, workouts) is NOT backed up

## 2. Decision Record

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage target | SQLite only, zero localStorage | Single source of truth |
| Backup format | `.sqlite` binary export | Simplest, full DB consistency |
| Backward compatibility | None — new format only | User accepted fresh start |
| Existing localStorage data | Clear on upgrade, start fresh | User decision |
| Dual store conflict | Delete `useUserProfileStore`, merge into `healthProfileStore` | Eliminates root cause of weight bug |

## 3. Architecture Overview

### Before (Current)
```
App startup
├─ hydrate() 5 stores from localStorage (sync)
├─ DatabaseProvider → init SQLite (async)
└─ Render

Persist: Zustand subscribe → localStorage.setItem (sync, per-mutation)
Backup: Read localStorage keys → JSON → Google Drive
```

### After (Target)
```
App startup
├─ DatabaseProvider → init SQLite + createSchema (async)
├─ Load all stores from SQLite (async)
└─ Render (after DB ready)

Persist: Store mutation → db.execute() (async)
Backup: db.export() → Uint8Array → Google Drive
```

### Key Architectural Changes
1. **App must wait for DB** before rendering data-dependent components
2. **All stores become DB-first** — Zustand holds in-memory cache, SQLite is source of truth
3. **No localStorage references** remain in codebase

## 4. Detailed Design

### 4.1 Delete `useUserProfileStore` — Merge into `healthProfileStore`

**Current `useUserProfileStore` fields:**
```typescript
type UserProfile = { weight: number; proteinRatio: number; targetCalories: number }
```

**Migration mapping:**
| UserProfile field | healthProfileStore field | SQLite column |
|---|---|---|
| `weight` | `weightKg` | `weight_kg` (exists) |
| `proteinRatio` | `proteinRatio` | `protein_ratio` (exists) |
| `targetCalories` | `targetCalories` | `target_calories` (NEW column) |

**Schema change:**
```sql
ALTER TABLE user_profile ADD COLUMN target_calories INTEGER DEFAULT 1500;
```

**Files to update:**
- Delete `src/store/userProfileStore.ts`
- `src/App.tsx` — replace all `useUserProfileStore` refs with `useHealthProfileStore`
- `src/components/schedule/NutritionSubTab.tsx` — read from healthProfileStore
- `src/components/GoalSettingsModal.tsx` — read/write from healthProfileStore
- Any component importing `useUserProfileStore`

### 4.2 Migrate `ingredientStore` → SQLite

**Current pattern:**
```typescript
// hydrate: localStorage → Zustand
// persist: Zustand subscribe → localStorage
```

**New pattern:**
```typescript
interface IngredientStoreState {
  ingredients: Ingredient[];
  loading: boolean;

  // DB operations
  loadAll: (db: DatabaseService) => Promise<void>;
  addIngredient: (db: DatabaseService, ingredient: Ingredient) => Promise<void>;
  updateIngredient: (db: DatabaseService, ingredient: Ingredient) => Promise<void>;
  deleteIngredient: (db: DatabaseService, id: string) => Promise<void>;
  setIngredients: (db: DatabaseService, ingredients: Ingredient[]) => Promise<void>;
}
```

**Key changes:**
- Remove `hydrate()` method
- Remove `subscribe()` auto-persist to localStorage
- Every mutation takes `db: DatabaseService` as first param
- `loadAll()` reads from SQLite on startup
- Write operations: update SQLite first, then update Zustand state
- Table: `ingredients` (already exists in schema)

### 4.3 Migrate `dishStore` → SQLite

Same pattern as ingredientStore. Extra complexity: `dish_ingredients` junction table.

**Load:**
```sql
SELECT d.*, GROUP_CONCAT(di.ingredient_id || ':' || di.amount) as ingredients_raw
FROM dishes d
LEFT JOIN dish_ingredients di ON d.id = di.dish_id
GROUP BY d.id
```

**Save:** Transaction — insert dish + insert/replace dish_ingredients rows.

### 4.4 Migrate `dayPlanStore` → SQLite

**Table:** `day_plans` with JSON columns for dish ID arrays.

**Load:**
```sql
SELECT * FROM day_plans
```
Parse `breakfast_dish_ids`, `lunch_dish_ids`, `dinner_dish_ids`, `servings` from JSON strings.

**Save:** `INSERT OR REPLACE` with `JSON.stringify()` for array columns.

### 4.5 Migrate `mealTemplateStore` → SQLite

**Table:** `meal_templates` with `data` JSON column.

Simplest migration — entire template stored as JSON blob.

### 4.6 Migrate `fitnessStore` — Remove localStorage `persist` middleware

**Current:** `fitnessStore` uses Zustand `persist()` middleware with key `fitness-storage`, which auto-saves entire state to localStorage. It also has SQLite read/write logic (`initializeFromSQLite`, `saveWorkoutAtomic`, etc.) — making it a **dual-write** store.

**Problem:** Same data exists in both localStorage (`fitness-storage`) and SQLite tables (workouts, workout_sets, weight_log, etc.). On startup, it loads from localStorage first (via persist), then overwrites from SQLite if available.

**Solution:**
- Remove `persist()` middleware wrapper — store becomes pure in-memory Zustand
- Keep all existing SQLite read/write methods (`initializeFromSQLite`, `addWorkout`, etc.)
- On startup: load exclusively from SQLite via `initializeFromSQLite(db)`
- Remove localStorage fallback logic (line 384)

**Files to update:**
- `src/store/fitnessStore.ts` — remove `persist()` wrapper, remove localStorage fallback

### 4.7 New `app_settings` Table

```sql
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);
```

**Keys to migrate:**

| localStorage key | SQLite key | Value type |
|---|---|---|
| `mp-theme` | `theme` | `'light' \| 'dark' \| 'system' \| 'schedule'` |
| `mp-auth-state` | `auth_state` | JSON string |
| `mp-last-sync-at` | `last_sync_at` | ISO timestamp |
| `mp-last-local-backup-at` | `last_local_backup_at` | ISO timestamp |
| `mp-date-hint-dismissed` | `date_hint_dismissed` | `'1'` |
| `mp-insight-dismissed` | `insight_dismissed` | JSON array of IDs |
| `mp-migrated-to-sqlite` | _(delete — no longer needed)_ | Migration flag |
| `fitness_migrated_to_sqlite` | _(delete — no longer needed)_ | Migration flag |

**Access pattern:** Generic `getSetting(db, key)` / `setSetting(db, key, value)` functions.

**Special consideration for `auth_state`:**
- Contains Google OAuth tokens
- Must be available before DB-dependent auth flows
- DatabaseProvider must init before AuthContext reads tokens

### 4.8 Hooks Refactor

#### `useDarkMode`
- Currently reads/writes `mp-theme` from localStorage
- Change to: read from `app_settings` table via `getSetting(db, 'theme')`
- Need DB access → either pass db as param or use `useDatabase()` hook

#### `usePersistedState`
- Generic hook wrapping localStorage
- Replace with `usePersistedSQLite(db, key)` or delete if no callers remain

#### `useAutoSync`
- Currently reads `mp-last-sync-at` from localStorage
- Change to: `getSetting(db, 'last_sync_at')`

### 4.9 Google Drive Sync — SQLite Binary

**Note:** `DatabaseService` already has `exportToJSON()` / `importFromJSON()` methods. These will be **replaced** by binary equivalents. The old JSON methods will be removed since we no longer need JSON export/import.

**Export (backup):**
```typescript
async function exportDatabase(db: DatabaseService): Promise<Uint8Array> {
  return db.export(); // sql.js returns Uint8Array
}
```

**Upload to Drive:**
```typescript
// Change from JSON text upload to binary upload
await driveService.uploadBackup(accessToken, binaryData, 'application/x-sqlite3');
```

**Import (restore):**
```typescript
async function importDatabase(db: DatabaseService, data: Uint8Array): Promise<void> {
  await db.importBinary(data); // Replace current DB
  // Reload all Zustand stores from new DB
  await reloadAllStores(db);
}
```

**New `DatabaseService` methods needed:**
```typescript
export(): Uint8Array;           // Export DB as binary
importBinary(data: Uint8Array): void;  // Replace DB with binary data
```

**Drive service changes:**
- `uploadBackup()` — accept `Uint8Array` instead of JSON object
- `downloadLatestBackup()` — return `Uint8Array` instead of parsed JSON
- File name on Drive: `meal-planner-backup.sqlite` (new name to avoid confusion with old JSON backups)

### 4.10 Startup Sequence (New)

```
1. DatabaseProvider mounts
2. → DatabaseService.initialize() (load sql.js WASM)
3. → createSchema(db) (ensure all tables exist, including app_settings)
4. → Load app_settings (theme, auth_state)
5. → Apply theme immediately (prevent flash)
6. → Load all stores from SQLite:
     ingredientStore.loadAll(db)
     dishStore.loadAll(db)
     dayPlanStore.loadAll(db)
     healthProfileStore.loadProfile(db)
     mealTemplateStore.loadAll(db)
     fitnessStore.initializeFromSQLite(db)
7. → Set loading = false
8. → Render app
```

**Loading state:** Show splash/loading screen until step 7 completes.

## 5. Files Changed Summary

### Delete:
- `src/store/userProfileStore.ts`

### New:
- `src/services/appSettings.ts` — `getSetting()` / `setSetting()` for `app_settings` table

### Major Refactor:
- `src/store/ingredientStore.ts` — localStorage → SQLite
- `src/store/dishStore.ts` — localStorage → SQLite
- `src/store/dayPlanStore.ts` — localStorage → SQLite
- `src/store/mealTemplateStore.ts` — localStorage → SQLite
- `src/store/fitnessStore.ts` — remove `persist()` middleware, SQLite-only
- `src/App.tsx` — remove useUserProfileStore, change hydration to DB-first
- `src/contexts/DatabaseContext.tsx` — add store loading orchestration
- `src/components/GoogleDriveSync.tsx` — binary export/import
- `src/components/DataBackup.tsx` — binary export/import
- `src/hooks/useAutoSync.ts` — read sync timestamp from SQLite
- `src/hooks/useDarkMode.ts` — read theme from SQLite
- `src/services/databaseService.ts` — add `export()` / `importBinary()` methods
- `src/services/schema.ts` — add `app_settings` table, `target_calories` column

### Minor Updates:
- `src/components/GoalSettingsModal.tsx` — use healthProfileStore
- `src/components/schedule/NutritionSubTab.tsx` — use healthProfileStore
- `src/hooks/usePersistedState.ts` — refactor or delete
- `src/services/migrationService.ts` — simplify or delete (no longer needed)
- All test files referencing localStorage stores

## 6. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| DB init slower than localStorage hydrate | User sees empty state briefly | Show loading spinner until DB ready |
| sql.js WASM fails to load | App unusable | Fallback error screen with retry |
| Binary backup corruption | Data loss | Validate DB integrity after import |
| Large DB export size | Slow sync | Compress with gzip before upload |
| Breaking all existing tests | CI fails | Batch-update test mocks |

## 7. Implementation Phases

### Phase 1: Foundation (prerequisite for all)
- Add `app_settings` table to schema
- Add `target_calories` column to `user_profile`
- Add `export()` / `importBinary()` to DatabaseService
- Create `src/services/appSettings.ts`

### Phase 2: Delete `useUserProfileStore` (fixes weight bug)
- Merge into healthProfileStore
- Update all consumers (App.tsx, NutritionSubTab, GoalSettingsModal, etc.)
- Delete `src/store/userProfileStore.ts`

### Phase 3: Migrate core stores to SQLite
- `ingredientStore` → SQLite (parallel-safe)
- `dishStore` → SQLite (parallel-safe, depends on ingredientStore pattern)
- `dayPlanStore` → SQLite (parallel-safe)
- `mealTemplateStore` → SQLite (parallel-safe)
- `fitnessStore` → remove `persist()` middleware, keep SQLite-only (parallel-safe)

### Phase 4: Migrate config/metadata
- `useDarkMode` → app_settings
- `useAutoSync` → app_settings
- `AuthContext` → app_settings
- `DateSelector` hint → app_settings
- `useInsightEngine` dismissed → app_settings
- Delete `usePersistedState` hook if unused

### Phase 5: Refactor Google Drive Sync
- Export: `db.export()` → binary upload
- Import: binary download → `db.importBinary()` → reload stores
- Update `GoogleDriveSync.tsx` and `DataBackup.tsx`
- Update `useAutoSync.ts`

### Phase 6: Cleanup
- Remove all `localStorage` references from src/
- Delete `src/services/migrationService.ts` (or keep for reference)
- Delete `src/hooks/usePersistedState.ts` if no callers remain
- Update all tests
- Verify zero localStorage usage with grep
