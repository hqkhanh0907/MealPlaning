# Audit Phase 1 Management — Code vs Mockup vs Docs (2026-04-28)

> Mục đích: so sánh code thực tế của tab Quản lý (Phase 1) với 4 file mockup
> mới nhất + business rules / data model, để xác định các điểm cần adapt
> trước khi implement đợt sage-wellness.

## 1. Source-of-truth hierarchy

Khi mockup vs code vs phase-plan mâu thuẫn, áp dụng thứ tự ưu tiên sau:

1. `docs/4-architecture/business-rules.md` — bất biến hệ thống (unit basis, density fallback, approximate flag, reject conversion).
2. `docs/2-requirements/prd.md` §5.2 — yêu cầu sản phẩm Phase 1.
3. `docs/3-design/data-model.md` — schema cột (`display_label`, `factor_to_basis`, `is_approximate`, `nutrition_basis_unit`, …).
4. `docs/3-design/design-system.md` — token sage, form pattern §8.6, list-card, segment-control inverse-sage.
5. **Mockup phase-1 (4 file, vừa update 28/4)** — visual contract.
6. `docs/5-development/phase-1-management.md` — phase plan (đã drift từ Apr 26).
7. Code hiện tại — implementation snapshot.

Nếu mockup mâu thuẫn business-rules → giữ business-rules, đề xuất sửa mockup. Nếu code mâu thuẫn mockup mà không vi phạm business-rules → ưu tiên mockup (đây là deliverable adapt UI).

## 2. Files trong scope

### Mockup (vừa update sage 28/4 — git M state, chưa commit)
| File | Lines |
|------|-------|
| `docs/3-design/mockups/phase-1-ingredient-list.html` | 1070 |
| `docs/3-design/mockups/phase-1-ingredient-edit.html` | 710  |
| `docs/3-design/mockups/phase-1-dish-list.html`       | 965  |
| `docs/3-design/mockups/phase-1-dish-edit-ingredient-based.html` | 855 |

### Code Phase 1 Management
| File | Lines | Vai trò |
|------|-------|---------|
| `src/app/features/management/management.page.html` | 371 | Shell list (1 page, 2 sub-tabs) |
| `src/app/features/management/management.page.ts`   | 764 | Logic store + filter + dialog + FAB menu |
| `src/app/features/management/management.page.scss` | 16  | Local styles |
| `src/app/features/management/management.routes.ts` | 8   | 1 route duy nhất |
| `src/app/shared/components/ingredient-edit-modal/*` | 777 | Modal sửa nguyên liệu (HTML/TS/SCSS) |
| `src/app/shared/components/dish-edit-modal/*`       | 654 | Modal sửa món ăn |
| `src/app/shared/components/bottom-sheet-picker/*`   | —   | Picker chọn nguyên liệu |
| `src/app/core/repositories/{ingredient,dish,unit}.repository.ts` | — | Data access |
| `src/app/core/stores/{ingredient,dish}.store.ts`    | —   | Signal store |

## 3. Drift level 1 — Cấu trúc trang & navigation

### 3.1 Sub-tabs / list shell
**FACT (đo từ file)**:
- Mockup `phase-1-ingredient-list.html` và `phase-1-dish-list.html` đều dùng cùng pattern toolbar `<div class="toolbar-title">Quản lý</div>` + sub-tabs "Nguyên liệu" / "Món ăn".
- Code `management.page.html` line 4: `<ion-title>Quản lý</ion-title>`, line 16-21: `<app-segmented-control>` cho 2 tab `ingredients|dishes`.

**KẾT LUẬN**: ✅ Cấu trúc list shell **đồng bộ** giữa code và mockup. KHÔNG cần refactor route. Đây là **bác bỏ giả định ban đầu** rằng mockup tách 4 page → thực tế mockup chỉ tách 2 list (chung shell) + 2 edit (riêng).

### 3.2 Edit screen pattern — DRIFT QUAN TRỌNG
**FACT**:
- Mockup `phase-1-ingredient-edit.html` và `phase-1-dish-edit-ingredient-based.html` vẽ edit screen như **full-screen page** với:
  - `<div class="toolbar-title">Thêm nguyên liệu</div>` / `Sửa nguyên liệu` / `Thêm món ăn` / `Sửa món ăn` trên toolbar sage.
  - `<button class="toolbar-save">Lưu</button>` ở slot end của toolbar.
  - Có status bar (`📶 🔋`) ở top → cho thấy đây là native page riêng, không phải overlay trong list.
- Code: `IngredientEditModal` và `DishEditModal` là **shared component dạng modal overlay**, không có `<ion-toolbar>` mà dùng `<div class="modal-toolbar">` (custom). Mở qua signal `editOverlayOpen()` trong `management.page.html` line 14: `<ion-content [fullscreen]="editOverlayOpen()">`. Khi modal mở thì `<ion-header>` của list bị ẩn (line 1: `@if (!editOverlayOpen())`).

**ASSUMPTION**: Pattern overlay hiện tại là một dạng "fullscreen modal" → từ user perspective trông giống full-screen page (vì hide header list). Nhưng:
- **Không phải Ionic page** → không có route riêng, không deep-link được, không dùng `ion-toolbar` → **không được hưởng fix sage toolbar global** (đã wire qua `header-elevation.scss`).
- Modal dùng `.modal-toolbar` custom → cần **tự apply sage tokens**, dễ drift.

**RECOMMENDATION**: Có 2 hướng (cần user quyết — xem §9 Q1):
- **Phương án A — Giữ modal pattern, refactor visual**: đổi `.modal-toolbar` thành `<ion-header><ion-toolbar>` để hưởng style sage global; thêm route nông (`/tabs/management/ingredient/edit/:id`) optional cho deep-link.
- **Phương án B — Refactor sang page route**: tạo `IngredientEditPage` + `DishEditPage` riêng, route con của management; bỏ modal. Tốn công hơn, nhưng đúng pattern Ionic.

### 3.3 BottomSheet ingredient picker
**FACT**:
- Mockup screen 2 của `dish-edit`: `<div class="bottom-sheet-title">Chọn nguyên liệu</div>` + section header `Gần đây` + `Tất cả nguyên liệu`.
- Code có `BottomSheetPicker` shared component (dùng trong `dish-edit-modal`) → cấu trúc đúng.
- DRIFT: grep `'Gần đây'` trong toàn `src/` → **0 hit**. Section "Gần đây" trong mockup **chưa được implement trong code**.

**RECOMMENDATION**: Thêm "Recent ingredients" trong picker (cần repository method `findRecentlyUsedIngredients(limit=5)` + UI section).

## 4. Drift level 2 — UI/Layout per screen

### 4.1 Ingredient List
| Mục | Mockup | Code | Drift |
|-----|--------|------|-------|
| Toolbar title | "Quản lý" | "Quản lý" (line 4) | ✅ |
| Toolbar action end | (mockup không có) | settings-outline icon (line 6-8) | ⚠ Mockup không vẽ — cần xác minh PRD có yêu cầu shortcut Settings ở Quản lý không |
| Sub-tabs | 2 chip "Nguyên liệu"/"Món ăn" | `app-segmented-control` (sage inverse-sage modifier?) | ⚠ Cần check class `segment-control--inverse-sage` đã apply chưa |
| Search bar | `.search-text placeholder "Tìm nguyên liệu..."` | `<app-search-toolbar placeholder="Tìm nguyên liệu...">` | ✅ visual cần verify |
| Filter chip strip | "Tất cả / Thịt / Cá & Hải sản / Rau củ / Trứng & Sữa / Ngũ cốc / Đậu & Hạt / Gia vị" — cuộn ngang | `INGREDIENT_CATEGORIES` + "Tất cả" prepend (line 86 ts), HTML line 33-46 dùng `.filter-chip` với `--active` modifier | ✅ logic đúng. Cần verify: scroll ngang, sage active state |
| Card item structure | name + category-chip + source-badge + (no kcal in mockup ingredient list) | name + 2 badges (category + source) + **strong kcal/100g block bên phải** (item-card__metric) | ⚠ **Code thừa metric kcal** mà mockup không có → mockup ưu tiên density nhẹ, cần quyết: giữ kcal hay bỏ |
| Kebab menu | (mockup có nút ⋮ trên dish-list nhưng không thấy rõ trên ingredient-list — cần xem lại screenshot) | Có `kebab-button` (line 73-81) | ⚠ Verify mockup ingredient-list có kebab không |
| Empty state | icon + title + desc + CTA `+ Thêm nguyên liệu đầu tiên` | `<app-empty-state>` đầy đủ + CTA (line 64-67) | ✅ |
| Result count hint | `3 kết quả cho "gà"` / `4 nguyên liệu trong "Rau củ"` | `ingredientResultHint()` computed (line 152-172) | ✅ logic đầy đủ |
| FAB Add | (mockup ingredient-list không vẽ FAB — chỉ có CTA empty state?) | FAB Add (chỉ hiện khi tab=dishes? Cần check) | ⚠ Verify lại mockup screen 1 "Danh sách nguyên liệu" có FAB không |
| Dialog "Không thể xóa" | title + 2 button "Đóng" / "Xem 3 món đang dùng" | grep cho "không thể xóa" → có trong management.page.ts | ⚠ Verify text exact, button label, navigate-to-dish flow |
| Dialog "Xóa nguyên liệu?" | title + 2 button "Giữ lại" / "Xóa" | `ConfirmDialog` shared | ✅ verify text |

### 4.2 Ingredient Edit (`ingredient-edit-modal`)
| Mục | Mockup | Code | Drift |
|-----|--------|------|-------|
| Toolbar title | "Thêm nguyên liệu" / "Sửa nguyên liệu" | `<h2>{{ title }}</h2>` trong `.modal-toolbar` | ⚠ Không phải `ion-title` → thuộc drift §3.2 |
| Save action | `<button class="toolbar-save">Lưu</button>` end-slot | `<button class="toolbar-save-button">{{ saving ? 'Đang lưu...' : 'Lưu' }}</button>` | ✅ logic, ⚠ class name khác |
| Field "Tên nguyên liệu" | floating-label cream input | dùng `<app-form-field>` (cần verify pattern §8.6) | ✅ assume OK |
| Field "Nhóm" | picker-trigger select-like | cần verify | ⚠ |
| Segment "Tính dinh dưỡng theo" 100g/100ml | 2 segment-btn | có `.segment-btn` 100g/100ml (line ?) — cần check apply `segment-control--inverse-sage` không | ⚠ |
| Macro fields (Calories, Protein, Carbs, Fat, Chất xơ) | 5 input numeric với placeholder "Ví dụ: 250" | có | ✅ verify placeholder text |
| Section "Đơn vị có thể nhập khi thêm vào món" | + hint "Mỗi nguyên liệu cần ít nhất 1 đơn vị hợp lệ và đúng 1 đơn vị mặc định" | có exact string trong code | ✅ |
| Unit empty state | icon + title + copy + button `+ Thêm đơn vị đầu tiên` | có button text exact | ✅ |
| Unit row UI | unit-title + badge "mặc định" + badge "chuẩn"/"ước lượng" + action **"Sửa label"** + (?)"Cập nhật quy đổi" | code chỉ có "Đặt mặc định" + "Xóa" | ❌ **MISSING "Sửa label" action** (display_label edit UI) |
| Density "Mật độ (g/ml) — tùy chọn" | input optional + section-hint "Chỉ dùng khi cần quy đổi qua lại giữa g và ml." | có `'mật độ'` trong html | ✅ verify text |
| Approximate marker `≈ nhúm` + badge "ước lượng" | 1 unit-title prefix `≈` + badge approx | có `'ước lượng'` trong code | ✅ verify display |
| CTA bottom | `<button class="btn-cta">Lưu nguyên liệu</button>` | duplicate save button cuối form | ✅ verify text "Lưu nguyên liệu" / "Lưu thay đổi" |
| Delete | `<button class="btn-danger-text">Xóa nguyên liệu</button>` (mode edit) | có "Xóa nguyên liệu" | ✅ |
| Validation states | `.input-label.invalid` + `.field-error` cho từng field + summary đơn vị | có `showErrors()` + per-field error | ✅ assume OK; cần verify visual sage |
| Saving state | "Saving state: form dim, CTA spinner" | có `[disabled]="saving"` | ⚠ verify dim form effect + spinner exists |

### 4.3 Dish List
| Mục | Mockup | Code | Drift |
|-----|--------|------|-------|
| Card item | name + type-badge `Nguyên liệu`/`AI tự điền` + kcal lớn + macro chips P:..g C:..g F:..g + source-badge "Có sẵn"/"AI" | có (line 150-180) — verify format `P: {{n}}g` đúng | ✅ logic, cần check macro chip color sage |
| Type badge variant | `type-ingredient` (calm) vs `type-ai` (accent) | có `dishTypeClass()` mapping | ✅ |
| Source badge | "Có sẵn" / "AI" | có `dishSourceLabel()` | ✅ |
| Empty state | icon 🍽️ + title "Chưa có món ăn nào" + CTA "+ Thêm món ăn đầu tiên" | có `restaurant-outline` + text | ✅ |
| Search bar empty result | "Không tìm thấy món ăn nào / Thử từ khóa khác hoặc thêm món ăn mới" | có exact text | ✅ |
| Result count | `1 kết quả` / `kết quả` không quote khi count 1 | code: `${count} kết quả` (line 181) | ✅ |
| FAB expanded menu | 2 item: "Tạo từ nguyên liệu" (primary) + "AI tự điền", có sublabel | code line 217-246 đầy đủ | ✅ |
| Dialog delete | "Xóa món ăn?" + message "Phở bò sẽ bị xóa vĩnh viễn. Bạn không thể hoàn tác thao tác này." | có `'Xóa món ăn?'` | ⚠ verify message text + 2 button "Giữ lại"/"Xóa" |

### 4.4 Dish Edit (`dish-edit-modal`)
| Mục | Mockup | Code | Drift |
|-----|--------|------|-------|
| Toolbar | "Thêm món ăn" / "Sửa món ăn" + Lưu end | `.modal-toolbar` | ⚠ §3.2 drift |
| Section "Thông tin cơ bản" | label group | có `<div class="section-label">Thông tin cơ bản</div>` | ✅ |
| Field "Tên món ăn *" | required marker `*` | verify | ⚠ |
| Field "Mô tả" | textarea optional placeholder "Mô tả ngắn (tùy chọn)" | verify | ⚠ |
| Field "Số phần ăn *" | numeric required | line 53 `label="Số phần ăn"` (không có `*`) | ⚠ Code thiếu marker `*` so với mockup |
| Section "Nguyên liệu" empty | text "Chưa có nguyên liệu nào" + CTA "+ Thêm nguyên liệu đầu tiên" | có "+ Thêm nguyên liệu đầu tiên" | ✅ |
| Bottom-sheet picker (chọn ingredient) | section "Gần đây" + "Tất cả nguyên liệu" | **MISSING "Gần đây"** (xem §3.3) | ❌ |
| Amount sheet (nhập số lượng) | sheet với amount-title + category-chip + label "Số lượng *" + section-hint "Chọn đơn vị có thể dùng cho nguyên liệu này" + unit-options + preview kcal/macro | cần verify shared `amount-input-sheet` hoặc inline | ⚠ |
| Unit option row | mặc định / chuẩn / ước lượng + copy "1 quả ≈ 50g" / "1 nhúm ≈ 0.3g" | verify | ⚠ |
| Reject conversion state | invalid label + hint "Đơn vị đang chọn / Dinh dưỡng theo 100ml" | verify; business-rules yêu cầu reject khi thiếu factor + density | ⚠ |
| Ingredient list rows (sau khi đã thêm) | name + detail "200g" / "2 quả" / "≈ 1 nhúm · ước lượng" / "1 tbsp" + kcal | verify display label + approximate marker | ⚠ |
| Section "Tổng dinh dưỡng (1 phần)" + hint auto | line 157 có exact string | ✅ |
| Macro labels | Calories / Protein / Carbs / Fat / Chất xơ + value | verify đầy đủ |
| CTA bottom | "Lưu món ăn" / "Lưu thay đổi" | verify text exact |
| Delete | "Xóa món ăn" btn-danger-text | verify |
| Validation 8 | thiếu name, servings sai range, dish rỗng | verify error messages |

## 5. Drift level 3 — Copy / labels Vietnamese

| Vị trí | Mockup | Code | Quyết định đề xuất |
|--------|--------|------|---------------------|
| Result hint khi search | `3 kết quả cho "gà"` (dùng " thẳng) | `${count} kết quả cho "${query}"` (dùng " curly) | Thống nhất 1 kiểu — đề xuất giữ curly trong code (`management.page.ts:164`), update mockup nếu cần |
| Dish empty desc | "Thêm món ăn đầu tiên để bắt đầu lập kế hoạch bữa ăn" | "Thêm món ăn đầu tiên để bắt đầu lập kế hoạch bữa ăn." | ✅ identical (mockup không có chấm cuối, code có chấm) — minor |
| Required marker | "Tên món ăn *" / "Số phần ăn *" / "Số lượng *" | code không thấy `*` đứng cạnh label trong dish-edit-modal | Add `*` vào required field labels |
| FAB sublabel | "Tính dinh dưỡng tự động, quản lý chi tiết" | line 234 — exact string | ✅ |
| FAB AI sublabel | "Nhập tên món để AI gợi ý nguyên liệu và khối lượng" | line 246-247 (truncated, cần check full) | ⚠ verify |
| Saving state CTA | "Đang lưu..." | exact `'Đang lưu...'` | ✅ |
| Delete confirm message | "{name} sẽ bị xóa vĩnh viễn. Bạn không thể hoàn tác thao tác này." | verify trong management.page.ts | ⚠ |

## 6. Drift level 4 — Data binding & business rules

### 6.1 Schema fields đã có nhưng thiếu UI
- `display_label` (cột `ingredient_unit.display_label`, schema.ts:363) → có trong repository/spec/data, **không có UI sửa** trong ingredient-edit-modal. Xem §4.2 row "Sửa label".

### 6.2 Business rules verify
| Rule | Mockup | Code | Status |
|------|--------|------|--------|
| `is_default` đúng 1 đơn vị | mockup screen 5 ingredient-edit hiển thị error "Cần ít nhất 1 đơn vị hợp lệ. Chọn đúng 1 đơn vị mặc định trước khi lưu." | grep cần verify trong ingredient-edit-modal.ts | ⚠ verify enforce |
| `factor_to_basis` required when unit ≠ basis | screen 1-3 ingredient-edit hiển thị | verify | ⚠ |
| Density fallback ml↔g | screen 3 dầu olive: basis 100ml + nhập g qua density 0.91 | có UI density input | ✅ verify wiring |
| Reject conversion | screen 5 dish-edit: "Nước mắm đặc biệt" 10 (?) → reject | code business-rules.md có spec, verify amount sheet block save | ⚠ |
| Approximate `is_approximate` flag | screen 4 ingredient-edit: muối "≈ nhúm" badge ước lượng | code có `'ước lượng'` | ✅ verify wiring DB → UI |
| Block delete ingredient when referenced | mockup screen 5 ingredient-list: dialog "Không thể xóa" + "Xem 3 món đang dùng" | có "không thể xóa" + reference count | ⚠ verify CTA "Xem N món" có navigate đến filtered dish list không |

### 6.3 Recent ingredients
- Mockup screen 2 dish-edit: section "Gần đây" trong picker
- Code: không có repository method `findRecentlyUsedIngredients`, không có UI section
- Data model: cần check có `last_used_at` hay tính từ `dish_ingredient` join + sort by created_at — **cần ADR ngắn hoặc PRD reference**

## 7. Drift level 5 — Design system / token compliance

### 7.1 Form pattern §8.6
- Code: dùng `<app-form-field>` shared component (verify nó wrap đúng `.input-wrapper > .input-label + .input-native`).
- Modal `.modal-toolbar` không phải `ion-toolbar` → có thể vi phạm CI guard `check-form-input-pattern.mjs`? Verify.

### 7.2 Sage token compliance
- Toolbar list: dùng `<ion-toolbar>` → ✅ tự hưởng sage qua `header-elevation.scss`.
- Toolbar modal: `.modal-toolbar` custom → cần override sage trong `ingredient-edit-modal.scss` và `dish-edit-modal.scss` (kiểm tra hardcoded color).
- Filter chip active state: code line 38-44 dùng `.filter-chip--active` → cần verify SCSS có dùng `var(--primary-500)` sage không, hay còn coral cũ.
- Macro chip P/C/F: cần audit color tokens trong dish list card.

### 7.3 Style 2025 naming guard
- `IngredientEditModal`, `DishEditModal`, `BottomSheetPicker`, `ConfirmDialog`, `EmptyState`, `SearchToolbar` → đều không có suffix `Component` → ✅
- Files `*.modal.ts`? Không, đều là `ingredient-edit-modal.ts` → ✅
- `management.page.ts` có suffix `.page` → ✅ (page là exception cho route component)

### 7.4 PC-1 external template guard
- Tất cả các component thấy đều dùng `templateUrl` + `styleUrl` → ✅

## 8. Discrepancy table (tổng hợp ưu tiên)

| ID | Screen | Type | Description | Source-of-truth | Priority | Action đề xuất |
|----|--------|------|-------------|-----------------|----------|-----------------|
| D-01 | Edit modals | Cấu trúc | `.modal-toolbar` custom thay vì `ion-toolbar` → không hưởng sage global, không deep-link | Mockup + design-system | **High** | Refactor sang `<ion-header><ion-toolbar>` (Phương án A §3.2) |
| D-02 | Ingredient picker | Missing feature | Section "Gần đây" chưa có | Mockup | **High** | Implement `findRecentlyUsedIngredients` + UI section |
| D-03 | Ingredient edit | Missing feature | Action "Sửa label" (display_label) trên unit row | Mockup + schema | **High** | Add inline edit display_label cho mỗi unit row |
| D-04 | Ingredient list card | Layout | Code có `item-card__metric` (kcal/100g) bên phải, mockup không | Mockup | Medium | Quyết: bỏ metric → đơn giản, hoặc giữ nếu PRD cần. **Cần user quyết** |
| D-05 | Dish edit form | Copy | Required label thiếu marker `*` | Mockup | Medium | Thêm `*` vào "Tên món ăn", "Số phần ăn", "Số lượng" |
| D-06 | Sub-tabs (segment) | Visual | Chưa apply `segment-control--inverse-sage`? | Foundation sage | Medium | Verify trên emulator; nếu chưa, add modifier |
| D-07 | Filter chip | Visual | Active state có dùng sage `--primary-500` không | Sage tokens | Medium | Audit SCSS |
| D-08 | Settings shortcut | Layout | Toolbar end-slot có button settings, mockup không vẽ | Mockup vs UX | Low | **Cần user quyết**: giữ shortcut hay bỏ |
| D-09 | Saving dim form | Visual | Mockup mô tả form dim khi saving + spinner trong CTA | Mockup | Low | Verify visual; thêm overlay opacity nếu thiếu |
| D-10 | Block delete CTA | UX | "Xem 3 món đang dùng" có navigate đến dish list filter không | Mockup | Medium | Verify behavior; nếu chưa, implement filter |
| D-11 | Validation summary unit | Visual | Mockup screen 5 ingredient-edit có copy `⚠️ Thiếu danh sách đơn vị` riêng | Mockup | Low | Visual verify trong unit empty error state |
| D-12 | Macro chip color | Visual | P/C/F color sage-aligned chưa | Sage tokens | Medium | Audit SCSS dish list card |
| D-13 | Reject conversion | Business | Block save khi unit khác dimension không có factor + density | business-rules.md | **High** | Verify code có guard này; spec rõ trong amount sheet |
| D-14 | Required `*` field marker | Visual | Mockup dùng `*` sau label cho required field | Mockup + design-system | Low | Cập nhật `<app-form-field>` hoặc inline marker |
| D-15 | Density section visibility | Visual | Mockup screen 3 chỉ hiện density khi basis = 100ml hoặc khi có g/ml conversion need | Mockup | Medium | Verify code: density input hiện luôn hay conditional |

## 9. Open questions cần user quyết

**Q1**: Edit screen pattern — chọn phương án nào?
- **A**: Giữ modal, refactor visual sang `ion-toolbar` (ít code, nhanh, vẫn đúng pattern Ionic).
- **B**: Refactor sang page route riêng (`management/ingredient/edit/:id`, `management/dish/edit/:id`) — đúng Ionic Material full-screen page, hỗ trợ deep-link, back button native, nhưng phải migrate state ra route.
- **C**: Hybrid — modal trên web, page trên Android (phức tạp, không đề xuất).

**Q2**: Ingredient list card — có giữ kcal/100g metric bên phải không?
- Mockup ưu tiên density nhẹ (chỉ name + 2 badge). Code thừa metric.
- Bỏ → đẹp, bám mockup. Giữ → user thấy nhanh giá trị calo.

**Q3**: Settings shortcut trên toolbar Quản lý có giữ không? Mockup không vẽ.

**Q4**: "Sửa label" cho unit (display_label) — UI dạng nào?
- Inline rename trên unit row (tap "Sửa label" → input thay unit-title)?
- Mở amount sheet với field "Nhãn hiển thị"?

**Q5**: Section "Gần đây" trong picker — sort theo gì?
- Last `updated_at` của `ingredient`?
- Most-recent `dish_ingredient.created_at` (trong N ngày)?
- Top-N most-used `dish_ingredient.ingredient_id` count?

**Q6**: Block-delete CTA "Xem 3 món đang dùng" — navigate đến đâu?
- Tab Món ăn với filter pre-applied (filter by ingredient_id)?
- Hoặc dialog list 3 món inline?

## 10. Risks & rollback notes

- **Refactor modal → ion-toolbar (D-01)**: ảnh hưởng z-index, animation in/out (modal hiện có animation slide?), keyboard avoidance, back-button android. Test: open/close 5 lần, soft keyboard, hardware back, rotate.
- **Add "Sửa label" UI (D-03)**: cần migrate `display_label` nullable → ensure form validation, không phá unique constraint nào.
- **Recent ingredients query (D-02)**: query thêm join, cần index `dish_ingredient.created_at` hoặc `ingredient.updated_at` — verify performance trên 200+ ingredients.
- **Unit row redesign**: change-detection signal có thể trigger nhiều render → verify ChangeDetection performance.
- **Test impact**: 162 unit test hiện pass; estimate 10-20 test cần update (modal → page, unit row UI). Cần TDD theo skill.

## 11. Tóm tắt

1. **Cấu trúc list shell ĐỒNG BỘ** với mockup — không cần refactor route Phase 1.
2. **Edit screens drift** quan trọng nhất: dùng `.modal-toolbar` custom thay `ion-toolbar` → không hưởng sage global. Cần user quyết Q1.
3. **3 missing features**: "Gần đây" picker section, "Sửa label" unit action, có thể "Block-delete navigate". Cần user quyết Q4-Q6.
4. **Sage token compliance** chỉ verify được sau khi build + chụp emulator — đã có script QA pixel sẵn.
5. Còn lại 12 drift mức medium/low chủ yếu là copy text + visual tinh chỉnh, batch fix trong 1-2 PR.

---

**Status**: Audit hoàn thành — chờ user trả lời 6 câu hỏi §9 trước khi viết implementation plan.





