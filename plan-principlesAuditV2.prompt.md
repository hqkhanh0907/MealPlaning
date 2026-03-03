## Plan: Principles Audit v2 — Phân tích source hiện tại sau refactor lần 1

Sau refactor lần 1, **8/12 vi phạm đã sửa ✅**. Phân tích lại source hiện tại phát hiện **6 vi phạm còn lại** (1 Major, 3 Moderate, 2 Minor).

### ✅ Đã sửa từ audit lần 1

| # | Vấn đề | Trạng thái |
|---|--------|-----------|
| 1 | DRY: duplicate `handleSuggestMealPlan` / `handleRegenerateAISuggestion` | ✅ → `useAISuggestion.ts` shared `fetchSuggestion(openModal)` |
| 2 | YAGNI: `useDataStore.ts` (230 dòng dead code) | ✅ Xóa file + thư mục `stores/` |
| 3 | SRP: App.tsx God Component 567 dòng | ✅ Giảm → 433 dòng nhờ extract `useAISuggestion` hook |
| 6 | DRY: `TAG_OPTIONS` define 3 nơi | ✅ → `src/data/constants.ts` (`MEAL_TAG_OPTIONS`, `MEAL_TYPE_LABELS`, `TAG_SHORT_LABELS`) |
| 7 | DRY + POLA: `NAV_ITEMS` / `DESKTOP_NAV_ITEMS` duplicate | ✅ → `NAV_CONFIG` single array |
| 8 | POLA: `handleImportData` gọi `window.location.reload()` | ✅ → direct state update |
| 10 | Toast success 15s | ✅ → `success: 3000` |
| 11 | YAGNI: `useOnlineStatus` dead code | ✅ Xóa file |

---

### 🟡 MAJOR — Cần sửa

#### 1. SRP + Composition: `AIImageAnalyzer.tsx` vẫn 783 dòng monolith
- **Nguyên tắc:** SRP (§0-S), Composition (§0, §5)
- **File:** [AIImageAnalyzer.tsx](src/components/AIImageAnalyzer.tsx) — 783 dòng
- **Vấn đề:** Vẫn chứa tất cả trong 1 component: camera logic (start/stop/capture ~50 dòng), image upload + paste handler (~50 dòng), AI analysis call (~30 dòng), kết quả hiển thị desktop + mobile (~200 dòng), save modal với ingredient editing + tag selection + AI research (~350 dòng).
- **Giải pháp:** Tách thành 3 focused sub-components + 1 orchestrator:
  - `ImageCapture.tsx` — camera/upload/paste/compress, expose `onImageReady(base64: string)`
  - `AnalysisResultView.tsx` — hiển thị nutrition result (desktop table + mobile cards + summary)
  - `SaveAnalyzedDishModal.tsx` — modal lưu, edit ingredients, tag selection, AI research
  - `AIImageAnalyzer.tsx` — orchestrator ~100 dòng, compose 3 trên

---

### 🟠 MODERATE — Nên sửa sớm

#### 2. DRY: `tempIngredient` construction lặp nguyên xi 2 lần
- **Nguyên tắc:** DRY (§0)
- **File:** [AIImageAnalyzer.tsx](src/components/AIImageAnalyzer.tsx) lines 462-469 vs 489-496
- **Vấn đề:** Cùng 1 object construction (8 fields) + `calculateIngredientNutrition()` call copy-paste giữa desktop table và mobile cards. Bất kỳ thay đổi nào cũng phải sửa 2 nơi.
- **Giải pháp:** Extract helper `toTempIngredient(ing: AnalyzedIngredient): Ingredient` vào `src/utils/nutrition.ts`. Cả desktop và mobile view gọi chung.

#### 3. Coding Standards: "What" comments thay vì "Why"
- **Nguyên tắc:** Comment đúng cách (§2)
- **Files & ví dụ:**
  - `App.tsx:7` — `// Lazy load less-frequently used tabs for code splitting`
  - `App.tsx:60` — `/** Single source of truth for navigation tabs... */`
  - `dataService.ts:10` — `/** Remove an ingredient from all dishes (used when deleting an ingredient) */`
  - `dataService.ts:14` — `/** Migrate old day plan format to new (breakfastId → breakfastDishIds) */`
  - `planService.ts:9` — `/** Create an empty day plan for a given date */`
  - `useAISuggestion.ts:29-31` — `/** Encapsulates all AI meal plan suggestion state... */`
- **Giải pháp:** Xóa "what" comments — tên hàm đã tự giải thích. Chỉ giữ comments giải thích **tại sao** chọn approach. Ví dụ: `// Legacy data dùng breakfastId (singular) → cần migration`

#### 4. Type Safety: `dataService.ts` dùng nhiều unsafe `as unknown` casting
- **Nguyên tắc:** Fail Fast (§0), Không trả về null (§2)
- **File:** [dataService.ts](src/services/dataService.ts) lines 15-31
- **Vấn đề:** `plan as Record<string, unknown>`, `plan as unknown as DayPlan`, `d as unknown as Dish` — không runtime validation, silent type coercion. Data sai → runtime error ở nơi khác, khó debug.
- **Giải pháp:** Dùng type guard functions:
  - `isDayPlan(v: unknown): v is DayPlan` — check `'date' in v && Array.isArray(breakfastDishIds)`
  - `isDish(v: unknown): v is Dish` — check `'id' in v && 'name' in v && Array.isArray(ingredients)`
  - Migration functions dùng guard thay vì bare `as` casting

---

### 🟢 MINOR — Refactor khi chạm vào (Boy Scout Rule)

#### 5. Observability: 6x `console.error` tản mát không structured
- **Nguyên tắc:** Structured Logging (§7), Log Levels (§7)
- **Files:** AIImageAnalyzer (3x), IngredientManager (1x), ErrorBoundary (1x), useAISuggestion (1x)
- **Vấn đề:** `console.error("Failed to X:", error)` — không context, không structured, khó filter.
- **Giải pháp:** Tạo `src/utils/logger.ts` với `logger.error(context, error)`. Thay 6x `console.error`. Dễ mở rộng sang Sentry sau (Open/Closed).

#### 6. Security: API key embed trong client bundle
- **Nguyên tắc:** Secret Management (§6)
- **Files:** [vite.config.ts](vite.config.ts) line 11, [geminiService.ts](src/services/geminiService.ts) line 5
- **Vấn đề:** Trade-off chấp nhận cho standalone app. Key inline vào bundle.
- **Giải pháp:** (1) HTTP Referrer restriction trên Google Cloud Console, (2) Ghi rõ trong README, (3) API proxy nếu có backend.

---

### Steps thực hiện (thứ tự ưu tiên)

1. **Tách [AIImageAnalyzer.tsx](src/components/AIImageAnalyzer.tsx)** → `ImageCapture` + `AnalysisResultView` + `SaveAnalyzedDishModal` + orchestrator. *(SRP+Composition — 45 phút)*
2. **Extract `toTempIngredient()` helper** → [nutrition.ts](src/utils/nutrition.ts), xóa duplicate. *(DRY — 5 phút)*
3. **Thêm type guards** cho migration functions trong [dataService.ts](src/services/dataService.ts). *(Type Safety — 15 phút)*
4. **Dọn "what" comments** → xóa hoặc đổi thành "why". *(Boy Scout — 10 phút)*
5. **Tạo [logger.ts](src/utils/logger.ts)** utility, thay 6x `console.error`. *(Observability — 10 phút)*

### Further Considerations

1. **Testing (§3)** — `useAISuggestion` hook mới chưa có test. Nên thêm hook test với mock `suggestMealPlan`. Chưa có component tests (React Testing Library) cho bất kỳ UI flow nào.
2. **Accessibility (§5)** — Thiếu focus trap trong modals, skip-navigation link, `prefers-reduced-motion` support.
3. **App.tsx 433 dòng** — Acceptable. Có thể extract `useMealPlanData()` hook nhưng không critical.

