# Visual Review — Phase 1.5A Pantry/Measurement Wireflow

Mockup: `docs/3-design/mockups/phase-1-5-pantry-recipe-nutrition-wireflow.html`

## Result

Không có Chrome/Chromium/wkhtmltoimage/Playwright trong environment nên chưa tạo screenshot tự động. Đã thực hiện static visual contract checks.

## Static layout checks

- [x] phone frame is 390×844
- [x] phone frame has rounded device shape
- [x] phone frame clips internal screen
- [x] main content has 22px horizontal inset and bottom clearance
- [x] Floating Action Button (nút hành động nổi) has bottom clearance
- [x] tabbar has safe-area-like bottom padding
- [x] full-bleed/no-padding rule has inset recovery class
- [x] spec table explicitly documents full-bleed/content inset
- [x] six phone frames exist
- [x] six notch elements exist
- [x] bottom sheet uses horizontal content inset
- [x] phone content scrolls instead of overflowing
- [x] desktop grid supports two columns
- [x] mobile media query collapses grid

## Full-bleed / content inset review

- Mỗi phone screen dùng `.content { padding: 10px 22px 156px; }`, nên nội dung chính không sát mép.
- Nếu sau này cần full-bleed, mockup đã định nghĩa `.content.flush` và `.content.flush > .inset` để phục hồi inset cho text/control.
- Bottom sheet dùng `padding: 14px 22px 118px`, không sát mép trái/phải.
- Floating action button bottom `104px`, tabbar bottom padding `28px`, content bottom padding `156px` để tránh che card cuối.

## Remaining visual risk

- Chưa có screenshot pixel-level vì thiếu browser automation package trong environment.
- Cần browser/emulator visual pass trước khi implement code hoặc sau khi setup Playwright/Chromium.
