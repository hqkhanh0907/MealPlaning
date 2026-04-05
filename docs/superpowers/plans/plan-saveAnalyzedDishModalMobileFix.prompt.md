## FIX: SaveAnalyzedDishModal không sử dụng được trên Mobile

### Mô tả lỗi

Sau khi AI phân tích xong ảnh món ăn, user nhấn "Lưu vào thư viện món ăn" → mở `SaveAnalyzedDishModal`. Trên mobile:

- Không thể cuộn hoặc thao tác được gì trên modal.
- Khi bấm vào checkbox "Lưu món ăn này" hoặc checkbox từng nguyên liệu → modal tự đóng ngay lập tức.

### Nguyên nhân gốc

**File:** `src/components/modals/SaveAnalyzedDishModal.tsx`

#### Bug 1: Thiếu `relative` trên modal container (Line 108)

```tsx
// BUG — Line 108
<div className="bg-white ... h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col sm:mx-4">
```

`ModalBackdrop` render một `<button absolute inset-0>` làm overlay đóng modal. Modal container **thiếu `relative`**, nên overlay button nằm **trên cả nội dung modal** trong stacking context. Mọi tap/click trên modal thực chất đều hit vào button ẩn → trigger `onClose` → modal đóng.

Các modal khác (VD: `AISuggestionPreviewModal`, `ConfirmationModal`) đều có `relative` trên container — file này bị thiếu.

#### Bug 2: `h-[90vh]` cố định, không tương thích keyboard mobile (Line 108)

```tsx
// BUG — Line 108
h-[90vh] sm:h-auto sm:max-h-[90vh]
```

- `vh` trên iOS **không co lại** khi virtual keyboard mở. Modal giữ nguyên `h-[90vh]` → phần footer (nút "Xác nhận lưu") bị đẩy ra khỏi viewport → user không nhấn được.
- Cần dùng `dvh` (Dynamic Viewport Height) — tự co lại khi keyboard mở.
- Nên dùng `max-h` thay vì `h` cố định, để modal chỉ cao vừa đủ nội dung.

#### Bug 3: Checkbox touch target quá nhỏ (Line 122, 201)

```tsx
// BUG — Line 122, 201
<input type="checkbox" className="h-5 w-5 ..." />
```

`w-5 h-5` = 20×20px. Chuẩn touch target tối thiểu là 44×48px. Trên mobile, user rất dễ tap lệch checkbox → tap trúng vùng khác hoặc backdrop → modal đóng (do Bug 1).

#### Bug 4: Footer thiếu `shrink-0` và `pb-safe` (Line 316)

```tsx
// BUG — Line 316
<div className="p-6 border-t ...">
```

- Thiếu `shrink-0`: Trong flex column, footer có thể bị co lại khi nội dung quá dài.
- Thiếu `pb-safe`: Trên native app (Capacitor), nút home bar che mất footer buttons.

#### Bug 5: Footer buttons thiếu `min-h-12` (Line 317-329)

Footer buttons không có minimum height → touch target dưới 44px trên mobile.

---

### Giải pháp

#### Fix 1: Thêm `relative` vào modal container

**File:** `src/components/modals/SaveAnalyzedDishModal.tsx` — Line 108

```tsx
// BEFORE:
<div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-4xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col sm:mx-4">

// AFTER:
<div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-4xl max-h-[85dvh] sm:max-h-[90vh] overflow-hidden flex flex-col sm:mx-4">
```

Thay đổi:

- Thêm `relative` → modal content nằm trên backdrop button.
- `h-[90vh]` → `max-h-[85dvh]` → co lại khi keyboard mở, không cố định height.
- Bỏ `sm:h-auto` (không cần vì đã dùng `max-h`).

#### Fix 2: Tăng touch target cho checkbox "Lưu món ăn này"

**File:** `src/components/modals/SaveAnalyzedDishModal.tsx` — Line 121-129

```tsx
// BEFORE:
<label className="flex items-center gap-2 cursor-pointer">
  <input type="checkbox" checked={saveDish} onChange={(e) => setSaveDish(e.target.checked)}
    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Lưu món ăn này</span>
</label>

// AFTER:
<label className="flex items-center gap-2 cursor-pointer min-h-11 px-2 -mr-2 rounded-lg active:bg-slate-100 dark:active:bg-slate-700 transition-colors">
  <input type="checkbox" checked={saveDish} onChange={(e) => setSaveDish(e.target.checked)}
    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Lưu món ăn này</span>
</label>
```

Thay đổi: `min-h-11` (44px), `px-2 -mr-2` expand tap area, `active:bg-slate-100` visual feedback.

#### Fix 3: Tăng touch target cho checkbox nguyên liệu

**File:** `src/components/modals/SaveAnalyzedDishModal.tsx` — Line 200-208

```tsx
// BEFORE:
<div className="flex items-center gap-3">
  <input type="checkbox" checked={selectedIngredients[idx]}
    onChange={() => toggleIngredientSelection(idx)}
    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Nguyên liệu #{idx + 1}</span>
</div>

// AFTER:
<label className="flex items-center gap-3 cursor-pointer min-h-11 px-1 rounded-lg active:bg-slate-100 dark:active:bg-slate-700 transition-colors">
  <input type="checkbox" checked={selectedIngredients[idx]}
    onChange={() => toggleIngredientSelection(idx)}
    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Nguyên liệu #{idx + 1}</span>
</label>
```

Thay đổi: `<div>` → `<label>` (click anywhere toggles checkbox), `min-h-11`, visual feedback.

#### Fix 4: Footer thêm `shrink-0` + `pb-safe`

**File:** `src/components/modals/SaveAnalyzedDishModal.tsx` — Line 316

```tsx
// BEFORE:
<div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">

// AFTER:
<div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0 pb-safe">
```

Thay đổi: `shrink-0` prevent footer collapse, `pb-safe` cho native app, `p-4 sm:p-6` mobile-first spacing.

#### Fix 5: Footer buttons thêm `min-h-12`

**File:** `src/components/modals/SaveAnalyzedDishModal.tsx` — Line 317-329

```tsx
// BEFORE:
<button onClick={onClose}
  className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
  Hủy bỏ
</button>
<button onClick={handleConfirmSave}
  className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold shadow-sm shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center gap-2">

// AFTER:
<button onClick={onClose}
  className="px-5 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 transition-all min-h-12">
  Hủy bỏ
</button>
<button onClick={handleConfirmSave}
  className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-sm shadow-emerald-200 hover:bg-emerald-600 active:bg-emerald-700 transition-all flex items-center gap-2 min-h-12">
```

Thay đổi: `min-h-12` (48px), `active:` states cho mobile feedback.

---

### Kiểm tra đồng bộ — Các modal khác có cùng pattern

Cần verify rằng TẤT CẢ modal containers đều có `relative`. Kết quả scan:

| Modal                           | Có `relative`?         | Status  |
| ------------------------------- | ---------------------- | ------- |
| `AISuggestionPreviewModal.tsx`  | ✅ `relative bg-white` | OK      |
| `ConfirmationModal.tsx`         | ✅ `relative bg-white` | OK      |
| `ClearPlanModal.tsx`            | ✅ `relative bg-white` | OK      |
| `GoalSettingsModal.tsx`         | ✅ `relative bg-white` | OK      |
| `TypeSelectionModal.tsx`        | ✅ `relative bg-white` | OK      |
| `PlanningModal.tsx`             | Cần kiểm tra           | TBD     |
| `DishEditModal.tsx`             | Cần kiểm tra           | TBD     |
| `IngredientEditModal.tsx`       | Cần kiểm tra           | TBD     |
| **`SaveAnalyzedDishModal.tsx`** | ❌ **THIẾU**           | **BUG** |

---

### Checklist kiểm thử sau fix

- [ ] Mobile: Mở SaveAnalyzedDishModal → cuộn lên xuống thoải mái
- [ ] Mobile: Tap checkbox "Lưu món ăn này" → toggle on/off, modal không đóng
- [ ] Mobile: Tap checkbox nguyên liệu → toggle on/off, modal không đóng
- [ ] Mobile: Tap vào input field → keyboard mở, footer vẫn visible và có thể scroll tới
- [ ] Mobile: Nhấn "Xác nhận lưu" → lưu thành công
- [ ] Mobile: Nhấn "Hủy bỏ" → đóng modal
- [ ] Mobile: Tap backdrop (vùng tối) → đóng modal
- [ ] Desktop: Tất cả chức năng hoạt động bình thường như trước
- [ ] Native app (Capacitor): Footer buttons không bị che bởi home bar
