# GitHub Copilot Instructions — MealPlaning Project

## Commands

```bash
npm run dev              # Dev server at localhost:3000
npm run build            # Production build (Vite)
npm run lint             # TypeScript type-check + ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Prettier format src/
npm run test             # Run all tests (Vitest)
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report (target: 100%)

# Run a single test file
npx vitest run src/__tests__/dishStore.test.ts
# Run tests matching a pattern
npx vitest run -t "should update meal type"

# Android (Capacitor)
npm run android:sync     # Build + sync to Android project
npm run android:run      # Build + sync + run on device/emulator

# SonarQube (requires Docker)
docker compose up -d     # Start SonarQube at localhost:9000
npm run sonar            # Run analysis

# Bundle analysis
npm run analyze          # Generates stats.html treemap
```

## Architecture

**Offline-first mobile meal planning app** — React 19 + Vite 6, deployed to Android via Capacitor 8. Vietnamese-language UI, backed by in-browser SQLite (sql.js WASM).

### Navigation Model

The app uses a **stack-based navigation** managed by `useNavigationStore` (Zustand):

- **5 main tabs**: `calendar`, `library`, `ai-analysis`, `fitness`, `dashboard`
- **Full-screen pages**: Opened via `pushPage()` onto a `pageStack` (max depth 2). Rendered by `PageStackOverlay` in `App.tsx`. Hides bottom nav when active.
- **Sub-tabs**: Rendered inline within tab panels (NOT via pushPage).
- **Bottom sheets**: Mounted as components, never replace a page.

**Rule**: Never render a full-screen page inline or add/remove tabs beyond what the spec defines.

### Data Layer

```
Zustand stores (in-memory) ←→ SQLite (sql.js WASM, persistence)
```

- Each store has a `loadAll(db: DatabaseService)` method to hydrate from SQLite on startup.
- State updates are **optimistic** — update the store immediately, persist to DB separately via `useAutoSync` hook.
- `DatabaseService` interface: `execute()`, `query<T>()`, `queryOne<T>()`, `transaction()`, `exportBinary()`, `importBinary()`.
- Schema version 4 with migrations in `src/services/schema.ts`.
- DB column names are `snake_case`; TypeScript properties are `camelCase`. Conversion helpers: `snakeToCamel()`, `camelToSnake()`, `rowToType<T>()`, `typeToRow<T>()`.

### Localized Data Pattern

Text fields in the database use `_vi`/`_en` suffixes:
```sql
name_vi TEXT NOT NULL, name_en TEXT
```
In TypeScript, these become `{ vi: string, en?: string }` objects. Always include `name.vi` as required.

### Key Stores

| Store | Persistence | Purpose |
|-------|------------|---------|
| `navigationStore` | Memory only | Tab/page stack, scroll positions |
| `dishStore` | SQLite | Recipes with ingredient lists |
| `ingredientStore` | SQLite | Food items + nutrition per 100g |
| `dayPlanStore` | SQLite | Daily meal plans (breakfast/lunch/dinner) |
| `fitnessStore` | Zustand `persist` | Workouts, training plans, weight logs |
| `appOnboardingStore` | Zustand `persist` | First-run state |
| `uiStore` | Memory only | Modal visibility, selected date, sub-tab state |

### Form Validation

Forms use **React Hook Form + Zod** (`@hookform/resolvers`). Schemas live in `src/schemas/`.

Numeric fields use `z.preprocess()` to coerce empty strings to `undefined` before validation:
```typescript
z.preprocess(
  val => (val === '' || val === undefined || val === null ? undefined : Number(val)),
  z.number().min(0)
)
```

### Feature Specs

Design specs live in `docs/superpowers/specs/`. When implementing any feature, **read the corresponding spec first** and implement exactly what it describes. Do not add tabs, sub-tabs, or navigation flows beyond what the spec defines. If the spec is ambiguous or missing, ask the user.

## Conventions

### Styling
- **Tailwind CSS v4** + **shadcn/ui** (style: `base-nova`, icons: `lucide-react`)
- shadcn/ui components in `src/components/ui/` — add new ones via `npx shadcn@latest add <component>`
- Path alias: `@/` → `src/`

### Formatting
- Prettier: single quotes, semicolons, trailing commas, 120 char width, `arrowParens: "avoid"`
- ESLint: `no-explicit-any` is an error. `no-console` is a warning (except in `src/utils/logger.ts`). Unused vars prefixed with `_` are allowed.
- **Never use `eslint-disable`** — fix the underlying issue instead.

### i18n

The app uses i18next with Vietnamese as the only UI language (`src/locales/vi.json`).

**Every `t('key')` call must have a corresponding entry in `vi.json`.** This includes:
- Dynamic keys like `` t(`namespace.${variable}`) `` — all possible values of `variable` must have entries.
- Pluralized keys using `_zero`, `_one`, `_other` suffixes for `t('key', { count })`.

### Testing

- **Framework**: Vitest + React Testing Library + `@testing-library/jest-dom`
- **Setup**: `src/__tests__/setup.ts` initializes i18n with Vietnamese translations
- **Coverage target**: 100% for new code. Coverage config excludes `components/ui/`, `locales/`, `lib/utils.ts`, and test files.
- **Store tests**: Reset state in `beforeEach` via `useXxxStore.setState(...)`.
- **Component tests**: Mock Zustand stores and database services, test user-facing behavior.
- **E2E**: WebdriverIO + Appium for Android device testing (`npm run e2e`).

### Multi-Step Forms (React Hook Form + Zod)

- **Never call `form.trigger()` without arguments** in a multi-step form — it validates the entire schema including unfilled future steps.
- Always use `form.trigger([...STEP_FIELDS['currentStep']])` to validate only the current step's fields.
- `superRefine` cross-field validators don't run with field-level triggers — implement cross-field checks manually via `form.setError()`.
- Validation failures must always show feedback (inline errors or scroll to first error). Never silently `return`.

### Quality Gates

Every code change must pass:
1. `npm run lint` — 0 errors, no `eslint-disable`
2. `npm run test` — 0 new failures, coverage ≥ 100% for new code
3. `npm run build` — clean production build
4. Spec cross-check — verify against `docs/superpowers/specs/`
