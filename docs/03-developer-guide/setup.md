# Hướng Dẫn Cài Đặt Môi Trường Dev

**Version:** 1.3  
**Date:** 2026-06-28

---

## 1. Yêu cầu hệ thống

| Công cụ        | Phiên bản tối thiểu | Ghi chú                                               |
| -------------- | ------------------- | ----------------------------------------------------- |
| Node.js        | 18+                 | Dùng `nvm` để quản lý version (khuyến nghị 20 LTS)    |
| npm            | 9+                  | Đi kèm với Node 18+                                   |
| Android Studio | Iguana 2023.2+      | Build Android APK                                     |
| JDK            | 17                  | Được bundle trong Android Studio                      |
| Android SDK    | API 34+             | Cài qua Android Studio SDK Manager (Capacitor target) |
| Git            | 2.40+               |                                                       |
| macOS / Linux  | -                   | Windows cần thêm file `.bat`                          |

---

## 2. Cài đặt môi trường

### 2.1 Clone project

```bash
git clone <repo-url>
cd MealPlaning
```

### 2.2 Cài Node dependencies

```bash
npm install
```

### 2.3 Thiết lập biến môi trường

Tạo file `.env.local` tại gốc project:

```env
VITE_GEMINI_API_KEY=your_google_gemini_api_key_here
```

Lấy API key tại: https://aistudio.google.com/app/apikey

> **Lưu ý:** API key được truy cập qua `import.meta.env.VITE_GEMINI_API_KEY` (xem `src/services/geminiService.ts` dòng 9). Prefix `VITE_` bắt buộc để Vite expose biến lên client-side code. File `.env.local` đã được thêm vào `.gitignore`, không commit key vào repo.

### 2.3.1 Xác minh API key

Sau khi cài đặt, verify API key hoạt động bằng cách:

1. Chạy dev server: `npm run dev`
2. Mở tab AI Analysis
3. Upload bất kỳ ảnh thức ăn nào
4. Nếu phân tích thành công → API key hoạt động

### 2.4 Chạy dev server

```bash
npm run dev
```

Ứng dụng chạy tại: http://localhost:3000 (cấu hình trong `vite.config.ts`)

---

## 3. Cài đặt Android build

### 3.1 Android Studio

1. Tải Android Studio: https://developer.android.com/studio
2. Trong Android Studio → **SDK Manager** → chọn:
   - Android 15.0 (API 36) — `android-36`
   - Android SDK Build-Tools 36.x
   - Android Emulator
   - Android SDK Platform-Tools

### 3.2 Biến môi trường Android

Thêm vào `~/.zshrc` hoặc `~/.bashrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk    # macOS
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

Tải lại: `source ~/.zshrc`

### 3.3 Thiết lập `local.properties`

```bash
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
```

### 3.4 Sync Capacitor & Build APK

```bash
npm run build
npx cap sync android

# Mở Android Studio để build/debug
npx cap open android

# Hoặc build APK trực tiếp qua script
bash scripts/build-apk.sh
```

### 3.5 Tạo AVD (Android Virtual Device)

Trong Android Studio → **Device Manager** → **Create Device**:

- Device: `Medium Phone` (411×914px, xhdpi)
- System Image: `API 36.1` (Google APIs / x86_64)
- AVD Name: `Medium_Phone_API_36.1`

> **Apple Silicon (M1/M2/M3/M4):** Trên Apple Silicon Mac, Android emulator sử dụng arm64 images. Chọn system image có nhãn `arm64-v8a` thay vì `x86_64`.

---

## 4. Cài đặt E2E testing

### 4.1 Cài Appium

```bash
npm install -g appium
appium driver install uiautomator2
```

### 4.2 Kiểm tra Appium doctor

```bash
npx appium-doctor --android
```

Tất cả checks phải ✓ hoặc ⚠ (không ✗).

### 4.3 Cài Chrome driver

```bash
appium driver install chromedriver --source=npm --package=appium-chromedriver
```

### 4.4 Build APK cho E2E

```bash
bash scripts/build-apk.sh
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

### 4.5 Khởi động emulator

```bash
emulator -avd Medium_Phone_API_36.1 &
```

Đợi emulator boot hoàn toàn (Device Manager hiển thị ▶ Running).

### 4.6 Cài APK lên emulator

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 4.7 Chạy E2E tests

Terminal 1 — Appium server:

```bash
appium
```

Terminal 2 — E2E runner:

```bash
npm run test:e2e
```

---

## 5. Lệnh hay dùng

| Lệnh                        | Mô tả                                          |
| --------------------------- | ---------------------------------------------- |
| `npm run dev`               | Dev server tại localhost:3000                  |
| `npm run build`             | Build production bundle → `dist/`              |
| `npm test`                  | Unit tests (Vitest, không watch)               |
| `npm run test:watch`        | Unit tests watch mode                          |
| `npm run test:coverage`     | Unit tests + coverage report                   |
| `npm run test:e2e`          | E2E tests (cần Appium + emulator)              |
| `npm run lint`              | ESLint check                                   |
| `npx eslint src/`           | ESLint check (trực tiếp)                       |
| `npx tsc --noEmit`          | TypeScript type-check (không emit)             |
| `npx cap sync android`      | Sync web assets vào Android project            |
| `npx cap open android`      | Mở Android Studio                              |
| `bash scripts/build-apk.sh` | Build APK đầy đủ                               |
| `npm run analyze`           | Bundle analysis (visualizer, cần ANALYZE=true) |

---

## 6. Cấu trúc thư mục quan trọng

```
src/
├── components/       # React components
│   ├── navigation/   # AppNavigation
│   ├── modals/       # Modal dialogs (Edit, Save, Backup...)
│   ├── tabs/         # CalendarTab, LibraryTab, GroceryTab, SettingsTab, AITab
│   ├── ui/           # Shared UI primitives (Button, Input, Toast...)
│   ├── schedule/     # Schedule / meal plan display components
│   ├── shared/       # Shared components across tabs
│   └── planning/     # Meal planning components
├── contexts/         # React Context (không dùng do đơn giản)
├── hooks/            # Custom hooks (usePersistedState, useAISuggestion...)
├── services/         # Business logic (geminiService, dataService, planService)
├── utils/            # Pure utilities (calorie, dates, validation)
├── locales/          # i18n JSON (vi.json)
├── types.ts          # Tất cả TypeScript interfaces
└── App.tsx           # Root component, state management

e2e/
├── pages/            # Page Objects (BasePage, CalendarPage...)
├── specs/            # Test specs 01-10
└── wdio.conf.ts      # WebdriverIO config

docs/
├── 01-requirements/  # PRD, use cases
├── 02-architecture/  # SAD, data model, sequence diagrams
├── 03-developer-guide/ # Setup, guidelines, schema
├── 04-testing/       # Test plan, cases, report, E2E guide
├── 05-process/       # Release process
├── 06-operations/    # Deployment
└── adr/              # Architecture Decision Records
```

---

## 7. VS Code extensions khuyến nghị

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "vitest.explorer",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

## 8. Troubleshooting

### `VITE_GEMINI_API_KEY` không load

Kiểm tra file `.env.local` tồn tại tại root (cùng cấp `package.json`). Đảm bảo biến tên `VITE_GEMINI_API_KEY` (phải có prefix `VITE_` để Vite expose). Restart dev server sau khi thêm/sửa biến.

### `adb devices` không thấy emulator

```bash
adb kill-server
adb start-server
adb devices
```

### E2E test lỗi `WEBVIEW not found`

1. Đảm bảo emulator đang chạy và APK đã cài
2. App phải được mở và fully loaded trước khi chạy E2E
3. Kiểm tra `chrome` trong `src/chromedriverArgs` trong `wdio.conf.ts`

### Gradle build failed

```bash
cd android
./gradlew clean
cd ..
npm run build
npx cap sync android
bash scripts/build-apk.sh
```

---

## 9. Database Schema

Ứng dụng sử dụng SQLite (qua Capacitor SQLite plugin) với **19 tables**. Schema được tạo bởi `createSchema(db)` trong `src/services/databaseService.ts`.

> **Lưu ý (2026-03-28):** Schema đã tăng từ 16 lên 19 tables do thêm các bảng hỗ trợ meal templates, AI suggestion history, và user preferences. Khi viết tests, bắt buộc gọi `createSchema(db)` sau `db.initialize()` để đảm bảo tạo đủ tables.

---

## 10. Quality Gates

### Coverage target

| Metric             | Target | Hiện tại (2026-06-28) |
| ------------------ | ------ | --------------------- |
| Test files         | —      | **165 files**         |
| Tests passing      | 100%   | **3954/3954** ✅      |
| Statement coverage | ≥ 98%  | **≥98%** ✅           |
| Lint errors        | 0      | **0** ✅              |
| TypeScript errors  | 0      | **0** ✅              |

### Lệnh kiểm tra

```bash
npx tsc --noEmit         # TypeScript type-check — bắt buộc 0 errors
npx eslint src/          # ESLint — bắt buộc 0 errors
npm test                 # Chạy toàn bộ unit tests (Vitest)
npm run test:coverage    # Unit tests + coverage report (≥98% statements)
```

> Mỗi PR phải pass cả 4 lệnh trên trước khi merge. Coverage không được giảm dưới 98%.

---

## 11. SonarQube Setup

Chạy sonar analysis:

```bash
bash scripts/sonar-setup.sh
```

Config: `sonar-project.properties`
