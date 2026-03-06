# localStorage Schema Reference

**Version:** 1.0  
**Date:** 2026-03-06

---

## Tổng quan

Ứng dụng lưu toàn bộ dữ liệu người dùng vào `localStorage` của trình duyệt (hoặc WebView trên Android). Không có backend server. Xem thêm: [ADR-001](../adr/001-local-storage-only.md).

### Keys

| Key | Type | Mô tả | Migration |
|-----|------|--------|-----------|
| `mp-ingredients` | `Ingredient[]` | Danh sách nguyên liệu | v1 → v2 |
| `mp-dishes` | `Dish[]` | Danh sách món ăn | v1 → v2 |
| `mp-day-plans` | `DayPlan[]` | Kế hoạch bữa ăn theo ngày | v1 → v2 |
| `mp-user-profile` | `UserProfile` | Hồ sơ người dùng | v1 → v2 |

---

## Chi tiết Schema

### `mp-ingredients` — `Ingredient[]`

```typescript
interface Ingredient {
  id: string;                    // UUID, ví dụ: "1709123456789"
  name: LocalizedString;         // { vi: "Thịt bò", en: "Beef" }
  unit: LocalizedString;         // { vi: "100g", en: "100g" }
  calories: number;              // Calo (kcal) trên 1 đơn vị
  protein: number;               // Protein (g) trên 1 đơn vị
  tags?: string[];               // Nhãn phân loại, ví dụ: ["meat", "high-protein"]
  imageBase64?: string;          // Ảnh base64 (optional, kích thước có thể lớn)
}
```

**Ví dụ:**
```json
[
  {
    "id": "1709123456789",
    "name": { "vi": "Thịt bò", "en": "Beef" },
    "unit": { "vi": "100g", "en": "100g" },
    "calories": 250,
    "protein": 26,
    "tags": ["meat", "high-protein"]
  }
]
```

**Migration v1 → v2:** Thêm trường `tags` (default `[]`). Thêm `unit` dạng `LocalizedString` thay vì `string`.

---

### `mp-dishes` — `Dish[]`

```typescript
interface Dish {
  id: string;                    // UUID
  name: LocalizedString;         // { vi: "Bò xào cần tây", en: "Beef with celery" }
  ingredients: DishIngredient[]; // Danh sách nguyên liệu trong món
  tags?: string[];               // Nhãn phân loại
  imageBase64?: string;          // Ảnh món ăn (optional)
}

interface DishIngredient {
  ingredientId: string;          // FK → Ingredient.id
  quantity: number;              // Số đơn vị (ví dụ: 2 = 2×100g)
}
```

**Ví dụ:**
```json
[
  {
    "id": "1709123456790",
    "name": { "vi": "Bò xào cần tây", "en": "Beef with celery" },
    "ingredients": [
      { "ingredientId": "1709123456789", "quantity": 2 },
      { "ingredientId": "1709123456791", "quantity": 1 }
    ],
    "tags": ["beef", "stir-fry"]
  }
]
```

**Computed fields** (không lưu, tính realtime):
- `totalCalories = sum(ingredient.calories × quantity)`
- `totalProtein = sum(ingredient.protein × quantity)`

---

### `mp-day-plans` — `DayPlan[]`

```typescript
interface DayPlan {
  date: string;                  // ISO 8601, ví dụ: "2026-03-06"
  meals: MealEntry[];            // Bữa ăn trong ngày
}

interface MealEntry {
  mealType: MealType;            // "breakfast" | "lunch" | "dinner" | "snack"
  dishId: string;                // FK → Dish.id
  quantity: number;              // Số phần (thường = 1)
}
```

**Ví dụ:**
```json
[
  {
    "date": "2026-03-06",
    "meals": [
      { "mealType": "breakfast", "dishId": "1709123456790", "quantity": 1 },
      { "mealType": "lunch", "dishId": "1709123456792", "quantity": 1 }
    ]
  }
]
```

**Constraint:** Mỗi `date` chỉ xuất hiện 1 lần trong array. Nếu không có DayPlan cho ngày đó, ngày đó không có bữa ăn nào được lên kế hoạch.

---

### `mp-user-profile` — `UserProfile`

```typescript
interface UserProfile {
  weight: number;               // Cân nặng (kg), default: 83
  proteinRatio: number;         // Hệ số protein (g/kg), default: 2.0
  targetCalories: number;       // Mục tiêu calo/ngày, default: 1500
  language?: 'vi' | 'en';      // Ngôn ngữ giao diện, default: 'vi'
}
```

**Ví dụ:**
```json
{
  "weight": 75,
  "proteinRatio": 2.0,
  "targetCalories": 1800,
  "language": "vi"
}
```

**Business rule:**
```
protein_target_per_day = weight × proteinRatio
Ví dụ: 75kg × 2g/kg = 150g protein/ngày
```

---

## Migration Strategy

Khi schema thay đổi, `dataService.ts` chạy migration khi load data:

```typescript
// src/services/dataService.ts
function migrateIngredients(raw: unknown[]): Ingredient[] {
  return raw.map(item => ({
    // v1 defaults
    tags: [],
    // spread existing fields
    ...item,
    // v2: ensure LocalizedString for unit
    unit: typeof item.unit === 'string'
      ? { vi: item.unit, en: item.unit }
      : item.unit,
    name: typeof item.name === 'string'
      ? { vi: item.name, en: '' }
      : item.name,
  }));
}
```

Migration chạy **mỗi lần app khởi động**, idempotent (an toàn khi chạy nhiều lần).

---

## Giới hạn và chú ý

| Vấn đề | Chi tiết |
|--------|---------|
| **Dung lượng** | localStorage tối đa ~5-10 MB/origin. `imageBase64` có thể chiếm nhiều dung lượng. Khuyến nghị: nén ảnh trước khi lưu. |
| **Xóa data** | Clear browser data / uninstall app → mất toàn bộ. Dùng Export trước khi xóa. |
| **Android WebView** | Dữ liệu lưu trong WebView storage của app `com.mealplaner.app`. Không chia sẻ với browser Chrome. |
| **Import validation** | Khi import, `validateImportData()` kiểm tra cấu trúc trước khi ghi đè localStorage. |
| **ID format** | Dùng `Date.now().toString()` làm ID — đủ unique trong single-user app. |
| **Backup** | Export tạo file JSON toàn bộ có thể dùng `Share` (Android) hoặc download (web). |

---

## Utility functions

```typescript
// Đọc dữ liệu
import { usePersistedState } from '../hooks/usePersistedState';
const [ingredients, setIngredients] = usePersistedState<Ingredient[]>('mp-ingredients', []);

// Tạo Ingredient mới
import { createIngredient } from '../services/dataService';
const newIng = createIngredient({ name: 'Trứng', unit: 'quả', calories: 70, protein: 6 });

// Kiểm tra dung lượng dùng
const totalBytes = ['mp-ingredients', 'mp-dishes', 'mp-day-plans', 'mp-user-profile']
  .reduce((sum, key) => sum + (localStorage.getItem(key)?.length ?? 0) * 2, 0);
console.log(`Storage used: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
```
