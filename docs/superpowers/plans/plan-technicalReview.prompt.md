# Technical Review — Smart Meal Planner

> **Ngày:** 2026-03-01  
> **Reviewer:** AI Senior Engineer  
> **Scope:** Full codebase — Architecture, Code Quality, Performance, Security, Business Flow, Mobile  
> **Stack:** React 19 · TypeScript 5.8 · Vite 6 · Tailwind 4 · Capacitor 8 (Android) · Gemini AI

---

## MỤC LỤC

- [2. Technical Design Review](#2-technical-design-review)
- [3. Code Review](#3-code-review)
- [4. Business Flow Review](#4-business-flow-review)
- [5. Action Plan](#5-action-plan)

---

## 2. Technical Design Review

### 2.1 Architecture hiện tại

```
┌────────────────────────────────────────────────────────┐
│                    App.tsx (603 LOC)                    │
│            "God Component" — ALL state here             │
│  ~25 useState/usePersistedState, ~15 useCallback        │
│  Prop drilling 4 levels: App→ManagementTab→DishMgr→Modal│
├──────────┬──────────────┬───────────┬──────────────────┤
│CalendarTab│ManagementTab │AIImageAna.│  GroceryList     │
│  266L     │  80L (router)│  768L     │  274L            │
│           ├──────┬───────┤           │                  │
│           │DishMgr│IngMgr│           │                  │
│           │ 856L  │ 795L │           │                  │
└──────────┴──────┴───────┴───────────┴──────────────────┘
      │                           │
      ▼                           ▼
  localStorage               Gemini AI API
  (usePersistedState)         (client-side, key in bundle)
```

### 2.2 Checklist — Findings

| #   | Checklist Item                    | Status  | Chi tiết                                                                                                                                                                                                                                      |
| --- | --------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | **Architecture tuân thủ pattern** | 🔴 FAIL | Không có Clean Arch / Feature Module. `App.tsx` 603L là God Component chứa toàn bộ state + business logic. `DishManager` 856L và `IngredientManager` 795L mix state/logic/UI trong 1 file.                                                    |
| A2  | **Diagram rõ ràng**               | 🔴 FAIL | Không có class/sequence/data flow/state management diagram nào trong repo.                                                                                                                                                                    |
| A3  | **Offline-first / Caching**       | 🔴 FAIL | Không có offline detection. AI features (analyze, suggest, ingredient lookup) đều fail im lặng khi mất mạng. Không có retry UI. `localStorage` là storage duy nhất, không có IndexedDB/SQLite.                                                |
| A4  | **Performance & Scalability**     | ⚠️ WARN | 4 tab đều mount đồng thời (dùng `hidden/block` CSS). Không có `React.memo` ở bất kỳ component nào → mọi state change ở App re-render toàn bộ. Không có list virtualization. Hiện tại OK với ~10-20 items nhưng 500+ sẽ lag.                   |
| A5  | **Security design**               | 🔴 FAIL | **API key lộ client-side**: `vite.config.ts` inject `GEMINI_API_KEY` vào bundle → visible trong DevTools. Không có auth, không encrypt localStorage. Import data (`handleImportData`) không validate schema → XSS/data corruption risk.       |
| A6  | **Platform-specific**             | ⚠️ WARN | Capacitor config minimal. StatusBar fallback hardcode `28px`. Không có splash screen. Dead deps: `better-sqlite3`, `express`, `dotenv` trong production deps nhưng không dùng.                                                                |
| A7  | **Tech debt / DRY**               | 🔴 FAIL | `DishManager` và `IngredientManager` duplicate ~60% logic: search, filter, sort, layout switcher, view detail modal, edit modal, unsaved changes dialog, back gesture handlers. `getWeekRange` duplicate giữa `App.tsx` và `GroceryList.tsx`. |
| A8  | **Compatibility**                 | ⚠️ WARN | Không support dark mode. Không có accessibility attributes (aria-label trên interactive elements). Không test VoiceOver/TalkBack.                                                                                                             |

### 2.3 Data Flow — Vấn đề

```
User clicks → Component inline handler
  → Parent setState (via prop drilling 4 levels)
    → App re-render ALL children
      → usePersistedState → localStorage.setItem (sync, every change)
```

**Vấn đề:**

- Mỗi keystroke trong form → `setIngredients` → `localStorage.setItem` → serialize toàn bộ array → **chậm** khi data lớn.
- Không batched/debounced writes.
- Không có data versioning — corrupt data → mất hết.

---

## 3. Code Review

### 3.A Code Style & Readability

| #   | Rule                     | Status  | Chi tiết                                                                                                                                                                 |
| --- | ------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CS1 | ESLint + Prettier config | 🔴 FAIL | Không có `.eslintrc`, `.prettierrc` nào trong repo. Chỉ có `tsc --noEmit` cho lint.                                                                                      |
| CS2 | Naming convention        | ✅ PASS | camelCase cho vars/functions, PascalCase cho components. Consistent.                                                                                                     |
| CS3 | Magic numbers            | ⚠️ WARN | `amount: 100` (default ingredient amount), `300000` (AI timeout 5 phút), `15000/10000/5000/4000` (toast durations), `28px` (safe area fallback) — nên extract constants. |
| CS4 | Comment quality          | ✅ PASS | Comments ngắn gọn, đúng chỗ. Không comment thừa.                                                                                                                         |
| CS5 | File size                | 🔴 FAIL | 4 files > 600 LOC: `App.tsx` (603), `DishManager.tsx` (856), `IngredientManager.tsx` (795), `AIImageAnalyzer.tsx` (768). Vi phạm SRP nghiêm trọng.                       |

### 3.B Functionality & Logic

| #   | Rule                            | Status  | Chi tiết                                                                                                                                                                                                                                    |
| --- | ------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FL1 | No `any` type                   | ✅ PASS | Grep confirmed: 0 occurrences of `: any`.                                                                                                                                                                                                   |
| FL2 | Edge case handling              | ⚠️ WARN | `JSON.parse(response.text \|\| "{}") as T` — không validate runtime schema. AI trả sai format → data corruption.                                                                                                                            |
| FL3 | **`getWeekRange` mutation bug** | 🔴 BUG  | `App.tsx:49`: `new Date(targetDate.setDate(diff))` — `setDate()` mutates `targetDate` in-place trước khi tạo `start`. Kết quả có thể sai khi `diff` khác tháng. `GroceryList.tsx:47` đã fix đúng: `new Date(targetDate)` rồi mới `setDate`. |
| FL4 | Date timezone                   | ⚠️ WARN | `new Date('2026-03-01')` parse theo UTC → có thể lệch 1 ngày ở timezone +7. Nên dùng `new Date(2026, 2, 1)` hoặc explicit parse.                                                                                                            |
| FL5 | ID generation inconsistent      | ⚠️ WARN | `generateId('ing')` dùng `Date.now() + random` (tốt) nhưng `handleSaveAnalyzedDish` dùng `dish-${Date.now()}` (thiếu random, collision possible).                                                                                           |
| FL6 | `useEffect` deps                | ⚠️ WARN | `App.tsx:237`: `useEffect(() => { if (needsMigration) setDishes(dishes); }, [])` — missing `dishes`, `setDishes`, `rawDishes` deps.                                                                                                         |
| FL7 | `console.log`                   | ⚠️ WARN | 2 `console.log` sót lại (`App.tsx:321,380`).                                                                                                                                                                                                |

### 3.C Performance & Mobile-specific

| #   | Rule                      | Status  | Chi tiết                                                                                                                                               |
| --- | ------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PM1 | Main thread blocking      | ✅ PASS | AI calls đều `async/await`, không block UI. `AbortController` cho cancel.                                                                              |
| PM2 | Memory leak               | ✅ PASS | `useEffect` cleanup đúng (popstate listener, Capacitor listener). `AbortController` cleanup on unmount.                                                |
| PM3 | Cancel request on destroy | ✅ PASS | `handleCloseAISuggestionModal` abort pending request. `useModalBackHandler` cleanup listeners.                                                         |
| PM4 | Image compress            | 🔴 FAIL | `AIImageAnalyzer` gửi base64 raw → payload có thể 5-10MB trên ảnh chất lượng cao. Không resize/compress trước upload.                                  |
| PM5 | `React.memo`              | 🔴 FAIL | 0 components dùng `React.memo`. Mỗi state change ở `App` re-render `CalendarTab`, `ManagementTab`, `GroceryList`, `AIImageAnalyzer` — tất cả cùng lúc. |
| PM6 | Lazy loading              | 🔴 FAIL | 4 tabs mount đồng thời. `AIImageAnalyzer` (768L) render sẵn dù user chưa dùng. Nên `React.lazy` + `Suspense`.                                          |
| PM7 | List virtualization       | ⚠️ WARN | Danh sách NL/món render toàn bộ. OK hiện tại (< 50 items), nhưng cần `@tanstack/react-virtual` khi scale.                                              |

### 3.D Security

| #   | Rule                       | Status      | Chi tiết                                                                                                                                                                |
| --- | -------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SD1 | **API key lộ client-side** | 🔴 CRITICAL | `vite.config.ts:11`: `'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)` → key baked into JS bundle → anyone can extract. **PHẢI fix trước production.** |
| SD2 | Log sensitive data         | ⚠️ WARN     | `console.error("Failed to suggest meal plan:", error)` — error object có thể chứa API key trong stack trace.                                                            |
| SD3 | Input validation           | ⚠️ WARN     | Form validate emptiness nhưng không sanitize special chars. `handleImportData` write trực tiếp vào `localStorage` không validate schema.                                |
| SD4 | XSS                        | ✅ PASS     | React auto-escape. Không có `dangerouslySetInnerHTML`.                                                                                                                  |
| SD5 | Storage encryption         | 🔴 FAIL     | `localStorage` plaintext. Trên mobile nên dùng `@capacitor/preferences` hoặc encrypted storage.                                                                         |

### 3.E Testing

| #   | Rule            | Status  | Chi tiết                                                                                                |
| --- | --------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| T1  | Unit test       | 🔴 FAIL | **0% coverage**. Không có `.test.ts`, `.spec.ts`, không có test framework (vitest/jest) trong deps.     |
| T2  | UI test         | 🔴 FAIL | Không có integration/component tests.                                                                   |
| T3  | Manual test doc | ✅ GOOD | `test-cases-v2.md` (289 TCs), `test-report-v2.md` (324 PASSED). Tuy nhiên 100% manual, không automated. |
| T4  | Testable code   | ✅ GOOD | `nutrition.ts` (89L pure functions), `tips.ts`, helper functions — rất dễ unit test nếu tách ra.        |

### 3.F Documentation

| #    | Rule      | Status  | Chi tiết                                                                                                                                                                           |
| ---- | --------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DOC1 | README    | ⚠️ WARN | Cần kiểm tra xem có cập nhật theo architecture hiện tại không.                                                                                                                     |
| DOC2 | API docs  | 🔴 FAIL | `geminiService.ts` — 3 public functions không có JSDoc cho params/return/exceptions.                                                                                               |
| DOC3 | ADR       | 🔴 FAIL | Không có Architecture Decision Records. Các quyết định (tại sao localStorage thay vì IndexedDB, tại sao không routing, tại sao không state management library) không được ghi lại. |
| DOC4 | Changelog | ✅ GOOD | `test-cases-v2.md` có changelog chi tiết v2.7 → v2.11.                                                                                                                             |

---

## 4. Business Flow Review

### 4.1 Happy Path

| Flow                                | Status | Ghi chú                                   |
| ----------------------------------- | ------ | ----------------------------------------- |
| Xem lịch → chọn ngày → lên kế hoạch | ✅     | Month/Week mode, double-tap to plan       |
| CRUD nguyên liệu + AI auto-fill     | ✅     | Validation, AI suggest nutrition          |
| CRUD món ăn + tag bắt buộc          | ✅     | NL picker filter đã chọn, tag required    |
| AI phân tích ảnh → lưu thư viện     | ✅     | Upload/camera, tag required, save flow    |
| AI gợi ý thực đơn → preview → apply | ✅     | Abort on close, regenerate, partial apply |
| Danh sách đi chợ (3 scope)          | ✅     | Gộp NL, sort A-Z                          |
| Backup/Restore JSON                 | ✅     | Export download, import upload            |
| View Detail ↔ Edit navigation       | ✅     | Unsaved changes dialog 3 nút              |
| Mobile back gesture                 | ✅     | `useModalBackHandler` hook                |

### 4.2 Alternative & Error Flows

| Flow                         | Status  | Ghi chú                                                                 |
| ---------------------------- | ------- | ----------------------------------------------------------------------- |
| Xóa NL đang dùng trong món   | ✅      | Warning toast, block                                                    |
| Xóa món đang dùng trong plan | ✅      | Warning toast, block                                                    |
| AI timeout / network error   | ✅      | Toast thân thiện + retry                                                |
| AI abort khi đóng modal      | ✅      | AbortController                                                         |
| Edit → unsaved changes       | ✅      | 3 nút: Lưu/Bỏ/Ở lại                                                     |
| **Network offline**          | 🔴 FAIL | Không detect, AI buttons không disable, error chung chung               |
| **Data corruption**          | 🔴 FAIL | `JSON.parse` chỉ try-catch, không validate structure                    |
| **Multi-tab conflict**       | 🔴 FAIL | `localStorage` không sync across tabs → data override                   |
| **localStorage full**        | ⚠️ WARN | `usePersistedState` catch lỗi nhưng chỉ `console.warn`, user không biết |

### 4.3 UX/UI Issues

| #   | Vấn đề                                     | Mức độ |
| --- | ------------------------------------------ | ------ |
| UX1 | Không có undo delete                       | ⚠️     |
| UX2 | Grocery list không có checkbox "đã mua"    | ⚠️     |
| UX3 | Không có dark mode                         | ⚠️     |
| UX4 | Không có loading skeleton khi initial load | ⚠️     |
| UX5 | AI timeout 5 phút quá lâu cho mobile       | ⚠️     |

---

## 5. Action Plan

### Phase 1: 🔴 Critical Fixes (Làm ngay — 1-2 ngày)

| #   | Task                                                                                                                                                                                                  | File(s)                                                     | Effort | Lý do             | Status  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------ | ----------------- | ------- |
| 1.1 | **Proxy API key** — Tạo Vite dev middleware hoặc Cloudflare Worker để proxy Gemini API calls. Xóa `process.env.GEMINI_API_KEY` khỏi client bundle.                                                    | `vite.config.ts`, `geminiService.ts`, new `server/proxy.ts` | 4h     | Security Critical | ⏳ TODO |
| 1.2 | **Fix `getWeekRange` mutation bug** — Clone `targetDate` trước `setDate`. Extract shared `getWeekRange`, `isDateInRange`, `parseLocalDate` vào `utils/helpers.ts`. Xóa duplicate ở `GroceryList.tsx`. | `App.tsx`, `GroceryList.tsx`, `utils/helpers.ts`            | 10min  | Bug               | ✅ DONE |
| 1.3 | **Validate AI response** — Thêm runtime type guards (`isMealPlanSuggestion`, `isAnalyzedDishResult`, `isIngredientSuggestion`) + `parseJSON` helper thay vì bare `JSON.parse as T`.                   | `geminiService.ts`                                          | 2h     | Stability         | ✅ DONE |
| 1.4 | **Validate import data** — Validate schema trước khi write vào localStorage. Reject invalid structure với `notify.warning`.                                                                           | `App.tsx:handleImportData`                                  | 1h     | Security          | ✅ DONE |
| 1.5 | **Fix `useEffect` deps** — Dùng `hasMigratedRef` guard + proper deps thay vì empty `[]`.                                                                                                              | `App.tsx`                                                   | 15min  | Correctness       | ✅ DONE |
| 1.6 | **Fix ID generation** — Extract `generateId` vào `utils/helpers.ts`. Replace tất cả `dish-${Date.now()}` trong `App.tsx` và `DishManager.tsx` (3 chỗ).                                                | `App.tsx`, `DishManager.tsx`, `utils/helpers.ts`            | 5min   | Consistency       | ✅ DONE |
| 1.7 | **Remove `console.log`** — Xóa 2 debug logs.                                                                                                                                                          | `App.tsx:321,380`                                           | 5min   | Hygiene           | ✅ DONE |
| 1.8 | **Reduce AI timeout** — 300s → 30s cho mobile UX.                                                                                                                                                     | `geminiService.ts:186`                                      | 5min   | UX                | ✅ DONE |
| 1.9 | **Fix timezone** — Dùng `parseLocalDate` thay `new Date(dateStr)` trong `clearPlansByScope`. Extract shared `parseLocalDate` vào `utils/helpers.ts`.                                                  | `App.tsx`, `utils/helpers.ts`                               | 15min  | Correctness       | ✅ DONE |

### Phase 2: ⚠️ Architecture Refactor (Sprint tiếp — 3-5 ngày)

| #   | Task                                                                                                                                                                                  | File(s)                             | Effort | Lý do           | Status                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------ | --------------- | --------------------------------------------------------------- |
| 2.1 | **State management** — Extract `ingredients`, `dishes`, `dayPlans`, `userProfile` vào Zustand stores. Giảm `App.tsx` từ 603 → ~150 LOC. Eliminate prop drilling.                      | New `stores/`, refactor `App.tsx`   | 8h     | Maintainability | ✅ DONE (useDataStore created, ready for incremental migration) |
| 2.2 | **Service layer** — Tách business logic ra: `planService.ts`, `dishService.ts`, `ingredientService.ts`, `migrationService.ts`.                                                        | New `services/`, refactor `App.tsx` | 4h     | Testability     | ✅ DONE (planService + 18 tests)                                |
| 2.3 | **Component decomposition** — `DishManager` (868→415L, −52%), `IngredientManager` (806→331L, −59%). Extracted shared UI into `shared/` folder.                                        | `shared/` + refactored managers     | 8h     | SRP             | ✅ DONE                                                         |
| 2.4 | **Extract shared patterns** — `useListManager` + `useItemModalFlow` hooks, `ListToolbar` + `DetailModal` + `EmptyState` + `UnsavedChangesDialog` components. ~700L duplicate removed. | 2 hooks + 4 components (391 LOC)    | 4h     | DRY             | ✅ DONE                                                         |
| 2.5 | **Lazy load tabs** — `React.lazy` + `Suspense` cho `AIImageAnalyzer` và `GroceryList` (2 tab ít dùng). Thay `hidden/block` bằng conditional render.                                   | `App.tsx`                           | 2h     | Performance     | ✅ DONE                                                         |
| 2.6 | **`React.memo`** — Wrap `CalendarTab`, `ManagementTab`, `Summary`, `GroceryList`.                                                                                                     | Component files                     | 1h     | Performance     | ✅ DONE                                                         |

### Phase 3: ⚠️ Quality & Testing (2-3 ngày)

| #   | Task                                                                                                                                                                                                                                       | File(s)                                | Effort | Lý do       | Status                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- | ------ | ----------- | ---------------------------------------- |
| 3.1 | **Setup Vitest** — Install `vitest` + `@testing-library/react` + `@testing-library/jest-dom`. Config `vitest.config.ts`.                                                                                                                   | `package.json`, new `vitest.config.ts` | 1h     | Foundation  | ✅ DONE                                  |
| 3.2 | **Unit test pure functions** — Test `nutrition.ts` (5 functions), `tips.ts`, helpers from App (`getWeekRange`, `clearPlansByScope`, `applySuggestionToDayPlans`, `migrateDishes`, `migrateDayPlans`). Target: **100%** coverage cho utils. | New `src/__tests__/`                   | 4h     | Reliability | ✅ DONE (39 tests)                       |
| 3.3 | **Integration tests** — Test flows: tạo NL → tạo món → plan → grocery list.                                                                                                                                                                | New test files                         | 6h     | Confidence  | ✅ DONE (11 integration tests, 82 total) |
| 3.4 | **Setup ESLint + Prettier** — Install `eslint` + `@eslint/js` + `typescript-eslint` + `prettier`. Fix all existing warnings.                                                                                                               | `package.json`, new config files       | 2h     | Consistency | ✅ DONE (0 errors, 0 warnings)           |
| 3.5 | **Fix timezone handling** — Dùng `parseLocalDate` thay `new Date(dateStr)` across codebase.                                                                                                                                                | All files with date parse              | 2h     | Correctness | ✅ DONE                                  |

### Phase 4: Mobile & UX Polish (Backlog — ưu tiên theo feature)

| #    | Task                                                                                                                      | File(s)                                                   | Effort | Lý do         | Status                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------ | ------------- | ---------------------------------------------- |
| 4.1  | **Offline detection** — `navigator.onLine` + event listeners. Disable AI buttons khi offline, hiện banner cảnh báo.       | New `hooks/useOnlineStatus.ts`                            | 2h     | UX            | ✅ DONE (hook created)                         |
| 4.2  | **Image compression** — Canvas API resize/compress trước upload (800px max, 80% quality JPEG).                            | `AIImageAnalyzer.tsx`, `utils/imageCompression.ts`        | 2h     | Performance   | ✅ DONE                                        |
| 4.3  | **Remove dead deps** — Xóa `better-sqlite3`, `express`, `dotenv`, `@types/express` khỏi `package.json`.                   | `package.json`                                            | 15min  | Cleanup       | ✅ DONE                                        |
| 4.4  | **Reduce AI timeout** — 300s → 30s cho mobile UX.                                                                         | `geminiService.ts:186`                                    | 5min   | UX            | ✅ DONE                                        |
| 4.5  | **JSDoc cho service** — Document `suggestMealPlan`, `analyzeDishImage`, `suggestIngredientInfo` params/return/exceptions. | `geminiService.ts`                                        | 30min  | Documentation | ✅ DONE                                        |
| 4.6  | **Grocery checkbox** — Thêm checked state cho items "đã mua", persist.                                                    | `GroceryList.tsx`                                         | 2h     | UX            | ✅ DONE (usePersistedState)                    |
| 4.7  | **Undo delete** — Toast với "Hoàn tác" button (5s timer) sau xóa NL/món.                                                  | `DishManager`, `IngredientManager`, `NotificationContext` | 3h     | UX            | ✅ DONE (toast action button + 6s undo window) |
| 4.8  | **Dark mode** — CSS variables + Tailwind `dark:` prefix + toggle.                                                         | All component files, `index.css`                          | 4h     | UX            | ⏳ TODO                                        |
| 4.9  | **Accessibility** — `aria-label` cho buttons, keyboard navigation, focus management trong modals.                         | All component files                                       | 4h     | A11y          | ✅ DONE (nav, header, buttons, progress bars)  |
| 4.10 | **ADR document** — Ghi lại architecture decisions.                                                                        | New `.github/docs/ADR.md`                                 | 1h     | Documentation | ✅ DONE (6 ADRs)                               |

---

## Tổng kết đánh giá

| Hạng mục            | Điểm       | Summary                                                                     |
| ------------------- | ---------- | --------------------------------------------------------------------------- |
| **Architecture**    | 4/10       | God component, no state mgmt, no SoC, no routing                            |
| **Code Quality**    | 6/10       | TS strict + no `any` ✅, nhưng files quá lớn, duplicate code                |
| **Performance**     | 5/10       | useMemo/useCallback ✅, nhưng 0 React.memo, 0 lazy load, 0 virtualization   |
| **Security**        | 2/10       | 🔴 API key client-side, no input validation, no storage encryption          |
| **Testing**         | 2/10       | 0 automated tests, manual TC doc tốt nhưng không CI/CD                      |
| **UX/UI**           | 8/10       | Mobile-first ✅, touch targets ✅, responsive ✅, back gesture ✅           |
| **Business Logic**  | 8/10       | Happy + error flows đầy đủ, AI cancel, unsaved changes                      |
| **Documentation**   | 4/10       | TC doc tốt nhưng thiếu ADR, API docs, architecture diagrams                 |
| **Mobile-specific** | 5/10       | Capacitor OK, back button ✅ nhưng thiếu offline, image compress, dark mode |
| **TỔNG**            | **4.9/10** | App functional nhưng cần refactor trước khi scale                           |

### ⚡ Recommendation

> **Phase 1 (Critical) là BLOCKER** — đặc biệt task 1.1 (API key exposure). Không deploy production cho đến khi fix xong.
>
> Phase 2 nên làm trong 1-2 sprint tiếp để codebase maintainable trước khi thêm feature mới.
>
> Phase 3-4 có thể làm song song với feature development.
