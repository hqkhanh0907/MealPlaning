# Kiểm thử HealthMate AI trên Android

MealPlaning dùng mã gói `com.healthmate.ai` và activity `.MainActivity`.
[Cấu hình Capacitor](../../../capacitor.config.ts) khai báo mã gói.
[Cấu hình Appium](../../../e2e/wdio.conf.ts) dùng cùng mã gói và activity.

## Chọn máy và mở ứng dụng

Chạy `adb devices -l` để xem các máy đang kết nối.
Thay số máy trong ví dụ bằng số của máy cần thử.

```bash
device=emulator-5554
app_id=com.healthmate.ai
adb -s "$device" shell pm path "$app_id"
adb -s "$device" shell am start -W -n "$app_id/.MainActivity"
```

Để nâng cấp tại chỗ, dùng `adb -s "$device" install -r android/app/build/outputs/apk/debug/app-debug.apk`.
Dùng máy có hồ sơ thử riêng khi kiểm tra lần cài đầu.

## Kiểm tra WebView

Bản debug cho phép kiểm tra giao diện qua Chrome DevTools. Mở app trước khi lấy PID.

```bash
pid=$(adb -s "$device" shell pidof -s "$app_id" | tr -d '\r')
if [ -n "$pid" ]; then
  port=$(adb -s "$device" forward tcp:0 "localabstract:webview_devtools_remote_$pid")
  curl -fsS "http://127.0.0.1:$port/json/list"
fi
```

Sau khi khởi động lại app, lấy lại PID và mở kết nối mới.
Dùng `adb -s "$device" forward --remove "tcp:$port"` khi kết thúc phiên kiểm tra.

## Kiểm tra thao tác và dữ liệu

Lấy nhãn và `data-testid` từ template Angular của màn đang thử.
[Thanh tab](../../../src/app/tabs/tabs.page.html) có các mục Tổng quan, Lịch ăn, Quản lý và Tập luyện.
Khi kiểm hộp thoại, đối chiếu ảnh chụp với kích thước thật của chữ và nút trong WebView.
Kiểm tra `scrollWidth` so với `clientWidth` nếu nhãn dài.

```javascript
// Kiểm tra button text, kích thước VÀ overflow properties
(function () {
  var btns = document.querySelectorAll('[role="alertdialog"] button, dialog button');
  var results = [];
  btns.forEach(function (b) {
    var r = b.getBoundingClientRect();
    if (r.width > 0) {
      var cs = getComputedStyle(b);
      results.push({
        text: b.textContent.trim(),
        w: Math.round(r.width),
        h: Math.round(r.height),
        overflow: cs.overflow !== 'visible' && b.scrollWidth > r.width,
        textOverflow: cs.textOverflow,
        whiteSpace: cs.whiteSpace,
      });
    }
  });
  return JSON.stringify(results);
})();
```

Để thử lưu dữ liệu, ghi qua giao diện, đóng rồi mở lại ứng dụng và đối chiếu cùng bản ghi.
[Bản đồ nghiệp vụ](../../../docs/4-architecture/domain-map.md) dẫn đến các ca thử cho từng nhóm dữ liệu.
Dùng tên cơ sở dữ liệu từ cấu hình của bản build và tên bảng từ [schema](../../../src/app/core/services/database/schema.ts).

## Ionic Theme CSS Load Order (Critical Bug)

- ❌ `angular.json` styles: `["variables.scss", "global.scss"]` → Ionic core.css OVERWRITES our theme tokens
- ✅ `angular.json` styles: `["global.scss", "variables.scss"]` → Our tokens come LAST, override Ionic defaults
- 💡 Ionic 8's `@ionic/angular/css/core.css` (imported by global.scss) defines `:root { --ion-color-secondary: #0163aa }` which overrides custom `--ion-color-secondary: #ff9800` if loaded after
- 🔍 Debug: `grep "ion-color-secondary" www/styles*.css` to check which value wins
- ⚠️ This affects ALL Ionic color tokens, not just secondary — primary, tertiary, success, etc. are ALL at risk

## SplashScreen.hide() Required

- ❌ `capacitor.config.ts` has `launchAutoHide: false` but NO code calls `SplashScreen.hide()`
- ✅ Added `SplashScreen.hide()` in `AppComponent` constructor via `afterNextRender()`
- 💡 Without this, app shows splash screen forever on device

## ion-radio labelPlacement

- ❌ `labelPlacement="end"` on `ion-radio` inside `ion-item` → label text right-aligned (pushed to far right)
- ✅ Add `justify="start"` alongside `labelPlacement="end"` → text left-aligned next to radio circle

## Hiding ion-radio circle indicator (Ionic 8 + Angular)

- ❌ `--size: 0` in component styles → does NOT work. Angular's emulated ViewEncapsulation adds `_ngcontent` attributes, but `--size` CSS custom property doesn't pierce `ion-radio`'s shadow DOM effectively
- ❌ Component-scoped `.goal-item ion-radio { --size: 0; }` → compiles correctly but has no visible effect on device
- ✅ Use `::part(container) { display: none; }` in **global.scss** (not component styles). `::part()` selectors cannot work with Angular's emulated encapsulation — they must be in unscoped global styles
- ✅ Scope with component selector: `app-onboarding .goal-item ion-radio::part(container) { display: none; }`
- ✅ Use `[class.selected]="signal() === 'value'"` on `ion-item` + CSS `.selected { --background: var(--primary-50); }` for highlight-only selection
- 💡 `ion-radio` still handles keyboard a11y + `aria-checked` even with hidden indicator

## Native startup smoke — separate app bugs from emulator/package-reset noise

- ❌ Vấn đề: `adb install -r` + `pm clear` + immediate launch can report 14-18s cold start and screenshots may show splash/blank while Android/WebView/Play services are still processing package/data reset.
- ✅ Giải pháp đúng: run two probes — (1) fresh-reset install for worst-case evidence, (2) `am force-stop` then `am start -W` without `pm clear` for app-owned warm/cold startup. Capture logcat timestamps around `Loading app`, `SplashScreen.hide`, `SELECT * FROM user_profile`, and `Displayed`.
- 💡 Root cause: package replace/data clear can dominate emulator timing; app-owned regressions show up after WebView starts, e.g. duplicate fresh migrations or seed loader blocking `APP_INITIALIZER`.
- ✅ Fix pattern: fresh empty DB should apply canonical schema once and set `PRAGMA user_version = SCHEMA_VERSION`; seed loading must be delayed/fire-and-forget so first route render is not blocked.
