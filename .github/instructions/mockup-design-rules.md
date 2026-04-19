# Mockup Design Rules — HealthMate AI

> Áp dụng BẮT BUỘC khi tạo/sửa mockup HTML. Rút ra từ visual review session 2026-04-19.

---

## 1. Phone Frame — Nội dung phải vừa khung

- Phone frame: 375×812px (hoặc 390×844px). Content area ≈ 620px (trừ status bar + toolbar + sub-tabs + tab bar).
- **Tối đa 5–6 cards** trong 1 screen. Nếu cần thể hiện list dài → dùng screen riêng với annotation "danh sách cuộn".
- Item cuối cùng PHẢI hiển thị đầy đủ trong frame. Không được bị cắt/tràn.
- Nếu có FAB → item cuối cách đáy content ≥ 80px (FAB 56px + 16px gap + 8px safe).

## 2. Swipe Actions — ion-item-sliding

- Pattern chuẩn Ionic: vuốt trái card → card dịch sang trái, lộ action buttons phía sau.
- Đây là hành vi ĐÚNG: phần trái card bị ẩn khi dịch — giống real `ion-item-sliding`.
- Mockup tĩnh: dùng `overflow: hidden` + `transform: translateX(-Xpx)` trên card là OK.
  - Layer dưới (z-index: 1): action buttons `position: absolute; right: 0`
  - Layer trên (z-index: 2): card dùng `transform: translateX(-140px)` để lộ 2 buttons
- Action buttons: mỗi nút 70px wide, icon + label dọc. Sửa = `--primary` (#2196F3), Xóa = `--error` (#F44336).
- **Mỗi mockup list PHẢI có 1 screen thể hiện swipe state** nếu list có Edit/Delete.

## 3. FAB (Floating Action Button)

- Vị trí: `bottom: 72px; right: 16px` (trên tab bar).
- Size: 56px circle, `--cta` color (#FF9800 light / #FFB74D dark).
- Content area: `padding-bottom: 80px` khi có FAB — đảm bảo item cuối không bị che.
- Khi dialog/overlay hiện → FAB opacity 0.3.

## 4. Scroll-to-top Button

- Chỉ hiện khi user scroll >200px (trong real app). Mockup thể hiện ở screen có list dài.
- Vị trí: trên FAB — `bottom: 136px; right: 16px`.
- Size: 40px circle, icon ↑, border nhẹ, bg card color.

## 5. Empty & No-Result States — PHẢI có CTA

| State | Yêu cầu |
|-------|---------|
| **Empty list** (0 items) | Icon/emoji + title + description encouraging + CTA button nổi bật (--cta color) |
| **Search no results** | Icon 🔍 + "Không tìm thấy..." + **CTA contextual**: "Thêm '[keyword]'" hoặc "Thử từ khác" |
| **Filter no results** | "Không có nguyên liệu nào trong nhóm X" + gợi ý bỏ filter |

- KHÔNG BAO GIỜ chỉ hiện text trống mà không có action gợi ý.

## 6. Delete Rules — 2 luồng

| Trường hợp | Dialog | Actions |
|------------|--------|---------|
| Item đang được dùng (ingredient in dish, dish in meal plan) | "Không thể xóa" — info dialog | [Xem N món đang dùng] (--primary) — **actionable CTA** dẫn đến danh sách liên quan |
| Item không dùng | "Xóa [tên]?" — confirm dialog | [Hủy] + [Xóa] (--error) |

- Delete trigger: swipe left → nút [Xóa] đỏ.
- KHÔNG cho phép xóa bằng long-press hoặc menu ẩn.
- Dialog "không thể xóa" phải giúp user đi tiếp (xem món liên quan), KHÔNG chỉ acknowledge.

## 7. Annotations & Hints

- **Hint/tooltip giải thích interaction** (swipe, scroll, gesture) → đặt BÊN NGOÀI phone frame hoặc dưới dạng `screen-desc`.
- **KHÔNG chèn hint inline giữa list items** trong phone frame — real app không có element này.
- Ngoại lệ: onboarding tooltip có thể inline nếu app thật cũng có.

## 8. Visual Anchor — Cards nên có điểm nhấn trái

- List cards dài cần visual scanning aid: color dot, category icon, hoặc food emoji bên trái.
- Minimum: category chip đủ nhỏ + màu phân biệt.
- Lý tưởng: 32–40px circle/square icon trái + text phải.

## 9. Dark Mode — BẮT BUỘC test

- Mỗi mockup PHẢI có toggle Light/Dark và render ĐÚNG cả 2.
- Checklist dark mode:
  - [ ] Background: `#121212` (page), `#1E1E1E` (card), `#2E2E2E` (dialog)
  - [ ] Text contrast: primary text `#FFFFFF`, secondary `#E0E0E0`, tertiary `#999999`
  - [ ] Primary color shift: `#2196F3` → `#42A5F5`
  - [ ] CTA shift: `#FF9800` → `#FFB74D` (text dark `#121212`)
  - [ ] Error shift: `#F44336` → `#EF5350`
  - [ ] Cards: no shadow in dark (flat bg)
  - [ ] Overlay: `rgba(0,0,0,0.5)` vẫn đủ dim

## 10. Text Alignment — Form content luôn căn trái

- `.screen-wrapper { text-align: center }` dùng để center label/description BÊN NGOÀI phone frame.
- **Nhưng nó kế thừa (inherit) vào trong phone** → tất cả section titles, form labels, hints bị center.
- **Fix bắt buộc**: `.content { text-align: left; }` trong MỌI mockup.
- Quy tắc UX: Form labels, section titles, input text, hints → LUÔN căn trái. Không ngoại lệ.
- Chỉ center: empty state messages, dialog titles (vì dialog box nhỏ).

## 11. Screen Numbering & Comments

- Mỗi screen có HTML comment header: `<!-- SCREEN N: Title -->`
- Label visible: `<div class="screen-label">N. Tiêu đề</div>`
- Description: `<div class="screen-desc">Mô tả ngắn context/trigger</div>`
- Đánh số tuần tự 1→N, không bỏ số.

## 12. Spec Notes Table — BẮT BUỘC cuối mỗi mockup

Mỗi file mockup PHẢI kết thúc bằng bảng Design Spec Notes gồm:
- Tất cả design tokens đã dùng (color, radius, spacing, typography)
- Kích thước các element chính (phone frame, tab bar, FAB, cards)
- Business rules đặc biệt (delete rule, validation, interaction pattern)
- Ghi rõ giá trị Light / Dark cho mỗi token

## 13. Sub-tabs → Segment Control (BẮT BUỘC)

- **KHÔNG dùng underline tabs** cho sub-tabs trong page.
- Dùng **Segment Control** (ion-segment) — theo spec `phase-1-management.md`.
- **Vị trí: TRONG content area** (dưới toolbar), KHÔNG trên toolbar background.
- Visual: pill track `#E8E8E8` (light) / `#333` (dark), active pill trắng, text inactive `#666`.
- Lý do: Status bar + toolbar + segment cùng xanh = "nặng đầu". Segment trên nền page giảm visual weight.
- Xem chi tiết: `design-system.md §8g`.

## 14. Filter Chips — Gradient Fade Affordance

- Khi filter chips overflow (nhiều hơn viewport width):
  - Item cuối bị cắt 30-50% → gợi ý thị giác rằng có thể cuộn.
  - Thêm **gradient fade** mép phải trên `.filter-chips` wrapper.
  - CSS: `mask-image: linear-gradient(to right, black calc(100% - 24px), transparent)`.

## 15. Toolbar Save Button — Form dài

- Mọi form Add/Edit có nội dung dài hơn 1 viewport → PHẢI có nút **"Lưu"** ở góc phải toolbar.
- Nút text trắng, 16px/500, `margin-left: auto`.
- **2-context rule:**
  - **Step nav** (wizard, ≤2 actions): CTA disabled cho tới khi valid → enable khi đủ.
  - **Form submit** (≥3 fields): CTA **luôn active** → tap → auto-scroll to first error.
- Xem chi tiết: `design-system.md §8.8b`.

## 16. Radio Checkmark — Accessibility

- Radio items khi selected: background highlight + **checkmark ✓** (22px) ở góc phải.
- Chỉ highlight alone → kém A11y cho người thị lực kém.
- Checkmark color = `var(--ion-color-primary)`.

## 17. Calorie Visual Hierarchy

- Calories luôn lớn nhất: **24px / 700**.
- Macros (P/C/F) nhỏ hơn: **16px / 600**.
- Labels dưới số: 11-12px / 400.
- Xem chi tiết: `design-system.md §3.6`.

## 18. Bottom Sheet + Keyboard

- Khi search/input trong bottom sheet được focus → sheet PHẢI expand lên **90% viewport height**.
- Mockup thể hiện: 1 screen "sheet default" (50-60%) + 1 screen "sheet expanded with keyboard annotation".

## 19. Touch Targets — Search Clear Button

- Icon ✕ trong search bar: icon 20px nhưng **hitbox phải 44×44px**.
- Dùng padding 12px quanh icon hoặc `min-width: 44px; min-height: 44px`.
- Áp dụng cho MỌI icon button nhỏ (close, clear, remove).

## 20. Visual Review Checklist — SAU KHI tạo mockup

Trước khi coi mockup là xong, PHẢI mở trên browser và kiểm tra:

```
□ 1. Mở file trong browser thật (không chỉ đọc code)
□ 2. Chụp screenshot Light mode full page
□ 3. Chuyển Dark mode → chụp screenshot
□ 4. Kiểm tra từng screen: text có bị cắt/tràn không?
□ 5. Cards có vừa trong phone frame không? (item cuối hiện đầy đủ)
□ 6. FAB có che nội dung không?
□ 7. Dialog overlay có dim đúng background không?
□ 8. Swipe state có hiện đầy đủ text + actions không?
□ 9. Empty/no-result states có CTA không?
□ 10. Spec notes table đầy đủ tokens + rules?
□ 11. Sub-tabs dùng Segment Control trên NỀN TRẮNG (không toolbar)?
□ 12. Filter chips có gradient fade affordance?
□ 13. Toolbar có nút "Lưu" cho form dài?
□ 14. Radio selected có checkmark ✓?
□ 15. Touch targets ≥ 44×44px?
□ 16. Calories nổi bật hơn P/C/F?
□ 17. Category chips có giảm saturation (pastel-like)?
□ 18. List cards có ⋮ more icon affordance?
□ 19. Placeholder số dùng hint text (không "0")?
□ 20. Delete blocked dialog có CTA actionable?
□ 21. Step nav CTA disabled khi chưa valid?
```

## 21. Category Chips — Giảm Saturation

- Category chips (Thịt, Cá, Rau...) dùng màu **nhạt hơn 20-30%** so với base.
- Text giữ màu gốc, background dùng `opacity: 0.12` hoặc tint nhẹ.
- Light mode: bg rất nhạt (gần trắng), text/border màu gốc.
- Dark mode: bg rất tối (gần card bg), text màu gốc sáng hơn.
- Lý do: Nhiều chips saturated cùng lúc = nhiễu thị giác, cạnh tranh attention với content chính.

## 22. Affordance Ngoài Swipe — ⋮ More Icon

- Mọi list card có swipe actions → PHẢI thêm **⋮ (more) icon** ở góc phải card.
- Size icon: 16-20px, nhưng hitbox 44×44px.
- Tap ⋮ → hiện bottom sheet hoặc popup: [Sửa] + [Xóa].
- Swipe vẫn giữ nguyên — ⋮ là backup affordance cho user không biết swipe.
- Lý do: Swipe discoverable thấp (cần hint hoặc trải nghiệm trước).

## 23. Placeholder Số — Hint Text thay "0"

- Input số (calories, protein, gram...) **KHÔNG dùng placeholder "0"**.
- Dùng hint text: "Nhập số" hoặc chỉ hiện suffix khi có value.
- Placeholder color: `var(--text-tertiary)` — nhạt hơn rõ so với value thật.
- Lý do: "0" dễ bị hiểu là giá trị thật → user bỏ qua → data sai.

## 24. Quick-Add Macro Fields — Dot thay Border

- Macro fields (Protein, Carbs, Fat) trong quick-add:
  - **KHÔNG dùng left border màu đầy đủ** (quá trang trí cho data-entry form).
  - Dùng **dot nhỏ 8px** hoặc **icon nhỏ** bên trái field label.
  - Hoặc chỉ label text dùng semantic color, field border neutral.
- Lý do: Giảm màu trên form → tăng clarity, focus vào data input.

## 25. Dish Card Hierarchy — Calories Hero

- Dish card trong list PHẢI có hierarchy rõ:
  - **Dòng 1:** Tên món + loại badge — `16px/600`
  - **Dòng 2:** Calories = **hero stat** — `20-24px/700`, color `var(--text-primary)`
  - **Dòng 3:** P/C/F = secondary — `13-14px/400`, color `var(--text-secondary)`
  - **Dòng 4:** Servings/source = tertiary — `12px/400`, color `var(--text-tertiary)`
- Calories KHÔNG được cùng cấp visual với P/C/F.
- Xem thêm: `design-system.md §3.6`.
