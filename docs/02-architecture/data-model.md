# Data Model — Smart Meal Planner

**Version:** 1.0  
**Date:** 2026-03-06  
**Source of truth:** `src/types.ts`

---

## 1. Core Domain Types

### 1.1 Ingredient

Đơn vị nhỏ nhất — một nguyên liệu thực phẩm với thông tin dinh dưỡng per-100g.

```typescript
type Ingredient = {
  id: string;              // UUID: generateId() → timestamp-based unique string
  name: LocalizedString;   // { vi: 'Thịt bò', en: 'Beef' }
  unit: LocalizedString;   // { vi: 'g', en: 'g' }  — đơn vị mặc định
  caloriesPer100: number;  // kcal per 100 của đơn vị
  proteinPer100: number;   // g protein per 100
  carbsPer100: number;     // g carbohydrate per 100
  fatPer100: number;       // g fat per 100
  fiberPer100: number;     // g dietary fiber per 100
};

type LocalizedString = Record<'vi' | 'en', string>;
```

**Ví dụ:**
```json
{
  "id": "ing_1706234567890",
  "name": { "vi": "Ức gà", "en": "Chicken Breast" },
  "unit": { "vi": "g", "en": "g" },
  "caloriesPer100": 165,
  "proteinPer100": 31,
  "carbsPer100": 0,
  "fatPer100": 3.6,
  "fiberPer100": 0
}
```

### 1.2 DishIngredient

Liên kết giữa `Dish` và `Ingredient` kèm khối lượng cụ thể.

```typescript
type DishIngredient = {
  ingredientId: string;  // FK → Ingredient.id
  amount: number;        // số lượng tính theo Ingredient.unit
};
```

### 1.3 Dish

Một món ăn hoàn chỉnh gồm nhiều nguyên liệu.

```typescript
type Dish = {
  id: string;
  name: LocalizedString;
  ingredients: DishIngredient[];
  tags: MealType[];       // ['breakfast', 'lunch', 'dinner']
};

type MealType = 'breakfast' | 'lunch' | 'dinner';
```

**Ví dụ:**
```json
{
  "id": "dish_1706234567891",
  "name": { "vi": "Cơm gà luộc", "en": "Boiled Chicken Rice" },
  "ingredients": [
    { "ingredientId": "ing_1706234567890", "amount": 200 },
    { "ingredientId": "ing_rice", "amount": 150 }
  ],
  "tags": ["lunch", "dinner"]
}
```

### 1.4 DayPlan

Kế hoạch bữa ăn của một ngày cụ thể.

```typescript
type DayPlan = {
  date: string;              // 'YYYY-MM-DD' format
  breakfastDishIds: string[]; // Dish.id[]
  lunchDishIds: string[];
  dinnerDishIds: string[];
};
```

**Ví dụ:**
```json
{
  "date": "2026-03-06",
  "breakfastDishIds": ["dish_001"],
  "lunchDishIds": ["dish_002", "dish_003"],
  "dinnerDishIds": []
}
```

### 1.5 UserProfile

Thông tin mục tiêu dinh dưỡng cá nhân.

```typescript
type UserProfile = {
  weight: number;        // kg — dùng để tính protein target
  proteinRatio: number;  // g/kg — thường 1.6–2.2 cho người tập gym
  targetCalories: number; // kcal/ngày
};
```

**Defaults:** `{ weight: 83, proteinRatio: 2, targetCalories: 1500 }`

---

## 2. Derived / Computed Types (không persist)

### 2.1 NutritionInfo

```typescript
type NutritionInfo = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};
```

**Công thức tính:**
```
calories = Σ (ingredient.caloriesPer100 / 100 × dishIngredient.amount)
```

### 2.2 SlotInfo

```typescript
type SlotInfo = {
  dishIds: string[];
} & NutritionInfo;
```

### 2.3 DayNutritionSummary

```typescript
type DayNutritionSummary = {
  breakfast: SlotInfo;
  lunch: SlotInfo;
  dinner: SlotInfo;
};
```

---

## 3. AI Response Types

### 3.1 AnalyzedDishResult (Gemini → App)

```typescript
type AnalyzedDishResult = {
  isFood: boolean;
  notFoodReason?: string;  // khi isFood = false
  name: string;
  description: string;
  totalNutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  ingredients: AnalyzedIngredient[];
};

type AnalyzedIngredient = {
  name: string;
  amount: number;
  unit: string;
  nutritionPerStandardUnit: AnalyzedNutritionPerUnit;
};

type AnalyzedNutritionPerUnit = {
  calories: number; protein: number;
  carbs: number; fat: number; fiber: number;
};
```

### 3.2 MealPlanSuggestion (Gemini → App)

```typescript
type MealPlanSuggestion = {
  breakfastDishIds: string[];
  lunchDishIds: string[];
  dinnerDishIds: string[];
  reasoning: string;  // bắt buộc theo schema validation
};
```

### 3.3 IngredientSuggestion (Gemini → App)

```typescript
type IngredientSuggestion = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  unit: string;
};
```

---

## 4. Entity Relationship Diagram

```
┌───────────────────┐        ┌──────────────────────┐
│    Ingredient     │        │   DishIngredient     │
│───────────────────│        │──────────────────────│
│ + id: string (PK) │◄───────│ + ingredientId (FK)  │
│ + name: LSt       │ 1   N  │ + amount: number     │
│ + unit: LSt       │        └──────────┬───────────┘
│ + calories/100    │                   │ N
│ + protein/100     │                   │
│ + carbs/100       │                   │ 1
│ + fat/100         │        ┌──────────▼───────────┐
│ + fiber/100       │        │        Dish          │
└───────────────────┘        │──────────────────────│
                             │ + id: string (PK)    │
                             │ + name: LSt          │
                             │ + ingredients[]      │
                             │ + tags: MealType[]   │
                             └──────────┬───────────┘
                                        │ N  (dishIds arrays)
                                        │
                                        │ 1
                             ┌──────────▼───────────┐
                             │       DayPlan        │
                             │──────────────────────│
                             │ + date: string (PK)  │
                             │ + breakfastDishIds[] │
                             │ + lunchDishIds[]     │
                             │ + dinnerDishIds[]    │
                             └──────────────────────┘

LSt = LocalizedString { vi: string, en: string }
```

---

## 5. Data Migration (Schema Evolution)

`dataService.ts` xử lý các migration khi đọc dữ liệu cũ từ localStorage.

### 5.1 Ingredient Migration

| Version | Thay đổi |
|---------|---------|
| v1 | `name: string` (plain) |
| v2 | `name: LocalizedString` → Migration: `{ vi: oldName, en: oldName }` |
| v1 | `unit: string` (plain) |
| v2 | `unit: LocalizedString` → Migration: `{ vi: oldUnit, en: oldUnit }` |

### 5.2 Dish Migration

| Version | Thay đổi |
|---------|---------|
| v1 | `name: string` (plain) |
| v2 | `name: LocalizedString` |
| v1 | `tags` field không có → default `['lunch']` |
| v2 | `tags: MealType[]` |

### 5.3 DayPlan Migration

| Version | Thay đổi |
|---------|---------|
| v1 | `breakfastId: string` (singular) |
| v2 | `breakfastDishIds: string[]` (array) |

---

## 6. localStorage Keys

| Key | Type | Mô tả |
|-----|------|-------|
| `mp-ingredients` | `Ingredient[]` | Thư viện nguyên liệu |
| `mp-dishes` | `Dish[]` | Thư viện món ăn |
| `mp-day-plans` | `DayPlan[]` | Kế hoạch bữa ăn (sparse — chỉ lưu ngày có plan) |
| `mp-user-profile` | `UserProfile` | Mục tiêu dinh dưỡng cá nhân |
| `i18nextLng` | `string` | Ngôn ngữ hiện tại (managed by i18next) |
| `theme` | `'light'\|'dark'\|'system'` | Theme (managed by useDarkMode) |

---

## 7. Initial Data

File `src/data/initialData.ts` cung cấp bộ dữ liệu mẫu mặc định:
- Khoảng 20-30 nguyên liệu phổ biến trong ẩm thực Việt Nam
- Khoảng 10-15 món ăn mẫu (cơm, phở, bún, trứng, rau...)

Chỉ được dùng khi `localStorage` trống (lần khởi chạy đầu tiên).
