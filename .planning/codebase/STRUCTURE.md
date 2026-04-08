# Codebase Structure

**Analysis Date:** 2025-01-27

## Directory Layout

```
MealPlaning/
├── src/                          # Application source code (466 files)
│   ├── main.tsx                  # React entry point — mounts provider tree
│   ├── App.tsx                   # Root component — tab routing, modals, state wiring (741 lines)
│   ├── i18n.ts                   # i18next configuration (Vietnamese only)
│   ├── index.css                 # Global CSS + Tailwind directives
│   ├── types.ts                  # Core domain types (Ingredient, Dish, DayPlan, etc.)
│   ├── sql-js.d.ts               # Type declarations for sql.js WASM module
│   ├── vite-env.d.ts             # Vite environment type declarations
│   ├── components/               # Shared + domain-specific UI components
│   │   ├── ui/                   # shadcn/ui primitives (button, card, dialog, etc.)
│   │   ├── shared/               # Reusable app-level components (EmptyState, ModalBackdrop, etc.)
│   │   ├── form/                 # Form components (FormField, ChipSelect, RadioPills)
│   │   ├── navigation/           # Tab navigation (BottomNavBar, DesktopNav)
│   │   ├── modals/               # Full-screen & overlay modals
│   │   ├── schedule/             # Meal schedule views (MealSlot, MacroChart, MealsSubTab)
│   │   ├── nutrition/            # Nutrition display widgets (EnergyBalanceCard, MacroDonutChart)
│   │   ├── settings/             # Settings page components
│   │   ├── onboarding/           # Multi-step onboarding flow
│   │   ├── CalendarTab.tsx       # Main calendar/meal planning tab
│   │   ├── ManagementTab.tsx     # Library tab (ingredients + dishes management)
│   │   ├── AIImageAnalyzer.tsx   # AI food image analysis tab content
│   │   ├── SettingsTab.tsx       # Settings page content
│   │   ├── ErrorBoundary.tsx     # Error boundary component
│   │   └── ...                   # Other top-level components
│   ├── features/                 # Feature modules (self-contained domains)
│   │   ├── dashboard/            # Analytics & daily score dashboard
│   │   │   ├── components/       # DashboardTab, CombinedHero, NutritionSection, etc.
│   │   │   ├── hooks/            # useDailyScore, useFeedbackLoop, useInsightEngine, etc.
│   │   │   ├── utils/            # scoreCalculator
│   │   │   ├── constants.ts      # Dashboard-specific constants
│   │   │   └── types.ts          # ScoreResult, Insight, QuickAction, etc.
│   │   ├── fitness/              # Workout tracking & training plans
│   │   │   ├── components/       # FitnessTab, WorkoutLogger, TrainingPlanView, etc. (35 files)
│   │   │   ├── hooks/            # useTrainingPlan, useProgressiveOverload, useTimer, etc.
│   │   │   ├── utils/            # exerciseSelector, periodization, volumeCalculator, etc. (17 files)
│   │   │   ├── data/             # exerciseDatabase.ts, builtinTemplates.ts
│   │   │   ├── constants.ts      # Fitness-specific constants
│   │   │   └── types.ts          # Exercise, TrainingPlan, Workout, WorkoutSet, etc.
│   │   └── health-profile/       # User health profile & goal management
│   │       ├── components/       # HealthProfileForm, GoalPhaseSelector
│   │       ├── hooks/            # useNutritionTargets
│   │       ├── store/            # healthProfileStore.ts (Zustand)
│   │       └── types.ts          # HealthProfile, Goal, Gender, ActivityLevel, etc.
│   ├── store/                    # Global Zustand stores
│   │   ├── ingredientStore.ts    # Ingredient CRUD + SQLite sync
│   │   ├── dishStore.ts          # Dish CRUD + SQLite sync
│   │   ├── dayPlanStore.ts       # Day plan CRUD + SQLite sync
│   │   ├── mealTemplateStore.ts  # Meal template CRUD + SQLite sync
│   │   ├── fitnessStore.ts       # Fitness domain store (1428 lines)
│   │   ├── navigationStore.ts    # Tab navigation + page stack state
│   │   ├── uiStore.ts            # UI ephemeral state (selected date, sub-tabs)
│   │   ├── appOnboardingStore.ts # Onboarding completion flag (persisted via zustand/persist)
│   │   ├── helpers/
│   │   │   └── dbWriteQueue.ts   # Async SQLite write queue with retry
│   │   └── selectors/
│   │       └── fitnessSelectors.ts  # Derived fitness state selectors
│   ├── services/                 # Business logic & external integrations
│   │   ├── databaseService.ts    # DatabaseService interface + Web/Native implementations
│   │   ├── schema.ts             # SQLite schema definition (22 tables) + migrations
│   │   ├── storeLoader.ts        # Parallel store hydration from SQLite
│   │   ├── migrationService.ts   # localStorage → SQLite migration
│   │   ├── planService.ts        # Meal plan pure functions (create, update, clear, apply)
│   │   ├── dataService.ts        # Data transformation, legacy format migration, import validation
│   │   ├── nutritionEngine.ts    # BMR, TDEE, macro calculations (pure functions)
│   │   ├── geminiService.ts      # Google Gemini AI integration (dish analysis, meal suggestion)
│   │   ├── googleDriveService.ts # Google Drive backup sync
│   │   ├── syncV2Utils.ts        # V2 export/import format utilities
│   │   ├── backNavigationService.ts  # Centralized back button handler stack
│   │   └── appSettings.ts        # Key-value settings storage (SQLite app_settings)
│   ├── hooks/                    # Global reusable hooks
│   │   ├── useAISuggestion.ts    # AI meal plan suggestion orchestration
│   │   ├── useAutoSync.ts        # Google Drive auto-sync on data changes
│   │   ├── useAuth.ts            # Auth context consumer hook
│   │   ├── useDarkMode.ts        # Theme management (light/dark/system/schedule)
│   │   ├── useModalManager.ts    # Modal open/close state management
│   │   ├── useAppBackHandler.ts  # Root back navigation init
│   │   ├── usePageStackBackHandler.ts  # Page stack back nav integration
│   │   ├── useTabHistoryBackHandler.ts # Tab history back nav integration
│   │   ├── useModalBackHandler.ts     # Modal back nav integration
│   │   ├── usePrefetchAfterIdle.ts    # Lazy chunk prefetching
│   │   ├── useCopyPlan.ts        # Copy meal plan to other dates
│   │   ├── useIngredientSmartFill.ts  # AI ingredient nutrition lookup
│   │   ├── useIsDesktop.ts       # Responsive breakpoint hook
│   │   ├── useItemModalFlow.ts   # Generic add/edit modal state
│   │   ├── useListManager.ts     # Generic list filtering/sorting
│   │   ├── useTodayCaloriesOut.ts # Today's calories burned from workouts
│   │   └── useTodayNutrition.ts  # Today's nutrition intake summary
│   ├── contexts/                 # React Context providers
│   │   ├── DatabaseContext.tsx    # Database initialization + store hydration
│   │   ├── AuthContext.tsx        # Google OAuth authentication
│   │   ├── NotificationContext.tsx # Toast notification system
│   │   └── authContextDef.ts     # Auth context type definitions (separate for circular dep avoidance)
│   ├── schemas/                  # Validation schemas (Zod-like)
│   │   ├── dishEditSchema.ts
│   │   ├── ingredientEditSchema.ts
│   │   ├── healthProfileSchema.ts
│   │   ├── trainingProfileSchema.ts
│   │   ├── goalValidation.ts
│   │   ├── saveAnalyzedDishSchema.ts
│   │   ├── saveTemplateSchema.ts
│   │   ├── workoutLoggerSchema.ts
│   │   ├── cardioLoggerSchema.ts
│   │   ├── customExerciseSchema.ts
│   │   └── __tests__/            # Schema unit tests
│   ├── utils/                    # Pure utility functions
│   │   ├── nutrition.ts          # Food nutrition calculations
│   │   ├── helpers.ts            # UUID generation, date parsing, week range
│   │   ├── localize.ts           # LocalizedString helpers
│   │   ├── logger.ts             # Structured logging utility
│   │   ├── haptics.ts            # Haptic feedback (Capacitor)
│   │   ├── imageCompression.ts   # Image compression for AI analysis
│   │   ├── motion.ts             # Animation utilities
│   │   ├── numericInputHandlers.ts # Numeric input formatting
│   │   └── tips.ts               # Daily tips data
│   ├── data/                     # Static/seed data
│   │   ├── initialData.ts        # Default ingredients & dishes (seed data)
│   │   ├── constants.ts          # App-wide constants (UNDO_TOAST_DURATION_MS, etc.)
│   │   └── units.ts              # Unit conversion data
│   ├── constant/
│   │   └── colors.ts             # Color palette constants
│   ├── locales/
│   │   └── vi.json               # Vietnamese translation strings
│   ├── lib/
│   │   └── utils.ts              # shadcn/ui utility (cn function — clsx + tailwind-merge)
│   ├── styles/                   # Additional style files
│   └── __tests__/                # Test files (centralized)
│       ├── *.test.ts(x)          # Unit & component tests
│       └── integration/          # Integration tests
├── android/                      # Capacitor Android project
├── e2e/                          # End-to-end test files
├── public/                       # Static assets (WASM files, icons)
├── scripts/                      # Build/utility scripts
├── docs/                         # Documentation
├── screenshots/                  # App screenshots
├── dist/                         # Build output (gitignored)
├── coverage/                     # Test coverage output (gitignored)
├── index.html                    # HTML entry point
├── vite.config.ts                # Vite build configuration
├── vitest.config.ts              # Vitest test configuration
├── tsconfig.json                 # TypeScript configuration
├── capacitor.config.ts           # Capacitor native config
├── eslint.config.js              # ESLint flat config
├── components.json               # shadcn/ui component configuration
├── package.json                  # Dependencies & scripts
├── docker-compose.yml            # Docker config (SonarQube)
└── sonar-project.properties      # SonarQube settings
```

## Directory Purposes

**`src/components/`**

- Purpose: All shared and domain-specific UI components that are NOT feature-scoped
- Contains: TSX components organized by category (ui, shared, form, modals, navigation, schedule, nutrition, settings, onboarding)
- Key files: `CalendarTab.tsx` (main view), `ManagementTab.tsx` (library), `AIImageAnalyzer.tsx`, `ErrorBoundary.tsx`

**`src/components/ui/`**

- Purpose: shadcn/ui primitive components — DO NOT edit manually
- Contains: Generated components from shadcn CLI (button, card, dialog, input, etc.)
- Regenerate with: `npx shadcn@latest add <component>`

**`src/components/shared/`**

- Purpose: Reusable app-level components (not shadcn primitives)
- Contains: `EmptyState.tsx`, `ModalBackdrop.tsx`, `FilterBottomSheet.tsx`, `ListToolbar.tsx`, `SubTabBar.tsx`, `UnitSelector.tsx`, `AiBadge.tsx`, `DetailModal.tsx`, `CloseButton.tsx`, `DisabledReason.tsx`, `UnsavedChangesDialog.tsx`

**`src/components/modals/`**

- Purpose: Full-screen and overlay modal components
- Contains: `MealPlannerModal.tsx`, `DishEditModal.tsx`, `IngredientEditModal.tsx`, `ClearPlanModal.tsx`, `CopyPlanModal.tsx`, `AISuggestionPreviewModal.tsx`, `TemplateManager.tsx`, `SaveTemplateModal.tsx`, `SaveAnalyzedDishModal.tsx`, `ConfirmationModal.tsx`, `SyncConflictModal.tsx`, `QuickAddIngredientForm.tsx`, `AISuggestIngredientsPreview.tsx`

**`src/features/`**

- Purpose: Self-contained feature modules with their own components, hooks, utils, types, and optionally stores
- Structure: Each feature has `components/`, `hooks/`, `utils/` (or a subset), plus `types.ts` and `constants.ts`
- Features: `dashboard`, `fitness`, `health-profile`

**`src/store/`**

- Purpose: Global Zustand stores for app-wide state
- Contains: One file per domain entity, plus `helpers/` and `selectors/` subdirectories
- Pattern: Each store file exports a `useXxxStore` hook created with `zustand/create`

**`src/services/`**

- Purpose: Business logic layer — pure functions, data access, external API integrations
- Contains: Database abstraction, schema management, AI integration, cloud sync, data transformation
- Key pattern: Services are imported by stores and hooks, never import from components

**`src/hooks/`**

- Purpose: Global reusable custom React hooks
- Contains: Complex stateful logic extracted from `App.tsx` and shared across the app
- Key hooks: `useAutoSync`, `useAISuggestion`, `useModalManager`, `useDarkMode`

**`src/schemas/`**

- Purpose: Form validation schemas
- Naming: `{entity}Schema.ts` or `{entity}Validation.ts`
- Contains: Zod schemas for form validation in modals and settings pages

**`src/contexts/`**

- Purpose: React Context providers for cross-cutting concerns
- Contains: Database, Auth, and Notification contexts
- Note: `authContextDef.ts` is separated from `AuthContext.tsx` to avoid circular imports

**`src/utils/`**

- Purpose: Pure utility functions with no side effects or state
- Key files: `nutrition.ts` (food calculations), `helpers.ts` (UUID, dates), `localize.ts` (i18n helpers), `logger.ts` (structured logging)

**`src/data/`**

- Purpose: Static seed data and app-wide constants
- Key files: `initialData.ts` (default ingredients/dishes), `constants.ts` (timing constants), `units.ts` (unit definitions)

## Key File Locations

**Entry Points:**

- `index.html`: HTML entry point with Vite script tag
- `src/main.tsx`: React mount + provider tree
- `src/App.tsx`: Root component — all tab routing and state orchestration

**Configuration:**

- `vite.config.ts`: Build config, path aliases (`@/` → `src/`)
- `vitest.config.ts`: Test runner config
- `tsconfig.json`: TypeScript compilation settings
- `capacitor.config.ts`: Capacitor native app settings
- `eslint.config.js`: ESLint flat config
- `components.json`: shadcn/ui component settings (aliases, style, icon library)
- `.prettierrc`: Prettier formatting rules

**Core Domain Logic:**

- `src/types.ts`: All core domain types (Ingredient, Dish, DayPlan, MealType, NutritionInfo, etc.)
- `src/services/nutritionEngine.ts`: BMR/TDEE/macro calculations
- `src/utils/nutrition.ts`: Food-level nutrition calculations
- `src/services/planService.ts`: Meal plan CRUD operations

**Database:**

- `src/services/databaseService.ts`: DatabaseService interface + Web/Native implementations
- `src/services/schema.ts`: Schema DDL + migrations (22 tables, version 6)
- `src/services/migrationService.ts`: localStorage → SQLite migration
- `src/services/storeLoader.ts`: Parallel store hydration
- `src/store/helpers/dbWriteQueue.ts`: Async write queue

**State Management:**

- `src/store/ingredientStore.ts`: Ingredients state
- `src/store/dishStore.ts`: Dishes state
- `src/store/dayPlanStore.ts`: Day plans state
- `src/store/fitnessStore.ts`: Fitness domain state (1428 lines — largest store)
- `src/store/navigationStore.ts`: Tab + page stack navigation
- `src/store/uiStore.ts`: Ephemeral UI state (selected date, sub-tab)
- `src/features/health-profile/store/healthProfileStore.ts`: Health profile + goal state

**External Integrations:**

- `src/services/geminiService.ts`: Google Gemini AI (food image analysis, meal suggestions, ingredient lookup)
- `src/services/googleDriveService.ts`: Google Drive appData backup
- `src/contexts/AuthContext.tsx`: Google OAuth (web GIS + native SocialLogin)
- `src/hooks/useAutoSync.ts`: Auto-sync orchestration

**Testing:**

- `src/__tests__/`: Centralized test files
- `src/__tests__/integration/`: Integration tests
- `src/schemas/__tests__/`: Schema-specific tests

## Naming Conventions

**Files:**

- Components: `PascalCase.tsx` (e.g., `CalendarTab.tsx`, `MealSlot.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useAISuggestion.ts`, `useDarkMode.ts`)
- Stores: `camelCase.ts` suffixed with `Store` (e.g., `dishStore.ts`, `navigationStore.ts`)
- Services: `camelCase.ts` suffixed with `Service` (e.g., `databaseService.ts`, `geminiService.ts`)
- Schemas: `camelCase.ts` suffixed with `Schema` (e.g., `dishEditSchema.ts`)
- Utils: `camelCase.ts` (e.g., `nutrition.ts`, `helpers.ts`)
- Types: `camelCase.ts` or `types.ts` within feature dirs
- Tests: `camelCase.test.ts(x)` (e.g., `fitnessStore.test.ts`, `app.test.tsx`)

**Directories:**

- Feature modules: `kebab-case` (e.g., `health-profile`, `ai-analysis`)
- Component categories: `kebab-case` (e.g., `training-steps`)
- Other directories: `camelCase` (e.g., `selectors`, `helpers`)

**Exports:**

- Components: Named exports preferred (e.g., `export function CalendarTab()`)
- Stores: Named exports of hook (e.g., `export const useIngredientStore = create(...)`)
- Services: Named exports of functions (e.g., `export function createDatabaseService()`)
- Barrel files: `index.ts` re-exports in `src/components/navigation/`, `src/components/form/`, `src/components/schedule/`, `src/components/nutrition/`

## Where to Add New Code

**New Feature Module:**

1. Create directory: `src/features/{feature-name}/`
2. Add subdirectories: `components/`, `hooks/`, `utils/` (as needed)
3. Add `types.ts` and `constants.ts` at feature root
4. If feature needs persistent state → create store in `src/features/{feature-name}/store/`
5. If feature needs a global store → create in `src/store/{feature}Store.ts`
6. Lazy-load the tab component in `src/App.tsx`
7. Add tab to `MainTab` type in `src/components/navigation/types.ts`

**New Shared Component:**

- Reusable UI primitive → `src/components/ui/` (use shadcn CLI)
- Reusable app component → `src/components/shared/{ComponentName}.tsx`
- Form component → `src/components/form/{ComponentName}.tsx`

**New Modal:**

- Create: `src/components/modals/{ModalName}.tsx`
- Add open/close state to `src/hooks/useModalManager.ts`
- Lazy-load in `src/App.tsx`
- Wire props/callbacks in the appropriate section of `App.tsx`

**New Page (Full-Screen Overlay):**

- Create component in relevant feature directory (e.g., `src/features/fitness/components/{PageName}.tsx`)
- Register component name in `PageStackOverlay` switch statement in `src/App.tsx`
- Navigate with `pushPage({ id: 'page-id', component: 'PageName', props: {...} })`

**New Hook:**

- Global hook → `src/hooks/use{HookName}.ts`
- Feature-scoped hook → `src/features/{feature}/hooks/use{HookName}.ts`

**New Service:**

- Pure business logic → `src/services/{serviceName}.ts`
- Feature-scoped utility → `src/features/{feature}/utils/{utilName}.ts`

**New Zustand Store:**

- Global store → `src/store/{domain}Store.ts`
- Feature-scoped store → `src/features/{feature}/store/{domain}Store.ts`
- Follow existing pattern: module-level `_db`, `loadAll(db)`, `set()` + `syncToDb()` on mutations
- Register `loadAll()` call in `src/contexts/DatabaseContext.tsx` and `src/services/storeLoader.ts`

**New Database Table:**

- Add `CREATE TABLE IF NOT EXISTS` in `src/services/schema.ts` → `createSchema()`
- Add table name to `SCHEMA_TABLES` set
- If modifying existing tables → add migration in `runSchemaMigrations()` at next version
- Increment `SCHEMA_VERSION`
- Add to `IMPORT_ORDER` in `src/services/syncV2Utils.ts` (FK order matters)

**New Validation Schema:**

- Create: `src/schemas/{entity}Schema.ts`
- Tests: `src/schemas/__tests__/{entity}Schema.test.ts`

**New Test:**

- Unit/component tests → `src/__tests__/{testName}.test.ts(x)`
- Integration tests → `src/__tests__/integration/{testName}.test.ts`

## Special Directories

**`src/components/ui/`**

- Purpose: shadcn/ui generated components
- Generated: Yes — via `npx shadcn@latest add`
- Committed: Yes
- Note: Do not manually edit; regenerate if customization needed

**`dist/`**

- Purpose: Vite production build output
- Generated: Yes — via `npm run build`
- Committed: No (gitignored)

**`coverage/`**

- Purpose: Vitest coverage reports
- Generated: Yes — via `npm run test -- --coverage`
- Committed: No (gitignored)

**`android/`**

- Purpose: Capacitor Android native project
- Generated: Initially via `npx cap add android`, then manually configured
- Committed: Yes

**`public/wasm/`**

- Purpose: sql.js WASM binary for web database
- Generated: No — copied from sql.js package
- Committed: Yes — required for web runtime

**`node_modules/`**

- Purpose: npm dependencies
- Generated: Yes — via `npm install`
- Committed: No (gitignored)

## Path Aliases

Configured in `vite.config.ts` and `tsconfig.json`:

- `@/` → `src/`
- Usage: `import { cn } from '@/lib/utils'`, `import { logger } from '@/utils/logger'`
- shadcn/ui components use `@/components/ui/`, `@/lib/utils`

---

_Structure analysis: 2025-01-27_
