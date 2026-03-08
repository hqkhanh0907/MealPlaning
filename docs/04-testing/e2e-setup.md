# Hướng Dẫn E2E Testing Setup

**Version:** 1.0  
**Date:** 2026-03-06

---

## 1. Tổng quan

E2E tests của project dùng:
- **WebdriverIO v9** — test runner và assertion library
- **Appium 2** — mobile automation server
- **UiAutomator2** — Android native driver
- **Android Emulator** — test environment (API 36)

Tests chạy trong WEBVIEW context của app: `WEBVIEW_com.mealplaner.app`

---

## 2. Yêu cầu

| Công cụ | Version | Kiểm tra |
|---------|---------|---------|
| Node.js | 20 LTS | `node --version` |
| Android Studio | Iguana+ | GUI |
| Android SDK | API 36 | `sdkmanager --list` |
| ADB | Platform Tools | `adb version` |
| Java | 17 | `java -version` |

---

## 3. Cài đặt

### 3.1 Cài Appium và driver

```bash
# Cài Appium global
npm install -g appium

# Cài UiAutomator2 driver
appium driver install uiautomator2

# Kiểm tra
appium driver list
```

### 3.2 Kiểm tra môi trường

```bash
npx appium-doctor --android
```

Kết quả mong đợi — tất cả item phải ✓ hoặc ⚠ (warning), không có ✗:
```
✓ The Android SDK was found at: ~/Library/Android/sdk
✓ Java JDK was found at: ...
✓ adb was found at: .../platform-tools/adb
✓ ANDROID_HOME is set
```

### 3.3 Chrome driver

WebdriverIO cần Chrome driver tương thích với Chrome version trong app:

```bash
# WebdriverIO tự download chromedriver phù hợp
# Kiểm tra version Chrome trong emulator
adb shell dumpsys package com.android.chrome | grep versionName
```

---

## 4. Tạo AVD

```bash
# Mở Android Studio → Device Manager → Create Virtual Device
# Hoặc dùng command line:
avdmanager create avd \
  --name "Medium_Phone_API_36.1" \
  --package "system-images;android-36;google_apis;x86_64" \
  --device "medium_phone"
```

**Thông số AVD chuẩn:**
- Profile: `Medium Phone`
- API: `36.1` (Google APIs x86_64)
- RAM: 2048 MB+
- Storage: 2GB+

---

## 5. Build và cài APK

```bash
# Build APK
bash build-apk.sh

# Khởi động emulator
emulator -avd Medium_Phone_API_36.1 -no-audio &

# Đợi emulator ready
adb wait-for-device

# Install APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Xác nhận cài thành công
adb shell pm list packages | grep mealplaner
```

---

## 6. Chạy E2E Tests

### 6.1 Start Appium server (terminal 1)

```bash
appium --log-level info
```

Appium chạy tại `http://127.0.0.1:4723`.

### 6.2 Chạy tests (terminal 2)

```bash
# Tất cả specs
npm run test:e2e

# Một spec cụ thể
npx wdio run e2e/wdio.conf.ts --spec e2e/specs/03-dish-crud.spec.ts

# Kèm verbose output
npx wdio run e2e/wdio.conf.ts --logLevel debug
```

### 6.3 Kết quả

WebdriverIO in kết quả ra terminal:
```
[0-0] PASS  01-navigation.spec.ts
[0-0] PASS  02-calendar-basic.spec.ts
...
Spec Files:  10 passed, 0 failed, 0 skipped (10 total)
```

---

## 7. Cấu hình `wdio.conf.ts`

```typescript
// e2e/wdio.conf.ts — các setting quan trọng
capabilities: [{
  platformName: 'Android',
  'appium:deviceName': 'Medium_Phone_API_36.1',
  'appium:app': path.resolve('android/app/build/outputs/apk/debug/app-debug.apk'),
  'appium:automationName': 'UiAutomator2',
  'appium:noReset': true,          // QUAN TRỌNG: không reset app state giữa các runs
  'appium:ensureWebviewsHavePages': true,  // Đợi WEBVIEW có trang trước khi switch
}]
```

**`noReset: true`** — tránh Appium reset app state giữa specs. Thay vào đó, mỗi spec tự xóa localStorage:

```typescript
// e2e/pages/BasePage.ts
async clearAppData() {
  await browser.execute('localStorage.clear()');
}
```

---

## 8. WEBVIEW Context

App chạy trong hybrid mode (Capacitor): native shell + WebView.

```typescript
// BasePage.ts — switch sang WEBVIEW
async switchToWebview() {
  const contexts = await browser.getContexts();
  const webview = contexts.find(c => c.includes('WEBVIEW'));
  await browser.switchContext(webview);
}

// Context name format:
// WEBVIEW_com.mealplaner.app
```

**Quan trọng:** Luôn switch sang WEBVIEW trước khi dùng `$()` / `$$()` selectors.

---

## 9. Page Object Pattern

```typescript
// BasePage.ts — base class cho tất cả pages
export class BasePage {
  async waitForElement(selector: string, timeout = 5000) {
    await $(selector).waitForExist({ timeout });
    return $(selector);
  }

  async tapElement(selector: string) {
    const el = await this.waitForElement(selector);
    await el.click();
  }
}

// CalendarPage.ts — specific page
export class CalendarPage extends BasePage {
  get addMealButton() { return $('[data-testid="add-meal-btn"]'); }
  
  async addMealToSlot(mealType: string, dishName: string) {
    await this.tapElement(`[data-testid="slot-${mealType}"]`);
    await this.tapElement(`[data-testid="dish-${dishName}"]`);
  }
}
```

---

## 10. Troubleshooting

### Lỗi: "No device found"

```bash
adb devices
# Phải thấy emulator:
# emulator-5554   device

# Nếu không thấy: restart adb
adb kill-server && adb start-server
```

### Lỗi: "WEBVIEW not found"

1. App phải đang chạy và đã load xong
2. Đảm bảo dùng `ensureWebviewsHavePages: true` trong config
3. Thêm delay sau khi open app:
   ```typescript
   await browser.pause(2000);
   const contexts = await browser.getContexts();
   ```

### Lỗi: "Element not found" timeout

- Tăng timeout trong selector: `$(...).waitForExist({ timeout: 10000 })`
- Kiểm tra `data-testid` đúng trong source

### Lỗi: Appium "Session not created"

```bash
# Restart Appium
pkill -f appium
appium

# Kiểm tra AVD đang chạy
emulator -list-avds
emulator -avd Medium_Phone_API_36.1 &
```

### Chrome driver version mismatch

WebdriverIO v9 tự động download chromedriver. Nếu vẫn lỗi:
```bash
npx wdio run e2e/wdio.conf.ts --updateDriver
```

---

## 11. Debugging Tips

### Chạy 1 spec cụ thể

```bash
npx wdio e2e/wdio.conf.ts --spec e2e/specs/01-navigation.spec.ts
```

### Xem DOM trong WebView

Mở Chrome trên máy host và truy cập:

```
chrome://inspect/#devices
```

Chọn WebView của app `com.mealplaner.app` để inspect DOM, Console, Network.

### Flaky test handling

- Tăng timeout trong `wdio.conf.ts` (`waitforTimeout`, `connectionRetryTimeout`)
- Sử dụng `browser.pause()` thay `waitForDisplayed` khi có animation
- Check emulator CPU usage — giảm nếu > 80%
- Dùng `--spec` để isolate flaky spec và debug riêng lẻ
