"""
Group H — UI/UX E2E Tests
SC19: Quick Preview (Calendar meal slots summary, nutrition progress)
SC20: Filter & Sort (Library sort dropdown, filter sheet, grid/list toggle)
SC22: Dark Mode (Theme toggle in settings, multi-page dark mode screenshots)

Requires full onboarding (meals data needed for preview).
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
    WAIT_NAV_CLICK,
    WAIT_QUICK_ACTION,
    WAIT_MODAL_OPEN,
    WAIT_MODAL_CLOSE,
    WAIT_CONFIRM_PLAN,
    WAIT_SAVE_SETTINGS,
    CDPSession,
)


def print_header(title: str):
    print(f"\n{'─'*60}")
    print(f"  {title}")
    print(f"{'─'*60}")


def print_step(step: str):
    print(f"  ▸ {step}")


def print_result(label: str, value: str, expected: str = ""):
    status = "✅" if not expected or value == expected else "⚠️"
    msg = f"  {status} {label}: {value}"
    if expected and value != expected:
        msg += f" (expected: {expected})"
    print(msg)


# ═══════════════════════════════════════════════════════════
# Helper: Add meals to today's plan (so preview has data)
# ═══════════════════════════════════════════════════════════

async def add_meals_for_preview(s: CDPSession):
    """Add meals via MealPlannerModal so QuickPreview has data."""
    print_step("Adding meals for preview data...")

    await s.nav_calendar()
    await s.subtab_meals()
    await s.wait(WAIT_QUICK_ACTION)

    # Open planner
    r = await s.click_testid("btn-plan-meal-section")
    await s.wait(WAIT_MODAL_OPEN)

    # Add dishes to breakfast (first section is already selected)
    # Click quick-add for Trứng ốp la (seed dish d1)
    await s.ev('''(function(){
        var btns=document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){
            var t=btns[i].textContent.trim();
            if(t.includes('Trứng ốp la')&&t.includes('155')){btns[i].click();return'ok'}
        }
        return'none'
    })()''')
    await s.wait(WAIT_QUICK_ACTION)

    # Add Yến mạch to breakfast
    await s.ev('''(function(){
        var btns=document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){
            var t=btns[i].textContent.trim();
            if(t.includes('Yến mạch')&&t.includes('332')){btns[i].click();return'ok'}
        }
        return'none'
    })()''')
    await s.wait(WAIT_QUICK_ACTION)

    # Switch to lunch section
    await s.ev('''(function(){
        var els=document.querySelectorAll('h3,h4,div,button,span');
        for(var i=0;i<els.length;i++){
            if(els[i].textContent.trim()==='Bữa Trưa'){els[i].click();return'ok'}
        }
        return'none'
    })()''')
    await s.wait(WAIT_QUICK_ACTION)

    # Add Ức gà to lunch
    await s.ev('''(function(){
        var btns=document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){
            var t=btns[i].textContent.trim();
            if(t.includes('Ức gà')&&t.includes('330')){btns[i].click();return'ok'}
        }
        return'none'
    })()''')
    await s.wait(WAIT_QUICK_ACTION)

    # Confirm plan
    await s.click_testid("btn-confirm-plan")
    await s.wait(WAIT_CONFIRM_PLAN)
    print_step("Meals added to today's plan ✅")


# ═══════════════════════════════════════════════════════════
# SC19: Quick Preview
# ═══════════════════════════════════════════════════════════

async def sc19_quick_preview(s: CDPSession):
    """Test Quick Preview Panel on Calendar tab."""
    SC = "SC19"
    reset_steps(SC)
    print_header("SC19: Quick Preview")

    # Step 1: Navigate to Calendar tab, meals subtab
    print_step("Navigate to Calendar → Meals subtab")
    await s.nav_calendar()
    await s.subtab_meals()
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "calendar_meals_subtab")

    # Step 2: Verify Quick Preview Panel exists
    print_step("Verify Quick Preview Panel")
    panel = await s.ev('''(function(){
        var el=document.querySelector('[data-testid="quick-preview-panel"]');
        if(!el)return'not found';
        var r=el.getBoundingClientRect();
        return JSON.stringify({visible:r.width>0,h:Math.round(r.height)});
    })()''')
    print_result("Quick Preview Panel", str(panel))
    await s.screenshot(SC, "quick_preview_panel")

    # Step 3: Screenshot each meal slot row
    print_step("Screenshot meal slot rows (breakfast/lunch/dinner)")
    for meal_type in ["breakfast", "lunch", "dinner"]:
        row = await s.ev(f'''(function(){{
            var el=document.querySelector('[data-testid="quick-preview-row-{meal_type}"]');
            if(!el)return'not found';
            return el.textContent.trim().substring(0,80);
        }})()''')
        print_result(f"  {meal_type} row", str(row))
    await s.screenshot(SC, "meal_slot_rows_detail")

    # Step 4: Screenshot nutrition progress bars
    print_step("Screenshot nutrition progress info in preview")
    nutrition_info = await s.ev('''(function(){
        var panel=document.querySelector('[data-testid="quick-preview-panel"]');
        if(!panel)return'no panel';
        var bars=panel.querySelectorAll('[role="progressbar"],[class*="progress"],[class*="bar"]');
        var info={progressBars:bars.length};
        var texts=panel.querySelectorAll('span,p,div');
        var kcalTexts=[];
        texts.forEach(function(t){
            var c=t.textContent.trim();
            if(c.includes('kcal')||c.includes('cal'))kcalTexts.push(c.substring(0,40));
        });
        info.kcalTexts=kcalTexts.slice(0,5);
        return JSON.stringify(info);
    })()''')
    print_result("Nutrition in preview", str(nutrition_info))
    await s.screenshot(SC, "nutrition_progress_bars")

    # Step 5: Screenshot the whole calendar view with preview
    print_step("Full calendar view with preview panel")
    await s.screenshot(SC, "full_calendar_with_preview")

    print(f"\n  ✅ SC19 complete")


# ═══════════════════════════════════════════════════════════
# SC20: Filter & Sort
# ═══════════════════════════════════════════════════════════

async def sc20_filter_sort(s: CDPSession):
    """Test Filter & Sort in Library tab."""
    SC = "SC20"
    reset_steps(SC)
    print_header("SC20: Filter & Sort")

    # Step 1: Navigate to Library tab
    print_step("Navigate to Library tab")
    await s.nav_library()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SC, "library_tab_initial")

    # Step 2: Verify sort dropdown exists (DishManager uses select-sort-dish)
    print_step("Verify sort dropdown")
    sort_info = await s.ev('''(function(){
        var sel=document.querySelector('[data-testid="select-sort-dish"]');
        if(!sel)return'not found';
        var options=[];
        for(var i=0;i<sel.options.length;i++){
            options.push({value:sel.options[i].value,label:sel.options[i].text});
        }
        return JSON.stringify({current:sel.value,options:options});
    })()''')
    print_result("Sort dropdown", str(sort_info))
    await s.screenshot(SC, "sort_dropdown_visible")

    # Step 3: Open sort dropdown and screenshot options
    print_step("Focus sort dropdown to show options")
    await s.ev('''(function(){
        var sel=document.querySelector('[data-testid="select-sort-dish"]');
        if(sel){sel.focus();sel.click()}
    })()''')
    await s.wait(0.5)
    await s.screenshot(SC, "sort_dropdown_options")

    # Step 4: Select sort by calories
    print_step("Select sort by calories")
    sort_r = await s.ev('''(function(){
        var sel=document.querySelector('[data-testid="select-sort-dish"]');
        if(!sel)return'no select';
        for(var i=0;i<sel.options.length;i++){
            var v=sel.options[i].value.toLowerCase();
            if(v.includes('cal')||v.includes('energy')||v.includes('kcal')){
                sel.selectedIndex=i;
                sel.dispatchEvent(new Event('change',{bubbles:true}));
                return'sorted by: '+sel.options[i].text;
            }
        }
        // Fallback: select 2nd option if no calorie-specific sort
        if(sel.options.length>1){
            sel.selectedIndex=1;
            sel.dispatchEvent(new Event('change',{bubbles:true}));
            return'sorted by: '+sel.options[1].text+' (fallback)';
        }
        return'no calorie sort option';
    })()''')
    await s.wait(WAIT_QUICK_ACTION)
    print_result("Sort selection", str(sort_r))
    await s.screenshot(SC, "sorted_list_by_calories")

    # Step 5: Check for filter buttons (meal type filter chips)
    print_step("Screenshot filter chips (meal type)")
    filter_info = await s.ev('''(function(){
        var allBtn=document.querySelector('[data-testid="btn-filter-all-dishes"]');
        var types=['breakfast','lunch','dinner'];
        var chips=[];
        if(allBtn)chips.push({testid:'btn-filter-all-dishes',text:allBtn.textContent.trim()});
        types.forEach(function(t){
            var btn=document.querySelector('[data-testid="btn-filter-'+t+'"]');
            if(btn)chips.push({testid:'btn-filter-'+t,text:btn.textContent.trim()});
        });
        return JSON.stringify(chips);
    })()''')
    print_result("Filter chips", str(filter_info))
    await s.screenshot(SC, "filter_chips_visible")

    # Step 6: Click a meal type filter
    print_step("Apply meal type filter (breakfast)")
    await s.click_testid("btn-filter-breakfast")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "filtered_by_breakfast")

    # Step 7: Check FilterBottomSheet (if available from MealPlannerModal)
    print_step("Check filter bottom sheet (if accessible)")
    filter_sheet = await s.ev('''(function(){
        var el=document.querySelector('[data-testid="filter-bottom-sheet"]');
        if(el)return'found';
        return'not visible (only in planner modal)';
    })()''')
    print_result("Filter bottom sheet", str(filter_sheet))

    # Step 8: Reset filter
    print_step("Reset filter to All")
    await s.click_testid("btn-filter-all-dishes")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "filter_reset_all")

    # Step 9: Toggle to grid view
    print_step("Toggle to grid view")
    await s.click_testid("btn-view-grid")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "grid_view")

    # Step 10: Toggle to list view
    print_step("Toggle to list view")
    await s.click_testid("btn-view-list")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "list_view")

    # Step 11: Switch back to grid view for final screenshot
    print_step("Back to grid view")
    await s.click_testid("btn-view-grid")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "grid_view_final")

    print(f"\n  ✅ SC20 complete")


# ═══════════════════════════════════════════════════════════
# SC22: Dark Mode
# ═══════════════════════════════════════════════════════════

async def sc22_dark_mode(s: CDPSession):
    """Test Dark Mode toggle and multi-page screenshots."""
    SC = "SC22"
    reset_steps(SC)
    print_header("SC22: Dark Mode")

    # Step 1: Open Settings to find theme section
    print_step("Open Settings")
    await s.click_testid("btn-open-settings")
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SC, "settings_opened")

    # Step 2: Verify current theme
    print_step("Check current theme state")
    theme_info = await s.ev('''(function(){
        var html=document.documentElement;
        var isDark=html.classList.contains('dark');
        var theme=html.getAttribute('data-theme')||'unknown';
        var btns=[];
        ['light','dark','system','schedule'].forEach(function(t){
            var btn=document.querySelector('[data-testid="btn-theme-'+t+'"]');
            if(btn){
                var r=btn.getBoundingClientRect();
                btns.push({value:t,visible:r.width>0,text:btn.textContent.trim()});
            }
        });
        return JSON.stringify({isDark:isDark,dataTheme:theme,buttons:btns});
    })()''')
    print_result("Theme state", str(theme_info))

    # Step 3: Screenshot light mode (ensure we're in light)
    print_step("Ensure light mode and screenshot")
    await s.click_testid("btn-theme-light")
    await s.wait(WAIT_SAVE_SETTINGS)
    await s.screenshot(SC, "light_mode_settings")

    # Step 4: Close settings and screenshot light mode on calendar
    print_step("Screenshot Calendar in light mode")
    await s.click_testid("btn-close-settings")
    await s.wait(WAIT_MODAL_CLOSE)
    await s.nav_calendar()
    await s.screenshot(SC, "light_mode_calendar")

    # Step 5: Screenshot Library in light mode
    print_step("Screenshot Library in light mode")
    await s.nav_library()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SC, "light_mode_library")

    # Step 6: Screenshot Dashboard in light mode
    print_step("Screenshot Dashboard in light mode")
    await s.nav_dashboard()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SC, "light_mode_dashboard")

    # Step 7: Toggle to dark mode
    print_step("Toggle to dark mode via Settings")
    await s.click_testid("btn-open-settings")
    await s.wait(WAIT_NAV_CLICK)
    await s.click_testid("btn-theme-dark")
    await s.wait(WAIT_SAVE_SETTINGS)
    await s.screenshot(SC, "dark_mode_settings")

    # Step 8: Verify dark mode is active
    print_step("Verify dark mode active")
    dark_check = await s.ev('''(function(){
        return document.documentElement.classList.contains('dark')?'dark':'not dark';
    })()''')
    print_result("Dark mode class", str(dark_check), "dark")

    # Step 9: Close settings, screenshot pages in dark mode
    print_step("Screenshot Calendar in dark mode")
    await s.click_testid("btn-close-settings")
    await s.wait(WAIT_MODAL_CLOSE)
    await s.nav_calendar()
    await s.screenshot(SC, "dark_mode_calendar")

    print_step("Screenshot Library in dark mode")
    await s.nav_library()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SC, "dark_mode_library")

    print_step("Screenshot Dashboard in dark mode")
    await s.nav_dashboard()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SC, "dark_mode_dashboard")

    print_step("Screenshot Fitness in dark mode")
    await s.nav_fitness()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SC, "dark_mode_fitness")

    print_step("Screenshot AI tab in dark mode")
    await s.nav_ai()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SC, "dark_mode_ai_analysis")

    # Step 10: Toggle back to light mode
    print_step("Toggle back to light mode")
    await s.click_testid("btn-open-settings")
    await s.wait(WAIT_NAV_CLICK)
    await s.click_testid("btn-theme-light")
    await s.wait(WAIT_SAVE_SETTINGS)
    await s.screenshot(SC, "restored_light_mode_settings")

    # Verify light mode restored
    light_check = await s.ev('''(function(){
        return document.documentElement.classList.contains('dark')?'still dark':'light';
    })()''')
    print_result("Light mode restored", str(light_check), "light")

    await s.click_testid("btn-close-settings")
    await s.wait(WAIT_MODAL_CLOSE)
    await s.screenshot(SC, "restored_light_mode_calendar")

    print(f"\n  ✅ SC22 complete")


# ═══════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════

async def main():
    print("\n" + "═" * 60)
    print("  GROUP H — UI/UX E2E Tests")
    print("  SC19: Quick Preview")
    print("  SC20: Filter & Sort")
    print("  SC22: Dark Mode")
    print("═" * 60)

    s = await setup_fresh(full_onboard=True, scenario="SC19")

    try:
        # Add meals so quick preview has data
        await add_meals_for_preview(s)

        await sc19_quick_preview(s)
        await sc20_filter_sort(s)
        await sc22_dark_mode(s)

        print("\n" + "═" * 60)
        print("  ✅ GROUP H — All scenarios complete")
        print("═" * 60)
    finally:
        await s.ws.close()


if __name__ == "__main__":
    run_scenario(main())
