# Design Explorations

> ⚠️ **Folder này hiện trống.** Các file exploration cũ (color-palette, typography, spacing, 12 color directions, sage-suite) đã được xoá ở cleanup 2026-05-09 vì:
> - Design system đã chốt: Sage Wellness DNA (xem `docs/3-design/design-system.md` v1.2 + `src/theme/variables.scss`).
> - Material Blue exploration đã deprecate (Story 2.6 chốt light-only Sage).
> - Không có ref nào trong code/test reference các file này.
>
> Lịch sử exploration vẫn truy được qua git: `git log --diff-filter=D --name-only -- 'docs/3-design/explorations/**'`.

## Khi nào nên tạo file mới ở đây

Chỉ tạo file mới trong folder này khi:
- Đang khám phá **multiple alternatives** cho một quyết định design system chưa chốt (color, typography, spacing, motion, iconography).
- Cần so sánh A/B/C visual trước khi update `design-system.md`.

Sau khi chốt → update `design-system.md` + `variables.scss` + **xoá file exploration** để tránh drift.

## Không phải nơi để

- Mockup feature/screen — dùng `docs/3-design/mockups/phase-<N>/` (xem README ở đó).
- Spec UX flow — dùng `docs/3-design/specs/f<NN>-<feature>-spec.md` (BMAD output).
- Token chính thức — chỉ ở `design-system.md` + `variables.scss`.
