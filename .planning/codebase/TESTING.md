# Testing Patterns

**Analysis Date:** 2025-07-14

## Test Framework

**Runner:**

- Vitest 4.x (v8 coverage provider)
- Config: `vitest.config.ts`
- Environment: jsdom
- Globals enabled (`test`, `describe`, `it`, `expect`, `vi` available without import)

**Assertion Library:**

- Vitest built-in `expect` (Jest-compatible)
- `@testing-library/jest-dom` matchers — `toBeInTheDocument()`, `toHaveTextContent()`, etc.

**Setup File:** `src/__tests__/setup.ts`

- Imports `@testing-library/jest-dom` for DOM matchers
- Initializes i18next with Vietnamese translations so tests render real translated strings

**Run Commands:**

```bash
npm test                # Run all tests once (vitest run)
npm run test:watch      # Watch mode (vitest)
npm run test:coverage   # Coverage with v8 provider (vitest run --coverage)
```

## Test File Organization

**Location:**

- Centralized test directory: `src/__tests__/` (195 test files)
- Schema-specific tests co-located: `src/schemas/__tests__/` (4 test files)
- Integration tests in subdirectory: `src/__tests__/integration/` (4 test files)
- Tests are NOT co-located with source files

**Naming:**

- Component tests: `ComponentName.test.tsx` — `EmptyState.test.tsx`, `ErrorBoundary.test.tsx`
- Store tests: `storeName.test.ts` — `dishStore.test.ts`, `fitnessStore.test.ts`
- Service tests: `serviceName.test.ts` — `databaseService.test.ts`, `geminiService.test.ts`
- Hook tests: `useHookName.test.ts` — `useAISuggestion.test.ts`, `useModalManager.test.ts`
- Utility tests: `utilName.test.ts` — `helpers.test.ts`, `nutrition.test.ts`
- Schema tests: `schemaName.test.ts` — `ingredientEditSchema.test.ts`
- Integration tests: `descriptiveName.test.ts` — `crossFeature.test.ts`, `migration.test.ts`
- Multi-file coverage: append `Coverage` suffix — `databaseServiceCoverage.test.ts`, `settingsTabCoverage.test.ts`

**Include Pattern (vitest):**

```
src/**/*.{test,spec}.{ts,tsx}
```

**Structure:**

```
src/
├── __tests__/
│   ├── setup.ts                    # Global test setup
│   ├── app.test.tsx                # App-level integration
│   ├── dishStore.test.ts           # Store unit test
│   ├── components.test.tsx         # Multiple component tests in one file
│   ├── integration/
│   │   ├── crossFeature.test.ts    # Cross-feature integration
│   │   ├── migration.test.ts       # DB migration tests
│   │   └── syncV2Integration.test.ts
│   └── ...
├── schemas/
│   └── __tests__/
│       ├── ingredientEditSchema.test.ts
│       └── ...
```

## Test Structure

**Suite Organization:**

```typescript
import { describe, expect, it, vi } from 'vitest';

import { useDishStore } from '../store/dishStore';
import type { Dish } from '../types';

// Test data constants at module level
const SAMPLE_DISH: Dish = {
  id: 'dish-1',
  name: { vi: 'Cơm gà', en: 'Chicken rice' },
  ingredients: [{ ingredientId: 'ing-1', amount: 200 }],
  tags: ['lunch', 'dinner'],
};

// Reset helper function
function resetStore() {
  __resetDishDbForTesting();
  useDishStore.setState({ dishes: [] });
}

describe('dishStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('addDish', () => {
    it('adds a dish to the store', () => {
      useDishStore.getState().addDish(SAMPLE_DISH);
      expect(useDishStore.getState().dishes).toHaveLength(1);
      expect(useDishStore.getState().dishes[0]).toEqual(SAMPLE_DISH);
    });
  });
});
```

**Patterns:**

- Nested `describe` blocks: outer for module, inner for method/feature
- `beforeEach` for store/mock reset — always clean state per test
- Test data as module-level `const` objects (UPPER_SNAKE_CASE)
- Helper functions for complex setup: `resetStore()`, `setupFitnessStore()`
- Vietnamese strings in assertions (tests run with real i18n): `expect(screen.getByText('Chưa có dữ liệu'))`

## Mocking

**Framework:** Vitest built-in `vi.mock()`, `vi.fn()`, `vi.spyOn()`

**Module Mocking Pattern:**

```typescript
// Top-level vi.mock for module replacement
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => mockNotify,
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Hoisted mocks for modules needed before import
const { mockIsNativePlatform } = vi.hoisted(() => ({
  mockIsNativePlatform: vi.fn(() => false),
}));
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: mockIsNativePlatform },
}));
```

**Service/API Mocking:**

```typescript
// Define mock function first
const mockGenerateContent = vi.fn();

// Mock the module factory
vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    models = { generateContent: mockGenerateContent };
  }
  return { GoogleGenAI: MockGoogleGenAI };
});

// In tests
mockGenerateContent.mockResolvedValue({ text: JSON.stringify(result) });
```

**Store Mocking (Zustand selector pattern):**

```typescript
vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

const mockFitnessStore = useFitnessStore as unknown as Mock;

function setupFitnessStore(overrides: Record<string, unknown> = {}) {
  const state = {
    workouts: [],
    workoutSets: [],
    // ... defaults
    ...overrides,
  };
  mockFitnessStore.mockImplementation((selector: (s: Record<string, unknown>) => unknown) => selector(state));
}
```

**What to Mock:**

- External services: `@google/genai`, `@capacitor/core`, `@capacitor/filesystem`
- Context providers: `NotificationContext`, `DatabaseContext`, `AuthContext`
- Navigation hooks: `useModalBackHandler`, `useAppBackHandler`
- Logger: `vi.mock('../utils/logger', () => ({ logger: { error: vi.fn() } }))`
- Complex child components: Heavy components replaced with simple test stubs

**What NOT to Mock:**

- Pure utility functions: `helpers.ts`, `nutrition.ts`, `scoreCalculator.ts` — test directly
- Zod schemas — test with `safeParse()` directly
- Zustand stores (in store-specific tests) — use real store with state reset
- i18n — initialized with real Vietnamese translations in setup

**Environment Variables in Tests:**

```typescript
// Set env before import
(import.meta.env as Record<string, string>).VITE_GEMINI_API_KEY = 'test-key';
```

## Fixtures and Factories

**Test Data:**

```typescript
// Inline factory functions
const makeDish = (id: string, name: string): Dish => ({
  id,
  name: { vi: name, en: name },
  tags: ['lunch'],
  ingredients: [],
});

const makeIngredient = (id: string, name: string): Ingredient => ({
  id,
  name: { vi: name, en: name },
  unit: { vi: 'g', en: 'g' },
  caloriesPer100: 50,
  proteinPer100: 5,
  carbsPer100: 20,
  fatPer100: 2,
  fiberPer100: 1,
});

// Module-level constants for reuse
const SAMPLE_DISH: Dish = { ... };
const DISH_VI_ONLY: Dish = { ... };
```

**Location:**

- No shared fixtures directory — test data defined inline per test file
- Factory functions (`make*`) in each test file that needs them
- Constants (`SAMPLE_*`) at module scope for reuse within file

**Schema Test Data:**

```typescript
// Use schema defaults as base, override specific fields
const data = { ...ingredientEditDefaults, name: { vi: 'Gà' }, unit: { vi: 'g' } };
const result = ingredientEditSchema.safeParse(data);
expect(result.success).toBe(true);
```

## Coverage

**Provider:** `@vitest/coverage-v8`

**Reporters:** text, json, clover, lcov
**Output:** `./coverage/`

**View Coverage:**

```bash
npm run test:coverage     # Generates coverage report
# Also integrated with SonarQube via sonar-project.properties
```

**Coverage Exclusions (vitest.config.ts):**

- `node_modules/**`
- `src/__tests__/**` — test files themselves
- `**/*.test.ts`, `**/*.test.tsx`
- `android/**`, `e2e/**`
- `src/vite-env.d.ts`, `src/i18n.ts`, `src/main.tsx`, `src/index.css`
- `src/locales/**` — translation JSON
- `src/components/navigation/index.ts` — barrel file
- `src/components/ui/**` — shadcn/ui generated components
- `src/lib/utils.ts` — trivial utility

**SonarQube Integration:**

- Config: `sonar-project.properties`
- LCOV report path: `coverage/lcov.info`
- Test inclusions match `__tests__/**` directories

**Inline Coverage Ignoring:**

```typescript
/* v8 ignore start -- SSR guard */
if (globalThis.window === undefined) return false;
/* v8 ignore stop */
```

## Test Types

**Unit Tests (majority — ~195 files in `src/__tests__/`):**

- Pure function tests: schema validation, utility functions, calculations
- Zustand store tests: state mutations, action handlers (reset store between tests)
- Hook tests via `renderHook` from `@testing-library/react`
- Component render tests via `render` from `@testing-library/react`

**Integration Tests (`src/__tests__/integration/`):**

- `crossFeature.test.ts` — tests pure functions across multiple features together (nutrition engine + score calculator + gamification)
- `migration.test.ts` — database migration flows
- `syncV2Integration.test.ts` — sync service integration
- `dashboardEdgeCases.test.ts` — dashboard edge cases across modules
- Pattern: import real (unmocked) pure functions, test their composition

**E2E Tests (`e2e/`):**

- Framework: WebdriverIO + Appium + UiAutomator2
- Config: `e2e/wdio.conf.ts`
- Runner: Mocha (BDD style)
- Target: Android APK via Appium
- 29 spec files: `e2e/specs/01-navigation.spec.ts` through `29-health-profile-settings.spec.ts`
- Page Object pattern: `e2e/pages/` — `BasePage.ts`, `CalendarPage.ts`, `FitnessPage.ts`, etc.
- Run command: `npm run e2e` or `npm run e2e:android`

## Common Patterns

**Component Render Testing:**

```typescript
import { fireEvent, render, screen } from '@testing-library/react';

it('renders and handles click', () => {
  const onAction = vi.fn();
  render(<EmptyState variant="hero" title="Chưa có món ăn" actionLabel="Tạo món" onAction={onAction} />);

  expect(screen.getByText('Chưa có món ăn')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Tạo món' }));
  expect(onAction).toHaveBeenCalledTimes(1);
});
```

**Hook Testing:**

```typescript
import { act, renderHook } from '@testing-library/react';

it('returns initial state', () => {
  const { result } = renderHook(() => useAISuggestion(baseParams));
  expect(result.current.isLoading).toBe(false);
  expect(result.current.suggestion).toBeNull();
});

it('updates state on action', async () => {
  const { result } = renderHook(() => useAISuggestion(baseParams));
  await act(async () => {
    result.current.startSuggestion();
  });
  expect(result.current.suggestion).toEqual(expectedResult);
});
```

**Async Testing:**

```typescript
it('resolves async operation', async () => {
  mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockResult) });
  const result = await suggestMealPlan(2000, 100, availableDishes);
  expect(result).toEqual(mockResult);
});

it('handles async rejection', async () => {
  mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ bad: 'data' }) });
  await expect(suggestMealPlan(2000, 100, availableDishes)).rejects.toThrow('Invalid MealPlanSuggestion');
});
```

**Error Testing:**

```typescript
// ErrorBoundary testing
it('renders error UI when child throws', () => {
  // Suppress console.error for expected React error boundary logs
  vi.spyOn(console, 'error').mockImplementation(() => {});

  render(
    <ErrorBoundary>
      <ThrowingChild shouldThrow={true} />
    </ErrorBoundary>,
  );
  expect(screen.getByText('Đã xảy ra lỗi')).toBeInTheDocument();
});

// AbortController testing
it('throws AbortError when signal is already aborted', async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(suggestMealPlan(2000, 100, dishes, controller.signal)).rejects.toThrow('Aborted');
});
```

**Context Provider Testing:**

```typescript
// Test consumer component pattern
const TestConsumer = () => {
  const notify = useNotification();
  return (
    <div>
      <button onClick={() => notify.success('Success!', 'Done')}>show-success</button>
    </div>
  );
};

it('renders success toast', async () => {
  render(
    <NotificationProvider>
      <TestConsumer />
    </NotificationProvider>,
  );
  await userEvent.click(screen.getByText('show-success'));
  expect(screen.getByText('Success!')).toBeInTheDocument();
});

// Context guard testing
it('throws when used outside provider', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => render(<BrokenConsumer />)).toThrow('must be used within');
});
```

**Schema Validation Testing:**

```typescript
it('validates data with name and unit filled', () => {
  const data = { ...ingredientEditDefaults, name: { vi: 'Gà' }, unit: { vi: 'g' } };
  const result = ingredientEditSchema.safeParse(data);
  expect(result.success).toBe(true);
});

it('rejects negative nutrition values', () => {
  const data = { ...ingredientEditDefaults, name: { vi: 'Gà' }, unit: { vi: 'g' }, caloriesPer100: -1 };
  const result = ingredientEditSchema.safeParse(data);
  expect(result.success).toBe(false);
});

it('coerces string numbers to numbers', () => {
  const data = { name: { vi: 'Gà' }, unit: { vi: 'g' }, caloriesPer100: '165', ... };
  const result = ingredientEditSchema.safeParse(data);
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.caloriesPer100).toBe(165);
  }
});
```

**Store Testing (Zustand):**

```typescript
// Direct state manipulation — no rendering needed
function resetStore() {
  __resetDishDbForTesting(); // Reset DB reference
  useDishStore.setState({ dishes: [] }); // Clear state
}

it('adds a dish to the store', () => {
  useDishStore.getState().addDish(SAMPLE_DISH);
  expect(useDishStore.getState().dishes).toHaveLength(1);
});

it('accepts an updater function', () => {
  useDishStore.setState({ dishes: [SAMPLE_DISH] });
  useDishStore.getState().setDishes(prev => [...prev, DISH_VI_ONLY]);
  expect(useDishStore.getState().dishes).toHaveLength(2);
});
```

**Database Service Testing (real sql.js in jsdom):**

```typescript
let db: DatabaseService;

beforeEach(async () => {
  db = createDatabaseService();
  await db.initialize();
});

it('query<T>() returns rows with camelCase keys', async () => {
  await db.execute('CREATE TABLE items (item_id INTEGER, item_name TEXT)');
  await db.execute("INSERT INTO items VALUES (1, 'Widget')");
  const rows = await db.query<{ itemId: number; itemName: string }>('SELECT * FROM items');
  expect(rows[0].itemName).toBe('Widget');
});
```

## Test Utilities

**User Event:**

- `@testing-library/user-event` available for realistic user interactions
- Pattern: `await userEvent.click(element)` for async user interaction simulation
- `fireEvent` from `@testing-library/react` used for simpler synchronous interactions

**Wait Utilities:**

```typescript
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Child Content')).toBeInTheDocument();
});
```

**Test-Only Reset Functions:**

- Exported from production code with `__` prefix or `_` prefix
- `__resetDishDbForTesting()` — `src/store/dishStore.ts`
- `_resetAISingleton()` — `src/services/geminiService.ts`
- `_clearNutritionCache()` — `src/services/geminiService.ts`
- `_waitForIdle()` — `src/store/helpers/dbWriteQueue.ts`
- `_resetQueue()` — `src/store/helpers/dbWriteQueue.ts`

---

_Testing analysis: 2025-07-14_
