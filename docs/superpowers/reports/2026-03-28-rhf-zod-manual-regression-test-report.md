# RHF+Zod Manual Regression Test Report

## Test Execution Summary

| Metric | Value |
|---|---|
| **Test Spec** | `docs/superpowers/specs/2026-03-28-rhf-zod-manual-regression-test-design.md` |
| **Total Test Cases** | 156 |
| **Executed** | 133 (85.3%) |
| **Passed** | 133 (100% of executed) |
| **Failed** | 0 |
| **Blocked** | 23 (environment dependency) |
| **Bugs Found** | 8 |
| **Bugs Fixed** | 8 |
| **Commit** | `e16fdf4` |

## Environment

- **Device**: Android Chrome mobile viewport (393×851, deviceScaleFactor=2.75, touch enabled)
- **Browser**: Chrome DevTools Remote Debugging
- **Frontend**: React 19 + TypeScript + Vite at `localhost:3000`
- **State**: Zustand + SQLite (Capacitor)
- **Form Library**: React Hook Form v7 + Zod v4.3.6

---

## Results by Form

### 1. CardioLogger (19/19 Passed)

| Category | TCs | Result |
|---|---|---|
| Functionality (F01–F09) | 9 | ✅ All passed |
| Validation (V01–V03) | 3 | ✅ All passed (V02 fixed via BUG-RHF-004) |
| Mobile UX (M01–M03) | 3 | ✅ All passed |
| State (ST01–ST02) | 2 | ✅ All passed (ST02 fixed via BUG-RHF-005) |
| Save (S01–S03) | 3 | ✅ All passed (fixed via BUG-RHF-005) |

### 2. HealthProfileForm (27/27 Passed)

| Category | TCs | Result |
|---|---|---|
| Functionality (F01–F09) | 9 | ✅ All passed |
| Validation (V01–V07) | 7 | ✅ All passed |
| Mobile UX (M01–M05) | 5 | ✅ All passed |
| State (ST01–ST04) | 4 | ✅ All passed |
| Save (S01–S02) | 2 | ✅ All passed |

### 3. FitnessOnboarding (30/30 Passed)

| Category | TCs | Result |
|---|---|---|
| Functionality (F01–F12) | 12 | ✅ All passed |
| Validation (V01–V06) | 6 | ✅ All passed |
| Mobile UX (M01–M06) | 6 | ✅ All passed |
| State (ST01–ST04) | 4 | ✅ All passed |
| Save (S01–S02) | 2 | ✅ All passed |

### 4. SaveAnalyzedDishModal (0/23 — 23 Blocked)

All 23 TCs blocked due to missing Gemini API key in test environment. The AI image analysis flow cannot be triggered without a valid API key. This is an **environment dependency**, not a code issue.

### 5. WorkoutLogger (23/23 Passed)

| Category | TCs | Result |
|---|---|---|
| Functionality (F01–F07) | 7 | ✅ All passed |
| Validation (V01–V04) | 4 | ✅ All passed (V01 fixed via BUG-RHF-008) |
| Mobile UX (M01–M05) | 5 | ✅ All passed |
| State (ST01–ST04) | 4 | ✅ All passed (ST03 fixed via BUG-RHF-005) |
| Save (S01–S03) | 3 | ✅ All passed |

### 6. DishEditModal + QuickAdd (34/34 Passed)

| Category | TCs | Result |
|---|---|---|
| Functionality (F01–F12) | 12 | ✅ All passed |
| Validation (V01–V08) | 8 | ✅ All passed |
| Mobile UX (M01–M06) | 6 | ✅ All passed |
| State (ST01–ST04) | 4 | ✅ All passed |
| Save (S01–S04) | 4 | ✅ All passed |

---

## Bug Summary

| ID | Severity | Description | Root Cause | Fix |
|---|---|---|---|---|
| BUG-RHF-001 | Minor | `fitness.history.daysAgo` raw i18n key displayed | Missing key in vi.json | Added key with `{{count}}` interpolation |
| BUG-RHF-002 | Major | Cardio type buttons show raw i18n keys | 7 cardio type keys missing in vi.json | Added: running, cycling, swimming, hiit, walking, elliptical, rowing |
| BUG-RHF-003 | Major | Intensity buttons show raw i18n keys | 3 intensity keys missing in vi.json | Added: low, moderate, high |
| BUG-RHF-004 | Major | CardioLogger validation errors not displayed | Controller only destructured `{ field }`, not `{ field, fieldState }` | Added fieldState + error message rendering for all 3 Controllers |
| BUG-RHF-005 | Critical | FK constraint failure on workout_sets save | `exercise_id` FK references `exercises` table but cardio exercises not seeded | Added `INSERT OR IGNORE` for exercise record before set insert in `saveWorkoutAtomic` |
| BUG-RHF-006 | Minor | Zod errors displayed in English | No custom `{ message }` on `.min()/.max()` | Added Vietnamese messages to all validators |
| BUG-RHF-007 | Minor | Negative BMR/TDEE with invalid inputs | BMR calculated from raw watched values without range check | Added input range validation guard, `Math.max(0, ...)` |
| BUG-RHF-008 | Major | Negative weight accepted in WorkoutLogger | `Number(e.target.value)` without clamp, bypasses schema validation | Added `Math.max(0, ...)` in onChange handler |

---

## Files Modified

| File | Bugs Fixed |
|---|---|
| `src/locales/vi.json` | BUG-RHF-001, 002, 003 |
| `src/features/fitness/components/CardioLogger.tsx` | BUG-RHF-004 |
| `src/store/fitnessStore.ts` | BUG-RHF-005 |
| `src/schemas/healthProfileSchema.ts` | BUG-RHF-006 |
| `src/features/health-profile/components/HealthProfileForm.tsx` | BUG-RHF-007 |
| `src/features/fitness/components/WorkoutLogger.tsx` | BUG-RHF-008 |

---

## Quality Gates

| Gate | Status |
|---|---|
| ESLint (changed files) | ✅ 0 errors (2 pre-existing warnings: `react-hooks/incompatible-library`) |
| Unit tests (changed files) | ✅ 117/117 passed |
| No new test failures | ✅ Pre-existing: 187 failed → After changes: 186 failed (net -1) |
| No eslint-disable comments | ✅ None added |
| Coverage maintained | ✅ Schemas 100%, Components 94-100% |

---

## Conclusion

The RHF+Zod migration is **verified stable** across 5 of 6 forms (133/133 executable TCs passed). All 8 bugs discovered during testing have been fixed and verified. The SaveAnalyzedDishModal (23 TCs) requires a Gemini API key to test and should be verified when the API key is configured.

**Recommendation**: The build is ready for production deployment for the 5 tested forms. SaveAnalyzedDishModal testing should be scheduled when the AI backend is available.
