# Mockup Design Rules — HealthMate AI

> Áp dụng BẮT BUỘC khi tạo/sửa mockup HTML. Rút ra từ visual review session 2026-04-19.

---

## 1. Phone Frame — Nội dung phải vừa khung

- Phone frame: 375×812px (hoặc 390×844px). Content area ≈ 620px (trừ status bar + toolbar + sub-tabs + tab bar).
- **Tối đa 5–6 cards** trong 1 screen. Nếu cần thể hiện list dài → dùng screen riêng với annotation "danh sách cuộn".
- Item cuối cùng PHẢI hiển thị đầy đủ trong frame. Không được bị cắt/tràn.
- Nếu có FAB → item cuối cách đáy content ≥ 80px (FAB 56px + 16px gap + 8px safe).

## 2. ~~Swipe Actions~~ — DEPRECATED (Removed in Review 3)

> **KHÔNG dùng swipe actions.** Edit/Delete chỉ thông qua ⋮ more menu (xem Rule 22).
> Lý do: Swipe discoverability thấp, ⋮ menu rõ ràng hơn cho mọi user.
> Quyết định: Review 3 — user chọn bỏ swipe, chỉ giữ ⋮.

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
| Item không dùng | "Xóa [tên]?" — confirm dialog | [Giữ lại] (outline) + [Xóa {tên}] (--error) |

> **Wording rule:** KHÔNG dùng "Hủy" — mơ hồ. Dùng **"Giữ lại"** — mô tả rõ hậu quả. Cả 2 nút đều phải là verb + object.
> **Undo pattern (future):** Cho low-risk delete (item không dùng), cân nhắc xóa ngay + undo toast (5s) thay vì confirm dialog.

- Delete trigger: tap ⋮ menu → chọn [Xóa] → dialog xác nhận.
- KHÔNG dùng swipe để xóa (deprecated). KHÔNG cho phép xóa bằng long-press.
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
  - [ ] Background: `#121218` (page), `#1D1F26` (card), `#2C2E36` (dialog) — blue-tinted
  - [ ] Text contrast: primary text `#FFFFFF`, secondary `#E0E0E8`, tertiary `#A8AAB4`
  - [ ] Primary color shift: `#2196F3` → `#42A5F5`
  - [ ] CTA shift: `#FF9800` → `#FFB74D` (text dark `#121218`)
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
- Visual: pill track `#E2E4EC` (light) / `#333340` (dark), active pill trắng, text inactive `var(--text-tertiary)`.
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
□ 8. List cards có ⋮ more icon (không swipe)?
□ 9. Empty/no-result states có CTA không?
□ 10. Spec notes table đầy đủ tokens + rules?
□ 11. Sub-tabs dùng Segment Control trên NỀN TRẮNG (không toolbar)?
□ 12. Filter chips có gradient fade affordance?
□ 13. Toolbar có nút "Lưu" cho form dài?
□ 14. Radio selected có radio circle + checkmark ✓?
□ 15. Touch targets ≥ 44×44px?
□ 16. Calories nổi bật hơn P/C/F?
□ 17. Category chips có giảm saturation (pastel-like)?
□ 18. Placeholder số dùng contextual hint (không "0", không generic)?
□ 19. Delete blocked dialog có CTA actionable?
□ 20. Step nav CTA disabled khi chưa valid?
□ 21. Dark mode caption ≥ WCAG AA contrast?
□ 22. FAB menu có sublabel giải thích?
□ 23. Neutrals dùng blue-tinted (không pure gray)?
□ 24. Easing dùng specific curves (không generic ease)?
□ 25. Error messages có đủ 3 phần (gì/tại sao/sửa)?
□ 26. Cards phân 3 tầng shadow (flat/subtle/prominent)?
□ 27. Success feedback dùng verb+object cụ thể?
□ 28. Cancel/dialog buttons mô tả hậu quả rõ ràng?
```

## 21. Category Chips — Giảm Saturation

- Category chips (Thịt, Cá, Rau...) dùng màu **nhạt hơn 20-30%** so với base.
- Text giữ màu gốc, background dùng `opacity: 0.12` hoặc tint nhẹ.
- Light mode: bg rất nhạt (gần trắng), text/border màu gốc.
- Dark mode: bg rất tối (gần card bg), text màu gốc sáng hơn.
- Lý do: Nhiều chips saturated cùng lúc = nhiễu thị giác, cạnh tranh attention với content chính.

## 22. ⋮ More Menu — PRIMARY Edit/Delete Mechanism

- Mọi list card có edit/delete → PHẢI có **⋮ (more) icon** ở góc phải card.
- Size icon: 16-20px, nhưng hitbox 44×44px.
- Tap ⋮ → hiện **bottom sheet** hoặc **popup menu**: [Sửa] + [Xóa].
- Đây là cơ chế DUY NHẤT cho edit/delete (swipe đã deprecated — Rule 2).
- ⋮ phải luôn visible, không ẩn sau gesture.
- Interaction convention:
  - **Tap card** = mở chi tiết / navigate to edit page
  - **Tap ⋮** = menu actions (Sửa, Xóa)
  - ~~Swipe~~ = removed

## 23. Placeholder — Contextual Hint Examples

- Input số/text **KHÔNG dùng placeholder "0"** hoặc generic "Nhập số".
- Dùng **contextual examples** phù hợp domain:
  - Chiều cao → "Ví dụ: 165"
  - Cân nặng → "Ví dụ: 60"
  - Tên món → "Ví dụ: Cơm gà nướng"
  - Calories → "Ví dụ: 350"
  - Protein → "Ví dụ: 25"
- Placeholder color: `var(--text-tertiary)` — nhạt hơn rõ so với value thật.
- Lý do: "0" bị hiểu là giá trị thật. "Nhập số" quá trung tính. Ví dụ cụ thể giúp user hình dung giá trị hợp lý.

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

## 26. Ingredient Edit — User-Friendly Wording

- Section labels trong ingredient edit phải dùng **ngôn ngữ người dùng**, không technical:
  - ~~"Đơn vị chuẩn tính dinh dưỡng"~~ → **"Tính dinh dưỡng theo"**
  - ~~"Đơn vị nhập liệu"~~ → **"Khi thêm vào món, bạn muốn nhập bằng"**
  - ~~"Gram mỗi đơn vị"~~ → **"1 đơn vị nặng bao nhiêu gram?"**
- Thêm ví dụ inline giúp user hình dung:
  - "Ví dụ: 1 quả trứng = 50g"
  - "Ví dụ: 1 muỗng dầu = 15ml"
- Khi chọn "Đơn vị" → auto-scroll + auto-focus tới field phụ.
- Lý do: Cognitive load cao nhất trong app. Wording gần user giảm overwhelm.

## 27. FAB Menu — Sublabels Giải Thích

- Khi FAB mở speed-dial hoặc menu, mỗi option PHẢI có **sublabel** ngắn:
  - **Tạo từ nguyên liệu** — "Tính dinh dưỡng tự động, quản lý chi tiết"
  - **Nhập nhanh** — "Chỉ lưu macro/kcal, không có thành phần"
- Sublabel: `12px/400`, `var(--text-secondary)`, dưới title.
- Option chất lượng cao hơn ("Tạo từ nguyên liệu") đứng TRÊN và nổi bật hơn.
- Warning sublabel ở "Nhập nhanh" giúp user hiểu hệ quả TRƯỚC khi chọn.

## 28. Onboarding — Radio Circle + Checkmark

- Radio selection items trong onboarding PHẢI có **triple affordance**:
  1. **Radio circle** nhỏ (18px) ở bên trái card — unfilled khi chưa chọn, filled khi chọn
  2. **Background highlight** — `var(--primary)` tint nhẹ
  3. **Checkmark ✓** (22px) ở góc phải — hiện khi selected
- Lý do: Chỉ highlight + checkmark chưa đủ rõ affordance cho user mới / lớn tuổi.

## 29. Ingredient Picker — Recently Used

- Bottom sheet chọn nguyên liệu (trong dish-edit) PHẢI có section **"Gần đây"** ở đầu:
  - Hiện tối đa 5 nguyên liệu user đã dùng gần nhất
  - Compact layout: chỉ tên + kcal, không card đầy đủ
  - Phân tách với list chính bằng section header nhẹ
- Nếu chưa có history → ẩn section này (không hiện "Gần đây" trống).
- Lý do: User thường tạo món tương tự → giảm search lặp đi lặp lại.

## 30. Ingredient Add Flow — "Thêm tiếp" Mode

- Sau khi add 1 nguyên liệu vào món, bottom sheet **KHÔNG đóng**.
- Hiện brief confirmation ("✓ Đã thêm [tên]") rồi quay về picker state:
  - Search field reset
  - Recently used cập nhật
  - Button: [Thêm tiếp] (primary) + [Xong] (secondary/text)
- User tap [Xong] → sheet đóng, quay về form món ăn.
- Lý do: Với 5-8 nguyên liệu/món, đóng/mở sheet liên tục gây fatigue.

## 31. Dark Mode — Caption Contrast

- Caption/hint text (11-12px) trong dark mode PHẢI đạt WCAG AA contrast (≥4.5:1).
- Tertiary text dark mode: tối thiểu `#A8AAB4` trên `#1D1F26` background (ratio ≥4.5:1).
- KHÔNG dùng `#999` hoặc untinted gray cho text 11-12px trong dark mode (ratio chỉ ~3.5:1 — FAIL AA).
- Áp dụng: tab labels, result count, source badge, hint text, placeholder.

## 32. Neutral Colors — Blue Tint

- Mọi neutral (gray) phải có **blue tint nhẹ** cho cohesion với primary blue.
- KHÔNG dùng pure gray (#E8E8E8, #999, #666, #333).
- Dùng tinted values: `#E2E4EC` (border), `#5F6575` (tertiary text), `#333340` (dark border).
- Xem chi tiết: `design-system.md §2.4`.

## 33. Easing — Specific Curves Required

- KHÔNG dùng `ease` generic. Mỗi interaction type dùng curve phù hợp:
  - Micro (radio, toggle): `ease-out-quart` — `cubic-bezier(0.25, 1, 0.5, 1)`
  - Snappy (button): `ease-out-expo` — `cubic-bezier(0.16, 1, 0.3, 1)`
  - Sheet/drawer: `cubic-bezier(0.32, 0.72, 0, 1)`
- Exit animations = **75% of entrance** duration.

## 34. Error Messages — Specific + Vietnamese

- Error text PHẢI trả lời: Gì sai? Tại sao? Sửa thế nào?
- ~~"Giá trị không hợp lệ"~~ → "Chiều cao cần từ 100 đến 250 cm. Ví dụ: 165"
- ~~"Bạn nhập sai"~~ → "Cân nặng cần từ 30 đến 200 kg"
- KHÔNG đổ lỗi user.

## 35. Card Hierarchy — 3 Tiers

- **Flat** (no shadow/border): inline sections, metadata rows
- **Subtle** (`--shadow-sm`): list items, secondary cards
- **Prominent** (`--shadow-md`): dashboard hero, AI card, primary content
- Khi mọi card cùng shadow → flat hierarchy → phân tầng để tạo depth.

## 36. Success Feedback — Specific Verb+Object

- Sau save: button flash "✓ Đã lưu [tên]" (green, 1.5s) → navigate.
- Sau add: toast "✓ Đã thêm [tên]" (2-3s auto-dismiss).
- KHÔNG dùng generic "Thành công" hay "Đã lưu" mà không nêu object.

## 37. Cancel Buttons — "Giữ lại" thay "Hủy"

- Delete confirm: [Giữ lại] + [Xóa {tên}].
- KHÔNG dùng "Hủy" — mơ hồ, user không biết hủy gì.
- Mỗi button trong dialog phải mô tả rõ hậu quả khi bấm.
