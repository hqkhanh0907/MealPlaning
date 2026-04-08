# Coding Conventions

**Analysis Date:** 2025-07-14

## Naming Patterns

**Files:**

- Components: PascalCase `.tsx` — `EmptyState.tsx`, `CalendarTab.tsx`, `DashboardTab.tsx`
- Hooks: camelCase with `use` prefix `.ts` — `useModalManager.ts`, `useAISuggestion.ts`, `useDarkMode.ts`
- Stores: camelCase with `Store` suffix `.ts` — `dishStore.ts`, `fitnessStore.ts`, `navigationStore.ts`
- Services: camelCase with `Service` suffix `.ts` — `databaseService.ts`, `geminiService.ts`, `planService.ts`
- Schemas: camelCase with `Schema` suffix `.ts` — `dishEditSchema.ts`, `ingredientEditSchema.ts`
- Utils: camelCase `.ts` — `helpers.ts`, `logger.ts`, `nutrition.ts`
- UI components (shadcn): kebab-case `.tsx` — `button.tsx`, `alert-dialog.tsx`, `radio-group.tsx`
- Types: `types.ts` at root or feature-local `types.ts`
- Barrel files: `index.ts` for re-exports — `src/components/navigation/index.ts`

**Functions:**

- Use camelCase: `generateUUID`, `parseLocalDate`, `calculateDishesNutrition`
- React components: PascalCase — `EmptyState`, `ConfirmationModal`, `FormField`
- Event handlers: `handle` prefix for component-local, `on` prefix for prop callbacks — `handleRetry`, `onConfirm`
- Store actions: verb-first camelCase — `addDish`, `updateDish`, `setDishes`, `navigateTab`
- Test-only exports: double-underscore prefix — `__resetDishDbForTesting()`, `_resetAISingleton()`, `_waitForIdle()`
- Private internal helpers: underscore prefix — `_clearNutritionCache`, `_resetQueue`

**Variables:**

- Constants: UPPER_SNAKE_CASE — `MAX_RETRIES`, `RETRY_DELAY_MS`, `PROTEIN_RATIO_MIN`, `STAGGER_DELAY_TIER2`
- Style objects: UPPER_SNAKE_CASE — `VARIANT_STYLES`, `TOAST_STYLES`
- State: camelCase — `isMealPlannerOpen`, `lowerTiersVisible`
- Booleans: `is`/`has`/`should` prefix — `isOpen`, `hasError`, `shouldThrow`, `isOnboarded`
- Mock variables: `mock` prefix — `mockNotify`, `mockGenerateContent`, `mockService`

**Types:**

- Interfaces and type aliases: PascalCase — `Dish`, `Ingredient`, `DayPlan`, `NavigationState`
- Use `type` keyword (not `interface`) for data shapes: `type Dish = { ... }`
- Use `interface` for component props: `interface FormFieldProps { ... }`
- Enum-like types: string union — `type MealType = 'breakfast' | 'lunch' | 'dinner'`
- Localized strings: `LocalizedString` type — `Record<'vi', string> & Partial<Record<'en', string>>`
- Inferred types from Zod: `type DishEditFormData = z.infer<typeof dishEditSchema>`

## Code Style

**Formatting (Prettier):**

- Config: `.prettierrc`
- Semicolons: always (`"semi": true`)
- Quotes: single (`"singleQuote": true`)
- Trailing commas: all (`"trailingComma": "all"`)
- Print width: 120 (`"printWidth": 120`)
- Tab width: 2 (`"tabWidth": 2`)
- Arrow parens: avoid (`"arrowParens": "avoid"`)
- Plugin: `prettier-plugin-tailwindcss` for Tailwind class sorting

**Linting (ESLint):**

- Config: `eslint.config.js` (flat config format with `defineConfig`)
- Base: `@eslint/js` recommended + `typescript-eslint` recommended
- Plugins:
  - `eslint-plugin-react-hooks` — recommended rules
  - `eslint-plugin-react-refresh` — `only-export-components` warn (off for `src/components/ui/**` and `src/contexts/**`)
  - `eslint-plugin-simple-import-sort` — import/export sorting as warnings
  - `eslint-config-prettier` — disables formatting rules that conflict with Prettier
- Key rules:
  - `@typescript-eslint/no-explicit-any`: **error** — never use `any`
  - `@typescript-eslint/no-unused-vars`: warn (ignore `_` prefixed args/vars)
  - `no-console`: warn (allow `console.warn` and `console.error` only)
  - `simple-import-sort/imports`: warn
  - `simple-import-sort/exports`: warn
- Special overrides:
  - `src/utils/logger.ts` — `no-console` disabled (logger wraps console methods)

**TypeScript:**

- Config: `tsconfig.json`
- `strict: true` — all strict checks enabled
- `noUnusedLocals: true`, `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- Target: ES2022
- Module: ESNext with bundler resolution
- Path alias: `@/*` → `./src/*`
- `vitest/globals` in `types` array — global test APIs

**EditorConfig:** `.editorconfig`

- UTF-8, LF line endings, 2-space indentation, trailing newline, trim whitespace

**Pre-commit Hooks:**

- Tool: Husky + lint-staged (`.husky/pre-commit` runs `npx lint-staged`)
- For `*.{ts,tsx}`: `eslint --fix` then `prettier --write`
- For `*.{json,md,css,html}`: `prettier --write`

## Import Organization

**Order (enforced by `eslint-plugin-simple-import-sort`):**

1. External packages (React, libraries) — `import { create } from 'zustand'`
2. Internal modules via path alias `@/` or relative `../` — sorted alphabetically
3. Type-only imports use `import type` — `import type { Dish, Ingredient } from '../types'`

**Path Aliases:**

- `@/` maps to `src/` — use for deep imports: `@/lib/utils`, `@/utils/logger`, `@/services/databaseService`
- Relative imports (`../`, `./`) are also used, especially in test files and co-located modules
- Both styles coexist; prefer `@/` for cross-feature imports and relative for same-directory

**Examples:**

```typescript
// External packages first
import { create } from 'zustand';

// Internal imports (alphabetical)
import { initialDishes } from '../data/initialData';
import type { DatabaseService } from '../services/databaseService';
import type { Dish, MealType } from '../types';
import { generateUUID } from '../utils/helpers';
import { logger } from '../utils/logger';
import { persistToDb } from './helpers/dbWriteQueue';
```

## Error Handling

**Patterns:**

1. **ErrorBoundary (Class Component):** `src/components/ErrorBoundary.tsx`
   - React class component wrapping feature sections
   - Logs via `logger.error()`, shows Vietnamese error UI with retry/reload
   - Accepts optional `fallbackTitle` and `fallback` props
   - Used at feature boundaries: `<ErrorBoundary fallbackTitle={t('dashboard.error.hero')}>`

2. **Structured Logger:** `src/utils/logger.ts`
   - All logging through `logger.debug/info/warn/error` — never raw `console.*`
   - Requires `LogContext` object: `{ component: string, action: string, traceId?: string }`
   - `logger.debug` only emits in development (`import.meta.env.DEV`)
   - Error sanitization: converts Error objects to `{ message, name, stack }`
   - `generateTraceId()` for correlating logs across a flow

3. **Store Error Handling:**
   - Zustand store actions use `.catch()` on async DB operations
   - Pattern: `db.transaction(...).catch(error => logger.error({ component, action }, error))`
   - See `src/store/dishStore.ts` for reference

4. **Service Error Handling:**
   - Services throw typed errors: `throw new Error('Invalid MealPlanSuggestion')`
   - AbortController support: check `signal.aborted` before async work
   - Pattern in `src/services/geminiService.ts`

5. **Database Write Queue:** `src/store/helpers/dbWriteQueue.ts`
   - Transient errors (SQLITE_BUSY, database locked) auto-retry up to `MAX_RETRIES` (2)
   - Non-transient errors logged and dropped
   - `isTransientError()` checks error message strings

6. **Safe JSON Parsing:**
   - `safeJsonParse<T>(raw, fallback, context)` — returns fallback on parse failure with warning log
   - Used in store hydration from database

## Logging

**Framework:** Custom structured logger at `src/utils/logger.ts`

**Patterns:**

- Always provide context: `logger.error({ component: 'dishStore', action: 'addDish' }, error)`
- Use `generateTraceId()` for multi-step flows
- Debug logging auto-stripped in production via esbuild `drop: ['console', 'debugger']`
- Components wrapping `console.*` (like logger) have `no-console` ESLint override

## Comments

**When to Comment:**

- Section separators using decorated comments: `/* ── Section Name ── */` or `/* ================================================================== */`
- `/** @internal */` JSDoc for test-only exports
- Inline comments for non-obvious logic, especially date/timezone handling
- Coverage ignore comments: `/* v8 ignore start */` / `/* v8 ignore stop */` for SSR guards

**JSDoc/TSDoc:**

- Used on exported utility functions with `/** ... */` — `src/utils/helpers.ts`
- Not consistently used across all modules
- Test-only exports marked with `/** @internal ... — test-only */`

## Function Design

**Size:**

- Functions generally small and focused (10–30 lines)
- Components split into Inner + wrapper pattern for ErrorBoundary wrapping: `DashboardTabInner` wrapped by `DashboardTab`

**Parameters:**

- Destructured props for components: `({ title, onClose, onEdit }: DetailModalProps)`
- Options objects for complex APIs: `options?: { onClick?, duration?, action? }`
- `React.memo` used on form components and frequently re-rendered leaves: `src/components/form/FormField.tsx`

**Return Values:**

- Hooks return objects (not arrays): `{ isLoading, suggestion, error, startSuggestion }`
- Store selectors return individual values via Zustand selector pattern

## Module Design

**Exports:**

- Named exports preferred over default exports
- Default exports only for React page-level components and `App.tsx`
- `export const` for functions, `export type` for types
- Lazy-loaded components use `React.lazy(() => import(...).then(m => ({ default: m.Name })))` pattern

**Barrel Files:**

- Used sparingly: `src/components/navigation/index.ts`
- Re-export specific named exports, not wildcard `*`
- Coverage exclusion for barrel files: `src/components/navigation/index.ts` excluded in vitest config

## Component Patterns

**shadcn/ui Components:** `src/components/ui/`

- Style: `base-nova` variant, uses `@base-ui/react` primitives
- Styling via CVA (`class-variance-authority`) for variant/size props
- `cn()` utility from `src/lib/utils.ts` merging `clsx` + `tailwind-merge`
- Not modified directly — treated as library code (excluded from coverage)

**Custom Components:**

- Use `React.memo` for performance-sensitive components
- `useCallback` for all event handlers passed as props
- `useTranslation()` hook from react-i18next for all user-facing strings
- `data-testid` attributes on testable elements

**Modal Pattern:**

- `ModalBackdrop` wrapper component: `src/components/shared/ModalBackdrop.tsx`
- `useModalBackHandler` hook for Android back button: `src/hooks/useModalBackHandler.ts`
- Props: `isOpen`, `onClose`/`onCancel`, `onConfirm` pattern

## State Management

**Zustand Stores:** `src/store/`

- Pattern: `create<StateType>((set, get) => ({ ... }))`
- No middleware (no persist, no devtools)
- Direct state access: `useDishStore.getState().addDish(dish)`
- Selector pattern: `useNavigationStore(state => state.activeTab)`
- Store ↔ SQLite sync via `dbWriteQueue` (not Zustand persist)

**React Context:** `src/contexts/`

- Used for cross-cutting concerns: Database, Auth, Notifications
- Provider tree: `NotificationProvider > DatabaseProvider > AuthProvider > App`
- Context consumers via custom hooks: `useDatabase()`, `useNotification()`, `useAuth()`

## Internationalization (i18n)

**Framework:** i18next + react-i18next

- Config: `src/i18n.ts`
- Vietnamese-only (primary language): `src/locales/vi.json`
- Flat nested key structure: `common.save`, `errorBoundary.defaultTitle`, `validation.ingredient.nameRequired`
- Access via `useTranslation()` hook: `const { t } = useTranslation()`
- Zod schemas use `i18n.t()` for validation error messages
- All user-visible strings MUST go through i18n — no hardcoded Vietnamese in components

## Form Patterns

**react-hook-form + Zod:**

- Schema files: `src/schemas/*.ts`
- Each schema exports: schema object, inferred FormData type, default values
- Resolver: `@hookform/resolvers` with Zod adapter
- `z.preprocess` for numeric string coercion from form inputs
- `z.coerce.number()` for simpler numeric fields
- Custom `FormField` wrapper: `src/components/form/FormField.tsx` — handles labels, errors, ARIA attributes

## Tailwind CSS

**Version:** Tailwind CSS v4 with Vite plugin (`@tailwindcss/vite`)

- CSS variables for theming: `--primary`, `--destructive`, `--muted-foreground`, etc.
- Design tokens via CSS custom properties in `src/index.css`
- Dark mode: class-based via `@variant` directive
- Animation library: `tw-animate-css`
- Motion library: `motion` (Framer Motion successor)

---

_Convention analysis: 2025-07-14_
