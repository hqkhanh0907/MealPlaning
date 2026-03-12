# Hướng Dẫn Triển Khai (Deployment Guide)

**Version:** 2.0  
**Date:** 2026-03-11

---

## 1. Tổng quan

App Smart Meal Planner là ứng dụng **Android hybrid** (Capacitor + React). Không có backend server — dữ liệu lưu trong localStorage của WebView. Từ v2.0, hỗ trợ đồng bộ lên Google Drive (appDataFolder) qua Google OAuth2.

| Môi trường | Mô tả |
|-----------|-------|
| **Debug** | APK debug, dùng cho dev/testing |
| **Release** | APK signed, dùng cho production (Google Play hoặc sideload) |

---

## 2. Build APK Debug

```bash
# Full pipeline
bash build-apk.sh

# Từng bước nếu cần debug
npm run build                           # Build React app → dist/
npx cap sync android                    # Copy dist/ → android/app/src/main/assets/public/
cd android && ./gradlew assembleDebug   # Build APK
```

**Output:**
```
android/app/build/outputs/apk/debug/app-debug.apk
Size: ~147 MB (bao gồm WebView assets)
```

---

## 3. Cài đặt lên thiết bị Android

### 3.1 Qua ADB (USB hoặc Emulator)

```bash
# Cài APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Nếu đã cài phiên bản cũ
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Kết quả:
# Performing Streamed Install
# Success
```

### 3.2 Xác nhận cài thành công

```bash
adb shell pm list packages | grep mealplaner
# Output: package:com.mealplaner.app
```

### 3.3 Mở app

```bash
adb shell am start -n com.mealplaner.app/.MainActivity
```

### 3.4 Xem logs app (debug)

```bash
adb logcat -s Capacitor
# Hoặc xem tất cả logs của app:
adb logcat --pid=$(adb shell pidof com.mealplaner.app)
```

---

## 4. Cài đặt thủ công (Sideload)

1. Bật **Developer Options** trên điện thoại:
   - Settings → About phone → tap Build number (7 lần)
2. Bật **Install unknown apps** hoặc **USB debugging**
3. Chuyển APK sang điện thoại (USB / Google Drive / Email)
4. Mở file explorer → tap file `.apk` → Install

---

## 5. Yêu cầu thiết bị

| Yêu cầu | Giá trị tối thiểu |
|---------|------------------|
| Android | 7.0+ (API 24, minSdkVersion) |
| RAM | 2 GB |
| Storage | 500 MB trống |
| Internet | Cần để dùng AI features (Gemini API) |

---

## 6. Cấu hình Capacitor

File: `capacitor.config.ts`

```typescript
const config: CapacitorConfig = {
  appId: 'com.mealplaner.app',
  appName: 'Smart Meal Planner',
  webDir: 'dist',
  android: {
    buildOptions: {
      keystorePath: undefined,        // Debug keystore
      keystoreAlias: undefined,
    }
  }
};
```

---

## 7. Permissions

App yêu cầu các permissions sau (khai báo trong `AndroidManifest.xml`):

| Permission | Lý do |
|-----------|-------|
| `INTERNET` | Gọi Gemini API |
| `READ_EXTERNAL_STORAGE` | Import file backup |
| `WRITE_EXTERNAL_STORAGE` | Export file backup |
| `CAMERA` | Chụp ảnh món ăn cho AI |
| `READ_MEDIA_IMAGES` | Chọn ảnh từ Gallery |

---

## 8. Gradle build variants

```bash
# Debug APK (dùng trong dev/testing)
./gradlew assembleDebug

# Release APK (cần keystore — dùng cho production)
./gradlew assembleRelease

# Clean build
./gradlew clean assembleDebug
```

---

## 9. Update app

### Cập nhật code

```bash
# 1. Pull code mới
git pull

# 2. Install dependencies (nếu có thay đổi)
npm install

# 3. Build lại
bash build-apk.sh

# 4. Cài đè lên thiết bị
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Giữ nguyên dữ liệu user

`adb install -r` (replace) giữ nguyên data của app. Dữ liệu trong localStorage/WebView không bị xóa.

---

## 10. Capacitor sync workflow

Khi chỉ thay đổi web code (React/TypeScript):

```bash
npm run build
npx cap sync android
# Không cần build APK lại nếu chỉ test trong Android Studio
npx cap open android
# → Run app từ Android Studio
```

---

## 11. Troubleshooting

### App crash khi mở

```bash
adb logcat -s AndroidRuntime | grep FATAL
```

### WebView blank screen

```bash
# Kiểm tra assets path
adb shell ls /data/app/com.mealplaner.app*/base.apk

# Check Chrome WebView version
adb shell dumpsys package com.google.android.webview | grep versionName
```

### AI không hoạt động

1. Kiểm tra `GEMINI_API_KEY` đã được embed trong build (qua Vite `define` config, **không** dùng prefix `VITE_`)
2. Kiểm tra thiết bị có kết nối internet
3. Xem logs: `adb logcat | grep -i gemini`

### Lỗi Gradle

```bash
cd android
./gradlew clean
cd ..
npm run build
npx cap sync android
bash build-apk.sh
```

### Gradle Build Errors

#### Error: "SDK not found"
```bash
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
```

#### Error: "Minimum SDK version"
Kiểm tra `android/app/build.gradle`:
```
minSdkVersion 24
targetSdkVersion 36
```

#### Error: "Java version mismatch"
Đảm bảo JDK 17:
```bash
java -version
# openjdk version "17.x.x"
```

---

## 12. File structure quan trọng cho Android

```
android/
├── app/
│   ├── build.gradle          # App-level build config, versionCode/versionName
│   └── src/main/
│       ├── AndroidManifest.xml  # App permissions, activities
│       └── assets/public/       # React app build (được copy vào đây bởi cap sync)
├── build.gradle              # Project-level build config
├── local.properties          # sdk.dir path (KHÔNG commit)
└── variables.gradle          # SDK versions, dependencies
```

---

## 13. Kiểm tra App Storage trên Emulator

```bash
# Xem dung lượng app
adb shell du -sh /data/data/com.mealplaner.app/

# Xem WebView localStorage
adb shell cat /data/data/com.mealplaner.app/app_webview/Default/Local\ Storage/leveldb/

# Clear app data
adb shell pm clear com.mealplaner.app
```

---

## Google API Setup (Cloud Sync)

Để sử dụng tính năng Cloud Sync, cần cấu hình Google OAuth2:

### Yêu cầu
- Google Cloud Console project
- OAuth 2.0 Client ID (Web application type)
- Authorized JavaScript origins: `http://localhost:3000` (dev), production domain
- Google Drive API enabled trong project

### Biến môi trường
| Biến | Mô tả | Ví dụ |
|------|--------|-------|
| `VITE_GOOGLE_CLIENT_ID` | OAuth2 Client ID | `xxx.apps.googleusercontent.com` |

### Lưu ý
- App sử dụng `appDataFolder` scope — chỉ truy cập folder ẩn riêng của app trên Google Drive
- Không cần Drive full access — chỉ cần scope `https://www.googleapis.com/auth/drive.appdata`
- Token được lưu trong localStorage key `mp-auth-state`

---

## Tài liệu liên quan

- [Release Process](../05-process/release-process.md) — Quy trình release và versioning
- [Coding Guidelines](../03-developer-guide/coding-guidelines.md) — Quy tắc code, testing và ESLint
- [Setup Guide](../03-developer-guide/setup.md) — Hướng dẫn cài đặt môi trường phát triển
