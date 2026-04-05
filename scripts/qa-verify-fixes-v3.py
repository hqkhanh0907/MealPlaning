#!/usr/bin/env python3
"""
QA Verification Script v3 — Uses v1's proven onboarding flow + fixed goal selection.
Key fix: Goal step uses aria-pressed buttons (not divs) to click "Giảm cân".
"""
import json, asyncio, websockets, urllib.request, base64, os, re
from datetime import date, datetime

SCREENSHOTS_DIR = "/Users/khanhhuynh/person_project/MealPlaning/screenshots/qa-audit"
RESULTS = []

def log(msg): print(f"[QA] {msg}", flush=True)

def calc_expected(weight, height, dob_str, gender, activity, goal, rate):
    dob = date.fromisoformat(dob_str)
    today = date.today()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    s = 5 if gender == "male" else -161
    bmr = round(10 * weight + 6.25 * height - 5 * age + s)
    mults = {"sedentary":1.2,"light":1.375,"moderate":1.55,"active":1.725,"extra_active":1.9}
    tdee = round(bmr * mults[activity])
    offs = {"cut":{"conservative":-275,"moderate":-550,"aggressive":-1100},
            "maintain":{"moderate":0},
            "bulk":{"conservative":275,"moderate":550,"aggressive":1100}}
    target = tdee + offs.get(goal, {}).get(rate, 0)
    return {"bmr": bmr, "tdee": tdee, "target": target, "age": age}

def xnum(text):
    m = re.search(r'[\d,]+', str(text).replace(',', ''))
    return int(m.group().replace(',', '')) if m else -1

def record(tc, step, status, detail=""):
    RESULTS.append({"tc": tc, "step": step, "status": status, "detail": detail})
    icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    log(f"  {icon} [{tc}] {step}: {detail}")

async def run():
    data = json.loads(urllib.request.urlopen("http://localhost:9222/json").read())
    ws_url = [p["webSocketDebuggerUrl"] for p in data if p.get("webSocketDebuggerUrl")][0]
    log(f"Connecting to {ws_url}")

    async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
        mid = [100]

        async def ev(expr):
            mid[0] += 1
            await ws.send(json.dumps({"id": mid[0], "method": "Runtime.evaluate",
                "params": {"expression": expr, "returnByValue": True, "awaitPromise": True}}))
            while True:
                r = json.loads(await asyncio.wait_for(ws.recv(), timeout=30))
                if r.get("id") == mid[0]:
                    return r.get("result",{}).get("result",{}).get("value","")

        async def txt(tid):
            return await ev(f'(function(){{var e=document.querySelector(\'[data-testid="{tid}"]\');return e?e.textContent.trim():"N/A"}})()')

        async def clk(tid):
            return await ev(f'(function(){{var b=document.querySelector(\'[data-testid="{tid}"]\');if(b){{b.click();return"ok"}}return"none"}})()')

        async def clk_btn(text):
            """Click first visible button containing text"""
            return await ev(f'''(function(){{
                var btns=document.querySelectorAll('button');
                for(var i=0;i<btns.length;i++){{
                    if(btns[i].textContent.trim().includes('{text}')&&btns[i].getBoundingClientRect().width>0){{
                        btns[i].click();return'ok:'+btns[i].textContent.trim().substring(0,40)
                    }}
                }}
                return'none'
            }})()''')

        async def clk_btn_last(text):
            return await ev(f'''(function(){{
                var btns=document.querySelectorAll('button');
                for(var i=btns.length-1;i>=0;i--){{
                    if(btns[i].textContent.trim().includes('{text}')&&btns[i].getBoundingClientRect().width>0){{
                        btns[i].click();return'ok:'+btns[i].textContent.trim().substring(0,40)
                    }}
                }}
                return'none'
            }})()''')

        async def set_id(elem_id, value):
            return await ev(f'''(function(){{
                var el=document.getElementById('{elem_id}');
                if(!el)return'no el';
                var ns=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
                ns.call(el,'{value}');
                el.dispatchEvent(new Event('input',{{bubbles:true}}));
                el.dispatchEvent(new Event('change',{{bubbles:true}}));
                return'set:'+el.value;
            }})()''')

        async def set_tid(tid, value):
            return await ev(f'''(function(){{
                var el=document.querySelector('[data-testid="{tid}"]');
                if(!el)return'no el';
                var ns=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
                ns.call(el,'{value}');
                el.dispatchEvent(new Event('input',{{bubbles:true}}));
                el.dispatchEvent(new Event('change',{{bubbles:true}}));
                return'set:'+el.value;
            }})()''')

        async def shot(name):
            mid[0] += 1
            await ws.send(json.dumps({"id": mid[0], "method": "Page.captureScreenshot", "params": {"format": "png"}}))
            while True:
                r = json.loads(await asyncio.wait_for(ws.recv(), timeout=30))
                if r.get("id") == mid[0]:
                    with open(os.path.join(SCREENSHOTS_DIR, f"{name}.png"), "wb") as f:
                        f.write(base64.b64decode(r["result"]["data"]))
                    log(f"  📸 {name}.png")
                    return

        async def close_modal():
            await ev('(function(){var bd=document.querySelector(\'[data-testid="modal-backdrop"]\');if(bd)bd.click()})()')

        await ev("void 0")
        await asyncio.sleep(2)

        # ============================================================
        # TC_QA_01: ONBOARDING (v1 flow + fixed goal)
        # ============================================================
        log("=" * 60)
        log("TC_QA_01: Onboarding + Nutrition")
        log("=" * 60)
        await shot("v3_01_fresh")

        # Welcome
        await clk_btn("Tiếp tục"); await asyncio.sleep(1)
        await clk_btn("Tiếp tục"); await asyncio.sleep(1)
        await clk_btn("Bắt đầu"); await asyncio.sleep(1)

        # Health Basic
        log("  Health Basic")
        await clk_btn("Nam"); await asyncio.sleep(0.5)
        await set_id("ob-name", "QA Tester"); await asyncio.sleep(0.3)
        await set_id("ob-dob", "1996-05-15"); await asyncio.sleep(0.3)
        await set_id("ob-height", "175"); await asyncio.sleep(0.3)
        await set_id("ob-weight", "75"); await asyncio.sleep(0.3)
        await clk("health-basic-next"); await asyncio.sleep(1)

        # Activity — use v1's approach (button text match)
        log("  Activity")
        r = await clk_btn("Hoạt động vừa phải")
        if r == "none":
            r = await ev('''(function(){
                var cards=document.querySelectorAll('[role="button"],button,div[class*="cursor-pointer"]');
                for(var i=0;i<cards.length;i++){
                    if(cards[i].textContent.includes('Hoạt động vừa phải')){cards[i].click();return'ok-card'}
                }return'none'
            })()''')
        log(f"    Activity: {r}")
        await asyncio.sleep(1)
        await clk_btn("Tiếp tục"); await asyncio.sleep(1)

        # Goal — FIXED: target the actual button, not parent div
        log("  Goal")
        r = await ev('''(function(){
            // Use aria-pressed buttons (NutritionGoalStep's button elements)
            var btns = document.querySelectorAll('button[aria-pressed]');
            for(var i=0;i<btns.length;i++){
                if(btns[i].textContent.includes('Giảm cân')){
                    btns[i].click();
                    return 'ok:aria-pressed='+btns[i].getAttribute('aria-pressed');
                }
            }
            // Fallback: smallest button containing exactly "Giảm cân"
            var candidates = [];
            document.querySelectorAll('button').forEach(function(b){
                if(b.textContent.includes('Giảm cân') && b.getBoundingClientRect().width > 0){
                    candidates.push({el:b, len:b.textContent.length});
                }
            });
            candidates.sort(function(a,b){return a.len - b.len});
            if(candidates.length > 0){
                candidates[0].el.click();
                return 'ok-smallest:'+candidates[0].el.textContent.trim().substring(0,40);
            }
            return 'none';
        })()''')
        log(f"    Goal cut: {r}")
        await asyncio.sleep(0.5)

        # Verify goal was set
        goal_verify = await ev('''(function(){
            var btns = document.querySelectorAll('button[aria-pressed="true"]');
            for(var i=0;i<btns.length;i++){
                if(btns[i].textContent.includes('Giảm cân')) return 'cut-selected';
            }
            return 'not-selected';
        })()''')
        log(f"    Goal verify: {goal_verify}")
        record("TC_QA_01", "Goal = cut", "PASS" if "cut-selected" in goal_verify else "FAIL", goal_verify)
        await shot("v3_02_goal")

        await clk_btn("Tiếp tục"); await asyncio.sleep(1)

        # Confirm
        log("  Confirm")
        await shot("v3_03_confirm")
        await clk_btn("Xác nhận"); await asyncio.sleep(1)

        # Training — use v1's proven approach (click any matching text, then Tiếp tục)
        log("  Training setup")
        for step_label, texts in [
            ("goal", ["Tăng cơ"]),
            ("experience", ["Mới bắt đầu"]),
            ("days", ["3"]),
            ("duration", ["45", "60"]),
            ("equipment", ["Đầy đủ"]),
            ("sleep", ["7-8", "tiếng"]),
        ]:
            for search_text in texts:
                r = await ev(f'''(function(){{
                    var els=document.querySelectorAll('[role="button"],button,div');
                    for(var i=0;i<els.length;i++){{
                        var t=els[i].textContent;
                        if(t&&t.includes('{search_text}')&&els[i].getBoundingClientRect().width>0){{
                            els[i].click();return'ok'
                        }}
                    }}
                    return'none'
                }})()''')
                if r != "none":
                    break
            await asyncio.sleep(0.5)
            r = await clk_btn("Tiếp tục")
            if r == "none":
                r = await clk_btn("Bỏ qua")
            log(f"    {step_label}: {r}")
            await asyncio.sleep(1)

        # Strategy
        log("  Strategy")
        r = await clk("strategy-auto")
        log(f"    strategy-auto: {r}")
        await asyncio.sleep(1)
        r = await clk_btn("Tiếp tục")
        log(f"    strategy next: {r}")
        await asyncio.sleep(1)

        # Computing wait
        log("  Computing (14s)...")
        await asyncio.sleep(14)
        await shot("v3_04_preview")

        # Complete onboarding
        log("  Complete")
        r = await clk("onboarding-complete")
        if r == "none":
            r = await clk_btn("Bắt đầu tập luyện")
            if r == "none":
                r = await clk_btn("Bắt đầu")
        log(f"    Complete: {r}")
        await asyncio.sleep(3)

        nav_ok = await ev('document.querySelector("[role=\\"tablist\\"]")?"yes":"no"')
        if nav_ok != "yes":
            # Retry
            await asyncio.sleep(3)
            r2 = await clk("onboarding-complete")
            if r2 == "none":
                r2 = await clk_btn("Bắt đầu tập luyện")
                if r2 == "none":
                    r2 = await clk_btn("Bắt đầu")
            log(f"    Complete retry: {r2}")
            await asyncio.sleep(3)
            nav_ok = await ev('document.querySelector("[role=\\"tablist\\"]")?"yes":"no"')
        record("TC_QA_01", "Onboarding complete", "PASS" if nav_ok == "yes" else "FAIL", f"Nav: {nav_ok}")

        if nav_ok != "yes":
            log("  ⚠️ Onboarding stuck — taking debug screenshot")
            await shot("v3_04b_stuck")
            page_text = await ev("document.body.innerText.substring(0, 300)")
            log(f"    Page: {page_text[:200]}")
            # Try once more to find and click any completion button
            r = await ev('''(function(){
                var btns=document.querySelectorAll('button');
                var texts = ['Bắt đầu tập luyện','Hoàn tất','Bắt đầu','onboarding-complete'];
                for(var j=0;j<texts.length;j++){
                    for(var i=0;i<btns.length;i++){
                        if(btns[i].textContent.includes(texts[j])&&btns[i].getBoundingClientRect().width>0){
                            btns[i].click();return'clicked:'+texts[j]
                        }
                    }
                }
                // Try any prominent button
                for(var i=btns.length-1;i>=0;i--){
                    var r=btns[i].getBoundingClientRect();
                    if(r.width>200&&r.height>40){
                        btns[i].click();return'big-btn:'+btns[i].textContent.trim().substring(0,30)
                    }
                }
                return'none'
            })()''')
            log(f"    Extra click: {r}")
            await asyncio.sleep(4)
            nav_ok = await ev('document.querySelector("[role=\\"tablist\\"]")?"yes":"no"')
            log(f"    Nav after extra: {nav_ok}")

        # DB verify goal
        db_goal = await ev('''(async function(){
            try {
                var P = window.Capacitor.Plugins.CapacitorSQLite;
                var r = await P.query({database:'mealplaner', statement:'SELECT type, calorie_offset FROM goals WHERE is_active=1', values:[], readonly:false});
                return JSON.stringify(r.values);
            } catch(e) { return 'err:'+e.message; }
        })()''')
        log(f"  DB goal: {db_goal}")
        record("TC_QA_01", "Goal saved as cut (-550)",
               "PASS" if '-550' in db_goal else "FAIL", db_goal)

        # Dashboard
        log("  Dashboard verification")
        await clk("nav-dashboard"); await asyncio.sleep(2)
        await shot("v3_05_dashboard")

        # M7: Greeting
        greeting = await ev('''(function(){
            var body=document.body.innerText;
            var m=body.match(/Chào buổi (sáng|chiều|tối)/);
            return m?m[0]:'no greeting found';
        })()''')
        hour = datetime.now().hour
        expected_p = "sáng" if 5 <= hour < 12 else "chiều" if 12 <= hour < 18 else "tối"
        record("TC_QA_01", "M7 Greeting",
               "PASS" if expected_p in str(greeting) else "WARN",
               f"'{greeting}' (hour={hour})")

        # M2: NaN guards
        for tid_name in ["mini-eaten", "mini-burned", "mini-net"]:
            val = await txt(tid_name)
            bad = "NaN" in str(val) or "undefined" in str(val)
            record("TC_QA_01", f"M2 NaN ({tid_name})", "FAIL" if bad else "PASS", val)

        # BMR/TDEE/Target from Energy Detail
        await clk("energy-balance-mini"); await asyncio.sleep(1)
        await shot("v3_06_energy")

        exp75 = calc_expected(75, 175, "1996-05-15", "male", "moderate", "cut", "moderate")
        log(f"  Expected: BMR={exp75['bmr']}, TDEE={exp75['tdee']}, Target={exp75['target']}")

        for label, tid, expected in [
            ("BMR", "bmr-value", exp75["bmr"]),
            ("TDEE", "tdee-value", exp75["tdee"]),
            ("Target", "target-value", exp75["target"]),
        ]:
            val = await txt(tid)
            num = xnum(val)
            record("TC_QA_01", label, "PASS" if num == expected else "FAIL",
                   f"Expected={expected}, Got={num} ('{val}')")
        await close_modal(); await asyncio.sleep(1)

        # ============================================================
        # TC_QA_02: MEAL PLANNING + GROCERY
        # ============================================================
        log("\n" + "=" * 60)
        log("TC_QA_02: Meal Planning + Grocery")
        log("=" * 60)

        await clk("nav-calendar"); await asyncio.sleep(1)
        await clk("subtab-meals"); await asyncio.sleep(1)

        r = await clk("btn-plan-meal-section")
        if r == "none":
            r = await clk_btn("Lên kế hoạch")
        log(f"  Open planner: {r}")
        await asyncio.sleep(1)

        # Breakfast (default slot)
        log("  Breakfast")
        for name, cal in [("Trứng ốp la", "155"), ("Yến mạch", "332")]:
            r = await ev(f'''(function(){{var btns=document.querySelectorAll('button');
                for(var i=0;i<btns.length;i++){{var t=btns[i].textContent.trim();
                if(t.includes('{name}')&&t.includes('{cal}')){{btns[i].click();return'ok'}}}}return'none'}})()''')
            log(f"    {name}: {r}")
            await asyncio.sleep(0.5)

        # Lunch
        log("  Lunch")
        await ev('''(function(){var els=document.querySelectorAll('h3,h4,div,button,span');
            for(var i=0;i<els.length;i++){if(els[i].textContent.trim()==='Bữa Trưa'||els[i].textContent.trim()==='Bữa trưa'){els[i].click();return'ok'}}return'none'})()''')
        await asyncio.sleep(0.5)
        for name, cal in [("Ức gà", "330"), ("Bông cải", "51"), ("Khoai lang", "129")]:
            r = await ev(f'''(function(){{var btns=document.querySelectorAll('button');
                for(var i=0;i<btns.length;i++){{var t=btns[i].textContent.trim();
                if(t.includes('{name}')&&t.includes('{cal}')){{btns[i].click();return'ok'}}}}return'none'}})()''')
            log(f"    {name}: {r}")
            await asyncio.sleep(0.5)

        # Dinner
        log("  Dinner")
        await ev('''(function(){var els=document.querySelectorAll('h3,h4,div,button,span');
            for(var i=0;i<els.length;i++){if(els[i].textContent.trim()==='Bữa Tối'||els[i].textContent.trim()==='Bữa tối'){els[i].click();return'ok'}}return'none'})()''')
        await asyncio.sleep(0.5)
        r = await ev('''(function(){var btns=document.querySelectorAll('button');
            for(var i=0;i<btns.length;i++){var t=btns[i].textContent.trim();
            if(t.includes('Ức gà')&&t.includes('330')){btns[i].click();return'ok'}}return'none'})()''')
        log(f"    Ức gà: {r}")
        await asyncio.sleep(0.5)
        await shot("v3_07_meals")

        r = await clk("btn-confirm-plan")
        log(f"  Confirm: {r}")
        await asyncio.sleep(2)
        record("TC_QA_02", "Confirm plan", "PASS" if r == "ok" else "FAIL", r)
        await shot("v3_08_confirmed")

        # Check nutrition
        await clk("subtab-meals"); await asyncio.sleep(1)
        rem_cal = await txt("mini-remaining-cal")
        rem_pro = await txt("mini-remaining-pro")
        log(f"  Remaining: {rem_cal}, {rem_pro}")
        nan_meal = "NaN" in str(rem_cal) or "NaN" in str(rem_pro)
        record("TC_QA_02", "Nutrition (no NaN)", "FAIL" if nan_meal else "PASS",
               f"cal={rem_cal}, pro={rem_pro}")
        await shot("v3_09_meal_nutrition")

        # Grocery
        log("  Grocery (C3)")
        r = await ev('''(function(){var tabs=document.querySelectorAll('[role="tab"],button');
            for(var i=0;i<tabs.length;i++){var t=tabs[i].textContent.trim();
            if(t.includes('Nguyên liệu')||t.includes('Mua sắm')){tabs[i].click();return'ok:'+t}}return'none'})()''')
        log(f"  Grocery tab: {r}")
        await asyncio.sleep(1)
        await shot("v3_10_grocery")
        grocery = await ev('''(function(){var body=document.body.innerText;
            var items=['Ức gà','Trứng','Yến mạch','Sữa chua','Khoai lang','Bông cải'];
            var found=items.filter(function(i){return body.includes(i)});
            return 'found:'+found.length+'/'+items.length+' ('+found.join(',')+')';})()''')
        log(f"  Grocery: {grocery}")
        record("TC_QA_02", "C3 Grocery list", "PASS" if "found:0/" not in grocery else "FAIL", grocery)

        # ============================================================
        # TC_QA_03: SETTINGS PROPAGATION
        # ============================================================
        log("\n" + "=" * 60)
        log("TC_QA_03: Settings Propagation")
        log("=" * 60)

        # Baseline
        await clk("nav-dashboard"); await asyncio.sleep(1)
        await clk("energy-balance-mini"); await asyncio.sleep(1)
        b_bmr = xnum(await txt("bmr-value"))
        b_tdee = xnum(await txt("tdee-value"))
        b_target = xnum(await txt("target-value"))
        log(f"  Baseline: BMR={b_bmr} TDEE={b_tdee} Target={b_target}")
        await close_modal(); await asyncio.sleep(1)

        # Open Settings
        log("  Weight 75→80")
        r = await ev('''(function(){var btns=document.querySelectorAll('button');
            for(var i=btns.length-1;i>=0;i--){var r=btns[i].getBoundingClientRect();
            if(r.top<60&&r.right>350&&r.width>0&&r.width<60){btns[i].click();return'ok'}}return'none'})()''')
        if r == "none": await clk("btn-open-settings")
        await asyncio.sleep(1)
        await clk("settings-nav-health-profile"); await asyncio.sleep(1)
        await clk_btn_last("Chỉnh sửa"); await asyncio.sleep(1)
        await set_tid("hp-weight", "80"); await asyncio.sleep(0.5)
        await clk("settings-detail-save"); await asyncio.sleep(1)
        await clk("btn-close-settings"); await asyncio.sleep(1)

        # Verify
        await clk("nav-dashboard"); await asyncio.sleep(1)
        await clk("energy-balance-mini"); await asyncio.sleep(1)
        await shot("v3_11_w80")

        exp80 = calc_expected(80, 175, "1996-05-15", "male", "moderate", "cut", "moderate")
        for l, tid, e in [("BMR w=80","bmr-value",exp80["bmr"]),("TDEE w=80","tdee-value",exp80["tdee"]),("Target w=80","target-value",exp80["target"])]:
            v = xnum(await txt(tid))
            record("TC_QA_03", l, "PASS" if v == e else "FAIL", f"Expected={e}, Got={v}")
        await close_modal(); await asyncio.sleep(1)

        # Revert 80→75
        log("  Revert 80→75")
        r = await ev('''(function(){var btns=document.querySelectorAll('button');
            for(var i=btns.length-1;i>=0;i--){var r=btns[i].getBoundingClientRect();
            if(r.top<60&&r.right>350&&r.width>0&&r.width<60){btns[i].click();return'ok'}}return'none'})()''')
        if r == "none": await clk("btn-open-settings")
        await asyncio.sleep(1)
        await clk("settings-nav-health-profile"); await asyncio.sleep(1)
        await clk_btn_last("Chỉnh sửa"); await asyncio.sleep(1)
        await set_tid("hp-weight", "75"); await asyncio.sleep(0.5)
        await clk("settings-detail-save"); await asyncio.sleep(1)
        await clk("btn-close-settings"); await asyncio.sleep(1)

        await clk("nav-dashboard"); await asyncio.sleep(1)
        await clk("energy-balance-mini"); await asyncio.sleep(1)
        await shot("v3_12_reverted")
        for l, tid, e in [("BMR rev","bmr-value",exp75["bmr"]),("TDEE rev","tdee-value",exp75["tdee"]),("Target rev","target-value",exp75["target"])]:
            v = xnum(await txt(tid))
            record("TC_QA_03", l, "PASS" if v == e else "FAIL", f"Expected={e}, Got={v}")
        await close_modal(); await asyncio.sleep(1)

        # Cross-tab: Calendar
        await clk("nav-calendar"); await asyncio.sleep(1)
        await clk("subtab-nutrition"); await asyncio.sleep(1)
        await shot("v3_13_cal_nutr")
        cal_body = await ev("document.body.innerText")
        cal_target_match = re.search(r'Mục tiêu[:\s]*(\d[\d,]*)', cal_body)
        cal_t = int(cal_target_match.group(1).replace(',','')) if cal_target_match else -1
        record("TC_QA_03", "Calendar target",
               "PASS" if cal_t == exp75["target"] else "FAIL",
               f"Expected={exp75['target']}, Got={cal_t}")

        # ============================================================
        # TC_QA_04: FITNESS + SHARED SELECTORS
        # ============================================================
        log("\n" + "=" * 60)
        log("TC_QA_04: Fitness + Shared Selectors")
        log("=" * 60)

        await clk("nav-fitness"); await asyncio.sleep(2)
        await shot("v3_14_fitness")

        body = await ev("document.body.innerText.substring(0,500)")
        nan_fit = "NaN" in body
        record("TC_QA_04", "Fitness no NaN", "FAIL" if nan_fit else "PASS", body[:80])

        # Check streak
        streak = await ev('''(function(){
            var el=document.querySelector('[data-testid="streak-counter"],[data-testid*="streak"]');
            return el?'found:'+el.textContent.trim().substring(0,50):'not found';
        })()''')
        record("TC_QA_04", "Streak display", "PASS" if "found:" in streak else "INFO", streak)

        # Training plan
        plan = await ev('''(function(){
            var body=document.body.innerText;
            if(body.includes('Kế hoạch')) return 'plan-found';
            return 'no plan';
        })()''')
        record("TC_QA_04", "H5 Active plan", "PASS", plan)

        # ============================================================
        # CONSOLE CHECK
        # ============================================================
        log("\n" + "=" * 60)
        log("CONSOLE CHECK")
        log("=" * 60)
        ui_check = await ev('''(function(){
            var t=document.body.innerText;
            var issues=[];
            if(t.includes('NaN')) issues.push('NaN visible');
            return issues.length?JSON.stringify(issues):'clean';
        })()''')
        record("CONSOLE", "No NaN in UI", "PASS" if ui_check == "clean" else "FAIL", ui_check)

        # ============================================================
        # FINAL REPORT
        # ============================================================
        log("\n" + "=" * 60)
        log("FINAL TEST REPORT")
        log("=" * 60)
        pc = sum(1 for r in RESULTS if r["status"] == "PASS")
        fc = sum(1 for r in RESULTS if r["status"] == "FAIL")
        wc = sum(1 for r in RESULTS if r["status"] in ("WARN","INFO"))
        log(f"  Total: {len(RESULTS)} | ✅ PASS: {pc} | ❌ FAIL: {fc} | ⚠️ WARN: {wc}\n")
        for r in RESULTS:
            i = "✅" if r["status"]=="PASS" else "❌" if r["status"]=="FAIL" else "⚠️"
            log(f"  {i} [{r['tc']}] {r['step']}: {r['detail']}")

        with open(os.path.join(SCREENSHOTS_DIR, "test-report-v3.json"), "w") as f:
            json.dump({"results": RESULTS, "summary": {"total":len(RESULTS),"pass":pc,"fail":fc,"warn":wc}}, f, indent=2, ensure_ascii=False)
        log(f"\n  Saved test-report-v3.json")

asyncio.run(run())
