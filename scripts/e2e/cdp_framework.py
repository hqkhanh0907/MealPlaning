"""
CDP Framework — Reusable helpers cho tất cả E2E test scripts.
Dùng websockets (async) để tương tác với Capacitor WebView trên emulator Android.
"""

import json
import asyncio
import base64
import subprocess
import time
import os
import sys
from datetime import date

# === CONSTANTS ===
EMULATOR = "emulator-5556"
PACKAGE = "com.mealplaner.app"
ACTIVITY = f"{PACKAGE}/.MainActivity"
CDP_PORT = 9222
SCREENSHOT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "screenshots")
ANDROID_HOME = os.path.expanduser("~/Library/Android/sdk")
ENV = {**os.environ, "PATH": os.environ.get("PATH", "") + f":{ANDROID_HOME}/platform-tools:{ANDROID_HOME}/emulator"}

# Timing constants (seconds)
WAIT_APP_START = 6
WAIT_PORT_FORWARD = 2
WAIT_PAGE_RELOAD = 4
WAIT_NAV_CLICK = 1
WAIT_QUICK_ACTION = 0.5
WAIT_CONFIRM_PLAN = 2
WAIT_STRATEGY_COMPUTING = 14
WAIT_SAVE_SETTINGS = 1
WAIT_MODAL_OPEN = 0.8
WAIT_MODAL_CLOSE = 0.5
WAIT_FORM_FILL = 0.3

# Screenshot step counter (per scenario)
_step_counters = {}


def _get_step(scenario: str) -> int:
    """Get and increment step counter for a scenario."""
    if scenario not in _step_counters:
        _step_counters[scenario] = 0
    _step_counters[scenario] += 1
    return _step_counters[scenario]


def reset_steps(scenario: str):
    """Reset step counter for a scenario."""
    _step_counters[scenario] = 0


# === ADB HELPERS ===

def adb(*args):
    """Run adb command and return stdout."""
    cmd = ["adb", "-s", EMULATOR] + list(args)
    r = subprocess.run(cmd, capture_output=True, text=True, env=ENV)
    return r.stdout.strip()


def adb_shell(*args):
    """Run adb shell command."""
    return adb("shell", *args)


def pm_clear():
    """Clear app data (fresh install effect)."""
    adb_shell("pm", "clear", PACKAGE)
    time.sleep(1)


def launch_app():
    """Launch the app."""
    adb_shell("am", "start", "-n", ACTIVITY)
    time.sleep(WAIT_APP_START)


def force_stop():
    """Force stop the app."""
    adb_shell("am", "force-stop", PACKAGE)
    time.sleep(1)


def get_pid():
    """Get app PID."""
    return adb_shell("pidof", PACKAGE)


def forward_cdp():
    """Forward CDP port. Returns websocket URL."""
    import urllib.request
    pid = get_pid()
    if not pid:
        raise RuntimeError("App not running — no PID found")
    adb("forward", f"tcp:{CDP_PORT}", f"localabstract:webview_devtools_remote_{pid}")
    time.sleep(WAIT_PORT_FORWARD)
    data = json.loads(urllib.request.urlopen(f"http://localhost:{CDP_PORT}/json").read())
    if not data:
        raise RuntimeError("No WebView pages found")
    return data[0]["webSocketDebuggerUrl"]


def take_adb_screenshot(path: str):
    """Take screenshot via adb (fallback)."""
    subprocess.run(
        ["adb", "-s", EMULATOR, "exec-out", "screencap", "-p"],
        stdout=open(path, "wb"), env=ENV
    )


# === CDP SESSION ===

class CDPSession:
    """Manages a Chrome DevTools Protocol session over WebSocket."""

    def __init__(self, ws):
        self.ws = ws
        self.mid = 100
        self.scenario = "unknown"

    async def send(self, method: str, params: dict = None) -> dict:
        """Send CDP command and return result."""
        self.mid += 1
        msg = {"id": self.mid, "method": method}
        if params:
            msg["params"] = params
        await self.ws.send(json.dumps(msg))
        resp = json.loads(await self.ws.recv())
        return resp

    async def ev(self, expr: str):
        """Evaluate JS expression and return value."""
        self.mid += 1
        await self.ws.send(json.dumps({
            "id": self.mid,
            "method": "Runtime.evaluate",
            "params": {"expression": expr, "returnByValue": True, "awaitPromise": True}
        }))
        r = json.loads(await self.ws.recv())
        return r.get("result", {}).get("result", {}).get("value", "")

    async def get_text(self, testid: str) -> str:
        """Get textContent of element by data-testid."""
        return await self.ev(
            f'(function(){{var e=document.querySelector(\'[data-testid="{testid}"]\');'
            f'return e?e.textContent.trim():"N/A"}})()'
        )

    async def click_testid(self, testid: str) -> str:
        """Click element by data-testid. Returns 'ok' or 'none'."""
        return await self.ev(
            f'(function(){{var b=document.querySelector(\'[data-testid="{testid}"]\');'
            f'if(b){{b.click();return"ok"}}return"none"}})()'
        )

    async def click_id(self, element_id: str) -> str:
        """Click element by id."""
        return await self.ev(
            f'(function(){{var b=document.getElementById("{element_id}");'
            f'if(b){{b.click();return"ok"}}return"none"}})()'
        )

    async def click_text(self, text: str, tag: str = "button") -> str:
        """Click first visible element containing text."""
        return await self.ev(f'''(function(){{
            var els=document.querySelectorAll('{tag}');
            for(var i=0;i<els.length;i++){{
                if(els[i].textContent.trim().includes('{text}')){{
                    var r=els[i].getBoundingClientRect();
                    if(r.width>0){{els[i].click();return'ok'}}
                }}
            }}
            return'none'
        }})()''')

    async def click_text_last(self, text: str, tag: str = "button") -> str:
        """Click LAST visible element containing text (useful for overlays)."""
        return await self.ev(f'''(function(){{
            var els=document.querySelectorAll('{tag}');
            for(var i=els.length-1;i>=0;i--){{
                if(els[i].textContent.trim().includes('{text}')){{
                    var r=els[i].getBoundingClientRect();
                    if(r.width>0){{els[i].click();return'ok'}}
                }}
            }}
            return'none'
        }})()''')

    async def set_input(self, testid: str, value: str) -> str:
        """Set React-controlled input value (native setter pattern)."""
        return await self.ev(f'''(function(){{
            var el=document.querySelector('[data-testid="{testid}"]');
            if(!el)return'no el';
            var ns=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
            ns.call(el,'{value}');
            el.dispatchEvent(new Event('input',{{bubbles:true}}));
            el.dispatchEvent(new Event('change',{{bubbles:true}}));
            return'set:'+el.value;
        }})()''')

    async def set_input_by_id(self, element_id: str, value: str) -> str:
        """Set React-controlled input value by id (for onboarding ob-* fields)."""
        return await self.ev(f'''(function(){{
            var el=document.getElementById('{element_id}');
            if(!el)return'no el';
            var ns=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
            ns.call(el,'{value}');
            el.dispatchEvent(new Event('input',{{bubbles:true}}));
            el.dispatchEvent(new Event('change',{{bubbles:true}}));
            return'set:'+el.value;
        }})()''')

    async def set_select(self, testid_or_scope: str, value: str) -> str:
        """Set select value, scoped to a form if testid_or_scope is a form testid."""
        return await self.ev(f'''(function(){{
            var form=document.querySelector('[data-testid="{testid_or_scope}"]');
            var sel=form?form.querySelector('select'):document.querySelector('[data-testid="{testid_or_scope}"]');
            if(!sel)return'no select';
            for(var i=0;i<sel.options.length;i++){{
                if(sel.options[i].value==='{value}'){{
                    sel.selectedIndex=i;
                    sel.dispatchEvent(new Event('change',{{bubbles:true}}));
                    return'set:'+sel.value;
                }}
            }}
            return'not found';
        }})()''')

    async def screenshot(self, scenario: str, description: str = ""):
        """Take screenshot via CDP and save as SC{nn}_step{mm}.png"""
        step = _get_step(scenario)
        filename = f"{scenario}_step{step:02d}.png"
        if description:
            filename = f"{scenario}_step{step:02d}_{description}.png"
        filepath = os.path.join(SCREENSHOT_DIR, filename)

        resp = await self.send("Page.captureScreenshot", {"format": "png"})
        if "result" in resp and "data" in resp["result"]:
            with open(filepath, "wb") as f:
                f.write(base64.b64decode(resp["result"]["data"]))
            print(f"  📸 {filename}")
        else:
            # Fallback to adb screenshot
            take_adb_screenshot(filepath)
            print(f"  📸 {filename} (adb fallback)")
        return filepath

    async def reload(self):
        """Reload page."""
        await self.send("Page.reload")
        await asyncio.sleep(WAIT_PAGE_RELOAD)
        # Consume any pending messages
        try:
            await asyncio.wait_for(self.ws.recv(), timeout=1)
        except (asyncio.TimeoutError, Exception):
            pass

    async def wait(self, seconds: float):
        """Wait for specified seconds."""
        await asyncio.sleep(seconds)

    # === NAVIGATION HELPERS ===

    async def nav_calendar(self):
        """Navigate to Calendar tab."""
        await self.click_testid("nav-calendar")
        await self.wait(WAIT_NAV_CLICK)

    async def nav_library(self):
        """Navigate to Library tab."""
        await self.click_testid("nav-library")
        await self.wait(WAIT_NAV_CLICK)

    async def nav_ai(self):
        """Navigate to AI Analysis tab."""
        await self.click_testid("nav-ai-analysis")
        await self.wait(WAIT_NAV_CLICK)

    async def nav_fitness(self):
        """Navigate to Fitness tab."""
        await self.click_testid("nav-fitness")
        await self.wait(WAIT_NAV_CLICK)

    async def nav_dashboard(self):
        """Navigate to Dashboard tab."""
        await self.click_testid("nav-dashboard")
        await self.wait(WAIT_NAV_CLICK)

    async def subtab_meals(self):
        """Switch to Meals subtab."""
        await self.click_testid("subtab-meals")
        await self.wait(WAIT_QUICK_ACTION)

    async def subtab_nutrition(self):
        """Switch to Nutrition subtab."""
        await self.click_testid("subtab-nutrition")
        await self.wait(WAIT_QUICK_ACTION)

    async def subtab_plan(self):
        """Switch to Plan subtab (Fitness)."""
        await self.click_testid("subtab-plan")
        await self.wait(WAIT_QUICK_ACTION)

    async def open_settings(self):
        """Open Settings page."""
        r = await self.ev('''(function(){
            var btns=document.querySelectorAll('button');
            for(var i=btns.length-1;i>=0;i--){
                var a=btns[i].getAttribute('aria-label')||'';
                if(a.includes('Cài đặt')||a.includes('Settings')){
                    btns[i].click();return'ok'
                }
            }
            return'none'
        })()''')
        await self.wait(WAIT_NAV_CLICK)
        return r

    async def close_settings(self):
        """Close Settings page."""
        await self.click_testid("btn-close-settings")
        await self.wait(WAIT_MODAL_CLOSE)

    async def dismiss_modal(self):
        """Dismiss any modal by clicking backdrop."""
        await self.ev('''(function(){
            var bd=document.querySelector('[data-testid="modal-backdrop"]');
            if(bd){bd.click();return'ok'}
            return'none'
        })()''')
        await self.wait(WAIT_MODAL_CLOSE)

    # === ONBOARDING HELPERS ===

    async def bypass_onboarding(self):
        """Skip onboarding via localStorage."""
        await self.ev(
            'localStorage.setItem("app-onboarding-storage",'
            'JSON.stringify({state:{isAppOnboarded:true,onboardingSection:null},version:1}))'
        )
        await self.reload()

    async def full_onboarding(self, scenario: str, name="QA Tester", dob="1996-05-15",
                               height="175", weight="75", gender="male",
                               activity="moderate", goal="cut", rate="moderate"):
        """Run full onboarding flow with screenshots at every step."""

        # Welcome section
        await self.screenshot(scenario, "welcome_screen")
        await self.click_text("Tiếp tục")
        await self.wait(0.5)
        await self.screenshot(scenario, "welcome_step2")
        await self.click_text("Tiếp tục")
        await self.wait(0.5)
        await self.screenshot(scenario, "welcome_step3")
        await self.click_text("Bắt đầu")
        await self.wait(1)

        # Health Basic
        await self.screenshot(scenario, "health_basic_start")

        # Gender
        gender_text = "Nam" if gender == "male" else "Nữ"
        await self.click_text(gender_text)
        await self.wait(WAIT_FORM_FILL)
        await self.screenshot(scenario, f"gender_{gender}")

        # Name
        await self.set_input_by_id("ob-name", name)
        await self.wait(WAIT_FORM_FILL)
        await self.screenshot(scenario, "name_filled")

        # DOB
        await self.set_input_by_id("ob-dob", dob)
        await self.wait(WAIT_FORM_FILL)
        await self.screenshot(scenario, "dob_filled")

        # Height
        await self.set_input_by_id("ob-height", height)
        await self.wait(WAIT_FORM_FILL)
        await self.screenshot(scenario, "height_filled")

        # Weight
        await self.set_input_by_id("ob-weight", weight)
        await self.wait(WAIT_FORM_FILL)
        await self.screenshot(scenario, "weight_filled")

        # Next
        await self.click_testid("health-basic-next")
        await self.wait(1)
        await self.screenshot(scenario, "activity_selection")

        # Activity level
        activity_labels = {
            "sedentary": "Ít vận động",
            "light": "Hoạt động nhẹ",
            "moderate": "Hoạt động vừa",
            "active": "Hoạt động tích cực",
            "extra_active": "Hoạt động rất cao",
        }
        await self.click_text(activity_labels.get(activity, "Hoạt động vừa"), "div,button,label")
        await self.wait(0.5)
        await self.screenshot(scenario, f"activity_{activity}")
        await self.click_text("Tiếp tục")
        await self.wait(1)

        # Goal
        await self.screenshot(scenario, "goal_selection")
        goal_labels = {"cut": "Giảm cân", "maintain": "Giữ cân", "bulk": "Tăng cân"}
        await self.click_text(goal_labels.get(goal, "Giảm cân"), "div,button,label")
        await self.wait(0.5)
        await self.screenshot(scenario, f"goal_{goal}")
        # Rate auto-selected or click if available
        await self.click_text("Tiếp tục")
        await self.wait(1)

        # Confirm
        await self.screenshot(scenario, "confirm_screen")
        await self.click_text("Xác nhận")
        await self.wait(1)

        # Training section
        await self.screenshot(scenario, "training_start")
        # Try to go through training steps or skip
        for i in range(8):
            r = await self.click_text("Tiếp tục")
            if r == "none":
                r = await self.click_text("Bỏ qua")
            if r == "none":
                break
            await self.wait(0.5)
            await self.screenshot(scenario, f"training_step{i+1}")

        # Strategy
        await self.screenshot(scenario, "strategy_selection")
        await self.click_testid("strategy-auto")
        await self.wait(1)
        await self.click_text("Tiếp tục")
        await self.wait(WAIT_STRATEGY_COMPUTING)
        await self.screenshot(scenario, "strategy_computing_done")

        # Plan Preview
        await self.screenshot(scenario, "plan_preview")
        r = await self.click_testid("onboarding-complete")
        if r == "none":
            await self.click_text("Bắt đầu tập luyện")
        await self.wait(3)
        await self.screenshot(scenario, "onboarding_complete")

        # Verify nav visible
        nav = await self.ev('document.querySelector("[role=\\"tablist\\"]")?"yes":"no"')
        if nav != "yes":
            print("  ⚠️  Nav tabs not visible after onboarding!")
        else:
            print("  ✅ Onboarding complete, nav tabs visible")


# === RUNNER ===

async def create_session(ws_url: str) -> CDPSession:
    """Create a CDP session from websocket URL."""
    import websockets
    ws = await websockets.connect(ws_url, max_size=10 * 1024 * 1024)
    return CDPSession(ws)


async def setup_fresh(full_onboard=False, scenario="SC00"):
    """Fresh install → launch → CDP connect. Returns CDPSession."""
    import websockets

    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    reset_steps(scenario)

    print(f"\n{'='*60}")
    print(f"🚀 Setting up for {scenario}")
    print(f"{'='*60}")

    # Fresh install
    print("  🧹 pm clear...")
    pm_clear()

    # Launch
    print("  📱 Launching app...")
    launch_app()

    # CDP connect
    print("  🔌 Connecting CDP...")
    ws_url = forward_cdp()
    ws = await websockets.connect(ws_url, max_size=10 * 1024 * 1024)
    session = CDPSession(ws)
    session.scenario = scenario

    if full_onboard:
        print("  👤 Running full onboarding...")
        await session.full_onboarding(scenario)
    else:
        print("  ⏩ Bypassing onboarding...")
        await session.bypass_onboarding()
        await session.screenshot(scenario, "app_home")

    return session


def run_scenario(coro):
    """Run an async scenario function."""
    try:
        asyncio.run(coro)
    except KeyboardInterrupt:
        print("\n⛔ Interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


# === CALC HELPERS (for expected values) ===

def calc_age(dob_str: str) -> int:
    """Calculate age from DOB string (YYYY-MM-DD)."""
    dob = date.fromisoformat(dob_str)
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def calc_bmr(weight: float, height: float, age: int, gender: str) -> int:
    """Mifflin-St Jeor BMR calculation."""
    s = 5 if gender == "male" else -161
    return round(10 * weight + 6.25 * height - 5 * age + s)


def calc_tdee(bmr: int, activity: str) -> int:
    """Calculate TDEE from BMR and activity level."""
    multipliers = {
        "sedentary": 1.2, "light": 1.375, "moderate": 1.55,
        "active": 1.725, "extra_active": 1.9
    }
    return round(bmr * multipliers.get(activity, 1.55))


def calc_target(tdee: int, goal: str, rate: str) -> int:
    """Calculate target calories."""
    offsets = {
        "cut": {"conservative": -275, "moderate": -550, "aggressive": -1100},
        "maintain": {"moderate": 0, "conservative": 0, "aggressive": 0},
        "bulk": {"conservative": 275, "moderate": 550, "aggressive": 1100},
    }
    offset = offsets.get(goal, {}).get(rate, 0)
    return tdee + offset
