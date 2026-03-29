# Onboarding Full Audit — Findings Report

> **Date:** 2026-03-29
> **Auditor:** AI Copilot (6 specialized analysis agents + emulator testing)
> **Spec:** `docs/superpowers/specs/2026-03-29-onboarding-audit-design.md`
> **Plan:** `docs/superpowers/plans/2026-03-29-onboarding-audit.md`

---

## Executive Summary

| Category | 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low | Total |
|----------|------------|---------|-----------|--------|-------|
| UX / Usability | 2 | 3 | 9 | 7 | 21 |
| Accessibility (WCAG 2.1 AA) | 4 | 6 | 8 | 3 | 21 |
| Form / Validation (RHF+Zod) | 3 | 2 | 5 | 3 | 13 |
| React / Performance | 0 | 3 | 6 | 6 | 15 |
| Business Logic | 1 | 0 | 2 | 3 | 6 |
| i18n | 0 | 1 | 0 | 0 | 1 |
| **Total** | **10** | **15** | **30** | **22** | **77** |

### Baseline (before audit)

- **ESLint:** 0 errors, 0 warnings ✅
- **Unit Tests:** 168/168 passed ✅
- **Coverage:** Overall 97.19% line / 90.31% branch; Onboarding 99.64% line / 87.15% branch ✅
- **Build:** Vite build 2.02s, `onboarding-advanced` chunk 164.50 kB (43.85 kB gzip)

### Emulator-Confirmed Findings (emulator-5556, 1080×2400, density 420)

| ID | Finding | Status |
|----|---------|--------|
| EMU-001 | Height=170, Weight=70 shown as real values to new users | 🔴 Confirmed |
| EMU-002 | Android Back button EXITS APP instead of navigating to previous step | 🔴 Confirmed |
| EMU-003 | Validation error messages display correctly in Vietnamese | ✅ Working |
| EMU-004 | Welcome slide swipe gesture does NOT work (only button tap) | 🟠 Confirmed |
| EMU-005 | Large empty space above icon in welcome slides (not vertically centered) | 🟡 Confirmed |
| EMU-006 | Progress bar, dot indicators, section labels all render correctly | ✅ Working |
| EMU-007 | Slide transitions animate correctly between welcome slides | ✅ Working |

---

## 🔴 CRITICAL Findings (10)

### C-001: Android Back Button Exits App During Onboarding
- **Category:** UX / Navigation
- **Source:** Emulator testing (EMU-002)
- **File:** `src/components/UnifiedOnboarding.tsx`
- **Description:** Pressing the Android hardware Back button on any onboarding step immediately exits the app to the home screen. Users expect Back to navigate to the previous onboarding step.
- **Impact:** Users lose all onboarding progress on accidental back press. Critical for Android UX.
- **Fix:** Register `backButton` listener via `@capacitor/app` in UnifiedOnboarding:
  ```tsx
  import { App } from '@capacitor/app';
  useEffect(() => {
    const listener = App.addListener('backButton', () => {
      if (currentStep > 0) goBack();
      // else: show exit confirmation or do nothing
    });
    return () => { listener.remove(); };
  }, [currentStep, goBack]);
  ```

### C-002: Default Values (170cm/70kg) Mislead New Users
- **Category:** UX / Form
- **Source:** Emulator (EMU-001) + Code analysis (FORM-015, UX-017)
- **File:** `src/components/UnifiedOnboarding.tsx:89-102`
- **Description:** New users see `heightCm=170` and `weightKg=70` pre-filled as if it's their data. This causes: (a) users may skip entering their real values, (b) creates impression of someone else's profile.
- **Impact:** Incorrect BMR/TDEE/calorie calculations for users who don't change defaults.
- **Fix:** Set `heightCm: undefined`, `weightKg: undefined` in defaultValues. Use `placeholder="170"` on inputs. Update schema to handle `undefined` → validation error.

### C-003: Clearing Number Input Shows "0" Instead of Empty
- **Category:** Form / Input Bug
- **Source:** Code analysis (FORM-011, FORM-012, UX-018)
- **File:** `src/components/onboarding/HealthBasicStep.tsx:112, 136`
- **Description:** `Number("") === 0`. When user clears height/weight input, the form stores `0` and displays it. Fix pattern already proven in `NutritionGoalStep.tsx:115`:
  ```tsx
  // Broken:
  onChange={(e) => field.onChange(Number(e.target.value))}
  // Fixed:
  onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
  ```

### C-004: Cross-Field Validation Never Runs
- **Category:** Form / Zod
- **Source:** Code analysis (FORM-010)
- **File:** `src/components/onboarding/onboardingSchema.ts:39-64`
- **Description:** The `superRefine` checks (goalType='cut' but targetWeightKg > weightKg, BMI warnings) only run on `form.handleSubmit()`, which is never called. Step-by-step `trigger()` only validates individual fields. Users can complete onboarding with contradictory data.
- **Impact:** Data integrity — cut goal with higher target weight, bulk with lower target weight.
- **Fix:** Move cross-field validation to `HealthConfirmStep.handleConfirm()` or call `form.trigger()` on full schema.

### C-005: bodyFatPct Not Divided by 100 in useNutritionTargets
- **Category:** Business Logic / Macros
- **Source:** Code analysis (BIZ-001)
- **File:** `src/features/health-profile/hooks/useNutritionTargets.ts:84`
- **Description:** `bodyFatPct` passed directly to `calculateMacros()` without `/100` conversion. User enters `20` (for 20%), but formula uses `effectiveWeight = weight * (1 - 20)` = **negative number**. Existing test masks this by using `0.15`.
- **Impact:** Users with body fat % set get **negative protein/carb targets**.
- **Fix:** `calculateMacros({ ...params, bodyFatPct: profile.bodyFatPct ? profile.bodyFatPct / 100 : undefined })`

### C-006: Form Inputs Missing aria-describedby for Error Messages
- **Category:** Accessibility / WCAG 1.3.1
- **Source:** A11Y audit (A11Y-001)
- **Files:** `HealthBasicStep.tsx:46,87,107,132`, `NutritionGoalStep.tsx:109`
- **Description:** Error messages are visually rendered but not programmatically associated with inputs. Screen readers cannot announce which error belongs to which field.
- **Fix:** Add `aria-describedby={error ? "ob-name-error" : undefined}` + `id="ob-name-error" role="alert"` on error paragraphs.

### C-007: Form Inputs Missing aria-invalid on Validation Failure
- **Category:** Accessibility / WCAG 3.3.1
- **Source:** A11Y audit (A11Y-002)
- **Files:** Same as C-006
- **Description:** No `aria-invalid={!!fieldState.error}` on inputs.

### C-008: Button Groups Missing role="radiogroup" + role="radio" + aria-checked
- **Category:** Accessibility / WCAG 4.1.2
- **Source:** A11Y audit (A11Y-003)
- **Files:** 10 button groups across HealthBasicStep, ActivityLevelStep, NutritionGoalStep, TrainingCoreStep, TrainingDetailSteps
- **Description:** Single-select button groups use plain `<button>` without radiogroup semantics. Screen readers cannot convey selection state.

### C-009: Multi-Select Equipment Missing role="group" + role="checkbox" + aria-checked
- **Category:** Accessibility / WCAG 4.1.2
- **Source:** A11Y audit (A11Y-004)
- **File:** `src/components/onboarding/TrainingDetailSteps.tsx:121-137`
- **Description:** Equipment multi-select uses plain buttons without checkbox semantics.

### C-010: Fire-and-Forget Profile/Goal Save
- **Category:** UX / Data Integrity
- **Source:** UX audit (UX-024)
- **File:** `src/components/onboarding/HealthConfirmStep.tsx:55-76`
- **Description:** `saveProfile()` and `saveGoal()` are called without `await`. If save fails silently, user has no way to know. Combined with BIZ-002 (missing fields) and BIZ-003 (missing calorieOffset), this creates data loss risk.
- **Fix:** `await saveProfile(...)`, add try/catch with error toast.

---

## 🟠 HIGH Findings (15)

### H-001: Onboarding Saves Profile Missing Required Fields
- **Source:** BIZ-002
- **File:** `HealthConfirmStep.tsx:56-66`
- **Description:** `saveProfile()` called without `id`, `proteinRatio`, `fatPct`, `targetCalories`. DB columns may get NULL.

### H-002: Onboarding Saves Goal Without calorieOffset
- **Source:** BIZ-003
- **File:** `HealthConfirmStep.tsx:68-72`
- **Description:** Goal saved without computing `getCalorieOffset(goalType, rateOfChange)`. Cut/bulk users get maintenance calories.

### H-003: No Focus Management on Step Transitions
- **Source:** A11Y-009
- **Files:** All step components
- **Description:** When step changes, focus stays at previous location. Screen reader users don't know the content changed.

### H-004: Heading Hierarchy Broken (h2 without h1)
- **Source:** A11Y-011
- **Files:** All step components except WelcomeSlides
- **Description:** After WelcomeSlides unmounts, page has `<h2>` with no `<h1>`.

### H-005: All Form Inputs Missing `name` Attribute
- **Source:** A11Y-013
- **Files:** `HealthBasicStep.tsx`, `NutritionGoalStep.tsx`
- **Description:** No `name="name"`, `name="heightCm"`, etc. Affects autofill and accessibility.

### H-006: Dynamic Error Messages Not in aria-live Region
- **Source:** A11Y-005
- **Description:** Validation errors appear but screen readers don't announce them.

### H-007: Fixed Bottom Nav Missing pb-safe (8 instances)
- **Source:** A11Y-017, UX-022
- **Files:** HealthBasicStep, ActivityLevelStep, NutritionGoalStep, HealthConfirmStep, TrainingCoreStep, TrainingDetailSteps (×2), PlanPreviewScreen
- **Description:** On iOS devices with home indicator, buttons overlap the gesture bar.

### H-008: Hardcoded English aria-label "Slide indicator"
- **Source:** A11Y-006, i18n check
- **File:** `WelcomeSlides.tsx:47`
- **Description:** Only English string in the entire onboarding. Needs i18n key.

### H-009: Zod Error Messages in English (Not i18n)
- **Source:** FORM-005
- **File:** `onboardingSchema.ts:5-9`
- **Description:** Schema uses Zod default English messages. Only the `superRefine` uses i18n keys.

### H-010: Welcome Slides Don't Support Swipe Gesture
- **Source:** Emulator testing (EMU-004)
- **File:** `WelcomeSlides.tsx`
- **Description:** Mobile users expect to swipe between slides. Only the button works.

### H-011: slideVariants Object Recreated Every Render
- **Source:** OPT-001
- **File:** `UnifiedOnboarding.tsx:73-82`
- **Description:** `slideVariants` defined inside component body, creates new object reference every render. Move outside or memoize.

### H-012: stepProps Not Memoized
- **Source:** OPT-002
- **File:** `UnifiedOnboarding.tsx:159-167`
- **Description:** `stepProps` object recreated every render, causes all step children to re-render.

### H-013: form.watch() Instead of useWatch()
- **Source:** OPT-003
- **File:** `TrainingDetailSteps.tsx:26`
- **Description:** `form.watch('experience')` causes entire component tree to re-render on any field change. Use `useWatch({ name: 'experience', control: form.control })`.

### H-014: dateOfBirth Schema Missing Date Validation
- **Source:** FORM-006
- **File:** `onboardingSchema.ts:7`
- **Description:** Only `z.string().min(1)` — no check for valid date or future dates. Native date picker provides some protection, but schema should be the contract.

### H-015: No Disabled State on "Tiếp tục" When Form Invalid
- **Source:** UX-008
- **Description:** Button looks active but validation fires on tap. Should show disabled state or loading state.

---

## 🟡 MEDIUM Findings (30)

### M-001: ActivityLevelStep Skips trigger() Validation (FORM-001)
### M-002: TrainingDetailSteps Sub-Steps Skip trigger() Validation (FORM-002)
### M-003: sessionDuration/cardioSessions/sleepHours Missing Min/Max in Zod (FORM-007/008/009)
### M-004: HealthConfirmStep Uses getValues() Not Reactive (FORM-003)
### M-005: Conditional Fields Appear Without Screen Reader Notification (A11Y-008)
### M-006: No Focus Trap During Computing Screen (A11Y-010)
### M-007: Labels Not Programmatically Associated with Button Groups (A11Y-012)
### M-008: Date of Birth Input Missing autoComplete="bday" (A11Y-014)
### M-009: Slide Transitions Don't Explicitly Handle prefers-reduced-motion (A11Y-015)
### M-010: StepFallback Spinner Has No Accessible Label (A11Y-019)
### M-011: PlanComputingScreen Spinner No Accessible Label (A11Y-020)
### M-012: PlanStrategyChoice Back Button Not in Safe Area (A11Y-018)
### M-013: Progressbar Missing aria-valuemin (A11Y-007)
### M-014: Variable Named 'bmr' Is Actually TDEE (BIZ-005)
### M-015: TrainingCoreStep Shows Error Messages Below Button Groups (UX-009)
### M-016: Nutrition Goal Step Conditional Show/Hide Lacks Animation (UX-011)
### M-017: Confirm Screen Has No Loading/Skeleton State (UX-023)
### M-018: PlanPreviewScreen Missing Empty State for restDays (UX-021)
### M-019: goNext/goBack Dependencies Spread Operator (OPT-005)
### M-020: TrainingDetailSteps 293 Lines (Exceeds 200-Line Limit) (OPT-006)
### M-021: PlanComputingScreen 227 Lines (Exceeds 200-Line Limit) (OPT-007)
### M-022: HealthConfirmStep Inline BMR/TDEE Calc (OPT-008)
### M-023: ActivityLevel Constants Duplicated (OPT-009)
### M-024: No Error Boundary Around Lazy-Loaded Steps (OPT-010)
### M-025: Lazy Imports Inside Component Body (OPT-011)
### M-026: Schema Uses Loose z.string() Where Enums Should Be (OPT-012)
### M-027: No SSR-Safe Guard for AnimatePresence (OPT-013)
### M-028: Date Picker Ignores Dark Mode in Android WebView (UX-013)
### M-029: HealthConfirmStep "..." Saving State Not Accessible (A11Y-022)
### M-030: Unsafe Type Assertions in TrainingDetailSteps (OPT-004)

---

## 🟢 LOW Findings (22)

### L-001: Welcome Slide Content Not Vertically Centered (UX-001)
### L-002: Skip Button ("Bỏ qua") Missing Confirmation Dialog (UX-002)
### L-003: No Haptic Feedback on Pill Selection (UX-003)
### L-004: Gender Pills Missing Icons (UX-004)
### L-005: Activity Level Cards Could Show Calorie Impact (UX-005)
### L-006: Date Picker Has No Max Date Constraint (UX-006)
### L-007: No Character Counter on Name Input (UX-007)
### L-008: Training Goal Cards Could Show Difficulty Badge (UX-010)
### L-009: Equipment Selection No "Select All" Option (UX-012)
### L-010: Computing Screen Timer Not Visible (UX-014)
### L-011: Plan Preview Missing Export/Share (UX-015)
### L-012: No Confetti/Celebration on Completion (UX-016)
### L-013: Hardcoded Vietnamese Day Abbreviations (UX-025)
### L-014: Fitness Bridge Hardcodes Protein Ratio 1.6 (BIZ-004)
### L-015: Inconsistent bmrOverride Falsy Handling (BIZ-006)
### L-016: transition-colors Missing motion-safe: Prefix (12 Instances) (A11Y-016)
### L-017: Emoji '💪' Not aria-hidden (A11Y-021)
### L-018: Missing onboarding-core Chunk Split (OPT-014)
### L-019: No Preload Hints for Next Step Chunk (OPT-015)
### L-020: Text Inputs Should Use shadcn Input (FORM-017/018)
### L-021: Labels Should Use shadcn Label (FORM-019)
### L-022: Button Groups Should Use shadcn ToggleGroup/RadioGroup (FORM-020-024)

---

## Recommended Fix Priority

### Sprint 1: Critical Bug Fixes (Must-Fix)
1. **C-001** Android Back button handler (1h)
2. **C-002 + C-003** Default values + "0" bug (2h)
3. **C-004** Cross-field validation (1h)
4. **C-005** bodyFatPct /100 conversion (30min)
5. **C-010 + H-001 + H-002** Save integrity: await + missing fields + calorieOffset (2h)

### Sprint 2: High Priority (Should-Fix)
6. **H-003 through H-009** Accessibility critical (ARIA roles, focus, heading, name, live regions) (4h)
7. **H-010** Swipe gesture on welcome slides (1h)
8. **H-011 through H-013** Performance (memoization, useWatch) (2h)
9. **H-014 + H-015** Schema hardening + disabled button state (1h)

### Sprint 3: Medium Priority (Improve)
10. **M-001 through M-030** Form consistency, component splits, safe areas, reduced motion (8h)

### Sprint 4: Polish (Nice-to-Have)
11. **L-001 through L-022** shadcn adoption, UX polish, micro-interactions (12h)

---

## Appendix A: Emulator Test Evidence

| Screenshot | Description |
|-----------|-------------|
| `audit-s1-welcome-loaded.png` | Welcome Slide 1 — content renders correctly |
| `audit-s1-slide2-v2.png` | Welcome Slide 2 — transition works, dots update |
| `audit-f1-health-basic.png` | Health Basic Step — default values 170/70 visible |
| `audit-f1-validation-empty-name.png` | Validation — "Trường này là bắt buộc" for name & DOB |
| `audit-f1-back-button.png` | Android Back — exits to home screen |

## Appendix B: Coverage Gaps (Branch Coverage < 90%)

| File | Line % | Branch % | Gap |
|------|--------|----------|-----|
| HealthConfirmStep | 100% | 66.66% | save error paths |
| NutritionGoalStep | 100% | 77.77% | conditional show/hide |
| HealthBasicStep | 100% | 80.00% | date validation edge |
| OnboardingProgress | 100% | 83.33% | boundary conditions |

## Appendix C: Bundle Size

| Chunk | Size | Gzip |
|-------|------|------|
| `onboarding-advanced` | 164.50 kB | 43.85 kB |
| `index` (main) | 462.06 kB | 110.74 kB |
| `vendor-react` | 192.84 kB | 49.87 kB |
| `vendor-ui` | 149.11 kB | 37.97 kB |

**Recommendation:** Split `onboarding-advanced` into `onboarding-core` (first 5 steps, ~80 kB) and `onboarding-advanced` (computing + preview, ~85 kB). Users may complete onboarding before loading the advanced chunk.

---

## Appendix D: What's Working Well ✅

- **Vietnamese i18n**: All UI text properly translated (except 1 aria-label)
- **Validation UX**: Error messages display clearly in Vietnamese
- **Step Layout**: Consistent header/description/content/footer pattern
- **Progress Bar**: Segmented design is more informative than single bar
- **Lazy Loading**: All 9 step components lazy-loaded
- **Touch Targets**: All buttons meet 44px minimum
- **Decorative Icons**: All Lucide icons have `aria-hidden="true"`
- **Computing Screen**: Has `aria-live="polite"` + `useReducedMotion`
- **Form Architecture**: RHF + Zod centralized schema is well-structured
- **Test Coverage**: 168 tests, 99.64% line coverage
