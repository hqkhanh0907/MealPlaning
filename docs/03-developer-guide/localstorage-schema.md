# localStorage Schema Reference

**Version:** 2.1  
**Date:** 2026-03-08  
**Source of truth:** `src/types.ts` + `src/services/dataService.ts`

> **v2.1 — Translation update**: Thêm mô tả `foodDictionary.ts` cho instant translation. Xem [ADR 004](../adr/004-food-dictionary-instant-translation.md).  
> **v2.0 — Schema corrected**: Phiên bản 1.0 có schema sai so với code. Đã đồng bộ lại từ `src/types.ts` (xem BUG-DOC-001).

---

## Tổng quan

Ứng dụng lưu toàn bộ dữ liệu người dùng vào `localStorage` của trình duyệt (hoặc WebView trên Android). Không có backend server. Xem thêm: [ADR-001](../adr/001-local-storage-only.md).

### Keys

| Key | Type | Mô tả | Migration |
|-----|------|--------|-----------|
| `mp-ingredients` | `Ingredient[]` | Danh sách nguyên liệu | string names → LocalizedString |
| `mp-dishes` | `Dish[]` | Danh sách món ăn | string names → LocalizedString, tags default `['lunch']` |
| `mp-day-plans` | `DayPlan[]` | Kế hoạch bữa ăn theo ngày | `breakfastId` → `breakfastDishIds[]` |
| `mp-user-profile` | `UserProfile` | Hồ sơ người dùng | — |

---

## Chi tiết Schema

### `mp-ingredients` — `Ingredient[]`

```typescript
// src/types.ts
type Ingredient = {
  id: string;              // generateId('ing') → "ing-{timestamp}-{random}"
  name: LocalizedString;   // { vi: "Thịt bò", en: "Beef" }
  unit: LocalizedString;   // { vi: "g", en: "g" }
  caloriesPer100: number;  // kcal per 100g (hoặc 100 đơn vị)
  proteinPer100: number;   // g protein per 100
  carbsPer100: number;     // g carbohydrate per 100
  fatPer100: number;       // g fat per 100
  fiberPer100: number;     // g dietary fiber per 100
};

type LocalizedString = Record<'vi' | 'en', string>;
```

**Ví dụ:**
```json
[
  {
    "id": "ing-1709123456789-a3b2c1d",
    "name": { "vi": "Ức gà", "en": "Chicken Breast" },
    "unit": { "vi": "g", "en": "g" },
    "caloriesPer100": 165,
    "proteinPer100": 31,
    "carbsPer100": 0,
    "fatPer100": 3.6,
    "fiberPer100": 0
  }
]
```

**Migration (legacy → current):** Nếu `name` hoặc `unit` là `string` (không phải object), `migrateIngredients()` trong `dataService.ts` tự động convert sang `LocalizedString`.

**Translation:** Khi thêm/sửa ingredient, `App.tsx` tự động dịch tên sang ngôn ngữ còn lại bằng `lookupFoodTranslation()` từ `src/data/foodDictionary.ts` (~0ms). Nếu không tìm thấy trong dictionary → enqueue cho translate worker (WASM fallback). Xem [ADR 004](../adr/004-food-dictionary-instant-translation.md).

---

### `mp-dishes` — `Dish[]`

```typescript
// src/types.ts
type MealType = 'breakfast' | 'lunch' | 'dinner';

type DishIngredient = {
  ingredientId: string;  // FK → Ingredient.id
  amount: number;        // Số lượng theo đơn vị của nguyên liệu (ví dụ: 150 cho 150g)
};

type Dish = {
  id: string;                    // generateId('dish')
  name: LocalizedString;         // { vi: "Ức gà hấp", en: "Steamed Chicken Breast" }
  ingredients: DishIngredient[]; // Danh sách nguyên liệu và lượng
  tags: MealType[];              // Bữa nào dùng được: ['breakfast'] | ['lunch','dinner'] | v.v.
};
```

**Ví dụ:**
```json
[
  {
    "id": "dish-1709123456790-x7y8z",
    "name": { "vi": "Ức gà hấp", "en": "Steamed Chicken Breast" },
    "ingredients": [
      { "ingredientId": "ing-1709123456789-a3b2c1d", "amount": 150 }
    ],
    "tags": ["lunch", "dinner"]
  }
]
```

**Lưu ý quan trọng:**
- `tags` là `MealType[]` (không phải string[] tùy ý) — chỉ nhận: `"breakfast"`, `"lunch"`, `"dinner"`
- `DishIngredient.amount` (không phải `quantity`) — giá trị tuyệt đối theo đơn vị của nguyên liệu
- **Không có `imageBase64`** — ảnh không lưu vào localStorage

**Computed fields** (không lưu, tính realtime bởi `calculateDishNutrition()`):
```typescript
// src/utils/nutrition.ts
const nutrition = calculateDishNutrition(dish, allIngredients);
// Với nguyên liệu đơn vị 'g': factor = amount / 100
// nutrition.calories = sum(ingredient.caloriesPer100 × amount / 100)
```

**Migration (legacy → current):** Nếu `tags` thiếu hoặc rỗng, `migrateDishes()` set default `['lunch']`.

---

### `mp-day-plans` — `DayPlan[]`

```typescript
// src/types.ts
type DayPlan = {
  date: string;               // "YYYY-MM-DD", ví dụ: "2026-03-06"
  breakfastDishIds: string[]; // IDs của món ăn trong bữa sáng (FK → Dish.id)
  lunchDishIds: string[];     // IDs của món ăn trong bữa trưa
  dinnerDishIds: string[];    // IDs của món ăn trong bữa tối
};
```

**Ví dụ:**
```json
[
  {
    "date": "2026-03-06",
    "breakfastDishIds": [],
    "lunchDishIds": ["dish-1709123456790-x7y8z", "dish-1709123456793-p4q5r"],
    "dinnerDishIds": ["dish-1709123456790-x7y8z"]
  }
]
```

**Lưu ý quan trọng:**
- Mỗi slot chứa **mảng IDs** (có thể nhiều món cùng bữa)
- **Không có `meals[]` hay `MealEntry`** — đây là schema cũ đã được loại bỏ
- Mỗi `date` chỉ xuất hiện 1 lần; ngày không có kế hoạch thì không có entry

**Migration (legacy → current):** Nếu plan có `breakfastId` (singular), `migrateDayPlans()` tạo entry mới với `createEmptyDayPlan()`.

---

### `mp-user-profile` — `UserProfile`

```typescript
// src/types.ts
type UserProfile = {
  weight: number;          // Cân nặng (kg), default: 83
  proteinRatio: number;    // Hệ số protein (g protein / kg cân nặng / ngày), default: 2
  targetCalories: number;  // Mục tiêu calo/ngày, default: 1500
};
```

**Ví dụ:**
```json
{
  "weight": 75,
  "proteinRatio": 2.0,
  "targetCalories": 1800
}
```

**Business rule:**
```
protein_target_g_per_day = weight × proteinRatio
Ví dụ: 75kg × 2g/kg = 150g protein/ngày
```

**Lưu ý:** Ngôn ngữ giao diện (`vi`/`en`) được quản lý bởi `i18next` trong `localStorage` key riêng (`i18nextLng`), **không nằm trong `UserProfile`**.

---

## Migration Strategy

Ba hàm migration trong `src/services/dataService.ts`, chạy mỗi lần app load qua `useMemo` trong `App.tsx`:

```typescript
// App.tsx
const ingredients = useMemo(() => migrateIngredients(rawIngredients), [rawIngredients]);
const dishes      = useMemo(() => migrateDishes(rawDishes), [rawDishes]);
const dayPlans    = migrateDayPlans(rawDayPlans); // được xử lý inline
```

| Hàm | Xử lý |
|-----|-------|
| `migrateIngredients(raw)` | String names/units → `LocalizedString`; lọc invalid entries |
| `migrateDishes(raw)` | String names → `LocalizedString`; `tags` rỗng → `['lunch']` |
| `migrateDayPlans(raw)` | Schema cũ `breakfastId` → `createEmptyDayPlan(date)` |

Migration **idempotent** — an toàn khi chạy nhiều lần.

---

## Import/Export Validation

Khi import JSON backup, `validateImportData()` kiểm tra cấu trúc:

```typescript
// src/services/dataService.ts
const IMPORT_VALIDATORS: Record<string, (v: unknown) => boolean> = {
  'mp-ingredients': (v) => Array.isArray(v) && v.every(i => 'id' in i && 'name' in i && 'unit' in i),
  'mp-dishes':      (v) => Array.isArray(v) && v.every(d => 'id' in d && 'name' in d && 'ingredients' in d),
  'mp-day-plans':   (v) => Array.isArray(v) && v.every(p => 'date' in p),
  'mp-user-profile':(v) => typeof v === 'object' && v !== null && 'weight' in v && 'targetCalories' in v,
};
```

Keys không hợp lệ được báo lỗi và bỏ qua — **không ghi đè dữ liệu hiện tại**.

---

## Giới hạn và chú ý

| Vấn đề | Chi tiết |
|--------|---------|
| **Dung lượng** | localStorage tối đa ~5-10 MB/origin. Với dữ liệu text thuần (không ảnh), thường < 1MB. |
| **Xóa data** | Clear browser data / uninstall app → mất toàn bộ. Dùng Export/Backup trước khi xóa. |
| **Android WebView** | Dữ liệu lưu trong WebView storage của `com.mealplaner.app`. Không chia sẻ với browser Chrome. |
| **ID format** | `generateId(prefix)` = `"{prefix}-{Date.now()}-{Math.random().toString(36).slice(2,11)}"` |
| **Backup** | Export tạo file JSON gồm tất cả 4 keys, có thể Share (Android) hoặc download (web). |
| **Orphan references** | Nếu xóa Ingredient, tất cả `DishIngredient` chứa `ingredientId` đó cũng bị xóa (cascade). |

---

## Utility functions

```typescript
// Đọc dữ liệu (qua hook)
import { usePersistedState } from '../hooks/usePersistedState';
const [ingredients, setIngredients] = usePersistedState<Ingredient[]>('mp-ingredients', []);

// Tính dinh dưỡng
import { calculateDishNutrition } from '../utils/nutrition';
const nutrition = calculateDishNutrition(dish, allIngredients);
// → { calories, protein, carbs, fat, fiber }

// Kiểm tra dung lượng dùng
const totalBytes = ['mp-ingredients', 'mp-dishes', 'mp-day-plans', 'mp-user-profile']
  .reduce((sum, key) => sum + (localStorage.getItem(key)?.length ?? 0) * 2, 0);
console.log(`Storage used: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
```
