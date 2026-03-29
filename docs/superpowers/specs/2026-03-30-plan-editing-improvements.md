# Plan Editing Improvements — Design Spec

**Status:** Draft (extracted from unified onboarding spec v3)
**Date:** 2026-03-30
**Author:** AI (Copilot CLI)
**Parent:** [`2026-03-30-unified-onboarding-design.md`](./2026-03-30-unified-onboarding-design.md)
**Scope:** Post-onboarding plan editing UX enhancements

---

## 1. Problem Statement

After onboarding, users can edit their training plan but several UX gaps exist:
- No way to regenerate plan on demand (only when plan expires)
- `removePlanDaySession()` exists in store but has **no UI**
- Exercise removal is immediate with no undo — violates Web Interface Guidelines
- Rest/workout day types are fixed by plan generation, cannot be toggled
- Multiple accessibility issues: missing aria-labels, hardcoded English strings, touch targets below 44pt

## 2. Affected Components

| Component | File | Changes |
|-----------|------|---------|
| TrainingPlanView | `src/features/fitness/components/TrainingPlanView.tsx` | Regenerate button, long-press day toggle, calendar touch targets, i18n day labels |
| PlanDayEditor | `src/features/fitness/components/PlanDayEditor.tsx` | Undo toast for remove, aria-label i18n, stepper touch targets |
| SessionTabs | `src/features/fitness/components/SessionTabs.tsx` | Long-press delete session, aria-label, add button touch target |
| AddSessionModal | `src/features/fitness/components/AddSessionModal.tsx` | Muscle group i18n, touch targets |
| ExerciseSelector | `src/features/fitness/components/ExerciseSelector.tsx` | Search/filter/item aria-labels |

---

## 3. Feature Details

### 3a. Regenerate Plan Anytime

**Current**: Regenerate button only visible when plan expired.
**New**: Always-visible "Tạo lại" button in TrainingPlanView header.

**Behavior**:
- Tap → Confirmation dialog: "Tạo lại kế hoạch sẽ thay thế kế hoạch hiện tại. Bạn chắc chắn?"
- Confirm → `generatePlan({ trainingProfile, healthProfile })` runs with current profile → replaces existing plan
- Cancel → no change
- After regeneration: show success toast + optional plan preview

**Component**: TrainingPlanView.tsx — add RefreshCw icon button in header

### 3b. Delete Session UI

**Current**: `removePlanDaySession(dayId)` exists in fitnessStore but NO UI.
**New**: Long-press on session tab → context menu with "Xóa buổi tập".

**Decision**: Long-press gesture chosen over swipe (swipe conflicts with tab switching on mobile) and edit mode (adds extra step for infrequent action).

**Behavior**:
- Long-press (500ms) on session tab → bottom sheet: "Xóa buổi tập {type}?"
- Confirm → `removePlanDaySession(dayId)`, auto-select remaining session
- If only 1 session left: prevent deletion, show toast "Không thể xóa buổi tập cuối cùng. Chuyển ngày thành nghỉ thay thế."

**Component**: SessionTabs.tsx — add long-press handler

### 3c. Exercise Remove → Undo Toast

**Current**: PlanDayEditor — red X deletes exercise immediately, no confirmation.
**New**: Remove → undo toast pattern (Web Interface Guidelines: "never immediate" for destructive actions).

**Behavior**:
1. Tap X → exercise visually removed (local state update, animation: slide-out + fade)
2. Toast appears: "Đã xóa {exercise name}" + "Hoàn tác" button
3. Toast auto-dismiss after 5s → exercise removal finalized
4. "Hoàn tác" → exercise re-inserted at original position

**Rapid removal**: New removal replaces the previous undo. Only the most recent removal can be undone. This is acceptable because sequential rapid removals are rare, and a multi-undo queue adds complexity without proportional UX benefit.

**Implementation**: Track `lastRemovedExercise: { exercise, index } | null` in component state. Toast uses existing notify system with action button.

### 3d. Toggle Rest ↔ Workout Day

**Current**: Rest days fixed by plan generation. No conversion.
**New**: Long-press on day pill in calendar → bottom sheet with options.

**Long-press bottom sheet options**:
- If rest day: "Thêm buổi tập" → AddSessionModal opens
- If workout day with sessions: "Chuyển thành ngày nghỉ" → Confirm → remove all sessions for that day

**Behavior**:
- Converting rest → workout: Opens AddSessionModal, user picks session type
- Converting workout → rest: Confirmation dialog (destructive), then `removePlanDaySession()` for all sessions on that day

**Component**: TrainingPlanView.tsx — add long-press handler on calendar day pills

### 3e. Accessibility & i18n Fixes (from Web Guidelines audit)

**ExerciseSelector.tsx**:
- Add `aria-label` to search input: `aria-label={t('fitness.exerciseSelector.search')}`
- Add `aria-label` to filter chip buttons: `aria-label={t('fitness.muscleGroup.' + group)}`
- Add `aria-label` to exercise list items

**PlanDayEditor.tsx**:
- Replace hardcoded English aria-labels ("Move up", "Remove") with i18n keys
- Increase stepper buttons from `h-9 w-9` to `h-11 w-11` (44pt touch target)

**AddSessionModal.tsx**:
- Replace hardcoded muscle group English names with `t('fitness.muscleGroup.' + group)`
- Increase muscle group buttons padding for 44pt touch targets

**TrainingPlanView.tsx**:
- Replace `DAY_FULL_LABELS` hardcoded array with i18n keys
- Increase calendar day pill height for 44pt touch target

**SessionTabs.tsx**:
- Add `aria-label` to add session button
- Increase add button to `h-11 w-11` (44pt)

---

## 4. New i18n Keys

```json
{
  "fitness.plan.regenerate": "Tạo lại kế hoạch",
  "fitness.plan.regenerateConfirm": "Tạo lại kế hoạch sẽ thay thế kế hoạch hiện tại. Bạn chắc chắn?",
  "fitness.plan.regenerateSuccess": "Đã tạo lại kế hoạch thành công!",
  "fitness.plan.deleteSession": "Xóa buổi tập",
  "fitness.plan.deleteSessionConfirm": "Xóa buổi tập {{type}}? Bài tập sẽ bị xóa.",
  "fitness.plan.cannotDeleteLast": "Không thể xóa buổi tập cuối cùng. Chuyển ngày thành nghỉ thay thế.",
  "fitness.plan.exerciseRemoved": "Đã xóa {{name}}",
  "fitness.plan.undo": "Hoàn tác",
  "fitness.plan.addWorkout": "Thêm buổi tập",
  "fitness.plan.convertToRest": "Chuyển thành ngày nghỉ",
  "fitness.plan.convertToRestConfirm": "Chuyển thành ngày nghỉ sẽ xóa tất cả buổi tập. Bạn chắc chắn?",
  "fitness.plan.aria.moveUp": "Di chuyển lên",
  "fitness.plan.aria.moveDown": "Di chuyển xuống",
  "fitness.plan.aria.removeExercise": "Xóa bài tập",
  "fitness.plan.aria.addSession": "Thêm buổi tập mới",
  "fitness.plan.aria.editSets": "Chỉnh sửa số set",
  "fitness.plan.aria.editReps": "Chỉnh sửa số rep"
}
```

---

## 5. Test Strategy

### Unit Tests
- Regenerate: mock `generatePlan()`, verify confirmation dialog, verify plan replacement
- Delete session: long-press trigger, confirm dialog, last-session prevention
- Undo toast: remove → toast shown → undo → exercise restored → timeout → finalized
- Day toggle: rest→workout (AddSessionModal opens), workout→rest (confirmation + removal)

### Integration Tests
- Full flow: generate plan → edit exercises → remove with undo → regenerate → verify plan replaced
- Accessibility: all aria-labels present, touch targets ≥44pt

### Manual Verification
- Emulator-5556: verify long-press gestures work on touch screen
- Verify undo toast timing (5s) feels right
- Verify calendar touch targets are comfortable on mobile

---

## 6. Dependencies

- **fitnessStore**: `removePlanDaySession()`, `updatePlanDayExercises()`, `restorePlanDayOriginal()` — all already exist
- **generatePlan()**: in `useTrainingPlan.ts` — already exists
- **Notify system**: for undo toast — verify action button support in existing toast component
