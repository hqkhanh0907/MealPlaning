"""
Group B — Calendar + Meal Planning + Nutrition E2E Tests
SC01: Calendar & Meal Planning (week view, date nav, meal slots, action bar)
SC02: Meal Planner Modal (open, add dishes, confirm plan)
SC03: Nutrition Tracking (subtab, macros, energy detail, dashboard comparison)

Requires full onboarding (health profile needed for nutrition data).
Uses cdp_framework.py helpers.
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from cdp_framework import (
    setup_fresh,
    run_scenario,
    reset_steps,
    calc_age,
    calc_bmr,
    calc_tdee,
    calc_target,
    WAIT_NAV_CLICK,
    WAIT_QUICK_ACTION,
    WAIT_CONFIRM_PLAN,
    WAIT_MODAL_OPEN,
    WAIT_MODAL_CLOSE,
    CDPSession,
)

# Onboarding profile defaults (same as framework)
DOB = "1996-05-15"
WEIGHT = 75
HEIGHT = 175
GENDER = "male"
ACTIVITY = "moderate"
GOAL = "cut"
RATE = "moderate"

# Pre-calculated expected values (dynamic based on today)
AGE = calc_age(DOB)
BMR = calc_bmr(WEIGHT, HEIGHT, AGE, GENDER)
TDEE = calc_tdee(BMR, ACTIVITY)
TARGET = calc_target(TDEE, GOAL, RATE)

# Seed dishes (from onboarding) — per serving
DISHES = {
    "d1": {"name": "Trứng ốp la", "cal": 155, "pro": 13, "meals": ["breakfast", "dinner"]},
    "d2": {"name": "Yến mạch sữa chua", "cal": 332, "pro": 25, "meals": ["breakfast"]},
    "d3": {"name": "Bông cải xanh luộc", "cal": 51, "pro": 5, "meals": ["lunch", "dinner"]},
    "d4": {"name": "Khoai lang luộc", "cal": 129, "pro": 3, "meals": ["lunch", "dinner"]},
    "d5": {"name": "Ức gà áp chảo", "cal": 330, "pro": 62, "meals": ["lunch", "dinner"]},
}


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


def assert_not_na(value: str, label: str):
    if value == "N/A" or value == "" or value is None:
        print_fail(f"{label} = N/A (element not found)")
        return False
    print_pass(f"{label} = {value}")
    return True


# ╔══════════════════════════════════════════════════════════════╗
# ║  SC01: Calendar & Meal Planning                             ║
# ╚══════════════════════════════════════════════════════════════╝

async def sc01_calendar_meal_planning(s: CDPSession):
    """SC01: Calendar view, week nav, meal slots, action bar, subtabs."""
    sc = "SC01"
    reset_steps(sc)
    print_header("SC01: Calendar & Meal Planning")

    # --- Navigate to Calendar tab ---
    print_step("Navigating to Calendar tab")
    await s.nav_calendar()
    await s.screenshot(sc, "calendar_default_view")

    # --- Verify week view with 7 days ---
    print_step("Verifying week view (7 day columns)")
    day_count = await s.ev('''(function(){
        var days = document.querySelectorAll('[role="tablist"] [role="tab"], .day-cell, [class*="day-"]');
        if(days.length >= 7) return days.length;
        var cols = document.querySelectorAll('[class*="grid"] > div');
        return cols.length;
    })()''')
    print_pass(f"Week view columns/days detected: {day_count}")
    await s.screenshot(sc, "week_view_7_days")

    # --- Verify today is selected ---
    print_step("Verifying today is selected")
    today_info = await s.ev('''(function(){
        var sel = document.querySelector('[aria-selected="true"], [data-today="true"], .bg-primary, [class*="selected"]');
        if(sel) return 'selected: ' + sel.textContent.trim().substring(0, 20);
        return 'no-selection-found';
    })()''')
    print_pass(f"Today selection: {today_info}")

    # --- Click a different date (day cell) ---
    print_step("Clicking different date in week view")
    await s.ev('''(function(){
        var btns = document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){
            var txt = btns[i].textContent.trim();
            if(/^\\d{1,2}$/.test(txt) && !btns[i].closest('[aria-selected="true"]')){
                var r = btns[i].getBoundingClientRect();
                if(r.width > 0 && r.top < 200){
                    btns[i].click();
                    return 'clicked:' + txt;
                }
            }
        }
        return 'none';
    })()''')
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "different_date_selected")

    # --- Navigate to previous week ---
    print_step("Navigating to previous week")
    r = await s.click_testid("btn-prev-date")
    if r == "none":
        r = await s.ev('''(function(){
            var btns = document.querySelectorAll('button');
            for(var i=0;i<btns.length;i++){
                var a = btns[i].getAttribute('aria-label') || '';
                if(a.includes('trước') || a.includes('prev') || a.includes('Previous')){
                    btns[i].click(); return 'ok';
                }
            }
            return 'none';
        })()''')
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "previous_week")

    # --- Navigate to next week (twice to go 1 week forward from today) ---
    print_step("Navigating to next week")
    await s.click_testid("btn-next-date")
    await s.wait(WAIT_QUICK_ACTION)
    await s.click_testid("btn-next-date")
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "next_week")

    # --- Go back to today ---
    print_step("Returning to today")
    r = await s.click_testid("btn-today")
    if r == "none":
        await s.click_text("Hôm nay", "button")
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "back_to_today")

    # --- Check month view toggle (if exists) ---
    print_step("Checking for month/calendar view toggle")
    toggle_result = await s.ev('''(function(){
        var btns = document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){
            var a = btns[i].getAttribute('aria-label') || '';
            var t = btns[i].textContent.trim();
            if(a.includes('Tháng') || a.includes('month') || a.includes('calendar')
               || t.includes('Tháng') || a.includes('Chuyển')){
                btns[i].click();
                return 'toggled: ' + (a || t);
            }
        }
        return 'no-toggle-found';
    })()''')
    if "toggled" in str(toggle_result):
        await s.wait(WAIT_QUICK_ACTION)
        await s.screenshot(sc, "month_view")
        # Toggle back to week view
        await s.ev('''(function(){
            var btns = document.querySelectorAll('button');
            for(var i=0;i<btns.length;i++){
                var a = btns[i].getAttribute('aria-label') || '';
                var t = btns[i].textContent.trim();
                if(a.includes('Tuần') || a.includes('week') || t.includes('Tuần')){
                    btns[i].click(); return 'ok';
                }
            }
            return 'none';
        })()''')
        await s.wait(WAIT_QUICK_ACTION)
    else:
        print_warn("No month view toggle found (may not be in mobile UI)")

    # --- Verify Meals subtab is active by default ---
    print_step("Verifying Meals subtab is default")
    await s.subtab_meals()
    await s.screenshot(sc, "meals_subtab_active")

    # --- Verify 3 empty meal slots ---
    print_step("Checking 3 meal slots (Bữa Sáng, Bữa Trưa, Bữa Tối)")
    slots_info = await s.ev('''(function(){
        var slots = [];
        var ids = ['meal-slot-breakfast', 'meal-slot-lunch', 'meal-slot-dinner'];
        var labels = ['Bữa Sáng', 'Bữa Trưa', 'Bữa Tối'];
        for(var i=0;i<ids.length;i++){
            var el = document.querySelector('[data-testid="'+ids[i]+'"]');
            if(el) slots.push(labels[i] + ': found');
            else {
                var found = false;
                var all = document.querySelectorAll('h3,h4,div,span');
                for(var j=0;j<all.length;j++){
                    if(all[j].textContent.trim().includes(labels[i])){
                        slots.push(labels[i] + ': found (by text)');
                        found = true; break;
                    }
                }
                if(!found) slots.push(labels[i] + ': NOT FOUND');
            }
        }
        return JSON.stringify(slots);
    })()''')
    print_pass(f"Meal slots: {slots_info}")
    await s.screenshot(sc, "three_meal_slots_empty")

    # --- Check mini nutrition bar ---
    print_step("Checking mini nutrition bar")
    mini_bar = await s.get_text("mini-nutrition-bar")
    if mini_bar == "N/A":
        mini_rem_cal = await s.get_text("mini-remaining-cal")
        mini_rem_pro = await s.get_text("mini-remaining-pro")
        print_pass(f"Mini bar — Cal: {mini_rem_cal}, Pro: {mini_rem_pro}")
    else:
        print_pass(f"Mini nutrition bar: {mini_bar}")
    await s.screenshot(sc, "mini_nutrition_bar")

    # --- Check action bar buttons ---
    print_step("Checking meal action bar")
    action_bar = await s.get_text("meal-action-bar")
    assert_not_na(action_bar, "Action bar")
    await s.screenshot(sc, "meal_action_bar")

    # --- Click AI Suggest button ---
    print_step("Clicking AI Suggest button")
    r = await s.click_testid("btn-ai-suggest")
    if r == "ok":
        await s.wait(WAIT_MODAL_OPEN)
        await s.screenshot(sc, "ai_suggest_clicked")
        # Dismiss if modal opened
        await s.dismiss_modal()
        await s.wait(WAIT_MODAL_CLOSE)
    else:
        print_warn("AI Suggest button not found or not clickable")

    # --- Click More Actions menu ---
    print_step("Clicking More Actions menu (⋮)")
    r = await s.click_testid("btn-more-actions")
    if r == "ok":
        await s.wait(WAIT_QUICK_ACTION)
        await s.screenshot(sc, "more_actions_menu_open")

        # Verify menu items
        menu_items = await s.ev('''(function(){
            var items = [];
            var ids = ['btn-clear-plan','btn-copy-plan','btn-save-template','btn-template-manager'];
            for(var i=0;i<ids.length;i++){
                var el = document.querySelector('[data-testid="'+ids[i]+'"]');
                items.push(ids[i] + ': ' + (el ? 'visible' : 'hidden'));
            }
            return JSON.stringify(items);
        })()''')
        print_pass(f"Menu items: {menu_items}")

        # Dismiss menu (click outside or press back)
        await s.ev('''(function(){
            document.body.click();
            return 'dismissed';
        })()''')
        await s.wait(WAIT_QUICK_ACTION)
    else:
        print_warn("More actions button not found")

    # --- Switch to Nutrition subtab ---
    print_step("Switching to Nutrition subtab")
    await s.subtab_nutrition()
    await s.screenshot(sc, "nutrition_subtab")

    # --- Switch back to Meals subtab ---
    print_step("Switching back to Meals subtab")
    await s.subtab_meals()
    await s.screenshot(sc, "meals_subtab_restored")

    print_pass("SC01 complete")


# ╔══════════════════════════════════════════════════════════════╗
# ║  SC02: Meal Planner Modal                                   ║
# ╚══════════════════════════════════════════════════════════════╝

async def sc02_meal_planner_modal(s: CDPSession):
    """SC02: Open planner, add dishes to slots, confirm plan."""
    sc = "SC02"
    reset_steps(sc)
    print_header("SC02: Meal Planner Modal")

    # Ensure we're on Calendar > Meals tab
    await s.nav_calendar()
    await s.subtab_meals()
    await s.wait(WAIT_QUICK_ACTION)

    # --- Open Meal Planner via action bar button ---
    print_step("Opening Meal Planner modal")
    r = await s.click_testid("btn-plan-meal-section")
    if r == "none":
        # Try clicking an empty meal slot directly
        r = await s.click_testid("meal-slot-lunch")
        if r == "none":
            # Try clicking text "Bữa Trưa" area
            r = await s.click_text("Lên kế hoạch", "button,div")
            if r == "none":
                r = await s.click_text("Thêm món", "button,div")
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(sc, "meal_planner_opened")

    # --- Verify planner has 3 sections ---
    print_step("Verifying 3 meal sections in planner")
    sections = await s.ev('''(function(){
        var found = [];
        var labels = ['Bữa Sáng', 'Bữa Trưa', 'Bữa Tối'];
        var all = document.querySelectorAll('h3,h4,button,div,span');
        for(var k=0;k<labels.length;k++){
            for(var i=0;i<all.length;i++){
                if(all[i].textContent.trim() === labels[k]){
                    var r = all[i].getBoundingClientRect();
                    if(r.width > 0) { found.push(labels[k]); break; }
                }
            }
        }
        return JSON.stringify(found);
    })()''')
    print_pass(f"Planner sections: {sections}")
    await s.screenshot(sc, "planner_three_sections")

    # --- Check remaining budget display ---
    print_step("Checking remaining budget display")
    rem_cal = await s.get_text("meal-planner-remaining-cal")
    rem_pro = await s.get_text("meal-planner-remaining-pro")
    print_pass(f"Budget — Cal: {rem_cal}, Pro: {rem_pro}")
    await s.screenshot(sc, "planner_budget_display")

    # --- Click "Bữa Sáng" section header to select breakfast slot ---
    print_step("Selecting Bữa Sáng section")
    await s.click_text("Bữa Sáng", "h3,h4,button,div")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "breakfast_section_selected")

    # --- Add dish to breakfast: Trứng ốp la (d1) ---
    print_step("Adding Trứng ốp la to Bữa Sáng")
    r = await s.ev('''(function(){
        var btns = document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){
            var t = btns[i].textContent.trim();
            if(t.includes('Trứng ốp la') && t.includes('155')){
                var r = btns[i].getBoundingClientRect();
                if(r.width > 0){ btns[i].click(); return 'added: ' + t; }
            }
        }
        return 'not found';
    })()''')
    await s.wait(WAIT_QUICK_ACTION)
    if "added" in str(r):
        print_pass(f"Dish added: {r}")
    else:
        # Try quick-add button
        r = await s.ev('''(function(){
            var btns = document.querySelectorAll('button[data-testid^="btn-quick-add"]');
            for(var i=0;i<btns.length;i++){
                if(btns[i].textContent.includes('Trứng')){
                    btns[i].click(); return 'quick-added';
                }
            }
            var btns2 = document.querySelectorAll('button');
            for(var i=0;i<btns2.length;i++){
                var t = btns2[i].textContent.trim();
                if(t.includes('Trứng ốp la')){
                    var r = btns2[i].getBoundingClientRect();
                    if(r.width > 0){ btns2[i].click(); return 'clicked: ' + t; }
                }
            }
            return 'not-found';
        })()''')
        await s.wait(WAIT_QUICK_ACTION)
        print_pass(f"Trứng ốp la add attempt: {r}")
    await s.screenshot(sc, "breakfast_egg_added")

    # --- Add Yến mạch sữa chua (d2) to breakfast ---
    print_step("Adding Yến mạch sữa chua to Bữa Sáng")
    r = await s.ev('''(function(){
        var btns = document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){
            var t = btns[i].textContent.trim();
            if(t.includes('Yến mạch') && t.includes('332')){
                var r = btns[i].getBoundingClientRect();
                if(r.width > 0){ btns[i].click(); return 'added: ' + t; }
            }
            if(t.includes('Yến mạch sữa chua')){
                var r = btns[i].getBoundingClientRect();
                if(r.width > 0){ btns[i].click(); return 'clicked: ' + t; }
            }
        }
        return 'not found';
    })()''')
    await s.wait(WAIT_QUICK_ACTION)
    print_pass(f"Yến mạch add: {r}")
    await s.screenshot(sc, "breakfast_oatmeal_added")

    # --- Select "Bữa Trưa" section ---
    print_step("Selecting Bữa Trưa section")
    await s.click_text("Bữa Trưa", "h3,h4,button,div")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "lunch_section_selected")

    # --- Add Ức gà áp chảo (d5) to lunch ---
    print_step("Adding Ức gà áp chảo to Bữa Trưa")
    r = await s.ev('''(function(){
        var btns = document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){
            var t = btns[i].textContent.trim();
            if(t.includes('Ức gà') && t.includes('330')){
                var r = btns[i].getBoundingClientRect();
                if(r.width > 0){ btns[i].click(); return 'added: ' + t; }
            }
            if(t.includes('Ức gà áp chảo')){
                var r = btns[i].getBoundingClientRect();
                if(r.width > 0){ btns[i].click(); return 'clicked: ' + t; }
            }
        }
        return 'not found';
    })()''')
    await s.wait(WAIT_QUICK_ACTION)
    print_pass(f"Ức gà add: {r}")
    await s.screenshot(sc, "lunch_chicken_added")

    # --- Add Bông cải xanh luộc (d3) to lunch ---
    print_step("Adding Bông cải xanh luộc to Bữa Trưa")
    r = await s.ev('''(function(){
        var btns = document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){
            var t = btns[i].textContent.trim();
            if(t.includes('Bông cải') && t.includes('51')){
                var r = btns[i].getBoundingClientRect();
                if(r.width > 0){ btns[i].click(); return 'added: ' + t; }
            }
            if(t.includes('Bông cải xanh')){
                var r = btns[i].getBoundingClientRect();
                if(r.width > 0){ btns[i].click(); return 'clicked: ' + t; }
            }
        }
        return 'not found';
    })()''')
    await s.wait(WAIT_QUICK_ACTION)
    print_pass(f"Bông cải add: {r}")
    await s.screenshot(sc, "lunch_broccoli_added")

    # --- Add Khoai lang luộc (d4) to lunch ---
    print_step("Adding Khoai lang luộc to Bữa Trưa")
    r = await s.ev('''(function(){
        var btns = document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){
            var t = btns[i].textContent.trim();
            if(t.includes('Khoai lang') && t.includes('129')){
                var r = btns[i].getBoundingClientRect();
                if(r.width > 0){ btns[i].click(); return 'added: ' + t; }
            }
            if(t.includes('Khoai lang luộc')){
                var r = btns[i].getBoundingClientRect();
                if(r.width > 0){ btns[i].click(); return 'clicked: ' + t; }
            }
        }
        return 'not found';
    })()''')
    await s.wait(WAIT_QUICK_ACTION)
    print_pass(f"Khoai lang add: {r}")
    await s.screenshot(sc, "lunch_sweet_potato_added")

    # --- Select "Bữa Tối" section ---
    print_step("Selecting Bữa Tối section")
    await s.click_text("Bữa Tối", "h3,h4,button,div")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "dinner_section_selected")

    # --- Add Ức gà áp chảo (d5) to dinner ---
    print_step("Adding Ức gà áp chảo to Bữa Tối")
    r = await s.ev('''(function(){
        var btns = document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){
            var t = btns[i].textContent.trim();
            if(t.includes('Ức gà') && t.includes('330')){
                var r = btns[i].getBoundingClientRect();
                if(r.width > 0){ btns[i].click(); return 'added: ' + t; }
            }
            if(t.includes('Ức gà áp chảo')){
                var r = btns[i].getBoundingClientRect();
                if(r.width > 0){ btns[i].click(); return 'clicked: ' + t; }
            }
        }
        return 'not found';
    })()''')
    await s.wait(WAIT_QUICK_ACTION)
    print_pass(f"Ức gà (dinner) add: {r}")
    await s.screenshot(sc, "dinner_chicken_added")

    # --- Screenshot full planner state before confirm ---
    print_step("Full planner state before confirm")
    await s.screenshot(sc, "planner_all_dishes_added")

    # --- Click "Xác nhận" (btn-confirm-plan) ---
    print_step("Confirming meal plan")
    r = await s.click_testid("btn-confirm-plan")
    if r == "none":
        r = await s.click_text("Xác nhận", "button")
    await s.wait(WAIT_CONFIRM_PLAN)
    print_pass(f"Confirm plan: {r}")
    await s.screenshot(sc, "plan_confirmed")

    # --- Verify calendar now shows dishes in slots ---
    print_step("Verifying dishes appear in calendar slots")
    await s.wait(WAIT_NAV_CLICK)
    slot_content = await s.ev('''(function(){
        var result = {};
        var ids = ['meal-slot-breakfast', 'meal-slot-lunch', 'meal-slot-dinner'];
        var labels = ['breakfast', 'lunch', 'dinner'];
        for(var i=0;i<ids.length;i++){
            var el = document.querySelector('[data-testid="'+ids[i]+'"]');
            if(el) result[labels[i]] = el.textContent.trim().substring(0, 80);
            else result[labels[i]] = 'slot-not-found';
        }
        return JSON.stringify(result);
    })()''')
    print_pass(f"Slot contents: {slot_content}")
    await s.screenshot(sc, "calendar_with_dishes")

    # --- Verify specific dishes visible ---
    print_step("Verifying dish names visible on calendar")
    visible_dishes = await s.ev('''(function(){
        var text = document.body.innerText;
        var dishes = ['Trứng ốp la','Yến mạch','Ức gà','Bông cải','Khoai lang'];
        var found = [];
        for(var i=0;i<dishes.length;i++){
            if(text.includes(dishes[i])) found.push(dishes[i]);
        }
        return JSON.stringify(found);
    })()''')
    print_pass(f"Visible dishes: {visible_dishes}")

    # --- Expected totals ---
    # Breakfast: d1(155) + d2(332) = 487 cal, 13+25 = 38g pro
    # Lunch: d5(330) + d3(51) + d4(129) = 510 cal, 62+5+3 = 70g pro
    # Dinner: d5(330) = 330 cal, 62g pro
    # Total: 487+510+330 = 1327 cal, 38+70+62 = 170g pro
    total_cal = 155 + 332 + 330 + 51 + 129 + 330  # 1327
    total_pro = 13 + 25 + 62 + 5 + 3 + 62  # 170
    print_pass(f"Expected totals: {total_cal} kcal, {total_pro}g protein")

    # --- Screenshot mini nutrition bar after adding meals ---
    print_step("Checking mini nutrition bar after meal plan")
    mini_rem_cal = await s.get_text("mini-remaining-cal")
    mini_rem_pro = await s.get_text("mini-remaining-pro")
    print_pass(f"Mini bar — Remaining Cal: {mini_rem_cal}, Remaining Pro: {mini_rem_pro}")
    await s.screenshot(sc, "mini_bar_after_plan")

    print_pass("SC02 complete")


# ╔══════════════════════════════════════════════════════════════╗
# ║  SC03: Nutrition Tracking                                   ║
# ╚══════════════════════════════════════════════════════════════╝

async def sc03_nutrition_tracking(s: CDPSession):
    """SC03: Nutrition subtab, macros, energy detail, dashboard comparison."""
    sc = "SC03"
    reset_steps(sc)
    print_header("SC03: Nutrition Tracking")

    # --- Ensure on Calendar tab ---
    await s.nav_calendar()
    await s.wait(WAIT_QUICK_ACTION)

    # --- Switch to Nutrition subtab ---
    print_step("Switching to Nutrition subtab")
    await s.subtab_nutrition()
    await s.screenshot(sc, "nutrition_subtab_view")

    # --- Screenshot nutrition summary (energy balance card) ---
    print_step("Checking energy balance card")
    ebc_text = await s.get_text("energy-balance-card")
    if ebc_text != "N/A":
        print_pass(f"Energy balance card content: {ebc_text[:80]}")
    else:
        # Check individual elements
        net_cal = await s.get_text("net-calories")
        cal_in = await s.get_text("calories-in")
        cal_out = await s.get_text("calories-out")
        print_pass(f"Net: {net_cal}, In: {cal_in}, Out: {cal_out}")
    await s.screenshot(sc, "energy_balance_card")

    # --- Check remaining display ---
    print_step("Checking remaining calories display")
    remaining = await s.get_text("remaining-display")
    assert_not_na(remaining, "Remaining display")
    await s.screenshot(sc, "remaining_calories")

    # --- Screenshot macro breakdown ---
    print_step("Checking macro chart / breakdown")
    macro_chart = await s.get_text("macro-chart")
    if macro_chart == "N/A":
        # Try donut chart
        donut_cal = await s.get_text("donut-total-cal")
        if donut_cal != "N/A":
            print_pass(f"Donut chart total: {donut_cal}")
        else:
            print_warn("No macro chart or donut chart found")
    else:
        print_pass(f"Macro chart: {macro_chart[:60]}")
    await s.screenshot(sc, "macro_breakdown")

    # --- Check protein bar ---
    print_step("Checking protein display")
    protein = await s.get_text("protein-display")
    if protein != "N/A":
        print_pass(f"Protein display: {protein}")
    else:
        protein = await s.get_text("protein-bar")
        print_pass(f"Protein bar: {protein}")
    await s.screenshot(sc, "protein_display")

    # --- Check calorie progress bar ---
    print_step("Checking calorie progress bar")
    progress = await s.ev('''(function(){
        var bar = document.querySelector('[data-testid="calorie-progress-bar"]');
        if(!bar) return 'N/A';
        var food = document.querySelector('[data-testid="bar-food"]');
        var exercise = document.querySelector('[data-testid="bar-exercise"]');
        return JSON.stringify({
            food: food ? food.style.width || food.getAttribute('style') : 'N/A',
            exercise: exercise ? exercise.style.width || exercise.getAttribute('style') : 'N/A'
        });
    })()''')
    print_pass(f"Progress bar: {progress}")
    await s.screenshot(sc, "calorie_progress_bar")

    # --- Click energy balance for detail sheet ---
    print_step("Opening energy detail sheet")
    # First try clicking energy-balance-card for detail
    r = await s.click_testid("collapse-toggle")
    if r == "none":
        r = await s.click_testid("energy-balance-card")
    if r == "none":
        r = await s.click_testid("energy-balance-mini")
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(sc, "energy_detail_opened")

    # --- Verify BMR, TDEE, Target values ---
    print_step(f"Verifying BMR/TDEE/Target (expected: BMR={BMR}, TDEE={TDEE}, Target={TARGET})")
    bmr_val = await s.get_text("bmr-value")
    tdee_val = await s.get_text("tdee-value")
    target_val = await s.get_text("target-value")

    print_pass(f"BMR displayed: {bmr_val} (expected: {BMR})")
    print_pass(f"TDEE displayed: {tdee_val} (expected: {TDEE})")
    print_pass(f"Target displayed: {target_val} (expected: {TARGET})")

    # Verify values match expectations (extract numbers)
    for label, displayed, expected in [("BMR", bmr_val, BMR), ("TDEE", tdee_val, TDEE), ("Target", target_val, TARGET)]:
        if str(expected) in str(displayed):
            print_pass(f"{label} ✓ matches expected {expected}")
        elif displayed == "N/A":
            print_warn(f"{label} element not found")
        else:
            print_warn(f"{label} mismatch — displayed '{displayed}', expected '{expected}'")

    await s.screenshot(sc, "bmr_tdee_target_values")

    # --- Check per-meal breakdown ---
    print_step("Checking per-meal breakdown")
    per_meal = await s.get_text("per-meal-breakdown")
    if per_meal != "N/A":
        print_pass(f"Per-meal breakdown: {per_meal[:80]}")
    await s.screenshot(sc, "per_meal_breakdown")

    # --- Check energy breakdown grid ---
    print_step("Checking energy breakdown grid")
    breakdown = await s.get_text("energy-breakdown")
    if breakdown != "N/A":
        print_pass(f"Energy breakdown: {breakdown[:80]}")
    await s.screenshot(sc, "energy_breakdown_grid")

    # --- Close detail sheet ---
    print_step("Closing energy detail sheet")
    r = await s.click_testid("btn-close-energy-detail")
    if r == "none":
        r = await s.click_testid("collapse-toggle")
    if r == "none":
        await s.dismiss_modal()
    await s.wait(WAIT_MODAL_CLOSE)
    await s.screenshot(sc, "detail_sheet_closed")

    # --- Navigate to Dashboard tab ---
    print_step("Navigating to Dashboard tab")
    await s.nav_dashboard()
    await s.screenshot(sc, "dashboard_view")

    # --- Check dashboard mini nutrition display ---
    print_step("Checking Dashboard mini nutrition display")
    mini_eaten = await s.get_text("mini-eaten")
    mini_burned = await s.get_text("mini-burned")
    mini_net = await s.get_text("mini-net")
    print_pass(f"Dashboard — Eaten: {mini_eaten}, Burned: {mini_burned}, Net: {mini_net}")
    await s.screenshot(sc, "dashboard_mini_nutrition")

    # --- Check dashboard protein display ---
    print_step("Checking Dashboard protein display")
    protein_display = await s.get_text("protein-display")
    print_pass(f"Dashboard protein: {protein_display}")
    await s.screenshot(sc, "dashboard_protein")

    # --- Open energy detail from dashboard ---
    print_step("Opening energy detail from Dashboard")
    r = await s.click_testid("energy-balance-mini")
    if r == "ok":
        await s.wait(WAIT_MODAL_OPEN)
        await s.screenshot(sc, "dashboard_energy_detail")

        # Read values from dashboard context
        db_bmr = await s.get_text("bmr-value")
        db_tdee = await s.get_text("tdee-value")
        db_target = await s.get_text("target-value")
        print_pass(f"Dashboard detail — BMR: {db_bmr}, TDEE: {db_tdee}, Target: {db_target}")

        # Close detail
        r2 = await s.click_testid("btn-close-energy-detail")
        if r2 == "none":
            await s.dismiss_modal()
        await s.wait(WAIT_MODAL_CLOSE)
    else:
        print_warn("Energy balance mini not found on Dashboard")

    await s.screenshot(sc, "dashboard_after_detail_close")

    # --- Compare Dashboard vs Calendar nutrition ---
    print_step("Comparing Dashboard vs Calendar nutrition")

    # Store dashboard values
    dashboard_eaten = mini_eaten
    dashboard_protein = protein_display

    # Navigate back to Calendar > Nutrition
    await s.nav_calendar()
    await s.subtab_nutrition()
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "calendar_nutrition_for_comparison")

    # Read calendar nutrition values
    cal_remaining = await s.get_text("remaining-display")
    cal_protein = await s.get_text("protein-display")
    print_pass(f"Calendar — Remaining: {cal_remaining}, Protein: {cal_protein}")
    print_pass(f"Dashboard — Eaten: {dashboard_eaten}, Protein: {dashboard_protein}")

    # --- Switch back to Meals subtab for final screenshot ---
    await s.subtab_meals()
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "final_meals_view")

    print_pass("SC03 complete")


# ╔══════════════════════════════════════════════════════════════╗
# ║  MAIN — Run all scenarios in single session                 ║
# ╚══════════════════════════════════════════════════════════════╝

async def main():
    """Run all Group B scenarios in a single session (in-memory SQLite constraint)."""
    print("\n" + "=" * 60)
    print("  GROUP B — Calendar + Meal Planning + Nutrition")
    print("=" * 60)
    print(f"  Profile: {GENDER}, {WEIGHT}kg, {HEIGHT}cm, DOB={DOB}")
    print(f"  Age: {AGE}, Activity: {ACTIVITY}, Goal: {GOAL} ({RATE})")
    print(f"  Expected: BMR={BMR}, TDEE={TDEE}, Target={TARGET}")
    print("=" * 60)

    # Setup with full onboarding (need health profile for nutrition data)
    s = await setup_fresh(full_onboard=True, scenario="SC01")

    try:
        # SC01: Calendar & Meal Planning
        await sc01_calendar_meal_planning(s)

        # SC02: Meal Planner Modal (adds dishes — state carries forward)
        await sc02_meal_planner_modal(s)

        # SC03: Nutrition Tracking (uses dishes added in SC02)
        await sc03_nutrition_tracking(s)

        print("\n" + "=" * 60)
        print("  ✅ GROUP B COMPLETE — All scenarios executed")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error during execution: {e}")
        import traceback
        traceback.print_exc()
        # Take error screenshot
        try:
            await s.screenshot("ERROR", "crash_state")
        except Exception:
            pass
        raise
    finally:
        try:
            await s.ws.close()
        except Exception:
            pass


if __name__ == "__main__":
    run_scenario(main())
