## Plan: Principles Audit — Phân tích vi phạm nguyên tắc & đề xuất giải pháp

Phân tích toàn bộ source code theo 8 nhóm nguyên tắc, phát hiện **12 vi phạm** (3 Critical, 5 Major, 4 Minor). Mỗi mục ghi rõ nguyên tắc bị vi phạm, file/line cụ thể, và giải pháp tuân thủ nguyên tắc.

---

### 🔴 CRITICAL — Cần sửa ngay

#### 1. DRY: `handleSuggestMealPlan` và `handleRegenerateAISuggestion` trùng 95% logic
- **Nguyên tắc:** DRY (§0), Hàm nhỏ & Đơn nhiệm (§2)
- **File:** [App.tsx](src/App.tsx) lines 227-270 vs 285-325
- **Vấn đề:** Hai hàm gần giống nhau — cùng abort logic, cùng `availableDishes.map`, cùng `suggestMealPlan()`, cùng try/catch/finally. Chỉ khác 1 dòng `setIsAISuggestionModalOpen(true)`.
- **Giải pháp:** Extract hàm chung `fetchAISuggestion(openModal: boolean)`. Hai handler gọi lại.

#### 2. YAGNI + DRY: `useDataStore` (230 dòng) tồn tại nhưng KHÔNG ai import
- **Nguyên tắc:** YAGNI (§0), DRY (§0)
- **File:** [useDataStore.ts](src/stores/useDataStore.ts). Grep `useDataStore` trong `src/` → 1 kết quả duy nhất: file chính nó.
- **Vấn đề:** Code viết sẵn nhưng app dùng `usePersistedState`. `IMPORT_VALIDATORS` duplicate giữa store (line 75) và App.tsx (line 403).
- **Giải pháp:** Xóa `src/stores/useDataStore.ts`.

#### 3. SRP: `App.tsx` — God Component 567 dòng, 8+ responsibilities
- **Nguyên tắc:** Single Responsibility (§0-S), Composition (§5)
- **Vấn đề:** Navigation, theme, 6 modals, AI suggestion flow, CRUD, migration, nutrition, import/export, render tree — tất cả trong 1 file.
- **Giải pháp:** Extract `useAISuggestion()` (~100 dòng) + `useMealPlanData()` (~50 dòng). App.tsx còn ~350 dòng.

---

### 🟡 MAJOR — Nên sửa sớm

#### 4. SRP + Composition: `AIImageAnalyzer.tsx` — 788 dòng
- **Nguyên tắc:** SRP (§0-S), Composition (§0, §5)
- **File:** [AIImageAnalyzer.tsx](src/components/AIImageAnalyzer.tsx) — 788 dòng
- **Vấn đề:** 1 component chứa: camera logic, image upload, paste handler, AI analysis call, kết quả hiển thị (desktop table + mobile cards), save modal (ingredient editing, tag selection, AI research).
- **Giải pháp:** Tách → `ImageCapture`, `AnalysisResultView`, `SaveAnalyzedDishModal` + orchestrator.

#### 5. DRY: Nutrition display code lặp 3 lần trong `AIImageAnalyzer`
- **Nguyên tắc:** DRY (§0)
- **File:** [AIImageAnalyzer.tsx](src/components/AIImageAnalyzer.tsx) — `tempIngredient` object construction + `calculateIngredientNutrition()` call copy-paste giữa desktop table (lines 370-395) và mobile cards (lines 410-450). Summary cards (Calo/Protein/Carbs/Fat) cũng lặp cấu trúc HTML 4 lần.
- **Giải pháp:** Extract `toTempIngredient()` helper + `NutritionStatCard` + `IngredientNutritionItem` components.

#### 6. DRY: `TAG_OPTIONS` config define ở nhiều nơi
- **Nguyên tắc:** DRY (§0), High Cohesion (§0)
- **Files:** [DishManager.tsx](src/components/DishManager.tsx) line 28, [AIImageAnalyzer.tsx](src/components/AIImageAnalyzer.tsx) line 10 — cùng config `{ type: MealType; label: string; icon: string }[]` copy-paste.
- **Giải pháp:** Extract vào `src/data/constants.ts` → `export const MEAL_TAG_OPTIONS`. Tất cả consumers import từ 1 file.

#### 7. DRY + POLA: `NAV_ITEMS` / `DESKTOP_NAV_ITEMS` duplicate + label "Quản lý" vs "Thư viện"
- **Nguyên tắc:** DRY (§0), POLA (§0)
- **File:** [App.tsx](src/App.tsx) lines 66-78
- **Vấn đề:** 2 arrays chứa cùng tab data, chỉ khác icon size. Label "Quản lý" (desktop line 76) vs "Thư viện" (mobile line 69) cho cùng tab `management` gây bất ngờ.
- **Giải pháp:** 1 config array, render khác dựa context.

#### 8. POLA: `handleImportData` → `window.location.reload()`
- **Nguyên tắc:** POLA (§0), Design for Failure (§1)
- **File:** [App.tsx](src/App.tsx) line 429, [DataBackup.tsx](src/components/DataBackup.tsx) line 65
- **Vấn đề:** Import thành công → reload trang → user mất context (tab, scroll, form state). Bypass React lifecycle.
- **Giải pháp:** Set React state trực tiếp (`setIngredients`, `setDishes`, etc.) thay vì reload.

---

### 🟢 MINOR — Refactor khi chạm vào (Boy Scout Rule)

#### 9. Comment "What" thay vì "Why"
- **Nguyên tắc:** Comment đúng cách (§2)
- **Ví dụ:** `// Lazy load less-frequently used tabs for code splitting` (App.tsx:7), `/** Create an empty day plan for a given date */` (planService.ts:9)
- **Giải pháp:** Xóa what comments, đổi tên hàm để tự giải thích. Chỉ comment *tại sao*.

#### 10. UX: Toast success duration 15 giây — quá lâu
- **Nguyên tắc:** POLA (§0), KISS (§0)
- **File:** [NotificationContext.tsx](src/contexts/NotificationContext.tsx) line 48 — `success: 15000`
- **Giải pháp:** `{ success: 3000, error: 8000, warning: 5000, info: 4000 }`

#### 11. YAGNI: `useOnlineStatus` hook — dead code
- **Nguyên tắc:** YAGNI (§0)
- **File:** [useOnlineStatus.ts](src/hooks/useOnlineStatus.ts) — 39 dòng. Grep: chỉ export, không ai import.
- **Giải pháp:** Xóa file.

#### 12. Security: API key embed trong client bundle
- **Nguyên tắc:** Secret Management (§6)
- **Files:** [vite.config.ts](vite.config.ts) line 11, [geminiService.ts](src/services/geminiService.ts) line 5
- **Vấn đề:** Key bị inline vào JS bundle → ai inspect source đều thấy.
- **Giải pháp:** Trade-off chấp nhận cho standalone app. Cần: (1) API key restriction trên Google Cloud Console, (2) Ghi rõ trong README, (3) Move sang proxy server nếu có backend sau này.

---

### Steps thực hiện (thứ tự ưu tiên)

1. **Xóa dead code** — remove [useDataStore.ts](src/stores/useDataStore.ts) + [useOnlineStatus.ts](src/hooks/useOnlineStatus.ts). *(YAGNI — 2 phút)*
2. **Extract `fetchAISuggestion`** trong [App.tsx](src/App.tsx) — merge 2 hàm duplicate. *(DRY — 10 phút)*
3. **Extract `MEAL_TAG_OPTIONS` → [constants.ts](src/data/constants.ts)** — DRY across files. *(5 phút)*
4. **Merge `NAV_ITEMS` + `DESKTOP_NAV_ITEMS`** → 1 config trong [App.tsx](src/App.tsx). *(DRY — 10 phút)*
5. **Extract `useAISuggestion` hook** — giảm App.tsx God Component. *(SRP — 30 phút)*
6. **Tách [AIImageAnalyzer.tsx](src/components/AIImageAnalyzer.tsx)** → 3 sub-components. *(SRP+Composition — 45 phút)*

### Further Considerations

1. **Testing (§3)** — Chỉ có unit test cho `utils/` + `services/` (pure functions). Không có component test (React Testing Library). Theo Test Pyramid cần thêm integration tests cho UI flows (plan meal, save AI dish, import/export).
2. **Accessibility (§5)** — Cơ bản OK (`role`, `aria-label`, `tabIndex`). Thiếu: focus trap trong modals, skip-navigation link, `prefers-reduced-motion` support.
3. **Type Safety (§2)** — [dataService.ts](src/services/dataService.ts) dùng nhiều `as Record<string, unknown>` + `as unknown as Dish` unsafe casting. Nên dùng type guard functions hoặc Zod schema validation.
4. **Observability (§7)** — Chỉ có `console.error` (7 chỗ). Không structured logging hay error tracking. Nên wrap trong utility `logger.error(context, error)` để dễ grep.

