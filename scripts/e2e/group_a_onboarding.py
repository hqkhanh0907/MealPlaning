"""
Group A — Onboarding + Settings + Goal
Scenarios: SC25 (Fitness Onboarding), SC08 (Settings & Config), SC09 (Goal Settings)

Pre-conditions: Fresh install, full onboarding with default values.
  Male, 75kg, 175cm, DOB=1996-05-15, moderate activity, cut-moderate goal.

Run: python scripts/e2e/group_a_onboarding.py
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
    WAIT_SAVE_SETTINGS,
    WAIT_MODAL_OPEN,
)

# Expected values (calculated dynamically)
DOB = "1996-05-15"
WEIGHT = 75
HEIGHT = 175
GENDER = "male"
ACTIVITY = "moderate"
GOAL = "cut"
RATE = "moderate"

AGE = calc_age(DOB)
BMR = calc_bmr(WEIGHT, HEIGHT, AGE, GENDER)
TDEE = calc_tdee(BMR, ACTIVITY)
TARGET = calc_target(TDEE, GOAL, RATE)


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


async def sc25_fitness_onboarding(s):
    """SC25: Fitness Tab & Onboarding verification.
    full_onboarding() already ran during setup — verify fitness tab access + sub-tabs.
    """
    sc = "SC25"
    reset_steps(sc)
    print(f"\n{'─'*50}")
    print(f"📋 SC25: Fitness Tab & Onboarding Verification")
    print(f"{'─'*50}")

    # Navigate to Fitness tab
    await s.nav_fitness()
    await s.screenshot(sc, "fitness_tab_home")

    # Verify fitness tab is accessible
    tab_visible = await s.ev(
        'document.querySelector(\'[data-testid="fitness-tab"]\')?"yes":"no"'
    )
    check(sc, "Fitness tab visible", "yes", tab_visible)

    # Verify sub-tabs exist: Plan, History, Progress (no Workout tab per test file)
    for subtab in ["plan", "history", "progress"]:
        exists = await s.ev(
            f'document.querySelector(\'[data-testid="subtab-{subtab}"]\')?'
            f'"yes":"no"'
        )
        check(sc, f"Subtab '{subtab}' exists", "yes", exists)

    # Screenshot Plan sub-tab (default active)
    plan_active = await s.ev(
        'document.querySelector(\'[data-testid="subtab-plan"]\')'
        '?.getAttribute("aria-selected")||"N/A"'
    )
    check(sc, "Plan subtab active by default", "true", plan_active)
    await s.screenshot(sc, "subtab_plan_content")

    # Switch to History sub-tab
    await s.click_testid("subtab-history")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "subtab_history_content")
    history_active = await s.ev(
        'document.querySelector(\'[data-testid="subtab-history"]\')'
        '?.getAttribute("aria-selected")||"N/A"'
    )
    check(sc, "History subtab active after click", "true", history_active)

    # Switch to Progress sub-tab
    await s.click_testid("subtab-progress")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "subtab_progress_content")
    progress_active = await s.ev(
        'document.querySelector(\'[data-testid="subtab-progress"]\')'
        '?.getAttribute("aria-selected")||"N/A"'
    )
    check(sc, "Progress subtab active after click", "true", progress_active)

    # Switch back to Plan sub-tab
    await s.click_testid("subtab-plan")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "subtab_plan_back")

    # Verify plan content area exists
    plan_content = await s.ev(
        'document.querySelector(\'[data-testid="plan-subtab-content"]\')?'
        '"yes":"no"'
    )
    check(sc, "Plan content area rendered", "yes", plan_content)

    print(f"\n  SC25 complete ✅")


async def sc08_settings_config(s):
    """SC08: Settings & Config.
    Open settings, browse sections, verify health profile fields.
    """
    sc = "SC08"
    reset_steps(sc)
    print(f"\n{'─'*50}")
    print(f"📋 SC08: Settings & Config")
    print(f"{'─'*50}")

    # Navigate to dashboard first (settings button is in header)
    await s.nav_dashboard()
    await s.wait(WAIT_NAV_CLICK)

    # Open settings
    r = await s.open_settings()
    check(sc, "Open settings", "ok", r)
    await s.screenshot(sc, "settings_main_page")

    # Verify settings menu sections exist
    for section in ["health-profile", "goal", "training-profile"]:
        exists = await s.ev(
            f'document.querySelector(\'[data-testid="settings-nav-{section}"]\')?'
            f'"yes":"no"'
        )
        check(sc, f"Settings nav '{section}' exists", "yes", exists)

    # Verify search input
    search_exists = await s.ev(
        'document.querySelector(\'[data-testid="settings-search"]\')?'
        '"yes":"no"'
    )
    check(sc, "Settings search input exists", "yes", search_exists)

    # Verify BMR/TDEE summary on health profile card
    hp_summary = await s.ev(
        'document.querySelector(\'[data-testid="settings-nav-health-profile"]\')'
        '?.textContent||"N/A"'
    )
    check(sc, f"Health profile shows BMR:{BMR}", str(BMR), hp_summary)
    check(sc, f"Health profile shows TDEE:{TDEE}", str(TDEE), hp_summary)
    await s.screenshot(sc, "settings_menu_with_summaries")

    # --- Health Profile Detail ---
    await s.click_testid("settings-nav-health-profile")
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "health_profile_view")

    # Verify detail layout rendered
    detail_layout = await s.ev(
        'document.querySelector(\'[data-testid="settings-detail-layout"]\')?'
        '"yes":"no"'
    )
    check(sc, "Health profile detail layout rendered", "yes", detail_layout)

    # Click edit button
    await s.click_testid("settings-detail-edit")
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(sc, "health_profile_edit_form")

    # Verify form fields exist
    for field_tid in ["hp-name", "hp-dob", "hp-height", "hp-weight"]:
        exists = await s.ev(
            f'document.querySelector(\'[data-testid="{field_tid}"]\')?'
            f'"yes":"no"'
        )
        check(sc, f"Edit form field '{field_tid}' exists", "yes", exists)

    # Verify field values match onboarding input
    name_val = await s.ev(
        'document.querySelector(\'[data-testid="hp-name"]\')?.value||"N/A"'
    )
    check(sc, "Name field value", "QA Tester", name_val)

    height_val = await s.ev(
        'document.querySelector(\'[data-testid="hp-height"]\')?.value||"N/A"'
    )
    check(sc, "Height field value", "175", height_val)

    weight_val = await s.ev(
        'document.querySelector(\'[data-testid="hp-weight"]\')?.value||"N/A"'
    )
    check(sc, "Weight field value", "75", weight_val)

    # Verify activity select
    activity_select = await s.ev('''(function(){
        var form=document.querySelector('[data-testid="health-profile-form"]');
        if(!form) return 'no form';
        var sel=form.querySelector('select');
        return sel?sel.value:'no select';
    })()''')
    check(sc, "Activity level select", "moderate", activity_select)
    await s.screenshot(sc, "health_profile_form_values")

    # Cancel editing
    await s.click_testid("settings-detail-cancel")
    await s.wait(WAIT_SAVE_SETTINGS)
    await s.screenshot(sc, "health_profile_cancel_back")

    # Back to settings menu
    await s.click_testid("settings-detail-back")
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "settings_menu_after_hp_back")

    # --- Training Profile Section ---
    await s.click_testid("settings-nav-training-profile")
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "training_profile_view")

    training_layout = await s.ev(
        'document.querySelector(\'[data-testid="settings-detail-layout"]\')?'
        '"yes":"no"'
    )
    check(sc, "Training profile detail layout rendered", "yes", training_layout)

    # Back to settings menu
    await s.click_testid("settings-detail-back")
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "settings_menu_after_tp_back")

    # --- Theme section (inline, no navigation) ---
    theme_section = await s.ev('''(function(){
        var btns=document.querySelectorAll('button[data-testid^="theme-"]');
        return btns.length>0?"yes":"no";
    })()''')
    # Theme buttons may not have testids — check by text
    if theme_section == "no":
        theme_section = await s.ev('''(function(){
            var all=document.querySelectorAll('button');
            for(var i=0;i<all.length;i++){
                var t=all[i].textContent.trim();
                if(t==='Sáng'||t==='Tối'||t==='Hệ thống') return 'yes';
            }
            return 'no';
        })()''')
    check(sc, "Theme options visible in settings", "yes", theme_section)
    await s.screenshot(sc, "settings_theme_section")

    # Close settings
    await s.close_settings()
    await s.screenshot(sc, "settings_closed")

    print(f"\n  SC08 complete ✅")


async def sc09_goal_settings(s):
    """SC09: Goal Settings.
    Open goal settings, verify goal type/rate, test each option, save, verify dashboard.
    """
    sc = "SC09"
    reset_steps(sc)
    print(f"\n{'─'*50}")
    print(f"📋 SC09: Goal Settings")
    print(f"{'─'*50}")

    # Capture dashboard baseline before goal change
    await s.nav_dashboard()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "dashboard_baseline")

    # Open settings → goal section
    await s.open_settings()
    await s.wait(WAIT_NAV_CLICK)
    await s.click_testid("settings-nav-goal")
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "goal_view_page")

    # Verify goal view is rendered (read-only view)
    goal_view = await s.ev(
        'document.querySelector(\'[data-testid="goal-view"]\')?'
        '"yes":"no"'
    )
    # May be goal-view or goal-view-empty depending on state
    if goal_view == "no":
        goal_view = await s.ev(
            'document.querySelector(\'[data-testid="goal-view-empty"]\')?'
            '"yes":"no"'
        )
        check(sc, "Goal view rendered (empty)", "yes", goal_view)
    else:
        check(sc, "Goal view rendered", "yes", goal_view)

    # Click edit
    await s.click_testid("settings-detail-edit")
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(sc, "goal_edit_form")

    # Verify goal type buttons exist
    for goal_type in ["cut", "maintain", "bulk"]:
        exists = await s.ev(
            f'document.querySelector(\'[data-testid="goal-type-{goal_type}"]\')?'
            f'"yes":"no"'
        )
        check(sc, f"Goal type button '{goal_type}' exists", "yes", exists)

    # Verify rate selector exists
    rate_sel = await s.ev(
        'document.querySelector(\'[data-testid="rate-selector"]\')?'
        '"yes":"no"'
    )
    check(sc, "Rate selector exists", "yes", rate_sel)

    # Verify rate buttons exist
    for rate in ["conservative", "moderate", "aggressive"]:
        exists = await s.ev(
            f'document.querySelector(\'[data-testid="rate-{rate}"]\')?'
            f'"yes":"no"'
        )
        check(sc, f"Rate button '{rate}' exists", "yes", exists)

    # --- Test CUT goal with each rate ---
    await s.click_testid("goal-type-cut")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "goal_cut_selected")

    # Conservative rate
    await s.click_testid("rate-conservative")
    await s.wait(WAIT_QUICK_ACTION)
    offset_text = await s.get_text("calorie-offset-display")
    check(sc, "Cut conservative offset", "-275", offset_text)
    await s.screenshot(sc, "cut_conservative_offset")

    # Moderate rate
    await s.click_testid("rate-moderate")
    await s.wait(WAIT_QUICK_ACTION)
    offset_text = await s.get_text("calorie-offset-display")
    check(sc, "Cut moderate offset", "-550", offset_text)
    await s.screenshot(sc, "cut_moderate_offset")

    # Aggressive rate
    await s.click_testid("rate-aggressive")
    await s.wait(WAIT_QUICK_ACTION)
    offset_text = await s.get_text("calorie-offset-display")
    check(sc, "Cut aggressive offset", "-1100", offset_text)
    await s.screenshot(sc, "cut_aggressive_offset")

    # --- Test MAINTAIN goal ---
    await s.click_testid("goal-type-maintain")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "goal_maintain_selected")
    offset_text = await s.get_text("calorie-offset-display")
    check(sc, "Maintain offset", "±0", offset_text)

    # --- Test BULK goal with each rate ---
    await s.click_testid("goal-type-bulk")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "goal_bulk_selected")

    await s.click_testid("rate-conservative")
    await s.wait(WAIT_QUICK_ACTION)
    offset_text = await s.get_text("calorie-offset-display")
    check(sc, "Bulk conservative offset", "+275", offset_text)
    await s.screenshot(sc, "bulk_conservative_offset")

    await s.click_testid("rate-moderate")
    await s.wait(WAIT_QUICK_ACTION)
    offset_text = await s.get_text("calorie-offset-display")
    check(sc, "Bulk moderate offset", "+550", offset_text)

    await s.click_testid("rate-aggressive")
    await s.wait(WAIT_QUICK_ACTION)
    offset_text = await s.get_text("calorie-offset-display")
    check(sc, "Bulk aggressive offset", "+1100", offset_text)
    await s.screenshot(sc, "bulk_aggressive_offset")

    # --- Set goal to MAINTAIN and save (change from cut-moderate) ---
    await s.click_testid("goal-type-maintain")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(sc, "goal_maintain_before_save")

    # Save
    await s.click_testid("settings-detail-save")
    await s.wait(WAIT_SAVE_SETTINGS)
    await s.screenshot(sc, "goal_saved_maintain")

    # Verify view mode shows updated goal
    goal_view_text = await s.ev('''(function(){
        var v=document.querySelector('[data-testid="goal-view"]');
        return v?v.textContent:'N/A';
    })()''')
    check(sc, "Goal view shows maintain", "Giữ cân", goal_view_text)

    # Close settings and verify dashboard
    # settings-detail-back first to return to settings menu
    await s.click_testid("settings-detail-back")
    await s.wait(WAIT_NAV_CLICK)
    await s.close_settings()
    await s.wait(WAIT_NAV_CLICK)

    # Dashboard should show updated target = TDEE (maintain, offset=0)
    await s.nav_dashboard()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "dashboard_after_maintain")

    # --- Revert goal back to CUT MODERATE ---
    await s.open_settings()
    await s.wait(WAIT_NAV_CLICK)
    await s.click_testid("settings-nav-goal")
    await s.wait(WAIT_NAV_CLICK)
    await s.click_testid("settings-detail-edit")
    await s.wait(WAIT_MODAL_OPEN)

    await s.click_testid("goal-type-cut")
    await s.wait(WAIT_QUICK_ACTION)
    await s.click_testid("rate-moderate")
    await s.wait(WAIT_QUICK_ACTION)
    offset_text = await s.get_text("calorie-offset-display")
    check(sc, "Reverted cut moderate offset", "-550", offset_text)

    await s.click_testid("settings-detail-save")
    await s.wait(WAIT_SAVE_SETTINGS)
    await s.screenshot(sc, "goal_reverted_cut_moderate")

    # Close settings
    await s.click_testid("settings-detail-back")
    await s.wait(WAIT_NAV_CLICK)
    await s.close_settings()
    await s.wait(WAIT_NAV_CLICK)

    # Verify dashboard restored
    await s.nav_dashboard()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(sc, "dashboard_after_revert")

    print(f"\n  SC09 complete ✅")


async def main():
    """Run Group A: SC25 → SC08 → SC09 in a single session."""
    print("=" * 60)
    print("🧪 GROUP A: Onboarding + Settings + Goal")
    print(f"   Expected: AGE={AGE}, BMR={BMR}, TDEE={TDEE}, TARGET={TARGET}")
    print("=" * 60)

    # Fresh install + full onboarding (screenshots captured by framework)
    s = await setup_fresh(full_onboard=True, scenario="SC25_OB")

    # SC25: Fitness tab verification (onboarding already done)
    await sc25_fitness_onboarding(s)

    # SC08: Settings & Config (reuses same session)
    await sc08_settings_config(s)

    # SC09: Goal Settings (reuses same session)
    await sc09_goal_settings(s)

    # === FINAL REPORT ===
    print(f"\n{'='*60}")
    print("📊 GROUP A — TEST REPORT")
    print(f"{'='*60}")
    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    failed = sum(1 for r in RESULTS if r["status"] == "FAIL")
    total = len(RESULTS)
    print(f"  Total: {total} | ✅ Passed: {passed} | ❌ Failed: {failed}")
    print(f"  Pass rate: {passed/total*100:.1f}%" if total > 0 else "  No tests run")

    if failed > 0:
        print(f"\n  ❌ FAILED ASSERTIONS:")
        for r in RESULTS:
            if r["status"] == "FAIL":
                print(f"    [{r['tc']}] {r['step']}: expected={r['expected']}, actual={r['actual']}")

    print(f"\n{'='*60}")
    print("✅ Group A complete" if failed == 0 else "⚠️  Group A has failures")
    print(f"{'='*60}")


if __name__ == "__main__":
    run_scenario(main())
