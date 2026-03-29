# Unified Onboarding — Design Spec

**Status:** Reviewed (v5 — multi-skill analysis fixes: UX, React/Vite, Web Guidelines, Accessibility)
**Date:** 2026-03-30
**Author:** AI (Copilot CLI)
**Replaces:** Separate AppOnboarding + FitnessOnboarding flows

---

## 1. Problem Statement

The current app has **two separate onboarding flows**:
1. **AppOnboarding** (3 welcome slides + health profile form) — blocks all tabs
2. **FitnessOnboarding** (6–10 step wizard) — blocks Fitness tab only

This causes:
- **User confusion**: Unexpected second onboarding when tapping Fitness tab
- **Missing critical data**: Nutrition goal (cut/bulk/maintain) not collected → calorie targets wrong from day 1
- **No personalization**: User name stored from OAuth but never used in UI
- **Poor mobile UX**: Health profile form shows 9 fields on 1 page (~2.7x viewport scroll)
- **No user agency**: Plan auto-generates with no choice (auto vs manual)

## 2. Solution Overview

Replace both onboardings with a single **UnifiedOnboarding** component — one continuous wizard with 7 sections, section-based progress bar, and consistent visual design. Plan editing improvements are tracked separately in [`plan-editing-improvements.md`](./2026-03-30-plan-editing-improvements.md).

### Flow Summary

```
Section 1: Chào mừng (3 slides)                     — ~15s
Section 2: Hồ sơ sức khỏe (4 steps)                 — ~60s
Section 3: Mục tiêu tập luyện (1 step, 3 fields)    — ~15s
Section 4: Tùy chỉnh tập luyện (3–7 steps adaptive) — ~20-50s
Section 5: Chọn chiến lược (auto vs manual)          — ~5s
Section 6: Đang lên kế hoạch (10s animation, auto only)
Section 7: Xem trước kế hoạch (plan preview, auto only)
→ App ready
```

**Total time**: ~1:50 (beginner) to ~3:00 (advanced)

### Key Improvements
- **Single flow**: No surprise second onboarding
- **Progressive disclosure**: Advanced fields hidden behind collapsible
- **Critical data collected**: Nutrition goal + target weight + user name
- **DOB instead of age**: Auto-updates for accurate BMR calculation
- **User agency**: Choose auto-generated plan vs manual build
- **UX theater**: 10s "computing" animation creates perceived value
- **Plan preview**: Summary of generated plan before entering app
- **Full edit freedom**: Existing plan editing works post-onboarding; further improvements in [separate spec](./2026-03-30-plan-editing-improvements.md)
- **No page scrolling**: Every step fits within mobile viewport (≤667px)

---

## 3. Section Details

### Section 1: Welcome Slides (unchanged)

3 carousel slides introducing the app. Keep existing implementation from `AppOnboarding.tsx`.

| Slide | Icon | Title | Description |
|-------|------|-------|-------------|
| 0 | UtensilsCrossed | Chào mừng đến với Smart Meal Planner | Lên kế hoạch bữa ăn... |
| 1 | BarChart3 | Dinh dưỡng chính xác | Theo dõi calo, protein... |
| 2 | Dumbbell | Tập luyện & Sức khỏe | Kế hoạch tập luyện cá nhân... |

**Navigation**: Next / Skip to step 2a / Dot indicator (3 dots)

---

### Section 2: Health Profile (4 steps)

#### Step 2a: Basic Info
**Fields**: Name, Gender, Date of Birth, Height (cm), Weight (kg)

| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| name | text input | 1-50 chars, required | For personalization ("Chào Khánh!") |
| gender | RadioPills (2) | required | Male / Female |
| dateOfBirth | date picker | required, age 10-100 | Native `<input type="date">` on Android. Store as ISO date, compute age dynamically. |
| heightCm | number input, `inputMode="decimal"` | 100-250, step 0.5 | Inline with weight (side-by-side). Placeholder: "170" |
| weightKg | number input, `inputMode="decimal"` | 30-300, step 0.1 | Inline with height (side-by-side). Placeholder: "70" |

**Layout**: 5 fields, single viewport. Height + Weight on same row to save space. If viewport audit shows overflow on 360dp devices, split into 2 sub-steps: (Name + Gender + DOB) → (Height + Weight).

#### Step 2b: Activity Level
**Fields**: Activity level (single selection from 5 cards)

| Value | Label | Description | TDEE Multiplier |
|-------|-------|-------------|-----------------|
| sedentary | Ít vận động | Ngồi nhiều, làm việc văn phòng | 1.2 |
| light | Vận động nhẹ | Đi bộ, việc nhà cơ bản | 1.375 |
| moderate | Vận động vừa | Đi lại nhiều, công việc chân tay | 1.55 |
| active | Vận động nhiều | Lao động chân tay, thể thao | 1.725 |
| extra_active | Cường độ cao | VĐV / lao động nặng liên tục | 1.9 |

**Layout**: 5 stacked cards with icon + title + subtitle. Single selection.
**Note**: Subtitle clarifies "không tính tập gym — chỉ hoạt động thường ngày"

#### Step 2c: Nutrition Goal (NEW)
**Fields**: Goal type, Rate of change (conditional), Target weight (conditional)

| Field | Type | Validation | Condition |
|-------|------|-----------|-----------|
| goalType | 3 cards | required | Always shown: cut / maintain / bulk |
| rateOfChange | 3 pills | required | Only if goalType ≠ maintain |
| targetWeightKg | number input | 30-300, step 0.1 | Only if goalType ≠ maintain |

**Calorie Offset Map**:
| Goal + Rate | Offset |
|-------------|--------|
| cut + conservative | -275 kcal |
| cut + moderate | -550 kcal |
| cut + aggressive | -1100 kcal |
| maintain | 0 kcal |
| bulk + conservative | +275 kcal |
| bulk + moderate | +550 kcal |
| bulk + aggressive | +1100 kcal |

**Layout**: 3 goal cards (horizontal row) → rate pills → target weight input. Show delta: "Hiện tại: 65 kg → Mục tiêu: 60 kg (giảm 5 kg)"

#### Step 2d: Confirmation
**Content**: Summary card + hero calorie number + expandable detail

**Summary card** (compact, 2-column grid):
- Row 1: Name + Gender
- Row 2: Age (from DOB) + Height/Weight
- Row 3: Goal (cut/bulk/maintain) + rate + target

**Hero number** (large, centered):
- "Calo mục tiêu hàng ngày: **2,150 kcal**"

**Expandable detail** ("Xem chi tiết ▸", collapsed by default):
- BMR (Mifflin-St Jeor) with tooltip: "Năng lượng cơ thể tiêu hao khi nghỉ ngơi"
- TDEE (BMR × activity) with tooltip: "Năng lượng tiêu hao mỗi ngày bao gồm hoạt động"
- Macro preview (Protein g, Fat g, Carbs g)

**Advanced settings** (separate collapsible, collapsed by default):
- Body Fat % (optional, 3-60%)
- BMR Override toggle + custom value
- Protein Ratio (g/kg, 0.8-4.0)

**Note**: The "Xem chi tiết" section ensures the default view fits in ≤667px viewport. Advanced settings are for power users only — accessible here but also available in Settings after onboarding.

**Personalization**: Title uses name: "Khánh, đây là hồ sơ của bạn"

**CTA**: "Tiếp tục thiết lập tập luyện →"

---

### Section 3: Training Goal (1 step, 3 fields)

Keep existing fitness onboarding step 0 (`core` step):

| Field | Type | Options |
|-------|------|---------|
| trainingGoal | RadioPills | strength / hypertrophy / endurance / general |
| experience | RadioPills | beginner / intermediate / advanced |
| daysPerWeek | Pill buttons | 2 / 3 / 4 / 5 / 6 |

**Layout**: 3 field groups stacked vertically. Same as current FitnessOnboarding step 0.

---

### Section 4: Training Details (adaptive, 3–7 steps)

Keep existing fitness onboarding steps 1–9 with dynamic visibility based on experience level:

| Step | Field | Visibility |
|------|-------|-----------|
| 4a | Session duration (30/45/60/90 min) | All levels |
| 4b | Equipment (multi-select, 6 options) | All levels |
| 4c | Injuries (multi-select, 6 regions) | All levels |
| 4d | Cardio sessions/week (0–5) | All levels |
| 4e | Periodization (linear/undulating/block) | Intermediate+ |
| 4f | Cycle weeks (4/6/8/12) | Intermediate+ |
| 4g | Priority muscles (max 3 of 7) | Intermediate+ |
| 4h | Known 1RM (squat/bench/deadlift/ohp) | Intermediate+ (optional, "Chưa biết" toggle) |
| 4i | Sleep hours (3–12) | Advanced only |

**Step count by level**: Beginner=4 (no 1RM/periodization/cycle/priority/sleep), Intermediate=8, Advanced=9

---

### Section 5: Strategy Choice (NEW)

Full-screen choice page between two options.

**Option A — Auto (Recommended)**:
- Large card with gradient border (emerald)
- "Đề xuất ✨" floating badge
- Sparkles icon (Lucide)
- Title: "Để app lên kế hoạch"
- Subtitle: "Tự động tối ưu dựa trên hồ sơ của bạn. Bạn vẫn có thể chỉnh sửa mọi thứ sau."
- 3 benefit checkmarks
- 2x visual weight of Manual option

**Option B — Manual**:
- Compact horizontal card (secondary styling)
- Pencil icon (Lucide)
- Title: "Tự lên kế hoạch"
- Subtitle: "Tự chọn bài tập, ngày tập, ngày nghỉ theo ý bạn."

**Behavior**:
- Tap Auto → Section 6 (Computing)
- Tap Manual → Complete onboarding, enter app (no plan generated)
- No confirm dialog — immediate action on tap
- Footer note: "Bạn luôn có thể thay đổi sau trong Cài đặt"

---

### Section 6: Computing Screen (NEW, auto only)

10-second animated page creating perceived value.

**Visual**: Full-screen, gradient background (dark → emerald)

**4 progress steps** (staggered 2.5s each):

| Time | Step | Subtitle (personalized) |
|------|------|------------------------|
| 0.5s | Phân tích mục tiêu tập luyện | "{goal} + {split} {days}x/tuần" |
| 2.5s | Lựa chọn bài tập phù hợp | "{N} bài tập phù hợp thiết bị của bạn" |
| 5.5s | Tối ưu lịch tập & ngày nghỉ | "Đang tính toán…" |
| 8.0s | Hoàn thiện kế hoạch cá nhân | "{weeks} tuần, {periodization}" |

**Animation details**:
- Each step: slide-in from left → pulse while processing → check ✓ on complete
- Progress bar: smooth 0% → 100% over 10s
- `generatePlan()` actually executes at step 2 (~10ms, hidden behind animation)
- Step subtitles show real data from generated plan
- Header: personalized "Đang lên kế hoạch cho {name}…"

**Completion**: Auto-navigate to **Section 7 (Plan Preview)** after all steps done

**Repeat visit optimization**: If user goes back from Section 7 → Section 5 → re-picks Auto, use 3s animation instead of 10s (plan regenerates in ~10ms regardless).

**Accessibility**: `prefers-reduced-motion` → skip animation entirely, go straight to Section 7

**No back/skip**: Cannot go back or skip from computing screen

---

### Section 7: Plan Preview (NEW, auto only)

Full-screen plan summary shown after computing screen. Gives users a "here's your plan" moment before entering the app.

**Header** (gradient emerald):
- "Kế hoạch đã sẵn sàng! 🎉"
- Personalized: "{name}, đây là kế hoạch của bạn"
- Plan metadata: "{split} • {weeks} tuần • {days}/tuần"

**7-Day Calendar Strip**:
- Same calendar UI as TrainingPlanView
- Workout days: emerald bg, show muscle group label (e.g., "Upper")
- Rest days: gray bg, show `t('fitness.plan.restDay')` (reuses existing i18n key "Nghỉ")

**Summary Card**:
- 4 stats in 2×2 grid: workout days, rest days, total exercises, session duration
- Icons + numbers for quick scanning

**Day Preview Cards** (scrollable):
- One card per workout day showing day name + type + exercise names (truncated)
- Max 3-4 cards visible, rest scrollable

**CTAs** (two buttons, stacked):
1. **Primary**: "Bắt đầu tập luyện →" (emerald, full-width) — enters app
2. **Secondary**: "Tùy chỉnh kế hoạch trước" (outline, full-width) — enters plan in edit mode

**Behavior**:
- "Bắt đầu" → complete onboarding, enter app normally
- "Tùy chỉnh" → complete onboarding, enter fitness tab with plan view expanded + toast "Chạm vào ✎ để chỉnh sửa"
- Both paths set `isOnboarded=true` and `isAppOnboarded=true`

**Back navigation**: Back returns to Strategy Choice (Section 5) — allows switching to manual. If user then selects Manual, the already-generated plan data is cleaned up: `clearTrainingPlans()` is called before completing onboarding in manual mode.

---

### Section 3.7 (post-onboarding): Plan Editing Improvements

> **Extracted to separate spec**: See [`2026-03-30-plan-editing-improvements.md`](./2026-03-30-plan-editing-improvements.md)
>
> Plan editing improvements (regenerate anytime, delete session UI, undo toast, toggle rest/workout, accessibility fixes) modify 5 existing production components and carry regression risk independent of onboarding. They are tracked as a separate work item to enable phased delivery and isolated testing.
>
> **Dependency**: The "Tùy chỉnh kế hoạch trước" CTA in Section 7 benefits from editing improvements but does NOT block onboarding — existing edit capabilities are sufficient for launch.

---

## 4. Architecture

### New Components

| Component | Path | Purpose |
|-----------|------|---------|
| UnifiedOnboarding | `src/components/UnifiedOnboarding.tsx` | Main wizard container with section routing |
| OnboardingProgress | `src/components/onboarding/OnboardingProgress.tsx` | Section-based progress bar |
| WelcomeSlides | `src/components/onboarding/WelcomeSlides.tsx` | 3 welcome slides (extracted from AppOnboarding) |
| HealthBasicStep | `src/components/onboarding/HealthBasicStep.tsx` | Step 2a: Name, Gender, DOB, Height, Weight |
| ActivityLevelStep | `src/components/onboarding/ActivityLevelStep.tsx` | Step 2b: Activity level cards |
| NutritionGoalStep | `src/components/onboarding/NutritionGoalStep.tsx` | Step 2c: Cut/Bulk/Maintain + rate + target |
| HealthConfirmStep | `src/components/onboarding/HealthConfirmStep.tsx` | Step 2d: Summary + computed + advanced |
| TrainingCoreStep | `src/components/onboarding/TrainingCoreStep.tsx` | Section 3: Goal + Experience + Days |
| TrainingDetailSteps | `src/components/onboarding/TrainingDetailSteps.tsx` | Section 4: Step router (~80 lines), delegates to individual step components in `training-steps/` subfolder |
| PlanStrategyChoice | `src/components/onboarding/PlanStrategyChoice.tsx` | Section 5: Auto vs Manual |
| PlanComputingScreen | `src/components/onboarding/PlanComputingScreen.tsx` | Section 6: 10s animated computing |
| PlanPreviewScreen | `src/components/onboarding/PlanPreviewScreen.tsx` | Section 7: Plan summary + CTAs |

### Modified Components

| Component | Changes |
|-----------|---------|
| App.tsx | Replace `<AppOnboarding>` with `<UnifiedOnboarding>` |
| FitnessTab.tsx | Remove `!isOnboarded` gate, remove auto-generate useEffect |
| AppOnboarding.tsx | DELETE (replaced by UnifiedOnboarding) |
| FitnessOnboarding.tsx | DELETE (merged into UnifiedOnboarding) |

### Store Changes

**healthProfileStore.ts** (persists via SQLite `user_profile` table):
- Add `name: string` to `HealthProfile` interface and `user_profile` table
- Add `dateOfBirth: string | null` (ISO date) — `age` field stays for backward compat but is computed from DOB when available
- Update `saveProfile(db, profile)` to include `name` and `date_of_birth` columns
- Update `rowToProfile()` to read new columns
- No new store actions needed — `saveProfile(db, profile)` already saves the full profile object

**fitnessStore.ts** (persists via Zustand persist key `'fitness-storage'`, version 1):
- Add `planStrategy: 'auto' | 'manual' | null` to `FitnessState` (default: null)
- Add `setPlanStrategy(strategy)` action
- Bump persist `version` to `2`, add `migrate` function: `(state) => ({ ...state, planStrategy: null })`

**healthProfileStore.ts — Goals** (persists via SQLite `goals` table):
- No schema changes needed. `saveGoal(db, goal)` already handles Goal type with all fields.
- Step 2c constructs a `Goal` object and calls `saveGoal(db, goal)`.

**appOnboardingStore.ts** (persists via Zustand persist key `'app-onboarding-storage'`):
- Add `onboardingSection: number | null` for resume support (see Section 4a)
- Add `version: 1` to persist config (currently missing — MUST add)
- Add `migrate` function: `if (version < 1) return { ...state, onboardingSection: null }`
- `setAppOnboarded(true)` fires after ALL sections complete

### Data Flow (corrected to match actual store API)

```
UnifiedOnboarding receives `db: DatabaseService` from `useDatabase()` hook
All health/goal writes use the db instance from DatabaseContext.
Single `useForm()` instance with Zod resolver spans the entire wizard.
Each step receives `control` prop and validates its own fields via `trigger()`.

  ├── Section 1: WelcomeSlides → (no store writes, no form fields)
  │
  ├── Section 2a: HealthBasicStep
  │     → Local form state (React Hook Form)
  │     → On "Next": validate, store in wizard-level state (NOT persisted yet)
  │
  ├── Section 2b: ActivityLevelStep
  │     → Local form state
  │     → On "Next": store in wizard-level state
  │
  ├── Section 2c: NutritionGoalStep
  │     → Local form state
  │     → On "Next": store in wizard-level state
  │
  ├── Section 2d: HealthConfirmStep — COMMIT POINT #1
  │     → Display summary from wizard state
  │     → On "Continue":
  │       1. healthProfileStore.saveProfile(db, { ...wizardProfile })
  │       2. healthProfileStore.saveGoal(db, { ...wizardGoal })
  │       3. appOnboardingStore.setOnboardingSection(3)
  │
  ├── Section 3: TrainingCoreStep
  │     → Local form state (goal, experience, daysPerWeek)
  │     → On "Next": store in wizard-level state
  │
  ├── Section 4: TrainingDetailSteps (3-7 adaptive steps)
  │     → Local form state per step
  │     → On last step "Next" — COMMIT POINT #2:
  │       1. fitnessStore.setTrainingProfile(fullTrainingProfile)
  │       2. appOnboardingStore.setOnboardingSection(5)
  │
  ├── Section 5: PlanStrategyChoice
  │     → fitnessStore.setPlanStrategy('auto' | 'manual')
  │     → If 'manual': jump to COMPLETE
  │     → If 'auto': proceed to Section 6
  │
  ├── Section 6: PlanComputingScreen
  │     → Reads trainingProfile from fitnessStore, healthProfile from healthProfileStore
  │     → At step 2 animation: call generatePlan({ trainingProfile, healthProfile }) + addTrainingPlan(plan) + addPlanDays(days)
  │     → On animation complete: setOnboardingSection(7), proceed to Section 7
  │
  ├── Section 7: PlanPreviewScreen
  │     → Display generated plan summary (read from fitnessStore)
  │     → "Bắt đầu" or "Tùy chỉnh" → proceed to COMPLETE
  │
  └── COMPLETE:
        1. fitnessStore.setOnboarded(true)
        2. appOnboardingStore.setAppOnboarded(true)
        3. appOnboardingStore.setOnboardingSection(null)
```

**Key design decision**: Health data accumulates in wizard-level React state and only persists to SQLite at "commit points" (end of Section 2 and end of Section 4). This avoids partial writes and keeps the DatabaseService calls minimal. If the app is killed mid-section, the user resumes from the start of that section.

---

## 5. Progress Bar Design

**Section-based** (not step-based) — 7 segments representing 7 sections.

```
[███ ][██  ][    ][    ][    ][    ][    ]
 Sec1  Sec2  Sec3  Sec4  Sec5  Sec6  Sec7
```

- Each section segment fills proportionally as steps within it complete
- **Single color**: emerald-500 fill on gray-200 background, with subtle dividers between segments
- Current section label shown below bar
- Total width: 100% of screen, height: 4px, border-radius: 2px
- Section 7 only appears for auto path (manual skips Section 6+7)

---

## 5a. Navigation Behavior

### Back Navigation
- **Within a section**: Back button returns to previous step, form data preserved in wizard-level React state
- **Between sections**: Back returns to last step of previous section, data preserved
- **Section 1 (Welcome)**: No back on first slide. Back cycles slides.
- **Section 6 (Computing)**: No back button — animation is one-way
- **Section 7 (Preview)**: Back returns to Section 5 (Strategy Choice). If user then picks Manual, call `clearTrainingPlans()` to clean up the auto-generated plan before completing onboarding.
- **Section 5 (Strategy)**: Back returns to last step of Section 4

### Step Transitions
- **Within a section**: 200ms slide-left on forward, 200ms slide-right on back. Use `motion` (Framer Motion) `AnimatePresence` with `initial/animate/exit` variants.
- **Between sections**: Same slide animation with section-change indicator (progress bar fills)
- **All transitions**: `transform` + `opacity` only (compositor-friendly). Respect `prefers-reduced-motion` via `motion`'s built-in `useReducedMotion()`.

### Experience Level Change (Section 3 → Section 4)
- If user goes back to Section 3 and changes experience level (e.g., Intermediate → Beginner), Section 4 steps are re-computed via `getActiveSteps()`. Any data entered for now-hidden steps (periodization, cycle, priority) is preserved in RHF state but invisible. If user changes back to Intermediate, the data reappears. Only the visible steps are validated on "Next".

### Skip Behavior
- **Section 1 only**: "Bỏ qua" skips remaining slides, goes to step 2a
- **No skip** on any other section — health profile and training info are mandatory

### Data Preservation
- Steps within a section: React Hook Form state (in-memory, not persisted)
- **Single `useForm()` instance** in `UnifiedOnboarding.tsx` — passed via `control` prop to all steps. No separate `useReducer` needed. RHF accumulates all answers across steps and provides `getValues()` at commit points for SQLite writes.
- Commit points: SQLite writes happen only at end of Section 2 and end of Section 4
- If app is killed mid-section: resume from start of that section (see Section 5c)

---

## 5b. Error Handling

### Form Validation Errors
- React Hook Form with Zod schema validation per step
- Validation mode: `onBlur` for immediate field feedback, revalidation on change
- Errors shown inline below each field
- "Next" button stays enabled — validation triggers on submit attempt
- Error announcement: `aria-describedby` linking input to error message
- First invalid field auto-focused on validation failure

### Cross-Field Validation (Step 2a + 2c)
- **BMI sanity check**: If `weightKg / (heightCm/100)² < 12` or `> 60`, show warning: "Kết hợp chiều cao và cân nặng có vẻ không hợp lý. Vui lòng kiểm tra lại." (warning, not blocking)
- **Goal direction**: If `goalType === 'cut'` and `targetWeight ≥ currentWeight`, error: "Mục tiêu giảm cân phải nhỏ hơn cân nặng hiện tại". If `goalType === 'bulk'` and `targetWeight ≤ currentWeight`, error: "Mục tiêu tăng cơ phải lớn hơn cân nặng hiện tại"
- **Age edge case**: If DOB → age < 10, show: "Ứng dụng được thiết kế cho người từ 10 tuổi trở lên. Các công thức dinh dưỡng không phù hợp cho trẻ dưới 10."

### Plan Generation Failure (Section 6)
- `generatePlan()` returns null or throws → catch error
- Animation pauses at the failed step (shows ✕ instead of ✓)
- Error card slides in: "Có lỗi xảy ra khi tạo kế hoạch"
- Two buttons: "Thử lại" (retries from step 2) | "Tự lên kế hoạch" (switches to manual)
- "Tự lên kế hoạch" sets `planStrategy = 'manual'` and completes onboarding

### Network Errors
- Onboarding is fully offline — no API calls. SQLite is local WASM.
- No network error handling needed.

---

## 5c. Resume Strategy (App Kill / Browser Refresh)

### Approach: Section-level resume via `onboardingSection` in appOnboardingStore

**New field**: `onboardingSection: number | null` in `appOnboardingStore` (Zustand persist → localStorage)
- `null` = not started or completed
- `1–7` = resume from start of that section

**Resume logic** (in `UnifiedOnboarding` mount):
```
if (onboardingSection !== null) {
  // Resume from start of stored section
  // Data from completed sections already in SQLite
  // User re-enters data for current incomplete section
}
```

**Commit points update `onboardingSection`**:
- End of Section 2d: `setOnboardingSection(3)` → health data in SQLite
- End of Section 4: `setOnboardingSection(5)` → training profile in localStorage
- End of Section 6: `setOnboardingSection(7)` → plan generated and stored in fitnessStore
- End of onboarding: `setOnboardingSection(null)` + `setAppOnboarded(true)`

**Trade-off**: User may re-enter 1 section of data (max ~4 fields). Acceptable for rare app-kill scenario.

---

## 5d. Existing User State Migration

### Problem
After deploying unified onboarding, existing users may be in 3 states:
1. **Both onboarded** (isAppOnboarded=true, isOnboarded=true) — most users
2. **App-only** (isAppOnboarded=true, isOnboarded=false) — started app but never tapped Fitness
3. **Fresh install** (both false)

### Migration function (runs once on app boot in App.tsx)

```typescript
function migrateOnboardingState() {
  const appStore = useAppOnboardingStore.getState();
  const fitnessStore = useFitnessStore.getState();

  // Case 1: Both done → no change, skip unified onboarding entirely
  if (appStore.isAppOnboarded && fitnessStore.isOnboarded) return;

  // Case 2: App done, fitness not done → need fitness portion
  // Reset app onboarded so UnifiedOnboarding renders,
  // but set resume section to 3 (skip health, go to training)
  if (appStore.isAppOnboarded && !fitnessStore.isOnboarded) {
    appStore.setAppOnboarded(false);
    appStore.setOnboardingSection(3); // Resume at training section
    return;
  }

  // Case 3: Fresh → full unified onboarding (default behavior)
}
```

**Key**: This runs before React render. Existing app-only users see Sections 3–6 only (their health data is already in SQLite). Fresh users see everything.

---

## 6. Database Schema Migration (v2 → v3)

### New columns in `user_profile`

```sql
-- Migration v2 → v3: Unified onboarding fields
ALTER TABLE user_profile ADD COLUMN name TEXT DEFAULT '';
ALTER TABLE user_profile ADD COLUMN date_of_birth TEXT;
```

### Schema version bump

```typescript
// schema.ts
export const SCHEMA_VERSION = 3;

// In runSchemaMigrations():
if (currentVersion < 3) {
  // 1. Add name and date_of_birth to user_profile
  await db.execute("ALTER TABLE user_profile ADD COLUMN name TEXT DEFAULT ''");
  await db.execute("ALTER TABLE user_profile ADD COLUMN date_of_birth TEXT");

  // 2. Backfill: existing users keep their age, DOB stays null
  // Age is still used as fallback when DOB is null

  await db.execute('PRAGMA user_version = 3');
}
```

### HealthProfile type update

```typescript
export interface HealthProfile {
  id: string;
  name: string;               // NEW — display name for personalization
  gender: Gender;
  age: number;                 // KEPT for backward compat + fallback
  dateOfBirth: string | null;  // NEW — ISO date, primary age source
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  bodyFatPct?: number;
  bmrOverride?: number;
  proteinRatio: number;
  fatPct: number;
  targetCalories: number;
  updatedAt: string;
}

// Helper: compute age from DOB (used everywhere instead of raw .age)
export function getAge(profile: HealthProfile): number {
  if (profile.dateOfBirth) {
    const dob = new Date(profile.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  }
  return profile.age; // fallback for existing users without DOB
}
```

### SQL query updates

**saveProfile()** — add `name` and `date_of_birth` to INSERT:
```sql
INSERT OR REPLACE INTO user_profile
  (id, name, gender, age, date_of_birth, height_cm, weight_kg,
   activity_level, body_fat_pct, bmr_override, protein_ratio,
   fat_pct, target_calories, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

**rowToProfile()** — read new columns:
```typescript
name: (row.name as string) ?? '',
dateOfBirth: (row.date_of_birth as string) ?? null,
```

### Zustand persist migration (fitnessStore)

```typescript
// fitnessStore.ts persist config
{
  name: 'fitness-storage',
  version: 2, // bumped from 1
  migrate: (persisted: unknown, version: number) => {
    const state = persisted as Record<string, unknown>;
    if (version < 2) {
      return { ...state, planStrategy: null };
    }
    return state;
  },
}
```

### Consuming sites for `profile.age` → `getAge(profile)`

All sites that read `profile.age` for BMR/TDEE calculations must use `getAge(profile)`:
- `src/services/nutritionEngine.ts` — `calculateBMR()` line ~35
- `src/features/health-profile/components/HealthProfileForm.tsx` — form defaults
- Any component displaying user age

---

---

## 7. i18n Keys

All new keys under `onboarding.*` namespace. Existing `welcome.*` and `fitness.onboarding.*` keys remain unchanged — new components use the new namespace. Old keys will be deleted after migration Phase 3.

```json
{
  "onboarding.welcome.title1": "Chào mừng đến với Smart Meal Planner",
  "onboarding.welcome.desc1": "Lên kế hoạch bữa ăn thông minh...",
  "onboarding.welcome.title2": "Dinh dưỡng chính xác",
  "onboarding.welcome.desc2": "Theo dõi calo, protein...",
  "onboarding.welcome.title3": "Tập luyện & Sức khỏe",
  "onboarding.welcome.desc3": "Kế hoạch tập luyện cá nhân...",
  "onboarding.welcome.skip": "Bỏ qua",
  "onboarding.welcome.getStarted": "Bắt đầu",

  "onboarding.nav.next": "Tiếp tục",
  "onboarding.nav.back": "Quay lại",

  "onboarding.progress.section1": "Chào mừng",
  "onboarding.progress.section2": "Hồ sơ sức khỏe",
  "onboarding.progress.section3": "Mục tiêu tập",
  "onboarding.progress.section4": "Tùy chỉnh tập",
  "onboarding.progress.section5": "Chiến lược",
  "onboarding.progress.section6": "Lên kế hoạch",
  "onboarding.progress.section7": "Xem trước",

  "onboarding.health.basicTitle": "Giới thiệu bản thân",
  "onboarding.health.basicDesc": "Thông tin cơ bản để tính toán dinh dưỡng phù hợp",
  "onboarding.health.name": "Tên của bạn",
  "onboarding.health.namePlaceholder": "Nhập tên hoặc biệt danh",
  "onboarding.health.gender": "Giới tính",
  "onboarding.health.male": "Nam",
  "onboarding.health.female": "Nữ",
  "onboarding.health.dob": "Ngày sinh",
  "onboarding.health.height": "Chiều cao (cm)",
  "onboarding.health.weight": "Cân nặng (kg)",
  "onboarding.health.activityTitle": "Mức vận động hàng ngày",
  "onboarding.health.activityDesc": "Không tính tập gym — chỉ hoạt động thường ngày",
  "onboarding.health.sedentary": "Ít vận động",
  "onboarding.health.sedentaryDesc": "Ngồi nhiều, làm việc văn phòng",
  "onboarding.health.light": "Vận động nhẹ",
  "onboarding.health.lightDesc": "Đi bộ, việc nhà cơ bản",
  "onboarding.health.moderate": "Vận động vừa",
  "onboarding.health.moderateDesc": "Đi lại nhiều, công việc chân tay",
  "onboarding.health.active": "Vận động nhiều",
  "onboarding.health.activeDesc": "Lao động chân tay, thể thao",
  "onboarding.health.extraActive": "Cường độ cao",
  "onboarding.health.extraActiveDesc": "VĐV / lao động nặng liên tục",

  "onboarding.goal.title": "Mục tiêu của bạn?",
  "onboarding.goal.desc": "Chọn hướng đi phù hợp với bạn",
  "onboarding.goal.cut": "Giảm cân",
  "onboarding.goal.cutDesc": "Giảm mỡ, giữ cơ",
  "onboarding.goal.maintain": "Duy trì",
  "onboarding.goal.maintainDesc": "Giữ nguyên cân nặng",
  "onboarding.goal.bulk": "Tăng cơ",
  "onboarding.goal.bulkDesc": "Tăng cân, xây cơ",
  "onboarding.goal.rate": "Tốc độ thay đổi",
  "onboarding.goal.conservative": "Nhẹ",
  "onboarding.goal.conservativeDesc": "~0.25 kg/tuần",
  "onboarding.goal.moderate": "Vừa",
  "onboarding.goal.moderateDesc": "~0.5 kg/tuần",
  "onboarding.goal.aggressive": "Mạnh",
  "onboarding.goal.aggressiveDesc": "~1 kg/tuần",
  "onboarding.goal.targetWeight": "Cân nặng mục tiêu (kg)",
  "onboarding.goal.delta": "Hiện tại: {{current}} kg → Mục tiêu: {{target}} kg ({{direction}} {{diff}} kg)",
  "onboarding.goal.deltaReduce": "giảm",
  "onboarding.goal.deltaIncrease": "tăng",

  "onboarding.confirm.title": "{{name}}, đây là hồ sơ của bạn",
  "onboarding.confirm.desc": "Kiểm tra lại trước khi tiếp tục",
  "onboarding.confirm.energy": "Ước tính năng lượng hàng ngày",
  "onboarding.confirm.bmr": "BMR",
  "onboarding.confirm.tdee": "TDEE",
  "onboarding.confirm.targetCal": "Calo mục tiêu",
  "onboarding.confirm.macros": "Chia macro",
  "onboarding.confirm.protein": "Protein",
  "onboarding.confirm.fat": "Chất béo",
  "onboarding.confirm.carbs": "Carbs",
  "onboarding.confirm.advanced": "Tùy chỉnh nâng cao",
  "onboarding.confirm.advancedDesc": "Body Fat %, BMR thủ công, Tỷ lệ protein/kg",
  "onboarding.confirm.continueTraining": "Tiếp tục thiết lập tập luyện →",

  "onboarding.strategy.title": "{{name}}, sẵn sàng chưa?",
  "onboarding.strategy.desc": "Chọn cách bạn muốn bắt đầu hành trình tập luyện",
  "onboarding.strategy.autoTitle": "Để app lên kế hoạch",
  "onboarding.strategy.autoDesc": "Tự động tối ưu dựa trên hồ sơ của bạn. Bạn vẫn có thể chỉnh sửa mọi thứ sau.",
  "onboarding.strategy.recommended": "Đề xuất",
  "onboarding.strategy.autoBenefit1": "Phân chia lịch tập & ngày nghỉ hợp lý",
  "onboarding.strategy.autoBenefit2": "Chọn bài tập phù hợp thiết bị & mục tiêu",
  "onboarding.strategy.autoBenefit3": "Tự do chỉnh sửa bất cứ lúc nào",
  "onboarding.strategy.manualTitle": "Tự lên kế hoạch",
  "onboarding.strategy.manualDesc": "Tự chọn bài tập, ngày tập, ngày nghỉ theo ý bạn.",
  "onboarding.strategy.footer": "Bạn luôn có thể thay đổi sau trong Cài đặt",

  "onboarding.computing.title": "Đang lên kế hoạch cho {{name}}…",
  "onboarding.computing.desc": "Dựa trên hồ sơ và mục tiêu của bạn",
  "onboarding.computing.step1": "Phân tích mục tiêu tập luyện",
  "onboarding.computing.step1Sub": "{{goal}} + {{split}} {{days}}x/tuần",
  "onboarding.computing.step2": "Lựa chọn bài tập phù hợp",
  "onboarding.computing.step2Sub": "{{count}} bài tập phù hợp thiết bị của bạn",
  "onboarding.computing.step3": "Tối ưu lịch tập & ngày nghỉ",
  "onboarding.computing.step3Sub": "Đang tính toán…",
  "onboarding.computing.step4": "Hoàn thiện kế hoạch cá nhân",
  "onboarding.computing.step4Sub": "{{weeks}} tuần, {{periodization}}",
  "onboarding.computing.processing": "Đang xử lý…",
  "onboarding.computing.error": "Có lỗi xảy ra khi tạo kế hoạch",
  "onboarding.computing.retry": "Thử lại",
  "onboarding.computing.switchManual": "Tự lên kế hoạch",

  "onboarding.validation.required": "Trường này là bắt buộc",
  "onboarding.validation.nameLength": "Tên phải từ 1-50 ký tự",
  "onboarding.validation.dobRange": "Tuổi phải từ 10-100",
  "onboarding.validation.heightRange": "Chiều cao phải từ 100-250 cm",
  "onboarding.validation.weightRange": "Cân nặng phải từ 30-300 kg",
  "onboarding.validation.targetWeightRange": "Cân nặng mục tiêu phải từ 30-300 kg",
  "onboarding.validation.bmiWarning": "Kết hợp chiều cao và cân nặng có vẻ không hợp lý. Vui lòng kiểm tra lại.",
  "onboarding.validation.cutTargetTooHigh": "Mục tiêu giảm cân phải nhỏ hơn cân nặng hiện tại",
  "onboarding.validation.bulkTargetTooLow": "Mục tiêu tăng cơ phải lớn hơn cân nặng hiện tại",
  "onboarding.validation.ageMinimum": "Ứng dụng được thiết kế cho người từ 10 tuổi trở lên",
  "onboarding.validation.heightHint": "Bạn nhập theo mét? Hãy nhập theo cm (ví dụ: 170)",

  "onboarding.preview.ready": "Kế hoạch đã sẵn sàng!",
  "onboarding.preview.title": "{{name}}, đây là kế hoạch của bạn",
  "onboarding.preview.metadata": "{{split}} • {{weeks}} tuần • {{days}}x/tuần",
  "onboarding.preview.workoutDays": "{{count}} ngày tập",
  "onboarding.preview.restDays": "{{count}} ngày nghỉ",
  "onboarding.preview.totalExercises": "{{count}} bài tập",
  "onboarding.preview.sessionDuration": "~{{duration}} phút/buổi",
  "onboarding.preview.start": "Bắt đầu tập luyện →",
  "onboarding.preview.customize": "Tùy chỉnh kế hoạch trước",
  "onboarding.preview.exercises": "{{count}} bài tập",
  "fitness.plan.customizeHint": "Chạm vào ✎ để chỉnh sửa bài tập",

  "onboarding.error.title": "Đã xảy ra lỗi",
  "onboarding.error.restart": "Bắt đầu lại",
  "onboarding.confirm.detailToggle": "Xem chi tiết",
  "onboarding.confirm.hideDetail": "Ẩn chi tiết"
}
```

> **Note**: Plan editing i18n keys (`fitness.plan.regenerate`, `fitness.plan.deleteSession*`, `fitness.plan.undo`, `fitness.plan.convertToRest*`, `fitness.plan.aria.*`) are defined in the [plan editing improvements spec](./2026-03-30-plan-editing-improvements.md#4-new-i18n-keys).

---

## 8. Accessibility & Performance

### Accessibility (WCAG 2.1 AA)
- All inputs: visible `<label>` with `htmlFor` (no placeholder-only)
- Number inputs: `inputmode="numeric"` for mobile keyboard
- Icon-only buttons: `aria-label` (close, back, next)
- Decorative icons: `aria-hidden="true"`
- Focus management: auto-focus first input on step change
- `prefers-reduced-motion`: Section 6 skips animation entirely
- Step transitions: `aria-live="polite"` for screen reader announcement
- Color contrast: all text ≥ 4.5:1 (verified in both light/dark themes)
- **Single-select cards** (activity level, goal type): `role="radiogroup"` + `role="radio"` + arrow-key navigation
- **Multi-select cards** (equipment, injuries): `role="group"` + individual `role="checkbox"`
- **Pill buttons** (rate, days): `role="radiogroup"` + `role="radio"`
- **Validation errors**: `aria-describedby` linking input to error `<span>`, `aria-invalid="true"` on failed inputs
- **Error announcements**: Validation error container has `aria-live="assertive"`

### Performance (React + Vite)
- **Lazy-load Sections 4–7**: `React.lazy()` for `TrainingDetailSteps`, `PlanComputingScreen`, `PlanPreviewScreen` (not needed until after health profile)
- **Lazy-load `UnifiedOnboarding` itself**: Since returning users (`isAppOnboarded=true`) never see it, lazy-loading removes it from the initial bundle
- **Manual chunk**: Add `'onboarding-advanced'` chunk in `vite.config.ts` for Section 4–7 + exercise database
- Each step component < 200 lines (small, focused)
- No layout reads in render cycle
- **Single `useForm()` instance**: React Hook Form (uncontrolled inputs). No `useReducer`.
- Date picker: native `<input type="date">` for best mobile experience
- **Animations via `motion` library** (already installed as v12): `AnimatePresence` for step transitions, `motion.div` for computing steps. `motion` handles `prefers-reduced-motion` automatically via `useReducedMotion()`.
- `touch-action: manipulation` on all interactive elements
- **SQLite writes at commit points**: Non-blocking (fire-and-forget with `.catch()`) — don't block UI thread
- **`generatePlan()` stays synchronous on main thread** (~10ms, hidden behind animation — Web Worker overhead exceeds runtime)

### Error Boundary
- Wrap `UnifiedOnboarding` in an `ErrorBoundary` component
- If any step crashes: show "Đã xảy ra lỗi" + "Bắt đầu lại" button
- "Bắt đầu lại" resets `onboardingSection` to `null` and re-renders wizard from Section 1
- Critical: a crash during onboarding without recovery means user can never enter the app

### Mobile (Capacitor Android)
- Safe area insets respected for fixed headers/buttons
- No horizontal scroll
- Touch targets ≥ 44pt (48dp Android)
- 8dp spacing between touch targets
- Viewport: every step fits ≤ 667px height (no scroll needed)

---

## 9. Migration Strategy

### Phase 1: Create UnifiedOnboarding
- Build all new components in `src/components/onboarding/`
- Add new store fields (name, dob, planStrategy)
- Add all i18n keys

### Phase 2: Wire into App
- Replace `<AppOnboarding>` with `<UnifiedOnboarding>` in App.tsx
- Remove FitnessTab onboarding gate (`!isOnboarded` check)
- Remove FitnessTab auto-generate useEffect
- Both `appOnboarded` and `fitnessOnboarded` set at end of unified flow

### Phase 3: Cleanup
- Delete `AppOnboarding.tsx` (or keep as reference)
- Delete `FitnessOnboarding.tsx` (or keep as reference)
- Remove dead code from FitnessTab
- Update all tests

### Backward Compatibility
- Users who already completed both onboardings: no change (both flags true)
- Users who completed only app onboarding: will see fitness onboarding portion of unified flow
- Fresh installs: see full unified flow

---

## 10. Test Strategy

- **Unit tests** per step component: render, validate, call onNext. Use RTL `render()` + RHF `useForm` wrapper. ~10-15 tests per component ≈ ~150 new tests
- **Integration tests** (2 paths): Auto flow (Sections 1→7), Manual flow (Sections 1→5→complete). Use `userEvent` to click through
- **Store tests**: new fields (name, dob, planStrategy, onboardingSection), Zustand persist migration
- **Accessibility tests**: labels, aria, focus order, keyboard nav per step
- **Computing animation tests**: Use `vi.useFakeTimers()` + `vi.advanceTimersByTime(2500)` — test state transitions, not exact timing
- **Cross-validation tests**: BMI sanity, goal direction, age edge case
- **Error boundary test**: simulate step crash → verify recovery UI
- **Emulator verification**: both auto and manual paths on emulator-5556
- **Edge cases**: back navigation, browser refresh mid-flow, reduced-motion, experience level change

---

## 11. Web Interface Guidelines Compliance Checklist

Anti-patterns found in existing onboarding code (from Vercel Web Guidelines audit). The new implementation MUST NOT repeat these:

| # | Anti-Pattern | Found In | Requirement for New Code |
|---|-------------|----------|--------------------------|
| 1 | Missing `focus-visible:ring-*` on buttons | 25+ buttons across all files | All `<button>` elements must have `focus-visible:ring-2 focus-visible:ring-emerald-500` |
| 2 | `transition-all` | 5 instances | Target specific properties: `transition-transform`, `transition-colors`, etc. |
| 3 | Hardcoded strings in `aria-label` | 8 instances (EN/VN) | All `aria-label` values via `t()` i18n function |
| 4 | Decorative icons missing `aria-hidden="true"` | 7 icons | Every `<LucideIcon>` inside a labeled button gets `aria-hidden="true"` |
| 5 | Touch targets < 44pt | 6 button groups | All interactive: `min-h-[44px] min-w-[44px]` |
| 6 | No `prefers-reduced-motion` | Global | `motion` library handles automatically; verify with `useReducedMotion()` |
| 7 | Form inputs missing `name`/`autocomplete`/`inputMode` | 4 inputs | Every input: `name`, `autoComplete`, `inputMode` attributes |
| 8 | Dialog without `role="dialog"`/focus-trap/ESC | 1 dialog | Use shadcn `Dialog` component (built-in a11y) |
| 9 | `<div role="tab">` instead of `<button>` | 1 instance | Semantic HTML: `<button>` for actions, `<a>` for navigation |
| 10 | `document.querySelector` in React | 1 instance | Use `ref` + `scrollIntoView` instead |
