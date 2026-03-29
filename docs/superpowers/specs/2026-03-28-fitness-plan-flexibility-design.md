# Fitness Plan Flexibility Design Spec

**Date:** 2026-03-28
**Scope:** Plan Editor, Multi-Session per Day, Freestyle Workout
**Approach:** Unified Session System — gộp 3 features thành 1 hệ thống nhất quán
**Reference specs:**
- `2026-03-23-nutrition-fitness-integration-design.md` — Spec gốc fitness module
- `2026-03-27-fitness-implementation-design.md` — 32 fixes implementation
- `2026-03-28-workout-formulas-business-logic.md` — Công thức & logic

---

## 1. Problem Statement

Fitness module hiện tại có 3 hạn chế lớn ảnh hưởng đến trải nghiệm tập luyện:

1. **Kế hoạch tập cứng nhắc:** Plan auto-generate từ 14 tham số onboarding → bài tập cố định, không có UI chỉnh sửa sau khi tạo. User chỉ có thể swap bài tập trong lúc tập (WorkoutLogger), thay đổi không lưu lại plan.

2. **Không hỗ trợ nhiều buổi tập/ngày:** `TrainingPlanDay.dayOfWeek` là single integer (0-6), code dùng `.find()` chỉ lấy 1 plan day. `determineTodayPlanState()` kiểm tra 1 workout duy nhất. User tập nhiều buổi (sáng strength + chiều cardio) không được plan hỗ trợ.

3. **Không có tập tự do:** Phải luôn theo plan auto-generated. Không có cách bắt đầu buổi tập ngoài kế hoạch.

**Không thuộc scope specs hiện có:** Đã rà soát toàn bộ 3 spec files — không có Plan Editor, Multi-Session, hay Freestyle Workout concept. Đây là features mở rộng mới.

---

## 2. Solution: Unified Session System

Mỗi ngày trong plan là 1 danh sách Sessions (tối đa 3). Plan auto-generate tạo sessions mặc định. User có thể:
- **Sửa bài tập** trong từng session (giữ bản gốc để khôi phục)
- **Thêm session mới** cho ngày bất kỳ (Strength/Cardio/Freestyle)
- **Tập tự do** bất kỳ lúc nào qua nút "+" trên session tabs

### 2.1 Data Model Changes

**`TrainingPlanDay` — Thêm 2 fields:**

```typescript
export interface TrainingPlanDay {
  id: string;
  planId: string;
  dayOfWeek: number;            // 0-6 (0 = Chủ nhật)
  sessionOrder: number;          // NEW: 1, 2, 3 — thứ tự buổi tập trong ngày
  workoutType: string;
  muscleGroups?: string;
  exercises?: string;             // User-modified version (JSON SelectedExercise[])
  originalExercises?: string;     // NEW: Auto-generated backup (immutable after plan generation)
  notes?: string;
}
```

**DB Migration:**

```sql
ALTER TABLE training_plan_days ADD COLUMN session_order INTEGER NOT NULL DEFAULT 1;
ALTER TABLE training_plan_days ADD COLUMN original_exercises TEXT;
UPDATE training_plan_days SET original_exercises = exercises WHERE original_exercises IS NULL;
```

**Quy tắc data:**
- Plan generation luôn ghi `exercises` VÀ `originalExercises` giống nhau
- User edit → chỉ cập nhật `exercises`, `originalExercises` giữ nguyên
- "Khôi phục plan gốc" = copy `originalExercises` → `exercises`
- Constraint: `session_order` IN (1, 2, 3) — tối đa 3 sessions/day

### 2.2 Store Actions

Thêm vào `fitnessStore.ts`:

```typescript
// 1. Cập nhật exercises cho 1 plan day
updatePlanDayExercises: (dayId: string, exercises: SelectedExercise[]) => void
// Ghi exercises JSON, giữ nguyên originalExercises
// Persist: UPDATE training_plan_days SET exercises = ? WHERE id = ?

// 2. Khôi phục plan gốc
restorePlanDayOriginal: (dayId: string) => void
// Copy originalExercises → exercises
// Persist SQLite

// 3. Thêm session mới cho 1 ngày
addPlanDaySession: (planId: string, dayOfWeek: number, session: Omit<TrainingPlanDay, 'id'>) => void
// Validate: existing sessions < 3
// INSERT training_plan_days with sessionOrder = max(existing) + 1
// Persist SQLite

// 4. Xóa session
removePlanDaySession: (dayId: string) => void
// DELETE training_plan_days WHERE id = dayId
// Reorder remaining sessions (compact session_order)
// Persist SQLite
```

### 2.3 useTodaysPlan Logic Changes

```typescript
// BEFORE (singular)
const todayPlanDay = planDays.find(d => d.dayOfWeek === todayDayOfWeek);
const todayWorkout = workouts.find(w => w.date === todayStr);

// AFTER (plural)
const todayPlanDays = planDays
  .filter(d => d.dayOfWeek === todayDayOfWeek)
  .sort((a, b) => a.sessionOrder - b.sessionOrder);
const todayWorkouts = workouts.filter(w => w.date === todayStr);
```

**State machine update — thêm `training-partial`:**

| State | Condition |
|-------|-----------|
| `no-plan` | Không có active plan |
| `rest-day` | Không có session nào cho hôm nay |
| `training-pending` | Có sessions, chưa tập buổi nào |
| `training-partial` | **NEW:** Đã tập 1+ buổi nhưng chưa xong hết |
| `training-completed` | Tất cả sessions đã có workout tương ứng |

**Matching logic:** Mỗi session matched với workout bằng `workoutType` + `date`. Freestyle workouts (không có planDay) không cần match.

---

## 3. UI Components

### 3.1 TrainingPlanView — Session Tabs

Cập nhật `TrainingPlanView.tsx`:

**Khi ngày có 1 session:** Hiển thị y như hiện tại (backward compatible).

**Khi ngày có 2-3 sessions:** Hiển thị Session Tabs:

```
┌───────────────────────────────────────────────┐
│ [T2] [T3] [T4] [T5] [T6] [T7] [CN]          │  ← Calendar strip (giữ nguyên)
├───────────────────────────────────────────────┤
│ [☀️ Buổi 1] [🌙 Buổi 2] [➕]                 │  ← Session tabs (NEW)
├───────────────────────────────────────────────┤
│ Upper Push                              ✏️    │
│ chest, shoulders, triceps                     │
│ 6 bài tập • ~45 phút                         │
│                                               │
│ • Bench Press — 4×6-10                        │
│ • Incline DB Press — 3×8-12                   │
│ • OHP — 3×8-12                                │
│ + 3 bài tập nữa                              │
│                                               │
│ [Đã chỉnh sửa] [Khôi phục gốc]              │  ← Chỉ hiển thị khi exercises ≠ originalExercises
│                                               │
│ [        ▶️ Bắt đầu        ]                 │
└───────────────────────────────────────────────┘
```

**Session Tab States:**
- Active tab: emerald background, white text
- Inactive tab: gray background
- Completed session: ✅ checkmark trên tab
- "+" tab: nhỏ hơn, gray, mở AddSessionModal

**"Đã chỉnh sửa" badge:** Hiển thị khi `exercises !== originalExercises`. Nút "Khôi phục gốc" gọi `restorePlanDayOriginal()`.

**Nút ✏️:** Mở PlanDayEditor qua `pushPage()`.

### 3.2 PlanDayEditor — Full-screen Page

Tạo mới: `src/features/fitness/components/PlanDayEditor.tsx`

**Mở qua:** `pushPage({ id: 'plan-day-editor', component: 'PlanDayEditor', props: { planDay } })`

**Layout:**

```
┌───────────────────────────────────────────────┐
│ ← Chỉnh sửa — Upper Push    [Khôi phục] [💾] │  ← Green header
├───────────────────────────────────────────────┤
│                                               │
│ ┌─────────────────────────────────────────┐   │
│ │ ☰  1. Bench Press                  4 sets│  │  ← Drag handle + exercise info
│ │     Ngực • Barbell        6-10 reps • 120s│ │     Nút ✕ xóa
│ └─────────────────────────────────────────┘   │
│                                               │
│ ┌─────────────────────────────────────────┐   │
│ │ ☰  2. Incline DB Press            3 sets│  │
│ │     Ngực (trên) • DB     8-12 reps • 90s│  │
│ └─────────────────────────────────────────┘   │
│                                               │
│ ┌─────────────────────────────────────────┐   │
│ │ ☰  3. OHP                         3 sets│  │
│ │     Vai • Barbell        8-12 reps • 90s│  │
│ └─────────────────────────────────────────┘   │
│                                               │
│ ... (scrollable)                              │
│                                               │
├───────────────────────────────────────────────┤
│ [      ➕ Thêm bài tập      ]                │  ← Sticky bottom (fixed)
└───────────────────────────────────────────────┘
```

**Interactions:**
- **Nhấn exercise card:** Mở inline edit cho sets, repsMin, repsMax, restSeconds (stepper buttons ±1)
- **☰ Drag handle:** Kéo thả để reorder exercises
- **✕ Xóa:** Xóa exercise khỏi danh sách (cần ít nhất 1 exercise)
- **➕ Thêm bài tập:** Mở ExerciseSelector (component có sẵn) dạng bottom sheet
- **💾 Lưu:** Gọi `updatePlanDayExercises()` → popPage()
- **← Quay lại:** Nếu có thay đổi unsaved → confirm dialog "Bạn có muốn lưu thay đổi?"
- **Khôi phục gốc:** Gọi `restorePlanDayOriginal()` → refresh danh sách

**Nút "➕ Thêm bài tập" sticky:** Cố định ở bottom viewport, không bị cuộn. Áp dụng cùng pattern cho WorkoutLogger (cải thiện UX hiện tại).

### 3.3 AddSessionModal — Bottom Sheet

Tạo mới: `src/features/fitness/components/AddSessionModal.tsx`

**Mở khi:** User nhấn tab "+" trên Session Tabs.

**3 options:**

| Option | Icon | Label | Flow khi chọn |
|--------|------|-------|---------------|
| Strength | 🏋️ | Sức mạnh (Strength) | → Chọn nhóm cơ → auto-suggest bài tập → Tạo session → Mở PlanDayEditor |
| Cardio | 🏃 | Cardio | → Chọn loại cardio → Tạo session cardio → Mở CardioLogger |
| Freestyle | ⚡ | Tập tự do (Freestyle) | → Mở WorkoutLogger trống (không planDay) → Hỏi tên sau khi xong |

**Validation:** Nếu đã có 3 sessions → hiển thị "Tối đa 3 buổi/ngày", nút disabled.

**Muscle Group Selector (cho Strength):**
- Hiển thị 7 nhóm cơ: chest, back, shoulders, legs, arms, core, glutes
- Multi-select → auto-generate exercises từ exerciseDatabase dựa trên nhóm cơ đã chọn
- Tạo `TrainingPlanDay` mới → insert vào store → mở PlanDayEditor để user fine-tune

### 3.4 Freestyle Workout — Tên sau khi xong

Khi WorkoutLogger mở không có `planDay` prop:
- Hiển thị tên mặc định: "Buổi tập" + timestamp
- Khi nhấn "Kết thúc" → trước WorkoutSummaryCard → hiển thị input "Đặt tên buổi tập"
- Placeholder: "VD: Cardio buổi chiều, Vai + Tay..."
- Optional: user có thể bỏ qua (dùng tên mặc định)

---

## 4. Plan Generation — Multi-Session Logic

Cập nhật `useTrainingPlan.ts` để auto-generate multi-session khi phù hợp:

### Quy tắc tạo Cardio session:

| Điều kiện | Hành động |
|-----------|-----------|
| `cardioSessionsWeek` = 0 | Không tạo cardio |
| `daysPerWeek` ≤ 4 VÀ rest days ≥ `cardioSessionsWeek` | Cardio vào ngày nghỉ (session 1, single) |
| `daysPerWeek` ≥ 5 VÀ rest days < `cardioSessionsWeek` | Cardio thêm vào ngày strength nhẹ nhất (session 2) |
| `daysPerWeek` ≥ 5 VÀ `cardioSessionsWeek` ≥ 3 | Tối đa 2 ngày có double session |

### Quy tắc tách buổi:

| Điều kiện | Hành động |
|-----------|-----------|
| `sessionDurationMin` ≤ 45 VÀ `daysPerWeek` ≥ 5 | Có thể tách 1 ngày thành 2 buổi ngắn |
| Tách buổi: session 1 = compound exercises | Session 2 = isolation/accessory exercises |

### Quy tắc xếp ưu tiên Cardio cùng ngày:

1. Ngày nghỉ (rest day) — nếu đủ
2. Ngày strength ít volume nhất — nếu không đủ ngày nghỉ
3. Không bao giờ xếp Cardio HIIT cùng ngày Legs

### Plan generation output:

```typescript
// Hiện tại: 1 TrainingPlanDay per dayOfWeek
// Sau: có thể nhiều TrainingPlanDay cùng dayOfWeek, khác sessionOrder

// VD: User chọn 5 ngày/tuần + 2 cardio/tuần
// dayOfWeek=1: session_order=1 (Upper Push), session_order=2 (Cardio LISS)
// dayOfWeek=2: session_order=1 (Lower A)
// dayOfWeek=3: session_order=1 (Upper Pull), session_order=2 (Cardio HIIT)
// dayOfWeek=4: session_order=1 (Lower B)
// dayOfWeek=5: session_order=1 (Arms + Shoulders)
```

**Cả `exercises` VÀ `originalExercises` đều được set giống nhau lúc generate.**

---

## 5. Error Handling

| Scenario | Behavior |
|----------|----------|
| Session limit reached (3/3) | Tab "+" disabled, tooltip "Tối đa 3 buổi/ngày" |
| Empty exercises in PlanDayEditor | Nút 💾 Lưu disabled, warning "Cần ít nhất 1 bài tập" |
| User đang tập (WorkoutLogger open) | Nút ✏️ trên session đó disabled, tooltip "Đang tập..." |
| DB migration failure | Fallback: `session_order = 1`, `original_exercises = NULL` — không crash |
| Corrupted exercises JSON | `safeJsonParse()` (đã có) trả về `[]`, hiển thị empty state + nút "Khôi phục gốc" |
| User xóa session đang hoặc đã tập | Confirm dialog: "Buổi tập đã có dữ liệu. Bạn muốn xóa?" |

---

## 6. i18n Keys (Vietnamese)

Thêm vào `src/locales/vi.json`:

```json
{
  "fitness.plan.sessionTab": "Buổi {{order}}",
  "fitness.plan.addSession": "Thêm buổi tập",
  "fitness.plan.maxSessions": "Tối đa 3 buổi/ngày",
  "fitness.plan.modified": "Đã chỉnh sửa",
  "fitness.plan.restoreOriginal": "Khôi phục gốc",
  "fitness.plan.restoreConfirm": "Khôi phục plan gốc? Thay đổi của bạn sẽ bị xóa.",
  "fitness.plan.editExercises": "Chỉnh sửa buổi tập",
  "fitness.plan.minOneExercise": "Cần ít nhất 1 bài tập",
  "fitness.plan.unsavedChanges": "Bạn có muốn lưu thay đổi?",
  "fitness.plan.deleteSessionConfirm": "Buổi tập đã có dữ liệu. Bạn muốn xóa?",
  "fitness.plan.sessionMorning": "Sáng",
  "fitness.plan.sessionAfternoon": "Chiều",
  "fitness.plan.sessionEvening": "Tối",
  "fitness.plan.strengthOption": "Sức mạnh (Strength)",
  "fitness.plan.strengthDesc": "Chọn nhóm cơ → auto-gợi ý bài tập",
  "fitness.plan.cardioOption": "Cardio",
  "fitness.plan.cardioDesc": "HIIT, chạy bộ, đạp xe, bơi...",
  "fitness.plan.freestyleOption": "Tập tự do (Freestyle)",
  "fitness.plan.freestyleDesc": "Tự chọn bài tập, không theo template",
  "fitness.plan.nameWorkout": "Đặt tên buổi tập",
  "fitness.plan.nameWorkoutPlaceholder": "VD: Cardio buổi chiều, Vai + Tay...",
  "fitness.plan.trainingPartial": "Đã tập {{completed}}/{{total}} buổi"
}
```

---

## 7. Testing Strategy

### New Test Files

| File | Coverage Target |
|------|----------------|
| `PlanDayEditor.test.tsx` | 100% — render, add/remove exercises, edit sets/reps, save, restore, unsaved warning |
| `AddSessionModal.test.tsx` | 100% — render 3 options, max sessions validation, create Strength/Cardio/Freestyle |
| `SessionTabs.test.tsx` | 100% — render tabs, switch, completed state, "+" button |

### Updated Test Files

| File | Changes |
|------|---------|
| `useTodaysPlan.test.ts` | Add: multi-session states, partial completion, freestyle workouts |
| `fitnessStore.test.ts` | Add: new actions (updatePlanDayExercises, addPlanDaySession, removePlanDaySession, restorePlanDayOriginal) |
| `TrainingPlanView.test.tsx` | Add: session tabs rendering, edit button, multi-session display |
| `useTrainingPlan.test.ts` | Add: multi-session plan generation, cardio scheduling |

### Test Scenarios

**PlanDayEditor:**
- Render với plan day → hiển thị tất cả exercises
- Nhấn ✕ xóa exercise → exercise bị xóa khỏi danh sách
- Nhấn ✕ xóa exercise cuối → warning "Cần ít nhất 1 bài tập", nút Lưu disabled
- Nhấn ➕ → mở ExerciseSelector
- Chọn exercise từ selector → thêm vào danh sách
- Nhấn 💾 Lưu → gọi updatePlanDayExercises, popPage
- Nhấn ← khi có unsaved changes → confirm dialog
- Nhấn "Khôi phục gốc" → exercises reset về originalExercises

**Multi-Session:**
- Ngày có 1 session → không hiển thị session tabs (backward compatible)
- Ngày có 2 sessions → hiển thị 2 tabs + "+"
- Ngày có 3 sessions → hiển thị 3 tabs, "+" disabled
- Session đã tập → ✅ trên tab
- `training-partial` state → "Đã tập 1/2 buổi"

**Freestyle:**
- Nhấn "+" → Freestyle → WorkoutLogger mở không có planDay
- Tập xong → hiển thị input tên → nhập tên → lưu
- Bỏ qua tên → dùng "Buổi tập" + timestamp

---

## 8. Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| **CREATE** | `src/features/fitness/components/PlanDayEditor.tsx` | Full-screen editor cho exercises |
| **CREATE** | `src/features/fitness/components/AddSessionModal.tsx` | Bottom sheet chọn loại session |
| **CREATE** | `src/features/fitness/components/SessionTabs.tsx` | Session tab pills component |
| **MODIFY** | `src/features/fitness/types.ts` | Thêm `sessionOrder`, `originalExercises` |
| **MODIFY** | `src/services/schema.ts` | Migration: `session_order`, `original_exercises` columns |
| **MODIFY** | `src/store/fitnessStore.ts` | 4 actions mới + SQLite persist |
| **MODIFY** | `src/features/fitness/components/TrainingPlanView.tsx` | Session tabs + edit button |
| **MODIFY** | `src/features/fitness/components/WorkoutLogger.tsx` | Sticky "Thêm bài tập" button + freestyle name input |
| **MODIFY** | `src/features/fitness/hooks/useTrainingPlan.ts` | Multi-session plan generation |
| **MODIFY** | `src/features/dashboard/hooks/useTodaysPlan.ts` | Multi-session + partial state |
| **MODIFY** | `src/features/dashboard/components/TodaysPlanCard.tsx` | Multi-session display |
| **MODIFY** | `src/locales/vi.json` | New i18n keys |
| **CREATE** | `src/__tests__/PlanDayEditor.test.tsx` | Tests |
| **CREATE** | `src/__tests__/AddSessionModal.test.tsx` | Tests |
| **CREATE** | `src/__tests__/SessionTabs.test.tsx` | Tests |

---

## 9. Architecture Constraints

- Session tabs: Inline render trong Plan sub-tab (NOT navigation)
- PlanDayEditor: Full-screen page via `pushPage()` — nhất quán với WorkoutLogger
- AddSessionModal: Bottom sheet component mount (NOT page navigation)
- Tối đa nav depth: L1 (Fitness) → L2 (Plan sub-tab) → L3 (PlanDayEditor/WorkoutLogger)
- State: Zustand `fitnessStore` + SQLite persistence (write-through)
- "Thêm bài tập" button: Sticky bottom — áp dụng cho cả PlanDayEditor VÀ WorkoutLogger

---

## 10. Backward Compatibility

- Ngày có 1 session: UI y hệt hiện tại, không hiển thị session tabs
- `session_order` default = 1: Data cũ tương thích
- `original_exercises` backfill từ `exercises`: Nút "Khôi phục gốc" hoạt động cho plan cũ
- `useTodaysPlan` return type mở rộng (thêm fields), không break existing consumers
- `determineTodayPlanState` thêm state `training-partial` — TodaysPlanCard cần handle
