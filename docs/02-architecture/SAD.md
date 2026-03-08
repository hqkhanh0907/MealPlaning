# SAD — System Architecture Document

**Project:** Smart Meal Planner  
**Version:** 1.1  
**Date:** 2026-03-07

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
│   ├── MealPlannerModal.tsx      # Lập kế hoạch bữa ăn (tabs: sáng/trưa/tối)
│   ├── AISuggestionPreviewModal.tsx  # Preview gợi ý AI
│   ├── SaveAnalyzedDishModal.tsx     # Lưu kết quả phân tích ảnh
│   ├── GoalSettingsModal.tsx         # Mục tiêu dinh dưỡng
│   ├── ClearPlanModal.tsx            # Xoá kế hoạch
│   └── ConfirmationModal.tsx         # Dialog xác nhận
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

### 2.4 Data Layer (`src/data/`)

| File | Mô tả |
|------|-------|
| `initialData.ts` | Dữ liệu mẫu ban đầu (ingredients + dishes) |
| `constants.ts` | App constants, meal types, config values |
| `units.ts` | Đơn vị đo lường (g, ml, quả, ...) |
| `foodDictionary.ts` | Static bilingual dictionary 200+ Vietnamese↔English food terms. Lookup ~0ms via `lookupFoodTranslation()`. Xem [ADR 004](../adr/004-food-dictionary-instant-translation.md) |

### 2.5 Custom Hooks (`src/hooks/`)

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

### 2.6 Utilities (`src/utils/`)

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

> **v2.1** (2026-03-08): Thêm static food dictionary layer cho instant translation (~0ms).
> Xem [ADR 004](../adr/004-food-dictionary-instant-translation.md).

### 5.1 Translation Layers (priority order)

| Layer | Latency | Coverage | Vị trí |
|-------|---------|----------|--------|
| 1. Dictionary tại save-time | ~0ms | 95%+ | `App.tsx` — `lookupFoodTranslation()` |
| 2. Dictionary trong worker | ~0ms | 95%+ | `translate.worker.ts` — fast-path |
| 3. WASM opus-mt model | 500ms–2s | ~100% | `translate.worker.ts` — fallback |

### 5.2 Component Diagram

```
App.tsx
  │
  ├── handleAddIngredient / handleUpdateIngredient
  │     └── lookupFoodTranslation(text, direction)  ← Layer 1: instant dictionary
  │           ├── HIT  → apply translation immediately, skip worker
  │           └── MISS → enqueue to translateQueueService
  │
  ├── useTranslateWorker    → khởi tạo Web Worker
  │                           lắng nghe message 'result'
  │
  └── useTranslateProcessor → dispatch pending jobs khi workerReady
          │
          ▼
  translateQueueService.ts
    queue: [{jobId, itemId, itemType, direction, sourceText, status}]
    scanMissing(): detect name.en === name.vi → re-translate vi→en
          │
          ▼
  translate.worker.ts (Web Worker)
    ├── lookupFoodTranslation()              ← Layer 2: dictionary fast-path
    └── @xenova/transformers OPUS model       ← Layer 3: ML fallback
        vi→en: opus-mt-vi-en
        en→vi: opus-mt-en-vi
          │
          ▼
  postMessage({type: 'result', id, text})
          │
          ▼
  App.tsx.updateTranslatedField()
    → setIngredients() hoặc setDishes()
    → persist vào localStorage
```

### 5.3 Food Dictionary (`src/data/foodDictionary.ts`)

- 200+ bilingual entries covering proteins, seafood, dairy, grains, vegetables, fruits, nuts, oils, condiments, dishes
- Lookup: `lookupFoodTranslation(text: string, direction: 'vi-en' | 'en-vi'): string | null`
- Case-insensitive, trimmed, first-entry-wins for reverse direction
- Synonyms: Đậu phụ / Đậu hũ / Tàu hũ → Tofu

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
  │     │     └── data-testid: progress-calories, progress-protein
  │     ├── MealPlannerModal     (unified meal planning — tabs: breakfast/lunch/dinner)
  │     │     └── data-testid: btn-plan-meal-section, btn-plan-meal-empty
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
  │     │     └── DetailModal     (data-testid: detail-modal, btn-detail-edit, btn-detail-close)
  │     └── DishManager
  │           ├── DishEditModal
  │           │     ├── ModalBackdrop
  │           │     └── UnsavedChangesDialog
  │           └── DetailModal     (data-testid: detail-modal, btn-detail-edit, btn-detail-close)
  │
  ├── GroceryList (lazy)
  │     └── data-testid: grocery-all-bought (celebration banner)
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

---

## 9. QA-Driven Changes (Cycle 3)

Architecture validated through **183 E2E tests** and **866 unit tests**. The following architectural patterns were confirmed:

| Pattern | Validation |
|---------|-----------|
| localStorage-only persistence (ADR-001) | Validated across all data flows — ingredients, dishes, dayPlans, userProfile |
| Cross-tab state consistency | Language, theme, and data changes verified consistent across tabs |
| Cascade data flow | Ingredient → Dish → Calendar → Grocery cascade verified end-to-end |
| MealPlannerModal unified planning | Replaced 2-step TypeSelection → Planning flow with single MealPlannerModal (internal tabs: breakfast/lunch/dinner). `openTypeSelection()` now finds first empty slot and opens MealPlannerModal directly |

**Key architectural change:** `TypeSelectionModal` was removed from the codebase. The `openTypeSelection()` function in `App.tsx` now checks empty meal slots in the current day plan and opens `MealPlannerModal` with the first empty slot as `initialTab`, enabling users to plan all meals (breakfast/lunch/dinner) in a single session.
