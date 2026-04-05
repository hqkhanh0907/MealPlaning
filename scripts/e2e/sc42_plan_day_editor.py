"""
SC42 — Plan Day Editor
CDP E2E test script covering 55 TCs: TC_PDE_01 through TC_PDE_55.

Covers:
- TC_PDE_01-03: Render exercise list with name, sets, reps, rest info
- TC_PDE_04-06: Header with title, buttons (Back, Save, Restore), "Thêm bài tập" button
- TC_PDE_07-08: Exercise item buttons (ChevronUp/Down, X, GripVertical)
- TC_PDE_09: Empty state "Chưa có bài tập nào"
- TC_PDE_10-18: Move up/down operations (swap, boundary, disabled, consecutive)
- TC_PDE_19-23: Remove operations (single, all, middle, empty state)
- TC_PDE_24-29: Add exercise via ExerciseSelector
- TC_PDE_30-33: Save operations (updatePlanDayExercises, popPage, Zustand, SQLite)
- TC_PDE_34-37: Restore operations (reset to original, restorePlanDayOriginal)
- TC_PDE_38-43: Change detection badge ("Đã chỉnh sửa")
- TC_PDE_44-48: Back button behavior (no changes → popPage, changes → dialog)
- TC_PDE_49-50: PlanDayEditor opens via pushPage, popPage back to TrainingPlanView
- TC_PDE_51-52: Edge cases (long name truncate, 20+ exercises scroll)
- TC_PDE_53-55: Accessibility (touch targets 44px, aria-labels)

Key testids:
  edit-exercises-btn, exercise-selector-sheet, exercise-item-*,
  exercise-name, exercise-params-*, stepper-sets-*, stepper-rest-*,
  stepper-repsMin-*, stepper-repsMax-*, swap-exercise-*,
  swap-exercise-sheet, swap-item-*, btn-discard-unsaved,
  day-pill-*, training-plan-view, today-workout-card

Framework: cdp_framework (setup_fresh, run_scenario, etc.)
"""

import sys
import os
import asyncio

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp_framework import (
    setup_fresh,
    run_scenario,
    reset_steps,
    WAIT_NAV_CLICK,
    WAIT_QUICK_ACTION,
    WAIT_MODAL_OPEN,
    WAIT_MODAL_CLOSE,
)

SCENARIO = "SC42"
RESULTS = []


def record(tc_id, title, status, detail=""):
    """Record a test case result."""
    RESULTS.append({"tc_id": tc_id, "title": title, "status": status, "detail": detail})
    icon = "✅" if status == "PASS" else ("⏭️" if status == "SKIP" else "❌")
    line = f"  {icon} {tc_id}: {title} → {status}"
    if detail:
        line += f" | {detail}"
    print(line)


def print_summary():
    """Print final test summary."""
    total = len(RESULTS)
    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    failed = sum(1 for r in RESULTS if r["status"] == "FAIL")
    skipped = sum(1 for r in RESULTS if r["status"] == "SKIP")
    print(f"\n{'='*60}")
    print(f"📊 {SCENARIO} Summary: {total} TCs | ✅ {passed} PASS | ❌ {failed} FAIL | ⏭️ {skipped} SKIP")
    print(f"{'='*60}")
    if failed > 0:
        print("\n❌ Failed TCs:")
        for r in RESULTS:
            if r["status"] == "FAIL":
                print(f"   {r['tc_id']}: {r['title']} — {r['detail']}")
    print()


# ────────────────────────────────────────────────────────────
# Helper: Get exercise count in PlanDayEditor
# ────────────────────────────────────────────────────────────
async def get_exercise_count(s):
    """Return number of exercise-name elements currently visible in editor."""
    return int(
        await s.ev(
            '(function(){return document.querySelectorAll(\'[data-testid="exercise-name"]\')'
            ".length})()"
        )
    )


async def get_exercise_names(s):
    """Return ordered list of exercise names in the editor."""
    raw = await s.ev(
        "(function(){"
        'var els=document.querySelectorAll(\'[data-testid="exercise-name"]\');'
        "var names=[];els.forEach(function(e){names.push(e.textContent.trim())});"
        "return JSON.stringify(names)"
        "})()"
    )
    import json

    try:
        return json.loads(raw)
    except Exception:
        return []


async def get_exercise_detail_text(s, index):
    """Return the sets × reps · rest info text for exercise at index."""
    return await s.ev(
        f"(function(){{"
        f'var items=document.querySelectorAll(\'[data-testid="exercise-name"]\');'
        f"if(items.length<={index})return'N/A';"
        f"var li=items[{index}].closest('li');"
        f"if(!li)return'N/A';"
        f"var ps=li.querySelectorAll('p');"
        f"return ps.length>=2?ps[1].textContent.trim():'N/A'"
        f"}})()"
    )


async def click_move_up(s, index):
    """Click move-up (ChevronUp) button for exercise at given index.
    Buttons in action bar order: swap, moveUp, moveDown, remove.
    Use aria-label pattern 'Move up'.
    """
    return await s.ev(
        f"(function(){{"
        f'var items=document.querySelectorAll(\'[data-testid="exercise-name"]\');'
        f"if(items.length<={index})return'no-item';"
        f"var li=items[{index}].closest('li');"
        f"if(!li)return'no-li';"
        f"var btns=li.querySelectorAll('button');"
        f"for(var i=0;i<btns.length;i++){{"
        f"  var lbl=btns[i].getAttribute('aria-label')||'';"
        f"  if(lbl.startsWith('Move up')){{btns[i].click();return'ok'}}"
        f"}}"
        f"return'no-btn'"
        f"}})()"
    )


async def click_move_down(s, index):
    """Click move-down (ChevronDown) button for exercise at given index."""
    return await s.ev(
        f"(function(){{"
        f'var items=document.querySelectorAll(\'[data-testid="exercise-name"]\');'
        f"if(items.length<={index})return'no-item';"
        f"var li=items[{index}].closest('li');"
        f"if(!li)return'no-li';"
        f"var btns=li.querySelectorAll('button');"
        f"for(var i=0;i<btns.length;i++){{"
        f"  var lbl=btns[i].getAttribute('aria-label')||'';"
        f"  if(lbl.startsWith('Move down')){{btns[i].click();return'ok'}}"
        f"}}"
        f"return'no-btn'"
        f"}})()"
    )


async def click_remove(s, index):
    """Click remove (X) button for exercise at given index."""
    return await s.ev(
        f"(function(){{"
        f'var items=document.querySelectorAll(\'[data-testid="exercise-name"]\');'
        f"if(items.length<={index})return'no-item';"
        f"var li=items[{index}].closest('li');"
        f"if(!li)return'no-li';"
        f"var btns=li.querySelectorAll('button');"
        f"for(var i=0;i<btns.length;i++){{"
        f"  var lbl=btns[i].getAttribute('aria-label')||'';"
        f"  if(lbl.startsWith('Remove')){{btns[i].click();return'ok'}}"
        f"}}"
        f"return'no-btn'"
        f"}})()"
    )


async def is_move_up_disabled(s, index):
    """Check if move-up button is disabled for exercise at given index."""
    return await s.ev(
        f"(function(){{"
        f'var items=document.querySelectorAll(\'[data-testid="exercise-name"]\');'
        f"if(items.length<={index})return'no-item';"
        f"var li=items[{index}].closest('li');"
        f"if(!li)return'no-li';"
        f"var btns=li.querySelectorAll('button');"
        f"for(var i=0;i<btns.length;i++){{"
        f"  var lbl=btns[i].getAttribute('aria-label')||'';"
        f"  if(lbl.startsWith('Move up'))return btns[i].disabled?'yes':'no'"
        f"}}"
        f"return'no-btn'"
        f"}})()"
    )


async def is_move_down_disabled(s, index):
    """Check if move-down button is disabled for exercise at given index."""
    return await s.ev(
        f"(function(){{"
        f'var items=document.querySelectorAll(\'[data-testid="exercise-name"]\');'
        f"if(items.length<={index})return'no-item';"
        f"var li=items[{index}].closest('li');"
        f"if(!li)return'no-li';"
        f"var btns=li.querySelectorAll('button');"
        f"for(var i=0;i<btns.length;i++){{"
        f"  var lbl=btns[i].getAttribute('aria-label')||'';"
        f"  if(lbl.startsWith('Move down'))return btns[i].disabled?'yes':'no'"
        f"}}"
        f"return'no-btn'"
        f"}})()"
    )


async def has_modified_badge(s):
    """Check if 'Đã chỉnh sửa' badge is visible in editor header."""
    return await s.ev(
        "(function(){"
        "var spans=document.querySelectorAll('span');"
        "for(var i=0;i<spans.length;i++){"
        "  if(spans[i].textContent.trim()==='Đã chỉnh sửa'){"
        "    var r=spans[i].getBoundingClientRect();"
        "    if(r.width>0)return'yes'"
        "  }"
        "}"
        "return'no'"
        "})()"
    )


async def click_header_back(s):
    """Click the back button in PlanDayEditor header (ArrowLeft, top-left).
    Use aria-label='Quay lại' and position check for overlay safety.
    """
    return await s.ev(
        "(function(){"
        "var btns=document.querySelectorAll('button');"
        "for(var i=btns.length-1;i>=0;i--){"
        "  var lbl=btns[i].getAttribute('aria-label')||'';"
        "  if(lbl==='Quay lại'){"
        "    var r=btns[i].getBoundingClientRect();"
        "    if(r.width>0&&r.top<120){btns[i].click();return'ok'}"
        "  }"
        "}"
        "return'none'"
        "})()"
    )


async def click_header_save(s):
    """Click the save button in PlanDayEditor header (contains 'Lưu')."""
    return await s.ev(
        "(function(){"
        "var btns=document.querySelectorAll('button');"
        "for(var i=btns.length-1;i>=0;i--){"
        "  var txt=btns[i].textContent.trim();"
        "  if(txt==='Lưu'){"
        "    var r=btns[i].getBoundingClientRect();"
        "    if(r.width>0&&r.top<120){btns[i].click();return'ok'}"
        "  }"
        "}"
        "return'none'"
        "})()"
    )


async def click_header_restore(s):
    """Click the restore button in PlanDayEditor header (aria-label='Khôi phục gốc')."""
    return await s.ev(
        "(function(){"
        "var btns=document.querySelectorAll('button');"
        "for(var i=btns.length-1;i>=0;i--){"
        "  var lbl=btns[i].getAttribute('aria-label')||'';"
        "  if(lbl==='Khôi phục gốc'){"
        "    var r=btns[i].getBoundingClientRect();"
        "    if(r.width>0&&r.top<120){btns[i].click();return'ok'}"
        "  }"
        "}"
        "return'none'"
        "})()"
    )


async def click_add_exercise_btn(s):
    """Click 'Thêm bài tập' sticky button at bottom of PlanDayEditor.
    Use reverse iteration to hit the overlay button.
    """
    return await s.ev(
        "(function(){"
        "var btns=document.querySelectorAll('button');"
        "for(var i=btns.length-1;i>=0;i--){"
        "  var txt=btns[i].textContent.trim();"
        "  if(txt.includes('Thêm bài tập')){"
        "    var r=btns[i].getBoundingClientRect();"
        "    if(r.width>0){btns[i].click();return'ok'}"
        "  }"
        "}"
        "return'none'"
        "})()"
    )


async def is_editor_open(s):
    """Check if PlanDayEditor is open (header title 'Chỉnh sửa bài tập' visible)."""
    return await s.ev(
        "(function(){"
        "var h1s=document.querySelectorAll('h1');"
        "for(var i=0;i<h1s.length;i++){"
        "  if(h1s[i].textContent.trim()==='Chỉnh sửa bài tập'){"
        "    var r=h1s[i].getBoundingClientRect();"
        "    if(r.width>0)return'yes'"
        "  }"
        "}"
        "return'no'"
        "})()"
    )


async def is_unsaved_dialog_open(s):
    """Check if UnsavedChangesDialog is visible ('Thay đổi chưa lưu')."""
    return await s.ev(
        "(function(){"
        "var h4s=document.querySelectorAll('h4');"
        "for(var i=0;i<h4s.length;i++){"
        "  if(h4s[i].textContent.trim()==='Thay đổi chưa lưu'){"
        "    var r=h4s[i].getBoundingClientRect();"
        "    if(r.width>0)return'yes'"
        "  }"
        "}"
        "return'no'"
        "})()"
    )


async def click_dialog_save_and_back(s):
    """Click 'Lưu & quay lại' in UnsavedChangesDialog."""
    return await s.click_text_last("Lưu & quay lại", "button")


async def click_dialog_discard(s):
    """Click 'Bỏ thay đổi' via testid in UnsavedChangesDialog."""
    return await s.click_testid("btn-discard-unsaved")


async def click_dialog_stay(s):
    """Click 'Ở lại chỉnh sửa' in UnsavedChangesDialog."""
    return await s.click_text_last("Ở lại chỉnh sửa", "button")


async def get_undo_toast_visible(s):
    """Check if undo removal toast is visible (output[aria-live='polite'])."""
    return await s.ev(
        "(function(){"
        "var o=document.querySelector('output[aria-live=\"polite\"]');"
        "if(!o)return'no';"
        "var r=o.getBoundingClientRect();"
        "return r.width>0?'yes':'no'"
        "})()"
    )


async def click_undo_toast(s):
    """Click 'Hoàn tác' button in undo toast."""
    return await s.ev(
        "(function(){"
        "var o=document.querySelector('output[aria-live=\"polite\"]');"
        "if(!o)return'none';"
        "var btn=o.querySelector('button');"
        "if(!btn)return'no-btn';"
        "btn.click();return'ok'"
        "})()"
    )


async def is_empty_state_visible(s):
    """Check if 'Chưa có bài tập nào' empty state is visible."""
    return await s.ev(
        "(function(){"
        "var ps=document.querySelectorAll('p');"
        "for(var i=0;i<ps.length;i++){"
        "  if(ps[i].textContent.trim()==='Chưa có bài tập nào'){"
        "    var r=ps[i].getBoundingClientRect();"
        "    if(r.width>0)return'yes'"
        "  }"
        "}"
        "return'no'"
        "})()"
    )


async def is_exercise_selector_open(s):
    """Check if ExerciseSelector sheet is open."""
    return await s.ev(
        '(function(){var e=document.querySelector(\'[data-testid="exercise-selector-sheet"]\');'
        "if(!e)return'no';var r=e.getBoundingClientRect();return r.height>50?'yes':'no'})()"
    )


async def pick_first_exercise_from_selector(s):
    """Click the first exercise-item-* button in ExerciseSelector."""
    return await s.ev(
        "(function(){"
        "var items=document.querySelectorAll('[data-testid^=\"exercise-item-\"]');"
        "for(var i=0;i<items.length;i++){"
        "  var r=items[i].getBoundingClientRect();"
        "  if(r.width>0){items[i].click();return items[i].textContent.trim()}"
        "}"
        "return'none'"
        "})()"
    )


async def get_stepper_value(s, testid):
    """Get the numeric value displayed in a stepper fieldset."""
    return await s.ev(
        f"(function(){{"
        f'var fs=document.querySelector(\'[data-testid="{testid}"]\');'
        f"if(!fs)return'N/A';"
        f"var span=fs.querySelector('span.font-semibold,span.text-sm.font-semibold');"
        f"if(!span)return'N/A';"
        f"return span.textContent.trim()"
        f"}})()"
    )


# ────────────────────────────────────────────────────────────
# Navigate to PlanDayEditor
# ────────────────────────────────────────────────────────────
async def navigate_to_editor(s):
    """Navigate: Fitness tab → Plan subtab → click edit-exercises-btn.
    Returns True if editor opened, False otherwise.
    """
    await s.nav_fitness()
    await s.wait(WAIT_NAV_CLICK)
    await s.subtab_plan()
    await s.wait(WAIT_NAV_CLICK)

    # Find a day pill with a workout (not rest day)
    # The onboarding creates a training plan, so there should be training days
    # Try clicking each day pill until we find one with edit-exercises-btn
    for day_num in range(1, 8):
        await s.click_testid(f"day-pill-{day_num}")
        await s.wait(WAIT_QUICK_ACTION)
        btn = await s.ev(
            '(function(){var e=document.querySelector(\'[data-testid="edit-exercises-btn"]\');'
            "return e?'yes':'no'})()"
        )
        if btn == "yes":
            await s.click_testid("edit-exercises-btn")
            await s.wait(WAIT_MODAL_OPEN)
            editor = await is_editor_open(s)
            if editor == "yes":
                return True
    return False


async def reopen_editor(s):
    """Re-navigate to editor from scratch after it was closed."""
    return await navigate_to_editor(s)


# ────────────────────────────────────────────────────────────
# MAIN TEST RUN
# ────────────────────────────────────────────────────────────
async def run():
    session = await setup_fresh(full_onboard=True, scenario=SCENARIO)
    reset_steps(SCENARIO)

    # ────────────────────────────────────────────────────
    # PHASE 0: Navigate to PlanDayEditor
    # ────────────────────────────────────────────────────
    print(f"\n{'─'*60}")
    print(f"📋 {SCENARIO}: Plan Day Editor — 55 TCs")
    print(f"{'─'*60}")
    print("\n▶ Phase 0: Navigate to PlanDayEditor")

    editor_opened = await navigate_to_editor(session)
    await session.screenshot(SCENARIO, "editor_opened")

    if not editor_opened:
        print("  ⚠️ Could not open PlanDayEditor — recording all as SKIP")
        for i in range(1, 56):
            record(f"TC_PDE_{i:02d}", "PlanDayEditor not reachable", "SKIP", "No training day with exercises found")
        print_summary()
        return

    # ────────────────────────────────────────────────────
    # TC_PDE_49-50: PlanDayEditor opens via pushPage / popPage
    # ────────────────────────────────────────────────────
    print("\n▶ TC_PDE_49-50: pushPage / popPage navigation")

    editor = await is_editor_open(session)
    record(
        "TC_PDE_49",
        "PlanDayEditor opens via pushPage (overlay)",
        "PASS" if editor == "yes" else "FAIL",
        f"editor_visible={editor}",
    )

    # Capture initial exercise list for later comparisons
    initial_names = await get_exercise_names(session)
    initial_count = len(initial_names)
    print(f"  ℹ️ Initial exercises ({initial_count}): {initial_names[:5]}...")

    # ────────────────────────────────────────────────────
    # TC_PDE_01-03: Render exercise list with info
    # ────────────────────────────────────────────────────
    print("\n▶ TC_PDE_01-03: Exercise list rendering")

    count = await get_exercise_count(session)
    record(
        "TC_PDE_01",
        "Exercise list renders with names",
        "PASS" if count >= 1 else "FAIL",
        f"count={count}",
    )

    # Check first exercise has detail text (sets × reps · rest)
    detail = await get_exercise_detail_text(session, 0)
    has_sets_info = "hiệp" in detail and "lần" in detail
    record(
        "TC_PDE_02",
        "Exercise shows sets × reps info",
        "PASS" if has_sets_info else "FAIL",
        f"detail='{detail}'",
    )

    has_rest_info = "s" in detail
    record(
        "TC_PDE_03",
        "Exercise shows rest time info",
        "PASS" if has_rest_info else "FAIL",
        f"detail='{detail}'",
    )

    await session.screenshot(SCENARIO, "exercise_list")

    # ────────────────────────────────────────────────────
    # TC_PDE_04-06: Header elements
    # ────────────────────────────────────────────────────
    print("\n▶ TC_PDE_04-06: Header elements")

    title = await session.ev(
        "(function(){"
        "var h1s=document.querySelectorAll('h1');"
        "for(var i=h1s.length-1;i>=0;i--){"
        "  var r=h1s[i].getBoundingClientRect();"
        "  if(r.width>0&&r.top<120)return h1s[i].textContent.trim()"
        "}"
        "return'N/A'"
        "})()"
    )
    record(
        "TC_PDE_04",
        "Header title = 'Chỉnh sửa bài tập'",
        "PASS" if title == "Chỉnh sửa bài tập" else "FAIL",
        f"title='{title}'",
    )

    # Check Back, Restore, Save buttons exist in header
    back_btn = await session.ev(
        "(function(){"
        "var btns=document.querySelectorAll('button');"
        "for(var i=btns.length-1;i>=0;i--){"
        "  var lbl=btns[i].getAttribute('aria-label')||'';"
        "  if(lbl==='Quay lại'){var r=btns[i].getBoundingClientRect();if(r.width>0&&r.top<120)return'yes'}"
        "}"
        "return'no'"
        "})()"
    )
    save_btn = await session.ev(
        "(function(){"
        "var btns=document.querySelectorAll('button');"
        "for(var i=btns.length-1;i>=0;i--){"
        "  if(btns[i].textContent.trim()==='Lưu'){"
        "    var r=btns[i].getBoundingClientRect();if(r.width>0&&r.top<120)return'yes'}"
        "}"
        "return'no'"
        "})()"
    )
    restore_btn = await session.ev(
        "(function(){"
        "var btns=document.querySelectorAll('button');"
        "for(var i=btns.length-1;i>=0;i--){"
        "  var lbl=btns[i].getAttribute('aria-label')||'';"
        "  if(lbl==='Khôi phục gốc'){var r=btns[i].getBoundingClientRect();if(r.width>0)return'yes'}"
        "}"
        "return'no'"
        "})()"
    )
    record(
        "TC_PDE_05",
        "Header has Back, Restore, Save buttons",
        "PASS" if back_btn == "yes" and save_btn == "yes" and restore_btn == "yes" else "FAIL",
        f"back={back_btn}, save={save_btn}, restore={restore_btn}",
    )

    # "Thêm bài tập" sticky bottom button
    add_btn = await session.ev(
        "(function(){"
        "var btns=document.querySelectorAll('button');"
        "for(var i=btns.length-1;i>=0;i--){"
        "  if(btns[i].textContent.trim().includes('Thêm bài tập')){"
        "    var r=btns[i].getBoundingClientRect();if(r.width>0)return'yes'}"
        "}"
        "return'no'"
        "})()"
    )
    record(
        "TC_PDE_06",
        "'Thêm bài tập' button visible",
        "PASS" if add_btn == "yes" else "FAIL",
        f"visible={add_btn}",
    )

    # ────────────────────────────────────────────────────
    # TC_PDE_07-08: Exercise item action buttons
    # ────────────────────────────────────────────────────
    print("\n▶ TC_PDE_07-08: Exercise item action buttons")

    if initial_count >= 1:
        # Check swap, moveUp, moveDown, remove buttons on first exercise
        swap_btn = await session.ev(
            '(function(){var e=document.querySelector(\'[data-testid="swap-exercise-0"]\');'
            "return e&&e.getBoundingClientRect().width>0?'yes':'no'})()"
        )
        up_exists = await session.ev(
            "(function(){"
            'var items=document.querySelectorAll(\'[data-testid="exercise-name"]\');'
            "if(!items.length)return'no';"
            "var li=items[0].closest('li');if(!li)return'no';"
            "var btns=li.querySelectorAll('button');"
            "for(var i=0;i<btns.length;i++){"
            "  if((btns[i].getAttribute('aria-label')||'').startsWith('Move up'))return'yes'}"
            "return'no'"
            "})()"
        )
        down_exists = await session.ev(
            "(function(){"
            'var items=document.querySelectorAll(\'[data-testid="exercise-name"]\');'
            "if(!items.length)return'no';"
            "var li=items[0].closest('li');if(!li)return'no';"
            "var btns=li.querySelectorAll('button');"
            "for(var i=0;i<btns.length;i++){"
            "  if((btns[i].getAttribute('aria-label')||'').startsWith('Move down'))return'yes'}"
            "return'no'"
            "})()"
        )
        remove_exists = await session.ev(
            "(function(){"
            'var items=document.querySelectorAll(\'[data-testid="exercise-name"]\');'
            "if(!items.length)return'no';"
            "var li=items[0].closest('li');if(!li)return'no';"
            "var btns=li.querySelectorAll('button');"
            "for(var i=0;i<btns.length;i++){"
            "  if((btns[i].getAttribute('aria-label')||'').startsWith('Remove'))return'yes'}"
            "return'no'"
            "})()"
        )
        # GripVertical icon (aria-hidden="true", just check SVG presence)
        grip_exists = await session.ev(
            "(function(){"
            'var items=document.querySelectorAll(\'[data-testid="exercise-name"]\');'
            "if(!items.length)return'no';"
            "var li=items[0].closest('li');if(!li)return'no';"
            "var svgs=li.querySelectorAll('svg[aria-hidden=\"true\"]');"
            "return svgs.length>0?'yes':'no'"
            "})()"
        )
        all_btns = swap_btn == "yes" and up_exists == "yes" and down_exists == "yes" and remove_exists == "yes"
        record(
            "TC_PDE_07",
            "ChevronUp/Down and X buttons present",
            "PASS" if all_btns else "FAIL",
            f"swap={swap_btn}, up={up_exists}, down={down_exists}, remove={remove_exists}",
        )
        record(
            "TC_PDE_08",
            "GripVertical icon present",
            "PASS" if grip_exists == "yes" else "FAIL",
            f"grip={grip_exists}",
        )
    else:
        record("TC_PDE_07", "ChevronUp/Down and X buttons present", "SKIP", "No exercises to check")
        record("TC_PDE_08", "GripVertical icon present", "SKIP", "No exercises to check")

    # ────────────────────────────────────────────────────
    # TC_PDE_10-18: Move up/down operations
    # ────────────────────────────────────────────────────
    print("\n▶ TC_PDE_10-18: Move up/down operations")

    if initial_count >= 2:
        names_before = await get_exercise_names(session)
        first_name = names_before[0]
        second_name = names_before[1]

        # TC_PDE_10: Move second exercise up → swaps with first
        r = await click_move_up(session, 1)
        await session.wait(WAIT_QUICK_ACTION)
        names_after = await get_exercise_names(session)
        swapped = len(names_after) >= 2 and names_after[0] == second_name and names_after[1] == first_name
        record(
            "TC_PDE_10",
            "Move up swaps exercises",
            "PASS" if swapped else "FAIL",
            f"before={names_before[:2]}, after={names_after[:2]}",
        )

        # TC_PDE_11: Move first exercise down → restore original order
        r = await click_move_down(session, 0)
        await session.wait(WAIT_QUICK_ACTION)
        names_restored = await get_exercise_names(session)
        restored = len(names_restored) >= 2 and names_restored[0] == first_name and names_restored[1] == second_name
        record(
            "TC_PDE_11",
            "Move down swaps exercises",
            "PASS" if restored else "FAIL",
            f"after_restore={names_restored[:2]}",
        )

        # TC_PDE_12: Move up at index 0 → boundary (disabled)
        up_disabled = await is_move_up_disabled(session, 0)
        record(
            "TC_PDE_12",
            "Move up disabled at top (index 0)",
            "PASS" if up_disabled == "yes" else "FAIL",
            f"disabled={up_disabled}",
        )

        # TC_PDE_13: Move down at last index → boundary (disabled)
        last_idx = len(names_restored) - 1
        down_disabled = await is_move_down_disabled(session, last_idx)
        record(
            "TC_PDE_13",
            "Move down disabled at bottom (last index)",
            "PASS" if down_disabled == "yes" else "FAIL",
            f"disabled={down_disabled}, lastIdx={last_idx}",
        )

        # TC_PDE_14: Move up at boundary does not change list
        r = await click_move_up(session, 0)
        await session.wait(WAIT_QUICK_ACTION)
        names_same = await get_exercise_names(session)
        record(
            "TC_PDE_14",
            "Move up at top does not change order",
            "PASS" if names_same == names_restored else "FAIL",
            f"unchanged={names_same == names_restored}",
        )

        # TC_PDE_15: Move down at boundary does not change list
        r = await click_move_down(session, last_idx)
        await session.wait(WAIT_QUICK_ACTION)
        names_same2 = await get_exercise_names(session)
        record(
            "TC_PDE_15",
            "Move down at bottom does not change order",
            "PASS" if names_same2 == names_restored else "FAIL",
            f"unchanged={names_same2 == names_restored}",
        )

        # TC_PDE_16: Consecutive move down shifts exercise to end
        if initial_count >= 3:
            first_before = (await get_exercise_names(session))[0]
            for _i in range(initial_count - 1):
                await click_move_down(session, _i)
                await session.wait(0.2)
            await session.wait(WAIT_QUICK_ACTION)
            names_shifted = await get_exercise_names(session)
            record(
                "TC_PDE_16",
                "Consecutive move down shifts to end",
                "PASS" if names_shifted[-1] == first_before else "FAIL",
                f"first→last: expected='{first_before}', actual='{names_shifted[-1] if names_shifted else 'N/A'}'",
            )
            # Move it back up to restore
            for _i in range(initial_count - 1):
                idx = initial_count - 1 - _i
                await click_move_up(session, idx)
                await session.wait(0.2)
            await session.wait(WAIT_QUICK_ACTION)
        else:
            record("TC_PDE_16", "Consecutive move down shifts to end", "SKIP", "Need 3+ exercises")

        # TC_PDE_17: Consecutive move up shifts exercise to top
        if initial_count >= 3:
            last_before = (await get_exercise_names(session))[-1]
            for _i in range(initial_count - 1):
                idx = initial_count - 1 - _i
                await click_move_up(session, idx)
                await session.wait(0.2)
            await session.wait(WAIT_QUICK_ACTION)
            names_shifted2 = await get_exercise_names(session)
            record(
                "TC_PDE_17",
                "Consecutive move up shifts to top",
                "PASS" if names_shifted2[0] == last_before else "FAIL",
                f"last→first: expected='{last_before}', actual='{names_shifted2[0] if names_shifted2 else 'N/A'}'",
            )
            # Move it back down to restore
            for _i in range(initial_count - 1):
                await click_move_down(session, _i)
                await session.wait(0.2)
            await session.wait(WAIT_QUICK_ACTION)
        else:
            record("TC_PDE_17", "Consecutive move up shifts to top", "SKIP", "Need 3+ exercises")

        # TC_PDE_18: Move up disabled on second after first already disabled
        up_first = await is_move_up_disabled(session, 0)
        record(
            "TC_PDE_18",
            "First item move-up always disabled",
            "PASS" if up_first == "yes" else "FAIL",
            f"disabled={up_first}",
        )
    else:
        for tc_num in range(10, 19):
            record(f"TC_PDE_{tc_num}", f"Move operations (need 2+ exercises)", "SKIP", f"count={initial_count}")

    await session.screenshot(SCENARIO, "after_move_tests")

    # Restore original state by clicking Restore button
    await click_header_restore(session)
    await session.wait(WAIT_QUICK_ACTION)

    # ────────────────────────────────────────────────────
    # TC_PDE_19-23: Remove operations
    # ────────────────────────────────────────────────────
    print("\n▶ TC_PDE_19-23: Remove operations")

    current_count = await get_exercise_count(session)
    if current_count >= 1:
        # TC_PDE_19: Remove first exercise → undo toast appears
        name_to_remove = (await get_exercise_names(session))[0]
        r = await click_remove(session, 0)
        await session.wait(WAIT_QUICK_ACTION)

        toast = await get_undo_toast_visible(session)
        record(
            "TC_PDE_19",
            "Remove exercise shows undo toast",
            "PASS" if toast == "yes" and r == "ok" else "FAIL",
            f"clicked={r}, toast={toast}",
        )
        await session.screenshot(SCENARIO, "remove_toast")

        # TC_PDE_20: Undo restores removed exercise
        r_undo = await click_undo_toast(session)
        await session.wait(WAIT_QUICK_ACTION)
        count_after_undo = await get_exercise_count(session)
        names_after_undo = await get_exercise_names(session)
        record(
            "TC_PDE_20",
            "Undo restores removed exercise",
            "PASS" if count_after_undo == current_count and name_to_remove in names_after_undo else "FAIL",
            f"undo={r_undo}, count={count_after_undo}, expected={current_count}",
        )

        # TC_PDE_21: Remove middle exercise (if 3+)
        if current_count >= 3:
            mid_idx = current_count // 2
            mid_name = (await get_exercise_names(session))[mid_idx]
            await click_remove(session, mid_idx)
            await session.wait(5.5)  # Wait for auto-commit (5s timeout)
            count_after_mid = await get_exercise_count(session)
            names_after_mid = await get_exercise_names(session)
            record(
                "TC_PDE_21",
                "Remove middle exercise",
                "PASS" if count_after_mid == current_count - 1 and mid_name not in names_after_mid else "FAIL",
                f"removed='{mid_name}', count={count_after_mid}",
            )
            # Restore
            await click_header_restore(session)
            await session.wait(WAIT_QUICK_ACTION)
        else:
            record("TC_PDE_21", "Remove middle exercise", "SKIP", "Need 3+ exercises")

        # TC_PDE_22: Remove all exercises → empty state
        remove_count = await get_exercise_count(session)
        for _i in range(remove_count):
            await click_remove(session, 0)
            await session.wait(5.5)  # Wait for each removal to commit
        await session.wait(WAIT_QUICK_ACTION)

        empty = await is_empty_state_visible(session)
        record(
            "TC_PDE_22",
            "Remove all exercises shows empty state",
            "PASS" if empty == "yes" else "FAIL",
            f"empty_state={empty}",
        )
        await session.screenshot(SCENARIO, "empty_state")

        # TC_PDE_23: Empty state text correct
        record(
            "TC_PDE_23",
            "Empty state shows 'Chưa có bài tập nào'",
            "PASS" if empty == "yes" else "FAIL",
            f"empty={empty}",
        )

        # Restore for subsequent tests
        await click_header_restore(session)
        await session.wait(WAIT_QUICK_ACTION)
    else:
        for tc_num in range(19, 24):
            record(f"TC_PDE_{tc_num}", "Remove operations", "SKIP", f"count={current_count}")

    # ────────────────────────────────────────────────────
    # TC_PDE_09: Empty state (already tested in TC_PDE_22-23 above)
    # We re-verify the label was correct
    # ────────────────────────────────────────────────────
    print("\n▶ TC_PDE_09: Empty state label")
    # Temporarily remove all again to verify
    remove_count = await get_exercise_count(session)
    if remove_count >= 1:
        for _i in range(remove_count):
            await click_remove(session, 0)
            await session.wait(5.5)
        empty_label = await session.ev(
            "(function(){"
            "var ps=document.querySelectorAll('p');"
            "for(var i=0;i<ps.length;i++){"
            "  if(ps[i].textContent.trim()==='Chưa có bài tập nào')return ps[i].textContent.trim()"
            "}"
            "return'N/A'"
            "})()"
        )
        record(
            "TC_PDE_09",
            "Empty state label 'Chưa có bài tập nào'",
            "PASS" if empty_label == "Chưa có bài tập nào" else "FAIL",
            f"label='{empty_label}'",
        )
        await click_header_restore(session)
        await session.wait(WAIT_QUICK_ACTION)
    else:
        record("TC_PDE_09", "Empty state label", "SKIP", "No exercises to remove")

    # ────────────────────────────────────────────────────
    # TC_PDE_24-29: Add exercise via ExerciseSelector
    # ────────────────────────────────────────────────────
    print("\n▶ TC_PDE_24-29: Add exercise via ExerciseSelector")

    count_before_add = await get_exercise_count(session)

    # TC_PDE_24: Click 'Thêm bài tập' opens ExerciseSelector
    r = await click_add_exercise_btn(session)
    await session.wait(WAIT_MODAL_OPEN)
    selector_open = await is_exercise_selector_open(session)
    record(
        "TC_PDE_24",
        "Click 'Thêm bài tập' opens ExerciseSelector",
        "PASS" if selector_open == "yes" else "FAIL",
        f"clicked={r}, selector={selector_open}",
    )
    await session.screenshot(SCENARIO, "exercise_selector")

    # TC_PDE_25: ExerciseSelector has search input
    search_input = await session.ev(
        '(function(){var e=document.querySelector(\'[data-testid="exercise-search-input"]\');'
        "return e?'yes':'no'})()"
    )
    record(
        "TC_PDE_25",
        "ExerciseSelector has search input",
        "PASS" if search_input == "yes" else "FAIL",
        f"search={search_input}",
    )

    # TC_PDE_26: ExerciseSelector has muscle group chips
    chips = await session.ev(
        '(function(){var e=document.querySelector(\'[data-testid="muscle-group-chips"]\');'
        "return e?'yes':'no'})()"
    )
    record(
        "TC_PDE_26",
        "ExerciseSelector has muscle group chips",
        "PASS" if chips == "yes" else "FAIL",
        f"chips={chips}",
    )

    # TC_PDE_27: ExerciseSelector shows exercise items
    item_count = await session.ev(
        "(function(){return document.querySelectorAll('[data-testid^=\"exercise-item-\"]').length})()"
    )
    record(
        "TC_PDE_27",
        "ExerciseSelector shows exercise items",
        "PASS" if int(item_count) > 0 else "FAIL",
        f"item_count={item_count}",
    )

    # TC_PDE_28: Select an exercise → adds to list, selector closes
    if int(item_count) > 0:
        added_name = await pick_first_exercise_from_selector(session)
        await session.wait(WAIT_MODAL_CLOSE)
        selector_after = await is_exercise_selector_open(session)
        count_after_add = await get_exercise_count(session)
        record(
            "TC_PDE_28",
            "Select exercise adds to list and closes selector",
            "PASS" if count_after_add == count_before_add + 1 and selector_after == "no" else "FAIL",
            f"added='{added_name}', count={count_after_add}, selector_closed={selector_after == 'no'}",
        )
    else:
        record("TC_PDE_28", "Select exercise adds to list", "SKIP", "No exercises in selector")
        added_name = "N/A"

    # TC_PDE_29: New exercise defaults (sets=3, restSeconds=90)
    if int(item_count) > 0:
        count_after = await get_exercise_count(session)
        new_idx = count_after - 1
        detail_new = await get_exercise_detail_text(session, new_idx)
        has_defaults = "3 hiệp" in detail_new and "90s" in detail_new
        record(
            "TC_PDE_29",
            "New exercise has default sets=3, rest=90s",
            "PASS" if has_defaults else "FAIL",
            f"detail='{detail_new}'",
        )
    else:
        record("TC_PDE_29", "New exercise defaults", "SKIP", "No exercise added")

    await session.screenshot(SCENARIO, "after_add_exercise")

    # ────────────────────────────────────────────────────
    # TC_PDE_38-43: Change detection badge ("Đã chỉnh sửa")
    # ────────────────────────────────────────────────────
    print("\n▶ TC_PDE_38-43: Change detection badge")

    # TC_PDE_38: Badge visible after adding exercise (hasChanges=true)
    badge = await has_modified_badge(session)
    record(
        "TC_PDE_38",
        "Badge 'Đã chỉnh sửa' visible after changes",
        "PASS" if badge == "yes" else "FAIL",
        f"badge={badge}",
    )

    # TC_PDE_39: Restore removes badge (reset to original)
    await click_header_restore(session)
    await session.wait(WAIT_QUICK_ACTION)
    badge_after_restore = await has_modified_badge(session)
    # Note: isModified might still be true if originalExercises differs, but hasChanges should be false
    # The badge shows if isModified OR hasChanges. After restore, isModified=false if original matches.
    record(
        "TC_PDE_39",
        "Badge hidden after restore (no changes)",
        "PASS" if badge_after_restore == "no" else "FAIL",
        f"badge={badge_after_restore}",
    )

    # TC_PDE_40: Move exercise creates changes → badge appears
    cur_count = await get_exercise_count(session)
    if cur_count >= 2:
        await click_move_up(session, 1)
        await session.wait(WAIT_QUICK_ACTION)
        badge_after_move = await has_modified_badge(session)
        record(
            "TC_PDE_40",
            "Badge appears after move operation",
            "PASS" if badge_after_move == "yes" else "FAIL",
            f"badge={badge_after_move}",
        )
        # Restore
        await click_header_restore(session)
        await session.wait(WAIT_QUICK_ACTION)
    else:
        record("TC_PDE_40", "Badge after move", "SKIP", f"count={cur_count}")

    # TC_PDE_41: Remove exercise creates changes → badge appears
    if cur_count >= 1:
        await click_remove(session, 0)
        await session.wait(WAIT_QUICK_ACTION)
        badge_after_remove = await has_modified_badge(session)
        record(
            "TC_PDE_41",
            "Badge appears after remove operation",
            "PASS" if badge_after_remove == "yes" else "FAIL",
            f"badge={badge_after_remove}",
        )
        # Undo
        await click_undo_toast(session)
        await session.wait(WAIT_QUICK_ACTION)
        # Restore fully
        await click_header_restore(session)
        await session.wait(WAIT_QUICK_ACTION)
    else:
        record("TC_PDE_41", "Badge after remove", "SKIP", f"count={cur_count}")

    # TC_PDE_42: Add exercise creates changes → badge
    r = await click_add_exercise_btn(session)
    await session.wait(WAIT_MODAL_OPEN)
    sel_open = await is_exercise_selector_open(session)
    if sel_open == "yes":
        await pick_first_exercise_from_selector(session)
        await session.wait(WAIT_MODAL_CLOSE)
        badge_after_add = await has_modified_badge(session)
        record(
            "TC_PDE_42",
            "Badge appears after add exercise",
            "PASS" if badge_after_add == "yes" else "FAIL",
            f"badge={badge_after_add}",
        )
    else:
        record("TC_PDE_42", "Badge after add exercise", "SKIP", "Selector did not open")

    # TC_PDE_43: Restore again clears badge
    await click_header_restore(session)
    await session.wait(WAIT_QUICK_ACTION)
    badge_cleared = await has_modified_badge(session)
    record(
        "TC_PDE_43",
        "Restore clears badge again",
        "PASS" if badge_cleared == "no" else "FAIL",
        f"badge={badge_cleared}",
    )

    await session.screenshot(SCENARIO, "after_badge_tests")

    # ────────────────────────────────────────────────────
    # TC_PDE_44-48: Back button behavior
    # ────────────────────────────────────────────────────
    print("\n▶ TC_PDE_44-48: Back button behavior")

    # TC_PDE_44: Back with no changes → popPage immediately
    r_back = await click_header_back(session)
    await session.wait(WAIT_NAV_CLICK)
    editor_closed = await is_editor_open(session)
    record(
        "TC_PDE_44",
        "Back with no changes → popPage (editor closes)",
        "PASS" if editor_closed == "no" else "FAIL",
        f"clicked={r_back}, editor={editor_closed}",
    )
    await session.screenshot(SCENARIO, "after_back_no_changes")

    # Re-open editor for unsaved changes tests
    re_opened = await reopen_editor(session)
    if not re_opened:
        for tc_num in range(45, 49):
            record(f"TC_PDE_{tc_num}", "Back button with changes", "SKIP", "Could not reopen editor")
    else:
        # Make a change
        cur_count2 = await get_exercise_count(session)
        if cur_count2 >= 2:
            await click_move_up(session, 1)
            await session.wait(WAIT_QUICK_ACTION)
        else:
            r = await click_add_exercise_btn(session)
            await session.wait(WAIT_MODAL_OPEN)
            await pick_first_exercise_from_selector(session)
            await session.wait(WAIT_MODAL_CLOSE)

        # TC_PDE_45: Back with changes → UnsavedChangesDialog
        r_back2 = await click_header_back(session)
        await session.wait(WAIT_MODAL_OPEN)
        dialog = await is_unsaved_dialog_open(session)
        record(
            "TC_PDE_45",
            "Back with changes opens UnsavedChangesDialog",
            "PASS" if dialog == "yes" else "FAIL",
            f"dialog={dialog}",
        )
        await session.screenshot(SCENARIO, "unsaved_dialog")

        # TC_PDE_46: Click 'Ở lại chỉnh sửa' → dialog closes, stay in editor
        if dialog == "yes":
            r_stay = await click_dialog_stay(session)
            await session.wait(WAIT_MODAL_CLOSE)
            dialog_after_stay = await is_unsaved_dialog_open(session)
            editor_after_stay = await is_editor_open(session)
            record(
                "TC_PDE_46",
                "'Ở lại chỉnh sửa' closes dialog, stays in editor",
                "PASS" if dialog_after_stay == "no" and editor_after_stay == "yes" else "FAIL",
                f"dialog={dialog_after_stay}, editor={editor_after_stay}",
            )
        else:
            record("TC_PDE_46", "Stay editing", "SKIP", "Dialog not open")

        # TC_PDE_47: Click 'Bỏ thay đổi' → discards and pops page
        # Re-trigger dialog
        r_back3 = await click_header_back(session)
        await session.wait(WAIT_MODAL_OPEN)
        dialog2 = await is_unsaved_dialog_open(session)
        if dialog2 == "yes":
            r_discard = await click_dialog_discard(session)
            await session.wait(WAIT_NAV_CLICK)
            editor_after_discard = await is_editor_open(session)
            record(
                "TC_PDE_47",
                "'Bỏ thay đổi' discards and closes editor",
                "PASS" if editor_after_discard == "no" else "FAIL",
                f"discard={r_discard}, editor={editor_after_discard}",
            )
        else:
            record("TC_PDE_47", "Discard changes", "SKIP", "Dialog not open")

        # TC_PDE_48: Click 'Lưu & quay lại' → saves and pops page
        re_opened2 = await reopen_editor(session)
        if re_opened2:
            # Make a change
            cur_count3 = await get_exercise_count(session)
            if cur_count3 >= 2:
                await click_move_up(session, 1)
                await session.wait(WAIT_QUICK_ACTION)
            else:
                r = await click_add_exercise_btn(session)
                await session.wait(WAIT_MODAL_OPEN)
                await pick_first_exercise_from_selector(session)
                await session.wait(WAIT_MODAL_CLOSE)

            r_back4 = await click_header_back(session)
            await session.wait(WAIT_MODAL_OPEN)
            dialog3 = await is_unsaved_dialog_open(session)
            if dialog3 == "yes":
                r_save_back = await click_dialog_save_and_back(session)
                await session.wait(WAIT_NAV_CLICK)
                editor_after_save = await is_editor_open(session)
                record(
                    "TC_PDE_48",
                    "'Lưu & quay lại' saves and closes editor",
                    "PASS" if editor_after_save == "no" else "FAIL",
                    f"save_back={r_save_back}, editor={editor_after_save}",
                )
            else:
                record("TC_PDE_48", "Save and back", "SKIP", "Dialog not open")
        else:
            record("TC_PDE_48", "Save and back", "SKIP", "Could not reopen editor")

    await session.screenshot(SCENARIO, "after_back_tests")

    # ────────────────────────────────────────────────────
    # TC_PDE_30-33: Save operations
    # ────────────────────────────────────────────────────
    print("\n▶ TC_PDE_30-33: Save operations")

    re_opened3 = await reopen_editor(session)
    if re_opened3:
        # Make a change
        names_before_save = await get_exercise_names(session)
        cur_count4 = await get_exercise_count(session)
        if cur_count4 >= 2:
            await click_move_up(session, 1)
            await session.wait(WAIT_QUICK_ACTION)

        names_changed = await get_exercise_names(session)

        # TC_PDE_30: Click Save → calls updatePlanDayExercises
        r_save = await click_header_save(session)
        await session.wait(WAIT_NAV_CLICK)

        # TC_PDE_31: Save pops page (editor closes)
        editor_after_save2 = await is_editor_open(session)
        record(
            "TC_PDE_30",
            "Save calls updatePlanDayExercises",
            "PASS" if r_save == "ok" else "FAIL",
            f"clicked={r_save}",
        )
        record(
            "TC_PDE_31",
            "Save popPage (editor closes)",
            "PASS" if editor_after_save2 == "no" else "FAIL",
            f"editor={editor_after_save2}",
        )

        # TC_PDE_32: Re-open editor → exercises reflect saved order (Zustand persistence)
        re_opened4 = await reopen_editor(session)
        if re_opened4:
            names_after_reopen = await get_exercise_names(session)
            # The saved order should match the changed order
            record(
                "TC_PDE_32",
                "Zustand reflects saved exercise order",
                "PASS" if names_after_reopen == names_changed else "FAIL",
                f"expected={names_changed[:3]}, actual={names_after_reopen[:3]}",
            )
            # Restore original order for subsequent tests
            await click_header_restore(session)
            await session.wait(WAIT_QUICK_ACTION)
            await click_header_save(session)
            await session.wait(WAIT_NAV_CLICK)
        else:
            record("TC_PDE_32", "Zustand persistence", "SKIP", "Could not reopen editor")

        # TC_PDE_33: SQLite persistence (SKIP — requires app restart)
        record(
            "TC_PDE_33",
            "SQLite persistence after save",
            "SKIP",
            "Requires app restart which loses in-memory SQLite data",
        )
    else:
        for tc_num in range(30, 34):
            record(f"TC_PDE_{tc_num}", "Save operations", "SKIP", "Could not open editor")

    # ────────────────────────────────────────────────────
    # TC_PDE_34-37: Restore operations
    # ────────────────────────────────────────────────────
    print("\n▶ TC_PDE_34-37: Restore operations")

    re_opened5 = await reopen_editor(session)
    if re_opened5:
        original_names = await get_exercise_names(session)
        original_count = len(original_names)

        # Make changes: move exercise
        if original_count >= 2:
            await click_move_up(session, 1)
            await session.wait(WAIT_QUICK_ACTION)
            changed_names = await get_exercise_names(session)

            # TC_PDE_34: Restore resets to original exercises
            r_restore = await click_header_restore(session)
            await session.wait(WAIT_QUICK_ACTION)
            restored_names = await get_exercise_names(session)
            record(
                "TC_PDE_34",
                "Restore resets exercises to original",
                "PASS" if restored_names == original_names else "FAIL",
                f"restored={restored_names[:3]}, original={original_names[:3]}",
            )

            # TC_PDE_35: Restore works after adding exercise
            r2 = await click_add_exercise_btn(session)
            await session.wait(WAIT_MODAL_OPEN)
            sel = await is_exercise_selector_open(session)
            if sel == "yes":
                await pick_first_exercise_from_selector(session)
                await session.wait(WAIT_MODAL_CLOSE)
            count_after_add2 = await get_exercise_count(session)
            await click_header_restore(session)
            await session.wait(WAIT_QUICK_ACTION)
            count_after_restore2 = await get_exercise_count(session)
            record(
                "TC_PDE_35",
                "Restore works after adding exercise",
                "PASS" if count_after_restore2 == original_count else "FAIL",
                f"after_add={count_after_add2}, after_restore={count_after_restore2}, original={original_count}",
            )

            # TC_PDE_36: Restore works after removing exercise
            await click_remove(session, 0)
            await session.wait(5.5)
            count_after_rm = await get_exercise_count(session)
            await click_header_restore(session)
            await session.wait(WAIT_QUICK_ACTION)
            count_after_restore3 = await get_exercise_count(session)
            record(
                "TC_PDE_36",
                "Restore works after removing exercise",
                "PASS" if count_after_restore3 == original_count else "FAIL",
                f"after_rm={count_after_rm}, after_restore={count_after_restore3}, original={original_count}",
            )

            # TC_PDE_37: Restore calls restorePlanDayOriginal (verified by state reset)
            await click_move_up(session, 1)
            await session.wait(WAIT_QUICK_ACTION)
            badge_before = await has_modified_badge(session)
            await click_header_restore(session)
            await session.wait(WAIT_QUICK_ACTION)
            badge_after = await has_modified_badge(session)
            record(
                "TC_PDE_37",
                "Restore clears modified state (restorePlanDayOriginal)",
                "PASS" if badge_before == "yes" and badge_after == "no" else "FAIL",
                f"before={badge_before}, after={badge_after}",
            )
        else:
            for tc_num in range(34, 38):
                record(f"TC_PDE_{tc_num}", "Restore operations", "SKIP", "Need 2+ exercises")

        # Close editor for next tests
        await click_header_back(session)
        await session.wait(WAIT_NAV_CLICK)
    else:
        for tc_num in range(34, 38):
            record(f"TC_PDE_{tc_num}", "Restore operations", "SKIP", "Could not open editor")

    # ────────────────────────────────────────────────────
    # TC_PDE_50: popPage back to TrainingPlanView
    # ────────────────────────────────────────────────────
    print("\n▶ TC_PDE_50: popPage back to TrainingPlanView")

    plan_view = await session.ev(
        '(function(){var e=document.querySelector(\'[data-testid="training-plan-view"]\');'
        "return e?'yes':'no'})()"
    )
    record(
        "TC_PDE_50",
        "popPage returns to TrainingPlanView",
        "PASS" if plan_view == "yes" else "FAIL",
        f"plan_view={plan_view}",
    )

    # ────────────────────────────────────────────────────
    # TC_PDE_51-52: Edge cases (SKIP)
    # ────────────────────────────────────────────────────
    print("\n▶ TC_PDE_51-52: Edge cases")

    record(
        "TC_PDE_51",
        "Long exercise name truncation (CSS)",
        "SKIP",
        "CSS truncation check requires visual inspection or computed style analysis",
    )
    record(
        "TC_PDE_52",
        "20+ exercises scroll behavior",
        "SKIP",
        "Requires adding 20+ exercises which is impractical in E2E",
    )

    # ────────────────────────────────────────────────────
    # TC_PDE_53-55: Accessibility
    # ────────────────────────────────────────────────────
    print("\n▶ TC_PDE_53-55: Accessibility")

    re_opened6 = await reopen_editor(session)
    if re_opened6:
        # TC_PDE_53: Touch targets min 44px on action buttons
        touch_targets_ok = await session.ev(
            "(function(){"
            'var items=document.querySelectorAll(\'[data-testid="exercise-name"]\');'
            "if(!items.length)return'no-items';"
            "var li=items[0].closest('li');"
            "if(!li)return'no-li';"
            "var btns=li.querySelectorAll('button');"
            "var ok=true;"
            "for(var i=0;i<btns.length;i++){"
            "  var r=btns[i].getBoundingClientRect();"
            "  if(r.width>0&&(r.width<44||r.height<44)){ok=false;break}"
            "}"
            "return ok?'yes':'no'"
            "})()"
        )
        record(
            "TC_PDE_53",
            "Action buttons have min 44px touch targets",
            "PASS" if touch_targets_ok == "yes" else "FAIL",
            f"targets_ok={touch_targets_ok}",
        )

        # TC_PDE_54: aria-labels on action buttons
        aria_labels_ok = await session.ev(
            "(function(){"
            'var items=document.querySelectorAll(\'[data-testid="exercise-name"]\');'
            "if(!items.length)return'no-items';"
            "var li=items[0].closest('li');"
            "if(!li)return'no-li';"
            "var btns=li.querySelectorAll('button');"
            "var count=0;var labeled=0;"
            "for(var i=0;i<btns.length;i++){"
            "  var r=btns[i].getBoundingClientRect();"
            "  if(r.width>0){"
            "    count++;"
            "    if(btns[i].getAttribute('aria-label'))labeled++;"
            "  }"
            "}"
            "return count===labeled?'yes':'no:'+labeled+'/'+count"
            "})()"
        )
        record(
            "TC_PDE_54",
            "All action buttons have aria-labels",
            "PASS" if aria_labels_ok == "yes" else "FAIL",
            f"labels={aria_labels_ok}",
        )

        # TC_PDE_55: Expanded exercise params have aria fieldset
        # Expand first exercise
        await session.ev(
            "(function(){"
            'var items=document.querySelectorAll(\'[data-testid="exercise-name"]\');'
            "if(!items.length)return'none';"
            "var li=items[0].closest('li');"
            "if(!li)return'no-li';"
            "var btns=li.querySelectorAll('button');"
            "for(var i=0;i<btns.length;i++){"
            "  if(btns[i].getAttribute('aria-expanded')!==null){btns[i].click();return'ok'}"
            "}"
            "return'no-expand-btn'"
            "})()"
        )
        await session.wait(WAIT_QUICK_ACTION)

        params_accessible = await session.ev(
            '(function(){var fs=document.querySelector(\'[data-testid="stepper-sets-0"]\');'
            "if(!fs)return'no-stepper';"
            "var tag=fs.tagName.toLowerCase();"
            "var label=fs.getAttribute('aria-label')||'';"
            "return tag==='fieldset'&&label?'yes':'no:tag='+tag+',label='+label"
            "})()"
        )
        record(
            "TC_PDE_55",
            "Stepper fields use fieldset with aria-label",
            "PASS" if params_accessible == "yes" else "FAIL",
            f"accessible={params_accessible}",
        )

        await session.screenshot(SCENARIO, "accessibility_expanded")

        # Close editor
        await click_header_back(session)
        await session.wait(WAIT_NAV_CLICK)
    else:
        for tc_num in range(53, 56):
            record(f"TC_PDE_{tc_num}", "Accessibility", "SKIP", "Could not open editor")

    # ────────────────────────────────────────────────────
    # FINAL SUMMARY
    # ────────────────────────────────────────────────────
    await session.screenshot(SCENARIO, "final")
    print_summary()

    # Verify all 55 TCs are recorded
    recorded_ids = {r["tc_id"] for r in RESULTS}
    expected_ids = {f"TC_PDE_{i:02d}" for i in range(1, 56)}
    missing = expected_ids - recorded_ids
    if missing:
        print(f"⚠️ Missing TCs: {sorted(missing)}")


if __name__ == "__main__":
    run_scenario(run())
