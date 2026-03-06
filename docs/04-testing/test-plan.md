# Test Plan — Smart Meal Planner

**Version:** 1.0  
**Date:** 2026-03-06  
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
| Framework | Vitest 3.x |
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
        │  E2E Tests  │  15% — 10 spec files, happy path + critical flows
        ├─────────────┤
        │ Unit Tests  │  80% — services, utils, hooks, components
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

| Level | Target | Current |
|-------|--------|---------|
| Overall | ≥ 80% | 90.5% ✅ |
| Services | ≥ 90% | ~95% ✅ |
| Utils | ≥ 90% | ~92% ✅ |
| Components | ≥ 75% | ~88% ✅ |
| Hooks | ≥ 85% | ~90% ✅ |

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
| `02-calendar-basic.spec.ts` | Calendar UI | 4 |
| `03-dish-crud.spec.ts` | Dish management | 5 |
| `04-ingredient-crud.spec.ts` | Ingredient management | 5 |
| `05-planning.spec.ts` | Meal planning | 4 |
| `06-grocery.spec.ts` | Grocery list | 3 |
| `07-settings.spec.ts` | Settings | 3 |
| `08-data-backup.spec.ts` | Export/Import | 3 |
| `09-ai-analysis.spec.ts` | AI features | 4 |
| `10-goal-settings.spec.ts` | Goals & profile | 3 |

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

E2E tests tạo dữ liệu programmatically qua UI (không inject localStorage trực tiếp) để test đúng flow người dùng.

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| AI API flaky | High | Medium | Mock trong unit tests, retry trong integration |
| Emulator instability | Medium | High | noReset, reset localStorage trước mỗi spec |
| localStorage race condition | Low | Medium | Synchronous read/write, không async |
| WebView context switch failure | Medium | High | ensureWebviewsHavePages, wait strategies |

---

## 8. Test Schedule

| Giai đoạn | Loại test | Khi nào chạy |
|-----------|-----------|-------------|
| Pre-commit | Unit tests | `npm run test` — developer local |
| Pre-merge | Unit + lint | CI pipeline |
| Release candidate | E2E full suite | Trước mỗi APK build |
| Post-release | E2E smoke (01, 02, 07) | Sau khi cài APK lên device |
