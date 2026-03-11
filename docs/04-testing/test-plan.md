# Test Plan — Smart Meal Planner

**Version:** 6.0  
**Date:** 2026-03-11  
**Author:** Dev Team

---

## 1. Phạm vi kiểm thử

### 1.1 Trong scope

| Module | Unit Tests | E2E Tests | Manual |
|--------|-----------|----------|--------|
| Calendar / Meal Planning | ✅ | ✅ | ✅ |
| Library (Ingredients & Dishes) | ✅ | ✅ | ✅ |
| AI Image Analysis | ✅ (mock) | ✅ | ✅ |
| AI Meal Suggestion | ✅ (mock) | ✅ | ✅ |
| Grocery List | ✅ | ✅ | ✅ |
| Settings & Profile | ✅ | ✅ | ✅ |
| Data Backup (Import/Export) | ✅ | ✅ | ✅ |
| i18n (vi/en) | ✅ | ✅ | - |
| localStorage persistence | ✅ | ✅ | - |
| Navigation | - | ✅ | ✅ |
| Responsive UI | ✅ | ✅ | ✅ |
| Detail Modal | ✅ | ✅ | ✅ |
| Delete Guard & Undo | ✅ | ✅ | ✅ |
| Error Handling | ✅ | ✅ | - |
| Deep Integration | - | ✅ | ✅ |
| Dark Mode Visual QA | ✅ | - | ✅ (Chrome DevTools) |

### 1.2 Ngoài scope

- Tính năng multi-device sync (chưa có)
- Backend API (không có)
- iOS (chỉ build Android)
- Performance testing / load testing

---

## 2. Môi trường kiểm thử

### Unit Tests (Vitest)

| | Chi tiết |
|--|---------|
| Framework | Vitest 4.x |
| Môi trường | jsdom (Node.js) |
| Mocking | `vi.mock()`, `vi.fn()` |
| Coverage | V8 provider |
| Config | `vitest.config.ts` |

### E2E Tests (WebdriverIO + Appium)

| | Chi tiết |
|--|---------|
| Framework | WebdriverIO v9 |
| Mobile driver | Appium 2 + UiAutomator2 |
| Platform | Android API 36 |
| Device | AVD `Medium_Phone_API_36.1` (411×914px) |
| App context | WEBVIEW_com.mealplaner.app |
| Config | `e2e/wdio.conf.ts` |

---

## 3. Chiến lược kiểm thử

### 3.1 Test Pyramid

```
        ┌─────────────┐
        │   Manual    │  5% — exploratory, accessibility
        ├─────────────┤
        │  E2E Tests  │  25% — 24 spec files, happy path + critical flows + deep integration
        ├─────────────┤
        │ Unit Tests  │  70% — services, utils, hooks, components
        └─────────────┘
```

### 3.2 Nguyên tắc

1. **Unit tests trước** — mọi business logic phải có unit test trước khi merge
2. **Mock external** — AI API (`geminiService`) luôn được mock trong unit tests
3. **E2E cho critical paths** — mỗi main feature có ít nhất 1 E2E happy path
4. **Regression protection** — bug fix phải kèm test case tương ứng
5. **Green CI required** — không merge khi tests fail

---

## 4. Mức độ coverage yêu cầu

| Level | Target | Actual (2026-03-11) |
|-------|--------|---------------------|
| Overall Statements | ≥ 80% | **99.46%** ✅ (↑ từ 90.51%) |
| Overall Branches | ≥ 75% | **92.51%** ✅ (↑ từ 83.80%) |
| Overall Functions | ≥ 85% | **99.41%** ✅ (↑ từ 87.76%) |
| Overall Lines | ≥ 80% | **100%** ✅ (↑ từ 92.76%) |
| Services | ≥ 90% | **99.73%** ✅ |
| Utils | ≥ 90% | **100%** ✅ |
| Components | ≥ 75% | **99.33%** ✅ |
| Hooks | ≥ 85% | **99.74%** ✅ |
| Contexts | ≥ 85% | **98.98%** ✅ |

> **Note:** Unit tests: **1201 tests** across **57 test files** (cập nhật 2026-03-11). Coverage vượt xa target ≥80%. Branch coverage 92.51% — chấp nhận được do một số defensive code paths không thể trigger trong test environment.

---

## 5. Test Types

### 5.1 Unit Tests

**Scope:** Functions, hooks, components, services  
**Location:** `src/**/__tests__/` và `src/**/*.test.tsx`  
**Conventions:**
- Mô tả behavior, không mô tả implementation
- Arrange → Act → Assert pattern
- Một test chỉ verify một behavior

**Các nhóm unit tests:**
- `aiImageAnalyzer.test.tsx` — AI image analysis
- `geminiService.test.ts` — AI service với mock
- `dataService.test.ts` — CRUD và migration
- `planService.test.ts` — meal planning logic
- `calorieCalculator.test.ts` — calo calculation
- `IngredientEditModal.test.tsx` — modal UI behavior
- `CalendarTab.test.tsx` — calendar interactions
- `usePersistedState.test.ts` — localStorage hook

### 5.2 Integration Tests (Unit level)

Tests kiểm tra tương tác giữa components và services mà không mount full app:
- `IngredientManager + dataService`: save → persist → reload
- `GeminiService + retry logic`: error → retry → success

### 5.3 E2E Tests

**Scope:** User flows trên Android emulator  
**Location:** `e2e/specs/`  
**Format:** One spec file per feature domain

| Spec | Feature | Test Cases |
|------|---------|-----------|
| `01-navigation.spec.ts` | Tab navigation | 3 |
| `02-calendar-basic.spec.ts` | Calendar UI + clear | 10 |
| `03-dish-crud.spec.ts` | Dish management | 13 |
| `04-ingredient-crud.spec.ts` | Ingredient CRUD | 12 |
| `05-planning.spec.ts` | Meal planning (MealPlannerModal direct) | 5 |
| `06-grocery.spec.ts` | Grocery scope switching | 6 |
| `07-settings.spec.ts` | Language & theme | 5 |
| `08-data-backup.spec.ts` | Export/Import | 5 |
| `09-ai-analysis.spec.ts` | AI features | 5 |
| `10-goal-settings.spec.ts` | Goals & profile | 7 |
| `11-dish-ingredient-amount.spec.ts` | Ingredient amounts | 4 |
| `12-sort-filter-view.spec.ts` | Sort, filter, view toggle | 16 |
| `13-grocery-aggregation.spec.ts` | Grocery quantities | 5 |
| `14-responsive-ui.spec.ts` | Bottom nav, layout, touch targets | 7 |
| `15-i18n-language.spec.ts` | Language switching, persistence | 7 |
| `16-detail-modal.spec.ts` | Detail modal views | 5 |
| `17-delete-undo.spec.ts` | Delete guard & undo toast | 5 |
| `18-error-edge-cases.spec.ts` | Empty states, theme CSS, error boundary | 5 |
| `19-calendar-extended.spec.ts` | Progress bars, nutrition summary | 5 |
| `20-grocery-extended.spec.ts` | Scope, strikethrough, celebration | 6 |
| `21-ai-extended.spec.ts` | AI components verification | 6 |
| `22-data-backup-extended.spec.ts` | Export structure, import restore | 5 |
| `23-integration-data-flow.spec.ts` | Ingredient→Dish→Calendar→Grocery cascade | 7 |
| `24-integration-multiday-crosstab.spec.ts` | Multi-day grocery, cross-tab lang/theme, nutrition cascade | 10 |

#### 5.3.1 Deep Integration Tests

Specs 23–24 kiểm tra luồng dữ liệu xuyên suốt toàn bộ ứng dụng:

- **`23-integration-data-flow`**: Cascade test — tạo Ingredient → gắn vào Dish → lên Calendar → kiểm tra Grocery list tự động cập nhật. Xác nhận tính nhất quán dữ liệu end-to-end.
- **`24-integration-multiday-crosstab`**: Multi-day grocery aggregation (cùng ingredient trên nhiều ngày phải cộng dồn), cross-tab consistency (đổi ngôn ngữ/theme ở Settings tab → phản ánh tức thì trên Calendar/Library), và nutrition cascade (thay đổi calo ingredient → Dish/Calendar tự cập nhật).

---

## 6. Test Data

### 6.1 Test Fixtures

```typescript
// Test data chuẩn được dùng trong unit tests
const testIngredient: Ingredient = {
  id: 'test-ing-001',
  name: { vi: 'Thịt bò test', en: 'Test Beef' },
  unit: { vi: '100g', en: '100g' },
  calories: 250,
  protein: 26,
  tags: ['meat'],
};

const testDish: Dish = {
  id: 'test-dish-001',
  name: { vi: 'Món test', en: 'Test Dish' },
  ingredients: [{ ingredientId: 'test-ing-001', quantity: 2 }],
};
```

### 6.2 E2E Test Data

E2E tests tạo dữ liệu programmatically qua UI và inject dữ liệu qua localStorage (`injectTestData` pattern) để đảm bảo test isolation. Mỗi spec có thể seed trạng thái riêng mà không phụ thuộc vào thứ tự chạy hoặc kết quả của spec khác.

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| AI API flaky | High | Medium | Mock trong unit tests, retry trong integration |
| Emulator instability | Medium | High | noReset, reset localStorage trước mỗi spec |
| localStorage race condition | Low | Medium | Synchronous read/write, không async |
| WebView context switch failure | Medium | High | ensureWebviewsHavePages, wait strategies |
| **Schema doc drift** | **Low** | **Medium** | **Quy tắc: cập nhật localstorage-schema.md cùng PR khi thay đổi types.ts — BUG-DOC-001 CLOSED** |
| Coverage drop dưới target | Low | Low | CI fail khi coverage < threshold; 100% đã đạt được |
| **Console errors (favicon, etc.)** | **Low** | **Low** | **QA DevTools monitoring — BUG-FAVICON-001 CLOSED** |
| **Chrome 91 ES2022 incompatibility** | **Medium** | **High** | **Tránh `Array.at()`, `structuredClone()`; sử dụng polyfills/alternatives tương thích** |
| **React 18 `_valueTracker`** | **Medium** | **Medium** | **Programmatic input phải invalidate `_valueTracker` trước khi dispatch event** |

> **Tham khảo:** Xem [coding-guidelines.md](../03-developer-guide/coding-guidelines.md) để mitigate coding-related risks.
>
> **Scenario-based test cases:** [scenario-analysis-and-testcases.md](scenario-analysis-and-testcases.md) — 799 test cases across 15 scenarios (v2.0, mỗi scenario 50+ TCs).

---

## 8. Test Schedule

| Giai đoạn | Loại test | Khi nào chạy |
|-----------|-----------|-------------|
| Pre-commit | Unit tests | `npm run test` — developer local |
| Pre-merge | Unit + lint + coverage | CI pipeline |
| Release candidate | E2E full suite | Trước mỗi APK build |
| Post-release | E2E smoke (01, 02, 07) | Sau khi cài APK lên device |
| On-demand | E2E full suite | CI workflow `.github/workflows/e2e.yml` — `workflow_dispatch` trigger |
