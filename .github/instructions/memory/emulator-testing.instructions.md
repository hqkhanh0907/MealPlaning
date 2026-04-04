# Kinh nghiệm thao tác Emulator — Capacitor WebView (Android)

> Tổng hợp từ nhiều session thực chiến. Đọc kỹ trước khi tương tác với emulator.

---

## 1. Thông tin cơ bản

- **Package name**: `com.mealplaner.app` (**KHÔNG** phải `com.mealplaning.app`)
- **Emulator IDs**: `emulator-5554`, `emulator-5556`
- **Screen**: 1080×2400 pixels, density 420
- **ANDROID_HOME**: `$HOME/Library/Android/sdk`
- **PATH bắt buộc**: `export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"`

---

## 2. Build & Deploy

```bash
# Build pipeline đầy đủ
npm run build && npx cap sync android && cd android && ./gradlew assembleDebug

# APK output
android/app/build/outputs/apk/debug/app-debug.apk

# Install lên emulator
adb -s emulator-5556 install -r "$APK"

# Hoặc shortcut (build + sync + install + launch)
npx cap run android --target emulator-5556
```

### ⚠️ Quy tắc quan trọng

- **PHẢI dùng DEBUG APK** để debug WebView — release build tắt WebView debugging
- Mỗi lần fix code → **phải rebuild APK** mới verify được trên emulator
- KHÔNG chỉ lint/test/build rồi coi là xong — phải **APK verify** thực tế

---

## 3. ⛔ `adb shell input tap` KHÔNG TIN CẬY

- Tọa độ tap **không map đúng** sang web elements trong Capacitor WebView
- Status bar overlay (`StatusBar.setOverlaysWebView({overlay: true})`) làm lệch Y
- Bottom nav Y ≈ 2280-2310px — cần calibrate

### ✅ Giải pháp: Dùng Chrome DevTools Protocol (CDP)

---

## 4. CDP — Cách đúng để tương tác với WebView

### Setup kết nối

```bash
# Bước 1: Tìm PID của webview process
adb -s emulator-5556 shell "cat /proc/net/unix | grep webview"

# Bước 2: Forward port
adb -s emulator-5556 forward tcp:9222 localabstract:webview_devtools_remote_{PID}

# Bước 3: Lấy danh sách pages
curl -s http://localhost:9222/json

# Bước 4: Connect WebSocket → Runtime.evaluate
```

### ⚠️ CDP Gotchas

- **Page ID thay đổi** mỗi lần restart app → phải query lại `/json`
- Python websocket-client cần `suppress_origin=True` để tránh 403 CORS
- macOS cần `pip install websocket-client --break-system-packages`

---

## 5. CDP Patterns cho React/Capacitor

### Click button theo text

```javascript
document.querySelectorAll('button').forEach(b => {
  if (b.textContent.includes('Tiếp tục')) b.click();
});
```

### Set giá trị React input (QUAN TRỌNG!)

React dùng synthetic events — set `.value` trực tiếp **KHÔNG hoạt động**.

```javascript
const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
nativeSetter.call(input, 'newValue');
input.dispatchEvent(new Event('input', { bubbles: true }));
```

### Skip onboarding

```javascript
localStorage.setItem(
  'app-onboarding-storage',
  JSON.stringify({
    state: { isAppOnboarded: true },
    version: 1,
  }),
);
```

### Navigate bằng tab click

```javascript
// Ví dụ: click tab "Cài đặt"
document.querySelectorAll('[role="tab"]').forEach(t => {
  if (t.textContent.includes('Cài đặt')) t.click();
});
```

---

## 6. Bẫy thường gặp (Lessons Learned)

| #   | Bẫy                              | Hậu quả                                            | Cách tránh                                         |
| --- | -------------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| 1   | Dùng `adb tap` thay CDP          | Click sai element hoặc miss                        | Luôn dùng CDP `Runtime.evaluate`                   |
| 2   | Sai package name                 | `adb install` thất bại                             | Luôn dùng `com.mealplaner.app`                     |
| 3   | Quên forward CDP port            | WebSocket 403/refused                              | Chạy `adb forward` sau mỗi restart                 |
| 4   | Hidden buttons trùng testid      | Click nhầm element ẩn (vd: `btn-edit-dish-d1..d5`) | Dùng `data-testid` chính xác + check visibility    |
| 5   | AI suggestion modal chặn nav     | Không navigate được                                | Dismiss bằng `KEYCODE_BACK` hoặc JS click nút đóng |
| 6   | Dùng release APK để debug        | WebView DevTools không kết nối được                | Luôn build debug: `assembleDebug`                  |
| 7   | Không rebuild APK sau fix        | Verify code cũ, tưởng fix sai                      | Mỗi fix → rebuild → reinstall → retest             |
| 8   | React input set .value trực tiếp | State không update                                 | Dùng native setter + dispatch event                |

---

## 7. Quy trình Manual Test chuẩn

```
1. Build APK (debug) → Install → Launch
2. Forward CDP port → Connect WebSocket
3. Navigate bằng Runtime.evaluate (JS click)
4. Screenshot verify: adb exec-out screencap -p > screenshot.png
5. Nếu bug → fix code → rebuild APK → retest
6. Lặp lại cho đến khi clean
```

---

## 8. Lệnh tiện ích

```bash
# Launch app
adb -s emulator-5556 shell monkey -p com.mealplaner.app -c android.intent.category.LAUNCHER 1

# Force stop
adb -s emulator-5556 shell am force-stop com.mealplaner.app

# Clear app data (fresh install effect)
adb -s emulator-5556 shell pm clear com.mealplaner.app

# Screenshot
adb -s emulator-5556 exec-out screencap -p > screenshot.png

# Check WebView process
adb -s emulator-5556 shell ps -A | grep -i mealplaner

# List emulators
adb devices

# Logcat filter cho app
adb -s emulator-5556 logcat --pid=$(adb -s emulator-5556 shell pidof com.mealplaner.app)
```

---

## 9. Python Async CDP Test Framework (Chi tiết)

> Rút ra từ chiến dịch test 8 scenario (SC-01 → SC-08) ngày 2026-04-03.
> Dùng `websockets` (async) thay vì `websocket-client` (sync).

### 9.1 Template chuẩn cho 1 scenario test

```python
import json, asyncio, websockets, urllib.request, base64, subprocess, time, os

env = {**os.environ, "PATH": os.environ.get("PATH","") + ":/Users/khanhhuynh/Library/Android/sdk/platform-tools"}

async def run():
    # === FRESH INSTALL ===
    subprocess.run(["adb", "-s", "emulator-5556", "shell", "pm", "clear", "com.mealplaner.app"],
                   capture_output=True, env=env)
    time.sleep(1)
    subprocess.run(["adb", "-s", "emulator-5556", "shell", "am", "start", "-n",
                     "com.mealplaner.app/.MainActivity"], capture_output=True, env=env)
    time.sleep(5)  # chờ app khởi động đầy đủ

    # === CDP CONNECTION ===
    pid = subprocess.run(["adb", "-s", "emulator-5556", "shell", "pidof", "com.mealplaner.app"],
                        capture_output=True, text=True, env=env).stdout.strip()
    subprocess.run(["adb", "-s", "emulator-5556", "forward", "tcp:9222",
                     f"localabstract:webview_devtools_remote_{pid}"], capture_output=True, env=env)
    time.sleep(2)

    data = json.loads(urllib.request.urlopen("http://localhost:9222/json").read())
    ws_url = data[0]["webSocketDebuggerUrl"]

    async with websockets.connect(ws_url, max_size=10*1024*1024) as ws:
        mid = [100]  # message ID counter

        # === HELPER FUNCTIONS ===
        async def ev(expr):
            """Evaluate JS expression and return value"""
            mid[0] += 1
            await ws.send(json.dumps({"id": mid[0], "method": "Runtime.evaluate",
                "params": {"expression": expr, "returnByValue": True, "awaitPromise": True}}))
            r = json.loads(await ws.recv())
            return r.get("result",{}).get("result",{}).get("value","")

        async def get_txt(tid):
            """Get textContent of element by data-testid"""
            return await ev(f'(function(){{var e=document.querySelector(\'[data-testid="{tid}"]\');'
                           f'return e?e.textContent.trim():"N/A"}})()')

        async def clk(tid):
            """Click element by data-testid"""
            return await ev(f'(function(){{var b=document.querySelector(\'[data-testid="{tid}"]\');'
                           f'if(b){{b.click();return"ok"}}return"none"}})()')

        async def set_input(tid, value):
            """Set React-controlled input value (native setter pattern)"""
            return await ev(f'''(function(){{
                var el=document.querySelector('[data-testid="{tid}"]');
                if(!el)return'no el';
                var ns=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
                ns.call(el,'{value}');
                el.dispatchEvent(new Event('input',{{bubbles:true}}));
                el.dispatchEvent(new Event('change',{{bubbles:true}}));
                return'set:'+el.value;
            }})()''')

        async def set_activity(value):
            """Set activity level select SCOPED TO FORM (critical!)"""
            return await ev(f'''(function(){{
                var form=document.querySelector('[data-testid="health-profile-form"]');
                if(!form)return'no form';
                var sel=form.querySelector('select');
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

        async def screenshot(path):
            """Take screenshot via CDP"""
            await ws.send(json.dumps({"id": 999, "method": "Page.captureScreenshot",
                                       "params": {"format": "png"}}))
            r = json.loads(await ws.recv())
            with open(path, "wb") as f:
                f.write(base64.b64decode(r["result"]["data"]))

        # === BYPASS ONBOARDING ===
        await ev('localStorage.setItem("app-onboarding-storage",'
                 'JSON.stringify({state:{isAppOnboarded:true,onboardingSection:null},version:1}))')
        await ws.send(json.dumps({"id": 50, "method": "Page.reload"}))
        await asyncio.sleep(4)
        await ws.recv()  # consume reload response

        # ... test logic here ...

asyncio.run(run())
```

### 9.2 Library: `websockets` (async) vs `websocket-client` (sync)

- **`websockets`** (async): Dùng `pip install websockets`. Cần `async/await`. Ổn định hơn.
  - `async with websockets.connect(url, max_size=10*1024*1024)` — tăng max_size cho screenshot
  - KHÔNG cần `suppress_origin`
- **`websocket-client`** (sync): Dùng `pip install websocket-client`. Cần `suppress_origin=True`.
  - Dễ bị timeout khi chờ response lâu

**Recommendation**: Luôn dùng `websockets` (async) cho test scripts.

---

## 10. ⚠️ BẪY QUAN TRỌNG — FORM-SCOPED SELECT

### Vấn đề

Trang có NHIỀU `<select>` elements. `document.querySelector('select')` trả về **select đầu tiên trên DOM** — thường là select sắp xếp món ăn (sort dropdown), KHÔNG phải activity level select trong form.

### Triệu chứng

Activity level luôn là "moderate" (default) dù đã set "sedentary". TDEE sai.

### Giải pháp BẮT BUỘC

```javascript
// ❌ SAI — tìm select toàn trang
var sel = document.querySelector('select');

// ✅ ĐÚNG — scope vào form
var form = document.querySelector('[data-testid="health-profile-form"]');
var sel = form.querySelector('select');
```

### Activity values

- `sedentary` → "Ít vận động"
- `light` → "Hoạt động nhẹ"
- `moderate` → "Hoạt động vừa phải" (DEFAULT)
- `active` → "Hoạt động tích cực"
- `extra_active` → "Hoạt động rất cao"

---

## 11. ⚠️ BẪY QUAN TRỌNG — SETTINGS NAVIGATION

### Vấn đề

Sau khi save Health Profile, app ở **detail view** (không phải main settings list). Click `settings-nav-goal` trả về "none" vì element bị ẩn bởi detail view.

### Giải pháp

**Đóng settings rồi mở lại** trước khi navigate sang section khác:

```python
# Sau khi save health profile...
await clk("settings-detail-save")
await asyncio.sleep(1)

# ❌ SAI — nav-goal ẩn trong detail view
await clk("settings-nav-goal")  # → "none"!

# ✅ ĐÚNG — close + reopen
await clk("btn-close-settings")
await asyncio.sleep(0.5)
await clk("btn-open-settings")
await asyncio.sleep(1)
await clk("settings-nav-goal")  # → "ok" ✅
```

### Settings detail views

Mỗi section (health-profile, goal, training-profile) có:

- **Read view**: Hiển thị thông tin + nút "Chỉnh sửa"
- **Edit view**: Form nhập liệu + "Lưu" / "Hủy"

Nút "Chỉnh sửa" có NHIỀU instances trong DOM (6 cái), phần lớn invisible. Chỉ cái cuối cùng có `getBoundingClientRect().width > 0`:

```javascript
// Tìm "Chỉnh sửa" visible
var btns = document.querySelectorAll('button');
for (var i = btns.length - 1; i >= 0; i--) {
  if (btns[i].textContent.trim() === 'Chỉnh sửa') {
    var r = btns[i].getBoundingClientRect();
    if (r.width > 0) {
      btns[i].click();
      break;
    }
  }
}
```

---

## 12. ⚠️ BẪY QUAN TRỌNG — MEAL PLANNER FLOW

### Flow thêm món vào bữa ăn

```
1. Click "Lên kế hoạch" (btn-plan-meal-section) hoặc "Thêm" trên meal slot
2. Planner view mở ra với 3 sections: Bữa Sáng / Bữa Trưa / Bữa Tối
3. Click vào section header (ví dụ "Bữa Trưa") để chọn slot đích
4. Click nút quick-add dish (dạng: "Ức gà áp chảo 330 kcal 62g")
5. Click "Xác nhận" (btn-confirm-plan) để lưu
```

### Chọn meal slot

```javascript
// Click section header để chọn slot
var els = document.querySelectorAll('h3,h4,div,button,span');
for (var i = 0; i < els.length; i++) {
  if (els[i].textContent.trim() === 'Bữa Trưa') {
    els[i].click();
    break;
  }
}
```

### ⚠️ Quick-add buttons format

Có 2 loại buttons cho cùng 1 món:

1. **Library card**: `"Bông cải xanh luộc"` (không có kcal) — KHÔNG phải quick-add
2. **Quick-add**: `"Bông cải xanh luộc 51 kcal 5g"` (có kcal+protein) — ĐÂY mới là nút add

```javascript
// Tìm quick-add button (phải có kcal trong text)
var btns = document.querySelectorAll('button');
for (var i = 0; i < btns.length; i++) {
  var t = btns[i].textContent.trim();
  if (t.startsWith('Ức gà') && t.includes('330')) {
    btns[i].click();
    break;
  }
}
```

### ⚠️ PHẢI confirm plan

Sau khi add xong tất cả dishes, **BẮT BUỘC** click `btn-confirm-plan`. Nếu không, meals KHÔNG được lưu vào dayPlan:

```python
await clk("btn-confirm-plan")
await asyncio.sleep(2)  # chờ DB persist
```

### Dish meal type tags (seed data)

| Dish                                 | Sáng | Trưa | Tối |
| ------------------------------------ | ---- | ---- | --- |
| D1: Trứng ốp la (155 cal, 13g)       | ✅   |      | ✅  |
| D2: Yến mạch sữa chua (332 cal, 25g) | ✅   |      |     |
| D3: Bông cải xanh luộc (51 cal, 5g)  |      | ✅   | ✅  |
| D4: Khoai lang luộc (129 cal, 3g)    |      | ✅   | ✅  |
| D5: Ức gà áp chảo (330 cal, 62g)     |      | ✅   | ✅  |

Default breakfast slot tự chọn khi mở planner. Phải click header "Bữa Trưa"/"Bữa Tối" để switch.

---

## 13. ⚠️ BẪY QUAN TRỌNG — BMR OVERRIDE

### Flow

1. Trong health profile form, BMR có 2 radio: "Tự động tính" / "Nhập thủ công"
2. Click radio thứ 2 (`input[name="bmr-override"]` index 1) để enable manual
3. Input field xuất hiện: `data-testid="bmr-override-input"`
4. Set giá trị bằng native setter pattern

```python
# Enable manual BMR
await ev('(function(){var r=document.querySelectorAll(\'input[name="bmr-override"]\');'
         'r[1].click();return"manual"})()')
await asyncio.sleep(0.5)

# Set value
await set_input("bmr-override-input", "1800")
```

---

## 14. Fresh Install Test Pattern

### Quy trình test từ đầu (mỗi scenario)

```python
# 1. Clear data = fresh install
subprocess.run(["adb", "-s", "emulator-5556", "shell", "pm", "clear", "com.mealplaner.app"], ...)

# 2. Relaunch
subprocess.run(["adb", "-s", "emulator-5556", "shell", "am", "start", "-n",
                 "com.mealplaner.app/.MainActivity"], ...)
time.sleep(5)  # QUAN TRỌNG: chờ đủ 5s cho WebView init

# 3. Reconnect CDP (PID thay đổi sau clear!)
pid = subprocess.run([...pidof...]).stdout.strip()
subprocess.run([...forward tcp:9222...])
time.sleep(2)

# 4. Bypass onboarding (PHẢI làm sau connect, trước reload)
await ev('localStorage.setItem("app-onboarding-storage",...)')
await ws.send({"method": "Page.reload"})
await asyncio.sleep(4)
await ws.recv()  # consume reload response
```

### ⚠️ Timing quan trọng

| Bước                       | Wait time | Lý do                              |
| -------------------------- | --------- | ---------------------------------- |
| Sau `am start`             | 5s        | WebView cần init, load JS bundle   |
| Sau `forward tcp`          | 2s        | Socket binding                     |
| Sau `Page.reload`          | 4s        | Full page reload + React hydration |
| Sau `click` (navigation)   | 1s        | State update + re-render           |
| Sau `click` (quick action) | 0.3-0.5s  | Optimistic update                  |
| Sau `btn-confirm-plan`     | 2s        | DB persistence                     |

---

## 15. 8 Verification Locations (data-testid map)

| ID  | Location                   | testid / cách truy cập                                                                        |
| --- | -------------------------- | --------------------------------------------------------------------------------------------- |
| L1  | Health Profile Form        | `bmr-value`, `tdee-value`, `macro-protein`, `macro-fat`, `macro-carbs`                        |
| L2  | Dashboard Mini             | `mini-eaten`, `mini-burned`, `mini-net`                                                       |
| L3  | Dashboard Protein          | `protein-display` (format: "Xg / Yg")                                                         |
| L4  | Dashboard Detail Sheet     | Click `energy-balance-mini` → `bmr-value`, `tdee-value`, `target-value`, `per-meal-breakdown` |
| L5  | Calendar Nutrition Card    | `energy-balance-card` (click `subtab-nutrition` first)                                        |
| L6  | Calendar Nutrition Summary | Header text "Mục tiêu: X kcal, Yg Protein"                                                    |
| L7  | Calendar Meals Bar         | `mini-nutrition-bar`, `mini-remaining-cal`, `mini-remaining-pro`                              |
| L8  | Fitness tab                | Same testids as L7 (bridge reuses components)                                                 |

### Navigation giữa locations

```python
# Calendar tabs
await clk("nav-calendar")        # → Calendar tab
await clk("subtab-meals")        # → Meals subtab
await clk("subtab-nutrition")    # → Nutrition subtab

# Dashboard
await clk("nav-dashboard")       # → Dashboard tab
await clk("energy-balance-mini") # → Opens EnergyDetailSheet (L4)

# Close sheet
await ev('(function(){var bd=document.querySelector(\'[data-testid="modal-backdrop"]\');if(bd)bd.click()})()')

# Fitness
await clk("nav-fitness")         # → Fitness tab
```

---

## 16. Goal Settings Form

### testid map

| Element           | testid                                                  |
| ----------------- | ------------------------------------------------------- |
| Goal type buttons | `goal-type-cut`, `goal-type-maintain`, `goal-type-bulk` |
| Rate buttons      | `rate-conservative`, `rate-moderate`, `rate-aggressive` |
| Offset display    | `calorie-offset-display`                                |
| Save              | `settings-detail-save`                                  |
| Cancel            | `settings-detail-cancel`                                |

### Offset values

| Goal     | Rate               | Offset |
| -------- | ------------------ | ------ |
| Cut      | Conservative       | -275   |
| Cut      | Moderate (default) | -550   |
| Cut      | Aggressive         | -1100  |
| Maintain | —                  | 0      |
| Bulk     | Conservative       | +275   |
| Bulk     | Moderate (default) | +550   |
| Bulk     | Aggressive         | +1100  |

---

## 17. Macro Calculation Nuance — Form vs App

**QUAN TRỌNG**: Health Profile Form preview hiển thị macros tính từ **TDEE** (không có goal offset). Tất cả locations khác tính từ **Target = TDEE + offset**.

```
Form Preview:  macros(target=TDEE)     → dùng khi chưa set goal
App Display:   macros(target=TDEE+offset) → dùng ở L2-L8
```

Với "maintain" (offset=0): hai giá trị giống nhau.
Với "cut"/"bulk": hai giá trị KHÁC nhau đáng kể.

Ví dụ SC-01: TDEE=2633, Target=2083 (cut -550)

- Form: Fat=73g, Carbs=344g (từ 2633)
- App: Fat=58g, Carbs=241g (từ 2083)

---

## 18. ⚠️ BẪY QUAN TRỌNG — AGE CALCULATION & TEST EXPECTATIONS

### Vấn đề

Khi viết test expected values, PHẢI tính age chính xác dựa trên ngày test hiện tại:

- DOB=1996-05-15, test date=2026-04-04 → age=**29** (NOT 30 — birthday chưa tới)
- Sai age 1 năm → BMR sai 5 kcal → TDEE sai ~8 kcal → tất cả assertions fail

### Quy tắc

```python
from datetime import date
dob = date(1996, 5, 15)
today = date.today()
age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
```

### Ví dụ

| DOB        | Test Date  | Age | BMR (Male, 75kg, 175cm) |
| ---------- | ---------- | --- | ----------------------- |
| 1996-05-15 | 2026-04-04 | 29  | 1704                    |
| 1996-05-15 | 2026-05-15 | 30  | 1699                    |
| 1996-05-15 | 2026-12-31 | 30  | 1699                    |

---

## 19. ⚠️ KIẾN TRÚC — SQL.JS IN-MEMORY (KHÔNG CÓ LOCAL PERSISTENCE)

### Phát hiện quan trọng

App dùng `sql.js` WASM tạo SQLite database **trong bộ nhớ** (`new SQL.Database()`).
KHÔNG có persistence xuống filesystem.

### Hệ quả

- `pm clear` hoặc `force-stop` + restart → **MẤT TOÀN BỘ data** (health profile, meals, custom ingredients)
- Seed data (10 ingredients, 5 dishes) được **tạo lại** mỗi lần khởi động qua `createSchema()`
- `localStorage` (Zustand persist) vẫn còn: `appOnboardingStore`, `fitnessStore`
- Chỉ Google Drive sync mới backup data thực sự

### Ảnh hưởng đến test

- **PHẢI test tất cả trong 1 session** — không restart giữa chừng
- J-06 (persistence test) = **known limitation**, KHÔNG phải bug
- Sau restart: onboarding skipped (localStorage) nhưng health profile = empty (SQLite lost)

---

## 20. Health Profile Form — Settings Page

### Input testids (KHÁC với onboarding form!)

| Field         | testid                      | Type  | Note                        |
| ------------- | --------------------------- | ----- | --------------------------- |
| Tên           | hp-name                     | text  |                             |
| Gender        | name="gender" (radio)       | radio | No testid                   |
| Ngày sinh     | hp-dob                      | date  |                             |
| Chiều cao     | hp-height                   | text  | ⚠️ type="text" NOT "number" |
| Cân nặng      | hp-weight                   | text  | ⚠️ type="text" NOT "number" |
| Tỉ lệ mỡ      | hp-bodyfat                  | text  | Optional                    |
| BMR override  | name="bmr-override" (radio) | radio | 2 radios                    |
| Protein ratio | hp-protein                  | text  | g/kg                        |

### QUAN TRỌNG: type="text" cho số

Form dùng `type="text"` cho height/weight (NOT `type="number"`).
Script tìm `input[type="number"]` sẽ **KHÔNG TÌM THẤY**.
Luôn dùng `data-testid` để tìm input:

```javascript
var el = document.querySelector('[data-testid="hp-weight"]');
```

### Edit flow

1. Open Settings (header icon, last button)
2. Click `settings-nav-health-profile`
3. Click "Chỉnh sửa" (last visible button with that text)
4. Modify fields using native setter pattern
5. Click `settings-detail-save`
6. Close: `btn-close-settings`

## 18. Edge Case: Macro Overflow

Khi protein+fat calories > target (ví dụ aggressive cut cho người nhẹ cân):

- `carbsCal = max(0, target - proteinCal - fatCal)` → carbs = 0
- App hiển thị "Vượt: X kcal" thay vì "Còn lại: X kcal" khi eaten > target
- Remaining hiển thị số âm: "Còn lại: -209 kcal"

Đây KHÔNG phải bug — đây là hành vi đúng khi goal quá aggressive.

---

## 21. ⚠️ BẪY QUAN TRỌNG — COMPREHENSIVE TEST SESSION FLOW

### Single-session constraint

Do in-memory SQLite, TẤT CẢ test phải chạy trong 1 WebSocket session.
Script pattern chuẩn:

```
pm clear → am start → wait 6s → CDP connect
    → Full onboarding (15+ clicks, 13s computing wait)
    → Group B (verify onboarding)
    → Group D/C (verify seed data)
    → Group E (add meals, confirm plan)
    → Group H (dashboard verification)
    → Group I (settings propagation: weight→goal→rate→revert)
    → Group L (cross-tab consistency)
    → KHÔNG restart giữa chừng!
```

### Onboarding completion detection

Plan Preview screen là nơi script HAY BỊ STUCK. Pattern đúng:

```python
# Strategy step
await clk("strategy-auto")
await asyncio.sleep(1)
await clk_btn("Tiếp tục")
await asyncio.sleep(14)  # ← 13-14s cho computing animation

# Plan Preview — button có thể là testid HOẶC text
r = await clk("onboarding-complete")
if r == "none":
    r = await clk_btn("Bắt đầu tập luyện")
await asyncio.sleep(3)

# VERIFY nav visible trước khi tiếp tục
nav = await ev('document.querySelector("[role=\\"tablist\\"]")?"yes":"no"')
assert nav == "yes", "Nav tabs not visible after onboarding!"
```

### Settings edit flow — Close+Reopen pattern

Sau khi save trong Settings, detail view vẫn active. PHẢI close+reopen trước khi navigate sang section khác:

```python
await clk("settings-detail-save")
await asyncio.sleep(1)
await clk("btn-close-settings")  # Close toàn bộ settings
await asyncio.sleep(0.5)
# Reopen nếu cần navigate sang section khác
await ev('...header button click...')
await asyncio.sleep(1)
await clk("settings-nav-goal")  # Giờ mới click được
```

### Verified test data (2026-04-04)

```
Input:  Male, Tester, 1996-05-15, 175cm, 75kg, moderate, cut-moderate
Age:    29 (birthday chưa tới)
BMR:    1704   (10×75 + 6.25×175 - 5×29 + 5)
TDEE:   2641   (1704 × 1.55)
Target: 2091   (2641 - 550)

Meals:  Sáng d5+d1=487cal, Trưa d2+d4+d3=510cal, Tối d2=330cal
Total:  1327 kcal, 170g protein
Remaining: 764 kcal (2091-1327)

Weight 80kg change:
BMR=1754, TDEE=2719, Target=2169

Goal maintain (w=80): Target=TDEE=2719
Goal bulk+aggressive (w=80): Target=2719+1100=3819
```

---

## 22. ⚠️ BẪY QUAN TRỌNG — PAGE STACK OVERLAY & DOM SCOPING

### Vấn đề

Khi PlanDayEditor (hoặc bất kỳ page stack page nào) mở qua `pushPage()`, nó render thành full-screen overlay bởi `PageStackOverlay`. Tuy nhiên, **DOM của page bên dưới VẪN CÒN** — buttons, inputs, testids đều accessible qua `document.querySelectorAll()`.

### Triệu chứng

- `document.querySelectorAll('button')` trả về buttons từ CẢ plan view (bên dưới) VÀ PlanDayEditor (overlay trên)
- `querySelector('[data-testid="subtab-plan"]')` vẫn tìm được dù đang ở PlanDayEditor
- Click nhầm button plan view thay vì button trong editor → hỏng test flow

### Giải pháp

**Luôn scope queries hoặc dùng vị trí (coordinates) để click đúng element:**

```javascript
// ❌ SAI — tìm bất kỳ button nào trên trang
document.querySelectorAll('button');

// ✅ ĐÚNG — dùng vị trí để xác định đúng button
var btns = document.querySelectorAll('button');
for (var i = 0; i < btns.length; i++) {
  var label = btns[i].getAttribute('aria-label') || '';
  var rect = btns[i].getBoundingClientRect();
  // Back button = top-left (y < 120, x < 100)
  if (label === 'Quay lại' && rect.top < 120 && rect.left < 100 && rect.width > 0) {
    btns[i].click();
    break;
  }
}

// ✅ ĐÚNG — dùng testid specific (exercise-item-{id}, exercise-selector-sheet)
document.querySelector('[data-testid="exercise-selector-sheet"]');
document.querySelectorAll('[data-testid^="exercise-item-"]');

// ✅ ĐÚNG — dùng reverse order cho bottom buttons (overlay renders LAST)
for (var i = btns.length - 1; i >= 0; i--) {
  if (btns[i].textContent.includes('Thêm bài tập') && btns[i].getBoundingClientRect().width > 0) {
    btns[i].click();
    break;
  }
}
```

### Bài học

PageStackOverlay = DOM additive (không xóa DOM cũ). Luôn dùng coordinates/testids cụ thể, không dùng generic queries.

---

## 23. PlanDayEditor — Exercise Selector Flow

### Testids

| Element               | testid                                                           |
| --------------------- | ---------------------------------------------------------------- |
| Edit exercises button | `edit-exercises-btn`                                             |
| Exercise selector     | `exercise-selector-sheet`                                        |
| Exercise items        | `exercise-item-{slug}` (vd: `exercise-item-barbell-bench-press`) |
| Back button           | aria-label="Quay lại" (NO testid!)                               |

### Flow chuẩn để test UnsavedChangesDialog

```python
# 1. Mở editor
await clk("edit-exercises-btn")
await asyncio.sleep(1)

# 2. Thêm exercise (TẠO dirty state)
# Click "Thêm bài tập" (reverse order để tránh nhầm)
# → exercise-selector-sheet mở
# Click exercise-item-{id}
# → selector tự đóng, exercise added

# 3. Press back (CẨN THẬN click đúng nút)
# Back button ở top-left: aria-label="Quay lại", y < 120, x < 100

# 4. Verify UnsavedChangesDialog
# Buttons: "Lưu & quay lại", "Bỏ thay đổi", "Ở lại chỉnh sửa"
# (CHÚ Ý: "Lưu &" chứ KHÔNG phải "Lưu và", "Ở lại" chứ KHÔNG phải "Tiếp tục")
```

### UnsavedChangesDialog — Actual Button Texts (vi.json)

| Key         | Text              |
| ----------- | ----------------- |
| title       | Thay đổi chưa lưu |
| saveAndBack | Lưu & quay lại    |
| discard     | Bỏ thay đổi       |
| stayEditing | Ở lại chỉnh sửa   |

### Verified Dialog Properties (emulator 411px width)

```
width: 411, height: 914
margin: 0px (✅ no UA default)
borderStyle: none (✅ no UA default)
maxWidth: none (✅ no UA default)
```
