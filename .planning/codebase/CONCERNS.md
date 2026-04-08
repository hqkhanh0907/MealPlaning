# Codebase Concerns

**Analysis Date:** 2025-07-24

## Tech Debt

### TD-01: Monolithic fitnessStore (1,428 lines)

- Issue: `src/store/fitnessStore.ts` is a single 1,428-line Zustand store containing ~40 actions, training plans, workouts, workout sets, weight entries, templates, and drafts. Every action is defined inline in a single `create()` call.
- Files: `src/store/fitnessStore.ts`
- Impact: Hard to navigate, high merge-conflict risk, difficult to test individual slices. Any change to one domain (e.g., weight logging) risks regressions in another (e.g., workout saving).
- Fix approach: Split into domain-specific slices (e.g., `workoutStore.ts`, `weightLogStore.ts`, `trainingPlanStore.ts`) or use Zustand's `slice` pattern. Keep a single facade store that composes slices.

### TD-02: fitnessStore uses Zustand `persist` middleware AND manual SQLite writes (dual persistence)

- Issue: `useFitnessStore` wraps its store in `persist(...)` (line 170), which writes to `localStorage` under key `fitness-storage`. Simultaneously, every mutation also manually writes to SQLite via `persistToDb()` or direct `_db.execute()` calls. This creates two sources of truth.
- Files: `src/store/fitnessStore.ts` (lines 169-170, 1413-1428), `src/store/helpers/dbWriteQueue.ts`
- Impact: On startup, `DatabaseContext.tsx` loads data from SQLite via `initializeFromSQLite()`, overwriting the Zustand-persisted localStorage data. The `persist` middleware is effectively dead weight — it writes to localStorage on every mutation but the data is never read back (SQLite wins). Wasted I/O on every state change.
- Fix approach: Remove the `persist(...)` wrapper from `useFitnessStore`. Other stores (`dishStore`, `ingredientStore`, `dayPlanStore`, `mealTemplateStore`) already use plain `create()` without `persist` — follow their pattern.

### TD-03: Module-level `_db` variable pattern across stores

- Issue: All stores use a module-level `let _db: DatabaseService | null = null` that gets set during `loadAll()` / `initializeFromSQLite()`. This creates an implicit dependency on initialization order and makes the DB reference invisible to the type system.
- Files: `src/store/fitnessStore.ts` (line 37), `src/store/dishStore.ts` (line 10), `src/store/ingredientStore.ts`, `src/store/dayPlanStore.ts`, `src/store/mealTemplateStore.ts`
- Impact: If any action is called before `_db` is set, writes silently fail (guarded by `if (_db)` checks). No error is raised — data appears saved in UI but is lost on next reload.
- Fix approach: Consider passing `db` explicitly to each action, or use a centralized DB accessor via React context that throws if not initialized.

### TD-04: App.tsx is a 741-line God Component

- Issue: `src/App.tsx` subscribes to ~20+ individual store selectors, defines ~15 callback handlers, manages modals, page routing, tab state, and renders the entire app shell. It acts as both a controller and a view.
- Files: `src/App.tsx`
- Impact: Every store change potentially re-renders the entire app tree (mitigated by individual selectors, but still fragile). Adding new features requires touching this file.
- Fix approach: Extract tab content into self-contained route components. Move callback handlers into custom hooks (e.g., `usePlanActions`, `useModalManager`). Some of this is already done (`useModalManager`, `useCopyPlan`).

### TD-05: Hardcoded exercise database (1,962 lines, 133 exercises)

- Issue: `src/features/fitness/data/exerciseDatabase.ts` contains all exercise definitions as a hardcoded TypeScript array. This file is 1,962 lines and ships entirely in the main bundle.
- Files: `src/features/fitness/data/exerciseDatabase.ts`
- Impact: ~40KB+ of static data included in the JavaScript bundle. Cannot be updated without a code deploy. Must be re-imported on every HMR cycle during development.
- Fix approach: Move exercise data to a JSON file loaded at runtime, or seed into SQLite on first launch and query from DB. The schema already has an `exercises` table.

### TD-06: WebDatabaseService is purely in-memory (no persistence)

- Issue: `WebDatabaseService` (the sql.js implementation used for web/dev) creates a fresh `new SQL.Database()` on every `initialize()` call. There is no `IndexedDB` persistence layer — all data is lost on page refresh in web mode.
- Files: `src/services/databaseService.ts` (lines 54-63)
- Impact: Web users lose all data on refresh unless they export/import manually. Development relies on Zustand `persist` middleware for the non-fitness stores (which don't have `persist`!) or `localStorage` migration on startup. This is acceptable for a mobile-first app, but confusing during web development.
- Fix approach: If web usage matters, add sql.js persistence to `IndexedDB` using the built-in `sql.js` export/import or a library like `absurd-sql`. If web is dev-only, document this clearly.

### TD-07: Many `as unknown as` type assertions

- Issue: 20+ instances of `as unknown as` double-casting across the codebase, primarily in form resolver types and database service types.
- Files: `src/features/health-profile/components/HealthProfileForm.tsx` (lines 58, 66-67, 72), `src/features/fitness/components/WorkoutLogger.tsx` (line 115, 171), `src/features/fitness/components/CardioLogger.tsx` (line 42), `src/components/modals/DishEditModal.tsx` (lines 90, 167), `src/services/databaseService.ts` (lines 220, 228), and others
- Impact: Bypasses type safety. If upstream types change (e.g., `react-hook-form` or `@capacitor-community/sqlite`), runtime errors may not be caught at compile time.
- Fix approach: For form resolvers, create a typed wrapper function. For the SQLite connection, define proper interface types matching the plugin API.

## Known Bugs

### BUG-01: localStorage remnant in TrainingPlanView

- Symptoms: `localStorage.getItem('planCoachingDismissed')` and `localStorage.setItem('planCoachingDismissed', 'true')` used directly instead of the `app_settings` SQLite table.
- Files: `src/features/fitness/components/TrainingPlanView.tsx` (lines 174, 296)
- Trigger: User dismisses coaching overlay; this preference is not synced via Google Drive backup/restore.
- Workaround: None — the setting works locally but is not included in backup/restore flows.

### BUG-02: Silent data loss on early store actions

- Symptoms: If a store action (e.g., `addDish`, `addWeightEntry`) is invoked before `loadAll()` sets `_db`, the SQLite write is silently skipped. The UI shows the item, but it's lost on next app restart.
- Files: All stores using the `if (_db)` guard pattern — `src/store/fitnessStore.ts`, `src/store/dishStore.ts`, `src/store/ingredientStore.ts`, `src/store/dayPlanStore.ts`
- Trigger: Race condition if user interacts with UI before `DatabaseContext` finishes initialization. Currently mitigated by showing a loading screen, but not guaranteed.
- Workaround: The `DatabaseContext` loading gate prevents UI rendering before DB is ready, but edge cases exist (e.g., background tabs, fast interactions).

## Security Considerations

### SEC-01: Google OAuth Client ID hardcoded in source

- Risk: The Google OAuth web client ID (`871833618020-...`) is hardcoded in `src/contexts/AuthContext.tsx` (line 14). While OAuth client IDs are technically public, hardcoding makes rotation difficult.
- Files: `src/contexts/AuthContext.tsx` (line 14)
- Current mitigation: OAuth client IDs are not secrets per Google's documentation. The ID is restricted to specific origins in Google Console.
- Recommendations: Move to environment variable (`VITE_GOOGLE_CLIENT_ID`) for easier rotation and environment-specific values.

### SEC-02: Gemini API key exposed in client bundle

- Risk: `VITE_GEMINI_API_KEY` is read from `import.meta.env` and bundled into the client JavaScript. Any user can extract this key from the built app.
- Files: `src/services/geminiService.ts` (line 19)
- Current mitigation: The key likely has usage quotas. Production builds drop `console.*` calls, but the key is still in the bundle.
- Recommendations: For a personal project, this is acceptable. For public distribution, proxy AI requests through a backend server or use Capacitor native plugins for API key storage.

### SEC-03: No input sanitization on SQL interpolation in importFromJSON

- Risk: `importFromJSON()` in both `WebDatabaseService` and `NativeDatabaseService` constructs SQL column names from user-provided JSON keys using string interpolation: `const columnList = columns.map(c => '"${c}"').join(', ')`. While wrapped in double-quotes, a crafted column name containing `"` could break out.
- Files: `src/services/databaseService.ts` (lines 190-195, 324-330)
- Current mitigation: Import data comes from the app's own export or Google Drive backup, not arbitrary user input. The risk is low in practice.
- Recommendations: Validate column names against `SCHEMA_TABLES` column definitions before interpolation, or use parameterized column lists.

### SEC-04: No token refresh mechanism for Google Drive

- Risk: The OAuth access token is stored and reused with no expiration check or refresh logic. Google OAuth access tokens expire after 1 hour.
- Files: `src/contexts/AuthContext.tsx`, `src/services/googleDriveService.ts`
- Current mitigation: On native, `SocialLogin.login()` is called on app resume which may return a fresh token. On web, the token client is re-initialized per sign-in.
- Recommendations: Implement token refresh using refresh tokens (native) or silent re-authentication (web GIS). Currently, Drive sync silently fails after token expiry with a generic `Drive list failed: 401` error.

## Performance Bottlenecks

### PERF-01: fitnessStore initializeFromSQLite performs sequential queries

- Problem: `initializeFromSQLite()` issues 6 sequential `db.query()` calls (workouts, workout_sets, weight_log, training_plans, training_plan_days, plan_templates) with individual `set()` calls for each.
- Files: `src/store/fitnessStore.ts` (lines 998-1145)
- Cause: Each query waits for the previous one. Each `set()` triggers a Zustand state update and potential React re-render.
- Improvement path: Use `Promise.all()` for independent queries (workouts + weight_log + training_plans can run in parallel). Batch all results into a single `set()` call.

### PERF-02: DishStore loadAll issues N+1 queries

- Problem: `loadAll()` in `dishStore` first fetches all dishes, then issues one `dish_ingredients` query per dish in a `Promise.all()` loop.
- Files: `src/store/dishStore.ts` (lines 138-155)
- Cause: No single query joins dishes with their ingredients.
- Improvement path: Use a single `SELECT dish_ingredients.* FROM dish_ingredients` query and group results in JavaScript, or use a JOIN.

### PERF-03: exerciseDatabase bundled as static import

- Problem: `EXERCISES` array (133 exercises, ~1,962 lines) is statically imported by `fitnessStore.ts` and included in the main bundle.
- Files: `src/features/fitness/data/exerciseDatabase.ts`, `src/store/fitnessStore.ts` (line 7)
- Cause: Direct `import { EXERCISES } from '../features/fitness/data/exerciseDatabase'` at module scope.
- Improvement path: Lazy-import or move to SQLite `exercises` table (already exists in schema). The `exerciseDatabase.ts` is also imported by `useTrainingPlan.ts` and exercise selector utilities.

### PERF-04: dbWriteQueue processes one operation at a time

- Problem: The `dbWriteQueue` processes writes sequentially, one SQL statement per iteration. High-frequency actions (e.g., rapid set updates in WorkoutLogger) queue many individual writes.
- Files: `src/store/helpers/dbWriteQueue.ts`
- Cause: Simple FIFO queue with no batching or transaction grouping.
- Improvement path: Group queued writes into SQLite transactions (batch every N operations or every M milliseconds). This would reduce the per-write overhead of auto-transaction wrapping.

## Fragile Areas

### FRAG-01: Schema migration chain (v1 → v6)

- Files: `src/services/schema.ts` (lines 381-544)
- Why fragile: 6 sequential migration steps that ALTER TABLE, CREATE TABLE, INSERT SELECT, DROP TABLE, and RENAME TABLE. Each migration depends on the exact schema state left by the previous one. Migration v2 recreates `training_plan_days` entirely, and migration v6 recreates `workout_sets`.
- Safe modification: Only add new migrations at the end (v7+). Never modify existing migration steps. Test with databases at every version (v1 through v6).
- Test coverage: `src/__tests__/migrationService.test.ts` (844 lines) and `src/__tests__/integration/migration.test.ts` (844 lines) cover migration flows, but testing every version-to-version path is complex.

### FRAG-02: Dual DB implementation (WebDatabaseService vs NativeDatabaseService)

- Files: `src/services/databaseService.ts`
- Why fragile: Two completely separate implementations of the same `DatabaseService` interface. The `WebDatabaseService` uses synchronous sql.js calls wrapped in async, while `NativeDatabaseService` uses the Capacitor SQLite plugin. Behavior differences (e.g., transaction semantics, error types, data type coercion) may cause bugs that only appear on one platform.
- Safe modification: Add integration tests that run the same test suite against both implementations. Currently, unit tests mock the DB interface.
- Test coverage: No tests exercise `NativeDatabaseService` directly — it requires a native platform.

### FRAG-03: Manual object mapping in initializeFromSQLite

- Files: `src/store/fitnessStore.ts` (lines 998-1145)
- Why fragile: Each SQLite row is manually cast field-by-field (e.g., `id: w.id as string`, `date: w.date as string`). If a schema migration adds or renames a column, this mapping must be updated in sync. There's no shared type/mapper — each load function has its own inline mapping.
- Safe modification: Create a shared mapper function per entity type (e.g., `mapWorkoutRow(row)`) that can be unit tested independently.
- Test coverage: `src/__tests__/fitnessStore.test.ts` (5,305 lines) tests store behavior, but doesn't validate the raw SQL → type mapping against actual schema.

### FRAG-04: JSON-in-SQL columns

- Files: `src/services/schema.ts` (columns: `breakfast_dish_ids`, `lunch_dish_ids`, `dinner_dish_ids`, `muscle_groups`, `exercises`, `original_exercises`, `training_days`, `rest_days`, `equipment`, `contraindicated`, `secondary_muscles`, `day_configs`)
- Why fragile: Many columns store JSON arrays as TEXT. These are parsed with `JSON.parse()` at read time and `JSON.stringify()` at write time, scattered across stores and hooks. Corrupt JSON in any of these columns causes silent failures or crashes.
- Safe modification: Always use `safeParseJsonArray()` or `safeJsonParse()` when reading. Some call sites use raw `JSON.parse()` — see `src/features/fitness/hooks/useTrainingPlan.ts` (lines 279, 344, 384, 480).
- Test coverage: `safeParseJsonArray` is well-tested, but raw `JSON.parse()` call sites are not protected.

### FRAG-05: Custom page stack navigation (no router)

- Files: `src/store/navigationStore.ts`, `src/App.tsx` (lines 100-150)
- Why fragile: The app implements its own navigation system using a `pageStack` array with max depth 2 and a `renderPage()` switch statement in `App.tsx`. Adding a new navigable page requires updating both the switch statement and any caller. There's no URL-based routing — deep links are impossible.
- Safe modification: When adding a new page, update the switch/case in `App.tsx` `renderPage()` AND ensure the `component` string matches exactly.
- Test coverage: Navigation behavior is tested through integration tests, but the switch statement itself is not validated for completeness.

## Scaling Limits

### SCALE-01: In-memory Zustand stores for all data

- Current capacity: All ingredients, dishes, day plans, workouts, workout sets, and weight entries are loaded into memory at startup via `initializeFromSQLite` and `loadAll`.
- Limit: For a personal meal planning app, this is fine (hundreds of items). If data grows to thousands of workouts with thousands of sets, memory usage and startup time will increase linearly.
- Scaling path: Implement pagination/cursor-based loading for historical data (e.g., only load last 90 days of workouts). Keep current-week data in memory, fetch older data on demand.

### SCALE-02: Google Drive single-file backup

- Current capacity: Entire database exported as a single JSON file to Google Drive (`meal-planner-backup.json`).
- Limit: As data grows, the backup file size increases. Upload/download becomes slow on poor connections. No incremental sync.
- Scaling path: Implement incremental sync (track `updated_at` timestamps) or use a real sync service. The `syncV2Utils.ts` (373 lines) already has import/export infrastructure that could support delta sync.

## Dependencies at Risk

### DEP-01: @capacitor-community/sqlite

- Risk: Community-maintained plugin (not official Capacitor team). Plugin version must stay in sync with Capacitor core version. Breaking changes between major versions require migration effort.
- Impact: Core data persistence on native platforms depends entirely on this plugin. A breaking change or abandonment would require rewriting `NativeDatabaseService`.
- Migration plan: The `DatabaseService` interface abstracts the implementation, making replacement possible. Alternative: `@nicepkg/nicepkg-sqlite` or raw `expo-sqlite` if migrating to Expo.

### DEP-02: @capgo/capacitor-social-login

- Risk: Third-party Capacitor plugin for Google OAuth. Less established than `@capacitor-community` plugins.
- Impact: Google Sign-In on native platforms. If plugin breaks, users cannot authenticate or sync to Google Drive.
- Migration plan: Alternative: `@codetrix-studio/capacitor-google-auth` or implementing native OAuth manually.

### DEP-03: sql.js (WASM SQLite for web)

- Risk: sql.js loads a ~1MB WASM binary at runtime. The `locateFile` config points to `/wasm/` directory which must be properly served.
- Impact: Web/development database functionality. Missing WASM file = app won't initialize.
- Migration plan: Low risk — sql.js is mature and stable. Ensure WASM file is included in build output.

## Missing Critical Features

### MISS-01: No offline-to-online sync conflict resolution

- Problem: Google Drive backup is a full overwrite (last-write-wins). If user has data on two devices, the last backup overwrites the other device's changes entirely.
- Blocks: Multi-device usage. Users must be careful about which device they backup/restore from.

### MISS-02: No data migration rollback

- Problem: Schema migrations in `src/services/schema.ts` are forward-only. If a migration fails partway through (e.g., power loss during v5→v6), the database may be in an inconsistent state with `user_version` not yet updated.
- Blocks: Safe upgrades in production. A failed migration could brick the app for a user until they clear data.

### MISS-03: No error reporting / crash analytics

- Problem: The `logger` utility (`src/utils/logger.ts`) writes to `console.*` only. In production builds, `console.log` and `console.debug` are dropped by esbuild. `console.error` and `console.warn` remain but are only visible if the user opens dev tools.
- Blocks: Diagnosing production issues. No way to know if users are experiencing crashes, DB corruption, or migration failures.

## Test Coverage Gaps

### GAP-01: NativeDatabaseService is untested

- What's not tested: The entire `NativeDatabaseService` class in `src/services/databaseService.ts` (lines 208-349). This includes native transaction handling, connection lifecycle, and the `as unknown as SQLiteDBConnection` casting.
- Files: `src/services/databaseService.ts`
- Risk: Bugs that only manifest on Android/iOS (e.g., connection pooling issues, transaction nesting, type coercion differences). The `inTransaction` flag management could have edge cases.
- Priority: Medium — the app is primarily used on mobile, so this is the production code path.

### GAP-02: No E2E test runner integration

- What's not tested: The 29 E2E spec files in `e2e/specs/` exist but require a running Android emulator with Appium/WebDriverIO. There's no CI pipeline configured to run these.
- Files: `e2e/specs/*.spec.ts`, `e2e/wdio.conf.ts`
- Risk: E2E tests may be stale or broken without regular execution. Manual testing is the only validation for native platform behavior.
- Priority: Medium — E2E tests are written but not automated.

### GAP-03: Google Drive sync flow untested

- What's not tested: `src/services/googleDriveService.ts` and `src/components/GoogleDriveSync.tsx` have no unit tests. The full backup→upload→download→restore flow is only tested manually.
- Files: `src/services/googleDriveService.ts` (97 lines), `src/components/GoogleDriveSync.tsx` (274 lines)
- Risk: Token expiry, network errors, partial uploads, or Drive API changes could silently break sync.
- Priority: High — data loss risk if backup/restore breaks silently.

### GAP-04: Unsafe JSON.parse calls in useTrainingPlan

- What's not tested: `src/features/fitness/hooks/useTrainingPlan.ts` uses raw `JSON.parse()` in several places (lines 279, 344, 384, 480) without try/catch. If `exercises` column contains invalid JSON, the hook will throw.
- Files: `src/features/fitness/hooks/useTrainingPlan.ts`
- Risk: App crash if any training plan day has corrupted exercise data. The hook is used by the main FitnessTab.
- Priority: High — use `safeParseJsonArray()` consistently.

---

_Concerns audit: 2025-07-24_
