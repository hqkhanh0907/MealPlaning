## Plan: Principles Audit v3 — Phân tích source sau refactor lần 2

Sau 2 lần refactor, phần lớn vấn đề critical đã được xử lý (AIImageAnalyzer tách thành 4 files, logger.ts, type guards, toTempIngredient). Phân tích lại phát hiện **7 vi phạm còn tồn tại** (1 Major, 3 Moderate, 3 Minor).

### ✅ Đã sửa so với Audit v2

| # | Vấn đề | Trạng thái |
|---|--------|-----------|
| 1 | SRP: AIImageAnalyzer 783 dòng monolith | ✅ → 101 dòng orchestrator + `ImageCapture`, `AnalysisResultView`, `SaveAnalyzedDishModal` |
| 2 | DRY: duplicate `tempIngredient` construction | ✅ → `toTempIngredient()` in `nutrition.ts` |
| 4 | Type Safety: `as unknown` casting in dataService | ✅ → type guards `isDayPlan`, `isDish`, `isRecord` |
| 5 | Observability: `console.error` tản mát | ✅ → `logger.ts` structured logging |

---

### 🟡 MAJOR — Cần sửa

#### 1. DRY: `MEAL_TYPE_LABELS` define lại 3 nơi (hồi quy từ audit v2)
- **Nguyên tắc:** DRY (§0)
- **Files:** [CalendarTab.tsx](src/components/CalendarTab.tsx) L12-16, [PlanningModal.tsx](src/components/modals/PlanningModal.tsx) L9-13, [AISuggestionPreviewModal.tsx](src/components/modals/AISuggestionPreviewModal.tsx) L7-11
- **Vấn đề:** `MEAL_TYPE_LABELS` đã được centralize vào [constants.ts](src/data/constants.ts) L10-14, nhưng 3 file trên vẫn define bản copy local thay vì import. Nếu rename "Bữa Sáng" → "Sáng", phải sửa 4 nơi.
- **Giải pháp:** Xóa 3 bản local `MEAL_TYPE_LABELS`, thay bằng `import { MEAL_TYPE_LABELS } from '../../data/constants'` (hoặc `../data/constants`). Tương tự `MEAL_TYPE_ICONS` trong `AISuggestionPreviewModal` nên chuyển vào `constants.ts` nếu dùng ở nhiều nơi.

---

### 🟠 MODERATE — Nên sửa sớm

#### 2. Accessibility (§5): Toàn bộ modals thiếu `role="dialog"`, `aria-modal`, focus trap
- **Nguyên tắc:** Accessibility WCAG 2.2 (§5), POLA (§0)
- **Files:** [DetailModal.tsx](src/components/shared/DetailModal.tsx), [ConfirmationModal.tsx](src/components/modals/ConfirmationModal.tsx), [SaveAnalyzedDishModal.tsx](src/components/modals/SaveAnalyzedDishModal.tsx), [PlanningModal.tsx](src/components/modals/PlanningModal.tsx), [GoalSettingsModal.tsx](src/components/modals/GoalSettingsModal.tsx), [ClearPlanModal.tsx](src/components/modals/ClearPlanModal.tsx), [AISuggestionPreviewModal.tsx](src/components/modals/AISuggestionPreviewModal.tsx)
- **Vấn đề:** Không có `role="dialog"` + `aria-modal="true"` trên bất kỳ modal nào. Không có focus trap → screen reader và keyboard-only users có thể tab ra ngoài modal, tương tác với background content. Không có `aria-labelledby` trỏ đến tiêu đề modal.
- **Giải pháp:**
  1. Thêm `role="dialog"` + `aria-modal="true"` + `aria-labelledby` vào container `.rounded-3xl` của mỗi modal.
  2. Tạo hook `useFocusTrap(ref, isOpen)` hoặc dùng thư viện `focus-trap-react` để trap focus bên trong modal khi mở.
  3. Auto-focus vào phần tử đầu tiên (close button hoặc input) khi modal mở.
  4. Có thể tạo shared `ModalShell` component chứa sẵn backdrop + focus trap + aria attributes → các modal con chỉ truyền `children`.

#### 3. SRP: `App.tsx` — `handleImportData` chứa validation logic inline
- **Nguyên tắc:** SRP (§0-S), High Cohesion (§0)
- **File:** [App.tsx](src/App.tsx) L262-297
- **Vấn đề:** `handleImportData` (35 dòng) chứa 4 inline validator functions + switch statement mapping key → setter. Logic import/export data nên thuộc service layer, không nên nằm trong component.
- **Giải pháp:** Extract `validateImportData(data)` → [dataService.ts](src/services/dataService.ts) trả về typed result `{ ingredients?: Ingredient[], dishes?: Dish[], dayPlans?: DayPlan[], userProfile?: UserProfile }`. App.tsx chỉ destructure + setState. Điều này cũng giúp dễ viết unit test cho validation logic.

#### 4. DRY: `SortOption` type + `SORT_OPTIONS` array duplicate pattern giữa `DishManager`, `IngredientManager`, `PlanningModal`
- **Nguyên tắc:** DRY (§0), Composition (§0)
- **Files:** [DishManager.tsx](src/components/DishManager.tsx) L16-27 vs [IngredientManager.tsx](src/components/IngredientManager.tsx) L15-24 vs [PlanningModal.tsx](src/components/modals/PlanningModal.tsx) L7
- **Vấn đề:** Cùng pattern: `type SortOption = 'name-asc' | 'name-desc' | ...` + `SORT_OPTIONS` array + sort comparison logic. 3 nơi implement giống nhau chỉ khác fields. Nếu thêm sort option mới, dễ quên update.
- **Giải pháp:** Chấp nhận mức DRY hiện tại vì mỗi entity có fields riêng (ingredients không có `tags`, dishes không có `caloriesPer100`). Tuy nhiên, `'name-asc' | 'name-desc'` phần tên là shared → có thể extract `baseNameSort` helper. Đây là **moderate risk**, nên Boy Scout khi chạm vào.

---

### 🟢 MINOR — Refactor khi chạm vào (Boy Scout Rule)

#### 5. Coding Standards (§2): Một số "What" comments vẫn tồn tại
- **Nguyên tắc:** Comment đúng cách (§2)
- **Ví dụ:**
  - `planService.ts:1-4` — `/** Service layer for meal plan business logic. Pure functions extracted from App.tsx for testability and SRP. */` → "What" comment, tên file đã nói rõ. Nên xóa.
  - `useAISuggestion.ts:30` — `// Extracted from App.tsx to reduce component size and eliminate duplication` → "What/Where" comment, không cần thiết lâu dài.
  - `nutrition.ts:5` — `// --- Unit Normalization (shared across app) ---` → Section divider "what".
- **Giải pháp:** Xóa hoặc đổi thành "why" comments. Chỉ giữ những comment giải thích lý do chọn approach (ví dụ `App.tsx:7` — `// Lazy-loaded to reduce initial bundle size — these tabs are visited less often` là OK vì giải thích "why").

#### 6. Security (§6): API key vẫn embed trong client bundle
- **Nguyên tắc:** Secret Management (§6)
- **Files:** [vite.config.ts](vite.config.ts) L11, [geminiService.ts](src/services/geminiService.ts) L5
- **Vấn đề:** `process.env.GEMINI_API_KEY` inject vào bundle tại build time. Trade-off đã chấp nhận cho standalone app, nhưng key vẫn visible trong browser devtools.
- **Giải pháp:** (1) HTTP Referrer restriction trên Google Cloud Console, (2) Ghi rõ trong README, (3) API proxy nếu có backend. Hiện tại là acceptable trade-off.

#### 7. Fail Fast (§0): `App.tsx` migration effect dùng unsafe casting
- **Nguyên tắc:** Fail Fast (§0), Type Safety (§2)
- **File:** [App.tsx](src/App.tsx) L159-162
- **Vấn đề:** `rawDishes.some((d: unknown) => { const tags = (d as Record<string, unknown>).tags; ... })` — dùng `as Record<string, unknown>` trực tiếp mà không qua type guard. `isDish` guard đã có sẵn trong `dataService.ts` nhưng không được dùng ở đây.
- **Giải pháp:** Extract helper `needsDishMigration(dishes: unknown[]): boolean` vào [dataService.ts](src/services/dataService.ts) — dùng `isRecord` guard nội bộ. App.tsx chỉ gọi `if (needsDishMigration(rawDishes)) setDishes(dishes)`.

---

### Steps thực hiện (thứ tự ưu tiên)

1. **Xóa 3 bản local `MEAL_TYPE_LABELS`** trong [CalendarTab.tsx](src/components/CalendarTab.tsx), [PlanningModal.tsx](src/components/modals/PlanningModal.tsx), [AISuggestionPreviewModal.tsx](src/components/modals/AISuggestionPreviewModal.tsx) → import từ [constants.ts](src/data/constants.ts). *(DRY — 5 phút)*
2. **Thêm a11y attributes cho modals** — `role="dialog"`, `aria-modal="true"`, `aria-labelledby` + tạo `useFocusTrap` hook hoặc shared `ModalShell` component. *(Accessibility — 30 phút)*
3. **Extract `validateImportData()`** → [dataService.ts](src/services/dataService.ts), giảm inline logic trong [App.tsx](src/App.tsx) `handleImportData`. *(SRP — 15 phút)*
4. **Extract `needsDishMigration()`** → [dataService.ts](src/services/dataService.ts), fix unsafe cast trong [App.tsx](src/App.tsx) L159-162. *(Type Safety — 5 phút)*
5. **Dọn "what" comments** — xóa hoặc đổi thành "why" trong `planService.ts`, `useAISuggestion.ts`, `nutrition.ts`. *(Boy Scout — 5 phút)*

---

### Further Considerations

1. **Testing (§3):** `useAISuggestion` hook vẫn chưa có test riêng. `processAnalyzedDish`, `validateImportData` (nếu extract) nên có unit test. Component test cho critical flows (AI analysis → save dish) vẫn thiếu hoàn toàn.
2. **DRY: Sort logic** — 3 components implement sort logic riêng. Có thể extract shared `createSortComparator()` nhưng risk/reward thấp vì fields khác nhau. Nên Boy Scout khi cần thêm sort option mới.
3. **KISS: `App.tsx` 433 dòng** — Vẫn ở ngưỡng chấp nhận được. Có thể extract `useMealPlanState()` custom hook chứa `ingredients/dishes/dayPlans` + tất cả handlers nếu file tiếp tục phình, nhưng hiện tại chưa critical.

