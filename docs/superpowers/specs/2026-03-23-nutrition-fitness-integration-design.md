# Nutrition & Fitness Integration — Design Spec

**Date:** 2026-03-23
**Status:** Draft
**App:** Smart Meal Planner v2.0

## 1. Overview

Tích hợp 3 hệ thống vào meal planner hiện tại:
1. **Nutrition Engine** — BMR (Mifflin-St Jeor) → TDEE → Caloric Target → Macro Split
2. **Training System** — Workout logging với sets/reps/weight/RPE, progressive overload tracking
3. **Feedback Loop** — Moving average weight (7 ngày), auto-adjust ±150-200 kcal sau 2 tuần, adherence rate

**Approach:** Big Bang Migration — chuyển toàn bộ data từ localStorage sang SQLite (sql.js WASM cho web, @capacitor-community/sqlite cho mobile).

## 2. Navigation Architecture

### 2.1 Bottom Nav (5 tabs — giữ nguyên số lượng)

```
📅 Lịch trình | 📋 Thư viện | 🤖 AI | 💪 Fitness | 📊 Dashboard
```

### 2.2 Features di chuyển ra khỏi bottom nav

| Feature | Vị trí mới | Lý do |
|---|---|---|
| 🛒 Đi chợ | Nút trong Calendar (chọn ngày/tuần → tạo list) | Tần suất thấp (1-2 lần/tuần), flow tự nhiên hơn |
| ⚙️ Cài đặt | Icon ở header (góc phải) | Tần suất rất thấp, pattern phổ biến (Instagram, X) |

### 2.3 Tiêu chí đánh giá (đạt 56/60)

Đánh giá dựa trên 6 tiêu chí UX: Reachability (10/10), Discoverability (8/10), Touch Target (10/10), Cognitive Load (9/10), Task Frequency (10/10), Info Architecture (9/10).

## 3. Data Architecture

### 3.1 Storage Strategy

| Platform | Engine | Persistence |
|---|---|---|
| Web (Browser) | sql.js (SQLite compiled to WASM) | Serialize DB → IndexedDB |
| Mobile (Capacitor) | @capacitor-community/sqlite | Native SQLite file |

### 3.2 Database Abstraction Layer

```
src/services/databaseService.ts

interface DatabaseService {
  initialize(): Promise<void>;
  execute(sql: string, params?: unknown[]): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  transaction(fn: () => Promise<void>): Promise<void>;
  exportToJSON(): Promise<string>;
  importFromJSON(json: string): Promise<void>;
}
```

Platform detection tự động chọn implementation:
- `Capacitor.isNativePlatform()` → native SQLite
- Else → sql.js WASM

### 3.2.1 Row ↔ Type Mapping

SQLite schema dùng `snake_case` (SQL convention), TypeScript types dùng `camelCase` (JS convention). DatabaseService cung cấp helper tự động chuyển đổi:

```typescript
function rowToType<T>(row: Record<string, unknown>): T {
  // calories_per_100 → caloriesPer100, weight_kg → weightKg
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [snakeToCamel(k), v])
  ) as T;
}

function typeToRow<T>(obj: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [camelToSnake(k), v])
  );
}
```

Tất cả `query<T>()` calls sẽ tự động apply `rowToType` trước khi trả kết quả.

### 3.3 SQLite Schema

#### Migrated Tables (từ localStorage)

```sql
CREATE TABLE ingredients (
  id TEXT PRIMARY KEY,
  name_vi TEXT NOT NULL,
  name_en TEXT,
  calories_per_100 REAL NOT NULL,
  protein_per_100 REAL NOT NULL,
  carbs_per_100 REAL NOT NULL,
  fat_per_100 REAL NOT NULL,
  fiber_per_100 REAL NOT NULL,
  unit_vi TEXT NOT NULL,
  unit_en TEXT
);

CREATE TABLE dishes (
  id TEXT PRIMARY KEY,
  name_vi TEXT NOT NULL,
  name_en TEXT,
  tags TEXT NOT NULL, -- JSON array: ["breakfast","lunch"]
  rating INTEGER,
  notes TEXT
);

CREATE TABLE dish_ingredients (
  dish_id TEXT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id),
  amount REAL NOT NULL,
  PRIMARY KEY (dish_id, ingredient_id)
);

CREATE TABLE day_plans (
  date TEXT PRIMARY KEY, -- YYYY-MM-DD
  breakfast_dish_ids TEXT NOT NULL, -- JSON array
  lunch_dish_ids TEXT NOT NULL,
  dinner_dish_ids TEXT NOT NULL,
  servings TEXT -- JSON object: {"dishId": multiplier}
);

CREATE TABLE meal_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  data TEXT NOT NULL -- JSON blob
);
```

#### New Tables

```sql
CREATE TABLE user_profile (
  id TEXT PRIMARY KEY DEFAULT 'default',
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  age INTEGER NOT NULL,
  height_cm REAL NOT NULL,
  weight_kg REAL NOT NULL,
  activity_level TEXT NOT NULL DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'extra_active')),
  bmr_override REAL, -- nullable: user nhập BMR custom
  protein_ratio REAL NOT NULL DEFAULT 2.0, -- g/kg
  fat_pct REAL NOT NULL DEFAULT 0.25, -- % of target calories
  updated_at TEXT NOT NULL
);

CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('cut', 'bulk', 'maintain')),
  target_weight_kg REAL,
  calorie_offset INTEGER NOT NULL, -- ±kcal from TDEE
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Ensure only one active goal at a time via application-level check
-- Before INSERT/UPDATE with is_active=1, deactivate others:
-- UPDATE goals SET is_active = 0, updated_at = datetime('now') WHERE is_active = 1;

CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  name_vi TEXT NOT NULL,
  name_en TEXT,
  muscle_group TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('compound', 'isolation', 'cardio')),
  is_custom INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE workouts (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  duration_min INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE workout_sets (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id),
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_kg REAL NOT NULL DEFAULT 0, -- 0 for cardio/bodyweight exercises
  rpe REAL, -- 1-10, nullable
  rest_seconds INTEGER,
  updated_at TEXT NOT NULL,
  UNIQUE(workout_id, exercise_id, set_number)
);

CREATE TABLE weight_log (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  weight_kg REAL NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE daily_log (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  target_calories REAL NOT NULL,
  actual_calories REAL NOT NULL,
  target_protein REAL NOT NULL,
  actual_protein REAL NOT NULL,
  adherence_cal INTEGER NOT NULL DEFAULT 0, -- 0|1: within ±100kcal
  adherence_protein INTEGER NOT NULL DEFAULT 0, -- 0|1: within ±10g
  updated_at TEXT NOT NULL
);

CREATE TABLE adjustments (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  reason TEXT NOT NULL,
  old_target_cal REAL NOT NULL,
  new_target_cal REAL NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('auto', 'manual')),
  moving_avg_weight REAL,
  applied INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Performance Indexes
CREATE INDEX idx_workout_sets_workout ON workout_sets(workout_id);
CREATE INDEX idx_workout_sets_exercise ON workout_sets(exercise_id);
CREATE INDEX idx_weight_log_date ON weight_log(date);
CREATE INDEX idx_daily_log_date ON daily_log(date);
CREATE INDEX idx_workouts_date ON workouts(date);
CREATE INDEX idx_goals_active ON goals(is_active);
CREATE INDEX idx_adjustments_date ON adjustments(date);
CREATE INDEX idx_dish_ingredients_dish ON dish_ingredients(dish_id);
CREATE INDEX idx_dish_ingredients_ingredient ON dish_ingredients(ingredient_id);
```

### 3.4 Seed Data

~35 exercises pre-loaded:

| Muscle Group | Exercises |
|---|---|
| Ngực (chest) | Bench Press, Incline Bench, Dumbbell Fly, Cable Crossover, Push-up |
| Lưng (back) | Deadlift, Barbell Row, Lat Pulldown, Pull-up, Seated Cable Row |
| Vai (shoulders) | Overhead Press, Lateral Raise, Face Pull, Rear Delt Fly |
| Chân (legs) | Squat, Leg Press, Lunges, Leg Curl, Leg Extension, Calf Raise |
| Tay (arms) | Bicep Curl, Hammer Curl, Tricep Pushdown, Skull Crusher |
| Core | Plank, Crunch, Cable Woodchop, Ab Rollout |
| Cardio | Running, Cycling, Swimming, Jump Rope, HIIT |

## 4. Nutrition Engine

### 4.1 BMR Calculation

```typescript
function calculateBMR(profile: UserProfile): number {
  if (profile.bmrOverride) return profile.bmrOverride;
  
  const s = profile.gender === 'male' ? 5 : -161;
  return 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + s;
}
```

### 4.2 TDEE Calculation

```typescript
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,      // Ít vận động
  light: 1.375,         // Tập nhẹ 1-3 ngày/tuần
  moderate: 1.55,       // Tập trung bình 3-5 ngày/tuần
  active: 1.725,        // Tập nặng 6-7 ngày/tuần
  extra_active: 1.9,    // VĐV chuyên nghiệp
};

function getAutoAdjustedMultiplier(
  baseLevel: ActivityLevel,
  sessionsPerWeek: number
): number {
  // Map sessions to closest activity level
  const autoLevel = sessionsToLevel(sessionsPerWeek);
  const base = ACTIVITY_MULTIPLIERS[baseLevel];
  const auto = ACTIVITY_MULTIPLIERS[autoLevel];
  // Blend: 70% auto + 30% base (avoid sudden jumps)
  return auto * 0.7 + base * 0.3;
}

function sessionsToLevel(sessions: number): ActivityLevel {
  if (sessions <= 0) return 'sedentary';
  if (sessions <= 2) return 'light';
  if (sessions <= 4) return 'moderate';
  if (sessions <= 6) return 'active';
  return 'extra_active';
}

function calculateTDEE(bmr: number, multiplier: number): number {
  return Math.round(bmr * multiplier);
}
```

### 4.3 Caloric Target

```typescript
function calculateTarget(tdee: number, goal: Goal): number {
  return tdee + goal.calorieOffset;
  // Cut: offset = -500 → target = TDEE - 500
  // Bulk: offset = +300 → target = TDEE + 300
  // Maintain: offset = 0
}
```

### 4.4 Macro Split (Priority-based + override)

```typescript
interface MacroSplit {
  proteinG: number;
  fatG: number;
  carbsG: number;
  proteinCal: number;
  fatCal: number;
  carbsCal: number;
  isOverallocated: boolean;
}

function calculateMacros(
  targetCal: number,
  weightKg: number,
  proteinRatio: number, // g/kg, default 2.0
  fatPct: number,       // % of target, default 0.25
): MacroSplit {
  // Priority 1: Protein
  const proteinG = Math.round(weightKg * proteinRatio);
  const proteinCal = proteinG * 4;

  // Priority 2: Fat
  const fatCal = Math.round(targetCal * fatPct);
  const fatG = Math.round(fatCal / 9);

  // Priority 3: Carbs (remainder)
  const carbsCal = Math.max(0, targetCal - proteinCal - fatCal);
  const carbsG = Math.round(carbsCal / 4);

  // Safety: warn if protein+fat exceeds target (extreme weight + aggressive cut)
  const isOverallocated = proteinCal + fatCal > targetCal;

  return { proteinG, fatG, carbsG, proteinCal, fatCal, carbsCal, isOverallocated };
}
```

### 4.5 File Location

```
src/services/nutritionEngine.ts  — Pure calculation functions (BMR, TDEE, Macros, auto-adjust)
```

> **Note:** Existing `src/utils/nutrition.ts` handles ingredient/dish nutrition aggregation (calculateIngredientNutrition, calculateDishNutrition). `nutritionEngine.ts` handles personal nutrition targets. Clear boundary: **nutrition.ts** = "what's in the food", **nutritionEngine.ts** = "what the user needs".

## 5. Training System

### 5.1 Tab Fitness UI

**Màn hình 1: Danh sách buổi tập**
- Summary card: buổi tập/tuần, total volume, activity level hiện tại
- Danh sách workouts theo ngày (scroll), mỗi entry hiển thị: tên, thời gian, số bài tập, total volume, tags bài tập
- Nút "Thêm buổi tập"

**Màn hình 2: Log chi tiết buổi tập**
- Header: tên workout, ngày, thời gian
- Mỗi exercise: bảng SET | KG | REPS | RPE | ✓
- Nút "Thêm set" cho mỗi exercise
- Nút "Thêm bài tập" (mở Exercise Selector)
- Rest Timer đếm ngược (mặc định 120s)

**Màn hình 3: Chọn bài tập**
- Search bar
- Filter chips theo nhóm cơ (Tất cả, Ngực, Lưng, Vai, Chân, Tay, Cardio)
- Danh sách exercises nhóm theo muscle group
- Nút "Tạo bài tập mới" ở cuối

### 5.2 Training Metrics

```typescript
// Volume for a single exercise in a workout
function calculateExerciseVolume(sets: WorkoutSet[]): number {
  return sets.reduce((sum, s) => sum + s.reps * s.weightKg, 0);
}

// Weekly volume
function calculateWeeklyVolume(workouts: Workout[], sets: WorkoutSet[]): number {
  return workouts.reduce((total, w) => {
    const workoutSets = sets.filter(s => s.workoutId === w.id);
    return total + calculateExerciseVolume(workoutSets);
  }, 0);
}

// Sessions per week → auto-adjust activity multiplier
function getSessionsThisWeek(workouts: Workout[]): number {
  const weekAgo = subDays(new Date(), 7);
  return workouts.filter(w => new Date(w.date) >= weekAgo).length;
}
```

### 5.3 File Structure

> **Architecture Note:** Dự án hiện tại dùng flat structure (`src/components/`, `src/hooks/`, `src/services/`). Các tính năng mới sẽ dùng `src/features/` (feature-based) để nhóm code theo domain, phù hợp với quy mô phát triển. Existing components **không** cần di chuyển — chỉ code mới dùng `src/features/`.

```
src/features/fitness/
├── components/
│   ├── WorkoutList.tsx        — Danh sách buổi tập
│   ├── WorkoutLogger.tsx      — Log chi tiết (sets/reps/weight)
│   ├── ExerciseSelector.tsx   — Chọn/tạo bài tập
│   ├── SetEditor.tsx          — Inline edit 1 set
│   ├── RestTimer.tsx          — Đếm ngược thời gian nghỉ
│   └── WorkoutSummaryCard.tsx — Summary card (buổi/tuần, volume)
├── hooks/
│   └── useWorkouts.ts         — CRUD workouts, sets, exercises
├── store/
│   └── fitnessStore.ts        — Zustand store (reactive UI state from SQLite)
└── types.ts
```

### 5.4 Zustand Integration

Các feature hooks (`useWorkouts`, `useDashboard`, `useHealthProfile`) sử dụng pattern **SQLite as source of truth + Zustand for reactive UI**:

```typescript
// Pattern: SQLite → Zustand → React components
const useFitnessStore = create<FitnessState>((set) => ({
  workouts: [],
  loading: false,
  
  loadWorkouts: async () => {
    set({ loading: true });
    const rows = await db.query<Workout>('SELECT * FROM workouts ORDER BY date DESC');
    set({ workouts: rows, loading: false });
  },
  
  addWorkout: async (workout: NewWorkout) => {
    await db.execute('INSERT INTO workouts ...', [...]);
    // Re-fetch to sync
    get().loadWorkouts();
  },
}));
```

Điều này áp dụng cho tất cả feature stores: fitnessStore, dashboardStore, healthProfileStore.

## 6. Feedback Loop

### 6.1 Moving Average Weight

```typescript
// Pure average of passed entries — caller controls the time window
function calculateMovingAverage(entries: WeightEntry[]): number | null {
  if (entries.length < 3) return null; // Not enough data
  return entries.reduce((sum, e) => sum + e.weightKg, 0) / entries.length;
}

// Get entries within a specific date range
function getEntriesInWindow(
  entries: WeightEntry[],
  daysAgo: number,
  windowSize: number = 7,
): WeightEntry[] {
  const now = new Date();
  const windowEnd = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const windowStart = new Date(windowEnd.getTime() - windowSize * 24 * 60 * 60 * 1000);
  
  return entries.filter(e => {
    const d = new Date(e.date);
    return d >= windowStart && d <= windowEnd;
  });
}
```

### 6.2 Auto-Adjust Logic

```typescript
const AUTO_ADJUST_CONFIG = {
  evaluationPeriodDays: 14,     // Đánh giá sau 2 tuần
  minWeightEntries: 10,         // Cần ít nhất 10 lần cân trong 14 ngày
  weightChangeThreshold: 0.2,   // kg — nếu thay đổi < 0.2kg → coi như không đổi
  calorieAdjustment: 150,       // ±150 kcal mỗi lần điều chỉnh
  maxDeficit: 1000,             // Không giảm quá 1000 kcal dưới TDEE
  minCalories: 1200,            // Floor: không dưới 1200 kcal
  maxSurplus: 700,              // Không tăng quá 700 kcal trên TDEE (bulk cap)
};

function evaluateAndSuggestAdjustment(
  weightLog: WeightEntry[],
  currentTarget: number,
  goal: Goal,
  tdee: number,
): Adjustment | null {
  // Get entries from two separate 7-day windows
  const currentEntries = getEntriesInWindow(weightLog, 0, 7);   // last 7 days
  const previousEntries = getEntriesInWindow(weightLog, 7, 7);  // days 8-14
  
  const currentAvg = calculateMovingAverage(currentEntries);
  const previousAvg = calculateMovingAverage(previousEntries);
  
  if (!currentAvg || !previousAvg) return null;
  
  // Enforce minimum total entries across both windows
  const totalEntries = currentEntries.length + previousEntries.length;
  if (totalEntries < AUTO_ADJUST_CONFIG.minWeightEntries) return null;
  
  const weightChange = currentAvg - previousAvg;
  const isStalled = Math.abs(weightChange) < AUTO_ADJUST_CONFIG.weightChangeThreshold;
  
  if (goal.type === 'cut' && (isStalled || weightChange > 0)) {
    const newTarget = Math.max(
      currentTarget - AUTO_ADJUST_CONFIG.calorieAdjustment,
      AUTO_ADJUST_CONFIG.minCalories,
      tdee - AUTO_ADJUST_CONFIG.maxDeficit,
    );
    if (newTarget === currentTarget) return null;
    return {
      reason: `Cân nặng TB không giảm sau 2 tuần (${previousAvg.toFixed(1)} → ${currentAvg.toFixed(1)} kg)`,
      oldTargetCal: currentTarget,
      newTargetCal: newTarget,
      triggerType: 'auto',
      movingAvgWeight: currentAvg,
    };
  }
  
  if (goal.type === 'bulk' && (isStalled || weightChange < 0)) {
    const newTarget = Math.min(
      currentTarget + AUTO_ADJUST_CONFIG.calorieAdjustment,
      tdee + AUTO_ADJUST_CONFIG.maxSurplus, // Cap surplus
    );
    if (newTarget === currentTarget) return null;
    return {
      reason: `Cân nặng TB không tăng sau 2 tuần`,
      oldTargetCal: currentTarget,
      newTargetCal: newTarget,
      triggerType: 'auto',
      movingAvgWeight: currentAvg,
    };
  }
  
  return null;
}
```

### 6.3 Adherence Rate

```typescript
function calculateAdherence(
  dailyLogs: DailyLog[],
  days: number = 7,
): { calorie: number; protein: number } {
  const recent = [...dailyLogs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, days);
  if (recent.length === 0) return { calorie: 0, protein: 0 };
  
  const calHit = recent.filter(d => d.adherenceCal).length;
  const proHit = recent.filter(d => d.adherenceProtein).length;
  
  return {
    calorie: Math.round((calHit / recent.length) * 100),
    protein: Math.round((proHit / recent.length) * 100),
  };
}
```

### 6.4 File Structure

```
src/features/dashboard/
├── components/
│   ├── WeightChart.tsx          — SVG line chart (daily dots + moving avg line)
│   ├── CalorieTrendChart.tsx    — Bar chart (daily cal vs target)
│   ├── AdherenceCard.tsx        — % tuân thủ calo/protein
│   ├── AutoAdjustBanner.tsx     — Thông báo đề xuất điều chỉnh
│   ├── AdjustmentHistory.tsx    — Timeline lịch sử điều chỉnh
│   ├── VolumeChart.tsx          — Weekly volume bar chart
│   ├── MuscleGroupBars.tsx      — Volume theo nhóm cơ
│   ├── NutritionEngineCard.tsx  — BMR/TDEE/Target/Macro display
│   └── WeightQuickEntry.tsx     — Quick weight input
├── hooks/
│   └── useDashboard.ts
├── store/
│   └── dashboardStore.ts        — Zustand store for dashboard data
└── types.ts

src/hooks/
└── useFeedbackLoop.ts           — Moving avg, auto-adjust, adherence
```

## 7. Health Profile

### 7.1 UI Location

Trong Settings tab, thêm section "Hồ sơ sức khỏe" phía trên "Giao diện":

```
Settings Tab
├── 🏥 Hồ sơ sức khỏe (NEW)
│   ├── Giới tính: Nam/Nữ
│   ├── Tuổi: [input]
│   ├── Chiều cao: [input] cm
│   ├── Cân nặng: [input] kg
│   ├── Mức hoạt động: [5 options]
│   ├── BMR: [auto-calculated | custom override]
│   └── Protein ratio: [input] g/kg
├── 🎯 Mục tiêu (NEW)
│   ├── Giai đoạn: Cut / Bulk / Maintain
│   ├── Cân nặng mục tiêu: [input] kg
│   └── Calorie offset: [auto | custom]
├── 🎨 Giao diện
├── ☁️ Đồng bộ đám mây
└── 💾 Dữ liệu
```

### 7.2 File Structure

```
src/features/health-profile/
├── components/
│   ├── HealthProfileForm.tsx    — Form nhập thông tin cá nhân
│   └── GoalPhaseSelector.tsx    — Chọn Cut/Bulk/Maintain + target
├── hooks/
│   └── useHealthProfile.ts      — CRUD profile + goal
├── store/
│   └── healthProfileStore.ts    — Zustand store for profile data
└── types.ts
```

### 7.3 UserProfile Type Migration

Existing `UserProfile` type in `src/types.ts` có 3 fields: `{ weight, proteinRatio, targetCalories }`. Migration plan:

1. **Phase 1:** Tạo `user_profile` SQLite table với schema mới (đầy đủ fields)
2. **Phase 2:** Migrate data: `weight` → `weight_kg`, `proteinRatio` → `protein_ratio`, `targetCalories` → `calorie_offset` (computed from TDEE)
3. **Phase 3:** Deprecate old `UserProfile` type — redirect tất cả consumers sang `useHealthProfile()` hook
4. **Phase 4:** Xóa old `UserProfile` type từ `src/types.ts` sau khi migration hoàn tất

## 8. Google Drive Sync Update

### 8.1 Export Format

```json
{
  "_version": "2.0",
  "_exportedAt": "2026-03-23T10:00:00.000Z",
  "_format": "sqlite-json",
  "_legacyFormat": {
    "mp-ingredients": [...],
    "mp-dishes": [...],
    "mp-day-plans": [...],
    "meal-templates": [...],
    "mp-user-profile": {...}
  },
  "tables": {
    "ingredients": [...],
    "dishes": [...],
    "dish_ingredients": [...],
    "day_plans": [...],
    "meal_templates": [...],
    "user_profile": [...],
    "goals": [...],
    "exercises": [...],
    "workouts": [...],
    "workout_sets": [...],
    "weight_log": [...],
    "daily_log": [...],
    "adjustments": [...]
  }
}
```

### 8.2 Backward Compatibility

| Import From | Export To | Behavior |
|---|---|---|
| v1.x (localStorage JSON) | v2.0 device | Auto-upgrade: transform v1.x format to v2.0 schema, populate defaults for new fields |
| v2.0 (SQLite JSON) | v1.x device | Graceful degrade: export includes `_legacyFormat` fallback with old key structure; v1.x ignores unknown keys |
| v2.0 | v2.0 | Direct import: all 13 tables |

Version detection: check `_version` field in import JSON. If missing → v1.x format.

### 8.3 Migration Strategy

On app startup, check for localStorage data:
1. If `mp-ingredients` exists in localStorage → run migration
2. Read all 5 localStorage keys
3. Transform to new schema (flatten LocalizedString, split dish_ingredients)
4. **Wrap entire migration in a SQLite transaction** — if any INSERT fails (FK violation, data corruption), rollback all changes and keep localStorage as primary
5. On success: Set `mp-migrated-to-sqlite = true` in localStorage
6. Keep localStorage as fallback for 30 days, then clear

```typescript
async function migrateFromLocalStorage(): Promise<MigrationResult> {
  try {
    await db.transaction(async () => {
      // All inserts happen inside a single transaction
      await migrateIngredients();
      await migrateDishes();
      await migrateDishIngredients();
      await migrateDayPlans();
      await migrateMealTemplates();
    });
    localStorage.setItem('mp-migrated-to-sqlite', Date.now().toString());
    return { success: true };
  } catch (error) {
    // Transaction auto-rolled-back — localStorage remains primary
    console.error('Migration failed, falling back to localStorage:', error);
    return { success: false, error: String(error) };
  }
}
```

## 9. Migration Phases (Big Bang)

### Phase 1: Infrastructure
- [ ] Setup sql.js + Capacitor SQLite
- [ ] Implement DatabaseService abstraction
- [ ] Create all SQLite tables
- [ ] Write localStorage → SQLite migration
- [ ] Update Google Drive sync for SQLite export/import

### Phase 2: Core Features Migration
- [ ] Migrate ingredients/dishes/day_plans to SQLite
- [ ] Update all existing hooks to use DatabaseService
- [ ] Update existing components (zero visual change)

### Phase 3: Navigation Refactor
- [ ] Restructure bottom nav: replace Đi chợ/Cài đặt with Fitness/Dashboard
- [ ] Move Đi chợ to Calendar action button
- [ ] Move Cài đặt to header icon
- [ ] Update routing
- [ ] Create empty placeholder pages for FitnessTab and DashboardTab

### Phase 4: Nutrition Engine
- [ ] Implement nutritionEngine.ts (BMR, TDEE, Macro Split)
- [ ] Build HealthProfileForm in Settings
- [ ] Build GoalPhaseSelector
- [ ] Connect nutrition engine to existing CalendarTab/Summary

### Phase 5: Training System
- [ ] Seed exercises table
- [ ] Build FitnessTab (WorkoutList, WorkoutLogger, ExerciseSelector)
- [ ] Implement training metrics (volume, sessions/week)
- [ ] Connect sessions/week → Activity Multiplier auto-adjust

### Phase 6: Dashboard & Feedback Loop
- [ ] Build DashboardTab (WeightChart, CalorieTrend, AdherenceCard)
- [ ] Implement useFeedbackLoop (moving avg, auto-adjust)
- [ ] Build AutoAdjustBanner + AdjustmentHistory
- [ ] Build VolumeChart + MuscleGroupBars

### Phase 7: Polish & Testing
- [ ] Unit tests for nutritionEngine (BMR, TDEE, Macro, auto-adjust)
- [ ] Unit tests for training metrics
- [ ] Unit tests for feedback loop
- [ ] Integration tests for SQLite migration
- [ ] Update Google Drive sync tests
- [ ] ESLint + coverage validation
- [ ] i18n keys for all new UI strings

## 10. Dependencies

### New packages

```json
{
  "sql.js": "^1.11.0",
  "@capacitor-community/sqlite": "^6.0.0"
}
```

### Estimated impact

| Metric | Current | After |
|---|---|---|
| Bundle size | ~500KB | ~1MB (+500KB sql.js WASM) |
| SQLite tables | 0 | 13 |
| New components | 0 | ~20 |
| New hooks | 0 | ~5 |
| New services | 0 | 2 (databaseService, nutritionEngine) |

### Lazy-loading Strategy for sql.js WASM

sql.js WASM binary (~500KB) must NOT be bundled unconditionally:

```typescript
// src/services/databaseService.ts
async function createWebDatabase(): Promise<DatabaseService> {
  // Dynamic import — sql.js WASM only loaded on web platform
  const SQL = await import('sql.js');
  const sqlPromise = SQL.default({
    locateFile: (file: string) => `/wasm/${file}`,
  });
  // ...
}

async function createNativeDatabase(): Promise<DatabaseService> {
  // Capacitor SQLite — no WASM needed
  const { CapacitorSQLite } = await import('@capacitor-community/sqlite');
  // ...
}

// Platform-aware factory
export async function initDatabase(): Promise<DatabaseService> {
  if (Capacitor.isNativePlatform()) {
    return createNativeDatabase(); // No WASM loaded
  }
  return createWebDatabase(); // WASM loaded only here
}
```

Vite config: sql.js WASM file served from `public/wasm/` (not bundled inline).

## 11. Decisions Log

| Decision | Choice | Alternatives Considered | Rationale |
|---|---|---|---|
| BMR formula | Mifflin-St Jeor + custom override | Harris-Benedict, custom only | Most accurate for general population; override for edge cases |
| Activity multiplier | 5 levels + auto-adjust from training | 3 levels, 5 fixed, manual only | Auto-adjust increases accuracy without manual effort |
| Macro split | Priority-based (P→F→C) + override | Fixed ratio, full custom | Ensures protein sufficiency; override for advanced users |
| Caloric target | TDEE ± fixed kcal offset | TDEE × percentage | Fixed offset is more scientifically consistent (1kg fat ≈ 7700 kcal) |
| Feedback loop | Auto-adjust after 2 weeks | Suggest only, manual only | Fully automated with user confirmation for best adherence |
| Navigation | 5 tabs (Smart Bottom Nav) | 7 tabs, FAB, More menu, sub-tabs | Scored 56/60 on 6 UX criteria; optimal for mobile |
| Storage | SQLite (sql.js + Capacitor) | localStorage, IndexedDB | SQL queries for training data; unified cross-platform |
| Migration | Big Bang | Incremental hybrid, feature-first | Clean architecture from start; user preference |
| Goal phases | Cut/Bulk/Maintain with cycles | Single goal, no phases | Supports long-term fitness journey with phase transitions |
| Training detail | Full (sets/reps/weight/RPE) | Simplified (sessions/week only) | User preference for comprehensive tracking |
