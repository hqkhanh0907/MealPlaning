# Test Plan — Smart Meal Planner

**Version:** 8.0  
**Date:** 2026-03-27  
**Author:** Dev Team

---

## 1. Phạm vi kiểm thử

### 1.1 Trong scope

| Module | Unit Tests | E2E Tests | Manual | Scenarios |
|--------|-----------|----------|--------|-----------|
| Calendar / Meal Planning | ✅ | ✅ | ✅ | SC01 |
| Library (Ingredients & Dishes) | ✅ | ✅ | ✅ | SC06-07 |
| AI Image Analysis | ✅ (mock) | ✅ | ✅ | SC05 |
| AI Meal Suggestion | ✅ (mock) | ✅ | ✅ | SC04 |
| Grocery List | ✅ | ✅ | ✅ | SC14 |
| Settings & Profile | ✅ | ✅ | ✅ | SC08-09 |
| Data Backup (Import/Export) | ✅ | ✅ | ✅ | SC16 |
| i18n (Tiếng Việt) | ✅ | - | - | SC23 |
| localStorage persistence | ✅ | ✅ | - | SC24 |
| Navigation | ✅ | ✅ | ✅ | SC38 |
| Responsive UI | ✅ | ✅ | ✅ | SC18 |
| Detail Modal | ✅ | ✅ | ✅ | — |
| Delete Guard & Undo | ✅ | ✅ | ✅ | — |
| Error Handling | ✅ | ✅ | - | — |
| Deep Integration | ✅ | ✅ | ✅ | SC38 |
| Dark Mode Visual QA | ✅ | - | ✅ (Chrome DevTools) | SC22 |
| **Fitness Tab & Onboarding** | **✅** | **-** | **✅** | **SC25** |
| **Training Plan View** | **✅** | **-** | **✅** | **SC26** |
| **Workout Logging (Strength)** | **✅** | **-** | **✅** | **SC27** |
| **Cardio Logging** | **✅** | **-** | **✅** | **SC28** |
| **Workout History** | **✅** | **-** | **✅** | **SC29** |
| **Progress Dashboard** | **✅** | **-** | **✅** | **SC30** |
| **Daily Weight Input** | **✅** | **-** | **✅** | **SC31** |
| **Gamification System** | **✅** | **-** | **✅** | **SC32** |
| **Dashboard Score & Layout** | **✅** | **-** | **✅** | **SC33** |
| **Energy Balance & Protein** | **✅** | **-** | **✅** | **SC34** |
| **Today's Plan Card** | **✅** | **-** | **✅** | **SC35** |
| **Quick Actions & Weight Log** | **✅** | **-** | **✅** | **SC36** |
| **Auto-Adjust & Insights** | **✅** | **-** | **✅** | **SC37** |
| **Cross-Feature Navigation** | **✅** | **-** | **✅** | **SC38** |
| **WCAG Accessibility** | **✅** | **-** | **✅** | **SC39** |
| **Migration & Sync V2** | **✅** | **-** | **✅** | **SC40** |
| **Fitness Plan Flexibility — Multi-Session** | **✅** | **-** | **✅** | **SC41** |
| **Fitness Plan Flexibility — Plan Day Editor** | **✅** | **-** | **✅** | **SC42** |
| **Fitness Plan Flexibility — Freestyle Workout** | **✅** | **-** | **✅** | **SC43** |

### 1.3 Fitness Plan Flexibility — Chi tiết phạm vi

| Component | Mô tả | Unit | Manual | Scenarios |
|-----------|--------|------|--------|-----------|
| SessionTabs | Hiển thị / ẩn tabs khi có 1 hoặc nhiều session | ✅ | ✅ | SC41 |
| AddSessionModal | Modal thêm session mới (Strength / Cardio / Freestyle) | ✅ | ✅ | SC41 |
| PlanDayEditor | Full-screen page chỉnh sửa bài tập trong ngày (reorder, add, remove) | ✅ | ✅ | SC42 |
| WorkoutLogger (freestyle mode) | Chế độ tập tự do không theo plan, lưu với planDayId=null | ✅ | ✅ | SC43 |
| PageStackRenderer | Overlay rendering cho fitness full-screen pages (PlanDayEditor, WorkoutLogger) | ✅ | ✅ | SC41-43 |
| Schema v2 migration | Migration thêm session_order, original_exercises, plan_day_id | ✅ | ✅ | SC41 |

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

| Level | Target | Actual (2026-03-26) |
|-------|--------|---------------------|
| Overall Statements | ≥ 80% | **98.93%** ✅ |
| Overall Branches | ≥ 75% | **92.97%** ✅ |
| Overall Functions | ≥ 85% | **98.92%** ✅ |
| Overall Lines | ≥ 80% | **99.51%** ✅ |
| Services | ≥ 90% | **99%+** ✅ |
| Utils | ≥ 90% | **100%** ✅ |
| Components | ≥ 75% | **99%+** ✅ |
| Hooks | ≥ 85% | **99%+** ✅ |
| Contexts | ≥ 85% | **98%+** ✅ |

> **Note:** Unit tests: **2860 tests** across **125 test files** (cập nhật 2026-03-26). Coverage vượt xa target ≥80%. Branch coverage 92.97% — chấp nhận được do một số defensive code paths không thể trigger trong test environment. Lazy loading + code splitting không ảnh hưởng coverage.
>
> **Manual scenario test cases:** 43 scenarios, **4,603 manual test cases** (SC01-SC43). Xem thư mục `docs/04-testing/scenarios/`.

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
| `15-i18n-language.spec.ts` | Vietnamese-only UI verification, theme persistence | 7 |
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
- **`24-integration-multiday-crosstab`**: Multi-day grocery aggregation (cùng ingredient trên nhiều ngày phải cộng dồn), cross-tab consistency (đổi theme ở Settings tab → phản ánh tức thì trên Calendar/Library), và nutrition cascade (thay đổi calo ingredient → Dish/Calendar tự cập nhật).

---

## 6. Test Data

### 6.1 Test Fixtures

```typescript
// Test data chuẩn được dùng trong unit tests
const testIngredient: Ingredient = {
  id: 'test-ing-001',
  name: { vi: 'Thịt bò test' },
  unit: { vi: '100g' },
  caloriesPer100: 250,
  proteinPer100: 26,
};

const testDish: Dish = {
  id: 'test-dish-001',
  name: { vi: 'Món test' },
  ingredients: [{ ingredientId: 'test-ing-001', amount: 200 }],
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
> **Scenario-based test cases:** 43 scenarios (SC01-SC43), **4,603 test cases** across:
> - SC01-SC10: Core features (Calendar, Meal Planner, Nutrition, AI, Ingredients, Dishes, Settings, Goals, Copy) — 1,050 TCs
> - SC11-SC16: Plan Management (Clear Plan, Template Manager, Save Template, Grocery, Translation, Backup) — 1,260 TCs (210 TCs/scenario)
> - SC17-SC24: Extended features (Google Drive, Responsive, Preview, Filter, AI Ingredients, Dark Mode, i18n, Migration) — 945 TCs
> - SC25-SC32: Fitness (Onboarding, Training, Workout, Cardio, History, Progress, Weight, Gamification) — 440 TCs
> - SC33-SC36: Dashboard (Score Layout, Energy/Protein, Plan, Quick Actions) — 464 TCs
> - SC37-SC40: Integration (Auto-Adjust, Navigation, WCAG, Migration V2) — 375 TCs
> - SC41-SC43: Fitness Flexibility (Multi-Session, Plan Day Editor, Freestyle Workout) — 69 TCs
>
> Xem thư mục `docs/04-testing/scenarios/` cho chi tiết từng scenario.

---

## 8. Test Schedule

| Giai đoạn | Loại test | Khi nào chạy |
|-----------|-----------|-------------|
| Pre-commit | Unit tests | `npm run test` — developer local |
| Pre-merge | Unit + lint + coverage | CI pipeline |
| Release candidate | E2E full suite | Trước mỗi APK build |
| Post-release | E2E smoke (01, 02, 07) | Sau khi cài APK lên device |
| On-demand | E2E full suite | CI workflow `.github/workflows/e2e.yml` — `workflow_dispatch` trigger |

---

## 9. Test Closure — Fitness Plan Flexibility (SC41-SC43)

**Date:** 2026-03-29  
**Features:** Multi-Session System (SC41), Plan Day Editor (SC42), Freestyle Workout (SC43)

### 9.1 Test Execution Summary

| Metric | Value |
|--------|-------|
| Total TC_FLEX Cases | 23 |
| Executed (Manual) | 15 (representative subset covering all 3 features + PageStack) |
| Passed | **15/15** (100%) |
| Remaining 8 TCs | Covered by unit tests (Zustand store logic, SQLite persistence) |

### 9.2 Bugs Found & Fixed

| Bug ID | Severity | Description | Fix Commit | Status |
|--------|----------|-------------|------------|--------|
| BUG-FLEX-001 | P0 Critical | PageStack rendering — `pushPage()` entries not rendered by `App.tsx`. Added `PageStackOverlay` with lazy-loaded WorkoutLogger, CardioLogger, PlanDayEditor. | `6954146` | ✅ Fixed & Verified |
| BUG-FLEX-002 | P1 Major | SessionTabs hidden when `sessions.length === 1` — chicken-and-egg problem. Changed condition from `> 1` to `>= 1`. | `9b58051` | ✅ Fixed & Verified |

### 9.3 Final Build Verification

| Check | Result |
|-------|--------|
| All 15 manual TCs passed | ✅ |
| Chrome DevTools Console — 0 errors | ✅ |
| Chrome DevTools Console — 0 warnings | ✅ |
| Navigation flows (pushPage/popPage) | ✅ |
| Data persistence (Zustand + SQLite) | ✅ |
| Build status | ✅ Stable |

> **Full report:** [reports/test-report-fitness-flexibility.md](reports/test-report-fitness-flexibility.md)
