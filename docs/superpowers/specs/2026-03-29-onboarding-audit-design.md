# Onboarding Full Audit — Design Spec

**Status:** Draft (v1)
**Date:** 2026-03-29
**Author:** AI (Copilot CLI)
**Scope:** Full audit of UnifiedOnboarding flow — UX, Code, Bugs, Performance

---

## 1. Problem Statement

The UnifiedOnboarding flow (7 sections, 13 components, ~1,747 LOC) needs a comprehensive audit to:
- Verify correctness on real Android device (emulator 5556)
- Identify UX improvements and accessibility gaps
- Optimize code quality and performance per React/Vite best practices
- Validate business logic (BMR/TDEE calculations, cross-field validation)
- Ensure form patterns (RHF + Zod) are consistent and bug-free

### Known Issues (User-Reported)
1. **Default values on first launch**: Form shows `heightCm: 170, weightKg: 70` — new user has no data, should show empty inputs with placeholders
2. **Number input "0" bug**: Clearing a number input shows "0" instead of empty — needs controlled input handling
3. **All forms must use RHF + Zod**: Verify consistency across all 13 onboarding components

---

## 2. Audit Framework — 6 Pillars

### Pillar 1: Emulator Testing (emulator-5556)
- Build debug APK → install on emulator 5556
- Test 6 major flows (3 experience × 2 strategy)
- Test ~25 edge cases (validation, navigation, state, UX)

### Pillar 2: UX/UI Review (ui-ux-pro-max skill)
- Visual design consistency (emerald color system, typography, spacing)
- Interaction design (touch targets ≥44pt, button states, animations)
- Dark mode completeness
- Progress indication clarity

### Pillar 3: Web Guidelines (web-design-guidelines skill)
- WCAG 2.1 AA compliance (contrast ≥4.5:1, focus indicators, ARIA)
- Semantic HTML (button vs div, label vs placeholder)
- Form input attributes (name, autocomplete, inputMode)
- prefers-reduced-motion respect
- Safe area insets (Capacitor Android)

### Pillar 4: Code Quality (react-vite-best-practices skill)
- React patterns (re-renders, useCallback deps, component size ≤200 lines)
- Vite optimization (lazy loading, bundle chunks, tree shaking)
- CSS-only animations vs JS where possible
- motion/react import size impact

### Pillar 5: Business Logic Verification
- BMR formula (Mifflin-St Jeor): Male `10×W + 6.25×H - 5×A + 5`, Female `10×W + 6.25×H - 5×A - 161`
- TDEE multipliers: sedentary=1.2, light=1.375, moderate=1.55, active=1.725, extra_active=1.9
- Calorie offsets: cut(-275/-550/-1100), maintain(0), bulk(+275/+550/+1100)
- Cross-field validation: cut target < current weight, bulk target > current weight
- BMI sanity check: 12 ≤ BMI ≤ 60
- Age from DOB calculation accuracy

### Pillar 6: Test & Coverage
- ESLint: record current error count as baseline
- Unit tests: record current pass/fail status as baseline
- Coverage: record current coverage percentage as baseline
- i18n key verification: all `t()` keys exist in vi.json

---

## 3. Test Matrix

### 3.1 Major Flows (6 flows)

| Flow | Experience | Strategy | Steps | Key Verifications |
|------|-----------|----------|-------|-------------------|
| F1 | Beginner | Auto | ~15 | Happy path, computing animation, plan preview |
| F2 | Beginner | Manual | ~12 | Skip computing, no plan generated |
| F3 | Intermediate | Auto | ~21 | +periodization, cycle, priority muscles, 1RM |
| F4 | Intermediate | Manual | ~18 | Advanced fields visible, no plan |
| F5 | Advanced | Auto | ~22 | +sleep hours, all fields visible, 1RM optional |
| F6 | Advanced | Manual | ~19 | Max complexity, no plan |

### 3.2 Edge Cases (~25 cases)

#### Validation Edge Cases
- EC-V01: Empty name → submit → validation error
- EC-V02: Height = 2 → height hint "nhập theo cm"
- EC-V03: Weight = 500 → over max validation
- EC-V04: BMI extreme (H=250, W=30) → BMI warning
- EC-V05: Cut goal + target ≥ current weight → error
- EC-V06: Bulk goal + target ≤ current weight → error
- EC-V07: DOB → age < 10 → age minimum warning
- EC-V08: Clear number input → shows "0" instead of empty (KNOWN BUG)
- EC-V09: First-time user sees default values instead of empty inputs (KNOWN BUG)

#### Navigation Edge Cases
- EC-N01: Back from Section 2, Step 0 → Section 1, last slide
- EC-N02: Back from Section 7 → Section 5 (Strategy Choice)
- EC-N03: Skip welcome slides → jump to Section 2
- EC-N04: Android hardware back button at each section
- EC-N05: Change experience mid-flow (back to Section 3 from Section 4)
- EC-N06: Auto path → back to Section 5 → switch to Manual (clearTrainingPlans?)

#### State & Persistence Edge Cases
- EC-S01: Kill app mid-Section 2 → resume from Section 2 start
- EC-S02: Kill app mid-Section 4 → document actual resume behavior (Section 3 or 4 start)
- EC-S03: Kill app after computing (Section 6) → resume at Section 7
- EC-S04: Clear app data → fresh start (full onboarding)
- EC-S05: Orientation change portrait↔landscape during onboarding

#### UX & Performance Edge Cases
- EC-U01: Double-tap Next button → should not skip 2 steps
- EC-U02: Rapid back/forward navigation → no UI glitch
- EC-U03: Computing screen — cannot go back (verify)
- EC-U04: Scroll overflow on small viewport (360dp width)
- EC-U05: Keyboard overlay covers input fields → should auto-scroll
- EC-U06: Dark mode toggle mid-onboarding flow

---

## 4. Skill Analysis Checklists

### 4.1 ui-ux-pro-max Checklist
- [ ] Visual design: color consistency, typography hierarchy, spacing rhythm
- [ ] Touch targets: all interactive elements ≥44pt (48dp Android)
- [ ] Button states: hover/active/disabled feedback
- [ ] Animation: slide transitions, computing steps, progress bar
- [ ] Dark mode: all 13 components render correctly
- [ ] Progress bar: section labels, fill accuracy

### 4.2 web-design-guidelines Checklist
- [ ] ARIA: roles, labels, describedby on all form fields
- [ ] Focus: visible focus indicators (focus-visible:ring-2)
- [ ] Semantic HTML: `<button>` for actions, `<label>` for inputs
- [ ] Form attributes: name, autoComplete, inputMode on all inputs
- [ ] prefers-reduced-motion: animations respect user preference
- [ ] transition-all: replace with specific properties
- [ ] aria-label: all via t() i18n function, not hardcoded

### 4.3 react-vite-best-practices Checklist
- [ ] Re-renders: useCallback dependency arrays correct
- [ ] Component size: each ≤200 lines (TrainingDetailSteps.tsx = 293 — needs audit)
- [ ] React.lazy: verify all lazy-loaded components have Suspense fallback
- [ ] Bundle: onboarding chunk separated from main app
- [ ] useForm: single instance, no redundant useReducer
- [ ] useWatch: targeted selectors, not watching entire form
- [ ] motion/react: tree-shakeable imports

### 4.4 RHF + Zod + shadcn-ui Checklist
- [ ] All 13 step components use form.control from parent useForm()
- [ ] Validation via trigger() with STEP_FIELDS mapping
- [ ] Number inputs: handle empty → NaN vs "0" edge case
- [ ] Default values: empty strings + placeholders instead of numeric defaults
- [ ] Audit custom inputs → propose shadcn Input/RadioGroup/Card replacements
- [ ] Zod schema: all field validations match spec §3 ranges

---

## 5. Execution Plan — 9 Phases

### Phase 1: Baseline Check
- Run `npx eslint src/components/UnifiedOnboarding.tsx src/components/onboarding/`
- Run `npx vitest run --reporter=verbose` for onboarding tests
- Run coverage: `npx vitest run --coverage` and note baseline

### Phase 2: Build APK
- `npm run build`
- `npx cap sync android`
- Build debug APK via Gradle or build script
- Verify APK size

### Phase 3: Emulator Testing
- `adb -s emulator-5556 install -r <apk>`
- Clear app data: `adb -s emulator-5556 shell pm clear com.mealplaner.app`
- Execute 6 flows (F1–F6) with screenshots at key points
- Execute 25 edge cases (EC-V01 through EC-U06)
- Log all bugs with severity, steps to reproduce, screenshots

### Phase 4: ui-ux-pro-max Analysis
- Invoke skill to review all 13 onboarding components
- Focus on visual consistency, interaction states, dark mode

### Phase 5: web-design-guidelines Analysis
- Invoke skill to audit accessibility compliance
- Focus on ARIA, focus management, semantic HTML

### Phase 6: react-vite-best-practices Analysis
- Invoke skill to audit code quality and performance
- Focus on re-renders, bundle size, lazy loading

### Phase 7: Business Logic Verification
- Verify BMR/TDEE formulas against Mifflin-St Jeor standard
- Test calorie offset calculations for all 7 goal+rate combinations
- Verify macro split percentages
- Verify DOB → age calculation edge cases (leap year, Dec 31 births)

### Phase 8: RHF + Zod + shadcn-ui Audit
- Verify all forms use RHF + Zod consistently
- Identify the "clear input → 0" bug root cause
- Audit default values → recommend empty + placeholder approach
- List shadcn-ui component replacement opportunities

### Phase 9: Compile Audit Report
- Aggregate all findings into prioritized categories:
  - 🔴 **Critical**: Bugs blocking user flow
  - 🟠 **High**: UX issues affecting user experience
  - 🟡 **Medium**: Code quality / performance improvements
  - 🟢 **Low**: Nice-to-have enhancements
- Write final spec document
- Run spec review loop
- User review gate

---

## 6. Output Format

### Bug Report Template
```
BUG-XXX: [Title]
Severity: Critical/High/Medium/Low
Component: [file path]
Steps to Reproduce:
  1. ...
  2. ...
Expected: ...
Actual: ...
Evidence: [screenshot/log]
Root Cause: [analysis]
Proposed Fix: [approach]
```

### UX Improvement Template
```
UX-XXX: [Title]
Priority: High/Medium/Low
Impact: [user experience description]
Current: [how it works now]
Proposed: [how it should work]
Component(s): [files affected]
```

### Code Optimization Template
```
OPT-XXX: [Title]
Category: Performance/Pattern/Bundle/Accessibility
File(s): [paths]
Current: [code snippet or pattern]
Proposed: [improved approach]
Benefit: [measurable impact]
```

---

## 7. Constraints & Decisions

1. **Audit only, no implementation** — This spec produces a findings report. Implementation is a separate phase.
2. **All forms use RHF + Zod** — Verify consistency, not introduce new form library.
3. **shadcn-ui for components** — Propose replacements but don't implement yet.
4. **Empty inputs for new users** — Replace default numeric values with empty + placeholders.
5. **Emulator 5556** — All testing on this specific emulator instance.
6. **Skills used**: ui-ux-pro-max, web-design-guidelines, react-vite-best-practices, shadcn-ui.
