# Quy Tắc Code — Smart Meal Planner

**Version:** 5.2  
**Date:** 2026-06-28

---

## 1. Ngôn ngữ và Framework

- **TypeScript strict mode** — tất cả file `.ts`/`.tsx`, không dùng `any` trừ khi cực kỳ cần thiết
- **`@typescript-eslint/no-explicit-any` rule set to error** — tuyệt đối không dùng `as any`. Sử dụng proper typing, generics, hoặc `unknown` + type guard.
- **React 19 functional components** — không dùng class components
- **Tailwind CSS v4** — không viết CSS inline, không dùng `style={}` trừ giá trị động
- **Dark mode bắt buộc:** Khi thêm bất kỳ class `bg-*`, `text-*`, `border-*`, hoặc `active:bg-*` phải luôn kèm variant `dark:` tương ứng. Ví dụ: `bg-amber-50 dark:bg-amber-900/20`. Xem [BUG-DM-001](../bug-reports/BUG-DM-001-dark-mode-missing-variants.md) cho pattern chi tiết.
- Mọi text hiển thị với user phải qua `t()` của i18next — **không hardcode string**
- **No `eslint-disable`**: Tuyệt đối không sử dụng `eslint-disable`, `eslint-disable-next-line`, hoặc `eslint-disable-line` trong bất kỳ file nào.

---

## 2. Quy tắc đặt tên

### Files

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Component | PascalCase `.tsx` | `IngredientEditModal.tsx` |
| Hook | camelCase, prefix `use` | `usePersistedState.ts` |
| Service | camelCase, suffix `Service` | `geminiService.ts` |
| Utility | camelCase | `calorieCalculator.ts` |
| Type | camelCase `.ts` | `types.ts` |
| Test | `.test.ts(x)` cùng tên file gốc | `geminiService.test.ts` |
| E2E Page Object | PascalCase, suffix `Page` | `CalendarPage.ts` |
| E2E Spec | prefix số thứ tự | `03-dish-crud.spec.ts` |

### Store API Naming

> **Quy tắc bắt buộc** — xác nhận từ QA Stabilization (2026-03-28)

Store methods sử dụng tên hành động trực tiếp, **không** thêm suffix `Db`, `ToDb`, `FromDb`:

```typescript
// ✅ Correct — direct action names
addDish(dish);
updateDish(dish);
deleteDish(id);
addIngredient(ingredient);

// ❌ Wrong — DB-suffixed names (không tồn tại)
addDishToDb(dish);
updateDishInDb(dish);
deleteDishFromDb(id);
```

Các hàm `loadXxx()` (ví dụ: `loadDishes()`, `loadIngredients()`) là **standalone exports** riêng biệt, không phải methods trên store object.

### Variables & Functions

```typescript
// ✅ Correct
const ingredientList: Ingredient[] = [];
function calculateProtein(weight: number, ratio: number): number {}
const handleSaveIngredient = () => {};

// ❌ Wrong
const il: any[] = [];
function calc(w, r) {}
const save = () => {};
```

### Interfaces & Types

```typescript
// ✅ PascalCase, đầy đủ domain prefix khi cần
interface UserProfile { ... }
interface AnalyzedDishResult { ... }
type LocalizedString = { vi: string };

// ❌ Không dùng prefix I
interface IIngredient { ... }
```

---

## 3. Cấu trúc component

```typescript
// TemplateComponent.tsx — thứ tự chuẩn

// 1. Imports — React, external libs, internal
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Ingredient } from '../../types';
import { Button } from '../ui/Button';

// 2. Props interface (ngay trên component)
interface IngredientEditModalProps {
  ingredient: Ingredient | null;
  onSave: (ingredient: Ingredient) => void;
  onClose: () => void;
}

// 3. Component function (arrow function với named export)
export const IngredientEditModal: React.FC<IngredientEditModalProps> = ({
  ingredient,
  onSave,
  onClose,
}) => {
  // 4. Hooks (theo thứ tự: state, context, custom hooks)
  const { t } = useTranslation();
  const [name, setName] = useState(ingredient?.name.vi ?? '');

  // 5. Derived values (useMemo nếu đắt)
  const isEditing = ingredient !== null;

  // 6. Event handlers (useCallback nếu pass xuống child)
  const handleSave = useCallback(() => {
    onSave({ ...ingredient, name: { vi: name } });
  }, [ingredient, name, onSave]);

  // 7. JSX return
  return (
    <div>...</div>
  );
};
```

---

## 4. TypeScript patterns

### Type Guards

```typescript
// ✅ Luôn dùng type guard cho AI response
function isAnalyzedDishResult(obj: unknown): obj is AnalyzedDishResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'isFood' in obj
  );
}

// ❌ Không cast trực tiếp
const result = response as AnalyzedDishResult; // nguy hiểm
```

### Typed state

```typescript
// ✅ Always type state explicitly
const [ingredients, setIngredients] = useState<Ingredient[]>([]);
const [selectedDate, setSelectedDate] = useState<string | null>(null);

// ❌ Let TypeScript infer ambiguous types
const [data, setData] = useState(null);
```

### Pure functions trong services

```typescript
// ✅ Pure functions — không side effects trong planService/calorieCalculator
export function calculateDailyCalories(dayPlan: DayPlan, dishes: Dish[]): number {
  // only reads inputs, returns new value
}

// ❌ Side effects trong utility functions
export function saveAndCalculate(dayPlan: DayPlan, dishes: Dish[]): number {
  localStorage.setItem(...); // WRONG
  return calculate(dayPlan, dishes);
}
```

---

## 5. Quy tắc i18n

### Sử dụng `t()` hook

```typescript
const { t } = useTranslation();

// ✅ Dùng key path đầy đủ
t('ingredients.modal.title')
t('common.save')

// ❌ Hardcode text tiếng Việt
"Thêm nguyên liệu"
```

### LocalizedString type

```typescript
// Ứng dụng chỉ hỗ trợ Tiếng Việt
interface Ingredient {
  name: LocalizedString;   // { vi: string }
  unit: LocalizedString;
}

// ✅ Display: truy cập trực tiếp .vi
const displayName = ingredient.name.vi;
```

### Factory functions

```typescript
// ✅ Dùng factory để tạo object mới với cấu trúc đúng
import { createIngredient } from '../services/dataService';
const newIng = createIngredient({ name: 'Thịt bò', unit: 'g', ... });

// ❌ Tạo inline với ID thủ công
const newIng: Ingredient = { id: Date.now().toString(), ... };
```

### Quy tắc Translation

- Mọi tên nguyên liệu/món ăn phải sử dụng `LocalizedString` (chỉ field `vi`)
- Ứng dụng chỉ hỗ trợ Tiếng Việt — không cần dịch sang tiếng Anh

---

## 6. Quản lý state

- **Tất cả state quan trọng** nằm tại `App.tsx` (single source of truth)
- Pass state xuống via props — không dùng Context cho main data (ADR-001)
- Dùng `usePersistedState<T>` thay cho `useState` khi cần persist vào localStorage
- **Context Providers**: Dùng React Context cho cross-cutting concerns (AuthContext cho OAuth, NotificationContext cho toast). Không dùng Context cho domain data — dùng `usePersistedState` hoặc Zustand.
- **Custom hooks naming**: Hooks trả về boolean dùng prefix `useIs` (ví dụ: `useIsDesktop`). Hooks cho CRUD dùng prefix `use` + noun (ví dụ: `useMealTemplate`, `useCopyPlan`).

### Zustand Pattern — `useShallow` bắt buộc

> **Quy tắc bắt buộc** — tránh unnecessary re-renders khi select multiple properties từ Zustand store.

Khi select nhiều properties từ Zustand store, **bắt buộc** dùng `useShallow` để tránh re-render không cần thiết:

```typescript
import { useShallow } from 'zustand/react/shallow';

// ✅ Correct — useShallow khi select multiple properties
const { dishes, ingredients, addDish } = useMealStore(
  useShallow((s) => ({ dishes: s.dishes, ingredients: s.ingredients, addDish: s.addDish }))
);

// ✅ Correct — single property không cần useShallow
const dishes = useMealStore((s) => s.dishes);

// ❌ Wrong — select multiple properties WITHOUT useShallow → unnecessary re-renders
const { dishes, ingredients } = useMealStore((s) => ({
  dishes: s.dishes,
  ingredients: s.ingredients,
}));
```

```typescript
// ✅ Dùng usePersistedState
const [ingredients, setIngredients] = usePersistedState<Ingredient[]>(
  'mp-ingredients',
  []
);

// ❌ Tự gọi localStorage
const [ingredients, setIngredients] = useState(() =>
  JSON.parse(localStorage.getItem('mp-ingredients') || '[]')
);
```

---

## 7. Error handling

### Logger Usage

> **Quy tắc bắt buộc** — xác nhận từ QA Stabilization (2026-03-28)

Sử dụng logger utility (`src/utils/logger.ts`) cho **tất cả** logging thay vì gọi `console.*` trực tiếp. Logger cung cấp 4 methods với structured context:

```typescript
import { logger } from '../utils/logger';

// ✅ Sử dụng logger — có structured context
logger.debug('Rendering component', { componentName: 'DishEdit', dishId });
logger.info('Saving ingredient', { id, name: ingredient.name.vi });
logger.warn('Missing nutrition data', { ingredientId });
logger.error('analyzeDishImage failed', error);

// ❌ KHÔNG dùng console.* trực tiếp
console.log('saving', data);          // ← ESLint no-console sẽ báo lỗi
console.error('failed', error);       // ← ESLint no-console sẽ báo lỗi
```

> **Lưu ý:** ESLint rule `no-console` được disable **chỉ** trong file `src/utils/logger.ts`. Mọi file khác gọi `console.*` sẽ bị ESLint báo lỗi.

### Notification API

> **Quy tắc bắt buộc** — xác nhận từ QA Stabilization (2026-03-28)

Sử dụng `useNotification()` hook để hiển thị toast notifications. **Không** destructure methods không tồn tại:

```typescript
// ✅ Correct — sử dụng useNotification hook
const notify = useNotification();
notify.success(t('common.saveSuccess'));
notify.error(t('errors.saveFailed'));
notify.warning(t('warnings.dataIncomplete'));
notify.info(t('info.syncComplete'));

// ❌ Wrong — destructure method không tồn tại
const { showNotification } = useNotification(); // showNotification KHÔNG tồn tại
showNotification('success', 'Saved!');           // sẽ crash runtime
```

### Async Error Handling

```typescript
// ✅ Luôn catch async errors
try {
  const result = await geminiService.analyzeDishImage(base64);
  // handle success
} catch (error) {
  logger.error('analyzeDishImage failed', error);
  notify.error(t('errors.aiAnalysisFailed'));
}

// ❌ console.log trực tiếp
console.log('saving', data);
```

---

## 8. Testing

### Unit tests

```typescript
// ✅ Test file cùng thư mục với source (hoặc __tests__/)
// src/services/__tests__/geminiService.test.ts

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should [verb] when [condition]', () => {
    // Arrange
    const input = createTestIngredient({ calories: 100 });
    // Act
    const result = calculateProtein(input);
    // Assert
    expect(result).toBe(expected);
  });
});
```

### Form Pattern — Zod v4 + React Hook Form

> **Quy tắc bắt buộc** — giải quyết incompatibility giữa Zod v4 và React Hook Form resolver types.

Khi dùng `zodResolver` với Zod v4, sử dụng double assertion thay vì `as any`:

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';

// ✅ Correct — double assertion (unknown → Resolver)
const form = useForm<FormData>({
  resolver: zodResolver(schema) as unknown as Resolver<FormData>,
});

// ❌ Wrong — as any
const form = useForm<FormData>({
  resolver: zodResolver(schema) as any,
});
```

### useWatch over watch

> **Quy tắc bắt buộc** — tránh `react-hooks/incompatible-library` warnings.

Sử dụng `useWatch` hook thay vì `form.watch()` method để theo dõi field values:

```typescript
import { useWatch } from 'react-hook-form';

// ✅ Correct — useWatch hook
const fieldValue = useWatch({ control: form.control, name: 'fieldName' });

// ❌ Wrong — form.watch triggers react-hooks warnings
const fieldValue = form.watch('fieldName');
```

### Safe Area Rule — Mobile Components

> **Quy tắc bắt buộc** — sau nhiều bug lặp lại trên mobile viewport.

Tất cả component mới **bắt buộc** phải account cho mobile safe areas. Sử dụng Tailwind safe area utilities:

```typescript
// ✅ Correct — safe area padding
<div className="pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
  {/* content */}
</div>

// ✅ Alternative — fixed header/footer with safe area
<header className="fixed top-0 pt-[env(safe-area-inset-top)] w-full">
  {/* navigation */}
</header>

// ❌ Wrong — no safe area consideration → content hidden behind notch/home indicator
<div className="pt-0">
  {/* content bị ẩn dưới notch */}
</div>
```

### Database Test Setup

> **Quy tắc bắt buộc** — xác nhận từ QA Stabilization (2026-03-28)

Khi viết test liên quan đến database (SQLite), **bắt buộc** gọi `createSchema(db)` sau `db.initialize()` để đảm bảo schema được tạo đầy đủ (19 tables):

```typescript
// ✅ Correct — luôn gọi createSchema sau initialize
const db = new SQLiteDatabase();
await db.initialize();
await createSchema(db);  // ← BẮT BUỘC — tạo đủ 19 tables

// ❌ Wrong — thiếu createSchema → test fail do missing tables
const db = new SQLiteDatabase();
await db.initialize();
// forgot createSchema → queries fail with "no such table"
```

### i18n Assertions trong Tests

> **Quy tắc bắt buộc** — xác nhận từ QA Stabilization (2026-03-28)

Khi assert text hiển thị trong unit tests, sử dụng **i18n keys từ `vi.json`** thay vì hardcode strings tiếng Việt. Điều này đảm bảo test không bị break khi cập nhật translations:

```typescript
// ✅ Correct — dùng i18n keys hoặc translated text từ t()
expect(screen.getByText(t('ingredients.modal.title'))).toBeInTheDocument();
expect(screen.getByRole('button', { name: t('common.save') })).toBeInTheDocument();

// ✅ Acceptable — dùng regex match cho text đã biết từ vi.json
expect(screen.getByText(/nguyên liệu/i)).toBeInTheDocument();

// ❌ Wrong — hardcode string không có trong vi.json
expect(screen.getByText('Add Ingredient')).toBeInTheDocument();
expect(screen.getByText('Thêm nguyên liệu mới vào danh sách')).toBeInTheDocument();
```
```

### E2E tests

```typescript
// ✅ Luôn dùng Page Object, không viết selector trong spec
// e2e/specs/03-dish-crud.spec.ts
const management = new ManagementPage(browser);
await management.openTab();
await management.addDish('Thịt bò xào');

// ❌ Inline selectors trong spec
await $('button[data-testid="add-dish"]').click();
```

### Coverage targets

| Module | Target | Current |
|--------|--------|---------|
| `services/` | ≥ 90% | **100%** ✅ |
| `utils/` | ≥ 90% | **100%** ✅ |
| `hooks/` | ≥ 85% | **100%** ✅ |
| `components/` | ≥ 75% | **100%** ✅ |
| `contexts/` | ≥ 85% | **100%** ✅ |
| **Overall Stmts** | ≥ 98% | **≥98%** ✅ |
| **Overall Branch** | ≥ 75% | **93.99%** ✅ |
| **E2E Specs** | 24 specs | **183 tests** ✅ |
| **Unit Test Files** | — | **165 files, 3954 tests** ✅ |

> **Chuẩn mới (2026-06-28):** 98%+ statement coverage là baseline bắt buộc. Mọi PR không được làm giảm coverage dưới 98%. Hiện tại: 165 test files, 3954 tests passing.
>
> **Chuẩn E2E (QA Cycle 3):** Deep integration tests required for cross-feature data flow. 100% feature-level coverage achieved and must be maintained.

### Quy tắc Test Coverage

- Coverage **không được phép giảm** sau mỗi PR
- Target: ≥ 98% statements, ≥ 90% branches (updated 2026-06-28)
- Mọi bug fix **phải kèm** test case regression
- **Coverage threshold**: Duy trì ≥ 98% statement coverage. Mỗi PR phải chạy `npm run test:coverage` và không được giảm coverage.
- **Lint**: `npx eslint src/` phải đạt 0 errors trước khi merge. Warnings từ `react-refresh` plugin là pre-existing và acceptable.
- **TypeScript**: `npx tsc --noEmit` phải đạt 0 errors.

### Quy tắc ESLint — Không dùng eslint-disable

> **Quy tắc bắt buộc** — xác nhận lại trong QA Cycle 2 (2026-03-06)

**Tuyệt đối không sử dụng** `eslint-disable`, `eslint-disable-next-line`, `eslint-disable-line`, hoặc `@ts-ignore` để bỏ qua lỗi lint/TypeScript. Mọi lỗi phải được sửa triệt để. Nếu ESLint báo lỗi, bắt buộc phải sửa code để tuân thủ rule, không được suppress.

```typescript
// ❌ KHÔNG BAO GIỜ
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = response;

// ✅ LUÔN sửa code
const data: AnalyzedDishResult = response as AnalyzedDishResult;
// hoặc tốt hơn: dùng type guard
if (isAnalyzedDishResult(response)) {
  const data = response;
}
```

### E2E Testing Patterns (QA Cycle 3)

#### Chrome 91 Compatibility (Android Emulator)

Chrome 91.0.4472.114 does NOT support ES2022+. These are **BANNED** in E2E test code:

| ❌ Banned | ✅ Replacement |
|-----------|---------------|
| `Array.at()` | `arr[arr.length - 1]` |
| `structuredClone()` | `JSON.parse(JSON.stringify(obj))` |
| `Object.hasOwn()` | `Object.prototype.hasOwnProperty.call(obj, key)` |
| Optional chaining in older contexts | Explicit null checks |

#### React 18 `_valueTracker` Pattern

When programmatically setting input values in E2E tests:

1. Set DOM value via native prototype setter (walk full prototype chain: `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set`)
2. Call `_valueTracker.setValue()` with a **DIFFERENT** value from the new value
3. Dispatch `input` + `change` events with `{ bubbles: true }`
4. Edge case: clearing to empty string → `_valueTracker.setValue('__cleared__')` to avoid same-value swallowing

#### WebDriver `getText()` Reliability

`getText()` may return empty string for some elements in Android WebView. Use JS execution:

```typescript
await browser.execute(() => document.querySelector('[data-testid="xxx"]')?.textContent || '');
```

#### E2E Data Isolation

Each spec should inject its own test data via `injectTestData()` with unique IDs (e.g., `e2e-plan-dish-1`, `e2e-integ-ing-1`) to avoid cross-spec interference.

### Test patterns đã xác lập (từ QA Cycle 2)

**Vietnamese i18n assertions:**
```typescript
// ✅ Assert text hiển thị qua t() — dùng i18n key hoặc translated text
expect(screen.getByText(/nguyên liệu/i)).toBeInTheDocument();
expect(screen.getByRole('button', { name: t('common.save') })).toBeInTheDocument();
```

**Mock patterns cho services:**
```typescript
// ✅ Mock Gemini service với retry/abort support
vi.mock('../services/geminiService', () => ({
  analyzeDishImage: vi.fn(),
  abortAnalysis: vi.fn(),
}));

// ✅ Mock camera với permission handling
Object.defineProperty(navigator, 'mediaDevices', {
  value: { getUserMedia: vi.fn() },
});
```

### Quy tắc i18n trong code

> **Quy tắc bắt buộc** — Tất cả user-facing strings phải dùng `t()` từ i18next.

- Ngôn ngữ chính: **Tiếng Việt** (vi)
- File translations: `src/locales/vi.json`
- Không hardcode bất kỳ string tiếng Việt nào trong components — luôn dùng translation key
- Khi thêm string mới: thêm key vào `vi.json` trước, rồi dùng `t('key.path')` trong component

---

## 8.1 Quy tắc đồng bộ tài liệu (Documentation Sync Rule)

> **Quy tắc bắt buộc** — phát sinh từ BUG-DOC-001 (2026-03-06)

### Khi thay đổi `src/types.ts`

Bắt buộc update đồng thời (cùng PR/commit):
- `docs/03-developer-guide/localstorage-schema.md` — nếu type liên quan đến localStorage
- `docs/02-architecture/data-model.md` — nếu thay đổi core domain types
- `docs/01-requirements/PRD.md` — nếu thay đổi ảnh hưởng đến business logic

```
# PR checklist khi thay đổi types.ts
- [ ] localstorage-schema.md đã được cập nhật?
- [ ] data-model.md đã được cập nhật?
- [ ] Test cho migration function đã được viết?
```

### Khi thay đổi modal flows (e.g., removing TypeSelectionModal step)

> **Quy tắc bắt buộc** — validated by BUG-E2E-003

Bắt buộc update đồng thời (cùng PR/commit):
- `e2e/pageobjects/CalendarPage.ts` — cập nhật Page Object cho flow mới
- Các E2E specs test flow đó (e.g., `e2e/specs/xx-*.spec.ts`)
- `docs/02-architecture/SAD.md` — cập nhật sequence descriptions
- `docs/04-testing/test-cases.md` — cập nhật test case steps

```
# PR checklist khi thay đổi modal flow
- [ ] E2E page objects đã được cập nhật?
- [ ] E2E specs testing flow đã được cập nhật?
- [ ] SAD.md sequence descriptions đã được cập nhật?
- [ ] Test cases đã phản ánh flow mới?
```

### Khi thay đổi API/Service

Bắt buộc update:
- `docs/02-architecture/sequence-diagrams.md` — nếu flow thay đổi
- `docs/03-developer-guide/setup.md` — nếu env vars mới
- `docs/04-testing/test-cases.md` — nếu behavior thay đổi

### Quy tắc PR Review

Reviewer **bắt buộc** kiểm tra: khi code thay đổi schema, service, hoặc behavior, tài liệu tương ứng phải được cập nhật trong cùng PR. **Không merge PR có code changes mà thiếu doc update.**

---

## 9. Linting & Formatting

- ESLint config tại `eslint.config.js` — **không disable rules dưới bất kỳ hình thức nào** (xác nhận QA Cycle 2: 0 eslint-disable trong toàn bộ codebase)
- Chạy `npm run lint` trước khi commit — phải đạt 0 errors, 0 warnings
- Prettier format (nếu có) theo config repo

---

## 10. Git conventions

### Commit messages (Conventional Commits)

```
feat: thêm tính năng gợi ý thực đơn AI
fix: sửa lỗi scroll lock khi đóng modal
docs: cập nhật README
test: thêm unit test cho geminiService
refactor: tách CalendarTab thành sub-components
chore: cập nhật dependencies
```

### Branch naming

```
feat/ai-suggestion-preview
fix/scroll-lock-regression
docs/comprehensive-documentation
```

---

## 11. Vite + Build Best Practices

### Environment Variables

```typescript
// ✅ Dùng import.meta.env với prefix VITE_
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// ❌ KHÔNG dùng process.env (không hoạt động trong Vite)
const apiKey = process.env.GEMINI_API_KEY;
```

- Type-safe env vars: khai báo trong `src/vite-env.d.ts` (interface `ImportMetaEnv`)
- Prefix `VITE_` bắt buộc cho tất cả biến cần expose lên client

### Lazy Loading

```typescript
// ✅ React.lazy cho tabs/modals không hiển thị ngay
const SettingsTab = lazy(() => import('./components/tabs/SettingsTab'));
const ManagementTab = lazy(() => import('./components/tabs/ManagementTab'));

// ✅ Suspense wrapper
<Suspense fallback={null}>
  <SettingsTab />
</Suspense>
```

### Code Splitting

- Tabs không hiển thị ban đầu → lazy load (ManagementTab, SettingsTab)
- Modals → lazy load (MealPlannerModal, SaveTemplateModal, etc.)
- Prefetch sau 2s idle: `usePrefetchAfterIdle` hook
- Manual chunks trong `vite.config.ts`: vendor-react, vendor-ui, vendor-i18n

### Build

- Target: `esnext` (Capacitor WebView)
- Compression: gzip + brotli (`vite-plugin-compression`)
- Bundle analysis: `npm run analyze` (rollup-plugin-visualizer)
- Production: `esbuild.drop: ['console', 'debugger']`
- Sourcemaps: `hidden` trong production
