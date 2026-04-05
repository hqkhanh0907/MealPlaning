"""
Group G — AI Features E2E Tests (UI states only, NO API calls)
SC04: AI Meal Suggestion (Calendar AI Gợi ý button + modal)
SC05: AI Image Analysis (AI Analysis tab, camera/upload area)
SC21: AI Suggest Ingredients (Dish creation flow AI suggestion)

Uses cdp_framework.py helpers.
No full onboarding needed — bypass is sufficient for UI state screenshots.
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
# SC04: AI Meal Suggestion
# ═══════════════════════════════════════════════════════════

async def sc04_ai_meal_suggestion(s: CDPSession):
    """Test AI Meal Suggestion UI states on Calendar tab."""
    SC = "SC04"
    print_header("SC04: AI Meal Suggestion")

    # Step 1: Navigate to Calendar tab
    print_step("Navigate to Calendar tab")
    await s.nav_calendar()
    await s.screenshot(SC, "calendar_tab")

    # Step 2: Verify AI suggest button exists on action bar
    print_step("Locate AI Gợi ý button on MealActionBar")
    # Switch to meals subtab first where action bar is visible
    await s.subtab_meals()
    await s.wait(WAIT_QUICK_ACTION)
    await s.screenshot(SC, "meals_subtab_with_action_bar")

    ai_btn = await s.ev('''(function(){
        var b=document.querySelector('[data-testid="btn-ai-suggest"]');
        if(b){var r=b.getBoundingClientRect();return JSON.stringify({text:b.textContent.trim(),visible:r.width>0})}
        return'none'
    })()''')
    print_result("AI Suggest button", str(ai_btn))

    # Step 3: Click AI suggest button to open modal/sheet
    print_step("Click AI Gợi ý button")
    r = await s.click_testid("btn-ai-suggest")
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(SC, "ai_suggest_modal_opened")
    print_result("Click result", r, "ok")

    # Step 4: Screenshot any form elements (date selector, meal selection)
    print_step("Screenshot AI suggestion form/modal content")
    await s.wait(0.5)
    modal_content = await s.ev('''(function(){
        var els=document.querySelectorAll('[role="dialog"],[data-testid*="ai"],[class*="modal"],.fixed.inset-0');
        var found=[];
        els.forEach(function(e){
            var r=e.getBoundingClientRect();
            if(r.width>0) found.push({tag:e.tagName,testid:e.getAttribute('data-testid')||'',w:Math.round(r.width)});
        });
        return JSON.stringify(found);
    })()''')
    print_result("Modal/overlay elements", str(modal_content))
    await s.screenshot(SC, "ai_suggest_form_content")

    # Step 5: Screenshot loading/empty placeholder state
    print_step("Screenshot loading/empty state")
    loading_state = await s.ev('''(function(){
        var states=[];
        var loading=document.querySelector('[data-testid="ai-suggest-loading"]');
        if(loading)states.push('loading-indicator');
        var empty=document.querySelector('[data-testid="ai-suggest-empty"]');
        if(empty)states.push('empty-state: '+empty.textContent.trim());
        var spinners=document.querySelectorAll('.animate-spin,[class*="loader"],[class*="skeleton"]');
        if(spinners.length>0)states.push('spinners: '+spinners.length);
        return states.length>0?JSON.stringify(states):'no loading/empty states visible'
    })()''')
    print_result("Loading/empty states", str(loading_state))
    await s.screenshot(SC, "ai_suggest_loading_empty_state")

    # Step 6: Close modal and screenshot
    print_step("Close AI suggestion modal")
    # Try dismiss via backdrop, then X button, then Escape
    close_r = await s.dismiss_modal()
    await s.wait(WAIT_MODAL_CLOSE)
    # Fallback: try close button
    close_btn = await s.ev('''(function(){
        var btns=document.querySelectorAll('button');
        for(var i=btns.length-1;i>=0;i--){
            var a=btns[i].getAttribute('aria-label')||'';
            var t=btns[i].textContent.trim();
            if(a.includes('Đóng')||a.includes('Close')||t==='✕'||t==='×'){
                var r=btns[i].getBoundingClientRect();
                if(r.width>0){btns[i].click();return'closed via btn'}
            }
        }
        return'no close btn found'
    })()''')
    await s.wait(WAIT_MODAL_CLOSE)
    await s.screenshot(SC, "ai_suggest_closed")
    print_result("Close result", str(close_btn))

    print(f"\n  ✅ SC04 complete")


# ═══════════════════════════════════════════════════════════
# SC05: AI Image Analysis
# ═══════════════════════════════════════════════════════════

async def sc05_ai_image_analysis(s: CDPSession):
    """Test AI Image Analysis tab UI states."""
    SC = "SC05"
    reset_steps(SC)
    print_header("SC05: AI Image Analysis")

    # Step 1: Navigate to AI Analysis tab
    print_step("Navigate to AI Analysis tab")
    await s.nav_ai()
    await s.screenshot(SC, "ai_analysis_tab")

    # Step 2: Verify AIImageAnalyzer component is present
    print_step("Verify AIImageAnalyzer component")
    analyzer = await s.ev('''(function(){
        var el=document.querySelector('[data-testid="ai-image-analyzer"]');
        if(!el)return'not found';
        var r=el.getBoundingClientRect();
        return JSON.stringify({visible:r.width>0,h:Math.round(r.height)});
    })()''')
    print_result("AI Image Analyzer", str(analyzer))

    # Step 3: Screenshot the step indicators (1→2→3 flow)
    print_step("Screenshot step indicators (capture → analyze → save)")
    step_info = await s.ev('''(function(){
        var analyzer=document.querySelector('[data-testid="ai-image-analyzer"]');
        if(!analyzer)return'no analyzer';
        var steps=analyzer.querySelectorAll('span');
        var labels=[];
        steps.forEach(function(sp){
            var t=sp.textContent.trim();
            if(t&&!t.match(/^\\d+$/))labels.push(t);
        });
        return JSON.stringify(labels);
    })()''')
    print_result("Step labels", str(step_info))
    await s.screenshot(SC, "step_indicators")

    # Step 4: Screenshot camera/upload area (ImageCapture component)
    print_step("Screenshot camera/upload area")
    capture_area = await s.ev('''(function(){
        var el=document.querySelector('[data-testid="image-capture"]');
        if(!el)return'not found';
        var r=el.getBoundingClientRect();
        var btns=el.querySelectorAll('button');
        var btnTexts=[];
        btns.forEach(function(b){if(b.getBoundingClientRect().width>0)btnTexts.push(b.textContent.trim())});
        return JSON.stringify({visible:r.width>0,h:Math.round(r.height),buttons:btnTexts});
    })()''')
    print_result("Image capture area", str(capture_area))
    await s.screenshot(SC, "camera_upload_area")

    # Step 5: Check if there's a file upload input
    print_step("Check for upload input")
    upload_input = await s.ev('''(function(){
        var inputs=document.querySelectorAll('input[type="file"]');
        var found=[];
        inputs.forEach(function(i){
            found.push({accept:i.getAttribute('accept')||'',capture:i.getAttribute('capture')||''});
        });
        return JSON.stringify(found);
    })()''')
    print_result("File upload inputs", str(upload_input))

    # Step 6: Screenshot the dashed border upload zone (empty state)
    print_step("Screenshot empty analysis state")
    dashed_zone = await s.ev('''(function(){
        var zones=document.querySelectorAll('[class*="border-dashed"]');
        if(zones.length>0)return'found '+zones.length+' dashed upload zones';
        return'no dashed zones';
    })()''')
    print_result("Upload zone", str(dashed_zone))
    await s.screenshot(SC, "empty_analysis_state")

    # Step 7: Check analyze button state (should be disabled without image)
    print_step("Check analyze button disabled state")
    analyze_btn = await s.ev('''(function(){
        var btns=document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){
            var t=btns[i].textContent.trim();
            if(t.includes('Phân tích')||t.includes('Analyze')){
                return JSON.stringify({text:t,disabled:btns[i].disabled,
                    visible:btns[i].getBoundingClientRect().width>0});
            }
        }
        return'no analyze button found';
    })()''')
    print_result("Analyze button", str(analyze_btn))
    await s.screenshot(SC, "analyze_button_disabled")

    print(f"\n  ✅ SC05 complete")


# ═══════════════════════════════════════════════════════════
# SC21: AI Suggest Ingredients
# ═══════════════════════════════════════════════════════════

async def sc21_ai_suggest_ingredients(s: CDPSession):
    """Test AI Suggest Ingredients in dish creation flow."""
    SC = "SC21"
    reset_steps(SC)
    print_header("SC21: AI Suggest Ingredients")

    # Step 1: Navigate to Library tab
    print_step("Navigate to Library tab (DishManager)")
    await s.nav_library()
    await s.wait(WAIT_NAV_CLICK)
    await s.screenshot(SC, "library_tab")

    # Step 2: Look for add dish button and click it
    print_step("Open dish creation modal")
    # DishManager has an add button
    add_r = await s.ev('''(function(){
        var btns=document.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){
            var t=btns[i].textContent.trim();
            var a=btns[i].getAttribute('aria-label')||'';
            if(t.includes('Thêm món')||a.includes('Thêm món')||t.includes('Thêm')){
                var r=btns[i].getBoundingClientRect();
                if(r.width>0){btns[i].click();return'ok: '+t}
            }
        }
        return'none'
    })()''')
    await s.wait(WAIT_MODAL_OPEN)
    await s.screenshot(SC, "dish_creation_modal")
    print_result("Open dish form", str(add_r))

    # Step 3: Find AI suggest button in DishEditModal
    print_step("Locate AI Suggest button in dish form")
    ai_suggest = await s.ev('''(function(){
        var btn=document.querySelector('[data-testid="btn-ai-suggest"]');
        if(!btn)return'not found';
        var r=btn.getBoundingClientRect();
        return JSON.stringify({text:btn.textContent.trim(),visible:r.width>0,disabled:btn.disabled});
    })()''')
    print_result("AI Suggest button", str(ai_suggest))
    await s.screenshot(SC, "ai_suggest_button_in_form")

    # Step 4: Check loading indicator testid
    print_step("Check AI suggestion loading state")
    loading = await s.ev('''(function(){
        var el=document.querySelector('[data-testid="ai-suggest-loading"]');
        if(el)return'loading indicator present';
        return'no loading indicator (expected - not triggered yet)';
    })()''')
    print_result("Loading state", str(loading))

    # Step 5: Check AI suggest error area
    print_step("Check AI suggest error area")
    error = await s.ev('''(function(){
        var el=document.querySelector('[data-testid="ai-suggest-error"]');
        if(el)return'error area present: '+el.textContent.trim();
        return'no error (expected)';
    })()''')
    print_result("Error state", str(error))

    # Step 6: Screenshot the ingredient section with AI button
    print_step("Screenshot ingredient section with AI controls")
    await s.screenshot(SC, "ingredient_section_ai_controls")

    # Step 7: Also check QuickAddIngredientForm AI fill button
    print_step("Check Quick Add ingredient AI fill button")
    qa_ai = await s.ev('''(function(){
        var btn=document.querySelector('[data-testid="btn-qa-ai-fill"]');
        if(!btn)return'not visible (quick add form not open)';
        return JSON.stringify({text:btn.textContent.trim(),visible:btn.getBoundingClientRect().width>0});
    })()''')
    print_result("Quick Add AI fill", str(qa_ai))

    # Step 8: Check AI search in IngredientEditModal
    print_step("Check AI search button in ingredient modal")
    ai_search = await s.ev('''(function(){
        var btn=document.querySelector('[data-testid="btn-ai-search"]');
        if(!btn)return'not visible (ingredient modal not open)';
        return JSON.stringify({text:btn.textContent.trim(),visible:btn.getBoundingClientRect().width>0});
    })()''')
    print_result("AI Search button", str(ai_search))

    # Step 9: Close dish modal
    print_step("Close dish modal")
    await s.click_testid("btn-close-dish")
    await s.wait(WAIT_MODAL_CLOSE)
    await s.screenshot(SC, "dish_modal_closed")

    print(f"\n  ✅ SC21 complete")


# ═══════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════

async def main():
    print("\n" + "═" * 60)
    print("  GROUP G — AI Features E2E Tests")
    print("  SC04: AI Meal Suggestion")
    print("  SC05: AI Image Analysis")
    print("  SC21: AI Suggest Ingredients")
    print("═" * 60)

    s = await setup_fresh(full_onboard=False, scenario="SC04")

    try:
        await sc04_ai_meal_suggestion(s)
        await sc05_ai_image_analysis(s)
        await sc21_ai_suggest_ingredients(s)

        print("\n" + "═" * 60)
        print("  ✅ GROUP G — All scenarios complete")
        print("═" * 60)
    finally:
        await s.ws.close()


if __name__ == "__main__":
    run_scenario(main())
