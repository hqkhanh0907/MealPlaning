# Structure Audit — MealPlaning vs Angular Style Guide 2025

**Date:** 2026-04-28
**Type:** Read-only structural audit. No code modified.
**Source of truth:** Output từ script audit (snapshot trong `.hermes/plans/`).

---

## 1. File inventory

- Tổng `.ts` files trong `src/`: **102**
- Spec files (`*.spec.ts`): 33 (32% coverage ratio theo file)

### Phân bố suffix file (project đang dùng Style 2016)

| Suffix | Count |
|--------|-------|
| `.spec.ts` | 33 |
| `.component.ts` | 10 |
| `.routes.ts` | 8 |
| `.page.ts` | 7 |
| `.repository.ts` | 5 |
| `.types.ts` | 5 |
| `.service.ts` | 4 |
| `.store.ts` | 3 |
| `.schema.ts` | 3 |
| `.model.ts` | 2 |
| `.constants.ts` | 1 |
| `.provider.ts` | 1 |
| `.guard.ts` | 1 |

### Files KHÔNG suffix (19) — phần lớn là pure utility, OK theo Style Guide

```
src/types/sql.js.d.ts
src/zone-flags.ts
src/main.ts
src/test.ts
src/polyfills.ts
src/environments/environment.ts
src/environments/environment.prod.ts
src/app/core/services/database/{schema, schema-compatibility, migrations, migration-runner, legacy-sqljs-migrator}.ts
src/app/core/services/unit-resolver.ts                   ← pure function, OK
src/app/features/management/unit-resolver.ts             ← re-export barrel (xem §4)
src/app/features/onboarding/onboarding-validation.ts     ← pure util
src/app/features/onboarding/onboarding-calculation.ts    ← pure util
src/app/shared/forms/{schemas/common, types, index}.ts
```

→ Không vi phạm chuẩn — Style Guide không yêu cầu pure-function file phải có suffix.

---

## 2. Class name suffixes

| Suffix | Count |
|--------|-------|
| `Component` | 10 |
| `Repository` | 5 |
| `Store` | 3 |
| `Service` | 3 |
| `Page` | 1 |
| (no suffix) | 3 |

→ Cùng pattern Style 2016. Migrate sang 2025 cần đổi cả **20 class names**.

---

## 3. Selector audit

- Tổng selector: 17
- `app-*`: **17 (100%)** ✅
- `ion-*`: 0
- Khác (vi phạm): **0** ✅

→ Toàn bộ component tuân thủ rule prefix `app-`. Không cần sửa.

---

## 4. Template & style — inline vs external

| | Files |
|---|---|
| `templateUrl:` (external) | **0** |
| Inline `template:` | 18 |
| `styleUrl(s):` (external) | 1 |
| Inline `styles:` / `styles[]` | 9 |

### Component inline (vi phạm project convention PC-1: mọi component MUST tách external)

| Lines | File |
|------:|------|
| 1163 | `src/app/features/management/management.page.ts` |
| 869 | `src/app/features/onboarding/onboarding.page.ts` |
| 749 | `src/app/shared/components/ingredient-edit-modal/ingredient-edit-modal.component.ts` |
| 652 | `src/app/shared/components/dish-edit-modal/dish-edit-modal.component.ts` |

→ **4 file lớn nên tách `templateUrl` + `styleUrl`** trong refactor riêng (không nằm trong scope doc update lần này).

---

## 5. Duplicate basenames

Chỉ phát hiện **1 cặp**: `unit-resolver.ts`

| Path | Bytes | Vai trò |
|------|------:|---------|
| `src/app/core/services/unit-resolver.ts` | 2864 | Source of truth (chứa logic + types) |
| `src/app/features/management/unit-resolver.ts` | 153 | **Re-export barrel** từ core path |

### Phân tích usage

- `core/services/unit-resolver.ts` được import bởi: `core/repositories/dish-ingredient.repository.{ts,spec.ts}`, `features/management/unit-resolver.{ts,spec.ts}` (gián tiếp).
- `features/management/unit-resolver.ts` (file barrel): **không file nào import nó** (cả production code lẫn spec).
- `features/management/unit-resolver.spec.ts`: import trực tiếp từ `core/services/unit-resolver`, không qua barrel.

### Kết luận

- Không phải duplicate logic. Là **dead barrel file** — placeholder không có ai dùng.
- **Recommendation**: xoá `features/management/unit-resolver.ts` ở task cleanup riêng (boy-scout).
- Trong scope doc lần này: chỉ ghi nhận, không sửa.

---

## 6. Empty / placeholder directories

| Path | Trạng thái |
|------|-----------|
| `src/app/shared/forms/mappers/` | Chỉ chứa `README.md`, không có file `.ts` |
| `src/app/shared/pipes/` | Tồn tại nhưng **rỗng** |
| `src/app/shared/directives/` | Tồn tại nhưng **rỗng** |

→ Doc kiến trúc `architecture.md §2` nhắc tới các thư mục này như đã có content (vd `calorie.pipe.ts`, `unit-format.pipe.ts`, `long-press.directive.ts`) — **không khớp thực tế**.

---

## 7. Drift giữa `architecture.md §2` và thực tế

### 7.1 Thư mục `features/<x>/components/` — doc nói có, code KHÔNG

| Feature | Doc claims | Actual |
|---------|------------|--------|
| dashboard | ai-insight-card, nutrition-card, workout-card, streak-weight-card, quick-actions | **(không có thư mục `components/`)** |
| calendar | week-view, day-view, meal-slot, nutrition-summary, add-dish-modal, ai-plan-preview | **(không có thư mục `components/`)** |
| management | ingredient-list, ingredient-edit-modal, dish-list, dish-edit-modal, ai-autofill-preview, filter-sheet | **(không có thư mục `components/`)** — các modal đã được nâng lên `shared/components/` |
| fitness | training-plan-card, workout-logger, exercise-picker, set-input, effort-emoji-picker, rest-timer, progress-chart | **(không có thư mục `components/`)** |

### 7.2 Services & repositories chưa tồn tại (doc đặt sẵn placeholder)

- `core/services/ai/{gemini, nutrition-ai, fitness-ai, insight-ai}.service.ts` → **0/4 tồn tại**
- `core/services/{platform, network}.service.ts` → **0/2 tồn tại**
- Repositories doc liệt kê 11, thực tế **5** (thiếu: day-plan, meal-slot, exercise, training-plan, workout, weight-log, streak-log, ai-chat-log, app-config)
- Stores doc liệt kê 7, thực tế **3** (thiếu: day-plan, fitness, dashboard, ui)
- Models doc liệt kê 7, thực tế gộp: `management.model.ts` (gộp ingredient/dish/etc) + `user-profile.model.ts`
- Migrations: doc nói `migrations/V1_initial_schema.sql` (file SQL riêng), thực tế là `migrations.ts` (TypeScript inline)

### 7.3 Module thực tế có nhưng doc không nhắc

- `src/app/tabs/` (tabs.page.ts + tabs.routes.ts) — wrapper cho 4 tab IonTabBar
- `src/app/shared/forms/{form-field, schemas, types, index, mappers/README.md}` — Signal Forms infrastructure
- `src/app/core/models/management.{constants,types}.ts`

---

## 8. Đối chiếu với Angular Style Guide 2025

> **[Angular]** = rule official từ angular.dev/style-guide. **[Project]** = convention nội bộ HealthMate AI (PC-N), không phải rule Angular official.

| # | Rule | Source | Status | Ghi chú |
|---|------|--------|--------|---------|
| 1 | Code trong `src/` | [Angular] | ✅ | |
| 2 | One concept per file | [Angular] | ✅ | |
| 3 | Group related files cùng folder | [Angular] | ✅ | spec đặt cùng thư mục code |
| 4 | kebab-case file names | [Angular] | ✅ | |
| 5 | Cùng base name cho ts/html/css/spec | [Angular] | ✅ | (theo cặp đang tồn tại) |
| 6 | Style 2025 (bỏ suffix file + class) | [Angular] | ❌ | **Toàn bộ codebase Style 2016** — migrate trong task riêng |
| 7 | `.spec.ts` cùng folder | [Angular] | ✅ | |
| 8 | Selector có prefix riêng cho app | [Angular] | ✅ | 17/17 dùng `app-` |
| 9 | Tách external khi "more than a few lines" (Angular không nêu ngưỡng) | [Angular] | ⚠️ | xem PC-1 |
| 10 | Multi-style hậu tố mô tả | [Angular] | n/a | hiện không có case multi-style |
| PC-1 | Mọi component MUST tách `templateUrl` + `styleUrl` (binary) | [Project] | ✅ | **DONE Phase B (2026-04-28)** — 17/17 component external |
| PC-2 | Naming pattern khi tách external | [Project] | ✅ | |

---

## 9. Action items (chỉ ghi nhận, không thực hiện trong scope doc update)

1. **Migrate Style 2016 → 2025** (rename ~150 file + 20 class) — task riêng, blocker cao, cần branch độc lập.
2. **Tách template/style external** cho toàn bộ 17 component (PC-1 binary) — ✅ **DONE Phase B (2026-04-28)**, 3 wave (9 + 4 + 4 component).
3. **Xoá dead barrel** `features/management/unit-resolver.ts` — ✅ DONE (Phase A, 2026-04-28).
4. **Quyết định** về `shared/forms/mappers/`, `shared/pipes/`, `shared/directives/`: giữ placeholder hay xoá đến khi cần?

---

**Audit kết thúc. Output này là input cho Phase 2 (update architecture.md + tạo coding-conventions.md + cập nhật CLAUDE.md).**
