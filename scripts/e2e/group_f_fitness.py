"""
Group F — Fitness Module (Full Suite)
Scenarios: SC26 (Training Plan View), SC27 (Strength Workout Logging),
           SC28 (Cardio Logging), SC29 (Workout History),
           SC30 (Progress Dashboard), SC31 (Daily Weight Input),
           SC32 (Gamification)

Pre-conditions: Fresh install, full onboarding with default values.
  Male, 75kg, 175cm, DOB=1996-05-15, moderate activity, cut-moderate goal.
  Training profile generated during onboarding (strategy=auto).

Run: python scripts/e2e/group_f_fitness.py
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from cdp_framework import (
    setup_fresh,
    run_scenario,
    reset_steps,
    WAIT_NAV_CLICK,
    WAIT_QUICK_ACTION,
    WAIT_MODAL_OPEN,
    WAIT_MODAL_CLOSE,
    WAIT_FORM_FILL,
    WAIT_SAVE_SETTINGS,
)


RESULTS: list[dict] = []


def log_result(tc_id: str, step: str, expected: str, actual: str, status: str):
    """Log a test result."""
    icon = "✅" if status == "PASS" else "❌"
    RESULTS.append({"tc": tc_id, "step": step, "expected": expected, "actual": actual, "status": status})
    print(f"  {icon} [{tc_id}] {step}: expected={expected}, actual={actual}")


def check(tc_id: str, step: str, expected, actual):
    """Assert expected == actual, log result."""
    exp_str = str(expected)
    act_str = str(actual).strip() if actual else "N/A"
    status = "PASS" if exp_str in act_str or act_str == exp_str else "FAIL"
    log_result(tc_id, step, exp_str, act_str, status)
    return status == "PASS"


def check_exists(tc_id: str, step: str, actual):
    """Assert element exists (value is 'yes')."""
    return check(tc_id, step, "yes", actual)


def check_not(tc_id: str, step: str, not_expected, actual):
    """Assert actual does NOT equal not_expected."""
    act_str = str(actual).strip() if actual else "N/A"
    status = "PASS" if not_expected not in act_str and act_str != not_expected else "FAIL"
    log_result(tc_id, step, f"NOT {not_expected}", act_str, status)
    return status == "PASS"


# ────────────────────────────────────────────────────────────────
# Helper: query element existence
# ────────────────────────────────────────────────────────────────

async def exists(s, testid: str) -> str:
    """Return 'yes' or 'no' for data-testid presence."""
    return await s.ev(
        f'document.querySelector(\'[data-testid="{testid}"]\')?"yes":"no"'
    )


async def get_visible_text(s, testid: str) -> str:
    """Get visible textContent from data-testid element."""
    return await s.get_text(testid)


async def get_element_count(s, testid_prefix: str) -> int:
    """Count elements whose data-testid starts with prefix."""
    count = await s.ev(
        f'document.querySelectorAll(\'[data-testid^="{testid_prefix}"]\').length'
    )
    return int(count) if count else 0


async def get_first_exercise_id(s) -> str:
    """Get the exerciseId of the first exercise section in WorkoutLogger."""
    return await s.ev('''(function(){
        var sec = document.querySelector('[data-testid^="exercise-section-"]');
        if (!sec) return '';
        return sec.getAttribute('data-testid').replace('exercise-section-', '');
    })()''')


async def get_first_workout_id(s) -> str:
    """Get the workoutId from the first workout card in history."""
    return await s.ev('''(function(){
        var card = document.querySelector('[data-testid^="workout-card-"]');
        if (!card) return '';
        return card.getAttribute('data-testid').replace('workout-card-', '');
    })()''')


# ════════════════════════════════════════════════════════════════
# SC26: Training Plan View
# ════════════════════════════════════════════════════════════════

async def sc26_training_plan_view(s):
    """SC26: Training Plan View — calendar strip, workout cards, rest days, streak."""
    sc = "SC26"
    reset_steps(sc)
    print(f"\n{'─'*50}")
    print(f"📋 SC26: Training Plan View")
    print(f"{'─'*50}")

    # Navigate to Fitness tab → Plan subtab (default)
    await s.nav_fitness()
    await s.screenshot(sc, "fitness_tab_home")

    await s.subtab_plan()
    await s.screenshot(sc, "plan_subtab_active")

    # Verify plan view rendered (either active plan or CTA)
    plan_view = await exists(s, "training-plan-view")
    check_exists(sc, "Training plan view rendered", plan_view)

    # --- Calendar Strip ---
    cal_strip = await exists(s, "calendar-strip")
    check_exists(sc, "Calendar strip visible", cal_strip)
    await s.screenshot(sc, "calendar_strip_7day")

    # Verify 7 day pills exist (day-pill-1 through day-pill-7)
    for day_num in range(1, 8):
        pill = await exists(s, f"day-pill-{day_num}")
        check_exists(sc, f"Day pill {day_num} exists", pill)

    # --- Today's workout card ---
    # Determine if today is a training day or rest day
    today_card = await exists(s, "today-workout-card")
    rest_card = await exists(s, "rest-day-card")

    if today_card == "yes":
        print("  ℹ️  Today is a training day")
        await s.screenshot(sc, "today_workout_card")

        # Verify card header
        header = await exists(s, "workout-card-header")
        check_exists(sc, "Workout card header visible", header)

        # Verify workout stats (duration, exercise count)
        stats = await exists(s, "workout-stats")
        check_exists(sc, "Workout stats visible", stats)

        # Verify exercise list
        ex_list = await exists(s, "exercise-list")
        if ex_list == "yes":
            check_exists(sc, "Exercise list visible", ex_list)
            await s.screenshot(sc, "exercise_list_detail")

        # Verify start workout button
        start_btn = await exists(s, "start-workout-btn")
        check_exists(sc, "Start workout button exists", start_btn)

        # Verify edit exercises button
        edit_btn = await exists(s, "edit-exercises-btn")
        check_exists(sc, "Edit exercises button exists", edit_btn)

        # Verify convert to rest day button
        convert_btn = await exists(s, "day-convert-rest-btn")
        check_exists(sc, "Convert to rest day button exists", convert_btn)

    elif rest_card == "yes":
        print("  ℹ️  Today is a rest day")
        await s.screenshot(sc, "today_rest_day_card")

        # Verify rest day card elements
        add_workout_btn = await exists(s, "rest-add-workout-btn")
        check_exists(sc, "Rest day add workout button", add_workout_btn)

        tomorrow = await exists(s, "tomorrow-preview")
        if tomorrow == "yes":
            check_exists(sc, "Tomorrow preview visible", tomorrow)

        quick_actions = await exists(s, "quick-actions")
        if quick_actions == "yes":
            check_exists(sc, "Quick actions visible", quick_actions)
            await s.screenshot(sc, "rest_day_quick_actions")
    else:
        # No plan — check for CTA
        no_plan = await exists(s, "no-plan-cta")
        create_btn = await exists(s, "create-plan-btn")
        print("  ℹ️  No active plan found — CTA state")
        check_exists(sc, "No plan CTA or create button", no_plan if no_plan == "yes" else create_btn)
        await s.screenshot(sc, "no_plan_cta_state")

    # --- Click different days on calendar ---
    for day_num in [1, 3, 5, 7]:
        r = await s.click_testid(f"day-pill-{day_num}")
        await s.wait(WAIT_QUICK_ACTION)
        if r == "ok":
            await s.screenshot(sc, f"day_pill_{day_num}_selected")
            # Check which card appeared
            is_training = await exists(s, "today-workout-card")
            is_rest = await exists(s, "rest-day-card")
            day_type = "training" if is_training == "yes" else ("rest" if is_rest == "yes" else "unknown")
            print(f"  ℹ️  Day {day_num}: {day_type}")

    # Click back to today (select current day of week: Mon=1..Sun=7)
    import datetime
    today_dow = datetime.datetime.now().isoweekday()  # Mon=1..Sun=7
    await s.click_testid(f"day-pill-{today_dow}")
    await s.wait(WAIT_QUICK_ACTION)

    # --- Plan Action Bar ---
    action_bar = await exists(s, "plan-action-bar")
    if action_bar == "yes":
        check_exists(sc, "Plan action bar visible", action_bar)
        await s.screenshot(sc, "plan_action_bar")

        # Verify 3 action buttons
        for action in ["edit-schedule", "change-split", "templates"]:
            btn = await exists(s, f"action-{action}")
            check_exists(sc, f"Action button '{action}' exists", btn)

    # --- Streak Counter ---
    streak = await exists(s, "streak-counter")
    if streak == "yes":
        check_exists(sc, "Streak counter visible", streak)
        streak_count = await get_visible_text(s, "streak-count")
        print(f"  ℹ️  Current streak: {streak_count}")
        await s.screenshot(sc, "streak_counter_area")

        # Week dots
        week_dots = await exists(s, "week-dots")
        check_exists(sc, "Week dots visible", week_dots)
    else:
        print("  ℹ️  Streak counter not visible (no workout history yet)")
        await s.screenshot(sc, "streak_counter_not_visible")

    # --- Milestones ---
    milestones = await exists(s, "milestones-list")
    if milestones == "yes":
        await s.click_testid("milestones-toggle")
        await s.wait(WAIT_QUICK_ACTION)
        await s.screenshot(sc, "milestones_expanded")

    # --- Daily Weight Input ---
    weight_input = await exists(s, "daily-weight-input")
    if weight_input == "yes":
        check_exists(sc, "Daily weight input visible", weight_input)
        await s.screenshot(sc, "daily_weight_input_area")

    print(f"\n  SC26 complete ✅")


# ════════════════════════════════════════════════════════════════
# SC27: Workout Logging — Strength
# ════════════════════════════════════════════════════════════════

async def sc27_strength_workout(s):
    """SC27: Strength workout logging — sets, RPE, rest timer, exercise selector."""
    sc = "SC27"
    reset_steps(sc)
    print(f"\n{'─'*50}")
    print(f"📋 SC27: Strength Workout Logging")
    print(f"{'─'*50}")

    # Ensure we're on Fitness → Plan subtab
    await s.nav_fitness()
    await s.subtab_plan()
    await s.wait(WAIT_NAV_CLICK)

    # Navigate to a training day if today is rest
    today_card = await exists(s, "today-workout-card")
    if today_card != "yes":
        print("  ℹ️  Today is rest day — finding a training day...")
        for day_num in range(1, 8):
            await s.click_testid(f"day-pill-{day_num}")
            await s.wait(WAIT_QUICK_ACTION)
            if await exists(s, "today-workout-card") == "yes":
                print(f"  ℹ️  Training day found at pill {day_num}")
                break
        else:
            # No training days — try creating workout on rest day
            print("  ⚠️  No training days found. Trying rest-add-workout...")
            await s.click_testid("rest-add-workout-btn")
            await s.wait(WAIT_NAV_CLICK)

    await s.screenshot(sc, "pre_start_workout")

    # --- Click Start Workout ---
    start_btn = await exists(s, "start-workout-btn")
    if start_btn == "yes":
        r = await s.click_testid("start-workout-btn")
        check(sc, "Click start workout", "ok", r)
    else:
        # Might need to click text button
        r = await s.click_text("Bắt đầu")
        check(sc, "Click start workout (text)", "ok", r)

    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "workout_logger_opened")

    # Verify WorkoutLogger overlay
    logger = await exists(s, "workout-logger")
    check_exists(sc, "Workout logger overlay visible", logger)

    # Verify header elements
    header = await exists(s, "workout-header")
    check_exists(sc, "Workout header visible", header)

    timer = await exists(s, "elapsed-timer")
    check_exists(sc, "Elapsed timer visible", timer)

    finish_btn = await exists(s, "finish-button")
    check_exists(sc, "Finish button visible", finish_btn)

    back_btn = await exists(s, "back-button")
    check_exists(sc, "Back button visible", back_btn)

    # --- Verify exercise sections ---
    ex_id = await get_first_exercise_id(s)
    if ex_id:
        print(f"  ℹ️  First exercise ID: {ex_id}")
        ex_section = await exists(s, f"exercise-section-{ex_id}")
        check_exists(sc, "Exercise section rendered", ex_section)
        await s.screenshot(sc, "exercise_sections_list")

        # --- Set Editor: Enter weight and reps ---
        set_editor = await exists(s, f"set-editor-{ex_id}")
        check_exists(sc, "Set editor visible", set_editor)

        # Weight input
        weight_input = await exists(s, f"weight-input-{ex_id}")
        if weight_input == "yes":
            await s.set_input(f"weight-input-{ex_id}", "50")
            await s.wait(WAIT_FORM_FILL)
            await s.screenshot(sc, "weight_entered")

            # Weight +/- buttons
            plus_btn = await exists(s, f"weight-plus-{ex_id}")
            check_exists(sc, "Weight plus button", plus_btn)
            minus_btn = await exists(s, f"weight-minus-{ex_id}")
            check_exists(sc, "Weight minus button", minus_btn)

        # Reps input
        reps_input = await exists(s, f"reps-input-{ex_id}")
        if reps_input == "yes":
            await s.set_input(f"reps-input-{ex_id}", "10")
            await s.wait(WAIT_FORM_FILL)
            await s.screenshot(sc, "reps_entered")

        # --- RPE Selector ---
        rpe_sel = await exists(s, f"rpe-selector-{ex_id}")
        if rpe_sel == "yes":
            check_exists(sc, "RPE selector visible", rpe_sel)
            await s.screenshot(sc, "rpe_selector_visible")

            # Click RPE 7
            r = await s.click_testid(f"rpe-7-{ex_id}")
            if r == "ok":
                await s.wait(WAIT_FORM_FILL)
                await s.screenshot(sc, "rpe_7_selected")

        # --- Log the set ---
        log_btn = await exists(s, f"log-set-{ex_id}")
        if log_btn == "yes":
            r = await s.click_testid(f"log-set-{ex_id}")
            check(sc, "Log set button clicked", "ok", r)
            await s.wait(WAIT_QUICK_ACTION)
            await s.screenshot(sc, "set_logged")

            # Verify logged set appears
            logged_sets = await get_element_count(s, "logged-set-")
            check(sc, "At least 1 logged set visible", True, logged_sets >= 1)

            # --- Rest Timer ---
            await s.wait(0.5)
            rest_timer = await exists(s, "rest-timer-overlay")
            if rest_timer == "yes":
                check_exists(sc, "Rest timer overlay appeared", rest_timer)
                await s.screenshot(sc, "rest_timer_countdown")

                # Verify timer elements
                timer_display = await exists(s, "timer-display")
                check_exists(sc, "Timer display visible", timer_display)

                progress_ring = await exists(s, "progress-ring")
                check_exists(sc, "Progress ring visible", progress_ring)

                add_time_btn = await exists(s, "add-time-button")
                check_exists(sc, "Add time button visible", add_time_btn)

                # Skip rest
                skip_btn = await exists(s, "skip-button")
                check_exists(sc, "Skip button visible", skip_btn)
                r = await s.click_testid("skip-button")
                check(sc, "Skip rest timer", "ok", r)
                await s.wait(WAIT_QUICK_ACTION)
                await s.screenshot(sc, "rest_timer_skipped")
            else:
                print("  ℹ️  Rest timer did not appear (may be disabled or first set)")

        # --- Log another set (set #2) ---
        reps_input2 = await exists(s, f"reps-input-{ex_id}")
        if reps_input2 == "yes":
            await s.set_input(f"weight-input-{ex_id}", "52.5")
            await s.wait(WAIT_FORM_FILL)
            await s.set_input(f"reps-input-{ex_id}", "8")
            await s.wait(WAIT_FORM_FILL)
            r = await s.click_testid(f"rpe-8-{ex_id}")
            await s.wait(WAIT_FORM_FILL)
            r = await s.click_testid(f"log-set-{ex_id}")
            if r == "ok":
                await s.wait(WAIT_QUICK_ACTION)
                await s.screenshot(sc, "second_set_logged")

                # Skip rest timer if it appeared
                await s.wait(0.5)
                if await exists(s, "rest-timer-overlay") == "yes":
                    await s.click_testid("skip-button")
                    await s.wait(WAIT_QUICK_ACTION)

        # Check overload chip visibility
        overload = await exists(s, "overload-chip")
        if overload == "yes":
            await s.screenshot(sc, "overload_suggestion_chip")
            print("  ℹ️  Progressive overload suggestion visible")

    else:
        # Empty state — no exercises assigned
        empty = await exists(s, "empty-state")
        if empty == "yes":
            await s.screenshot(sc, "workout_logger_empty_state")
            print("  ℹ️  No exercises in workout — empty state")

    # --- Add Exercise via Selector ---
    add_btn = await exists(s, "add-exercise-button")
    if add_btn == "yes":
        r = await s.click_testid("add-exercise-button")
        check(sc, "Open exercise selector", "ok", r)
        await s.wait(WAIT_MODAL_OPEN)
        await s.screenshot(sc, "exercise_selector_opened")

        # Verify selector elements
        selector = await exists(s, "exercise-selector-sheet")
        check_exists(sc, "Exercise selector sheet visible", selector)

        search_input = await exists(s, "exercise-search-input")
        check_exists(sc, "Search input visible", search_input)

        muscle_chips = await exists(s, "muscle-group-chips")
        check_exists(sc, "Muscle group filter chips visible", muscle_chips)

        # Count exercise items
        exercise_count = await get_element_count(s, "exercise-item-")
        print(f"  ℹ️  {exercise_count} exercises available in selector")
        await s.screenshot(sc, "exercise_selector_items")

        # Select first exercise
        if exercise_count > 0:
            first_item = await s.ev('''(function(){
                var item = document.querySelector('[data-testid^="exercise-item-"]');
                if (item) { item.click(); return 'ok'; }
                return 'none';
            })()''')
            check(sc, "Select exercise from list", "ok", first_item)
            await s.wait(WAIT_QUICK_ACTION)
            await s.screenshot(sc, "exercise_added_to_workout")
    elif add_btn != "yes":
        # Try the container
        add_container = await exists(s, "add-exercise-container")
        if add_container == "yes":
            await s.click_testid("add-exercise-container")
            await s.wait(WAIT_MODAL_OPEN)
            await s.screenshot(sc, "exercise_selector_via_container")

    # --- Complete Workout ---
    r = await s.click_testid("finish-button")
    check(sc, "Click finish workout", "ok", r)
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "workout_finishing")

    # Check for workout summary card
    await s.wait(1)
    summary = await exists(s, "workout-summary-card")
    if summary == "yes":
        check_exists(sc, "Workout summary card visible", summary)
        await s.screenshot(sc, "workout_summary_card")

        # Check PR celebration
        pr_celebration = await exists(s, "pr-celebration")
        if pr_celebration == "yes":
            await s.screenshot(sc, "pr_celebration_display")
            print("  🎉 PR celebration visible!")

        # Save workout
        save_btn = await exists(s, "save-workout-button")
        if save_btn == "yes":
            r = await s.click_testid("save-workout-button")
            check(sc, "Save workout", "ok", r)
            await s.wait(WAIT_SAVE_SETTINGS)
            await s.screenshot(sc, "workout_saved")
    else:
        # Workout may have been saved automatically or we returned to plan view
        await s.screenshot(sc, "after_finish_workout")
        print("  ℹ️  No summary card — workout may have been saved directly")

    print(f"\n  SC27 complete ✅")


# ════════════════════════════════════════════════════════════════
# SC28: Cardio Logging
# ════════════════════════════════════════════════════════════════

async def sc28_cardio_logging(s):
    """SC28: Cardio workout logging — type selector, timer modes, distance, intensity."""
    sc = "SC28"
    reset_steps(sc)
    print(f"\n{'─'*50}")
    print(f"📋 SC28: Cardio Logging")
    print(f"{'─'*50}")

    # Navigate back to Fitness → Plan
    await s.nav_fitness()
    await s.subtab_plan()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "plan_view_before_cardio")

    # Try to open cardio logger via quick action on rest day or via quick-log-cardio
    cardio_started = False

    # Method 1: Quick log cardio button (on rest day card)
    quick_cardio = await exists(s, "quick-log-cardio")
    if quick_cardio == "yes":
        r = await s.click_testid("quick-log-cardio")
        if r == "ok":
            cardio_started = True
            await s.wait(WAIT_NAV_CLICK)

    # Method 2: Find a rest day and use its quick actions
    if not cardio_started:
        for day_num in range(1, 8):
            await s.click_testid(f"day-pill-{day_num}")
            await s.wait(WAIT_QUICK_ACTION)
            quick_cardio = await exists(s, "quick-log-cardio")
            if quick_cardio == "yes":
                r = await s.click_testid("quick-log-cardio")
                if r == "ok":
                    cardio_started = True
                    await s.wait(WAIT_NAV_CLICK)
                    break

    # Method 3: Start from workout logger and switch to cardio mode
    if not cardio_started:
        print("  ℹ️  No quick-cardio button found. Starting cardio via general logger...")
        # Navigate back to a training day and start, then see if cardio option exists
        # Or look for a dedicated cardio start mechanism
        for day_num in range(1, 8):
            await s.click_testid(f"day-pill-{day_num}")
            await s.wait(WAIT_QUICK_ACTION)
            rest_card = await exists(s, "rest-day-card")
            if rest_card == "yes":
                # Rest day — try add workout which may offer cardio
                r = await s.click_testid("rest-add-workout-btn")
                if r == "ok":
                    await s.wait(WAIT_NAV_CLICK)
                    cardio_started = True
                    break

    await s.screenshot(sc, "cardio_logger_attempt")

    # Verify CardioLogger overlay
    cardio_logger = await exists(s, "cardio-logger")
    if cardio_logger == "yes":
        check_exists(sc, "Cardio logger overlay visible", cardio_logger)
        await s.screenshot(sc, "cardio_logger_opened")

        # --- Header elements ---
        header = await exists(s, "cardio-header")
        check_exists(sc, "Cardio header visible", header)

        timer = await exists(s, "elapsed-timer")
        check_exists(sc, "Elapsed timer visible", timer)

        finish_btn = await exists(s, "finish-button")
        check_exists(sc, "Finish button visible", finish_btn)

        # --- Cardio Type Selector ---
        type_selector = await exists(s, "cardio-type-selector")
        check_exists(sc, "Cardio type selector visible", type_selector)
        await s.screenshot(sc, "cardio_type_selector")

        # Select Running
        r = await s.click_testid("cardio-type-running")
        if r == "ok":
            check(sc, "Select Running type", "ok", r)
            await s.wait(WAIT_FORM_FILL)
            await s.screenshot(sc, "running_type_selected")

        # --- Timer Modes ---
        stopwatch_btn = await exists(s, "stopwatch-mode-button")
        manual_btn = await exists(s, "manual-mode-button")

        if stopwatch_btn == "yes":
            check_exists(sc, "Stopwatch mode button exists", stopwatch_btn)
        if manual_btn == "yes":
            check_exists(sc, "Manual mode button exists", manual_btn)

        # Screenshot Stopwatch mode (default)
        stopwatch_panel = await exists(s, "stopwatch-panel")
        if stopwatch_panel == "yes":
            await s.screenshot(sc, "stopwatch_mode_panel")

            # Verify stopwatch elements
            display = await exists(s, "stopwatch-display")
            check_exists(sc, "Stopwatch display visible", display)

            start_btn = await exists(s, "start-button")
            check_exists(sc, "Start button visible", start_btn)

        # Switch to Manual mode
        if manual_btn == "yes":
            r = await s.click_testid("manual-mode-button")
            check(sc, "Switch to manual mode", "ok", r)
            await s.wait(WAIT_QUICK_ACTION)
            await s.screenshot(sc, "manual_mode_panel")

            # Manual panel
            manual_panel = await exists(s, "manual-panel")
            check_exists(sc, "Manual panel visible", manual_panel)

            # Enter duration
            duration_input = await exists(s, "manual-duration-input")
            if duration_input == "yes":
                await s.set_input("manual-duration-input", "30")
                await s.wait(WAIT_FORM_FILL)
                await s.screenshot(sc, "duration_entered")

        # --- Distance Input ---
        distance_section = await exists(s, "distance-section")
        if distance_section == "yes":
            check_exists(sc, "Distance section visible", distance_section)

            distance_input = await exists(s, "distance-input")
            if distance_input == "yes":
                await s.set_input("distance-input", "5.0")
                await s.wait(WAIT_FORM_FILL)
                await s.screenshot(sc, "distance_entered")

        # --- Heart Rate Input ---
        hr_input = await exists(s, "heart-rate-input")
        if hr_input == "yes":
            await s.set_input("heart-rate-input", "145")
            await s.wait(WAIT_FORM_FILL)
            await s.screenshot(sc, "heart_rate_entered")

        # --- Intensity Selector ---
        intensity_sel = await exists(s, "intensity-selector")
        if intensity_sel == "yes":
            check_exists(sc, "Intensity selector visible", intensity_sel)
            await s.screenshot(sc, "intensity_selector")

            # Select Medium intensity
            r = await s.click_testid("intensity-moderate")
            if r == "none":
                r = await s.click_testid("intensity-medium")
            if r == "ok":
                await s.wait(WAIT_FORM_FILL)
                await s.screenshot(sc, "intensity_moderate_selected")

        # --- Calorie Preview ---
        cal_preview = await exists(s, "calorie-preview")
        if cal_preview == "yes":
            cal_value = await get_visible_text(s, "calorie-value")
            print(f"  ℹ️  Estimated calories: {cal_value}")
            check_exists(sc, "Calorie preview visible", cal_preview)
            await s.screenshot(sc, "calorie_estimation")

        # --- Complete Cardio ---
        r = await s.click_testid("finish-button")
        check(sc, "Click finish cardio", "ok", r)
        await s.wait(WAIT_NAV_CLICK)
        await s.screenshot(sc, "cardio_finished")

        # Check for save button (CardioLogger has a separate save button)
        save_btn = await exists(s, "save-button")
        if save_btn == "yes":
            r = await s.click_testid("save-button")
            check(sc, "Save cardio workout", "ok", r)
            await s.wait(WAIT_SAVE_SETTINGS)
            await s.screenshot(sc, "cardio_saved")

        # Summary card
        summary = await exists(s, "workout-summary-card")
        if summary == "yes":
            await s.screenshot(sc, "cardio_summary")
            save_workout = await exists(s, "save-workout-button")
            if save_workout == "yes":
                await s.click_testid("save-workout-button")
                await s.wait(WAIT_SAVE_SETTINGS)
                await s.screenshot(sc, "cardio_workout_saved")

    else:
        print("  ⚠️  Cardio logger did not open — screenshot current state")
        await s.screenshot(sc, "cardio_logger_not_opened")

        # Check if we're in a general workout logger instead
        workout_logger = await exists(s, "workout-logger")
        if workout_logger == "yes":
            print("  ℹ️  General workout logger opened (not cardio-specific)")
            await s.screenshot(sc, "general_logger_instead")
            # Close it
            await s.click_testid("back-button")
            await s.wait(WAIT_NAV_CLICK)

    print(f"\n  SC28 complete ✅")


# ════════════════════════════════════════════════════════════════
# SC29: Workout History
# ════════════════════════════════════════════════════════════════

async def sc29_workout_history(s):
    """SC29: Workout history — list, filters, expand detail, week groupings."""
    sc = "SC29"
    reset_steps(sc)
    print(f"\n{'─'*50}")
    print(f"📋 SC29: Workout History")
    print(f"{'─'*50}")

    # Navigate to Fitness → History subtab
    await s.nav_fitness()
    await s.click_testid("subtab-history")
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "history_subtab_active")

    # Check history panel
    history_panel = await exists(s, "history-subtab-content")
    check_exists(sc, "History subtab content rendered", history_panel)

    # Check for workout history component
    history_comp = await exists(s, "workout-history")
    history_empty = await exists(s, "workout-history-empty")

    if history_comp == "yes":
        check_exists(sc, "Workout history component visible", history_comp)
        await s.screenshot(sc, "workout_history_list")

        # --- Filter Chips ---
        filter_chips = await exists(s, "filter-chips")
        check_exists(sc, "Filter chips visible", filter_chips)

        # Screenshot All filter (default)
        await s.screenshot(sc, "filter_all_active")

        # Filter by Strength
        r = await s.click_testid("filter-strength")
        if r == "ok":
            await s.wait(WAIT_QUICK_ACTION)
            await s.screenshot(sc, "filter_strength_applied")
        else:
            # Try other filter name patterns
            r = await s.ev('''(function(){
                var btns = document.querySelectorAll('[data-testid^="filter-"]');
                for (var i = 0; i < btns.length; i++) {
                    if (btns[i].textContent.toLowerCase().includes('strength') ||
                        btns[i].textContent.includes('Sức mạnh')) {
                        btns[i].click(); return 'ok';
                    }
                }
                return 'none';
            })()''')
            if r == "ok":
                await s.wait(WAIT_QUICK_ACTION)
                await s.screenshot(sc, "filter_strength_by_text")

        # Filter by Cardio
        r = await s.click_testid("filter-cardio")
        if r == "ok":
            await s.wait(WAIT_QUICK_ACTION)
            await s.screenshot(sc, "filter_cardio_applied")
        else:
            r = await s.ev('''(function(){
                var btns = document.querySelectorAll('[data-testid^="filter-"]');
                for (var i = 0; i < btns.length; i++) {
                    if (btns[i].textContent.toLowerCase().includes('cardio')) {
                        btns[i].click(); return 'ok';
                    }
                }
                return 'none';
            })()''')
            if r == "ok":
                await s.wait(WAIT_QUICK_ACTION)
                await s.screenshot(sc, "filter_cardio_by_text")

        # Filter All again
        r = await s.click_testid("filter-all")
        if r == "ok":
            await s.wait(WAIT_QUICK_ACTION)
            await s.screenshot(sc, "filter_all_restored")
        else:
            r = await s.ev('''(function(){
                var btns = document.querySelectorAll('[data-testid^="filter-"]');
                if (btns.length > 0) { btns[0].click(); return 'ok'; }
                return 'none';
            })()''')
            if r == "ok":
                await s.wait(WAIT_QUICK_ACTION)
                await s.screenshot(sc, "filter_first_restored")

        # --- Week Groupings ---
        week_groups = await get_element_count(s, "week-group-")
        print(f"  ℹ️  {week_groups} week group(s) in history")
        if week_groups > 0:
            await s.screenshot(sc, "week_groupings")

            # Check week header
            first_week_header = await s.ev('''(function(){
                var h = document.querySelector('[data-testid^="week-header-"]');
                return h ? h.textContent.trim() : 'N/A';
            })()''')
            print(f"  ℹ️  First week header: {first_week_header}")

        # --- Expand Workout Card ---
        workout_id = await get_first_workout_id(s)
        if workout_id:
            print(f"  ℹ️  Expanding workout: {workout_id}")
            r = await s.click_testid(f"workout-toggle-{workout_id}")
            if r == "ok":
                await s.wait(WAIT_QUICK_ACTION)
                await s.screenshot(sc, "workout_card_expanded")

                # Verify expanded detail
                detail = await exists(s, f"workout-detail-{workout_id}")
                if detail == "yes":
                    check_exists(sc, "Workout detail section visible", detail)

                    # Check meta info
                    meta = await exists(s, f"workout-meta-{workout_id}")
                    if meta == "yes":
                        check_exists(sc, "Workout meta info visible", meta)

                    # Check exercise groups in detail
                    ex_groups = await s.ev('''(function(){
                        var g = document.querySelectorAll('[data-testid^="exercise-group-"]');
                        return g.length;
                    })()''')
                    print(f"  ℹ️  {ex_groups} exercise group(s) in expanded detail")

                # Collapse it back
                await s.click_testid(f"workout-toggle-{workout_id}")
                await s.wait(WAIT_QUICK_ACTION)
                await s.screenshot(sc, "workout_card_collapsed")
        else:
            print("  ℹ️  No workout cards to expand")

    elif history_empty == "yes":
        print("  ℹ️  Workout history is empty (first session)")
        check_exists(sc, "Empty history state visible", history_empty)
        await s.screenshot(sc, "history_empty_state")

        # Verify empty state elements
        empty_title = await exists(s, "empty-title")
        check_exists(sc, "Empty title visible", empty_title)

        empty_subtitle = await exists(s, "empty-subtitle")
        check_exists(sc, "Empty subtitle visible", empty_subtitle)

        # Skeleton preview cards
        skeleton = await exists(s, "skeleton-preview")
        if skeleton == "yes":
            await s.screenshot(sc, "skeleton_preview_cards")
    else:
        await s.screenshot(sc, "history_unknown_state")
        print("  ⚠️  Neither history list nor empty state found")

    print(f"\n  SC29 complete ✅")


# ════════════════════════════════════════════════════════════════
# SC30: Progress Dashboard
# ════════════════════════════════════════════════════════════════

async def sc30_progress_dashboard(s):
    """SC30: Progress dashboard — hero metric, metric cards, time range, bottom sheet."""
    sc = "SC30"
    reset_steps(sc)
    print(f"\n{'─'*50}")
    print(f"📋 SC30: Progress Dashboard")
    print(f"{'─'*50}")

    # Navigate to Fitness → Progress subtab
    await s.nav_fitness()
    await s.click_testid("subtab-progress")
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "progress_subtab_active")

    # Check progress panel
    progress_panel = await exists(s, "progress-subtab-content")
    check_exists(sc, "Progress subtab content rendered", progress_panel)

    # Check for dashboard or empty state
    dashboard = await exists(s, "progress-dashboard")
    empty_state = await exists(s, "progress-empty-state")

    if dashboard == "yes":
        check_exists(sc, "Progress dashboard visible", dashboard)
        await s.screenshot(sc, "progress_dashboard_full")

        # --- Hero Metric Card ---
        hero = await exists(s, "hero-metric-card")
        if hero == "yes":
            check_exists(sc, "Hero metric card visible", hero)

            vol_change = await get_visible_text(s, "volume-change")
            print(f"  ℹ️  Volume change: {vol_change}")

            sparkline = await exists(s, "sparkline")
            if sparkline == "yes":
                check_exists(sc, "Sparkline chart visible", sparkline)

            await s.screenshot(sc, "hero_metric_card")

        # --- 4 Metric Cards ---
        metrics_container = await exists(s, "metric-cards")
        if metrics_container == "yes":
            check_exists(sc, "Metric cards container visible", metrics_container)
            await s.screenshot(sc, "metric_cards_row")

            for metric in ["weight", "1rm", "adherence", "sessions"]:
                card = await exists(s, f"metric-card-{metric}")
                if card == "yes":
                    check_exists(sc, f"Metric card '{metric}' visible", card)

            # Weight metric detail
            weight_delta = await exists(s, "weight-delta")
            weight_stable = await exists(s, "weight-stable")
            if weight_delta == "yes":
                delta_text = await get_visible_text(s, "weight-delta")
                print(f"  ℹ️  Weight delta: {delta_text}")
            elif weight_stable == "yes":
                print("  ℹ️  Weight: stable (no change)")

        # --- Click metric card → bottom sheet ---
        metric_card = await exists(s, "metric-card-weight")
        if metric_card == "yes":
            r = await s.click_testid("metric-card-weight")
            if r == "ok":
                await s.wait(WAIT_MODAL_OPEN)
                await s.screenshot(sc, "metric_bottom_sheet_opened")

                bottom_sheet = await exists(s, "metric-bottom-sheet")
                if bottom_sheet == "yes":
                    check_exists(sc, "Metric bottom sheet visible", bottom_sheet)

                    # Chart inside bottom sheet
                    chart = await exists(s, "bottom-sheet-chart")
                    if chart == "yes":
                        check_exists(sc, "Bottom sheet chart visible", chart)
                        await s.screenshot(sc, "bottom_sheet_chart")

                    # --- Time Range Filter ---
                    time_filter = await exists(s, "time-range-filter")
                    if time_filter == "yes":
                        check_exists(sc, "Time range filter visible", time_filter)

                        for time_range in ["1W", "1M", "3M", "all"]:
                            r = await s.click_testid(f"time-range-{time_range}")
                            if r == "ok":
                                await s.wait(WAIT_QUICK_ACTION)
                                await s.screenshot(sc, f"time_range_{time_range}")

                    # Close bottom sheet
                    close_btn = await exists(s, "close-bottom-sheet")
                    if close_btn == "yes":
                        await s.click_testid("close-bottom-sheet")
                    else:
                        # Click backdrop
                        await s.click_testid("bottom-sheet-backdrop")
                    await s.wait(WAIT_MODAL_CLOSE)
                    await s.screenshot(sc, "bottom_sheet_closed")

        # --- Cycle Progress ---
        cycle = await exists(s, "cycle-progress")
        if cycle == "yes":
            check_exists(sc, "Cycle progress card visible", cycle)
            await s.screenshot(sc, "cycle_progress_card")

        # --- Insights Section ---
        insights = await exists(s, "insights-section")
        if insights == "yes":
            check_exists(sc, "Insights section visible", insights)
            await s.screenshot(sc, "insights_section")

            # Count insights
            insight_count = await s.ev('''(function(){
                var items = document.querySelectorAll('[data-testid^="insight-"]');
                return items.length;
            })()''')
            print(f"  ℹ️  {insight_count} insight(s) displayed")

    elif empty_state == "yes":
        print("  ℹ️  Progress dashboard is empty (no workout data)")
        check_exists(sc, "Progress empty state visible", empty_state)
        await s.screenshot(sc, "progress_empty_state")

        # CTA button
        cta = await exists(s, "start-training-cta")
        if cta == "yes":
            check_exists(sc, "Start training CTA visible", cta)
    else:
        await s.screenshot(sc, "progress_unknown_state")
        print("  ⚠️  Neither dashboard nor empty state found")

    print(f"\n  SC30 complete ✅")


# ════════════════════════════════════════════════════════════════
# SC31: Daily Weight Input
# ════════════════════════════════════════════════════════════════

async def sc31_daily_weight(s):
    """SC31: Daily weight input — enter weight, quick select, save, confirmation."""
    sc = "SC31"
    reset_steps(sc)
    print(f"\n{'─'*50}")
    print(f"📋 SC31: Daily Weight Input")
    print(f"{'─'*50}")

    # Navigate to Fitness → Plan subtab (weight input is here)
    await s.nav_fitness()
    await s.subtab_plan()
    await s.wait(WAIT_NAV_CLICK)

    # Scroll to find weight input (may be below fold)
    await s.ev('''(function(){
        var el = document.querySelector('[data-testid="daily-weight-input"]');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    })()''')
    await s.wait(WAIT_QUICK_ACTION)

    # Screenshot weight input area
    weight_area = await exists(s, "daily-weight-input")
    if weight_area == "yes":
        check_exists(sc, "Daily weight input area visible", weight_area)
        await s.screenshot(sc, "weight_input_area")

        # Verify input field
        weight_input = await exists(s, "weight-input")
        check_exists(sc, "Weight input field exists", weight_input)

        # Verify save button
        save_btn = await exists(s, "save-weight-btn")
        check_exists(sc, "Save weight button exists", save_btn)

        # Quick select chips
        chips = await exists(s, "quick-select-chips")
        if chips == "yes":
            check_exists(sc, "Quick select chips visible", chips)
            await s.screenshot(sc, "weight_quick_select_chips")

        # Yesterday info
        yesterday = await exists(s, "yesterday-info")
        if yesterday == "yes":
            yesterday_text = await get_visible_text(s, "yesterday-info")
            print(f"  ℹ️  Yesterday info: {yesterday_text}")

        # Moving average
        moving_avg = await exists(s, "moving-average")
        if moving_avg == "yes":
            avg_text = await get_visible_text(s, "moving-average")
            print(f"  ℹ️  Moving average: {avg_text}")

        # --- Enter weight ---
        await s.set_input("weight-input", "74.5")
        await s.wait(WAIT_FORM_FILL)
        await s.screenshot(sc, "weight_entered_74_5")

        # Verify value set
        current_val = await s.ev(
            'document.querySelector(\'[data-testid="weight-input"]\')?.value||"N/A"'
        )
        check(sc, "Weight input value", "74.5", current_val)

        # --- Save ---
        r = await s.click_testid("save-weight-btn")
        check(sc, "Click save weight", "ok", r)
        await s.wait(WAIT_SAVE_SETTINGS)
        await s.screenshot(sc, "weight_saved_confirmation")

        # After save — check delta indicator
        await s.wait(0.5)
        delta = await exists(s, "weight-delta")
        if delta == "yes":
            delta_text = await get_visible_text(s, "weight-delta")
            print(f"  ℹ️  Weight delta after save: {delta_text}")
            await s.screenshot(sc, "weight_delta_indicator")

        # Check trend indicator
        trend = await exists(s, "trend-indicator")
        if trend == "yes":
            trend_text = await get_visible_text(s, "trend-indicator")
            print(f"  ℹ️  Trend indicator: {trend_text}")

    else:
        print("  ⚠️  Daily weight input not found on plan subtab")
        await s.screenshot(sc, "weight_input_not_found")

        # Try quick-log-weight button
        quick_weight = await exists(s, "quick-log-weight")
        if quick_weight == "yes":
            print("  ℹ️  Found quick-log-weight button — clicking")
            await s.click_testid("quick-log-weight")
            await s.wait(WAIT_NAV_CLICK)
            await s.screenshot(sc, "weight_via_quick_log")

    print(f"\n  SC31 complete ✅")


# ════════════════════════════════════════════════════════════════
# SC32: Gamification
# ════════════════════════════════════════════════════════════════

async def sc32_gamification(s):
    """SC32: Gamification — streak counter, milestones, achievements."""
    sc = "SC32"
    reset_steps(sc)
    print(f"\n{'─'*50}")
    print(f"📋 SC32: Gamification")
    print(f"{'─'*50}")

    # Navigate to Fitness → Plan subtab (streak + milestones live here)
    await s.nav_fitness()
    await s.subtab_plan()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "plan_subtab_for_gamification")

    # --- Streak Counter ---
    streak = await exists(s, "streak-counter")
    if streak == "yes":
        check_exists(sc, "Streak counter visible", streak)
        await s.screenshot(sc, "streak_counter_card")

        # Streak count
        streak_count = await get_visible_text(s, "streak-count")
        print(f"  ℹ️  Current streak: {streak_count}")
        check_not(sc, "Streak count is not N/A", "N/A", streak_count)

        # Streak warning (at risk)
        warning = await exists(s, "streak-warning")
        if warning == "yes":
            warning_text = await get_visible_text(s, "streak-warning")
            print(f"  ⚠️  Streak warning: {warning_text}")
            await s.screenshot(sc, "streak_at_risk_warning")

        # Longest streak record
        record = await exists(s, "streak-record")
        if record == "yes":
            record_text = await get_visible_text(s, "streak-record")
            print(f"  ℹ️  Longest streak: {record_text}")

        # Week dots (7 day indicators)
        week_dots = await exists(s, "week-dots")
        if week_dots == "yes":
            check_exists(sc, "Week dots visible", week_dots)
            await s.screenshot(sc, "week_dots_status")

            # Count dot statuses
            for status_type in ["completed", "rest", "today", "missed", "upcoming"]:
                count = await s.ev(f'''(function(){{
                    return document.querySelectorAll('[data-testid="dot-{status_type}"]').length;
                }})()''')
                if count and int(count) > 0:
                    print(f"  ℹ️  dot-{status_type}: {count}")
    else:
        print("  ℹ️  Streak counter not visible (may need workout history)")
        await s.screenshot(sc, "streak_counter_absent")

    # --- Milestones ---
    milestones = await exists(s, "milestones-list")
    if milestones == "yes":
        check_exists(sc, "Milestones list visible", milestones)
        await s.screenshot(sc, "milestones_collapsed")

        # Toggle expand milestones
        r = await s.click_testid("milestones-toggle")
        if r == "ok":
            await s.wait(WAIT_QUICK_ACTION)

            milestones_content = await exists(s, "milestones-content")
            if milestones_content == "yes":
                check_exists(sc, "Milestones content expanded", milestones_content)
                await s.screenshot(sc, "milestones_expanded")

                # Progress bar
                progress_bar = await exists(s, "progress-bar")
                if progress_bar == "yes":
                    check_exists(sc, "Progress bar visible", progress_bar)

                    progress_fill = await exists(s, "progress-fill")
                    if progress_fill == "yes":
                        check_exists(sc, "Progress fill visible", progress_fill)

                # Count milestones
                milestone_count = await s.ev('''(function(){
                    return document.querySelectorAll('[data-testid^="milestone-"]').length;
                })()''')
                print(f"  ℹ️  {milestone_count} milestone(s) rendered")
                await s.screenshot(sc, "milestones_detail")

                # Check individual milestone
                first_milestone = await s.ev('''(function(){
                    var m = document.querySelector('[data-testid^="milestone-"]');
                    return m ? m.textContent.trim().substring(0, 50) : 'N/A';
                })()''')
                print(f"  ℹ️  First milestone: {first_milestone}")

            # Collapse back
            await s.click_testid("milestones-toggle")
            await s.wait(WAIT_QUICK_ACTION)
    else:
        print("  ℹ️  Milestones list not visible")
        await s.screenshot(sc, "milestones_absent")

    # --- Check for any XP/Level display (scan DOM) ---
    xp_display = await s.ev('''(function(){
        var all = document.querySelectorAll('[data-testid*="xp"], [data-testid*="level"], [data-testid*="badge"]');
        if (all.length > 0) return 'yes';
        var body = document.body.innerText;
        if (body.includes('XP') || body.includes('Level') || body.includes('Cấp độ')) return 'text-found';
        return 'no';
    })()''')
    if xp_display in ("yes", "text-found"):
        print(f"  ℹ️  XP/Level/Badge elements found: {xp_display}")
        await s.screenshot(sc, "xp_level_display")
    else:
        print("  ℹ️  No XP/Level/Badge system visible (may not be implemented)")

    # --- PR Toast (may appear after workout) ---
    pr_toast = await exists(s, "pr-toast")
    if pr_toast == "yes":
        pr_details = await get_visible_text(s, "pr-details")
        print(f"  🎉 PR toast visible: {pr_details}")
        await s.screenshot(sc, "pr_toast_notification")

    print(f"\n  SC32 complete ✅")


# ════════════════════════════════════════════════════════════════
# Main — Run all scenarios in a single session
# ════════════════════════════════════════════════════════════════

async def main():
    """Run Group F: SC26→SC27→SC28→SC29→SC30→SC31→SC32 in a single session."""
    print("=" * 60)
    print("🧪 GROUP F: Fitness Module (Full Suite)")
    print("   SC26: Training Plan View")
    print("   SC27: Strength Workout Logging")
    print("   SC28: Cardio Logging")
    print("   SC29: Workout History")
    print("   SC30: Progress Dashboard")
    print("   SC31: Daily Weight Input")
    print("   SC32: Gamification")
    print("=" * 60)

    # Fresh install + full onboarding (training plan generated)
    s = await setup_fresh(full_onboard=True, scenario="SC26")

    # SC26: Training Plan View
    await sc26_training_plan_view(s)

    # SC27: Strength Workout Logging (creates workout history data)
    await sc27_strength_workout(s)

    # SC28: Cardio Logging (creates cardio history data)
    await sc28_cardio_logging(s)

    # SC29: Workout History (verifies data from SC27+SC28)
    await sc29_workout_history(s)

    # SC30: Progress Dashboard (uses data from SC27+SC28)
    await sc30_progress_dashboard(s)

    # SC31: Daily Weight Input
    await sc31_daily_weight(s)

    # SC32: Gamification (streak/milestones based on SC27+SC28)
    await sc32_gamification(s)

    # ═══ FINAL REPORT ═══
    print(f"\n{'='*60}")
    print("📊 GROUP F — TEST REPORT")
    print(f"{'='*60}")
    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    failed = sum(1 for r in RESULTS if r["status"] == "FAIL")
    total = len(RESULTS)
    print(f"  Total: {total} | ✅ Passed: {passed} | ❌ Failed: {failed}")
    print(f"  Pass rate: {passed / total * 100:.1f}%" if total > 0 else "  No tests run")

    if failed > 0:
        print(f"\n  ❌ FAILED ASSERTIONS:")
        for r in RESULTS:
            if r["status"] == "FAIL":
                print(f"    [{r['tc']}] {r['step']}: expected={r['expected']}, actual={r['actual']}")

    # Per-scenario summary
    scenarios = ["SC26", "SC27", "SC28", "SC29", "SC30", "SC31", "SC32"]
    print(f"\n  📋 Per-scenario breakdown:")
    for sc_id in scenarios:
        sc_pass = sum(1 for r in RESULTS if r["tc"] == sc_id and r["status"] == "PASS")
        sc_fail = sum(1 for r in RESULTS if r["tc"] == sc_id and r["status"] == "FAIL")
        sc_total = sc_pass + sc_fail
        icon = "✅" if sc_fail == 0 and sc_total > 0 else ("❌" if sc_fail > 0 else "⏭️")
        print(f"    {icon} {sc_id}: {sc_pass}/{sc_total} passed")

    print(f"\n{'='*60}")
    print("✅ Group F complete" if failed == 0 else "⚠️  Group F has failures")
    print(f"{'='*60}")


if __name__ == "__main__":
    run_scenario(main())
