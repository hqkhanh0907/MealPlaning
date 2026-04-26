# Phase 1 — Audit emoji & đề xuất ionicon mapping

> Tài liệu này audit toàn bộ vị trí đang dùng emoji trong source code Phase 1 và 4 mockup HTML, từ đó đề xuất ionicon thay thế.
> Ngày audit: 2026-04-26
> Phạm vi: `src/app/features/management/**`, `src/app/shared/components/**`, `src/app/core/stores/**`, `src/app/core/models/management.constants.ts`, `src/app/tabs/**`, `src/global.scss`, và 4 mockup `docs/3-design/mockups/phase-1-*.html`.

---

## 1. Phương pháp quét

1. Liệt kê toàn bộ file `.ts/.html/.scss/.json` thuộc các thư mục Phase 1 nêu trên.
2. Quét bằng Python regex (ripgrep PCRE2 không hỗ trợ `\U` escape, nên chuyển sang Python `re` với charset Unicode mở rộng):

   ```python
   re.compile(
     r'[\u2000-\u206F\u20A0-\u20CF\u2100-\u214F\u2190-\u21FF'
     r'\u2200-\u22FF\u2300-\u23FF\u2460-\u24FF\u2500-\u259F'
     r'\u25A0-\u25FF\u2600-\u26FF\u2700-\u27BF\u2B00-\u2BFF'
     r'\u3000-\u303F\uFE00-\uFE0F\U0001F000-\U0001FFFF]'
   )
   ```

   Range này phủ:
   - Pictographs / Symbols & Pictographs Extended (`U+1F000–U+1FFFF`).
   - Miscellaneous Symbols & Dingbats (`U+2600–U+27BF`).
   - Math / Arrows / Misc Technical (≈, ↔, …).
   - General Punctuation (em-dash `—`, smart quotes `" "`).
   - Variation Selectors (`U+FE0F`).

3. Phân loại từng match thành 3 nhóm:
   - **Emoji UI thực sự** (cần thay bằng ionicon).
   - **Ký tự typographic** (smart quote, em-dash, ≈, ↔) — KHÔNG phải emoji, không cần thay.
   - **Ký tự ASCII trang trí** (✕, ✓) — đánh giá riêng.

4. Lặp lại với 4 mockup HTML để đối chiếu nguồn gốc.
5. Đề xuất ionicon dựa trên design-system §8 (icon + Ionicons hiện có trong project).

Script đầy đủ: `/tmp/scan_emoji.py`.

---

## 2. Kết quả emoji trong source code Phase 1

### 2.1. Emoji UI (pictographs) — cần thay bằng ionicon

**KHÔNG TÌM THẤY.** Toàn bộ source code Phase 1 hoàn toàn sạch emoji pictograph.

| File | Line | Emoji | Context | Mục đích |
|------|------|-------|---------|----------|
| _(không có match nào trong toàn bộ phạm vi)_ | — | — | — | — |

### 2.2. Ký tự typographic / toán học (KHÔNG phải emoji — giữ nguyên)

Các match dưới đây chỉ là ký tự văn bản bình thường (smart quote, em-dash, ký hiệu xấp xỉ/mũi tên hai chiều). Không cần thay bằng ionicon vì chúng nằm trong nội dung text, không phải UI icon.

| File | Line | Ký tự | Snippet (rút gọn) | Loại |
|------|------|-------|-------------------|------|
| src/app/features/management/management.page.ts | 840 | `" "` | `${count} kết quả cho "${query}"` | smart quote (text) |
| src/app/features/management/management.page.ts | 844 | `" "` | `${count} nguyên liệu trong "${this.activeIngredientFilter()}"` | smart quote (text) |
| src/app/features/management/management.page.ts | 892 | `" "` | `Nguyên liệu "${this.pendingIngredientDeleteName()}" đang được dùng…` | smart quote (text) |
| src/app/features/management/management.page.ts | 896 | `" "` | `Bạn có chắc muốn xóa "…"?` | smart quote (text) |
| src/app/features/management/management.page.ts | 908 | `" "` | `Món ăn "${this.pendingDishDeleteName()}" đang được dùng trong kế hoạch ăn…` | smart quote (text) |
| src/app/features/management/management.page.ts | 912 | `" "` | `Bạn có chắc muốn xóa "…"?` | smart quote (text) |
| src/app/features/management/management.page.ts | 1392 | `—` | `defaultUnit?.display_label ?? defaultUnit?.short_name_vi ?? '—'` | em-dash placeholder |
| src/app/shared/components/bottom-sheet-picker/bottom-sheet-picker.component.ts | 30 | `—` | `BottomSheetPicker — §8.6c.1` | em-dash trong JSDoc |
| src/app/shared/components/bottom-sheet-picker/bottom-sheet-picker.component.scss | 2 | `—` | `BottomSheetPicker styles — §8.6c.1` | em-dash trong SCSS comment |
| src/app/shared/components/nutrition-badge/nutrition-badge.component.ts | 9 | `≈` | `{{ approximate ? '≈ ' : '' }}{{ formatNumber(calories) }} kcal` | toán học (xấp xỉ) — text/label |
| src/app/shared/components/nutrition-badge/nutrition-badge.component.spec.ts | 30 | `≈` | `expect(...).toContain('≈ 155 kcal')` | unit test |
| src/app/shared/components/ingredient-edit-modal/ingredient-edit-modal.component.ts | 200 | `↔` | `<div class="info-card-title">Quy đổi g ↔ ml (tùy chọn)</div>` | text label (mũi tên hai chiều) |
| src/app/shared/components/ingredient-edit-modal/ingredient-edit-modal.component.ts | 207 | `—` | `<span>Mật độ (g/ml) — tùy chọn</span>` | em-dash text |
| src/app/shared/components/ingredient-edit-modal/ingredient-edit-modal.component.ts | 731 | `≈` | `unit.is_approximate ? \`≈ ${unit.display_label…}\` : ...` | label đơn vị approximate |
| src/app/shared/components/ingredient-edit-modal/ingredient-edit-modal.component.ts | 736 | `≈` | `… 1 ${label} ≈ ${factor}${basis}` | helper text |
| src/app/shared/components/dish-edit-modal/dish-edit-modal.component.ts | 532 | `≈` | `unit.is_approximate === 1 ? \`≈ ${label}\` : label` | label đơn vị |
| src/app/shared/components/dish-edit-modal/dish-edit-modal.component.ts | 533 | `≈` | `description: \`1 ${label} ≈ ${factor}${basis}\`` | description đơn vị |
| src/app/shared/components/dish-edit-modal/dish-edit-modal.component.ts | 626 | `≈` | `unit.is_approximate === 1 ? \`≈ ${label}\` : label` | label đơn vị |
| src/app/shared/components/dish-edit-modal/dish-edit-modal.component.ts | 637 | `≈` | `const prefix = unit.is_approximate === 1 ? '≈ ' : ''` | prefix label |
| src/app/core/stores/profile.store.ts | 9 | `—` | `Current user profile — null if onboarding not completed` | em-dash JSDoc |
| src/global.scss | 40 | `—` | `// Global ion-radio styling — match design system radio circle (DS §8.7)` | em-dash comment |

→ Tất cả 21 match trong source là **typographic chứ không phải emoji**. Đội code đã làm rất tốt: không hề có emoji pictograph rơi vào code Phase 1.

### 2.3. Tabs (đã dùng ionicons đúng chuẩn)

`src/app/tabs/tabs.page.ts` đã import và sử dụng `home-outline`, `calendar-outline`, `restaurant-outline`, `barbell-outline` — khớp comment "Icon placeholders" trong mockup. Không cần đổi.

```
ion-icon name="home-outline"
ion-icon name="calendar-outline"
ion-icon name="restaurant-outline"
ion-icon name="barbell-outline"
```

---

## 3. Kết quả emoji trong mockup Phase 1

Nguồn: 4 file mockup HTML.

### 3.1. Emoji có trong UI render (cần map sang ionicon khi triển khai)

| File mockup | Line | Emoji | Context (rút gọn) | Mục đích |
|-------------|------|-------|-------------------|----------|
| phase-1-ingredient-edit.html | 317 | 📏 | `<div class="unit-empty-icon">📏</div>` | Empty state — chưa có đơn vị nào |
| phase-1-ingredient-edit.html | 537 | ⚠️ | `<div class="unit-empty-icon">⚠️</div>` | Cảnh báo / lỗi state đơn vị |
| phase-1-dish-edit-ingredient-based.html | 385, 649 | 🥬 | `<div class="empty-ingredients-icon">🥬</div>` | Empty state — món chưa có nguyên liệu |
| phase-1-dish-list.html | 605 | 🔍 | `<div class="empty-icon">🔍</div>` | Empty state — search no result |
| phase-1-dish-list.html | 639 | 🍽️ | `<div class="empty-icon">🍽️</div>` | Empty state — chưa có món ăn nào |
| phase-1-dish-list.html | 768 | 📝 | `<span class="fab-menu-icon">📝</span>` | FAB menu — Tạo từ nguyên liệu |
| phase-1-dish-list.html | 775 | ✨ | `<span class="fab-menu-icon">✨</span>` | FAB menu — Tạo bằng AI |
| phase-1-ingredient-list.html | 633 | 🔍 | `<div class="empty-icon">🔍</div>` | Empty state — search no result |
| phase-1-ingredient-list.html | 665 | 🥗 | `<div class="empty-icon">🥗</div>` | Empty state — chưa có nguyên liệu |
| phase-1-dish-list.html (tabs) | 523–525, 572–574, 612–614, 646–648, 711–713, 784–786 | 🏠 📅 🍳 💪 | `<span class="tab-icon">…</span>` | Tab bar (placeholder) |
| phase-1-ingredient-list.html (tabs) | 526–529, 600–603, 640–643, 672–675, 742–745, 800–803, 894–897 | 🏠 📅 🍳 💪 | `<span class="tab-icon">…</span>` | Tab bar (placeholder) |

### 3.2. Emoji "chrome" mockup — KHÔNG cần migrate

Các emoji sau chỉ thuộc khung mockup HTML (status bar giả, theme switcher, design spec notes), không xuất hiện trong app thật:

| Emoji | Vị trí | Ghi chú |
|-------|--------|---------|
| ☀️ 🌙 | nút "Light"/"Dark" theme trong khung mockup | Chrome mockup, bỏ qua |
| 📶 🔋 | status bar giả (9:41) | Chrome mockup, bỏ qua |
| 📐 | tiêu đề "Design Spec Notes" | Tài liệu, bỏ qua |
| ⚠️ 🚫 👆 ♿ | nội dung "Design Spec Notes" tables | Tài liệu, bỏ qua |
| ✕ | search-clear-dot | ASCII multiplication-x, đã có ionicon `close-circle` thay thế chuẩn |
| ✓ | success-msg | đã có `checkmark` ionicon trong app |
| ⋮ | mô tả popover trigger | dùng `ellipsis-vertical` ionicon |

### 3.3. Lưu ý từ chính mockup

Mockup cuối mỗi file đã ghi chú rõ:
> "Icon placeholders: Tab bar emojis (🏠📅🍳💪) and empty state emojis (🍽️🔍 / 🥗🔍) are mockup placeholders. Implementation uses IonIcon from Ionicons."

→ Đây là quyết định thiết kế đã được ghi nhận, không phải lệch giữa code và mockup.

---

## 4. Đề xuất mapping emoji → ionicon

| Emoji | Vị trí (mockup) | Ionicon đề xuất | Lý do / ghi chú |
|-------|-----------------|-----------------|-----------------|
| 🏠 | Tab "Tổng quan" | `home-outline` (active: `home`) | Đã dùng đúng trong `tabs.page.ts` |
| 📅 | Tab "Lịch ăn" | `calendar-outline` (active: `calendar`) | Đã dùng đúng |
| 🍳 | Tab "Quản lý" | `restaurant-outline` (active: `restaurant`) | Đã dùng đúng |
| 💪 | Tab "Tập luyện" | `barbell-outline` (active: `barbell`) | Đã dùng đúng |
| 🔍 | Empty state — không tìm thấy kết quả search | `search-outline` | Có sẵn trong Ionicons; đặt size 64px theo DS §8.6 empty-state |
| 🥗 | Empty state ingredient list — chưa có nguyên liệu | `nutrition-outline` (ưu tiên) hoặc `leaf-outline` | `nutrition-outline` thiên về dinh dưỡng/thực phẩm, hợp ngữ cảnh ingredient |
| 🍽️ | Empty state dish list — chưa có món | `restaurant-outline` | Gợi ý món ăn / bữa ăn |
| 🥬 | Empty state ingredients trong dish-edit | `leaf-outline` hoặc `basket-outline` | `leaf-outline` ăn nhịp với "rau/nguyên liệu", `basket-outline` thiên về "giỏ nguyên liệu". Đề xuất chính: `leaf-outline` |
| 📏 | Empty state unit list (chưa có đơn vị) | `resize-outline` hoặc `swap-vertical-outline` | `resize-outline` mang nghĩa đo lường rõ nhất |
| ⚠️ | Cảnh báo unit invalid | `alert-circle-outline` (info) hoặc `warning-outline` | Theo DS §8 alert color, dùng `warning-outline` cho warning, `alert-circle` cho error |
| 📝 | FAB menu — "Tạo từ nguyên liệu" | `create-outline` hoặc `document-text-outline` | `create-outline` gần với "tạo/biên soạn" hơn |
| ✨ | FAB menu — "Tạo bằng AI" | `sparkles-outline` | Có sẵn trong Ionicons; hợp với AI/magic |
| ✕ | Search clear dot | `close-circle` (filled, dùng cho clear input) | Ionicons standard cho clear |
| ✓ | Success message | `checkmark-circle` (filled) | DS §8 success color |
| ⋮ | More menu trigger | `ellipsis-vertical` | Ionicons standard |
| ☀️ / 🌙 | Theme switcher (chrome mockup) | `sunny-outline` / `moon-outline` | Chỉ dùng nếu app có theme picker thật |
| 📶 / 🔋 | Status bar giả | (không cần) | Chỉ là chrome mockup |

---

## 5. Cảnh báo (CRITICAL)

Đối chiếu source code Phase 1 hiện tại:

- ✅ **`empty-state.component.ts`** — chưa kiểm tra trực tiếp emoji nhưng scan toàn file: KHÔNG có emoji. Cần kiểm tra component này có nhận icon name từ caller không (template `<empty-state [icon]="...">`) để đảm bảo các trang sử dụng đúng ionicon (`search-outline`, `nutrition-outline`, `restaurant-outline`, `leaf-outline`, `resize-outline`).
- ✅ **`nutrition-badge.component.ts`** — chỉ có ký tự `≈` thuần text (không phải emoji). KHÔNG cần thay.
- ✅ **FAB / dish-list page** — chưa được implement theo emoji; cần đảm bảo khi implement FAB menu sẽ map đúng `create-outline` / `sparkles-outline` thay vì copy 📝 ✨ từ mockup.
- ⚠️ **`ingredient-edit-modal` & `dish-edit-modal`** — sử dụng `≈` và `↔` trong text label. Đây là **ký hiệu toán học/typographic dùng làm text**, không phải icon. Nếu DS yêu cầu chuyển sang ionicon (`swap-horizontal` cho `↔`), cần thảo luận:
  - "Quy đổi g ↔ ml" có thể đổi thành `"Quy đổi g/ml"` + ionicon `swap-horizontal-outline` đứng trước title.
  - "≈" trong nutrition/đơn vị approximate: đề xuất giữ nguyên vì ngắn gọn và là chuẩn toán học; KHÔNG nên thay bằng ionicon (sẽ làm tăng noise visual trong list dày đặc).
- ⚠️ **Mockup status-bar và theme-switcher emoji** không nên rò rỉ vào code thật. Hiện tại chưa có. Lưu ý code review.

Không có vị trí nào trong source code Phase 1 đang **dùng emoji UI** — tức không có "leak" pictograph từ mockup vào code. Đây là tin tốt: việc migrate sang ionicon hiện chỉ cần **giữ nguyên** trạng thái sạch và đảm bảo các component empty-state, FAB, modal khi tiếp tục implement đều consume ionicon.

---

## 6. Case chưa rõ icon trong design-system, cần quyết định

| Trường hợp | Vấn đề | Đề xuất tạm |
|------------|--------|-------------|
| Empty state "chưa có đơn vị" (📏) | DS §8 chưa liệt kê icon "ruler/measure". `resize-outline` không hoàn hảo. | Chốt 1 trong: `resize-outline`, `swap-vertical-outline`, `options-outline`. **Recommended: `resize-outline`**. |
| Empty state ingredient list (🥗 vs 🥬) | Có 2 mockup dùng 2 emoji khác nhau cho "ingredient" (🥗 ở `ingredient-list`, 🥬 ở `dish-edit`). Có nên dùng cùng 1 ionicon? | **Recommended:** thống nhất `nutrition-outline` cho cả hai để đảm bảo consistency, hoặc tách biệt `nutrition-outline` (ingredient list) vs `leaf-outline` (dish-edit add ingredient — nhấn mạnh hành động "thêm vào món"). Cần thiết kế chốt. |
| FAB menu "Tạo bằng AI" (✨) | `sparkles-outline` có sẵn nhưng DS chưa định nghĩa "AI badge"; cần xác nhận màu accent (purple? gradient?). | Chốt: `sparkles-outline` + accent color riêng cho AI feature trong DS §8 (cần thêm token). |
| Mật độ "g ↔ ml" (↔ trong text) | Có nên thay text Unicode bằng ionicon inline `swap-horizontal-outline`? | Thảo luận với designer. Đề xuất: giữ Unicode để render text-only nhẹ; nếu cần icon, dùng `swap-horizontal-outline` đặt trước title `info-card-title`. |
| Approximate prefix "≈" | Đây là ký hiệu toán học chuẩn, dùng dày đặc trong nutrition/unit picker. | **Giữ nguyên Unicode `≈`** — không migrate sang ionicon. Ghi nhận trong DS §8 là exception. |

---

**Kết luận:** Source code Phase 1 hoàn toàn không chứa emoji pictograph. Toàn bộ emoji cần migrate đều nằm trong 4 mockup HTML và đã được tác giả mockup chú thích là "placeholders" cho IonIcon. Việc cần làm tiếp theo là (1) chốt mapping ở mục 4, (2) khi implement empty-state/FAB/modal trong Phase 1.x cần consume ionicon name đã chốt, (3) bổ sung token AI accent vào design-system §8 nếu áp dụng `sparkles-outline`.
