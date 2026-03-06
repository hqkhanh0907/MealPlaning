# Test Report — Smart Meal Planner

**Version:** 1.0  
**Date:** 2026-03-06  
**Commit:** `57e996d`

---

## Tóm tắt

| Chỉ số | Kết quả |
|--------|---------|
| Unit Tests | **668 / 668 Pass** ✅ |
| E2E Tests | **10 / 10 Specs Pass** ✅ |
| Code Coverage | **90.5%** ✅ |
| Bugs mở | **0** ✅ |
| Bugs đã đóng | **2** (BUG-001, BUG-002) |

---

## 1. Unit Tests

### Thống kê

```
 PASS  src/__tests__/aiImageAnalyzer.test.tsx
 PASS  src/__tests__/geminiService.test.ts
 PASS  src/__tests__/dataService.test.ts
 PASS  src/__tests__/planService.test.ts
 ... (39 files total)

 Test Files:  39 passed (39)
 Tests:      668 passed (668)
 Duration:   ~12s
```

### Coverage theo module

| Module | Stmts | Branch | Funcs | Lines |
|--------|-------|--------|-------|-------|
| `services/` | 96.2% | 91.4% | 97.1% | 96.0% |
| `utils/` | 94.8% | 89.3% | 95.5% | 94.7% |
| `hooks/` | 91.2% | 85.6% | 92.0% | 91.0% |
| `components/` | 88.4% | 80.1% | 87.9% | 88.2% |
| `App.tsx` | 82.1% | 75.3% | 84.0% | 82.0% |
| **Overall** | **90.5%** | **85.1%** | **91.3%** | **90.4%** |

### Các file có coverage cao nhất

| File | Coverage |
|------|---------|
| `utils/calorieCalculator.ts` | 100% |
| `services/planService.ts` | 99.2% |
| `utils/dateUtils.ts` | 98.8% |
| `hooks/usePersistedState.ts` | 97.5% |
| `services/dataService.ts` | 96.4% |

### Các file cần cải thiện

| File | Coverage | Lý do thấp |
|------|---------|-----------|
| `App.tsx` | 82.1% | Nhiều conditional branches UI |
| `components/tabs/AITab.tsx` | 78.3% | AI error flows khó mock đầy đủ |

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

### BUG-001: Scroll lock không reset khi đóng modal (CLOSED)

**Phát hiện:** Session 2026-03-05  
**Mức độ:** Medium  
**Root cause:** `document.body.style.overflow = 'hidden'` không được xóa khi modal unmount qua navigation  
**Fix:** Implement reference-counted scroll lock với cleanup trong `useEffect` return  
**Commit:** `a3f2b8c`  
**Test coverage:** `IngredientEditModal.test.tsx` — TC: "should release scroll lock on unmount"

### BUG-002: IngredientEditModal không auto-focus (CLOSED)

**Phát hiện:** CI run 2026-03-05  
**Mức độ:** Low  
**Root cause:** `autoFocus` prop trên input trong modal không hoạt động trên Android WebView  
**Fix:** Dùng `useEffect` + `inputRef.current?.focus()` với delay 100ms  
**Commit:** `57e996d`  
**Test coverage:** E2E `04-ingredient-crud.spec.ts` TC-02

---

## 4. Known Limitations

| Limitation | Ảnh hưởng | Priority |
|-----------|-----------|---------|
| AI coverage thấp hơn (mock only) | E2E `09-ai-analysis` dùng mock data, không test real Gemini | Low — cần API key trong CI |
| `imageBase64` không có size limit validation | Có thể làm localStorage đầy khi lưu nhiều ảnh resolution cao | Medium |
| E2E không test offline mode | Chỉ test khi có kết nối internet | Low |

---

## 5. Test Execution History

| Date | Unit | E2E | Commit | Notes |
|------|------|-----|--------|-------|
| 2026-03-05 | 654/668 | 8/10 | `a3f2b8c` | BUG-001 fix session |
| 2026-03-06 | 668/668 | 10/10 | `57e996d` | All green ✅ |
