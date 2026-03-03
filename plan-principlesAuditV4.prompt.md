## Plan: Principles Audit v4 — Phân tích toàn diện source hiện tại

Audit toàn bộ codebase theo 8 nhóm nguyên tắc. Phát hiện **10 vi phạm** (2 Major, 4 Moderate, 4 Minor). So với v3: vẫn còn các issues cũ chưa sửa, bổ sung 3 phát hiện mới (`ModalBackdrop` DRY 4 nơi, `DishManager` SRP 409 dòng, `validateAndSubmit`/`handleSaveAndBack` duplicate).

---

### 🟡 MAJOR — Cần sửa ngay

#### 1. DRY: `MEAL_TYPE_LABELS` define lại 3 nơi
- **Nguyên tắc:** DRY (§0)
- **Files:** [CalendarTab.tsx](src/components/CalendarTab.tsx) L12-16, [PlanningModal.tsx](src/components/modals/PlanningModal.tsx) L9-13, [AISuggestionPreviewModal.tsx](src/components/modals/AISuggestionPreviewModal.tsx) L7-11
- **Vấn đề:** `MEAL_TYPE_LABELS` đã tồn tại trong [constants.ts](src/data/constants.ts) L10-14, nhưng 3 file vẫn redeclare bản local. Rename "Bữa Sáng" phải sửa 4 nơi.
- **Giải pháp:** Xóa 3 bản local, import từ `constants.ts`. Chuyển `MEAL_TYPE_ICONS` từ `AISuggestionPreviewModal` vào `constants.ts`.

#### 2. DRY: `ModalBackdrop` component copy-paste 4 nơi
- **Nguyên tắc:** DRY (§0), Composition (§5)
- **Files:** [PlanningModal.tsx](src/components/modals/PlanningModal.tsx) L15-19, [GoalSettingsModal.tsx](src/components/modals/GoalSettingsModal.tsx) L12-17, [ClearPlanModal.tsx](src/components/modals/ClearPlanModal.tsx) L14, [TypeSelectionModal.tsx](src/components/modals/TypeSelectionModal.tsx) L12
- **Vấn đề:** Cùng `ModalBackdrop` (backdrop + close overlay) copy-paste **nguyên bản** trong 4 file. Các modal khác (`DetailModal`, `SaveAnalyzedDishModal`, `ConfirmationModal`, `UnsavedChangesDialog`, edit modals) dùng cùng pattern nhưng inline. Tổng **~10 nơi**.
- **Giải pháp:** Extract thành `src/components/shared/ModalBackdrop.tsx`. Bổ sung `role="dialog"` + `aria-modal="true"` (giải quyết luôn issue #3). Tất cả modals import từ đây.

---

### 🟠 MODERATE — Nên sửa sớm

#### 3. Accessibility (§5): Toàn bộ modals thiếu `role="dialog"`, `aria-modal`, focus trap
- **Nguyên tắc:** WCAG 2.2 (§5), POLA (§0)
- **Files:** Tất cả ~10 modal files
- **Vấn đề:** Không có `role="dialog"`, `aria-modal="true"`, focus trap, `aria-labelledby`. Keyboard/screen reader users tab ra ngoài modal.
- **Giải pháp:** Tích hợp vào shared `ModalBackdrop` (issue #2): thêm aria attributes, tạo `useFocusTrap` hook hoặc dùng `focus-trap-react`, auto-focus khi mở.

#### 4. SRP: `DishManager.tsx` 409 dòng — quá nhiều trách nhiệm
- **Nguyên tắc:** SRP (§0-S), Composition (§5)
- **File:** [DishManager.tsx](src/components/DishManager.tsx)
- **Vấn đề:** Chứa list view (grid + table + mobile), view detail modal, edit modal (ingredient picker + amount controls), delete flow, tag filter, validation, unsaved dialog. Render 250+ dòng JSX.
- **Giải pháp:** Extract edit modal → `DishEditModal.tsx` (~120 dòng). `DishManager` chỉ giữ list + toolbar.

#### 5. DRY: `validateAndSubmit`/`handleSaveAndBack` duplicate validation
- **Nguyên tắc:** DRY (§0)
- **Files:** [DishManager.tsx](src/components/DishManager.tsx) L105-124, [IngredientManager.tsx](src/components/IngredientManager.tsx) L129-144
- **Vấn đề:** Cả 2 component có 2 hàm gần giống: `validateAndSubmit` và `handleSaveAndBack`. Validation → build → save logic copy giữa chúng.
- **Giải pháp:** `handleSaveAndBack` gọi lại core validate+save logic, chỉ khác behavior sau save (close vs back-to-view).

#### 6. SRP: `App.tsx` `handleImportData` inline validation
- **Nguyên tắc:** SRP (§0-S)
- **File:** [App.tsx](src/App.tsx) L262-297
- **Vấn đề:** 35 dòng inline validators + switch-case. Nên ở service layer.
- **Giải pháp:** Extract `validateAndParseImportData()` → [dataService.ts](src/services/dataService.ts).

---

### 🟢 MINOR — Boy Scout Rule

#### 7. Fail Fast: `App.tsx` L159-162 unsafe cast
- **File:** [App.tsx](src/App.tsx) L159-162 — `(d as Record<string, unknown>).tags` without guard.
- **Giải pháp:** Extract `needsDishMigration()` → `dataService.ts` dùng `isRecord` guard.

#### 8. Comment đúng cách: "What" comments
- `planService.ts:1-4`, `useAISuggestion.ts:30`, `nutrition.ts:5`, `dataService.ts:1` — chỉ nói "what", không "why".
- **Giải pháp:** Xóa hoặc đổi thành "why".

#### 9. Security: API key trong client bundle
- [vite.config.ts](vite.config.ts) L11 — acceptable trade-off, nên set HTTP Referrer restriction.

#### 10. Performance: `DishManager.sortFn` tính nutrition O(N log N) × 2
- **File:** [DishManager.tsx](src/components/DishManager.tsx) L80-94
- **Vấn đề:** `calculateDishNutrition` gọi mỗi cặp compare, không cached.
- **Giải pháp:** Pre-compute nutrition map 1 pass O(N), sort dùng lookup. Pattern đúng đã có trong [PlanningModal.tsx](src/components/modals/PlanningModal.tsx) L62-68.

---

### Steps thực hiện (thứ tự ưu tiên)

1. **Extract shared `ModalBackdrop`** → `shared/ModalBackdrop.tsx` + a11y attrs. Thay 4 copies + ~6 inline patterns. *(#2, #3 — 40 phút)*
2. **Xóa 3 local `MEAL_TYPE_LABELS`** + chuyển `MEAL_TYPE_ICONS` → `constants.ts`. *(#1 — 5 phút)*
3. **Extract `DishEditModal.tsx`** từ `DishManager`. *(#4 — 20 phút)*
4. **Refactor duplicate validation** trong `DishManager`/`IngredientManager`. *(#5 — 10 phút)*
5. **Extract `validateAndParseImportData()`** → `dataService.ts`. *(#6 — 15 phút)*
6. **Pre-compute nutrition** trong `DishManager.sortFn`. *(#10 — 10 phút)*

### Further Considerations

1. **Testing (§3):** `DishManager` edit/delete, `SaveAnalyzedDishModal`, `validateAndParseImportData` cần unit test. Component test cho critical flows thiếu.
2. **Focus trap:** Dùng `focus-trap-react` (khuyến nghị) hay tự viết? Thư viện tốt hơn vì edge cases nhiều.
3. **`App.tsx` 439 dòng:** Chấp nhận được, nhưng nếu phình thêm → extract `useMealPlanState()` hook.

