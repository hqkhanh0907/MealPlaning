# Test Report — Smart Meal Planner

**Version:** 3.0  
**Date:** 2026-03-06  
**Commit:** `d6bba1c`

> **v3.0**: QA Cycle 2 — 195 tests mới (668→866), coverage đạt 100% Stmts/Funcs/Lines. Bổ sung BUG-FAVICON-001. Xem [Changelog](#6-changelog).

---

## Tóm tắt

| Chỉ số | Kết quả |
|--------|---------|
| Unit Tests | **866 / 866 Pass** ✅ |
| Test Files | **40 / 40 Pass** ✅ |
| E2E Tests | **10 / 10 Specs Pass** ✅ |
| Lint | **0 errors, 0 warnings** ✅ |
| Code Coverage (Stmts) | **100%** ✅ |
| Code Coverage (Branch) | **93.99%** ✅ |
| Code Coverage (Funcs) | **100%** ✅ |
| Code Coverage (Lines) | **100%** ✅ |
| Bugs mở | **0** ✅ |
| Bugs đã đóng | **4** (BUG-001, BUG-002, BUG-DOC-001, BUG-FAVICON-001) |

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

 Test Files:  40 passed (40)
 Tests:      866 passed (866)
 Duration:   ~7.2s
```

### Coverage chi tiết (từ `npm run test:coverage`)

| Module / File | Stmts | Branch | Funcs | Lines | Ghi chú |
|---------------|-------|--------|-------|-------|---------|
| **All files** | **100%** | **93.99%** | **100%** | **100%** | ✅ Vượt target |
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

> **Lưu ý:** Tất cả Statements, Functions, Lines đều đạt **100%**. Branch coverage 93.99% do một số defensive branches (error handling, edge case guards) không thể trigger trong test environment.

---

## 2. E2E Tests

### Kết quả chi tiết

| Spec | Mô tả | Tests | Duration | Status |
|------|-------|-------|----------|--------|
| `01-navigation` | Tab switching | 3 | ~8s | ✅ Pass |
| `02-calendar-basic` | Calendar UI | 4 | ~15s | ✅ Pass |
| `03-dish-crud` | Dish CRUD | 5 | ~25s | ✅ Pass |
| `04-ingredient-crud` | Ingredient CRUD | 5 | ~22s | ✅ Pass |
| `05-planning` | Meal assignment | 4 | ~20s | ✅ Pass |
| `06-grocery` | Grocery list | 3 | ~12s | ✅ Pass |
| `07-settings` | Settings update | 3 | ~10s | ✅ Pass |
| `08-data-backup` | Export/Import | 3 | ~18s | ✅ Pass |
| `09-ai-analysis` | AI features (mock) | 4 | ~30s | ✅ Pass |
| `10-goal-settings` | Goals & profile | 3 | ~12s | ✅ Pass |
| **Total** | | **37** | **~172s** | **✅ 100%** |

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

---

## 4. Known Limitations

| Limitation | Ảnh hưởng | Priority |
|-----------|-----------|---------|
| Branch coverage 93.99% (không đạt 100%) | Một số defensive branches (error handlers, edge case guards) không thể trigger trong jsdom | Low — acceptable |
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

---

## 6. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-06 | Initial report |
| 2.0 | 2026-03-06 | Coverage corrected từ actual run; BUG-DOC-001; file list đầy đủ 39 test files |
| 3.0 | 2026-03-06 | QA Cycle 2: 866 tests (↑195), 40 files (↑1), 100% Stmts/Funcs/Lines coverage, BUG-FAVICON-001 |
