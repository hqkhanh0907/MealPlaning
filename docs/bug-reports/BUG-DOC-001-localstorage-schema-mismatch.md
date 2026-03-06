# BUG-DOC-001 — localStorage Schema Document Mismatch

| Field | Value |
|-------|-------|
| **ID** | BUG-DOC-001 |
| **Type** | Documentation Bug |
| **Severity** | Medium |
| **Priority** | P2 |
| **Component** | `docs/03-developer-guide/localstorage-schema.md` |
| **Reported** | 2026-03-06 (Phase 3 Documentation Sync) |
| **Status** | ✅ Fixed (schema-doc v2.0) |

---

## 1. Bug Description

`docs/03-developer-guide/localstorage-schema.md` v1.0 mô tả schema **sai** so với code thực tế trong `src/types.ts`. Tài liệu có thể gây nhầm lẫn cho developer khi tham chiếu để build feature, debug, hoặc viết migration script.

**Nguy cơ cụ thể:**
- Developer import dữ liệu bằng cách dùng `calories` (sai) thay vì `caloriesPer100`
- Developer tạo `DayPlan` với cấu trúc `meals: MealEntry[]` (sai) thay vì `breakfastDishIds: string[]`
- Integration tests viết theo schema sai sẽ pass nhưng test logic sai

---

## 2. Root Cause Analysis

Tài liệu `localstorage-schema.md` v1.0 được viết vào 2026-03-06 trong cùng 1 commit với các tài liệu khác (`2919cd0`), nhưng schema trong document phản ánh **draft design** trước khi code được refactor, không phải final implementation.

**Nguyên nhân gốc rễ:**
1. Schema được refactor (đổi `calories` → `caloriesPer100`, đổi `meals[]` → `breakfastDishIds[]`) để cải thiện tính rõ ràng và chuẩn hóa tên field
2. Tài liệu không được cập nhật đồng bộ sau khi refactor
3. Không có validation/test nào kiểm tra tài liệu có khớp với code hay không

---

## 3. Schema Sai lệch Chi tiết

### `mp-ingredients` — `Ingredient`

| Field | v1.0 (Sai) | v2.0 (Đúng — `src/types.ts`) |
|-------|------------|-------------------------------|
| `calories` | `number` | ❌ Không tồn tại |
| `protein` | `number` | ❌ Không tồn tại |
| `caloriesPer100` | ❌ Thiếu | `number` ✅ |
| `proteinPer100` | ❌ Thiếu | `number` ✅ |
| `carbsPer100` | ❌ Thiếu | `number` ✅ |
| `fatPer100` | ❌ Thiếu | `number` ✅ |
| `fiberPer100` | ❌ Thiếu | `number` ✅ |
| `tags` | `string[]` (optional) | ❌ Không tồn tại |
| `imageBase64` | `string` (optional) | ❌ Không tồn tại |

### `mp-dishes` — `Dish` & `DishIngredient`

| Field | v1.0 (Sai) | v2.0 (Đúng) |
|-------|------------|-------------|
| `DishIngredient.quantity` | `number` | ❌ Không tồn tại |
| `DishIngredient.amount` | ❌ Thiếu | `number` ✅ |
| `Dish.tags` | `string[]` (bất kỳ) | `MealType[]` = `('breakfast' \| 'lunch' \| 'dinner')[]` ✅ |
| `Dish.imageBase64` | `string` (optional) | ❌ Không tồn tại |

### `mp-day-plans` — `DayPlan`

| Schema | v1.0 (Sai) | v2.0 (Đúng) |
|--------|------------|-------------|
| Structure | `{ date: string; meals: MealEntry[] }` | `{ date: string; breakfastDishIds: string[]; lunchDishIds: string[]; dinnerDishIds: string[] }` |
| `MealEntry` | Tồn tại (sai) | ❌ Không tồn tại trong codebase |
| `MealType.snack` | Có | ❌ Không tồn tại (chỉ breakfast/lunch/dinner) |

### `mp-user-profile` — `UserProfile`

| Field | v1.0 (Sai) | v2.0 (Đúng) |
|-------|------------|-------------|
| `language` | `'vi' \| 'en'` (optional) | ❌ Không tồn tại; ngôn ngữ do `i18next` quản lý (`localStorage['i18nextLng']`) |

---

## 4. Fix Applied

**File:** `docs/03-developer-guide/localstorage-schema.md`  
**Thay đổi:** Rewrite toàn bộ v1.0 → v2.0

**Nguyên tắc fix:**
- Mọi type definition được copy trực tiếp từ `src/types.ts` (source of truth)
- Migration strategy được viết lại theo code thực tế trong `src/services/dataService.ts`
- Bỏ các trường không tồn tại (`tags` trên Ingredient, `imageBase64`, `language` trên UserProfile)
- Cập nhật `DayPlan` schema từ `meals[]` sang 3 separate arrays
- Cập nhật `DishIngredient.quantity` → `amount`
- Thêm ghi chú về `i18nextLng` key

---

## 5. Prevention

### Ngay lập tức
- [x] Fix schema document v2.0

### Dài hạn (Future Work)
- [ ] Thêm TypeScript type assertion test:
  ```typescript
  // src/__tests__/localstorage-schema.test.ts
  import type { Ingredient, Dish, DayPlan, UserProfile } from '../types';
  // Khi doc thay đổi, cần update type → test sẽ fail → nhắc update doc
  ```
- [ ] Thêm vào `coding-guidelines.md`: "Khi thay đổi type trong `types.ts`, bắt buộc update `localstorage-schema.md` cùng PR"
- [ ] Xem xét dùng `typedoc` để tự động generate API docs từ TypeScript types

---

## 6. Lesson Learned

> **Quy tắc mới (đã bổ sung vào coding-guidelines.md §8):** Mọi thay đổi type/interface trong `src/types.ts` hoặc `src/services/dataService.ts` **bắt buộc** phải kèm update tương ứng trong `docs/03-developer-guide/localstorage-schema.md` trong cùng PR/commit. Reviewer phải kiểm tra điều này.
