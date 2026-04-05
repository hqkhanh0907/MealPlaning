"""
Group C — Ingredient & Dish CRUD
Scenarios: SC06 (Ingredient CRUD), SC07 (Dish CRUD)

Pre-conditions: Fresh install, bypass onboarding (seed data from DB init).
  Library tab contains 10 seed ingredients and 5 seed dishes.

Run: python scripts/e2e/group_c_crud.py
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
    WAIT_FORM_FILL,
    WAIT_SAVE_SETTINGS,
    CDPSession,
)

# Test results collector
RESULTS: list[dict] = []


def log_result(tc_id: str, step: str, expected: str, actual: str, status: str):
    """Log a test result."""
    icon = "✅" if status == "PASS" else "❌"
    RESULTS.append({"tc_id": tc_id, "step": step, "expected": expected, "actual": actual, "status": status})
    print(f"  {icon} [{tc_id}] {step}: expected={expected}, actual={actual}")


def check(tc_id: str, step: str, expected, actual):
    """Assert and log result."""
    exp_str = str(expected)
    act_str = str(actual)
    status = "PASS" if exp_str == act_str else "FAIL"
    log_result(tc_id, step, exp_str, act_str, status)
    return status == "PASS"


def check_contains(tc_id: str, step: str, expected_substr: str, actual: str):
    """Assert actual contains expected substring."""
    status = "PASS" if expected_substr.lower() in actual.lower() else "FAIL"
    log_result(tc_id, step, f"contains '{expected_substr}'", actual[:80], status)
    return status == "PASS"


def check_not(tc_id: str, step: str, unexpected: str, actual: str):
    """Assert actual does NOT contain unexpected string."""
    status = "PASS" if unexpected.lower() not in actual.lower() else "FAIL"
    log_result(tc_id, step, f"NOT contains '{unexpected}'", actual[:80], status)
    return status == "PASS"


# ============================================================
# SC06: Ingredient CRUD
# ============================================================

async def sc06_ingredient_crud(s: CDPSession):
    """SC06: Full ingredient CRUD lifecycle."""
    SC = "SC06"
    reset_steps(SC)
    print(f"\n{'='*60}")
    print(f"🧪 SC06: Ingredient CRUD")
    print(f"{'='*60}")

    # --- Step 1: Navigate to Library tab ---
    print("\n📋 Step 1: Navigate to Library tab")
    await s.nav_library()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SC, "library_tab")

    # --- Step 2: Switch to Ingredients sub-tab ---
    print("\n📋 Step 2: Switch to Ingredients sub-tab")
    r = await s.click_testid("tab-management-ingredients")
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SC, "ingredients_subtab")
    # Verify we see ingredient list (seed data has 10 ingredients)
    ing_count = await s.ev('''(function(){
        var cards = document.querySelectorAll('[data-testid^="btn-edit-ingredient-"]');
        return cards.length;
    })()''')
    print(f"  📊 Found {ing_count} ingredients (seed data)")

    # --- Step 3: Toggle grid/list view ---
    print("\n📋 Step 3: Toggle grid/list view")
    await s.click_testid("btn-view-list")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "list_view")

    await s.click_testid("btn-view-grid")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "grid_view")

    # --- Step 4: Sort ingredients by calories descending ---
    print("\n📋 Step 4: Sort by calories")
    sort_result = await s.ev('''(function(){
        var sel = document.querySelector('[data-testid="select-sort-ingredient"]');
        if (!sel) return 'no select';
        for (var i = 0; i < sel.options.length; i++) {
            if (sel.options[i].value === 'cal-desc') {
                sel.selectedIndex = i;
                sel.dispatchEvent(new Event('change', {bubbles: true}));
                return 'set:' + sel.value;
            }
        }
        return 'option not found';
    })()''')
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "sorted_cal_desc")
    print(f"  Sort result: {sort_result}")

    # Reset sort to name-asc for predictable order
    await s.ev('''(function(){
        var sel = document.querySelector('[data-testid="select-sort-ingredient"]');
        if (!sel) return;
        for (var i = 0; i < sel.options.length; i++) {
            if (sel.options[i].value === 'name-asc') {
                sel.selectedIndex = i;
                sel.dispatchEvent(new Event('change', {bubbles: true}));
                return;
            }
        }
    })()''')
    await s.wait(WAIT_QUICK_ACTION)

    # --- Step 5: Search for ingredient ---
    print("\n📋 Step 5: Search for ingredient")
    await s.set_input("input-search-ingredient", "Ức gà")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "search_uc_ga")

    # Verify search results
    search_count = await s.ev('''(function(){
        var cards = document.querySelectorAll('[data-testid^="btn-edit-ingredient-"]');
        return cards.length;
    })()''')
    print(f"  📊 Search results: {search_count} ingredients matching 'Ức gà'")

    # Clear search
    await s.set_input("input-search-ingredient", "")
    await s.wait(WAIT_QUICK_ACTION)

    # --- Step 6: Open add ingredient form ---
    print("\n📋 Step 6: Open add ingredient form")
    await s.click_testid("btn-add-ingredient")
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(SC, "add_ingredient_form_empty")

    # Verify modal is open
    modal_title = await s.ev('''(function(){
        var h = document.querySelector('[data-testid="btn-close-ingredient"]');
        if (!h) return 'no modal';
        var parent = h.closest('.bg-card');
        if (!parent) return 'no parent';
        var title = parent.querySelector('h4');
        return title ? title.textContent.trim() : 'no title';
    })()''')
    print(f"  Modal title: {modal_title}")

    # --- Step 7: Fill ingredient form ---
    print("\n📋 Step 7: Fill ingredient form")

    # Name
    await s.set_input("input-ing-name", "Test NL E2E")
    await s.wait(WAIT_FORM_FILL)
    await s.screenshot(SC, "form_name_filled")

    # Unit — select "g" from UnitSelector
    unit_result = await s.ev('''(function(){
        var sel = document.querySelector('[data-testid="input-ing-unit-select"]');
        if (!sel) return 'no unit select';
        for (var i = 0; i < sel.options.length; i++) {
            if (sel.options[i].value === 'g') {
                sel.selectedIndex = i;
                sel.dispatchEvent(new Event('change', {bubbles: true}));
                return 'set:' + sel.value;
            }
        }
        return 'g not found';
    })()''')
    await s.wait(WAIT_FORM_FILL)
    print(f"  Unit: {unit_result}")

    # Calories
    await s.set_input("input-ing-calories", "100")
    await s.wait(WAIT_FORM_FILL)
    await s.screenshot(SC, "form_calories_filled")

    # Protein
    await s.set_input("input-ing-protein", "10")
    await s.wait(WAIT_FORM_FILL)

    # Carbs
    await s.set_input("input-ing-carbs", "5")
    await s.wait(WAIT_FORM_FILL)

    # Fat
    await s.set_input("input-ing-fat", "3")
    await s.wait(WAIT_FORM_FILL)
    await s.screenshot(SC, "form_all_fields_filled")

    # --- Step 8: Save ingredient ---
    print("\n📋 Step 8: Save ingredient")
    await s.click_testid("btn-save-ingredient")
    await s.wait(WAIT_SAVE_SETTINGS)
    await s.screenshot(SC, "ingredient_saved")

    # Verify the new ingredient appears in the list
    new_ing_exists = await s.ev('''(function(){
        var els = document.querySelectorAll('button, h3, span, p');
        for (var i = 0; i < els.length; i++) {
            if (els[i].textContent.trim().includes('Test NL E2E')) return 'found';
        }
        return 'not found';
    })()''')
    check("TC_SC06_01", "New ingredient in list", "found", new_ing_exists)

    # --- Step 9: Click ingredient to view detail ---
    print("\n📋 Step 9: View ingredient detail")
    # Click on the ingredient name to open detail modal
    detail_click = await s.ev('''(function(){
        var btns = document.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
            if (btns[i].textContent.trim() === 'Test NL E2E') {
                var r = btns[i].getBoundingClientRect();
                if (r.width > 0) { btns[i].click(); return 'ok'; }
            }
        }
        return 'none';
    })()''')
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(SC, "ingredient_detail_view")

    # Verify detail modal content
    detail_visible = await s.get_text("detail-modal")
    check_contains("TC_SC06_02", "Detail modal shows name", "Test NL E2E", detail_visible)

    # --- Step 10: Click Edit from detail ---
    print("\n📋 Step 10: Edit from detail view")
    await s.click_testid("btn-detail-edit")
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(SC, "edit_form_from_detail")

    # Verify pre-filled values
    prefilled_name = await s.ev('''(function(){
        var el = document.querySelector('[data-testid="input-ing-name"]');
        return el ? el.value : 'no el';
    })()''')
    check("TC_SC06_03", "Edit form pre-filled name", "Test NL E2E", prefilled_name)

    prefilled_cal = await s.ev('''(function(){
        var el = document.querySelector('[data-testid="input-ing-calories"]');
        return el ? el.value : 'no el';
    })()''')
    check("TC_SC06_04", "Edit form pre-filled calories", "100", prefilled_cal)

    # --- Step 11: Change calories to 150 ---
    print("\n📋 Step 11: Update calories to 150")
    await s.ev('''(function(){
        var el = document.querySelector('[data-testid="input-ing-calories"]');
        if (!el) return 'no el';
        el.focus();
        el.select();
        var ns = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        ns.call(el, '150');
        el.dispatchEvent(new Event('input', {bubbles: true}));
        el.dispatchEvent(new Event('change', {bubbles: true}));
        return 'set:' + el.value;
    })()''')
    await s.wait(WAIT_FORM_FILL)
    await s.screenshot(SC, "calories_changed_150")

    # --- Step 12: Save updated ingredient ---
    print("\n📋 Step 12: Save updated ingredient")
    await s.click_testid("btn-save-ingredient")
    await s.wait(WAIT_SAVE_SETTINGS)
    await s.screenshot(SC, "ingredient_updated")

    # Verify updated calories in list
    updated_cal = await s.ev('''(function(){
        var els = document.querySelectorAll('button, span, p, div');
        var foundName = false;
        for (var i = 0; i < els.length; i++) {
            var t = els[i].textContent.trim();
            if (t === 'Test NL E2E') foundName = true;
            if (foundName && t === '150') return '150';
        }
        return 'not found';
    })()''')
    print(f"  Updated calories visible: {updated_cal}")

    # --- Step 13: Get the test ingredient ID for delete ---
    print("\n📋 Step 13: Delete ingredient")
    ing_id = await s.ev('''(function(){
        var btns = document.querySelectorAll('[data-testid^="btn-delete-ingredient-"]');
        for (var i = 0; i < btns.length; i++) {
            var tid = btns[i].getAttribute('data-testid');
            var card = btns[i].closest('.group, [class*="rounded-2xl"], [class*="relative"]');
            if (card && card.textContent.includes('Test NL E2E')) {
                return tid.replace('btn-delete-ingredient-', '');
            }
        }
        return 'not-found';
    })()''')
    print(f"  Ingredient ID: {ing_id}")

    if ing_id != "not-found":
        # Click delete button
        await s.click_testid(f"btn-delete-ingredient-{ing_id}")
        await s.wait(WAIT_MODAL_OPEN)
        await s.screenshot(SC, "delete_confirmation_dialog")

        # Verify confirmation modal is visible
        confirm_visible = await s.ev('''(function(){
            var btn = document.querySelector('[data-testid="btn-confirm-action"]');
            return btn ? 'visible' : 'not visible';
        })()''')
        check("TC_SC06_05", "Delete confirmation dialog shown", "visible", confirm_visible)

        # Confirm delete
        await s.click_testid("btn-confirm-action")
        await s.wait(WAIT_SAVE_SETTINGS)
        await s.screenshot(SC, "ingredient_deleted")

        # Verify ingredient is removed
        deleted_check = await s.ev('''(function(){
            var els = document.querySelectorAll('button, h3, span, p');
            for (var i = 0; i < els.length; i++) {
                if (els[i].textContent.trim() === 'Test NL E2E') return 'still exists';
            }
            return 'deleted';
        })()''')
        check("TC_SC06_06", "Ingredient removed from list", "deleted", deleted_check)
    else:
        log_result("TC_SC06_05", "Delete ingredient", "found ID", "not-found", "FAIL")

    print(f"\n✅ SC06 complete")


# ============================================================
# SC07: Dish CRUD
# ============================================================

async def sc07_dish_crud(s: CDPSession):
    """SC07: Full dish CRUD lifecycle."""
    SC = "SC07"
    reset_steps(SC)
    print(f"\n{'='*60}")
    print(f"🧪 SC07: Dish CRUD")
    print(f"{'='*60}")

    # --- Step 1: Navigate to Library → Dishes sub-tab ---
    print("\n📋 Step 1: Navigate to Dishes sub-tab")
    await s.nav_library()
    await s.wait(WAIT_NAV_CLICK)

    # Dishes is the default sub-tab, but click it explicitly
    await s.click_testid("tab-management-dishes")
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SC, "dishes_subtab")

    # Count seed dishes
    dish_count = await s.ev('''(function(){
        var btns = document.querySelectorAll('[data-testid^="btn-edit-dish-"]');
        return btns.length;
    })()''')
    print(f"  📊 Found {dish_count} dishes (seed data)")

    # --- Step 2: Toggle view and filter ---
    print("\n📋 Step 2: View toggle and filter")
    await s.click_testid("btn-view-list")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "dishes_list_view")

    await s.click_testid("btn-view-grid")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "dishes_grid_view")

    # Filter by breakfast tag
    await s.click_testid("btn-filter-breakfast")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "dishes_filter_breakfast")

    breakfast_count = await s.ev('''(function(){
        var btns = document.querySelectorAll('[data-testid^="btn-edit-dish-"]');
        return btns.length;
    })()''')
    print(f"  📊 Breakfast dishes: {breakfast_count}")

    # Clear filter
    await s.click_testid("btn-filter-all-dishes")
    await s.wait(WAIT_QUICK_ACTION)

    # --- Step 3: Open add dish form ---
    print("\n📋 Step 3: Open add dish form")
    await s.click_testid("btn-add-dish")
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(SC, "add_dish_form_empty")

    # Verify modal is open
    dish_modal_title = await s.ev('''(function(){
        var btn = document.querySelector('[data-testid="btn-close-dish"]');
        if (!btn) return 'no modal';
        var parent = btn.closest('.bg-card');
        if (!parent) return 'no parent';
        var title = parent.querySelector('h4');
        return title ? title.textContent.trim() : 'no title';
    })()''')
    print(f"  Modal title: {dish_modal_title}")

    # --- Step 4: Fill dish name ---
    print("\n📋 Step 4: Fill dish name")
    await s.set_input("input-dish-name", "Test Dish E2E")
    await s.wait(WAIT_FORM_FILL)
    await s.screenshot(SC, "dish_name_filled")

    # --- Step 5: Select meal type tags ---
    print("\n📋 Step 5: Select meal type tags")
    await s.click_testid("tag-breakfast")
    await s.wait(WAIT_FORM_FILL)
    await s.screenshot(SC, "tag_breakfast_selected")

    await s.click_testid("tag-lunch")
    await s.wait(WAIT_FORM_FILL)
    await s.screenshot(SC, "tag_lunch_selected")

    # Verify tags are selected
    tags_selected = await s.ev('''(function(){
        var tags = [];
        var btns = document.querySelectorAll('[data-testid^="tag-"]');
        btns.forEach(function(b) {
            if (b.classList.contains('bg-primary') || b.className.includes('bg-primary')) {
                var tid = b.getAttribute('data-testid');
                tags.push(tid.replace('tag-', ''));
            }
        });
        return tags.join(',');
    })()''')
    print(f"  Selected tags: {tags_selected}")

    # --- Step 6: Set rating ---
    print("\n📋 Step 6: Set rating")
    await s.click_testid("star-4")
    await s.wait(WAIT_FORM_FILL)
    await s.screenshot(SC, "rating_set")

    # --- Step 7: Add ingredients to dish ---
    print("\n📋 Step 7: Add ingredients to dish")

    # Find and add first available ingredient (one of the seed ingredients)
    first_ing_added = await s.ev('''(function(){
        var btns = document.querySelectorAll('[data-testid^="btn-add-ing-"]');
        if (btns.length === 0) return 'no ingredients';
        btns[0].click();
        return 'added:' + btns[0].getAttribute('data-testid');
    })()''')
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "first_ingredient_added")
    print(f"  First ingredient: {first_ing_added}")

    # Add second ingredient
    second_ing_added = await s.ev('''(function(){
        var btns = document.querySelectorAll('[data-testid^="btn-add-ing-"]');
        if (btns.length === 0) return 'no more ingredients';
        btns[0].click();
        return 'added:' + btns[0].getAttribute('data-testid');
    })()''')
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "second_ingredient_added")
    print(f"  Second ingredient: {second_ing_added}")

    # --- Step 8: Set ingredient amounts ---
    print("\n📋 Step 8: Set ingredient amounts")

    # Set amounts via the + button clicks (increment to desired amount)
    # First ingredient: use native setter on the amount input
    amount_set = await s.ev('''(function(){
        var inputs = document.querySelectorAll('[data-testid^="input-dish-amount-"]');
        var results = [];
        inputs.forEach(function(el) {
            var ns = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            ns.call(el, '150');
            el.dispatchEvent(new Event('input', {bubbles: true}));
            el.dispatchEvent(new Event('change', {bubbles: true}));
            results.push(el.getAttribute('data-testid') + '=' + el.value);
        });
        return results.join(', ');
    })()''')
    await s.wait(WAIT_FORM_FILL)
    await s.screenshot(SC, "amounts_set")
    print(f"  Amounts: {amount_set}")

    # --- Step 9: Verify nutrition preview ---
    print("\n📋 Step 9: Verify nutrition preview")
    total_cal = await s.get_text("dish-total-calories")
    print(f"  Total calories: {total_cal}")
    await s.screenshot(SC, "nutrition_preview")

    # --- Step 10: Save dish ---
    print("\n📋 Step 10: Save dish")
    await s.click_testid("btn-save-dish")
    await s.wait(WAIT_SAVE_SETTINGS)
    await s.screenshot(SC, "dish_saved")

    # Verify new dish appears in list
    new_dish_exists = await s.ev('''(function(){
        var els = document.querySelectorAll('button, h3, span, p, div');
        for (var i = 0; i < els.length; i++) {
            if (els[i].textContent.trim().includes('Test Dish E2E')) return 'found';
        }
        return 'not found';
    })()''')
    check("TC_SC07_01", "New dish in list", "found", new_dish_exists)

    # --- Step 11: View dish detail ---
    print("\n📋 Step 11: View dish detail")
    detail_click = await s.ev('''(function(){
        var btns = document.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
            if (btns[i].textContent.trim() === 'Test Dish E2E') {
                var r = btns[i].getBoundingClientRect();
                if (r.width > 0) { btns[i].click(); return 'ok'; }
            }
        }
        return 'none';
    })()''')
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(SC, "dish_detail_view")

    # Verify detail shows ingredients + nutrition
    detail_content = await s.get_text("detail-modal")
    check_contains("TC_SC07_02", "Detail shows dish name", "Test Dish E2E", detail_content)
    check_contains("TC_SC07_03", "Detail shows kcal", "kcal", detail_content)

    # --- Step 12: Edit dish from detail ---
    print("\n📋 Step 12: Edit dish from detail")
    await s.click_testid("btn-detail-edit")
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(SC, "edit_dish_form")

    # Verify pre-filled name
    prefilled_dish_name = await s.ev('''(function(){
        var el = document.querySelector('[data-testid="input-dish-name"]');
        return el ? el.value : 'no el';
    })()''')
    check("TC_SC07_04", "Edit form pre-filled name", "Test Dish E2E", prefilled_dish_name)

    # --- Step 13: Add another ingredient in edit mode ---
    print("\n📋 Step 13: Add ingredient in edit mode")
    third_ing = await s.ev('''(function(){
        var btns = document.querySelectorAll('[data-testid^="btn-add-ing-"]');
        if (btns.length === 0) return 'no more ingredients';
        btns[0].click();
        return 'added:' + btns[0].getAttribute('data-testid');
    })()''')
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "third_ingredient_added")
    print(f"  Third ingredient: {third_ing}")

    # Set amount for new ingredient
    await s.ev('''(function(){
        var inputs = document.querySelectorAll('[data-testid^="input-dish-amount-"]');
        if (inputs.length === 0) return 'no inputs';
        var last = inputs[inputs.length - 1];
        var ns = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        ns.call(last, '100');
        last.dispatchEvent(new Event('input', {bubbles: true}));
        last.dispatchEvent(new Event('change', {bubbles: true}));
        return 'set:' + last.value;
    })()''')
    await s.wait(WAIT_FORM_FILL)

    # --- Step 14: Remove an ingredient ---
    print("\n📋 Step 14: Remove an ingredient")
    remove_result = await s.ev('''(function(){
        var trashBtns = document.querySelectorAll('button[aria-label^="Xóa"], button[aria-label^="Delete"]');
        for (var i = 0; i < trashBtns.length; i++) {
            var r = trashBtns[i].getBoundingClientRect();
            if (r.width > 0) {
                trashBtns[i].click();
                return 'removed';
            }
        }
        return 'no trash btn';
    })()''')
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "ingredient_removed")
    print(f"  Remove result: {remove_result}")

    # --- Step 15: Save updated dish ---
    print("\n📋 Step 15: Save updated dish")
    await s.click_testid("btn-save-dish")
    await s.wait(WAIT_SAVE_SETTINGS)
    await s.screenshot(SC, "dish_updated")

    # --- Step 16: Search for dish ---
    print("\n📋 Step 16: Search for dish")
    await s.set_input("input-search-dish", "Test Dish")
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "search_dish")

    search_dish_count = await s.ev('''(function(){
        var btns = document.querySelectorAll('[data-testid^="btn-edit-dish-"]');
        return btns.length;
    })()''')
    print(f"  📊 Search results: {search_dish_count} dishes matching 'Test Dish'")
    check("TC_SC07_05", "Search finds test dish", "1", str(search_dish_count))

    # Clear search
    await s.set_input("input-search-dish", "")
    await s.wait(WAIT_QUICK_ACTION)

    # --- Step 17: Delete dish ---
    print("\n📋 Step 17: Delete dish")
    dish_id = await s.ev('''(function(){
        var btns = document.querySelectorAll('[data-testid^="btn-delete-dish-"]');
        for (var i = 0; i < btns.length; i++) {
            var tid = btns[i].getAttribute('data-testid');
            var card = btns[i].closest('.group, [class*="rounded-2xl"], [class*="relative"], [class*="flex"]');
            if (card && card.textContent.includes('Test Dish E2E')) {
                return tid.replace('btn-delete-dish-', '');
            }
        }
        return 'not-found';
    })()''')
    print(f"  Dish ID: {dish_id}")

    if dish_id != "not-found":
        await s.click_testid(f"btn-delete-dish-{dish_id}")
        await s.wait(WAIT_MODAL_OPEN)
        await s.screenshot(SC, "delete_dish_confirmation")

        # Verify confirmation dialog
        confirm_btn = await s.ev('''(function(){
            var btn = document.querySelector('[data-testid="btn-confirm-action"]');
            return btn ? 'visible' : 'not visible';
        })()''')
        check("TC_SC07_06", "Delete confirmation dialog shown", "visible", confirm_btn)

        # Confirm delete
        await s.click_testid("btn-confirm-action")
        await s.wait(WAIT_SAVE_SETTINGS)
        await s.screenshot(SC, "dish_deleted")

        # Verify dish removed
        deleted_dish = await s.ev('''(function(){
            var els = document.querySelectorAll('button, h3, span, p, div');
            for (var i = 0; i < els.length; i++) {
                if (els[i].textContent.trim() === 'Test Dish E2E') return 'still exists';
            }
            return 'deleted';
        })()''')
        check("TC_SC07_07", "Dish removed from list", "deleted", deleted_dish)
    else:
        log_result("TC_SC07_06", "Delete dish", "found ID", "not-found", "FAIL")

    # --- Step 18: Sort dishes ---
    print("\n📋 Step 18: Sort dishes")
    sort_dish_result = await s.ev('''(function(){
        var sel = document.querySelector('[data-testid="select-sort-dish"]');
        if (!sel) return 'no select';
        for (var i = 0; i < sel.options.length; i++) {
            if (sel.options[i].value === 'cal-desc') {
                sel.selectedIndex = i;
                sel.dispatchEvent(new Event('change', {bubbles: true}));
                return 'set:' + sel.value;
            }
        }
        return 'option not found';
    })()''')
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "dishes_sorted_cal_desc")
    print(f"  Sort result: {sort_dish_result}")

    print(f"\n✅ SC07 complete")


# ============================================================
# Main runner
# ============================================================

async def main():
    """Run all Group C scenarios in a single session."""
    print("\n" + "=" * 60)
    print("🏁 GROUP C: Ingredient & Dish CRUD")
    print("=" * 60)

    # Setup: fresh install, bypass onboarding
    s = await setup_fresh(full_onboard=False, scenario="SC06")

    # Run scenarios in sequence (single session, shared state)
    await sc06_ingredient_crud(s)
    await sc07_dish_crud(s)

    # === FINAL REPORT ===
    print("\n" + "=" * 60)
    print("📊 TEST REPORT — Group C")
    print("=" * 60)

    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    failed = sum(1 for r in RESULTS if r["status"] == "FAIL")
    total = len(RESULTS)

    for r in RESULTS:
        icon = "✅" if r["status"] == "PASS" else "❌"
        print(f"  {icon} {r['tc_id']}: {r['step']}")

    print(f"\n  Total: {total} | ✅ Passed: {passed} | ❌ Failed: {failed}")
    rate = (passed / total * 100) if total > 0 else 0
    print(f"  Pass Rate: {rate:.1f}%")

    if failed > 0:
        print("\n  ⚠️  FAILED TESTS:")
        for r in RESULTS:
            if r["status"] == "FAIL":
                print(f"    ❌ {r['tc_id']}: {r['step']}")
                print(f"       Expected: {r['expected']}")
                print(f"       Actual:   {r['actual']}")

    # Close WebSocket
    try:
        await s.ws.close()
    except Exception:
        pass

    print(f"\n📸 Screenshots saved to: screenshots/")
    print("🏁 Group C complete!\n")


if __name__ == "__main__":
    run_scenario(main())
