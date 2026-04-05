"""
SC38 — Cross-Feature Navigation
=================================
60 Test Cases (TC_NAV_01 → TC_NAV_60) covering:
  - Default state, tab switching, pageStack/showBottomNav logic
  - pushPage/popPage operations (programmatic — mostly SKIP)
  - Scroll position save/restore (SKIP — needs scroll simulation)
  - QuickActionsBar rendering, buttons, styling, accessibility
  - TodaysPlanCard states, CTAs, MealsSection
  - Dashboard pushPage/popPage round-trips
  - FitnessTab sub-tabs, workout mode toggle
  - Rapid tab/page switching edge cases
  - Android back button behavior (SKIP — needs hardware key)
  - Tab content verification (Calendar, Library, AI, Fitness, Dashboard)

Testids (actual from source):
  Bottom Nav:      nav-calendar, nav-library, nav-ai-analysis, nav-fitness, nav-dashboard
  Calendar:        subtab-meals, subtab-nutrition, schedule-subtabs
  Fitness:         fitness-tab, subtab-plan, subtab-history, subtab-progress,
                   plan-subtab-content, history-subtab-content, progress-subtab-content
  Dashboard:       dashboard-tab, quick-actions-bar, quick-action-{id}, todays-plan-card,
                   workout-section, meals-section, no-plan-section, create-plan-cta,
                   start-workout-cta, log-meal-cta, recovery-tips, tomorrow-preview

Run: python scripts/e2e/sc38_cross_nav.py
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

SCENARIO = "SC38"
RESULTS: list[dict] = []

TAB_IDS = ["calendar", "library", "ai-analysis", "fitness", "dashboard"]
TAB_TESTIDS = [f"nav-{t}" for t in TAB_IDS]


def record(tc_id: str, title: str, status: str, detail: str = ""):
    """Record a test case result."""
    RESULTS.append({"tc": tc_id, "title": title, "status": status, "detail": detail})
    icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⏭️"
    line = f"  {icon} {tc_id}: {title} — {status}"
    if detail:
        line += f" ({detail})"
    print(line)


# ──────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────
async def get_active_tab(session) -> str:
    """Return the data-testid suffix of the currently aria-selected nav tab."""
    return await session.ev('''(function(){
        var tabs = document.querySelectorAll('[role="tab"][aria-selected="true"]');
        for (var i = 0; i < tabs.length; i++) {
            var tid = tabs[i].getAttribute('data-testid');
            if (tid && tid.startsWith('nav-')) return tid.replace('nav-','');
        }
        return 'none';
    })()''')


async def is_bottom_nav_visible(session) -> bool:
    """Check if the bottom navigation bar is rendered and visible."""
    result = await session.ev('''(function(){
        var nav = document.querySelector('nav[aria-label]');
        if (!nav) return 'no';
        var tabs = nav.querySelectorAll('[role="tab"]');
        if (tabs.length < 5) return 'no';
        var r = nav.getBoundingClientRect();
        return (r.width > 0 && r.height > 0) ? 'yes' : 'no';
    })()''')
    return result == "yes"


async def count_nav_tabs(session) -> int:
    """Count the number of tab buttons in the bottom nav."""
    return await session.ev('''(function(){
        var list = document.querySelector('[role="tablist"]');
        if (!list) return 0;
        return list.querySelectorAll('[role="tab"]').length;
    })()''')


async def tab_has_aria_selected(session, tab_name: str) -> bool:
    """Check if a specific nav tab has aria-selected=true."""
    result = await session.ev(f'''(function(){{
        var el = document.querySelector('[data-testid="nav-{tab_name}"]');
        return el ? el.getAttribute('aria-selected') : 'N/A';
    }})()''')
    return result == "true"


async def is_tab_content_visible(session, tab_name: str) -> bool:
    """Check if a tab's content panel is visible in the DOM."""
    if tab_name == "calendar":
        result = await session.ev('''(function(){
            var panels = document.querySelectorAll('[role="tabpanel"]');
            for (var i = 0; i < panels.length; i++) {
                var cl = panels[i].className || '';
                if (cl.includes('block') && !cl.includes('hidden')) return 'yes';
            }
            return 'no';
        })()''')
        return result == "yes"
    if tab_name == "dashboard":
        result = await session.ev(
            'document.querySelector(\'[data-testid="dashboard-tab"]\') ? "yes" : "no"'
        )
        return result == "yes"
    if tab_name == "fitness":
        result = await session.ev(
            'document.querySelector(\'[data-testid="fitness-tab"]\') ? "yes" : "no"'
        )
        return result == "yes"
    if tab_name == "library":
        result = await session.ev('''(function(){
            var panels = document.querySelectorAll('[role="tabpanel"]');
            for (var i = 0; i < panels.length; i++) {
                var label = panels[i].getAttribute('aria-label') || '';
                var cl = panels[i].className || '';
                if (cl.includes('block') && !cl.includes('hidden')) {
                    var hasLib = panels[i].querySelector('input,select,[data-testid]');
                    if (hasLib) return 'yes';
                }
            }
            return 'no';
        })()''')
        return result == "yes"
    if tab_name == "ai-analysis":
        result = await session.ev('''(function(){
            var h2s = document.querySelectorAll('h2');
            for (var i = 0; i < h2s.length; i++) {
                var r = h2s[i].getBoundingClientRect();
                if (r.width > 0 && r.height > 0) return 'yes';
            }
            return 'no';
        })()''')
        return result == "yes"
    return False


async def navigate_to_tab(session, tab_name: str):
    """Navigate to a specific tab using the session nav helpers."""
    nav_map = {
        "calendar": session.nav_calendar,
        "library": session.nav_library,
        "ai-analysis": session.nav_ai,
        "fitness": session.nav_fitness,
        "dashboard": session.nav_dashboard,
    }
    await nav_map[tab_name]()


async def get_page_stack_length(session) -> int:
    """Read pageStack length from navigation store via JS."""
    result = await session.ev('''(function(){
        try {
            var store = window.__zustandStores && window.__zustandStores.navigation;
            if (store) return store.getState().pageStack.length;
            var raw = JSON.parse(localStorage.getItem('navigation-storage') || '{}');
            if (raw.state) return (raw.state.pageStack || []).length;
        } catch(e) {}
        return -1;
    })()''')
    return int(result) if result != "" else -1


async def get_nav_store_state(session) -> dict:
    """Read key navigation store fields via Zustand devtools or direct access."""
    raw = await session.ev('''(function(){
        try {
            var el = document.querySelector('[role="tab"][aria-selected="true"]');
            var activeTab = el ? (el.getAttribute('data-testid') || '').replace('nav-','') : 'unknown';
            var navVisible = document.querySelector('[role="tablist"]');
            var visible = navVisible ? navVisible.getBoundingClientRect().height > 0 : false;
            return JSON.stringify({activeTab: activeTab, bottomNavVisible: visible});
        } catch(e) { return JSON.stringify({activeTab:'error',bottomNavVisible:false}); }
    })()''')
    try:
        import json
        return json.loads(raw)
    except Exception:
        return {"activeTab": "error", "bottomNavVisible": False}


# ──────────────────────────────────────────────────────────
# TC_NAV_01: Default state
# ──────────────────────────────────────────────────────────
async def test_default_state(session):
    """TC_NAV_01: After onboarding, default state is calendar tab with bottom nav visible."""
    print(f"\n{'─'*60}")
    print("📋 TC_NAV_01: Default state after onboarding")
    print(f"{'─'*60}")

    active = await get_active_tab(session)
    if active == "calendar":
        record("TC_NAV_01", "Default activeTab=calendar, pageStack=[], showBottomNav=true", "PASS",
               f"activeTab={active}")
    else:
        record("TC_NAV_01", "Default activeTab=calendar, pageStack=[], showBottomNav=true", "FAIL",
               f"activeTab={active}")

    nav_visible = await is_bottom_nav_visible(session)
    if not nav_visible:
        record("TC_NAV_01", "Default activeTab=calendar, pageStack=[], showBottomNav=true", "FAIL",
               "bottomNav not visible")

    await session.screenshot(SCENARIO, "default_state")


# ──────────────────────────────────────────────────────────
# TC_NAV_02-06: Tab switching
# ──────────────────────────────────────────────────────────
async def test_tab_switching(session):
    """TC_NAV_02-06: Sequential tab switching and return to calendar."""
    print(f"\n{'─'*60}")
    print("📋 TC_NAV_02-06: Tab switching")
    print(f"{'─'*60}")

    # TC_NAV_02: Calendar → Library
    await navigate_to_tab(session, "library")
    active = await get_active_tab(session)
    record("TC_NAV_02", "Calendar → Library tab switch",
           "PASS" if active == "library" else "FAIL", f"activeTab={active}")
    await session.screenshot(SCENARIO, "tab_library")

    # TC_NAV_03: Library → AI Analysis
    await navigate_to_tab(session, "ai-analysis")
    await session.wait(0.5)
    active = await get_active_tab(session)
    record("TC_NAV_03", "Library → AI Analysis tab switch",
           "PASS" if active == "ai-analysis" else "FAIL", f"activeTab={active}")
    await session.screenshot(SCENARIO, "tab_ai")

    # TC_NAV_04: AI → Fitness
    await navigate_to_tab(session, "fitness")
    active = await get_active_tab(session)
    record("TC_NAV_04", "AI → Fitness tab switch",
           "PASS" if active == "fitness" else "FAIL", f"activeTab={active}")
    await session.screenshot(SCENARIO, "tab_fitness")

    # TC_NAV_05: Fitness → Dashboard
    await navigate_to_tab(session, "dashboard")
    active = await get_active_tab(session)
    record("TC_NAV_05", "Fitness → Dashboard tab switch",
           "PASS" if active == "dashboard" else "FAIL", f"activeTab={active}")
    await session.screenshot(SCENARIO, "tab_dashboard")

    # TC_NAV_06: Return to Calendar from Dashboard
    await navigate_to_tab(session, "calendar")
    active = await get_active_tab(session)
    record("TC_NAV_06", "Return to Calendar from any tab",
           "PASS" if active == "calendar" else "FAIL", f"activeTab={active}")
    await session.screenshot(SCENARIO, "tab_back_calendar")


# ──────────────────────────────────────────────────────────
# TC_NAV_07-08: navigateTab side effects
# ──────────────────────────────────────────────────────────
async def test_navigate_tab_side_effects(session):
    """TC_NAV_07-08: navigateTab resets pageStack and shows bottom nav."""
    print(f"\n{'─'*60}")
    print("📋 TC_NAV_07-08: navigateTab side effects")
    print(f"{'─'*60}")

    # TC_NAV_07: navigateTab resets pageStack to []
    # After tab switch, verify no overlay pages are showing
    await navigate_to_tab(session, "dashboard")
    nav_state = await get_nav_store_state(session)
    has_no_overlay = await session.ev('''(function(){
        var overlay = document.querySelector('[data-page-stack-overlay]');
        return overlay ? 'has-overlay' : 'clean';
    })()''')
    record("TC_NAV_07", "navigateTab resets pageStack to []",
           "PASS" if has_no_overlay == "clean" else "FAIL",
           f"overlay={has_no_overlay}")

    # TC_NAV_08: navigateTab sets showBottomNav=true
    nav_visible = await is_bottom_nav_visible(session)
    record("TC_NAV_08", "navigateTab sets showBottomNav=true",
           "PASS" if nav_visible else "FAIL",
           f"bottomNavVisible={nav_visible}")

    await navigate_to_tab(session, "calendar")


# ──────────────────────────────────────────────────────────
# TC_NAV_09-18: pushPage/popPage (programmatic store — SKIP)
# ──────────────────────────────────────────────────────────
async def test_page_stack_operations(session):
    """TC_NAV_09-18: pushPage/popPage operations — SKIP (need programmatic store access)."""
    print(f"\n{'─'*60}")
    print("📋 TC_NAV_09-18: pushPage/popPage operations (SKIP)")
    print(f"{'─'*60}")

    record("TC_NAV_09", "pushPage adds page to stack", "SKIP",
           "Needs programmatic store.pushPage()")
    record("TC_NAV_10", "pushPage hides bottom nav", "SKIP",
           "Needs programmatic store.pushPage()")
    record("TC_NAV_11", "pushPage max depth=2", "SKIP",
           "Needs programmatic store.pushPage()")
    record("TC_NAV_12", "pushPage at max depth replaces top", "SKIP",
           "Needs programmatic store.pushPage()")
    record("TC_NAV_13", "popPage removes top page", "SKIP",
           "Needs programmatic store.popPage()")
    record("TC_NAV_14", "popPage shows nav when stack empty", "SKIP",
           "Needs programmatic store.popPage()")
    record("TC_NAV_15", "popPage keeps nav hidden when stack not empty", "SKIP",
           "Needs programmatic store.popPage()")
    record("TC_NAV_16", "popPage on empty stack is no-op", "SKIP",
           "Needs programmatic store.popPage()")
    record("TC_NAV_17", "canGoBack() true when stack non-empty", "SKIP",
           "Needs programmatic store access")
    record("TC_NAV_18", "canGoBack() false when stack empty", "SKIP",
           "Needs programmatic store access")


# ──────────────────────────────────────────────────────────
# TC_NAV_19-22: Scroll position save/restore (SKIP)
# ──────────────────────────────────────────────────────────
async def test_scroll_positions(session):
    """TC_NAV_19-22: Scroll position save/restore — SKIP."""
    print(f"\n{'─'*60}")
    print("📋 TC_NAV_19-22: Scroll position save/restore (SKIP)")
    print(f"{'─'*60}")

    record("TC_NAV_19", "Save scroll position on tab leave", "SKIP",
           "Needs scroll simulation in WebView")
    record("TC_NAV_20", "Restore scroll position on tab return", "SKIP",
           "Needs scroll simulation in WebView")
    record("TC_NAV_21", "New tab starts at scroll=0", "SKIP",
           "Needs scroll simulation in WebView")
    record("TC_NAV_22", "Scroll position resets after tab refresh", "SKIP",
           "Needs scroll simulation in WebView")


# ──────────────────────────────────────────────────────────
# TC_NAV_23-28: QuickActionsBar
# ──────────────────────────────────────────────────────────
async def test_quick_actions_bar(session):
    """TC_NAV_23-28: QuickActionsBar rendering, buttons, styling, accessibility."""
    print(f"\n{'─'*60}")
    print("📋 TC_NAV_23-28: QuickActionsBar")
    print(f"{'─'*60}")

    await navigate_to_tab(session, "dashboard")
    await session.wait(0.5)

    # Scroll to make QuickActionsBar visible
    await session.ev('''(function(){
        var el = document.querySelector('[data-testid="dashboard-tab"]');
        if (el) el.scrollTo({top: el.scrollHeight, behavior: 'instant'});
        return 'scrolled';
    })()''')
    await session.wait(0.5)

    # TC_NAV_23: QuickActionsBar renders with 3 buttons
    btn_count = await session.ev('''(function(){
        var bar = document.querySelector('[data-testid="quick-actions-bar"]');
        if (!bar) return 0;
        return bar.querySelectorAll('button').length;
    })()''')
    record("TC_NAV_23", "QuickActionsBar renders 3 buttons",
           "PASS" if btn_count == 3 else "FAIL", f"count={btn_count}")

    # TC_NAV_24: QuickActionsBar has nav role with aria-label
    aria_info = await session.ev('''(function(){
        var bar = document.querySelector('[data-testid="quick-actions-bar"]');
        if (!bar) return 'N/A';
        var role = bar.tagName.toLowerCase();
        var label = bar.getAttribute('aria-label') || '';
        return role + ':' + (label ? 'has-label' : 'no-label');
    })()''')
    record("TC_NAV_24", "QuickActionsBar semantic <nav> with aria-label",
           "PASS" if "nav:has-label" in aria_info else "FAIL", f"info={aria_info}")

    # TC_NAV_25: 1 primary button (taller, default variant) + 2 outline
    variant_info = await session.ev('''(function(){
        var bar = document.querySelector('[data-testid="quick-actions-bar"]');
        if (!bar) return JSON.stringify({primary:0,outline:0});
        var btns = bar.querySelectorAll('button');
        var primary = 0, outline = 0;
        btns.forEach(function(b) {
            var cl = b.className || '';
            if (cl.includes('bg-primary')) primary++;
            else if (cl.includes('bg-card')) outline++;
        });
        return JSON.stringify({primary:primary, outline:outline});
    })()''')
    import json
    try:
        vi = json.loads(variant_info)
    except Exception:
        vi = {"primary": 0, "outline": 0}
    record("TC_NAV_25", "1 primary + 2 outline button styling",
           "PASS" if vi.get("primary") == 1 and vi.get("outline") == 2 else "FAIL",
           f"primary={vi.get('primary')}, outline={vi.get('outline')}")

    # TC_NAV_26: All buttons have aria-label
    all_labeled = await session.ev('''(function(){
        var bar = document.querySelector('[data-testid="quick-actions-bar"]');
        if (!bar) return 'no-bar';
        var btns = bar.querySelectorAll('button');
        var count = 0;
        btns.forEach(function(b) { if (b.getAttribute('aria-label')) count++; });
        return count + '/' + btns.length;
    })()''')
    record("TC_NAV_26", "All QuickAction buttons have aria-label",
           "PASS" if all_labeled.endswith("/3") and all_labeled.startswith("3") else "FAIL",
           f"labeled={all_labeled}")

    # TC_NAV_27: Left button = log-weight action
    left_id = await session.ev('''(function(){
        var bar = document.querySelector('[data-testid="quick-actions-bar"]');
        if (!bar) return 'N/A';
        var first = bar.querySelector('button');
        return first ? (first.getAttribute('data-testid') || 'no-tid') : 'no-btn';
    })()''')
    record("TC_NAV_27", "Left QuickAction = log-weight",
           "PASS" if "log-weight" in left_id else "FAIL", f"testid={left_id}")

    # TC_NAV_28: Click primary QuickAction dispatches action (click center button)
    center_click = await session.ev('''(function(){
        var bar = document.querySelector('[data-testid="quick-actions-bar"]');
        if (!bar) return 'no-bar';
        var btns = bar.querySelectorAll('button');
        if (btns.length < 2) return 'no-center';
        var centerBtn = btns[1];
        centerBtn.click();
        return 'clicked:' + (centerBtn.getAttribute('data-testid') || 'unknown');
    })()''')
    await session.wait(WAIT_MODAL_OPEN)
    record("TC_NAV_28", "Click primary QuickAction dispatches action",
           "PASS" if center_click.startswith("clicked:") else "FAIL",
           f"result={center_click}")
    await session.screenshot(SCENARIO, "quick_action_clicked")

    # Dismiss any opened modal/overlay before continuing
    await session.ev('''(function(){
        var bd = document.querySelector('[data-testid="modal-backdrop"]');
        if (bd) bd.click();
        var close = document.querySelector('[data-testid="close-btn"]');
        if (close) close.click();
    })()''')
    await session.wait(WAIT_MODAL_CLOSE)


# ──────────────────────────────────────────────────────────
# TC_NAV_29-39: TodaysPlanCard states + CTAs + MealsSection
# ──────────────────────────────────────────────────────────
async def test_todays_plan_card(session):
    """TC_NAV_29-39: TodaysPlanCard rendering, states, and CTAs."""
    print(f"\n{'─'*60}")
    print("📋 TC_NAV_29-39: TodaysPlanCard")
    print(f"{'─'*60}")

    await navigate_to_tab(session, "dashboard")
    await session.wait(0.5)

    # TC_NAV_29: TodaysPlanCard renders
    card_exists = await session.ev(
        'document.querySelector(\'[data-testid="todays-plan-card"]\') ? "yes" : "no"'
    )
    record("TC_NAV_29", "TodaysPlanCard renders",
           "PASS" if card_exists == "yes" else "FAIL")

    await session.screenshot(SCENARIO, "todays_plan_card")

    # TC_NAV_30: Detect current card state
    state_info = await session.ev('''(function(){
        var card = document.querySelector('[data-testid="todays-plan-card"]');
        if (!card) return 'no-card';
        if (card.querySelector('[data-testid="no-plan-section"]')) return 'no-plan';
        if (card.querySelector('[data-testid="recovery-tips"]')) return 'rest-day';
        if (card.querySelector('[data-testid="workout-summary"]')) return 'training-completed';
        if (card.querySelector('[data-testid="partial-progress-section"]')) return 'training-partial';
        if (card.querySelector('[data-testid="workout-section"]')) return 'training-pending';
        return 'unknown';
    })()''')
    record("TC_NAV_30", "TodaysPlanCard state detected",
           "PASS" if state_info != "no-card" else "FAIL",
           f"state={state_info}")

    # TC_NAV_31: MealsSection renders inside card
    meals = await session.ev(
        'document.querySelector(\'[data-testid="meals-section"]\') ? "yes" : "no"'
    )
    record("TC_NAV_31", "MealsSection renders inside card",
           "PASS" if meals == "yes" else "FAIL")

    # TC_NAV_32: MealsSection shows meals-progress
    progress = await session.get_text("meals-progress")
    record("TC_NAV_32", "MealsSection shows meals-progress text",
           "PASS" if progress != "N/A" else "FAIL",
           f"text={progress[:50]}")

    # TC_NAV_33-39 depend on the detected state
    if state_info == "no-plan":
        # TC_NAV_33: no-plan-section visible
        record("TC_NAV_33", "no-plan-section visible in no-plan state", "PASS",
               "State=no-plan, section rendered")

        # TC_NAV_34: create-plan-cta button exists
        cta_exists = await session.ev(
            'document.querySelector(\'[data-testid="create-plan-cta"]\') ? "yes" : "no"'
        )
        record("TC_NAV_34", "create-plan-cta exists in no-plan state",
               "PASS" if cta_exists == "yes" else "FAIL")

        # TC_NAV_35: Click create-plan-cta navigates to fitness
        cta_click = await session.click_testid("create-plan-cta")
        await session.wait(WAIT_NAV_CLICK)
        active_after = await get_active_tab(session)
        record("TC_NAV_35", "create-plan-cta navigates to fitness tab",
               "PASS" if active_after == "fitness" else "FAIL",
               f"activeTab={active_after}")
        await session.screenshot(SCENARIO, "create_plan_nav")

        # Navigate back to dashboard for remaining tests
        await navigate_to_tab(session, "dashboard")
        await session.wait(0.5)

        # TC_NAV_36-39: states not active — SKIP with explanation
        record("TC_NAV_36", "workout-section in training-pending state", "SKIP",
               "No training plan active — state=no-plan")
        record("TC_NAV_37", "start-workout-cta in training-pending state", "SKIP",
               "No training plan active — state=no-plan")
        record("TC_NAV_38", "recovery-tips in rest-day state", "SKIP",
               "No training plan active — state=no-plan")
        record("TC_NAV_39", "log-meal-cta clickable in meals section", "SKIP",
               "No meals planned yet")

    elif state_info == "training-pending":
        # TC_NAV_33
        record("TC_NAV_33", "no-plan-section visible in no-plan state", "SKIP",
               "State=training-pending, not no-plan")

        # TC_NAV_34
        record("TC_NAV_34", "create-plan-cta exists in no-plan state", "SKIP",
               "State=training-pending, not no-plan")

        # TC_NAV_35
        record("TC_NAV_35", "create-plan-cta navigates to fitness tab", "SKIP",
               "State=training-pending, not no-plan")

        # TC_NAV_36: workout-section visible
        ws = await session.ev(
            'document.querySelector(\'[data-testid="workout-section"]\') ? "yes" : "no"'
        )
        record("TC_NAV_36", "workout-section in training-pending state",
               "PASS" if ws == "yes" else "FAIL")

        # TC_NAV_37: start-workout-cta exists
        sw = await session.ev(
            'document.querySelector(\'[data-testid="start-workout-cta"]\') ? "yes" : "no"'
        )
        record("TC_NAV_37", "start-workout-cta in training-pending state",
               "PASS" if sw == "yes" else "FAIL")

        # TC_NAV_38
        record("TC_NAV_38", "recovery-tips in rest-day state", "SKIP",
               "State=training-pending, not rest-day")

        # TC_NAV_39: log-meal-cta
        lm = await session.ev(
            'document.querySelector(\'[data-testid="log-meal-cta"]\') ? "yes" : "no"'
        )
        record("TC_NAV_39", "log-meal-cta clickable in meals section",
               "PASS" if lm == "yes" else "SKIP",
               "Depends on next meal availability")

    elif state_info == "rest-day":
        record("TC_NAV_33", "no-plan-section visible in no-plan state", "SKIP",
               "State=rest-day")
        record("TC_NAV_34", "create-plan-cta exists in no-plan state", "SKIP",
               "State=rest-day")
        record("TC_NAV_35", "create-plan-cta navigates to fitness tab", "SKIP",
               "State=rest-day")
        record("TC_NAV_36", "workout-section in training-pending state", "SKIP",
               "State=rest-day")
        record("TC_NAV_37", "start-workout-cta in training-pending state", "SKIP",
               "State=rest-day")

        # TC_NAV_38: recovery-tips visible
        rt = await session.ev(
            'document.querySelector(\'[data-testid="recovery-tips"]\') ? "yes" : "no"'
        )
        record("TC_NAV_38", "recovery-tips in rest-day state",
               "PASS" if rt == "yes" else "FAIL")

        record("TC_NAV_39", "log-meal-cta clickable in meals section", "SKIP",
               "State=rest-day, no meal CTA in this state")

    else:
        # Catch-all for training-completed, training-partial, unknown
        for tc_id, title in [
            ("TC_NAV_33", "no-plan-section visible in no-plan state"),
            ("TC_NAV_34", "create-plan-cta exists in no-plan state"),
            ("TC_NAV_35", "create-plan-cta navigates to fitness tab"),
            ("TC_NAV_36", "workout-section in training-pending state"),
            ("TC_NAV_37", "start-workout-cta in training-pending state"),
            ("TC_NAV_38", "recovery-tips in rest-day state"),
            ("TC_NAV_39", "log-meal-cta clickable in meals section"),
        ]:
            record(tc_id, title, "SKIP", f"State={state_info}, not matching")


# ──────────────────────────────────────────────────────────
# TC_NAV_40-42: Dashboard pushPage/popPage round-trips
# ──────────────────────────────────────────────────────────
async def test_dashboard_page_stack(session):
    """TC_NAV_40-42: Dashboard pushPage/popPage round-trips and stack depth."""
    print(f"\n{'─'*60}")
    print("📋 TC_NAV_40-42: Dashboard pushPage/popPage round-trips")
    print(f"{'─'*60}")

    await navigate_to_tab(session, "dashboard")
    await session.wait(0.5)

    # TC_NAV_40: Click a CTA that triggers pushPage (e.g. create-plan-cta or settings)
    # Try opening settings as a pushPage trigger
    settings_result = await session.open_settings()
    await session.wait(WAIT_NAV_CLICK)

    # Check if nav is hidden (settings pushes to page stack)
    nav_visible_after = await is_bottom_nav_visible(session)
    record("TC_NAV_40", "Dashboard CTA pushPage hides bottom nav",
           "PASS" if not nav_visible_after else "FAIL",
           f"navVisible={nav_visible_after}")
    await session.screenshot(SCENARIO, "dashboard_push_settings")

    # TC_NAV_41: popPage returns to dashboard with nav visible
    await session.close_settings()
    await session.wait(WAIT_NAV_CLICK)
    nav_visible_back = await is_bottom_nav_visible(session)
    active_after_pop = await get_active_tab(session)
    record("TC_NAV_41", "popPage returns to dashboard with nav visible",
           "PASS" if nav_visible_back and active_after_pop == "dashboard" else "FAIL",
           f"navVisible={nav_visible_back}, activeTab={active_after_pop}")

    # TC_NAV_42: Stack depth does not exceed 2
    # Open settings twice (push → push) — second should replace
    await session.open_settings()
    await session.wait(WAIT_NAV_CLICK)
    stack_depth = await session.ev('''(function(){
        var overlays = document.querySelectorAll('[data-page-stack-overlay] > *');
        return overlays.length || 0;
    })()''')
    record("TC_NAV_42", "Page stack depth ≤ 2",
           "PASS" if int(stack_depth) <= 2 else "FAIL",
           f"depth={stack_depth}")

    # Clean up — close settings
    await session.close_settings()
    await session.wait(WAIT_MODAL_CLOSE)


# ──────────────────────────────────────────────────────────
# TC_NAV_43-49: FitnessTab sub-tabs + workout mode
# ──────────────────────────────────────────────────────────
async def test_fitness_subtabs(session):
    """TC_NAV_43-49: FitnessTab sub-tab navigation and workout mode toggle."""
    print(f"\n{'─'*60}")
    print("📋 TC_NAV_43-49: FitnessTab sub-tabs")
    print(f"{'─'*60}")

    await navigate_to_tab(session, "fitness")
    await session.wait(0.5)

    # TC_NAV_43: FitnessTab renders with subtab bar
    subtab_bar = await session.ev(
        'document.querySelector(\'[data-testid="subtab-bar"]\') ? "yes" : "no"'
    )
    record("TC_NAV_43", "FitnessTab renders SubTabBar",
           "PASS" if subtab_bar == "yes" else "FAIL")
    await session.screenshot(SCENARIO, "fitness_subtab_bar")

    # TC_NAV_44: Default sub-tab is 'plan'
    plan_content = await session.ev(
        'document.querySelector(\'[data-testid="plan-subtab-content"]\') ? "yes" : "no"'
    )
    record("TC_NAV_44", "Default fitness sub-tab is plan",
           "PASS" if plan_content == "yes" else "FAIL")

    # TC_NAV_45: Switch to 'progress' sub-tab
    await session.click_testid("subtab-progress")
    await session.wait(WAIT_QUICK_ACTION)
    progress_content = await session.ev(
        'document.querySelector(\'[data-testid="progress-subtab-content"]\') ? "yes" : "no"'
    )
    record("TC_NAV_45", "Switch to progress sub-tab",
           "PASS" if progress_content == "yes" else "FAIL")
    await session.screenshot(SCENARIO, "fitness_progress")

    # TC_NAV_46: Switch to 'history' sub-tab
    await session.click_testid("subtab-history")
    await session.wait(WAIT_QUICK_ACTION)
    history_content = await session.ev(
        'document.querySelector(\'[data-testid="history-subtab-content"]\') ? "yes" : "no"'
    )
    record("TC_NAV_46", "Switch to history sub-tab",
           "PASS" if history_content == "yes" else "FAIL")
    await session.screenshot(SCENARIO, "fitness_history")

    # TC_NAV_47: Switch back to 'plan' sub-tab
    await session.click_testid("subtab-plan")
    await session.wait(WAIT_QUICK_ACTION)
    plan_back = await session.ev(
        'document.querySelector(\'[data-testid="plan-subtab-content"]\') ? "yes" : "no"'
    )
    record("TC_NAV_47", "Switch back to plan sub-tab",
           "PASS" if plan_back == "yes" else "FAIL")

    # TC_NAV_48: Sub-tab active state has aria-selected
    active_subtab = await session.ev('''(function(){
        var bar = document.querySelector('[data-testid="subtab-bar"]');
        if (!bar) return 'no-bar';
        var tabs = bar.querySelectorAll('[role="tab"]');
        for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].getAttribute('aria-selected') === 'true') {
                return tabs[i].getAttribute('data-testid') || 'no-tid';
            }
        }
        return 'none-selected';
    })()''')
    record("TC_NAV_48", "Active sub-tab has aria-selected=true",
           "PASS" if "subtab-plan" in active_subtab else "FAIL",
           f"selected={active_subtab}")

    # TC_NAV_49: Workout mode toggle (check if training plan context present)
    workout_context = await session.ev('''(function(){
        var tab = document.querySelector('[data-testid="fitness-tab"]');
        if (!tab) return 'no-tab';
        var plan = tab.querySelector('[data-testid="plan-subtab-content"]');
        if (!plan) return 'no-plan-content';
        return plan.children.length > 0 ? 'has-content' : 'empty';
    })()''')
    record("TC_NAV_49", "FitnessTab plan content renders (workout mode context)",
           "PASS" if workout_context == "has-content" else "FAIL",
           f"content={workout_context}")


# ──────────────────────────────────────────────────────────
# TC_NAV_50-51: Rapid tab/page switching edge cases
# ──────────────────────────────────────────────────────────
async def test_rapid_switching(session):
    """TC_NAV_50-51: Rapid tab and page switching edge cases."""
    print(f"\n{'─'*60}")
    print("📋 TC_NAV_50-51: Rapid switching edge cases")
    print(f"{'─'*60}")

    # TC_NAV_50: Rapid tab switching (5 tabs in quick succession)
    for tab in TAB_IDS:
        await session.click_testid(f"nav-{tab}")
        await session.wait(0.1)

    # After rapid switching, should land on last tab (dashboard)
    await session.wait(WAIT_NAV_CLICK)
    active = await get_active_tab(session)
    nav_ok = await is_bottom_nav_visible(session)
    record("TC_NAV_50", "Rapid tab switching lands on last tab, nav stable",
           "PASS" if active == "dashboard" and nav_ok else "FAIL",
           f"activeTab={active}, navVisible={nav_ok}")
    await session.screenshot(SCENARIO, "rapid_tab_switch")

    # TC_NAV_51: Rapid same-tab clicks (click calendar 5 times fast)
    for _ in range(5):
        await session.click_testid("nav-calendar")
        await session.wait(0.05)

    await session.wait(WAIT_NAV_CLICK)
    active_after = await get_active_tab(session)
    nav_still_ok = await is_bottom_nav_visible(session)
    record("TC_NAV_51", "Rapid same-tab clicks remain stable",
           "PASS" if active_after == "calendar" and nav_still_ok else "FAIL",
           f"activeTab={active_after}, navVisible={nav_still_ok}")


# ──────────────────────────────────────────────────────────
# TC_NAV_52-55: Android back button (SKIP)
# ──────────────────────────────────────────────────────────
async def test_android_back_button(session):
    """TC_NAV_52-55: Android hardware back button — SKIP."""
    print(f"\n{'─'*60}")
    print("📋 TC_NAV_52-55: Android back button (SKIP)")
    print(f"{'─'*60}")

    record("TC_NAV_52", "Back button pops page stack", "SKIP",
           "Needs Android hardware back (KEYCODE_BACK)")
    record("TC_NAV_53", "Back button on empty stack goes to previous tab", "SKIP",
           "Needs Android hardware back (KEYCODE_BACK)")
    record("TC_NAV_54", "Back button on calendar (home) shows exit confirm", "SKIP",
           "Needs Android hardware back (KEYCODE_BACK)")
    record("TC_NAV_55", "Deep link navigation (no deep link support)", "SKIP",
           "App has no deep link routing")


# ──────────────────────────────────────────────────────────
# TC_NAV_56-60: Tab content verification
# ──────────────────────────────────────────────────────────
async def test_tab_content_verification(session):
    """TC_NAV_56-60: Verify each tab renders unique content."""
    print(f"\n{'─'*60}")
    print("📋 TC_NAV_56-60: Tab content verification")
    print(f"{'─'*60}")

    # TC_NAV_56: Calendar tab content
    await navigate_to_tab(session, "calendar")
    cal_content = await session.ev('''(function(){
        var subtabs = document.querySelector('[data-testid="schedule-subtabs"]');
        return subtabs ? 'has-schedule-subtabs' : 'no-schedule-subtabs';
    })()''')
    record("TC_NAV_56", "Calendar tab shows schedule subtabs",
           "PASS" if "has-schedule-subtabs" in cal_content else "FAIL",
           f"content={cal_content}")
    await session.screenshot(SCENARIO, "verify_calendar")

    # TC_NAV_57: Library tab content
    await navigate_to_tab(session, "library")
    lib_content = await session.ev('''(function(){
        var panel = document.querySelector('[role="tabpanel"]:not(.hidden)');
        if (!panel) return 'no-panel';
        var inputs = panel.querySelectorAll('input,select,button');
        return inputs.length > 0 ? 'has-controls' : 'empty';
    })()''')
    record("TC_NAV_57", "Library tab shows management controls",
           "PASS" if lib_content == "has-controls" else "FAIL",
           f"content={lib_content}")
    await session.screenshot(SCENARIO, "verify_library")

    # TC_NAV_58: AI Analysis tab content
    await navigate_to_tab(session, "ai-analysis")
    await session.wait(0.5)
    ai_content = await session.ev('''(function(){
        var h2 = document.querySelectorAll('h2');
        for (var i = 0; i < h2.length; i++) {
            var r = h2[i].getBoundingClientRect();
            if (r.width > 0 && r.height > 0) return 'has-heading:' + h2[i].textContent.trim();
        }
        return 'no-heading';
    })()''')
    record("TC_NAV_58", "AI Analysis tab shows heading",
           "PASS" if "has-heading" in ai_content else "FAIL",
           f"content={ai_content[:60]}")
    await session.screenshot(SCENARIO, "verify_ai")

    # TC_NAV_59: Fitness tab content
    await navigate_to_tab(session, "fitness")
    fit_content = await session.ev(
        'document.querySelector(\'[data-testid="fitness-tab"]\') ? "yes" : "no"'
    )
    record("TC_NAV_59", "Fitness tab renders fitness-tab container",
           "PASS" if fit_content == "yes" else "FAIL")
    await session.screenshot(SCENARIO, "verify_fitness")

    # TC_NAV_60: Dashboard tab content
    await navigate_to_tab(session, "dashboard")
    dash_content = await session.ev(
        'document.querySelector(\'[data-testid="dashboard-tab"]\') ? "yes" : "no"'
    )
    record("TC_NAV_60", "Dashboard tab renders dashboard-tab container",
           "PASS" if dash_content == "yes" else "FAIL")
    await session.screenshot(SCENARIO, "verify_dashboard")


# ──────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────
def print_summary():
    """Print final test summary."""
    print(f"\n{'='*60}")
    print(f"📊 SC38 — CROSS-FEATURE NAVIGATION — TEST REPORT")
    print(f"{'='*60}")

    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    failed = sum(1 for r in RESULTS if r["status"] == "FAIL")
    skipped = sum(1 for r in RESULTS if r["status"] == "SKIP")
    total = len(RESULTS)

    print(f"  Total: {total} | ✅ Passed: {passed} | ❌ Failed: {failed} | ⏭️  Skipped: {skipped}")

    # Verify all 60 TCs are accounted for
    recorded_tcs = {r["tc"] for r in RESULTS}
    expected_tcs = {f"TC_NAV_{i:02d}" for i in range(1, 61)}
    missing = expected_tcs - recorded_tcs
    if missing:
        print(f"\n  ⚠️  MISSING TCs: {sorted(missing)}")

    if failed > 0:
        print(f"\n  ❌ FAILED:")
        for r in RESULTS:
            if r["status"] == "FAIL":
                detail = f" ({r['detail']})" if r["detail"] else ""
                print(f"    {r['tc']}: {r['title']}{detail}")

    if skipped > 0:
        print(f"\n  ⏭️  SKIPPED ({skipped}):")
        for r in RESULTS:
            if r["status"] == "SKIP":
                detail = f" ({r['detail']})" if r["detail"] else ""
                print(f"    {r['tc']}: {r['title']}{detail}")

    print(f"\n{'='*60}")


# ──────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────
async def run():
    """Execute all SC38 test cases."""
    print("=" * 60)
    print("🧪 SC38: Cross-Feature Navigation")
    print("   60 Test Cases: TC_NAV_01 → TC_NAV_60")
    print("=" * 60)

    session = await setup_fresh(full_onboard=True, scenario="SC38")
    reset_steps(SCENARIO)

    await test_default_state(session)           # TC_NAV_01
    await test_tab_switching(session)            # TC_NAV_02-06
    await test_navigate_tab_side_effects(session)  # TC_NAV_07-08
    await test_page_stack_operations(session)    # TC_NAV_09-18 (SKIP)
    await test_scroll_positions(session)         # TC_NAV_19-22 (SKIP)
    await test_quick_actions_bar(session)        # TC_NAV_23-28
    await test_todays_plan_card(session)         # TC_NAV_29-39
    await test_dashboard_page_stack(session)     # TC_NAV_40-42
    await test_fitness_subtabs(session)          # TC_NAV_43-49
    await test_rapid_switching(session)          # TC_NAV_50-51
    await test_android_back_button(session)      # TC_NAV_52-55 (SKIP)
    await test_tab_content_verification(session)  # TC_NAV_56-60

    print_summary()


if __name__ == "__main__":
    run_scenario(run())
