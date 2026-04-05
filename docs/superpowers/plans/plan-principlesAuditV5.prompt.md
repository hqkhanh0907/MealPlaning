## Plan: Principles Audit V5 — Toàn diện theo 8 nhóm nguyên tắc

Phân tích toàn bộ source code MealPlaning dựa trên bộ nguyên tắc 0–7. Liệt kê các vi phạm thực tế kèm giải pháp cụ thể.

---

### 0. Nguyên tắc Cốt lõi — Vi phạm phát hiện

#### 0.1 DRY — `constants.ts` chứa cả bản hardcoded lẫn bản i18n

**Vi phạm:** `MEAL_TAG_OPTIONS`, `MEAL_TYPE_LABELS`, `TAG_SHORT_LABELS`, `BASE_SORT_OPTIONS` tồn tại song song với `getMealTagOptions()`, `getMealTypeLabels()`, `getTagShortLabels()`, `getBaseSortOptions()`. Mỗi knowledge lặp đúng 2 lần.

**Ảnh hưởng:** Bản hardcoded chỉ dùng trong test (`constantsAndData.test.ts`), không còn được import ở production code.

**Giải pháp:** Xóa `MEAL_TAG_OPTIONS`, `MEAL_TYPE_LABELS`, `TAG_SHORT_LABELS`, `BASE_SORT_OPTIONS` (bản static). Giữ lại chỉ factory functions `get*()`. Cập nhật `constantsAndData.test.ts` dùng factory functions với `t` mock. `MEAL_TYPE_ICONS` derive từ hardcoded values (emoji không cần i18n) — giữ nguyên nhưng inline icons.

**File:** `src/data/constants.ts` L5-61, `src/__tests__/constantsAndData.test.ts`

#### 0.2 DRY — `TAB_LABELS` deprecated nhưng vẫn tồn tại

**Vi phạm:** `TAB_LABELS` được đánh `@deprecated` nhưng vẫn export ở `src/components/navigation/types.ts` L14-21. Không còn import nào sử dụng.

**Giải pháp:** Xóa `TAB_LABELS` hoàn toàn. Dead code.

**File:** `src/components/navigation/types.ts` L14-21

#### 0.3 POLA — `getTabLabels()` import trực tiếp `i18n` instance

**Vi phạm:** `src/components/navigation/types.ts` L1 import `i18n` singleton rồi gọi `i18n.t()` trực tiếp. Đây là pattern bất thường — mọi component khác dùng `useTranslation()` hook. Dev mới sẽ bất ngờ khi thấy cách này.

**Giải pháp:** Chuyển `getTabLabels()` thành factory function nhận `t: TFunction` (giống pattern đã dùng ở `constants.ts`). Caller truyền `t` từ `useTranslation()`.

**File:** `src/components/navigation/types.ts` L1, L6-12

#### 0.4 Fail Fast — `migrateDishes` throw Error cho invalid data nhưng không catch

**Vi phạm:** `src/services/dataService.ts` L41 `throw new Error(...)` trong `migrateDishes`. Nếu localStorage bị corrupt, app crash ngay lúc mount. Theo nguyên tắc, domain error (dữ liệu không hợp lệ) nên dùng Result Pattern, không throw.

**Giải pháp:** Chuyển sang filter out invalid entries + log warning thay vì throw. Hoặc wrap bằng `try/catch` ở `App.tsx` level. User vẫn dùng được app với data hợp lệ.

**File:** `src/services/dataService.ts` L38-48

---

### 1. Thiết kế & Kiến trúc — Vi phạm phát hiện

#### 1.1 Clean Architecture / SRP — `App.tsx` là God Component (359 dòng)

**Vi phạm:** `App.tsx` quản lý 6+ state domains (userProfile, ingredients, dishes, dayPlans, modals, navigation), 10+ callbacks, migration logic, import/export logic. Vi phạm SRP và High Cohesion.

**Giải pháp:** Extract state + callbacks vào custom hooks:

- `useMealPlanner()` → ingredients, dishes, dayPlans, CRUD, migration
- `useModalManager()` → isPlanningModalOpen, isTypeSelectionModalOpen, isClearPlanModalOpen, isGoalModalOpen
- `App.tsx` chỉ còn composition: mount hooks, pass props, render layout

**File:** `src/App.tsx` L54-358

#### 1.2 ADR — Không có thư mục `/docs/adr/`

**Vi phạm:** Không có ADR nào. Các quyết định kiến trúc (chọn localStorage, Gemini API, Capacitor, i18next) không được ghi lại.

**Giải pháp:** Tạo `/docs/adr/` với ít nhất:

- `001-local-storage-only.md`
- `002-gemini-ai-integration.md`
- `003-i18n-with-i18next.md`

#### 1.3 Design for Failure — Gemini API không có Retry + Timeout nhất quán

**Vi phạm:** `suggestIngredientInfo` có timeout 30s nhưng `analyzeDishImage` và `suggestMealPlan` không có timeout. `suggestMealPlan` có abort support nhưng không có retry. Không có resilience pattern nào.

**Giải pháp:** Tạo shared `callWithTimeout(promise, ms)` utility. Áp dụng cho tất cả 3 API calls. Cân nhắc thêm 1 lần retry với exponential backoff cho network errors (không retry cho validation errors).

**File:** `src/services/geminiService.ts` L57-112, L121-196, L206-251

---

### 2. Coding Standards — Vi phạm phát hiện

#### 2.1 Magic Numbers/Strings

**Vi phạm phát hiện:**

- `userProfile` default: `{ weight: 83, proteinRatio: 2, targetCalories: 1500 }` — `src/App.tsx` L77. Tại sao 83kg? Nên extract thành named constant.
- `INGREDIENT_LOOKUP_TIMEOUT_MS = 30_000` — OK, đã named.
- `tips.ts` L44: `targetCalories * 1.15`, L50: `targetCalories * 0.7`, L65: `targetProtein * 0.8`, L74: `totalFiber < 15`, L85: `fatCalPercent > 40` — tất cả là magic numbers.
- `duration: 6000` — `src/components/DishManager.tsx` L103
- `tips.slice(0, 2)` — `src/utils/tips.ts` L116

**Giải pháp:** Extract thành named constants (VD: `CALORIE_OVER_THRESHOLD = 1.15`, `MAX_TIPS_DISPLAYED = 2`, `DEFAULT_USER_PROFILE`, `UNDO_TOAST_DURATION_MS = 6000`).

#### 2.2 Hàm > 20 dòng

**Vi phạm:** `CalendarTab` component = 274 dòng, `DishManager` = 282 dòng, `GroceryList` = 266 dòng, `SaveAnalyzedDishModal` = 337 dòng. Đây là components, không phải hàm thuần túy — chấp nhận được cho React nhưng nên decompose thêm.

**Giải pháp:** Đã dùng Composition tốt (MealCard, Summary, DateSelector extracted). Tiếp tục extract sub-components từ `SaveAnalyzedDishModal` (IngredientEditCard, DishInfoSection, ModalFooter).

#### 2.3 Domain Error dùng throw thay vì Result Pattern

**Vi phạm:** `migrateDishes` throw Error cho invalid data (L41). `geminiService.ts` throw Error cho invalid AI response. Đây là domain errors (dự tính được), nên dùng Result Pattern.

**Giải pháp:** Cho migration: filter + log thay vì throw. Cho Gemini: caller đã try/catch, nhưng nên chuẩn hóa thành `Result<T, DomainError>` type.

---

### 3. Testing — Nhận xét

#### 3.1 Test Coverage — Tốt

Test pyramid hợp lý: unit tests cho services/utils, integration tests, component tests. Mocking chỉ áp dụng cho external dependencies (Gemini API). AAA pattern tuân thủ.

#### 3.2 `constantsAndData.test.ts` test hardcoded values

**Vi phạm:** Test assert `MEAL_TYPE_LABELS.breakfast === 'Bữa Sáng'` — test implementation detail (hardcoded Vietnamese). Khi xóa bản static (fix DRY), test này cần update.

**Giải pháp:** Test factory functions thay vì static objects. Assert structure (has 3 keys, values are strings) thay vì exact Vietnamese text.

---

### 4. Review & Chất lượng — Nhận xét

#### 4.1 ESLint configured — ✅

`eslint.config.js` tồn tại. Cần verify có chạy trên CI không (không thấy `.github/workflows/`).

#### 4.2 Không có CI/CD pipeline

**Vi phạm:** Không thấy GitHub Actions, CI config. Shift-Left Automation yêu cầu lint + test + security scan tự động.

**Giải pháp:** Tạo `.github/workflows/ci.yml` chạy `npm run lint`, `npm test`, `npm run build` trên mỗi push/PR.

---

### 5. Frontend / React — Vi phạm phát hiện

#### 5.1 State Management — Không sử dụng TanStack Query cho Server State

**Vi phạm:** Gemini API calls được quản lý thủ công trong `useAISuggestion` hook (useState + try/catch + loading/error state). Đây chính xác là use case cho TanStack Query (cache, retry, background sync, deduplication).

**Tuy nhiên:** App hiện tại chỉ có 3 API calls, tất cả one-shot (không polling, không cache). Thêm TanStack Query cho 3 calls = over-engineering → **YAGNI applies**. Giữ nguyên pattern hiện tại.

#### 5.2 Accessibility — Thiếu focus management khi mở/đóng modal

**Vi phạm:** Khi modal mở, focus không bị trap inside modal. Khi đóng, focus không return về trigger button. Thiếu `aria-labelledby` trên một số modal.

**Giải pháp:** Thêm focus trap (useFocusTrap hook hoặc `@headlessui/react` Dialog). Thêm `aria-labelledby` reference từ dialog → heading.

#### 5.3 `useEffect` có thể tránh — Migration logic

**Vi phạm:** `src/App.tsx` L90-100: `useEffect` kiểm tra migration rồi gọi `setDishes`. Có thể chuyển logic vào `usePersistedState` initializer hoặc tách thành custom hook để tránh render cycle thừa.

**Giải pháp:** Wrap migration vào `useMemo` hoặc extract `useMigratedState()` hook kết hợp `usePersistedState` + migration.

---

### 6. Bảo mật — Vi phạm phát hiện

#### 6.1 🔴 CRITICAL — API Key hardcoded trong `.env` file, bundled vào client

**Vi phạm:** `.env` chứa `GEMINI_API_KEY=AIzaSy...` — key thật. `vite.config.ts` L11 inject vào bundle qua `process.env.GEMINI_API_KEY`. Mọi user mở DevTools → Sources → thấy API key.

**Mức độ:** HIGH. Bất kỳ ai dùng app đều có thể lấy key và abuse quota.

**Giải pháp:**

- **Ngắn hạn:** Restrict API key trong Google Cloud Console (chỉ cho phép từ domain/app cụ thể, giới hạn quota).
- **Dài hạn:** Tạo proxy endpoint (Cloudflare Worker / Vercel Edge Function) để hide key phía server.

#### 6.2 `.env` trong `.gitignore` — ✅

`.gitignore` có `.env*` và `!.env.example`. Key không bị commit (trừ khi đã commit trước khi thêm gitignore — cần verify).

#### 6.3 No input sanitization for AI prompts

**Vi phạm nhẹ:** Tên ingredient/dish do user nhập được truyền thẳng vào Gemini prompt (`src/services/geminiService.ts` L213). Potential prompt injection. Tuy nhiên, output được validate bởi JSON schema + type guards → risk thấp.

**Giải pháp:** Sanitize user input trước khi embed vào prompt (strip special chars, limit length).

---

### 7. Observability — Vi phạm phát hiện

#### 7.1 Logger thiếu level DEBUG

**Vi phạm:** `src/utils/logger.ts` chỉ có `error`, `warn`, `info`. Thiếu `debug` level. Theo nguyên tắc cần 4 levels: DEBUG, INFO, WARN, ERROR.

**Giải pháp:** Thêm `debug()` method, chỉ output khi `import.meta.env.DEV`.

#### 7.2 Không có Trace ID / Correlation ID

**Vi phạm:** Logger không generate hay propagate trace ID. Mỗi log entry là isolated — không thể correlate các log cùng 1 user action (VD: user nhấn "Phân tích" → upload image → call AI → parse result).

**Giải pháp:** Thêm optional `traceId` vào `LogContext`. Generate UUID khi bắt đầu user action, truyền qua suốt flow.

#### 7.3 Structured Logging — Chưa JSON format

**Vi phạm:** Logger output `console.error("[Component] action", { message, stack })`. Đây là semi-structured. Nguyên tắc yêu cầu JSON format cho production.

**Giải pháp (thực dụng):** Cho client-side app, console output hiện tại OK cho dev. Nếu muốn production observability, integrate Sentry/LogRocket thay vì JSON console logs.

---

### Tổng hợp — Mức độ ưu tiên

| #   | Vi phạm                                     | Mức độ      | Effort  |
| --- | ------------------------------------------- | ----------- | ------- |
| 6.1 | API Key exposed trong client bundle         | 🔴 CRITICAL | Medium  |
| 0.1 | DRY — constants duplicate                   | 🟡 MEDIUM   | Low     |
| 0.2 | Dead code `TAB_LABELS`                      | 🟡 MEDIUM   | Trivial |
| 0.3 | POLA — `getTabLabels` import i18n trực tiếp | 🟡 MEDIUM   | Low     |
| 0.4 | Fail Fast — `migrateDishes` throw           | 🟡 MEDIUM   | Low     |
| 1.1 | SRP — App.tsx God Component                 | 🟡 MEDIUM   | Medium  |
| 2.1 | Magic Numbers                               | 🟡 MEDIUM   | Low     |
| 1.3 | No timeout cho 2/3 AI calls                 | 🟡 MEDIUM   | Low     |
| 5.2 | a11y — No focus trap in modals              | 🟡 MEDIUM   | Medium  |
| 7.1 | Logger thiếu DEBUG level                    | 🟢 LOW      | Trivial |
| 1.2 | Thiếu ADR                                   | 🟢 LOW      | Low     |
| 4.2 | Thiếu CI/CD                                 | 🟢 LOW      | Medium  |
| 2.3 | Domain errors use throw                     | 🟢 LOW      | Medium  |
| 7.2 | No Trace ID                                 | 🟢 LOW      | Low     |
| 5.3 | Migration useEffect                         | 🟢 LOW      | Low     |
| 6.3 | Prompt injection risk                       | 🟢 LOW      | Low     |

---

### Điểm đã tuân thủ tốt

- ✅ **Composition over Inheritance** — React components nhỏ, composed qua props/children
- ✅ **Hooks extracted** — `useAISuggestion`, `useListManager`, `useItemModalFlow`, `usePersistedState`, `useModalBackHandler`
- ✅ **Services layer** — `planService`, `dataService`, `geminiService` tách logic khỏi components
- ✅ **Pure functions** — Migration, nutrition calc, plan operations đều pure, testable
- ✅ **TypeScript strict** — Strong typing, discriminated unions, no `any`
- ✅ **Error Boundary** — Wrap mọi tab
- ✅ **Lazy loading** — `React.lazy()` cho AI/Grocery tabs
- ✅ **i18n** — Đã triển khai toàn bộ app với `react-i18next`
- ✅ **Dark mode** — System/light/dark với `useDarkMode` hook
- ✅ **Mobile-first** — Responsive design, touch targets, bottom-sheet modals
- ✅ **Secret in .gitignore** — `.env` not committed
- ✅ **Structured logger** — Context-based logging với component/action
- ✅ **Test suite** — Unit + integration tests, proper mocking
