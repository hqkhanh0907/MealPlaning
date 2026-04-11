# TEST PLAN — TASK-W3-03: Rest Timer Enhancement

> QA Agent — Vitest + React Testing Library + Fake Timers
> Component: `src/features/fitness/components/RestTimer.tsx`
> Test File: `src/__tests__/RestTimer.test.tsx`

---

## 1. ANALYSIS — Current vs Target State

### Current Implementation (175 LOC)

| Feature               | Status | Notes                                     |
| --------------------- | ------ | ----------------------------------------- |
| SVG ring (dashoffset) | ✅     | transition `0.3s ease` (wrong)            |
| Center time display   | ✅     | `text-2xl` (should be `text-4xl`)         |
| +30s button           | ✅     | Calls `onAddTime?.(30)`                   |
| Skip button           | ✅     | Calls `onSkip()`, clears interval         |
| Pause/resume toggle   | ❌     | **NOT IMPLEMENTED**                       |
| Ring color states     | ❌     | Always `text-primary`, no paused state    |
| `motion-reduce`       | ❌     | No reduced motion support on ring         |
| Auto-complete         | ✅     | Calls `onComplete()` when remaining === 0 |
| `isVisible` guard     | ✅     | Returns null + clears timer when false    |

### Current Test Coverage (21 tests)

Tests cover: initial display, countdown, onComplete, +30s, skip, ring progress,
cleanup, zero duration, accessibility basics, isVisible=false.

**Gaps in current tests:**

- No pause/resume (feature doesn't exist yet)
- No visual state verification (ring color classes)
- No `motion-reduce` test
- No transition timing verification
- No `text-4xl` class assertion
- No multi-press +30s accumulation test
- No +30s during last seconds test

### Constants

```
RADIUS = 54
CIRCUMFERENCE = 2 × π × 54 = 339.29200658769764
ADD_SECONDS = 30
```

### Ring Math

```
progress = remaining / totalDuration
dashoffset = CIRCUMFERENCE × (1 - progress)

At t=0s (d=10): remaining=10, progress=1.0, offset=0
At t=5s (d=10): remaining=5,  progress=0.5, offset=169.646
At t=9s (d=10): remaining=1,  progress=0.1, offset=305.363
At t=10 (d=10): remaining=0,  progress=0.0, offset=339.292

After +30s at t=0 (d=10):
  remaining=40, totalDuration=40, progress=1.0, offset=0
After +30s at t=5 (d=10, remaining=5):
  remaining=35, totalDuration=40, progress=0.875, offset=42.412
```

---

## 2. TEST SCENARIOS

### SC_W303_01: Timer Display & Initialization

**Objective:** Verify timer renders with correct format, CSS classes, and initial values.

| TC ID      | Test Case                                       | Type |
| ---------- | ----------------------------------------------- | ---- |
| TC_W303_01 | Initial display 90s → "1:30"                    | Unit |
| TC_W303_02 | Display has `text-4xl font-bold tabular-nums`   | Unit |
| TC_W303_03 | Format exact minutes: 120s → "2:00"             | Unit |
| TC_W303_04 | Format seconds only: 45s → "0:45"               | Unit |
| TC_W303_05 | Format with zero: 0s → "0:00"                   | Unit |
| TC_W303_06 | Overlay has `role="alertdialog"` + `aria-modal` | Unit |
| TC_W303_07 | Returns null when `isVisible=false`             | Unit |

### SC_W303_02: Countdown Tick Accuracy

**Objective:** Verify 1s interval ticks, correct progression, stops at 0.

| TC ID      | Test Case                                           | Type |
| ---------- | --------------------------------------------------- | ---- |
| TC_W303_08 | After 1s → display shows "1:29" (from 90s)          | Unit |
| TC_W303_09 | After 2s → display shows "1:28"                     | Unit |
| TC_W303_10 | Timer counts full to 0 (3s duration → 3s → "0:00")  | Unit |
| TC_W303_11 | Timer stops at 0 — does not go negative             | Unit |
| TC_W303_12 | No tick when isVisible flips to false mid-countdown | Unit |

### SC_W303_03: SVG Ring Animation

**Objective:** Verify ring progress, dashoffset math, transition, reduced motion.

| TC ID      | Test Case                                                  | Type |
| ---------- | ---------------------------------------------------------- | ---- |
| TC_W303_13 | Ring starts full: dashoffset ≈ 0 at t=0                    | Unit |
| TC_W303_14 | Ring depletes: dashoffset increases after 5s (d=10)        | Unit |
| TC_W303_15 | Ring fully depleted at t=d: dashoffset ≈ CIRCUMFERENCE     | Unit |
| TC_W303_16 | `strokeDasharray` = CIRCUMFERENCE on progress circle       | Unit |
| TC_W303_17 | Transition style = `stroke-dashoffset 1s linear`           | Unit |
| TC_W303_18 | Circle has `motion-reduce:[transition:none]` class (BR-40) | Unit |
| TC_W303_19 | SVG is `aria-hidden="true"`                                | Unit |

### SC_W303_04: +30s Extension (BR-18)

**Objective:** Verify +30s accumulates, calls callback, works at edge cases.

| TC ID      | Test Case                                                        | Type |
| ---------- | ---------------------------------------------------------------- | ---- |
| TC_W303_20 | +30s at t=0 (d=60): display → "1:30", remaining=90               | Unit |
| TC_W303_21 | +30s calls `onAddTime(30)` callback                              | Unit |
| TC_W303_22 | +30s without `onAddTime` prop → no throw                         | Unit |
| TC_W303_23 | Multiple presses accumulate: 3× +30s = +90s total                | Unit |
| TC_W303_24 | +30s in last 5 seconds: d=10 at t=8 (remaining=2) → remaining=32 | Unit |
| TC_W303_25 | +30s recalculates ring progress (totalDuration updates)          | Unit |
| TC_W303_26 | +30s while paused adds time but timer stays paused               | Unit |

### SC_W303_05: Skip Button

**Objective:** Verify skip dismisses timer, stops interval, fires correct callback.

| TC ID      | Test Case                                  | Type |
| ---------- | ------------------------------------------ | ---- |
| TC_W303_27 | Skip calls `onSkip` callback               | Unit |
| TC_W303_28 | Skip clears interval — no ticks after skip | Unit |
| TC_W303_29 | Skip does NOT call `onComplete`            | Unit |
| TC_W303_30 | Skip while paused still calls `onSkip`     | Unit |

### SC_W303_06: Pause/Resume Toggle ⭐ NEW

**Objective:** Verify pause stops ticking, resume restarts, visual state changes.

| TC ID      | Test Case                                                                       | Type |
| ---------- | ------------------------------------------------------------------------------- | ---- |
| TC_W303_31 | Pause button rendered in initial (running) state                                | Unit |
| TC_W303_32 | Click pause → countdown freezes (no decrement)                                  | Unit |
| TC_W303_33 | After pause, button label changes to resume text                                | Unit |
| TC_W303_34 | Click resume → countdown resumes from paused value                              | Unit |
| TC_W303_35 | Pause at t=3 (d=10, remaining=7) → resume after 5s → remaining still 7          | Unit |
| TC_W303_36 | Multiple pause/resume cycles: pause(5s)→resume→tick→pause→resume→tick           | Unit |
| TC_W303_37 | Timer cannot complete while paused (remaining=1 → pause → advance 5s → still 1) | Unit |

### SC_W303_07: Visual States & Ring Color ⭐ NEW

**Objective:** Verify ring color reflects running vs paused state.

| TC ID      | Test Case                                                     | Type |
| ---------- | ------------------------------------------------------------- | ---- |
| TC_W303_38 | Running state: progress circle has `stroke-primary` class     | Unit |
| TC_W303_39 | Paused state: progress circle changes to `stroke-muted` class | Unit |
| TC_W303_40 | Resume: circle returns to `stroke-primary`                    | Unit |

### SC_W303_08: Auto-Complete & Auto-Advance

**Objective:** Verify onComplete fires exactly once at 0, interval cleaned up.

| TC ID      | Test Case                                               | Type |
| ---------- | ------------------------------------------------------- | ---- |
| TC_W303_41 | `onComplete` called exactly 1× when remaining reaches 0 | Unit |
| TC_W303_42 | `onComplete` NOT called before timer finishes (t < d)   | Unit |
| TC_W303_43 | Interval cleared after reaching 0 (no further ticks)    | Unit |
| TC_W303_44 | `onComplete` fires after +30s extension expires         | Unit |

### SC_W303_09: Cleanup & Lifecycle

**Objective:** Verify resource cleanup on unmount and visibility changes.

| TC ID      | Test Case                                     | Type |
| ---------- | --------------------------------------------- | ---- |
| TC_W303_45 | clearInterval called on unmount               | Unit |
| TC_W303_46 | Timer stops when `isVisible` changes to false | Unit |
| TC_W303_47 | Zero duration → immediate `onComplete` call   | Unit |

### SC_W303_10: Accessibility

**Objective:** Verify ARIA compliance for overlay, progress, buttons.

| TC ID      | Test Case                                                                 | Type |
| ---------- | ------------------------------------------------------------------------- | ---- |
| TC_W303_48 | Overlay: `role="alertdialog"`, `aria-modal="true"`, `aria-label`          | Unit |
| TC_W303_49 | Progress element: `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax=100` | Unit |
| TC_W303_50 | Progress `aria-valuenow` updates as timer ticks                           | Unit |
| TC_W303_51 | All interactive buttons have `aria-label`                                 | Unit |
| TC_W303_52 | SVG element has `aria-hidden="true"`                                      | Unit |

---

## 3. DETAILED TEST CASES

### TC_W303_01 — Initial display 90s → "1:30"

```
Pre-condition: Component mounted with durationSeconds=90
Steps:
  1. Render <RestTimer durationSeconds={90} onComplete={fn} onSkip={fn} />
  2. Query [data-testid="timer-display"]
Expected:
  - textContent = "1:30"
```

### TC_W303_02 — Display CSS classes

```
Pre-condition: Component mounted
Steps:
  1. Render <RestTimer durationSeconds={90} onComplete={fn} onSkip={fn} />
  2. Query [data-testid="timer-display"]
  3. Check className
Expected:
  - className contains "text-4xl"
  - className contains "font-bold"
  - className contains "tabular-nums"
```

### TC_W303_08 — Countdown tick from 90s

```
Pre-condition: vi.useFakeTimers(), component mounted with durationSeconds=90
Steps:
  1. Render timer
  2. act(() => vi.advanceTimersByTime(1000))
  3. Query timer-display
Expected:
  - textContent = "1:29"
Steps continued:
  4. act(() => vi.advanceTimersByTime(1000))
Expected:
  - textContent = "1:28"
```

### TC_W303_10 — Timer counts to 0

```
Pre-condition: durationSeconds=3, fake timers
Steps:
  1. Render timer with durationSeconds=3
  2. act(() => vi.advanceTimersByTime(3000))
Expected:
  - timer-display textContent = "0:00"
  - onComplete called exactly 1 time
```

### TC_W303_11 — Timer stops at 0

```
Pre-condition: durationSeconds=2
Steps:
  1. Render timer with durationSeconds=2
  2. act(() => vi.advanceTimersByTime(5000))  // advance well past 0
Expected:
  - timer-display textContent = "0:00" (not negative)
  - onComplete called exactly 1 time (not multiple)
```

### TC_W303_13 — Ring starts full

```
Pre-condition: Component just mounted, t=0
Steps:
  1. Render with durationSeconds=10
  2. Query [data-testid="progress-circle"]
  3. Read style.strokeDashoffset
Expected:
  - strokeDashoffset ≈ 0 (tolerance ±1)
    Calculation: progress=10/10=1.0, offset=339.292*(1-1.0)=0
```

### TC_W303_14 — Ring depletes after 5s

```
Pre-condition: durationSeconds=10
Steps:
  1. Render timer
  2. Read progress-circle offset BEFORE
  3. act(() => vi.advanceTimersByTime(5000))
  4. Read progress-circle offset AFTER
Expected:
  - offsetAfter > offsetBefore
  - offsetAfter ≈ 169.646 (CIRCUMFERENCE × 0.5, tolerance ±1)
    Calculation: remaining=5, progress=5/10=0.5, offset=339.292*0.5=169.646
```

### TC_W303_15 — Ring fully depleted at completion

```
Pre-condition: durationSeconds=10
Steps:
  1. Render timer
  2. act(() => vi.advanceTimersByTime(10000))
Expected:
  - Note: timer may have triggered onComplete and parent may unmount.
    If still rendered: dashoffset ≈ 339.292 (CIRCUMFERENCE)
    OR: verify dashoffset at t=9 → remaining=1, offset ≈ 305.363
```

### TC_W303_17 — Ring transition timing

```
Pre-condition: Component mounted
Steps:
  1. Render timer
  2. Query [data-testid="progress-circle"]
  3. Read element style.transition
Expected:
  - style.transition contains "stroke-dashoffset"
  - style.transition contains "1s"
  - style.transition contains "linear"
  (Dev changes from current "0.3s ease" to "1s linear")
```

### TC_W303_18 — Reduced motion class on ring

```
Pre-condition: Component mounted
Steps:
  1. Render timer
  2. Query [data-testid="progress-circle"]
  3. Check className
Expected:
  - className contains "motion-reduce:[transition:none]"
  Note: Tailwind v4 class, applied via className prop. Unit test checks class presence.
        Actual CSS behavior is manual test on device.
```

### TC_W303_20 — +30s adds time

```
Pre-condition: durationSeconds=60, mounted
Steps:
  1. Render timer
  2. Verify display = "1:00"
  3. Click [data-testid="add-time-button"]
  4. Read timer-display
Expected:
  - textContent = "1:30" (60+30=90 → "1:30")
```

### TC_W303_23 — Multiple +30s accumulate

```
Pre-condition: durationSeconds=60
Steps:
  1. Render timer, display = "1:00"
  2. Click add-time-button 3 times
  3. Read timer-display
Expected:
  - remaining = 60 + 90 = 150 → "2:30"
  - onAddTime called 3 times, each with 30
```

### TC_W303_24 — +30s in last 5 seconds

```
Pre-condition: durationSeconds=10
Steps:
  1. Render timer
  2. act(() => vi.advanceTimersByTime(8000))  // remaining=2
  3. Verify display = "0:02"
  4. Click add-time-button
  5. Read timer-display
Expected:
  - remaining = 2 + 30 = 32 → "0:32"
  - Timer continues counting down (not stuck, not overflowed)
Steps continued:
  6. act(() => vi.advanceTimersByTime(32000))
Expected:
  - onComplete called 1 time (timer completed normally after extension)
```

### TC_W303_25 — +30s recalculates ring progress

```
Pre-condition: durationSeconds=10
Steps:
  1. Render timer
  2. act(() => vi.advanceTimersByTime(5000))  // remaining=5, total=10
  3. Read progress-circle offset (should be ≈169.646)
  4. Click add-time-button → remaining=35, total=40
  5. Read progress-circle offset
Expected:
  - New offset ≈ 339.292 × (1 - 35/40) = 339.292 × 0.125 ≈ 42.41
  - Ring "jumps back" toward full (lower offset)
```

### TC_W303_26 — +30s while paused

```
Pre-condition: durationSeconds=60, timer paused
Steps:
  1. Render timer
  2. Click pause button → timer paused at remaining=60
  3. Click add-time-button → remaining=90
  4. Verify display = "1:30"
  5. act(() => vi.advanceTimersByTime(5000))
Expected:
  - Display still "1:30" (timer is paused, +30 applied but not counting)
  6. Click resume → timer resumes from 90
  7. act(() => vi.advanceTimersByTime(1000))
Expected:
  - Display = "1:29"
```

### TC_W303_28 — Skip clears interval

```
Pre-condition: durationSeconds=5
Steps:
  1. Render timer with onSkip and onComplete
  2. Click skip-button
  3. act(() => vi.advanceTimersByTime(10000))
Expected:
  - onSkip called 1 time
  - onComplete NOT called (timer was skipped, not completed)
```

### TC_W303_30 — Skip while paused

```
Pre-condition: durationSeconds=60, timer paused
Steps:
  1. Render timer
  2. Click pause button
  3. Click skip-button
Expected:
  - onSkip called 1 time
  - Timer dismissed (same as normal skip)
```

### TC_W303_31 — Pause button rendered in running state

```
Pre-condition: Component just mounted (running state)
Steps:
  1. Render timer
  2. Query for pause button (by testid or i18n text)
Expected:
  - Pause button visible and clickable
  - Button text/label = Vietnamese pause text (e.g., "Tạm dừng")
Note: Dev will add i18n key like "fitness.timer.pause"
```

### TC_W303_32 — Click pause freezes countdown

```
Pre-condition: durationSeconds=90, fake timers
Steps:
  1. Render timer → display "1:30"
  2. act(() => vi.advanceTimersByTime(3000)) → display "1:27"
  3. Click pause button
  4. act(() => vi.advanceTimersByTime(10000)) → advance 10s while paused
  5. Read timer-display
Expected:
  - Display still "1:27" (frozen at pause point)
```

### TC_W303_33 — Pause button label changes to resume

```
Pre-condition: Timer running
Steps:
  1. Render timer
  2. Verify pause button text (e.g., "Tạm dừng")
  3. Click pause button
  4. Read button text
Expected:
  - Button text changed to resume text (e.g., "Tiếp tục")
Note: Dev will define i18n keys. Test via button testid or getByRole.
```

### TC_W303_34 — Resume restarts countdown

```
Pre-condition: Timer paused at remaining=87 (was 90, ticked 3s)
Steps:
  1. Render timer, advance 3s → "1:27"
  2. Click pause
  3. Advance 10s (no change) → still "1:27"
  4. Click resume
  5. act(() => vi.advanceTimersByTime(1000))
Expected:
  - Display = "1:26" (resumed from 87, ticked 1 more)
```

### TC_W303_35 — Pause preserves exact value

```
Pre-condition: durationSeconds=10
Steps:
  1. Render timer
  2. act(() => vi.advanceTimersByTime(3000)) → remaining=7, display "0:07"
  3. Click pause
  4. act(() => vi.advanceTimersByTime(5000)) → 5s pass while paused
  5. Read timer-display
Expected:
  - Display = "0:07" (exact preservation, no drift)
```

### TC_W303_36 — Multiple pause/resume cycles

```
Pre-condition: durationSeconds=20
Steps:
  1. Render timer → "0:20"
  2. Advance 3s → "0:17"
  3. Pause → advance 5s → still "0:17"
  4. Resume → advance 2s → "0:15"
  5. Pause → advance 10s → still "0:15"
  6. Resume → advance 5s → "0:10"
Expected:
  - Each cycle: pause freezes, resume restarts correctly
  - Total elapsed (running only): 3+2+5=10s → remaining=10 ✓
```

### TC_W303_37 — Timer cannot complete while paused

```
Pre-condition: durationSeconds=3
Steps:
  1. Render timer → "0:03"
  2. Advance 2s → remaining=1, display "0:01"
  3. Click pause
  4. act(() => vi.advanceTimersByTime(5000)) → 5s pass
Expected:
  - Display still "0:01"
  - onComplete NOT called (timer frozen at 1, can't reach 0 while paused)
```

### TC_W303_38 — Running state: stroke-primary class

```
Pre-condition: Timer running (default state)
Steps:
  1. Render timer
  2. Query [data-testid="progress-circle"]
  3. Check className
Expected:
  - className contains class indicating primary color (e.g., "stroke-primary" or "text-primary")
  - className does NOT contain muted variant
Note: Dev may use stroke-primary Tailwind class or text-primary (currentColor inheritance).
      Test should verify the "running" color class is present.
```

### TC_W303_39 — Paused state: stroke-muted class

```
Pre-condition: Timer running, then paused
Steps:
  1. Render timer
  2. Click pause button
  3. Query [data-testid="progress-circle"]
  4. Check className
Expected:
  - className contains muted color class (e.g., "stroke-muted" or "text-muted")
  - Running color class removed
```

### TC_W303_40 — Resume restores ring color

```
Pre-condition: Timer paused
Steps:
  1. Render timer → pause → verify muted class
  2. Click resume
  3. Check progress-circle className
Expected:
  - Primary color class restored
  - Muted class removed
```

### TC_W303_41 — onComplete fires exactly once

```
Pre-condition: durationSeconds=3
Steps:
  1. Render timer with onComplete mock
  2. act(() => vi.advanceTimersByTime(3000))
Expected:
  - onComplete called exactly 1 time
Steps continued:
  3. act(() => vi.advanceTimersByTime(5000)) → 5 more seconds
Expected:
  - onComplete still called exactly 1 time (not again)
```

### TC_W303_44 — onComplete fires after +30s expires

```
Pre-condition: durationSeconds=5
Steps:
  1. Render timer
  2. Click add-time-button → remaining=35, total=35
  3. act(() => vi.advanceTimersByTime(35000))
Expected:
  - onComplete called exactly 1 time
  - display = "0:00"
```

### TC_W303_45 — Cleanup on unmount

```
Pre-condition: Timer running
Steps:
  1. Spy on globalThis.clearInterval
  2. Render timer, get unmount function
  3. Call unmount()
Expected:
  - clearInterval was called at least once
  - No memory leaks (interval cleaned)
```

### TC_W303_47 — Zero duration immediate complete

```
Pre-condition: durationSeconds=0
Steps:
  1. Render with durationSeconds=0
Expected:
  - Display = "0:00"
  - onComplete called 1 time (immediate)
```

### TC_W303_50 — Progress aria-valuenow updates

```
Pre-condition: durationSeconds=10
Steps:
  1. Render timer
  2. Query [data-testid="progress-ring"] (progress element)
  3. Check aria-valuenow = "100" (full at start)
  4. act(() => vi.advanceTimersByTime(5000))
  5. Check aria-valuenow
Expected:
  - aria-valuenow = "50" (50% remaining)
    Calculation: remaining=5, progress=5/10=0.5, round(0.5*100)=50
```

---

## 4. CLASSIFICATION MATRIX

| TC ID      | Description                             | Unit | Manual | Notes                          |
| ---------- | --------------------------------------- | ---- | ------ | ------------------------------ |
| TC_W303_01 | Initial display "1:30"                  | ✅   |        |                                |
| TC_W303_02 | Display CSS classes (text-4xl)          | ✅   |        |                                |
| TC_W303_03 | Format 120s → "2:00"                    | ✅   |        |                                |
| TC_W303_04 | Format 45s → "0:45"                     | ✅   |        |                                |
| TC_W303_05 | Format 0s → "0:00"                      | ✅   |        |                                |
| TC_W303_06 | Overlay ARIA role                       | ✅   |        |                                |
| TC_W303_07 | isVisible=false → null                  | ✅   |        |                                |
| TC_W303_08 | Countdown 1s tick                       | ✅   |        | Fake timers                    |
| TC_W303_09 | Countdown 2s tick                       | ✅   |        | Fake timers                    |
| TC_W303_10 | Timer counts to 0                       | ✅   |        | Fake timers                    |
| TC_W303_11 | Timer stops at 0 (no negative)          | ✅   |        |                                |
| TC_W303_12 | isVisible=false stops ticks             | ✅   |        |                                |
| TC_W303_13 | Ring offset=0 at start                  | ✅   |        |                                |
| TC_W303_14 | Ring depletes after 5s                  | ✅   |        | Math: offset≈169.646           |
| TC_W303_15 | Ring fully depleted at d                | ✅   |        | offset≈339.292                 |
| TC_W303_16 | strokeDasharray=CIRCUMFERENCE           | ✅   |        |                                |
| TC_W303_17 | Transition "1s linear"                  | ✅   |        | Inline style check             |
| TC_W303_18 | motion-reduce class on circle           | ✅   |        | Class string check             |
| TC_W303_19 | SVG aria-hidden                         | ✅   |        |                                |
| TC_W303_20 | +30s adds time                          | ✅   |        |                                |
| TC_W303_21 | +30s calls onAddTime(30)                | ✅   |        |                                |
| TC_W303_22 | +30s without onAddTime prop             | ✅   |        |                                |
| TC_W303_23 | 3× +30s = +90s                          | ✅   |        |                                |
| TC_W303_24 | +30s in last 5s                         | ✅   |        | remaining=2+30=32              |
| TC_W303_25 | +30s recalculates ring                  | ✅   |        | offset jumps back              |
| TC_W303_26 | +30s while paused                       | ✅   |        | Adds time, stays paused        |
| TC_W303_27 | Skip calls onSkip                       | ✅   |        |                                |
| TC_W303_28 | Skip clears interval                    | ✅   |        |                                |
| TC_W303_29 | Skip does NOT call onComplete           | ✅   |        |                                |
| TC_W303_30 | Skip while paused                       | ✅   |        |                                |
| TC_W303_31 | Pause button rendered                   | ✅   |        | New feature                    |
| TC_W303_32 | Pause freezes countdown                 | ✅   |        | Fake timers + verify no change |
| TC_W303_33 | Pause→resume label change               | ✅   |        | i18n text verification         |
| TC_W303_34 | Resume restarts countdown               | ✅   |        |                                |
| TC_W303_35 | Pause preserves exact value             | ✅   |        | No drift                       |
| TC_W303_36 | Multiple pause/resume cycles            | ✅   |        | 3 cycles, math verified        |
| TC_W303_37 | Cannot complete while paused            | ✅   |        | Critical edge case             |
| TC_W303_38 | Running: stroke-primary class           | ✅   |        |                                |
| TC_W303_39 | Paused: stroke-muted class              | ✅   |        |                                |
| TC_W303_40 | Resume: restores stroke-primary         | ✅   |        |                                |
| TC_W303_41 | onComplete fires exactly 1×             | ✅   |        |                                |
| TC_W303_42 | onComplete NOT called before finish     | ✅   |        |                                |
| TC_W303_43 | Interval cleared after 0                | ✅   |        |                                |
| TC_W303_44 | onComplete after +30s expires           | ✅   |        |                                |
| TC_W303_45 | Cleanup on unmount                      | ✅   |        |                                |
| TC_W303_46 | isVisible=false stops timer             | ✅   |        |                                |
| TC_W303_47 | Zero duration → immediate complete      | ✅   |        |                                |
| TC_W303_48 | Overlay ARIA: alertdialog, modal, label | ✅   |        |                                |
| TC_W303_49 | Progress: valuenow, valuemin, valuemax  | ✅   |        |                                |
| TC_W303_50 | Progress valuenow updates               | ✅   |        |                                |
| TC_W303_51 | All buttons have aria-label             | ✅   |        |                                |
| TC_W303_52 | SVG aria-hidden="true"                  | ✅   |        |                                |

**Summary: 52 unit test cases, 100% automatable.**

---

## 5. i18n KEYS REQUIRED

Dev MUST add these keys to `src/locales/vi.json` under `fitness.timer`:

| Key                     | Expected Value (Vietnamese) | Used By               |
| ----------------------- | --------------------------- | --------------------- |
| `fitness.timer.rest`    | "Nghỉ giữa set" (EXISTS)    | Overlay label, header |
| `fitness.timer.skip`    | "Bỏ qua" (EXISTS)           | Skip button           |
| `fitness.timer.addTime` | "Thêm thời gian" (EXISTS)   | +30s button           |
| `fitness.timer.pause`   | "Tạm dừng" (NEW)            | Pause button          |
| `fitness.timer.resume`  | "Tiếp tục" (NEW)            | Resume button         |

---

## 6. RISK REGISTER

| Risk                                  | Impact | Mitigation                                                  |
| ------------------------------------- | ------ | ----------------------------------------------------------- |
| Pause/resume state leak on unmount    | High   | TC_W303_45: verify clearInterval on unmount in paused state |
| +30s race with timer completion       | Medium | TC_W303_24: test +30s at remaining=2                        |
| motion-reduce class typo              | Medium | TC_W303_18: exact string match in className                 |
| Transition "1s linear" not applied    | Medium | TC_W303_17: inline style assertion                          |
| Ring color class not toggling         | Medium | TC_W303_38-40: verify class swap on pause/resume            |
| onComplete fires during paused at r=0 | High   | TC_W303_37: pause at remaining=1, advance past 0            |
| text-4xl vs text-2xl regression       | Low    | TC_W303_02: className assertion                             |

---

## 7. TEST IMPLEMENTATION NOTES FOR DEV

### Helper function pattern

```typescript
function renderTimer(overrides: Partial<RestTimerProps> = {}) {
  const defaultProps = {
    durationSeconds: 90,
    onComplete: vi.fn(),
    onSkip: vi.fn(),
    onAddTime: vi.fn(),
  };
  const props = { ...defaultProps, ...overrides };
  const result = render(<RestTimer {...props} />);
  return { ...result, props };
}
```

### Fake timer usage

```typescript
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

// Advance and assert:
act(() => {
  vi.advanceTimersByTime(1000);
});
```

### Pause/resume button queries

Dev will likely add a `data-testid` like `"pause-resume-button"` or separate
`"pause-button"` / `"resume-button"`. Tests should use:

- `screen.getByTestId('pause-resume-button')` if single toggle button
- OR `screen.getByRole('button', { name: /tạm dừng/i })` for i18n text match

### Ring class verification

```typescript
const circle = screen.getByTestId('progress-circle');
expect(circle).toHaveClass('stroke-primary'); // running
// OR if using text-primary (currentColor inheritance):
expect(circle).toHaveClass('text-primary');
```

### motion-reduce class verification

```typescript
const circle = screen.getByTestId('progress-circle');
expect(circle.className).toContain('motion-reduce:[transition:none]');
// Note: toHaveClass may not work with Tailwind arbitrary values
```

---

**TEST_PLAN_READY** — 52 unit test cases across 10 scenarios. All automatable with Vitest fake timers.
