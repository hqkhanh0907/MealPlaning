# 🔍 Deprecation & Code Quality Audit

> **Ngày audit**: 2026-04-01
> **Phiên bản dự án**: MealPlaning v1.x
> **Công cụ**: Context7 MCP, codebase static analysis
> **Phạm vi**: Toàn bộ `src/` (không bao gồm `node_modules/`, `dist/`)

---

## Tổng quan

| Mức độ | Số lượng | Mô tả |
|--------|----------|-------|
| 🔴 CRITICAL | 4 | Cần xử lý ngay — API đã bị xóa hoặc thay đổi breaking |
| 🟡 WARNING | 5 | Nên xử lý — deprecated nhưng vẫn hoạt động, sẽ bị xóa trong tương lai |
| 🟢 INFO | 5 | Ghi nhận — anti-pattern hoặc cải thiện chất lượng code |

---

## 🔴 CRITICAL

### C-01: Zod 4 — `z.preprocess()` deprecated

**Thư viện**: `zod@^4.3.6`
**Vấn đề**: `z.preprocess()` không còn trả về `ZodPreprocess` mà trả về `ZodPipe`. API vẫn hoạt động nhưng đã deprecated và sẽ bị xóa. Nên dùng `z.pipe()` hoặc `z.coerce`.
**Số lượng**: 6 instances

| File | Dòng | Field |
|------|------|-------|
| `src/schemas/ingredientEditSchema.ts` | 10 | `caloriesPer100` |
| `src/schemas/ingredientEditSchema.ts` | 14 | `proteinPer100` |
| `src/schemas/ingredientEditSchema.ts` | 18 | `carbsPer100` |
| `src/schemas/ingredientEditSchema.ts` | 22 | `fatPer100` |
| `src/schemas/ingredientEditSchema.ts` | 26 | `fiberPer100` |
| `src/schemas/trainingProfileSchema.ts` | 52 | `avgSleepHours` |

**Migration**:
```typescript
// ❌ Zod 3/4 deprecated
z.preprocess(
  val => (val === '' || val === undefined || val === null ? undefined : Number(val)),
  z.number().min(0)
)

// ✅ Zod 4 recommended
z.union([z.literal(''), z.coerce.number().min(0)])
// hoặc
z.pipe(z.unknown(), z.transform(val => val === '' ? undefined : Number(val)), z.number().min(0))
```

---

### C-02: Zod 4 — `message` parameter deprecated → dùng `error`

**Thư viện**: `zod@^4.3.6`
**Vấn đề**: Zod 4 thống nhất error customization dưới tham số `error`, thay thế `message`, `invalid_type_error`, `required_error`.
**Số lượng**: 28 instances

| File | Ví dụ |
|------|-------|
| `src/schemas/ingredientEditSchema.ts` | `z.number({ message: 'Vui lòng nhập giá trị' })` |
| `src/schemas/trainingProfileSchema.ts` | `.min(3, { message: 'Giờ ngủ tối thiểu là 3' })` |
| `src/schemas/healthProfileSchema.ts` | `.refine(..., { message: '...' })` |
| `src/schemas/cardioLoggerSchema.ts` | `.refine(..., { message: '...' })` |
| `src/schemas/saveAnalyzedDishSchema.ts` | `.refine(..., { message: '...' })` |
| `src/schemas/fitnessOnboardingSchema.ts` | `.refine(..., { message: '...' })` |
| `src/schemas/dishEditSchema.ts` | Various `.min()`, `.max()` calls |
| `src/schemas/workoutLoggerSchema.ts` | Various validation messages |
| `src/schemas/customExerciseSchema.ts` | Various validation messages |
| `src/schemas/saveTemplateSchema.ts` | Various validation messages |
| `src/components/onboarding/onboardingSchema.ts` | `.refine(..., { message: '...' })` |

**Migration**:
```typescript
// ❌ Zod 3 (deprecated in Zod 4)
z.string().min(5, { message: "Too short." });
z.string({ invalid_type_error: "Not a string", required_error: "Required" });

// ✅ Zod 4
z.string().min(5, { error: "Too short." });
z.string({
  error: (issue) => issue.input === undefined ? "Required" : "Not a string"
});
```

---

### C-03: React 19 — `forwardRef` deprecated (app code)

**Thư viện**: `react@^19.0.0`
**Vấn đề**: React 19 cho phép truyền `ref` như một prop thông thường. `forwardRef` vẫn hoạt động nhưng sẽ bị xóa trong phiên bản tương lai.
**Số lượng**: 1 instance trong app code, 4 trong test code

| File | Dòng | Context |
|------|------|---------|
| `src/components/form/StringNumberController.tsx` | 137 | `React.forwardRef(StringNumberControllerInner)` |
| `src/__tests__/authContext.test.tsx` | 51 | Test mock (low priority) |
| `src/__tests__/unifiedOnboardingIntegration.test.tsx` | 109 | Test mock (low priority) |
| `src/__tests__/unifiedOnboarding.test.tsx` | 156 | Test mock (low priority) |

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

### C-04: Components quá lớn (>400 dòng)

**Vấn đề**: Vi phạm Single Responsibility Principle, khó maintain và test.

| File | Số dòng | Đề xuất |
|------|---------|---------|
| `src/features/fitness/hooks/useTrainingPlan.ts` | ~700+ | Tách plan generation, split remapping, exercise matching thành utilities riêng |
| `src/App.tsx` | ~561 | Tách routing logic, tab rendering thành sub-components |
| `src/features/health-profile/components/HealthProfileForm.tsx` | ~488 | Tách từng section form thành sub-components |
| `src/features/dashboard/components/WeightQuickLog.tsx` | ~446 | Tách chart, form, history thành sub-components |
| `src/features/dashboard/components/TodaysPlanCard.tsx` | ~397 | Tách workout card, rest card, completed card |

---

## 🟡 WARNING

### W-01: `React.FC` anti-pattern (77 instances)

**Thư viện**: `react@^19.0.0`
**Vấn đề**: `React.FC` implicit thêm `children` prop (đã sửa trong React 18 types), và gây phức tạp khi dùng generics. React community khuyến nghị dùng plain function signatures.
**Số lượng**: 77 instances trong 64 files

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

### W-02: Console statements không dùng logger utility

**Vấn đề**: Dự án có `src/utils/logger.ts` nhưng 7 files vẫn dùng `console.error/warn` trực tiếp. Không kiểm soát được log level trong production.
**Số lượng**: ~46 instances trong 7 files

| File | Số lượng | Loại |
|------|----------|------|
| `src/store/fitnessStore.ts` | ~23 | `console.error` |
| `src/features/fitness/hooks/useTrainingPlan.ts` | ~5 | `console.error` |
| `src/features/fitness/components/WorkoutLogger.tsx` | ~3 | `console.error` |
| `src/features/fitness/components/CardioLogger.tsx` | ~3 | `console.error` |
| `src/services/geminiService.ts` | ~4 | `console.warn` |
| `src/components/onboarding/HealthConfirmStep.tsx` | ~2 | `console.error` |
| `src/components/onboarding/OnboardingErrorBoundary.tsx` | ~2 | `console.error` |

**Fix**: Thay `console.error(...)` → `logger.error(...)`, `console.warn(...)` → `logger.warn(...)`

---

### W-03: i18next `fallbackLng` dùng string thay vì array

**Thư viện**: `i18next@^25.8.13`
**Vấn đề**: i18next v25+ khuyến nghị `fallbackLng` dạng array cho consistency.
**Số lượng**: 2 instances

| File | Dòng |
|------|------|
| `src/i18n.ts` | 13 |
| `src/__tests__/setup.ts` | 9 |

**Fix**: `fallbackLng: 'vi'` → `fallbackLng: ['vi']`

---

### W-04: `valueAsNumber` kết hợp `z.preprocess()` gây conflict

**Thư viện**: `react-hook-form@^7.72.0` + `zod@^4.3.6`
**Vấn đề**: `valueAsNumber` trong RHF `register()` đã coerce value sang number, nhưng `z.preprocess()` cũng làm điều tương tự → double coercion, có thể gây NaN.
**Số lượng**: 2 instances

| File | Dòng |
|------|------|
| `src/components/modals/IngredientEditModal.tsx` | 174 |
| `src/features/fitness/components/TrainingProfileForm.tsx` | 237 |

**Fix**: Khi migrate sang `z.coerce.number()`, bỏ `valueAsNumber` khỏi `register()`.

---

### W-05: Magic numbers không có constants

**Vấn đề**: Hard-coded values trong business logic khiến khó thay đổi và test.

| File | Ví dụ | Đề xuất |
|------|-------|---------|
| `src/features/dashboard/hooks/useInsightEngine.ts:46-60` | `"2-3L"`, `"10.000 bước"`, `"30 phút"` | Tạo `HEALTH_CONSTANTS` |
| `src/features/dashboard/hooks/useInsightEngine.ts:117` | `daysSinceWeightLog < 3` | `WEIGHT_LOG_STALE_DAYS` |
| `src/features/dashboard/hooks/useInsightEngine.ts:150` | `autoDismissHours: 24` | `INSIGHT_AUTO_DISMISS_HOURS` |

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

| File | Dòng | Ghi chú |
|------|------|---------|
| `src/schemas/fitnessOnboardingSchema.ts` | 61, 71, 100 | Có thể dùng `superRefine` cho custom issues |
| `src/schemas/healthProfileSchema.ts` | 45 | Cross-field validation |
| `src/schemas/cardioLoggerSchema.ts` | 30 | Conditional validation |

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

| Thư viện | Pattern | Trạng thái |
|----------|---------|------------|
| Zustand v5 | Named import `{ create }` | ✅ Đúng |
| Zustand v5 | `useShallow` from `zustand/react/shallow` | ✅ Đúng |
| Vite 6 | Config options | ✅ Không có deprecated options |
| Capacitor 8 | `capacitor.config.ts` | ✅ Đúng |
| Motion | Import từ `motion/react` | ✅ Đúng (không phải `framer-motion`) |
| sql.js | `initSqlJs()` config | ✅ Đúng |
| Tailwind v4 | `@import "tailwindcss"` (không phải `@tailwind`) | ✅ Đúng |
| TypeScript | `tsconfig.json` options | ✅ Không có deprecated options |
| ReactDOM | `createRoot` (không phải `ReactDOM.render`) | ✅ Đúng |
| React | Không có `propTypes`, `createFactory`, `findDOMNode` | ✅ Sạch |

---

## Kế hoạch xử lý (Priority Order)

### Phase 1: Breaking Changes (CRITICAL)
1. **C-01**: Migrate `z.preprocess()` → `z.coerce` / `z.pipe()` (6 instances)
2. **C-02**: Migrate Zod `{ message }` → `{ error }` (28 instances)
3. **C-03**: Migrate `forwardRef` → ref-as-prop (1 app file)

### Phase 2: Anti-patterns (WARNING)
4. **W-01**: Refactor `React.FC` → plain functions (77 instances, batch refactor)
5. **W-02**: Replace `console.*` → `logger.*` (46 instances, 7 files)
6. **W-03**: Fix `fallbackLng` format (2 files)
7. **W-04**: Remove `valueAsNumber` khi dùng `z.coerce` (2 files)
8. **W-05**: Extract magic numbers (1 file)

### Phase 3: Code Architecture (CRITICAL — long-term)
9. **C-04**: Split large components (5 files, >400 lines each)

### Phase 4: Nice-to-have (INFO)
10. **I-02**: Evaluate `.refine()` → `.superRefine()` migration
11. **I-01**: Reduce `@apply` usage

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
