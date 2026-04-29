# Mockups (Spec)

Các file HTML trong folder này là **mockup spec chính thức** cho từng màn hình của HealthMate AI. Implementation phải tham chiếu các file này khi build UI.

## Quy ước đặt tên

- `phase-<N>-<screen>.html` — mockup cho màn thuộc Phase N (theo `docs/5-development/development-plan.md`).
- Mỗi file render trên Chrome bằng cách mở trực tiếp; có toggle Light/Dark.

## Danh sách hiện có

| File | Phase | Trạng thái |
|------|-------|------------|
| `phase-0-onboarding.html` | 0 | Implemented (`src/app/features/onboarding/`) |

> Phase 1 mockups (dish list / dish edit / ingredient list / ingredient edit) **đã được implement xong** trong `src/app/features/management/` và mockup HTML đã được xoá khỏi repo (cleanup 2026-04-29). Source of truth cho Phase 1 UX hiện tại là code trong `src/` + `docs/3-design/design-system.md` + `docs/2-requirements/prd.md`.
>
> Phase 1.5A (Pantry + Ingredient Measurement) chưa implement, mockup chưa viết. Khi bắt đầu Phase 1.5A, tạo lại mockup theo schema canonical trong `docs/3-design/data-model.md` §4.0c + business rule trong `docs/4-architecture/business-rules.md` (RULE-MEASUREMENT, RULE-PANTRY-STOCK, RULE-CS-01/02).

## Spec phụ thuộc

- Token: `docs/3-design/design-system.md` + `src/theme/variables.scss`.
- Schema: `docs/3-design/data-model.md`.
- Business rule: `docs/4-architecture/business-rules.md`.

## Lưu ý drift

Nếu mockup mâu thuẫn với schema/code thì **schema/code là source of truth**. Tạo task sync mockup, không sửa code theo mockup outdated.

## Folder liên quan

- `../explorations/` — exploration A/B/C (KHÔNG phải spec).
