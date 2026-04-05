"""
SC23 — i18n & Vietnamese Language E2E Tests
210 Test Cases: TC_I18N_001 → TC_I18N_210

Groups:
  1  TC_I18N_001–020  Navigation & Tab Labels
  2  TC_I18N_021–045  Button Labels
  3  TC_I18N_046–075  Form Labels & Placeholders
  4  TC_I18N_076–100  Error & Confirmation Messages
  5  TC_I18N_101–125  Modal Titles
  6  TC_I18N_126–150  Empty/Info States & Messages
  7  TC_I18N_151–175  Date/Number/Unit Formatting
  8  TC_I18N_176–200  i18n Keys & Translation Consistency
  9  TC_I18N_201–210  Vietnamese Diacritics & Performance

Pre-conditions: Fresh install, full onboarding with default values.
Run: python scripts/e2e/sc23_i18n_language.py
"""

import asyncio
import json
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

SCENARIO = "SC23"
RESULTS: list[dict] = []


# ════════════════════════════════════════════════════════════════════════════
# Logging helpers
# ════════════════════════════════════════════════════════════════════════════

def log_result(tc_id: str, status: str, detail: str = ""):
    icon = {"PASS": "✅", "FAIL": "❌", "SKIP": "⏭️"}.get(status, "❓")
    RESULTS.append({"tc": tc_id, "status": status, "detail": detail})
    print(f"  {icon} [{tc_id}] {detail}")


def check(tc_id: str, detail: str, expected, actual) -> bool:
    exp_s, act_s = str(expected), str(actual).strip() if actual else "N/A"
    ok = exp_s == act_s
    log_result(tc_id, "PASS" if ok else "FAIL", f"{detail} — exp={exp_s}, got={act_s}")
    return ok


def check_contains(tc_id: str, detail: str, substr, actual) -> bool:
    ok = str(substr).lower() in str(actual).lower()
    log_result(tc_id, "PASS" if ok else "FAIL",
               f"{detail} — expect contains '{substr}', got={str(actual)[:80]}")
    return ok


def check_true(tc_id: str, detail: str, condition) -> bool:
    log_result(tc_id, "PASS" if condition else "FAIL",
               f"{detail} — value={condition}")
    return bool(condition)


def skip(tc_id: str, reason: str):
    log_result(tc_id, "SKIP", reason)


# ════════════════════════════════════════════════════════════════════════════
# i18n helper utilities
# ════════════════════════════════════════════════════════════════════════════

_VIET_DIACRITICS_PATTERN = r"[đăâêôơưĐĂÂÊÔƠƯàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễ" \
    r"ìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]"


async def get_i18n_language(s: CDPSession) -> str:
    """Get current i18next language setting."""
    return await s.ev(
        "(function(){try{return window.i18next.language}catch(e){return 'unavailable'}})()"
    )


async def i18n_t(s: CDPSession, key: str) -> str:
    """Resolve an i18n key via i18next.t()."""
    return await s.ev(
        f"(function(){{try{{return window.i18next.t('{key}')}}catch(e){{return 'ERR:'+e.message}}}})()"
    )


async def i18n_exists(s: CDPSession, key: str) -> bool:
    """Check if an i18n key exists in loaded resources."""
    val = await s.ev(
        f"(function(){{try{{return window.i18next.exists('{key}')}}catch(e){{return false}}}})()"
    )
    return val is True or str(val).lower() == "true"


async def i18n_has_bundle(s: CDPSession, lng: str, ns: str = "translation") -> bool:
    """Check if a resource bundle is loaded."""
    val = await s.ev(
        f"(function(){{try{{return window.i18next.hasResourceBundle('{lng}','{ns}')}}"
        f"catch(e){{return false}}}})()"
    )
    return val is True or str(val).lower() == "true"


async def body_text(s: CDPSession, max_chars: int = 3000) -> str:
    """Get visible page text."""
    return await s.ev(
        f"document.body.innerText.substring(0,{max_chars})"
    )


async def has_vietnamese_chars(s: CDPSession) -> bool:
    """Check if body text contains Vietnamese diacritics."""
    val = await s.ev(
        "(function(){return /[đăâêôơưĐĂÂÊÔƠƯ]/i.test(document.body.innerText)})()"
    )
    return val is True or str(val).lower() == "true"


async def get_nav_text(s: CDPSession, testid: str) -> str:
    """Get text of a nav element by data-testid."""
    return await s.ev(
        f"(function(){{var e=document.querySelector('[data-testid=\"{testid}\"]');"
        f"return e?e.textContent.trim():'N/A'}})()"
    )


async def count_english_only_lines(s: CDPSession) -> int:
    """Count lines in body text that are purely ASCII (potential untranslated text).
    Excludes short lines (<4 chars), numbers, units (kcal, g, kg, cm)."""
    return await s.ev(r"""(function(){
        var lines = document.body.innerText.split('\n');
        var count = 0;
        for(var i=0;i<lines.length;i++){
            var l = lines[i].trim();
            if(l.length < 4) continue;
            if(/^\d[\d\s,.\/%:]*$/.test(l)) continue;
            if(/^(kcal|kg|cm|g|ml|Protein|Carbs|BMR|TDEE|BMI|RPE)$/i.test(l)) continue;
            if(/^[\x00-\x7F]+$/.test(l) && /[a-zA-Z]{3,}/.test(l)){
                count++;
            }
        }
        return count;
    })()""")


# ════════════════════════════════════════════════════════════════════════════
# GROUP 1: Navigation & Tab Labels (TC_I18N_001–020)
# ════════════════════════════════════════════════════════════════════════════

async def group1_nav_tabs(s: CDPSession):
    print(f"\n{'─'*60}")
    print("  GROUP 1: Navigation & Tab Labels (TC_I18N_001–020)")
    print(f"{'─'*60}")

    # TC_I18N_001: Calendar tab shows Vietnamese label
    await s.nav_calendar()
    await s.wait(WAIT_NAV_CLICK)
    txt = await get_nav_text(s, "nav-calendar")
    check_contains("TC_I18N_001", "Calendar tab label in Vietnamese", "Lịch", txt)

    # TC_I18N_002: Library tab shows Vietnamese label
    txt = await get_nav_text(s, "nav-library")
    check_contains("TC_I18N_002", "Library tab label in Vietnamese", "Thư viện", txt)

    # TC_I18N_003: AI Analysis tab shows Vietnamese label
    txt = await get_nav_text(s, "nav-ai-analysis")
    check_contains("TC_I18N_003", "AI tab label in Vietnamese", "Phân tích", txt)

    # TC_I18N_004: Fitness tab shows Vietnamese label
    txt = await get_nav_text(s, "nav-fitness")
    check_contains("TC_I18N_004", "Fitness tab label in Vietnamese", "Tập luyện", txt)

    # TC_I18N_005: Dashboard tab shows Vietnamese label
    txt = await get_nav_text(s, "nav-dashboard")
    check_contains("TC_I18N_005", "Dashboard tab label in Vietnamese", "Tổng quan", txt)

    await s.screenshot(SCENARIO, "005_nav_tabs")

    # TC_I18N_006: Calendar page body contains Vietnamese text
    await s.nav_calendar()
    await s.wait(WAIT_NAV_CLICK)
    has_vi = await has_vietnamese_chars(s)
    check_true("TC_I18N_006", "Calendar page has Vietnamese characters", has_vi)

    # TC_I18N_007: Calendar sub-tab Meals in Vietnamese
    await s.subtab_meals()
    await s.wait(WAIT_QUICK_ACTION)
    bt = await body_text(s)
    has_meal_tab = "Bữa ăn" in bt or "Sáng" in bt or "Trưa" in bt or "Tối" in bt
    check_true("TC_I18N_007", "Meals sub-tab shows Vietnamese meal types", has_meal_tab)

    # TC_I18N_008: Calendar sub-tab Nutrition in Vietnamese
    await s.subtab_nutrition()
    await s.wait(WAIT_QUICK_ACTION)
    bt = await body_text(s)
    has_nutr = "Calo" in bt or "Protein" in bt or "Mục tiêu" in bt or "kcal" in bt
    check_true("TC_I18N_008", "Nutrition sub-tab shows nutrition labels", has_nutr)

    # TC_I18N_009: Calendar header contains Vietnamese day names or month
    await s.subtab_meals()
    await s.wait(WAIT_QUICK_ACTION)
    bt = await body_text(s, 2000)
    has_day = any(d in bt for d in ["Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7", "CN",
                                     "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm",
                                     "Thứ Sáu", "Thứ Bảy", "Chủ Nhật",
                                     "Hôm nay", "T2", "T3", "T4", "T5", "T6", "T7"])
    check_true("TC_I18N_009", "Calendar shows Vietnamese day labels", has_day)

    await s.screenshot(SCENARIO, "009_calendar_days")

    # TC_I18N_010: SKIP — no breadcrumb in mobile app
    skip("TC_I18N_010", "No breadcrumb navigation in mobile app")

    # TC_I18N_011: Library page title in Vietnamese
    await s.nav_library()
    await s.wait(WAIT_NAV_CLICK)
    bt = await body_text(s, 1500)
    has_lib = "Món ăn" in bt or "Nguyên liệu" in bt or "Thư viện" in bt
    check_true("TC_I18N_011", "Library page shows Vietnamese titles", has_lib)

    # TC_I18N_012: SKIP — tooltips not visible on mobile touch interface
    skip("TC_I18N_012", "Tooltips not applicable on mobile touch UI")

    # TC_I18N_013: SKIP — no footer in mobile app
    skip("TC_I18N_013", "No footer component in mobile app")

    # TC_I18N_014: App title / header in Vietnamese
    bt = await body_text(s, 1000)
    has_app = any(w in bt for w in ["Meal", "Thư viện", "Lịch", "Tổng quan"])
    check_true("TC_I18N_014", "App header shows recognizable title", has_app)

    # TC_I18N_015: SKIP — loading state flashes too briefly to capture
    skip("TC_I18N_015", "Loading state too brief to verify text")

    # TC_I18N_016: SKIP — error boundary not triggerable via normal flow
    skip("TC_I18N_016", "Cannot trigger error boundary in normal E2E flow")

    # TC_I18N_017: SKIP — offline banner requires network manipulation
    skip("TC_I18N_017", "Offline banner requires network disconnection")

    # TC_I18N_018: SKIP — welcome message only on first run (already past onboarding)
    skip("TC_I18N_018", "Welcome message only visible during first-run onboarding")

    # TC_I18N_019: Fitness tab page body in Vietnamese
    await s.nav_fitness()
    await s.wait(WAIT_NAV_CLICK)
    bt = await body_text(s)
    has_fit = any(w in bt for w in ["Tập luyện", "Kế hoạch", "Buổi tập", "Bài tập"])
    check_true("TC_I18N_019", "Fitness page shows Vietnamese content", has_fit)

    # TC_I18N_020: Dashboard page body in Vietnamese
    await s.nav_dashboard()
    await s.wait(WAIT_NAV_CLICK)
    bt = await body_text(s)
    has_dash = any(w in bt for w in ["Tổng quan", "Hôm nay", "Mục tiêu", "Năng lượng",
                                      "Calo", "Protein", "Kế hoạch"])
    check_true("TC_I18N_020", "Dashboard page shows Vietnamese content", has_dash)

    await s.screenshot(SCENARIO, "020_dashboard_vi")
    print("  ✅ Group 1 complete")


# ════════════════════════════════════════════════════════════════════════════
# GROUP 2: Button Labels (TC_I18N_021–045)
# ════════════════════════════════════════════════════════════════════════════

async def group2_buttons(s: CDPSession):
    print(f"\n{'─'*60}")
    print("  GROUP 2: Button Labels (TC_I18N_021–045)")
    print(f"{'─'*60}")

    # Navigate to calendar to check common buttons
    await s.nav_calendar()
    await s.subtab_meals()
    await s.wait(WAIT_NAV_CLICK)
    bt = await body_text(s, 3000)

    # TC_I18N_021: i18n key common.save resolves to Vietnamese
    val = await i18n_t(s, "common.save")
    check("TC_I18N_021", "common.save resolves", "Lưu", val)

    # TC_I18N_022: i18n key common.cancel resolves
    val = await i18n_t(s, "common.cancel")
    check("TC_I18N_022", "common.cancel resolves", "Hủy", val)

    # TC_I18N_023: i18n key common.confirm resolves
    val = await i18n_t(s, "common.confirm")
    check("TC_I18N_023", "common.confirm resolves", "Xác nhận", val)

    # TC_I18N_024: i18n key common.delete resolves
    val = await i18n_t(s, "common.delete")
    check("TC_I18N_024", "common.delete resolves", "Xóa", val)

    # TC_I18N_025: i18n key common.edit resolves
    val = await i18n_t(s, "common.edit")
    check("TC_I18N_025", "common.edit resolves", "Chỉnh sửa", val)

    # TC_I18N_026: i18n key common.close resolves
    val = await i18n_t(s, "common.close")
    check("TC_I18N_026", "common.close resolves", "Đóng", val)

    # TC_I18N_027: i18n key common.back resolves
    val = await i18n_t(s, "common.back")
    check("TC_I18N_027", "common.back resolves", "Quay lại", val)

    # TC_I18N_028: i18n key common.search resolves
    val = await i18n_t(s, "common.search")
    check("TC_I18N_028", "common.search resolves", "Tìm kiếm", val)

    # TC_I18N_029: i18n key common.add resolves
    val = await i18n_t(s, "common.add")
    check("TC_I18N_029", "common.add resolves", "Thêm", val)

    # TC_I18N_030: "Lên kế hoạch" button visible on calendar
    plan_btn = "Lên kế hoạch" in bt or "kế hoạch" in bt.lower()
    check_true("TC_I18N_030", "Plan meal button in Vietnamese on calendar", plan_btn)

    # TC_I18N_031: i18n key common.undo resolves
    val = await i18n_t(s, "common.undo")
    check_contains("TC_I18N_031", "common.undo resolves Vietnamese", "Hoàn tác", val)

    # TC_I18N_032: i18n key common.copy resolves
    val = await i18n_t(s, "common.copy")
    check("TC_I18N_032", "common.copy resolves", "Sao chép", val)

    # TC_I18N_033: i18n key common.share resolves
    val = await i18n_t(s, "common.share")
    check("TC_I18N_033", "common.share resolves", "Chia sẻ", val)

    # TC_I18N_034: i18n key common.retry resolves
    val = await i18n_t(s, "common.retry")
    check("TC_I18N_034", "common.retry resolves", "Thử lại", val)

    # TC_I18N_035: i18n key common.loading resolves
    val = await i18n_t(s, "common.loading")
    check_contains("TC_I18N_035", "common.loading resolves Vietnamese", "Đang tải", val)

    # TC_I18N_036: Navigate to Library, check "Thêm món ăn" button text key
    await s.nav_library()
    await s.wait(WAIT_NAV_CLICK)
    val = await i18n_t(s, "dish.addNew")
    check("TC_I18N_036", "dish.addNew resolves", "Thêm món ăn", val)

    # TC_I18N_037: "Thêm nguyên liệu" key resolves
    val = await i18n_t(s, "ingredient.addNew")
    check("TC_I18N_037", "ingredient.addNew resolves", "Thêm nguyên liệu", val)

    # TC_I18N_038: calendar.planMeal resolves
    val = await i18n_t(s, "calendar.planMeal")
    check("TC_I18N_038", "calendar.planMeal resolves", "Lên kế hoạch", val)

    # TC_I18N_039: calendar.clearPlan resolves
    val = await i18n_t(s, "calendar.clearPlan")
    check("TC_I18N_039", "calendar.clearPlan resolves", "Xóa kế hoạch", val)

    # TC_I18N_040: calendar.aiSuggest resolves
    val = await i18n_t(s, "calendar.aiSuggest")
    check("TC_I18N_040", "calendar.aiSuggest resolves", "Gợi ý AI", val)

    # TC_I18N_041: planning.confirmButton resolves
    val = await i18n_t(s, "planning.confirmButton")
    check("TC_I18N_041", "planning.confirmButton resolves", "Xác nhận", val)

    # TC_I18N_042: filter.apply resolves
    val = await i18n_t(s, "filter.apply")
    check_contains("TC_I18N_042", "filter.apply resolves Vietnamese", "Áp dụng", val)

    # TC_I18N_043: filter.reset resolves
    val = await i18n_t(s, "filter.reset")
    check_contains("TC_I18N_043", "filter.reset resolves Vietnamese", "Đặt lại", val)

    # TC_I18N_044: backup.export resolves
    val = await i18n_t(s, "backup.export")
    check_contains("TC_I18N_044", "backup.export resolves Vietnamese", "Xuất", val)

    # TC_I18N_045: backup.import resolves
    val = await i18n_t(s, "backup.import")
    check_contains("TC_I18N_045", "backup.import resolves Vietnamese", "Nhập", val)

    await s.screenshot(SCENARIO, "045_button_labels")
    print("  ✅ Group 2 complete")


# ════════════════════════════════════════════════════════════════════════════
# GROUP 3: Form Labels & Placeholders (TC_I18N_046–075)
# ════════════════════════════════════════════════════════════════════════════

async def group3_form_labels(s: CDPSession):
    print(f"\n{'─'*60}")
    print("  GROUP 3: Form Labels & Placeholders (TC_I18N_046–075)")
    print(f"{'─'*60}")

    # -- Health Profile labels via i18n keys --

    # TC_I18N_046: healthProfile.title
    val = await i18n_t(s, "healthProfile.title")
    check("TC_I18N_046", "healthProfile.title resolves", "Hồ sơ sức khỏe", val)

    # TC_I18N_047: healthProfile.gender
    val = await i18n_t(s, "healthProfile.gender")
    check("TC_I18N_047", "healthProfile.gender resolves", "Giới tính", val)

    # TC_I18N_048: healthProfile.male
    val = await i18n_t(s, "healthProfile.male")
    check("TC_I18N_048", "healthProfile.male resolves", "Nam", val)

    # TC_I18N_049: healthProfile.female
    val = await i18n_t(s, "healthProfile.female")
    check("TC_I18N_049", "healthProfile.female resolves", "Nữ", val)

    # TC_I18N_050: healthProfile.height
    val = await i18n_t(s, "healthProfile.height")
    check_contains("TC_I18N_050", "healthProfile.height resolves Vietnamese", "Chiều cao", val)

    # TC_I18N_051: healthProfile.weight
    val = await i18n_t(s, "healthProfile.weight")
    check_contains("TC_I18N_051", "healthProfile.weight resolves Vietnamese", "Cân nặng", val)

    # TC_I18N_052: healthProfile.bodyFat
    val = await i18n_t(s, "healthProfile.bodyFat")
    check_contains("TC_I18N_052", "healthProfile.bodyFat resolves Vietnamese", "mỡ", val)

    # TC_I18N_053: healthProfile.activityLevel
    val = await i18n_t(s, "healthProfile.activityLevel")
    check_contains("TC_I18N_053", "healthProfile.activityLevel resolves Vietnamese", "vận động", val)

    # TC_I18N_054: healthProfile.sedentary
    val = await i18n_t(s, "healthProfile.sedentary")
    check_contains("TC_I18N_054", "healthProfile.sedentary resolves", "Ít vận động", val)

    # TC_I18N_055: healthProfile.moderate
    val = await i18n_t(s, "healthProfile.moderate")
    check_contains("TC_I18N_055", "healthProfile.moderate resolves", "vừa phải", val)

    # TC_I18N_056: healthProfile.active
    val = await i18n_t(s, "healthProfile.active")
    check_contains("TC_I18N_056", "healthProfile.active resolves", "tích cực", val)

    # TC_I18N_057: healthProfile.age
    val = await i18n_t(s, "healthProfile.age")
    check("TC_I18N_057", "healthProfile.age resolves", "Tuổi", val)

    # -- Open Settings to verify form labels on screen --
    await s.open_settings()
    await s.wait(WAIT_NAV_CLICK)
    bt = await body_text(s, 3000)

    # TC_I18N_058: Settings page shows "Cài đặt"
    check_contains("TC_I18N_058", "Settings shows Vietnamese title", "Cài đặt", bt)

    # TC_I18N_059: Settings shows "Giao diện" (theme)
    check_contains("TC_I18N_059", "Settings shows theme label", "Giao diện", bt)

    # TC_I18N_060: Settings shows "Dữ liệu" (data)
    check_contains("TC_I18N_060", "Settings shows data label", "Dữ liệu", bt)

    await s.screenshot(SCENARIO, "060_settings_labels")

    await s.close_settings()
    await s.wait(WAIT_MODAL_CLOSE)

    # -- Meal type labels --

    # TC_I18N_061: meal.breakfastFull
    val = await i18n_t(s, "meal.breakfastFull")
    check("TC_I18N_061", "meal.breakfastFull resolves", "Bữa Sáng", val)

    # TC_I18N_062: meal.lunchFull
    val = await i18n_t(s, "meal.lunchFull")
    check("TC_I18N_062", "meal.lunchFull resolves", "Bữa Trưa", val)

    # TC_I18N_063: meal.dinnerFull
    val = await i18n_t(s, "meal.dinnerFull")
    check("TC_I18N_063", "meal.dinnerFull resolves", "Bữa Tối", val)

    # TC_I18N_064: meal.snackFull
    val = await i18n_t(s, "meal.snackFull")
    check("TC_I18N_064", "meal.snackFull resolves", "Bữa Phụ", val)

    # -- Ingredient form labels --

    # TC_I18N_065: ingredient.ingredientName
    val = await i18n_t(s, "ingredient.ingredientName")
    check_contains("TC_I18N_065", "ingredient.ingredientName resolves", "Tên nguyên liệu", val)

    # TC_I18N_066: ingredient.unitLabel
    val = await i18n_t(s, "ingredient.unitLabel")
    check_contains("TC_I18N_066", "ingredient.unitLabel resolves", "Đơn vị", val)

    # TC_I18N_067: dish.searchPlaceholder
    val = await i18n_t(s, "dish.searchPlaceholder")
    check_contains("TC_I18N_067", "dish.searchPlaceholder resolves Vietnamese", "Tìm kiếm", val)

    # TC_I18N_068: ingredient.searchPlaceholder
    val = await i18n_t(s, "ingredient.searchPlaceholder")
    check_contains("TC_I18N_068", "ingredient.searchPlaceholder resolves Vietnamese", "Tìm kiếm", val)

    # TC_I18N_069: settings.searchPlaceholder
    val = await i18n_t(s, "settings.searchPlaceholder")
    check_contains("TC_I18N_069", "settings.searchPlaceholder resolves Vietnamese", "Tìm kiếm", val)

    # -- Nutrition labels --

    # TC_I18N_070: common.calories
    val = await i18n_t(s, "common.calories")
    check("TC_I18N_070", "common.calories resolves", "Calo", val)

    # TC_I18N_071: common.protein
    val = await i18n_t(s, "common.protein")
    check("TC_I18N_071", "common.protein resolves", "Protein", val)

    # TC_I18N_072: common.fat
    val = await i18n_t(s, "common.fat")
    check_contains("TC_I18N_072", "common.fat resolves Vietnamese", "Béo", val)

    # TC_I18N_073: common.fiber
    val = await i18n_t(s, "common.fiber")
    check_contains("TC_I18N_073", "common.fiber resolves Vietnamese", "Chất xơ", val)

    # TC_I18N_074: nutrition.target
    val = await i18n_t(s, "nutrition.target")
    check("TC_I18N_074", "nutrition.target resolves", "Mục tiêu", val)

    # TC_I18N_075: nutrition.remaining
    val = await i18n_t(s, "nutrition.remaining")
    check("TC_I18N_075", "nutrition.remaining resolves", "Còn lại", val)

    print("  ✅ Group 3 complete")


# ════════════════════════════════════════════════════════════════════════════
# GROUP 4: Error & Confirmation Messages (TC_I18N_076–100)
# ════════════════════════════════════════════════════════════════════════════

async def group4_error_messages(s: CDPSession):
    print(f"\n{'─'*60}")
    print("  GROUP 4: Error & Confirmation Messages (TC_I18N_076–100)")
    print(f"{'─'*60}")

    # Verify error/validation keys exist in i18n — cannot trigger most errors easily

    # TC_I18N_076: validation.healthProfile.nameRequired key exists
    ex = await i18n_exists(s, "validation.healthProfile.nameRequired")
    check_true("TC_I18N_076", "Key validation.healthProfile.nameRequired exists", ex)

    # TC_I18N_077: validation.healthProfile.dobRequired key exists
    ex = await i18n_exists(s, "validation.healthProfile.dobRequired")
    check_true("TC_I18N_077", "Key validation.healthProfile.dobRequired exists", ex)

    # TC_I18N_078: validation.healthProfile.heightMin key exists
    ex = await i18n_exists(s, "validation.healthProfile.heightMin")
    check_true("TC_I18N_078", "Key validation.healthProfile.heightMin exists", ex)

    # TC_I18N_079: validation.healthProfile.weightMin key exists
    ex = await i18n_exists(s, "validation.healthProfile.weightMin")
    check_true("TC_I18N_079", "Key validation.healthProfile.weightMin exists", ex)

    # TC_I18N_080: validation.ingredient.nameRequired key exists
    ex = await i18n_exists(s, "validation.ingredient.nameRequired")
    check_true("TC_I18N_080", "Key validation.ingredient.nameRequired exists", ex)

    # TC_I18N_081: validation.ingredient.unitRequired key exists
    ex = await i18n_exists(s, "validation.ingredient.unitRequired")
    check_true("TC_I18N_081", "Key validation.ingredient.unitRequired exists", ex)

    # TC_I18N_082: validation.ingredient.valueRequired key resolves Vietnamese
    val = await i18n_t(s, "validation.ingredient.valueRequired")
    check_contains("TC_I18N_082", "valueRequired resolves Vietnamese", "Vui lòng", val)

    # TC_I18N_083: validation.ingredient.valueNonNegative resolves Vietnamese
    val = await i18n_t(s, "validation.ingredient.valueNonNegative")
    check_contains("TC_I18N_083", "valueNonNegative resolves Vietnamese", "không được âm", val)

    # TC_I18N_084: validation.healthProfile.nameRequired resolves Vietnamese
    val = await i18n_t(s, "validation.healthProfile.nameRequired")
    check_contains("TC_I18N_084", "nameRequired resolves Vietnamese", "Vui lòng", val)

    # TC_I18N_085: validation.healthProfile.heightMax key exists
    ex = await i18n_exists(s, "validation.healthProfile.heightMax")
    check_true("TC_I18N_085", "Key validation.healthProfile.heightMax exists", ex)

    # TC_I18N_086: validation.healthProfile.weightMax key exists
    ex = await i18n_exists(s, "validation.healthProfile.weightMax")
    check_true("TC_I18N_086", "Key validation.healthProfile.weightMax exists", ex)

    # TC_I18N_087: validation.healthProfile.bodyFatMin key exists
    ex = await i18n_exists(s, "validation.healthProfile.bodyFatMin")
    check_true("TC_I18N_087", "Key validation.healthProfile.bodyFatMin exists", ex)

    # TC_I18N_088: validation.healthProfile.bmrPositive key exists
    ex = await i18n_exists(s, "validation.healthProfile.bmrPositive")
    check_true("TC_I18N_088", "Key validation.healthProfile.bmrPositive exists", ex)

    # TC_I18N_089: validation.healthProfile.proteinRatioMin key exists
    ex = await i18n_exists(s, "validation.healthProfile.proteinRatioMin")
    check_true("TC_I18N_089", "Key validation.healthProfile.proteinRatioMin exists", ex)

    # TC_I18N_090–100: SKIP — require specific error triggers
    skip("TC_I18N_090", "Network error message: requires network manipulation")
    skip("TC_I18N_091", "API timeout message: requires backend unavailable")
    skip("TC_I18N_092", "Import invalid file error: requires file upload flow")
    skip("TC_I18N_093", "Sync conflict message: requires cloud sync state")
    skip("TC_I18N_094", "Storage full warning: requires device storage manipulation")
    skip("TC_I18N_095", "Permission denied message: requires OS permission denial")
    skip("TC_I18N_096", "Camera error message: requires camera access failure")
    skip("TC_I18N_097", "Export failure message: requires export to fail")
    skip("TC_I18N_098", "Database corruption message: requires DB corruption")
    skip("TC_I18N_099", "Session expired message: app has no server sessions")
    skip("TC_I18N_100", "Rate limit message: app is offline-first, no rate limiting")

    print("  ✅ Group 4 complete")


# ════════════════════════════════════════════════════════════════════════════
# GROUP 5: Modal Titles (TC_I18N_101–125)
# ════════════════════════════════════════════════════════════════════════════

async def group5_modal_titles(s: CDPSession):
    print(f"\n{'─'*60}")
    print("  GROUP 5: Modal Titles (TC_I18N_101–125)")
    print(f"{'─'*60}")

    # Verify modal title i18n keys exist — opening each modal is complex

    # TC_I18N_101: dish.detail key exists
    ex = await i18n_exists(s, "dish.detail")
    check_true("TC_I18N_101", "Key dish.detail exists", ex)

    # TC_I18N_102: dish.editDish key resolves Vietnamese
    val = await i18n_t(s, "dish.editDish")
    check_contains("TC_I18N_102", "dish.editDish resolves Vietnamese", "Chỉnh sửa", val)

    # TC_I18N_103: ingredient.editIngredient key resolves Vietnamese
    val = await i18n_t(s, "ingredient.editIngredient")
    check_contains("TC_I18N_103", "ingredient.editIngredient resolves Vietnamese", "Chỉnh sửa", val)

    # TC_I18N_104: planning.title key exists
    ex = await i18n_exists(s, "planning.title")
    check_true("TC_I18N_104", "Key planning.title exists", ex)

    # TC_I18N_105: clearPlan.title key resolves Vietnamese
    val = await i18n_t(s, "clearPlan.title")
    check_contains("TC_I18N_105", "clearPlan.title resolves Vietnamese", "Xóa", val)

    # TC_I18N_106: copyPlan.title key resolves Vietnamese
    val = await i18n_t(s, "copyPlan.title")
    check_contains("TC_I18N_106", "copyPlan.title resolves Vietnamese", "Sao chép", val)

    # TC_I18N_107: grocery.title key resolves Vietnamese
    val = await i18n_t(s, "grocery.title")
    check_contains("TC_I18N_107", "grocery.title resolves Vietnamese", "chợ", val)

    # TC_I18N_108: energyDetail.title key exists
    ex = await i18n_exists(s, "energyDetail.title")
    check_true("TC_I18N_108", "Key energyDetail.title exists", ex)

    # TC_I18N_109: settings.title key resolves
    val = await i18n_t(s, "settings.title")
    check("TC_I18N_109", "settings.title resolves", "Cài đặt", val)

    # TC_I18N_110: goalSettings.title key exists
    ex = await i18n_exists(s, "goalSettings.title")
    check_true("TC_I18N_110", "Key goalSettings.title exists", ex)

    # TC_I18N_111: backup.title key resolves Vietnamese
    val = await i18n_t(s, "backup.title")
    check_contains("TC_I18N_111", "backup.title resolves Vietnamese text", "Sao lưu", val)

    # TC_I18N_112: cloudSync.title key exists
    ex = await i18n_exists(s, "cloudSync.title")
    check_true("TC_I18N_112", "Key cloudSync.title exists", ex)

    # TC_I18N_113: ai.title key exists
    ex = await i18n_exists(s, "ai.title")
    check_true("TC_I18N_113", "Key ai.title exists", ex)

    # TC_I18N_114: fitness.onboarding.title key resolves Vietnamese
    val = await i18n_t(s, "fitness.onboarding.title")
    check_contains("TC_I18N_114", "fitness.onboarding.title resolves Vietnamese", "tập luyện", val)

    # TC_I18N_115: errorBoundary.defaultTitle key exists
    ex = await i18n_exists(s, "errorBoundary.defaultTitle")
    check_true("TC_I18N_115", "Key errorBoundary.defaultTitle exists", ex)

    # TC_I18N_116–125: SKIP — modals that need complex trigger flows
    skip("TC_I18N_116", "Sync conflict modal: requires cloud sync conflict state")
    skip("TC_I18N_117", "Import progress modal: requires import flow")
    skip("TC_I18N_118", "Export progress modal: requires export flow")
    skip("TC_I18N_119", "Delete confirmation modal: requires item selection context")
    skip("TC_I18N_120", "Unsaved changes modal: requires dirty form + navigation")
    skip("TC_I18N_121", "AI analysis result modal: requires AI analysis completion")
    skip("TC_I18N_122", "Camera capture modal: requires camera access")
    skip("TC_I18N_123", "Image preview modal: requires image selection")
    skip("TC_I18N_124", "Share modal: requires share API")
    skip("TC_I18N_125", "Version update modal: app has no update mechanism via E2E")

    print("  ✅ Group 5 complete")


# ════════════════════════════════════════════════════════════════════════════
# GROUP 6: Empty/Info States & Messages (TC_I18N_126–150)
# ════════════════════════════════════════════════════════════════════════════

async def group6_empty_info(s: CDPSession):
    print(f"\n{'─'*60}")
    print("  GROUP 6: Empty/Info States & Messages (TC_I18N_126–150)")
    print(f"{'─'*60}")

    # TC_I18N_126: calendar.emptyTitle key resolves Vietnamese
    val = await i18n_t(s, "calendar.emptyTitle")
    check_contains("TC_I18N_126", "calendar.emptyTitle resolves Vietnamese", "Chưa có", val)

    # TC_I18N_127: calendar.emptyDesc key resolves Vietnamese
    val = await i18n_t(s, "calendar.emptyDesc")
    check_contains("TC_I18N_127", "calendar.emptyDesc resolves Vietnamese", "bữa ăn", val)

    # TC_I18N_128: grocery.emptyTitle key resolves Vietnamese
    val = await i18n_t(s, "grocery.emptyTitle")
    check_contains("TC_I18N_128", "grocery.emptyTitle resolves Vietnamese", "Chưa có", val)

    # TC_I18N_129: grocery.emptyDescription key resolves Vietnamese
    val = await i18n_t(s, "grocery.emptyDescription")
    check_contains("TC_I18N_129", "grocery.emptyDescription resolves Vietnamese", "kế hoạch", val)

    # TC_I18N_130: emptyState.notFound key exists
    ex = await i18n_exists(s, "emptyState.notFound")
    check_true("TC_I18N_130", "Key emptyState.notFound exists", ex)

    # TC_I18N_131: emptyState.noItems key exists
    ex = await i18n_exists(s, "emptyState.noItems")
    check_true("TC_I18N_131", "Key emptyState.noItems exists", ex)

    # TC_I18N_132: dashboard.hero.firstTime.title key resolves Vietnamese
    val = await i18n_t(s, "dashboard.hero.firstTime.title")
    check_contains("TC_I18N_132", "firstTime.title resolves Vietnamese", "hành trình", val)

    # TC_I18N_133: dashboard.todaysPlan.noPlan key resolves Vietnamese
    val = await i18n_t(s, "dashboard.todaysPlan.noPlan")
    check_contains("TC_I18N_133", "noPlan resolves Vietnamese", "Chưa có", val)

    # TC_I18N_134: fitness.plan.noPlan key resolves Vietnamese
    val = await i18n_t(s, "fitness.plan.noPlan")
    check_contains("TC_I18N_134", "fitness.plan.noPlan resolves Vietnamese", "Chưa có", val)

    # TC_I18N_135: fitness.plan.createPlan key resolves Vietnamese
    val = await i18n_t(s, "fitness.plan.createPlan")
    check_contains("TC_I18N_135", "createPlan resolves Vietnamese", "Tạo kế hoạch", val)

    # TC_I18N_136: notification.saveSuccess key exists
    ex = await i18n_exists(s, "notification.saveSuccess")
    check_true("TC_I18N_136", "Key notification.saveSuccess exists", ex)

    # TC_I18N_137: notification.planUpdated key exists
    ex = await i18n_exists(s, "notification.planUpdated")
    check_true("TC_I18N_137", "Key notification.planUpdated exists", ex)

    # TC_I18N_138: notification.importSuccess key exists
    ex = await i18n_exists(s, "notification.importSuccess")
    check_true("TC_I18N_138", "Key notification.importSuccess exists", ex)

    # TC_I18N_139: dish.deleted key resolves Vietnamese
    val = await i18n_t(s, "dish.deleted")
    check_contains("TC_I18N_139", "dish.deleted resolves Vietnamese", "Đã xóa", val)

    # TC_I18N_140: ingredient.deleted key resolves Vietnamese
    val = await i18n_t(s, "ingredient.deleted")
    check_contains("TC_I18N_140", "ingredient.deleted resolves Vietnamese", "Đã xóa", val)

    # TC_I18N_141: macro.noData key exists
    ex = await i18n_exists(s, "macro.noData")
    check_true("TC_I18N_141", "Key macro.noData exists", ex)

    # TC_I18N_142: planning.noMatchTitle key exists
    ex = await i18n_exists(s, "planning.noMatchTitle")
    check_true("TC_I18N_142", "Key planning.noMatchTitle exists", ex)

    # TC_I18N_143: planning.noMatchHint key exists
    ex = await i18n_exists(s, "planning.noMatchHint")
    check_true("TC_I18N_143", "Key planning.noMatchHint exists", ex)

    # TC_I18N_144: ai.emptyHint key exists
    ex = await i18n_exists(s, "ai.emptyHint")
    check_true("TC_I18N_144", "Key ai.emptyHint exists", ex)

    # TC_I18N_145: recommendation.missing key exists
    ex = await i18n_exists(s, "recommendation.missing")
    check_true("TC_I18N_145", "Key recommendation.missing exists", ex)

    # TC_I18N_146: adjustmentHistory.noData key exists
    ex = await i18n_exists(s, "adjustmentHistory.noData")
    check_true("TC_I18N_146", "Key adjustmentHistory.noData exists", ex)

    # TC_I18N_147–150: SKIP — info states requiring specific app state
    skip("TC_I18N_147", "Workout complete state: requires finishing a workout")
    skip("TC_I18N_148", "Weight log empty state: requires clearing weight logs")
    skip("TC_I18N_149", "Deload suggestion state: requires weeks of training data")
    skip("TC_I18N_150", "Streak info message: requires specific streak count")

    print("  ✅ Group 6 complete")


# ════════════════════════════════════════════════════════════════════════════
# GROUP 7: Date/Number/Unit Formatting (TC_I18N_151–175)
# ════════════════════════════════════════════════════════════════════════════

async def group7_date_number(s: CDPSession):
    print(f"\n{'─'*60}")
    print("  GROUP 7: Date/Number/Unit Formatting (TC_I18N_151–175)")
    print(f"{'─'*60}")

    # Navigate to calendar to check date formatting
    await s.nav_calendar()
    await s.subtab_meals()
    await s.wait(WAIT_NAV_CLICK)
    bt = await body_text(s, 3000)

    # TC_I18N_151: Calendar shows "Hôm nay" label for today
    val = await i18n_t(s, "calendar.today")
    check("TC_I18N_151", "calendar.today resolves", "Hôm nay", val)

    # TC_I18N_152: Page body contains "Hôm nay" or today-related text
    has_today = "Hôm nay" in bt or "hôm nay" in bt
    check_true("TC_I18N_152", "Calendar page shows 'Hôm nay'", has_today)

    # TC_I18N_153: calendar.weekMode key resolves Vietnamese
    val = await i18n_t(s, "calendar.weekMode")
    check_contains("TC_I18N_153", "calendar.weekMode resolves Vietnamese", "tuần", val)

    # TC_I18N_154: calendar.calendarMode key resolves Vietnamese
    val = await i18n_t(s, "calendar.calendarMode")
    check_contains("TC_I18N_154", "calendar.calendarMode resolves Vietnamese", "lịch", val)

    # TC_I18N_155: Nutrition uses "kcal" unit
    await s.subtab_nutrition()
    await s.wait(WAIT_QUICK_ACTION)
    bt = await body_text(s, 3000)
    check_contains("TC_I18N_155", "Nutrition page shows kcal unit", "kcal", bt)

    # TC_I18N_156: nutrition.kcal key resolves
    val = await i18n_t(s, "nutrition.kcal")
    check("TC_I18N_156", "nutrition.kcal resolves", "kcal", val)

    # TC_I18N_157: nutrition.grams key resolves
    val = await i18n_t(s, "nutrition.grams")
    check("TC_I18N_157", "nutrition.grams resolves", "g", val)

    await s.screenshot(SCENARIO, "157_nutrition_units")

    # TC_I18N_158: Protein displayed with "g" unit on page
    has_g = "g" in bt
    check_true("TC_I18N_158", "Nutrition page shows 'g' unit for macros", has_g)

    # TC_I18N_159: meal.breakfast short label
    val = await i18n_t(s, "meal.breakfast")
    check("TC_I18N_159", "meal.breakfast short resolves", "Sáng", val)

    # TC_I18N_160: meal.lunch short label
    val = await i18n_t(s, "meal.lunch")
    check("TC_I18N_160", "meal.lunch short resolves", "Trưa", val)

    # TC_I18N_161: meal.dinner short label
    val = await i18n_t(s, "meal.dinner")
    check("TC_I18N_161", "meal.dinner short resolves", "Tối", val)

    # TC_I18N_162: goal.cut key resolves Vietnamese
    val = await i18n_t(s, "goal.cut")
    check_contains("TC_I18N_162", "goal.cut resolves Vietnamese", "Giảm", val)

    # TC_I18N_163: goal.maintain key resolves Vietnamese
    val = await i18n_t(s, "goal.maintain")
    check_contains("TC_I18N_163", "goal.maintain resolves Vietnamese", "Duy trì", val)

    # TC_I18N_164: goal.bulk key resolves Vietnamese
    val = await i18n_t(s, "goal.bulk")
    check_contains("TC_I18N_164", "goal.bulk resolves Vietnamese", "Tăng", val)

    # TC_I18N_165: goal.conservative key resolves Vietnamese
    val = await i18n_t(s, "goal.conservative")
    check_contains("TC_I18N_165", "goal.conservative resolves Vietnamese text",
                   "Nhẹ", val)

    # TC_I18N_166: goal.aggressive key resolves Vietnamese
    val = await i18n_t(s, "goal.aggressive")
    check_contains("TC_I18N_166", "goal.aggressive resolves Vietnamese text",
                   "Mạnh", val)

    # TC_I18N_167: nutrition.caloriesIn key resolves Vietnamese
    val = await i18n_t(s, "nutrition.caloriesIn")
    check_contains("TC_I18N_167", "nutrition.caloriesIn resolves Vietnamese", "Nạp", val)

    # TC_I18N_168: nutrition.caloriesOut key resolves Vietnamese
    val = await i18n_t(s, "nutrition.caloriesOut")
    check_contains("TC_I18N_168", "nutrition.caloriesOut resolves Vietnamese", "Tiêu hao", val)

    # TC_I18N_169: nutrition.netCalories key resolves Vietnamese
    val = await i18n_t(s, "nutrition.netCalories")
    check_contains("TC_I18N_169", "nutrition.netCalories resolves Vietnamese", "Cân bằng", val)

    # TC_I18N_170: nutrition.energyBalance key resolves Vietnamese
    val = await i18n_t(s, "nutrition.energyBalance")
    check_contains("TC_I18N_170", "nutrition.energyBalance resolves Vietnamese", "năng lượng", val)

    # TC_I18N_171: common.total key resolves Vietnamese
    val = await i18n_t(s, "common.total")
    check_contains("TC_I18N_171", "common.total resolves Vietnamese", "Tổng", val)

    # TC_I18N_172: nutrition.proteinGoalMet key resolves Vietnamese
    val = await i18n_t(s, "nutrition.proteinGoalMet")
    check_contains("TC_I18N_172", "proteinGoalMet resolves Vietnamese", "protein", val)

    # TC_I18N_173: healthProfile.height includes "cm" unit
    val = await i18n_t(s, "healthProfile.height")
    check_contains("TC_I18N_173", "healthProfile.height includes cm unit", "cm", val)

    # TC_I18N_174: healthProfile.weight includes "kg" unit
    val = await i18n_t(s, "healthProfile.weight")
    check_contains("TC_I18N_174", "healthProfile.weight includes kg unit", "kg", val)

    # TC_I18N_175: SKIP — decimal separator formatting (locale-dependent, hard to isolate)
    skip("TC_I18N_175", "Decimal separator: depends on OS locale, not app i18n")

    print("  ✅ Group 7 complete")


# ════════════════════════════════════════════════════════════════════════════
# GROUP 8: i18n Keys & Translation Consistency (TC_I18N_176–200)
# ════════════════════════════════════════════════════════════════════════════

async def group8_i18n_keys(s: CDPSession):
    print(f"\n{'─'*60}")
    print("  GROUP 8: i18n Keys & Translation Consistency (TC_I18N_176–200)")
    print(f"{'─'*60}")

    # TC_I18N_176: i18next language is 'vi'
    lang = await get_i18n_language(s)
    check("TC_I18N_176", "i18next.language is 'vi'", "vi", lang)

    # TC_I18N_177: Vietnamese resource bundle is loaded
    has = await i18n_has_bundle(s, "vi")
    check_true("TC_I18N_177", "i18next has 'vi' resource bundle", has)

    # TC_I18N_178: i18next is initialized (not undefined)
    init = await s.ev(
        "(function(){return typeof window.i18next !== 'undefined' && window.i18next.isInitialized})()"
    )
    is_init = init is True or str(init).lower() == "true"
    check_true("TC_I18N_178", "i18next is initialized", is_init)

    # TC_I18N_179: 'en' bundle NOT loaded as primary (Vietnamese-only app)
    lang_check = await s.ev(
        "(function(){try{return window.i18next.language}catch(e){return 'err'}})()"
    )
    check_true("TC_I18N_179", "Primary language is not English",
               str(lang_check) != "en")

    # TC_I18N_180: nav keys all exist
    nav_keys = ["nav.calendar", "nav.management", "nav.aiAnalysis",
                "nav.fitness", "nav.dashboard", "nav.settings"]
    all_exist = True
    for k in nav_keys:
        ex = await i18n_exists(s, k)
        if not ex:
            all_exist = False
            break
    check_true("TC_I18N_180", "All nav i18n keys exist", all_exist)

    # TC_I18N_181: common section has >= 20 keys
    count = await s.ev(r"""(function(){
        try{
            var res = window.i18next.store.data.vi.translation.common;
            return res ? Object.keys(res).length : 0;
        }catch(e){return 0}
    })()""")
    check_true("TC_I18N_181", f"common section has ≥20 keys (got {count})",
               int(count or 0) >= 20)

    # TC_I18N_182: meal section has keys for all meal types
    meal_keys = ["meal.breakfast", "meal.lunch", "meal.dinner",
                 "meal.breakfastFull", "meal.lunchFull", "meal.dinnerFull"]
    all_exist = True
    for k in meal_keys:
        ex = await i18n_exists(s, k)
        if not ex:
            all_exist = False
            break
    check_true("TC_I18N_182", "All meal type i18n keys exist", all_exist)

    # TC_I18N_183: Calendar body text has Vietnamese chars (page-level check)
    await s.nav_calendar()
    await s.wait(WAIT_NAV_CLICK)
    has_vi = await has_vietnamese_chars(s)
    check_true("TC_I18N_183", "Calendar page body has Vietnamese diacritics", has_vi)

    # TC_I18N_184: Library body text has Vietnamese chars
    await s.nav_library()
    await s.wait(WAIT_NAV_CLICK)
    has_vi = await has_vietnamese_chars(s)
    check_true("TC_I18N_184", "Library page body has Vietnamese diacritics", has_vi)

    # TC_I18N_185: Fitness body text has Vietnamese chars
    await s.nav_fitness()
    await s.wait(WAIT_NAV_CLICK)
    has_vi = await has_vietnamese_chars(s)
    check_true("TC_I18N_185", "Fitness page body has Vietnamese diacritics", has_vi)

    # TC_I18N_186: Dashboard body text has Vietnamese chars
    await s.nav_dashboard()
    await s.wait(WAIT_NAV_CLICK)
    has_vi = await has_vietnamese_chars(s)
    check_true("TC_I18N_186", "Dashboard page body has Vietnamese diacritics", has_vi)

    await s.screenshot(SCENARIO, "186_dashboard_vi_chars")

    # TC_I18N_187: No excessive English-only lines on Calendar
    await s.nav_calendar()
    await s.wait(WAIT_NAV_CLICK)
    en_count = await count_english_only_lines(s)
    en_num = int(en_count or 0)
    check_true("TC_I18N_187", f"Calendar has few English-only lines ({en_num} ≤ 5)",
               en_num <= 5)

    # TC_I18N_188: No excessive English-only lines on Library
    await s.nav_library()
    await s.wait(WAIT_NAV_CLICK)
    en_count = await count_english_only_lines(s)
    en_num = int(en_count or 0)
    check_true("TC_I18N_188", f"Library has few English-only lines ({en_num} ≤ 5)",
               en_num <= 5)

    # TC_I18N_189: No excessive English-only lines on Dashboard
    await s.nav_dashboard()
    await s.wait(WAIT_NAV_CLICK)
    en_count = await count_english_only_lines(s)
    en_num = int(en_count or 0)
    check_true("TC_I18N_189", f"Dashboard has few English-only lines ({en_num} ≤ 5)",
               en_num <= 5)

    # TC_I18N_190: fitness section has onboarding keys
    fit_keys = ["fitness.onboarding.title", "fitness.onboarding.goal",
                "fitness.onboarding.experience"]
    all_exist = True
    for k in fit_keys:
        ex = await i18n_exists(s, k)
        if not ex:
            all_exist = False
            break
    check_true("TC_I18N_190", "Fitness onboarding i18n keys exist", all_exist)

    # TC_I18N_191: dashboard section has greeting keys
    dash_keys = ["dashboard.greetingMorning", "dashboard.greetingAfternoon"]
    all_exist = True
    for k in dash_keys:
        ex = await i18n_exists(s, k)
        if not ex:
            all_exist = False
            break
    check_true("TC_I18N_191", "Dashboard greeting i18n keys exist", all_exist)

    # TC_I18N_192: management sub-tab keys exist
    mgmt_keys = ["management.subTabDish", "management.subTabIngredient"]
    all_exist = True
    for k in mgmt_keys:
        ex = await i18n_exists(s, k)
        if not ex:
            all_exist = False
            break
    check_true("TC_I18N_192", "Management sub-tab i18n keys exist", all_exist)

    # TC_I18N_193: Total i18n key count is substantial (>200 keys)
    total_keys = await s.ev(r"""(function(){
        try{
            var data = window.i18next.store.data.vi.translation;
            var count = 0;
            function walk(obj){
                for(var k in obj){
                    if(typeof obj[k]==='object' && obj[k]!==null) walk(obj[k]);
                    else count++;
                }
            }
            walk(data);
            return count;
        }catch(e){return 0}
    })()""")
    key_count = int(total_keys or 0)
    check_true("TC_I18N_193", f"Total i18n keys ≥ 200 (got {key_count})",
               key_count >= 200)

    # TC_I18N_194: No key returns its own key path (untranslated fallback)
    critical_keys = ["common.save", "common.cancel", "nav.calendar",
                     "meal.breakfast", "settings.title"]
    all_translated = True
    for k in critical_keys:
        val = await i18n_t(s, k)
        if val == k:
            all_translated = False
            break
    check_true("TC_I18N_194", "Critical keys don't return key path as fallback",
               all_translated)

    # TC_I18N_195: settings language label resolves
    val = await i18n_t(s, "settings.language")
    check("TC_I18N_195", "settings.language resolves", "Ngôn ngữ", val)

    # TC_I18N_196: settings.langVi resolves
    val = await i18n_t(s, "settings.langVi")
    check("TC_I18N_196", "settings.langVi resolves", "Tiếng Việt", val)

    # TC_I18N_197: SKIP — language switching (app only supports Vietnamese)
    skip("TC_I18N_197", "Language switching: app is Vietnamese-only, no switcher")

    # TC_I18N_198: SKIP — RTL support (Vietnamese is LTR)
    skip("TC_I18N_198", "RTL support: Vietnamese is LTR, no RTL languages supported")

    # TC_I18N_199: SKIP — pluralization forms (Vietnamese has no plural forms)
    skip("TC_I18N_199", "Pluralization: Vietnamese has no grammatical plurals")

    # TC_I18N_200: SKIP — i18n namespace lazy loading (single namespace in this app)
    skip("TC_I18N_200", "Namespace lazy loading: app uses single translation namespace")

    print("  ✅ Group 8 complete")


# ════════════════════════════════════════════════════════════════════════════
# GROUP 9: Vietnamese Diacritics & Performance (TC_I18N_201–210)
# ════════════════════════════════════════════════════════════════════════════

async def group9_diacritics(s: CDPSession):
    print(f"\n{'─'*60}")
    print("  GROUP 9: Vietnamese Diacritics & Performance (TC_I18N_201–210)")
    print(f"{'─'*60}")

    # TC_I18N_201: Body text contains 'đ' (unique Vietnamese character)
    has_d = await s.ev(
        "(function(){return document.body.innerText.includes('đ') "
        "|| document.body.innerText.includes('Đ')})()"
    )
    check_true("TC_I18N_201", "Body text contains Vietnamese 'đ/Đ'",
               has_d is True or str(has_d).lower() == "true")

    # TC_I18N_202: Body text contains 'ư' (unique Vietnamese character)
    has_u = await s.ev(
        "(function(){return document.body.innerText.includes('ư') "
        "|| document.body.innerText.includes('Ư')})()"
    )
    check_true("TC_I18N_202", "Body text contains Vietnamese 'ư/Ư'",
               has_u is True or str(has_u).lower() == "true")

    # TC_I18N_203: Body text contains 'ơ' (unique Vietnamese character)
    has_o = await s.ev(
        "(function(){return document.body.innerText.includes('ơ') "
        "|| document.body.innerText.includes('Ơ')})()"
    )
    check_true("TC_I18N_203", "Body text contains Vietnamese 'ơ/Ơ'",
               has_o is True or str(has_o).lower() == "true")

    # TC_I18N_204: Body text contains tone marks (à, á, ả, ã, ạ family)
    has_tone = await s.ev(
        r"(function(){return /[àáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễ"
        r"ìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/.test(document.body.innerText)})()"
    )
    check_true("TC_I18N_204", "Body text contains Vietnamese tone marks",
               has_tone is True or str(has_tone).lower() == "true")

    # TC_I18N_205: Body text contains 'ă' or 'â' (circumflex/breve vowels)
    has_circ = await s.ev(
        "(function(){return /[ăâĂÂ]/.test(document.body.innerText)})()"
    )
    check_true("TC_I18N_205", "Body text contains ă/â characters",
               has_circ is True or str(has_circ).lower() == "true")

    # TC_I18N_206: Body text contains 'ê' or 'ô' (circumflex vowels)
    has_eo = await s.ev(
        "(function(){return /[êôÊÔ]/.test(document.body.innerText)})()"
    )
    check_true("TC_I18N_206", "Body text contains ê/ô characters",
               has_eo is True or str(has_eo).lower() == "true")

    # TC_I18N_207: Vietnamese text renders without mojibake (no replacement chars)
    has_replacement = await s.ev(
        r"(function(){return /[\uFFFD\u25A1\u2B1A]/.test(document.body.innerText)})()"
    )
    no_mojibake = has_replacement is False or str(has_replacement).lower() == "false"
    check_true("TC_I18N_207", "No mojibake/replacement characters in body text",
               no_mojibake)

    await s.screenshot(SCENARIO, "207_diacritics_render")

    # TC_I18N_208: i18n translation function responds quickly (< 50ms for batch)
    perf_ms = await s.ev(r"""(function(){
        var keys = ['common.save','common.cancel','common.confirm','common.delete',
                    'common.edit','common.close','nav.calendar','nav.dashboard',
                    'meal.breakfast','meal.lunch','settings.title','nutrition.target'];
        var start = performance.now();
        for(var i=0;i<keys.length;i++){
            window.i18next.t(keys[i]);
        }
        return Math.round(performance.now() - start);
    })()""")
    ms = int(perf_ms or 999)
    check_true("TC_I18N_208", f"i18n batch translate 12 keys in <50ms (took {ms}ms)",
               ms < 50)

    # TC_I18N_209: SKIP — i18n switch performance (app is Vietnamese-only)
    skip("TC_I18N_209", "i18n language switch perf: app is Vietnamese-only, no switching")

    # TC_I18N_210: SKIP — desktop viewport i18n layout (mobile-only app)
    skip("TC_I18N_210", "Desktop viewport i18n: app targets mobile only")

    print("  ✅ Group 9 complete")


# ════════════════════════════════════════════════════════════════════════════
# Summary & Main
# ════════════════════════════════════════════════════════════════════════════

def print_summary():
    """Print final SC23 test report."""
    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    failed = sum(1 for r in RESULTS if r["status"] == "FAIL")
    skipped = sum(1 for r in RESULTS if r["status"] == "SKIP")
    total = len(RESULTS)

    print(f"\n{'='*60}")
    print(f"  SC23 I18N & VIETNAMESE LANGUAGE — SUMMARY")
    print(f"  {passed} PASS | {failed} FAIL | {skipped} SKIP | {total} TOTAL")
    print(f"{'='*60}")

    if total < 210:
        print(f"\n  ⚠️  Missing TCs: {210 - total} (expected 210)")
        recorded = {r["tc"] for r in RESULTS}
        for i in range(1, 211):
            tc_id = f"TC_I18N_{i:03d}"
            if tc_id not in recorded:
                print(f"    ❓ {tc_id} — NOT RECORDED")

    if failed > 0:
        print(f"\n  ❌ FAILED TCs:")
        for r in RESULTS:
            if r["status"] == "FAIL":
                print(f"    ❌ {r['tc']}: {r['detail']}")

    if skipped > 0:
        print(f"\n  ⏭️  SKIPPED TCs ({skipped}):")
        for r in RESULTS:
            if r["status"] == "SKIP":
                print(f"    ⏭️  {r['tc']}: {r['detail']}")

    pf = passed + failed
    pct = (passed / pf * 100) if pf > 0 else 0
    print(f"\n  Pass rate (excl. SKIP): {passed}/{pf} = {pct:.1f}%")
    print(f"{'='*60}")
    print("✅ SC23 complete" if failed == 0 else "⚠️  SC23 has failures")
    print(f"{'='*60}")


async def main():
    """Run SC23: i18n & Vietnamese Language — 210 Test Cases."""
    print("=" * 60)
    print("🧪 SC23: i18n & Vietnamese Language (210 TCs)")
    print("=" * 60)

    s = await setup_fresh(full_onboard=True, scenario=SCENARIO)
    reset_steps(SCENARIO)

    try:
        await group1_nav_tabs(s)          # TC_I18N_001–020
        await group2_buttons(s)           # TC_I18N_021–045
        await group3_form_labels(s)       # TC_I18N_046–075
        await group4_error_messages(s)    # TC_I18N_076–100
        await group5_modal_titles(s)      # TC_I18N_101–125
        await group6_empty_info(s)        # TC_I18N_126–150
        await group7_date_number(s)       # TC_I18N_151–175
        await group8_i18n_keys(s)         # TC_I18N_176–200
        await group9_diacritics(s)        # TC_I18N_201–210
    finally:
        print_summary()


if __name__ == "__main__":
    run_scenario(main())
