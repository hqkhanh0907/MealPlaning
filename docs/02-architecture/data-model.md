# Data Model — Smart Meal Planner

**Version:** 2.0  
**Date:** 2026-07-16  
**Source of truth:** `src/types.ts` (domain types), `src/features/fitness/types.ts` (fitness types), `src/features/health-profile/types.ts` (health types), `src/services/schema.ts` (SQLite schema)

---

## 1. Core Domain Types

### 1.1 Ingredient

Đơn vị nhỏ nhất — một nguyên liệu thực phẩm với thông tin dinh dưỡng per-100g.

```typescript
type Ingredient = {
  id: string; // UUID: generateId() → timestamp-based unique string
  name: LocalizedString; // { vi: 'Thịt bò', en: 'Beef' }
  unit: LocalizedString; // { vi: 'g', en: 'g' }  — đơn vị mặc định
  caloriesPer100: number; // kcal per 100 của đơn vị
  proteinPer100: number; // g protein per 100
  carbsPer100: number; // g carbohydrate per 100
  fatPer100: number; // g fat per 100
  fiberPer100: number; // g dietary fiber per 100
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
  ingredientId: string; // FK → Ingredient.id
  amount: number; // số lượng tính theo Ingredient.unit
};
```

### 1.3 Dish

Một món ăn hoàn chỉnh gồm nhiều nguyên liệu.

```typescript
type Dish = {
  id: string;
  name: LocalizedString;
  ingredients: DishIngredient[];
  tags: MealType[]; // ['breakfast', 'lunch', 'dinner']
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
  date: string; // 'YYYY-MM-DD' format
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
  weight: number; // kg — dùng để tính protein target
  proteinRatio: number; // g/kg — thường 1.6–2.2 cho người tập gym
  targetCalories: number; // kcal/ngày
};
```

**Defaults:** `{ weight: 83, proteinRatio: 2, targetCalories: 1500 }`

### 1.6 MealTemplate

Mẫu kế hoạch bữa ăn, lưu trữ trong localStorage để tái sử dụng.

```typescript
type MealTemplate = {
  id: string;
  name: string;
  breakfastDishIds: string[];
  lunchDishIds: string[];
  dinnerDishIds: string[];
  createdAt: string;
};
```

### 1.7 FilterConfig

Cấu hình lọc và sắp xếp danh sách nguyên liệu/món ăn.

```typescript
interface FilterConfig {
  sortBy: 'name-asc' | 'name-desc' | 'cal-asc' | 'cal-desc' | 'pro-asc' | 'pro-desc';
  maxCalories?: number;
  minProtein?: number;
  tags?: string[];
}
```

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
  notFoodReason?: string; // khi isFood = false
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
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};
```

### 3.2 MealPlanSuggestion (Gemini → App)

```typescript
type MealPlanSuggestion = {
  breakfastDishIds: string[];
  lunchDishIds: string[];
  dinnerDishIds: string[];
  reasoning: string; // bắt buộc theo schema validation
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

### 3.4 SuggestedDishIngredient (Gemini → App)

Nguyên liệu được AI gợi ý thêm vào món ăn, bao gồm thông tin dinh dưỡng đầy đủ.

```typescript
type SuggestedDishIngredient = {
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};
```

---

## 4. Fitness Domain Types (`src/features/fitness/types.ts`)

### 4.1 TrainingPlan

Kế hoạch tập luyện tổng thể, chứa danh sách các ngày tập.

```typescript
interface TrainingPlan {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'paused';
  splitType: string;
  strategy: 'auto' | 'manual';
  durationWeeks: number;
  currentWeek: number;
  daysPerWeek: number;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  days: TrainingDay[];
}
```

### 4.2 TrainingDay

Một ngày trong kế hoạch tập luyện, có thể là ngày nghỉ hoặc chứa các sessions.

```typescript
interface TrainingDay {
  id: string;
  planId: string;
  dayOfWeek: number; // 0 (Sunday) – 6 (Saturday)
  isRestDay: boolean;
  sessionOrder: number;
  workoutType: string; // e.g. 'chest_triceps', 'back_biceps', 'rest'
  muscleGroups?: string;
  sessions: TrainingSession[];
}
```

### 4.3 TrainingSession

Một phiên tập trong ngày, chứa danh sách bài tập đã lên kế hoạch.

```typescript
interface TrainingSession {
  id: string;
  name: string;
  sessionOrder: number;
  exercises: PlannedExercise[];
}
```

### 4.4 PlannedExercise

Bài tập đã lên kế hoạch trong session, bao gồm thông số sets/reps mục tiêu.

```typescript
interface PlannedExercise {
  exerciseId: string;
  name: string;
  muscleGroups: string[];
  sets: number;
  repsMin: number;
  repsMax: number;
  weight?: number;
  order: number;
}
```

### 4.5 WorkoutLog

Nhật ký phiên tập đã thực hiện.

```typescript
interface WorkoutLog {
  id: string;
  date: string;
  sessionId?: string; // Linked to TrainingSession, null = freestyle
  planDayId?: string; // Linked to TrainingDay, null = freestyle
  name: string;
  exercises: ExerciseLog[];
  duration?: number; // minutes
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 4.6 ExerciseLog

Log chi tiết cho một bài tập trong phiên tập.

```typescript
interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
}
```

### 4.7 SetLog

Log chi tiết cho một set trong bài tập.

```typescript
interface SetLog {
  setNumber: number;
  reps: number;
  weight: number; // kg
  completed: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  restSeconds?: number;
}
```

**Ví dụ WorkoutLog:**

```json
{
  "id": "wk_20260716_001",
  "date": "2026-07-16",
  "sessionId": "sess_001",
  "planDayId": "day_mon_001",
  "name": "Chest & Triceps",
  "exercises": [
    {
      "exerciseId": "ex_bench_press",
      "sets": [
        { "setNumber": 1, "reps": 10, "weight": 60, "completed": true },
        { "setNumber": 2, "reps": 8, "weight": 65, "completed": true },
        { "setNumber": 3, "reps": 6, "weight": 70, "completed": false }
      ]
    }
  ],
  "duration": 55,
  "notes": "Good session, increase weight next time"
}
```

---

## 5. Health Profile Types (`src/features/health-profile/types.ts`)

### 5.1 HealthProfile

Hồ sơ sức khỏe cá nhân, bao gồm thông tin cơ thể và mục tiêu dinh dưỡng.

```typescript
interface HealthProfile {
  id: string;
  name: string;
  gender: 'male' | 'female';
  dateOfBirth: string | null;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'extra_active';
  fitnessGoal?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  equipment?: string[];
  bodyFatPct?: number;
  bmrOverride?: number;
  proteinRatio: number; // g/kg — thường 1.6–2.2
  fatPct: number;
  targetCalories: number;
  updatedAt: string;
}
```

**Ví dụ:**

```json
{
  "id": "default",
  "name": "Nguyễn Văn A",
  "gender": "male",
  "dateOfBirth": "1995-06-15",
  "age": 31,
  "heightCm": 175,
  "weightKg": 78,
  "activityLevel": "active",
  "fitnessGoal": "hypertrophy",
  "experienceLevel": "intermediate",
  "equipment": ["barbell", "dumbbell", "cable_machine"],
  "proteinRatio": 2.0,
  "fatPct": 0.25,
  "targetCalories": 2500,
  "updatedAt": "2026-07-16T10:00:00Z"
}
```

### 5.2 OnboardingState

Trạng thái onboarding của ứng dụng, được persist qua Zustand middleware.

```typescript
interface OnboardingState {
  isAppOnboarded: boolean;
  onboardingSection: number | null;
  completed: boolean;
  currentStep: number;
  planStrategy: 'auto' | 'manual';
}
```

| Field               | Mô tả                                                             |
| ------------------- | ----------------------------------------------------------------- |
| `isAppOnboarded`    | `true` khi user đã hoàn thành onboarding wizard                   |
| `onboardingSection` | Section hiện tại trong wizard (null = chưa bắt đầu)               |
| `completed`         | Alias cho `isAppOnboarded` — backward compatibility               |
| `currentStep`       | Step index hiện tại (0-based)                                     |
| `planStrategy`      | Chiến lược tạo plan: `auto` (app tạo) hoặc `manual` (user tự xây) |

---

## 6. Entity Relationship Diagram

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

### 6.2 Fitness Entity Relationships

```
┌───────────────────┐         ┌──────────────────────┐
│   TrainingPlan    │         │    TrainingDay        │
│───────────────────│  1   N  │──────────────────────│
│ + id (PK)         │────────►│ + id (PK)            │
│ + strategy        │         │ + planId (FK)        │
│ + durationWeeks   │         │ + dayOfWeek          │
│ + daysPerWeek     │         │ + isRestDay          │
│ + days[]          │         │ + sessions[]         │
└───────────────────┘         └──────────┬───────────┘
                                         │ 1
                                         │
                                         │ N
                              ┌──────────▼───────────┐
                              │   TrainingSession    │
                              │──────────────────────│
                              │ + id (PK)            │
                              │ + name               │
                              │ + exercises[]        │
                              └──────────┬───────────┘
                                         │ 1
                                         │
                                         │ N
                              ┌──────────▼───────────┐
                              │  PlannedExercise     │
                              │──────────────────────│
                              │ + exerciseId (FK)    │
                              │ + sets, repsMin/Max  │
                              │ + weight, order      │
                              └──────────────────────┘

┌───────────────────┐         ┌──────────────────────┐
│    WorkoutLog     │         │    ExerciseLog       │
│───────────────────│  1   N  │──────────────────────│
│ + id (PK)         │────────►│ + exerciseId (FK)    │
│ + date            │         │ + sets[]             │
│ + sessionId (FK)  │         └──────────┬───────────┘
│ + duration        │                    │ 1
│ + notes           │                    │
└───────────────────┘                    │ N
                              ┌──────────▼───────────┐
                              │      SetLog          │
HealthProfile ◄──────────────►│──────────────────────│
  + name                      │ + reps               │
  + gender                    │ + weight             │
  + dateOfBirth               │ + completed          │
  + heightCm                  └──────────────────────┘
  + weightKg
  + activityLevel
  + fitnessGoal
  + experienceLevel
```

---

## 7. Data Migration (Schema Evolution)

`dataService.ts` xử lý các migration khi đọc dữ liệu cũ từ localStorage.

### 7.1 Ingredient Migration

| Version | Thay đổi                                                            |
| ------- | ------------------------------------------------------------------- |
| v1      | `name: string` (plain)                                              |
| v2      | `name: LocalizedString` → Migration: `{ vi: oldName, en: oldName }` |
| v1      | `unit: string` (plain)                                              |
| v2      | `unit: LocalizedString` → Migration: `{ vi: oldUnit, en: oldUnit }` |

### 7.2 Dish Migration

| Version | Thay đổi                                    |
| ------- | ------------------------------------------- |
| v1      | `name: string` (plain)                      |
| v2      | `name: LocalizedString`                     |
| v1      | `tags` field không có → default `['lunch']` |
| v2      | `tags: MealType[]`                          |

### 7.3 DayPlan Migration

| Version | Thay đổi                             |
| ------- | ------------------------------------ |
| v1      | `breakfastId: string` (singular)     |
| v2      | `breakfastDishIds: string[]` (array) |

### 7.4 Migration Functions (`dataService.ts`)

Ba hàm migration chạy tự động khi đọc dữ liệu từ localStorage:

| Function                                                   | Mô tả                                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `migrateIngredients(ingredients: unknown[]): Ingredient[]` | Lọc dữ liệu invalid, chuyển `name` và `unit` sang `LocalizedString` qua `toLocalized()`                                 |
| `migrateDishes(dishes: unknown[]): Dish[]`                 | Lọc dữ liệu invalid, chuyển `name` sang `LocalizedString`, đảm bảo `tags` tồn tại (default: `['lunch']`)                |
| `migrateDayPlans(plans: unknown[]): DayPlan[]`             | Chuyển đổi format cũ (singular dishId) sang format mới (dishIds arrays), tạo empty plan nếu format không nhận diện được |

---

## 8. localStorage Keys (Legacy)

| Key                  | Type                        | Mô tả                                                      |
| -------------------- | --------------------------- | ---------------------------------------------------------- |
| `mp-ingredients`     | `Ingredient[]`              | Thư viện nguyên liệu                                       |
| `mp-dishes`          | `Dish[]`                    | Thư viện món ăn                                            |
| `mp-day-plans`       | `DayPlan[]`                 | Kế hoạch bữa ăn (sparse — chỉ lưu ngày có plan)            |
| `mp-user-profile`    | `UserProfile`               | Mục tiêu dinh dưỡng cá nhân                                |
| `mp-templates`       | `MealTemplate[]`            | Meal plan templates để tái sử dụng                         |
| `mp-translate-queue` | `TranslateQueueState`       | Zustand-persisted translation queue (pending/running jobs) |
| `i18nextLng`         | `string`                    | Ngôn ngữ hiện tại (managed by i18next)                     |
| `theme`              | `'light'\|'dark'\|'system'` | Theme (managed by useDarkMode)                             |

---

## 9. Initial Data

File `src/data/initialData.ts` cung cấp bộ dữ liệu mẫu mặc định:

- Khoảng 20-30 nguyên liệu phổ biến trong ẩm thực Việt Nam
- Khoảng 10-15 món ăn mẫu (cơm, phở, bún, trứng, rau...)

Chỉ được dùng khi `localStorage` trống (lần khởi chạy đầu tiên).

---

## 10. SQLite Database Schema (27 Tables)

> **Source of truth:** `src/services/schema.ts` — `SCHEMA_VERSION = 6`
>
> Ứng dụng đã chuyển từ localStorage sang SQLite (via sql.js WASM). Schema gồm **27 bảng** chia thành 5 nhóm chức năng.

### 10.1 Meal Planning Tables (migrated from localStorage)

#### `ingredients`

| Column             | Type | Constraints |
| ------------------ | ---- | ----------- |
| `id`               | TEXT | PRIMARY KEY |
| `name_vi`          | TEXT | NOT NULL    |
| `name_en`          | TEXT |             |
| `calories_per_100` | REAL | NOT NULL    |
| `protein_per_100`  | REAL | NOT NULL    |
| `carbs_per_100`    | REAL | NOT NULL    |
| `fat_per_100`      | REAL | NOT NULL    |
| `fiber_per_100`    | REAL | NOT NULL    |
| `unit_vi`          | TEXT | NOT NULL    |
| `unit_en`          | TEXT |             |

#### `dishes`

| Column    | Type    | Constraints                       |
| --------- | ------- | --------------------------------- |
| `id`      | TEXT    | PRIMARY KEY                       |
| `name_vi` | TEXT    | NOT NULL                          |
| `name_en` | TEXT    |                                   |
| `tags`    | TEXT    | NOT NULL (JSON array of MealType) |
| `rating`  | INTEGER |                                   |
| `notes`   | TEXT    |                                   |

#### `dish_ingredients`

| Column          | Type | Constraints                                   |
| --------------- | ---- | --------------------------------------------- |
| `dish_id`       | TEXT | NOT NULL, FK → `dishes(id)` ON DELETE CASCADE |
| `ingredient_id` | TEXT | NOT NULL, FK → `ingredients(id)`              |
| `amount`        | REAL | NOT NULL                                      |

**Primary Key:** `(dish_id, ingredient_id)`

#### `day_plans`

| Column               | Type | Constraints           |
| -------------------- | ---- | --------------------- |
| `date`               | TEXT | PRIMARY KEY           |
| `breakfast_dish_ids` | TEXT | NOT NULL (JSON array) |
| `lunch_dish_ids`     | TEXT | NOT NULL (JSON array) |
| `dinner_dish_ids`    | TEXT | NOT NULL (JSON array) |
| `servings`           | TEXT | (JSON)                |

#### `meal_templates`

| Column | Type | Constraints          |
| ------ | ---- | -------------------- |
| `id`   | TEXT | PRIMARY KEY          |
| `name` | TEXT | NOT NULL             |
| `data` | TEXT | NOT NULL (JSON blob) |

### 10.2 User & Goal Tables

#### `user_profile`

| Column           | Type    | Constraints                                                                                             |
| ---------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| `id`             | TEXT    | PRIMARY KEY, DEFAULT `'default'`                                                                        |
| `gender`         | TEXT    | NOT NULL, CHECK `IN ('male', 'female')`                                                                 |
| `age`            | INTEGER | NOT NULL                                                                                                |
| `height_cm`      | REAL    | NOT NULL                                                                                                |
| `weight_kg`      | REAL    | NOT NULL                                                                                                |
| `activity_level` | TEXT    | NOT NULL, DEFAULT `'moderate'`, CHECK `IN ('sedentary', 'light', 'moderate', 'active', 'extra_active')` |
| `body_fat_pct`   | REAL    |                                                                                                         |
| `bmr_override`   | REAL    |                                                                                                         |
| `protein_ratio`  | REAL    | NOT NULL, DEFAULT `2.0`                                                                                 |
| `fat_pct`        | REAL    | NOT NULL, DEFAULT `0.25`                                                                                |
| `updated_at`     | TEXT    | NOT NULL                                                                                                |

#### `goals`

| Column             | Type    | Constraints                                                                           |
| ------------------ | ------- | ------------------------------------------------------------------------------------- |
| `id`               | TEXT    | PRIMARY KEY                                                                           |
| `type`             | TEXT    | NOT NULL, CHECK `IN ('cut', 'bulk', 'maintain')`                                      |
| `rate_of_change`   | TEXT    | NOT NULL, DEFAULT `'moderate'`, CHECK `IN ('conservative', 'moderate', 'aggressive')` |
| `target_weight_kg` | REAL    |                                                                                       |
| `calorie_offset`   | INTEGER | NOT NULL                                                                              |
| `start_date`       | TEXT    | NOT NULL                                                                              |
| `end_date`         | TEXT    |                                                                                       |
| `is_active`        | INTEGER | NOT NULL, DEFAULT `1`                                                                 |
| `created_at`       | TEXT    | NOT NULL                                                                              |
| `updated_at`       | TEXT    | NOT NULL                                                                              |

### 10.3 Training System Tables

#### `training_profile`

| Column                 | Type    | Constraints                                                                |
| ---------------------- | ------- | -------------------------------------------------------------------------- |
| `id`                   | TEXT    | PRIMARY KEY, DEFAULT `'default'`                                           |
| `training_experience`  | TEXT    | NOT NULL, CHECK `IN ('beginner', 'intermediate', 'advanced')`              |
| `days_per_week`        | INTEGER | NOT NULL, CHECK `BETWEEN 2 AND 6`                                          |
| `session_duration_min` | INTEGER | NOT NULL, CHECK `IN (30, 45, 60, 90)`                                      |
| `training_goal`        | TEXT    | NOT NULL, CHECK `IN ('strength', 'hypertrophy', 'endurance', 'general')`   |
| `available_equipment`  | TEXT    | NOT NULL, DEFAULT `'[]'`                                                   |
| `injury_restrictions`  | TEXT    | DEFAULT `'[]'`                                                             |
| `periodization_model`  | TEXT    | NOT NULL, DEFAULT `'linear'`, CHECK `IN ('linear', 'undulating', 'block')` |
| `plan_cycle_weeks`     | INTEGER | NOT NULL, DEFAULT `4`, CHECK `IN (4, 6, 8, 12)`                            |
| `priority_muscles`     | TEXT    | DEFAULT `'[]'`                                                             |
| `cardio_sessions_week` | INTEGER | NOT NULL, DEFAULT `0`, CHECK `BETWEEN 0 AND 5`                             |
| `cardio_type_pref`     | TEXT    | DEFAULT `'mixed'`, CHECK `IN ('liss', 'hiit', 'mixed')`                    |
| `cardio_duration_min`  | INTEGER | DEFAULT `30`, CHECK `IN (15, 20, 30, 45, 60)`                              |
| `known_1rm`            | TEXT    | (JSON)                                                                     |
| `avg_sleep_hours`      | REAL    |                                                                            |
| `updated_at`           | TEXT    | NOT NULL                                                                   |

#### `training_plans`

| Column           | Type    | Constraints                                                      |
| ---------------- | ------- | ---------------------------------------------------------------- |
| `id`             | TEXT    | PRIMARY KEY, DEFAULT `lower(hex(randomblob(16)))`                |
| `name`           | TEXT    | NOT NULL                                                         |
| `status`         | TEXT    | DEFAULT `'active'`, CHECK `IN ('active', 'completed', 'paused')` |
| `split_type`     | TEXT    | NOT NULL                                                         |
| `duration_weeks` | INTEGER | NOT NULL                                                         |
| `start_date`     | TEXT    | NOT NULL                                                         |
| `end_date`       | TEXT    |                                                                  |
| `created_at`     | TEXT    | DEFAULT `datetime('now')`                                        |
| `updated_at`     | TEXT    | DEFAULT `datetime('now')`                                        |

#### `training_plan_days`

| Column          | Type    | Constraints                                           |
| --------------- | ------- | ----------------------------------------------------- |
| `id`            | TEXT    | PRIMARY KEY, DEFAULT `lower(hex(randomblob(16)))`     |
| `plan_id`       | TEXT    | NOT NULL, FK → `training_plans(id)` ON DELETE CASCADE |
| `day_of_week`   | INTEGER | NOT NULL, CHECK `BETWEEN 0 AND 6`                     |
| `workout_type`  | TEXT    | NOT NULL                                              |
| `muscle_groups` | TEXT    |                                                       |
| `exercises`     | TEXT    | (JSON)                                                |
| `notes`         | TEXT    |                                                       |

#### `exercises`

| Column              | Type    | Constraints                                                 |
| ------------------- | ------- | ----------------------------------------------------------- |
| `id`                | TEXT    | PRIMARY KEY                                                 |
| `name_vi`           | TEXT    | NOT NULL                                                    |
| `name_en`           | TEXT    |                                                             |
| `muscle_group`      | TEXT    | NOT NULL                                                    |
| `secondary_muscles` | TEXT    | DEFAULT `'[]'`                                              |
| `category`          | TEXT    | NOT NULL, CHECK `IN ('compound', 'secondary', 'isolation')` |
| `equipment`         | TEXT    | NOT NULL, DEFAULT `'[]'`                                    |
| `contraindicated`   | TEXT    | DEFAULT `'[]'`                                              |
| `exercise_type`     | TEXT    | NOT NULL, CHECK `IN ('strength', 'cardio')`                 |
| `default_reps_min`  | INTEGER | NOT NULL, DEFAULT `8`                                       |
| `default_reps_max`  | INTEGER | NOT NULL, DEFAULT `12`                                      |
| `is_custom`         | INTEGER | NOT NULL, DEFAULT `0`                                       |
| `updated_at`        | TEXT    | NOT NULL                                                    |

#### `workouts`

| Column         | Type    | Constraints |
| -------------- | ------- | ----------- |
| `id`           | TEXT    | PRIMARY KEY |
| `date`         | TEXT    | NOT NULL    |
| `name`         | TEXT    | NOT NULL    |
| `duration_min` | INTEGER |             |
| `notes`        | TEXT    |             |
| `created_at`   | TEXT    | NOT NULL    |
| `updated_at`   | TEXT    | NOT NULL    |

#### `workout_sets`

| Column               | Type    | Constraints                                     |
| -------------------- | ------- | ----------------------------------------------- |
| `id`                 | TEXT    | PRIMARY KEY                                     |
| `workout_id`         | TEXT    | NOT NULL, FK → `workouts(id)` ON DELETE CASCADE |
| `exercise_id`        | TEXT    | FK → `exercises(id)` ON DELETE SET NULL         |
| `set_number`         | INTEGER | NOT NULL                                        |
| `reps`               | INTEGER |                                                 |
| `weight_kg`          | REAL    | DEFAULT `0`                                     |
| `rpe`                | REAL    |                                                 |
| `rest_seconds`       | INTEGER |                                                 |
| `duration_min`       | REAL    |                                                 |
| `distance_km`        | REAL    |                                                 |
| `avg_heart_rate`     | INTEGER |                                                 |
| `intensity`          | TEXT    | CHECK `IN ('low', 'moderate', 'high')`          |
| `estimated_calories` | REAL    |                                                 |
| `updated_at`         | TEXT    | NOT NULL                                        |

**Unique constraint:** `(workout_id, exercise_id, set_number)`

### 10.4 Tracking & Logging Tables

#### `weight_log`

| Column       | Type | Constraints      |
| ------------ | ---- | ---------------- |
| `id`         | TEXT | PRIMARY KEY      |
| `date`       | TEXT | NOT NULL, UNIQUE |
| `weight_kg`  | REAL | NOT NULL         |
| `notes`      | TEXT |                  |
| `created_at` | TEXT | NOT NULL         |
| `updated_at` | TEXT | NOT NULL         |

#### `daily_log`

| Column              | Type    | Constraints           |
| ------------------- | ------- | --------------------- |
| `id`                | TEXT    | PRIMARY KEY           |
| `date`              | TEXT    | NOT NULL, UNIQUE      |
| `target_calories`   | REAL    | NOT NULL              |
| `actual_calories`   | REAL    | NOT NULL              |
| `target_protein`    | REAL    | NOT NULL              |
| `actual_protein`    | REAL    | NOT NULL              |
| `target_fat`        | REAL    |                       |
| `actual_fat`        | REAL    | DEFAULT `0`           |
| `target_carbs`      | REAL    |                       |
| `actual_carbs`      | REAL    | DEFAULT `0`           |
| `adherence_cal`     | INTEGER | NOT NULL, DEFAULT `0` |
| `adherence_protein` | INTEGER | NOT NULL, DEFAULT `0` |
| `updated_at`        | TEXT    | NOT NULL              |

#### `adjustments`

| Column              | Type    | Constraints                             |
| ------------------- | ------- | --------------------------------------- |
| `id`                | TEXT    | PRIMARY KEY                             |
| `date`              | TEXT    | NOT NULL                                |
| `reason`            | TEXT    | NOT NULL                                |
| `old_target_cal`    | REAL    | NOT NULL                                |
| `new_target_cal`    | REAL    | NOT NULL                                |
| `trigger_type`      | TEXT    | NOT NULL, CHECK `IN ('auto', 'manual')` |
| `moving_avg_weight` | REAL    |                                         |
| `applied`           | INTEGER | NOT NULL, DEFAULT `0`                   |
| `created_at`        | TEXT    | NOT NULL                                |

### 10.5 Fitness Module Tables

> Ba bảng mới phục vụ module Fitness, quản lý hồ sơ thể lực, tùy chọn tập luyện và bản nháp workout đang thực hiện.

#### `fitness_profiles`

Lưu hồ sơ thể lực của người dùng (kinh nghiệm, mục tiêu, thông số cơ thể).

| Column           | Type    | Constraints                      |
| ---------------- | ------- | -------------------------------- |
| `id`             | TEXT    | PRIMARY KEY, DEFAULT `'default'` |
| `experience`     | TEXT    | NOT NULL, DEFAULT `'beginner'`   |
| `goal`           | TEXT    | NOT NULL, DEFAULT `'general'`    |
| `days_per_week`  | INTEGER | NOT NULL, DEFAULT `3`            |
| `body_weight_kg` | REAL    |                                  |
| `height_cm`      | REAL    |                                  |
| `gender`         | TEXT    |                                  |
| `birthdate`      | TEXT    |                                  |
| `created_at`     | TEXT    | NOT NULL                         |
| `updated_at`     | TEXT    | NOT NULL                         |

#### `fitness_preferences`

Lưu tùy chọn cá nhân cho module Fitness (đơn vị đo, timer, RPE, thông báo).

| Column                 | Type    | Constraints                      |
| ---------------------- | ------- | -------------------------------- |
| `id`                   | TEXT    | PRIMARY KEY, DEFAULT `'default'` |
| `unit_system`          | TEXT    | NOT NULL, DEFAULT `'metric'`     |
| `rest_timer_enabled`   | INTEGER | NOT NULL, DEFAULT `1`            |
| `default_rest_seconds` | INTEGER | NOT NULL, DEFAULT `90`           |
| `show_rpe`             | INTEGER | NOT NULL, DEFAULT `1`            |
| `enable_notifications` | INTEGER | NOT NULL, DEFAULT `1`            |
| `updated_at`           | TEXT    | NOT NULL                         |

#### `workout_drafts`

Lưu bản nháp workout đang thực hiện (tránh mất dữ liệu khi app crash hoặc navigate away).

| Column           | Type | Constraints                      |
| ---------------- | ---- | -------------------------------- |
| `id`             | TEXT | PRIMARY KEY, DEFAULT `'current'` |
| `exercises_json` | TEXT | NOT NULL, DEFAULT `'[]'`         |
| `sets_json`      | TEXT | NOT NULL, DEFAULT `'[]'`         |
| `start_time`     | TEXT | NOT NULL                         |
| `plan_day_id`    | TEXT |                                  |
| `updated_at`     | TEXT | NOT NULL                         |

### 10.6 Performance Indexes

| Index                             | Table              | Column(s)       |
| --------------------------------- | ------------------ | --------------- |
| `idx_workout_sets_workout`        | `workout_sets`     | `workout_id`    |
| `idx_workout_sets_exercise`       | `workout_sets`     | `exercise_id`   |
| `idx_weight_log_date`             | `weight_log`       | `date`          |
| `idx_daily_log_date`              | `daily_log`        | `date`          |
| `idx_workouts_date`               | `workouts`         | `date`          |
| `idx_goals_active`                | `goals`            | `is_active`     |
| `idx_adjustments_date`            | `adjustments`      | `date`          |
| `idx_dish_ingredients_dish`       | `dish_ingredients` | `dish_id`       |
| `idx_dish_ingredients_ingredient` | `dish_ingredients` | `ingredient_id` |

### 10.7 Table Summary

| #   | Table                 | Group         | Description                         |
| --- | --------------------- | ------------- | ----------------------------------- |
| 1   | `ingredients`         | Meal Planning | Thư viện nguyên liệu                |
| 2   | `dishes`              | Meal Planning | Thư viện món ăn                     |
| 3   | `dish_ingredients`    | Meal Planning | Liên kết món ăn ↔ nguyên liệu       |
| 4   | `day_plans`           | Meal Planning | Kế hoạch bữa ăn theo ngày           |
| 5   | `meal_templates`      | Meal Planning | Mẫu kế hoạch bữa ăn                 |
| 6   | `user_profile`        | User & Goal   | Hồ sơ dinh dưỡng cá nhân            |
| 7   | `goals`               | User & Goal   | Mục tiêu cut/bulk/maintain          |
| 8   | `training_profile`    | Training      | Hồ sơ tập luyện chi tiết            |
| 9   | `training_plans`      | Training      | Kế hoạch tập luyện                  |
| 10  | `training_plan_days`  | Training      | Ngày tập trong kế hoạch             |
| 11  | `exercises`           | Training      | Thư viện bài tập                    |
| 12  | `workouts`            | Training      | Phiên tập đã ghi nhận               |
| 13  | `workout_sets`        | Training      | Các set trong phiên tập             |
| 14  | `weight_log`          | Tracking      | Nhật ký cân nặng                    |
| 15  | `daily_log`           | Tracking      | Nhật ký dinh dưỡng hàng ngày        |
| 16  | `adjustments`         | Tracking      | Điều chỉnh mục tiêu calories        |
| 17  | `fitness_profiles`    | Fitness       | Hồ sơ thể lực người dùng            |
| 18  | `fitness_preferences` | Fitness       | Tùy chọn module Fitness             |
| 19  | `workout_drafts`      | Fitness       | Bản nháp workout đang thực hiện     |
| 20  | `app_settings`        | Settings      | Key-value application settings      |
| 21  | `grocery_checked`     | Meal Planning | Trạng thái đã mua của grocery items |

> **Lưu ý:** Bảng 20-21+ và các bảng bổ sung khác có thể được thêm trong các migration tiếp theo. Tham khảo `schema.ts` cho danh sách đầy đủ (SCHEMA_VERSION = 6, 28 bảng).

---

## 11. Revision History

| Version | Date       | Changes                                                                                                                                                                                                                                                                                                                  |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2026-02-20 | Initial data model — localStorage types                                                                                                                                                                                                                                                                                  |
| 1.1     | 2026-03-08 | Added MealTemplate, FilterConfig, AI Response Types                                                                                                                                                                                                                                                                      |
| 1.2     | 2026-03-28 | Added SQLite database schema (19 tables). 3 new fitness module tables: `fitness_profiles`, `fitness_preferences`, `workout_drafts`. Documented all table columns, constraints, indexes, and FK relationships from `src/services/schema.ts`                                                                               |
| 2.0     | 2026-07-16 | **Major update**: Added Fitness Domain Types (§4): TrainingPlan, TrainingDay, TrainingSession, PlannedExercise, WorkoutLog, ExerciseLog, SetLog. Added Health Profile Types (§5): HealthProfile, OnboardingState. Added Fitness ER diagram (§6.2). Updated SQLite schema to version 3 (27 tables). Re-numbered sections. |
| 2.1     | 2026-07-20 | Schema v5→v6: `workout_sets.exercise_id` nullable with `ON DELETE SET NULL`. `WorkoutSet.exerciseId` type changed to `string                                                                                                                                                                                             | null`. Added `dbWriteQueue`helper for serialized fire-and-forget writes. Multi-write actions use`db.transaction()` for atomicity. |
