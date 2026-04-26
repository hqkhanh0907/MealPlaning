# Phase 1 Emulator Parity Spec

Baseline để QA visual regression giữa app native (Android emulator-5554) và 4 mockup HTML Phase 1.
Trích trực tiếp từ:
- `docs/3-design/mockups/phase-1-ingredient-list.html`
- `docs/3-design/mockups/phase-1-ingredient-edit.html`
- `docs/3-design/mockups/phase-1-dish-list.html`
- `docs/3-design/mockups/phase-1-dish-edit-ingredient-based.html`

Lưu ý: phần `9:41 📶 🔋` và `☀️ Light / 🌙 Dark` trong mockup là **khung iPhone giả lập + dark-mode toggle của trang HTML preview**, KHÔNG phải UI app. Bỏ qua khi so sánh.

Source-of-truth hierarchy: `business-rules.md` > `prd.md` > `data-model.md` > `design-system.md` > `phase-1-management.md` > mockup spec notes.

---

## 1. Ingredient List (`Quản lý` → tab `Nguyên liệu`)

| Vùng | Yêu cầu |
|---|---|
| Header | Title `Quản lý`. Không có subtitle. |
| Segmented control | 2 option: `Nguyên liệu` (active mặc định), `Món ăn`. Style pill, white active pill trên track neutral, semibold active text. **KHÔNG dùng `ion-segment` native** — phải là `app-segmented-control` shared. |
| Search toolbar | Placeholder `Tìm nguyên liệu...`, có icon search bên trái. |
| List item | Layout: tên (bold), hàng meta `{category} · {portion}` (ví dụ `Thịt · 100g`), badge nguồn (`Có sẵn` cho seed / `MANUAL` cho user-created), nutrition badge `{kcal} kcal / 100g` hoặc `/100ml`. |
| Empty state | Icon nutrition/leaf, text `Chưa có nguyên liệu nào`, sub-text gợi ý, CTA `Thêm nguyên liệu`. |
| FAB | Bottom-right, icon `add`, action mở form `Thêm nguyên liệu`. |
| Options sheet (kebab/long-press) | Action `Sửa`, `Xóa`. |

Seed mẫu (mockup): Ức gà / Trứng gà / Cơm trắng / Bông cải xanh / Dầu olive.

---

## 2. Ingredient Edit/Create

| Vùng | Yêu cầu |
|---|---|
| Header (create) | Title `Thêm nguyên liệu`, nút close trái, action `Lưu` phải. |
| Header (edit) | Title `Sửa nguyên liệu`. |
| Field `Tên nguyên liệu` | Required, placeholder `Nhập tên nguyên liệu`. |
| Field `Nhóm` | Select required, placeholder `Chọn nhóm nguyên liệu`. |
| Field `Tính dinh dưỡng theo` | Toggle `100g` / `100ml`. |
| Macro fields | `Calories (kcal)` required, `Protein (g)`, `Carbs (g)`, `Fat (g)`, `Chất xơ (g)` — placeholder `Ví dụ: …`. |
| Section `Đơn vị có thể nhập khi thêm vào món` | Helper text: `Mỗi nguyên liệu cần ít nhất 1 đơn vị hợp lệ và đúng 1 đơn vị mặc định.` |
| Empty units | Box `Chưa có đơn vị nào`, sub `Thêm đơn vị quen thuộc như quả, g, ml hoặc đơn vị riêng của nguyên liệu này.`, CTA `+ Thêm đơn vị đầu tiên`. |
| Có units | Mỗi unit row: tên unit + badge `mặc định` (1 row duy nhất), badge `chuẩn` cho global unit, optional `≈ {label}` + badge `ước lượng` cho approximate unit. Hiển thị conversion `1 {unit} ≈ {factor}g` hoặc `=`. |
| Section `Quy đổi g ↔ ml (tùy chọn)` | Hiện khi cần bridge cross-dimension. Field `Mật độ (g/ml)`. Helper `Chỉ dùng khi cần quy đổi qua lại giữa g và ml.` |
| Footer | CTA `Lưu nguyên liệu` (full width). Edit thêm `Xóa nguyên liệu` (danger, secondary). |
| Validation states | `Vui lòng nhập tên nguyên liệu`, `Vui lòng chọn nhóm nguyên liệu`, `Vui lòng nhập calories`, `Cần ít nhất 1 đơn vị hợp lệ.`, `Cần đúng 1 đơn vị mặc định.` Field invalid: viền đỏ + label đỏ (`field--invalid` wrapper, KHÔNG để focus orange/blue đè). |
| Edit overlay | Full-screen: ẩn `ion-header` của management page, ẩn `ion-tab-bar` (qua `body.edit-overlay-open`), `ion-content [fullscreen]`. |

---

## 3. Dish List (`Quản lý` → tab `Món ăn`)

| Vùng | Yêu cầu |
|---|---|
| Header / segmented control | Cùng layout ingredient list. Active = `Món ăn`. |
| Search | Placeholder `Tìm món ăn...`. |
| Card | Tên món bold, dòng nutrition `{kcal} kcal · P: {p}g · C: {c}g · F: {f}g`, dòng meta `{servings} phần · {nguồn}`. |
| Empty state | Icon restaurant, text `Chưa có món ăn nào`, CTA. |
| FAB **2-option menu** | Tap FAB toggle menu hiện 2 action: `Tạo từ nguyên liệu` (icon nutrition), `AI tự điền` (icon sparkles). Tap ngoài / chuyển tab / mở overlay đóng menu. |
| Options sheet | `Sửa`, `Xóa`. |

Seed mẫu: Phở bò / Cơm gà xối mỡ / Bún chả.

---

## 4. Dish Edit Ingredient-Based

| Vùng | Yêu cầu |
|---|---|
| Header | `Thêm món ăn` / `Sửa món ăn`. Close trái, `Lưu` phải. |
| Section `Thông tin cơ bản` | Field `Tên món ăn *` required, `Mô tả` (placeholder `Mô tả ngắn (tùy chọn)`), `Số phần ăn *` (number, > 0). |
| Section `Nguyên liệu` | Empty: `Chưa có nguyên liệu nào`, CTA `+ Thêm nguyên liệu đầu tiên`. Có data: list rows {tên, `{amount} {unit}`, computed `{amount} ↔ {grams}g`, kebab xóa}. |
| Bottom sheet picker | Title `Chọn nguyên liệu`. Search `Tìm nguyên liệu...`. Section `Gần đây` + `Tất cả nguyên liệu`. Mỗi item: tên, category, sub `Dinh dưỡng theo 100g · mặc định: {unit}` hoặc `· có đơn vị ước lượng` / `· có thể quy đổi qua mật độ`. **Không nested sheet.** |
| Quantity sheet | Title `{tên nguyên liệu}`. Field `Số lượng *`. Helper `Chọn đơn vị có thể dùng cho nguyên liệu này`. List unit chip với badge `mặc định` / `chuẩn` / `≈` `ước lượng`. Live preview: `{amount} {unit}` + `{normalized}g` + macro preview. CTA `Hủy` / `Thêm`. |
| Total nutrition card | Title `Tổng dinh dưỡng (1 phần)`. Helper `Dinh dưỡng được tính tự động từ danh sách nguyên liệu hiện tại.` Badges: `Calories {x} kcal`, `Protein {x}g`, `Carbs {x}g`, `Fat {x}g`, `Chất xơ {x}g`. **Derived từ `dish_with_totals`**, không persist. |
| Footer | `Lưu món ăn`. Edit thêm `Xóa món ăn`. |
| Approximate marker | Bất cứ đâu hiện amount có dùng approximate unit phải có `≈` hoặc badge `ước lượng`. |

---

## 5. Design tokens & icon set

- **Icon set**: ionicons (đã import qua `addIcons` trong từng standalone component).
- Tokens: theo `src/theme/variables.scss` + `src/global.scss` (color/typography/spacing/radius).
- Tab bar Vietnamese: `Tổng quan`, `Lịch ăn`, `Quản lý`, `Tập luyện`. Cài đặt là push page.
- Icon mapping mặc định:
  - Search → `search-outline`
  - Add FAB → `add`
  - Kebab → `ellipsis-vertical`
  - Empty ingredient → `nutrition-outline`
  - Empty dish → `restaurant-outline`
  - Dish FAB option `Tạo từ nguyên liệu` → `nutrition-outline`
  - Dish FAB option `AI tự điền` → `sparkles-outline`
  - Delete → `trash-outline`
  - Edit → `create-outline`
  - Close header → `close`
  - Approximate marker → text `≈` (giữ nguyên Unicode, không thay icon).

---

## 6. Emoji audit kết quả

- Source code Phase 1: **không có emoji UI** (đã xác nhận).
- Mockup HTML có emoji nhưng đều là khung preview / dark toggle / icon placeholder mà tác giả mockup tự ghi chú là "placeholder cho IonIcon" — KHÔNG render trong app.
- Kết luận: rule "no emoji in UI" hiện đang **được tuân thủ** ở Phase 1. Vẫn sẽ recheck từng screen trên emulator để xác nhận.

---

## 7. Flow chính phải QA

1. Launch → onboarding (đã pass) → tab Quản lý.
2. Ingredient: list → search → kebab Sửa → modal edit → validation → save → list refresh.
3. Ingredient: kebab Xóa → confirm dialog → list refresh.
4. Ingredient: FAB → modal create → validation từng field → add unit → save.
5. Dish: chuyển segment Món ăn → list / empty.
6. Dish: FAB → menu 2 option → `Tạo từ nguyên liệu` → modal dish edit.
7. Dish modal: nhập tên, số phần ăn → tap `+ Thêm nguyên liệu đầu tiên` → bottom sheet picker → chọn ingredient → quantity sheet → nhập amount + unit → tap `Thêm` → row xuất hiện + total nutrition cập nhật.
8. Dish: kebab xóa nguyên liệu trong row.
9. Dish: save → list refresh.
10. Edit overlay phải full-screen, ẩn tab bar + management header.
