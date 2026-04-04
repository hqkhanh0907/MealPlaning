# SAD — System Architecture Document

**Project:** Smart Meal Planner  
**Version:** 3.0  
**Date:** 2026-07-16

---

## 1. Tổng quan kiến trúc

Smart Meal Planner là ứng dụng **Single-Page Application (SPA)** chạy hoàn toàn trên client, không có backend server. Dữ liệu được lưu trữ trong **SQLite** (via sql.js WASM) với state management qua **Zustand**. Kết nối mạng chỉ cần cho Gemini AI API.

### 1.1 Tech Stack

| Layer            | Technology                | Version |
| ---------------- | ------------------------- | ------- |
| UI Framework     | React                     | 19      |
| Language         | TypeScript                | 5       |
| Build Tool       | Vite                      | 6       |
| Mobile           | Capacitor                 | 8       |
| State Management | Zustand                   | 5       |
| Styling          | Tailwind CSS              | 4       |
| UI Components    | Shadcn UI                 | latest  |
| i18n             | i18next + react-i18next   | 25+     |
| Forms            | React Hook Form           | 7.72    |
| Validation       | Zod                       | 4.3.6   |
| Form Resolvers   | @hookform/resolvers       | 5.2.2   |
| Database         | sql.js (SQLite WASM)      | latest  |
| AI               | Google Gemini (genai SDK) | latest  |

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT DEVICE                           │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              React 19 SPA (Vite 6 build)                  │  │
│  │                                                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │Dashboard │  │Management│  │ Fitness  │  │Settings  │ │  │
│  │  │   Tab    │  │   Tab    │  │   Tab    │  │   Tab    │ │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │  │
│  │       │              │              │              │       │  │
│  │  ┌────▼──────────────▼──────────────▼──────────────▼───┐ │  │
│  │  │         Zustand Stores (8 global + feature)         │ │  │
│  │  │  uiStore  dayPlanStore  dishStore  ingredientStore  │ │  │
│  │  │  fitnessStore  mealTemplateStore  navigationStore   │ │  │
│  │  │  appOnboardingStore  healthProfileStore (feature)   │ │  │
│  │  └──────────────────────────┬──────────────────────────┘ │  │
│  │                              │                            │  │
│  │  ┌───────────────┬───────────┴────────┬─────────────────┐│  │
│  │  │ planService   │ databaseService    │  geminiService  ││  │
│  │  │ (pure fns)    │ (SQLite WASM)      │  (AI API calls) ││  │
│  │  └───────────────┴────────────────────┴────────┬────────┘│  │
│  │                                                │          │  │
│  │  ┌─────────────────────────────────────────────┼────────┐│  │
│  │  │         SQLite (sql.js WASM)                │        ││  │
│  │  │  schema.ts (27 tables, version 3)           │        ││  │
│  │  │  migrationService.ts (localStorage → SQLite)│        ││  │
│  │  └─────────────────────────────────────────────┼────────┘│  │
│  │                                                │          │  │
│  └────────────────────────────────────────────────┼──────────┘  │
│                                               (HTTPS)            │
│  ┌────────────────────────────────────────────────▼──────────┐  │
│  │               Capacitor 8 Android Bridge                  │  │
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

### 2.2 State Management (Zustand)

Ứng dụng sử dụng **Zustand 5** cho toàn bộ state management. Có **8 global stores** trong `src/store/` và **1 feature store** trong `src/features/health-profile/store/`.

#### Global Stores (`src/store/`)

| Store                   | Key State                                                  | Mô tả                                                                     |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| `useUIStore`            | `hasNewAIResult`, `activeManagementSubTab`, `selectedDate` | UI state: tab selection, date picker, AI result flag                      |
| `useDayPlanStore`       | `dayPlans: DayPlan[]`                                      | Meal plan data per day                                                    |
| `useDishStore`          | `dishes: Dish[]`                                           | Dish library with ingredients                                             |
| `useIngredientStore`    | `ingredients: Ingredient[]`                                | Ingredient library with nutrition data                                    |
| `useMealTemplateStore`  | `templates: MealTemplate[]`                                | Saved meal plan templates                                                 |
| `useFitnessStore`       | `profile`, `plans`, `workouts`, `sets`, `weights`          | Full fitness module state (training plans, workout logs, weight tracking) |
| `useNavigationStore`    | `activeTab`, `pageStack`, `showBottomNav`                  | Tab navigation and full-screen page overlay stack (pushPage/popPage)      |
| `useAppOnboardingStore` | `isAppOnboarded`, `onboardingSection`                      | Onboarding progress (persisted via Zustand persist middleware)            |

#### Feature Store

| Store                   | Location                             | Key State                              | Mô tả                                   |
| ----------------------- | ------------------------------------ | -------------------------------------- | --------------------------------------- |
| `useHealthProfileStore` | `src/features/health-profile/store/` | `profile: HealthProfile`, `activeGoal` | Health profile and nutrition goals CRUD |

#### `useShallow` Pattern

Components use `useShallow` from `zustand/react/shallow` to prevent unnecessary re-renders when selecting multiple properties from a store:

```typescript
import { useShallow } from 'zustand/react/shallow';

const { plans, activePlan, loading } = useFitnessStore(
  useShallow(s => ({
    plans: s.plans,
    activePlan: s.activePlan,
    loading: s.loading,
  })),
);
```

All stores provide `loadAll()` methods that query the SQLite database via `databaseService`.

### 2.3 Service Layer (`src/services/`)

Chứa business logic thuần túy (pure functions), không có side effects.

| Service                    | Mô tả                                                                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `planService.ts`           | Logic thao tác với `DayPlan`: tạo, xoá, cập nhật, clear                                                                                  |
| `dataService.ts`           | Data migration (legacy format → current), validation, processAnalyzedDish                                                                |
| `databaseService.ts`       | **SQLite database engine** (sql.js WASM). Provides `query<T>()`, `execute()`, `transaction()`. Binary serialization for persistence      |
| `schema.ts`                | **Database schema definition** — `SCHEMA_VERSION = 6`, 28 tables across 5 functional groups. DDL statements, indexes, FK constraints     |
| `migrationService.ts`      | **Data migration** from localStorage → SQLite. Handles meal planning data, fitness data, and Zustand persist format migration            |
| `appSettings.ts`           | Key-value settings service — `getSetting()`, `setSetting()`, `deleteSetting()`, `getAllSettings()` backed by SQLite `app_settings` table |
| `geminiService.ts`         | 3 AI endpoints: analyzeDishImage, suggestMealPlan, suggestIngredientInfo                                                                 |
| `translateQueueService.ts` | Queue/dequeue translation tasks (legacy — no longer uses Web Worker)                                                                     |
| `googleDriveService.ts`    | Google Drive API wrapper: listFiles, uploadBackup, downloadBackup (appDataFolder)                                                        |

### 2.4 Data Layer — SQLite (Offline-First)

Ứng dụng sử dụng **sql.js** (SQLite compiled to WASM) cho offline-first persistence. Database được quản lý bởi `databaseService.ts`.

```
┌─────────────────────────────────────┐
│         databaseService.ts          │
│  ┌────────────────────────────────┐ │
│  │   sql.js (SQLite WASM)        │ │
│  │   - query<T>()                │ │
│  │   - execute()                 │ │
│  │   - transaction()             │ │
│  │   - exportBinary()            │ │
│  │   - exportToJSON()            │ │
│  └───────────┬────────────────────┘ │
│              │                      │
│  ┌───────────▼────────────────────┐ │
│  │  schema.ts (SCHEMA_VERSION=6) │ │
│  │  27 tables, 5 groups:         │ │
│  │  • Meal Planning (5 tables)   │ │
│  │  • User & Goal (2 tables)     │ │
│  │  • Training (5 tables)        │ │
│  │  • Tracking (3 tables)        │ │
│  │  • Fitness & Settings (4+)    │ │
│  └───────────┬────────────────────┘ │
│              │                      │
│  ┌───────────▼────────────────────┐ │
│  │  migrationService.ts          │ │
│  │  localStorage → SQLite        │ │
│  │  migrateFromLocalStorage()    │ │
│  │  migrateFitnessData()         │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

> **Migration path:** Dữ liệu cũ trong localStorage (mp-ingredients, mp-dishes, etc.) tự động migrate sang SQLite khi app khởi động lần đầu sau upgrade. Xem [data-model.md §8](data-model.md#8-sqlite-database-schema-19-tables).

#### DB Write Patterns

Zustand stores dùng **optimistic update** — cập nhật state ngay, persist DB async:

| Pattern                             | Khi nào dùng                                               | Module                                              |
| ----------------------------------- | ---------------------------------------------------------- | --------------------------------------------------- |
| `persistToDb()` (dbWriteQueue)      | Single-write fire-and-forget (INSERT/UPDATE/DELETE đơn lẻ) | `src/store/helpers/dbWriteQueue.ts`                 |
| `db.transaction()`                  | Multi-write atomic (nhiều SQL phải succeed/fail cùng nhau) | Inline trong store actions                          |
| `await db.transaction()` + rollback | Critical operations cần rollback Zustand state khi fail    | `setActivePlan`, `deleteWorkout`, `changeSplitType` |

`dbWriteQueue` cung cấp: serialized execution, retry logic cho transient errors (SQLITE_BUSY), structured error logging.

### 2.5 Form Management

Ứng dụng sử dụng **React Hook Form 7.72** + **Zod 4.3.6** + **@hookform/resolvers 5.2.2** cho form validation.

**Pattern:** Zod v4 type compatibility requires a cast:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';

const form = useForm<FormData>({
  resolver: zodResolver(schema) as unknown as Resolver<FormData>,
  defaultValues: { ... },
});
```

> **Lý do cast `as unknown as Resolver<FormData>`**: Zod v4 thay đổi type signature không tương thích trực tiếp với @hookform/resolvers. Cast an toàn vì runtime behavior vẫn đúng.

**Sử dụng trong:**

- `UnifiedOnboarding.tsx` — Multi-step wizard form (health profile + training config)
- `HealthProfileForm.tsx` — Health profile editing
- `TrainingProfileForm.tsx` — Training profile editing

### 2.6 Static Data (`src/data/`)

| File                | Mô tả                                                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialData.ts`    | Dữ liệu mẫu ban đầu (ingredients + dishes)                                                                                                          |
| `constants.ts`      | App constants, meal types, config values                                                                                                            |
| `units.ts`          | Đơn vị đo lường (g, ml, quả, ...)                                                                                                                   |
| `foodDictionary.ts` | Static Vietnamese food term dictionary. Lookup ~0ms via `lookupFoodTranslation()`. Xem [ADR 004](../adr/004-food-dictionary-instant-translation.md) |

### 2.7 Custom Hooks (`src/hooks/`)

| Hook                  | Mô tả                                                                         |
| --------------------- | ----------------------------------------------------------------------------- |
| `usePersistedState`   | `useState` + `localStorage` sync                                              |
| `useDarkMode`         | Theme management (light/dark/system)                                          |
| `useAISuggestion`     | Lifecycle quản lý AI suggestion (loading/cancel/apply)                        |
| `useModalManager`     | Open/close state cho nhiều modal đồng thời                                    |
| `useItemModalFlow`    | Pattern CRUD: open → edit → save/delete                                       |
| `useListManager`      | Search/filter cho danh sách nguyên liệu/món ăn                                |
| `useModalBackHandler` | Handle Android hardware back button trong modal                               |
| `useCopyPlan`         | Logic copy kế hoạch bữa ăn sang ngày khác                                     |
| `useMealTemplate`     | Template CRUD (tạo, đọc, cập nhật, xoá meal templates)                        |
| `useAutoSync`         | Orchestrates auto-backup: debounced upload (3s), download, conflict detection |
| `useIsDesktop`        | Responsive breakpoint detection (desktop vs mobile)                           |

### 2.8 Utilities (`src/utils/`)

| Utility               | Mô tả                                                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `helpers.ts`          | Ngày tháng, ID generation, week range, date parsing                                                                                           |
| `nutrition.ts`        | Tính toán dinh dưỡng từ DishIngredient[]                                                                                                      |
| `localize.ts`         | Lấy giá trị LocalizedString theo language, toLocalized()                                                                                      |
| `logger.ts`           | Structured logging: `debug` (dev-only), `info`, `warn`, `error` (always). Accepts `LogContext` with `component`, `action`, optional `traceId` |
| `imageCompression.ts` | Compress ảnh trước khi gửi AI                                                                                                                 |
| `tips.ts`             | Random health tips                                                                                                                            |

---

### 2.9 Context Providers (`src/contexts/`)

| Context               | Mô tả                                                                                                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthContext`         | Google OAuth2 state management (user, accessToken, loading). Wraps `App` component                                                                                                       |
| `NotificationContext` | Global toast notification system. API: `notify.success()`, `notify.error()`, `notify.warning()`, `notify.info()`, `notify.dismiss()`, `notify.dismissAll()` via `useNotification()` hook |

---

### 2.10 Feature Modules (`src/features/`)

Ứng dụng có **3 feature modules** chính, tổ chức theo feature-based structure:

```
features/
├── dashboard/            # Tổng quan (Dashboard)
│   ├── components/       # TodaysPlanCard, DashboardView
│   ├── hooks/
│   └── utils/
│
├── fitness/              # Tập luyện (Fitness)
│   ├── components/       # TrainingPlanView, WorkoutLogger, TrainingProfileForm
│   ├── hooks/
│   ├── data/             # Exercise database (built-in exercises)
│   ├── utils/
│   └── types.ts          # TrainingPlan, TrainingPlanDay, Workout, WorkoutSet, Exercise
│
└── health-profile/       # Hồ sơ sức khỏe (Health Profile)
    ├── components/       # HealthProfileForm, HealthProfileView
    ├── hooks/
    ├── store/            # healthProfileStore (Zustand)
    └── types.ts          # HealthProfile, Gender, ActivityLevel
```

Mỗi feature module có cấu trúc nhất quán: `components/`, `hooks/`, `types.ts`, và có thể có `services/`, `store/`, `data/`, `utils/`.

### 2.11 Component Architecture

**Layered rendering:** Pages → Layouts → Feature Components → Reusable UI (Shadcn)

```
Route (React.lazy + Suspense)
  └── Page Component (e.g. DashboardPage)
       └── Layout (MainLayout / AuthLayout)
            └── Feature Component (e.g. TodaysPlanCard)
                 └── Shared UI (Shadcn: Button, Dialog, Card, Input...)
```

**Lazy loaded routes** sử dụng `React.lazy()` + `<Suspense fallback={...}>` cho code splitting. Xem §4.1 Lazy Loading & Code Splitting.

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

| Function                | Model                         | Features            |
| ----------------------- | ----------------------------- | ------------------- |
| `analyzeDishImage`      | gemini-2.0-flash-preview      | Vision (ảnh base64) |
| `suggestMealPlan`       | gemini-2.0-flash-thinking-exp | ThinkingLevel.HIGH  |
| `suggestIngredientInfo` | gemini-2.0-flash-preview      | Google Search tool  |

---

### 4.1 Lazy Loading & Code Splitting

Ứng dụng sử dụng `React.lazy()` để tách code thành các chunk nhỏ:

| Component             | Loading Strategy                   | Chunk Size      |
| --------------------- | ---------------------------------- | --------------- |
| ManagementTab         | Lazy (luôn trong DOM, ẩn bằng CSS) | ~81KB           |
| SettingsTab           | Lazy (render khi active)           | ~19KB           |
| MealPlannerModal      | Lazy                               | ~14KB           |
| SaveAnalyzedDishModal | Lazy                               | ~12KB           |
| Các modal khác        | Lazy (6 modals)                    | 1-8KB mỗi chunk |

**Prefetch strategy**: Sau 2s idle, `usePrefetchAfterIdle` hook tự động prefetch ManagementTab và SettingsTab chunks.

**Manual chunks** (vite.config.ts):

- `vendor-react`: react, react-dom (~4KB gzip)
- `vendor-ui`: lucide-react, motion (~6KB gzip)
- `vendor-i18n`: i18next, react-i18next (~19KB gzip)
- `onboarding-advanced`: TrainingDetailSteps, PlanComputingScreen, PlanPreviewScreen (heavy onboarding components)

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

| Quyết định                           | Lý do                                                                                                                                                                 | ADR                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| SQLite (sql.js WASM) — offline-first | Zero cost, offline-first, privacy. Migrated from localStorage for better query support and schema management                                                          | [ADR-001](../adr/001-local-storage-only.md)                   |
| Google Gemini API                    | Multimodal, Google Search tool, structured output                                                                                                                     | [ADR-002](../adr/002-gemini-ai-integration.md)                |
| react-i18next                        | Ecosystem mature, interpolation, TypeScript support                                                                                                                   | [ADR-003](../adr/003-i18n-with-i18next.md)                    |
| Zustand 5 for state management       | Lightweight, TypeScript-first, no boilerplate. 8 focused stores instead of monolithic Redux                                                                           |
| React Hook Form + Zod 4              | Type-safe form validation with schema-driven approach. `zodResolver(schema) as unknown as Resolver<FormData>` pattern for Zod v4 compatibility                        |
| Feature-based structure              | 3 feature modules (dashboard, fitness, health-profile) each self-contained                                                                                            |
| Pure functions trong services        | Dễ unit test, không side effects                                                                                                                                      |
| Lazy loading + code splitting        | Giảm initial bundle size. 4 manual chunks + component-level lazy loading                                                                                              |
| Reference-counted scroll lock        | Fix BUG-001: nested modal unmount race condition                                                                                                                      | [BUG-001](../bug-reports/BUG-001-scroll-lock-nested-modal.md) |
| Google Drive sync (appDataFolder)    | Cloud backup without exposing user files, auto-sync with conflict resolution                                                                                          |
| AuthContext for OAuth2               | Separates auth concerns from App.tsx, provides useAuth() hook                                                                                                         |
| **PageStackOverlay pattern**         | **Full-screen fitness pages (WorkoutLogger, CardioLogger, PlanDayEditor) rendered as lazy-loaded overlays via `pushPage()`/`popPage()` through `useNavigationStore`** |
| **Unified Onboarding wizard**        | **Full wizard flow collecting health profile + training config → generates training plan. Two paths: auto (app generates plan) or manual (user builds own)**          |

---

## 9. QA-Driven Changes (Cycle 3)

Architecture validated through **183 E2E tests** and **1201 unit tests**. The following architectural patterns were confirmed:

| Pattern                                 | Validation                                                                                                                                                                                               |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| localStorage-only persistence (ADR-001) | Validated across all data flows — ingredients, dishes, dayPlans, userProfile                                                                                                                             |
| Cross-tab state consistency             | Language, theme, and data changes verified consistent across tabs                                                                                                                                        |
| Cascade data flow                       | Ingredient → Dish → Calendar → Grocery cascade verified end-to-end                                                                                                                                       |
| MealPlannerModal unified planning       | Replaced 2-step TypeSelection → Planning flow with single MealPlannerModal (internal tabs: breakfast/lunch/dinner). `openTypeSelection()` now finds first empty slot and opens MealPlannerModal directly |
| Cloud sync auto-backup                  | Google Drive appDataFolder backup verified: upload, download, conflict resolution                                                                                                                        |
| Desktop responsive layout               | useIsDesktop hook (1024px breakpoint) verified for responsive navigation                                                                                                                                 |
| Meal template CRUD                      | Save, list, apply, delete templates verified end-to-end                                                                                                                                                  |
| Copy plan                               | Single-day and multi-day plan copy verified with deep clone                                                                                                                                              |

**Key architectural change:** `TypeSelectionModal` was removed from the codebase. The `openTypeSelection()` function in `App.tsx` now checks empty meal slots in the current day plan and opens `MealPlannerModal` with the first empty slot as `initialTab`, enabling users to plan all meals (breakfast/lunch/dinner) in a single session.

---

## 10. QA-Driven Changes (Cycle 4 — Fitness Flexibility)

Architecture extended through manual testing of fitness features (SC41-SC43). Two bugs were found and fixed:

| Pattern                                | Validation                                                                                                                                                                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PageStackOverlay**                   | New component: reads `pageStack` from `useNavigationStore` and lazy-loads the top page as a full-screen overlay. Supports WorkoutLogger, CardioLogger, PlanDayEditor. Fixed BUG-FLEX-001 where `pushPage()` entries were stored but never rendered. |
| **SessionTabs visibility**             | Condition changed from `sessions.length > 1` to `>= 1`. Fixed BUG-FLEX-002 chicken-and-egg problem where single-session users couldn't access the "+" button to add more sessions.                                                                  |
| **Freestyle workout (planDayId=null)** | WorkoutLogger supports freestyle mode — workouts saved with `planDayId=null`, not attached to any training plan session.                                                                                                                            |
| **pushPage/popPage navigation**        | Full-screen pages (PlanDayEditor, WorkoutLogger, CardioLogger) use `pushPage()`/`popPage()` pattern via `useNavigationStore` Zustand store, rendered by `PageStackOverlay`.                                                                         |

> **Test Report:** [test-report-fitness-flexibility.md](../04-testing/reports/test-report-fitness-flexibility.md)

---

## 11. Unified Onboarding Architecture

### 11.1 Overview

Ứng dụng có hệ thống onboarding toàn diện (`UnifiedOnboarding.tsx`) dạng **multi-step wizard** thu thập thông tin người dùng và tạo kế hoạch tập luyện.

### 11.2 Wizard Flow

```
Welcome Slides → Health Basic → Activity Level → Nutrition Goal
    → Health Confirm → Training Core → Training Details
    → Plan Strategy Choice → Plan Computing → Plan Preview → Done
```

### 11.3 Onboarding Components (`src/components/onboarding/`)

| Component                     | Mô tả                                                                  |
| ----------------------------- | ---------------------------------------------------------------------- |
| `WelcomeSlides.tsx`           | Màn hình chào mừng với slides giới thiệu                               |
| `HealthBasicStep.tsx`         | Thu thập: tên, giới tính, ngày sinh, chiều cao, cân nặng               |
| `ActivityLevelStep.tsx`       | Mức độ vận động (sedentary → extra_active)                             |
| `NutritionGoalStep.tsx`       | Mục tiêu dinh dưỡng (cut/bulk/maintain)                                |
| `HealthConfirmStep.tsx`       | Xác nhận thông tin sức khỏe trước khi tiếp tục                         |
| `TrainingCoreStep.tsx`        | Thông tin tập luyện cốt lõi (mục tiêu, kinh nghiệm, số ngày/tuần)      |
| `TrainingDetailSteps.tsx`     | Chi tiết nâng cao (thiết bị, chấn thương, cardio, chu kỳ)              |
| `PlanStrategyChoice.tsx`      | Chọn chiến lược: **auto** (app tạo plan) hoặc **manual** (user tự xây) |
| `PlanComputingScreen.tsx`     | Màn hình xử lý khi đang tạo kế hoạch                                   |
| `PlanPreviewScreen.tsx`       | Xem trước kế hoạch tập luyện đã tạo                                    |
| `OnboardingProgress.tsx`      | Thanh tiến trình các bước                                              |
| `OnboardingErrorBoundary.tsx` | Error boundary cho onboarding flow                                     |
| `onboardingSchema.ts`         | Zod validation schema cho form data                                    |

### 11.4 Two Strategy Paths

| Strategy | Mô tả                                                                                                                 |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| `auto`   | App tự động tạo training plan dựa trên profile (experience, goal, equipment, days/week). User xem preview và xác nhận |
| `manual` | User tự xây dựng plan: chọn bài tập, cấu hình sets/reps cho từng ngày                                                 |

### 11.5 State Persistence

- `useAppOnboardingStore` (Zustand + persist middleware) lưu trạng thái: `isAppOnboarded`, `onboardingSection`
- Form data validated bằng Zod schema (`onboardingSchema.ts`, `fitnessOnboardingSchema.ts`)
- Sau hoàn thành → dữ liệu lưu vào `healthProfileStore` + `fitnessStore` → persist SQLite

---

## 12. Cross-References

| Tài liệu                        | Đường dẫn                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| Scenario Analysis & Test Cases  | [scenario-analysis-and-testcases.md](../04-testing/scenario-analysis-and-testcases.md)         |
| UX Improvement Research         | [ux-improvement-research.md](../ux-improvement-research.md)                                    |
| Data Model                      | [data-model.md](data-model.md)                                                                 |
| Sequence Diagrams               | [sequence-diagrams.md](sequence-diagrams.md)                                                   |
| Fitness Flexibility Test Report | [test-report-fitness-flexibility.md](../04-testing/reports/test-report-fitness-flexibility.md) |

---

## 13. Revision History

| Version | Date       | Changes                                                                                                                                                                                                                                                                                                                                                                                        |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.0     | 2026-03-11 | QA-driven architecture validation, Capacitor mobile, Google Drive sync                                                                                                                                                                                                                                                                                                                         |
| 2.1     | 2026-03-28 | Updated `NotificationContext` API docs (`notify.success()/error()/warning()/info()` via `useNotification()` hook). Corrected `logger.ts` description: only `debug` is dev-only; `info`, `warn`, `error` always output. SQLite database schema now has 19 tables (3 new fitness module tables — see [data-model.md §8](data-model.md#8-sqlite-database-schema-19-tables))                       |
| 2.2     | 2026-03-29 | Added PageStackOverlay pattern for full-screen fitness pages (pushPage/popPage). New components: SessionTabs, AddSessionModal, PlanDayEditor. Documented BUG-FLEX-001 and BUG-FLEX-002 fixes.                                                                                                                                                                                                  |
| 3.0     | 2026-07-16 | **Major update**: Migrated state management from App.tsx props to Zustand 5 (9 stores). Added SQLite (sql.js WASM) data layer with schema v3 (27 tables). Documented React Hook Form + Zod 4 form management. Added 3 feature modules (dashboard, fitness, health-profile). Added Unified Onboarding wizard architecture. Updated tech stack to React 19, Vite 6, Capacitor 8, Tailwind CSS 4. |
