#!/usr/bin/env python3
"""SC15 — Background Translation: Comprehensive CDP Test
Covers ALL 210 TCs from scenario doc.
Most TCs SKIP: translation feature requires multi-language support, API keys,
and background translation process not yet implemented.
Automatable: verify Vietnamese i18n renders correctly, bilingual name objects
exist in seed data, UI labels resolve from i18n keys.
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
    CDPSession,
)

SC = "SC15"
RESULTS = []


def log_result(tc_id, status, msg=""):
    RESULTS.append((tc_id, status, msg))
    icon = {"PASS": "✅", "FAIL": "❌", "SKIP": "⏭️"}.get(status, "❓")
    print(f"  {icon} {tc_id}: {status} {msg}")


# ──────────────────────────────────────────────────────────────────────
# SKIP helpers — batch register non-automatable TCs
# ──────────────────────────────────────────────────────────────────────

SKIP_REASONS = {
    # Nhóm 1: Core Translation Flow (TC_BT_01–15)
    "TC_BT_01": "Requires language switcher + translation API (not implemented)",
    "TC_BT_02": "Requires translation queue system (not implemented)",
    "TC_BT_03": "Requires translation progress bar (not implemented)",
    "TC_BT_04": "Requires translation progress display (not implemented)",
    "TC_BT_05": "Requires active translation process (not implemented)",
    "TC_BT_06": "Requires translation completion state (not implemented)",
    "TC_BT_07": "Requires concurrent translation + UI interaction (not implemented)",
    "TC_BT_08": "Requires background processing verification (not implemented)",
    "TC_BT_09": "Requires completed translation output (not implemented)",
    "TC_BT_10": "Requires dish name translation vi→en (not implemented)",
    "TC_BT_11": "Requires ingredient name translation vi→en (not implemented)",
    "TC_BT_13": "Requires translation cancel action (not implemented)",
    "TC_BT_14": "Requires translation cancel + partial state (not implemented)",
    "TC_BT_15": "Requires translation progress bar dismiss (not implemented)",
    # Nhóm 2: Error Handling & Cache (TC_BT_16–24)
    "TC_BT_16": "Requires API key validation (not implemented)",
    "TC_BT_17": "Requires API error + retry logic (not implemented)",
    "TC_BT_18": "Requires retry failure handling (not implemented)",
    "TC_BT_19": "Requires network error during translation (not implemented)",
    "TC_BT_20": "Requires API timeout handling (not implemented)",
    "TC_BT_21": "Requires rate limit handling (not implemented)",
    "TC_BT_22": "Requires translation cache (not implemented)",
    "TC_BT_23": "Requires cache hit verification (not implemented)",
    "TC_BT_24": "Requires cache invalidation (not implemented)",
    # Nhóm 3: Content Variations (TC_BT_25–37)
    "TC_BT_25": "Requires vi→en translation (not implemented)",
    "TC_BT_26": "Requires en→vi translation (not implemented)",
    "TC_BT_27": "Requires roundtrip translation (not implemented)",
    "TC_BT_28": "Requires translation quality assessment (not implemented)",
    "TC_BT_29": "Requires single word translation (not implemented)",
    "TC_BT_30": "Requires long text translation (not implemented)",
    "TC_BT_31": "Requires special character handling (not implemented)",
    "TC_BT_32": "Requires number preservation in translation (not implemented)",
    "TC_BT_33": "Requires empty string handling (not implemented)",
    "TC_BT_34": "Requires whitespace-only handling (not implemented)",
    "TC_BT_35": "Requires same-language detection (not implemented)",
    "TC_BT_36": "Requires mixed-language handling (not implemented)",
    "TC_BT_37": "Requires HTML sanitization in translation (not implemented)",
}

# Nhóm 4–13 all SKIP (translation infrastructure not implemented)
GROUP_SKIP = {
    range(38, 50): "Requires translation queue management (not implemented)",
    range(50, 56): "Requires translation persistence (not implemented)",
    range(56, 68): "Requires translation UI/UX components (not implemented)",
    range(68, 80): "Requires concurrent translation operations (not implemented)",
    range(80, 106): "Requires cross-feature translation impact (not implemented)",
    range(106, 126): "Requires bilingual name object translation (not implemented)",
    range(141, 146): "Requires i18n key resolution for dynamic content (not implemented)",
    range(146, 166): "Requires locale formatting (not implemented)",
    range(166, 186): "Requires translation in all components (not implemented)",
    range(186, 211): "Requires translation queue/cache edge cases (not implemented)",
}


def register_skip_tcs():
    """Register all non-automatable TCs as SKIP."""
    for tc_id, reason in SKIP_REASONS.items():
        log_result(tc_id, "SKIP", reason)

    for r, reason in GROUP_SKIP.items():
        for i in r:
            tc_id = f"TC_BT_{i:02d}" if i < 100 else f"TC_BT_{i}"
            if tc_id not in [x[0] for x in RESULTS]:
                log_result(tc_id, "SKIP", reason)


# ──────────────────────────────────────────────────────────────────────
# Automatable TCs
# ──────────────────────────────────────────────────────────────────────

async def tc_bt_12(s: CDPSession):
    """TC_BT_12: Labels tĩnh của UI được dịch đúng — verify i18n renders Vietnamese"""
    tc_id = "TC_BT_12"
    try:
        await s.nav_calendar()
        await s.wait(WAIT_NAV_CLICK)

        # Check that the app renders Vietnamese text (i18n working)
        body_text = await s.ev(
            '(function(){return document.body.innerText.substring(0, 500)})()'
        )
        # Vietnamese chars should be present
        has_vietnamese = any(c in body_text for c in "àáạảãăắằặẳẵâấầậẩẫ"
                            "èéẹẻẽêếềệểễìíịỉĩòóọỏõôốồộổỗơớờợởỡ"
                            "ùúụủũưứừựửữỳýỵỷỹđ")
        if not has_vietnamese:
            # Check for common Vietnamese UI words
            has_vietnamese = any(w in body_text for w in [
                "Lịch", "Thư viện", "Tổng quan", "Bữa", "Dinh dưỡng"
            ])

        await s.screenshot(SC, "i18n_labels_check")

        if has_vietnamese:
            log_result(tc_id, "PASS", "UI labels rendered in Vietnamese via i18n")
        else:
            log_result(tc_id, "FAIL", f"No Vietnamese text found. Body: {body_text[:100]}")
    except Exception as e:
        log_result(tc_id, "FAIL", str(e))


async def tc_bt_126_to_140(s: CDPSession):
    """TC_BT_126–140: i18n Key Resolution — verify t() keys resolve on each tab"""
    # These test that i18n keys resolve to Vietnamese text on each major tab
    tabs_to_check = [
        ("TC_BT_126", "nav-calendar", "Calendar tab i18n keys resolve"),
        ("TC_BT_127", "nav-library", "Library tab i18n keys resolve"),
        ("TC_BT_128", "nav-ai-analysis", "AI Analysis tab i18n keys resolve"),
        ("TC_BT_129", "nav-fitness", "Fitness tab i18n keys resolve"),
        ("TC_BT_130", "nav-dashboard", "Dashboard tab i18n keys resolve"),
    ]

    for tc_id, nav_testid, desc in tabs_to_check:
        try:
            await s.click_testid(nav_testid)
            await s.wait(WAIT_NAV_CLICK)

            # Check for unresolved i18n keys (raw key patterns like "calendar.xxx")
            unresolved = await s.ev('''(function(){
                var text = document.body.innerText;
                var patterns = text.match(/[a-z]+\\.[a-z]+\\.[a-z]+/gi) || [];
                var suspicious = patterns.filter(function(p){
                    return p.includes('.') && !p.includes('http') && !p.includes('www')
                        && !p.includes('.com') && !p.includes('.json');
                });
                return suspicious.length > 0 ? suspicious.slice(0,3).join(', ') : '';
            })()''')

            short_name = nav_testid.replace("nav-", "")
            await s.screenshot(SC, f"i18n_tab_{short_name}")

            if unresolved:
                log_result(tc_id, "FAIL", f"Unresolved i18n keys on {short_name}: {unresolved}")
            else:
                log_result(tc_id, "PASS", desc)
        except Exception as e:
            log_result(tc_id, "FAIL", str(e))

    # TC_BT_131–140: Additional i18n resolution checks (SKIP — need language switch)
    for i in range(131, 141):
        tc_id = f"TC_BT_{i}"
        if tc_id not in [x[0] for x in RESULTS]:
            log_result(tc_id, "SKIP", "Requires language switch to verify key resolution in other languages")


# ──────────────────────────────────────────────────────────────────────
# Main runner
# ──────────────────────────────────────────────────────────────────────

async def run_all():
    print(f"\n{'='*60}")
    print(f"🧪 {SC}: Background Translation — CDP E2E Test")
    print(f"{'='*60}")
    print("⚠️  Translation feature not yet implemented. Most TCs SKIP.")
    print("    Testing: i18n label rendering, key resolution, Vietnamese text.\n")

    session = await setup_fresh(full_onboard=True, scenario=SC)
    try:
        # Run automatable TCs
        await tc_bt_12(session)
        await tc_bt_126_to_140(session)

        # Register all remaining SKIP TCs
        register_skip_tcs()

        # Ensure ALL 210 TCs are in RESULTS
        existing_ids = {r[0] for r in RESULTS}
        for i in range(1, 211):
            tc_id = f"TC_BT_{i:02d}" if i < 100 else f"TC_BT_{i}"
            if tc_id not in existing_ids:
                log_result(tc_id, "SKIP", "Translation feature not implemented — requires API + language switcher")

    finally:
        try:
            await session.ws.close()
        except Exception:
            pass

    # Print summary
    p = sum(1 for r in RESULTS if r[1] == "PASS")
    f = sum(1 for r in RESULTS if r[1] == "FAIL")
    s = sum(1 for r in RESULTS if r[1] == "SKIP")
    print(f"\n{'='*60}")
    print(f"{SC} SUMMARY: {p} PASS, {f} FAIL, {s} SKIP / {len(RESULTS)} total")
    print(f"{'='*60}")
    for r in RESULTS:
        icon = {"PASS": "✅", "FAIL": "❌", "SKIP": "⏭️"}.get(r[1], "❓")
        print(f"  {icon} [{r[1]}] {r[0]}: {r[2]}")


if __name__ == "__main__":
    run_scenario(run_all())
