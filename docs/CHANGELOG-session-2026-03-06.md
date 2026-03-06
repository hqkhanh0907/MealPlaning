# Changelog — Session 06/03/2026 (Documentation Sync)

> Dự án: **Smart Meal Planner**  
> Khoảng thời gian: 06/03/2026  
> Commits: `2919cd0` → (session hiện tại)  
> Tổng số test: **668/668 passing** (không đổi — docs-only session)

---

## Mục lục

1. [Audit kết quả](#1-audit-kết-quả)
2. [BUG-DOC-001 — localStorage Schema Mismatch](#2-bug-doc-001--localstorage-schema-mismatch)
3. [Cập nhật Test Report v2.0](#3-cập-nhật-test-report-v20)
4. [Cập nhật Test Plan v2.0](#4-cập-nhật-test-plan-v20)
5. [Cập nhật Test Cases v2.0](#5-cập-nhật-test-cases-v20)
6. [Cập nhật Coding Guidelines](#6-cập-nhật-coding-guidelines)
7. [Tổng kết số liệu](#7-tổng-kết-số-liệu)

---

## 1. Audit kết quả

### Phase 1: Project Audit

| Metric | Kết quả |
|--------|---------|
| Unit Tests | 668/668 Pass ✅ |
| Test Files | 39/39 Pass ✅ |
| Lint | 0 errors ✅ |
| Coverage (Stmts) | 90.51% ✅ |
| Coverage (Branch) | 83.80% ✅ |
| Mở bugs | 0 ✅ |

### Tech Stack xác nhận
- React 19 + TypeScript 5.8 + Vite 6 + Tailwind CSS v4
- Capacitor 8 (Android)
- Google Gemini AI (`@google/genai`)
- Offline translation: `@xenova/transformers` (OPUS model, Web Worker)
- i18next (vi/en)
- Vitest + React Testing Library + WebdriverIO + Appium

### Coverage gaps xác định (không phải bugs)

| File | Stmts | Branch | Ghi chú |
|------|-------|--------|---------|
| `App.tsx` | 70.87% | 63.95% | UI conditionals, lazy tabs — acceptable |
| `DishEditModal.tsx` | 69.06% | 59.62% | Quick-Add flow mới — medium priority |
| `DishManager.tsx` | 81.81% | 73.43% | Edge cases — low priority |

---

## 2. BUG-DOC-001 — localStorage Schema Mismatch

**Type:** Documentation Bug  
**Severity:** Medium  
**File:** `docs/03-developer-guide/localstorage-schema.md`  
**Chi tiết:** [docs/bug-reports/BUG-DOC-001-localstorage-schema-mismatch.md](bug-reports/BUG-DOC-001-localstorage-schema-mismatch.md)

### Sai lệch phát hiện

`localstorage-schema.md` v1.0 mô tả schema **không khớp** với `src/types.ts`:

| Vấn đề | Chi tiết |
|--------|---------|
| `Ingredient.calories` | Đặt tên sai — thực tế là `caloriesPer100` |
| `Ingredient.protein` | Đặt tên sai — thực tế là `proteinPer100` |
| Thiếu fields | `carbsPer100`, `fatPer100`, `fiberPer100` hoàn toàn không có |
| Fields không tồn tại | `Ingredient.tags`, `Ingredient.imageBase64`, `Dish.imageBase64` |
| `DishIngredient.quantity` | Đặt tên sai — thực tế là `amount` |
| `DayPlan` schema sai hoàn toàn | Doc có `meals: MealEntry[]`; thực tế có `breakfastDishIds[]` + `lunchDishIds[]` + `dinnerDishIds[]` |
| `UserProfile.language` | Không tồn tại — ngôn ngữ do i18next quản lý |

### Fix
- Rewrite toàn bộ `localstorage-schema.md` v2.0 dựa trên `src/types.ts` làm source of truth
- Thêm ghi chú về `i18nextLng` key (managed by i18next)
- Cập nhật migration strategy theo code thực tế
- Tạo bug report chi tiết: `BUG-DOC-001-localstorage-schema-mismatch.md`

### Lesson Learned
Thêm quy tắc vào coding-guidelines: khi thay đổi `types.ts`, bắt buộc update `localstorage-schema.md` cùng PR.

---

## 3. Cập nhật Test Report v2.0

**File:** `docs/04-testing/test-report.md`

**Thay đổi chính:**

| Trường | v1.0 (Sai) | v2.0 (Đúng) |
|--------|------------|-------------|
| Commit | `57e996d` | `2919cd0` |
| Bugs đóng | 2 | 3 (+ BUG-DOC-001) |
| Coverage App.tsx | 82.1% | 70.87% |
| Coverage Branch overall | 85.1% | 83.80% |
| `DishEditModal.tsx` | Không đề cập | 69.06% ⚠️ |
| Unit test list | 8 files (partial) | 39 files (đầy đủ) |
| Known Limitations | 3 | 4 (+App.tsx & DishEditModal coverage) |
| Changelog section | Không có | Có ✅ |

---

## 4. Cập nhật Test Plan v2.0

**File:** `docs/04-testing/test-plan.md`

- Version 1.0 → 2.0
- Coverage table: cập nhật "Current" với số liệu chính xác từ thực tế
- Risk Assessment: thêm "Schema doc drift" risk với mitigation
- Test Schedule: thêm "coverage" vào Pre-merge step

---

## 5. Cập nhật Test Cases v2.0

**File:** `docs/04-testing/test-cases.md`

- Version 1.0 → 2.0
- Unit Test Summary: list đầy đủ 39 test files (thay vì 8 files + "31 others")
- Thêm Changelog section

---

## 6. Cập nhật Coding Guidelines

**File:** `docs/03-developer-guide/coding-guidelines.md`

**Thêm section mới: §8.1 — Quy tắc đồng bộ tài liệu**

```
# PR checklist khi thay đổi types.ts
- [ ] localstorage-schema.md đã được cập nhật?
- [ ] data-model.md đã được cập nhật?
- [ ] Test cho migration function đã được viết?
```

**Thêm coverage targets table** vào §8 Testing.

---

## 7. Tổng kết số liệu

### Files thay đổi trong session

| File | Loại thay đổi |
|------|--------------|
| `docs/03-developer-guide/localstorage-schema.md` | Rewrite v2.0 (fix schema sai) |
| `docs/04-testing/test-report.md` | Update v2.0 (coverage chính xác) |
| `docs/04-testing/test-plan.md` | Update v2.0 (coverage targets, risks) |
| `docs/04-testing/test-cases.md` | Update v2.0 (39 test files) |
| `docs/03-developer-guide/coding-guidelines.md` | Bổ sung §8.1 doc sync rules |
| `docs/bug-reports/BUG-DOC-001-localstorage-schema-mismatch.md` | Tạo mới |
| `docs/CHANGELOG-session-2026-03-06.md` | Tạo mới |

### Trạng thái cuối session

| Nhóm tài liệu | Status |
|---------------|--------|
| 01-requirements (PRD, use-cases) | ✅ Đã khớp với code |
| 02-architecture (SAD, data-model, sequence) | ✅ Đã khớp với code |
| 03-developer-guide (setup, guidelines, schema) | ✅ Fixed (schema v2.0) |
| 04-testing (test-plan, test-cases, test-report) | ✅ Updated v2.0 |
| 05-process (release-process) | ✅ Không cần thay đổi |
| 06-operations (deployment) | ✅ Không cần thay đổi |
| bug-reports | ✅ BUG-001 + BUG-DOC-001 |

### Test kết quả (xác nhận không có regression)

```
Test Files:  39 passed (39)
Tests:      668 passed (668)
Lint:       0 errors, 0 warnings
Coverage:   90.51% statements, 83.80% branches
```
