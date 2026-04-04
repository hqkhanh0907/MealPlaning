# Business Logic Audit Report (BM)

> **Ngày audit**: 2025-07-24
> **Phạm vi**: Deep-dive business logic — nutrition calculations, store persistence, form validation, cross-store consistency
> **Vai trò**: Business Manager — tìm bugs logic nghiệp vụ mà CEO audit bỏ sót
> **CEO đã fix**: GoalPhaseSelector trigger, saveRef useEffect deps, unsafe JSON.parse, UnitSelector i18n, fitnessStore logging
> **Critic review**: Severity validated by independent critic agent — BM-BUG-03 downgraded (form schemas already validate), BM-BUG-04 downgraded (UI blocks deletion of in-use dishes)

---

## Tóm Tắt Kết Quả

| Mức Độ        | Số Lượng | Mô tả                                                           |
| ------------- | -------- | --------------------------------------------------------------- |
| **HIGH**      | 1        | Data loss — stores don't persist mutations to SQLite            |
| **MEDIUM**    | 1        | Negative target calories reaching UI                            |
| **LOW**       | 2        | Defense-in-depth gaps (engine input validation, delete cascade) |
| **IMPORTANT** | 5        | Inaccurate calorie estimates, missing cascades, schema gaps     |
| **MINOR**     | 3        | Rounding precision, duplicate prevention, documentation         |

---

## HIGH (Phải Fix Ngay)

### BM-BUG-01: dayPlanStore / dishStore / ingredientStore — Mutations KHÔNG persist xuống SQLite [HIGH]

**File**: `src/store/dayPlanStore.ts:42-55`, `src/store/dishStore.ts:48-59`, `src/store/ingredientStore.ts:34-41`

**Mô tả**: Ba stores cốt lõi (dayPlan, dish, ingredient) chỉ update Zustand state khi user thay đổi data. KHÔNG có DB write nào. Chỉ có `loadAll(db)` để đọc lên từ SQLite, nhưng mọi mutation (add/update/delete) đều mất sau restart.

**Bằng chứng**:

```typescript
// dayPlanStore.ts:42-45
updatePlan: (selectedDate, type, dishIds) =>
  set(state => ({
    dayPlans: updateDayPlanSlot(state.dayPlans, selectedDate, type, dishIds),
  })),
// ← Không có db.execute() INSERT/UPDATE day_plans
```

```typescript
// dishStore.ts:48-51
addDish: dish =>
  set(state => ({
    dishes: [...state.dishes, dish],
  })),
// ← Không có db.execute() INSERT INTO dishes
```

```typescript
// ingredientStore.ts:34-37
addIngredient: ing =>
  set(state => ({
    ingredients: [...state.ingredients, ing],
  })),
// ← Không có db.execute() INSERT INTO ingredients
```

**Impact**:

- Trên native (Capacitor SQLite persistent): User tạo dish/ingredient/meal plan → restart app → data biến mất
- `useAutoSync` (Google Drive) gọi `db.exportToJSON()` nhưng export từ SQLite (stale) chứ không phải Zustand (fresh) → backup cũng stale
- fitnessStore KHÔNG bị lỗi này (dùng `persistToDb()` cho mỗi action)

**Root Cause**: Architecture ban đầu dùng sql.js in-memory (data mất khi restart anyway). Sau khi migrate sang NativeDatabaseService (persistent), stores cũ chưa được update để ghi ngược SQLite.

**Fix**: Thêm `persistToDb()` calls cho mỗi mutation action, tương tự pattern của fitnessStore:

```typescript
// dishStore.ts — fix pattern
addDish: dish => {
  set(state => ({ dishes: [...state.dishes, dish] }));
  if (_db) {
    persistToDb(_db,
      'INSERT INTO dishes (id, name_vi, name_en, tags, rating, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [dish.id, dish.name.vi, dish.name.en ?? null, JSON.stringify(dish.tags), dish.rating ?? null, dish.notes ?? null],
      'addDish'
    );
    for (const di of dish.ingredients) {
      persistToDb(_db,
        'INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES (?, ?, ?)',
        [dish.id, di.ingredientId, di.amount],
        'addDish.ingredients'
      );
    }
  }
},
```

---

## MEDIUM

### BM-BUG-02: calculateTarget() có thể trả về số âm → Dashboard hiển thị "Target: -X kcal" [MEDIUM]

**File**: `src/services/nutritionEngine.ts:64-66`

**Mô tả**: `calculateTarget(tdee, calorieOffset)` không clamp kết quả. Với offset lớn (aggressive cut trên người nhẹ cân), target có thể âm. **Critic xác nhận**: GoalPhaseSelector cho phép custom offset không có min/max bound → user-reachable, không chỉ lý thuyết.

```typescript
// nutritionEngine.ts:64-66
export function calculateTarget(tdee: number, calorieOffset: number): number {
  return Math.round(Number(tdee) + Number(calorieOffset));
  // calculateTarget(1200, -1100) → 100 (OK)
  // Nhưng nếu TDEE thấp: calculateTarget(800, -1100) → -300 (BUG!)
}
```

**Impact**: Dashboard hiển thị target calories âm. Macro calculation nhận targetCal < 0, carbsCal `max(0, negative)` = 0 nhưng fatCal vẫn dương → tổng macros > target → confusing UI.

**Root Cause**: Không có floor constraint.

**Fix**:

```typescript
export function calculateTarget(tdee: number, calorieOffset: number): number {
  return Math.max(0, Math.round(Number(tdee) + Number(calorieOffset)));
}
```

---

## LOW (Defense-in-Depth)

### BM-BUG-03: calculateBMR() chấp nhận inputs vật lý không hợp lệ — robustness gap [LOW]

**File**: `src/services/nutritionEngine.ts:29-39`

**Mô tả**: Hàm calculateBMR không validate inputs. Weight=0, height=0, hoặc giá trị âm đều được tính, tạo BMR vô nghĩa.

**Critic note**: Form schemas (healthProfileSchema, onboardingSchema) đã validate weight≥30, height≥100. Tuy nhiên, `importFromJSON()` và `saveProfile()` ghi trực tiếp vào DB mà không re-validate → defense-in-depth gap, không phải production bug thông thường. Downgraded từ CRITICAL → LOW.

```typescript
// nutritionEngine.ts:29-39
export function calculateBMR(
  weightKg: number, // ← Accepts 0, -80
  heightCm: number, // ← Accepts 0, -175
  age: number, // ← Accepts -5
  gender: Gender,
  bmrOverride?: number,
): number {
  if (bmrOverride != null && bmrOverride > 0) return bmrOverride;
  const s = gender === 'male' ? 5 : -161;
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + s);
}
```

**Test Cases**:

- `calculateBMR(0, 175, 30, 'male')` → 949 (invalid BMR cho weight=0)
- `calculateBMR(-80, 175, 30, 'male')` → -151 (âm!)
- `calculateBMR(75, 0, 30, 'male')` → 605 (height=0 vẫn tính)

**Impact**: Invalid BMR cascades → TDEE sai → Target sai → Macros sai → toàn bộ dashboard/calendar incorrect.

**Root Cause**: Pure function không validate business constraints.

**Fix**:

```typescript
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
  bmrOverride?: number,
): number {
  if (bmrOverride != null && bmrOverride > 0) return bmrOverride;
  if (weightKg <= 0 || heightCm <= 0 || age < 0) return 0;
  const s = gender === 'male' ? 5 : -161;
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + s);
}
```

---

### BM-BUG-04: Delete dish/ingredient — store-level cascade missing (UI mitigated) [LOW]

**File**: `src/store/dishStore.ts:56-59`, `src/App.tsx:341-347`

**Mô tả**: Khi delete dish, `dayPlanStore` vẫn giữ dish ID trong breakfast/lunch/dinnerDishIds. UI render với missing dish → nutrition calculation skip dish đó → tổng calo sai.

**Critic note**: DishManager UI **blocks deletion** of dishes currently in use (DishManager.tsx:163-169, delete buttons disabled at lines 346-347, 470-472, 539-541). Có test verify behavior này (managers.test.tsx:130-138). Dưới normal app flow, orphans không xảy ra. Đây là store-level invariant leak, không phải active production bug. Downgraded từ CRITICAL → LOW.

```typescript
// dishStore.ts:56-59
deleteDish: id =>
  set(state => ({
    dishes: state.dishes.filter(d => d.id !== id),
  })),
// ← KHÔNG remove id khỏi dayPlanStore.dayPlans[*].*DishIds
```

```typescript
// App.tsx:341-347 — ingredient cascade TỒN TẠI nhưng chỉ ở App level
const handleDeleteIngredient = useCallback(
  (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
    setDishes(prev => removeIngredientFromDishes(prev, id));
    // ← dayPlans KHÔNG được clean up
  },
  [setIngredients, setDishes],
);
```

**Impact**: Store-level: orphaned dish IDs có thể tồn tại trong dayPlans. UI-level: mitigated — DishManager disable delete cho dishes đang in use. Chỉ xảy ra nếu data imported/restored không qua UI flow.

**Root Cause**: Cascade logic chỉ được implement ở App.tsx (dish→ingredient) nhưng thiếu dish→dayPlan direction.

**Fix**: Thêm cascade action vào dishStore:

```typescript
deleteDish: id => {
  set(state => ({
    dishes: state.dishes.filter(d => d.id !== id),
  }));
  // Cascade: remove dish from all day plans
  useDayPlanStore.getState().setDayPlans(prev =>
    prev.map(p => ({
      ...p,
      breakfastDishIds: p.breakfastDishIds.filter(did => did !== id),
      lunchDishIds: p.lunchDishIds.filter(did => did !== id),
      dinnerDishIds: p.dinnerDishIds.filter(did => did !== id),
      ...(p.servings ? { servings: Object.fromEntries(
        Object.entries(p.servings).filter(([k]) => k !== id)
      ) } : {}),
    }))
  );
},
```

---

## IMPORTANT (Nên Fix)

### BM-WARN-01: handleQuickAdd cho phép duplicate dish trong cùng 1 meal slot

**File**: `src/App.tsx:318-331`

**Mô tả**: Quick-add blindly append dishId vào array mà không check trùng.

```typescript
// App.tsx:324
return updateDayPlanSlot(prev, selectedDate, type, [...currentIds, dishId]);
// ← Nếu dishId đã có trong currentIds → duplicate
```

**Impact**: User click quick-add 2 lần cho cùng 1 dish → nutrition tính gấp đôi. Khác với servings (intentional multiplier).

**Fix**: Check trùng trước khi append, hoặc dùng servings:

```typescript
const newIds = currentIds.includes(dishId) ? currentIds : [...currentIds, dishId];
return updateDayPlanSlot(prev, selectedDate, type, newIds);
```

---

### BM-WARN-02: useTodayCaloriesOut fallback 8 cal/set không scale theo cân nặng

**File**: `src/hooks/useTodayCaloriesOut.ts:37-41`

**Mô tả**: Khi workout không có `durationMin`, fallback dùng cố định 8 cal/set bất kể cân nặng.

```typescript
// useTodayCaloriesOut.ts:39-41
} else {
  strengthCalories += wSets.length * FALLBACK_CAL_PER_SET;  // FALLBACK_CAL_PER_SET = 8
}
```

**Impact**:

- User 50kg, 5 sets: tính 40 cal (MET-based estimate: ~62 cal) → -35% under
- User 120kg, 5 sets: tính 40 cal (MET-based estimate: ~150 cal) → -73% under

**Fix**: Sử dụng weight-aware fallback:

```typescript
const FALLBACK_DURATION_PER_SET_MIN = 3;
} else {
  const estimatedDuration = wSets.length * FALLBACK_DURATION_PER_SET_MIN;
  strengthCalories += Math.round((STRENGTH_MET * weightKg * estimatedDuration) / 60);
}
```

---

### BM-WARN-03: useTodayCaloriesOut hard-code 70kg fallback khi profile null

**File**: `src/hooks/useTodayCaloriesOut.ts:17`

**Mô tả**: Nếu health profile chưa load, silently dùng 70kg cho calorie calculation.

```typescript
const weightKg = useHealthProfileStore(s => s.profile?.weightKg ?? 70);
```

**Impact**: User 120kg thấy burned calories bị underestimate 42%. User 50kg thấy overestimate 40%.

**Fix**: Return 0 khi profile chưa load (tốt hơn là giá trị sai):

```typescript
const profile = useHealthProfileStore(s => s.profile);
const weightKg = profile?.weightKg ?? 0;
// ... trong useMemo:
if (weightKg <= 0 || todayWorkoutIds.size === 0) return 0;
```

---

### BM-WARN-04: 3 Zod schemas thiếu z.preprocess() cho numeric fields

**Files**:

- `src/schemas/cardioLoggerSchema.ts:13-14` — `manualDuration`, `distanceKm`
- `src/schemas/dishEditSchema.ts:15-19` — quickAdd nutrition fields (`qaCal`, `qaProtein`, etc.)
- `src/schemas/saveAnalyzedDishSchema.ts:10-14` — `calories`, `protein`, `carbs`, `fat`, `fiber`

**Mô tả**: Dùng `z.coerce.number()` thay vì `z.preprocess()`. `z.coerce.number()` converts empty string `""` → `0`, masking validation errors. Pattern chuẩn (dùng trong `ingredientEditSchema.ts`) là:

```typescript
// ✅ Gold standard (ingredientEditSchema.ts:10-12)
caloriesPer100: z.preprocess(
  val => (val === '' || val === undefined || val === null ? undefined : Number(val)),
  z.number().min(0),
),

// ❌ Gap (cardioLoggerSchema.ts:13)
manualDuration: z.coerce.number().min(0).optional(),
```

**Impact**: User để trống field → silently saves as 0 thay vì báo lỗi "Vui lòng nhập giá trị".

---

### BM-WARN-05: workoutLoggerSchema explicitly allows NaN — cần verify before DB

**File**: `src/schemas/workoutLoggerSchema.ts:5-6`

**Mô tả**: Schema cho phép `z.union([z.number().min(0), z.nan()])` cho weight và reps. Nếu NaN không được convert trước khi persist, SQLite sẽ store NULL (NaN → null qua JSON.stringify).

```typescript
weight: z.union([z.number().min(0), z.nan()]),
reps: z.union([z.number().int().min(0), z.nan()]),
```

**Impact**: NaN values có thể reach `addWorkoutSet` → `persistToDb` → SQLite stores NULL. Khi load lại, NULL → undefined. Downstream calorie calculations may break silently.

---

## MINOR (Nice to Have)

### BM-INFO-01: Nutrition calculation không round intermediate results

**File**: `src/utils/nutrition.ts:53-58`

**Mô tả**: `calculateIngredientNutrition` multiplies per-100g values by factor without rounding. Accumulated floating-point errors over many ingredients/dishes.

```typescript
return {
  calories: (ingredient.caloriesPer100 || 0) * factor,
  protein: (ingredient.proteinPer100 || 0) * factor,
  // ... no Math.round()
};
```

**Impact**: Display shows "487.00000000001 kcal" thay vì "487 kcal". Nhẹ nhưng unprofessional.

**Fix**: Round ở display layer hoặc ở cuối `calculateDishesNutrition`.

---

### BM-INFO-02: Dish/Ingredient stores không có duplicate name prevention

**File**: `src/store/dishStore.ts:48-51`, `src/store/ingredientStore.ts:34-37`

**Mô tả**: Không có unique constraint trên `name_vi` trong schema, không có check trong store actions. User có thể tạo 2 dishes tên "Phở" hoặc 2 ingredients tên "Ức gà".

**Impact**: Confusing UI, potential merge issues khi sync.

---

### BM-INFO-03: bodyFatPct storage format không documented → division ambiguity

**File**: `src/features/health-profile/hooks/useNutritionTargets.ts:89`

**Mô tả**: `healthProfile.bodyFatPct / 100` assumes storage as percentage (e.g., 20 = 20%). Nếu accidentally stored as decimal (0.20), LBM calculation off by ~99%.

```typescript
healthProfile.bodyFatPct == null ? undefined : healthProfile.bodyFatPct / 100,
```

**Impact**: Thấp nếu schema validation đúng (3-60 range). Nhưng nên document rõ ràng trong type definition.

---

## Verification Checklist

- [x] Mifflin-St Jeor formula verified (nutritionEngine.ts:29-39) — **CORRECT**
- [x] TDEE multipliers verified — **CORRECT** (1.2, 1.375, 1.55, 1.725, 1.9)
- [x] Calorie offset logic verified — **CORRECT** (±275/550/1100)
- [x] Macro split priority (Protein → Fat → Carbs) — **CORRECT**
- [x] NaN guards in useNutritionTargets — **PRESENT** (Number.isFinite checks)
- [x] form.trigger() usage — **ALL CORRECT** (field-level, no full-schema trigger)
- [x] Cross-store propagation (health profile → all consumers) — **CORRECT**
- [x] i18n completeness (dynamic keys) — **COMPLETE** (all checked)
- [ ] **dayPlan/dish/ingredient persistence — MISSING** (BM-BUG-01)
- [ ] **calculateBMR input validation — MISSING** (BM-BUG-03)
- [ ] **calculateTarget floor clamp — MISSING** (BM-BUG-02)
- [ ] **Delete cascade dish → dayPlan — MISSING** (BM-BUG-04)

---

## Nutrition Calculation Chain — Verified Flow

```
HealthProfile (weightKg, heightCm, dateOfBirth, gender, activityLevel)
    ↓ getAge(profile)          ✅ Correct (DOB-aware, birthday check)
    ↓ calculateBMR()           ⚠️ No input validation (BM-BUG-03)
    ↓ calculateTDEE()          ✅ Correct multipliers
    ↓ calculateTarget()        ⚠️ No floor clamp (BM-BUG-02)
    ↓ calculateMacros()        ✅ Correct priority split, overallocation detection
    ↓ useNutritionTargets      ✅ NaN guards present, bodyFatPct /100
    ↓ Dashboard/Calendar/Fitness consumers  ✅ All subscribe correctly
```

---

## fitnessStore Persistence Audit — Summary

| Action                 | DB Write     | Method                              |
| ---------------------- | ------------ | ----------------------------------- |
| addTrainingPlan        | ✅ await     | Direct db.execute                   |
| updateTrainingPlan     | ✅ queued    | persistToDb                         |
| setActivePlan          | ✅ await     | Transaction                         |
| addPlanDays            | ✅ queued    | persistToDb loop                    |
| updatePlanDayExercises | ✅ queued    | persistToDb                         |
| restorePlanDayOriginal | ✅ queued    | persistToDb                         |
| addPlanDaySession      | ✅ queued    | persistToDb                         |
| removePlanDaySession   | ✅ await     | Transaction                         |
| addWorkout             | ✅ queued    | persistToDb                         |
| updateWorkout          | ✅ queued    | persistToDb                         |
| deleteWorkout          | ✅ await     | Transaction                         |
| saveWorkoutAtomic      | ✅ await     | Transaction                         |
| addWorkoutSet          | ✅ queued    | persistToDb                         |
| updateWorkoutSet       | ✅ await     | Direct db.execute                   |
| removeWorkoutSet       | ✅ queued    | persistToDb                         |
| addWeightEntry         | ✅ queued    | persistToDb                         |
| updateWeightEntry      | ✅ await     | Direct db.execute                   |
| removeWeightEntry      | ✅ queued    | persistToDb                         |
| setWorkoutDraft        | ✅ queued    | persistToDb                         |
| clearWorkoutDraft      | ✅ queued    | persistToDb                         |
| changeSplitType        | ✅ await     | Transaction                         |
| applyTemplate          | ✅ await     | Transaction                         |
| saveCurrentAsTemplate  | ✅ queued    | persistToDb                         |
| **setTrainingProfile** | ❌ **NO DB** | Zustand persist only                |
| **clearTrainingPlans** | ❌ **NO DB** | Zustand only                        |
| setOnboarded           | ❌ NO DB     | Zustand persist (OK — localStorage) |
| setWorkoutMode         | ❌ NO DB     | Zustand persist (OK — UI state)     |
| setPlanStrategy        | ❌ NO DB     | Zustand persist (OK — UI state)     |
| dismissPlanCelebration | ❌ NO DB     | Zustand only (OK — transient)       |

**Lưu ý**: `setTrainingProfile` và `clearTrainingPlans` thiếu DB write nhưng data được persisted qua Zustand `persist` middleware (localStorage). Risk: nếu localStorage bị clear nhưng SQLite còn → out of sync. Ít nguy hiểm hơn BM-BUG-01 vì training profile ít thay đổi.

---

[BM] Trạng thái: HOÀN_THÀNH
