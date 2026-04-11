# W5-02 — ExerciseSelector Enhancement Test Plan

> **Component**: `src/features/fitness/components/ExerciseSelector.tsx`
> **Test File**: `src/__tests__/ExerciseSelector.test.tsx`
> **Author**: QA Engineer (TDD-First)
> **Date**: 2025-07-18
> **Status**: READY FOR DEV
> **Existing LOC**: 285 → Target: ≤500 (enhanced)
> **Existing Tests**: 15 passing (in `ExerciseSelector.test.tsx`)

---

## 1. Component Analysis & Enhancement Summary

### 1.1 Current State (v1 — 285 LOC)

| Feature               | State         | Notes                                                   |
| --------------------- | ------------- | ------------------------------------------------------- |
| Search (Vi + En)      | ✅ Done       | `.toLowerCase().includes(query)`                        |
| Muscle group chips    | ✅ Done       | 7 groups + "Tất cả", single-select                      |
| Equipment filter      | ⚠️ Prop       | External `equipmentFilter?: EquipmentType[]` prop       |
| Category filter       | ❌ None       | No UI; CATEGORY_I18N_KEYS defined but unused as filter  |
| Recently used section | ❌ None       | No store integration                                    |
| Empty state           | ✅ Done       | Search vs filter messages, no CTA button                |
| Touch targets         | ⚠️ `min-h-11` | Chips use `min-h-11`, items use `py-3` (not `min-h-12`) |
| Active press feedback | ❌ None       | No `active:scale-[0.98]`                                |

### 1.2 Enhancement Requirements (v2)

| #   | Feature                | Source Data                                   | New Behavior                                                    |
| --- | ---------------------- | --------------------------------------------- | --------------------------------------------------------------- |
| E1  | "Gần đây" section      | `useFitnessStore(s => s.workoutSets)`         | Top section, last 5 unique `exerciseId`s, reverse chronological |
| E2  | Category filter tabs   | `exercise.exerciseType` + `exercise.category` | 3 tabs: compound, isolation, cardio                             |
| E3  | Equipment filter chips | `EquipmentType[]` (7 types)                   | Interactive multi-select chips (replaces/coexists with prop)    |
| E4  | Empty state CTA        | -                                             | "Tạo bài tập mới" button → opens CustomExerciseModal            |
| E5  | Touch targets          | CSS                                           | `min-h-12` on all chips + items + `active:scale-[0.98]`         |
| E6  | Search enhancement     | `exercise.nameVi`                             | Case-insensitive + accent-insensitive Vietnamese matching       |

### 1.3 Data Model Reference

```typescript
// Exercise (from types.ts)
interface Exercise {
  id: string;
  nameVi: string;              // Vietnamese name — primary search target
  nameEn?: string;             // English name — secondary search target
  muscleGroup: MuscleGroup;    // 'chest'|'back'|'shoulders'|'legs'|'arms'|'core'|'glutes'
  category: ExerciseCategory;  // 'compound'|'secondary'|'isolation'
  exerciseType: ExerciseType;  // 'strength'|'cardio'
  equipment: EquipmentType[];  // 'barbell'|'dumbbell'|'machine'|'cable'|'bodyweight'|'bands'|'kettlebell'
  ...
}

// WorkoutSet (from types.ts) — used for "recently used"
interface WorkoutSet {
  id: string;
  workoutId: string;
  exerciseId: string | null;   // links to Exercise.id
  ...
  updatedAt: string;           // ISO date — used for recency ordering
}
```

### 1.4 Exercise Database Stats (133 total)

| Dimension                           | Breakdown                                                                        |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| By exerciseType                     | strength: 122, cardio: 10                                                        |
| By category (strength only)         | compound: 56, secondary: 4, isolation: 62                                        |
| By category (cardio — all compound) | compound: 10                                                                     |
| By muscleGroup                      | chest:16, back:18, shoulders:15, legs:26, arms:20, core:15, glutes:12, cardio:10 |

### 1.5 Critical Design Decision — Category Tab Mapping

The task specifies 3 category tabs: **compound**, **isolation**, **cardio**.

Current data model has `ExerciseCategory = 'compound' | 'secondary' | 'isolation'` AND `ExerciseType = 'strength' | 'cardio'`.

**Specified filter logic (MANDATORY):**

- **"Tất cả" tab** (default): No category filter — show all exercises
- **"Đa khớp" (Compound) tab**: `exerciseType === 'strength' && (category === 'compound' || category === 'secondary')`
  - Rationale: "secondary" exercises (4 total, e.g., lat pulldown) are compound-adjacent and MUST NOT be orphaned
- **"Cô lập" (Isolation) tab**: `exerciseType === 'strength' && category === 'isolation'`
- **"Cardio" tab**: `exerciseType === 'cardio'`
  - When active: muscle group chips should be **hidden or disabled** (cardio exercises have `muscleGroup: 'cardio'` which is outside the 7 standard groups)
  - When active: equipment chips should be **hidden or disabled** (cardio equipment like 'treadmill', 'stationary-bike' is outside the standard 7 EquipmentType values)

> ⚠️ "secondary" category exercises (4 total) are folded into the "Compound" tab. This is a SPEC DECISION, not a bug.

### 1.6 i18n Keys (existing + needed)

**Existing** (in `vi.json` → `fitness.exerciseSelector.*`):

- `title`: "Chọn bài tập"
- `search`: "Tìm bài tập..."
- `all`: "Tất cả"
- `compound`: "Đa khớp"
- `isolation`: "Cô lập"
- `cardioCategory`: "Cardio"
- `addCustom`: "Bài tập tùy chỉnh"
- `muscle{Chest|Back|Shoulders|Legs|Arms|Core|Glutes}`: Vietnamese labels

**New keys needed** (Dev must add to `vi.json`):

- `recentlyUsed`: "Gần đây"
- `createNewExercise`: "Tạo bài tập mới" (empty state CTA — distinct from `addCustom` which is "Bài tập tùy chỉnh")
- Equipment chip labels: Reuse `EQUIPMENT_DISPLAY` constant (`constants.ts` line 34-44)

---

## 2. Test Scenarios

| ID         | Scenario                                               | Category      | Priority |
| ---------- | ------------------------------------------------------ | ------------- | -------- |
| SC_W502_01 | Base rendering — open/closed states                    | Rendering     | P0       |
| SC_W502_02 | "Gần đây" section with workout history                 | Recently Used | P0       |
| SC_W502_03 | "Gần đây" section with 0 history                       | Recently Used | P0       |
| SC_W502_04 | "Gần đây" section deduplication & limit 5              | Recently Used | P0       |
| SC_W502_05 | Category filter tabs — compound                        | Filtering     | P0       |
| SC_W502_06 | Category filter tabs — isolation                       | Filtering     | P0       |
| SC_W502_07 | Category filter tabs — cardio                          | Filtering     | P0       |
| SC_W502_08 | Muscle group filter chips (existing, verify preserved) | Filtering     | P0       |
| SC_W502_09 | Equipment filter chips — interactive multi-select      | Filtering     | P0       |
| SC_W502_10 | Search — Vietnamese text with accented characters      | Search        | P0       |
| SC_W502_11 | Search — case insensitive matching                     | Search        | P0       |
| SC_W502_12 | Search — English name fallback                         | Search        | P1       |
| SC_W502_13 | Combined filters — muscle + equipment + category       | Filtering     | P0       |
| SC_W502_14 | Combined filters — search + muscle group               | Filtering     | P0       |
| SC_W502_15 | Empty state — search no results with CTA               | Empty State   | P0       |
| SC_W502_16 | Empty state — filter no results with CTA               | Empty State   | P0       |
| SC_W502_17 | Empty state CTA → opens CustomExerciseModal            | Empty State   | P0       |
| SC_W502_18 | Touch targets — `min-h-12` on all interactive elements | A11y / UX     | P0       |
| SC_W502_19 | Active press feedback — `active:scale-[0.98]`          | UX            | P1       |
| SC_W502_20 | Exercise item selection → onSelect + onClose           | Interaction   | P0       |
| SC_W502_21 | Custom exercise flow (preserved from v1)               | Interaction   | P0       |
| SC_W502_22 | Swipe dismiss behavior with search focus               | Interaction   | P1       |
| SC_W502_23 | "Gần đây" items are selectable                         | Recently Used | P0       |
| SC_W502_24 | Category tab reset behavior                            | Filtering     | P1       |
| SC_W502_25 | Equipment multi-select toggle on/off                   | Filtering     | P1       |
| SC_W502_26 | Accessibility — aria labels, roles                     | A11y          | P1       |
| SC_W502_27 | Cardio tab hides muscle + equipment chips              | Filtering     | P0       |
| SC_W502_28 | Search + equipment combined filtering                  | Filtering     | P1       |
| SC_W502_29 | equipmentFilter prop + interactive chips compat        | Filtering     | P0       |
| SC_W502_30 | Recently used items display format                     | Recently Used | P1       |
| SC_W502_31 | Empty state CTA reuses same modal                      | Empty State   | P1       |

---

## 3. Detailed Test Cases

### SC_W502_01 — Base Rendering

#### TC_W502_01: Returns null when `isOpen` is false

- **Type**: Unit (Vitest + RTL)
- **Pre-condition**: Component rendered with `isOpen={false}`
- **Steps**:
  1. Render `<ExerciseSelector isOpen={false} onClose={fn} onSelect={fn} />`
- **Expected**:
  - `container.innerHTML` === `''`
  - No DOM nodes rendered

#### TC_W502_02: Renders all structural regions when open

- **Type**: Unit (Vitest + RTL)
- **Pre-condition**: Component rendered with `isOpen={true}`, fitnessStore with empty workoutSets
- **Steps**:
  1. Render `<ExerciseSelector isOpen={true} onClose={fn} onSelect={fn} />`
  2. Query data-testid regions
- **Expected**:
  - `exercise-selector-sheet` exists
  - `exercise-selector-title` displays "Chọn bài tập"
  - `exercise-selector-search-region` exists (search input)
  - `exercise-selector-chip-region` exists (filter chips area)
  - `exercise-selector-list-region` exists (exercise list)
  - Category tabs region exists (new — `exercise-category-tabs` or similar)
  - Equipment chips row exists (new — `equipment-chips` or similar)

---

### SC_W502_02 — "Gần đây" Section With History

#### TC_W502_03: Displays "Gần đây" section header when workout history exists

- **Type**: Unit (Vitest + RTL)
- **Pre-condition**: `useFitnessStore` state has ≥1 workoutSet with valid exerciseId matching a known exercise
- **Mock Data**:
  ```typescript
  workoutSets: [
    {
      id: 's1',
      workoutId: 'w1',
      exerciseId: 'barbell-bench-press',
      setNumber: 1,
      weightKg: 60,
      updatedAt: '2025-07-18T10:00:00Z',
    },
  ];
  ```
- **Steps**:
  1. Mock `useFitnessStore` with workoutSets above
  2. Render `<ExerciseSelector isOpen onClose={fn} onSelect={fn} />`
  3. Look for "Gần đây" section header
- **Expected**:
  - Text "Gần đây" visible in list region
  - Exercise "Đẩy tạ đòn nằm ngang" appears in recently used section
  - Recently used section appears ABOVE the main exercise list

#### TC_W502_04: Recently used shows exercises in reverse-chronological order

- **Type**: Unit (Vitest + RTL)
- **Pre-condition**: workoutSets with 3 different exercises at different timestamps
- **Mock Data**:
  ```typescript
  workoutSets: [
    { id: 's1', exerciseId: 'barbell-bench-press', updatedAt: '2025-07-16T10:00:00Z', ... },
    { id: 's2', exerciseId: 'barbell-row', updatedAt: '2025-07-17T10:00:00Z', ... },
    { id: 's3', exerciseId: 'lat-pulldown', updatedAt: '2025-07-18T10:00:00Z', ... },
  ]
  ```
- **Steps**:
  1. Render with mocked store
  2. Find all recently used items
- **Expected**:
  - Items ordered: "Kéo xô máy" (latest) → "Chèo tạ đòn" → "Đẩy tạ đòn nằm ngang" (oldest)
  - First item in recently used section is the most recently used exercise

---

### SC_W502_03 — "Gần đây" Section With 0 History

#### TC_W502_05: Hides "Gần đây" section when workoutSets is empty

- **Type**: Unit (Vitest + RTL)
- **Pre-condition**: `useFitnessStore` state has `workoutSets: []`
- **Steps**:
  1. Mock `useFitnessStore` with empty workoutSets
  2. Render `<ExerciseSelector isOpen onClose={fn} onSelect={fn} />`
  3. Search for "Gần đây" text
- **Expected**:
  - "Gần đây" text NOT in document
  - Main exercise list still renders normally (all 6 mock exercises)

#### TC_W502_06: Hides "Gần đây" section when all exerciseIds are null

- **Type**: Unit (Vitest + RTL)
- **Pre-condition**: workoutSets exist but all have `exerciseId: null`
- **Mock Data**:
  ```typescript
  workoutSets: [
    { id: 's1', exerciseId: null, setNumber: 1, weightKg: 0, ... },
  ]
  ```
- **Steps**:
  1. Render with mocked store
- **Expected**:
  - "Gần đây" text NOT in document

---

### SC_W502_04 — "Gần đây" Deduplication & Limit 5

#### TC_W502_07: Deduplicates exercises — shows each exercise only once

- **Type**: Unit (Vitest + RTL)
- **Pre-condition**: Multiple workoutSets for same exerciseId
- **Mock Data**:
  ```typescript
  workoutSets: [
    { id: 's1', exerciseId: 'barbell-bench-press', setNumber: 1, updatedAt: '2025-07-18T08:00:00Z', ... },
    { id: 's2', exerciseId: 'barbell-bench-press', setNumber: 2, updatedAt: '2025-07-18T08:01:00Z', ... },
    { id: 's3', exerciseId: 'barbell-bench-press', setNumber: 3, updatedAt: '2025-07-18T08:02:00Z', ... },
  ]
  ```
- **Steps**:
  1. Render with mocked store
  2. Count "Đẩy tạ đòn nằm ngang" occurrences in recently used section
- **Expected**:
  - Exactly 1 instance of "Đẩy tạ đòn nằm ngang" in recently used section
  - Total recently used items = 1

#### TC_W502_08: Caps recently used at 5 unique exercises

- **Type**: Unit (Vitest + RTL)
- **Pre-condition**: workoutSets referencing 7 different exerciseIds
- **Mock Data**: (Need 7+ exercises in mock DB. Extend the existing 6-exercise mock with at least 1 more.)
  ```typescript
  // Add to EXERCISES mock:
  { id: 'overhead-press', nameVi: 'Đẩy vai', ... }
  // workoutSets for 7 unique exercises:
  workoutSets: [
    { exerciseId: 'barbell-bench-press', updatedAt: '2025-07-11T10:00:00Z', ... },
    { exerciseId: 'dumbbell-fly', updatedAt: '2025-07-12T10:00:00Z', ... },
    { exerciseId: 'barbell-row', updatedAt: '2025-07-13T10:00:00Z', ... },
    { exerciseId: 'lat-pulldown', updatedAt: '2025-07-14T10:00:00Z', ... },
    { exerciseId: 'bodyweight-squat', updatedAt: '2025-07-15T10:00:00Z', ... },
    { exerciseId: 'plank-hold', updatedAt: '2025-07-16T10:00:00Z', ... },
    { exerciseId: 'overhead-press', updatedAt: '2025-07-17T10:00:00Z', ... },
  ]
  ```
- **Steps**:
  1. Render with mocked store
  2. Count items in recently used section
- **Expected**:
  - Exactly 5 items in recently used section
  - The 5 most recent exerciseIds appear (overhead-press, plank-hold, bodyweight-squat, lat-pulldown, barbell-row)
  - The 2 oldest (barbell-bench-press, dumbbell-fly) do NOT appear in recently used

#### TC_W502_09: Ignores workoutSets with exerciseId not in exercise database

- **Type**: Unit (Vitest + RTL)
- **Pre-condition**: workoutSet references exerciseId not in EXERCISES mock
- **Mock Data**:
  ```typescript
  workoutSets: [
    { id: 's1', exerciseId: 'non-existent-exercise', updatedAt: '2025-07-18T10:00:00Z', ... },
    { id: 's2', exerciseId: 'barbell-bench-press', updatedAt: '2025-07-17T10:00:00Z', ... },
  ]
  ```
- **Steps**:
  1. Render with mocked store
- **Expected**:
  - Recently used shows only 1 item: "Đẩy tạ đòn nằm ngang"
  - No crash/error from unknown exerciseId

---

### SC_W502_05 — Category Filter Tabs: Compound

#### TC_W502_10: Category tabs render with 3 options

- **Type**: Unit (Vitest + RTL)
- **Pre-condition**: Component rendered open
- **Steps**:
  1. Render `<ExerciseSelector isOpen onClose={fn} onSelect={fn} />`
  2. Find category tab region
- **Expected**:
  - 3 tabs visible: "Đa khớp" (compound), "Cô lập" (isolation), "Cardio"
  - Plus an "Tất cả" (all) tab/option to clear category filter
  - Default state: "Tất cả" selected (no category filter active)

#### TC_W502_11: Compound tab filters to compound + secondary exercises

- **Type**: Unit (Vitest + RTL)
- **Pre-condition**: Mock exercises include compound, secondary, isolation, and cardio types
- **Mock Data** (extend existing mock with 1 cardio exercise):
  ```typescript
  // Existing mock has: compound (bench-press, barbell-row, squat), isolation (dumbbell-fly, plank), secondary (lat-pulldown)
  // Add: { id: 'running', nameVi: 'Chạy bộ', exerciseType: 'cardio', category: 'compound', muscleGroup: 'cardio', ... }
  ```
- **Steps**:
  1. Render component
  2. Click "Đa khớp" category tab
- **Expected**:
  - Visible: "Đẩy tạ đòn nằm ngang" (compound+strength), "Chèo tạ đòn" (compound+strength), "Squat tự trọng" (compound+strength), "Kéo xô máy" (secondary+strength)
  - Hidden: "Bay tạ tay" (isolation), "Plank giữ" (isolation)
  - Hidden: "Chạy bộ" (cardio — even though category='compound', exerciseType is 'cardio')

---

### SC_W502_06 — Category Filter Tabs: Isolation

#### TC_W502_12: Isolation tab filters to isolation exercises only

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render component with extended mock data
  2. Click "Cô lập" category tab
- **Expected**:
  - Visible: "Bay tạ tay" (isolation, chest), "Plank giữ" (isolation, core)
  - Hidden: All compound, secondary, and cardio exercises

---

### SC_W502_07 — Category Filter Tabs: Cardio

#### TC_W502_13: Cardio tab filters to cardio exercises only

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render component with extended mock data (include cardio exercise)
  2. Click "Cardio" category tab
- **Expected**:
  - Visible: "Chạy bộ" (exerciseType=cardio)
  - Hidden: All strength exercises (compound, secondary, isolation)
  - Muscle group chips may show "Cardio" as only applicable group or be hidden

---

### SC_W502_08 — Muscle Group Filter Chips (Preserved)

#### TC_W502_14: Muscle group chips show all 7 groups + "Tất cả"

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render component
  2. Inspect `muscle-group-chips` testid
- **Expected**:
  - 8 buttons total: "Tất cả", "Ngực", "Lưng", "Vai", "Chân", "Tay", "Bụng", "Mông"
  - "Tất cả" selected by default (highlighted style)

#### TC_W502_15: Clicking muscle group chip filters exercise list

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render component
  2. Click "Lưng" chip
- **Expected**:
  - Visible: "Chèo tạ đòn" (back), "Kéo xô máy" (back)
  - Hidden: "Đẩy tạ đòn nằm ngang" (chest), "Squat tự trọng" (legs)
  - "Lưng" chip has active/highlighted style
  - "Tất cả" chip loses active style

#### TC_W502_16: Clicking "Tất cả" resets muscle group filter

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render component
  2. Click "Lưng" chip → only back exercises shown
  3. Click "Tất cả" chip
- **Expected**:
  - All 6 mock exercises visible again

---

### SC_W502_09 — Equipment Filter Chips

#### TC_W502_17: Equipment chips render all 7 types

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render component
  2. Find equipment chips region (new testid: `equipment-chips`)
- **Expected**:
  - 7 equipment chip buttons with Vietnamese labels from EQUIPMENT_DISPLAY:
    - "Tạ đòn" (barbell), "Tạ tay" (dumbbell), "Máy tập" (machine), "Dây cáp" (cable), "Tự trọng" (bodyweight), "Dây kháng lực" (bands), "Tạ ấm" (kettlebell)
  - All chips in unselected (inactive) state by default

#### TC_W502_18: Clicking equipment chip filters exercises

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render component
  2. Click "Dây cáp" (cable) equipment chip
- **Expected**:
  - Visible: "Kéo xô máy" (equipment: ['cable'])
  - Hidden: "Đẩy tạ đòn nằm ngang" (barbell), "Bay tạ tay" (dumbbell), etc.
  - "Dây cáp" chip has active/selected style

#### TC_W502_19: Equipment chips support multi-select (toggle on/off)

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render component
  2. Click "Tạ đòn" (barbell) chip → active
  3. Click "Dây cáp" (cable) chip → also active (multi-select)
- **Expected**:
  - Both "Tạ đòn" and "Dây cáp" chips have active style
  - Visible: exercises with equipment containing 'barbell' OR 'cable'
  - "Đẩy tạ đòn nằm ngang" (barbell) visible
  - "Chèo tạ đòn" (barbell) visible
  - "Kéo xô máy" (cable) visible
  - "Bay tạ tay" (dumbbell) hidden
  - "Squat tự trọng" (bodyweight) hidden

#### TC_W502_20: Clicking active equipment chip deselects it

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render component
  2. Click "Tạ đòn" → active
  3. Click "Tạ đòn" again → deselected
- **Expected**:
  - All equipment chips inactive
  - All exercises visible (no equipment filter)

---

### SC_W502_10 — Search: Vietnamese Accented Characters

#### TC_W502_21: Search matches Vietnamese text with diacritics

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render component
  2. Type "Đẩy tạ" into search input
- **Expected**:
  - Visible: "Đẩy tạ đòn nằm ngang" (contains "Đẩy tạ")
  - Hidden: all other exercises

#### TC_W502_22: Search is case-insensitive for Vietnamese

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render component
  2. Type "đẩy tạ" (lowercase) into search input
- **Expected**:
  - Visible: "Đẩy tạ đòn nằm ngang" (nameVi starts with "Đẩy tạ", lowercased both match)

#### TC_W502_23: Partial match works mid-word

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Type "tạ đòn" into search input
- **Expected**:
  - Visible: "Đẩy tạ đòn nằm ngang", "Chèo tạ đòn" (both contain "tạ đòn")
  - Hidden: "Bay tạ tay", "Kéo xô máy", "Squat tự trọng", "Plank giữ"

---

### SC_W502_11 — Search: Case Insensitive

#### TC_W502_24: English search is case-insensitive

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Type "barbell bench" (lowercase) into search input
- **Expected**:
  - Visible: "Đẩy tạ đòn nằm ngang" (nameEn: "Barbell Bench Press")

---

### SC_W502_12 — Search: English Name Fallback

#### TC_W502_25: Search falls back to English name when no Vi match

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Type "Pulldown" into search input
- **Expected**:
  - Visible: "Kéo xô máy" (nameEn: "Lat Pulldown")
  - Hidden: all others

#### TC_W502_26: Exercise with empty nameEn doesn't crash on English search

- **Type**: Unit (Vitest + RTL)
- **Pre-condition**: "Plank giữ" has `nameEn: ''` in mock
- **Steps**:
  1. Type "plank" into search input
- **Expected**:
  - Visible: "Plank giữ" (matches via nameVi "Plank giữ" → "plank" matches lowercased)
  - No error/crash

---

### SC_W502_13 — Combined Filters: Muscle + Equipment + Category

#### TC_W502_27: All 3 filter types combine with AND logic

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render component
  2. Click "Đa khớp" (compound) category tab
  3. Click "Ngực" (chest) muscle group chip
  4. Click "Tạ đòn" (barbell) equipment chip
- **Expected**:
  - Only exercises matching ALL 3 criteria:
    - category = compound (or secondary) AND exerciseType = strength
    - muscleGroup = chest
    - equipment includes 'barbell'
  - Visible: "Đẩy tạ đòn nằm ngang" (compound, chest, barbell)
  - Hidden: "Bay tạ tay" (isolation), "Chèo tạ đòn" (back), "Kéo xô máy" (cable)

#### TC_W502_28: Clearing one filter widens results

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Apply TC_W502_27 state (compound + chest + barbell)
  2. Click "Tất cả" on muscle group (clear muscle filter)
- **Expected**:
  - Now filtered by compound + barbell only
  - Visible: "Đẩy tạ đòn nằm ngang" (chest, barbell, compound), "Chèo tạ đòn" (back, barbell, compound)
  - Hidden: "Kéo xô máy" (cable), "Bay tạ tay" (dumbbell), "Squat tự trọng" (bodyweight)

---

### SC_W502_14 — Combined Filters: Search + Muscle Group

#### TC_W502_29: Search applies on top of muscle group filter

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Click "Lưng" (back) muscle group chip
  2. Type "Chèo" into search input
- **Expected**:
  - Visible: "Chèo tạ đòn" (back, contains "Chèo")
  - Hidden: "Kéo xô máy" (back, doesn't match "Chèo")

---

### SC_W502_15 — Empty State: Search No Results With CTA

#### TC_W502_30: Shows empty state with search query context

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Type "xyzabc" into search input
- **Expected**:
  - `exercise-empty-state` testid visible
  - Text includes "xyzabc" (search query displayed to user)
  - Hint text visible ("Thử tìm với từ khóa khác hoặc thay đổi bộ lọc.")

#### TC_W502_31: Empty state shows "Tạo bài tập mới" CTA button

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Type "xyzabc" into search input (0 results)
  2. Look for CTA button in empty state
- **Expected**:
  - A button with text "Tạo bài tập mới" (or similar) visible inside empty state
  - Button is actionable (not disabled)

---

### SC_W502_16 — Empty State: Filter No Results With CTA

#### TC_W502_32: Shows empty state when filter combination yields 0 results

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Click "Mông" (glutes) muscle group chip (0 exercises in 6-item mock)
- **Expected**:
  - `exercise-empty-state` testid visible
  - Text: "Không tìm thấy bài tập phù hợp"
  - "Tạo bài tập mới" CTA visible

---

### SC_W502_17 — Empty State CTA Opens CustomExerciseModal

#### TC_W502_33: Clicking empty state CTA opens custom exercise modal

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Type "xyzabc" → empty state shows
  2. Click "Tạo bài tập mới" CTA button
- **Expected**:
  - `custom-exercise-modal` testid appears in DOM
  - User can fill name and save (existing flow preserved)

---

### SC_W502_18 — Touch Targets: `min-h-12`

#### TC_W502_34: All filter chips have `min-h-12` class

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render component
  2. Query all chip buttons (muscle group + equipment + category)
- **Expected**:
  - Every chip button element has class containing `min-h-12` (48px touch target)
  - Specifically: muscle group chips, equipment chips, category tab buttons

#### TC_W502_35: All exercise list items have `min-h-12` class

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render component
  2. Query all exercise item buttons (testid `exercise-item-*`)
- **Expected**:
  - Each exercise item button has class containing `min-h-12`

---

### SC_W502_19 — Active Press Feedback

#### TC_W502_36: Interactive elements have `active:scale-[0.98]` class

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render component
  2. Query chip buttons and exercise item buttons
- **Expected**:
  - All chip buttons have `active:scale-[0.98]` in their className
  - All exercise item buttons have `active:scale-[0.98]` in their className
  - "Tạo bài tập mới" CTA also has `active:scale-[0.98]`

---

### SC_W502_20 — Exercise Item Selection

#### TC_W502_37: Clicking exercise calls onSelect with full Exercise object + onClose

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render with `onSelect` and `onClose` mocks
  2. Click `exercise-item-barbell-bench-press`
- **Expected**:
  - `onSelect` called once with object: `{ id: 'barbell-bench-press', nameVi: 'Đẩy tạ đòn nằm ngang', muscleGroup: 'chest', category: 'compound', ... }`
  - `onClose` called once

---

### SC_W502_21 — Custom Exercise Flow (Preserved)

#### TC_W502_38: "Bài tập tùy chỉnh" button opens modal

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render component
  2. Click `add-custom-exercise` button
- **Expected**:
  - `custom-exercise-modal` appears
  - ExerciseSelector remains in background

#### TC_W502_39: Saving custom exercise calls onSelect with custom data

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Click add custom → modal opens
  2. Type name "Bài tập mới" in `custom-exercise-name`
  3. Click `save-custom-exercise`
- **Expected**:
  - `onSelect` called with `{ nameVi: 'Bài tập mới', isCustom: true, ... }`
  - `onClose` called

---

### SC_W502_22 — Swipe Dismiss With Search Focus

#### TC_W502_40: Swipe-to-dismiss disabled while search input focused

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render component
  2. Click/focus search input
- **Expected**:
  - `modal-backdrop` has `data-allow-swipe="false"`
- **Steps (continued)**: 3. Blur search input (tab away)
- **Expected**:
  - `modal-backdrop` has `data-allow-swipe="true"`

---

### SC_W502_23 — "Gần đây" Items Are Selectable

#### TC_W502_41: Clicking a recently used exercise calls onSelect

- **Type**: Unit (Vitest + RTL)
- **Pre-condition**: workoutSets with `exerciseId: 'barbell-row'`
- **Steps**:
  1. Render with mocked store + onSelect mock
  2. Find "Chèo tạ đòn" in recently used section
  3. Click it
- **Expected**:
  - `onSelect` called with exercise object `{ id: 'barbell-row', nameVi: 'Chèo tạ đòn', ... }`
  - `onClose` called

---

### SC_W502_24 — Category Tab Reset

#### TC_W502_42: Clicking active category tab deselects it (shows all)

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Click "Cô lập" tab → filtered
  2. Click "Tất cả" tab (or click "Cô lập" again to toggle off)
- **Expected**:
  - All exercises visible (no category filter)
  - "Tất cả" tab has active style

---

### SC_W502_25 — Equipment Multi-Select Toggle

#### TC_W502_43: Equipment chips independently toggleable

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Click "Tạ đòn" → ON
  2. Click "Tự trọng" → ON (both active)
  3. Click "Tạ đòn" → OFF (only "Tự trọng" active)
- **Expected**:
  - After step 3: only bodyweight exercises visible
  - "Tự trọng" chip active, "Tạ đòn" chip inactive

---

### SC_W502_26 — Accessibility

#### TC_W502_44: Search input has aria-label

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render component
  2. Query search input
- **Expected**:
  - `aria-label` attribute equals "Tìm bài tập..." (from i18n `fitness.exerciseSelector.search`)

#### TC_W502_45: ModalBackdrop receives ariaLabelledBy linked to title

- **Type**: Unit (Vitest + RTL)
- **Steps**:
  1. Render component
  2. Check backdrop `data-aria-labelledby` matches title `id`
- **Expected**:
  - `modal-backdrop` `data-aria-labelledby` === value of `exercise-selector-title`'s `id`

---

### 3.10 Scenario 10: Cross-Filter Interactions (Critique Gap Fixes)

> **Added after Critique Round 1** — These TCs address gaps in cross-filter interactions and cardio edge cases.

#### TC_W502_46: Cardio tab hides/disables muscle group chips

- **Scenario**: S10 — Cardio tab interaction with muscle group filter
- **Pre-condition**: MOCK_EXERCISES rendered, muscle group chips visible
- **Steps**:
  1. Click "Cardio" category tab
  2. Observe muscle group chip area
- **Expected**:
  - Muscle group chips are either **hidden** or **disabled** (`aria-disabled="true"`)
  - Rationale: Cardio exercises have `muscleGroup: 'cardio'` which doesn't map to any of the 7 standard muscle chips

#### TC_W502_47: Cardio tab hides/disables equipment chips

- **Scenario**: S10 — Cardio tab interaction with equipment filter
- **Pre-condition**: MOCK_EXERCISES rendered, equipment chips visible
- **Steps**:
  1. Click "Cardio" category tab
  2. Observe equipment chip area
- **Expected**:
  - Equipment chips are either **hidden** or **disabled**
  - Rationale: Cardio exercises use non-standard equipment (treadmill, pool, etc.) outside the 7 EquipmentType values

#### TC_W502_48: Switching from cardio tab back to "all" re-enables muscle + equipment chips

- **Scenario**: S10 — Filter state reset on tab change
- **Pre-condition**: "Cardio" tab is active, chips hidden/disabled
- **Steps**:
  1. Click "Tất cả" category tab
- **Expected**:
  - Muscle group chips are visible and enabled
  - Equipment chips are visible and enabled
  - No filter state persists from cardio mode

#### TC_W502_49: Search + equipment multi-select combined filtering

- **Scenario**: S10 — Search stacks on top of equipment filter
- **Pre-condition**: MOCK_EXERCISES rendered
- **Steps**:
  1. Click equipment chip "Tạ đòn" (barbell)
  2. Type "Đẩy" in search input
- **Expected**:
  - Results match BOTH: equipment includes 'barbell' AND (nameVi contains "Đẩy")
  - Should show: `barbell-bench-press` ("Đẩy tạ đòn nằm ngang"), `overhead-press` ("Đẩy vai")
  - Should NOT show: `barbell-row` (nameVi doesn't contain "Đẩy")

#### TC_W502_50: equipmentFilter prop + interactive chips combine with AND logic

- **Scenario**: S10 — Prop-based filter + chip interaction
- **Pre-condition**: `equipmentFilter={['barbell', 'dumbbell']}` prop passed
- **Steps**:
  1. Render with equipmentFilter prop
  2. Observe: only barbell + dumbbell chips should be pre-selected/active
  3. Click "Cable" chip to add it
- **Expected**:
  - Initial render shows exercises matching barbell OR dumbbell equipment
  - After clicking "Cable": prop chips remain active, cable is also active
  - Results now show exercises matching barbell OR dumbbell OR cable
  - Prop acts as initial state; interactive chips extend the selection

#### TC_W502_51: Recently used items display format matches main list

- **Scenario**: S10 — Recently used item rendering completeness
- **Pre-condition**: workoutSets has 3 exercises with distinct muscle groups/equipment
- **Steps**:
  1. Render ExerciseSelector
  2. Inspect recently used section items
- **Expected**:
  - Each recently used item shows: exercise nameVi, muscle group label, equipment label
  - Display format matches main exercise list items (same detail elements)
  - Items are buttons/clickable (not just text)

#### TC_W502_52: Empty state CTA opens CustomExerciseModal (not a separate modal)

- **Scenario**: S10 — Empty state CTA reuses existing modal
- **Pre-condition**: Search query "xyz" returns 0 results
- **Steps**:
  1. Type "xyz" in search
  2. Verify empty state with CTA button "Tạo bài tập mới"
  3. Click CTA button
- **Expected**:
  - `CustomExerciseModal` opens (same modal as "Bài tập tùy chỉnh" button)
  - Only ONE modal instance exists in DOM (no stacking)
  - `isCustomModalOpen` state is `true`

---

## 4. Edge Case Matrix

| #   | Edge Case                                                       | TC Reference | Risk                                                         |
| --- | --------------------------------------------------------------- | ------------ | ------------------------------------------------------------ |
| E1  | 0 workout history → "Gần đây" hidden                            | TC_W502_05   | Medium — section must NOT render empty header                |
| E2  | workoutSets with null exerciseId                                | TC_W502_06   | High — `.filter()` must guard null                           |
| E3  | exerciseId not in EXERCISES database                            | TC_W502_09   | High — lookup must not crash                                 |
| E4  | >5 unique recent exercises → cap at 5                           | TC_W502_08   | Medium — boundary condition                                  |
| E5  | Same exercise used 100 times → 1 in recently used               | TC_W502_07   | Low — dedup correctness                                      |
| E6  | All filters active → 0 results                                  | TC_W502_32   | Medium — empty state must trigger                            |
| E7  | Cardio exercises (muscleGroup='cardio') with muscle chip filter | SC_W502_07   | High — cardio has own muscleGroup                            |
| E8  | Exercise with empty nameEn                                      | TC_W502_26   | Low — existing guard, verify preserved                       |
| E9  | Search query > 100 chars (maxLength enforced)                   | Not critical | Low — input has maxLength=100                                |
| E10 | Search with only spaces/whitespace                              | Implicit     | Low — `.trim()` should handle                                |
| E11 | Rapid filter clicking (race condition)                          | Manual only  | Low — React state batching handles                           |
| E12 | "secondary" category exercises in compound tab                  | TC_W502_11   | High — must not be orphaned                                  |
| E13 | Cardio tab + muscle group chips interaction                     | TC_W502_46   | High — chips must hide/disable when cardio active            |
| E14 | Cardio tab + equipment chips interaction                        | TC_W502_47   | High — equipment chips irrelevant for cardio                 |
| E15 | Search + equipment multi-select combined                        | TC_W502_49   | Medium — AND logic between search and chips                  |
| E16 | equipmentFilter prop + interactive chips                        | TC_W502_50   | High — prop backward compat with WorkoutLogger/PlanDayEditor |
| E17 | Empty state CTA reuses same modal (no stacking)                 | TC_W502_52   | Medium — prevent double-open                                 |
| E18 | Recently used items show full details                           | TC_W502_51   | Medium — UI consistency                                      |

---

## 5. Test Data Fixtures

### 5.1 Mock EXERCISES (extend existing test mock)

The existing test mock has 6 exercises. Dev should extend it to cover all category/type combinations:

```typescript
const MOCK_EXERCISES = [
  // Compound + Strength
  { id: 'barbell-bench-press', nameVi: 'Đẩy tạ đòn nằm ngang', nameEn: 'Barbell Bench Press',
    muscleGroup: 'chest', category: 'compound', equipment: ['barbell'], exerciseType: 'strength', ... },
  { id: 'barbell-row', nameVi: 'Chèo tạ đòn', nameEn: 'Barbell Row',
    muscleGroup: 'back', category: 'compound', equipment: ['barbell'], exerciseType: 'strength', ... },
  { id: 'bodyweight-squat', nameVi: 'Squat tự trọng', nameEn: 'Bodyweight Squat',
    muscleGroup: 'legs', category: 'compound', equipment: ['bodyweight'], exerciseType: 'strength', ... },

  // Secondary + Strength (MUST appear under compound tab)
  { id: 'lat-pulldown', nameVi: 'Kéo xô máy', nameEn: 'Lat Pulldown',
    muscleGroup: 'back', category: 'secondary', equipment: ['cable'], exerciseType: 'strength', ... },

  // Isolation + Strength
  { id: 'dumbbell-fly', nameVi: 'Bay tạ tay', nameEn: 'Dumbbell Fly',
    muscleGroup: 'chest', category: 'isolation', equipment: ['dumbbell'], exerciseType: 'strength', ... },
  { id: 'plank-hold', nameVi: 'Plank giữ', nameEn: '',
    muscleGroup: 'core', category: 'isolation', equipment: ['bodyweight'], exerciseType: 'strength', ... },

  // Cardio (exerciseType='cardio', muscleGroup='cardio')
  // NOTE: equipment uses NON-STANDARD values ('treadmill') matching real exerciseDatabase.
  // Equipment chip filters do NOT apply to cardio exercises — cardio tab hides equipment chips.
  { id: 'running', nameVi: 'Chạy bộ', nameEn: 'Running',
    muscleGroup: 'cardio', category: 'compound', equipment: ['treadmill'], exerciseType: 'cardio', ... },

  // Extra strength (for >5 recently used test)
  { id: 'overhead-press', nameVi: 'Đẩy vai', nameEn: 'Overhead Press',
    muscleGroup: 'shoulders', category: 'compound', equipment: ['barbell'], exerciseType: 'strength', ... },
];
```

> **⚠️ Note on cardio equipment**: Real exerciseDatabase uses equipment values like `'treadmill'`, `'stationary-bike'`, `'pool'` for cardio exercises. These are NOT in the `EquipmentType` union (`'barbell'|'dumbbell'|...|'kettlebell'`). This is intentional — the interactive equipment filter chips only show the 7 standard `EquipmentType` values and are hidden/disabled when the "Cardio" category tab is active.

### 5.2 Mock WorkoutSets Factory

```typescript
function createMockWorkoutSet(overrides: Partial<WorkoutSet>): WorkoutSet {
  return {
    id: generateUUID(),
    workoutId: 'w1',
    exerciseId: null,
    setNumber: 1,
    reps: 10,
    weightKg: 60,
    rpe: 8,
    restSeconds: 90,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
```

### 5.3 Mock fitnessStore

> **⚠️ CRITICAL**: The current ExerciseSelector component does NOT import `useFitnessStore`. This mock is FORWARD-LOOKING — it will be needed once the "recently used" enhancement is implemented. Tests using this mock will be **RED** until the component is updated to call `useFitnessStore(s => s.workoutSets)`.

```typescript
// Top of test file — add this mock
const mockWorkoutSets: WorkoutSet[] = [];

vi.mock('@/store/fitnessStore', () => ({
  useFitnessStore: vi.fn((selector: (state: { workoutSets: WorkoutSet[] }) => unknown) => {
    const state = { workoutSets: mockWorkoutSets };
    return selector(state);
  }),
}));

// Per-test override pattern:
beforeEach(() => {
  mockWorkoutSets.length = 0; // reset
});

// In test:
mockWorkoutSets.push(
  createMockWorkoutSet({ exerciseId: 'barbell-bench-press', updatedAt: '2025-01-15T10:00:00Z' }),
  createMockWorkoutSet({ exerciseId: 'dumbbell-fly', updatedAt: '2025-01-14T09:00:00Z' }),
);
```

**Why this pattern?**

- `mockWorkoutSets` is module-scoped → shared across `vi.mock` closure and test code
- `array.length = 0` clears without reassigning reference (mock closure still sees same array)
- Avoids `vi.mocked(useFitnessStore).mockImplementation(...)` in every test

---

## 6. Test Classification

### 6.1 Unit Tests (Vitest + RTL) — 30 TCs

| TC ID      | Description                               | Complexity |
| ---------- | ----------------------------------------- | ---------- |
| TC_W502_01 | Returns null when closed                  | Simple     |
| TC_W502_02 | Renders all structural regions            | Simple     |
| TC_W502_03 | "Gần đây" section header with history     | Medium     |
| TC_W502_04 | Recently used reverse-chronological order | Medium     |
| TC_W502_05 | Hides "Gần đây" with empty history        | Simple     |
| TC_W502_06 | Hides "Gần đây" with null exerciseIds     | Simple     |
| TC_W502_07 | Deduplicates recently used exercises      | Medium     |
| TC_W502_08 | Caps recently used at 5                   | Medium     |
| TC_W502_09 | Ignores unknown exerciseId                | Medium     |
| TC_W502_10 | Category tabs render 3+all                | Simple     |
| TC_W502_11 | Compound tab filter logic                 | Medium     |
| TC_W502_12 | Isolation tab filter logic                | Medium     |
| TC_W502_13 | Cardio tab filter logic                   | Medium     |
| TC_W502_14 | Muscle group chips render 7+all           | Simple     |
| TC_W502_15 | Muscle chip click filters list            | Medium     |
| TC_W502_16 | "Tất cả" chip resets filter               | Simple     |
| TC_W502_17 | Equipment chips render 7 types            | Simple     |
| TC_W502_18 | Equipment chip click filters list         | Medium     |
| TC_W502_19 | Equipment multi-select (OR logic)         | Complex    |
| TC_W502_20 | Equipment chip toggle off                 | Medium     |
| TC_W502_21 | Vietnamese accented search                | Medium     |
| TC_W502_22 | Case-insensitive Vietnamese search        | Simple     |
| TC_W502_23 | Partial match search                      | Medium     |
| TC_W502_24 | Case-insensitive English search           | Simple     |
| TC_W502_25 | English fallback search                   | Simple     |
| TC_W502_26 | Empty nameEn doesn't crash                | Simple     |
| TC_W502_27 | Combined: muscle + equipment + category   | Complex    |
| TC_W502_28 | Clearing one filter widens results        | Complex    |
| TC_W502_29 | Search + muscle group combined            | Medium     |
| TC_W502_30 | Empty state with search query             | Simple     |
| TC_W502_31 | Empty state CTA "Tạo bài tập mới"         | Medium     |
| TC_W502_32 | Empty state from filter combination       | Simple     |
| TC_W502_33 | Empty state CTA opens modal               | Medium     |
| TC_W502_34 | Touch target min-h-12 on chips            | Simple     |
| TC_W502_35 | Touch target min-h-12 on items            | Simple     |
| TC_W502_36 | active:scale-[0.98] on elements           | Simple     |
| TC_W502_37 | Exercise selection → onSelect+onClose     | Medium     |
| TC_W502_38 | Custom exercise button opens modal        | Simple     |
| TC_W502_39 | Custom exercise save flow                 | Medium     |
| TC_W502_40 | Swipe dismiss disabled on focus           | Medium     |
| TC_W502_41 | Recently used item selectable             | Medium     |
| TC_W502_42 | Category tab reset (all)                  | Simple     |
| TC_W502_43 | Equipment toggle independence             | Medium     |
| TC_W502_44 | Search input aria-label                   | Simple     |
| TC_W502_45 | ModalBackdrop ariaLabelledBy              | Simple     |
| TC_W502_46 | Cardio tab hides muscle chips             | Medium     |
| TC_W502_47 | Cardio tab hides equipment chips          | Medium     |
| TC_W502_48 | Tab switch re-enables chips               | Medium     |
| TC_W502_49 | Search + equipment combined               | Medium     |
| TC_W502_50 | equipmentFilter prop + chips compat       | Complex    |
| TC_W502_51 | Recently used display format              | Medium     |
| TC_W502_52 | Empty state CTA reuses modal              | Medium     |

**Total: 52 test cases** (unit tests)

### 6.2 Manual Tests (Emulator via CDP) — 5 TCs

These validate visual rendering, touch behavior, and scroll performance that RTL cannot verify:

| TC ID        | Description                                  | What to Verify                                                                                       |
| ------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| TC_M_W502_01 | Touch target size on real device             | Chip buttons are ≥48px tall (min-h-12 = 3rem = 48px). Measure via CDP `getBoundingClientRect()`.     |
| TC_M_W502_02 | Active press animation                       | Long-press chip/item → visual scale reduction visible. Screenshot before/during press.               |
| TC_M_W502_03 | Scroll performance with 133 exercises        | Open selector with all exercises, rapidly scroll up/down. No jank, no dropped frames.                |
| TC_M_W502_04 | Recently used section sticky/scroll behavior | With recently used + long exercise list, verify recently used stays at top or scrolls naturally.     |
| TC_M_W502_05 | Filter chip horizontal scroll                | Equipment + muscle chips overflow viewport → verify horizontal scroll works with momentum on mobile. |

---

## 7. Coverage Requirements

### 7.1 Lines / Branches to Cover

| Code Area                                            | Target                                   | Strategy          |
| ---------------------------------------------------- | ---------------------------------------- | ----------------- |
| `isOpen === false` early return                      | Statements + Branches                    | TC_W502_01        |
| Recently used derivation logic (useMemo/useCallback) | Statements + Branches                    | TC_W502_03–09     |
| Category filter logic                                | Branches (compound/isolation/cardio/all) | TC_W502_10–13, 42 |
| Muscle group filter logic                            | Branches                                 | TC_W502_14–16     |
| Equipment filter logic (multi-select)                | Branches                                 | TC_W502_17–20, 43 |
| Search filter (Vi/En/empty)                          | Branches                                 | TC_W502_21–26     |
| Combined filter AND logic                            | Branches                                 | TC_W502_27–29, 49 |
| Empty state (search vs filter)                       | Branches                                 | TC_W502_30–33, 52 |
| handleSelect callback                                | Statements                               | TC_W502_37, 41    |
| Custom exercise flow                                 | Statements + Branches                    | TC_W502_38–39     |
| Swipe dismiss toggle                                 | Branches                                 | TC_W502_40        |
| Cardio tab → disable chips logic                     | Branches                                 | TC_W502_46–48     |
| Equipment prop + interactive chips                   | Branches                                 | TC_W502_50        |
| Recently used item rendering                         | Statements                               | TC_W502_51        |

### 7.2 Coverage Target

- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%

---

## 8. Dependencies & Mocking Strategy

### 8.1 Modules to Mock

| Module                         | Mock Strategy                            | Reason                                         |
| ------------------------------ | ---------------------------------------- | ---------------------------------------------- |
| `ModalBackdrop`                | Render children directly with test hooks | Avoid portal/animation complexity              |
| `useModalBackHandler`          | `vi.fn()` noop                           | Android back button — not testable in JSDOM    |
| `EXERCISES` (exerciseDatabase) | Controlled 8-exercise array              | Deterministic results, all categories covered  |
| `useFitnessStore`              | Per-test state override                  | Control workoutSets for recently used tests    |
| `CustomExerciseModal`          | Minimal mock with save/cancel            | Test interaction contract, not modal internals |
| `generateUUID`                 | Return deterministic string              | Predictable custom exercise IDs                |

### 8.2 Modules NOT to Mock

| Module                                         | Reason                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------ |
| `useTranslation`                               | Use real i18n setup from `src/__tests__/setup.ts` with Vietnamese translations |
| `EQUIPMENT_DISPLAY`                            | Real constant for equipment label verification                                 |
| `React hooks` (useState, useMemo, useCallback) | Always use real React                                                          |

---

## 9. New data-testid Contracts

Dev must add these testids for testability (add to component, test against in tests):

| testid                    | Element                              | Purpose                                           |
| ------------------------- | ------------------------------------ | ------------------------------------------------- |
| `exercise-category-tabs`  | Category tab container               | Region identification                             |
| `category-tab-all`        | "Tất cả" category button             | Category filter reset                             |
| `category-tab-compound`   | "Đa khớp" button                     | Category filter                                   |
| `category-tab-isolation`  | "Cô lập" button                      | Category filter                                   |
| `category-tab-cardio`     | "Cardio" button                      | Category filter                                   |
| `equipment-chips`         | Equipment chip container             | Region identification                             |
| `equipment-chip-{type}`   | Each equipment chip                  | Equipment filter (e.g., `equipment-chip-barbell`) |
| `recently-used-section`   | Recently used container              | Section identification                            |
| `recently-used-item-{id}` | Each recently used exercise button   | Selection                                         |
| `empty-state-create-btn`  | "Tạo bài tập mới" CTA in empty state | Modal trigger                                     |

**Preserved testids** (from v1 — must NOT change):

- `exercise-selector-sheet`
- `exercise-selector-title`
- `exercise-selector-search-region`
- `exercise-selector-chip-region`
- `exercise-selector-list-region`
- `exercise-search-input`
- `exercise-item-{id}`
- `exercise-empty-state`
- `muscle-group-chips`
- `add-custom-exercise`
- `modal-backdrop`

---

## 10. Risk Register

| Risk                                                                                                          | Impact            | Mitigation                                                                                |
| ------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------- |
| "secondary" category exercises (4 total) orphaned if tabs only have compound/isolation/cardio                 | P0 — data loss    | TC_W502_11 explicitly verifies secondary appears under compound tab                       |
| Cardio exercises have `muscleGroup: 'cardio'` (not in 7 standard groups) — muscle chip filter won't show them | P1 — UX confusion | Cardio tab should override/ignore muscle group filter, OR add "Cardio" as 8th muscle chip |
| Equipment filter changing from prop-based to interactive may break WorkoutLogger/PlanDayEditor consumers      | P1 — regression   | Ensure `equipmentFilter` prop still works as pre-filter alongside interactive chips       |
| `useFitnessStore` import adds store dependency to previously stateless component                              | P1 — architecture | Keep store access in a single `useMemo` hook, easy to test via mock                       |
| `workoutSets` can be very large (1000+ sets) — performance of recently used derivation                        | P2 — perf         | Use `.reduce()` with Set for O(n) dedup, limit 5                                          |

---

## 11. Relationship to Existing Tests

The existing 15 tests in `ExerciseSelector.test.tsx` cover v1 functionality. Dev has two options:

1. **Recommended**: Keep existing tests, add new `describe` blocks for v2 features. Update any tests broken by structural changes (e.g., new regions, touch target class changes).
2. **Alternative**: Rewrite entire test file. Higher risk of regression.

**Tests likely needing update**:

- "shows exercise details (name, category, equipment)" — category tabs may change rendering
- Touch target class assertions if `min-h-11` → `min-h-12`
- Any test asserting exact number of buttons (new chips change count)

---

## 12. Execution Order (for Dev)

```
1. Extend EXERCISES mock (add cardio + extra exercise — see §5.1)
2. Add fitnessStore mock (see §5.3 — CRITICAL for recently used tests)
3. Write "Gần đây" tests (TC_W502_03–09) → RED
4. Write category tab tests (TC_W502_10–13) → RED
5. Write cardio tab interaction tests (TC_W502_46–48) → RED
6. Write equipment chip tests (TC_W502_17–20, 43, 50) → RED
7. Write combined filter tests (TC_W502_27–29, 49) → RED
8. Write empty state CTA tests (TC_W502_30–33, 52) → RED
9. Write touch target + press feedback tests (TC_W502_34–36) → RED
10. Write recently used display format test (TC_W502_51) → RED
11. Update existing tests for structural changes → RED
12. Implement features → GREEN
13. Refactor → ensure ≤500 LOC, clean code
14. Run: npm run lint && npm run test && npm run build
15. Verify: 100% coverage on ExerciseSelector.tsx
```

---

## 13. Critique Log

### Round 1 — Automated QA Critique

**Date**: 2025-07-10
**Reviewer**: Automated explore agent (critique mode)
**Input**: v1.0 test plan (45 TCs)
**Output**: 28 findings (3 CRITICAL, 10 MAJOR, 9 MEDIUM, 4 MINOR, 2 INFO)

**CRITICAL findings addressed**:

1. ✅ **Mock cardio equipment 'treadmill' not in EquipmentType** — Added documentation note explaining non-standard cardio equipment is intentional; cardio tab hides equipment chips (§5.1)
2. ✅ **useFitnessStore not mocked in current test** — Expanded §5.3 with explicit forward-looking mock pattern, TDD note about RED-first expectation
3. ✅ **Component doesn't use useFitnessStore yet** — Added explicit TDD disclaimer in §5.3

**MAJOR findings addressed** (7 of 10):

1. ✅ **Category tab mapping undefined for 'secondary'** — Formalized in §1.5 with explicit filter logic for all 4 tab states
2. ✅ **Cardio tab + muscle group chip interaction** — Added TC_W502_46, TC_W502_48
3. ✅ **Cardio tab + equipment chip interaction** — Added TC_W502_47, TC_W502_48
4. ✅ **Search + equipment not tested together** — Added TC_W502_49
5. ✅ **equipmentFilter prop + interactive chips** — Added TC_W502_50
6. ✅ **Recently used display format** — Added TC_W502_51
7. ✅ **Empty state CTA text inconsistency** — Clarified in §1.6: new key `createNewExercise` = "Tạo bài tập mới"

**MAJOR findings deferred** (3):

- 6.1/6.2 (Mock consistency): Mock already documents the non-standard equipment pattern — no further action needed
- 9.1 (Coverage 100% achievable): Added cardio chip logic to coverage table (§7.1). Integration tests for derived list are covered by TC_W502_03–09 output assertions.

**MEDIUM/MINOR**: Accepted as known limitations or addressed via new TCs. testid naming standardized across new TCs.

**Result**: v1.0 (45 TCs) → **v1.1 (52 TCs + 5 manual TCs)**, 5 new scenarios (SC_W502_27–31), 6 new edge cases (E13–E18)

---

_End of Test Plan — W5-02 ExerciseSelector Enhancement_
