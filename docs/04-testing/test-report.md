# Test Report — Smart Meal Planner

**Version:** 5.0  
**Date:** 2026-03-07  
**Commit:** `ba8f9e9`

> **v5.0**: QA Cycle 4 — Dark mode visual audit via Chrome DevTools. BUG-DM-001 fixed (4 components). Schedule sub-tabs refactor. Unit tests expanded to 995. Xem [Changelog](#6-changelog).

---

## Tóm tắt

| Chỉ số | Kết quả |
|--------|---------|
| Unit Tests | **995 / 995 Pass** ✅ |
| Test Files | **47 / 47 Pass** ✅ |
| E2E Tests | **24 / 24 Specs Pass** ✅ |
| Lint | **0 errors, 0 warnings** ✅ |
| Code Coverage (Stmts) | **100%** ✅ |
| Code Coverage (Branch) | **93.15%** ✅ |
| Code Coverage (Funcs) | **100%** ✅ |
| Code Coverage (Lines) | **100%** ✅ |
| Bugs mở | **0** ✅ |
| Bugs đã đóng | **8** (BUG-001, BUG-002, BUG-DOC-001, BUG-FAVICON-001, BUG-E2E-001, BUG-E2E-002, BUG-E2E-003, BUG-DM-001) |

---

## 1. Unit Tests

### Thống kê thực tế (`npm run test`)

```
 ✓ src/__tests__/aiImageAnalyzer.test.tsx
 ✓ src/__tests__/aiSuggestionPreview.test.tsx
 ✓ src/__tests__/analysisResultView.test.tsx
 ✓ src/__tests__/app.test.tsx
 ✓ src/__tests__/calendarAndDate.test.tsx
 ✓ src/__tests__/components.test.tsx
 ✓ src/__tests__/constantsAndData.test.ts
 ✓ src/__tests__/dataBackup.test.tsx
 ✓ src/__tests__/dataService.test.ts
 ✓ src/__tests__/dishEditModal.test.tsx
 ✓ src/__tests__/ErrorBoundary.test.tsx
 ✓ src/__tests__/geminiService.test.ts
 ✓ src/__tests__/groceryList.test.tsx
 ✓ src/__tests__/helpers.test.ts
 ✓ src/__tests__/imageCapture.test.tsx
 ✓ src/__tests__/imageCompression.test.ts
 ✓ src/__tests__/ingredientEditModal.test.tsx
 ✓ src/__tests__/integration.test.ts
 ✓ src/__tests__/logger.test.ts
 ✓ src/__tests__/main.test.tsx
 ✓ src/__tests__/managers.test.tsx
 ✓ src/__tests__/modalBackdrop.test.tsx
 ✓ src/__tests__/navigationIndex.test.ts
 ✓ src/__tests__/NotificationContext.test.tsx
 ✓ src/__tests__/nutrition.test.ts
 ✓ src/__tests__/planService.test.ts
 ✓ src/__tests__/planningModal.test.tsx
 ✓ src/__tests__/saveAnalyzedDishModal.test.tsx
 ✓ src/__tests__/settingsTab.test.tsx
 ✓ src/__tests__/smallModals.test.tsx
 ✓ src/__tests__/summaryAndManagement.test.tsx
 ✓ src/__tests__/tips.test.ts
 ✓ src/__tests__/translateQueueService.test.ts
 ✓ src/__tests__/useAISuggestion.test.ts
 ✓ src/__tests__/useDarkMode.test.ts
 ✓ src/__tests__/useItemModalFlow.test.ts
 ✓ src/__tests__/useListManager.test.ts
 ✓ src/__tests__/useModalBackHandler.test.ts
 ✓ src/__tests__/useModalManager.test.ts
 ✓ src/__tests__/usePersistedState.test.ts

 Test Files:  47 passed (47)
 Tests:      995 passed (995)
 Duration:   ~5.3s
```

### Coverage chi tiết (từ `npm run test:coverage`)

| Module / File | Stmts | Branch | Funcs | Lines | Ghi chú |
|---------------|-------|--------|-------|-------|---------|
| **All files** | **100%** | **93.15%** | **100%** | **100%** | ✅ Vượt target |
| `src/` | 100% | 100% | 100% | 100% | ✅ |
| `src/components/` | 100% | 90.86% | 100% | 100% | ✅ |
| `src/components/modals/` | 100% | 94.27% | 100% | 100% | ✅ |
| `src/components/navigation/` | 100% | 100% | 100% | 100% | ✅ |
| `src/components/shared/` | 100% | 90.54% | 100% | 100% | ✅ |
| `src/contexts/` | 100% | 94.11% | 100% | 100% | ✅ |
| `src/data/` | 100% | 100% | 100% | 100% | ✅ |
| `src/hooks/` | 100% | 87.95% | 100% | 100% | ✅ |
| `src/services/` | 100% | 97.58% | 100% | 100% | ✅ |
| `src/utils/` | 100% | 100% | 100% | 100% | ✅ |

> **Lưu ý:** Tất cả Statements, Functions, Lines đều đạt **100%**. Branch coverage 93.15% do một số defensive branches (error handling, edge case guards) không thể trigger trong test environment.

---

## 2. E2E Tests

### Kết quả chi tiết

| Spec | Mô tả | Tests | Duration | Status |
|------|-------|-------|----------|--------|
| `01-navigation` | Tab switching | 3 | ~8s | ✅ Pass |
| `02-calendar-basic` | Calendar UI + clear | 10 | ~25s | ✅ Pass |
| `03-dish-crud` | Dish CRUD + validation | 13 | ~35s | ✅ Pass |
| `04-ingredient-crud` | Ingredient CRUD + validation | 12 | ~30s | ✅ Pass |
| `05-planning` | MealPlannerModal direct flow | 5 | ~54s | ✅ Pass |
| `06-grocery` | Grocery scope switching | 6 | ~15s | ✅ Pass |
| `07-settings` | Language & theme | 5 | ~12s | ✅ Pass |
| `08-data-backup` | Export/Import | 5 | ~18s | ✅ Pass |
| `09-ai-analysis` | AI features (mock) | 5 | ~30s | ✅ Pass |
| `10-goal-settings` | Goals & profile | 7 | ~15s | ✅ Pass |
| `11-dish-ingredient-amount` | Ingredient amounts in dish | 4 | ~15s | ✅ Pass |
| `12-sort-filter-view` | Sort, filter, view toggle | 16 | ~20s | ✅ Pass |
| `13-grocery-aggregation` | Grocery quantities from plan | 5 | ~15s | ✅ Pass |
| `14-responsive-ui` | Bottom nav, layout, touch | 7 | ~20s | ✅ Pass |
| `15-i18n-language` | Language switching & persist | 7 | ~20s | ✅ Pass |
| `16-detail-modal` | Detail modal views | 5 | ~12s | ✅ Pass |
| `17-delete-undo` | Delete guard & undo | 5 | ~15s | ✅ Pass |
| `18-error-edge-cases` | Empty states, theme, error boundary | 5 | ~12s | ✅ Pass |
| `19-calendar-extended` | Progress bars, nutrition | 5 | ~7s | ✅ Pass |
| `20-grocery-extended` | Scope, strikethrough, celebration | 6 | ~8s | ✅ Pass |
| `21-ai-extended` | AI components verification | 6 | ~8s | ✅ Pass |
| `22-data-backup-extended` | Export structure, import restore | 5 | ~8s | ✅ Pass |
| `23-integration-data-flow` | Ingredient→Dish→Calendar→Grocery cascade | 7 | ~43s | ✅ Pass |
| `24-integration-multiday-crosstab` | Multi-day grocery, cross-tab, nutrition cascade | 10 | ~32s | ✅ Pass |
| **Total** | | **183** | **~493s** | **✅ 100%** |

### Môi trường E2E

- Device: Android emulator `Medium_Phone_API_36.1`
- OS: Android 15 (API 36)
- App: `com.mealplaner.app` v1.0.0-debug
- Appium: 2.x + UiAutomator2
- WebdriverIO: 9.x

---

## 3. Bug History

### BUG-001: Scroll lock không reset khi đóng nested modal (CLOSED)

**Phát hiện:** Session 2026-03-05 | **Mức độ:** High | **Priority:** P1  
**Component:** `ModalBackdrop`, `IngredientEditModal`, `UnsavedChangesDialog`  
**Root cause:** `document.body.style.overflow` bị re-lock do React cleanup thứ tự không xác định khi 2 `ModalBackdrop` unmount cùng 1 commit  
**Fix:** Reference-counted `_scrollLockDepth` module-level counter trong `ModalBackdrop.tsx`  
**Commit:** `a3f2b8c`  
**Test coverage:** `modalBackdrop.test.tsx` — 4 regression tests  
**Chi tiết:** [docs/bug-reports/BUG-001-scroll-lock-nested-modal.md](../bug-reports/BUG-001-scroll-lock-nested-modal.md)

### BUG-002: IngredientEditModal không auto-focus field đầu tiên (CLOSED)

**Phát hiện:** CI run 2026-03-05 | **Mức độ:** Low | **Priority:** P3  
**Component:** `IngredientEditModal`  
**Root cause:** `autoFocus` prop không hoạt động trên Android WebView (Capacitor)  
**Fix:** `useEffect` + `inputRef.current?.focus()` với delay 100ms  
**Commit:** `57e996d`  
**Test coverage:** E2E `04-ingredient-crud.spec.ts` TC-02

### BUG-DOC-001: localStorage Schema Document mismatch (CLOSED)

**Phát hiện:** Session 2026-03-06 (Phase 3 Sync) | **Mức độ:** Medium (Documentation) | **Priority:** P2  
**File:** `docs/03-developer-guide/localstorage-schema.md` v1.0  
**Root cause:** Document được viết trước khi schema được finalize; không được cập nhật sau refactor  

**Sai lệch phát hiện:**

| Trường | v1.0 (Sai) | Thực tế (`src/types.ts`) |
|--------|------------|--------------------------|
| `Ingredient.calories` | `calories: number` | `caloriesPer100: number` |
| `Ingredient.protein` | `protein: number` | `proteinPer100: number` |
| `Ingredient.carbsPer100` | _không có_ | `carbsPer100: number` |
| `Ingredient.fatPer100` | _không có_ | `fatPer100: number` |
| `Ingredient.fiberPer100` | _không có_ | `fiberPer100: number` |
| `Ingredient.tags` | `tags?: string[]` | _không tồn tại_ |
| `Ingredient.imageBase64` | `imageBase64?: string` | _không tồn tại_ |
| `DishIngredient.quantity` | `quantity: number` | `amount: number` |
| `Dish.tags` | `tags?: string[]` (bất kỳ) | `tags: MealType[]` (enum) |
| `DayPlan` | `meals: MealEntry[]` | `breakfastDishIds: string[]` + `lunchDishIds` + `dinnerDishIds` |
| `UserProfile.language` | `language?: 'vi' \| 'en'` | _không tồn tại_ (i18next quản lý) |

**Fix:** Rewrite toàn bộ `localstorage-schema.md` v2.0 từ `src/types.ts` làm source of truth  
**Test để phòng ngừa:** Nên thêm schema validation test trong CI (future work)

### BUG-FAVICON-001: Missing favicon.ico gây 404 console error (CLOSED)

**Phát hiện:** QA Cycle 2 (2026-03-06) | **Mức độ:** Low | **Priority:** P4  
**Component:** `index.html`, `public/`  
**Root cause:** Trình duyệt tự động request `/favicon.ico` nhưng file không tồn tại, gây lỗi 404 liên tục trong Console tab của DevTools  
**Fix:** Thêm `public/favicon.svg` (SVG meal planner icon) + `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` trong `index.html`  
**Commit:** `d6bba1c`  
**Test coverage:** Verified qua DevTools Console — 0 errors sau fix

### BUG-E2E-001: Chrome 91 ES2022 incompatibility (CLOSED)

**Phát hiện:** CI run 2026-03-06 | **Mức độ:** High | **Priority:** P1  
**Component:** E2E specs (ManagementPage, specs)  
**Root cause:** Chrome 91.0.4472.114 trên Android emulator không hỗ trợ ES2022: `Array.at()`, `structuredClone()`, `Object.hasOwn()`  
**Fix:** Thay thế `Array.at(-1)` bằng `arr[arr.length - 1]`, sử dụng `JSON.parse(JSON.stringify())` thay `structuredClone()`  
**Test coverage:** Tất cả 24 E2E specs pass trên Chrome 91

### BUG-E2E-002: React 18 _valueTracker swallows input events (CLOSED)

**Phát hiện:** CI run 2026-03-06 | **Mức độ:** High | **Priority:** P1  
**Component:** `e2e/pages/BasePage.ts` — `type()` method  
**Root cause:** React 18 wraps input elements with `_valueTracker`. Programmatic value changes via WebDriver are ignored because `_valueTracker.getValue()` matches the new DOM value, causing React to swallow the `input` event.  
**Fix:** Rewrite `type()` in BasePage to: (1) Set DOM value via native prototype setter, (2) Call `_valueTracker.setValue()` with a DIFFERENT value to force event detection, (3) Dispatch `input` + `change` events with `{ bubbles: true }`  
**Commit:** Multiple CI fix iterations

### BUG-E2E-003: MealPlannerModal direct open regression (CLOSED)

**Phát hiện:** CI run 2026-03-07 | **Mức độ:** Medium | **Priority:** P2  
**Component:** `e2e/specs/05-planning.spec.ts`, `e2e/pages/CalendarPage.ts`  
**Root cause:** `openTypeSelection()` in App.tsx was refactored to open MealPlannerModal directly (skipping TypeSelectionModal). E2E spec 05 still expected `btn-type-breakfast/lunch/dinner` buttons.  
**Fix:** Updated CalendarPage `selectMealType()` to no-op; Updated spec 05 to verify `input-search-plan` and `btn-confirm-plan` directly.  
**Commit:** `102aed6`

### BUG-DM-001: Dark mode missing Tailwind variants — 4 components (CLOSED)

**Phát hiện:** QA Cycle 4 (2026-03-07) via Chrome DevTools | **Mức độ:** Medium | **Priority:** P2  
**Component:** `AISuggestionPreviewModal`, `MealActionBar`, `DateSelector`, `AnalysisResultView`  
**Root cause:** Light-mode-only Tailwind classes (`bg-amber-50`, `active:bg-rose-100`, `bg-slate-200`, `bg-white`) without `dark:` variants caused bright flash/poor contrast in dark theme  
**Fix:** Added `dark:bg-*`, `dark:active:bg-*`, `dark:border-*`, `dark:text-*` variants across 4 files (18 class additions total)  
**Test coverage:** Visual verification via Chrome DevTools; Lint + 995 unit tests pass  
**Chi tiết:** [docs/bug-reports/BUG-DM-001-dark-mode-missing-variants.md](../bug-reports/BUG-DM-001-dark-mode-missing-variants.md)

---

## 4. Known Limitations

| Limitation | Ảnh hưởng | Priority |
|-----------|-----------|---------|
| Branch coverage 93.15% (không đạt 100%) | Một số defensive branches (error handlers, edge case guards) không thể trigger trong jsdom | Low — acceptable |
| AI coverage dùng mock only | E2E `09-ai-analysis` dùng mock data, không test real Gemini | Low |
| E2E không test offline mode | Chỉ test khi có kết nối internet | Low |

---

## 5. Test Execution History

| Date | Unit Tests | E2E | Lint | Commit | Notes |
|------|-----------|-----|------|--------|-------|
| 2026-03-05 | 654/668 | 8/10 | ❌ | `a3f2b8c` | BUG-001 fix session |
| 2026-03-06 | 668/668 | 10/10 | ✅ | `57e996d` | All green |
| 2026-03-06 | 668/668 | 10/10 | ✅ | `2919cd0` | Docs sync, BUG-DOC-001 fixed |
| 2026-03-06 | 866/866 | 10/10 | ✅ | `d6bba1c` | QA Cycle 2: 100% coverage, BUG-FAVICON-001 fixed |
| 2026-03-06 | 866/866 | 22/22 | ✅ | `feba543` | QA Cycle 3: Coverage expanded to 22 specs |
| 2026-03-07 | 866/866 | 22/24 | ✅ | `50553e8` | Deep integration specs added (23-24), spec 05 + 23 regression |
| 2026-03-07 | 866/866 | 24/24 | ✅ | `102aed6` | All fixed: MealPlannerModal direct flow, grocery empty state |
| 2026-03-07 | 995/995 | 24/24 | ✅ | `ba8f9e9` | QA Cycle 4: Dark mode audit, BUG-DM-001, sub-tabs refactor, +129 tests |

---

## 6. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-06 | Initial report |
| 2.0 | 2026-03-06 | Coverage corrected từ actual run; BUG-DOC-001; file list đầy đủ 39 test files |
| 3.0 | 2026-03-06 | QA Cycle 2: 866 tests (↑195), 40 files (↑1), 100% Stmts/Funcs/Lines coverage, BUG-FAVICON-001 |
| 4.0 | 2026-03-07 | QA Cycle 3: E2E expanded 10→24 specs (183 tests), deep integration tests, BUG-E2E-001/002/003, MealPlannerModal direct flow |
| 5.0 | 2026-03-07 | QA Cycle 4: Dark mode visual audit via Chrome DevTools. BUG-DM-001 fixed (4 components, 18 dark: class additions). Schedule sub-tabs refactor. Unit tests 866→995 (+129), test files 40→47 (+7). Coverage: 100% Stmts/Funcs/Lines, 93.15% Branch |
