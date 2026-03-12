# Test Report — Smart Meal Planner

**Version:** 9.0  
**Date:** 2026-03-12  
**Commit:** TBD

> **v9.0**: QA Cycle 8 — Fixed critical code bug: templates not included in Data Backup export and Google Drive sync (added 'meal-templates' to EXPORT_KEYS in DataBackup.tsx, GoogleDriveSync.tsx, useAutoSync.ts). Fixed 8 scenario doc inaccuracies (SC03 progress bar colors, SC12 component name, SC15 file paths, SC16/SC17 template export). Manual testing expanded to 183 TCs across 17 scenarios — all 182 PASS, 1 DEFERRED, 0 FAIL. Zero console errors. Xem [Changelog](#6-changelog).

---

## Tóm tắt

| Chỉ số | Kết quả |
|--------|---------|
| Unit Tests | **1201 / 1201 Pass** ✅ |
| Test Files | **57 / 57 Pass** ✅ |
| E2E Tests | **24 / 24 Specs Pass** ✅ |
| Lint | **0 errors, 0 warnings** ✅ |
| Code Coverage (Stmts) | **99.46%** ✅ |
| Code Coverage (Branch) | **92.51%** ✅ |
| Code Coverage (Funcs) | **99.41%** ✅ |
| Code Coverage (Lines) | **100%** ✅ |
| Bugs mở | **0** ✅ |
| Bugs đã đóng | **10** (BUG-001, BUG-002, BUG-DOC-001, BUG-FAVICON-001, BUG-E2E-001, BUG-E2E-002, BUG-E2E-003, BUG-DM-001, BUG-TRANSLATE-001, BUG-EXPORT-001) |

---

## 1. Unit Tests

### Thống kê thực tế (`npm run test`)

```
 ✓ src/__tests__/ErrorBoundary.test.tsx
 ✓ src/__tests__/NotificationContext.test.tsx
 ✓ src/__tests__/aiImageAnalyzer.test.tsx
 ✓ src/__tests__/aiSuggestIngredientsPreview.test.tsx
 ✓ src/__tests__/aiSuggestionPreview.test.tsx
 ✓ src/__tests__/analysisResultView.test.tsx
 ✓ src/__tests__/app.test.tsx
 ✓ src/__tests__/authContext.test.tsx
 ✓ src/__tests__/authContextDef.test.ts
 ✓ src/__tests__/calendarAndDate.test.tsx
 ✓ src/__tests__/calendarDesktopLayout.test.tsx
 ✓ src/__tests__/components.test.tsx
 ✓ src/__tests__/constantsAndData.test.ts
 ✓ src/__tests__/copyPlan.test.tsx
 ✓ src/__tests__/dataBackup.test.tsx
 ✓ src/__tests__/dataService.test.ts
 ✓ src/__tests__/dishEditModal.test.tsx
 ✓ src/__tests__/filterBottomSheet.test.tsx
 ✓ src/__tests__/foodDictionary.test.ts
 ✓ src/__tests__/geminiService.test.ts
 ✓ src/__tests__/googleDriveService.test.ts
 ✓ src/__tests__/googleDriveSync.test.tsx
 ✓ src/__tests__/groceryList.test.tsx
 ✓ src/__tests__/helpers.test.ts
 ✓ src/__tests__/imageCapture.test.tsx
 ✓ src/__tests__/imageCompression.test.ts
 ✓ src/__tests__/ingredientEditModal.test.tsx
 ✓ src/__tests__/integration.test.ts
 ✓ src/__tests__/logger.test.ts
 ✓ src/__tests__/main.test.tsx
 ✓ src/__tests__/managers.test.tsx
 ✓ src/__tests__/mealTemplate.test.tsx
 ✓ src/__tests__/modalBackdrop.test.tsx
 ✓ src/__tests__/navigationIndex.test.ts
 ✓ src/__tests__/nutrition.test.ts
 ✓ src/__tests__/planService.test.ts
 ✓ src/__tests__/planningModal.test.tsx
 ✓ src/__tests__/quickPreviewPanel.test.tsx
 ✓ src/__tests__/saveAnalyzedDishModal.test.tsx
 ✓ src/__tests__/saveTemplateModal.test.tsx
 ✓ src/__tests__/scheduleComponents.test.tsx
 ✓ src/__tests__/settingsTab.test.tsx
 ✓ src/__tests__/smallModals.test.tsx
 ✓ src/__tests__/summaryAndManagement.test.tsx
 ✓ src/__tests__/syncConflictModal.test.tsx
 ✓ src/__tests__/tips.test.ts
 ✓ src/__tests__/translateQueueService.test.ts
 ✓ src/__tests__/useAISuggestion.test.ts
 ✓ src/__tests__/useAuth.test.tsx
 ✓ src/__tests__/useAutoSync.test.tsx
 ✓ src/__tests__/useDarkMode.test.ts
 ✓ src/__tests__/useIsDesktop.test.ts
 ✓ src/__tests__/useItemModalFlow.test.ts
 ✓ src/__tests__/useListManager.test.ts
 ✓ src/__tests__/useModalBackHandler.test.ts
 ✓ src/__tests__/useModalManager.test.ts
 ✓ src/__tests__/usePersistedState.test.ts

 Test Files:  57 passed (57)
 Tests:      1201 passed (1201)
 Duration:   ~5.6s
```

### Coverage chi tiết (từ `npm run test:coverage`)

| Module / File | Stmts | Branch | Funcs | Lines | Ghi chú |
|---------------|-------|--------|-------|-------|---------|
| **All files** | **99.46%** | **92.51%** | **99.41%** | **100%** | ✅ Vượt target |
| `src/` | 100% | 92.3% | 100% | 100% | ✅ |
| `src/components/` | 99.33% | 90.14% | 100% | 100% | ✅ |
| `src/contexts/` | 98.98% | 95.77% | 94.23% | 100% | ✅ |
| `src/data/` | 100% | 100% | 100% | 100% | ✅ |
| `src/hooks/` | 99.74% | 88.97% | 100% | 100% | ✅ |
| `src/services/` | 99.73% | 96.89% | 100% | 100% | ✅ |
| `src/utils/` | 100% | 100% | 100% | 100% | ✅ |

> **Lưu ý:** Lines đạt **100%**. Statements 99.46%, Functions 99.41% — gần hoàn hảo. Branch coverage 92.51% do một số defensive branches (error handling, edge case guards) không thể trigger trong test environment.

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
**Test coverage:** Visual verification via Chrome DevTools; Lint + 1201 unit tests pass  
**Chi tiết:** [docs/bug-reports/BUG-DM-001-dark-mode-missing-variants.md](../bug-reports/BUG-DM-001-dark-mode-missing-variants.md)

---

## 4. Known Limitations

| Limitation | Ảnh hưởng | Priority |
|-----------|-----------|---------|
| Branch coverage 92.51% (không đạt 100%) | Một số defensive branches (error handlers, edge case guards) không thể trigger trong jsdom | Low — acceptable |
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
| 2026-03-08 | 1046/1046 | 24/24 | ✅ | `93fd037` | QA Cycle 5: Instant food dictionary translation, BUG-TRANSLATE-001, +51 tests |
| 2026-03-11 | 1201/1201 | 24/24 | ✅ | `412ad4e` | QA Cycle 6: Google Drive sync, Cloud auth, Desktop layout, Meal templates, Copy plan, AI suggest ingredients, +155 tests |

---

## 6. Tài liệu liên quan

- **Expanded scenario test cases (v8.0):** [scenarios/](scenarios/) — 2,520 test cases across 24 scenarios (SC01–SC24, 105 TCs each)
- **UX Research Analysis:** [../ux-research-analysis.md](../ux-research-analysis.md) — 120 UX proposals across all scenarios
- **Original scenario analysis:** [scenario-analysis-and-testcases.md](scenario-analysis-and-testcases.md) — 799 test cases across 15 scenarios (v2.0, superseded by expanded docs)
- **Test Plan:** [test-plan.md](test-plan.md)
- **Test Cases (manual QA):** [test-cases.md](test-cases.md)
- **E2E Setup:** [e2e-setup.md](e2e-setup.md)

---

## 7. Manual Testing Results (v9.0)

**Method:** Chrome DevTools MCP — automated browser interaction via accessibility tree  
**Environment:** macOS, Chrome, localhost:3000 (Vite dev server)  
**Date:** 2026-03-12  
**Console Errors:** 0 | **Console Warnings:** 0

### Summary: 183 TCs tested, 182 PASS, 0 FAIL, 1 DEFERRED

| Scenario | TCs Tested | Pass | Fail | Deferred | Coverage |
|----------|-----------|------|------|----------|----------|
| SC01 — Calendar & Meal Planning | 22 | 22 | 0 | 0 | Calendar grid, date selection, meal slots, nutrition bars, week view, more actions |
| SC02 — Meal Planner Modal | 18 | 18 | 0 | 0 | Modal open/close, meal tabs, dish selection, search, nutrition preview, save |
| SC03 — Nutrition Tracking | 19 | 18 | 0 | 1 | Zero plan, add/remove dish, progress bars (orange/blue), goals modal, target calculations |
| SC05 — AI Image Analysis | 5 | 5 | 0 | 0 | Tab load, 3-step workflow, upload/photo buttons, analyze state |
| SC06 — Ingredient CRUD | 18 | 18 | 0 | 0 | Ingredient list, nutrition per 100g, used-in cross-ref, delete protection, search, sort, countable units |
| SC07 — Dish CRUD | 14 | 14 | 0 | 0 | Dish list, meal filters, sort options, clone/edit/delete, meal tags, ingredient count |
| SC08 — Settings & Config | 5 | 5 | 0 | 0 | Settings page, language, appearance, cloud sync, data sections |
| SC09 — Goal Settings | 6 | 6 | 0 | 0 | Goal modal, weight/protein/calorie inputs, presets, auto-save |
| SC10 — Copy Plan | 9 | 9 | 0 | 0 | Copy modal, source preview, quick select, execute, verify target |
| SC11 — Clear Plan | 6 | 6 | 0 | 0 | Clear modal, 3 scopes, meal count, execute, undo option |
| SC12 — Template Manager | 13 | 13 | 0 | 0 | Template list, apply, rename, meal preview, notifications |
| SC13 — Save Template | 4 | 4 | 0 | 0 | Template modal, name input, preview, save |
| SC14 — Grocery List | 12 | 12 | 0 | 0 | Auto-generation, time filters (today/week/all), copy/share, ingredient aggregation |
| SC16 — Data Backup | 9 | 9 | 0 | 0 | Export/import buttons, success notification, includes templates (bug fix verified) |
| SC20 — Filter & Sort | 8 | 8 | 0 | 0 | 8 sort options, search, meal filters, grid/list toggle |
| SC22 — Dark Mode | 7 | 7 | 0 | 0 | Dark theme activation, contrast, selected states, light/system switch |
| SC23 — i18n Language | 8 | 8 | 0 | 0 | Vietnamese/English switch, full UI translation, tab names, persistence |
| **TOTAL** | **183** | **182** | **0** | **1** | |

### Bug Fixed in v9.0

#### BUG-EXPORT-001: Templates not included in Data Backup/Sync

**Description:** `meal-templates` localStorage key was missing from `EXPORT_KEYS` constant in DataBackup.tsx, GoogleDriveSync.tsx, and useAutoSync.ts. This meant templates were never exported, imported, or synced to Google Drive.

**Root Cause:** EXPORT_KEYS only contained 4 keys; templates were added as a feature later but never added to the export list.

**Fix:** Added `'meal-templates'` to EXPORT_KEYS in all 3 files. Also added `templates` to `UseAutoSyncOptions` interface and dependency array to trigger auto-sync on template changes.

**Files Changed:** `src/components/DataBackup.tsx`, `src/components/GoogleDriveSync.tsx`, `src/hooks/useAutoSync.ts`, `src/App.tsx`, `src/__tests__/useAutoSync.test.tsx`

**Verification:** 1201/1201 unit tests pass, 100% line coverage, lint clean.

---

## 7. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-06 | Initial report |
| 2.0 | 2026-03-06 | Coverage corrected từ actual run; BUG-DOC-001; file list đầy đủ 39 test files |
| 3.0 | 2026-03-06 | QA Cycle 2: 866 tests (↑195), 40 files (↑1), 100% Stmts/Funcs/Lines coverage, BUG-FAVICON-001 |
| 4.0 | 2026-03-07 | QA Cycle 3: E2E expanded 10→24 specs (183 tests), deep integration tests, BUG-E2E-001/002/003, MealPlannerModal direct flow |
| 5.0 | 2026-03-07 | QA Cycle 4: Dark mode visual audit via Chrome DevTools. BUG-DM-001 fixed (4 components, 18 dark: class additions). Schedule sub-tabs refactor. Unit tests 866→995 (+129), test files 40→47 (+7). Coverage: 100% Stmts/Funcs/Lines, 93.15% Branch |
| 6.0 | 2026-03-08 | QA Cycle 5: Instant food translation via static dictionary (200+ entries). BUG-TRANSLATE-001 fixed (all EN names were VI copies). New files: foodDictionary.ts, foodDictionary.test.ts. Unit tests 995→1046 (+51), test files 47→49 (+2). Coverage: 99.53% Stmts, 99.66% Funcs, 100% Lines, 92.30% Branch |
| 7.0 | 2026-03-11 | QA Cycle 6: Google Drive sync, Cloud auth (AuthContext), Desktop layout, Meal templates, Copy plan, AI suggest ingredients, Filter bottom sheet, Quick preview panel, Schedule components, Sync conflict modal. Unit tests 1046→1201 (+155), test files 49→57 (+8). Coverage: 99.46% Stmts, 99.41% Funcs, 100% Lines, 92.51% Branch. Chrome DevTools QA: 0 errors, 0 warnings across all 5 tabs |
| 8.0 | 2026-03-12 | QA Cycle 7: Comprehensive manual testing via Chrome DevTools MCP — 108 TCs across 14 scenarios (SC01–SC14, SC20, SC22, SC23) all PASS. 24 expanded scenario docs (SC01–SC24, 2,520 TCs total) created in docs/04-testing/scenarios/. UX research document with 120 proposals. Doc fixes: PRD F-24 renamed to "Quick Copy Plan", Android API version aligned (minSdk 24, targetSdk 36), e2e-setup spec count 10→24. Zero console errors/warnings. No code bugs found |
| 9.0 | 2026-03-12 | QA Cycle 8: BUG-EXPORT-001 fixed — templates missing from export/sync EXPORT_KEYS (3 files + useAutoSync interface). 8 scenario doc inaccuracies corrected (SC03 progress bar colors, SC12 component name, SC15 file paths). Manual testing expanded 108→183 TCs (+75) across 17 scenarios. Added SC03, SC12, SC16, SC20 deep coverage. 182 PASS, 0 FAIL, 1 DEFERRED |
