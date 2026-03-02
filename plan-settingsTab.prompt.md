## KẾ HOẠCH TRIỂN KHAI TAB SETTINGS (CẬP NHẬT v2)

Tính năng bao gồm: Đa ngôn ngữ (i18n) cho TOÀN BỘ ứng dụng, Giao diện (Theme), và Quản lý Dữ liệu (Backup/Restore).

---

### Giai đoạn 1: Chuẩn bị Thư viện và Cấu trúc

**Thư viện:** Cài đặt `i18next`, `react-i18next`, `i18next-browser-languagedetector` cho i18n.

**Thư mục:**
- `src/locales/` — Chứa file JSON ngôn ngữ (`vi.json`, `en.json`).
- `src/i18n.ts` — Cấu hình i18next instance.
- `src/contexts/` — Đã có `NotificationContext`. Theme hook (`useDarkMode`) đã tồn tại.

**Phân tích hiện trạng:**
- **Theme**: Đã có `useDarkMode` hook hoàn chỉnh (light/dark/system, localStorage, matchMedia listener). Chỉ cần expose vào Settings UI.
- **Data Backup**: Đã có `DataBackup` component trong `ManagementTab`. Cần di chuyển sang Settings + thêm confirmation modal trước khi import.
- **i18n**: Chưa có. **BẮT BUỘC** triển khai cho toàn bộ app ngay từ đầu.
- **Navigation**: Cần thêm `'settings'` vào `MainTab` type và `NAV_CONFIG`.

---

### Giai đoạn 2: Thiết lập Type-safety

**Kiểu i18n:**
- Khai báo `resources` type cho `i18next` để TypeScript kiểm soát translation keys.
- File `src/i18n.ts` init i18next với `LanguageDetector`, fallback `vi`.

**Kiểu Theme:** Đã có `type Theme = 'light' | 'dark' | 'system'` trong `useDarkMode.ts`.

**Kiểu Navigation:** Cập nhật `MainTab` trong `src/components/navigation/types.ts`:
```ts
export type MainTab = 'calendar' | 'management' | 'ai-analysis' | 'grocery' | 'settings';
```

**Kiểu Dữ liệu Sao lưu:** Đã có `validateImportData()` trong `dataService.ts` với `IMPORT_VALIDATORS`. Export schema đã bao gồm `_exportedAt` và `_version`.

---

### Giai đoạn 3: Xây dựng Core Logic

**Logic i18n:**
- Cấu hình `i18next` instance (`src/i18n.ts`): resources từ `vi.json`/`en.json`, detection từ localStorage key `mp-language`, fallback `vi`.
- Import `./i18n` trong `main.tsx` (side-effect import, không cần Provider wrapper vì `react-i18next` tự detect).

**Logic Theme:** Đã hoàn chỉnh trong `useDarkMode` hook. Expose `theme`, `setTheme`, `cycleTheme`.

**Logic Sao lưu (Export):** Đã có trong `DataBackup.tsx` → `handleExport()`. Giữ nguyên, chỉ di chuyển vị trí.

**Logic Khôi phục (Import):** Đã có `handleImport()` trong `DataBackup.tsx` + `validateImportData()` trong `dataService.ts`. **Cần bổ sung:** ConfirmationModal trước khi ghi đè dữ liệu.

---

### Giai đoạn 4: i18n — Danh sách đầy đủ các file cần chuyển đổi

**BẮT BUỘC: Tất cả hardcoded Vietnamese strings phải được thay thế bằng `t()` translation keys.**

#### 4.1 Data & Constants (chuyển đổi trước — ảnh hưởng nhiều component)

| File | Strings cần i18n |
|------|-----------------|
| `src/data/constants.ts` | `MEAL_TYPE_LABELS` (Bữa Sáng/Trưa/Tối), `MEAL_TAG_OPTIONS` labels (Sáng/Trưa/Tối), `TAG_SHORT_LABELS`, `BASE_SORT_OPTIONS` labels (Tên A-Z, Calo Thấp→Cao...) |
| `src/utils/tips.ts` | Toàn bộ 10+ tip messages trong `getDynamicTips()` (Bắt đầu lên kế hoạch..., Bạn đang vượt..., Tuyệt vời!..., Protein hôm nay..., Lượng chất xơ..., Tỷ lệ chất béo..., Kế hoạch hôm nay cân đối..., Còn thiếu...) |

#### 4.2 Components chính

| File | Strings cần i18n |
|------|-----------------|
| `src/App.tsx` | "Dinh dưỡng chính xác cho {weight}kg", "Chế độ hiển thị: ...", "Sáng — nhấn để đổi", "Đã cập nhật!", "Đã chọn N món cho...", "Lưu thành công!", "Dữ liệu không hợp lệ", "Nhập dữ liệu thành công!", "Phân tích hoàn tất!", tab aria-labels |
| `src/components/CalendarTab.tsx` | Tất cả text hiển thị: headings, labels, tips, buttons, aria-labels |
| `src/components/Summary.tsx` | "Dinh dưỡng trong ngày", "Mục tiêu: ... kcal, ...g Protein", "Chỉnh sửa mục tiêu dinh dưỡng", "Calories", "Protein", "Carbs", "Fat", "Chất xơ" |
| `src/components/DishManager.tsx` | "Không thể xóa", "Món ăn này đang được sử dụng...", "Đã xóa món ăn", "Đã hoàn tác", "↩ Hoàn tác", "Thêm món ăn", "Tìm kiếm món ăn...", "Xóa món ăn?", "Xóa ngay" |
| `src/components/IngredientManager.tsx` | "Không thể xóa", "Nguyên liệu này đang được sử dụng...", "Đã xóa nguyên liệu", "Đã hoàn tác", "↩ Hoàn tác", "Thêm nguyên liệu", "Tìm kiếm nguyên liệu...", "Dùng trong:", "Xóa nguyên liệu?", form labels & validation messages |
| `src/components/ManagementTab.tsx` | "Thư viện dữ liệu", "Món ăn", "Nguyên liệu" |
| `src/components/GroceryList.tsx` | "Hôm nay", "Tuần này", "Tất cả", "Danh sách đi chợ — ...", "Chưa có gì cần mua", "Hãy lên kế hoạch...", "Mở tab Lịch trình để bắt đầu", "Đã sao chép!", "Sao chép thất bại", "Tổng:" |
| `src/components/AIImageAnalyzer.tsx` | "Phân tích thất bại", "Có lỗi xảy ra khi phân tích ảnh...", "Đang phân tích...", "Phân tích món ăn" |
| `src/components/AnalysisResultView.tsx` | "AI đang phân tích hình ảnh...", "Tải ảnh lên và nhấn...", "Ước tính Calo/Protein/Carbs/Fat", "Chi tiết nguyên liệu & Dinh dưỡng:", "Nguyên liệu", "Định lượng", "Calo", "Đạm", "Béo", "Lưu ý:", "Kết quả phân tích chỉ mang tính...", "Lưu vào thư viện món ăn" |
| `src/components/ImageCapture.tsx` | "Thiết bị không hỗ trợ camera...", "Không thể truy cập camera...", "Đóng camera", "Chụp ảnh", "Tải ảnh lên", "Hoặc dán ảnh (Ctrl+V)...", "Hỗ trợ JPG, PNG", "Chọn ảnh khác" |
| `src/components/DataBackup.tsx` | "Sao lưu & Khôi phục", "Xuất hoặc nhập dữ liệu...", "Xuất dữ liệu", "Nhập dữ liệu", all notify messages |
| `src/components/DateSelector.tsx` | Weekday names, month labels (nếu có) |
| `src/components/ErrorBoundary.tsx` | "Đã xảy ra lỗi", "Có lỗi không mong muốn...", "Thử lại", "Tải lại trang", "Chi tiết lỗi" |

#### 4.3 Modals

| File | Strings cần i18n |
|------|-----------------|
| `src/components/modals/PlanningModal.tsx` | "Chọn món cho {meal}", "Tìm kiếm món ăn...", "Chưa có món ăn phù hợp...", "Đã chọn:", "Xác nhận" |
| `src/components/modals/TypeSelectionModal.tsx` | "Lên kế hoạch", "Chọn buổi bạn muốn lên kế hoạch", meal labels + descriptions ("Bắt đầu ngày mới...", "Nạp lại năng lượng...", "Bữa ăn nhẹ nhàng..."), "{count} món" |
| `src/components/modals/ClearPlanModal.tsx` | "Xóa kế hoạch", "Chọn phạm vi thời gian muốn xóa", "Ngày này", "Tuần này", "Tháng này", descriptions, "{count} ngày" |
| `src/components/modals/GoalSettingsModal.tsx` | "Mục tiêu dinh dưỡng", "Cân nặng hiện tại (kg)", "Lượng Protein mong muốn", "g / ngày", "g / kg", "Khuyến nghị: 1.2-1.6g...", "Mục tiêu Calo (kcal)", "Thay đổi được tự động lưu...", "Hoàn tất" |
| `src/components/modals/AISuggestionPreviewModal.tsx` | "Gợi ý bữa ăn từ AI", "Xem trước và chỉnh sửa...", "AI đang phân tích...", "Đang tìm thực đơn tối ưu...", "Không thể tạo gợi ý", "Thử lại", "Chưa tìm được gợi ý phù hợp", "Gợi ý lại", "Lý do gợi ý", "Thay đổi", "Tổng cộng (các bữa đã chọn)", "Mục tiêu", "Calo", "Protein", "Hủy", "Áp dụng" |
| `src/components/modals/DishEditModal.tsx` | Form labels, validation messages, "Lưu món ăn", "Sửa món ăn", "Thêm món ăn mới" |
| `src/components/modals/IngredientEditModal.tsx` | "Sửa nguyên liệu", "Thêm nguyên liệu mới", form labels, AI search button text, "Phản hồi quá lâu", "Tra cứu thất bại", "Lưu nguyên liệu" |
| `src/components/modals/SaveAnalyzedDishModal.tsx` | All form labels, action buttons, "Tra cứu thất bại" |
| `src/components/modals/ConfirmationModal.tsx` | "Xác nhận", "Hủy" (default labels) |

#### 4.4 Shared Components

| File | Strings cần i18n |
|------|-----------------|
| `src/components/shared/EmptyState.tsx` | "Không tìm thấy {entity}", "Chưa có {entity} nào", "Thử tìm kiếm với từ khóa khác.", "Bắt đầu tạo {entity} đầu tiên..." |
| `src/components/shared/UnsavedChangesDialog.tsx` | "Thay đổi chưa lưu", "Bạn có muốn lưu...", "Lưu & quay lại", "Bỏ thay đổi", "Ở lại chỉnh sửa" |
| `src/components/shared/ListToolbar.tsx` | Placeholder texts, button labels |
| `src/components/shared/DetailModal.tsx` | Button labels |
| `src/components/shared/ModalBackdrop.tsx` | "Đóng" (aria-label) |

#### 4.5 Navigation

| File | Strings cần i18n |
|------|-----------------|
| `src/components/navigation/types.ts` | `TAB_LABELS` (Lịch trình, Thư viện, AI Phân tích, Đi chợ) |
| `src/components/navigation/AppNavigation.tsx` | `NAV_CONFIG` labels (mobile + desktop), "Điều hướng chính", "Đang tải..." |

#### 4.6 Hooks & Services

| File | Strings cần i18n |
|------|-----------------|
| `src/hooks/useAISuggestion.ts` | "Có lỗi xảy ra khi gợi ý thực đơn...", "Đã cập nhật kế hoạch!", "Thực đơn gợi ý từ AI đã được áp dụng." |

#### 4.7 Utils

| File | Strings cần i18n |
|------|-----------------|
| `src/utils/tips.ts` | Toàn bộ tip messages (10+ strings) — hàm `getDynamicTips()` cần nhận `t` function làm param |

---

### Giai đoạn 5: Xây dựng UI Tab Settings

**Files cần tạo/sửa:**

1. **`src/components/SettingsTab.tsx`** (MỚI) — Tab chính chứa 3 sections:
   - Section 1 — **Ngôn ngữ**: Pill buttons chọn `vi` / `en`. Dùng `useTranslation()` + `i18n.changeLanguage()`.
   - Section 2 — **Giao diện**: 3 nút Sáng / Tối / Hệ thống. Dùng `useDarkMode().setTheme()`.
   - Section 3 — **Dữ liệu**: Nút Export (Download icon) + Nút Import (Upload icon, hidden `<input type="file">`). Khi chọn file → hiện ConfirmationModal cảnh báo trước khi ghi đè.

2. **`src/components/navigation/types.ts`** — Thêm `'settings'` vào `MainTab`, thêm label vào `TAB_LABELS`.

3. **`src/components/navigation/AppNavigation.tsx`** — Thêm Settings vào `NAV_CONFIG` (icon: `Settings2` từ lucide-react).

4. **`src/App.tsx`** — Thêm render cho `activeMainTab === 'settings'`, truyền props cần thiết. Xóa `DataBackup` khỏi `ManagementTab`.

5. **`src/components/ManagementTab.tsx`** — Xóa `DataBackup` import và render (đã chuyển sang Settings).

6. **`src/locales/vi.json`** + **`src/locales/en.json`** — Translation files chứa ALL keys từ Giai đoạn 4.

7. **`src/i18n.ts`** — i18next config.

8. **`src/main.tsx`** — Import `./i18n` để init.

**UI Design (tuân thủ copilot-instructions.md):**
- Mobile-first, card layout (`bg-white rounded-2xl shadow-sm border border-slate-100`).
- Touch targets ≥ 44px cho tất cả buttons/radio.
- Typography: `text-base` cho inputs, `text-slate-800` cho headings.
- Spacing: `p-4` mobile, `sm:p-6` desktop.
- Section headers: icon + title + description text.
- Theme selector: 3 buttons dạng pill group (giống sub-tab trong ManagementTab).
- Language selector: Pill buttons tương tự.

---

### Giai đoạn 6: Tích hợp Cảnh báo & Trải nghiệm (UX cho Restore)

Khi người dùng chọn file để Import:

1. **Parse file** → validate JSON format.
2. **Validate structure** → dùng `validateImportData()` kiểm tra keys.
3. **Nếu file hợp lệ** → Hiển thị `ConfirmationModal` variant `warning`:
   - Title: `t('settings.data.confirmTitle')`
   - Message: `t('settings.data.confirmMessage')`
   - Confirm: `t('settings.data.confirmButton')` (amber/warning color)
   - Cancel: `t('settings.data.cancelButton')`
4. **Nếu user bấm Confirm** → gọi `onImportData(data)` → Toast success.
5. **Nếu user bấm Cancel** → đóng modal, giữ nguyên dữ liệu cũ.
6. **Nếu file không hợp lệ** → Toast error ngay lập tức, không hiện modal.

---

### Giai đoạn 7: Kiểm thử

**Test Đa ngôn ngữ & Theme:**
- Đổi ngôn ngữ → kiểm tra toàn bộ UI cập nhật (navigation, modals, tips, notifications).
- Đổi theme → F5 → kiểm tra localStorage persist.
- System theme follow matchMedia.

**Test Backup (Happy Path):**
- Tạo vài món ăn → Export → kiểm tra JSON structure.
- Xóa hết dữ liệu → Import file → dữ liệu khôi phục.

**Test Restore (Edge Cases):**
- Import file JSON linh tinh → thông báo lỗi, không crash.
- Import → chọn "Hủy" ở confirmation → dữ liệu cũ giữ nguyên.
- Import file thiếu một số keys → chỉ restore keys hợp lệ, warning cho keys sai.

**Test files cần tạo/update:**
- Update ALL existing tests để mock i18n hoặc wrap với I18nextProvider.
- `src/__tests__/settingsTab.test.tsx` — Unit test cho SettingsTab component.
- `src/__tests__/i18n.test.ts` — Test i18n initialization và language switching.

---

### Dependency Map (thứ tự thực hiện)

```
Phase 1: Infrastructure
  1. npm install i18next react-i18next i18next-browser-languagedetector
  2. src/locales/vi.json + src/locales/en.json (FULL translation keys)
  3. src/i18n.ts (config)
  4. src/main.tsx (import ./i18n)
  5. src/__tests__/setup.ts (add i18n mock for all tests)

Phase 2: Navigation + Settings Tab
  6. src/components/navigation/types.ts (add 'settings')
  7. src/components/navigation/AppNavigation.tsx (add nav item + i18n labels)
  8. src/components/SettingsTab.tsx (new component)
  9. src/components/ManagementTab.tsx (remove DataBackup + i18n)
  10. src/App.tsx (integrate SettingsTab, wire props + i18n)

Phase 3: i18n toàn bộ Components
  11. src/data/constants.ts → chuyển labels thành functions nhận t()
  12. src/utils/tips.ts → getDynamicTips() nhận t function
  13. src/components/CalendarTab.tsx
  14. src/components/Summary.tsx
  15. src/components/DishManager.tsx
  16. src/components/IngredientManager.tsx
  17. src/components/GroceryList.tsx
  18. src/components/AIImageAnalyzer.tsx
  19. src/components/AnalysisResultView.tsx
  20. src/components/ImageCapture.tsx
  21. src/components/DataBackup.tsx
  22. src/components/DateSelector.tsx
  23. src/components/ErrorBoundary.tsx

Phase 4: i18n Modals
  24. src/components/modals/PlanningModal.tsx
  25. src/components/modals/TypeSelectionModal.tsx
  26. src/components/modals/ClearPlanModal.tsx
  27. src/components/modals/GoalSettingsModal.tsx
  28. src/components/modals/AISuggestionPreviewModal.tsx
  29. src/components/modals/DishEditModal.tsx
  30. src/components/modals/IngredientEditModal.tsx
  31. src/components/modals/SaveAnalyzedDishModal.tsx
  32. src/components/modals/ConfirmationModal.tsx

Phase 5: i18n Shared + Hooks
  33. src/components/shared/EmptyState.tsx
  34. src/components/shared/UnsavedChangesDialog.tsx
  35. src/components/shared/ListToolbar.tsx
  36. src/components/shared/DetailModal.tsx
  37. src/components/shared/ModalBackdrop.tsx
  38. src/hooks/useAISuggestion.ts

Phase 6: Tests
  39. Update all existing test files for i18n compatibility
  40. New test files cho SettingsTab, i18n
```

---

### Chiến lược i18n cho constants/utils

**Vấn đề:** `constants.ts` export static objects (`MEAL_TYPE_LABELS`, `BASE_SORT_OPTIONS`) — không thể gọi `t()` ở module scope.

**Giải pháp:** Dùng translation keys trực tiếp trong components:
```tsx
// Trong component — KISS, ưu tiên cách này
<span>{t(`meal.${type}`)}</span>
```
Chỉ dùng factory functions khi cần pass labels vào shared components:
```ts
// constants.ts — chỉ khi cần thiết
export const getMealTypeLabels = (t: TFunction): Record<MealType, string> => ({
  breakfast: t('meal.breakfast'),
  lunch: t('meal.lunch'),
  dinner: t('meal.dinner'),
});
```

**Vấn đề:** `tips.ts` trả về hardcoded strings với dynamic values.

**Giải pháp:** `getDynamicTips()` nhận `t: TFunction` làm param, dùng interpolation:
```ts
t('tips.calorieOver', { amount: Math.round(totalCalories - targetCalories) })
```

---

### Lưu ý quan trọng

- **KHÔNG YAGNI cho i18n**: i18n được triển khai cho TOÀN BỘ ứng dụng ngay từ đầu. Mọi hardcoded Vietnamese string trong mọi component, modal, hook, service, và utility phải được thay thế bằng `t()` translation keys.
- **DRY**: `DataBackup` component giữ nguyên logic, chỉ di chuyển mount point từ ManagementTab sang SettingsTab.
- **Backward Compatibility**: Theme key `mp-theme` và data keys `mp-*` giữ nguyên, không breaking change. Language key mới: `mp-language`.
- **KISS**: SettingsTab là flat component với 3 sections, không cần sub-tabs.
- **Test Impact**: Tất cả existing test files cần update để support i18n mock. Thêm i18n mock vào `setup.ts` để minimize per-file changes.
