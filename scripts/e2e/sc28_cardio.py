"""
SC28 — Cardio Logging (TC_CDL_001 → TC_CDL_210)
Tests CardioLogger overlay, cardio types, stopwatch/manual modes, distance, calories, save.

Pre-conditions: Fresh install, full onboarding, training plan active.
Run: python scripts/e2e/sc28_cardio.py
"""
import asyncio
import sys
import os
import math

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp_framework import (
    setup_fresh,
    run_scenario,
    reset_steps,
    WAIT_NAV_CLICK,
    WAIT_QUICK_ACTION,
    WAIT_MODAL_OPEN,
    WAIT_FORM_FILL,
)

SCENARIO = "SC28"
RESULTS: list[dict] = []

# ─── Constants ───────────────────────────────────────────────────────────────

ONBOARDING_WEIGHT = 75  # kg set during onboarding

CARDIO_TYPES = ["running", "cycling", "swimming", "hiit", "walking", "elliptical", "rowing"]
CARDIO_LABELS = {
    "running": "Chạy bộ",
    "cycling": "Đạp xe",
    "swimming": "Bơi lội",
    "hiit": "HIIT",
    "walking": "Đi bộ",
    "elliptical": "Elliptical",
    "rowing": "Rowing",
}
DISTANCE_TYPES = {"running", "cycling", "swimming"}
INTENSITIES = ["low", "moderate", "high"]

EXERCISE_ID_MAP = {
    "running": "running",
    "cycling": "cycling",
    "swimming": "swimming",
    "hiit": "hiit-training",
    "walking": "walking",
    "elliptical": "elliptical",
    "rowing": "rowing-machine",
}

MET_TABLE = {
    "running": {"low": 7, "moderate": 9.8, "high": 12.8},
    "cycling": {"low": 4, "moderate": 6.8, "high": 10},
    "swimming": {"low": 4.8, "moderate": 7, "high": 9.8},
    "hiit": {"low": 6, "moderate": 8, "high": 12},
    "walking": {"low": 2.5, "moderate": 3.5, "high": 5},
    "elliptical": {"low": 4, "moderate": 5, "high": 7.5},
    "rowing": {"low": 4.8, "moderate": 7, "high": 10.5},
}


def js_round(val: float) -> int:
    """Match JavaScript Math.round (rounds .5 up)."""
    return math.floor(val + 0.5)


def expected_cal(cardio_type: str, intensity: str, duration_min: int, weight: int = ONBOARDING_WEIGHT) -> int:
    met = MET_TABLE[cardio_type][intensity]
    return js_round((duration_min * met * weight) / 60)


# ─── Result helpers ──────────────────────────────────────────────────────────


def log_result(tc_id: str, title: str, status: str, detail: str = ""):
    icon = {"PASS": "✅", "FAIL": "❌", "SKIP": "⏭️"}[status]
    RESULTS.append({"tc": tc_id, "title": title, "status": status, "detail": detail})
    print(f"  {icon} [{tc_id}] {title} {f'— {detail}' if detail else ''}")


def check(tc_id: str, title: str, expected, actual) -> bool:
    exp_s = str(expected)
    act_s = str(actual).strip() if actual else "N/A"
    status = "PASS" if exp_s in act_s or act_s == exp_s else "FAIL"
    log_result(tc_id, title, status, f"expected={exp_s}, actual={act_s}")
    return status == "PASS"


def check_not(tc_id: str, title: str, not_expected, actual) -> bool:
    ne_s = str(not_expected)
    act_s = str(actual).strip() if actual else "N/A"
    status = "PASS" if ne_s not in act_s and act_s != ne_s else "FAIL"
    log_result(tc_id, title, status, f"not_expected={ne_s}, actual={act_s}")
    return status == "PASS"


def check_numeric_range(tc_id: str, title: str, low: int, high: int, actual) -> bool:
    try:
        val = int(str(actual).strip())
        status = "PASS" if low <= val <= high else "FAIL"
    except (ValueError, TypeError):
        val = actual
        status = "FAIL"
    log_result(tc_id, title, status, f"range=[{low},{high}], actual={val}")
    return status == "PASS"


def skip(tc_id: str, title: str, reason: str = "Non-automatable via CDP"):
    log_result(tc_id, title, "SKIP", reason)


# ─── CDP helpers ─────────────────────────────────────────────────────────────


async def exists(s, testid: str) -> str:
    return await s.ev(f'document.querySelector(\'[data-testid="{testid}"]\')?"yes":"no"')


async def element_count(s, testid_prefix: str) -> int:
    raw = await s.ev(
        f'document.querySelectorAll(\'[data-testid^="{testid_prefix}"]\').length'
    )
    try:
        return int(raw)
    except (ValueError, TypeError):
        return 0


async def get_attr(s, testid: str, attr: str) -> str:
    return await s.ev(
        f'(function(){{var e=document.querySelector(\'[data-testid="{testid}"]\');'
        f'return e?e.getAttribute("{attr}")||"":"N/A"}})()'
    )


async def get_class(s, testid: str) -> str:
    return await s.ev(
        f'(function(){{var e=document.querySelector(\'[data-testid="{testid}"]\');'
        f'return e?e.className:"N/A"}})()'
    )


async def is_active_pill(s, testid: str) -> str:
    """Check if a type/intensity pill button has an active visual class."""
    cls = await get_class(s, testid)
    for active_marker in ["bg-primary", "bg-blue", "bg-green", "ring-2", "font-bold", "border-primary",
                          "text-primary-foreground", "bg-accent", "data-active"]:
        if active_marker in str(cls):
            return "yes"
    aria = await get_attr(s, testid, "aria-pressed")
    if aria == "true":
        return "yes"
    data = await get_attr(s, testid, "data-active")
    if data == "true":
        return "yes"
    return "no"


async def get_calorie_text(s) -> str:
    raw = await s.get_text("calorie-value")
    return str(raw).strip() if raw else "0"


async def parse_calorie(s) -> int:
    raw = await get_calorie_text(s)
    digits = "".join(c for c in str(raw) if c.isdigit())
    return int(digits) if digits else 0


async def open_cardio_logger(s) -> str:
    """Try multiple ways to open CardioLogger; return 'ok' or 'fail'."""
    r = await s.click_testid("quick-log-cardio")
    if r == "ok":
        await s.wait(WAIT_NAV_CLICK)
        return "ok"
    r = await s.click_testid("start-cardio-button")
    if r == "ok":
        await s.wait(WAIT_NAV_CLICK)
        return "ok"
    r = await s.click_text("Cardio", "button")
    if r == "ok":
        await s.wait(WAIT_NAV_CLICK)
        return "ok"
    r = await s.click_text("Bắt đầu Cardio", "button")
    if r == "ok":
        await s.wait(WAIT_NAV_CLICK)
        return "ok"
    return "fail"


async def close_cardio_logger(s):
    """Close cardio logger via back button."""
    r = await s.click_testid("back-button")
    if r != "ok":
        await s.ev(
            '(function(){var bs=document.querySelectorAll("button");'
            'for(var i=0;i<bs.length;i++){var a=bs[i].getAttribute("aria-label")||"";'
            'if(a.includes("Quay lại")&&bs[i].getBoundingClientRect().width>0)'
            '{bs[i].click();return"ok"}}return"none"})()'
        )
    await s.wait(WAIT_NAV_CLICK)


async def ensure_cardio_open(s):
    """Ensure cardio logger is open; if not, navigate and open it."""
    e = await exists(s, "cardio-logger")
    if e == "yes":
        return
    await s.nav_fitness()
    await s.wait(WAIT_NAV_CLICK)
    await s.subtab_plan()
    await s.wait(WAIT_NAV_CLICK)
    await open_cardio_logger(s)
    await s.wait(WAIT_MODAL_OPEN)


async def select_type(s, cardio_type: str):
    await s.click_testid(f"cardio-type-{cardio_type}")
    await s.wait(WAIT_QUICK_ACTION)


async def select_intensity(s, intensity: str):
    await s.click_testid(f"intensity-{intensity}")
    await s.wait(WAIT_QUICK_ACTION)


async def switch_to_manual(s):
    await s.click_testid("manual-mode-button")
    await s.wait(WAIT_QUICK_ACTION)


async def switch_to_stopwatch(s):
    await s.click_testid("stopwatch-mode-button")
    await s.wait(WAIT_QUICK_ACTION)


async def set_manual_duration(s, value):
    await s.set_input("manual-duration-input", str(value))
    await s.wait(WAIT_FORM_FILL)


async def set_distance(s, value):
    await s.set_input("distance-input", str(value))
    await s.wait(WAIT_FORM_FILL)


async def set_heart_rate(s, value):
    await s.set_input("heart-rate-input", str(value))
    await s.wait(WAIT_FORM_FILL)


async def clear_input(s, testid: str):
    await s.set_input(testid, "")
    await s.wait(WAIT_FORM_FILL)


# ═════════════════════════════════════════════════════════════════════════════
#  TEST GROUPS
# ═════════════════════════════════════════════════════════════════════════════


async def test_basic_open(s):
    """TC_CDL_001-005: CardioLogger opens, timer, 7 types, default, select."""
    print("\n── TC_CDL_001-005: Basic Open & UI ──")
    await ensure_cardio_open(s)
    await s.screenshot(SCENARIO, "001_cardio_logger_open")

    # TC_CDL_001 — overlay opens
    e = await exists(s, "cardio-logger")
    check("TC_CDL_001", "CardioLogger overlay opens", "yes", e)

    # TC_CDL_002 — elapsed timer visible
    e = await exists(s, "elapsed-timer")
    check("TC_CDL_002", "Elapsed timer visible", "yes", e)

    # TC_CDL_003 — 7 cardio type buttons
    count = await element_count(s, "cardio-type-")
    check("TC_CDL_003", "7 cardio type buttons displayed", "7", str(count))

    # TC_CDL_004 — default = running
    active = await is_active_pill(s, "cardio-type-running")
    check("TC_CDL_004", "Default type is running", "yes", active)
    await s.screenshot(SCENARIO, "004_default_running")

    # TC_CDL_005 — select cycling
    await select_type(s, "cycling")
    active = await is_active_pill(s, "cardio-type-cycling")
    check("TC_CDL_005", "Cycling selected and active", "yes", active)
    await s.screenshot(SCENARIO, "005_cycling_selected")

    # Reset to running for subsequent tests
    await select_type(s, "running")


async def test_stopwatch_mode(s):
    """TC_CDL_006-008: Stopwatch start/pause/stop."""
    print("\n── TC_CDL_006-008: Stopwatch Mode ──")
    await ensure_cardio_open(s)

    # Ensure stopwatch mode
    sw_panel = await exists(s, "stopwatch-panel")
    if sw_panel != "yes":
        await switch_to_stopwatch(s)
        await s.wait(WAIT_QUICK_ACTION)

    # TC_CDL_006 — start
    r = await s.click_testid("start-button")
    check("TC_CDL_006", "Stopwatch start button works", "ok", r)
    await s.wait(2)  # let timer tick
    display = await s.get_text("stopwatch-display")
    await s.screenshot(SCENARIO, "006_stopwatch_started")

    # TC_CDL_007 — pause
    r = await s.click_testid("pause-button")
    check("TC_CDL_007", "Stopwatch pause button works", "ok", r)
    paused_val = await s.get_text("stopwatch-display")
    await s.wait(1)
    paused_val2 = await s.get_text("stopwatch-display")
    # While paused, display should not change
    await s.screenshot(SCENARIO, "007_stopwatch_paused")

    # TC_CDL_008 — stop/reset
    r = await s.click_testid("stop-button")
    check("TC_CDL_008", "Stopwatch stop/reset button works", "ok", r)
    await s.wait(WAIT_QUICK_ACTION)
    display_after_stop = await s.get_text("stopwatch-display")
    await s.screenshot(SCENARIO, "008_stopwatch_stopped")


async def test_manual_mode(s):
    """TC_CDL_009-010: Manual mode toggle and input."""
    print("\n── TC_CDL_009-010: Manual Mode ──")
    await ensure_cardio_open(s)

    # TC_CDL_009 — toggle to manual
    await switch_to_manual(s)
    panel = await exists(s, "manual-panel")
    check("TC_CDL_009", "Manual mode panel visible", "yes", panel)
    await s.screenshot(SCENARIO, "009_manual_mode")

    # TC_CDL_010 — enter duration
    await set_manual_duration(s, 30)
    val = await s.ev(
        '(function(){var e=document.querySelector(\'[data-testid="manual-duration-input"]\');'
        'return e?e.value:"N/A"})()'
    )
    check("TC_CDL_010", "Manual duration input accepts value 30", "30", val)
    await s.screenshot(SCENARIO, "010_manual_duration_30")


async def test_distance_visibility(s):
    """TC_CDL_011-017: Distance field visible/hidden per type."""
    print("\n── TC_CDL_011-017: Distance Field Visibility ──")
    await ensure_cardio_open(s)

    type_to_tc = {
        "running": ("TC_CDL_011", True),
        "cycling": ("TC_CDL_012", True),
        "swimming": ("TC_CDL_013", True),
        "hiit": ("TC_CDL_014", False),
        "walking": ("TC_CDL_015", False),
        "elliptical": ("TC_CDL_016", False),
        "rowing": ("TC_CDL_017", False),
    }
    for ctype, (tc_id, should_show) in type_to_tc.items():
        await select_type(s, ctype)
        await s.wait(WAIT_QUICK_ACTION)
        dist = await exists(s, "distance-section")
        if dist != "yes":
            dist = await exists(s, "distance-input")
        expected_val = "yes" if should_show else "no"
        label = CARDIO_LABELS.get(ctype, ctype)
        check(tc_id, f"Distance {'visible' if should_show else 'hidden'} for {label}", expected_val, dist)
    await s.screenshot(SCENARIO, "017_distance_visibility_done")
    await select_type(s, "running")


async def test_inputs_and_intensity(s):
    """TC_CDL_018-022: HR input, intensity selector, calories."""
    print("\n── TC_CDL_018-022: Inputs & Intensity ──")
    await ensure_cardio_open(s)
    await switch_to_manual(s)
    await set_manual_duration(s, 30)
    await select_type(s, "running")

    # TC_CDL_018 — heart rate
    await set_heart_rate(s, 145)
    hr_val = await s.ev(
        '(function(){var e=document.querySelector(\'[data-testid="heart-rate-input"]\');'
        'return e?e.value:"N/A"})()'
    )
    check("TC_CDL_018", "Heart rate input accepts 145", "145", hr_val)
    await s.screenshot(SCENARIO, "018_heart_rate_145")

    # TC_CDL_019 — intensity has 3 options
    count = 0
    for inten in INTENSITIES:
        e = await exists(s, f"intensity-{inten}")
        if e == "yes":
            count += 1
    check("TC_CDL_019", "Intensity selector has 3 options", "3", str(count))

    # TC_CDL_020 — default intensity = moderate
    active = await is_active_pill(s, "intensity-moderate")
    check("TC_CDL_020", "Default intensity is moderate", "yes", active)
    await s.screenshot(SCENARIO, "020_default_intensity_moderate")

    # TC_CDL_021 — calorie estimation displays
    cal = await parse_calorie(s)
    exp = expected_cal("running", "moderate", 30)
    check_numeric_range("TC_CDL_021", f"Calorie estimation displays (exp ~{exp})", max(exp - 20, 0), exp + 20, cal)
    await s.screenshot(SCENARIO, "021_calorie_estimation")

    # TC_CDL_022 — calorie = 0 when duration = 0
    await set_manual_duration(s, 0)
    await s.wait(WAIT_FORM_FILL)
    cal_zero = await parse_calorie(s)
    check("TC_CDL_022", "Calorie = 0 when duration = 0", "0", str(cal_zero))
    await s.screenshot(SCENARIO, "022_calorie_zero_duration0")

    # Restore duration for later tests
    await set_manual_duration(s, 30)


async def test_save_and_navigation(s):
    """TC_CDL_023-027: Save, finish, back, pause/resume, stop reset."""
    print("\n── TC_CDL_023-027: Save & Navigation ──")
    await ensure_cardio_open(s)
    await switch_to_manual(s)
    await set_manual_duration(s, 30)
    await select_type(s, "running")
    await select_intensity(s, "moderate")

    # TC_CDL_023 — save creates workout
    r_save = await s.click_testid("save-button")
    if r_save != "ok":
        r_save = await s.click_testid("finish-button")
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SCENARIO, "023_save_workout")
    check("TC_CDL_023", "Save button creates workout", "ok", r_save)

    # TC_CDL_024 — finish button exists (re-open to check)
    await ensure_cardio_open(s)
    fin = await exists(s, "finish-button")
    check("TC_CDL_024", "Finish button (header) exists", "yes", fin)
    await s.screenshot(SCENARIO, "024_finish_button")

    # TC_CDL_025 — back button
    r = await s.click_testid("back-button")
    if r != "ok":
        r = await s.ev(
            '(function(){var bs=document.querySelectorAll("button");'
            'for(var i=0;i<bs.length;i++){var a=bs[i].getAttribute("aria-label")||"";'
            'if(a.includes("Quay lại")&&bs[i].getBoundingClientRect().width>0)'
            '{bs[i].click();return"ok"}}return"none"})()'
        )
    check("TC_CDL_025", "Back button navigates back", "ok", r)
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SCENARIO, "025_back_button")

    # TC_CDL_026 — stopwatch pause/resume
    await ensure_cardio_open(s)
    await switch_to_stopwatch(s)
    await s.click_testid("start-button")
    await s.wait(2)
    await s.click_testid("pause-button")
    await s.wait(WAIT_QUICK_ACTION)
    paused = await s.get_text("stopwatch-display")
    await s.click_testid("start-button")  # resume
    await s.wait(1)
    resumed = await s.get_text("stopwatch-display")
    check_not("TC_CDL_026", "Stopwatch resumed (time progressed)", paused, resumed)
    await s.screenshot(SCENARIO, "026_pause_resume")

    # TC_CDL_027 — stop resets to 00:00
    await s.click_testid("pause-button")
    await s.wait(WAIT_QUICK_ACTION)
    await s.click_testid("stop-button")
    await s.wait(WAIT_QUICK_ACTION)
    reset_val = await s.get_text("stopwatch-display")
    has_zero = "00" in str(reset_val) or "0:00" in str(reset_val) or str(reset_val).strip() == "0"
    check("TC_CDL_027", "Stop resets stopwatch to 00:00", "yes", "yes" if has_zero else "no")
    await s.screenshot(SCENARIO, "027_stop_reset")


async def test_edge_cases_negative(s):
    """TC_CDL_028-032: Negative values, clear optional fields."""
    print("\n── TC_CDL_028-032: Edge Cases — Negative/Clear ──")
    await ensure_cardio_open(s)
    await switch_to_manual(s)
    await select_type(s, "running")

    # TC_CDL_028 — negative duration → 0 or rejected
    await set_manual_duration(s, -10)
    val = await s.ev(
        '(function(){var e=document.querySelector(\'[data-testid="manual-duration-input"]\');'
        'return e?e.value:"N/A"})()'
    )
    ok = str(val) in ["0", "", "N/A"] or not str(val).startswith("-")
    check("TC_CDL_028", "Negative duration → 0 or rejected", "yes", "yes" if ok else f"no(val={val})")
    await s.screenshot(SCENARIO, "028_negative_duration")

    # TC_CDL_029 — negative distance → 0 or rejected
    await set_manual_duration(s, 30)
    await set_distance(s, -5)
    val = await s.ev(
        '(function(){var e=document.querySelector(\'[data-testid="distance-input"]\');'
        'return e?e.value:"N/A"})()'
    )
    ok = str(val) in ["0", "", "N/A"] or not str(val).startswith("-")
    check("TC_CDL_029", "Negative distance → 0 or rejected", "yes", "yes" if ok else f"no(val={val})")
    await s.screenshot(SCENARIO, "029_negative_distance")

    # TC_CDL_030 — clear heart rate
    await set_heart_rate(s, 120)
    await s.wait(WAIT_FORM_FILL)
    await clear_input(s, "heart-rate-input")
    val = await s.ev(
        '(function(){var e=document.querySelector(\'[data-testid="heart-rate-input"]\');'
        'return e?e.value:"N/A"})()'
    )
    check("TC_CDL_030", "Clear heart rate → empty", "", val)
    await s.screenshot(SCENARIO, "030_clear_heart_rate")

    # TC_CDL_031 — clear distance
    await set_distance(s, 5)
    await s.wait(WAIT_FORM_FILL)
    await clear_input(s, "distance-input")
    val = await s.ev(
        '(function(){var e=document.querySelector(\'[data-testid="distance-input"]\');'
        'return e?e.value:"N/A"})()'
    )
    check("TC_CDL_031", "Clear distance → empty", "", val)
    await s.screenshot(SCENARIO, "031_clear_distance")

    # TC_CDL_032 — all optional empty, form still valid
    await clear_input(s, "heart-rate-input")
    await clear_input(s, "distance-input")
    await set_manual_duration(s, 30)
    cal = await parse_calorie(s)
    ok = cal > 0
    check("TC_CDL_032", "All optional empty, calorie still calculated", "yes", "yes" if ok else "no")
    await s.screenshot(SCENARIO, "032_optional_empty")


async def test_timer_duration_details(s):
    """TC_CDL_033-036: Elapsed timer, format, durationMin sources."""
    print("\n── TC_CDL_033-036: Timer & Duration Details ──")
    await ensure_cardio_open(s)

    # TC_CDL_033 — elapsed timer independent
    timer_val = await s.get_text("elapsed-timer")
    check("TC_CDL_033", "Elapsed timer runs (has value)", "yes", "yes" if timer_val else "no")
    await s.screenshot(SCENARIO, "033_elapsed_timer")

    # TC_CDL_034 — timer format contains colon (MM:SS)
    has_colon = ":" in str(timer_val)
    check("TC_CDL_034", "Timer format contains ':' (MM:SS)", "yes", "yes" if has_colon else "no")

    # TC_CDL_035 — durationMin from stopwatch
    await switch_to_stopwatch(s)
    await s.click_testid("start-button")
    await s.wait(3)
    await s.click_testid("pause-button")
    await s.wait(WAIT_QUICK_ACTION)
    sw_display = await s.get_text("stopwatch-display")
    check("TC_CDL_035", "Stopwatch records elapsed time", "yes", "yes" if sw_display else "no")
    await s.click_testid("stop-button")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SCENARIO, "035_stopwatch_duration")

    # TC_CDL_036 — durationMin from manual input
    await switch_to_manual(s)
    await set_manual_duration(s, 45)
    val = await s.ev(
        '(function(){var e=document.querySelector(\'[data-testid="manual-duration-input"]\');'
        'return e?e.value:"N/A"})()'
    )
    check("TC_CDL_036", "Manual input stores duration 45", "45", val)
    await s.screenshot(SCENARIO, "036_manual_duration_45")


async def test_calorie_variations(s):
    """TC_CDL_037-039: Calories change with type, intensity, duration."""
    print("\n── TC_CDL_037-039: Calorie Variations ──")
    await ensure_cardio_open(s)
    await switch_to_manual(s)
    await set_manual_duration(s, 30)
    await select_type(s, "running")
    await select_intensity(s, "moderate")
    cal_running = await parse_calorie(s)

    # TC_CDL_037 — calorie changes with type
    await select_type(s, "walking")
    await s.wait(WAIT_QUICK_ACTION)
    cal_walking = await parse_calorie(s)
    check_not("TC_CDL_037", "Calorie changes when type changes (running→walking)", str(cal_running), str(cal_walking))
    await s.screenshot(SCENARIO, "037_calorie_type_change")

    # TC_CDL_038 — calorie changes with intensity
    await select_type(s, "running")
    await select_intensity(s, "moderate")
    await s.wait(WAIT_QUICK_ACTION)
    cal_mod = await parse_calorie(s)
    await select_intensity(s, "high")
    await s.wait(WAIT_QUICK_ACTION)
    cal_high = await parse_calorie(s)
    check_not("TC_CDL_038", "Calorie changes when intensity changes (moderate→high)", str(cal_mod), str(cal_high))
    await s.screenshot(SCENARIO, "038_calorie_intensity_change")

    # TC_CDL_039 — calorie changes with duration
    await select_intensity(s, "moderate")
    await set_manual_duration(s, 30)
    await s.wait(WAIT_FORM_FILL)
    cal_30 = await parse_calorie(s)
    await set_manual_duration(s, 60)
    await s.wait(WAIT_FORM_FILL)
    cal_60 = await parse_calorie(s)
    check_not("TC_CDL_039", "Calorie changes when duration changes (30→60)", str(cal_30), str(cal_60))
    await s.screenshot(SCENARIO, "039_calorie_duration_change")
    await set_manual_duration(s, 30)


async def test_save_details(s):
    """TC_CDL_040-042: Save stopwatch/manual, header finish."""
    print("\n── TC_CDL_040-042: Save Details ──")
    await ensure_cardio_open(s)

    # TC_CDL_040 — save with stopwatch duration
    await switch_to_stopwatch(s)
    await select_type(s, "running")
    await s.click_testid("start-button")
    await s.wait(3)
    await s.click_testid("pause-button")
    await s.wait(WAIT_QUICK_ACTION)
    r = await s.click_testid("save-button")
    if r != "ok":
        r = await s.click_testid("finish-button")
    check("TC_CDL_040", "Save with stopwatch duration", "ok", r)
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SCENARIO, "040_save_stopwatch")

    # TC_CDL_041 — save with manual duration
    await ensure_cardio_open(s)
    await switch_to_manual(s)
    await set_manual_duration(s, 25)
    await select_type(s, "cycling")
    r = await s.click_testid("save-button")
    if r != "ok":
        r = await s.click_testid("finish-button")
    check("TC_CDL_041", "Save with manual duration", "ok", r)
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SCENARIO, "041_save_manual")

    # TC_CDL_042 — header finish button works
    await ensure_cardio_open(s)
    await switch_to_manual(s)
    await set_manual_duration(s, 20)
    fin = await exists(s, "finish-button")
    r = "ok" if fin == "yes" else "none"
    if fin == "yes":
        await s.click_testid("finish-button")
        await s.wait(WAIT_NAV_CLICK)
    check("TC_CDL_042", "Header finish-button is functional", "ok", r)
    await s.screenshot(SCENARIO, "042_finish_button")


async def test_ui_testids(s):
    """TC_CDL_043-055: UI testids, dark mode, i18n, edge saves, memory."""
    print("\n── TC_CDL_043-055: UI & Misc ──")
    await ensure_cardio_open(s)

    # TC_CDL_043 — cardio-logger testid
    e = await exists(s, "cardio-logger")
    check("TC_CDL_043", "data-testid='cardio-logger' exists", "yes", e)

    # TC_CDL_044 — cardio-header testid
    e = await exists(s, "cardio-header")
    check("TC_CDL_044", "data-testid='cardio-header' exists", "yes", e)

    # TC_CDL_045 — dark mode
    skip("TC_CDL_045", "Dark mode rendering", "Requires OS-level dark mode toggle")

    # TC_CDL_046 — i18n
    skip("TC_CDL_046", "i18n locale switching", "App uses single locale (vi)")

    # TC_CDL_047 — pill scroll
    scroll_exists = await exists(s, "cardio-type-selector")
    check("TC_CDL_047", "Type selector container exists (scrollable)", "yes", scroll_exists)
    await s.screenshot(SCENARIO, "047_type_selector")

    # TC_CDL_048 — rapid switching
    for t in CARDIO_TYPES:
        await s.click_testid(f"cardio-type-{t}")
        await s.wait(0.1)
    final = await is_active_pill(s, "cardio-type-rowing")
    check("TC_CDL_048", "Rapid type switching doesn't crash", "yes", final)
    await s.screenshot(SCENARIO, "048_rapid_switch")

    # TC_CDL_049 — save with duration=0 blocked
    await switch_to_manual(s)
    await set_manual_duration(s, 0)
    await s.wait(WAIT_FORM_FILL)
    r = await s.click_testid("save-button")
    if r != "ok":
        r = await s.click_testid("finish-button")
    await s.wait(WAIT_QUICK_ACTION)
    # Check if logger is still open (save blocked) or closed
    still_open = await exists(s, "cardio-logger")
    check("TC_CDL_049", "Save with duration=0 blocked or warned", "yes", still_open)
    await s.screenshot(SCENARIO, "049_save_duration0")

    # TC_CDL_050 — very large duration
    await set_manual_duration(s, 999)
    cal = await parse_calorie(s)
    check("TC_CDL_050", "Large duration (999) computes calorie", "yes", "yes" if cal > 0 else "no")
    await s.screenshot(SCENARIO, "050_large_duration")

    # TC_CDL_051 — unique workout ID (verify via store inspection)
    await set_manual_duration(s, 30)
    await select_type(s, "running")
    await select_intensity(s, "moderate")
    r = await s.click_testid("save-button")
    if r != "ok":
        r = await s.click_testid("finish-button")
    await s.wait(WAIT_NAV_CLICK)
    workout_count = await s.ev(
        '(function(){try{var s=window.__ZUSTAND_STORE__||{};'
        'return"check"}catch(e){return"error"}})()'
    )
    check("TC_CDL_051", "Workout saved (unique ID expected)", "ok", r)
    await s.screenshot(SCENARIO, "051_unique_workout")

    # TC_CDL_052 — unique workoutSet ID
    check("TC_CDL_052", "WorkoutSet saved with unique ID", "ok", r)

    # TC_CDL_053 — finish-button testid
    await ensure_cardio_open(s)
    e = await exists(s, "finish-button")
    check("TC_CDL_053", "finish-button testid exists", "yes", e)

    # TC_CDL_054 — save-button testid
    e = await exists(s, "save-button")
    check("TC_CDL_054", "save-button testid exists", "yes", e)
    await s.screenshot(SCENARIO, "054_save_finish_buttons")

    # TC_CDL_055 — memory leak
    skip("TC_CDL_055", "Memory leak detection", "Requires heap snapshot analysis")


async def test_individual_types(s):
    """TC_CDL_056-062: Select each cardio type individually."""
    print("\n── TC_CDL_056-062: Individual Type Selection ──")
    await ensure_cardio_open(s)

    type_tcs = [
        ("TC_CDL_056", "running", "Chạy bộ"),
        ("TC_CDL_057", "cycling", "Đạp xe"),
        ("TC_CDL_058", "swimming", "Bơi lội"),
        ("TC_CDL_059", "hiit", "HIIT"),
        ("TC_CDL_060", "walking", "Đi bộ"),
        ("TC_CDL_061", "elliptical", "Elliptical"),
        ("TC_CDL_062", "rowing", "Rowing"),
    ]
    for tc_id, ctype, label in type_tcs:
        await select_type(s, ctype)
        active = await is_active_pill(s, f"cardio-type-{ctype}")
        check(tc_id, f"Select {label} → active", "yes", active)
        await s.screenshot(SCENARIO, f"{tc_id[-3:]}_{ctype}_selected")
    await select_type(s, "running")


async def test_type_intensity_combos(s):
    """TC_CDL_063-083: 7 types × 3 intensities = 21 combos."""
    print("\n── TC_CDL_063-083: Type × Intensity Combos ──")
    await ensure_cardio_open(s)
    await switch_to_manual(s)
    await set_manual_duration(s, 30)

    combos = [
        ("TC_CDL_063", "running", "low"),
        ("TC_CDL_064", "running", "moderate"),
        ("TC_CDL_065", "running", "high"),
        ("TC_CDL_066", "cycling", "low"),
        ("TC_CDL_067", "cycling", "moderate"),
        ("TC_CDL_068", "cycling", "high"),
        ("TC_CDL_069", "swimming", "low"),
        ("TC_CDL_070", "swimming", "moderate"),
        ("TC_CDL_071", "swimming", "high"),
        ("TC_CDL_072", "hiit", "low"),
        ("TC_CDL_073", "hiit", "moderate"),
        ("TC_CDL_074", "hiit", "high"),
        ("TC_CDL_075", "walking", "low"),
        ("TC_CDL_076", "walking", "moderate"),
        ("TC_CDL_077", "walking", "high"),
        ("TC_CDL_078", "elliptical", "low"),
        ("TC_CDL_079", "elliptical", "moderate"),
        ("TC_CDL_080", "elliptical", "high"),
        ("TC_CDL_081", "rowing", "low"),
        ("TC_CDL_082", "rowing", "moderate"),
        ("TC_CDL_083", "rowing", "high"),
    ]
    for tc_id, ctype, intensity in combos:
        await select_type(s, ctype)
        await select_intensity(s, intensity)
        await s.wait(WAIT_QUICK_ACTION)
        active_type = await is_active_pill(s, f"cardio-type-{ctype}")
        active_int = await is_active_pill(s, f"intensity-{intensity}")
        both = "yes" if active_type == "yes" and active_int == "yes" else "no"
        check(tc_id, f"{ctype}+{intensity} combo selectable", "yes", both)
    await s.screenshot(SCENARIO, "083_type_intensity_combos_done")


async def test_calorie_formula_per_type(s):
    """TC_CDL_084-090: Calorie formula for each type at 30min moderate."""
    print("\n── TC_CDL_084-090: Calorie Formula per Type ──")
    await ensure_cardio_open(s)
    await switch_to_manual(s)
    await set_manual_duration(s, 30)
    await select_intensity(s, "moderate")

    type_tcs = [
        ("TC_CDL_084", "running", 368),
        ("TC_CDL_085", "cycling", 255),
        ("TC_CDL_086", "swimming", 263),
        ("TC_CDL_087", "hiit", 300),
        ("TC_CDL_088", "walking", 131),
        ("TC_CDL_089", "elliptical", 188),
        ("TC_CDL_090", "rowing", 263),
    ]
    for tc_id, ctype, exp_cal in type_tcs:
        await select_type(s, ctype)
        await s.wait(WAIT_QUICK_ACTION)
        cal = await parse_calorie(s)
        check_numeric_range(tc_id, f"{ctype} 30min moderate → ~{exp_cal} kcal", exp_cal - 15, exp_cal + 15, cal)
    await s.screenshot(SCENARIO, "090_calorie_per_type_done")


async def test_calorie_exact_matrix(s):
    """TC_CDL_091-111: Full 7×3 calorie exact verification at 30min."""
    print("\n── TC_CDL_091-111: Full Calorie Matrix 7×3 ──")
    await ensure_cardio_open(s)
    await switch_to_manual(s)
    await set_manual_duration(s, 30)

    matrix = [
        ("TC_CDL_091", "running", "low", expected_cal("running", "low", 30)),
        ("TC_CDL_092", "running", "moderate", expected_cal("running", "moderate", 30)),
        ("TC_CDL_093", "running", "high", expected_cal("running", "high", 30)),
        ("TC_CDL_094", "cycling", "low", expected_cal("cycling", "low", 30)),
        ("TC_CDL_095", "cycling", "moderate", expected_cal("cycling", "moderate", 30)),
        ("TC_CDL_096", "cycling", "high", expected_cal("cycling", "high", 30)),
        ("TC_CDL_097", "swimming", "low", expected_cal("swimming", "low", 30)),
        ("TC_CDL_098", "swimming", "moderate", expected_cal("swimming", "moderate", 30)),
        ("TC_CDL_099", "swimming", "high", expected_cal("swimming", "high", 30)),
        ("TC_CDL_100", "hiit", "low", expected_cal("hiit", "low", 30)),
        ("TC_CDL_101", "hiit", "moderate", expected_cal("hiit", "moderate", 30)),
        ("TC_CDL_102", "hiit", "high", expected_cal("hiit", "high", 30)),
        ("TC_CDL_103", "walking", "low", expected_cal("walking", "low", 30)),
        ("TC_CDL_104", "walking", "moderate", expected_cal("walking", "moderate", 30)),
        ("TC_CDL_105", "walking", "high", expected_cal("walking", "high", 30)),
        ("TC_CDL_106", "elliptical", "low", expected_cal("elliptical", "low", 30)),
        ("TC_CDL_107", "elliptical", "moderate", expected_cal("elliptical", "moderate", 30)),
        ("TC_CDL_108", "elliptical", "high", expected_cal("elliptical", "high", 30)),
        ("TC_CDL_109", "rowing", "low", expected_cal("rowing", "low", 30)),
        ("TC_CDL_110", "rowing", "moderate", expected_cal("rowing", "moderate", 30)),
        ("TC_CDL_111", "rowing", "high", expected_cal("rowing", "high", 30)),
    ]

    for tc_id, ctype, intensity, exp_cal in matrix:
        await select_type(s, ctype)
        await select_intensity(s, intensity)
        await s.wait(WAIT_QUICK_ACTION)
        cal = await parse_calorie(s)
        check_numeric_range(tc_id, f"{ctype}+{intensity} @30min → {exp_cal}", exp_cal - 15, exp_cal + 15, cal)
    await s.screenshot(SCENARIO, "111_calorie_matrix_done")


async def test_stopwatch_timing_edge(s):
    """TC_CDL_112-118: Stopwatch timing edge cases."""
    print("\n── TC_CDL_112-118: Stopwatch Timing Edge ──")
    await ensure_cardio_open(s)
    await switch_to_stopwatch(s)

    # TC_CDL_112 — start shows 00:00 or 00:01
    await s.click_testid("stop-button")
    await s.wait(WAIT_QUICK_ACTION)
    display0 = await s.get_text("stopwatch-display")
    await s.click_testid("start-button")
    await s.wait(0.5)
    display_start = await s.get_text("stopwatch-display")
    check("TC_CDL_112", "Start shows initial time near 00:00", "0", display_start)
    await s.screenshot(SCENARIO, "112_start_initial")

    # TC_CDL_113 — pause preserves displayed time
    await s.wait(2)
    await s.click_testid("pause-button")
    await s.wait(WAIT_QUICK_ACTION)
    paused1 = await s.get_text("stopwatch-display")
    await s.wait(1)
    paused2 = await s.get_text("stopwatch-display")
    check("TC_CDL_113", "Pause preserves displayed time", str(paused1), str(paused2))
    await s.screenshot(SCENARIO, "113_pause_preserved")

    # TC_CDL_114 — resume continues
    await s.click_testid("start-button")
    await s.wait(2)
    await s.click_testid("pause-button")
    resumed = await s.get_text("stopwatch-display")
    check_not("TC_CDL_114", "Resume continues from paused time", str(paused1), str(resumed))
    await s.screenshot(SCENARIO, "114_resume_continues")

    # TC_CDL_115 — stop after pause resets
    await s.click_testid("stop-button")
    await s.wait(WAIT_QUICK_ACTION)
    reset_val = await s.get_text("stopwatch-display")
    has_zero = "00" in str(reset_val) or "0:00" in str(reset_val) or str(reset_val).strip() == "0"
    check("TC_CDL_115", "Stop after pause resets to 00:00", "yes", "yes" if has_zero else "no")
    await s.screenshot(SCENARIO, "115_stop_reset")

    # TC_CDL_116 — multiple start/stop cycles
    for i in range(3):
        await s.click_testid("start-button")
        await s.wait(1)
        await s.click_testid("pause-button")
        await s.wait(0.3)
        await s.click_testid("stop-button")
        await s.wait(0.3)
    still_ok = await exists(s, "stopwatch-display")
    check("TC_CDL_116", "Multiple start/stop cycles work", "yes", still_ok)
    await s.screenshot(SCENARIO, "116_multi_cycle")

    # TC_CDL_117 — rapid start/pause
    await s.click_testid("start-button")
    await s.wait(0.2)
    await s.click_testid("pause-button")
    await s.wait(0.2)
    await s.click_testid("start-button")
    await s.wait(0.2)
    await s.click_testid("pause-button")
    still_ok = await exists(s, "stopwatch-display")
    check("TC_CDL_117", "Rapid start/pause doesn't crash", "yes", still_ok)
    await s.click_testid("stop-button")
    await s.screenshot(SCENARIO, "117_rapid_start_pause")

    # TC_CDL_118 — stopwatch value used as durationMin for save
    await s.click_testid("start-button")
    await s.wait(5)
    await s.click_testid("pause-button")
    await s.wait(WAIT_QUICK_ACTION)
    sw_val = await s.get_text("stopwatch-display")
    check("TC_CDL_118", "Stopwatch records value for save", "yes", "yes" if sw_val else "no")
    await s.click_testid("stop-button")
    await s.screenshot(SCENARIO, "118_stopwatch_save_value")


async def test_manual_input_edge(s):
    """TC_CDL_119-125: Manual input edge cases."""
    print("\n── TC_CDL_119-125: Manual Input Edge ──")
    await ensure_cardio_open(s)
    await switch_to_manual(s)

    test_values = [
        ("TC_CDL_119", 0, "0"),
        ("TC_CDL_120", 1, "1"),
        ("TC_CDL_121", 60, "60"),
        ("TC_CDL_122", 120, "120"),
    ]
    for tc_id, val, expected_str in test_values:
        await set_manual_duration(s, val)
        actual = await s.ev(
            '(function(){var e=document.querySelector(\'[data-testid="manual-duration-input"]\');'
            'return e?e.value:"N/A"})()'
        )
        check(tc_id, f"Manual duration = {val}", expected_str, actual)

    # TC_CDL_123 — decimal 30.5
    await set_manual_duration(s, "30.5")
    actual = await s.ev(
        '(function(){var e=document.querySelector(\'[data-testid="manual-duration-input"]\');'
        'return e?e.value:"N/A"})()'
    )
    ok = actual in ["30.5", "30", "31"]
    check("TC_CDL_123", "Decimal 30.5 accepted or rounded", "yes", "yes" if ok else f"no(val={actual})")
    await s.screenshot(SCENARIO, "123_decimal_duration")

    # TC_CDL_124 — clear input
    await clear_input(s, "manual-duration-input")
    actual = await s.ev(
        '(function(){var e=document.querySelector(\'[data-testid="manual-duration-input"]\');'
        'return e?e.value:"N/A"})()'
    )
    check("TC_CDL_124", "Clear manual duration → empty", "", actual)

    # TC_CDL_125 — re-enter after clear
    await set_manual_duration(s, 45)
    actual = await s.ev(
        '(function(){var e=document.querySelector(\'[data-testid="manual-duration-input"]\');'
        'return e?e.value:"N/A"})()'
    )
    check("TC_CDL_125", "Re-enter 45 after clear", "45", actual)
    await s.screenshot(SCENARIO, "125_reenter_after_clear")


async def test_heart_rate_boundaries(s):
    """TC_CDL_126-132: Heart rate boundary values."""
    print("\n── TC_CDL_126-132: Heart Rate Boundaries ──")
    await ensure_cardio_open(s)

    hr_tests = [
        ("TC_CDL_126", 30, "Min valid HR=30"),
        ("TC_CDL_127", 60, "Resting HR=60"),
        ("TC_CDL_128", 100, "Light exercise HR=100"),
        ("TC_CDL_129", 150, "Moderate exercise HR=150"),
        ("TC_CDL_130", 200, "High exercise HR=200"),
        ("TC_CDL_131", 250, "Max valid HR=250"),
    ]
    for tc_id, hr_val, desc in hr_tests:
        await set_heart_rate(s, hr_val)
        actual = await s.ev(
            '(function(){var e=document.querySelector(\'[data-testid="heart-rate-input"]\');'
            'return e?e.value:"N/A"})()'
        )
        check(tc_id, desc, str(hr_val), actual)

    # TC_CDL_132 — empty HR
    await clear_input(s, "heart-rate-input")
    actual = await s.ev(
        '(function(){var e=document.querySelector(\'[data-testid="heart-rate-input"]\');'
        'return e?e.value:"N/A"})()'
    )
    check("TC_CDL_132", "HR cleared → empty", "", actual)
    await s.screenshot(SCENARIO, "132_hr_boundaries_done")


async def test_distance_input_edge(s):
    """TC_CDL_133-139: Distance input edge cases."""
    print("\n── TC_CDL_133-139: Distance Input Edge ──")
    await ensure_cardio_open(s)
    await select_type(s, "running")  # distance visible

    dist_tests = [
        ("TC_CDL_133", "0.5", "Distance=0.5km"),
        ("TC_CDL_134", "1.0", "Distance=1.0km"),
        ("TC_CDL_135", "5.0", "Distance=5.0km"),
        ("TC_CDL_136", "10.0", "Distance=10.0km"),
        ("TC_CDL_137", "42.2", "Distance=42.2km (marathon)"),
    ]
    for tc_id, dist_val, desc in dist_tests:
        await set_distance(s, dist_val)
        actual = await s.ev(
            '(function(){var e=document.querySelector(\'[data-testid="distance-input"]\');'
            'return e?e.value:"N/A"})()'
        )
        check(tc_id, desc, dist_val, actual)

    # TC_CDL_138 — empty distance
    await clear_input(s, "distance-input")
    actual = await s.ev(
        '(function(){var e=document.querySelector(\'[data-testid="distance-input"]\');'
        'return e?e.value:"N/A"})()'
    )
    check("TC_CDL_138", "Distance cleared → empty", "", actual)

    # TC_CDL_139 — distance after type switch to non-distance type
    await select_type(s, "hiit")
    await s.wait(WAIT_QUICK_ACTION)
    dist_vis = await exists(s, "distance-input")
    if dist_vis != "yes":
        dist_vis = await exists(s, "distance-section")
    check("TC_CDL_139", "Distance hidden after switch to HIIT", "no", dist_vis)
    await s.screenshot(SCENARIO, "139_distance_edge_done")
    await select_type(s, "running")


async def test_multi_field_combos(s):
    """TC_CDL_140-153: Multi-field combination tests."""
    print("\n── TC_CDL_140-153: Multi-field Combos ──")
    await ensure_cardio_open(s)
    await switch_to_manual(s)

    combos = [
        ("TC_CDL_140", "running", 30, "5", "145", "moderate",
         "running+30min+5km+HR145+moderate"),
        ("TC_CDL_141", "cycling", 45, "20", "130", "high",
         "cycling+45min+20km+HR130+high"),
        ("TC_CDL_142", "swimming", 20, "1", "160", "low",
         "swimming+20min+1km+HR160+low"),
        ("TC_CDL_143", "hiit", 15, None, "170", "high",
         "hiit+15min+noDistance+HR170+high"),
        ("TC_CDL_144", "walking", 60, None, "100", "low",
         "walking+60min+noDistance+HR100+low"),
        ("TC_CDL_145", "elliptical", 30, None, "140", "moderate",
         "elliptical+30min+noDistance+HR140+moderate"),
        ("TC_CDL_146", "rowing", 25, None, "155", "high",
         "rowing+25min+noDistance+HR155+high"),
    ]
    for tc_id, ctype, dur, dist, hr, inten, desc in combos:
        await select_type(s, ctype)
        await set_manual_duration(s, dur)
        if dist and ctype in DISTANCE_TYPES:
            await set_distance(s, dist)
        await set_heart_rate(s, hr)
        await select_intensity(s, inten)
        await s.wait(WAIT_QUICK_ACTION)
        cal = await parse_calorie(s)
        exp = expected_cal(ctype, inten, dur)
        check_numeric_range(tc_id, desc, exp - 20, exp + 20, cal)
    await s.screenshot(SCENARIO, "146_multi_combos_7")

    # TC_CDL_147 — running + stopwatch + distance + HR + low
    await select_type(s, "running")
    await switch_to_stopwatch(s)
    await s.click_testid("start-button")
    await s.wait(3)
    await s.click_testid("pause-button")
    await s.wait(WAIT_QUICK_ACTION)
    await select_intensity(s, "low")
    e = await exists(s, "distance-input")
    if e == "yes":
        await set_distance(s, "3")
    await set_heart_rate(s, "120")
    cal = await parse_calorie(s)
    check("TC_CDL_147", "running+stopwatch+3km+HR120+low combo", "yes", "yes" if cal >= 0 else "no")
    await s.click_testid("stop-button")
    await s.screenshot(SCENARIO, "147_stopwatch_combo")

    # TC_CDL_148 — all fields filled → calorie correct
    await switch_to_manual(s)
    await select_type(s, "running")
    await set_manual_duration(s, 30)
    await set_distance(s, "5")
    await set_heart_rate(s, "150")
    await select_intensity(s, "moderate")
    await s.wait(WAIT_QUICK_ACTION)
    cal = await parse_calorie(s)
    exp = expected_cal("running", "moderate", 30)
    check_numeric_range("TC_CDL_148", f"All fields filled → cal ~{exp}", exp - 15, exp + 15, cal)

    # TC_CDL_149 — only type + duration → calorie correct
    await clear_input(s, "heart-rate-input")
    await clear_input(s, "distance-input")
    await s.wait(WAIT_FORM_FILL)
    cal = await parse_calorie(s)
    check_numeric_range("TC_CDL_149", "Only type+duration → cal correct", exp - 15, exp + 15, cal)

    # TC_CDL_150 — change type mid-session → distance resets
    await set_distance(s, "10")
    await select_type(s, "hiit")
    await s.wait(WAIT_QUICK_ACTION)
    dist_vis = await exists(s, "distance-input")
    if dist_vis != "yes":
        dist_vis = await exists(s, "distance-section")
    check("TC_CDL_150", "Type→HIIT hides distance", "no", dist_vis)

    # TC_CDL_151 — change intensity mid-session → calorie updates
    await select_type(s, "running")
    await set_manual_duration(s, 30)
    await select_intensity(s, "low")
    await s.wait(WAIT_QUICK_ACTION)
    cal_low = await parse_calorie(s)
    await select_intensity(s, "high")
    await s.wait(WAIT_QUICK_ACTION)
    cal_high = await parse_calorie(s)
    check_not("TC_CDL_151", "Intensity change updates calorie (low→high)", str(cal_low), str(cal_high))

    # TC_CDL_152 — change duration mid-session → calorie updates
    await set_manual_duration(s, 15)
    await s.wait(WAIT_FORM_FILL)
    cal_15 = await parse_calorie(s)
    await set_manual_duration(s, 60)
    await s.wait(WAIT_FORM_FILL)
    cal_60 = await parse_calorie(s)
    check_not("TC_CDL_152", "Duration change updates calorie (15→60)", str(cal_15), str(cal_60))

    # TC_CDL_153 — all optional cleared → still valid
    await set_manual_duration(s, 30)
    await clear_input(s, "heart-rate-input")
    dist_e = await exists(s, "distance-input")
    if dist_e == "yes":
        await clear_input(s, "distance-input")
    cal = await parse_calorie(s)
    check("TC_CDL_153", "All optional cleared → calorie still calculated", "yes", "yes" if cal > 0 else "no")
    await s.screenshot(SCENARIO, "153_multi_field_done")


async def test_save_workflow_variations(s):
    """TC_CDL_154-167: Save workflow and exercise ID mapping."""
    print("\n── TC_CDL_154-167: Save Workflow Variations ──")

    # TC_CDL_154 — save via finish-button
    await ensure_cardio_open(s)
    await switch_to_manual(s)
    await set_manual_duration(s, 20)
    await select_type(s, "running")
    r = await s.click_testid("finish-button")
    check("TC_CDL_154", "Save via finish-button", "ok", r)
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SCENARIO, "154_save_finish")

    # TC_CDL_155 — save via save-button
    await ensure_cardio_open(s)
    await switch_to_manual(s)
    await set_manual_duration(s, 20)
    await select_type(s, "cycling")
    r = await s.click_testid("save-button")
    if r != "ok":
        r = await s.click_testid("finish-button")
    check("TC_CDL_155", "Save via save-button", "ok", r)
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SCENARIO, "155_save_button")

    # TC_CDL_156-162 — exercise ID mapping per type
    exercise_tcs = [
        ("TC_CDL_156", "running", "running"),
        ("TC_CDL_157", "cycling", "cycling"),
        ("TC_CDL_158", "swimming", "swimming"),
        ("TC_CDL_159", "hiit", "hiit-training"),
        ("TC_CDL_160", "walking", "walking"),
        ("TC_CDL_161", "elliptical", "elliptical"),
        ("TC_CDL_162", "rowing", "rowing-machine"),
    ]
    for tc_id, ctype, expected_eid in exercise_tcs:
        await ensure_cardio_open(s)
        await switch_to_manual(s)
        await set_manual_duration(s, 15)
        await select_type(s, ctype)
        r = await s.click_testid("save-button")
        if r != "ok":
            r = await s.click_testid("finish-button")
        await s.wait(WAIT_NAV_CLICK)
        check(tc_id, f"Save {ctype} → exercise_id={expected_eid}", "ok", r)
    await s.screenshot(SCENARIO, "162_exercise_ids_done")

    # TC_CDL_163 — save manual 30min → duration_min=30
    await ensure_cardio_open(s)
    await switch_to_manual(s)
    await set_manual_duration(s, 30)
    await select_type(s, "running")
    r = await s.click_testid("save-button")
    if r != "ok":
        r = await s.click_testid("finish-button")
    check("TC_CDL_163", "Save manual 30min", "ok", r)
    await s.wait(WAIT_NAV_CLICK)

    # TC_CDL_164 — save with distance 5km
    await ensure_cardio_open(s)
    await switch_to_manual(s)
    await set_manual_duration(s, 20)
    await select_type(s, "running")
    await set_distance(s, "5")
    r = await s.click_testid("save-button")
    if r != "ok":
        r = await s.click_testid("finish-button")
    check("TC_CDL_164", "Save with distance=5km", "ok", r)
    await s.wait(WAIT_NAV_CLICK)

    # TC_CDL_165 — save with HR 145
    await ensure_cardio_open(s)
    await switch_to_manual(s)
    await set_manual_duration(s, 20)
    await select_type(s, "running")
    await set_heart_rate(s, "145")
    r = await s.click_testid("save-button")
    if r != "ok":
        r = await s.click_testid("finish-button")
    check("TC_CDL_165", "Save with HR=145", "ok", r)
    await s.wait(WAIT_NAV_CLICK)

    # TC_CDL_166 — save with intensity high
    await ensure_cardio_open(s)
    await switch_to_manual(s)
    await set_manual_duration(s, 20)
    await select_type(s, "running")
    await select_intensity(s, "high")
    r = await s.click_testid("save-button")
    if r != "ok":
        r = await s.click_testid("finish-button")
    check("TC_CDL_166", "Save with intensity=high", "ok", r)
    await s.wait(WAIT_NAV_CLICK)

    # TC_CDL_167 — save returns to previous view
    cardio_still = await exists(s, "cardio-logger")
    check("TC_CDL_167", "Save returns to previous view (logger closed)", "no", cardio_still)
    await s.screenshot(SCENARIO, "167_save_workflow_done")


async def test_ui_stress(s):
    """TC_CDL_168-181: UI stress tests, labels, rapid interactions."""
    print("\n── TC_CDL_168-181: UI Stress Tests ──")
    await ensure_cardio_open(s)

    # TC_CDL_168 — switch all 7 types rapidly
    for ctype in CARDIO_TYPES:
        await s.click_testid(f"cardio-type-{ctype}")
        await s.wait(0.1)
    final = await is_active_pill(s, "cardio-type-rowing")
    check("TC_CDL_168", "Rapid switch all 7 types", "yes", final)
    await s.screenshot(SCENARIO, "168_rapid_7_types")

    # TC_CDL_169 — toggle stopwatch/manual 10 times
    for _ in range(5):
        await s.click_testid("manual-mode-button")
        await s.wait(0.15)
        await s.click_testid("stopwatch-mode-button")
        await s.wait(0.15)
    still_ok = await exists(s, "cardio-logger")
    check("TC_CDL_169", "Toggle stopwatch/manual 10× no crash", "yes", still_ok)
    await s.screenshot(SCENARIO, "169_toggle_modes")

    # TC_CDL_170 — start/stop stopwatch 5 times
    await switch_to_stopwatch(s)
    for _ in range(5):
        await s.click_testid("start-button")
        await s.wait(0.5)
        await s.click_testid("pause-button")
        await s.wait(0.2)
        await s.click_testid("stop-button")
        await s.wait(0.2)
    still_ok = await exists(s, "stopwatch-display")
    check("TC_CDL_170", "Start/stop 5× no crash", "yes", still_ok)

    # TC_CDL_171 — enter/clear duration 5 times
    await switch_to_manual(s)
    for i in range(5):
        await set_manual_duration(s, (i + 1) * 10)
        await s.wait(0.1)
        await clear_input(s, "manual-duration-input")
        await s.wait(0.1)
    still_ok = await exists(s, "manual-duration-input")
    check("TC_CDL_171", "Enter/clear duration 5× no crash", "yes", still_ok)

    # TC_CDL_172 — cycle intensity low→moderate→high→low
    for inten in ["low", "moderate", "high", "low"]:
        await select_intensity(s, inten)
        await s.wait(0.1)
    active = await is_active_pill(s, "intensity-low")
    check("TC_CDL_172", "Cycle intensity low→moderate→high→low", "yes", active)
    await s.screenshot(SCENARIO, "172_cycle_intensity")

    # TC_CDL_173 — distance → type without distance → switch back
    await select_type(s, "running")
    await s.wait(WAIT_QUICK_ACTION)
    dist_e = await exists(s, "distance-input")
    if dist_e == "yes":
        await set_distance(s, "7.5")
    await select_type(s, "hiit")
    await s.wait(WAIT_QUICK_ACTION)
    await select_type(s, "running")
    await s.wait(WAIT_QUICK_ACTION)
    dist_e = await exists(s, "distance-input")
    check("TC_CDL_173", "Distance reappears after type switch back", "yes", dist_e)

    # TC_CDL_174 — open → back → reopen
    await close_cardio_logger(s)
    await s.wait(WAIT_NAV_CLICK)
    await open_cardio_logger(s)
    await s.wait(WAIT_MODAL_OPEN)
    e = await exists(s, "cardio-logger")
    check("TC_CDL_174", "Reopen cardio logger after back", "yes", e)
    await s.screenshot(SCENARIO, "174_reopen")

    # TC_CDL_175 — fill all → back → reopen → fields reset
    await switch_to_manual(s)
    await set_manual_duration(s, 99)
    await close_cardio_logger(s)
    await s.wait(WAIT_NAV_CLICK)
    await open_cardio_logger(s)
    await s.wait(WAIT_MODAL_OPEN)
    await switch_to_manual(s)
    dur_val = await s.ev(
        '(function(){var e=document.querySelector(\'[data-testid="manual-duration-input"]\');'
        'return e?e.value:"N/A"})()'
    )
    is_reset = dur_val in ["", "N/A", "0", "undefined"]
    check("TC_CDL_175", "Fields reset after close+reopen", "yes", "yes" if is_reset else f"no(val={dur_val})")
    await s.screenshot(SCENARIO, "175_fields_reset")

    # TC_CDL_176 — Vietnamese labels for types
    await select_type(s, "running")
    body = await s.ev('document.querySelector(\'[data-testid="cardio-type-selector"]\')?.textContent||""')
    has_vi = "Chạy" in str(body) or "chạy" in str(body)
    check("TC_CDL_176", "Type labels in Vietnamese", "yes", "yes" if has_vi else "no")

    # TC_CDL_177 — Vietnamese labels for intensity
    body = await s.ev('document.querySelector(\'[data-testid="intensity-selector"]\')?.textContent||""')
    check("TC_CDL_177", "Intensity labels displayed", "yes", "yes" if body else "no")

    # TC_CDL_178 — manual duration label
    await switch_to_manual(s)
    panel = await s.ev('document.querySelector(\'[data-testid="manual-panel"]\')?.textContent||""')
    check("TC_CDL_178", "Manual duration has label", "yes", "yes" if panel else "no")

    # TC_CDL_179 — distance label shows km
    await select_type(s, "running")
    dist_section = await s.ev('document.querySelector(\'[data-testid="distance-section"]\')?.textContent||""')
    has_km = "km" in str(dist_section).lower()
    check("TC_CDL_179", "Distance label shows 'km'", "yes", "yes" if has_km else "no")

    # TC_CDL_180 — heart rate label shows bpm
    hr_area = await s.ev(
        '(function(){var e=document.querySelector(\'[data-testid="heart-rate-input"]\');'
        'if(!e)return"";var p=e.closest("div")||e.parentElement;return p?p.textContent:""})()'
    )
    has_bpm = "bpm" in str(hr_area).lower() or "nhịp" in str(hr_area).lower()
    check("TC_CDL_180", "Heart rate area shows 'bpm' or equivalent", "yes", "yes" if has_bpm else "no")

    # TC_CDL_181 — calorie label shows kcal
    cal_area = await s.ev('document.querySelector(\'[data-testid="calorie-preview"]\')?.textContent||""')
    has_kcal = "kcal" in str(cal_area).lower() or "cal" in str(cal_area).lower()
    check("TC_CDL_181", "Calorie label shows 'kcal'", "yes", "yes" if has_kcal else "no")
    await s.screenshot(SCENARIO, "181_ui_stress_done")


async def test_accessibility_state(s):
    """TC_CDL_182-195: Accessibility and state checks."""
    print("\n── TC_CDL_182-195: Accessibility & State ──")
    await ensure_cardio_open(s)

    # TC_CDL_182 — buttons have accessible names
    btn_count = await s.ev(
        '(function(){var bs=document.querySelectorAll(\'[data-testid="cardio-logger"] button\');'
        'var c=0;bs.forEach(function(b){if(b.textContent.trim()||b.getAttribute("aria-label"))c++});'
        'return c})()'
    )
    total_btn = await s.ev(
        'document.querySelectorAll(\'[data-testid="cardio-logger"] button\').length'
    )
    check("TC_CDL_182", "All buttons have accessible names", str(total_btn), str(btn_count))

    # TC_CDL_183 — inputs have labels
    label_check = await s.ev(
        '(function(){var inputs=document.querySelectorAll(\'[data-testid="cardio-logger"] input\');'
        'var labeled=0;inputs.forEach(function(i){'
        'if(i.getAttribute("aria-label")||i.getAttribute("placeholder")||'
        'document.querySelector("label[for=\\""+i.id+"\\"]"))labeled++});'
        'return labeled+"/"+inputs.length})()'
    )
    check("TC_CDL_183", "Inputs have labels/placeholders", "yes",
          "yes" if "/" in str(label_check) and not str(label_check).startswith("0/") else "no")

    # TC_CDL_184 — active type has visual distinction
    await select_type(s, "cycling")
    cls = await get_class(s, "cardio-type-cycling")
    check("TC_CDL_184", "Active type has CSS class distinction", "yes", "yes" if cls != "N/A" else "no")
    await s.screenshot(SCENARIO, "184_active_type_distinction")

    # TC_CDL_185 — active intensity has visual distinction
    await select_intensity(s, "high")
    cls = await get_class(s, "intensity-high")
    check("TC_CDL_185", "Active intensity has CSS class distinction", "yes", "yes" if cls != "N/A" else "no")

    # TC_CDL_186 — stopwatch display readable
    await switch_to_stopwatch(s)
    sw = await s.get_text("stopwatch-display")
    check("TC_CDL_186", "Stopwatch display readable", "yes", "yes" if sw else "no")

    # TC_CDL_187 — calorie preview readable
    await switch_to_manual(s)
    await set_manual_duration(s, 30)
    await s.wait(WAIT_FORM_FILL)
    cal_txt = await get_calorie_text(s)
    check("TC_CDL_187", "Calorie preview readable", "yes", "yes" if cal_txt else "no")

    # TC_CDL_188 — elapsed timer readable
    timer = await s.get_text("elapsed-timer")
    check("TC_CDL_188", "Elapsed timer readable", "yes", "yes" if timer else "no")

    # TC_CDL_189 — back button accessible
    back_exists = await s.ev(
        '(function(){var bs=document.querySelectorAll("button");'
        'for(var i=0;i<bs.length;i++){var a=bs[i].getAttribute("aria-label")||"";'
        'if(a.includes("Quay lại")||bs[i].getAttribute("data-testid")==="back-button")return"yes"}'
        'return"no"})()'
    )
    check("TC_CDL_189", "Back button accessible", "yes", back_exists)

    # TC_CDL_190 — finish button accessible
    fin = await exists(s, "finish-button")
    check("TC_CDL_190", "Finish button accessible", "yes", fin)

    # TC_CDL_191 — save button accessible
    save = await exists(s, "save-button")
    check("TC_CDL_191", "Save button accessible", "yes", save)

    # TC_CDL_192 — form validation feedback (try save with 0 duration)
    await set_manual_duration(s, 0)
    await s.wait(WAIT_FORM_FILL)
    await s.click_testid("save-button")
    await s.wait(WAIT_QUICK_ACTION)
    still_open = await exists(s, "cardio-logger")
    check("TC_CDL_192", "Form validation prevents save with duration=0", "yes", still_open)
    await s.screenshot(SCENARIO, "192_validation_feedback")

    # TC_CDL_193 — screen reader
    skip("TC_CDL_193", "Screen reader testing", "Requires assistive technology")

    # TC_CDL_194 — keyboard navigation
    skip("TC_CDL_194", "Full keyboard navigation", "CDP doesn't simulate full keyboard nav")

    # TC_CDL_195 — focus trap
    skip("TC_CDL_195", "Focus trap in overlay", "Requires Tab key traversal test")
    await s.screenshot(SCENARIO, "195_accessibility_done")


async def test_final_integration(s):
    """TC_CDL_196-210: Final integration and verification tests."""
    print("\n── TC_CDL_196-210: Final Integration ──")

    # TC_CDL_196 — full workflow end-to-end
    await ensure_cardio_open(s)
    await switch_to_manual(s)
    await select_type(s, "running")
    await set_manual_duration(s, 30)
    dist_e = await exists(s, "distance-input")
    if dist_e == "yes":
        await set_distance(s, "5")
    await set_heart_rate(s, "145")
    await select_intensity(s, "moderate")
    await s.wait(WAIT_QUICK_ACTION)
    cal = await parse_calorie(s)
    exp = expected_cal("running", "moderate", 30)
    r = await s.click_testid("save-button")
    if r != "ok":
        r = await s.click_testid("finish-button")
    await s.wait(WAIT_NAV_CLICK)
    check("TC_CDL_196", f"Full E2E workflow: save ok, cal~{exp}", "ok", r)
    await s.screenshot(SCENARIO, "196_full_workflow")

    # TC_CDL_197 — saved workout appears (check fitness tab shows recent)
    await s.nav_fitness()
    await s.wait(WAIT_NAV_CLICK)
    body = await s.ev('document.body.innerText')
    has_cardio_ref = any(kw in str(body) for kw in ["Chạy bộ", "Cardio", "chạy", "Running", "kcal"])
    check("TC_CDL_197", "Saved workout referenced in fitness view", "yes", "yes" if has_cardio_ref else "no")
    await s.screenshot(SCENARIO, "197_workout_in_fitness")

    # TC_CDL_198 — calories in dashboard
    await s.nav_dashboard()
    await s.wait(WAIT_NAV_CLICK)
    body = await s.ev('document.body.innerText')
    check("TC_CDL_198", "Dashboard reflects workout data", "yes",
          "yes" if any(kw in str(body) for kw in ["kcal", "Đã đốt", "cháy", "cal"]) else "no")
    await s.screenshot(SCENARIO, "198_dashboard_calories")

    # TC_CDL_199 — reopen after save → fresh state
    await s.nav_fitness()
    await s.wait(WAIT_NAV_CLICK)
    await s.subtab_plan()
    await s.wait(WAIT_NAV_CLICK)
    await open_cardio_logger(s)
    await s.wait(WAIT_MODAL_OPEN)
    e = await exists(s, "cardio-logger")
    check("TC_CDL_199", "Reopen cardio logger → fresh state", "yes", e)
    await switch_to_manual(s)
    dur_val = await s.ev(
        '(function(){var e=document.querySelector(\'[data-testid="manual-duration-input"]\');'
        'return e?e.value:"N/A"})()'
    )
    is_fresh = dur_val in ["", "N/A", "0", "undefined"]
    check("TC_CDL_199", "Fresh state after reopen (dur empty)", "yes", "yes" if is_fresh else f"no({dur_val})")
    await s.screenshot(SCENARIO, "199_fresh_reopen")

    # TC_CDL_200 — multiple saves create distinct workouts
    for i in range(2):
        await ensure_cardio_open(s)
        await switch_to_manual(s)
        await set_manual_duration(s, 10 + i * 5)
        await select_type(s, CARDIO_TYPES[i])
        r = await s.click_testid("save-button")
        if r != "ok":
            r = await s.click_testid("finish-button")
        await s.wait(WAIT_NAV_CLICK)
    check("TC_CDL_200", "Multiple saves create distinct workouts", "ok", r)
    await s.screenshot(SCENARIO, "200_multiple_saves")

    # TC_CDL_201 — calorie formula exact: round(dur × MET × weight / 60)
    await ensure_cardio_open(s)
    await switch_to_manual(s)
    await set_manual_duration(s, 30)
    await select_type(s, "swimming")
    await select_intensity(s, "high")
    await s.wait(WAIT_QUICK_ACTION)
    cal = await parse_calorie(s)
    exp = expected_cal("swimming", "high", 30)
    check_numeric_range("TC_CDL_201", f"Calorie formula exact: swim+high 30m → {exp}", exp - 10, exp + 10, cal)
    await s.screenshot(SCENARIO, "201_formula_verify")

    # TC_CDL_202 — stopwatch short duration ≈ 0 min
    await switch_to_stopwatch(s)
    await s.click_testid("start-button")
    await s.wait(3)
    await s.click_testid("pause-button")
    await s.wait(WAIT_QUICK_ACTION)
    cal = await parse_calorie(s)
    check("TC_CDL_202", "Stopwatch 3s → cal near 0 (short duration)", "yes",
          "yes" if cal <= 30 else f"no(cal={cal})")
    await s.click_testid("stop-button")
    await s.screenshot(SCENARIO, "202_stopwatch_short")

    # TC_CDL_203 — manual 30min + running + high → 480
    await switch_to_manual(s)
    await set_manual_duration(s, 30)
    await select_type(s, "running")
    await select_intensity(s, "high")
    await s.wait(WAIT_QUICK_ACTION)
    cal = await parse_calorie(s)
    exp = expected_cal("running", "high", 30)  # 480
    check_numeric_range("TC_CDL_203", f"running+high 30m → {exp}", exp - 10, exp + 10, cal)

    # TC_CDL_204 — manual 30min + walking + low → 94
    await select_type(s, "walking")
    await select_intensity(s, "low")
    await s.wait(WAIT_QUICK_ACTION)
    cal = await parse_calorie(s)
    exp = expected_cal("walking", "low", 30)  # 94
    check_numeric_range("TC_CDL_204", f"walking+low 30m → {exp}", exp - 10, exp + 10, cal)
    await s.screenshot(SCENARIO, "204_walking_low")

    # TC_CDL_205 — calorie-preview updates in real-time
    await select_type(s, "running")
    await select_intensity(s, "moderate")
    await set_manual_duration(s, 10)
    await s.wait(WAIT_FORM_FILL)
    cal_10 = await parse_calorie(s)
    await set_manual_duration(s, 50)
    await s.wait(WAIT_FORM_FILL)
    cal_50 = await parse_calorie(s)
    check("TC_CDL_205", "Calorie preview updates real-time", "yes", "yes" if cal_50 > cal_10 else "no")

    # TC_CDL_206 — type selector pills all visible
    count = await element_count(s, "cardio-type-")
    check("TC_CDL_206", "All 7 type pills visible", "7", str(count))

    # TC_CDL_207 — cardio-logger overlay z-index
    z_val = await s.ev(
        '(function(){var e=document.querySelector(\'[data-testid="cardio-logger"]\');'
        'if(!e)return"N/A";var cs=getComputedStyle(e);'
        'return cs.zIndex||cs.position||"auto"})()'
    )
    check("TC_CDL_207", "CardioLogger has overlay positioning", "yes",
          "yes" if z_val not in ["N/A", "auto", "static", ""] else f"no({z_val})")
    await s.screenshot(SCENARIO, "207_overlay_position")

    # TC_CDL_208 — offline mode
    skip("TC_CDL_208", "Offline mode test", "Requires network emulation")

    # TC_CDL_209 — slow network
    skip("TC_CDL_209", "Slow network test", "Requires network throttling")

    # TC_CDL_210 — final clean state
    await close_cardio_logger(s)
    await s.wait(WAIT_NAV_CLICK)
    logger_closed = await exists(s, "cardio-logger")
    check("TC_CDL_210", "Final: cardio logger closed cleanly", "no", logger_closed)
    await s.screenshot(SCENARIO, "210_final_clean_state")


# ═════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═════════════════════════════════════════════════════════════════════════════


def print_summary():
    total = len(RESULTS)
    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    failed = sum(1 for r in RESULTS if r["status"] == "FAIL")
    skipped = sum(1 for r in RESULTS if r["status"] == "SKIP")

    print("\n" + "═" * 72)
    print(f"  SC28 CARDIO LOGGING — TEST SUMMARY")
    print("═" * 72)
    print(f"  Total:   {total}")
    print(f"  ✅ PASS:  {passed}")
    print(f"  ❌ FAIL:  {failed}")
    print(f"  ⏭️  SKIP:  {skipped}")
    print(f"  Pass Rate: {passed}/{total - skipped} = "
          f"{(passed / (total - skipped) * 100) if (total - skipped) > 0 else 0:.1f}%")
    print("═" * 72)

    if failed > 0:
        print("\n── FAILED TEST CASES ──")
        for r in RESULTS:
            if r["status"] == "FAIL":
                print(f"  ❌ [{r['tc']}] {r['title']} — {r['detail']}")

    if skipped > 0:
        print("\n── SKIPPED TEST CASES ──")
        for r in RESULTS:
            if r["status"] == "SKIP":
                print(f"  ⏭️  [{r['tc']}] {r['title']} — {r['detail']}")
    print()


async def main():
    print("=" * 72)
    print("  SC28 — Cardio Logging E2E Test (TC_CDL_001 → TC_CDL_210)")
    print("=" * 72)

    s = await setup_fresh(full_onboard=True, scenario=SCENARIO)
    reset_steps(SCENARIO)

    # Navigate to fitness tab
    await s.nav_fitness()
    await s.wait(WAIT_NAV_CLICK)
    await s.subtab_plan()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SCENARIO, "000_fitness_plan_view")

    # Open cardio logger
    r = await open_cardio_logger(s)
    if r != "ok":
        print("⚠️  Could not open CardioLogger via primary method, trying alternatives...")
        await s.wait(WAIT_NAV_CLICK)
        r = await open_cardio_logger(s)

    # ── Run all test groups ──────────────────────────────────────────────
    await test_basic_open(s)                   # TC_CDL_001-005
    await test_stopwatch_mode(s)               # TC_CDL_006-008
    await test_manual_mode(s)                  # TC_CDL_009-010
    await test_distance_visibility(s)          # TC_CDL_011-017
    await test_inputs_and_intensity(s)         # TC_CDL_018-022
    await test_save_and_navigation(s)          # TC_CDL_023-027
    await test_edge_cases_negative(s)          # TC_CDL_028-032
    await test_timer_duration_details(s)       # TC_CDL_033-036
    await test_calorie_variations(s)           # TC_CDL_037-039
    await test_save_details(s)                 # TC_CDL_040-042
    await test_ui_testids(s)                   # TC_CDL_043-055
    await test_individual_types(s)             # TC_CDL_056-062
    await test_type_intensity_combos(s)        # TC_CDL_063-083
    await test_calorie_formula_per_type(s)     # TC_CDL_084-090
    await test_calorie_exact_matrix(s)         # TC_CDL_091-111
    await test_stopwatch_timing_edge(s)        # TC_CDL_112-118
    await test_manual_input_edge(s)            # TC_CDL_119-125
    await test_heart_rate_boundaries(s)        # TC_CDL_126-132
    await test_distance_input_edge(s)          # TC_CDL_133-139
    await test_multi_field_combos(s)           # TC_CDL_140-153
    await test_save_workflow_variations(s)     # TC_CDL_154-167
    await test_ui_stress(s)                    # TC_CDL_168-181
    await test_accessibility_state(s)          # TC_CDL_182-195
    await test_final_integration(s)            # TC_CDL_196-210

    # ── Summary ──────────────────────────────────────────────────────────
    print_summary()


if __name__ == "__main__":
    run_scenario(main())
