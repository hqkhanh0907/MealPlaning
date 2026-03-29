# Onboarding Full Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Comprehensive audit of the UnifiedOnboarding flow — find bugs on emulator, evaluate UX/accessibility/code quality via multi-skill analysis, verify business logic, and produce a prioritized findings report.

**Architecture:** Build APK → test on emulator-5556 → run 4 analysis skills in parallel (ui-ux-pro-max, web-design-guidelines, react-vite-best-practices, shadcn-ui) → verify business logic formulas → compile findings into a spec document with bug reports, UX improvements, and code optimizations.

**Tech Stack:** React 18, Vite, Capacitor Android, Zustand, React Hook Form + Zod, Tailwind CSS, shadcn/ui, motion/react, Vitest

**Spec:** `docs/superpowers/specs/2026-03-29-onboarding-audit-design.md`

**ADB path:** `/Users/khanhhuynh/Library/Android/sdk/platform-tools/adb`

---

## File Map (audit scope — read-only analysis, no modifications)

| File | Role | Lines |
|------|------|-------|
| `src/components/UnifiedOnboarding.tsx` | Master orchestrator | 236 |
| `src/components/onboarding/onboardingSchema.ts` | Zod schema + cross-validation | 86 |
| `src/components/onboarding/OnboardingErrorBoundary.tsx` | Error boundary | 64 |
| `src/components/onboarding/OnboardingProgress.tsx` | Progress bar | 66 |
| `src/components/onboarding/WelcomeSlides.tsx` | Section 1: Welcome | 118 |
| `src/components/onboarding/HealthBasicStep.tsx` | Section 2a: Basic info | 170 |
| `src/components/onboarding/ActivityLevelStep.tsx` | Section 2b: Activity level | 90 |
| `src/components/onboarding/NutritionGoalStep.tsx` | Section 2c: Goal | 149 |
| `src/components/onboarding/HealthConfirmStep.tsx` | Section 2d: Confirm | 162 |
| `src/components/onboarding/TrainingCoreStep.tsx` | Section 3: Core | 134 |
| `src/components/onboarding/TrainingDetailSteps.tsx` | Section 4: Details (adaptive) | 293 |
| `src/components/onboarding/PlanStrategyChoice.tsx` | Section 5: Strategy | ~100 |
| `src/components/onboarding/PlanComputingScreen.tsx` | Section 6: Computing | ~227 |
| `src/components/onboarding/PlanPreviewScreen.tsx` | Section 7: Preview | ~100 |
| `src/store/appOnboardingStore.ts` | Onboarding state persistence | 33 |
| `src/features/health-profile/store/healthProfileStore.ts` | Health profile + goals | 194 |
| `src/store/fitnessStore.ts` | Fitness state (planStrategy) | — |
| `src/locales/vi.json` | Vietnamese translations | — |
| `src/__tests__/unifiedOnboarding.test.tsx` | Unit tests | ~2055 |
| `src/__tests__/unifiedOnboardingIntegration.test.tsx` | Integration tests | ~410 |

---

## Task 1: Baseline Check

**Purpose:** Record current ESLint, unit test, and coverage status before analysis.

- [ ] **Step 1: Run ESLint on onboarding files**

```bash
cd /Users/khanhhuynh/person_project/MealPlaning
npx eslint src/components/UnifiedOnboarding.tsx src/components/onboarding/ --format stylish 2>&1 | head -50
```

Record: error count, warning count. Expected: 0 errors (project rule).

- [ ] **Step 2: Run unit tests for onboarding**

```bash
npx vitest run src/__tests__/unifiedOnboarding.test.tsx src/__tests__/unifiedOnboardingIntegration.test.tsx src/__tests__/appOnboardingStoreMigration.test.ts --reporter=verbose 2>&1 | tail -30
```

Record: total tests, passed, failed, skipped.

- [ ] **Step 3: Run coverage for onboarding files**

```bash
npx vitest run --coverage 2>&1 | grep -E "(onboarding|UnifiedOnboarding|OnboardingProgress|WelcomeSlides|HealthBasic|ActivityLevel|NutritionGoal|HealthConfirm|TrainingCore|TrainingDetail|PlanStrategy|PlanComputing|PlanPreview|OnboardingError|onboardingSchema)" | head -20
```

Record: per-file branch/line/function coverage percentages.

- [ ] **Step 4: Record baseline in audit notes**

Create a temporary tracking structure (SQL or in-memory) with baseline numbers for comparison.

---

## Task 2: Build APK & Install on Emulator

**Purpose:** Get a fresh debug APK on emulator-5556 for testing.

- [ ] **Step 1: Build web app**

```bash
cd /Users/khanhhuynh/person_project/MealPlaning
npm run build
```

Expected: Build success, `dist/` directory created.

- [ ] **Step 2: Sync Capacitor**

```bash
npx cap sync android
```

Expected: Sync complete, no errors.

- [ ] **Step 3: Build debug APK**

```bash
cd android
chmod +x gradlew
./gradlew assembleDebug
```

Expected: APK at `android/app/build/outputs/apk/debug/app-debug.apk`

- [ ] **Step 4: Clear app data on emulator**

```bash
/Users/khanhhuynh/Library/Android/sdk/platform-tools/adb -s emulator-5556 shell pm clear com.mealplaner.app 2>/dev/null || echo "App not installed yet"
```

- [ ] **Step 5: Install APK on emulator-5556**

```bash
/Users/khanhhuynh/Library/Android/sdk/platform-tools/adb -s emulator-5556 install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Expected: `Success`

- [ ] **Step 6: Launch app and verify onboarding shows**

```bash
/Users/khanhhuynh/Library/Android/sdk/platform-tools/adb -s emulator-5556 shell am start -n com.mealplaner.app/.MainActivity
```

Expected: App launches, UnifiedOnboarding renders (Section 1: Welcome Slides).

- [ ] **Step 7: Take initial screenshot**

```bash
/Users/khanhhuynh/Library/Android/sdk/platform-tools/adb -s emulator-5556 exec-out screencap -p > /Users/khanhhuynh/person_project/MealPlaning/screenshots/onboarding-audit-s1-welcome.png
```

---

## Task 3: Emulator Flow Testing — Beginner Auto (F1)

**Purpose:** Test the most common happy path: Beginner experience + Auto plan generation.

- [ ] **Step 1: Test Section 1 (Welcome Slides)**

Interactions via `adb shell input`:
1. Verify 3 welcome slides render (swipe left 2x or tap Next)
2. Verify "Bỏ qua" (Skip) button is visible
3. Verify progress bar shows Section 1 active
4. Navigate through all 3 slides
5. Screenshot each slide

```bash
ADB="/Users/khanhhuynh/Library/Android/sdk/platform-tools/adb -s emulator-5556"
$ADB exec-out screencap -p > screenshots/audit-f1-s1-slide1.png
# Tap Next or swipe
$ADB shell input swipe 800 1000 200 1000 300
sleep 1
$ADB exec-out screencap -p > screenshots/audit-f1-s1-slide2.png
$ADB shell input swipe 800 1000 200 1000 300
sleep 1
$ADB exec-out screencap -p > screenshots/audit-f1-s1-slide3.png
```

Record: Any rendering issues, text overflow, animation glitches.

- [ ] **Step 2: Test Section 2a (Health Basic Step)**

Navigate to Section 2a. Verify:
1. Name input is **empty** (not pre-filled) — **KNOWN BUG: currently has defaults**
2. Gender radio pills render (Nam/Nữ)
3. DOB date picker works on Android
4. Height input — verify placeholder "170" but value empty
5. Weight input — verify placeholder "70" but value empty
6. **Test clear input → "0" bug**: Enter a value, then clear it completely

Screenshot and log findings for each field.

- [ ] **Step 3: Test Section 2b (Activity Level)**

Fill Section 2a with valid data → tap Next. Verify:
1. 5 activity level cards render with icons + descriptions
2. Single selection (tap one, previous deselects)
3. "Không tính tập gym" subtitle visible
4. Touch targets ≥ 44pt

- [ ] **Step 4: Test Section 2c (Nutrition Goal)**

Select activity → tap Next. Verify:
1. 3 goal cards (Giảm cân / Duy trì / Tăng cơ) render
2. Select "Giảm cân" → rate pills + target weight appear
3. Select "Duy trì" → rate + target disappear
4. Select "Tăng cơ" → rate pills + target weight appear
5. Delta text displays correctly: "Hiện tại: X kg → Mục tiêu: Y kg"

- [ ] **Step 5: Test Section 2d (Health Confirm)**

Fill goal data → tap Next. Verify:
1. Summary card shows correct Name, Gender, Age, Height/Weight
2. Hero calorie number renders (large, centered)
3. "Xem chi tiết" expandable works (BMR, TDEE, Macros)
4. Advanced settings collapsible works (Body Fat, BMR Override, Protein Ratio)
5. "Tiếp tục thiết lập tập luyện →" CTA button

- [ ] **Step 6: Test Section 3 (Training Core)**

Tap CTA → verify:
1. Training goal radio pills (4 options)
2. Experience level (Beginner selected for F1)
3. Days per week pill buttons (2-6)
4. Progress bar shows Section 3 active

- [ ] **Step 7: Test Section 4 (Training Details — Beginner = 4 steps)**

Select Beginner + tap Next. Verify 4 steps only:
1. Step 4a: Session duration (30/45/60/90 min)
2. Step 4b: Equipment multi-select (6 options)
3. Step 4c: Injuries multi-select (6 regions)
4. Step 4d: Cardio sessions/week (0-5)
5. Confirm NO periodization/cycle/priority/1RM/sleep steps appear

- [ ] **Step 8: Test Section 5 (Strategy Choice)**

Complete Section 4 → verify:
1. "Để app lên kế hoạch" card (Auto, recommended)
2. "Tự lên kế hoạch" card (Manual)
3. "Đề xuất ✨" badge on Auto card
4. Footer note visible
5. Tap Auto → proceeds to Section 6

- [ ] **Step 9: Test Section 6 (Computing Screen)**

Verify:
1. 4 progress steps animate in sequence (~2.5s each)
2. Progress bar fills 0→100%
3. Personalized header "Đang lên kế hoạch cho {name}…"
4. Step subtitles show real data
5. No back button (spec: cannot go back from computing)
6. Auto-navigates to Section 7 after completion

- [ ] **Step 10: Test Section 7 (Plan Preview)**

Verify:
1. "Kế hoạch đã sẵn sàng! 🎉" header
2. 7-day calendar strip renders
3. Summary card with 4 stats (workout days, rest days, exercises, duration)
4. Day preview cards scrollable
5. "Bắt đầu tập luyện →" primary CTA
6. "Tùy chỉnh kế hoạch trước" secondary CTA
7. Tap "Bắt đầu" → exits onboarding → main app renders

- [ ] **Step 11: Verify post-onboarding state**

After completing:
1. Main app should render (tabs visible)
2. Kill & relaunch app → onboarding should NOT show again
3. Check if fitness tab has the generated plan

- [ ] **Step 12: Log all F1 findings**

Record bugs, UX issues, screenshots for each section.

---

## Task 4: Emulator Flow Testing — Beginner Manual (F2)

**Purpose:** Test manual path (skip computing + preview plan generation).

- [ ] **Step 1: Clear app data and reinstall**

```bash
ADB="/Users/khanhhuynh/Library/Android/sdk/platform-tools/adb -s emulator-5556"
$ADB shell pm clear com.mealplaner.app
$ADB shell am start -n com.mealplaner.app/.MainActivity
```

- [ ] **Step 2: Navigate to Section 5 (same as F1 up to Strategy)**

Quickly go through Sections 1→4 with valid data (Beginner).

- [ ] **Step 3: Test Manual path**

At Section 5, tap "Tự lên kế hoạch" (Manual). Verify:
1. Skips Section 6 (no computing animation)
2. Completes onboarding immediately
3. Main app renders without a generated plan
4. Fitness tab shows empty state (no plan)

- [ ] **Step 4: Log F2 findings**

---

## Task 5: Emulator Flow Testing — Intermediate Auto (F3)

**Purpose:** Test intermediate experience path with additional Section 4 steps.

- [ ] **Step 1: Clear app data and launch**
- [ ] **Step 2: Navigate Sections 1-3, select Intermediate experience**
- [ ] **Step 3: Verify Section 4 has 8 steps**

Intermediate-only steps:
1. Step 4e: Periodization (linear/undulating/block)
2. Step 4f: Cycle weeks (4/6/8/12)
3. Step 4g: Priority muscles (max 3 of 7)
4. Step 4h: Known 1RM (squat/bench/deadlift/ohp) with "Chưa biết" toggle

- [ ] **Step 4: Complete Auto path (Section 5→6→7)**
- [ ] **Step 5: Log F3 findings**

---

## Task 6: Emulator Flow Testing — Advanced Auto (F5) + Manual (F4, F6)

**Purpose:** Test advanced path (9 steps in Section 4) and remaining manual paths.

- [ ] **Step 1: F5 — Advanced + Auto**

Clear data. Select Advanced. Verify:
1. All 9 steps in Section 4 (including sleep hours)
2. Complete auto path
3. Screenshot advanced-only steps

- [ ] **Step 2: F4 — Intermediate + Manual**

Clear data. Intermediate + Manual. Verify: Sections 1-5 work identically to F3, manual exit completes cleanly (onboarding finishes, no plan generated, fitness tab shows empty state).

- [ ] **Step 3: F6 — Advanced + Manual**

Clear data. Advanced + Manual. Verify: All 9 Section 4 steps render, manual exit completes cleanly, max complexity with no plan generated.

- [ ] **Step 4: Log F4, F5, F6 findings**

---

## Task 7: Edge Case Testing on Emulator

**Purpose:** Test all 25 edge cases from spec §3.2.

- [ ] **Step 1: Validation edge cases (EC-V01 through EC-V09)**

For each:
1. Clear app data → launch → navigate to relevant step
2. Perform the edge case action
3. Screenshot result
4. Record: expected vs actual behavior

**Critical cases to test:**
- EC-V08: Clear number input → does it show "0"? (KNOWN BUG)
- EC-V09: First-time user → are inputs empty or pre-filled? (KNOWN BUG)
- EC-V05/V06: Goal direction validation (cut target ≥ weight, bulk target ≤ weight)

- [ ] **Step 2: Navigation edge cases (EC-N01 through EC-N06)**

**Critical:**
- EC-N04: Android hardware back button at every section — does it go back correctly or exit app?
- EC-N06: Auto → back to Section 5 → switch Manual → does `clearTrainingPlans()` fire?

- [ ] **Step 3: State & persistence edge cases (EC-S01 through EC-S05)**

For resume tests:
1. Navigate to mid-section
2. Force-stop app: `$ADB shell am force-stop com.mealplaner.app`
3. Relaunch: `$ADB shell am start -n com.mealplaner.app/.MainActivity`
4. Verify resume behavior

- [ ] **Step 4: UX & performance edge cases (EC-U01 through EC-U06)**

**Critical:**
- EC-U01: Double-tap Next rapidly
- EC-U02: Rapid back/forward navigation
- EC-U05: Keyboard overlay covering inputs (tap Name or Height input)

- [ ] **Step 5: Compile all edge case findings**

Create structured bug entries for each failure.

---

## Task 8: Skill Analysis — ui-ux-pro-max

**Purpose:** Professional UX/UI evaluation of all 13 onboarding components.

- [ ] **Step 1: Invoke ui-ux-pro-max skill**

Provide all onboarding component files for review. Focus areas:
- Color consistency (emerald system)
- Typography hierarchy
- Spacing rhythm
- Touch targets ≥ 44pt
- Button states (hover/active/disabled)
- Animation smoothness
- Dark mode completeness
- Progress bar clarity

- [ ] **Step 2: Record ui-ux-pro-max findings**

Categorize by severity (Critical/High/Medium/Low).

---

## Task 9: Skill Analysis — web-design-guidelines

**Purpose:** Accessibility and web standards compliance audit.

- [ ] **Step 1: Invoke web-design-guidelines skill**

Review all onboarding components for:
- WCAG 2.1 AA compliance
- ARIA roles/labels/describedby
- Focus indicators (focus-visible:ring-2)
- Semantic HTML (button vs div, label vs placeholder)
- Form attributes (name, autoComplete, inputMode)
- prefers-reduced-motion
- Safe area insets
- transition-all → specific properties
- aria-label via t() not hardcoded

- [ ] **Step 2: Record web-design-guidelines findings**

---

## Task 10: Skill Analysis — react-vite-best-practices

**Purpose:** Code quality and performance optimization analysis.

- [ ] **Step 1: Invoke react-vite-best-practices skill**

Review for:
- Re-render prevention (useCallback deps)
- Component size (TrainingDetailSteps.tsx = 293 lines, over 200 limit)
- React.lazy + Suspense boundaries
- Bundle chunking (onboarding separate from main)
- useForm performance (single instance, uncontrolled)
- useWatch targeted selectors
- motion/react tree-shakeable imports
- CSS-only animations where possible

- [ ] **Step 2: Analyze bundle size**

```bash
cd /Users/khanhhuynh/person_project/MealPlaning
npx vite build --mode production 2>&1 | tail -30
```

Check: onboarding chunk size, total bundle, lazy-loaded chunks.

- [ ] **Step 3: Record react-vite-best-practices findings**

---

## Task 11: Skill Analysis — shadcn-ui + RHF + Zod Pattern Audit

**Purpose:** Verify form consistency and identify component replacement opportunities.

- [ ] **Step 1: Invoke shadcn-ui skill**

Audit:
- Which inputs are custom vs shadcn
- Number input "clear → 0" bug root cause analysis
- Default values → empty + placeholder recommendation
- RadioGroup opportunities
- Card component standardization
- Button variant consistency
- Progress component

- [ ] **Step 2: Verify RHF + Zod consistency**

For each of the 13 step components, verify:
1. Uses `form.control` from parent `useForm()`
2. Uses `trigger()` with `STEP_FIELDS` for step-level validation
3. Zod schema field ranges match spec §3
4. Error messages use i18n keys (not hardcoded)

Read each file and create a consistency matrix.

- [ ] **Step 3: Record pattern audit findings**

---

## Task 12: Business Logic Verification

**Purpose:** Verify BMR/TDEE/calorie/macro calculations are correct.

- [ ] **Step 1: Verify BMR formula (Mifflin-St Jeor)**

Read the calculation code in `HealthConfirmStep.tsx` and/or `src/services/nutritionEngine.ts`.
Test against known values:

| Gender | Weight | Height | Age | Expected BMR |
|--------|--------|--------|-----|-------------|
| Male | 70 | 170 | 25 | 10×70 + 6.25×170 - 5×25 + 5 = 1,642.5 |
| Female | 55 | 160 | 30 | 10×55 + 6.25×160 - 5×30 - 161 = 1,239 |
| Male | 100 | 190 | 40 | 10×100 + 6.25×190 - 5×40 + 5 = 2,192.5 |

- [ ] **Step 2: Verify TDEE multipliers**

Check: sedentary=1.2, light=1.375, moderate=1.55, active=1.725, extra_active=1.9

- [ ] **Step 3: Verify calorie offsets**

Test all 7 combinations:
- cut + conservative = -275
- cut + moderate = -550
- cut + aggressive = -1100
- maintain = 0
- bulk + conservative = +275
- bulk + moderate = +550
- bulk + aggressive = +1100

- [ ] **Step 4: Verify macro splits**

Check protein/fat/carbs calculation logic and percentages.

- [ ] **Step 5: Verify DOB → age calculation**

Edge cases: leap year DOB, Dec 31 birth, Jan 1 birth, age boundary (exactly 10).

- [ ] **Step 6: Record business logic findings**

---

## Task 13: i18n Key Verification

**Purpose:** Ensure all t() calls in onboarding have corresponding keys in vi.json.

- [ ] **Step 1: Run i18n verification script**

```bash
cd /Users/khanhhuynh/person_project/MealPlaning
python3 -c "
import json,re,glob
vi=json.load(open('src/locales/vi.json'))
def kx(d,p):
  for k in p.split('.'):
    if isinstance(d,dict) and k in d: d=d[k]
    else: return False
  return True
missing=0
for f in glob.glob('src/components/onboarding/**/*.tsx',recursive=True)+['src/components/UnifiedOnboarding.tsx']:
  c=open(f).read()
  for m in re.findall(r\"t\(['\\\"]([^'\\\"]+)['\\\"]\",c):
    if not kx(vi,m) and not kx(vi,m+'_one') and not kx(vi,m+'_other'):
      print(f'❌ {f}: {m}'); missing+=1
print(f'\nMissing keys: {missing}')
"
```

Expected: 0 missing keys.

- [ ] **Step 2: Check for hardcoded Vietnamese strings**

```bash
grep -rn "aria-label=\"[^{]" src/components/onboarding/ src/components/UnifiedOnboarding.tsx | grep -v "t(" | head -20
```

Expected: No hardcoded aria-label strings (all should use t()).

- [ ] **Step 3: Record i18n findings**

---

## Task 14: Compile Audit Report

**Purpose:** Aggregate all findings into a prioritized spec document.

- [ ] **Step 1: Collect all findings**

Merge findings from Tasks 3-13 into categories:
- 🔴 **Critical**: Bugs blocking user flow
- 🟠 **High**: UX issues affecting experience
- 🟡 **Medium**: Code quality / performance
- 🟢 **Low**: Nice-to-have enhancements

- [ ] **Step 2: Write audit report spec**

Create `docs/superpowers/specs/2026-03-29-onboarding-audit-findings.md` with:

```markdown
# Onboarding Audit Findings

## Summary
- Total bugs found: N
- UX improvements: N
- Code optimizations: N
- Baseline: ESLint X, Tests X/X, Coverage X%

## Bug Reports (BUG-001 through BUG-NNN)
[structured entries per spec §6 template]

## UX Improvements (UX-001 through UX-NNN)
[structured entries per spec §6 template]

## Code Optimizations (OPT-001 through OPT-NNN)
[structured entries per spec §6 template]

## Business Logic Issues (BIZ-001 through BIZ-NNN)
[if any]

## Test Coverage Gaps
[list]

## Recommendations Priority Matrix
[Critical → High → Medium → Low]
```

- [ ] **Step 3: Commit audit report**

```bash
cd /Users/khanhhuynh/person_project/MealPlaning
git add docs/superpowers/specs/2026-03-29-onboarding-audit-findings.md
git commit -m "docs: add onboarding audit findings report

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Dependency Graph

```
Task 1 (Baseline) ──┐
                     ├──→ Task 2 (Build APK) ──→ Task 3-7 (Emulator Testing)
                     │
                     ├──→ Task 8 (ui-ux-pro-max)     ──┐
                     ├──→ Task 9 (web-design-guidelines) ──┤
                     ├──→ Task 10 (react-vite)          ──┤──→ Task 14 (Compile)
                     ├──→ Task 11 (shadcn/RHF/Zod)      ──┤
                     ├──→ Task 12 (Business Logic)       ──┤
                     └──→ Task 13 (i18n)                 ──┘
```

**Parallelization:** Tasks 8-13 code analysis can start in parallel with Task 1. However, visual UX review (Task 8) is richer after emulator screenshots from Tasks 3-7 are available. Tasks 3-7 are sequential (each flow needs fresh app data). Task 14 depends on all others.

**Orientation change ADB hint (EC-S05):**
```bash
# Enable auto-rotation then rotate
$ADB shell settings put system accelerometer_rotation 1
$ADB shell content insert --uri content://settings/system --bind name:s:user_rotation --bind value:i:1
# Rotate back
$ADB shell content insert --uri content://settings/system --bind name:s:user_rotation --bind value:i:0
```
