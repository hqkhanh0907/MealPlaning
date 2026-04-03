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

# Screenshot
adb -s emulator-5556 exec-out screencap -p > screenshot.png

# Check WebView process
adb -s emulator-5556 shell ps -A | grep -i mealplaner

# List emulators
adb devices

# Logcat filter cho app
adb -s emulator-5556 logcat --pid=$(adb -s emulator-5556 shell pidof com.mealplaner.app)
```
