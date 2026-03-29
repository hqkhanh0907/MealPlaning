# Smart Meal Planner 🥗

> Ứng dụng lên kế hoạch bữa ăn thông minh — hỗ trợ AI phân tích dinh dưỡng qua ảnh, theo dõi macro (protein/carbs/fat/calories), và gợi ý thực đơn tự động.

---

## Mục lục

- [Tổng quan](#tổng-quan)
- [Tính năng chính](#tính-năng-chính)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt & Chạy local](#cài-đặt--chạy-local)
- [Build Android APK](#build-android-apk)
- [Kiểm thử](#kiểm-thử)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Biến môi trường](#biến-môi-trường)
- [Tài liệu đầy đủ](#tài-liệu-đầy-đủ)

---

## Tổng quan

Smart Meal Planner là ứng dụng **offline-first**, chạy hoàn toàn trên thiết bị (không cần backend). Dữ liệu được lưu trong `localStorage`. Chỉ các tính năng AI mới cần kết nối internet (Gemini API).

**Tech stack:**

| Layer | Technology |
|-------|-----------|
| UI | React 19 + TypeScript + Tailwind CSS v4 |
| Build | Vite 6 |
| Mobile | Capacitor 8 (Android) |
| AI | Google Gemini API (`gemini-2.0-flash-preview`) |
| i18n | i18next (Tiếng Việt) |
| Testing | Vitest (unit) + WebdriverIO v9 + Appium 2 (E2E) |
| Code Quality | ESLint + TypeScript strict + SonarQube |

---

## Tính năng chính

- 📅 **Calendar** — Lập kế hoạch bữa ăn theo tuần (sáng/trưa/tối)
- 📊 **Nutrition Summary** — Tổng hợp calories/protein/carbs/fat theo ngày
- 📦 **Quản lý Nguyên liệu** — CRUD nguyên liệu với dinh dưỡng per-100g
- 🍽️ **Quản lý Món ăn** — CRUD món ăn từ các nguyên liệu, gắn tag bữa (sáng/trưa/tối)
- 🛒 **Grocery List** — Tự động tổng hợp danh sách mua sắm từ kế hoạch bữa ăn
- 🤖 **AI Phân tích ảnh** — Chụp hoặc upload ảnh món ăn → Gemini AI trích xuất nguyên liệu & dinh dưỡng
- ✨ **AI Gợi ý thực đơn** — Gemini AI đề xuất bữa ăn phù hợp mục tiêu calories/protein
- 🔍 **AI Tra cứu nguyên liệu** — Tự động điền dinh dưỡng cho nguyên liệu mới
- 💾 **Backup/Restore** — Export/Import JSON, share qua hệ thống chia sẻ Android
- 🌙 **Dark Mode** — Hỗ trợ light/dark/system theme
- 🌐 **Ngôn ngữ** — Giao diện hoàn toàn bằng Tiếng Việt
- 💪 **Fitness Tab** — Quản lý kế hoạch tập luyện, nhiều buổi tập/ngày (multi-session), chỉnh sửa bài tập (Plan Day Editor), tập tự do (freestyle workout)
- 🏃 **Workout Logging** — Ghi log bài tập strength và cardio, theo dõi tiến trình qua lịch sử tập luyện

---

## Yêu cầu hệ thống

- **Node.js** ≥ 20
- **npm** ≥ 10
- **Gemini API Key** ([lấy tại Google AI Studio](https://aistudio.google.com/apikey))
- *(Android build)* Android Studio, JDK 17+, Android SDK (API 35+)

---

## Cài đặt & Chạy local

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file .env.local và thêm API key
echo "VITE_GEMINI_API_KEY=your_key_here" > .env.local

# 3. Chạy dev server (localhost:3000)
npm run dev
```

**Các lệnh khác:**

```bash
npm run build          # Build production bundle
npm run lint           # TypeScript check + ESLint
npm run test           # Unit tests (3135 tests)
npm run test:coverage  # Unit tests + coverage report
npm run e2e            # E2E tests (Appium, cần emulator Android)
npm run analyze        # Bundle analysis (visualizer)
```

---

## Build Android APK

```bash
# Build APK đầy đủ + upload Google Drive (script tự động)
bash build-apk.sh

# Hoặc từng bước thủ công:
npm run build              # Build web
npx cap sync android       # Sync vào Android project
cd android && ./gradlew assembleDebug   # Build APK
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Kiểm thử

```bash
# Unit tests
npm test

# Unit tests + coverage
npm run test:coverage

# E2E (cần Android emulator AVD đang chạy)
export ANDROID_HOME="$HOME/Library/Android/sdk"
npm run e2e
```

**Kết quả hiện tại (2026-03-28):**
- Unit: **3135/3135** tests passing (139 test files)
- E2E: **183/183** tests passing (24 specs, Appium + WebdriverIO, Android)
- Coverage: **97.24%** statements
- Lint: **0** errors, **0** warnings

---

## Cấu trúc thư mục

```
src/
├── components/         # UI components (tabs, modals, shared)
│   ├── modals/         # Modal dialogs (DishEdit, IngredientEdit, AI, etc.)
│   ├── navigation/     # BottomNavBar + DesktopNav
│   └── shared/         # Reusable: UnitSelector, ModalBackdrop, etc.
├── hooks/              # Custom React hooks
├── services/           # Business logic (gemini, plan, data)
├── contexts/           # React contexts (NotificationContext)
├── utils/              # Pure utilities (helpers, nutrition, logger)
├── data/               # Static data (initialData, units, constants)
├── locales/            # i18n translations (vi.json)
└── types.ts            # TypeScript type definitions

docs/                   # Toàn bộ tài liệu dự án
├── 01-requirements/    # PRD, Use Cases
├── 02-architecture/    # SAD, Data Model, Sequence Diagrams
├── 03-developer-guide/ # Setup, Coding Guidelines, Storage Schema
├── 04-testing/         # Test Plan, Test Cases, Test Report, E2E Guide
├── 05-process/         # Release Process, Coding Process
├── 06-operations/      # Deployment Guide
├── adr/                # Architecture Decision Records
└── bug-reports/        # Bug Reports
```

---

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
|------|----------|-------|
| `VITE_GEMINI_API_KEY` | ✅ | Google Gemini API key. Lấy tại [AI Studio](https://aistudio.google.com/apikey). Prefix `VITE_` bắt buộc để Vite expose lên client. |

---

## Tài liệu đầy đủ

| Nhóm | Tài liệu |
|------|----------|
| 📋 Yêu cầu | [PRD](docs/01-requirements/PRD.md) · [Use Cases](docs/01-requirements/use-cases.md) |
| 🏗️ Kiến trúc | [SAD](docs/02-architecture/SAD.md) · [Data Model](docs/02-architecture/data-model.md) · [Sequence Diagrams](docs/02-architecture/sequence-diagrams.md) |
| 👩‍💻 Dev Guide | [Setup](docs/03-developer-guide/setup.md) · [Coding Guidelines](docs/03-developer-guide/coding-guidelines.md) · [Storage Schema](docs/03-developer-guide/localstorage-schema.md) |
| 🧪 Testing | [Test Plan](docs/04-testing/test-plan.md) · [Test Cases](docs/04-testing/test-cases.md) · [Test Report](docs/04-testing/test-report.md) · [E2E Guide](docs/04-testing/e2e-setup.md) |
| ⚙️ Process | [Release Process](docs/05-process/release-process.md) |
| 🚀 Operations | [Deployment Guide](docs/06-operations/deployment.md) |
| 📐 ADR | [001 localStorage](docs/adr/001-local-storage-only.md) · [002 Gemini AI](docs/adr/002-gemini-ai-integration.md) · [003 i18n](docs/adr/003-i18n-with-i18next.md) |
