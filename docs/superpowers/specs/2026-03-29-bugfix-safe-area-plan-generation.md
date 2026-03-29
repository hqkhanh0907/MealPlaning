# Bugfix + Quality: Safe-Area, Plan Generation, UX & Performance

**Date**: 2026-03-29 (Updated 2026-03-30)  
**Status**: In Review  
**Severity**: Critical + High  
**4-Skill Analysis**: brainstorming, ui-ux-pro-max, web-design-guidelines, react-vite-best-practices

---

## §1. Bug 1: UI bị che phần trên trong mobile (CRITICAL)

### Root Cause
`UnifiedOnboarding.tsx` line 201 uses `pt-safe-top` which **does not exist** in CSS.  
Correct class is `pt-safe` (defined in `src/index.css` line 86).

Additionally, `PlanComputingScreen` hides the progress bar but has no `pt-safe` on its own container.

### Fix
1. `UnifiedOnboarding.tsx`: `pt-safe-top` → `pt-safe` *(Already fixed by web-guidelines agent)*
2. `PlanComputingScreen.tsx`: add `pt-safe` to root container
3. `PlanPreviewScreen.tsx`: add `pb-safe` to fixed bottom bar (line 79)
4. `PlanStrategyChoice.tsx`: add `pb-safe` to back button area (line 88)
5. `OnboardingErrorBoundary.tsx`: add `pt-safe` to fallback UI

---

## §2. Bug 2: Tab tập luyện trống sau khi chọn "tự động" (CRITICAL)

### Root Cause (3 failures stacked)

1. **Implementation missed spec §6**: `PlanComputingScreen` was implemented as UI-only animation without calling `generatePlan()` at step 2 as spec v5 line 230 requires.

2. **`setTrainingProfile()` never called**: spec v5 line 377 requires persisting training profile at end of Section 4. `handleConfirmTraining()` only calls `setOnboardingSection(5)` + `goNext()`.

3. **Cleanup broke safety net**: `FitnessTab` cleanup removed `hasGeneratedAfterOnboard` useEffect without verifying the new flow replaced it.

3. **Tests missed business logic**: Tests only verified UI rendering (animation, timers) — never verified `generatePlan()`, `setTrainingProfile()`, `addTrainingPlan()`, or `addPlanDays()` were called.

### Fix (per spec v5 §6, lines 230, 377, 387)

#### A. TrainingDetailSteps — save profile at end of Section 4

At the confirm sub-step, build `TrainingProfile` from form values and call:
```
fitnessStore.setTrainingProfile(fullTrainingProfile)
```

#### B. PlanComputingScreen — generate plan at step 2

At step 2 of the animation (~2.5s in):
```
const result = generatePlan({ trainingProfile, healthProfile })
addTrainingPlan(result.plan)
addPlanDays(result.days)
```

Error handling (spec v5 §10.3):
- Animation pauses at failed step
- Error card: "Có lỗi xảy ra khi tạo kế hoạch"
- Two buttons: "Thử lại" | "Tự lên kế hoạch"

#### C. Tests — add business outcome assertions

- `PlanComputingScreen` test: verify `generatePlan()` called, `addTrainingPlan()` called
- Integration test: verify `trainingPlans.length > 0` after auto-path completion
- Integration test: verify `trainingProfile !== null` after Section 4

---

## Bug 3: Missing Copilot Instructions Rules

Add to `.github/copilot-instructions.md`:

### Rule: Mobile Safe-Area (pt-safe)
Every new full-screen component or page MUST include `pt-safe` class on its top-level container. The class is defined in `index.css` and uses `env(safe-area-inset-top)`. Always verify on emulator before marking done.

### Rule: Business Logic Tests
Every component that performs a store action (save, generate, persist) MUST have tests verifying the store action was called with correct args — not just UI rendering tests.

### Rule: Cleanup Verification
When deleting old code during migration, MUST verify the new code covers ALL functionality of the deleted code. Create a checklist of functions in the old code and check each one has a replacement.

---

## §3. React/Vite Performance Issues (from react-vite-best-practices skill)

### 3a. PlanComputingScreen: Unstable `goNext` dependency (CRITICAL)
**File**: `PlanComputingScreen.tsx:27-41`  
**Problem**: `useEffect` depends on `[goNext]`. Parent's `goNext` is a `useCallback` depending on `[location, sectionSteps]`. If parent re-renders for any reason (e.g., form.watch()), `goNext` gets a new identity, cleanup fires, animation restarts from scratch.  
**Fix**: Use `useRef` to capture `goNext`:
```tsx
const goNextRef = useRef(goNext);
goNextRef.current = goNext;
// useEffect with [] deps, calls goNextRef.current()
```

### 3b. HealthConfirmStep: useMemo never memoizes (MEDIUM)
**File**: `HealthConfirmStep.tsx:44-52`  
**Problem**: `useMemo` for BMR depends on `[values, age]`. `values` is from `getValues()` — a new object each render. Memo never works.  
**Fix**: Destructure specific primitives: `[values.gender, values.weightKg, values.heightCm, values.activityLevel, age]`

### 3c. UnifiedOnboarding: stepProps recreated every render (MEDIUM)
**File**: `UnifiedOnboarding.tsx:155`  
**Problem**: `stepProps` object is recreated every render. All children receive new object refs each time.  
**Fix**: `useMemo` on stepProps with appropriate deps.

### 3d. No prefetch hints (LOW)
**File**: `UnifiedOnboarding.tsx:13-41`  
**Problem**: No prefetch for upcoming wizard sections. When user is on last step of section 4, section 5-7 chunks could be preloaded.  
**Fix**: Add dynamic imports to preload next section on step transition.

---

## §4. UI/UX Issues (from ui-ux-pro-max skill)

### 4a. PlanComputingScreen: No escape route (CRITICAL)
**File**: `PlanComputingScreen.tsx`  
**Problem**: User is trapped for ~10s with no way to cancel/go back during auto-advancing screen.  
**Fix**: Add a "Bỏ qua" (Skip) link at bottom, or a back button. Per UX rule `escape-routes`.

### 4b. PlanComputingScreen: No aria-live region (CRITICAL)
**File**: `PlanComputingScreen.tsx:42`  
**Problem**: Entire screen has no `role="status"` or `aria-live` — screen readers get zero feedback during computation.  
**Fix**: Add `role="status"` and `aria-live="polite"` to the steps container.

### 4c. PlanPreviewScreen: Emoji as icon (CRITICAL)
**File**: `PlanPreviewScreen.tsx:48`  
**Problem**: Emoji 💪 used as structural indicator for active training days. Must use SVG icon.  
**Fix**: Replace with `<Dumbbell>` from Lucide.

### 4d. PlanPreviewScreen: text-[10px] below minimum (MEDIUM)
**File**: `PlanPreviewScreen.tsx:47,59,63,67`  
**Problem**: 4 occurrences of `text-[10px]` — below 12px minimum for readability.  
**Fix**: Use `text-xs` (12px minimum).

### 4e. TrainingPlanView: Touch targets too small (CRITICAL)
**File**: `TrainingPlanView.tsx:449-459`  
**Problem**: Quick action buttons (logWeight, logCardio) are ~28px tall — well below 44px minimum. Restore/Edit buttons are 32px.  
**Fix**: Add `min-h-[44px] min-w-[44px]` to all interactive buttons.

### 4f. SessionTabs: Semantic role error (CRITICAL)
**File**: `SessionTabs.tsx:71-80`  
**Problem**: Add session "+" button uses `role="tab"` + `aria-selected={false}` — semantically wrong. This is an action button, not a tab.  
**Fix**: Move outside `tablist`, use plain `<button>` without tab role.

### 4g. PlanDayEditor: Dialog a11y missing (CRITICAL)
**File**: `PlanDayEditor.tsx:360`  
**Problem**: Confirm dialog overlay missing `role="dialog"`, `aria-modal="true"`, `aria-label`, and focus trap.  
**Fix**: Add proper dialog semantics and focus management.

### 4h. PlanDayEditor: Stepper buttons too small (HIGH)
**File**: `PlanDayEditor.tsx:426-427`  
**Problem**: ±buttons are 36×36px — below 44px minimum.  
**Fix**: Increase to `min-h-[44px] min-w-[44px]`.

---

## §5. Plan Editing Missing Features (from plan-editing spec audit)

### 5a. Delete Session UI (❌ NOT IMPLEMENTED)
**Store**: `removePlanDaySession()` exists and works (auto-reorders).  
**Missing**: No UI button to trigger it.  
**Design**: Long-press on session tab → context menu "Xóa buổi tập" with confirmation dialog.

### 5b. Toggle Rest ↔ Workout Day (❌ NOT IMPLEMENTED)
**Missing**: Cannot convert rest day to workout day or vice versa.  
**Design**: Long-press on day pill → "Thêm buổi tập" or "Chuyển thành ngày nghỉ".

### 5c. Regenerate Plan On-Demand (❌ PARTIAL)
**Current**: Regenerate button only appears when plan expired.  
**Fix**: Add always-visible "Tạo lại kế hoạch" button in TrainingPlanView header with confirmation dialog.

### 5d. Undo Exercise Removal (❌ NOT IMPLEMENTED)
**Current**: Red X deletes immediately with no undo.  
**Design**: Exercise slides out → undo toast (5s timeout) → permanent delete after timeout.

### 5e. Manual Path First-Plan Creation (❌ NOT DESIGNED)
**Current**: User selects "manual" in onboarding → enters FitnessTab with no plan and no guidance.  
**Design**: Show empty state with clear CTA: "Tạo buổi tập đầu tiên" → opens PlanDayEditor for day 1.

---

## §6. Web Interface Guidelines Fixes (Already Applied by Agent)

The web-guidelines agent has already fixed 16 violations:

| Fix | File | Details |
|-----|------|---------|
| `document.querySelector()` → `useRef` | TrainingPlanView.tsx | No DOM querying in React |
| `focus-visible` rings | TrainingPlanView.tsx (8 buttons) | Added `focus-visible:ring-2 focus-visible:ring-emerald-400` |
| `focus-visible` rings | SessionTabs.tsx (2 buttons) | Tab + add buttons |
| `aria-hidden` on icon | SessionTabs.tsx | `<Plus>` icon in add button |
| `prefers-reduced-motion` | PlanComputingScreen.tsx | Spinner + dots respect `useReducedMotion()` |
| `prefers-reduced-motion` | UnifiedOnboarding.tsx | Slide variants use fade-only |
| `form.watch()` → `useWatch()` | UnifiedOnboarding.tsx | Prevents unnecessary re-renders |

---

## §7. Copilot Instructions — New Rules to Add

### Rule: Mobile Safe-Area (pt-safe / pb-safe)
```
Mọi full-screen component/page MỚI phải có `pt-safe` trên container gốc.
Fixed bottom bars phải có `pb-safe`.
Class `pt-safe` sử dụng `env(safe-area-inset-top)` định nghĩa trong index.css.
KHÔNG tự tạo class `pt-safe-top` hay variant khác — chỉ dùng `pt-safe` và `pb-safe`.
Luôn verify trên emulator trước khi đánh dấu hoàn thành.
```

### Rule: Business Logic Tests (Store Actions)
```
Mọi component thực hiện store action (save, generate, persist) PHẢI có test
verify store action được gọi với đúng args — không chỉ test UI rendering.
Ví dụ: PlanComputingScreen phải test generatePlan() được gọi, không chỉ test
spinner hiển thị.
```

### Rule: Cleanup Verification Checklist
```
Khi xóa code cũ trong migration, BẮT BUỘC verify code mới cover TẤT CẢ
chức năng của code cũ. Tạo checklist các function trong code cũ và check
từng cái có replacement chưa.
```

### Rule: Touch Targets Minimum 44px
```
Mọi interactive element (button, link, tab) phải có min-h-[44px] min-w-[44px].
Nếu icon nhỏ hơn 44px, mở rộng hit area bằng padding.
Không bao giờ tạo button nhỏ hơn 44×44px.
```

### Rule: No Emoji as Icons
```
KHÔNG dùng emoji (💪🎯🏋️) làm structural icons trong UI.
Luôn dùng SVG icons từ Lucide (lucide-react).
Emoji chỉ dùng trong text content, không dùng trong navigation, buttons, indicators.
```

---

## §8. Implementation Priority

| Priority | Section | Effort | Impact |
|----------|---------|--------|--------|
| P0 | §2 Bug 2 (plan generation) | HIGH | App non-functional |
| P0 | §1 Bug 1 (safe-area remaining) | LOW | Content invisible |
| P1 | §3a (goNext stability) | LOW | Animation restart risk |
| P1 | §4a (escape route) | LOW | User trapped 10s |
| P1 | §4c (emoji → SVG) | LOW | Accessibility |
| P1 | §4e-f (touch targets) | MEDIUM | Below WCAG minimums |
| P2 | §5a-e (plan editing features) | HIGH | Feature completeness |
| P2 | §4g (dialog a11y) | LOW | Screen reader UX |
| P3 | §3b-d (memo/prefetch) | LOW | Performance optimization |
| P3 | §7 (copilot rules) | LOW | Prevention |
