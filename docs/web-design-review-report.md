# Web Design Review Results — MealPlaning App

## Summary

| Item                           | Value                                                          |
| ------------------------------ | -------------------------------------------------------------- |
| **Target**                     | 464 screenshots from Android emulator (1080×2400, density 420) |
| **Framework**                  | React 19 + Vite 6 + Capacitor 8                                |
| **Styling**                    | Tailwind CSS v4 + shadcn/ui (base-nova)                        |
| **Tested Viewport**            | Mobile 411px (Capacitor WebView)                               |
| **Scenarios Reviewed**         | 10 (SC01–SC09 + SC_TEST)                                       |
| **Total Screenshots**          | 464                                                            |
| **P1 Issues (Critical)**       | 0                                                              |
| **P2 Issues (UX Degradation)** | 2                                                              |
| **P3 Issues (Minor)**          | 4                                                              |

---

## Overall Quality Assessment: ⭐⭐⭐⭐½ (Excellent)

The MealPlaning app demonstrates **very high design quality** across all 464 screenshots reviewed. The green-themed brand identity is consistent, layouts are clean and well-structured, Vietnamese text renders correctly throughout, validation errors are properly displayed, and all major user flows (onboarding, meal planning, nutrition tracking, settings, AI analysis) are visually polished.

---

## Design System Consistency ✅

| Element               | Assessment                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------- |
| **Brand Color**       | Green (#22c55e range) — consistent across CTAs, active tabs, highlights, progress indicators |
| **Cards**             | White/gray with ~12px rounded corners — uniform throughout                                   |
| **Typography**        | Consistent font sizing with clear hierarchy (headings > body > captions)                     |
| **Spacing**           | 16px padding standard on cards/containers, consistent margins                                |
| **Icons**             | Lucide-react icon set — uniform style across all features                                    |
| **Bottom Nav**        | 5 tabs with green underline indicator — consistent on every screen                           |
| **Validation Errors** | Red text (#ef4444) below fields — consistent pattern across all forms                        |
| **Empty States**      | Clear messaging with appropriate CTAs (e.g., "Chưa có món", "Không tìm thấy")                |
| **Dark Theme**        | Proper dark backgrounds with good text contrast — no missed elements                         |

---

## Detected Issues

### [P2] SC08 Steps 28–32: Screenshots Captured Wrong State

- **Scenario**: SC08 (Settings) — Steps 28 (BMR live update), 29 (BMR auto restored), 30 (search input), 31 (search no results), 32 (rapid cycle stable)
- **Issue**: All 5 screenshots show the **onboarding welcome screen** ("Chào mừng đến với Smart Meal Planner") instead of the intended Settings states. This appears to be a **test script issue** — the app was cleared/restarted and the script captured onboarding instead of navigating back to Settings.
- **Impact**: These screenshots do not verify the intended functionality (BMR live update, search, rapid cycle). Cannot confirm visual correctness of those specific Settings features from these screenshots alone.
- **Recommendation**: Re-run SC08 steps 28–32 test scripts ensuring the app navigates to Settings after onboarding completion before capturing screenshots. Ensure `pm clear` is followed by full onboarding completion.

### [P2] SC09 Steps 12–25: Multiple Screenshots Show Onboarding Instead of Goal Propagation

- **Scenario**: SC09 (Goal Settings) — Steps showing onboarding health form or welcome screen instead of the intended states:
  - Steps 12 (dashboard protein), 13 (protein bulk aggressive) → show health form with validation errors
  - Steps 14 (target bulk aggressive), 15 (calendar nutrition), 16 (rapid switch), 21 (energy detail), 22 (calendar bulk conservative), 23 (fitness tab), 24 (cut aggressive), 25 (bulk after reload) → show onboarding welcome screen
- **Issue**: The goal propagation verification screenshots were captured at the wrong app state. The test script appears to have triggered app restart/clear mid-test, losing the intended state context.
- **Impact**: Cannot verify cross-tab goal propagation visuals (dashboard protein display, calendar nutrition with different goals, energy detail sheet, fitness tab integration). The goal settings flow itself (SC09 steps 1–11) was reviewed in a prior batch and looks correct.
- **Recommendation**: Re-run SC09 propagation tests (steps 12–25) in a single session without `pm clear`. Follow the established pattern: complete onboarding → set goal → capture dashboard/calendar/energy/fitness screenshots in sequence.

---

### [P3] Large Nutrition Values — No Overflow but Unusual Display

- **Screenshot**: SC07_step25_val_large_amount.png
- **Element**: Nutrition summary bar at bottom of dish form
- **Issue**: Values "249998 KCal, 26000g Protein, 0g Carbs, 15000g Fat" display without overflow or text clipping — which is technically correct. However, there's no validation warning that these values are unrealistically high (e.g., 250K calories per serving).
- **Severity**: P3 — This is an edge case from validation testing with extreme values. The display handles it gracefully.
- **Recommendation**: Consider adding a soft warning for nutrition values exceeding reasonable thresholds (e.g., > 5000 kcal per dish) to help users catch input errors.

### [P3] Dish Form — Ingredient Search Shows "Không tìm thấy nguyên liệu" with Search Text Retained

- **Screenshots**: SC07_step20, SC07_step35
- **Element**: Ingredient search field shows "Thịt bò" with "Không tìm thấy nguyên liệu" message
- **Issue**: The search text "Thịt bò" is retained from a previous search. Since seed data should contain "Thịt bò" (one of the 10 default ingredients), this suggests the search was performed in a context where ingredients weren't loaded.
- **Severity**: P3 — May be a test setup issue rather than a real bug. The "no results" empty state itself is well-designed.
- **Recommendation**: Verify that ingredient search works correctly after full onboarding with seed data loaded.

### [P3] Star Rating Not Interactive-Looking

- **Screenshots**: SC07_step20, SC07_step35, SC07_step54
- **Element**: "ĐÁNH GIÁ" (Rating) section with 5 stars in dish form
- **Issue**: All 5 stars appear in the same dark gray color with no visual differentiation between selected/unselected states in the screenshots. This could make it unclear whether the stars are interactive or purely decorative.
- **Severity**: P3 — Minor UX clarity issue.
- **Recommendation**: Consider using filled stars (gold/yellow) for selected rating and outlined stars for unselected to make the interactive state clearer.

### [P3] "PHÙ HỢP CHO BỮA \*" Label Uses Red Asterisk Before Selection

- **Screenshots**: SC07_step35 (val_no_tag)
- **Element**: Meal type tag section label "PHÙ HỢP CHO BỮA \*"
- **Issue**: The asterisk and label turn red simultaneously with the error message "Vui lòng chọn ít nhất một bữa ăn phù hợp". While this effectively draws attention to the required field, the red label color makes the entire section appear "in error state" even before the user has attempted to interact with it (if validation triggers on save).
- **Severity**: P3 — The validation behavior is correct; this is a minor visual preference.
- **Recommendation**: Consider keeping the label in default color and only showing the red error message below, similar to how other fields (name, DOB) handle required validation.

---

## Unfixed Issues

> No code fixes were made during this review — this was a **read-only screenshot analysis**. All issues above are recommendations.

### Test Script Issues (Not Design Issues)

The following are **test infrastructure issues**, not app design problems:

| Issue                                 | Impact                                                | Recommended Action                                |
| ------------------------------------- | ----------------------------------------------------- | ------------------------------------------------- |
| SC08 steps 28–32 captured wrong state | Cannot verify BMR live update, search, rapid cycle UI | Re-run test script with proper navigation flow    |
| SC09 steps 12–25 captured wrong state | Cannot verify goal propagation cross-tab consistency  | Re-run in single session without mid-test restart |

---

## Positive Highlights 🌟

### Onboarding Flow (SC01)

- Beautiful green-themed welcome screens with emoji illustrations
- Progressive disclosure pattern (gender → name → DOB → height → weight)
- Activity level cards with icons are visually clear
- Strategy computing animation gives good feedback
- Step progress bar at top provides orientation

### Calendar & Meal Planning (SC01, SC02, SC03)

- Week-based navigation with green today highlight — immediately scannable
- "Bữa ăn" / "Dinh dưỡng" subtab switch is intuitive
- Action button row (Lên kế hoạch / AI / Đi chợ) is well-proportioned
- Meal slot cards with "Chưa có món" empty state + "+" button — clear affordance
- Unsaved changes dialog with 3 clear options

### Nutrition Tracking (SC03)

- Circular progress indicator for calorie tracking — clean and readable
- Linear progress bars for macros (protein/carbs/fat) — consistent
- Color-coded tips (green success, amber warning, blue info) — excellent UX
- Per-meal calorie breakdown — good information architecture
- Mini nutrition bars on meal cards — compact but informative

### Library & CRUD (SC06, SC07)

- Card-based dish/ingredient list with nutrition preview (CALO/PROTEIN badges)
- Sort dropdown + grid/list toggle + filter tabs — full toolkit without clutter
- Search with exact match results — responsive
- Toast notifications with "Hoàn tác" undo — follows best practices
- Validation errors: all red text clearly visible, immediate feedback

### AI Analysis (SC04, SC05)

- Step indicator (1→2→3) with green circles and arrow connectors — clear flow
- Dashed border upload zone — standard drop zone pattern
- Disabled button state when name empty — correct UX

### Settings (SC08)

- Clean section-based layout (Hồ sơ sức khỏe, Mục tiêu, Tập luyện, Dữ liệu, Giao diện)
- Dark theme fully applied with good contrast
- Multiple simultaneous validation errors display correctly without layout breakage

### Goal Settings (SC09)

- Cut/Maintain/Bulk card selection — clear visual distinction
- Rate options (Conservative/Moderate/Aggressive) — well-labeled
- BMR/TDEE/Target values displayed with clear labels

---

## Recommendations

### 1. Re-capture Missing Screenshots

Priority: **High**. SC08 steps 28–32 and SC09 steps 12–25 need to be re-run to verify BMR live update, search, rapid cycle, and goal propagation cross-tab consistency.

### 2. Consider Responsive Testing Beyond Mobile

The app is currently mobile-only (Capacitor), but if a web version is planned, test at tablet (768px) and desktop (1280px) viewports.

### 3. Accessibility Audit

While Vietnamese text contrast appears good throughout, consider:

- Running an automated color contrast check (WCAG AA compliance)
- Verifying all touch targets are ≥ 44×44px (most appear adequate)
- Adding `aria-label` to icon-only buttons if not already present

### 4. Edge Case Visual Testing

- Very long dish/ingredient names (> 40 chars) — verify text truncation behavior
- Many meals in one day (> 6 dishes per slot) — verify scroll behavior
- Calendar with plans spanning many weeks — verify week navigation performance

### 5. Consider Empty State Illustrations

Some empty states use only text ("Chưa có món"). Adding small illustrations or icons could make the empty experience feel more inviting, following the pattern already used in onboarding screens.

---

## Appendix: Screenshot Coverage Matrix

| Scenario  | Files   | Description                    | Key States Verified                                                                                       |
| --------- | ------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| SC01      | 93      | Onboarding + Calendar + Modals | Welcome, health form, activity, goal, strategy, calendar views, meal actions, confirmation dialogs        |
| SC02      | 38      | Meal Plan Editing              | Breakfast selection modal, unsaved changes dialog, meal slot interactions                                 |
| SC03      | 71      | Nutrition Tracking             | Empty state, 1-dish, multi-dish, charts, tips, progress bars, per-meal breakdown                          |
| SC04      | 24      | AI Analysis                    | Step indicators, upload zone, disabled states, long input, unicode/emoji                                  |
| SC05      | 11      | AI Analysis (Additional)       | No API key state, empty results, card containers                                                          |
| SC06      | 57      | Ingredients Management         | Add/edit/delete, validation (empty/negative/long), search, sort, toast undo                               |
| SC07      | 54      | Dishes Management              | Add/edit/delete, validation (empty name/no tag/large amounts), search, sort, filter, ingredient selection |
| SC08      | 32      | Settings                       | Dark theme, health profile validation, cloud sync, ⚠️ steps 28-32 wrong state                             |
| SC09      | 27      | Goal Settings                  | Goal detail, edit form, ⚠️ steps 12-25 wrong state (propagation not captured)                             |
| SC_TEST   | 2       | General Test                   | Calendar home screen — clean layout verified                                                              |
| **Total** | **464** |                                |                                                                                                           |

---

_Report generated from visual inspection of 464 emulator screenshots. No code changes were made during this review._
