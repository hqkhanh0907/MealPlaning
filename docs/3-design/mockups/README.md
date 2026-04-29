# Mockups (Spec)

Các file HTML trong folder này là **mockup spec chính thức** cho từng màn hình của HealthMate AI. Implementation phải tham chiếu các file này khi build UI.

## Quy ước đặt tên

- `phase-<N>-<screen>.html` — mockup cho màn thuộc Phase N (theo `docs/5-development/development-plan.md`).
- Mỗi file render trên Chrome bằng cách mở trực tiếp; có toggle Light/Dark.

## Danh sách hiện có

| File | Phase | Trạng thái |
|------|-------|------------|
| `phase-0-onboarding.html` | 0 | Implemented (`src/app/features/onboarding/`) |
| `phase-1-dish-list.html` | 1 | Pending implementation |
| `phase-1-dish-edit-ingredient-based.html` | 1 | Pending implementation |
| `phase-1-ingredient-list.html` | 1 | Pending implementation |
| `phase-1-ingredient-edit.html` | 1 | Pending implementation |
| `phase-1-5-pantry-recipe-nutrition-wireflow.html` | 1.5 | Draft spec — Pantry + Ingredient Measurement + Recipe Nutrition |

## Spec phụ thuộc

- Token: `docs/3-design/design-system.md` v1.2 + `src/theme/variables.scss`.
- Schema: `docs/3-design/data-model.md`.
- Business rule: `docs/4-architecture/business-rules.md`.

## Lưu ý drift

Nếu mockup mâu thuẫn với schema/code thì **schema/code là source of truth**. Tạo task sync mockup, không sửa code theo mockup outdated.

Đã sync sau commit C-02 (loại bỏ Quick Add):
- `phase-1-dish-list.html` — đổi badge `Nhập nhanh`/`type-quick` → `AI tự điền`/`type-ai`, FAB menu option 2 đổi sang AI auto-fill.

## Folder liên quan

- `../explorations/` — exploration A/B/C (KHÔNG phải spec).
- `.audit/` — screenshot audit cũ, không phải spec.
