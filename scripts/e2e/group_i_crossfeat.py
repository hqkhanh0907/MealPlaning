"""
Group I — Cross-feature E2E Tests
SC38: Cross-feature Navigation (5 tabs, settings from each, back navigation)
SC42: Plan Day Editor (exercise list, selector, unsaved changes dialog)
SC43: Freestyle Workout (add session modal, freestyle option, workout logger)

Requires full onboarding (training plan needed for plan day editor).
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


# Tab navigation data
TABS = [
    {"id": "calendar", "testid": "nav-calendar", "label": "Lịch"},
    {"id": "library", "testid": "nav-library", "label": "Thư viện"},
    {"id": "ai-analysis", "testid": "nav-ai-analysis", "label": "AI"},
    {"id": "fitness", "testid": "nav-fitness", "label": "Fitness"},
    {"id": "dashboard", "testid": "nav-dashboard", "label": "Tổng quan"},
]


# ═══════════════════════════════════════════════════════════
# SC38: Cross-feature Navigation
# ═══════════════════════════════════════════════════════════

async def sc38_cross_feature_navigation(s: CDPSession):
    """Test navigation through all 5 tabs with settings access."""
    SC = "SC38"
    reset_steps(SC)
    print_header("SC38: Cross-feature Navigation")

    # Step 1: Navigate through ALL 5 tabs sequentially
    print_step("Navigate through all 5 tabs sequentially")
    for tab in TABS:
        print_step(f"  Tab: {tab['label']} ({tab['id']})")
        await s.click_testid(tab["testid"])
        await s.wait(WAIT_NAV_CLICK)

        # Verify active tab
        active_tab = await s.ev(f'''(function(){{
            var el=document.querySelector('[data-testid="{tab["testid"]}"]');
            if(!el)return'not found';
            var aria=el.getAttribute('aria-selected')||el.getAttribute('aria-current')||'';
            var cls=el.className||'';
            var isActive=aria==='true'||cls.includes('text-primary')||cls.includes('active');
            return JSON.stringify({{tab:'{tab["id"]}',active:isActive}});
        }})()''')
        print_result(f"  {tab['label']} tab active", str(active_tab))
        await s.screenshot(SC, f"tab_{tab['id']}")

    # Step 2: Open settings from each tab and verify
    print_step("Open settings from each tab")
    for tab in TABS:
        # Navigate to tab first
        await s.click_testid(tab["testid"])
        await s.wait(WAIT_NAV_CLICK)

        # Open settings
        r = await s.click_testid("btn-open-settings")
        await s.wait(WAIT_NAV_CLICK)

        if r == "ok":
            await s.screenshot(SC, f"settings_from_{tab['id']}")

            # Verify settings is open
            settings_visible = await s.ev('''(function(){
                var el=document.querySelector('[data-testid="btn-close-settings"]');
                return el?'settings open':'settings not found';
            })()''')
            print_result(f"  Settings from {tab['label']}", str(settings_visible), "settings open")

            # Close settings
            await s.click_testid("btn-close-settings")
            await s.wait(WAIT_MODAL_CLOSE)
        else:
            print_result(f"  Settings from {tab['label']}", "btn-open-settings not found")

    # Step 3: Navigate back and verify correct tab restored
    print_step("Verify tab restoration after settings")
    for tab in TABS:
        await s.click_testid(tab["testid"])
        await s.wait(WAIT_NAV_CLICK)

        # Open and close settings
        await s.click_testid("btn-open-settings")
        await s.wait(WAIT_QUICK_ACTION)
        await s.click_testid("btn-close-settings")
        await s.wait(WAIT_MODAL_CLOSE)

        # Verify we're back on the same tab
        restored_tab = await s.ev(f'''(function(){{
            var el=document.querySelector('[data-testid="{tab["testid"]}"]');
            if(!el)return'not found';
            var cls=el.className||'';
            var isActive=cls.includes('text-primary')||el.getAttribute('aria-selected')==='true';
            return isActive?'restored':'not restored';
        }})()''')
        print_result(f"  {tab['label']} tab restored", str(restored_tab), "restored")

    await s.screenshot(SC, "tab_restoration_verified")

    # Step 4: Rapid tab switching stress test
    print_step("Rapid tab switching (stress test)")
    for i in range(3):
        for tab in TABS:
            await s.click_testid(tab["testid"])
            await s.wait(0.2)
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SC, "rapid_switch_complete")

    # Verify app still functional after rapid switching
    final_check = await s.ev('''(function(){
        var nav=document.querySelector('[role="tablist"]');
        return nav?'nav intact':'nav missing';
    })()''')
    print_result("App stable after rapid switching", str(final_check), "nav intact")

    print(f"\n  ✅ SC38 complete")


# ═══════════════════════════════════════════════════════════
# SC42: Plan Day Editor
# ═══════════════════════════════════════════════════════════

async def sc42_plan_day_editor(s: CDPSession):
    """Test Plan Day Editor flow (exercise list, selector, unsaved changes)."""
    SC = "SC42"
    reset_steps(SC)
    print_header("SC42: Plan Day Editor")

    # Step 1: Navigate to Fitness → Plan subtab
    print_step("Navigate to Fitness → Plan subtab")
    await s.nav_fitness()
    await s.screenshot(SC, "fitness_tab")

    await s.subtab_plan()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SC, "plan_subtab")

    # Step 2: Check for today's workout card
    print_step("Check for today's workout card")
    workout_card = await s.ev('''(function(){
        var el=document.querySelector('[data-testid="today-workout-card"]');
        if(!el)return'not found';
        var r=el.getBoundingClientRect();
        return JSON.stringify({visible:r.width>0,text:el.textContent.trim().substring(0,100)});
    })()''')
    print_result("Today workout card", str(workout_card))
    await s.screenshot(SC, "today_workout_card")

    # Step 3: Click edit exercises button to open PlanDayEditor
    print_step("Click edit exercises button")
    edit_r = await s.click_testid("edit-exercises-btn")
    await s.wait(WAIT_NAV_CLICK)
    print_result("Edit exercises click", str(edit_r))
    await s.screenshot(SC, "plan_day_editor_opened")

    # Step 4: If editor not found via testid, try alternate approach
    if edit_r == "none":
        print_step("Trying alternate: click on a day card")
        # Look for any clickable day in the plan schedule
        day_click = await s.ev('''(function(){
            var items=document.querySelectorAll('[data-testid^="workout-item-"]');
            if(items.length>0){items[0].click();return'clicked workout item'}
            var dayCards=document.querySelectorAll('[class*="rounded-2xl"][class*="border"]');
            for(var i=0;i<dayCards.length;i++){
                var r=dayCards[i].getBoundingClientRect();
                if(r.width>0&&r.height>50){dayCards[i].click();return'clicked day card'}
            }
            return'no day cards found';
        })()''')
        await s.wait(WAIT_NAV_CLICK)
        print_result("Alternate click", str(day_click))
        await s.screenshot(SC, "alternate_editor_attempt")

    # Step 5: Screenshot exercise list in editor
    print_step("Screenshot exercise list in PlanDayEditor")
    exercise_list = await s.ev('''(function(){
        var names=document.querySelectorAll('[data-testid="exercise-name"]');
        if(names.length===0)return'no exercises found';
        var list=[];
        names.forEach(function(n){list.push(n.textContent.trim())});
        return JSON.stringify(list);
    })()''')
    print_result("Exercise list", str(exercise_list))
    await s.screenshot(SC, "exercise_list")

    # Step 6: Click "Thêm bài tập" to open ExerciseSelector
    print_step("Click 'Thêm bài tập' to open ExerciseSelector")
    add_exercise_r = await s.ev('''(function(){
        var btns=document.querySelectorAll('button');
        for(var i=btns.length-1;i>=0;i--){
            var t=btns[i].textContent.trim();
            if(t.includes('Thêm bài tập')){
                var r=btns[i].getBoundingClientRect();
                if(r.width>0){btns[i].click();return'ok'}
            }
        }
        return'none'
    })()''')
    await s.wait(WAIT_MODAL_OPEN)
    print_result("Add exercise click", str(add_exercise_r))
    await s.screenshot(SC, "exercise_selector_opened")

    # Step 7: Verify ExerciseSelector sheet
    print_step("Verify ExerciseSelector sheet")
    selector = await s.ev('''(function(){
        var el=document.querySelector('[data-testid="exercise-selector-sheet"]');
        if(!el)return'not found';
        var search=document.querySelector('[data-testid="exercise-search-input"]');
        var items=document.querySelectorAll('[data-testid^="exercise-item-"]');
        return JSON.stringify({visible:true,hasSearch:!!search,itemCount:items.length});
    })()''')
    print_result("Exercise Selector", str(selector))
    await s.screenshot(SC, "exercise_selector_sheet")

    # Step 8: Select an exercise
    print_step("Select first exercise from list")
    select_r = await s.ev('''(function(){
        var items=document.querySelectorAll('[data-testid^="exercise-item-"]');
        if(items.length===0)return'no items';
        var first=items[0];
        var name=first.textContent.trim().substring(0,40);
        first.click();
        return'selected: '+name;
    })()''')
    await s.wait(WAIT_QUICK_ACTION)
    print_result("Exercise selected", str(select_r))
    await s.screenshot(SC, "exercise_added")

    # Step 9: Press back to trigger UnsavedChangesDialog (if changes were made)
    print_step("Press back button to trigger UnsavedChangesDialog")
    # Back button: top-left, aria-label="Quay lại"
    back_r = await s.ev('''(function(){
        var btns=document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){
            var a=btns[i].getAttribute('aria-label')||'';
            var t=btns[i].textContent.trim();
            var r=btns[i].getBoundingClientRect();
            if((a.includes('Quay lại')||t.includes('Quay lại'))&&r.top<120&&r.left<200&&r.width>0){
                btns[i].click();
                return'clicked back'
            }
        }
        return'no back button found'
    })()''')
    await s.wait(WAIT_MODAL_OPEN)
    print_result("Back button click", str(back_r))
    await s.screenshot(SC, "unsaved_changes_dialog")

    # Step 10: Verify UnsavedChangesDialog content
    print_step("Verify UnsavedChangesDialog buttons")
    dialog = await s.ev('''(function(){
        var btns=document.querySelectorAll('button');
        var found={};
        var texts=['Lưu','quay lại','Bỏ thay đổi','Ở lại'];
        btns.forEach(function(b){
            var t=b.textContent.trim();
            var r=b.getBoundingClientRect();
            if(r.width>0){
                texts.forEach(function(search){
                    if(t.includes(search))found[search]=t;
                });
            }
        });
        return JSON.stringify(found);
    })()''')
    print_result("Dialog buttons", str(dialog))

    # Step 11: Click "Lưu & quay lại"
    print_step("Click 'Lưu & quay lại'")
    save_r = await s.ev('''(function(){
        var btns=document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){
            var t=btns[i].textContent.trim();
            if(t.includes('Lưu')&&t.includes('quay lại')){
                var r=btns[i].getBoundingClientRect();
                if(r.width>0){btns[i].click();return'ok: '+t}
            }
        }
        // Fallback: try discard button
        for(var i=0;i<btns.length;i++){
            var t=btns[i].textContent.trim();
            if(t.includes('Bỏ thay đổi')){
                var r=btns[i].getBoundingClientRect();
                if(r.width>0){btns[i].click();return'discarded: '+t}
            }
        }
        return'no save/discard button found'
    })()''')
    await s.wait(WAIT_NAV_CLICK)
    print_result("Save & back", str(save_r))
    await s.screenshot(SC, "after_save_and_back")

    print(f"\n  ✅ SC42 complete")


# ═══════════════════════════════════════════════════════════
# SC43: Freestyle Workout
# ═══════════════════════════════════════════════════════════

async def sc43_freestyle_workout(s: CDPSession):
    """Test Freestyle Workout flow (AddSessionModal, workout logger)."""
    SC = "SC43"
    reset_steps(SC)
    print_header("SC43: Freestyle Workout")

    # Step 1: Navigate to Fitness tab
    print_step("Navigate to Fitness tab")
    await s.nav_fitness()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SC, "fitness_tab")

    # Step 2: Switch to Plan subtab (where workout actions are)
    print_step("Switch to Plan subtab")
    await s.subtab_plan()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SC, "plan_subtab")

    # Step 3: Look for start workout button or add workout button
    print_step("Find workout start/add button")
    workout_btn = await s.ev('''(function(){
        var candidates=[
            'start-workout-btn',
            'rest-add-workout-btn',
            'ctx-add-workout'
        ];
        for(var i=0;i<candidates.length;i++){
            var btn=document.querySelector('[data-testid="'+candidates[i]+'"]');
            if(btn){
                var r=btn.getBoundingClientRect();
                if(r.width>0)return JSON.stringify({testid:candidates[i],text:btn.textContent.trim()});
            }
        }
        return'no workout button found';
    })()''')
    print_result("Workout button", str(workout_btn))

    # Step 4: Click start workout button
    print_step("Click start workout button")
    start_r = await s.ev('''(function(){
        var candidates=['start-workout-btn','rest-add-workout-btn','ctx-add-workout'];
        for(var i=0;i<candidates.length;i++){
            var btn=document.querySelector('[data-testid="'+candidates[i]+'"]');
            if(btn){
                var r=btn.getBoundingClientRect();
                if(r.width>0){btn.click();return'clicked: '+candidates[i]}
            }
        }
        // Fallback: find any button with "Bắt đầu" or "Tập"
        var btns=document.querySelectorAll('button');
        for(var j=0;j<btns.length;j++){
            var t=btns[j].textContent.trim();
            if(t.includes('Bắt đầu tập')||t.includes('Bắt đầu buổi')){
                var r=btns[j].getBoundingClientRect();
                if(r.width>0){btns[j].click();return'clicked text: '+t}
            }
        }
        return'none'
    })()''')
    await s.wait(WAIT_MODAL_OPEN)
    print_result("Start workout click", str(start_r))
    await s.screenshot(SC, "workout_start_triggered")

    # Step 5: Check if WorkoutLogger opened directly or AddSessionModal appeared
    print_step("Check for WorkoutLogger or AddSessionModal")
    workout_state = await s.ev('''(function(){
        var logger=document.querySelector('[data-testid="workout-logger"]');
        if(logger)return'workout-logger opened';
        // Check for AddSessionModal options (Strength, Cardio, Freestyle)
        var options=[];
        var btns=document.querySelectorAll('button');
        btns.forEach(function(b){
            var t=b.textContent.trim();
            if(t.includes('Sức mạnh')||t.includes('Strength'))options.push('strength');
            if(t.includes('Cardio')||t.includes('Tim mạch'))options.push('cardio');
            if(t.includes('Freestyle')||t.includes('Tự do'))options.push('freestyle');
        });
        if(options.length>0)return'add-session-modal: '+options.join(',');
        return'unknown state';
    })()''')
    print_result("Workout state", str(workout_state))
    await s.screenshot(SC, "workout_or_modal_state")

    # Step 6: If AddSessionModal is open, click Freestyle option
    if "freestyle" in str(workout_state).lower() or "add-session-modal" in str(workout_state):
        print_step("Click Freestyle option in AddSessionModal")
        freestyle_r = await s.ev('''(function(){
            var btns=document.querySelectorAll('button');
            for(var i=0;i<btns.length;i++){
                var t=btns[i].textContent.trim();
                if(t.includes('Freestyle')||t.includes('Tự do')||t.includes('tự do')){
                    var r=btns[i].getBoundingClientRect();
                    if(r.width>0){btns[i].click();return'ok: '+t}
                }
            }
            return'none'
        })()''')
        await s.wait(WAIT_MODAL_OPEN)
        print_result("Freestyle click", str(freestyle_r))
        await s.screenshot(SC, "freestyle_selected")

    # Step 7: Screenshot WorkoutLogger if opened
    print_step("Screenshot WorkoutLogger")
    logger_state = await s.ev('''(function(){
        var logger=document.querySelector('[data-testid="workout-logger"]');
        if(!logger)return'not found';
        var header=document.querySelector('[data-testid="workout-header"]');
        var addBtn=document.querySelector('[data-testid="add-exercise-button"]');
        return JSON.stringify({
            visible:true,
            hasHeader:!!header,
            hasAddBtn:!!addBtn,
            headerText:header?header.textContent.trim().substring(0,60):''
        });
    })()''')
    print_result("WorkoutLogger", str(logger_state))
    await s.screenshot(SC, "workout_logger")

    # Step 8: Check add exercise area in workout logger
    if "visible" in str(logger_state) and "true" in str(logger_state):
        print_step("Screenshot add exercise area")
        add_area = await s.ev('''(function(){
            var container=document.querySelector('[data-testid="add-exercise-container"]');
            var addBtn=document.querySelector('[data-testid="add-exercise-button"]');
            return JSON.stringify({
                container:!!container,
                addBtn:!!addBtn,
                addBtnText:addBtn?addBtn.textContent.trim():''
            });
        })()''')
        print_result("Add exercise area", str(add_area))
        await s.screenshot(SC, "add_exercise_area")

        # Step 9: Click add exercise to open selector
        print_step("Click add exercise button")
        add_r = await s.click_testid("add-exercise-button")
        await s.wait(WAIT_MODAL_OPEN)
        print_result("Add exercise click", str(add_r))
        await s.screenshot(SC, "exercise_selector_in_workout")

        # Step 10: Verify exercise selector opened
        print_step("Verify exercise selector in workout")
        selector = await s.ev('''(function(){
            var el=document.querySelector('[data-testid="exercise-selector-sheet"]');
            if(!el)return'not found';
            var items=document.querySelectorAll('[data-testid^="exercise-item-"]');
            return JSON.stringify({visible:true,itemCount:items.length});
        })()''')
        print_result("Exercise selector", str(selector))

        # Step 11: Select an exercise
        print_step("Select exercise for freestyle workout")
        select_r = await s.ev('''(function(){
            var items=document.querySelectorAll('[data-testid^="exercise-item-"]');
            if(items.length===0)return'no items';
            items[0].click();
            return'selected first exercise';
        })()''')
        await s.wait(WAIT_QUICK_ACTION)
        print_result("Exercise selected", str(select_r))
        await s.screenshot(SC, "exercise_added_to_workout")

        # Step 12: Screenshot the active workout with exercise
        print_step("Screenshot active workout with exercise")
        exercise_sections = await s.ev('''(function(){
            var sections=document.querySelectorAll('[data-testid^="exercise-section-"]');
            if(sections.length===0)return'no exercise sections';
            var info=[];
            sections.forEach(function(s){
                info.push(s.textContent.trim().substring(0,60));
            });
            return JSON.stringify(info);
        })()''')
        print_result("Exercise sections", str(exercise_sections))
        await s.screenshot(SC, "active_workout_with_exercise")

    # Step 13: Try to exit workout (back button)
    print_step("Exit workout logger")
    back_r = await s.ev('''(function(){
        var btn=document.querySelector('[data-testid="back-button"]');
        if(btn){btn.click();return'clicked back-button'}
        var btns=document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){
            var a=btns[i].getAttribute('aria-label')||'';
            if(a.includes('Quay lại')||a.includes('Back')){
                var r=btns[i].getBoundingClientRect();
                if(r.width>0&&r.top<120){btns[i].click();return'clicked back aria'}
            }
        }
        return'no back found'
    })()''')
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(SC, "workout_exit_dialog")

    # Handle confirmation dialog if appears
    confirm_exit = await s.ev('''(function(){
        var btns=document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){
            var t=btns[i].textContent.trim();
            if(t.includes('Bỏ thay đổi')||t.includes('Kết thúc')||t.includes('Thoát')){
                var r=btns[i].getBoundingClientRect();
                if(r.width>0){btns[i].click();return'exited: '+t}
            }
        }
        // Also try cancel/confirm action buttons
        var cancel=document.querySelector('[data-testid="btn-confirm-action"]');
        if(cancel&&cancel.getBoundingClientRect().width>0){cancel.click();return'confirmed exit'}
        return'no exit dialog'
    })()''')
    await s.wait(WAIT_NAV_CLICK)
    print_result("Exit workout", str(confirm_exit))
    await s.screenshot(SC, "after_workout_exit")

    print(f"\n  ✅ SC43 complete")


# ═══════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════

async def main():
    print("\n" + "═" * 60)
    print("  GROUP I — Cross-feature E2E Tests")
    print("  SC38: Cross-feature Navigation")
    print("  SC42: Plan Day Editor")
    print("  SC43: Freestyle Workout")
    print("═" * 60)

    s = await setup_fresh(full_onboard=True, scenario="SC38")

    try:
        await sc38_cross_feature_navigation(s)
        await sc42_plan_day_editor(s)
        await sc43_freestyle_workout(s)

        print("\n" + "═" * 60)
        print("  ✅ GROUP I — All scenarios complete")
        print("═" * 60)
    finally:
        await s.ws.close()


if __name__ == "__main__":
    run_scenario(main())
