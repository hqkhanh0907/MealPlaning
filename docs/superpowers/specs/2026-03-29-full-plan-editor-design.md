# Full Plan Editor — Tùy chỉnh kế hoạch tập toàn diện

**Date:** 2026-03-29
**Status:** Draft
**Depends on:** `2026-03-28-fitness-plan-flexibility-design.md`, `2026-03-23-nutrition-fitness-integration-design.md`

---

## §1 Problem Statement

Hệ thống fitness hiện tại cho phép user customize exercises (add/remove/reorder/swap) và sessions (add up to 3/day), nhưng thiếu 3 khả năng quan trọng:

1. **Không chọn được ngày tập vs ngày nghỉ cụ thể.** User chọn "5 ngày/tuần" → system auto-assign Mon-Fri. User không thể đổi sang T2-T3-T5-T6-CN.
2. **Không đổi được kiểu split sau khi tạo plan.** Muốn chuyển từ Upper/Lower sang PPL phải tạo plan mới hoàn toàn, mất hết customization.
3. **Không có plan templates.** User phải luôn dùng auto-generate từ 14 tham số, không có quick-start từ mẫu có sẵn.

### Gap Analysis — Implemented vs Missing

| Feature | Status | Details |
|---------|--------|---------|
| Choose exercises per day | ✅ Done | PlanDayEditor, ExerciseSelector |
| Edit sets/reps/rest | ✅ Done | SetEditor |
| Add/remove sessions per day | ✅ Done | AddSessionModal, SessionTabs |
| Freestyle workouts | ✅ Done | WorkoutLogger without plan |
| Custom exercises | ✅ Done | CustomExerciseModal |
| Restore original plan | ✅ Done | restorePlanDayOriginal() |
| **Choose training vs rest days** | ❌ Missing | Auto-assigned by algorithm |
| **Move workouts between days** | ❌ Missing | No UI to reassign |
| **Change split type post-gen** | ❌ Missing | Must re-generate entire plan |
| **Plan templates gallery** | ❌ Missing | Only auto-generate available |

---

## §2 Solution Overview

### Approach: Hybrid Calendar + Sortable List + Smart Templates

Three interconnected features:

1. **PlanScheduleEditor** — Full-screen page (L3) with:
   - Step 1: WeeklyCalendarStrip — tap days to toggle Training/Rest
   - Step 2: WorkoutAssignmentList — sortable list to assign workouts to days
   - "Auto-gán" button for users who don't want to manually assign

2. **SplitChanger** — Full-screen page (L3) with:
   - Split type selector (Full Body / Upper-Lower / PPL / Bro Split / Custom)
   - User choice: "Regenerate" (fresh plan) OR "Keep & Adjust" (re-map exercises)
   - Preview before confirmation

3. **PlanTemplateGallery** — Full-screen page (L3) with:
   - 5-8 curated templates (Starting Strength, PPL Classic, etc.)
   - AI-personalized "recommended" section (top 3 with match %)
   - "Save current plan as template" for user-created templates

### History Handling Rule

- **Workout history is NEVER deleted or modified** when plan changes.
- Plan changes only apply from the next workout onwards.
- Progress tracking is exercise-level (via exerciseId), continuous across plan changes.

---

## §3 Navigation Architecture

```
Fitness Tab (L1)
├── Sub-tabs: [📋 Plan] [📊 Progress] [📜 History]
│
├── Plan sub-tab (L2) — UPDATED:
│   ├── Action buttons bar:
│   │   ├── [⚙️ Chỉnh sửa Plan] → pushPage(PlanScheduleEditor)
│   │   ├── [📦 Mẫu Plan] → pushPage(PlanTemplateGallery)
│   │   └── [🔄 Đổi Split] → pushPage(SplitChanger)
│   ├── WeeklyCalendarStrip (7 days, color-coded, inline)
│   ├── WorkoutAssignmentList (sortable, inline — collapsed by default)
│   ├── SessionTabs (existing)
│   ├── TrainingPlanView (existing)
│   └── Quick weight input bar (existing)
│
├── Full-screen pages (L3, bottom tab hidden):
│   ├── PlanDayEditor (existing) — via pushPage()
│   ├── WorkoutLogger (existing) — via pushPage()
│   ├── CardioLogger (existing) — via pushPage()
│   ├── 🆕 PlanScheduleEditor — via pushPage('plan-schedule-editor')
│   ├── 🆕 SplitChanger — via pushPage('split-changer')
│   └── 🆕 PlanTemplateGallery — via pushPage('plan-template-gallery')
│
└── Bottom sheets (overlays):
    ├── AddSessionModal (existing)
    ├── ExerciseSelector (existing)
    ├── 🆕 DayAssignmentSheet — chọn ngày cho workout chưa gán
    └── 🆕 SplitChangeConfirm — chọn Regenerate/Remap
```

**Max depth remains 3 levels** (Fitness → Sub-tab → Full-screen page).

---

## §4 Data Model

### §4.1 training_plan_days — Schema Changes

```sql
ALTER TABLE training_plan_days ADD COLUMN is_user_assigned INTEGER DEFAULT 0;
ALTER TABLE training_plan_days ADD COLUMN original_day_of_week INTEGER;
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `is_user_assigned` | INTEGER | 0 | 1 = user manually assigned this day |
| `original_day_of_week` | INTEGER | NULL | Backup of auto-generated day (for restore) |

### §4.2 training_plans — Schema Changes

```sql
-- NOTE: split_type already exists in training_plans (from 2026-03-23 spec).
-- Only add NEW columns:
ALTER TABLE training_plans ADD COLUMN template_id TEXT;
ALTER TABLE training_plans ADD COLUMN training_days TEXT;
ALTER TABLE training_plans ADD COLUMN rest_days TEXT;
```

| Field | Type | Description |
|-------|------|-------------|
| `split_type` | TEXT | **ALREADY EXISTS** — values normalized below in §4.5 |
| `template_id` | TEXT | FK to plan_templates.id (null = auto-generated) |
| `training_days` | TEXT | JSON array of day numbers, e.g. `[1,2,4,5,7]` |
| `rest_days` | TEXT | JSON array of rest day numbers, e.g. `[3,6]` |

### §4.3 plan_templates — New Table

```sql
CREATE TABLE plan_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  split_type TEXT NOT NULL,
  days_per_week INTEGER NOT NULL,
  experience_level TEXT,
  training_goal TEXT,
  equipment_required TEXT,
  description TEXT,
  day_configs TEXT NOT NULL,
  popularity_score INTEGER DEFAULT 0,
  is_builtin INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### §4.5 JSON Serialization Rules

Fields stored as TEXT in SQLite but typed as arrays/objects in TypeScript:

| Table | SQL Column | TypeScript Type | Boundary |
|-------|-----------|-----------------|----------|
| `training_plans` | `training_days` TEXT | `number[]` | `JSON.parse()` on read, `JSON.stringify()` on write |
| `training_plans` | `rest_days` TEXT | `number[]` | `JSON.parse()` on read, `JSON.stringify()` on write |
| `plan_templates` | `equipment_required` TEXT | `string[]` | `JSON.parse()` on read, `JSON.stringify()` on write |
| `plan_templates` | `day_configs` TEXT | `TemplateDayConfig[]` | `JSON.parse()` on read, `JSON.stringify()` on write |
| `training_plan_days` | `exercises` TEXT | `SelectedExercise[]` | Already handled by existing code |
| `training_plan_days` | `original_exercises` TEXT | `SelectedExercise[]` | Already handled by existing code |
| `training_plan_days` | `muscle_groups` TEXT | `string[]` | Already handled by existing code |

All JSON fields must be wrapped in try/catch with fallback to empty array `[]` on parse failure.

### §4.6 SplitType Normalization

Existing codebase uses free-form strings for split_type. This spec normalizes to enum values:

| Existing Values (codebase) | Normalized Value |
|---------------------------|-----------------|
| `'Full Body'`, `'full_body'` | `'full_body'` |
| `'Upper/Lower'`, `'upper_lower'` | `'upper_lower'` |
| `'Push/Pull/Legs'`, `'push-pull-legs'`, `'push_pull_legs'`, `'ppl'` | `'ppl'` |
| `'Bro Split'`, `'bro_split'` | `'bro_split'` |
| `'Custom'`, `'custom'`, any other | `'custom'` |

Migration includes a normalization step (see §14).

Helper function:
```typescript
function normalizeSplitType(raw: string): SplitType {
  const lower = raw.toLowerCase().replace(/[\s\/\-]/g, '_');
  if (lower.includes('full_body') || lower === 'full_body') return 'full_body';
  if (lower.includes('upper') && lower.includes('lower')) return 'upper_lower';
  if (lower.includes('push') || lower.includes('ppl')) return 'ppl';
  if (lower.includes('bro')) return 'bro_split';
  return 'custom';
}
```

### §4.7 TypeScript Types

```typescript
export interface TrainingPlanDay {
  // ... existing fields ...
  isUserAssigned: boolean;          // NEW
  originalDayOfWeek: number | null; // NEW
}

export interface TrainingPlan {
  // ... existing fields ...
  splitType: SplitType;       // NEW
  templateId: string | null;  // NEW
  trainingDays: number[];     // NEW
  restDays: number[];         // NEW
}

export type SplitType = 'full_body' | 'upper_lower' | 'ppl' | 'bro_split' | 'custom';

export interface PlanTemplate {
  id: string;
  name: string;
  splitType: SplitType;
  daysPerWeek: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'all';
  trainingGoal: 'strength' | 'hypertrophy' | 'endurance' | 'general';
  equipmentRequired: string[];
  description: string;
  dayConfigs: TemplateDayConfig[];
  popularityScore: number;
  isBuiltin: boolean;
}

export interface TemplateDayConfig {
  dayLabel: string;           // "Upper Push", "Leg Day A"
  workoutType: string;
  muscleGroups: string[];
  exercises: SelectedExercise[];
}

export interface SplitChangePreview {
  fromSplit: SplitType;
  toSplit: SplitType;
  mappedExercises: Array<{
    exercise: SelectedExercise;
    fromDay: string;
    toDay: string;
    status: 'mapped' | 'suggested' | 'unmapped';
  }>;
  unmappedCount: number;
}
```

---

## §5 Zustand Store Actions

### §5.1 Schedule Editor Actions

```typescript
// fitnessStore.ts — new actions

updateTrainingDays: (planId: string, trainingDays: number[]) => void
// 1. Update training_plans.training_days & rest_days
// 2. Re-assign unassigned workouts to new training days
// 3. Move workouts from removed training days to "unassigned" pool
// 4. Persist to SQLite

reassignWorkoutToDay: (dayId: string, newDayOfWeek: number) => void
// 1. Validate: newDayOfWeek is in trainingDays
// 2. Update training_plan_days.day_of_week
// 3. Set is_user_assigned = 1
// 4. Persist to SQLite

autoAssignWorkouts: (planId: string) => void
// 1. Get all unassigned workouts (workouts without a day)
// 2. Get available training days (trainingDays - already assigned)
// 3. Distribute workouts evenly across available days
// 4. Apply muscle group spacing rules (no same muscle consecutive days)
// 5. Persist to SQLite

restoreOriginalSchedule: (planId: string) => void
// 1. For each plan day where original_day_of_week != null:
//    - Set day_of_week = original_day_of_week
//    - Set is_user_assigned = 0
// 2. Recalculate training_days & rest_days
// 3. Persist to SQLite
```

### §5.2 Split Changer Actions

```typescript
changeSplitType: (
  planId: string,
  newSplit: SplitType,
  mode: 'regenerate' | 'remap'
) => void
// mode='regenerate':
//   1. Archive current plan (soft delete)
//   2. Generate new plan with newSplit using existing profile
//   3. Apply current trainingDays selection
//
// mode='remap':
//   1. Get all exercises from current plan
//   2. Map exercises to new split structure by muscle group:
//      - chest/shoulders/triceps → Push day (PPL)
//      - back/biceps/rear_delts → Pull day (PPL)
//      - quads/hamstrings/calves/glutes → Legs day (PPL)
//   3. Exercises matching multiple groups → primary muscle group wins
//   4. Update plan days structure
//   5. Keep originalExercises intact

previewSplitChange: (
  planId: string,
  newSplit: SplitType
) => SplitChangePreview
// Read-only preview of what remap would look like
// Does NOT mutate state
```

### §5.3 Template Actions

```typescript
getTemplates: () => PlanTemplate[]
// Return all templates (builtin + user-created)

getRecommendedTemplates: (profile: TrainingProfile) => PlanTemplate[]
// 1. Score each template using matchScore()
// 2. Sort by score descending
// 3. Return top 3

applyTemplate: (planId: string, templateId: string) => void
// 1. Get template by id
// 2. Generate plan days from template.dayConfigs
// 3. Map configs to trainingDays: assign configs in order to trainingDays array
//    - If template configs > training days → truncate with warning toast
//    - If template configs < training days → leave extra days empty (user can assign later)
// 4. Filter exercises by user's equipment & injuries
// 5. Set plan.template_id = templateId
// 6. Persist to SQLite

saveCurrentAsTemplate: (planId: string, name: string) => void
// 1. Extract current plan structure into TemplateDayConfig[]
// 2. Create new PlanTemplate with is_builtin = 0
// 3. Insert into plan_templates
```

---

## §6 Template Matching Algorithm

```typescript
function matchScore(template: PlanTemplate, profile: TrainingProfile): number {
  let score = 0;

  // 30% weight: days_per_week match
  const daysDiff = Math.abs(template.daysPerWeek - profile.daysPerWeek);
  if (daysDiff === 0) score += 30;
  else if (daysDiff === 1) score += 15;

  // 25% weight: training_goal match
  if (template.trainingGoal === profile.trainingGoal) score += 25;
  else if (template.trainingGoal === 'general') score += 10;

  // 20% weight: experience_level match
  if (template.experienceLevel === profile.trainingExperience
      || template.experienceLevel === 'all') score += 20;

  // 15% weight: equipment compatibility
  const hasAllEquipment = template.equipmentRequired.length === 0
    || template.equipmentRequired
      .every(eq => profile.availableEquipment.includes(eq));
  if (hasAllEquipment) score += 15;
  else {
    const matchRatio = template.equipmentRequired
      .filter(eq => profile.availableEquipment.includes(eq)).length
      / template.equipmentRequired.length;
    score += Math.round(15 * matchRatio);
  }

  // 10% weight: popularity bonus (normalized 0-10)
  score += Math.min(10, Math.round(template.popularityScore / 10));

  return score; // 0-100
}
```

---

## §7 UI Components

### §7.1 PlanScheduleEditor (Full-screen, L3)

**Entry:** Tap "⚙️ Chỉnh sửa Plan" button → `pushPage({ id: 'plan-schedule-editor' })`

```
← Chỉnh sửa lịch tập                    [Khôi phục] [💾]

  Bước 1: Chọn ngày tập
  ┌─────────────────────────────────────────────┐
  │  (T2)  (T3)  (T4)  (T5)  (T6)  (T7)  (CN) │
  │   🟢   🟢   ⚪   🟢   🟢   ⚪   🟢       │
  │                                             │
  │  Đã chọn 5 ngày tập                        │
  └─────────────────────────────────────────────┘

  Bước 2: Gán buổi tập → ngày
  ┌─────────────────────────────────────────────┐
  │ ≡  Upper Push                          [T2] │
  │    chest, shoulders, triceps                │
  │ ≡  Lower A                             [T3] │
  │    quads, hamstrings, calves                │
  │ ≡  Upper Pull               [⚠️ Chưa gán]  │
  │    back, biceps, rear delts                 │
  │ ≡  Lower B                             [T5] │
  │    quads, hamstrings, calves                │
  │ ≡  Arms + Core                         [CN] │
  │    biceps, triceps, core                    │
  └─────────────────────────────────────────────┘

  [        Auto-gán        ]
```

**Interactions:**
- Tap calendar day → toggle Training (green) / Rest (gray)
- Tap workout day badge → open DayAssignmentSheet to reassign
- Drag handle (≡) → reorder workout priority
- Move up/down buttons → accessibility alternative to drag
- "Auto-gán" → `autoAssignWorkouts()` distributes evenly
- "Khôi phục" → `restoreOriginalSchedule()`
- "💾" → save and `popPage()`

**Validation rules:**
- Min 2 training days, max 6
- Each workout must be assigned to a training day before save
- Cannot assign 2 workouts targeting same primary muscle to consecutive days
- Warning if workout count > training days count

### §7.2 WeeklyCalendarStrip (Inline, L2)

Compact 7-day strip that shows current training/rest schedule at a glance.

- Green circle = training day
- Gray circle = rest day
- Blue ring = today
- Checkmark overlay = completed workout today
- Touch target: 44px diameter minimum
- Long-press day → quick toggle (with haptic feedback if available)

**Note:** The L2 inline strip is **read-only** (displays current schedule). The L3 PlanScheduleEditor strip is **interactive** (tap to toggle training/rest).

### §7.3 SplitChanger (Full-screen, L3)

**Entry:** Tap "🔄 Đổi Split" button → `pushPage({ id: 'split-changer' })`

```
← Đổi kiểu phân chia                     [Hủy]

  Split hiện tại: Upper/Lower (4 ngày)

  Chọn split mới:
  ┌─────────────────────────────────────────────┐
  │ (○) Full Body          2-3 ngày/tuần        │
  │ (●) Push/Pull/Legs     5-6 ngày/tuần ← chọn│
  │ (○) Bro Split          5 ngày/tuần          │
  │ (○) Custom             Tùy chỉnh            │
  └─────────────────────────────────────────────┘

  Cách xử lý bài tập hiện tại:
  ┌─────────────────────────────────────────────┐
  │ [🔄] Tạo plan mới hoàn toàn                │
  │      Xóa sạch, auto-generate từ profile     │
  │                                             │
  │ [🧠] Giữ bài tập, đổi cấu trúc            │
  │      Re-map bài tập vào split mới           │
  └─────────────────────────────────────────────┘

  Preview (khi chọn "Giữ bài tập"):
  ┌─────────────────────────────────────────────┐
  │ 🟢 Bench Press → Push Day                   │
  │ 🟢 Barbell Row → Pull Day                   │
  │ 🟢 Squat → Legs Day                         │
  │ 🟡 Lateral Raise → Đề xuất: Push Day        │
  └─────────────────────────────────────────────┘

  [           Áp dụng thay đổi           ]
```

### §7.4 PlanTemplateGallery (Full-screen, L3)

**Entry:** Tap "📦 Mẫu Plan" button → `pushPage({ id: 'plan-template-gallery' })`

```
← Mẫu kế hoạch tập

  Gợi ý cho bạn
  Dựa trên: Intermediate • Hypertrophy • 5 ngày
  ┌─────────────────────────────────────────────┐
  │ 🎯 PPL + Arms (5 ngày)            [95% ✓]  │
  │    Push/Pull/Legs/Upper/Lower               │
  │                                             │
  │ 💪 Upper/Lower + Push (5 ngày)     [87% ✓]  │
  │    Compound-focused • Barbell dominant       │
  │                                             │
  │ ⚡ Modified PPL (5 ngày)           [82% ✓]  │
  │    Push/Pull/Legs + Full Upper/Lower         │
  └─────────────────────────────────────────────┘

  ── Tất cả mẫu ──
  ┌─────────────────────────────────────────────┐
  │ 💪 Starting Strength (3 ngày)      Beginner │
  │ 🏋️ PPL Classic (6 ngày)          Inter     │
  │ ⚡ Upper/Lower (4 ngày)           Inter     │
  │ 🎯 Bro Split (5 ngày)            All       │
  │ 🔥 Stronglifts 5×5 (3 ngày)      Beginner  │
  │ 🧠 nSuns 5/3/1 (4-5 ngày)        Advanced  │
  │ 💎 PHUL (4 ngày)                  Inter     │
  │ ⭐ PHAT (5 ngày)                  Advanced  │
  └─────────────────────────────────────────────┘

  Mẫu của bạn
  ┌─────────────────────────────────────────────┐
  │ (trống — chưa lưu mẫu nào)                  │
  │ [+ Lưu plan hiện tại thành mẫu]             │
  └─────────────────────────────────────────────┘
```

### §7.5 DayAssignmentSheet (Bottom Sheet)

When tapping a workout's day badge in WorkoutAssignmentList:

```
┌──────────────────────────────────────┐
│ Gán "Upper Pull" vào ngày            │
├──────────────────────────────────────┤
│                                      │
│ (●) Thứ 2                    🟢     │
│ (○) Thứ 3                    ⚠️ đã gán│
│ (○) Thứ 5                    🟢     │
│ (●) Thứ 6 ← đang chọn       🟢     │
│ (○) Chủ Nhật                  🟢     │
│                                      │
│ [         Xác nhận          ]        │
└──────────────────────────────────────┘
```

Shows only training days. Already-assigned days show warning icon.

### §7.6 SplitChangeConfirm (Bottom Sheet)

Confirmation dialog when changing split:

```
┌──────────────────────────────────────┐
│ Đổi sang Push/Pull/Legs             │
├──────────────────────────────────────┤
│                                      │
│ [🔄] Tạo plan mới hoàn toàn         │
│      ⚠️ Mất 6 bài đã chỉnh sửa      │
│                                      │
│ [🧠] Giữ bài tập, đổi cấu trúc     │
│      ✅ Giữ lại 12/14 bài tập        │
│      ⚠️ 2 bài cần gán thủ công       │
│                                      │
└──────────────────────────────────────┘
```

---

## §8 Builtin Templates (Seed Data)

| ID | Name | Split | Days | Level | Goal | Equipment |
|----|------|-------|------|-------|------|-----------|
| `starting_strength` | Starting Strength | full_body | 3 | beginner | strength | barbell |
| `ppl_classic` | PPL Classic | ppl | 6 | intermediate | hypertrophy | barbell, dumbbell |
| `upper_lower_4` | Upper/Lower Split | upper_lower | 4 | intermediate | hypertrophy | barbell, dumbbell, cable |
| `bro_split_5` | Bro Split | bro_split | 5 | all | hypertrophy | barbell, dumbbell, machine |
| `stronglifts_5x5` | Stronglifts 5×5 | full_body | 3 | beginner | strength | barbell |
| `nsuns_531` | nSuns 5/3/1 | upper_lower | 5 | advanced | strength | barbell |
| `phul_4` | PHUL | upper_lower | 4 | intermediate | general | barbell, dumbbell, cable |
| `phat_5` | PHAT | ppl | 5 | advanced | hypertrophy | barbell, dumbbell, machine, cable |

---

## §9 Performance Strategy

### Code Splitting (react-vite-best-practices)

| Component | Load Strategy | Reason |
|-----------|--------------|--------|
| PlanScheduleEditor | `React.lazy()` | Heavy: calendar + sortable list + validation |
| SplitChanger | `React.lazy()` | Heavy: re-map algorithm + preview |
| PlanTemplateGallery | `React.lazy()` | Heavy: template matching + gallery |
| DayAssignmentSheet | `React.lazy()` | Bottom sheet, shown on interaction |
| SplitChangeConfirm | `React.lazy()` | Bottom sheet, shown on interaction |
| WeeklyCalendarStrip | Eager | Always visible on Plan tab |
| WorkoutAssignmentList | Eager | Part of Plan tab layout |
| TemplateMatchBadge | Eager | Small, used inline |

### Preloading Strategy

```typescript
// Preload on button hover/focus (split-prefetch-hints rule)
const PlanScheduleEditor = lazyWithPreload(
  () => import('./components/PlanScheduleEditor')
);

// In TrainingPlanView:
<Button
  onMouseEnter={() => PlanScheduleEditor.preload()}
  onFocus={() => PlanScheduleEditor.preload()}
  onClick={() => pushPage({ id: 'plan-schedule-editor' })}
>
  ⚙️ Chỉnh sửa Plan
</Button>
```

### Suspense Boundaries

```typescript
// Each L3 page gets its own Suspense boundary
<Suspense fallback={<ScheduleEditorSkeleton />}>
  <PlanScheduleEditor />
</Suspense>
```

---

## §10 UX Guidelines Compliance (ui-ux-pro-max)

### §10.0 Empty States (per §5.5.1 pattern)

| Component | Empty State Condition | Display |
|-----------|----------------------|---------|
| PlanScheduleEditor | No active plan | "Chưa có kế hoạch tập. Tạo kế hoạch mới hoặc chọn từ mẫu." + CTA buttons |
| SplitChanger | No active plan | "Cần có kế hoạch tập trước khi đổi split." + "Tạo kế hoạch" button |
| PlanTemplateGallery | Seed data fails | "Không tải được mẫu. Thử lại?" + retry button |
| PlanTemplateGallery | No user templates | "Chưa lưu mẫu nào. Lưu plan hiện tại?" + CTA |
| WeeklyCalendarStrip (L2) | No active plan | Gray disabled strip, no toggle interaction |
| WorkoutAssignmentList | No unassigned workouts | "Tất cả buổi tập đã được gán ✅" |

### §10.1 Error Handling

| Error | Detection | Recovery |
|-------|-----------|----------|
| SQLite failure mid-split-change | try/catch around transaction | Rollback to previous state, show error toast "Lỗi lưu dữ liệu. Vui lòng thử lại." |
| Template `day_configs` corrupt JSON | JSON.parse() in try/catch | Skip corrupt template, log warning, show remaining templates |
| `autoAssignWorkouts()` workouts > training days | Count comparison before assign | Show warning toast "{{excess}} buổi tập chưa gán vì thiếu ngày tập. Thêm ngày tập hoặc xóa buổi tập." |
| Network/async timeout | Promise timeout wrapper | Show retry button + error message |
| Migration failure | try/catch around each ALTER | Log error, skip failed step, continue with available columns |
| Duplicate assignment (2 workouts same day + same muscle) | Validation check before save | Show warning "Cùng nhóm cơ vào 2 ngày liên tiếp" but allow save (warning, not blocking) |

### §10.2 Dark Mode & ARIA Standards

Follow 2026-03-28 spec §11 UI Implementation Standards as canonical reference for:
- Dark mode color tokens (emerald-400 on gray-900 for training, gray-600 on gray-800 for rest)
- ARIA roles: `role="tablist"` for calendar strip, `role="listbox"` for assignment list, `aria-selected` for active day
- Touch targets: all interactive elements ≥44px
- Focus management: after pushPage, focus moves to page title; after popPage, focus returns to trigger button

### Critical (Priority 1-2)

| Rule | Application |
|------|-------------|
| `touch-target-size` ≥44px | Calendar day buttons: 44px diameter. Drag handles: 44×44px hit area. |
| `touch-spacing` ≥8px | 8px gap between calendar day buttons. 8px gap between workout cards. |
| `gesture-alternative` | Drag-to-reorder has Move Up/Down buttons for accessibility. |
| `confirmation-dialogs` | SplitChangeConfirm before destructive split change. |
| `loading-buttons` | Disable "Áp dụng" during async operations, show spinner. |

### High (Priority 3-5)

| Rule | Application |
|------|-------------|
| `progressive-disclosure` | 2-step process (choose days → assign workouts). |
| `empty-states` | "Chưa gán" badge with guidance text for unassigned workouts. |
| `back-behavior` | All L3 pages support `popPage()` back navigation. |
| `undo-support` | "Khôi phục gốc" for schedule, exercises, and split changes. |

### Medium (Priority 6-8)

| Rule | Application |
|------|-------------|
| `prefers-reduced-motion` | Drag animations respect reduced-motion preference. |
| `duration-timing` 150-300ms | Calendar toggle: 200ms. Card reorder: 250ms. |
| `inline-validation` | Validate on blur: min 2 training days, all workouts assigned. |
| `form-autosave` | PlanScheduleEditor auto-saves draft to prevent data loss. |

---

## §11 i18n Keys (vi.json)

```json
{
  "fitness": {
    "plan": {
      "editScheduleBtn": "Chỉnh sửa Plan",
      "templateBtn": "Mẫu Plan",
      "changeSplitBtn": "Đổi Split"
    },
    "schedule": {
      "title": "Chỉnh sửa lịch tập",
      "step1": "Bước 1: Chọn ngày tập",
      "step2": "Bước 2: Gán buổi tập → ngày",
      "trainingDay": "Ngày tập",
      "restDay": "Ngày nghỉ",
      "autoAssign": "Tự động gán",
      "unassigned": "Chưa gán",
      "restoreOriginal": "Khôi phục lịch gốc",
      "daysSelected": "Đã chọn {{count}} ngày tập",
      "minDaysWarning": "Cần ít nhất 2 ngày tập",
      "maxDaysWarning": "Tối đa 6 ngày tập",
      "allAssigned": "Tất cả buổi tập đã được gán",
      "consecutiveMuscleWarning": "Cùng nhóm cơ vào 2 ngày liên tiếp"
    },
    "split": {
      "changeTitle": "Đổi kiểu phân chia",
      "currentSplit": "Split hiện tại",
      "selectNew": "Chọn split mới",
      "fullBody": "Full Body",
      "upperLower": "Upper/Lower",
      "ppl": "Push/Pull/Legs",
      "broSplit": "Bro Split",
      "custom": "Tùy chỉnh",
      "regenerate": "Tạo plan mới hoàn toàn",
      "regenerateDesc": "Xóa sạch, auto-generate từ profile",
      "remap": "Giữ bài tập, đổi cấu trúc",
      "remapDesc": "Re-map bài tập vào split mới",
      "preview": "Xem trước thay đổi",
      "mapped": "Đã map",
      "suggested": "Đề xuất",
      "unmapped": "Chưa map",
      "lostExercises": "Mất {{count}} bài đã chỉnh sửa",
      "keptExercises": "Giữ lại {{kept}}/{{total}} bài tập",
      "needsManual": "{{count}} bài cần gán thủ công",
      "applyChange": "Áp dụng thay đổi",
      "warningDestructive": "Mất toàn bộ chỉnh sửa!"
    },
    "templates": {
      "title": "Mẫu kế hoạch tập",
      "recommended": "Gợi ý cho bạn",
      "recommendedDesc": "Dựa trên: {{level}} • {{goal}} • {{days}} ngày",
      "matchScore": "{{score}}% phù hợp",
      "viewAll": "Xem tất cả mẫu",
      "allTemplates": "Tất cả mẫu",
      "userTemplates": "Mẫu của bạn",
      "noUserTemplates": "Chưa lưu mẫu nào",
      "apply": "Áp dụng mẫu",
      "applyConfirm": "Áp dụng mẫu \"{{name}}\"? Plan hiện tại sẽ bị thay thế.",
      "saveAsCurrent": "Lưu plan hiện tại thành mẫu",
      "saveName": "Tên mẫu",
      "saveSuccess": "Đã lưu mẫu thành công",
      "popular": "Phổ biến",
      "beginner": "Beginner",
      "intermediate": "Intermediate",
      "advanced": "Advanced",
      "allLevels": "Mọi trình độ",
      "daysPerWeek": "{{count}} ngày/tuần"
    }
  }
}
```

---

## §12 Files to Create/Modify

### New Files

| File | Description |
|------|-------------|
| `src/features/fitness/components/PlanScheduleEditor.tsx` | Full-screen schedule editor |
| `src/features/fitness/components/WeeklyCalendarStrip.tsx` | 7-day toggle calendar |
| `src/features/fitness/components/WorkoutAssignmentList.tsx` | Sortable workout-to-day list |
| `src/features/fitness/components/DayAssignmentSheet.tsx` | Bottom sheet for day selection |
| `src/features/fitness/components/SplitChanger.tsx` | Full-screen split type changer |
| `src/features/fitness/components/SplitChangeConfirm.tsx` | Bottom sheet confirmation |
| `src/features/fitness/components/PlanTemplateGallery.tsx` | Full-screen template browser |
| `src/features/fitness/components/TemplateMatchBadge.tsx` | Match % badge |
| `src/features/fitness/utils/templateMatcher.ts` | Template matching algorithm |
| `src/features/fitness/utils/splitRemapper.ts` | Exercise re-mapping for split change |
| `src/features/fitness/data/builtinTemplates.ts` | Seed data for 8 builtin templates |

### Modified Files

| File | Changes |
|------|---------|
| `src/features/fitness/types.ts` | Add `SplitType`, `PlanTemplate`, `SplitChangePreview` types |
| `src/services/schema.ts` | Migration: new columns + `plan_templates` table |
| `src/store/fitnessStore.ts` | 10 new actions (schedule, split, templates) |
| `src/features/fitness/components/TrainingPlanView.tsx` | Add action buttons bar, integrate WeeklyCalendarStrip |
| `src/features/fitness/hooks/useTrainingPlan.ts` | Support trainingDays field in plan generation |
| `src/features/dashboard/hooks/useTodaysPlan.ts` | Use trainingDays for today detection |
| `src/locales/vi.json` | 40+ new i18n keys |

### Test Files

| File | Tests |
|------|-------|
| `src/__tests__/PlanScheduleEditor.test.tsx` | Calendar toggle, workout assignment, auto-assign, restore |
| `src/__tests__/SplitChanger.test.tsx` | Split selection, regenerate vs remap, preview |
| `src/__tests__/PlanTemplateGallery.test.tsx` | Template display, matching, apply, save |
| `src/__tests__/templateMatcher.test.ts` | Match score calculation, edge cases |
| `src/__tests__/splitRemapper.test.ts` | Exercise re-mapping algorithm |
| `src/__tests__/WeeklyCalendarStrip.test.tsx` | Day toggle, min/max validation, a11y |
| `src/__tests__/DayAssignmentSheet.test.tsx` | Day selection, conflict warnings |

| `src/__tests__/SplitChangeConfirm.test.tsx` | Confirmation dialog, regen vs remap selection |
| `src/__tests__/WorkoutAssignmentList.test.tsx` | Sortable list, drag reorder, assignment display |
| `src/__tests__/builtinTemplates.test.ts` | Seed data structure validation, JSON integrity |
| `src/__tests__/fitnessStore.scheduleActions.test.ts` | 10 new store actions, SQLite persistence |

---

## §13 Testing Strategy

### Unit Tests (target: 100% coverage for new code)

- All store actions: input validation, state mutation, SQLite persistence
- Template matching: scoring accuracy, edge cases (no equipment match, all-level templates)
- Split re-mapping: muscle group assignment, unmapped exercises handling
- Calendar strip: toggle logic, min/max day validation
- Assignment list: drag reorder, auto-assign algorithm

### Integration Tests

- Full flow: onboarding → plan generation → schedule edit → split change → template apply
- Data persistence: edit schedule → close app → reopen → verify schedule preserved
- History continuity: change plan → verify old workouts intact → verify new plan applies from next session

### E2E Tests

- Schedule editor: open → toggle days → assign workouts → save → verify plan updated
- Split changer: open → select new split → choose remap → verify exercises preserved
- Template gallery: browse → select template → apply → verify plan created

---

## §14 Migration & Rollback

### Forward Migration (v_schedule_editor)

```sql
-- Step 1: Add columns to existing tables
ALTER TABLE training_plan_days ADD COLUMN is_user_assigned INTEGER DEFAULT 0;
ALTER TABLE training_plan_days ADD COLUMN original_day_of_week INTEGER;
ALTER TABLE training_plans ADD COLUMN template_id TEXT;
ALTER TABLE training_plans ADD COLUMN training_days TEXT;
ALTER TABLE training_plans ADD COLUMN rest_days TEXT;

-- Step 2: Normalize existing split_type values
UPDATE training_plans SET split_type = 'full_body'
  WHERE LOWER(REPLACE(REPLACE(split_type, ' ', '_'), '/', '_')) LIKE '%full%body%';
UPDATE training_plans SET split_type = 'upper_lower'
  WHERE LOWER(REPLACE(REPLACE(split_type, ' ', '_'), '/', '_')) LIKE '%upper%lower%';
UPDATE training_plans SET split_type = 'ppl'
  WHERE LOWER(REPLACE(REPLACE(split_type, ' ', '_'), '/', '_')) LIKE '%push%'
    OR LOWER(split_type) = 'ppl';
UPDATE training_plans SET split_type = 'bro_split'
  WHERE LOWER(REPLACE(REPLACE(split_type, ' ', '_'), '/', '_')) LIKE '%bro%';
UPDATE training_plans SET split_type = 'custom'
  WHERE split_type NOT IN ('full_body', 'upper_lower', 'ppl', 'bro_split');

-- Step 3: Backfill original_day_of_week for existing plan days
UPDATE training_plan_days SET original_day_of_week = day_of_week
  WHERE original_day_of_week IS NULL;

-- Step 4: Backfill training_days and rest_days for existing plans
UPDATE training_plans SET
  training_days = (
    SELECT json_group_array(DISTINCT day_of_week)
    FROM training_plan_days
    WHERE plan_id = training_plans.id
  ),
  rest_days = (
    SELECT json_group_array(d.value) FROM (
      SELECT value FROM json_each('[1,2,3,4,5,6,7]')
      WHERE value NOT IN (
        SELECT DISTINCT day_of_week FROM training_plan_days
        WHERE plan_id = training_plans.id
      )
    ) d
  )
WHERE training_days IS NULL;

-- Step 5: Create templates table
CREATE TABLE IF NOT EXISTS plan_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  split_type TEXT NOT NULL,
  days_per_week INTEGER NOT NULL,
  experience_level TEXT,
  training_goal TEXT,
  equipment_required TEXT,
  description TEXT,
  day_configs TEXT NOT NULL,
  popularity_score INTEGER DEFAULT 0,
  is_builtin INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Step 6: Seed builtin templates
INSERT OR IGNORE INTO plan_templates (id, name, split_type, days_per_week, experience_level, training_goal, equipment_required, description, day_configs, is_builtin)
VALUES
  ('starting_strength', 'Starting Strength', 'full_body', 3, 'beginner', 'strength', '["barbell"]', 'Squat/Bench/Deadlift alternating full body', '[]', 1),
  ('ppl_classic', 'PPL Classic', 'ppl', 6, 'intermediate', 'hypertrophy', '["barbell","dumbbell"]', 'Push/Pull/Legs x2 per week', '[]', 1),
  ('upper_lower_4', 'Upper/Lower Split', 'upper_lower', 4, 'intermediate', 'hypertrophy', '["barbell","dumbbell","cable"]', 'Upper A/Lower A/Upper B/Lower B', '[]', 1),
  ('bro_split_5', 'Bro Split', 'bro_split', 5, 'all', 'hypertrophy', '["barbell","dumbbell","machine"]', 'Chest/Back/Shoulders/Arms/Legs', '[]', 1),
  ('stronglifts_5x5', 'Stronglifts 5x5', 'full_body', 3, 'beginner', 'strength', '["barbell"]', '5 sets x 5 reps compound focus', '[]', 1),
  ('nsuns_531', 'nSuns 5/3/1', 'upper_lower', 5, 'advanced', 'strength', '["barbell"]', 'Wendler 5/3/1 based progression', '[]', 1),
  ('phul_4', 'PHUL', 'upper_lower', 4, 'intermediate', 'general', '["barbell","dumbbell","cable"]', 'Power Hypertrophy Upper Lower', '[]', 1),
  ('phat_5', 'PHAT', 'ppl', 5, 'advanced', 'hypertrophy', '["barbell","dumbbell","machine","cable"]', 'Power Hypertrophy Adaptive Training', '[]', 1);
```

### Rollback

```sql
-- Safe: new columns are nullable, new table can be dropped
DROP TABLE IF EXISTS plan_templates;
-- ALTER TABLE DROP COLUMN not supported in SQLite, but unused columns are harmless
```
