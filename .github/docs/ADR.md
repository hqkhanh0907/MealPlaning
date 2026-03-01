# Architecture Decision Records (ADR)

> Smart Meal Planner — Quyết định kiến trúc được ghi nhận

---

## ADR-001: Chọn localStorage thay vì IndexedDB/SQLite

**Ngày:** 2026-02-01  
**Trạng thái:** Accepted  

### Bối cảnh
App cần lưu trữ offline: danh sách nguyên liệu (~100 items), món ăn (~50 items), kế hoạch ăn (~365 entries/year), user profile.

### Quyết định
Dùng `localStorage` thông qua hook `usePersistedState` — mỗi key lưu 1 JSON array.

### Lý do
- Data volume nhỏ (< 1MB tổng), chưa cần query phức tạp.
- Đơn giản, sync, không cần async wrapper.
- Hoạt động trên cả web và Capacitor (Android).

### Hệ quả
- Giới hạn ~5MB trên một số browser.
- Không batch/debounce writes → mỗi keystroke serialize toàn bộ array.
- Không support multi-tab sync.
- **Khi scale:** cần migrate sang IndexedDB (Dexie.js) hoặc `@capacitor/preferences`.

---

## ADR-002: Không sử dụng React Router

**Ngày:** 2026-02-01  
**Trạng thái:** Accepted  

### Bối cảnh
App có 4 tab chính. Cần hỗ trợ back gesture trên mobile (Capacitor).

### Quyết định
Tab navigation bằng `useState<MainTab>` + CSS toggle. Modal navigation bằng `useModalBackHandler` hook (listen `popstate` + Capacitor `App.backButton`).

### Lý do
- App single-page, không cần URL-based navigation.
- Capacitor back button integration dễ hơn khi quản lý state thủ công.
- Bundle size nhỏ hơn (không thêm react-router).

### Hệ quả
- Không có URL history → refresh mất tab state.
- Phải tự quản lý history stack cho modals.
- **Khi scale:** Nếu cần deep linking, sẽ cần thêm router.

---

## ADR-003: Gemini AI client-side (tạm thời)

**Ngày:** 2026-02-01  
**Trạng thái:** 🔴 Deprecated — Cần migrate sang server proxy

### Bối cảnh
App cần gọi Google Gemini AI cho 3 tính năng: phân tích ảnh, gợi ý thực đơn, tra cứu nguyên liệu.

### Quyết định (ban đầu)
Gọi Gemini API trực tiếp từ client, API key inject qua Vite `define`.

### Vấn đề
- **API key lộ trong JS bundle** → bất kỳ ai mở DevTools đều thấy.
- Không rate-limit → billing risk.

### Migration plan
Tạo API proxy (Cloudflare Worker hoặc Vite middleware) để ẩn API key server-side.

---

## ADR-004: State management — useState + prop drilling

**Ngày:** 2026-02-01  
**Trạng thái:** 🟡 Under review — Đang xem xét Zustand

### Bối cảnh
App có ~25 state variables, chủ yếu ở `App.tsx`. Props drilling 4 levels: `App → ManagementTab → DishManager → Modal`.

### Quyết định (ban đầu)
Dùng `useState` + `useCallback` + prop drilling.

### Vấn đề
- `App.tsx` 580+ LOC → God Component.
- Mỗi state change re-render toàn bộ tree.
- Thêm feature mới → thêm props → phải sửa chain.

### Migration plan
Extract sang Zustand stores: `usePlanStore`, `useDishStore`, `useIngredientStore`, `useUserStore`. Giảm App.tsx xuống ~150 LOC.

---

## ADR-005: Code splitting — React.lazy cho AI & Grocery tabs

**Ngày:** 2026-03-01  
**Trạng thái:** Accepted  

### Bối cảnh
Bundle size 654KB (gzip 157KB). `AIImageAnalyzer` (768L) và `GroceryList` (274L) ít dùng nhưng mount đồng thời.

### Quyết định
Dùng `React.lazy` + `Suspense` cho 2 tab ít dùng. Calendar và Management vẫn eager load (dùng thường xuyên).

### Kết quả
- Main chunk: 654KB → 623KB (−5%).
- Lazy chunks: `AIImageAnalyzer` 25KB, `GroceryList` 7KB.
- Load on-demand khi user chuyển tab lần đầu.

---

## ADR-006: Service layer extraction

**Ngày:** 2026-03-01  
**Trạng thái:** In progress  

### Bối cảnh
Business logic (plan CRUD, suggestion apply, migration) nằm trong `App.tsx` → không thể unit test.

### Quyết định
Extract pure functions vào service files:
- `services/planService.ts` — plan CRUD, slot update, suggestion merge ✅
- `services/geminiService.ts` — AI API calls ✅ (đã có)
- `services/dishService.ts` — dish/ingredient business logic (TODO)

### Kết quả
- 18 unit tests cho `planService` — 100% pass.
- `App.tsx` giảm ~30 LOC.

