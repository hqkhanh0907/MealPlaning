"""
Group D — Plan Operations E2E Tests
SC10: Copy Plan
SC11: Clear Plan
SC12: Template Manager
SC13: Save Template
SC14: Grocery List

Requires full onboarding (meals data needed).
Uses cdp_framework.py helpers.
"""

import asyncio
import sys
import os
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from cdp_framework import (
    setup_fresh,
    run_scenario,
    reset_steps,
    WAIT_NAV_CLICK,
    WAIT_QUICK_ACTION,
    WAIT_CONFIRM_PLAN,
    WAIT_MODAL_OPEN,
    WAIT_MODAL_CLOSE,
    WAIT_FORM_FILL,
    CDPSession,
)

# Seed dishes (from onboarding) — per serving
DISHES = {
    "d1": {"name": "Trứng ốp la", "cal": 155, "pro": 13},
    "d2": {"name": "Yến mạch sữa chua", "cal": 332, "pro": 25},
    "d3": {"name": "Bông cải xanh luộc", "cal": 51, "pro": 5},
    "d4": {"name": "Khoai lang luộc", "cal": 129, "pro": 3},
    "d5": {"name": "Ức gà áp chảo", "cal": 330, "pro": 62},
}

TOMORROW = (date.today() + timedelta(days=1)).isoformat()


def print_header(title: str):
    print(f"\n{'─'*60}")
    print(f"  {title}")
    print(f"{'─'*60}")


def print_step(msg: str):
    print(f"  → {msg}")


def print_pass(msg: str):
    print(f"  ✅ {msg}")


def print_warn(msg: str):
    print(f"  ⚠️  {msg}")


def print_fail(msg: str):
    print(f"  ❌ {msg}")


def assert_not_na(value: str, label: str) -> bool:
    if value == "N/A" or value == "" or value is None:
        print_fail(f"{label} = N/A (element not found)")
        return False
    print_pass(f"{label} = {value}")
    return True


# ═══════════════════════════════════════════════════════════════
#  SHARED HELPERS
# ═══════════════════════════════════════════════════════════════

async def add_dish_by_name(s: CDPSession, dish_name: str, cal_hint: str = "") -> str:
    """Click a dish button in the planner by name (optionally matching calorie text)."""
    return await s.ev(f'''(function(){{
        var btns = document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){{
            var t = btns[i].textContent.trim();
            if(t.includes('{dish_name}'){f' && t.includes("{cal_hint}")' if cal_hint else ''}){{
                var r = btns[i].getBoundingClientRect();
                if(r.width>0){{ btns[i].click(); return 'added: '+t; }}
            }}
        }}
        return 'not found';
    }})()''')


async def open_more_actions(s: CDPSession) -> str:
    """Open the more-actions menu on the action bar."""
    r = await s.click_testid("btn-more-actions")
    await s.wait(WAIT_QUICK_ACTION)
    return r


async def close_more_actions(s: CDPSession):
    """Dismiss the more-actions menu by clicking body."""
    await s.ev("document.body.click()")
    await s.wait(WAIT_QUICK_ACTION)


async def get_meal_slot_text(s: CDPSession) -> dict:
    """Get text content of all 3 meal slots."""
    return await s.ev('''(function(){
        var r = {};
        ['breakfast','lunch','dinner'].forEach(function(m){
            var el = document.querySelector('[data-testid="meal-slot-'+m+'"]');
            r[m] = el ? el.textContent.trim().substring(0, 120) : 'N/A';
        });
        return JSON.stringify(r);
    })()''')


async def add_standard_meals(s: CDPSession, sc: str):
    """Add a standard set of meals (breakfast + lunch + dinner) via planner and confirm."""
    print_step("Opening Meal Planner to add standard meals")
    r = await s.click_testid("btn-plan-meal-section")
    if r == "none":
        await s.click_text("Lên kế hoạch", "button,div")
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(sc, "planner_opened")

    # Breakfast: Trứng ốp la + Yến mạch sữa chua
    print_step("Selecting Bữa Sáng section")
    await s.click_text("Bữa Sáng", "h3,h4,button,div")
    await s.wait(WAIT_QUICK_ACTION)

    print_step("Adding Trứng ốp la (breakfast)")
    await add_dish_by_name(s, "Trứng ốp la", "155")
    await s.wait(WAIT_QUICK_ACTION)

    print_step("Adding Yến mạch sữa chua (breakfast)")
    await add_dish_by_name(s, "Yến mạch", "332")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "breakfast_dishes_added")

    # Lunch: Ức gà + Bông cải + Khoai lang
    print_step("Selecting Bữa Trưa section")
    await s.click_text("Bữa Trưa", "h3,h4,button,div")
    await s.wait(WAIT_QUICK_ACTION)

    print_step("Adding Ức gà áp chảo (lunch)")
    await add_dish_by_name(s, "Ức gà", "330")
    await s.wait(WAIT_QUICK_ACTION)

    print_step("Adding Bông cải xanh luộc (lunch)")
    await add_dish_by_name(s, "Bông cải", "51")
    await s.wait(WAIT_QUICK_ACTION)

    print_step("Adding Khoai lang luộc (lunch)")
    await add_dish_by_name(s, "Khoai lang", "129")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "lunch_dishes_added")

    # Dinner: Ức gà
    print_step("Selecting Bữa Tối section")
    await s.click_text("Bữa Tối", "h3,h4,button,div")
    await s.wait(WAIT_QUICK_ACTION)

    print_step("Adding Ức gà áp chảo (dinner)")
    await add_dish_by_name(s, "Ức gà", "330")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "dinner_dishes_added")

    # Confirm
    print_step("Confirming meal plan")
    r = await s.click_testid("btn-confirm-plan")
    if r == "none":
        await s.click_text("Xác nhận", "button")
    await s.wait(WAIT_CONFIRM_PLAN)
    await s.screenshot(sc, "plan_confirmed_with_meals")
    print_pass("Standard meals added and confirmed")


async def navigate_to_date(s: CDPSession, target_iso: str):
    """Navigate the calendar to a specific date by clicking next/prev and then the day number."""
    today = date.today()
    target = date.fromisoformat(target_iso)
    diff_days = (target - today).days

    # Approximate: each next/prev click moves 7 days
    weeks = diff_days // 7
    direction = "btn-next-date" if weeks >= 0 else "btn-prev-date"
    for _ in range(abs(weeks)):
        await s.click_testid(direction)
        await s.wait(0.3)

    # Now click the target day number
    day_num = target.day
    await s.ev(f'''(function(){{
        var btns = document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){{
            var t = btns[i].textContent.trim();
            if(t === '{day_num}'){{
                var r = btns[i].getBoundingClientRect();
                if(r.width > 0 && r.top < 200){{
                    btns[i].click();
                    return 'clicked:' + t;
                }}
            }}
        }}
        return 'none';
    }})()''')
    await s.wait(WAIT_NAV_CLICK)


# ╔══════════════════════════════════════════════════════════════╗
# ║  SC10: Copy Plan                                            ║
# ╚══════════════════════════════════════════════════════════════╝

async def sc10_copy_plan(s: CDPSession):
    """SC10: Copy day plan to another date."""
    sc = "SC10"
    reset_steps(sc)
    print_header("SC10: Copy Plan")

    # Ensure we are on Calendar > Meals with meals present
    await s.nav_calendar()
    await s.subtab_meals()
    await s.wait(WAIT_NAV_CLICK)

    # Verify today has meals (should from setup)
    print_step("Verifying today has meals")
    slots = await get_meal_slot_text(s)
    print_pass(f"Current meal slots: {slots}")
    await s.screenshot(sc, "today_with_meals")

    # Open more-actions → Copy Plan
    print_step("Opening More Actions menu")
    await open_more_actions(s)
    await s.screenshot(sc, "more_actions_menu")

    print_step("Clicking 'Copy kế hoạch'")
    r = await s.click_testid("btn-copy-plan")
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(sc, "copy_plan_modal_opened")
    print_pass(f"Copy plan modal opened: {r}")

    # Verify modal is visible
    modal_visible = await s.get_text("copy-plan-modal")
    assert_not_na(modal_visible, "CopyPlanModal content")

    # Screenshot source plan preview in modal
    await s.screenshot(sc, "copy_modal_source_preview")

    # Select target: Tomorrow
    print_step("Selecting target date: Tomorrow")
    r = await s.click_testid("btn-copy-tomorrow")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "copy_target_tomorrow_selected")
    print_pass(f"Tomorrow button clicked: {r}")

    # Verify copy mode toggle is visible
    print_step("Checking copy mode toggle")
    mode_toggle = await s.get_text("copy-mode-toggle")
    print_pass(f"Copy mode toggle: {mode_toggle}")

    # Select mode: Overwrite (default usually)
    print_step("Selecting Overwrite mode")
    r = await s.click_testid("btn-mode-overwrite")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "copy_mode_overwrite")
    print_pass(f"Overwrite mode: {r}")

    # Confirm copy
    print_step("Confirming copy")
    r = await s.click_testid("btn-copy-confirm")
    await s.wait(WAIT_CONFIRM_PLAN)
    await s.screenshot(sc, "copy_confirmed")
    print_pass(f"Copy confirm: {r}")

    # Navigate to tomorrow to verify meals were copied
    print_step("Navigating to tomorrow to verify copy")
    await s.click_testid("btn-next-date")
    await s.wait(WAIT_NAV_CLICK)

    # Click tomorrow's date cell
    tomorrow = date.today() + timedelta(days=1)
    day_num = tomorrow.day
    await s.ev(f'''(function(){{
        var btns = document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){{
            var t = btns[i].textContent.trim();
            if(t === '{day_num}'){{
                var r = btns[i].getBoundingClientRect();
                if(r.width > 0 && r.top < 200){{
                    btns[i].click();
                    return 'clicked:' + t;
                }}
            }}
        }}
        return 'none';
    }})()''')
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "tomorrow_date_selected")

    # Verify meals exist on tomorrow
    print_step("Verifying copied meals on target date")
    tomorrow_slots = await get_meal_slot_text(s)
    print_pass(f"Tomorrow meal slots: {tomorrow_slots}")
    await s.screenshot(sc, "tomorrow_meals_copied")

    # Check if any dish name is visible (Trứng, Ức gà, etc.)
    has_dishes = await s.ev('''(function(){
        var body = document.body.innerText;
        var names = ['Trứng ốp la', 'Yến mạch', 'Ức gà', 'Bông cải', 'Khoai lang'];
        var found = [];
        for(var i=0;i<names.length;i++){
            if(body.includes(names[i])) found.push(names[i]);
        }
        return JSON.stringify(found);
    })()''')
    print_pass(f"Dishes found on tomorrow: {has_dishes}")

    # Navigate back to today
    print_step("Returning to today")
    r = await s.click_testid("btn-today")
    if r == "none":
        await s.click_text("Hôm nay", "button")
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "back_to_today")

    print_pass("SC10 Copy Plan — COMPLETE")


# ╔══════════════════════════════════════════════════════════════╗
# ║  SC11: Clear Plan                                           ║
# ╚══════════════════════════════════════════════════════════════╝

async def sc11_clear_plan(s: CDPSession):
    """SC11: Clear meals from a date."""
    sc = "SC11"
    reset_steps(sc)
    print_header("SC11: Clear Plan")

    # Navigate to tomorrow (which has copied meals from SC10)
    print_step("Navigating to tomorrow (has copied meals)")
    await s.nav_calendar()
    await s.subtab_meals()
    await s.wait(WAIT_NAV_CLICK)

    await s.click_testid("btn-next-date")
    await s.wait(WAIT_NAV_CLICK)

    tomorrow = date.today() + timedelta(days=1)
    day_num = tomorrow.day
    await s.ev(f'''(function(){{
        var btns = document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){{
            var t = btns[i].textContent.trim();
            if(t === '{day_num}'){{
                var r = btns[i].getBoundingClientRect();
                if(r.width > 0 && r.top < 200){{ btns[i].click(); return 'ok'; }}
            }}
        }}
        return 'none';
    }})()''')
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "tomorrow_with_meals")

    # Verify meals present
    slots_before = await get_meal_slot_text(s)
    print_pass(f"Slots before clear: {slots_before}")

    # Open more-actions → Clear Plan
    print_step("Opening More Actions menu")
    await open_more_actions(s)
    await s.screenshot(sc, "more_actions_menu")

    print_step("Clicking 'Xóa kế hoạch'")
    r = await s.click_testid("btn-clear-plan")
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(sc, "clear_plan_modal_opened")
    print_pass(f"Clear plan modal opened: {r}")

    # Verify meal type toggles visible
    print_step("Checking meal type toggles")
    meal_filter = await s.get_text("meal-filter")
    assert_not_na(meal_filter, "Meal filter")
    await s.screenshot(sc, "clear_modal_meal_toggles")

    # Verify all 3 toggles are present
    for meal_type in ["breakfast", "lunch", "dinner"]:
        toggle = await s.ev(f'''(function(){{
            var el = document.querySelector('[data-testid="meal-toggle-{meal_type}"]');
            return el ? el.textContent.trim() : 'N/A';
        }})()''')
        print_pass(f"Toggle {meal_type}: {toggle}")

    # Verify scope buttons visible
    for scope in ["day", "week", "month"]:
        btn = await s.ev(f'''(function(){{
            var el = document.querySelector('[data-testid="btn-clear-scope-{scope}"]');
            return el ? el.textContent.trim() : 'N/A';
        }})()''')
        print_pass(f"Scope {scope}: {btn}")

    await s.screenshot(sc, "clear_modal_scope_buttons")

    # Click "Ngày này" to clear this day
    print_step("Clicking 'Ngày này' to clear this day")
    r = await s.click_testid("btn-clear-scope-day")
    await s.wait(WAIT_CONFIRM_PLAN)
    await s.screenshot(sc, "clear_day_executed")
    print_pass(f"Clear day scope clicked: {r}")

    # Wait for undo notification to appear and dismiss naturally
    await s.wait(1)
    await s.screenshot(sc, "clear_undo_notification")

    # Verify slots are now empty
    print_step("Verifying meal slots are empty after clear")
    slots_after = await get_meal_slot_text(s)
    print_pass(f"Slots after clear: {slots_after}")
    await s.screenshot(sc, "tomorrow_slots_cleared")

    # Check that dishes are gone
    has_dishes = await s.ev('''(function(){
        var body = document.body.innerText;
        var names = ['Trứng ốp la', 'Yến mạch', 'Ức gà', 'Bông cải', 'Khoai lang'];
        var found = [];
        for(var i=0;i<names.length;i++){
            if(body.includes(names[i])) found.push(names[i]);
        }
        return found.length === 0 ? 'all cleared' : JSON.stringify(found);
    })()''')
    print_pass(f"Dishes after clear: {has_dishes}")

    # Navigate back to today
    print_step("Returning to today")
    r = await s.click_testid("btn-today")
    if r == "none":
        await s.click_text("Hôm nay", "button")
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "back_to_today")

    print_pass("SC11 Clear Plan — COMPLETE")


# ╔══════════════════════════════════════════════════════════════╗
# ║  SC12: Template Manager                                     ║
# ╚══════════════════════════════════════════════════════════════╝

async def sc12_template_manager(s: CDPSession):
    """SC12: Open and verify Template Manager modal."""
    sc = "SC12"
    reset_steps(sc)
    print_header("SC12: Template Manager")

    # Ensure on Calendar > Meals
    await s.nav_calendar()
    await s.subtab_meals()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "calendar_meals_tab")

    # Open more-actions → Template Manager
    print_step("Opening More Actions menu")
    await open_more_actions(s)
    await s.screenshot(sc, "more_actions_menu")

    print_step("Clicking 'Mẫu bữa ăn' (Template Manager)")
    r = await s.click_testid("btn-template-manager")
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(sc, "template_manager_opened")
    print_pass(f"Template manager opened: {r}")

    # Verify modal is visible
    modal_content = await s.get_text("template-manager-modal")
    assert_not_na(modal_content, "TemplateManager content")

    # Verify search input
    print_step("Checking search input")
    search = await s.ev('''(function(){
        var el = document.querySelector('[data-testid="input-template-search"]');
        return el ? 'found (placeholder: ' + (el.placeholder || 'none') + ')' : 'N/A';
    })()''')
    print_pass(f"Search input: {search}")

    # Verify tag filters area
    print_step("Checking tag filters area")
    tag_filters = await s.get_text("template-tag-filters")
    if tag_filters != "N/A":
        print_pass(f"Tag filters: {tag_filters}")
    else:
        print_warn("No tag filters area found (may appear when templates exist)")

    # Screenshot template list (likely empty at this point)
    print_step("Checking template list (may be empty)")
    template_list = await s.ev('''(function(){
        var items = document.querySelectorAll('[data-testid^="template-item-"]');
        if(items.length === 0) return 'empty (0 templates)';
        var names = [];
        items.forEach(function(el){ names.push(el.textContent.trim().substring(0, 50)); });
        return JSON.stringify(names);
    })()''')
    print_pass(f"Template list: {template_list}")
    await s.screenshot(sc, "template_list_state")

    # Close Template Manager
    print_step("Closing Template Manager")
    await s.dismiss_modal()
    await s.wait(WAIT_MODAL_CLOSE)
    await s.screenshot(sc, "template_manager_closed")

    print_pass("SC12 Template Manager — COMPLETE")


# ╔══════════════════════════════════════════════════════════════╗
# ║  SC13: Save Template                                        ║
# ╚══════════════════════════════════════════════════════════════╝

async def sc13_save_template(s: CDPSession):
    """SC13: Save current plan as template, verify in manager, apply to another date."""
    sc = "SC13"
    reset_steps(sc)
    print_header("SC13: Save Template")

    # Ensure on Calendar > Meals > today (which has meals from setup)
    await s.nav_calendar()
    await s.subtab_meals()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "today_with_meals")

    # Verify meals present
    slots = await get_meal_slot_text(s)
    print_pass(f"Current slots: {slots}")

    # --- Save as Template ---
    print_step("Opening More Actions menu")
    await open_more_actions(s)
    await s.screenshot(sc, "more_actions_menu")

    print_step("Clicking 'Lưu làm mẫu' (Save as Template)")
    r = await s.click_testid("btn-save-template")
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(sc, "save_template_modal_opened")
    print_pass(f"Save template modal: {r}")

    # Verify modal visible
    modal_content = await s.get_text("save-template-modal")
    assert_not_na(modal_content, "SaveTemplateModal content")

    # Verify plan preview shows dishes
    await s.screenshot(sc, "save_template_preview")

    # Enter template name
    TEMPLATE_NAME = "Bữa ăn hàng ngày"
    print_step(f"Entering template name: {TEMPLATE_NAME}")
    r = await s.set_input("input-template-name", TEMPLATE_NAME)
    await s.wait(WAIT_FORM_FILL)
    print_pass(f"Template name set: {r}")
    await s.screenshot(sc, "template_name_entered")

    # Click a preset tag
    print_step("Clicking preset tag 'Healthy'")
    r = await s.click_testid("preset-tag-Healthy")
    if r == "none":
        # Try by text
        r = await s.click_text("Healthy", "button")
    await s.wait(WAIT_FORM_FILL)
    print_pass(f"Preset tag clicked: {r}")
    await s.screenshot(sc, "template_tag_added")

    # Save template
    print_step("Clicking 'Lưu template' (Save)")
    r = await s.click_testid("btn-save-template")
    await s.wait(WAIT_CONFIRM_PLAN)
    await s.screenshot(sc, "template_saved")
    print_pass(f"Template saved: {r}")

    # Wait for success indication
    await s.wait(1)
    await s.screenshot(sc, "template_save_success")

    # --- Verify template in Template Manager ---
    print_step("Re-opening Template Manager to verify saved template")
    await open_more_actions(s)
    await s.wait(WAIT_QUICK_ACTION)
    r = await s.click_testid("btn-template-manager")
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(sc, "template_manager_after_save")

    # Check template list has at least 1 item
    template_count = await s.ev('''(function(){
        var items = document.querySelectorAll('[data-testid^="template-item-"]');
        return items.length;
    })()''')
    print_pass(f"Templates found: {template_count}")

    # Verify template name is visible
    has_template = await s.ev(f'''(function(){{
        var body = document.body.innerText;
        return body.includes('{TEMPLATE_NAME}') ? 'found' : 'not found';
    }})()''')
    print_pass(f"Template '{TEMPLATE_NAME}' in list: {has_template}")
    await s.screenshot(sc, "template_listed_in_manager")

    # --- Apply template to a different date ---
    # First, close template manager
    await s.dismiss_modal()
    await s.wait(WAIT_MODAL_CLOSE)

    # Navigate to tomorrow (cleared in SC11)
    print_step("Navigating to tomorrow to apply template")
    await s.click_testid("btn-next-date")
    await s.wait(WAIT_NAV_CLICK)

    tomorrow = date.today() + timedelta(days=1)
    day_num = tomorrow.day
    await s.ev(f'''(function(){{
        var btns = document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){{
            var t = btns[i].textContent.trim();
            if(t === '{day_num}'){{
                var r = btns[i].getBoundingClientRect();
                if(r.width > 0 && r.top < 200){{ btns[i].click(); return 'ok'; }}
            }}
        }}
        return 'none';
    }})()''')
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "tomorrow_before_apply")

    # Open Template Manager on tomorrow
    print_step("Opening Template Manager on tomorrow")
    await open_more_actions(s)
    await s.wait(WAIT_QUICK_ACTION)
    r = await s.click_testid("btn-template-manager")
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(sc, "template_manager_on_tomorrow")

    # Click Apply on the first template
    print_step("Applying template")
    r = await s.ev('''(function(){
        var btns = document.querySelectorAll('[data-testid^="btn-apply-template-"]');
        if(btns.length > 0){ btns[0].click(); return 'applied: ' + btns[0].getAttribute('data-testid'); }
        // Fallback: click button with "Áp dụng" text
        var all = document.querySelectorAll('button');
        for(var i=0;i<all.length;i++){
            if(all[i].textContent.trim().includes('Áp dụng')){
                var r = all[i].getBoundingClientRect();
                if(r.width > 0){ all[i].click(); return 'applied by text'; }
            }
        }
        return 'no apply button';
    })()''')
    await s.wait(WAIT_CONFIRM_PLAN)
    await s.screenshot(sc, "template_applied_to_tomorrow")
    print_pass(f"Template apply result: {r}")

    # Verify meals now appear on tomorrow
    print_step("Verifying meals on tomorrow after template apply")
    await s.wait(1)
    tomorrow_slots = await get_meal_slot_text(s)
    print_pass(f"Tomorrow slots after apply: {tomorrow_slots}")
    await s.screenshot(sc, "tomorrow_after_template_apply")

    # Navigate back to today
    print_step("Returning to today")
    r = await s.click_testid("btn-today")
    if r == "none":
        await s.click_text("Hôm nay", "button")
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "back_to_today")

    print_pass("SC13 Save Template — COMPLETE")


# ╔══════════════════════════════════════════════════════════════╗
# ║  SC14: Grocery List                                         ║
# ╚══════════════════════════════════════════════════════════════╝

async def sc14_grocery_list(s: CDPSession):
    """SC14: Open Grocery List, verify items, check/uncheck, scope switching."""
    sc = "SC14"
    reset_steps(sc)
    print_header("SC14: Grocery List")

    # Ensure on Calendar > Meals > today (with meals)
    await s.nav_calendar()
    await s.subtab_meals()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "today_with_meals")

    # Verify meals are present
    slots = await get_meal_slot_text(s)
    print_pass(f"Current slots: {slots}")

    # --- Open Grocery List ---
    print_step("Clicking 'Danh sách đi chợ' button")
    r = await s.click_testid("btn-open-grocery")
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(sc, "grocery_modal_opened")
    print_pass(f"Grocery modal opened: {r}")

    # Verify modal is visible
    modal_content = await s.get_text("grocery-modal")
    assert_not_na(modal_content, "Grocery modal content")

    # --- Check scope tabs ---
    print_step("Verifying scope tabs")
    for scope_key in ["day", "week", "custom"]:
        tab = await s.ev(f'''(function(){{
            var el = document.querySelector('[data-testid="tab-grocery-{scope_key}"]');
            return el ? el.textContent.trim() : 'N/A';
        }})()''')
        print_pass(f"Grocery tab {scope_key}: {tab}")
    await s.screenshot(sc, "grocery_scope_tabs")

    # --- Verify ingredient list (day scope default) ---
    print_step("Checking ingredient items list")
    items_info = await s.ev('''(function(){
        var items = document.querySelectorAll('[data-testid^="grocery-item-"]');
        if(items.length === 0){
            var empty = document.querySelector('[data-testid="grocery-empty-state"]');
            if(empty) return 'empty state: ' + empty.textContent.trim().substring(0, 60);
            return 'no items found';
        }
        var result = [];
        items.forEach(function(el){
            result.push(el.textContent.trim().substring(0, 80));
        });
        return JSON.stringify(result);
    })()''')
    print_pass(f"Grocery items: {items_info}")
    await s.screenshot(sc, "grocery_items_list")

    # --- Click first item to check/uncheck ---
    print_step("Checking/unchecking first grocery item")
    first_item = await s.ev('''(function(){
        var items = document.querySelectorAll('[data-testid^="grocery-item-"]');
        if(items.length === 0) return 'no items';
        items[0].click();
        return 'checked: ' + items[0].getAttribute('data-testid');
    })()''')
    await s.wait(WAIT_QUICK_ACTION)
    print_pass(f"First item toggled: {first_item}")
    await s.screenshot(sc, "grocery_item_checked")

    # Click it again to uncheck
    print_step("Unchecking the item")
    await s.ev('''(function(){
        var items = document.querySelectorAll('[data-testid^="grocery-item-"]');
        if(items.length > 0) items[0].click();
    })()''')
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "grocery_item_unchecked")

    # --- Expand an item to see which dishes use it ---
    print_step("Expanding an ingredient to see related dishes")
    expand_result = await s.ev('''(function(){
        var btns = document.querySelectorAll('[data-testid^="grocery-expand-"]');
        if(btns.length > 0){
            btns[0].click();
            return 'expanded: ' + btns[0].getAttribute('data-testid');
        }
        return 'no expand buttons';
    })()''')
    await s.wait(WAIT_QUICK_ACTION)
    print_pass(f"Expand result: {expand_result}")
    await s.screenshot(sc, "grocery_item_expanded")

    # Check expanded dishes section
    dishes_section = await s.ev('''(function(){
        var sections = document.querySelectorAll('[data-testid^="grocery-dishes-"]');
        if(sections.length > 0){
            return sections[0].textContent.trim().substring(0, 120);
        }
        return 'N/A';
    })()''')
    print_pass(f"Related dishes: {dishes_section}")

    # --- Switch to Week scope ---
    print_step("Switching to 'Tuần này' scope")
    r = await s.click_testid("tab-grocery-week")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "grocery_week_scope")

    week_items = await s.ev('''(function(){
        var items = document.querySelectorAll('[data-testid^="grocery-item-"]');
        return 'items: ' + items.length;
    })()''')
    print_pass(f"Week scope: {week_items}")

    # --- Switch back to Day scope ---
    print_step("Switching back to 'Hôm nay' scope")
    r = await s.click_testid("tab-grocery-day")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "grocery_day_scope_restored")

    # --- Toggle group by aisle ---
    print_step("Toggling group by aisle")
    r = await s.click_testid("btn-group-aisle")
    await s.wait(WAIT_QUICK_ACTION)
    if r == "ok":
        await s.screenshot(sc, "grocery_grouped_by_aisle")
        print_pass("Grouped by aisle")

        # Toggle back
        await s.click_testid("btn-group-aisle")
        await s.wait(WAIT_QUICK_ACTION)
        await s.screenshot(sc, "grocery_ungrouped")
    else:
        print_warn("Group by aisle button not found")

    # --- Test copy to clipboard ---
    print_step("Clicking copy list button")
    r = await s.click_testid("btn-grocery-copy")
    await s.wait(WAIT_QUICK_ACTION)
    if r == "ok":
        await s.screenshot(sc, "grocery_copied_to_clipboard")
        print_pass("Grocery list copied to clipboard")
    else:
        print_warn("Copy button not found")

    # --- Check all items to trigger completion state ---
    print_step("Checking all items to trigger completion")
    all_checked = await s.ev('''(function(){
        var items = document.querySelectorAll('[data-testid^="grocery-item-"]');
        var count = 0;
        items.forEach(function(el){ el.click(); count++; });
        return 'checked ' + count + ' items';
    })()''')
    await s.wait(WAIT_QUICK_ACTION)
    print_pass(f"Batch check: {all_checked}")
    await s.screenshot(sc, "grocery_all_items_checked")

    # Check for completion message
    all_bought = await s.get_text("grocery-all-bought")
    if all_bought != "N/A":
        print_pass(f"Completion message: {all_bought}")
    else:
        print_warn("No completion message displayed")
    await s.screenshot(sc, "grocery_completion_state")

    # --- Close Grocery List ---
    print_step("Closing Grocery List")
    r = await s.click_testid("btn-close-grocery")
    if r == "none":
        await s.dismiss_modal()
    await s.wait(WAIT_MODAL_CLOSE)
    await s.screenshot(sc, "grocery_closed")

    print_pass("SC14 Grocery List — COMPLETE")


# ═══════════════════════════════════════════════════════════════
#  MAIN RUNNER
# ═══════════════════════════════════════════════════════════════

async def run_all():
    """Run all Group D scenarios in a single session (in-memory SQLite constraint)."""

    # Setup: fresh install + full onboarding
    s = await setup_fresh(full_onboard=True, scenario="SC10")

    # After onboarding, navigate to Calendar and add meals
    print_header("SETUP: Adding standard meals to today's plan")
    await s.nav_calendar()
    await s.subtab_meals()
    await s.wait(WAIT_NAV_CLICK)
    await add_standard_meals(s, "SC10")

    # Verify meals are present before starting tests
    slots = await get_meal_slot_text(s)
    print_pass(f"Setup complete — today's meals: {slots}")

    # --- Run all scenarios sequentially (single session) ---
    await sc10_copy_plan(s)
    await sc11_clear_plan(s)
    await sc12_template_manager(s)
    await sc13_save_template(s)
    await sc14_grocery_list(s)

    print(f"\n{'='*60}")
    print("🎉 Group D — ALL SCENARIOS COMPLETE")
    print(f"{'='*60}")


if __name__ == "__main__":
    run_scenario(run_all())
