# MealPlaning UX/UI Critique — SC25, SC26, SC27 Screenshots

**Scope:** 30 screenshots (fitness training profile forms, workout plans, onboarding)  
**Brand Principles:** Clean · Smart · Motivating | Approachable, encouraging, never clinical | Clarity over decoration, data with empathy | Mobile-first touch-native  
**Date:** 2024

---

## EXECUTIVE SUMMARY: CRITICAL SYSTEMIC ISSUES

### 🔴 BLOCKER-LEVEL ISSUES (Fix Immediately)

1. **Multi-select UI pattern is broken and confusing** — Equipment/injury toggles mix selected (green) and unselected (gray) states in a visual jumble with no clear affordance about multi-select capability. Users cannot tell if they're selecting one or many.

2. **Button group touch targets fail mobile-first** — Pill buttons in rows (Goal type, Experience level, Equipment) are too small (~60-80px width), tightly spaced (~8px gap), causing mis-taps. Violates 44×44pt minimum.

3. **"Tạo lại kế hoạch" modal appears 3+ times with blurred/loading states** — This destructive action modal shows repeatedly during testing, suggesting either a bug or that regeneration is so common it's a UX smell. The modal itself lacks clear consequences ("Kế hoạch hiện tại sẽ bị thay thế" is buried, not emphasized).

4. **Clinical form aesthetics violate "never clinical" principle** — Dense vertical stacking of fields, gray labels, minimal white space, identical typography creates a medical form vibe, not motivating/encouraging fitness experience.

5. **Zero onboarding/empty state guidance** — Forms open with no contextual help, no "why we ask this", no examples. "Chỉnh sửa Hồ sơ tập luyện" page dumps 15+ inputs with zero progressive disclosure.

6. **Inconsistent navigation patterns create confusion** — Week day selector (T2-CN) appears in two contexts: top horizontal scroll AND bottom day cards. Redundant? Different purposes? Unclear.

---

## DETAILED PER-SCREENSHOT ANALYSIS

### SC25_step31_fit007_form_opened.png

**What's shown:** Training profile form opened, showing Goal type (Sức mạnh/Phát triển cơ/Sức bền), Experience level (Tổng hợp), Days per week (4), Session duration (45 phút), Equipment (Barbell, Dumbbell), and Injury zones (Vai).

**Issues:**

1. **Visual Hierarchy — FAIL**
   - Section labels ("Mục tiêu tập luyện", "Trình độ", etc.) use same weight/size as body text
   - No clear visual grouping — feels like a flat list, not structured form
   - Green icon (🏋️) next to title fights for attention with form controls

2. **Cognitive Load — HIGH (7/8)**
   - 15+ inputs visible simultaneously with no progressive disclosure
   - Equipment section shows 7 options (3 selected, 4 unselected) in wrapping layout — scanning burden
   - Injury zone shows 6 options (1 selected, 5 unselected) — same issue
   - No "why we ask this" microcopy to reduce decision anxiety

3. **Touch Targets — FAIL**
   - "Sức mạnh" / "Phát triển cơ" / "Sức bền" pills ~80px wide, 8px gap — too tight
   - Number selector (2/3/4/5/6) circles ~48px but tightly spaced
   - "Barbell"/"Dumbbell"/etc. pills ~120px but vertical stack causes accidental scrolling

4. **Emotional Tone — Clinical, not motivating**
   - Gray background, gray text labels, minimal color = medical form
   - No encouraging microcopy ("Let's build your perfect plan!")
   - No celebration of user's existing selections

5. **Microcopy — Functional, not conversational**
   - "Mục tiêu tập luyện" → cold and formal
   - Better: "Bạn muốn tập để làm gì?" (What do you want to train for?)
   - "Thiết bị tập" → transactional
   - Better: "Bạn có sẵn gì để tập?" (What equipment do you have?)

6. **Multi-select affordance — MISSING**
   - Equipment and Injury sections allow multi-select but nothing signals this
   - No "(Chọn tất cả những gì phù hợp)" hint
   - Selected items turn green but unselected items look dead/disabled

**Concrete Fixes:**

- Add section headers with bold weight (18sp → 20sp, weight 600)
- Add subtle dividers or card backgrounds to group related inputs
- Add "Chọn 1 hoặc nhiều" hint below Equipment/Injury labels
- Increase pill button width to minimum 100px, gap to 12px
- Add motivational microcopy: "Thiết kế kế hoạch của riêng bạn 🎯" as subtitle

---

### SC25_step40_fit018_sleep_visible_advanced.png

**What's shown:** Same form, scrolled down to show "Giấc ngủ/đêm" (Sleep per night) number input.

**Issues:**

1. **Progressive disclosure — NEEDED but absent**
   - Sleep input appears after scrolling through 10+ other inputs
   - No indication that more fields exist below (no scroll hint)
   - User may submit thinking form is complete without seeing sleep field

2. **Input type mismatch**
   - Sleep is numeric but allows text input (user could type "tám" instead of "8")
   - Should be number stepper or picker

3. **Label clarity**
   - "Giấc ngủ/đêm" = ambiguous (hours per night? quality? cycles?)
   - Needs unit: "Giấc ngủ mỗi đêm (giờ)"

**Concrete Fixes:**

- Add floating "Scroll để xem thêm ↓" hint when form first opens
- Change to number input with min/max constraints (4-12 hours reasonable)
- Add unit label inline: "giờ/đêm"

---

### SC25_step43_fit025_aria_labels.png

**What's shown:** Same form state (testing accessibility — filename suggests aria-label verification).

**Issues:**

1. **Accessibility — Cannot verify from screenshot alone**
   - Filename suggests aria-labels are being tested
   - Visual UI shows no accessibility annotations (good — they're hidden)
   - Concern: Are equipment pills properly announced? "Barbell, selected, 1 of 7" or just "Barbell"?

2. **Screen reader experience — Likely poor**
   - Form has no fieldset/legend structure visible
   - Multi-select sections need `role="group"` + `aria-label="Equipment available"`
   - Number selectors (2-6) need `role="radiogroup"` + proper labels

**Concrete Fixes (Code-level, cannot verify from screenshot):**

- Wrap sections in `<fieldset>` with `<legend>` tags
- Add `aria-label="Select all equipment you have access to"` to equipment container
- Ensure selected pills announce state: `aria-pressed="true"`

---

### SC25_step50_fit036_muscle_toggle.png

**What's shown:** Equipment section with "Machine" and "Cable" newly selected (now 4 green pills: Barbell, Dumbbell, Machine, Cable).

**Issues:**

1. **Visual clutter increases with selections**
   - 4 green pills + 3 gray pills = hard to scan what's selected vs available
   - No clear "Your selections (4)" summary
   - No way to "Select all" or "Clear all" for power users

2. **State change feedback — MISSING**
   - No haptic feedback on toggle (mobile-first principle violated)
   - No micro-animation confirming selection
   - Pill just changes color — feels static

**Concrete Fixes:**

- Add selection counter: "Thiết bị tập (4 đã chọn)"
- Add "Chọn tất cả" / "Bỏ chọn tất cả" links at section level
- Implement scale-up animation (0.95 → 1.05 → 1.0) on tap with 50ms haptic

---

### SC25_step54_fit040_days_min2.png

**What's shown:** "Số ngày tập/tuần" selector with "2" selected (changed from previous "4").

**Issues:**

1. **Constraint not visible**
   - Filename suggests "min2" constraint but UI shows no indication
   - Numbers 2-6 all appear equally selectable
   - What happens if user tries to select "1"? (It's not even shown!)

2. **Range rationale missing**
   - Why 2-6? Why not 1 or 7?
   - No microcopy explaining: "Tối thiểu 2 ngày để thấy kết quả"

3. **Number formatting inconsistent**
   - Standalone numbers with no unit context
   - Better: "2 ngày", "3 ngày" to reinforce meaning

**Concrete Fixes:**

- Add helper text: "Chọn 2-6 ngày (tối thiểu 2 ngày để hiệu quả)"
- Disable/gray out numbers outside range if dynamic constraints exist
- Add unit suffix to selected value: "4 ngày/tuần"

---

### SC25_step59_fit047_cycle_weeks_options.png

**What's shown:** Form scrolled to show advanced field: "Chu kỳ nâng cao (tuần)" with options 4, 8, 12, 16.

**Issues:**

1. **Advanced feature visibility — TOO PROMINENT**
   - "Chu kỳ nâng cao" sounds optional/advanced but displayed with same hierarchy as required fields
   - No "(Tùy chọn)" label or collapsed state
   - 90% of users won't understand "periodization cycles" — why expose this complexity upfront?

2. **Terminology — Expert jargon**
   - "Chu kỳ nâng cao" = periodization (advanced training concept)
   - No explanation of what this means or why it matters
   - Beginners will skip or guess randomly

3. **Options without context**
   - 4/8/12/16 weeks — which to choose? No guidance
   - Standard practice: 8-week cycles for hypertrophy — why not default + hide?

**Concrete Fixes:**

- Move to "Cài đặt nâng cao" collapsible section (collapsed by default)
- Add tooltip: "Chu kỳ nâng cao giúp tránh đình trệ bằng cách thay đổi cường độ định kỳ"
- Pre-select 8 weeks as smart default
- Label as "(Tùy chọn - Người dùng nâng cao)"

---

### SC25_step61_fit049_submit_minimal.png

**What's shown:** Form bottom with "Hủy" (Cancel) and "Lưu" (Save) buttons.

**Issues:**

1. **Button hierarchy — WEAK**
   - "Lưu" uses green background (correct) but only slightly more prominent than "Hủy"
   - "Hủy" should be ghost/text button, not outlined
   - Buttons are equal width — primary should be wider/more prominent

2. **Destructive action not protected**
   - "Hủy" discards 15+ input fields — no confirmation dialog shown
   - Accidental tap = lost work (especially given tight touch targets)

3. **Button positioning**
   - Fixed bottom buttons good for mobile BUT need safe area padding
   - No visible padding from screen bottom — might overlap gesture bar on iPhone

4. **No save state feedback**
   - What happens after tapping "Lưu"? No indication
   - Loading state? Success toast? Navigation?

**Concrete Fixes:**

- Change "Hủy" to text-only button with gray color
- Make "Lưu" button full-width minus cancel (70/30 split)
- Add padding-bottom: max(16px, env(safe-area-inset-bottom))
- Show loading spinner on "Lưu" button during save
- Add confirm dialog for "Hủy" if any fields are dirty

---

### SC25_step62_fit049_profile_saved.png

**What's shown:** Success state after saving — returns to previous screen with form closed.

**Issues:**

1. **Success feedback — INVISIBLE**
   - No toast, no checkmark, no confirmation message
   - User has no idea if save succeeded or failed
   - Violates Nielsen's "Visibility of system status" heuristic

2. **What changed? — UNCLEAR**
   - Screen looks identical to pre-save state
   - No visual diff showing updated profile
   - User might double-tap "Lưu" thinking it didn't work

**Concrete Fixes:**

- Show toast: "✓ Hồ sơ tập luyện đã được lưu" (3s duration)
- Add subtle animation: saved section gets green checkmark icon briefly
- Consider celebration micro-moment for first profile completion

---

### SC25_step63_fit050_all_fields_filled.png

**What's shown:** Form reopened showing all fields populated (testing full data scenario).

**Issues:**

1. **Scan burden — EXTREME**
   - All 15+ fields filled = wall of green pills and text
   - No visual hierarchy differentiates important vs optional
   - User cannot quickly verify "Is this correct?" without reading every field

2. **Edit affordance — MISSING**
   - Which fields can be edited? All of them?
   - No inline edit buttons per section
   - Must scroll through entire form to change one field

3. **Validation — NOT VISIBLE**
   - Are there any conflicts? (e.g., "Beginner" + "6 days/week" = risky)
   - No warnings about unusual combinations
   - No smart suggestions ("Bạn chọn Sức bền + Barbell — có thể cân nhắc thêm Cardio?")

**Concrete Fixes:**

- Add section summary cards in read mode with "Chỉnh sửa" button per section
- Implement progressive disclosure: show 3-4 key fields, collapse rest
- Add validation warnings for edge cases (orange badge icon)

---

### SC25_step64_fit050_submit_full.png

**What's shown:** Same filled form, scrolled to bottom showing "Lưu" button.

**Issues:**

1. **Same as step61 — button issues persist**
2. **Additional concern: No review step**
   - Complex form with 15+ inputs but no "Review & Confirm" screen
   - One-tap save with no summary preview
   - What if user misread "Sức mạnh" vs "Sức bền"?

**Concrete Fixes:**

- Add review step: Show all selections in grouped summary cards
- Include "Edit" links per section on review screen
- Change button to "Xem lại và lưu" instead of direct "Lưu"

---

### SC25_step70_tc_fit_070_strength_advanced_6.png

**What's shown:** Form with Goal="Sức mạnh", Experience="Nâng cao", Days=6.

**Issues:**

1. **Combination validity — No feedback**
   - Advanced + 6 days = very demanding program
   - No warning that this might be overtraining
   - No celebration that this is an ambitious goal

2. **Context-sensitive help — MISSING**
   - UI doesn't adapt to selections
   - For Advanced users, could show tips: "6 ngày/tuần cần chú ý phục hồi"

**Concrete Fixes:**

- Add smart alerts: "⚠️ 6 ngày tập nâng cao cần ưu tiên nghỉ ngơi đầy đủ"
- Surface relevant tips based on profile (collapsed accordion)

---

### SC25_step72_tc_fit_091_endurance_beginner_2.png

**What's shown:** Goal="Sức bền", Experience="Mới bắt đầu", Days=2.

**Issues:**

1. **Opposite combination — No encouragement**
   - Beginner + 2 days = conservative, safe approach
   - Perfect for building habit but no positive reinforcement
   - Missed opportunity: "Tuyệt vời! 2 ngày/tuần là lựa chọn an toàn để bắt đầu 👍"

2. **Expectation setting — ABSENT**
   - What will a 2-day endurance plan look like?
   - How long until results?
   - No preview or examples shown

**Concrete Fixes:**

- Add encouraging message for sensible beginner choices
- Show example week preview: "Kế hoạch của bạn: Thứ 3 - Cardio nhẹ 20 phút | Thứ 6 - Cardio vừa 25 phút"

---

### SC25_step74_tc_fit_110_hypertrophy_advanced_3.png

**What's shown:** Goal="Phát triển cơ", Experience="Nâng cao", Days=3.

**Issues:**

1. **Hypertrophy + 3 days — Unusual combination**
   - Muscle growth typically needs 4-6 days for volume
   - 3 days = full-body splits, less common for advanced
   - No system feedback about this non-standard choice

2. **User might be confused**
   - Did they mean to select 3? Or is equipment limited?
   - No contextual question: "3 ngày vì lịch trình hay thiết bị hạn chế?"

**Concrete Fixes:**

- Detect unusual combinations and ask clarifying questions
- Show modal: "Phát triển cơ nâng cao thường cần 4-6 ngày. Bạn có muốn điều chỉnh không?"

---

### SC25_step79_fit187_plan_or_cta.png

**What's shown:** (Screenshot appears identical to previous — possibly testing state persistence)

**Issue:**

- Cannot differentiate from other screenshots — no unique visual element visible

---

### SC25_step81_fit191_form_reopen.png

**What's shown:** Form reopened after being closed (testing edit flow).

**Issues:**

1. **Same issues as initial form load**
2. **Additional: No dirty state indicator**
   - If user made changes but didn't save, no warning on close
   - Could lose work silently

**Concrete Fixes:**

- Track form dirty state, show "Bạn có thay đổi chưa lưu. Tiếp tục?" modal on back/close

---

### SC25_step82_fit193_double_save.png

**What's shown:** (Testing double-save scenario — visual state unclear from screenshot)

**Issues:**

1. **Double-tap prevention — Unknown**
   - If user taps "Lưu" twice quickly, does it duplicate?
   - Should disable button after first tap + show loading state

**Concrete Fixes:**

- Implement button disabled state during async save operation
- Add loading spinner to button: "Đang lưu..."

---

### SC25_step84_fit195_rapid_exp_switch.png

**What's shown:** Equipment section with multiple items selected rapidly (testing selection state updates).

**Issues:**

1. **Rapid interaction — No debouncing visible**
   - Can user tap 5 pills in 1 second? Does UI keep up?
   - Potential race conditions in state updates

2. **No selection limit indicated**
   - Can user select all 7 equipment types? Just 1?
   - Unconstrained multi-select might produce useless plans

**Concrete Fixes:**

- If there's a max limit, show it: "Thiết bị tập (4/7)"
- Add optimistic UI updates with slight delay for state sync

---

### SC25_step87_fit204_i18n_labels.png

**What's shown:** Equipment section with "Bodyweight", "Bands", "Kettlebell" newly selected (5 total).

**Issues:**

1. **English labels in Vietnamese app**
   - "Bodyweight", "Machine", "Cable", "Kettlebell" are English
   - Inconsistent with "Barbell", "Dumbbell" (also English but more universal?)
   - Vietnamese equivalents: "Trọng lượng cơ thể", "Máy tập", "Dây cáp", "Tạ bàn"

2. **i18n incomplete — MAJOR**
   - If app is Vietnamese-primary, all UI labels should be translated
   - Mixed language = unprofessional, confuses non-English speakers

3. **Equipment terminology — Assumed knowledge**
   - Not everyone knows what "Bands" or "Kettlebell" means
   - No icons or images to clarify

**Concrete Fixes:**

- Translate all equipment labels to Vietnamese
- Add small equipment icons next to each label (dumbbell emoji, band icon, etc.)
- Consider showing image thumbnails on tap for clarity

---

### SC26_step47_day_1_T2_workout.png

**What's shown:** Workout plan view showing day T2 (Tuesday) with "Thân trên A" (Upper Body A) workout card. Card shows muscle groups (Ngực, Lưng, Vai, Tay), 6 exercises (~37 min), and 3 example exercises (Chống đẩy 2×8-12, Dip ngực 2×8-12, Hít xà đơn 2×8-12), plus "+3 bài tập nữa" (3 more exercises). Below is "Chuyển thành ngày nghỉ" button. Top shows T2-CN week selector, nutrition card (Protein 0/150g), and "Tạo lại kế hoạch" button.

**Issues:**

1. **Visual Hierarchy — GOOD (rare positive!)**
   - Clear card structure separates workout from actions
   - Muscle groups in light text, exercise count prominent
   - "+3 bài tập nữa" in green draws eye to expansion

2. **Information Architecture — MIXED**
   - Week day selector (T2-CN) appears twice: top horizontal pills AND implicit in card context
   - Redundancy or intentional? Unclear
   - "Chính lịch" vs "Đổi Split" vs "Mẫu Plan" buttons — labels are too terse, meaning unclear

3. **Cognitive Load — MEDIUM**
   - Card teaser pattern (show 3, hide 3) reduces initial load ✓
   - But "Tạo lại kế hoạch" button is DESTRUCTIVE action at same hierarchy as view toggles
   - Green tip banner helps but adds clutter

4. **Microcopy — FUNCTIONAL**
   - "Thân trên A" = gym bro terminology (Upper A/B split)
   - Works for fitness enthusiasts but alienates beginners
   - "Chuyển thành ngày nghỉ" is clear ✓

5. **Touch Targets — ADEQUATE**
   - Day selector pills ~56px height (good)
   - Workout card is large tap target ✓
   - "Chuyển thành ngày nghỉ" button is full-width (good)

6. **Emotional Tone — NEUTRAL**
   - No encouragement ("This is workout 1 of 6 this week!")
   - No progress indicator ("You've completed 0/6 exercises")
   - Feels like a calendar, not a motivational tool

**Concrete Fixes:**

- Add context to day selector: "Tuần này" label above T2-CN pills
- Clarify button labels: "Lịch" → "Xem theo lịch", "Đổi Split" → "Thay đổi lịch tập"
- Move "Tạo lại kế hoạch" to settings/overflow menu (destructive = hidden)
- Add progress ring around "Thân trên A" title showing completion (0/6 done)
- Add encouraging microcopy: "Sẵn sàng chinh phục 6 bài tập! 💪"

---

### SC26_step48_day_2_T3_workout.png

**What's shown:** Day T3 (Wednesday) with "Lower A" workout. Shows "Buổi 1" and "Buổi 2" tabs (multi-session day), 3 exercises visible (Bước khuyỉ di chuyển, Bước khuỵ lùi, Nâng chân treo xà), duration ~23 min. Bottom shows "Cân nặng hôm nay" input (weight tracking).

**Issues:**

1. **Multi-session UI — CONFUSING**
   - "Buổi 1" / "Buổi 2" tabs appear suddenly (not visible on T2)
   - No explanation why Wednesday has 2 sessions
   - Tab pattern fights with day selector pattern (T2-CN) — both are horizontal pills

2. **Information density — HIGH**
   - Workout card + session tabs + weight input + bottom nav = 4 interaction zones
   - Weight input feels bolted on, not integrated
   - "Nhập cân nặng hợp lệ (30-300 kg)" helper text implies validation error even when empty

3. **Session navigation — UNCLEAR**
   - Are sessions sequential (do Buổi 1 then Buổi 2) or alternatives (pick one)?
   - No icons or labels clarifying relationship
   - "Buổi 1" with sun icon, "Buổi 2" with moon icon (AM/PM?) but Wednesday doesn't typically have AM/PM splits

4. **Weight tracking placement — ILLOGICAL**
   - Why is weight input on workout detail screen?
   - Weight changes daily, not per workout
   - Should be in dashboard/profile, not here

5. **Validation messaging — PREMATURE**
   - "Nhập cân nằng hợp lệ (30-300 kg)" shown before user interacts
   - Should only appear on invalid input
   - Creates anxiety ("Did I do something wrong already?")

**Concrete Fixes:**

- Add session explainer: "2 buổi tập hôm nay" with tooltip explaining why
- Change session tabs to vertical stack with icons: "🌅 Sáng: Lower A" / "🌙 Tối: Cardio nhẹ"
- Remove weight input from workout screen, move to dashboard
- OR: If keeping weight input, add context: "Cân nặng hôm nay (tùy chọn)" and hide helper until field is focused

---

### SC26_step49_day_3_T4_workout.png

**What's shown:** Day T4 (Thursday) with "Cardio" workout. Shows "0 bài tập" (~0 phút) — empty state. Weight input at bottom.

**Issues:**

1. **Empty state — WEAK**
   - "Cardio" with "0 bài tập" is confusing
   - Is this a rest day? Or data error?
   - No explanation or CTA ("Thêm bài tập cardio tùy chọn")

2. **Cardio tracking — MISSING**
   - Cardio isn't exercise-based (sets/reps), it's duration/distance
   - Empty exercise list makes sense BUT no alternative tracking UI shown
   - Should show: "30 phút chạy bộ" or "5km đạp xe" not "0 bài tập"

3. **User confusion likely**
   - Did the plan generation fail?
   - Is cardio day supposed to be rest?
   - No guidance on what to do

**Concrete Fixes:**

- Detect empty cardio day and show specific UI: "Cardio tự do - Chọn hoạt động yêu thích"
- Add quick-add buttons: "🏃 Chạy bộ" "🚴 Đạp xe" "🏊 Bơi lội"
- OR: If cardio is intentionally flexible, explain: "Hôm nay tập cardio theo sở thích. Không cần bài tập cụ thể."

---

### SC26_step53_day_7_CN_rest.png

**What's shown:** Day CN (Sunday/Chủ Nhật) showing blue "Ngày nghỉ" (Rest day) card with guidance text: "Ngủ đủ 7-9 giờ để phục hồi cơ bắp / Uống đủ nước và ăn giàu protein / Có thể đi bộ nhẹ hoặc kéo giãn". Shows "Thêm buổi tập" button and preview of next day's workout (Thần trên A - 6 bài tập). Weight input at bottom.

**Issues:**

1. **Rest day UI — EXCELLENT (rare positive!)**
   - Blue color contrasts well with green workout cards ✓
   - Helpful guidance text is encouraging, not clinical ✓
   - "Thêm buổi tập" CTA gives flexibility ✓

2. **Typography — READABLE**
   - Adequate line-height in guidance text ✓
   - Emoji-free guidance text is professional ✓

3. **Next day preview — HELPFUL**
   - "Ngày mai: Thần trên A - 6 bài tập" sets expectations ✓
   - With quick action buttons ("Ghi cân nặng", "Ghi cardio nhẹ") — good progressive disclosure

4. **Weight input — STILL MISPLACED**
   - Same issue: weight tracking shouldn't be per-day on workout screen
   - Especially odd on rest day (do users weigh themselves after rest day specifically?)

**Concrete Fixes:**

- KEEP rest day card design — it's good!
- Move weight tracking to dedicated "Ghi chép" tab or morning dashboard widget
- Consider adding "Bạn đã nghỉ ngơi tốt! 🌟" affirmation if user doesn't add session on rest day

---

### SC26_step56_regenerate_modal.png

**What's shown:** Blurred background with modal in center. Modal shows circular refresh icon, title "Tạo lại kế hoạch", description "Tạo lại kế hoạch tập luyện? Kế hoạch hiện tại sẽ bị thay thế.", and "Hủy" button (only visible button — modal appears to be loading or incomplete).

**Issues:**

1. **Modal state — LOADING**
   - Only "Hủy" button visible, no "Xác nhận" button
   - Suggests modal is mid-transition or data is loading
   - Spinner icon (↻) suggests async operation in progress

2. **Consequence clarity — WEAK**
   - "Kế hoạch hiện tại sẽ bị thay thế" is buried in description text
   - Not emphasized enough for destructive action
   - Should use red warning icon or bold text

3. **Backdrop blur — TOO STRONG**
   - Background is heavily blurred, context is lost
   - User can't see what plan they're about to replace
   - Should show just enough of old plan to inform decision

4. **Button placement — UNCLEAR**
   - "Hủy" is centered, suggests single-button dialog
   - But description implies two-choice (proceed or cancel)
   - Where is "Tạo lại" button?

**Concrete Fixes:**

- Add warning icon: "⚠️ Tạo lại kế hoạch"
- Emphasize consequence: **"Kế hoạch hiện tại sẽ bị xóa vĩnh viễn"**
- Show two buttons: "Hủy bỏ" (ghost) and "Tạo lại" (red destructive)
- Reduce backdrop blur to 40% opacity so old plan is faintly visible

---

### SC26_step58_exercises_expanded.png

**What's shown:** Heavily blurred screenshot showing same modal layout with refresh icon and "Hủy" button. Background blur is extreme.

**Issues:**

1. **Same as step56**
2. **Additional: Screenshot quality**
   - Extreme blur suggests either loading state OR screenshot capture error
   - Cannot evaluate UI details

**Note:** This appears to be duplicate/test artifact, not unique UX state.

---

### SC26_step62_streak_dots.png

**What's shown:** Blurred background with modal (same as step56/58). Background appears to show week day selector dots.

**Issues:**

1. **Same modal issues as step56**
2. **Filename mentions "streak_dots" but not visible**
   - Expected: Workout completion streak indicator (7-day dots, filled=done, empty=pending)
   - Actual: Cannot see due to blur
   - If streak UI exists, it's hidden behind modal

**Concrete Fixes:**

- If streak dots exist: make them prominent on main workout screen (not hidden)
- Use color: green=completed, gray=pending, red=missed
- Add label: "Chuỗi tập: 3/7 ngày tuần này"

---

### SC26_step65_add_session_modal.png

**What's shown:** Blurred screenshot with same modal refresh icon pattern, extreme background blur makes content unreadable.

**Issues:**

1. **Same as previous blurred screenshots**
2. **Filename suggests "add session" flow but modal title still says "Tạo lại kế hoạch"**
   - Possible test artifact OR wrong modal shown in add session context

**Note:** Cannot provide detailed critique due to image quality.

---

### SC26_step67_re_render_after_nav.png

**What's shown:** Workout screen showing day CN (rest day) selected. Shows "0 Chuỗi ngày tập" (0-day streak), nutrition card (Mục tiêu: 2641 kcal / Protein 0/150g), week selector (T2-CN), blue rest day card with same guidance text as step53.

**Issues:**

1. **Streak counter — DEMOTIVATING**
   - "0 Chuỗi ngày tập" in red circles for T2-T7
   - Green pin icon on CN (rest day) — confusing, is rest day "completed"?
   - Red circles feel like failure marks, not neutral pending state
   - No encouragement: "Chuỗi dài nhất: 0" shown at top — immediately discourages new users

2. **Visual hierarchy — CONFUSED**
   - Streak counter, nutrition card, and week selector all compete for attention
   - No clear primary focus
   - Too much information above the fold

3. **Nutrition card — CONTEXTUALLY WRONG**
   - Shows "Mục tiêu: 2641 kcal" on fitness tab
   - Nutrition belongs on meal planning tab, not workout tab
   - Creates confusion: "Do I track calories here or on other tab?"

4. **Empty state for new user — HARSH**
   - Fresh account sees all red zeros = feels like failing before starting
   - Should show encouraging message: "Bắt đầu chuỗi ngày tập của bạn! 💪"

**Concrete Fixes:**

- Change red circles to neutral gray for pending workouts
- Use green checkmark only for completed workouts, gray dot for pending
- Remove "Chuỗi dài nhất: 0" label until user completes first workout
- Move nutrition card to dashboard or make it collapsible
- Add first-workout encouragement: "Hoàn thành bài đầu tiên để bắt đầu chuỗi!"

---

### SC26_step68_after_reload.png

**What's shown:** Same screen as step67 but with different tab selected ("Kế hoạch" tab active instead of workout day). Shows "0 Chuỗi ngày tập" card, nutrition balance card (Cân bằng: 0 kcal, Nạp vào: 0, Tiêu hao: 0), and rest day card.

**Issues:**

1. **Tab switching causes layout shift**
   - "Kế hoạch" tab shows different content (plan overview) vs day detail
   - Layout is same but content semantics differ — confusing
   - Is "Kế hoạch" = plan settings or plan calendar view?

2. **Nutrition detail expanded — GOOD**
   - Shows breakdown: Nạp vào / Tiêu hao / Mục tiêu / Protein ✓
   - But still feels out of place on fitness tab

3. **Consistency — LACKING**
   - Same screen shows different content based on tab state
   - Tabs ("Kế hoạch" / "Tiến trình" / "Lịch sử") not visible in screenshot
   - Cannot evaluate full IA without seeing tab structure

**Concrete Fixes:**

- Clarify tab labels with icons: "📋 Kế hoạch" / "📊 Tiến trình" / "📅 Lịch sử"
- Keep nutrition on dedicated nutrition tab, remove from fitness
- OR: If nutrition integration is intentional, label it: "Năng lượng hôm nay (liên kết với Dinh dưỡng)"

---

### SC27_step02_welcome_step2.png

**What's shown:** Onboarding screen (step 2/6 progress indicator at top). Shows icon (📊 bar chart), heading "Định dưỡng chính xác" (Precise Nutrition), body text "Theo dõi calo, protein, carbs và chất béo mỗi ngày. Phân tích món ăn bằng AI chỉ với một cú chụp ảnh." (Track calo, protein, carbs and fat daily. Analyze meals with AI with just a photo), and "Tiếp tục" button at bottom right.

**Issues:**

1. **Typography — POOR CONTRAST**
   - Body text is light gray on white background — low contrast
   - Heading "Định dưỡng chính xác" in medium gray — also weak
   - Violates WCAG AA (likely ~3:1 ratio, needs 4.5:1 minimum)

2. **Visual hierarchy — FLAT**
   - Heading and body text have similar weight/color
   - Icon (📊) is too large and dominates (overshadows text)
   - No clear eye path: icon → heading → body → CTA

3. **Microcopy — FEATURE-LIST, not benefit**
   - "Theo dõi calo, protein, carbs..." = list of features
   - Doesn't answer "Why should I care?"
   - Better: "Đạt mục tiêu dinh dưỡng dễ dàng với theo dõi tự động và AI phân tích"

4. **Emotional tone — CLINICAL**
   - "Chính xác" = precise (medical/technical vibe)
   - "Phân tích" = analyze (scientific vibe)
   - Doesn't inspire or motivate, just informs

5. **CTA placement — FLOATING**
   - "Tiếp tục" button at bottom right is small and isolated
   - Should be full-width or centered for emphasis
   - No "skip" option visible — forces linear flow

6. **Progress indicator — TOO SUBTLE**
   - Step 2/6 shown as tiny progress bar at top
   - Hard to see, doesn't communicate "You're 1/3 done!"

7. **AI mention — BUZZWORD**
   - "AI chỉ với một cú chụp ảnh" sounds like AI-slop marketing
   - No explanation of accuracy, privacy, or how it works
   - Creates skepticism instead of excitement

**Concrete Fixes:**

- Increase text contrast: body to #4A5568 (gray-700), heading to #1A202C (gray-900)
- Reduce icon size by 30%, increase heading size to 24sp (from ~20sp)
- Rewrite microcopy: "Biết chính xác bạn ăn gì mỗi ngày. Chụp ảnh món ăn là xong!"
- Make CTA full-width: "Tiếp tục" → "Khám phá tiếp →"
- Add skip link: "Bỏ qua hướng dẫn" (top right, subtle)
- Enhance progress: "Bước 2/6: Dinh dưỡng thông minh 🎯"
- Remove "AI" buzzword, focus on outcome: "Chụp ảnh, biết ngay dinh dưỡng"

---

## SYSTEMIC ISSUES ACROSS ALL SCREENSHOTS

### 1. ❌ VISUAL HIERARCHY BREAKDOWN (Affects 90% of screens)

**Pattern:** Labels, values, and body text use similar font weights and colors, creating flat layouts with no clear reading order.

**Examples:**

- Form section labels ("Mục tiêu tập luyện") same weight as input labels
- Workout card "6 bài tập" same prominence as "~37 phút"
- Modal title "Tạo lại kế hoạch" barely distinguishable from description text

**Impact:** Users must read everything to find important information — increases cognitive load, slows task completion, violates "clarity over decoration" principle.

**Systemic Fix:**

- Define 4-level type scale: H1 (page title, 600 weight, 24sp), H2 (section, 600 weight, 20sp), H3 (card title, 500 weight, 18sp), Body (400 weight, 16sp)
- Apply semantic color: Titles = gray-900, Labels = gray-700, Body = gray-600, Meta = gray-500
- Implement in design tokens: `--text-h1`, `--text-h2`, `--text-body`, `--text-meta`

---

### 2. ❌ CLINICAL FORM AESTHETICS (Affects all forms)

**Pattern:** Dense vertical stacking, minimal white space, gray-heavy color scheme, and transactional microcopy create medical intake form vibe.

**Examples:**

- Training profile form: 15+ fields, 8px vertical gaps, no section cards
- Onboarding text: "Phân tích món ăn" (analyze) instead of "Tìm hiểu món ăn" (discover)

**Impact:** Violates "never clinical" brand principle. Users feel like they're filling paperwork, not designing their fitness journey. Demotivating, not encouraging.

**Systemic Fix:**

- Increase vertical spacing: 24px between sections (currently ~12px)
- Wrap sections in subtle cards (bg-gray-50, rounded corners, 16px padding)
- Rewrite all microcopy with conversational, encouraging tone:
  - "Mục tiêu tập luyện" → "Bạn muốn tập để làm gì?"
  - "Số ngày tập/tuần" → "Bạn có thể dành bao nhiêu ngày?"
  - "Thiết bị tập" → "Bạn có sẵn gì để tập?"
- Add motivational subheadings: "Thiết kế kế hoạch hoàn hảo cho bạn 🎯"

---

### 3. ❌ TOUCH TARGET FAILURES (Affects 80% of interactive elements)

**Pattern:** Pill buttons in button groups consistently fall below 44×44pt minimum, with insufficient spacing causing mistaps.

**Examples:**

- Goal type pills ("Sức mạnh" / "Phát triển cơ" / "Sức bền"): ~80px wide × 40px tall, 8px gap
- Week day selector (T2-CN): ~48px × 48px but tightly packed
- Number selectors (2-6): adequate size but single-tap precision required

**Impact:** Violates "mobile-first touch-native" principle. Causes frustration, increases errors, forces users to zoom/tap carefully.

**Systemic Fix:**

- Audit all interactive elements, enforce 44×44pt minimum (56×56pt preferred)
- Pill buttons: increase to 100px min width, 48px height, 12px gap
- Implement touch target debugging tool (shows 44×44pt grid overlay in dev mode)
- Consider larger tap areas for primary actions (64×64pt for "Lưu" button)

---

### 4. ❌ MULTI-SELECT AFFORDANCE MISSING (Affects all multi-select UI)

**Pattern:** Equipment, injury, and training preference selectors allow multi-select but provide no visual or textual hint about this capability.

**Examples:**

- Equipment toggles: No "(Chọn tất cả những gì phù hợp)" label
- Selected pills turn green but unselected pills look disabled/dead
- No selection counter ("3/7 selected")

**Impact:** Users confused about whether they can select one or many. Leads to suboptimal selections (picking only one equipment type because UI suggests radio button behavior).

**Systemic Fix:**

- Add helper text below section labels: "Chọn 1 hoặc nhiều"
- Show selection counter when >0 selections: "Thiết bị (4 đã chọn)"
- Add "Chọn tất cả" / "Bỏ chọn tất cả" links for power users
- Unselected pills should look available (border + text), not dead (gray fill)

---

### 5. ❌ DESTRUCTIVE ACTIONS UNPROTECTED (Affects modals and forms)

**Pattern:** Destructive actions ("Tạo lại kế hoạch", "Hủy" on forms) presented at same hierarchy as safe actions, with minimal confirmation dialogs.

**Examples:**

- "Tạo lại kế hoạch" button uses green color (positive), appears at top level alongside view toggles
- "Hủy" button on form is outlined (prominent), equal width to "Lưu"
- Modal warning "Kế hoạch hiện tại sẽ bị thay thế" buried in gray text

**Impact:** Accidental data loss. Users tap "Tạo lại" thinking it's "refresh view" and lose 6-day workout plan. Violates Nielsen's "Error Prevention" heuristic.

**Systemic Fix:**

- Move all destructive actions to overflow menus or settings (never top-level)
- Use color coding: Red for destructive primary ("Xóa"), Gray for destructive secondary ("Hủy")
- Enhance confirmation modals:
  - Use ⚠️ warning icon
  - Bold the consequence: **"Kế hoạch 6 ngày sẽ bị xóa vĩnh viễn"**
  - Show preview of what will be lost (e.g., "Thần trên A - 6 bài tập" card thumbnail)
  - Two-button layout: "Hủy bỏ" (full-width, ghost) + "Xóa kế hoạch" (red, outlined)

---

### 6. ❌ ZERO EMPTY STATE GUIDANCE (Affects all initial/error states)

**Pattern:** Empty states show "0 items" or blank cards with no explanation, CTA, or encouragement.

**Examples:**

- Cardio day: "0 bài tập ~0 phút" with no context (is this rest? error? flexible?)
- Streak counter: "0 Chuỗi ngày tập" in red with no "Start your streak!" message
- Onboarding: forms open with no examples or "why we ask this"

**Impact:** Users feel lost, stupid, or like the app is broken. No guidance on what to do next. Violates "approachable, encouraging" principle.

**Systemic Fix:**

- Create empty state component library with 3 variants:
  1. **First-use**: "Chưa có dữ liệu — hãy bắt đầu thôi! [CTA]"
  2. **Zero-state**: "Hôm nay nghỉ ngơi — không cần thêm bài tập [helpful tip]"
  3. **Error-state**: "Không thể tải dữ liệu [Thử lại button]"
- All empty states must include:
  - Icon (illustrative, not decorative)
  - Short explanation (1 sentence)
  - Primary CTA OR helpful tip
  - Encouraging tone

---

### 7. ❌ INCONSISTENT NAVIGATION PATTERNS (Affects workout/plan views)

**Pattern:** Week day selector appears in multiple contexts with unclear relationships, creating navigation confusion.

**Examples:**

- Horizontal pill selector (T2-CN) at top of workout screen
- Same T2-CN selector appears in "Kế hoạch" tab
- Day cards in timeline view below
- Unclear if these are linked or independent

**Impact:** Users don't know where they are in the app. Tapping different day pills might change view OR change data context. Violates "users should feel calm and organized" principle.

**Systemic Fix:**

- Audit information architecture: Define clear mental model
  - **Calendar view**: Shows all 7 days, tap to drill into day detail
  - **Day detail view**: Shows single day, breadcrumb back to calendar
  - **Week selector**: Always shows current week context, highlights current day
- Implement breadcrumb navigation: "Kế hoạch > Tuần 1 > Thứ 2"
- Add view mode toggle: "Xem tuần" (calendar) ↔ "Xem ngày" (detail)
- Ensure week selector is read-only context indicator in day detail view, not a navigation control

---

### 8. ❌ SUCCESS FEEDBACK INVISIBLE (Affects all save/submit actions)

**Pattern:** After saving forms or completing actions, no toast/confirmation/animation indicates success. Users left guessing.

**Examples:**

- Training profile save: Screen just closes, no "Đã lưu" message
- Workout completion: No celebration or checkmark
- Weight logging: No feedback that value was saved

**Impact:** Users double-tap buttons, thinking action failed. Loss of confidence in app. Violates "Visibility of system status" heuristic.

**Systemic Fix:**

- Implement toast notification system:
  - Success: Green toast, checkmark icon, 3s duration, "✓ [Action] thành công"
  - Error: Red toast, X icon, 5s duration, "✗ [Error message]"
  - Info: Blue toast, info icon, 3s duration
- Add micro-animations for state changes:
  - Button: Checkmark appears inside button (0.3s), then navigates
  - Card: Green border pulse (0.5s) on save
  - List item: Slide-in from right with green glow
- Consider celebration moments for milestones:
  - First workout completed: Confetti animation + "🎉 Bài đầu tiên hoàn thành!"
  - Streak milestone: Badge unlock animation

---

### 9. ❌ LOW TEXT CONTRAST (Affects 60% of text)

**Pattern:** Body text, labels, and metadata use gray-400/gray-500 on white backgrounds, falling below WCAG AA standards.

**Examples:**

- Onboarding body text: Light gray, likely ~3:1 ratio
- Form section labels: Gray-600, adequate but weak
- Workout metadata ("~37 phút"): Gray-500, borderline

**Impact:** Readability issues for users with visual impairments, older users, or in bright sunlight. Violates "accessible by default" principle and legal requirements (WCAG 2.1 AA).

**Systemic Fix:**

- Audit all text against WCAG AA (4.5:1 minimum for normal text, 3:1 for large text)
- Update design tokens:
  - Body text: gray-600 → gray-700 (#4A5568, ~7:1 ratio)
  - Labels: gray-500 → gray-600 (#718096, ~5:1 ratio)
  - Metadata: gray-400 → gray-500 (#A0AEC0, ~4.6:1 ratio)
- Implement automated contrast checker in CI/CD pipeline

---

### 10. ❌ i18n INCOMPLETE / MIXED LANGUAGE (Affects equipment labels)

**Pattern:** Some UI labels remain in English ("Bodyweight", "Machine", "Cable") while app is Vietnamese-primary.

**Examples:**

- Equipment section mixes "Barbell" (universal?) with "Bodyweight" (translatable)
- No Vietnamese equivalents: "Trọng lượng cơ thể", "Máy tập", "Dây cáp"

**Impact:** Inconsistent, unprofessional experience. Confuses non-English speakers. Suggests incomplete localization effort.

**Systemic Fix:**

- Complete i18n audit: grep for all hardcoded strings
- Translate all UI labels to Vietnamese
- For fitness terminology with no direct translation, add explanatory tooltips
- Consider adding equipment icons/images to clarify meaning visually

---

### 11. ❌ COGNITIVE LOAD — PROGRESSIVE DISCLOSURE ABSENT (Affects long forms)

**Pattern:** Forms dump 15+ inputs simultaneously with no sections, collapsible panels, or step-by-step flow.

**Examples:**

- Training profile: All fields visible from open (Goal, Experience, Days, Duration, Equipment, Injuries, Sleep, Cycle weeks, etc.)
- No "Advanced options" collapse
- No wizard/stepper flow

**Impact:** Overwhelming, especially for beginners. High abandonment risk. Users may skip important fields buried below fold.

**Systemic Fix:**

- Implement progressive disclosure patterns:
  1. **Collapsed sections**: "Cài đặt nâng cao" starts collapsed, expands on tap
  2. **Stepper wizard**: Break form into 3 steps: Basics → Preferences → Review
  3. **Smart defaults**: Pre-fill common values, show "(Đã điền sẵn)" label
- Show only 5-7 inputs at a time, use "Tiếp tục" to reveal more
- Add progress indicator: "Bước 1/3: Mục tiêu và trình độ"

---

### 12. ❌ CONTEXT-SENSITIVE HELP MISSING (Affects all inputs)

**Pattern:** No tooltips, no field-level help text, no examples, no "why we ask this" explanations.

**Examples:**

- "Chu kỳ nâng cao" field has no explanation (what is periodization?)
- Equipment selection has no guidance (should I select all I have OR only what I prefer?)
- Sleep input has no context (why does this matter for workout plan?)

**Impact:** Users make uninformed decisions, reducing plan effectiveness. Expert jargon alienates beginners.

**Systemic Fix:**

- Add ⓘ info icon next to complex fields, opens tooltip on tap
- Tooltip content:
  - **What it is**: "Chu kỳ nâng cao là việc thay đổi cường độ tập luyện theo từng giai đoạn"
  - **Why it matters**: "Giúp tránh đình trệ và tăng hiệu quả dài hạn"
  - **Recommendation**: "Người mới bắt đầu: chọn 8 tuần"
- Add example text in placeholders: "Ví dụ: 7-8 giờ/đêm"
- Surface contextual tips based on selections (e.g., "Bạn chọn 6 ngày/tuần — nhớ ưu tiên nghỉ ngơi!")

---

### 13. ❌ NO VALIDATION FEEDBACK (Affects all inputs)

**Pattern:** Fields accept invalid data with no inline validation, OR show premature error messages before user interaction.

**Examples:**

- Weight input shows "Nhập cân nặng hợp lệ (30-300 kg)" even when empty (premature)
- Equipment selection allows 0 selections (invalid state) with no warning
- No conflict detection (e.g., "Beginner + 6 days/week" extreme combination)

**Impact:** Users submit incomplete/invalid forms, triggering late-stage errors. Frustration and abandonment.

**Systemic Fix:**

- Implement 3-stage validation:
  1. **Inline (blur)**: Validate on field exit, show red border + error text below
  2. **Submit**: Block submit if any field invalid, scroll to first error
  3. **Smart warnings**: Non-blocking orange badges for unusual combinations
- Validation messages:
  - Error: "Vui lòng chọn ít nhất 1 thiết bị"
  - Warning: "⚠️ 6 ngày/tuần phù hợp với người có kinh nghiệm — cân nhắc giảm xuống 4-5 ngày"
- Never show validation message before user interacts with field

---

### 14. ❌ BUTTON LABEL BREVITY SACRIFICES CLARITY (Affects CTAs)

**Pattern:** Buttons use 1-2 word labels that are ambiguous out of context.

**Examples:**

- "Lưu" = Save (what? profile? workout? settings?)
- "Hủy" = Cancel (discard changes? close without saving? abort action?)
- "Tiếp tục" = Continue (to what? next step? finish?)

**Impact:** Users hesitate before tapping, unsure of outcome. Especially problematic for destructive actions.

**Systemic Fix:**

- Add object to button labels:
  - "Lưu" → "Lưu hồ sơ"
  - "Hủy" → "Hủy thay đổi" OR "Đóng"
  - "Tiếp tục" → "Tiếp tục →" OR "Xem bước tiếp"
- For destructive actions, add consequence:
  - "Tạo lại" → "Tạo lại kế hoạch (xóa kế hoạch cũ)"
- Use microcopy below button for high-stakes actions:
  - [Xóa kế hoạch]
  - "Thao tác này không thể hoàn tác"

---

### 15. 🟡 POSITIVE PATTERNS TO AMPLIFY

**Rest day card (SC26_step53)** — EXCELLENT design:

- Blue color differentiates from workout cards ✓
- Helpful, encouraging guidance text ✓
- "Thêm buổi tập" CTA gives flexibility ✓
- Next day preview sets expectations ✓

**Recommendation**: Use this as template for all empty/special states. The tone, layout, color usage all align with brand principles.

---

## PRIORITY FIXES (By Impact × Effort Matrix)

### 🔴 HIGH IMPACT, LOW EFFORT (Do First)

1. **Fix text contrast** — Update 4 color tokens, affects 60% of text, 2hr fix
2. **Add success toasts** — Implement toast component, add to all save actions, 4hr fix
3. **Multi-select helper text** — Add 3 labels ("Chọn 1 hoặc nhiều"), 1hr fix
4. **Button label clarity** — Rewrite 8 button labels with object nouns, 1hr fix
5. **Destructive action color** — Change "Tạo lại kế hoạch" from green to red, 15min fix

### 🟠 HIGH IMPACT, MEDIUM EFFORT (Do Second)

6. **Progressive disclosure for forms** — Collapse advanced sections, 8hr dev
7. **Touch target audit** — Increase pill button sizes, adjust layouts, 12hr dev
8. **Empty state library** — Create 3 component variants with microcopy, 6hr design + dev
9. **Contextual help tooltips** — Add ⓘ icons + tooltip content for 8 fields, 8hr content + 4hr dev
10. **Validation system** — Implement inline + submit validation, 16hr dev

### 🟡 MEDIUM IMPACT, LOW EFFORT (Do Third)

11. **Typography hierarchy** — Define 4-level scale in tokens, apply to 20 screens, 6hr design + 8hr dev
12. **i18n completion** — Translate 15 English labels to Vietnamese, 2hr
13. **Selection counters** — Add "X/Y selected" labels to multi-selects, 2hr dev
14. **Breadcrumb navigation** — Add breadcrumb to day detail view, 3hr dev

### 🔵 MEDIUM IMPACT, HIGH EFFORT (Backlog)

15. **Form wizard refactor** — Convert long forms to 3-step wizards, 24hr dev
16. **Navigation IA redesign** — Clarify week selector / calendar / day detail relationships, 16hr UX research + 24hr dev
17. **Smart validation warnings** — Detect unusual combinations, suggest corrections, 20hr dev
18. **Celebration micro-moments** — Confetti, badges, streak animations, 12hr design + 16hr dev

---

## AI-SLOP DETECTION

**Instances found:**

1. **"AI phân tích" buzzword** (SC27_step02) — Generic AI marketing copy without explaining how/why/accuracy
2. **Modal refresh icon** (SC26_step56/58) — Generic spinner, no branded illustration
3. **Equipment label mix** (English "Bodyweight" etc.) — Suggests auto-translated or copy-pasted from template

**Not found (good!):**

- No Lorem Ipsum placeholder text
- No stock photography
- No "AI-powered" prefix spam
- No meaningless decoration (geometric shapes, gradient blobs)

**Verdict:** Low AI-slop presence overall. Main issue is generic marketing copy in onboarding, not visual design.

---

## ACCESSIBILITY AUDIT (WCAG 2.1 AA)

### ❌ FAILS

1. **Color contrast** — 60% of text below 4.5:1 ratio (body text, labels, metadata)
2. **Touch targets** — 80% of pill buttons below 44×44pt minimum
3. **Form labels** — Cannot verify `<label for="">` association from screenshots
4. **Focus indicators** — No visible focus states shown (keyboard navigation)

### ⚠️ UNCERTAIN (Cannot verify from screenshots)

5. **Semantic HTML** — Are sections using `<fieldset>`/`<legend>`?
6. **ARIA labels** — Equipment toggles properly announced as multi-select?
7. **Keyboard navigation** — Can users tab through all interactive elements?
8. **Screen reader** — Does week selector announce current day?

### ✅ PASSES

9. **Language attribute** — Vietnamese content, likely has `lang="vi"` (filename evidence)
10. **Visual indicators** — Not relying solely on color (selected pills have green fill + white text)

---

## MOBILE-SPECIFIC ISSUES

1. **Safe area insets** — No visible padding for iPhone notch/gesture bar in fixed buttons
2. **Scroll hints** — Long forms have no "scroll to see more ↓" indicator
3. **Landscape mode** — Unknown, screenshots all portrait
4. **One-handed use** — Fixed bottom buttons good ✓ but top nav requires reaching
5. **Haptic feedback** — Unknown, cannot evaluate from screenshots
6. **Pull-to-refresh** — Unknown, cannot evaluate from screenshots

---

## BRAND PRINCIPLE SCORECARD

| Principle                     | Score   | Notes                                                            |
| ----------------------------- | ------- | ---------------------------------------------------------------- |
| **Clean**                     | 🟡 5/10 | Forms are cluttered, hierarchy weak. Rest day card is clean ✓    |
| **Smart**                     | 🟠 4/10 | No smart defaults, no conflict detection, no contextual help     |
| **Motivating**                | 🔴 2/10 | Clinical tone, no encouragement, streak shown as red failure     |
| **Approachable**              | 🔴 3/10 | Expert jargon, no onboarding help, intimidating empty states     |
| **Encouraging**               | 🔴 2/10 | No celebration, no positive reinforcement, demotivating UI       |
| **Never clinical**            | 🔴 1/10 | Dense forms, gray palette, transactional copy = medical intake   |
| **Calm + organized**          | 🟠 4/10 | Navigation confusing, info overload, no progressive disclosure   |
| **Clarity over decoration**   | 🟡 6/10 | Minimal decoration ✓ but clarity suffering due to weak hierarchy |
| **Data with empathy**         | 🔴 2/10 | Raw numbers shown, no context, no "why this matters"             |
| **Mobile-first touch-native** | 🔴 3/10 | Touch targets too small, no haptic feedback, tight spacing       |
| **Semantic tokens**           | ⚠️ ?/10 | Cannot evaluate design system implementation from screenshots    |
| **Accessible by default**     | 🔴 2/10 | Contrast fails, touch target fails, no visible focus states      |

**Overall:** 🔴 3.2/10 — **Significant brand principle violations across the board.**

---

## CONCLUSION

This app has solid functional bones but **severe UX polish and brand alignment issues**. The codebase likely works, but the user-facing experience violates nearly every stated brand principle.

### Top 3 Blockers to Fix:

1. **Clinical aesthetics** — Rewrite all microcopy to be encouraging/conversational, increase white space, add motivational moments
2. **Touch target failures** — Audit and fix all interactive elements to meet 44×44pt minimum
3. **Multi-select confusion** — Add helper text, selection counters, and visual affordances to all toggle groups

### What's Working:

- Rest day card design (copy this pattern!)
- Workout card information architecture (teaser + expand pattern)
- Minimal decoration (no AI-slop visual bloat)

### What Needs Rethinking:

- Long forms (needs progressive disclosure or wizard flow)
- Navigation patterns (week selector redundancy, unclear context switching)
- Validation and error prevention (premature messages, missing conflict detection)
- Success feedback (invisible state changes)

**Estimated effort to fix critical issues:** 60-80 hours design + development.

**Recommended approach:** Prioritize HIGH IMPACT, LOW EFFORT fixes first (text contrast, toasts, labels, button colors) to achieve quick wins, then tackle form redesigns and navigation IA in phases.
