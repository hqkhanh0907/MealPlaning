# Fitness — New IA Proposal (page-per-task, Apple-spirit)

> **Status:** Draft v1, Turn 2 of audit loop. Based on Turn 1 code map + Turn 2 repo-method verification (`recentSessions` already exists).

## Guiding principles (from goal prompt, restated as design rules)

1. **One job per screen.** If a screen answers more than one question, it's two screens.
2. **Bottom-anchored primary action** for any flow that ends in an irreversible commit (Apple HIG).
3. **Modals/sheets only for sub-tasks that interrupt the parent flow** (add exercise, edit set, confirm cancel, rest timer). Anything the user could reasonably come back to next week becomes its own page.
4. **History before charts.** A list of past sessions is the trust-builder; aggregates are decoration.
5. **No mode-switching surfaces.** A page never asks the user "are you in guided mode or free mode?" — the data answers that.

## Current vs proposed route map

| Path | Today (verified) | Proposed | Rationale |
|---|---|---|---|
| `/tabs/fitness` | Kitchen-sink overview (316 lines, 6 jobs) | **Hub** — today's plan or active session only; ≤ 1 viewport | F-001, F-010 |
| `/tabs/fitness/plans` | _absent_ — embedded in overview lines 25-99 | **Plans index** — preset list + active plan | F-001 |
| `/tabs/fitness/plans/:id` | _absent_ | **Plan detail** — week strip + per-day exercises, activate CTA | F-001 |
| `/tabs/fitness/plans/ai-new` | Embedded callout lines 36-53 | **AI plan creator** — full wizard, not an inline callout | F-001 |
| `/tabs/fitness/active` | Set logger (good) — but with cramped header actions | **Active workout** — kept, header redesigned (F-008), edit moves to sheet (F-004) | F-004, F-008 |
| `/tabs/fitness/active/add-exercise` (modal sheet) | Free-mode picker on overview (lines 173-212) | **Sheet** invoked from active workout only | F-009 |
| `/tabs/fitness/active/finish-summary` | _absent_ — just an alert dialog today | **Finish summary** page — celebrate, show stats, prompt RPE/effort, optional note | F-008, F-007 |
| `/tabs/fitness/history` | _absent_ | **History list** — grouped by ISO week, repo already supports it | F-002 |
| `/tabs/fitness/history/:sessionId` | _absent_ | **Session detail** — read-only WorkoutSessionDetail render | F-002 |
| `/tabs/fitness/progress` | Embedded charts lines 241-315 | **Progress** — charts + 1RM, moved out of hub | F-001 |

## Component split per page (Apple-clean responsibility lines)

| Page | Owns | Renders | Side effects allowed |
|---|---|---|---|
| Hub | "What's next?" | `<active-session-hero>` OR `<today-plan-card>` OR `<empty-hub>` | navigate, none else |
| Plans index | Plan inventory | `<plan-card>` x N + AI plan CTA | activate plan, navigate |
| Plan detail | Per-plan structure | `<week-strip>`, `<planned-exercise-row>` x N | activate plan |
| Active workout | Set logging | `<exercise-tab-rail>`, `<set-logger>` (strength OR cardio), `<rest-timer>` | logSet, deleteSet, openSheet |
| Add-exercise sheet | Picker | `<exercise-search>`, `<exercise-chip>` x N | addExerciseToActive |
| Edit-set sheet | Mutation | Full draft form mirror | updateSet (full draft) |
| Finish summary | Reflection | `<session-stats>`, `<effort-selector>`, `<note-field>` | completeWorkout |
| History list | Reflection | grouped by week, `<session-row>` | navigate |
| Session detail | Audit | read-only WorkoutSessionDetail | none |
| Progress | Aggregates | charts | none |

## What we KEEP exactly as-is

- `WorkoutRepository.{getActiveSession, startGuidedSession, startFreeSession, addSet, deleteSet, completeSession, recentSessions, progressSummary}` — all serve the new IA unchanged.
- `RestTimer` component (already its own component).
- DB schema for `workout_session` / `workout_exercise` (only `workout_set` needs migration for F-003 cardio + F-007 status column).

## What MOVES (refactor only, no schema change)

- 6 sections in `fitness.page.html` → split into 5 new page templates + 1 hub template. Logic stays in `FitnessStore`; only template ownership changes.

## What's NEW (genuine additions)

- Migrations for: `workout_set.set_type`, `workout_set.duration_seconds`, `workout_set.distance_m`, `workout_set.status`, `workout_set.completed_at` (F-003, F-007).
- `workout_session.status` (`'active'|'completed'|'cancelled'|'paused'`) for F-005 soft-cancel.
- Routes: `plans`, `plans/:id`, `plans/ai-new`, `active/finish-summary`, `history`, `history/:sessionId`, `progress`.
- Page components for each new route.
- Sheet components: `add-exercise-sheet`, `edit-set-sheet`.
- Repo methods: `cancelSessionSoft`, `updateSetFull(setId, fullDraft)`, `listSessionsPaged(before, limit)` (recentSessions is enough for v1).

## Text wireframes (mandatory output #10)

### Hub `/tabs/fitness` — Active session case
```
┌─────────────────────────────────────┐
│  Tập luyện               ⚙  Cài đặt │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │ Đang tập · Theo giáo án       │  │  ← single hero card
│  │ Push Day · 3/5 bài            │  │
│  │ ────────────────────────────  │  │
│  │ [   Tiếp tục buổi tập   ]    │  │  ← filled, full-width
│  └───────────────────────────────┘  │
│                                     │
│  Hôm qua  ›   Lịch sử  ›   Tiến trình ›  ← three text links, no charts
└──── Bottom tabs: ... Tập luyện ─────┘
```

### Hub `/tabs/fitness` — Today (no active session)
```
┌─────────────────────────────────────┐
│  Tập luyện                       ⚙ │
├─────────────────────────────────────┤
│  T5 · Push Day                      │  ← today's training-day name
│  4 bài · ~45 phút                   │  ← inferred duration estimate
│                                     │
│  ┌ Bench press · 4×6-8 ─────────┐   │  ← planned exercise list,
│  │ Overhead press · 3×8-10      │   │     summary-only (no editing)
│  │ Tricep dip · 3×10-12         │   │
│  │ Lateral raise · 3×12-15      │   │
│  └──────────────────────────────┘   │
│                                     │
│  [    Bắt đầu buổi tập     ]       │  ← single primary, bottom-anchored
│  Hoặc:  Tập tự do                   │  ← text link, not a button
│                                     │
│  Lịch sử ›    Tiến trình ›   Giáo án ›
└── Bottom tabs ──────────────────────┘
```

### Active workout `/tabs/fitness/active` (redesigned)
```
┌─────────────────────────────────────┐
│  ‹ Buổi tập                      ⋯ │  ← back + overflow (cancel moves here)
├─────────────────────────────────────┤
│  Push Day · Theo giáo án            │
│  00:23:14   3/5 bài  ·  840kg vol   │  ← live timer (NEW)
├─────────────────────────────────────┤
│  ◉ Bench press  ○ OHP  ○ Dip  ○ LR │  ← horizontal exercise rail
│  2/4 sets  ▰▰▱▱                     │  ← progress vs plan (F-011)
├─────────────────────────────────────┤
│  Set 1  60kg × 8        Vừa     ✎  │  ← past sets with edit pencil
│  Set 2  62.5kg × 8      Nặng    ✎  │
│  ────────────────────────────────── │
│  Set 3 (tiếp theo)                  │
│  [ Tạ kg ]  [ Reps ]  [ Nghỉ ]      │
│   Mức nỗ lực:  Dễ  Vừa  Nặng  Max   │
│   Ghi chú (tuỳ chọn)                │
│                                     │
│  ┌──── Rest timer · 01:32 ────┐     │  ← appears only post-log
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│  [   Ghi Set 3   ]    + Bài tập     │  ← primary log + add-exercise sheet
├─────────────────────────────────────┤
│  Khi xong:  [ Hoàn thành buổi tập ] │  ← fixed bottom-anchored, hides while typing
└─────────────────────────────────────┘
```

### Finish summary `/tabs/fitness/active/finish-summary`
```
┌─────────────────────────────────────┐
│              ✓                      │
│      Hoàn thành buổi tập            │
│         45 phút · 12 set            │
│           Volume 840kg              │
├─────────────────────────────────────┤
│  Cảm giác chung của buổi này?       │
│  ◉ Dễ   ○ Vừa   ○ Nặng   ○ Tới hạn │  ← session-level RPE (NEW)
│                                     │
│  Ghi chú buổi tập (tuỳ chọn)        │
│  ┌──────────────────────────────┐   │
│  │                              │   │
│  └──────────────────────────────┘   │
├─────────────────────────────────────┤
│  [    Lưu và đóng    ]              │
└─────────────────────────────────────┘
```

### History `/tabs/fitness/history`
```
┌─────────────────────────────────────┐
│  ‹ Lịch sử                          │
├─────────────────────────────────────┤
│  Tuần này                           │
│  ────────────────────────────────── │
│  T2  Push Day        12 set  ›      │
│  T4  Pull Day        10 set  ›      │
│                                     │
│  Tuần trước                         │
│  ────────────────────────────────── │
│  T2  Push Day        11 set  ›      │
│  T4  Pull Day         9 set  ›      │
│  T6  Legs            14 set  ›      │
│                                     │
│  Tháng 4                            │
│  ...                                │
└─────────────────────────────────────┘
```

## Roadmap (mandatory output #9)

Pure-template phases first (no schema risk), then schema-tied work, then polish.

| Phase | Theme | Deliverables | Blocks unblocked | Est. complexity |
|---|---|---|---|---|
| **P0** | Move out without breaking | New routes `history`, `progress`, `plans`; move existing template sections wholesale; hub becomes hero-only. No store/repo changes. | F-001, F-002, F-010 | S |
| **P1** | Active-workout redesign | Bottom-anchored complete button; live timer; exercise progress ring; edit-set sheet (full draft) | F-004, F-008, F-011 | M |
| **P2** | Soft cancel + finish summary | `workout_session.status` migration; finish-summary page; undo toast on cancel | F-005 | M |
| **P3** | Set state machine | `workout_set.status, completed_at`; skip action; rendering | F-007 | M |
| **P4** | Cardio support | `workout_set.set_type, duration_seconds, distance_m`; fork logger UI | F-003 | L |
| **P5** | Autosave + offline polish | localStorage draft; resume restore; offline indicator | F-006 | S |
| **P6** | Add-exercise sheet | Move free-mode picker out of overview into sheet | F-009 | S |
| **P7** | Test backfill | unit/integration/e2e per `tests-needed.md` | — | M |

Each phase ends with: rebuild APK → install on emulator → screenshot critical flow → sub-agent visual audit → record in INDEX.md → tick the issue file.

## What this proposal explicitly REJECTS

- A "Quick log" button on the hub. Tempting but it forces an active-session decision before the user has chosen a plan; violates principle 5.
- A theme-switcher. The repo is light-only by decree (CLAUDE.md, Story 2.6). Don't re-introduce.
- An "Insights" tab. The Goal Prompt doesn't ask for it, and it'd be a 7th job on top of the 6 we just split out.
