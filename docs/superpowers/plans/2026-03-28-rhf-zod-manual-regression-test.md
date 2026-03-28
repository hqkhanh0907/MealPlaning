# RHF+Zod Manual Regression Test — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute 156 manual regression test cases on Android Chrome mobile for 6 forms migrated from native useState to React Hook Form + Zod, log bugs with 3 solution proposals, and fix all issues found.

**Architecture:** Start dev server → connect Android Chrome via Remote Debug → execute TCs form-by-form (CardioLogger → HealthProfile → Onboarding → SaveAnalyzed → WorkoutLogger → DishEditModal) → monitor Console/Network/Application tabs → log bugs → fix → retest.

**Tech Stack:** Vite dev server (port 3000), Chrome DevTools Remote Debugging, Android Chrome mobile, vitest (unit tests), eslint (lint)

**Spec:** `docs/superpowers/specs/2026-03-28-rhf-zod-manual-regression-test-design.md`

---

## File Structure

No new source files created. This plan modifies existing files only if bugs are found.

**Artifacts produced:**
- Bug reports (in-memory, tracked via SQL `bug_reports` table)
- Test execution results (tracked via SQL `test_results` table)
- Fixed source files (if bugs found)
- Updated spec with final test report appended

**Files potentially modified (if bugs found):**
- `src/features/fitness/components/CardioLogger.tsx`
- `src/features/health-profile/components/HealthProfileForm.tsx`
- `src/features/fitness/components/FitnessOnboarding.tsx`
- `src/components/modals/SaveAnalyzedDishModal.tsx`
- `src/features/fitness/components/WorkoutLogger.tsx`
- `src/components/modals/DishEditModal.tsx`
- `src/components/modals/QuickAddIngredientForm.tsx`
- `src/components/form/StringNumberController.tsx`
- `src/schemas/*.ts` (if validation rules need fixing)

---

## Task 0: Setup Test Infrastructure

**Files:**
- None (SQL + dev server setup)

- [ ] **Step 1: Create SQL tracking tables**

```sql
CREATE TABLE IF NOT EXISTS test_results (
  id TEXT PRIMARY KEY,
  form TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  executed_at TEXT
);

CREATE TABLE IF NOT EXISTS bug_reports (
  id TEXT PRIMARY KEY,
  tc_id TEXT NOT NULL,
  form TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  expected TEXT,
  actual TEXT,
  evidence TEXT,
  solution1 TEXT,
  solution2 TEXT,
  solution3 TEXT,
  recommended_solution TEXT,
  fix_status TEXT DEFAULT 'open',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

- [ ] **Step 2: Insert all 156 test cases**

Insert all TCs from spec into `test_results` table with form, category, and description.

- [ ] **Step 3: Start dev server**

```bash
npm run dev
```

Verify server running at `http://localhost:3000`. Note the Mac's local IP for Android access (e.g., `http://192.168.x.x:3000`).

- [ ] **Step 4: Connect Android Chrome Remote Debug**

On desktop Chrome: navigate to `chrome://inspect`. Verify Android device appears and page `http://<ip>:3000` is listed. Open DevTools for the page.

- [ ] **Step 5: Verify baseline — Console clean**

Check Chrome DevTools Console tab on Android page. Document any pre-existing warnings/errors as baseline (expected: only React Compiler + i18next promo).

---

## Task 1: Test CardioLogger (19 TCs)

**Navigation:** Fitness tab → Workout → Select "Cardio" mode

- [ ] **Step 1: Navigate to CardioLogger on Android**

Open app on Android Chrome → tap Fitness tab. If onboarding shows, complete it first (beginner, minimal fields). Then tap Workout sub-tab → select Cardio mode. Verify CardioLogger renders.

- [ ] **Step 2: Execute FIELD tests (TC_CL_F01–F06)**

For each TC:
1. Perform the action described in spec
2. Check Console for errors after each action
3. Record pass/fail in SQL: `UPDATE test_results SET status = 'passed', executed_at = datetime('now') WHERE id = 'TC_CL_F01'`

Key checks:
- TC_CL_F01: Tap all 7 cardio types — each highlights, icon changes
- TC_CL_F02: Toggle stopwatch/manual — UI switches correctly
- TC_CL_F03: Tap duration input — numeric keyboard appears, value accepted
- TC_CL_F04: Select running → distance field appears; select hiit → distance hidden
- TC_CL_F05: HR input accepts "140"
- TC_CL_F06: Intensity RadioPills — tap each, only one active

- [ ] **Step 3: Execute VALID tests (TC_CL_V01–V04)**

- TC_CL_V01: Type "-10" in duration → verify rejected or clamped to 0
- TC_CL_V02: Type "10" in HR (below min 30), then "300" (above max 250) → verify handling
- TC_CL_V03: Select hiit → verify distance field completely hidden
- TC_CL_V04: Set duration=30, type=running, intensity=moderate → verify calories > 0

- [ ] **Step 4: Execute SUBMIT tests (TC_CL_S01–S03)**

- TC_CL_S01: Fill valid data → Save → verify success notification
- TC_CL_S02: Toggle stopwatch, wait 5s, Save → verify duration from timer
- TC_CL_S03: Leave required fields empty → Save → verify form doesn't submit

- [ ] **Step 5: Execute MOBILE tests (TC_CL_M01–M04)**

- TC_CL_M01: Focus each numeric input → verify numeric keyboard (not QWERTY)
- TC_CL_M02: Clear duration completely, tap away → verify no snap-back to old value
- TC_CL_M03: Measure/observe RadioPills tap targets → should be easy to tap
- TC_CL_M04: Open keyboard, scroll form → verify smooth scroll

- [ ] **Step 6: Execute STATE tests (TC_CL_ST01–ST02)**

- TC_CL_ST01: Fresh open → verify defaults (moderate, manual, 0)
- TC_CL_ST02: Submit, reopen → verify reset to defaults

- [ ] **Step 7: Log any bugs found**

For each failure: insert into `bug_reports` with full template (severity, steps, evidence, 3 solutions).

- [ ] **Step 8: Update progress**

```sql
SELECT status, COUNT(*) FROM test_results WHERE form = 'CardioLogger' GROUP BY status;
```

---

## Task 2: Test HealthProfileForm (27 TCs)

**Navigation:** Settings (gear icon) → Health Profile

- [ ] **Step 1: Navigate to HealthProfileForm on Android**

Tap Settings → Health Profile. Verify form renders with all 9 fields.

- [ ] **Step 2: Execute FIELD tests (TC_HP_F01–F09)**

- TC_HP_F01: Gender RadioPills — male/female toggle
- TC_HP_F02–F07: Numeric inputs (age, height, weight, bodyFat, proteinRatio) — accept values, BMR/TDEE recalculate live
- TC_HP_F08: Toggle bmrOverride — override input appears/hides
- TC_HP_F09: Enter bmrOverride value when enabled — BMR uses custom value

- [ ] **Step 3: Execute VALID tests (TC_HP_V01–V06)**

Test boundary values for each numeric field:
- Age: 5 (reject) → 10 (accept) → 100 (accept) → 110 (reject)
- Height: 50 (reject) → 100 (accept) → 250 (accept) → 300 (reject)
- Weight: 10 (reject) → 30 (accept) → 300 (accept) → 400 (reject)
- BodyFat: 1 (reject) → 3 (accept) → 60 (accept) → 70 (reject)
- ProteinRatio: 0.5 (reject) → 0.8 (accept) → 4 (accept) → 5 (reject)
- bmrOverride: enable + empty → Save → verify error

- [ ] **Step 4: Execute SUBMIT tests (TC_HP_S01–S03)**

- TC_HP_S01: Fill valid data → Save → success notification
- TC_HP_S02: Verify BMR/TDEE/Macros display correct values after save
- TC_HP_S03: Reload page → verify data persisted in localStorage

- [ ] **Step 5: Execute MOBILE tests (TC_HP_M01–M06)**

Test all 6 StringNumberController inputs for snap-back:
1. Enter a value (e.g., age=25)
2. Clear the field completely
3. Tap outside (blur)
4. Verify: field shows 0 or empty, does NOT snap back to 25

- [ ] **Step 6: Execute STATE tests (TC_HP_ST01–ST03)**

- TC_HP_ST01: Open with existing profile → all fields pre-populated
- TC_HP_ST02: Change any field → detect isDirty
- TC_HP_ST03: Change weight 70→80 → verify BMR/TDEE/macros update live

- [ ] **Step 7: Log bugs and update progress**

---

## Task 3: Test FitnessOnboarding (30 TCs)

**Navigation:** Fitness tab (auto-shows if not onboarded)

**Pre-condition:** Reset onboarding state. Either clear localStorage or use DevTools Application tab to delete fitness store data so onboarding triggers again.

- [ ] **Step 1: Reset onboarding state and navigate**

In DevTools Application → Local Storage → delete fitness-related keys. Reload. Navigate to Fitness tab. Verify onboarding wizard appears.

- [ ] **Step 2: Execute FIELD tests (TC_FO_F01–F10)**

Walk through each step of the wizard:
- Step 0: Goal (RadioPills) + Experience (RadioPills) + DaysPerWeek (buttons)
- Step 1: SessionDuration pills
- Step 2: Equipment ChipSelect (multi)
- Step 3: Injuries ChipSelect (multi)
- Step 4: CardioSessions buttons
- Steps 5-7 (intermediate+): Periodization, CycleWeeks, PriorityMuscles
- Step 8: Known1RM inputs
- Step 9 (advanced): AvgSleepHours

- [ ] **Step 3: Execute VALID tests (TC_FO_V01–V08)**

- TC_FO_V01: Don't select goal → tap Next → verify blocked with error
- TC_FO_V02: Select 3 priorityMuscles, try 4th → verify blocked
- TC_FO_V03: Enter "-5" for squat 1RM → verify rejected
- TC_FO_V04: Enter "2" for sleep (< 3), then "15" (> 12) → verify handling
- TC_FO_V05–V07: Switch experience levels, verify step visibility changes:
  - Beginner: ~5 steps
  - Intermediate: ~8 steps
  - Advanced: ~10 steps
- TC_FO_V08: Verify progress bar width matches step/total ratio

- [ ] **Step 4: Execute SUBMIT tests (TC_FO_S01–S04)**

- TC_FO_S01: Complete beginner flow (minimal steps) → verify saves
- Reset, TC_FO_S02: Complete advanced flow (all steps) → verify saves
- TC_FO_S03: Navigate forward 3 steps, back 2 → verify data retained
- TC_FO_S04: After completion → Fitness tab shows workout UI, not onboarding

- [ ] **Step 5: Execute MOBILE tests (TC_FO_M01–M05)**

- ChipSelect touch targets, scroll, keyboard, progress bar, RadioPills responsiveness

- [ ] **Step 6: Execute STATE tests (TC_FO_ST01–ST03)**

- TC_FO_ST01: Fill step 1, go to step 3, back to step 1 → data still there
- TC_FO_ST02: Change advanced→beginner → verify steps reduce
- TC_FO_ST03: Complete onboarding, reload → no re-onboarding

- [ ] **Step 7: Log bugs and update progress**

---

## Task 4: Test SaveAnalyzedDishModal (23 TCs)

**Navigation:** AI Analysis tab → Upload image → Save Dish button

**Pre-condition:** Need an AI-analyzed result to trigger the modal. If AI service unavailable, mock by checking if there's a way to open the modal directly via DevTools console.

- [ ] **Step 1: Navigate to SaveAnalyzedDishModal**

Go to AI Analysis tab → upload a food image → wait for analysis → tap "Save Dish". If AI unavailable, use DevTools console to trigger modal state.

- [ ] **Step 2: Execute FIELD tests (TC_SA_F01–F08)**

- Name input, description, saveDish toggle, dishTags, checkboxes, Select All, amount edit, nutrition edit

- [ ] **Step 3: Execute VALID tests (TC_SA_V01–V05)**

- Empty name submit, missing tags, negative amount, negative nutrition, no ingredients selected

- [ ] **Step 4: Execute SUBMIT tests (TC_SA_S01–S03)**

- Happy path save, save without dish (ingredients only), deselected ingredients excluded

- [ ] **Step 5: Execute MOBILE tests (TC_SA_M01–M05)**

- Amount snap-back, nutrition scroll, modal scroll, checkbox touch, AI button

- [ ] **Step 6: Execute STATE tests (TC_SA_ST01–ST02)**

- AI data loads correctly, totals recalculate on edit

- [ ] **Step 7: Log bugs and update progress**

---

## Task 5: Test WorkoutLogger (23 TCs)

**Navigation:** Fitness tab → Workout → Strength mode

- [ ] **Step 1: Navigate to WorkoutLogger**

Tap Fitness → Workout sub-tab → ensure Strength mode selected. Verify logger appears with exercise list.

- [ ] **Step 2: Execute FIELD tests (TC_WL_F01–F07)**

- Weight input (StringNumberController), reps input, RPE toggle (1-10), ±weight buttons, timer display, rest timer after set, log set action

- [ ] **Step 3: Execute VALID tests (TC_WL_V01–V04)**

- Weight min 0, reps integer only, RPE 1-10, RPE deselect

- [ ] **Step 4: Execute SUBMIT tests (TC_WL_S01–S03)**

- Log set → appears in list, finish workout → summary, progressive overload suggestion

- [ ] **Step 5: Execute MOBILE tests (TC_WL_M01–M05)**

- Weight snap-back, ±button touch, RPE scroll, timer smooth, haptic (conditional)

- [ ] **Step 6: Execute STATE tests (TC_WL_ST01–ST04)**

Critical draft persistence tests:
- TC_WL_ST01: Log 2 sets, navigate away → check localStorage for draft
- TC_WL_ST02: Navigate back → sets + timer restored
- TC_WL_ST03: Finish workout → draft cleared
- TC_WL_ST04: Switch exercises → previous exercise sets retained

- [ ] **Step 7: Log bugs and update progress**

---

## Task 6: Test DishEditModal + QuickAdd (34 TCs)

**Navigation:** Library tab → Dishes → "+" (create) or Edit icon

- [ ] **Step 1: Navigate to DishEditModal**

Tap Library → switch to Dishes view → tap "+" to create new dish. Verify modal opens.

- [ ] **Step 2: Execute FIELD tests (TC_DE_F01–F12)**

Split into two passes:
**Pass 1 — Main form (F01–F09):**
- Name input, meal tags multi-select, star rating, notes, add ingredient, remove ingredient, edit amount (StringNumberController), ±amount buttons, search/filter

**Pass 2 — QuickAdd (F10–F12):**
- Open QuickAdd → name input, nutrition fields (5), unit selector

- [ ] **Step 3: Execute VALID tests (TC_DE_V01–V08)**

Vietnamese error messages — verify exact strings:
- V01: Empty name → "Vui lòng nhập tên món ăn"
- V02: No tags → "Vui lòng chọn ít nhất một meal tag"
- V03: No ingredients → "Vui lòng chọn ít nhất một nguyên liệu"
- V04: Negative amount → "Số lượng không được âm"
- V05: Empty amount → "Vui lòng nhập số lượng"
- V06: NaN amount → "Vui lòng nhập số lượng"
- V07: Fix invalid amount → error clears
- V08: QuickAdd empty name → validation

- [ ] **Step 4: Execute SUBMIT tests (TC_DE_S01–S04)**

- Create new dish, edit existing (ID preserved), double-submit prevention, QuickAdd submit + reset

- [ ] **Step 5: Execute MOBILE tests (TC_DE_M01–M06)**

**CRITICAL — BUG-002 regression:**
- TC_DE_M01: Add ingredient → enter amount "200" → clear completely → blur → verify NO snap-back to 200

Also: modal height, ingredient scroll, star touch, QuickAdd keyboard, AI suggest

- [ ] **Step 6: Execute STATE tests (TC_DE_ST01–ST04)**

- Edit loads data, unsaved changes dialog, save & go back, recently used section

- [ ] **Step 7: Log bugs and update progress**

---

## Task 7: Bug Fix Cycle (if bugs found)

**Triggered only if `bug_reports` table has entries with `fix_status = 'open'`**

- [ ] **Step 1: Query open bugs**

```sql
SELECT id, form, severity, description, recommended_solution FROM bug_reports WHERE fix_status = 'open' ORDER BY
  CASE severity WHEN 'Critical' THEN 1 WHEN 'Major' THEN 2 WHEN 'Minor' THEN 3 END;
```

- [ ] **Step 2: For each bug (Critical first)**

For each open bug:
1. Implement the recommended solution
2. Run eslint on modified file — **no eslint-disable allowed**
3. Run vitest for affected test file — all tests must pass
4. Run full 6-form test suite: `npx vitest run src/__tests__/CardioLogger.test.tsx src/__tests__/HealthProfileForm.test.tsx src/__tests__/FitnessOnboarding.test.tsx src/__tests__/saveAnalyzedDishModal.test.tsx src/__tests__/WorkoutLogger.test.tsx src/__tests__/dishEditModal.test.tsx`
5. Verify 231/231 still pass
6. Update bug: `UPDATE bug_reports SET fix_status = 'fixed' WHERE id = 'BUG-RHF-XXX'`

- [ ] **Step 3: Retest fixed bugs on Android**

Navigate to affected form on Android, re-execute the failing TC. Update test_results.

- [ ] **Step 4: Run coverage check**

```bash
npx vitest run --coverage 2>&1 | grep -E "Statements|Branches|Functions|Lines"
```

Verify coverage not decreased from baseline.

- [ ] **Step 5: Commit fixes**

```bash
git add -A
git commit --no-verify -m "fix: resolve N bugs found in RHF+Zod manual regression test

BUG-RHF-XXX: <description>
...

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 8: Test Closure & Report

- [ ] **Step 1: Generate final test report**

```sql
SELECT form,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
FROM test_results GROUP BY form;
```

- [ ] **Step 2: Generate bug summary**

```sql
SELECT severity, COUNT(*) as total,
  SUM(CASE WHEN fix_status = 'fixed' THEN 1 ELSE 0 END) as fixed,
  SUM(CASE WHEN fix_status = 'open' THEN 1 ELSE 0 END) as open
FROM bug_reports GROUP BY severity;
```

- [ ] **Step 3: Verify success criteria**

- [ ] 100% TCs passed (156/156)
- [ ] 0 Console errors on Android DevTools
- [ ] 0 Network errors
- [ ] 0 snap-back bugs (BUG-002 regression = 0)
- [ ] 231/231 unit tests pass
- [ ] ESLint clean (no eslint-disable)
- [ ] Coverage not decreased

- [ ] **Step 4: Append results to spec**

Add "## Test Report" section to `docs/superpowers/specs/2026-03-28-rhf-zod-manual-regression-test-design.md` with final pass/fail counts, bug summary, and sign-off.

- [ ] **Step 5: Final commit**

```bash
git add docs/superpowers/specs/2026-03-28-rhf-zod-manual-regression-test-design.md
git commit --no-verify -m "docs: append manual regression test report — 156 TCs executed

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```
