# Design Explorations

> ⚠️ **KHÔNG PHẢI SPEC.** Đây là tài liệu khám phá / so sánh phương án ở giai đoạn đầu.
> Spec chính thức của design system là:
> - `docs/3-design/design-system.md` (v1.2 — single source of truth)
> - `src/theme/variables.scss` (token đã code hoá)

## Mục đích

Folder này lưu các mockup HTML so sánh nhiều phương án (A/B/C) cho color, typography, spacing trước khi team chốt design system. Khi đọc, hãy hiểu đây là **lịch sử ra quyết định**, không phải hướng dẫn implement.

## Quyết định cuối (đã chốt trong design-system.md v1.2)

| Lĩnh vực | File exploration | Phương án đã chọn |
|----------|------------------|--------------------|
| Color | `color-palette.html` | Material Blue (#2196F3) primary, Orange (#FF9800) accent, neutral blue-tinted hue ~230, dark mode đầy đủ |
| Typography | `typography.html` | Roboto, scale Display 28 / Headline 22 / Title 18 / Subtitle 16 / Body 15 / Body-sm 13 / Label 12 / Caption 11; Vietnamese line-height ≥1.45 cho body; tabular-nums cho số liệu |
| Spacing | `spacing.html` | 4px grid: xs=4, sm=8, md=12, lg=16, xl=20, 2xl=24, 3xl=32 |

## Lưu ý cho người đọc

- Khi audit hoặc onboard, **đừng** kết luận "DS thiếu X" dựa trên các file này. Luôn kiểm tra `design-system.md` + `variables.scss` trước.
- Khi cần thay đổi token DS, cập nhật cả `design-system.md` lẫn `variables.scss`. Không update file trong folder này.
- Các file này được giữ lại để tham khảo lịch sử; có thể xoá ở phase tổng vệ sinh sau V1 nếu không còn giá trị tham chiếu.
