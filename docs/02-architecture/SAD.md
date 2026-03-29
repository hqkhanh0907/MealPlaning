# SAD — System Architecture Document

**Project:** Smart Meal Planner  
**Version:** 2.1  
**Date:** 2026-03-28

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

              ┌─────────────────────────────────┐
              │       Google Drive API v3        │
              │   (appDataFolder, OAuth2)        │
              └─────────────────────────────────┘
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
├── QuickPreviewPanel.tsx  # Panel xem nhanh chi tiết món ăn
├── ImageCapture.tsx       # Camera / file input
├── DataBackup.tsx         # Export/Import
│
├── modals/
│   ├── IngredientEditModal.tsx   # Form CRUD nguyên liệu
│   ├── DishEditModal.tsx         # Form CRUD món ăn
│   ├── MealPlannerModal.tsx      # Lập kế hoạch bữa ăn (tabs: sáng/trưa/tối)
│   ├── AISuggestionPreviewModal.tsx  # Preview gợi ý AI
│   ├── AISuggestIngredientsPreview.tsx # Preview gợi ý nguyên liệu cho món ăn
│   ├── SaveAnalyzedDishModal.tsx     # Lưu kết quả phân tích ảnh
│   ├── GoalSettingsModal.tsx         # Mục tiêu dinh dưỡng
│   ├── ClearPlanModal.tsx            # Xoá kế hoạch
│   ├── CopyPlanModal.tsx            # Copy kế hoạch bữa ăn sang ngày khác
│   ├── TemplateManager.tsx          # Quản lý CRUD meal templates
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
    ├── FilterBottomSheet.tsx # Bottom sheet lọc/sắp xếp danh sách
    └── EmptyState.tsx        # Placeholder khi danh sách trống
```

### 2.2 State Management

Không dùng global state (Redux/Zustand) cho UI state chính. State tập trung tại `App.tsx` và được truyền xuống qua props.

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
| `translateQueueService.ts` | Queue/dequeue translation tasks (legacy — no longer uses Web Worker) |
| `googleDriveService.ts` | Google Drive API wrapper: listFiles, uploadBackup, downloadBackup (appDataFolder) |

### 2.4 Data Layer (`src/data/`)

| File | Mô tả |
|------|-------|
| `initialData.ts` | Dữ liệu mẫu ban đầu (ingredients + dishes) |
| `constants.ts` | App constants, meal types, config values |
| `units.ts` | Đơn vị đo lường (g, ml, quả, ...) |
| `foodDictionary.ts` | Static Vietnamese food term dictionary. Lookup ~0ms via `lookupFoodTranslation()`. Xem [ADR 004](../adr/004-food-dictionary-instant-translation.md) |

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
| `useCopyPlan` | Logic copy kế hoạch bữa ăn sang ngày khác |
| `useMealTemplate` | Template CRUD (tạo, đọc, cập nhật, xoá meal templates) |
| `useAutoSync` | Orchestrates auto-backup: debounced upload (3s), download, conflict detection |
| `useIsDesktop` | Responsive breakpoint detection (desktop vs mobile) |

### 2.6 Utilities (`src/utils/`)

| Utility | Mô tả |
|---------|-------|
| `helpers.ts` | Ngày tháng, ID generation, week range, date parsing |
| `nutrition.ts` | Tính toán dinh dưỡng từ DishIngredient[] |
| `localize.ts` | Lấy giá trị LocalizedString theo language, toLocalized() |
| `logger.ts` | Structured logging: `debug` (dev-only), `info`, `warn`, `error` (always). Accepts `LogContext` with `component`, `action`, optional `traceId` |
| `imageCompression.ts` | Compress ảnh trước khi gửi AI |
| `tips.ts` | Random health tips |

---

### 2.7 Context Providers (`src/contexts/`)

| Context | Mô tả |
|---------|-------|
| `AuthContext` | Google OAuth2 state management (user, accessToken, loading). Wraps `App` component |
| `NotificationContext` | Global toast notification system. API: `notify.success()`, `notify.error()`, `notify.warning()`, `notify.info()`, `notify.dismiss()`, `notify.dismissAll()` via `useNotification()` hook |

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

### 4.1 Lazy Loading & Code Splitting

Ứng dụng sử dụng `React.lazy()` để tách code thành các chunk nhỏ:

| Component | Loading Strategy | Chunk Size |
|-----------|-----------------|------------|
| ManagementTab | Lazy (luôn trong DOM, ẩn bằng CSS) | ~81KB |
| SettingsTab | Lazy (render khi active) | ~19KB |
| MealPlannerModal | Lazy | ~14KB |
| SaveAnalyzedDishModal | Lazy | ~12KB |
| Các modal khác | Lazy (6 modals) | 1-8KB mỗi chunk |

**Prefetch strategy**: Sau 2s idle, `usePrefetchAfterIdle` hook tự động prefetch ManagementTab và SettingsTab chunks.

**Manual chunks** (vite.config.ts):
- `vendor-react`: react, react-dom (~4KB gzip)
- `vendor-ui`: lucide-react, motion (~6KB gzip)
- `vendor-i18n`: i18next, react-i18next (~19KB gzip)

---

## 5. Translation Strategy (Vietnamese Only)

> **v5.0 update**: Ứng dụng chỉ hỗ trợ Tiếng Việt. Hệ thống dịch offline (OPUS model, Web Worker) đã bị xóa hoàn toàn. 

Hiện tại chỉ còn:
- **Food Dictionary** (`foodDictionary.ts`): Static dictionary cho Vietnamese food terms
- **i18next** (`vi.json`): UI labels bằng Tiếng Việt
- Không còn `translate.worker.ts`, `@xenova/transformers`, hay WASM models

### 5.1 Food Dictionary (`src/data/foodDictionary.ts`)

- Vietnamese food term dictionary covering proteins, seafood, dairy, grains, vegetables, fruits, nuts, oils, condiments, dishes
- Lookup: `lookupFoodTranslation(text: string): string | null`
- Case-insensitive, trimmed
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

  PageStackOverlay (lazy — renders full-screen fitness pages)
    ├── PlanDayEditor (lazy)    # Edit exercises in daily training plan
    │     └── UnsavedChangesDialog
    ├── WorkoutLogger (lazy)    # Strength workout logging (plan + freestyle modes)
    ├── CardioLogger (lazy)     # Cardio workout logging

  FitnessTab
    ├── Plan sub-tab
    │     ├── SessionTabs        # Session selector with "+" button for adding sessions
    │     ├── AddSessionModal    # Modal to add Strength/Cardio/Freestyle session
    │     └── TodaysPlanCard     # Today's workout overview
    ├── Progress sub-tab
    └── History sub-tab
```

---

## 8. Key Design Decisions

| Quyết định | Lý do | ADR |
|------------|-------|-----|
| localStorage-only (không backend) | Zero cost, offline-first, privacy | [ADR-001](../adr/001-local-storage-only.md) |
| Google Gemini API | Multimodal, Google Search tool, structured output | [ADR-002](../adr/002-gemini-ai-integration.md) |
| react-i18next | Ecosystem mature, interpolation, TypeScript support | [ADR-003](../adr/003-i18n-with-i18next.md) |
| State tại App.tsx | App nhỏ, tránh over-engineering |
| Pure functions trong services | Dễ unit test, không side effects |
| Lazy loading GroceryList + AI tab | Giảm initial bundle size |
| Reference-counted scroll lock | Fix BUG-001: nested modal unmount race condition | [BUG-001](../bug-reports/BUG-001-scroll-lock-nested-modal.md) |
| Google Drive sync (appDataFolder) | Cloud backup without exposing user files, auto-sync with conflict resolution |
| AuthContext for OAuth2 | Separates auth concerns from App.tsx, provides useAuth() hook |
| **PageStackOverlay pattern** | **Full-screen fitness pages (WorkoutLogger, CardioLogger, PlanDayEditor) rendered as lazy-loaded overlays via `pushPage()`/`popPage()` through `useNavigationStore`. Fixes rendering gap where App.tsx only handled Settings overlay.** |

---

## 9. QA-Driven Changes (Cycle 3)

Architecture validated through **183 E2E tests** and **1201 unit tests**. The following architectural patterns were confirmed:

| Pattern | Validation |
|---------|-----------|
| localStorage-only persistence (ADR-001) | Validated across all data flows — ingredients, dishes, dayPlans, userProfile |
| Cross-tab state consistency | Language, theme, and data changes verified consistent across tabs |
| Cascade data flow | Ingredient → Dish → Calendar → Grocery cascade verified end-to-end |
| MealPlannerModal unified planning | Replaced 2-step TypeSelection → Planning flow with single MealPlannerModal (internal tabs: breakfast/lunch/dinner). `openTypeSelection()` now finds first empty slot and opens MealPlannerModal directly |
| Cloud sync auto-backup | Google Drive appDataFolder backup verified: upload, download, conflict resolution |
| Desktop responsive layout | useIsDesktop hook (1024px breakpoint) verified for responsive navigation |
| Meal template CRUD | Save, list, apply, delete templates verified end-to-end |
| Copy plan | Single-day and multi-day plan copy verified with deep clone |

**Key architectural change:** `TypeSelectionModal` was removed from the codebase. The `openTypeSelection()` function in `App.tsx` now checks empty meal slots in the current day plan and opens `MealPlannerModal` with the first empty slot as `initialTab`, enabling users to plan all meals (breakfast/lunch/dinner) in a single session.

---

## 10. QA-Driven Changes (Cycle 4 — Fitness Flexibility)

Architecture extended through manual testing of fitness features (SC41-SC43). Two bugs were found and fixed:

| Pattern | Validation |
|---------|-----------|
| **PageStackOverlay** | New component: reads `pageStack` from `useNavigationStore` and lazy-loads the top page as a full-screen overlay. Supports WorkoutLogger, CardioLogger, PlanDayEditor. Fixed BUG-FLEX-001 where `pushPage()` entries were stored but never rendered. |
| **SessionTabs visibility** | Condition changed from `sessions.length > 1` to `>= 1`. Fixed BUG-FLEX-002 chicken-and-egg problem where single-session users couldn't access the "+" button to add more sessions. |
| **Freestyle workout (planDayId=null)** | WorkoutLogger supports freestyle mode — workouts saved with `planDayId=null`, not attached to any training plan session. |
| **pushPage/popPage navigation** | Full-screen pages (PlanDayEditor, WorkoutLogger, CardioLogger) use `pushPage()`/`popPage()` pattern via `useNavigationStore` Zustand store, rendered by `PageStackOverlay`. |

> **Test Report:** [test-report-fitness-flexibility.md](../04-testing/reports/test-report-fitness-flexibility.md)

---

## 11. Cross-References

| Tài liệu | Đường dẫn |
|-----------|-----------|
| Scenario Analysis & Test Cases | [scenario-analysis-and-testcases.md](../04-testing/scenario-analysis-and-testcases.md) |
| UX Improvement Research | [ux-improvement-research.md](../ux-improvement-research.md) |
| Data Model | [data-model.md](data-model.md) |
| Sequence Diagrams | [sequence-diagrams.md](sequence-diagrams.md) |
| Fitness Flexibility Test Report | [test-report-fitness-flexibility.md](../04-testing/reports/test-report-fitness-flexibility.md) |

---

## 12. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-03-11 | QA-driven architecture validation, Capacitor mobile, Google Drive sync |
| 2.1 | 2026-03-28 | Updated `NotificationContext` API docs (`notify.success()/error()/warning()/info()` via `useNotification()` hook). Corrected `logger.ts` description: only `debug` is dev-only; `info`, `warn`, `error` always output. SQLite database schema now has 19 tables (3 new fitness module tables — see [data-model.md §8](data-model.md#8-sqlite-database-schema-19-tables)) |
| 2.2 | 2026-03-29 | Added PageStackOverlay pattern for full-screen fitness pages (pushPage/popPage). New components: SessionTabs, AddSessionModal, PlanDayEditor. Documented BUG-FLEX-001 and BUG-FLEX-002 fixes. |
