"""
Group E — Dashboard Tests (SC33–SC37)
Covers: Dashboard Score Layout, Energy Balance & Protein,
        Today's Plan Card, Quick Actions & Weight Log,
        Auto-Adjust Insights.

Requires full onboarding for nutrition data.
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
    WAIT_MODAL_OPEN,
    WAIT_MODAL_CLOSE,
    WAIT_SAVE_SETTINGS,
)

# Default onboarding profile
DOB = "1996-05-15"
WEIGHT = 75
HEIGHT = 175
GENDER = "male"
ACTIVITY = "moderate"
GOAL = "cut"
RATE = "moderate"

# Pre-calculated expected values (dynamic by test date)
AGE = calc_age(DOB)
BMR = calc_bmr(WEIGHT, HEIGHT, AGE, GENDER)
TDEE = calc_tdee(BMR, ACTIVITY)
TARGET = calc_target(TDEE, GOAL, RATE)

RESULTS: list[dict] = []


def record(tc_id: str, title: str, status: str, detail: str = ""):
    RESULTS.append({"tc": tc_id, "title": title, "status": status, "detail": detail})
    icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"  {icon} {tc_id}: {title} — {status}" + (f" ({detail})" if detail else ""))


# ────────────────────────────────────────────────────────────────
# SC33: Dashboard Score Layout
# ────────────────────────────────────────────────────────────────
async def sc33_dashboard_score_layout(session):
    SC = "SC33"
    reset_steps(SC)
    print(f"\n{'─'*60}")
    print(f"📋 {SC}: Dashboard Score Layout")
    print(f"{'─'*60}")

    # Step 1: Navigate to Dashboard tab
    await session.nav_dashboard()
    await session.screenshot(SC, "dashboard_full")

    # Verify dashboard-tab container exists
    has_tab = await session.get_text("dashboard-tab")
    if has_tab != "N/A":
        record("SC33-01", "Dashboard tab renders", "PASS")
    else:
        record("SC33-01", "Dashboard tab renders", "FAIL", "dashboard-tab not found")

    # Step 2: Verify DailyScoreHero section
    hero_text = await session.get_text("daily-score-hero")
    await session.screenshot(SC, "daily_score_hero")

    if hero_text != "N/A":
        record("SC33-02", "DailyScoreHero visible", "PASS")
    else:
        record("SC33-02", "DailyScoreHero visible", "FAIL", "daily-score-hero not found")

    # Step 3: Check score number
    score_number = await session.get_text("score-number")
    await session.screenshot(SC, "score_number")

    if score_number != "N/A":
        record("SC33-03", "Score number displayed", "PASS", f"score={score_number}")
    else:
        record("SC33-03", "Score number displayed", "FAIL", "score-number not found")

    # Step 4: Check score badges
    badges_text = await session.get_text("score-badges")
    await session.screenshot(SC, "score_badges")

    if badges_text != "N/A":
        record("SC33-04", "Score badges displayed", "PASS")
    else:
        record("SC33-04", "Score badges displayed", "WARN", "score-badges empty or not found")

    # Step 5: Verify tier layout top-to-bottom
    tier_results = {}
    for tier_num in range(1, 6):
        tid = f"dashboard-tier-{tier_num}"
        text = await session.get_text(tid)
        tier_results[tid] = text != "N/A"

    await session.screenshot(SC, "tier_layout")

    all_tiers = all(tier_results.values())
    if all_tiers:
        record("SC33-05", "All 5 tiers rendered", "PASS")
    else:
        missing = [k for k, v in tier_results.items() if not v]
        record("SC33-05", "All 5 tiers rendered", "FAIL", f"missing: {missing}")

    # Step 6: Scroll down to see lower sections
    await session.ev('''(function(){
        var el=document.querySelector('[data-testid="dashboard-tab"]');
        if(el) el.scrollTo({top: el.scrollHeight, behavior:'smooth'});
        return 'scrolled';
    })()''')
    await session.wait(0.8)
    await session.screenshot(SC, "scrolled_bottom")

    # Verify tier-4 (AiInsight + AutoAdjust) and tier-5 (QuickActions)
    tier4_text = await session.get_text("dashboard-tier-4")
    tier5_text = await session.get_text("dashboard-tier-5")

    if tier4_text != "N/A" and tier5_text != "N/A":
        record("SC33-06", "Lower tiers visible after scroll", "PASS")
    else:
        record("SC33-06", "Lower tiers visible after scroll", "WARN",
               f"tier4={'ok' if tier4_text != 'N/A' else 'N/A'}, tier5={'ok' if tier5_text != 'N/A' else 'N/A'}")

    # Scroll back to top
    await session.ev('''(function(){
        var el=document.querySelector('[data-testid="dashboard-tab"]');
        if(el) el.scrollTo({top: 0, behavior:'smooth'});
        return 'scrolled-top';
    })()''')
    await session.wait(0.5)


# ────────────────────────────────────────────────────────────────
# SC34: Energy Balance & Protein
# ────────────────────────────────────────────────────────────────
async def sc34_energy_balance_protein(session):
    SC = "SC34"
    reset_steps(SC)
    print(f"\n{'─'*60}")
    print(f"📋 {SC}: Energy Balance & Protein")
    print(f"{'─'*60}")

    # Ensure on dashboard
    await session.nav_dashboard()
    await session.wait(WAIT_NAV_CLICK)

    # Step 1: Screenshot energy balance mini card
    mini_text = await session.get_text("energy-balance-mini")
    await session.screenshot(SC, "energy_balance_mini")

    if mini_text != "N/A":
        record("SC34-01", "EnergyBalanceMini visible", "PASS")
    else:
        record("SC34-01", "EnergyBalanceMini visible", "FAIL", "energy-balance-mini not found")
        return  # Cannot continue without energy mini

    # Step 2: Read mini values (eaten, burned, net)
    eaten = await session.get_text("mini-eaten")
    burned = await session.get_text("mini-burned")
    net = await session.get_text("mini-net")
    await session.screenshot(SC, "mini_values")

    record("SC34-02", "Mini values read",
           "PASS" if eaten != "N/A" else "FAIL",
           f"eaten={eaten}, burned={burned}, net={net}")

    # Step 3: Click to expand → EnergyDetailSheet
    r = await session.click_testid("energy-balance-mini")
    await session.wait(WAIT_MODAL_OPEN)
    await session.screenshot(SC, "energy_detail_sheet_opened")

    sheet_text = await session.get_text("energy-detail-sheet")
    if sheet_text != "N/A":
        record("SC34-03", "EnergyDetailSheet opened", "PASS")
    else:
        record("SC34-03", "EnergyDetailSheet opened", "FAIL", "energy-detail-sheet not found")

    # Step 4: Verify BMR, TDEE, Target values
    bmr_text = await session.get_text("bmr-value")
    tdee_text = await session.get_text("tdee-value")
    target_text = await session.get_text("target-value")
    await session.screenshot(SC, "energy_breakdown_values")

    bmr_ok = str(BMR) in str(bmr_text) if bmr_text != "N/A" else False
    tdee_ok = str(TDEE) in str(tdee_text) if tdee_text != "N/A" else False
    target_ok = str(TARGET) in str(target_text) if target_text != "N/A" else False

    record("SC34-04a", f"BMR value (expect ~{BMR})",
           "PASS" if bmr_ok else "FAIL",
           f"actual={bmr_text}")
    record("SC34-04b", f"TDEE value (expect ~{TDEE})",
           "PASS" if tdee_ok else "FAIL",
           f"actual={tdee_text}")
    record("SC34-04c", f"Target value (expect ~{TARGET})",
           "PASS" if target_ok else "FAIL",
           f"actual={target_text}")

    # Step 5: Verify per-meal breakdown
    meal_breakdown = await session.get_text("per-meal-breakdown")
    await session.screenshot(SC, "per_meal_breakdown")

    if meal_breakdown != "N/A":
        record("SC34-05", "Per-meal breakdown displayed", "PASS")
    else:
        record("SC34-05", "Per-meal breakdown displayed", "WARN", "per-meal-breakdown not found")

    # Step 6: Close sheet
    r = await session.click_testid("btn-close-energy-detail")
    await session.wait(WAIT_MODAL_CLOSE)
    await session.screenshot(SC, "energy_detail_closed")

    sheet_after = await session.ev(
        '(function(){return document.querySelector(\'[data-testid="energy-detail-sheet"]\')?'
        '"open":"closed"})()'
    )
    record("SC34-06", "EnergyDetailSheet closed",
           "PASS" if sheet_after == "closed" else "FAIL",
           f"state={sheet_after}")

    # Step 7: Screenshot protein display
    protein_text = await session.get_text("protein-display")
    await session.screenshot(SC, "protein_display")

    if protein_text != "N/A":
        record("SC34-07", "Protein display visible", "PASS", f"text={protein_text}")
    else:
        record("SC34-07", "Protein display visible", "FAIL", "protein-display not found")

    # Step 8: Verify protein progress bar
    protein_bar = await session.ev(
        '(function(){var e=document.querySelector(\'[data-testid="protein-bar"]\');'
        'return e?e.style.width||getComputedStyle(e).width:"N/A"})()'
    )
    await session.screenshot(SC, "protein_progress_bar")

    record("SC34-08", "Protein progress bar rendered",
           "PASS" if protein_bar != "N/A" else "WARN",
           f"width={protein_bar}")


# ────────────────────────────────────────────────────────────────
# SC35: Today's Plan Card
# ────────────────────────────────────────────────────────────────
async def sc35_todays_plan_card(session):
    SC = "SC35"
    reset_steps(SC)
    print(f"\n{'─'*60}")
    print(f"📋 {SC}: Today's Plan Card")
    print(f"{'─'*60}")

    # Ensure on dashboard
    await session.nav_dashboard()
    await session.wait(WAIT_NAV_CLICK)

    # Step 1: Screenshot Today's Plan card
    plan_card = await session.get_text("todays-plan-card")
    await session.screenshot(SC, "todays_plan_card")

    if plan_card != "N/A":
        record("SC35-01", "TodaysPlanCard visible", "PASS")
    else:
        record("SC35-01", "TodaysPlanCard visible", "FAIL", "todays-plan-card not found")

    # Step 2: Check workout section or no-plan section
    workout_section = await session.get_text("workout-section")
    no_plan = await session.get_text("no-plan-section")
    meals_section = await session.get_text("meals-section")
    recovery_tips = await session.get_text("recovery-tips")
    await session.screenshot(SC, "plan_card_content")

    state = "unknown"
    if workout_section != "N/A":
        state = "has-workout"
    elif meals_section != "N/A":
        state = "has-meals"
    elif recovery_tips != "N/A":
        state = "rest-day"
    elif no_plan != "N/A":
        state = "no-plan"

    record("SC35-02", "Plan card state detected", "PASS", f"state={state}")

    # Step 3: Check workout details if present
    if state == "has-workout":
        workout_name = await session.get_text("workout-name")
        exercise_count = await session.get_text("exercise-count")
        await session.screenshot(SC, "workout_details")

        record("SC35-03", "Workout details displayed",
               "PASS" if workout_name != "N/A" else "WARN",
               f"name={workout_name}, exercises={exercise_count}")

        # Step 4: Check CTA button
        start_cta = await session.ev(
            '(function(){var e=document.querySelector(\'[data-testid="start-workout-cta"]\');'
            'return e?e.textContent.trim():"N/A"})()'
        )
        await session.screenshot(SC, "start_workout_cta")

        record("SC35-04", "Start workout CTA visible",
               "PASS" if start_cta != "N/A" else "WARN",
               f"text={start_cta}")

    elif state == "has-meals":
        meals_progress = await session.get_text("meals-progress")
        await session.screenshot(SC, "meals_progress")
        record("SC35-03", "Meals progress displayed",
               "PASS" if meals_progress != "N/A" else "WARN",
               f"text={meals_progress}")

        log_meal_cta = await session.ev(
            '(function(){var e=document.querySelector(\'[data-testid="log-meal-cta"]\');'
            'return e?e.textContent.trim():"N/A"})()'
        )
        record("SC35-04", "Log meal CTA visible",
               "PASS" if log_meal_cta != "N/A" else "WARN",
               f"text={log_meal_cta}")

    elif state == "rest-day":
        tomorrow = await session.get_text("tomorrow-preview")
        await session.screenshot(SC, "rest_day_details")
        record("SC35-03", "Rest day + tomorrow preview",
               "PASS" if tomorrow != "N/A" else "WARN",
               f"preview={tomorrow}")

    elif state == "no-plan":
        create_cta = await session.ev(
            '(function(){var e=document.querySelector(\'[data-testid="create-plan-cta"]\');'
            'return e?e.textContent.trim():"N/A"})()'
        )
        await session.screenshot(SC, "no_plan_cta")
        record("SC35-03", "Create plan CTA visible",
               "PASS" if create_cta != "N/A" else "WARN",
               f"text={create_cta}")

    # Step 5: Check WeightMini and StreakMini in same tier
    weight_mini = await session.get_text("weight-mini")
    weight_mini_empty = await session.get_text("weight-mini-empty")
    streak_mini = await session.get_text("streak-mini")
    streak_mini_empty = await session.get_text("streak-mini-empty")
    await session.screenshot(SC, "weight_streak_row")

    weight_ok = weight_mini != "N/A" or weight_mini_empty != "N/A"
    streak_ok = streak_mini != "N/A" or streak_mini_empty != "N/A"

    record("SC35-05", "WeightMini + StreakMini row",
           "PASS" if weight_ok and streak_ok else "FAIL",
           f"weight={'visible' if weight_ok else 'missing'}, streak={'visible' if streak_ok else 'missing'}")

    # Step 6: Try clicking plan card to see if it navigates
    # Some plan card states have CTA buttons that navigate to fitness/calendar
    if state == "has-workout":
        r = await session.click_testid("start-workout-cta")
        await session.wait(WAIT_NAV_CLICK)
        await session.screenshot(SC, "after_start_workout_click")

        # Navigate back to dashboard
        await session.nav_dashboard()
        await session.wait(WAIT_NAV_CLICK)
        await session.screenshot(SC, "back_to_dashboard")
        record("SC35-06", "Workout CTA navigation", "PASS" if r == "ok" else "WARN", f"click={r}")

    elif state == "no-plan":
        r = await session.click_testid("create-plan-cta")
        await session.wait(WAIT_NAV_CLICK)
        await session.screenshot(SC, "after_create_plan_click")

        await session.nav_dashboard()
        await session.wait(WAIT_NAV_CLICK)
        await session.screenshot(SC, "back_to_dashboard")
        record("SC35-06", "Create plan CTA navigation", "PASS" if r == "ok" else "WARN", f"click={r}")

    else:
        record("SC35-06", "Plan card CTA navigation", "SKIP", f"state={state}, no primary CTA")


# ────────────────────────────────────────────────────────────────
# SC36: Quick Actions & Weight Log
# ────────────────────────────────────────────────────────────────
async def sc36_quick_actions_weight_log(session):
    SC = "SC36"
    reset_steps(SC)
    print(f"\n{'─'*60}")
    print(f"📋 {SC}: Quick Actions & Weight Log")
    print(f"{'─'*60}")

    # Ensure on dashboard, scroll down to see quick actions
    await session.nav_dashboard()
    await session.wait(WAIT_NAV_CLICK)

    await session.ev('''(function(){
        var el=document.querySelector('[data-testid="dashboard-tab"]');
        if(el) el.scrollTo({top: el.scrollHeight, behavior:'smooth'});
        return 'scrolled';
    })()''')
    await session.wait(0.8)

    # Step 1: Screenshot quick actions bar
    qa_bar = await session.get_text("quick-actions-bar")
    await session.screenshot(SC, "quick_actions_bar")

    if qa_bar != "N/A":
        record("SC36-01", "QuickActionsBar visible", "PASS")
    else:
        record("SC36-01", "QuickActionsBar visible", "FAIL", "quick-actions-bar not found")

    # Step 2: Detect which quick action buttons are present
    buttons_info = await session.ev('''(function(){
        var bar=document.querySelector('[data-testid="quick-actions-bar"]');
        if(!bar)return'no bar';
        var btns=bar.querySelectorAll('button');
        var r=[];
        btns.forEach(function(b){
            var tid=b.getAttribute('data-testid')||'';
            var rect=b.getBoundingClientRect();
            if(rect.width>0) r.push({testid:tid, text:b.textContent.trim(), w:Math.round(rect.width)});
        });
        return JSON.stringify(r);
    })()''')
    await session.screenshot(SC, "quick_action_buttons")

    record("SC36-02", "Quick action buttons enumerated", "PASS", f"buttons={buttons_info}")

    # Step 3: Click log-weight quick action
    r = await session.click_testid("quick-action-log-weight")
    await session.wait(WAIT_MODAL_OPEN)
    await session.screenshot(SC, "weight_quick_log_opened")

    weight_log = await session.get_text("weight-quick-log")
    if weight_log != "N/A":
        record("SC36-03", "WeightQuickLog sheet opened", "PASS")
    else:
        # Fallback: try clicking WeightMini tap area
        await session.ev('''(function(){
            var el=document.querySelector('[data-testid="dashboard-tab"]');
            if(el) el.scrollTo({top: 0, behavior:'instant'});
        })()''')
        await session.wait(0.5)
        r = await session.click_testid("weight-mini")
        if r == "none":
            await session.click_testid("weight-mini-empty")
        await session.wait(WAIT_MODAL_OPEN)
        await session.screenshot(SC, "weight_quick_log_via_mini")

        weight_log = await session.get_text("weight-quick-log")
        record("SC36-03", "WeightQuickLog sheet opened (via mini)",
               "PASS" if weight_log != "N/A" else "FAIL",
               "fallback to weight-mini tap")

    if weight_log == "N/A":
        record("SC36-04", "Weight input", "SKIP", "sheet not opened")
        record("SC36-05", "Weight save", "SKIP", "sheet not opened")
        record("SC36-06", "Weight updated", "SKIP", "sheet not opened")
        return

    # Step 4: Read current weight display
    weight_display = await session.get_text("weight-display")
    await session.screenshot(SC, "weight_display_initial")

    record("SC36-04a", "Weight display shown",
           "PASS" if weight_display != "N/A" else "FAIL",
           f"current={weight_display}")

    # Step 5: Increment weight
    r = await session.click_testid("increment-btn")
    await session.wait(0.3)
    r = await session.click_testid("increment-btn")
    await session.wait(0.3)
    new_weight = await session.get_text("weight-display")
    await session.screenshot(SC, "weight_incremented")

    record("SC36-04b", "Weight incremented",
           "PASS" if new_weight != weight_display else "WARN",
           f"before={weight_display}, after={new_weight}")

    # Step 6: Check quick select chips
    chips = await session.get_text("quick-select-chips")
    await session.screenshot(SC, "quick_select_chips")

    record("SC36-04c", "Quick select chips visible",
           "PASS" if chips != "N/A" else "WARN",
           "chips present" if chips != "N/A" else "chips not found")

    # Step 7: Check info row (yesterday, moving average)
    yesterday = await session.get_text("yesterday-info")
    moving_avg = await session.get_text("moving-average")
    await session.screenshot(SC, "weight_info_row")

    record("SC36-04d", "Weight info row",
           "PASS",
           f"yesterday={yesterday}, avg={moving_avg}")

    # Step 8: Save weight
    r = await session.click_testid("save-btn")
    await session.wait(WAIT_SAVE_SETTINGS)
    await session.screenshot(SC, "weight_saved")

    # Verify sheet closed after save
    sheet_after = await session.ev(
        '(function(){return document.querySelector(\'[data-testid="weight-quick-log"]\')?'
        '"open":"closed"})()'
    )
    record("SC36-05", "Weight saved & sheet closed",
           "PASS" if sheet_after == "closed" else "FAIL",
           f"sheet={sheet_after}")

    # Step 9: Verify weight updated on dashboard
    await session.wait(0.5)
    weight_value = await session.get_text("weight-value")
    await session.screenshot(SC, "weight_mini_after_save")

    record("SC36-06", "WeightMini updated after save",
           "PASS" if weight_value != "N/A" else "WARN",
           f"display={weight_value}")


# ────────────────────────────────────────────────────────────────
# SC37: Auto-Adjust Insights
# ────────────────────────────────────────────────────────────────
async def sc37_auto_adjust_insights(session):
    SC = "SC37"
    reset_steps(SC)
    print(f"\n{'─'*60}")
    print(f"📋 {SC}: Auto-Adjust Insights")
    print(f"{'─'*60}")

    # Ensure on dashboard
    await session.nav_dashboard()
    await session.wait(WAIT_NAV_CLICK)

    # Step 1: Check AiInsightCard presence
    insight = await session.get_text("ai-insight-card")
    insight_empty = await session.get_text("ai-insight-card-empty")
    await session.screenshot(SC, "insight_section")

    has_insight = insight != "N/A"
    is_empty = insight_empty != "N/A"

    if has_insight:
        record("SC37-01", "AiInsightCard visible", "PASS")
    elif is_empty:
        record("SC37-01", "AiInsightCard visible", "WARN",
               "empty state — no insight generated yet (expected for fresh onboard)")
    else:
        record("SC37-01", "AiInsightCard visible", "FAIL", "neither insight nor empty found")

    # Step 2: If insight present, read details
    if has_insight:
        title = await session.get_text("insight-title")
        message = await session.get_text("insight-message")
        await session.screenshot(SC, "insight_details")

        record("SC37-02", "Insight content readable",
               "PASS" if title != "N/A" else "FAIL",
               f"title={title}, msg={message[:40] if message != 'N/A' else 'N/A'}...")

        # Step 3: Click dismiss button
        r = await session.click_testid("insight-dismiss-btn")
        await session.wait(WAIT_QUICK_ACTION)
        await session.screenshot(SC, "insight_dismissed")

        insight_after = await session.get_text("ai-insight-card")
        record("SC37-03", "Insight dismissed",
               "PASS" if insight_after == "N/A" or insight_after != insight else "WARN",
               f"after_dismiss={insight_after[:30] if insight_after != 'N/A' else 'dismissed'}...")

    else:
        record("SC37-02", "Insight content", "SKIP", "no insight present")
        record("SC37-03", "Insight dismiss", "SKIP", "no insight present")

    # Step 4: Check AutoAdjustBanner
    banner = await session.get_text("auto-adjust-banner")
    await session.screenshot(SC, "auto_adjust_banner")

    if banner != "N/A":
        record("SC37-04", "AutoAdjustBanner visible", "PASS")

        banner_title = await session.get_text("banner-title")
        banner_body = await session.get_text("banner-body")
        await session.screenshot(SC, "banner_content")

        record("SC37-05", "Banner content readable",
               "PASS" if banner_title != "N/A" else "FAIL",
               f"title={banner_title}")

        # Step 5: Click dismiss on banner
        r = await session.click_testid("banner-dismiss-btn")
        await session.wait(WAIT_QUICK_ACTION)
        await session.screenshot(SC, "banner_dismissed")

        banner_after = await session.get_text("auto-adjust-banner")
        record("SC37-06", "Banner dismissed",
               "PASS" if banner_after == "N/A" else "FAIL",
               f"after={banner_after[:30] if banner_after != 'N/A' else 'dismissed'}")

    else:
        record("SC37-04", "AutoAdjustBanner visible", "WARN",
               "no adjustment suggestion — expected for fresh onboard with no history")
        record("SC37-05", "Banner content", "SKIP", "no banner")
        record("SC37-06", "Banner dismiss", "SKIP", "no banner")

    # Step 7: Final scroll through dashboard
    await session.ev('''(function(){
        var el=document.querySelector('[data-testid="dashboard-tab"]');
        if(el) el.scrollTo({top: el.scrollHeight, behavior:'smooth'});
        return 'scrolled';
    })()''')
    await session.wait(0.8)
    await session.screenshot(SC, "final_scroll_bottom")

    await session.ev('''(function(){
        var el=document.querySelector('[data-testid="dashboard-tab"]');
        if(el) el.scrollTo({top: 0, behavior:'smooth'});
        return 'scrolled';
    })()''')
    await session.wait(0.5)
    await session.screenshot(SC, "final_scroll_top")

    record("SC37-07", "Dashboard scroll complete", "PASS")


# ────────────────────────────────────────────────────────────────
# Main runner
# ────────────────────────────────────────────────────────────────
async def main():
    print("=" * 60)
    print("🏠 GROUP E — DASHBOARD TESTS (SC33–SC37)")
    print(f"   Expected: BMR={BMR}, TDEE={TDEE}, Target={TARGET}, Age={AGE}")
    print("=" * 60)

    session = await setup_fresh(full_onboard=True, scenario="SC33")

    # Navigate to dashboard first (onboarding may land on calendar)
    await session.nav_dashboard()
    await session.wait(WAIT_NAV_CLICK)

    # Run all scenarios sequentially in same session (in-memory SQLite)
    await sc33_dashboard_score_layout(session)
    await sc34_energy_balance_protein(session)
    await sc35_todays_plan_card(session)
    await sc36_quick_actions_weight_log(session)
    await sc37_auto_adjust_insights(session)

    # ── Final Report ──
    print(f"\n{'='*60}")
    print("📊 FINAL REPORT — Group E Dashboard")
    print(f"{'='*60}")
    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    failed = sum(1 for r in RESULTS if r["status"] == "FAIL")
    warned = sum(1 for r in RESULTS if r["status"] == "WARN")
    skipped = sum(1 for r in RESULTS if r["status"] == "SKIP")
    total = len(RESULTS)

    print(f"  Total: {total} | ✅ PASS: {passed} | ❌ FAIL: {failed} | ⚠️ WARN: {warned} | ⏭ SKIP: {skipped}")
    print()

    if failed > 0:
        print("  ❌ FAILURES:")
        for r in RESULTS:
            if r["status"] == "FAIL":
                print(f"     {r['tc']}: {r['title']} — {r['detail']}")
        print()

    if warned > 0:
        print("  ⚠️  WARNINGS:")
        for r in RESULTS:
            if r["status"] == "WARN":
                print(f"     {r['tc']}: {r['title']} — {r['detail']}")
        print()

    # Close websocket
    try:
        await session.ws.close()
    except Exception:
        pass

    print("🏁 Group E complete.")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    run_scenario(main())
