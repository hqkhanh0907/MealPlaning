# SAD — System Architecture Document

**Project:** Smart Meal Planner  
**Version:** 1.0  
**Date:** 2026-03-06

---

## 1. Tổng quan kiến trúc

Smart Meal Planner là ứng dụng **Single-Page Application (SPA)** chạy hoàn toàn trên client, không có backend server. Dữ liệu được lưu trữ trong `localStorage`. Kết nối mạng chỉ cần cho Gemini AI API.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT DEVICE                           │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   React SPA (Vite build)                  │  │
│  │                                                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │Calendar  │  │Management│  │ Grocery  │  │Settings  │ │  │
│  │  │   Tab    │  │   Tab    │  │   Tab    │  │   Tab    │ │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │  │
│  │       │              │              │              │       │  │
│  │  ┌────▼──────────────▼──────────────▼──────────────▼───┐ │  │
│  │  │              App.tsx (State Root)                    │ │  │
│  │  │  usePersistedState × 4 (ingredients, dishes,        │ │  │
│  │  │  dayPlans, userProfile)                             │ │  │
│  │  └──────────────────────────┬──────────────────────────┘ │  │
│  │                              │                            │  │
│  │  ┌───────────────┬───────────┴────────┬─────────────────┐│  │
│  │  │ planService   │   dataService      │  geminiService  ││  │
│  │  │ (pure fns)    │   (migrations)     │  (AI API calls) ││  │
│  │  └───────────────┴────────────────────┴────────┬────────┘│  │
│  │                                                │          │  │
│  │  ┌─────────────────────────────────────────────┼────────┐│  │
│  │  │              localStorage                   │        ││  │
│  │  │  mp-ingredients  mp-dishes  mp-day-plans   │        ││  │
│  │  │  mp-user-profile                            │        ││  │
│  │  └─────────────────────────────────────────────┼────────┘│  │
│  │                                                │          │  │
│  │  ┌─────────────────────────┐                  │          │  │
│  │  │  translate.worker.ts    │                  │          │  │
│  │  │  (OPUS model, offline)  │                  │          │  │
│  │  └─────────────────────────┘                  │          │  │
│  └────────────────────────────────────────────────┼──────────┘  │
│                                               (HTTPS)            │
│  ┌────────────────────────────────────────────────▼──────────┐  │
│  │               Capacitor Android Bridge                    │  │
│  │  @capacitor/filesystem  @capacitor/share  @capacitor/app  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                           (Internet)
                                │
              ┌─────────────────▼─────────────────┐
              │        Google Gemini API           │
              │   gemini-2.0-flash-preview model   │
              │   (Vision, Text, Google Search)    │
              └───────────────────────────────────┘
```

---

## 2. Layer Architecture

### 2.1 Presentation Layer (`src/components/`)

Tổ chức theo **tabs** (màn hình) + **modals** + **shared** (tái sử dụng).

```
components/
├── CalendarTab.tsx        # Tab lịch bữa ăn tuần
├── ManagementTab.tsx      # Tab quản lý (wrapper)
├── IngredientManager.tsx  # CRUD nguyên liệu
├── DishManager.tsx        # CRUD món ăn
├── GroceryList.tsx        # Danh sách mua sắm
├── AIImageAnalyzer.tsx    # Tab AI phân tích ảnh
├── SettingsTab.tsx        # Cài đặt
├── Summary.tsx            # Tổng hợp dinh dưỡng ngày
├── DateSelector.tsx       # Thanh chọn ngày (week view)
├── ImageCapture.tsx       # Camera / file input
├── DataBackup.tsx         # Export/Import
│
├── modals/
│   ├── IngredientEditModal.tsx   # Form CRUD nguyên liệu
│   ├── DishEditModal.tsx         # Form CRUD món ăn
│   ├── PlanningModal.tsx         # Chọn món cho slot bữa ăn
│   ├── AISuggestionPreviewModal.tsx  # Preview gợi ý AI
│   ├── SaveAnalyzedDishModal.tsx     # Lưu kết quả phân tích ảnh
│   ├── GoalSettingsModal.tsx         # Mục tiêu dinh dưỡng
│   ├── ClearPlanModal.tsx            # Xoá kế hoạch
│   ├── ConfirmationModal.tsx         # Dialog xác nhận
│   └── TypeSelectionModal.tsx        # Chọn bữa (sáng/trưa/tối)
│
├── navigation/
│   ├── BottomNavBar.tsx   # Navigation mobile (5 tabs)
│   ├── DesktopNav.tsx     # Navigation desktop (hidden mobile)
│   └── types.ts           # Tab type definitions
│
└── shared/
    ├── UnitSelector.tsx      # Dropdown chọn đơn vị (+ custom)
    ├── ModalBackdrop.tsx     # Wrapper modal với scroll lock
    ├── UnsavedChangesDialog.tsx  # Dialog cảnh báo thay đổi chưa lưu
    ├── ListToolbar.tsx       # Toolbar tìm kiếm + nút thêm
    ├── DetailModal.tsx       # Modal xem chi tiết đọc-chỉ
    └── EmptyState.tsx        # Placeholder khi danh sách trống
```

### 2.2 State Management

Không dùng global state (Redux/Zustand). State tập trung tại `App.tsx` và được truyền xuống qua props.

```
App.tsx
├── rawIngredients  → usePersistedState('mp-ingredients')
├── rawDishes       → usePersistedState('mp-dishes')
├── rawDayPlans     → usePersistedState('mp-day-plans')
├── userProfile     → usePersistedState('mp-user-profile')
├── activeMainTab   → useState
├── selectedDate    → useState
└── activeManagementSubTab → useState
```

**Migration pipeline:**
```
rawIngredients → migrateIngredients() → ingredients (memoized)
rawDishes      → migrateDishes()      → dishes      (memoized)
rawDayPlans    → migrateDayPlans()    → (used directly)
```

### 2.3 Service Layer (`src/services/`)

Chứa business logic thuần túy (pure functions), không có side effects.

| Service | Mô tả |
|---------|-------|
| `planService.ts` | Logic thao tác với `DayPlan`: tạo, xoá, cập nhật, clear |
| `dataService.ts` | Data migration (legacy format → current), validation, processAnalyzedDish |
| `geminiService.ts` | 3 AI endpoints: analyzeDishImage, suggestMealPlan, suggestIngredientInfo |
| `translateQueueService.ts` | Queue/dequeue tasks dịch offline, phát events cho worker |

### 2.4 Custom Hooks (`src/hooks/`)

| Hook | Mô tả |
|------|-------|
| `usePersistedState` | `useState` + `localStorage` sync |
| `useDarkMode` | Theme management (light/dark/system) |
| `useAISuggestion` | Lifecycle quản lý AI suggestion (loading/cancel/apply) |
| `useModalManager` | Open/close state cho nhiều modal đồng thời |
| `useItemModalFlow` | Pattern CRUD: open → edit → save/delete |
| `useListManager` | Search/filter cho danh sách nguyên liệu/món ăn |
| `useModalBackHandler` | Handle Android hardware back button trong modal |
| `useTranslateWorker` | Khởi tạo + communicate với translate Web Worker |
| `useTranslateProcessor` | Queue management: enqueue items cần dịch |

### 2.5 Utilities (`src/utils/`)

| Utility | Mô tả |
|---------|-------|
| `helpers.ts` | Ngày tháng, ID generation, week range, date parsing |
| `nutrition.ts` | Tính toán dinh dưỡng từ DishIngredient[] |
| `localize.ts` | Lấy giá trị LocalizedString theo language, toLocalized() |
| `logger.ts` | Structured logging (chỉ output trong dev mode) |
| `imageCompression.ts` | Compress ảnh trước khi gửi AI |
| `tips.ts` | Random health tips |

---

## 3. Mobile Architecture (Capacitor)

```
Web App (dist/)
     │
     ▼
Capacitor Android Bridge
     │
     ├── @capacitor/filesystem  → Android FileSystem API
     ├── @capacitor/share       → Android Intent Share
     ├── @capacitor/app         → App lifecycle (back button)
     └── @capacitor/status-bar  → Android status bar
     │
     ▼
WebView (WEBVIEW_com.mealplaner.app)
     Chrome 91+
```

**App ID:** `com.mealplaner.app`  
**Android scheme:** `https://` (tránh HTTP restriction)  
**Background:** `#f8fafc` (slate-50)

---

## 4. AI Integration Architecture

```
User Action (chụp ảnh / nhấn AI suggest)
          │
          ▼
    geminiService.ts
          │
   ┌──────┴──────┐
   │  withRetry   │  ← exponential backoff (max 2 retries)
   │ (transient   │     retry trừ: timeout, validation error,
   │  errors)     │     AbortError, API key error
   └──────┬──────┘
          │
   ┌──────┴──────┐
   │callWithTimeout│  ← 30 giây timeout, clearTimeout để tránh memory leak
   └──────┬──────┘
          │
   ┌──────┴──────┐
   │ GoogleGenAI  │  ← singleton (lazy init)
   │ (@google/   │
   │  genai SDK) │
   └──────┬──────┘
          │
          ▼
   Google Gemini API
          │
          ▼
   Runtime type guard validation
   (isMealPlanSuggestion / isAnalyzedDishResult / isIngredientSuggestion)
          │
          ▼
   Typed response → UI
```

**3 endpoints (functions):**

| Function | Model | Features |
|----------|-------|----------|
| `analyzeDishImage` | gemini-2.0-flash-preview | Vision (ảnh base64) |
| `suggestMealPlan` | gemini-2.0-flash-thinking-exp | ThinkingLevel.HIGH |
| `suggestIngredientInfo` | gemini-2.0-flash-preview | Google Search tool |

---

## 5. Background Translation Architecture

```
App.tsx
  │
  ├── useTranslateWorker    → khởi tạo Web Worker
  │                           lắng nghe message 'translated'
  │
  └── useTranslateProcessor → enqueue items thiếu translation
          │
          ▼
  translateQueueService.ts
    queue: [{id, type, direction, text}]
          │
          ▼
  translate.worker.ts (Web Worker)
    @xenova/transformers OPUS model
    vi→en: opus-mt-vi-en
    en→vi: opus-mt-en-vi
          │
          ▼
  postMessage('translated', {id, type, direction, translated})
          │
          ▼
  App.tsx.updateTranslatedField()
    → setIngredients() hoặc setDishes()
    → persist vào localStorage
```

---

## 6. Deployment Architecture

```
Source Code (GitHub)
      │
      ▼
npm run build      → dist/ (Vite bundle)
      │
      ▼
npx cap sync android  → android/app/src/main/assets/public/
      │
      ▼
./gradlew assembleDebug  → app-debug.apk
      │
      ▼
bash build-apk.sh  → copy to ~/Desktop + upload Google Drive
```

---

## 7. Component Dependencies (Key)

```
App.tsx
  ├── CalendarTab
  │     ├── DateSelector         (weekday navigation)
  │     ├── Summary              (daily nutrition totals)
  │     ├── PlanningModal        (add dish to slot)
  │     ├── AISuggestionPreviewModal
  │     └── ClearPlanModal
  │
  ├── ManagementTab
  │     ├── IngredientManager
  │     │     ├── ListToolbar
  │     │     ├── IngredientEditModal
  │     │     │     ├── UnitSelector
  │     │     │     ├── ModalBackdrop
  │     │     │     └── UnsavedChangesDialog
  │     │     └── DetailModal
  │     └── DishManager
  │           ├── DishEditModal
  │           │     ├── ModalBackdrop
  │           │     └── UnsavedChangesDialog
  │           └── DetailModal
  │
  ├── GroceryList (lazy)
  │
  ├── AIImageAnalyzer (lazy)
  │     ├── ImageCapture
  │     ├── AnalysisResultView
  │     └── SaveAnalyzedDishModal
  │           └── UnitSelector
  │
  └── SettingsTab
        ├── DataBackup
        └── GoalSettingsModal
```

---

## 8. Key Design Decisions

| Quyết định | Lý do | ADR |
|------------|-------|-----|
| localStorage-only (không backend) | Zero cost, offline-first, privacy | [ADR-001](../adr/001-local-storage-only.md) |
| Google Gemini API | Multimodal, Google Search tool, structured output | [ADR-002](../adr/002-gemini-ai-integration.md) |
| react-i18next | Ecosystem mature, interpolation, TypeScript support | [ADR-003](../adr/003-i18n-with-i18next.md) |
| State tại App.tsx (không Zustand) | App nhỏ, tránh over-engineering |
| Pure functions trong services | Dễ unit test, không side effects |
| Web Worker cho translation | UI thread không bị block khi dịch |
| Lazy loading GroceryList + AI tab | Giảm initial bundle size |
| Reference-counted scroll lock | Fix BUG-001: nested modal unmount race condition | [BUG-001](../bug-reports/BUG-001-scroll-lock-nested-modal.md) |
