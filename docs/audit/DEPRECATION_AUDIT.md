# 🔍 Deprecation & Code Quality Audit

> **Ngày audit**: 2026-04-01
> **Cập nhật lần cuối**: 2026-04-01
> **Phiên bản dự án**: MealPlaning v1.x
> **Công cụ**: Context7 MCP (Zod 4, React 19, i18next v25), web search, runtime tests, 9 skill reviews
> **Phạm vi**: Toàn bộ `src/` (không bao gồm `node_modules/`, `dist/`)

---

## Tổng quan

| Mức độ      | Tổng | ✅ Fixed             | ⏸️ Deferred    | ❌ Excluded    | Còn lại                  |
| ----------- | ---- | -------------------- | -------------- | -------------- | ------------------------ |
| 🔴 CRITICAL | 4    | 2 (C-02, C-03)       | 2 (C-01, C-04) | 0              | 0                        |
| 🟡 WARNING  | 5    | 3 (W-01, W-03, W-05) | 0              | 2 (W-02, W-04) | 0                        |
| 🟢 INFO     | 5    | 0                    | 1 (I-02)       | 0              | 0 (4 = no action needed) |

---

## 🔴 CRITICAL

### C-01: ⏸️ DEFERRED — Zod 4 — `z.preprocess()` internal change

**Mức độ gốc**: 🔴 CRITICAL → **Đánh giá lại**: 🟡 WARNING (deferred)
**Thư viện**: `zod@^4.3.6`
**Vấn đề gốc**: `z.preprocess()` không còn trả về `ZodPreprocess` mà trả về `ZodPipe`.
**Phân tích thực tế**: Context7 Zod 4 docs xác nhận: "z.preprocess() function now returns a ZodPipe instance" — API public **không thay đổi**, chỉ internal class thay đổi. Không có migration path bắt buộc. Force migrate sang `z.pipe()` thay đổi function signature → tăng risk mà không có runtime benefit.
**Quyết định**: DEFERRED — revisit khi Zod 5 xóa `z.preprocess()` hoàn toàn.
**Số lượng**: 6 instances

| File                                   | Dòng | Field            |
| -------------------------------------- | ---- | ---------------- |
| `src/schemas/ingredientEditSchema.ts`  | 10   | `caloriesPer100` |
| `src/schemas/ingredientEditSchema.ts`  | 14   | `proteinPer100`  |
| `src/schemas/ingredientEditSchema.ts`  | 18   | `carbsPer100`    |
| `src/schemas/ingredientEditSchema.ts`  | 22   | `fatPer100`      |
| `src/schemas/ingredientEditSchema.ts`  | 26   | `fiberPer100`    |
| `src/schemas/trainingProfileSchema.ts` | 52   | `avgSleepHours`  |

**Migration**:

```typescript
// ❌ Zod 3/4 deprecated
z.preprocess(val => (val === '' || val === undefined || val === null ? undefined : Number(val)), z.number().min(0));

// ✅ Zod 4 recommended
z.union([z.literal(''), z.coerce.number().min(0)]);
// hoặc
z.pipe(
  z.unknown(),
  z.transform(val => (val === '' ? undefined : Number(val))),
  z.number().min(0),
);
```

---

### C-02: ✅ FIXED — Zod 4 — `message` parameter deprecated → dùng `error`

**Thư viện**: `zod@^4.3.6`
**Vấn đề**: Zod 4 thống nhất error customization dưới tham số `error`, thay thế `message`, `invalid_type_error`, `required_error`.
**Số lượng**: **38 instances** (verified) trong **10 files**
**Đã fix**: 2026-04-01 — Tất cả `{ message: }` → `{ error: }` trong Zod validator calls. `ctx.addIssue({ message: })` giữ nguyên (không deprecated).

| File                                            | Ví dụ                                            |
| ----------------------------------------------- | ------------------------------------------------ |
| `src/schemas/ingredientEditSchema.ts`           | `z.number({ message: 'Vui lòng nhập giá trị' })` |
| `src/schemas/trainingProfileSchema.ts`          | `.min(3, { message: 'Giờ ngủ tối thiểu là 3' })` |
| `src/schemas/healthProfileSchema.ts`            | `.refine(..., { message: '...' })`               |
| `src/schemas/cardioLoggerSchema.ts`             | `.refine(..., { message: '...' })`               |
| `src/schemas/saveAnalyzedDishSchema.ts`         | `.refine(..., { message: '...' })`               |
| `src/schemas/fitnessOnboardingSchema.ts`        | `.refine(..., { message: '...' })`               |
| `src/schemas/dishEditSchema.ts`                 | Various `.min()`, `.max()` calls                 |
| `src/schemas/workoutLoggerSchema.ts`            | Various validation messages                      |
| `src/schemas/customExerciseSchema.ts`           | Various validation messages                      |
| `src/schemas/saveTemplateSchema.ts`             | Various validation messages                      |
| `src/components/onboarding/onboardingSchema.ts` | `.refine(..., { message: '...' })`               |

**Migration**:

```typescript
// ❌ Zod 3 (deprecated in Zod 4)
z.string().min(5, { message: 'Too short.' });
z.string({ invalid_type_error: 'Not a string', required_error: 'Required' });

// ✅ Zod 4
z.string().min(5, { error: 'Too short.' });
z.string({
  error: issue => (issue.input === undefined ? 'Required' : 'Not a string'),
});
```

---

### C-03: ✅ FIXED — React 19 — `forwardRef` deprecated (app code + test mocks)

**Thư viện**: `react@^19.0.0`
**Vấn đề**: React 19 cho phép truyền `ref` như một prop thông thường. `forwardRef` sẽ bị xóa trong phiên bản tương lai.
**Số lượng**: 1 app code + 3 test mocks = **4 instances total**
**Đã fix**: 2026-04-01 — Tất cả migrated sang ref-as-prop pattern.

| File                                                  | Dòng | Context                                         |
| ----------------------------------------------------- | ---- | ----------------------------------------------- |
| `src/components/form/StringNumberController.tsx`      | 137  | `React.forwardRef(StringNumberControllerInner)` |
| `src/__tests__/authContext.test.tsx`                  | 51   | Test mock (low priority)                        |
| `src/__tests__/unifiedOnboardingIntegration.test.tsx` | 109  | Test mock (low priority)                        |
| `src/__tests__/unifiedOnboarding.test.tsx`            | 156  | Test mock (low priority)                        |

**Migration**:

```typescript
// ❌ React 18 (deprecated in React 19)
const MyComponent = React.forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

// ✅ React 19
function MyComponent({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}
```

---

### C-04: ⏸️ DEFERRED — Components quá lớn (>400 dòng)

**Vấn đề**: Vi phạm Single Responsibility Principle, khó maintain và test.
**Quyết định**: DEFERRED — Architectural refactoring scope quá lớn (5 files, 700+→200 lines). Cần design decisions, new component APIs, route changes. Không nên bundle với type-only changes. Tách thành plan riêng.

| File                                                           | Số dòng | Đề xuất                                                                        |
| -------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------ |
| `src/features/fitness/hooks/useTrainingPlan.ts`                | ~700+   | Tách plan generation, split remapping, exercise matching thành utilities riêng |
| `src/App.tsx`                                                  | ~561    | Tách routing logic, tab rendering thành sub-components                         |
| `src/features/health-profile/components/HealthProfileForm.tsx` | ~488    | Tách từng section form thành sub-components                                    |
| `src/features/dashboard/components/WeightQuickLog.tsx`         | ~446    | Tách chart, form, history thành sub-components                                 |
| `src/features/dashboard/components/TodaysPlanCard.tsx`         | ~397    | Tách workout card, rest card, completed card                                   |

---

## 🟡 WARNING

### W-01: ✅ FIXED — `React.FC` anti-pattern (88 instances)

**Thư viện**: `react@^19.0.0`
**Vấn đề**: `React.FC` implicit thêm `children` prop (đã sửa trong React 18 types), và gây phức tạp khi dùng generics.
**Số lượng**: **88 instances** (verified) trong **68 files**
**Đã fix**: 2026-04-01 — 4 migration patterns:

- Pattern 1: Simple → inline props (31 files)
- Pattern 2: + React.memo → named function in memo (18 files)
- Pattern 3: displayName cast → `as unknown as { displayName: string }` (2 files)
- Pattern 4: Icon type → `React.ComponentType<P>` (3 files)

**Files bị ảnh hưởng** (trích):

- `src/components/CalendarTab.tsx`
- `src/components/DataBackup.tsx`
- `src/components/DishManager.tsx`
- `src/components/SettingsTab.tsx`
- `src/components/modals/*.tsx` (12 files)
- `src/components/shared/*.tsx` (8 files)
- `src/components/schedule/*.tsx` (6 files)
- `src/features/dashboard/components/*.tsx` (6 files)
- `src/features/fitness/components/*.tsx` (3 files)
- `src/contexts/*.tsx` (2 files)

**Migration**:

```typescript
// ❌ Anti-pattern
const MyComponent: React.FC<Props> = ({ title }) => { ... }

// ✅ Plain function
function MyComponent({ title }: Props) { ... }
// hoặc
const MyComponent = ({ title }: Props) => { ... }
```

---

### W-02: ❌ EXCLUDED — Console statements không dùng logger utility

**Vấn đề gốc**: Dự án có `src/utils/logger.ts` nhưng 7 files vẫn dùng `console.error/warn` trực tiếp.
**Lý do loại bỏ**: Logger API **KHÁC hoàn toàn** — `logger.error(ctx: LogContext, error)` cần `{ component, action }` object, KHÔNG phải drop-in replacement cho `console.error()`. ESLint cho phép `console.error/warn` (eslint.config.js line 21: `allow: ['warn', 'error']`). Vite tự drop ALL console trong production (vite.config.ts line 60: `drop: isProduction ? ['console', 'debugger'] : []`). Migration cần refactor ~46 call sites với context objects → high effort, zero runtime benefit.
**Số lượng**: ~46 instances trong 7 files

| File                                                    | Số lượng | Loại            |
| ------------------------------------------------------- | -------- | --------------- |
| `src/store/fitnessStore.ts`                             | ~23      | `console.error` |
| `src/features/fitness/hooks/useTrainingPlan.ts`         | ~5       | `console.error` |
| `src/features/fitness/components/WorkoutLogger.tsx`     | ~3       | `console.error` |
| `src/features/fitness/components/CardioLogger.tsx`      | ~3       | `console.error` |
| `src/services/geminiService.ts`                         | ~4       | `console.warn`  |
| `src/components/onboarding/HealthConfirmStep.tsx`       | ~2       | `console.error` |
| `src/components/onboarding/OnboardingErrorBoundary.tsx` | ~2       | `console.error` |

**Fix**: Thay `console.error(...)` → `logger.error(...)`, `console.warn(...)` → `logger.warn(...)`

---

### W-03: ✅ FIXED — i18next `fallbackLng` dùng string thay vì array

**Thư viện**: `i18next@^25.8.13`
**Vấn đề**: i18next v25+ khuyến nghị `fallbackLng` dạng array cho consistency.
**Số lượng**: 2 instances
**Đã fix**: 2026-04-01 — `fallbackLng: 'vi'` → `fallbackLng: ['vi']`

| File                     | Dòng |
| ------------------------ | ---- |
| `src/i18n.ts`            | 13   |
| `src/__tests__/setup.ts` | 9    |

**Fix**: `fallbackLng: 'vi'` → `fallbackLng: ['vi']`

---

### W-04: ❌ EXCLUDED — `valueAsNumber` kết hợp `z.preprocess()` gây conflict

**Vấn đề gốc**: Double coercion khi dùng `valueAsNumber` + `z.preprocess()`.
**Lý do loại bỏ**: `valueAsNumber` là valid RHF v7.72 option (Context7 confirmed). `Number()` coercion là idempotent: `Number(5)===5`, `Number(NaN)===NaN`. Validation vẫn fails/passes correctly. Double coercion vô hại — không gây NaN trên valid input.
**Số lượng**: 2 instances

| File                                                      | Dòng |
| --------------------------------------------------------- | ---- |
| `src/components/modals/IngredientEditModal.tsx`           | 174  |
| `src/features/fitness/components/TrainingProfileForm.tsx` | 237  |

**Fix**: Khi migrate sang `z.coerce.number()`, bỏ `valueAsNumber` khỏi `register()`.

---

### W-05: ✅ FIXED — Magic numbers không có constants

**Vấn đề**: Hard-coded values trong business logic khiến khó thay đổi và test.
**Đã fix**: 2026-04-01 — Extracted 5 constants: `PROTEIN_RATIO_MIN`, `WEIGHT_LOG_STALE_DAYS`, `STREAK_RECORD_DAYS_DIFF`, `ADHERENCE_THRESHOLD_PCT`, `WEIGHT_TREND_MIN_WEEKS`

| File                                                     | Ví dụ                                  | Đề xuất                      |
| -------------------------------------------------------- | -------------------------------------- | ---------------------------- |
| `src/features/dashboard/hooks/useInsightEngine.ts:46-60` | `"2-3L"`, `"10.000 bước"`, `"30 phút"` | Tạo `HEALTH_CONSTANTS`       |
| `src/features/dashboard/hooks/useInsightEngine.ts:117`   | `daysSinceWeightLog < 3`               | `WEIGHT_LOG_STALE_DAYS`      |
| `src/features/dashboard/hooks/useInsightEngine.ts:150`   | `autoDismissHours: 24`                 | `INSIGHT_AUTO_DISMISS_HOURS` |

---

## 🟢 INFO

### I-01: `@apply` trong Tailwind CSS v4

**Thư viện**: `tailwindcss@^4.1.14`
**Trạng thái**: Vẫn được hỗ trợ trong v4 nhưng không được khuyến khích.
**Số lượng**: 3 instances trong `src/index.css` (dòng 214, 217, 221)
**Ghi chú**: Chỉ dùng cho base styles (`border-border`, `bg-background`, `font-sans`) — acceptable.

---

### I-02: `.refine()` có thể dùng `.superRefine()` cho error handling tốt hơn

**Thư viện**: `zod@^4.3.6`
**Số lượng**: 5 instances

| File                                     | Dòng        | Ghi chú                                     |
| ---------------------------------------- | ----------- | ------------------------------------------- |
| `src/schemas/fitnessOnboardingSchema.ts` | 61, 71, 100 | Có thể dùng `superRefine` cho custom issues |
| `src/schemas/healthProfileSchema.ts`     | 45          | Cross-field validation                      |
| `src/schemas/cardioLoggerSchema.ts`      | 30          | Conditional validation                      |

**Ghi chú**: Không urgent — `.refine()` vẫn hoạt động tốt cho single-condition validations.

---

### I-03: `defaultProps` pattern trong test files

**Số lượng**: ~31 instances trong test files
**Ghi chú**: Đây là test fixtures (`const defaultProps = {...}`), KHÔNG phải `Component.defaultProps` deprecated. Không cần action.

---

### I-04: `var` trong global type declaration

**File**: `src/contexts/AuthContext.tsx:79`
**Code**: `declare global { var google: { accounts: GoogleAccountsNamespace } | undefined; }`
**Ghi chú**: Đây là TypeScript global augmentation pattern chuẩn, `var` bắt buộc trong context này. Không cần action.

---

### I-05: Các thư viện đã cập nhật đúng pattern

| Thư viện    | Pattern                                              | Trạng thái                           |
| ----------- | ---------------------------------------------------- | ------------------------------------ |
| Zustand v5  | Named import `{ create }`                            | ✅ Đúng                              |
| Zustand v5  | `useShallow` from `zustand/react/shallow`            | ✅ Đúng                              |
| Vite 6      | Config options                                       | ✅ Không có deprecated options       |
| Capacitor 8 | `capacitor.config.ts`                                | ✅ Đúng                              |
| Motion      | Import từ `motion/react`                             | ✅ Đúng (không phải `framer-motion`) |
| sql.js      | `initSqlJs()` config                                 | ✅ Đúng                              |
| Tailwind v4 | `@import "tailwindcss"` (không phải `@tailwind`)     | ✅ Đúng                              |
| TypeScript  | `tsconfig.json` options                              | ✅ Không có deprecated options       |
| ReactDOM    | `createRoot` (không phải `ReactDOM.render`)          | ✅ Đúng                              |
| React       | Không có `propTypes`, `createFactory`, `findDOMNode` | ✅ Sạch                              |

---

## Kế hoạch xử lý — Trạng thái

| Item | Trạng thái  | Ngày       | Ghi chú                                            |
| ---- | ----------- | ---------- | -------------------------------------------------- |
| C-01 | ⏸️ DEFERRED | —          | Revisit khi Zod 5 xóa `z.preprocess()`             |
| C-02 | ✅ FIXED    | 2026-04-01 | 38 instances → `{ error: }`                        |
| C-03 | ✅ FIXED    | 2026-04-01 | 4 instances (1 app + 3 test) → ref-as-prop         |
| C-04 | ⏸️ DEFERRED | —          | Tách plan riêng cho architectural refactoring      |
| W-01 | ✅ FIXED    | 2026-04-01 | 88 instances trong 68 files → plain functions      |
| W-02 | ❌ EXCLUDED | —          | Logger API khác, ESLint allows, Vite drops in prod |
| W-03 | ✅ FIXED    | 2026-04-01 | 2 files → `['vi']` array format                    |
| W-04 | ❌ EXCLUDED | —          | Idempotent coercion, harmless                      |
| W-05 | ✅ FIXED    | 2026-04-01 | 5 constants extracted                              |
| I-01 | No action   | —          | `@apply` still supported in Tailwind v4            |
| I-02 | ⏸️ DEFERRED | —          | `.refine()` works fine, low priority               |
| I-03 | No action   | —          | Test fixtures, not deprecated pattern              |
| I-04 | No action   | —          | Required TypeScript syntax                         |
| I-05 | No action   | —          | All libraries using correct patterns               |

### Quality Gates kết quả

- `npm run lint` → 0 errors ✅
- `npm run test` → 4365/4365 passed ✅
- `npm run build` → clean (1.96s) ✅
- Post-migration grep → 0 React.FC, 0 { message: }, 0 forwardRef ✅

---

## Ghi chú kỹ thuật

### Zod 4 Migration Reference

- `z.preprocess()` → `ZodPipe` (internal change, API vẫn hoạt động)
- `{ message }` → `{ error }` (deprecated, vẫn hoạt động)
- `invalid_type_error` / `required_error` → `error` callback function
- `ZodError.flatten()` → API không thay đổi
- `z.instanceof()` → Vẫn hoạt động nhưng kiểm tra lại compatibility

### React 19 Migration Reference

- `forwardRef` → ref as regular prop
- `React.FC` → plain function (không implicit `children`)
- `defaultProps` trên function components → default parameters
- `propTypes` → TypeScript types (đã hoàn thành)

### Zustand v5 — Đã tuân thủ đầy đủ

- Named imports ✅
- `useShallow` from correct path ✅
- `persist` middleware ✅
- No `zustand/context` ✅
