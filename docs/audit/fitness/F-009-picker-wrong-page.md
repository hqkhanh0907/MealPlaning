# F-009-picker-wrong-page — Free-mode exercise picker lives on overview, not on active session

**Severity:** P2
**Status:** OPEN — blueprint locked Turn 10. Implementation deferred to Phase P3 (IA cleanup).
**Discovered:** Turn 1, code-only

## Evidence (current behavior)

`fitness.page.html:173-212` — inside the overview page, a full exercise picker UI is rendered: search input, muscle-group filter chips, scrollable result list, "Bắt đầu tập tự do" CTA. This is **on the same page** that already hosts:

- the today's-workout card (lines 101-148)
- the resume-banner (215-238)
- the active-plan summary
- the progress / volume metrics
- the "Lịch sử" CTA (added Turn 4)
- the AI-plan generation surface

So the overview page does six things, the sixth of which is a search engine. This is the same root issue as F-001 ("kitchen-sink overview"), narrowed to one offender.

Concretely, the picker is also wrong because:

1. **Mode mismatch.** Free-mode exercise selection is a *during-session* concern. You don't pick free-mode exercises while looking at "Tiến trình tuần này" — you pick them when you've decided to train *now* and don't have a plan. The picker's home should be inside `/tabs/fitness/active` (the workout context), opened as a modal / sheet from a "Thêm bài tập" trigger.
2. **Wasted real-estate when not in use.** 95% of the time the user is on the overview to check progress or start a planned session — the picker occupies a third of the scroll height for nothing.
3. **Wrong action grouping.** "Start free workout" is conceptually peer with "Start today's workout." Putting them in different parts of the page (planned at top, free below the picker) makes the choice feel asymmetric. The right asymmetry: "Hôm nay" hero card → secondary "Tập tự do" trigger that *opens the picker as a sheet*, not as an inline section.
4. **In-session add-exercise gap.** A user who started guided and wants to add an accessory mid-session has nowhere to do it — the only picker is back on the overview, requiring a route-out. Apple's HIG: actions live where they're done.

## Cause

Original implementation built free-mode as "another way to start from overview"; the picker followed the start button. The active-workout page never gained an "add exercise" affordance because the data flow assumed: session is created with its exercise list at start time, immutable thereafter.

`WorkoutRepository.addExerciseToSession` actually **already exists** (verified during F-005 audit, called by `store.addExerciseToActiveSession`) — the repo capability is in place; only the UI surface is missing.

## Proposed fix (blueprint)

### IA — split into two surfaces

1. **Overview page (`/tabs/fitness`)** — strip out the inline picker entirely. Replace with two equal-weight CTAs in the today's-workout card:
   - Primary: "Bắt đầu hôm nay" (guided, today's plan) — when not rest-day
   - Secondary: "Tập tự do" — single tap opens the picker as a modal sheet
   - On rest-day: primary becomes "Tập tự do," secondary becomes "Đổi sang ngày khác" (future). No picker on this page either way.

2. **Active-workout page (`/tabs/fitness/active`)** — add a footer-anchored secondary "Thêm bài tập" trigger (small text button below the per-exercise card, NOT in the bottom toolbar — that's reserved for F-008's "Hoàn thành"). Tap → opens the same picker modal sheet, but in "add-to-existing-session" mode. On select: calls `store.addExerciseToActiveSession(exerciseId)` → repo `addExerciseToSession` → new tab appears, auto-selected.

### Modal component — `app-exercise-picker-sheet`

A new standalone component (lives in `src/app/features/fitness/components/exercise-picker-sheet/`). Single responsibility: search → select → emit. Reused from both surfaces.

```
┌───────────────────────────────────┐
│ ←  Chọn bài tập           [×]    │ <- header: back-or-close depending on stack
├───────────────────────────────────┤
│ 🔍 Tìm bài tập…                  │ <- search input (floating-label per §8.6)
├───────────────────────────────────┤
│ [Ngực] [Lưng] [Chân] [Vai] [+]  │ <- horizontal scroll chips (muscle group)
├───────────────────────────────────┤
│ ▢ Đẩy ngực tạ đòn        compound│
│ ▢ Đẩy ngực tạ đơn         compound│
│ ▢ Hít xà                  pull   │
│  ⋮                                │
├───────────────────────────────────┤
│ [ Bắt đầu / Thêm vào buổi tập ]  │ <- footer CTA, label depends on mode
└───────────────────────────────────┘
```

Props:
- `mode: 'start-free' | 'add-to-active'`
- `excludeIds: string[]` — for "add" mode, exclude exercises already in the session
- Output: `(selected: Exercise[]) => void`

Sheet presentation via `IonModal` with `initialBreakpoint=0.9`, `breakpoints=[0, 0.5, 0.9]`. Drag handle. Sheet pattern matches Apple's "Add to Reading List."

### Files to change (when implemented)

- New: `src/app/features/fitness/components/exercise-picker-sheet/exercise-picker-sheet.{ts,html,scss,spec.ts}`
- `src/app/features/fitness/fitness.page.{ts,html,scss}` — REMOVE inline picker (lines 173-212), add modal trigger button to today's card
- `src/app/features/fitness/active-workout/active-workout.page.{ts,html,scss}` — ADD "Thêm bài tập" secondary trigger + modal wiring
- `src/app/core/stores/fitness.store.ts` — if needed, surface `availableExercises` + `addExerciseToActiveSession` as crisp action; both already exist, just verify shape
- `src/app/features/fitness/fitness.page.scss` — drop now-unused picker styles
- Specs for the new sheet + integration tests on both pages

### Floor for what stays on overview

After the strip:
- Today's-workout hero card (planned or rest)
- One-line "Tập tự do" secondary CTA (opens sheet)
- Resume banner (when active session exists; F-010 separately reduces this to one-line strip)
- Progress section (week volume + Lịch sử CTA)
- Active plan summary
- AI-plan generation
- Onboarding-state empty illustration

This is still a lot, but each item is now a single-purpose tile, not a multi-control panel. F-001 (overview kitchen-sink) is what tackles further stripping; F-009 is just removing the worst offender.

## Apple-spirit re-audit (against blueprint)

- **Tách bạch:** picker now lives in the workout context, not the dashboard context. Each page has a clean reason for existing.
- **Action where action happens:** during-session add-exercise lives during-session. No route-out to overview, no broken mental model.
- **Modal sheet, not modal screen:** the sheet's drag handle and partial coverage preserve the user's place in the underlying page. Apple uses this exact pattern for picker-style actions.
- **Single picker component:** reused from two surfaces with one prop (`mode`); behavior is consistent, label is contextual ("Bắt đầu" vs "Thêm vào buổi tập"). Trust through familiarity.
- **Reduced overview height:** removing a third of the inline scroll lowers cognitive load on the page users visit most often.

## Test plan

- ⏳ Unit: sheet component renders chips/search/list; emits selected exercises; respects `excludeIds`.
- ⏳ Component: overview page's "Tập tự do" CTA opens sheet in `start-free` mode; active-workout's "Thêm bài tập" opens in `add-to-active` mode with correct excludeIds.
- ⏳ Store: `addExerciseToActiveSession` updates `activeSession.exercises` optimistically, retries on failure.
- ⏳ E2E: from overview, tap "Tập tự do," pick 2 exercises, start → land on active-workout with 2 tabs. From active-workout, tap "Thêm bài tập," pick 1 → 3 tabs, new tab auto-selected.

## Status

**OPEN — blueprint locked Turn 10.** Picker extraction to modal sheet + active-workout integration designed. Sequenced after F-005/F-007 (Phase P2 migrations) so the bigger UX redistribution doesn't compete for review attention with schema work. Phase P3 IA cleanup.
