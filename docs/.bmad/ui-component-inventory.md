# UI Component Inventory — HealthMate AI

> **⚠️ STALE NOTICE (2026-05-08):** This is a BMAD brownfield snapshot from 2026-05-07. Sections referencing `dark mode`, `_dark-mode.scss`, `prefers-color-scheme`, or theme switching are **out of date** as of v0.2.1 (Story 2.6 removed dark mode). Treat dark-mode references as historical context.

**Date:** 2026-05-06
**Source-of-truth design:** `docs/3-design/design-system.md` (tokens v2025) + `src/theme/`. File này là tóm tắt BMAD-friendly.

## 1. Design System

- **Tokens:** `src/theme/variables.scss` — color, spacing, typography, radius, shadow tokens.
- **Dark mode:** `src/theme/_dark-mode.scss` — `@media (prefers-color-scheme: dark)`.
- **Theme service:** `core/services/theme/` — runtime light/dark/system toggle.
- **Style 2025 naming convention:** enforced bởi `check:style-2025` guard.
- **5 CI guards** đảm bảo design system không bị drift.

## 2. Shared Components (10) — `src/app/shared/components/`

| Component | Vai trò | Khi dùng |
|---|---|---|
| `ai-lookup-sheet` | Bottom-sheet chứa AI lookup UI (search ingredient/dish bằng Gemini) | Khi user muốn AI gợi ý nutrition info |
| `ai-offline-banner` | Banner trên cùng khi offline | Tự động hiện khi `NetworkStore.online() === false` và page có AI feature |
| `bottom-sheet-picker` | Generic bottom-sheet picker (chọn item từ list) | Picker pattern thay thế `ion-picker` |
| `confirm-dialog` | Modal xác nhận yes/no | Trước action destructive (delete dish, reset profile, ...) |
| `dish-autofill-sheet` | Sheet dùng AI để autofill thông tin món ăn | Page `dish-edit` khi user nhấn "AI điền giúp" |
| `dishes-using-sheet` | Sheet liệt kê dish nào đang dùng ingredient này | Trước khi delete ingredient |
| `empty-state` | Placeholder khi list rỗng | Mọi list cần fallback (dish list, ingredient list, day plan, ...) |
| `nutrition-badge` | Badge hiển thị calo/macro compact | Card hiển thị dish/ingredient |
| `search-toolbar` | Toolbar có search input + filter | Tab management, calendar |
| `segmented-control` | Custom segment control wrap `ion-segment` | Filter type, view mode toggle |

## 3. Form Infrastructure — `src/app/shared/forms/`

```
shared/forms/
├── form-field/        # Floating-label wrapper component (canonical)
│   ├── form-field.component.{ts,html,scss}
│   └── form-field.component.spec.ts
├── mappers/           # Form ↔ domain mappers (parse string → number, normalize)
└── schemas/           # Zod runtime validation schemas
```

- **`form-field`:** wrap `ion-input/ion-textarea` với floating label, error state, hint. **Bắt buộc dùng** — `check:form-pattern` guard fail nếu component dùng `<ion-input>` trực tiếp ngoài pattern này.
- **`mappers`:** chuyển string từ form → number/boolean/Date cho domain model. Tránh logic này nằm rải rác trong component.
- **`schemas`:** Zod v4 schemas — **chú ý** `.uuid()` strict v1-8.

## 4. Theme Patterns — `src/theme/`

| File | Pattern dùng cho |
|---|---|
| `variables.scss` | Token gốc — color, spacing, font size, radius, shadow, motion |
| `_dark-mode.scss` | Dark mode overrides |
| `button-row.scss` | Row of action buttons (consistent gap, alignment) |
| `form-field.scss` | Floating-label form-field styling |
| `form-modal.scss` | Modal pattern dùng cho edit pages |
| `header-elevation.scss` | Header shadow on scroll |
| `list-card.scss` | Card-based list pattern (dish list, ingredient list) |
| `segment-control.scss` | Custom segment control |

## 5. Feature Pages (12 components/pages, 6 areas)

### `features/dashboard/` (Tab 1)
Tổng quan calo/macro hôm nay, weight chart, streak.

### `features/calendar/` (Tab 2)
Day-plan grid, meal slots (breakfast/lunch/dinner/snack), drag-drop dish vào slot.

### `features/management/` (Tab 3)
Quản lý ingredient + dish.
- `dish-edit/` — Page edit dish (form + AI autofill + nutrition hero)
- `ingredient-edit/` — Page edit ingredient

### `features/fitness/` (Tab 4)
Training plan, workout session, exercise log.

### `features/settings/` (push page, không phải tab)
- `activity-edit/` — Edit activity factor
- `body-edit/` — Edit height/weight/age/gender
- `goals-edit/` — Edit calorie/macro targets

### `features/onboarding/`
First-run wizard 5-7 step: welcome → body → goals → activity → review → done.

## 6. Naming Conventions (5 CI guards detail)

### `check:macro-naming` — BEM 2-level
✅ OK: `.dish-card`, `.dish-card__title`, `.dish-card__title--muted`
❌ KO: `.dish-card__header__title` (3 level)

### `check:style-2025` — không còn naming Style 2016
✅ OK: `.page-content`, `.section`, `.field`
❌ KO: `__container`, `__page-content` (legacy)

### `check:design-tokens` — color/bg/font-size phải dùng token
✅ OK: `color: var(--color-text-primary)`, `font-size: var(--font-size-body)`
❌ KO: `color: #fff`, `background: #4CAF50`, `font-size: 14px`

### `check:form-pattern` — input phải qua `form-field`
✅ OK: `<app-form-field [control]="..."><ion-input slot="input" /></app-form-field>`
❌ KO: `<ion-input formControlName="..." />` (raw)

### `check:pc1` — external template + style
✅ OK: `@Component({ templateUrl: './x.html', styleUrl: './x.scss' })`
❌ KO: `@Component({ template: '...', styles: ['...'] })`

## 7. Mockups Reference

`docs/3-design/mockups/` chứa HTML mockup gốc cho các phase.
Mockup mới gần nhất:
- `phase-1/14-recipe-edit.html` — recipe edit hero refactor
- `settings-redesign.html` — settings v3 dark-mode mockup

> ⚠️ **Mockup là HTML thuần, KHÔNG phải code chạy.** Khi implement, dùng mockup làm reference visual + đối chiếu design tokens.

## 8. Accessibility & i18n

- **Ngôn ngữ:** Tiếng Việt only — tất cả label, error message, prompt AI.
- **Xưng hô:** "bạn" (KHÔNG dùng `display_name`).
- **Touch target:** tối thiểu 44px (Ionic default OK).
- **Dark mode:** auto theo system + override trong settings.
- **Currency/Number:** chưa cần — app không có giao dịch tài chính.
