# Architecture

**Analysis Date:** 2025-01-27

## Pattern Overview

**Overall:** Single-Page Application (SPA) with tab-based navigation, Zustand stores as the single source of truth, and SQLite as the offline-first persistence layer. No router library — navigation is managed entirely via Zustand state (`navigationStore`) and a custom page stack.

**Key Characteristics:**

- **Offline-first:** All data lives in SQLite (sql.js for web, @capacitor-community/sqlite for native). No server required.
- **Zustand → SQLite sync:** Stores hold in-memory state; every mutation triggers an async SQLite write via a batched write queue.
- **Tab-based SPA without a router:** 5 main tabs rendered via CSS show/hide or conditional rendering; full-screen pages use a page stack overlay system.
- **Lazy loading:** All tabs except CalendarTab are `React.lazy`-loaded; modals and page overlays are lazy too.
- **Cross-platform:** Capacitor 8 wraps the web app for Android deployment.
- **Vietnamese-first i18n:** UI text uses `react-i18next` with Vietnamese as the only bundled locale (`src/locales/vi.json`). Data models support `LocalizedString` with `vi` (required) and `en` (optional).

## Layers

**Presentation Layer (Components):**

- Purpose: Renders UI and handles user interaction
- Location: `src/components/`, `src/features/*/components/`
- Contains: React functional components, JSX, Tailwind CSS classes
- Depends on: Zustand stores (read state), hooks (business logic), utils, types
- Used by: `src/App.tsx` (root orchestrator)

**State Layer (Zustand Stores):**

- Purpose: Single source of truth for all application state
- Location: `src/store/`, `src/features/health-profile/store/`
- Contains: Zustand stores with `create()`, each owning a domain's state + actions
- Depends on: `src/services/databaseService.ts` (SQLite persistence), `src/store/helpers/dbWriteQueue.ts`
- Used by: Components (via hooks), hooks, `src/App.tsx`

**Service Layer:**

- Purpose: Business logic, data access, external API calls
- Location: `src/services/`
- Contains: Pure functions (`planService.ts`, `dataService.ts`, `nutritionEngine.ts`), database abstraction (`databaseService.ts`), external integrations (`geminiService.ts`, `googleDriveService.ts`)
- Depends on: Types, Capacitor plugins
- Used by: Stores, hooks, components

**Context Layer (React Contexts):**

- Purpose: Cross-cutting concerns requiring React tree access
- Location: `src/contexts/`
- Contains: 3 providers: `DatabaseProvider`, `AuthProvider`, `NotificationProvider`
- Depends on: Services, stores
- Used by: Entire component tree (wraps `<App />` in `src/main.tsx`)

**Hooks Layer:**

- Purpose: Encapsulate reusable stateful logic and side effects
- Location: `src/hooks/`, `src/features/*/hooks/`
- Contains: Custom React hooks
- Depends on: Stores, services, contexts
- Used by: Components, `src/App.tsx`

**Schema & Validation Layer:**

- Purpose: Form validation schemas
- Location: `src/schemas/`
- Contains: Zod or similar validation schemas for forms (dish edit, ingredient edit, health profile, etc.)
- Depends on: Types
- Used by: Form components

**Utility Layer:**

- Purpose: Pure helper functions with no side effects
- Location: `src/utils/`, `src/features/*/utils/`
- Contains: `nutrition.ts`, `helpers.ts`, `localize.ts`, `logger.ts`, `motion.ts`, etc.
- Depends on: Types
- Used by: All other layers

## Provider Tree (Initialization Order)

The provider nesting in `src/main.tsx` defines the initialization order:

```
<StrictMode>
  <NotificationProvider>          ← Toast/notification system
    <DatabaseProvider>            ← SQLite init → schema migration → store hydration
      <AuthProvider>              ← Google auth (persisted in SQLite app_settings)
        <App />                   ← Main application
      </AuthProvider>
    </DatabaseProvider>
  </NotificationProvider>
</StrictMode>
```

`DatabaseProvider` (`src/contexts/DatabaseContext.tsx`) is the critical bootstrapper:

1. Creates a `DatabaseService` (web or native factory)
2. Initializes the database connection
3. Runs schema migrations (`src/services/schema.ts` → `runSchemaMigrations`)
4. Creates schema tables (`createSchema`)
5. Migrates legacy localStorage data (`src/services/migrationService.ts`)
6. Loads all Zustand stores from SQLite in parallel (`loadAll()` on each store)
7. Only then renders children

## Data Flow

**User Creates a Dish:**

1. User fills form in `DishEditModal` (`src/components/modals/DishEditModal.tsx`)
2. Form validates via schema (`src/schemas/dishEditSchema.ts`)
3. Parent calls `addDish(dish)` on `useDishStore` (`src/store/dishStore.ts`)
4. Store calls `set()` → Zustand notifies all subscribers → UI re-renders
5. Store calls `persistDish(_db, dish, 'addDish')` → async SQLite INSERT via write queue
6. If user is authenticated, `useAutoSync` (`src/hooks/useAutoSync.ts`) detects store change → debounced upload to Google Drive

**AI Meal Plan Suggestion:**

1. User clicks "Suggest" in CalendarTab
2. `useAISuggestion` hook (`src/hooks/useAISuggestion.ts`) calls `suggestMealPlan()` from `src/services/geminiService.ts`
3. Gemini API returns structured JSON with dish IDs for breakfast/lunch/dinner
4. Hook opens `AISuggestionPreviewModal` with the suggestion
5. User clicks Apply → `applySuggestionToDayPlans()` from `src/services/planService.ts`
6. `useDayPlanStore.setDayPlans()` updates state + persists to SQLite

**Data Sync Flow (Google Drive):**

1. `useAutoSync` (`src/hooks/useAutoSync.ts`) watches `ingredients`, `dishes`, `dayPlans`, `templates` arrays
2. On change → 3-second debounce → `db.exportToJSON()` → `driveService.uploadBackup()`
3. On app launch (if authenticated) → downloads latest backup → compares timestamps → imports if remote is newer
4. Import: `db.importFromJSON()` drops all tables, recreates schema, inserts rows → `reloadAllStores()` (`src/services/storeLoader.ts`)

**State Management Pattern:**

Each Zustand store follows this pattern:

```typescript
// Module-level DB reference (set during loadAll)
let _db: DatabaseService | null = null;

// Store with SQLite sync
export const useXxxStore = create<XxxState>((set, get) => ({
  items: [],
  setItems: updater => {
    const next = typeof updater === 'function' ? updater(get().items) : updater;
    set({ items: next });
    if (_db) syncAllToDb(_db, next); // Full reconcile for batch ops
  },
  addItem: item => {
    set(state => ({ items: [...state.items, item] }));
    if (_db) persistToDb(_db, SQL, params, 'addItem'); // Single-row upsert
  },
  loadAll: async db => {
    _db = db; // Capture DB reference for future writes
    const rows = await db.query<RowType>('SELECT * FROM xxx');
    set({ items: rows.map(rowToDomain) });
  },
}));
```

**Write Queue (`src/store/helpers/dbWriteQueue.ts`):**

- Sequential async queue for individual row operations (`persistToDb`)
- Retries transient errors (SQLITE_BUSY) up to 2 times with 50ms delay
- Full reconcile functions (`syncAllToDb`) use transactions directly on the `DatabaseService`

## Navigation Model

**No Router Library** — all navigation is state-driven via Zustand.

**Tab Navigation (`src/store/navigationStore.ts`):**

- 5 tabs: `calendar`, `library`, `ai-analysis`, `fitness`, `dashboard`
- `activeTab` controls which tab content renders
- Tab history tracked for Android back button support
- CalendarTab and ManagementTab use CSS `hidden`/`block` for instant switching (preserves DOM state)
- FitnessTab, AIImageAnalyzer, DashboardTab use conditional rendering (`{activeMainTab === 'x' && ...}`)

**Page Stack (`navigationStore.pageStack`):**

- Max depth: 2
- Used for full-screen overlays: Settings, WorkoutLogger, CardioLogger, PlanDayEditor, etc.
- `pushPage({ id, component, props })` → renders `PageStackOverlay` in `App.tsx`
- `popPage()` → removes top page from stack

**Modal Management (`src/hooks/useModalManager.ts`):**

- Local state hook (not in Zustand) managing 5 modal open/close states
- Mutual exclusion: opening one closes all others via `closeAll()`

**Back Navigation (`src/services/backNavigationService.ts`):**

- Custom handler stack pushed to `history.pushState`
- Integrates with Capacitor `App.backButton` for Android hardware back
- Three hooks cooperate: `useAppBackHandler`, `usePageStackBackHandler`, `useTabHistoryBackHandler`

## Key Abstractions

**DatabaseService Interface (`src/services/databaseService.ts`):**

- Purpose: Platform-agnostic database abstraction
- Implementations: `WebDatabaseService` (sql.js WASM), `NativeDatabaseService` (@capacitor-community/sqlite)
- Factory: `createDatabaseService()` — auto-selects based on `Capacitor.isNativePlatform()`
- Methods: `initialize()`, `execute()`, `query()`, `queryOne()`, `transaction()`, `exportToJSON()`, `importFromJSON()`, `close()`
- Snake-to-camel conversion built in: `rowToType<T>()` converts DB rows automatically

**LocalizedString (`src/types.ts`):**

- Purpose: Bilingual text support (Vietnamese required, English optional)
- Pattern: `Record<'vi', string> & Partial<Record<'en', string>>`
- Used in: `Ingredient.name`, `Ingredient.unit`, `Dish.name`
- Helper: `getLocalizedField()` in `src/utils/localize.ts`

**NutritionInfo (`src/types.ts`):**

- Purpose: Standard nutrition data envelope (`calories`, `protein`, `carbs`, `fat`, `fiber`)
- Calculated by: `src/utils/nutrition.ts` (food-level) and `src/services/nutritionEngine.ts` (user targets: BMR, TDEE, macros)
- Used throughout the app for display, comparison, and AI prompts

**MealType (`src/types.ts`):**

- Union: `'breakfast' | 'lunch' | 'dinner'`
- Maps to DayPlan slot keys: `breakfastDishIds`, `lunchDishIds`, `dinnerDishIds`
- Converter: `getDayPlanSlotKey()` in `src/services/planService.ts`

## Entry Points

**Web Entry (`index.html` → `src/main.tsx`):**

- Location: `src/main.tsx`
- Triggers: Browser load / Capacitor WebView load
- Responsibilities: i18n init, CSS import, native status bar config, React tree mount with providers

**App Component (`src/App.tsx`):**

- Location: `src/App.tsx` (741 lines)
- Purpose: Root component — owns all top-level state wiring, tab rendering, modal rendering, page stack rendering
- Contains: Tab show/hide logic, handler callbacks for all major actions, modal orchestration
- Renders: Header, main tab content, bottom nav, modals, page stack overlays, settings overlay

**Database Bootstrap (`src/contexts/DatabaseContext.tsx`):**

- Location: `src/contexts/DatabaseContext.tsx`
- Triggers: First mount of `DatabaseProvider`
- Responsibilities: DB init → schema migration → legacy data migration → store hydration → render children

## Schema & Migrations

**Schema Definition (`src/services/schema.ts`):**

- Current version: `SCHEMA_VERSION = 6`
- 22 tables defined in `SCHEMA_TABLES` set
- `createSchema()` — creates all tables with `CREATE TABLE IF NOT EXISTS`
- `runSchemaMigrations()` — sequential migration from version N to SCHEMA_VERSION
- Core tables: `ingredients`, `dishes`, `dish_ingredients`, `day_plans`, `meal_templates`, `user_profile`, `goals`
- Fitness tables: `training_plans`, `training_plan_days`, `exercises`, `workouts`, `workout_sets`, `weight_log`, `daily_log`
- System tables: `app_settings`, `grocery_checked`, `plan_templates`, `workout_drafts`

**Migration History:**

- v1→v2: Fitness plan flexibility (multi-session days, plan editing)
- v2→v3: User profile name and date of birth
- v3→v4: Plan editor (schedule editor, split changer, templates)
- v4→v5: Training plan current_week column
- v5→v6: Nullable workout_sets.exercise_id with ON DELETE SET NULL

## Error Handling

**Strategy:** Defensive fail-safe with logging — prefer degraded functionality over crashes.

**Patterns:**

- `ErrorBoundary` component (`src/components/ErrorBoundary.tsx`) wraps each tab content
- JSON parse failures use `safeJsonParse()` with fallback values and warnings (in stores)
- Database write failures are caught and logged via `logger.error()`, never thrown to UI
- AI service calls use timeout (30s) + retry with exponential backoff (max 2 retries)
- Data migration filters invalid entries with warnings instead of throwing (`src/services/dataService.ts`)

## Cross-Cutting Concerns

**Logging:** Structured logger (`src/utils/logger.ts`) with `{ component, action, traceId? }` context. Uses `console.*` methods. Debug logs only in dev mode (`import.meta.env.DEV`). Ready for future swap to Sentry/remote service.

**Validation:** Zod-based schemas in `src/schemas/` for form validation. Type guards in `src/services/dataService.ts` for runtime data validation during import/migration.

**Authentication:** Google OAuth via `@capgo/capacitor-social-login` (native) or Google Identity Services GIS (web). Auth state persisted in SQLite `app_settings` table. Context: `src/contexts/AuthContext.tsx`.

**i18n:** `react-i18next` with Vietnamese-only locale file (`src/locales/vi.json`). Initialized in `src/i18n.ts`. All UI strings use `t('key')`.

**Theming:** Dark mode via `src/hooks/useDarkMode.ts`. Supports 4 modes: light, dark, system, schedule (auto-toggle at 6pm/6am). Theme persisted in SQLite `app_settings`.

**Performance:**

- Lazy loading for all non-critical tabs and modals (`React.lazy`)
- `usePrefetchAfterIdle` prefetches ManagementTab after 2s idle
- Individual Zustand selectors to prevent cascade re-renders
- `requestIdleCallback` for preloading

---

_Architecture analysis: 2025-01-27_
